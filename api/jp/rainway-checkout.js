module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(501).json({
    error: 'Rainway checkout is not configured yet.',
    code: 'RAINWAY_CONFIG_REQUIRED'
  });
};
