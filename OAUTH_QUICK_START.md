# OAuth Fix - Quick Start

## The Problem

You're seeing this error:
```
Canada Tire API returned HTML instead of JSON (OAuth authentication likely failed)
```

## The Solution (90% of cases)

Your REALM doesn't match your BASE_URL environment.

### For Sandbox (Most Common)

```bash
npx supabase secrets set CANADA_TIRE_REALM="8031691_SB1"
npx supabase secrets set CANADA_TIRE_BASE_URL="https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting"
npx supabase functions deploy distributor --no-verify-jwt
```

### For Production

```bash
npx supabase secrets set CANADA_TIRE_REALM="8031691"
npx supabase secrets set CANADA_TIRE_BASE_URL="https://8031691.restlets.api.netsuite.com/app/site/hosting"
npx supabase functions deploy distributor --no-verify-jwt
```

## Verify It Works

```bash
./test-canada-tire-api.sh
```

Look for:
- ✓ SUCCESS: API returned valid JSON response
- ✓ OAuth authentication is working

## Still Not Working?

1. Check all 8 secrets are set:
   ```bash
   npx supabase secrets list
   ```

2. Run diagnostic:
   ```bash
   ./verify-oauth-credentials.sh
   ```

3. Read full guide:
   ```bash
   cat OAUTH_FIX_GUIDE.md
   ```

## Required Secrets

All 8 must be set:
- CANADA_TIRE_BASE_URL
- CANADA_TIRE_REALM
- CANADA_TIRE_CONSUMER_KEY
- CANADA_TIRE_CONSUMER_SECRET
- CANADA_TIRE_TOKEN_ID
- CANADA_TIRE_TOKEN_SECRET
- CANADA_TIRE_CUSTOMER_ID
- CANADA_TIRE_CUSTOMER_TOKEN

## Quick Test

After fixing:
```bash
# Deploy
npx supabase functions deploy distributor --no-verify-jwt

# Test
./test-canada-tire-api.sh

# Or test manually
curl -X POST "https://fbojsejqgfndrvqbimjm.supabase.co/functions/v1/distributor" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZib2pzZWpxZ2ZuZHJ2cWJpbWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTkwNjMsImV4cCI6MjA3NTUzNTA2M30.zXX0HxoTEAATK1RR8F8vgwpqb0pfApieiSQZqBxO_Ac" \
  -H "Content-Type: application/json" \
  -d '{"vendor":"canadaTire","action":"searchProducts","payload":{"filters":{"isTire":true}}}'
```

## Expected Success

```json
{
  "success": true,
  "data": [
    {
      "partNumber": "...",
      "brand": "...",
      "description": "...",
      "price": 99.99
    }
  ]
}
```

## Check Logs

Supabase Dashboard → Functions → distributor → Logs

Look for:
```
[Canada Tire API] Response status: 200 OK
[Canada Tire API] ========== REQUEST SUCCESS ==========
```

---

**Timeline:** 3-4 minutes from fix to working
