const crypto = require('crypto');

const AIRWALLEX_BASE_URL = (process.env.AIRWALLEX_BASE_URL || 'https://api.airwallex.com').replace(/\/$/, '');
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');

let airwallexToken = null;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function supabaseRequest(path, options = {}) {
  const url = `${requireEnv('SUPABASE_URL').replace(/\/$/, '')}/rest/v1/${path.replace(/^\//, '')}`;
  return jsonRequest(url, {
    ...options,
    headers: {
      apikey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      Authorization: `Bearer ${requireEnv('SUPABASE_SERVICE_ROLE_KEY')}`,
      Prefer: 'return=representation',
      ...(options.headers || {})
    }
  });
}

async function getAirwallexToken() {
  if (airwallexToken && airwallexToken.expiresAt > Date.now() + 30_000) return airwallexToken.value;
  const headers = {
    'x-client-id': requireEnv('AIRWALLEX_CLIENT_ID'),
    'x-api-key': requireEnv('AIRWALLEX_API_KEY')
  };
  if (process.env.AIRWALLEX_LOGIN_AS) headers['x-login-as'] = process.env.AIRWALLEX_LOGIN_AS;
  const result = await jsonRequest(`${AIRWALLEX_BASE_URL}/api/v1/authentication/login`, { method: 'POST', headers });
  airwallexToken = { value: result.token, expiresAt: new Date(result.expires_at).getTime() };
  return airwallexToken.value;
}

async function airwallexRequest(path, options = {}) {
  const token = await getAirwallexToken();
  return jsonRequest(`${AIRWALLEX_BASE_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) }
  });
}

async function findJapanSku(skuId) {
  const raw = String(skuId || '').trim();
  if (!raw) return null;

  // Accept both the catalog variant (eSIM-KR2G-01) and the database SKU (KR2G-01).
  const candidates = [...new Set([
    raw,
    raw.replace(/^eSIM-/i, ''),
    raw.startsWith('eSIM-') ? raw : `eSIM-${raw}`
  ])];

  for (const candidate of candidates) {
    const rows = await supabaseRequest(
      `skus?sku_id=eq.${encodeURIComponent(candidate)}&select=*`
    );
    const product = rows[0];
        const active = product && (product.active === true || String(product.active).toLowerCase() === 'true');
        const countryCode = String(product && product.country_code || '').trim().toUpperCase();
        const currency = String(product && product.currency || '').trim().toUpperCase();
        if (product && active && countryCode === 'KR' && currency === 'JPY') {
      return product;
    }
  }
  return null;
}

async function listJapanSkus() {
  return supabaseRequest('skus?active=eq.true&country_code=eq.KR&currency=eq.JPY&order=sort_order.asc&select=*');
}

async function createJapanOrder({ skuId, quantity, customerName, customerEmail, customerPhone, couponCode }) {
  const product = await findJapanSku(skuId);
  if (!product) {
    const error = new Error('Unknown or inactive Japan SKU');
    error.status = 400;
    throw error;
  }
  const safeQuantity = Math.min(Math.max(Number(quantity) || 1, 1), 5);
  const subtotal = product.price_amount * safeQuantity;
  const orderNo = `JP-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const rows = await supabaseRequest('orders', {
    method: 'POST',
    body: JSON.stringify({
      order_no: orderNo,
      sku_id: product.sku_id,
      customer_name: customerName || null,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      country_code: 'KR',
      amount: subtotal,
      subtotal_amount: subtotal,
      discount_amount: 0,
      coupon_code: couponCode || null,
      currency: 'JPY',
      order_status: 'pending',
      payment_status: 'unpaid',
      esim_status: 'not_sent',
      payment_provider: 'airwallex'
    })
  });
  return { order: rows[0], product, quantity: safeQuantity, subtotal };
}

async function createJapanPaymentLink({ order, product, quantity, customerEmail }) {
  const successUrl = requireEnv('PUBLIC_JP_SUCCESS_URL');
  const cancelUrl = requireEnv('PUBLIC_JP_CANCEL_URL');
  const result = await airwallexRequest('/api/v1/pa/payment_links/create', {
    method: 'POST',
    body: JSON.stringify({
      reusable: false,
      title: `EasyGoSim 韓国eSIM｜${product.display_name}`,
      description: '日本向け JPY 決済。Visa / Mastercard / JCB 対応。',
      amount: order.amount,
      currency: 'JPY',
      reference: order.order_no,
      metadata: { order_no: order.order_no, market: 'JP', locale: 'ja-JP', sku_id: product.sku_id },
      collectable_shopper_info: { message: true, phone_number: false, reference: false }
    })
  });
  const paymentUrl = result.url;
  if (!paymentUrl) throw new Error('Airwallex did not return a payment URL');
  await supabaseRequest(`orders?order_no=eq.${encodeURIComponent(order.order_no)}`, {
    method: 'PATCH',
    body: JSON.stringify({ payment_url: paymentUrl, payment_reference: result.id || order.order_no, updated_at: new Date().toISOString() })
  });
  return { paymentUrl, orderNo: order.order_no, successUrl, cancelUrl, customerEmail: customerEmail || null };
}

function verifyAirwallexSignature(rawBody, timestamp, signature) {
  const secret = process.env.AIRWALLEX_WEBHOOK_SECRET;
  if (!secret || !timestamp || !signature) return false;
  const tolerance = Number(process.env.JP_WEBHOOK_TOLERANCE_MS || 300000);
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() - timestampNumber) > tolerance) return false;
  const expected = crypto.createHmac('sha256', secret).update(String(timestamp) + rawBody).digest('hex');
  const received = Buffer.from(String(signature), 'utf8');
  const calculated = Buffer.from(expected, 'utf8');
  return received.length === calculated.length && crypto.timingSafeEqual(received, calculated);
}

async function applyPaymentWebhook(event) {
  const eventName = String(event.name || '').toLowerCase();
  const data = event.data || {};
  const candidate = data.payment_link || data.payment_intent || data;
  const metadata = candidate.metadata || data.metadata || {};
  const orderNo = metadata.order_no || candidate.reference || data.reference;
  if (!orderNo || metadata.market !== 'JP') return { ignored: true };
  const paid = /(succeeded|paid|settled|authorized)/.test(eventName);
  const failed = /(failed|cancelled|canceled|declined|expired)/.test(eventName);
  if (!paid && !failed) return { ignored: true };
  const patch = {
    payment_status: paid ? 'paid' : 'failed',
    order_status: paid ? 'paid' : 'payment_failed',
    webhook_payload: event,
    failure_reason: failed ? (candidate.failure_reason || eventName) : null,
    updated_at: new Date().toISOString()
  };
  if (paid) patch.paid_at = new Date().toISOString();
  await supabaseRequest(`orders?order_no=eq.${encodeURIComponent(orderNo)}&currency=eq.JPY&country_code=eq.KR`, { method: 'PATCH', body: JSON.stringify(patch) });
  return { orderNo, status: patch.payment_status };
}

module.exports = { createJapanOrder, createJapanPaymentLink, verifyAirwallexSignature, applyPaymentWebhook, listJapanSkus };
