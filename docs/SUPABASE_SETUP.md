# Supabase project setup for the storefront

This guide outlines how to provision and harden a Supabase project that backs the storefront. It focuses on Canadian data
residency, strict access control, and operational practices so you can expose only what the React app needs.

## 1. Project provisioning

### Region
- Create the project in **Canada Central (`ca-central-1`)** to keep data in-region for Canadian shoppers and reduce latency.
- Edge Functions automatically run near the caller, but explicitly pin heavy database work to `ca-central-1` when invoking
  functions so queries stay close to the Postgres instance.

### Data access strategy
- **Data API enabled (client access):** Keep the REST/GraphQL API enabled on your exposed schema if the React app uses the Supabase
  client. Enforce Row-Level Security (RLS) on every table and verify the anon key only exposes data a customer should see.
- **Data API disabled (server access only):** If all data access flows through Edge Functions or other backend code, disable the
  Data API in *Dashboard → API Settings* for maximum protection. Use Supavisor’s transaction pooling in serverless/Edge contexts,
  and the standard connection string for long-lived servers.

### Schema organisation
- Keep customer-facing tables (catalogue, orders, carts) in a dedicated schema such as `api` (or continue using `public`).
- Create a separate **private schema** for sensitive data (payment metadata, admin workflows, logs) that is never exposed through
  the Data API.
- Remove `public` from the list of exposed schemas in *API Settings* if you migrate to a different schema, reducing accidental
  exposure of default tables.

## 2. Database security & access control

### Row-Level Security (RLS)
- Enable RLS on **every** table that is reachable via the Data API. Treat it as non-negotiable for production deployments.
- Write policies that scope access to `auth.uid()` so users can only read or mutate their own rows.
- Add elevated policies for staff/admins that check a role claim (see below) instead of opening tables globally.

### Roles and claims
- Store user roles in a table (e.g. `user_roles`) and use a Custom Access Token hook to embed roles into Supabase JWT claims.
- Reference those claims inside RLS policies, e.g. `auth.jwt() ->> 'role' = 'admin'` for privileged queries.
- Never allow the anon key to access write endpoints outside of public-read operations.

### Network & transport hardening
- Enable **Enforce SSL** so all connections use TLS.
- Configure database network restrictions to allow only trusted IP ranges (hosting providers, office IPs) when possible.
- Require MFA for all Supabase organisation members and configure auth email verification + sensible OTP expiry (e.g. 1 hour).

### Performance & indexing
- Index columns used in policies and common lookups (`user_id`, `sku`, status flags) to keep RLS performant.
- Monitor query plans with `pg_stat_statements` and Supabase’s Performance Advisor, upgrading resources as load increases.

## 3. Authentication & RBAC
- Use the **anon** key in the React client and keep the **service_role** key exclusively in backend code (Edge Functions, servers).
- Rotate keys periodically and never commit them to the repo.
- Require email verification for new users and enable MFA if your threat model demands it.
- Extend RLS policies with role checks for staff actions. Combine JWT claims with role tables for granular permissions.

## 4. Environment variables & secrets
- Map Supabase client values (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) into your frontend hosting platform.
- Store server-only credentials (service role key, third-party API tokens, OAuth secrets) in Supabase **Project Secrets** or your
  deployment platform’s secret manager. Access them at runtime via `Deno.env.get` inside Edge Functions.
- Never commit `.env` files that contain real secrets—use the Supabase CLI or CI pipelines to push secrets when deploying.

## 5. Storage (product media)
- Use a **public bucket** for catalogue images so they can be served quickly and cached at the edge.
- Apply RLS policies on `storage.objects` to restrict uploads and deletions to admins or trusted staff.
- Optionally issue signed URLs for premium assets stored in private buckets.
- Configure maximum file size and content-type restrictions to keep uploads predictable.

## 6. Edge Functions & external integrations
- Keep customer-facing APIs behind Edge Functions that require a Supabase JWT by default. Validate roles inside each function.
- For webhooks (Stripe, etc.) that cannot send JWTs, relax the requirement but validate provider signatures and narrow allowed
  routes.
- Use the service role key sparingly to bypass RLS for administrative logic, and sanitise any payloads returned to the client.
- Proxy third-party APIs (e.g. Canadian Tire) through Edge Functions, signing requests server-side and sanitising responses to
  avoid leaking secrets.
- Explicitly set the `x-region: ca-central-1` header when functions execute DB-heavy logic to keep latency low.

## 7. Monitoring, logging & recovery
- Enable Supabase Logs & Analytics and review them regularly for auth anomalies or slow queries.
- Forward critical logs to services like Sentry or Datadog if you need centralised monitoring beyond the dashboard.
- Turn on daily backups (or PITR for larger datasets) and practise restoration before shipping major schema changes.
- Run the Supabase Security Advisor routinely to catch tables missing RLS or policies that are too permissive.

## 8. Next steps for this project
- Decide whether the React app should call Supabase directly (Data API + anon key) or exclusively via Edge Functions.
- Create the necessary schemas/tables following the separation above and write RLS policies before importing production data.
- Populate environment variables locally and in deployment (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, backend secrets) and set
  `VITE_USE_MOCKS=false` once the API is ready.
- Update the services in `src/services/` to call your Supabase endpoints or Edge Functions, centralising auth headers and error
  handling in one place.
