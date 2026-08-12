import crypto from "node:crypto";
import { airwallex, airwallexToken, env, json, plans, supabaseRequest } from "./lib.js";

function orderNo() {
  return `EGS-JP-MY-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export default async function handler(request) {
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const departureDate = String(body.departure_date || "").trim();
    const days = Number(body.days);
    const name = String(body.name || "").trim() || null;
    const plan = plans[days];
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return json({ ok: false, error: "Invalid email" }, 400);
    if (!plan || !/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) return json({ ok: false, error: "Invalid Malaysia plan or departure date" }, 400);

    const no = orderNo();
    const token = await airwallexToken();
    const checkout = await airwallex("/api/v1/pa/payment_links/create", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({
        amount: plan.amount,
        currency: "JPY",
        title: `Malaysia eSIM ${days} days - ${no}`,
        description: `${plan.data} · 超高速5G · 現地電話番号付き · 手動発行`,
        reference: no,
        reusable: false,
        collectable_shopper_info: { billing_address: false, message: false, phone_number: false, reference: false, shipping_address: false },
        metadata: { order_no: no, product_key: "malaysia_manual", days: String(days), departure_date: departureDate, customer_email: email }
      })
    });
    await supabaseRequest("jp_manual_orders", {
      method: "POST",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({ order_no: no, product_key: "malaysia_manual", plan_days: days, data_allowance: plan.data, amount: plan.amount, currency: "JPY", customer_email: email || null, customer_name: name, departure_date: departureDate, payment_status: "pending", fulfillment_status: "awaiting_payment", airwallex_payment_link_id: checkout.id, airwallex_payment_url: checkout.url })
    });
    return json({ ok: true, order_no: no, payment_url: checkout.url });
  } catch (error) {
    console.error("JP manual order failed", error);
    return json({ ok: false, error: "Unable to create payment" }, 500);
  }
}
