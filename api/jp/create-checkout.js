const RAILWAY_ORDERS_URL = (process.env.RAILWAY_ORDERS_URL || 'https://checkout.easygosim.us/api/orders').replace(/\/$/, '');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const upstream = await fetch(RAILWAY_ORDERS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        market: 'JP',
        country_code: body.countryCode || 'KR',
        sku_id: body.skuId || body.sku,
        quantity: body.quantity,
        customer_name: body.customerName,
        customer_email: body.customerEmail,
        coupon_code: body.couponCode
      })
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok || !result?.ok || !result?.order?.payment_url) {
      const message = result?.details?.message || result?.error || 'Unable to create checkout';
      const error = new Error(message);
      error.status = upstream.status || 502;
      throw error;
    }
    return res.status(201).json({
      paymentUrl: result.order.payment_url,
      orderNo: result.order.order_no,
      successUrl: result.order.thank_you_url || null,
      customerEmail: body.customerEmail || null
    });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Unable to create checkout' });
  }
};
