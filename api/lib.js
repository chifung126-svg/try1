const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

export function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${env("SUPABASE_URL")}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: env("SUPABASE_SERVICE_ROLE_KEY"),
      authorization: `Bearer ${env("SUPABASE_SERVICE_ROLE_KEY")}`,
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || data?.hint || `Supabase request failed (${response.status})`);
  return data;
}

export async function airwallex(path, options = {}) {
  const base = process.env.AIRWALLEX_API_BASE_URL || "https://api.airwallex.com";
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || data?.error?.message || `Airwallex request failed (${response.status})`);
  return data;
}

export async function airwallexToken() {
  const response = await fetch(`${process.env.AIRWALLEX_API_BASE_URL || "https://api.airwallex.com"}/api/v1/authentication/login`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-client-id": env("AIRWALLEX_CLIENT_ID"), "x-api-key": env("AIRWALLEX_API_KEY") }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.token) throw new Error("Airwallex authentication failed");
  return data.token;
}

export const plans = {
  7: { data: "40GB", amount: 1980 },
  15: { data: "80GB", amount: 2640 },
  30: { data: "120GB", amount: 3840 }
};
