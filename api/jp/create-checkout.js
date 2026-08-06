const { createJapanOrder, createJapanPaymentLink } = require('../_lib/jp-backend');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = req.body || {};
    if (!body.sku) return res.status(400).json({ error: 'sku is required' });
    const created = await createJapanOrder(body);
    const checkout = await createJapanPaymentLink({ ...created, customerEmail: body.customerEmail });
    return res.status(201).json(checkout);
  } catch (error) {
    console.error('JP checkout error', error);
    return res.status(error.status || 500).json({ error: error.message || 'Unable to create checkout' });
  }
};
