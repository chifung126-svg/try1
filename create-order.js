export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const upstream = await fetch('https://easygosim-japan-production.up.railway.app/api/create-order', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof request.body === 'string' ? request.body : JSON.stringify(request.body || {})
    });
    const body = await upstream.text();
    response.status(upstream.status).setHeader('content-type', 'application/json; charset=utf-8');
    return response.send(body);
  } catch (error) {
    console.error('Japan payment proxy failed', error);
    return response.status(502).json({ ok: false, error: 'Unable to create payment' });
  }
}
