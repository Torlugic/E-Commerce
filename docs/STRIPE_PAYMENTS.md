# Stripe Payments Integration

This document outlines how the Supabase Edge Function located at `supabase/functions/payments/index.ts` provisions [Stripe PaymentIntents](https://stripe.com/docs/payments/payment-intents) that support cards as well as buy-now-pay-later (BNPL) options such as Afterpay/Clearpay, Klarna, and Sezzle. All secrets **must** be managed through environment variables and Supabase's secret manager.

## Environment variables

Set the following secrets locally in `supabase/.env.local` (based on `supabase/.env.example`) and in production using `supabase secrets set`:

| Variable | Required | Description |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | ✅ | Your Stripe secret key (e.g. `sk_live_...`). Never commit this value to git. |
| `STRIPE_PAYMENT_METHOD_TYPES` | ⛔️ (optional) | Comma-separated list of enabled payment method types. Defaults to `card,afterpay_clearpay,klarna,sezzle`. Remove any method that is not activated on your Stripe account. |

If you expose publishable keys to the frontend, manage them via Vite environment variables (e.g. `VITE_STRIPE_PUBLISHABLE_KEY`) but **do not** reuse the secret key outside secure server-side code.

## Request contract

Send a `POST` request to the Edge Function with JSON shaped as follows:

```jsonc
{
  "amount": 25900,                 // integer amount in the smallest currency unit (e.g. cents)
  "currency": "CAD",               // ISO currency code
  "paymentMethodTypes": ["card", "afterpay_clearpay"],
  "orderId": "PO-12345",
  "orderItems": [
    { "sku": "PIRELLI-2055516", "quantity": 4, "unitAmount": 6475 }
  ],
  "customer": {
    "email": "buyer@example.com",
    "name": "Jane Doe",
    "phone": "+1-555-123-4567"
  },
  "shipping": {
    "name": "Jane Doe",
    "phone": "+1-555-123-4567",
    "address": {
      "line1": "123 Front St",
      "city": "Toronto",
      "state": "ON",
      "postalCode": "M5V 2T6",
      "country": "CA"
    }
  },
  "receiptEmail": "buyer@example.com",
  "metadata": {
    "distributor": "canada_tire"
  },
  "idempotencyKey": "order-po-12345"
}
```

Key validation rules enforced server-side:

* `amount` must be an integer ≥ `100` (e.g. $1.00) and match the total derived from `orderItems` when provided.
* `currency` must be a 3-letter ISO code. BNPL payment methods only allow specific currencies (e.g. Afterpay supports AUD, CAD, NZD, GBP, USD).
* Shipping details are mandatory when any BNPL method is enabled (Afterpay, Klarna, or Sezzle).
* `paymentMethodTypes` defaults to the configured list; the handler rejects unsupported or duplicate types and ensures manual capture is only used with cards.
* Metadata keys/values are strictly bounded (≤ 50 entries, keys ≤ 40 chars, values ≤ 500 chars) to prevent abuse.

## Response contract

On success the handler returns:

```jsonc
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_123",
    "clientSecret": "pi_123_secret_456",
    "amount": 25900,
    "currency": "cad",
    "status": "requires_payment_method",
    "paymentMethodTypes": ["card", "afterpay_clearpay"]
  },
  "error": { "code": "", "message": "" }
}
```

Errors surface with HTTP status codes and a sanitized message when it is safe to do so. Stripe error payloads are not logged verbatim to avoid leaking secrets.

## Recommended frontend flow

1. Collect cart totals on the server (e.g. from the Canada Tire adapter) to compute the trusted amount and line items.
2. Call the Edge Function to create the PaymentIntent using the validated totals and shipping address selected by the user.
3. Use Stripe.js and the Payment Element on the client with the returned `clientSecret`. Pass the same list of payment method types that you configured server-side.
4. Confirm the PaymentIntent client-side. For manual capture flows, capture the PaymentIntent from a secure backend using the Stripe secret key.
5. Handle asynchronous payment webhooks (e.g. Afterpay, Klarna) via a separate webhook endpoint that validates the Stripe signature using `STRIPE_WEBHOOK_SECRET`.

## Security considerations

* The secret key never leaves the serverless function; only publishable keys are exposed to clients.
* Idempotency keys ensure that retries (network or client) do not create duplicate PaymentIntents.
* Amount and metadata validation prevents tampering with line items or injection of excessive data.
* Stripe errors are sanitized before returning to the client while still returning actionable HTTP status codes for error handling.
* Configure Stripe's Radar rules and 3DS requirements as needed; the PaymentIntent API will enforce Strong Customer Authentication when applicable.

## Testing locally

1. Copy `supabase/.env.example` to `supabase/.env.local` and populate `STRIPE_SECRET_KEY` with a test key (`sk_test_...`).
2. Start the Supabase local stack: `supabase start`.
3. Invoke the function:

```bash
curl -s -X POST \
  -H "Authorization: Bearer $(supabase functions secrets get access_token)" \
  -H "Content-Type: application/json" \
  -d '{"amount":25900,"currency":"CAD","paymentMethodTypes":["card","afterpay_clearpay"],"orderItems":[{"sku":"SKU","quantity":1,"unitAmount":25900}],"shipping":{"name":"Test","address":{"line1":"1 Main","city":"Toronto","state":"ON","postalCode":"M5V1E3","country":"CA"}}}' \
  http://localhost:54321/functions/v1/payments
```

4. Use the returned `clientSecret` with Stripe's test cards (e.g. `4000 0566 5566 5556` for Afterpay/Clearpay) to verify each payment method in the Payment Element.

Always reset or rotate credentials if you suspect they were exposed.
