# Product data security and implementation guide

This project now treats product payloads as **untrusted input** and applies a dedicated
validation pipeline before exposing them to the UI. Use the checklist below when wiring a
real catalogue service or ingesting partner feeds.

## Client-side defences

1. **Runtime validation and sanitisation**
   - `src/models/productSchema.ts` walks each product/variant value and rejects malformed
     data. It enforces identifiers, ISO-style currency codes, non-negative stock values,
     and http/https (or relative) media URLs before the UI ever sees the objects.
   - Descriptions, tags, and attribute values are trimmed, stripped of control characters,
     and length-limited to stop script injection or overlong payloads from degrading the
     experience.
   - Duplicate product or variant IDs are ignored so a compromised response cannot shadow
     an existing record.

2. **Safe image handling**
   - Only http(s) or relative image URLs survive sanitisation, preventing attackers from
     injecting `javascript:` or `data:` schemes that could exfiltrate cookies.
   - Invalid entries surface as console warnings, making it easy to trace suspicious
     responses during QA.

3. **Abort-aware fetching**
   - `fetchProducts` and `fetchProductById` accept an `AbortSignal`. Pages cancel requests
     on unmount to avoid race conditions that otherwise leak state updates or crash when a
     user navigates quickly.

4. **Centralised logging**
   - `catalog.ts` pipes every validation issue into structured warnings/errors so you can
     hook the browser console (or future telemetry) for alerting.

## Backend expectations

To keep the pipeline secure end-to-end:

- **Authenticate write operations**: Require signed admin/API tokens before allowing
  product creation or updates. Pair with short-lived JWTs or mTLS between services.
- **Validate server-side as well**: Mirror (or reuse) the same checks in your backend so
  corrupted data never reaches the front end.
- **Rate-limit and monitor**: Instrument ingestion endpoints and the catalogue API with
  anomaly detection to catch spikes or tampering.
- **Use signed media URLs**: Prefer serving images from trusted domains or signed CDNs.
  Reject absolute URLs pointing to unknown hosts.
- **Emit versioned schemas**: Publish JSON Schema or OpenAPI definitions so consumers can
  pin to specific shapes and detect breaking changes early.

## Operational tips

- Enable CSP headers on your deployment (e.g., `default-src 'self'; img-src 'self' https:`)
  to further constrain where assets load from.
- When switching `VITE_USE_MOCKS` to `false`, hook the validation logs into your
  observability stack; unexpected warnings often signal data quality or security drift.
- Consider encrypting product exports at rest (S3, databases) and rotating credentials on a
  schedule that matches your compliance requirements.
