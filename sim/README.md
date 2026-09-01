# EasyGoSIM self-checkout

This folder is the self-checkout storefront intended for `https://easygosim.com/sim/`. It calls the Railway API, which calculates prices server-side, stores orders in PostgreSQL, creates an Airwallex PaymentIntent, and redirects the buyer to Airwallex Hosted Payment Page.

Before deployment, replace `https://REPLACE_WITH_RAILWAY_API_DOMAIN` in `index.html` and `thank-you/index.html` with the Railway public URL or `https://api.easygosim.com`.

Required Railway variables: `DATABASE_URL` (reference the Postgres service), `PUBLIC_SITE_URL=https://easygosim.com`, `ALLOWED_ORIGIN=https://easygosim.com`, `AIRWALLEX_ENV=prod`, `AIRWALLEX_CLIENT_ID`, `AIRWALLEX_API_KEY`, and `AIRWALLEX_WEBHOOK_SECRET`.

In Airwallex, add a webhook subscription to `https://api.easygosim.com/api/webhooks/airwallex` for `payment_intent.succeeded`. The API verifies the Airwallex HMAC signature using `x-timestamp` + raw body, and marks the order paid only after that verified event.
