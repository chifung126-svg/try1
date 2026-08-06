module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(410).json({ error: 'Direct Airwallex checkout is disabled. Japan checkout is managed by Rainway.' });
};
