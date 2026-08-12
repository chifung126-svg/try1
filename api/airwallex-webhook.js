import crypto from "node:crypto";
import { env, json, supabaseRequest } from "./lib.js";

function validSignature(raw, request) {
  const signature = request.headers.get("x-signature");
  const timestamp = request.headers.get("x-timestamp");
  if (!signature || !timestamp) return false;
  const expected = crypto.createHmac("sha256", env("AIRWALLEX_WEBHOOK_SECRET")).update(`${timestamp}${raw}`).digest("hex");
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export default async function handler(request) {
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);
  const raw = await request.text();
  if (!validSignature(raw, request)) return json({ ok: false, error: "Invalid signature" }, 401);
  try {
    const payload = JSON.parse(raw);
    const eventName = payload?.name || payload?.type || "";
    if (!eventName.includes("payment_link.paid") && !eventName.includes("payment_intent.succeeded")) return json({ received: true });
    const object = payload?.data?.object || payload?.data || {};
    const metadata = object.metadata || {};
    if (metadata.product_key !== "malaysia_manual") return json({ received: true, ignored: "Not malaysia_manual" });
    const orderNo = metadata.order_no || object.reference || object.merchant_order_id;
    if (!orderNo) return json({ received: true, ignored: "Missing order number" });
    await supabaseRequest(`jp_manual_orders?order_no=eq.${encodeURIComponent(orderNo)}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ payment_status: "paid", fulfillment_status: "paid_manual_fulfillment", airwallex_event_id: payload.id || object.id || null, payment_payload: payload, paid_at: new Date().toISOString() }) });
    return json({ received: true, manual_fulfillment: true });
  } catch (error) {
    console.error("JP Airwallex webhook failed", error);
    return json({ ok: false, error: "Webhook processing failed" }, 500);
  }
}
