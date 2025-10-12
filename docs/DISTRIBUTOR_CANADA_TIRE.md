# Canada Tire distributor integration

This document explains how the Supabase Edge Function at `supabase/functions/distributor/index.ts` proxies the Canada Tire
Customer API with hardened security defaults. Follow these steps before deploying the function.

## 1. Required secrets

Store the following secrets with `supabase secrets set` (or your hosting provider’s secret manager). Never commit them to the
repo or expose them to the frontend. For local testing, copy `supabase/.env.example` to `supabase/.env.local`, fill in your
credentials, and pass the file to `supabase functions serve`.

| Secret | Description |
| --- | --- |
| `CANADA_TIRE_BASE_URL` | Base URL for the RESTlet host (sandbox: `https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting`). |
| `CANADA_TIRE_REALM` | OAuth realm (`8031691_SB1` for sandbox, `8031691` for production). |
| `CANADA_TIRE_CONSUMER_KEY` | OAuth consumer key provided by Canada Tire. |
| `CANADA_TIRE_CONSUMER_SECRET` | OAuth consumer secret. |
| `CANADA_TIRE_TOKEN_ID` | Token ID (OAuth access token). |
| `CANADA_TIRE_TOKEN_SECRET` | Token secret (OAuth access token secret). |
| `CANADA_TIRE_CUSTOMER_ID` | Application-layer customer identifier. |
| `CANADA_TIRE_CUSTOMER_TOKEN` | Application-layer customer token. |
| `CANADA_TIRE_TIMEOUT_MS` (optional) | Overrides the 30s request timeout if you need a shorter/longer limit. |

The Edge Function reads secrets via `Deno.env.get`, validates their presence at runtime, and refuses to start if any mandatory
secret is missing.

## 2. Deployment

```bash
supabase functions deploy distributor --no-verify-jwt
```

Use `--no-verify-jwt` only if the function must be callable by systems that cannot attach Supabase JWTs. Otherwise, require
JWT verification and validate roles inside the handler.

To test locally:

```bash
supabase functions serve --env-file ./supabase/.env.local distributor
```

## 3. Request format

Send a POST request with the following envelope. The handler currently supports a single vendor (`canadaTire`) but is structured
so that additional distributors can be added without changing the client payload.

```json
{
  "vendor": "canadaTire",
  "action": "searchProducts",
  "payload": {
    "filters": {
      "brand": "PIRELLI",
      "rimSize": 17,
      "isWinter": true
    }
  }
}
```

Supported actions:

- `searchProducts`
- `getShipToAddresses`
- `submitOrder`
- `updateOrderAddress`

The Edge Function injects the `customerId` and `customerToken` from secrets, builds the OAuth 1.0 signature with HMAC-SHA256,
and forwards the request body to the correct RESTlet script/deploy combination. Responses are proxied verbatim; errors are
normalised to `{ "success": false, "error": { "code": number, "message": string } }`.

## 4. Validation & security safeguards

- All payloads are validated before hitting the upstream API. Invalid data returns `400` with an actionable error message.
- Shipping rules (addrId vs. full address) mirror the guide. Province and country codes are forced to uppercase.
- OAuth signatures are rebuilt for every call with cryptographically secure nonces and timestamps.
- Requests are aborted after 30 seconds by default to prevent hanging Edge workers.
- Secrets never leave the function; logs omit token values and only record high-level status information.

## 5. Extending to other distributors

Add a new adapter in `supabase/functions/_shared/vendors/` that implements the same method surface (`searchProducts`,
`getShipToAddresses`, `submitOrder`, `updateOrderAddress`). Update `supabase/functions/distributor/index.ts` to route by
`vendor` and inject the new adapter. Reuse the shared interfaces in `_shared/types.ts` so clients can call a consistent API
regardless of distributor.
