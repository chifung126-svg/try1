const { verifyAirwallexSignature, applyPaymentWebhook } = require('../_lib/jp-backend');

module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const rawBody = await readRawBody(req);
    if (!verifyAirwallexSignature(rawBody, req.headers['x-timestamp'], req.headers['x-signature'])) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    const result = await applyPaymentWebhook(JSON.parse(rawBody));
    return res.status(200).json({ received: true, ...result });
  } catch (error) {
    console.error('Airwallex webhook error', error);
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }
};
