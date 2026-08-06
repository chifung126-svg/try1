const { listJapanSkus } = require('../_lib/jp-backend');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const products = await listJapanSkus();
    return res.status(200).json({ market: 'JP', locale: 'ja-JP', currency: 'JPY', paymentMethodTypes: ['card'], products });
  } catch (error) {
    console.error('JP catalog error', error);
    return res.status(500).json({ error: 'Unable to load Japan catalog' });
  }
};
