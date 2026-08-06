# Japan checkout integration

The Japan route uses the same Supabase project and the existing Rainway checkout flow as the Hong Kong route, but it is isolated by `country_code=KR`, `currency=JPY`, and `market=JP` metadata.

## Vercel environment variables

Set these as server-side Vercel Environment Variables. Never put the secret values in HTML, JavaScript, GitHub, or chat.

```text
AIRWALLEX_BASE_URL=https://api.airwallex.com
AIRWALLEX_CLIENT_ID=...
AIRWALLEX_API_KEY=...
AIRWALLEX_WEBHOOK_SECRET=...
AIRWALLEX_LOGIN_AS=...
SUPABASE_URL=https://yddbkcyhovkpxvvolpxz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
PUBLIC_JP_SUCCESS_URL=https://esim.easygosim.com/jpesim-thank-you.html
PUBLIC_JP_CANCEL_URL=https://esim.easygosim.com/korea-esim.html
JP_WEBHOOK_TOLERANCE_MS=300000
```

## Rainway checkout

The browser must redirect to Rainway, not directly to Airwallex. The Rainway adapter is intentionally blocked until the real Rainway checkout endpoint and authentication contract are supplied.

## Airwallex webhook

Configure the Japan/shared webhook endpoint as:

```text
https://esim.easygosim.com/api/airwallex/webhook
```

Use the matching webhook secret for that endpoint only if Rainway forwards Airwallex events to this endpoint. The handler verifies `x-timestamp` + raw body with HMAC-SHA256, then only updates JPY/Korea orders carrying `market=JP` metadata.

## Remaining prerequisite

The Korea rows in Supabase still need the real `esim_product_id` values before automatic eSIM provisioning can be enabled. The payment webhook currently records payment status safely and leaves `esim_status=not_sent` until the provider API contract is supplied.
