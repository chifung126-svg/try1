const { createJapanOrder, createJapanPaymentLink } = require('../_lib/jp-backend');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const created = await createJapanOrder({
      skuId: body.skuId || body.sku,
      quantity: body.quantity,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      couponCode: body.couponCode
    });
    const checkout = await createJapanPaymentLink({ ...created, customerEmail: body.customerEmail });
    return res.status(201).json(checkout);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Unable to create checkout' });
  }
};
