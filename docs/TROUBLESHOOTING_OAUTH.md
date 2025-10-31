# Troubleshooting OAuth Authentication Issues

## "Canada Tire API returned malformed JSON" Error

This error typically means the API is returning HTML instead of JSON, which almost always indicates an **OAuth authentication failure**.

### Enhanced Debugging Added

The latest version includes comprehensive debugging that will help identify the exact issue:

1. **Environment variable verification** - Logs all credentials (length only for secrets)
2. **Request logging** - Full request details including OAuth header (masked)
3. **Response detection** - Detects HTML responses and provides specific error messages
4. **Detailed error context** - Error messages include hints for resolution

### What the Logs Will Show

After deploying the updated function, you'll see detailed logs like:

```
[Config] Verifying environment variables...
[Config] CANADA_TIRE_BASE_URL: https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting
[Config] CANADA_TIRE_CONSUMER_KEY: [SET - 64 characters]
[Config] CANADA_TIRE_CONSUMER_SECRET: [SET - 64 characters]
[Config] CANADA_TIRE_TOKEN_ID: [SET - 64 characters]
[Config] CANADA_TIRE_TOKEN_SECRET: [SET - 64 characters]
[Config] CANADA_TIRE_CUSTOMER_ID: [SET - 7 characters]
[Config] CANADA_TIRE_CUSTOMER_TOKEN: [SET - 32 characters]

[Distributor] ========== CONFIGURATION ==========
[Distributor] Base URL: https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting
[Distributor] Realm: 8031691_SB1
[Distributor] Customer ID: 1234567
[Distributor] Consumer Key length: 64
[Distributor] Token ID length: 64
[Distributor] =======================================

[Canada Tire API] ========== REQUEST START ==========
[Canada Tire API] Action: searchProducts
[Canada Tire API] URL: https://...
[Canada Tire API] Realm: 8031691_SB1
[Canada Tire API] OAuth Header (masked): OAuth realm="8031691_SB1",oauth_consumer_key="...",oauth_signature="***"

[Canada Tire API] Response status: 401 Unauthorized
[Canada Tire API] Received HTML instead of JSON - Authentication likely failed
[Canada Tire API] Full HTML response: <!DOCTYPE html><html>...
```

## Common OAuth Issues and Solutions

### 1. Wrong Realm

**Symptom:** Getting HTML error page or 401 Unauthorized

**Check:**
- Sandbox should use: `8031691_SB1`
- Production should use: `8031691`

**Solution:**
```bash
# For sandbox
supabase secrets set CANADA_TIRE_REALM="8031691_SB1"

# For production
supabase secrets set CANADA_TIRE_REALM="8031691"

# Redeploy
supabase functions deploy distributor --no-verify-jwt
```

### 2. Wrong Consumer Key or Consumer Secret

**Symptom:** 401 Unauthorized, HTML error page

**Check:**
- Verify consumer key is exactly as provided by Canada Tire
- Verify consumer secret is exactly as provided
- Check for extra spaces or line breaks when copying

**Solution:**
```bash
# Re-set credentials (copy carefully, no spaces)
supabase secrets set CANADA_TIRE_CONSUMER_KEY="your_exact_key"
supabase secrets set CANADA_TIRE_CONSUMER_SECRET="your_exact_secret"

# Redeploy
supabase functions deploy distributor --no-verify-jwt
```

### 3. Wrong Token ID or Token Secret

**Symptom:** 401 Unauthorized

**Check:**
- Verify token ID matches the access token provided
- Verify token secret matches the access token secret
- Tokens may expire - check if new tokens are needed

**Solution:**
```bash
# Re-set tokens
supabase secrets set CANADA_TIRE_TOKEN_ID="your_token_id"
supabase secrets set CANADA_TIRE_TOKEN_SECRET="your_token_secret"

# Redeploy
supabase functions deploy distributor --no-verify-jwt
```

### 4. Wrong Base URL or Endpoint

**Symptom:** Connection errors, wrong endpoints

**Check:**
- Sandbox: `https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting`
- Production: `https://8031691.restlets.api.netsuite.com/app/site/hosting`
- No trailing slash
- Correct protocol (https)

**Solution:**
```bash
# For sandbox
supabase secrets set CANADA_TIRE_BASE_URL="https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting"

# For production
supabase secrets set CANADA_TIRE_BASE_URL="https://8031691.restlets.api.netsuite.com/app/site/hosting"

# Redeploy
supabase functions deploy distributor --no-verify-jwt
```

### 5. OAuth Signature Generation Issues

**Symptom:** 401 Unauthorized despite correct credentials

**Possible Causes:**
- OAuth parameters not in alphabetical order (fixed in code)
- Incorrect percent encoding (fixed in code)
- Wrong signature method (should be HMAC-SHA256)
- Timestamp issues (clock drift)

**Check in Logs:**
```
[Canada Tire API] OAuth Header (masked): OAuth realm="...",oauth_consumer_key="...",oauth_nonce="...",oauth_signature="***",oauth_signature_method="HMAC-SHA256",oauth_timestamp="...",oauth_token="...",oauth_version="1.0"
```

**Parameters should be in this order:**
1. realm
2. oauth_consumer_key
3. oauth_nonce
4. oauth_signature
5. oauth_signature_method
6. oauth_timestamp
7. oauth_token
8. oauth_version

### 6. Customer ID or Customer Token Issues

**Symptom:** OAuth succeeds (200 OK) but API returns an error about invalid customer

**Check:**
- Customer ID is numeric and matches your account
- Customer token is exactly as provided
- These are application-level credentials, separate from OAuth

**Solution:**
```bash
supabase secrets set CANADA_TIRE_CUSTOMER_ID="1234567"
supabase secrets set CANADA_TIRE_CUSTOMER_TOKEN="your_customer_token"

# Redeploy
supabase functions deploy distributor --no-verify-jwt
```

## Step-by-Step Debugging Process

### Step 1: Deploy Updated Function

```bash
supabase functions deploy distributor --no-verify-jwt
```

### Step 2: Make a Test Request

Either use the `/canada-tire` page in your app, or curl:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/distributor \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "canadaTire",
    "action": "searchProducts",
    "payload": {
      "filters": {
        "isTire": true
      }
    }
  }'
```

### Step 3: Check Logs

```bash
supabase functions logs distributor --tail
```

### Step 4: Analyze Log Output

Look for these sections in order:

1. **Configuration Section** - Verify all variables are set
   ```
   [Config] Verifying environment variables...
   ```
   - All should show `[SET - X characters]`
   - If any show as missing, that's your issue

2. **Request Section** - Check request details
   ```
   [Canada Tire API] ========== REQUEST START ==========
   ```
   - Verify URL is correct
   - Verify realm matches environment
   - Check OAuth header is present

3. **Response Section** - Check what was returned
   ```
   [Canada Tire API] Response status: XXX
   ```
   - 200 OK = Success
   - 401 Unauthorized = OAuth issue
   - 400 Bad Request = Request format issue
   - 500+ = Server issue

4. **Error Details** - If it failed, check the error
   - HTML response = OAuth failure
   - Empty response = Network/config issue
   - JSON error = Application-level error

## Specific Error Messages and Solutions

### "Received HTML instead of JSON"

**Cause:** NetSuite is returning an error page, not API response

**Most Common Reasons:**
1. Wrong realm (8031691 vs 8031691_SB1)
2. Invalid OAuth credentials
3. Expired tokens
4. Wrong script/deploy IDs

**Solution:** Verify realm and all OAuth credentials

### "OAuth authentication failed"

**Cause:** OAuth signature verification failed on NetSuite side

**Most Common Reasons:**
1. Consumer key doesn't match consumer secret
2. Token ID doesn't match token secret
3. Wrong realm for the credentials
4. Credentials from wrong environment (sandbox vs prod)

**Solution:** Double-check all four OAuth credentials match each other and the environment

### "Empty response"

**Cause:** No response received from API

**Most Common Reasons:**
1. Wrong base URL
2. Network issue
3. RESTlet not deployed in NetSuite

**Solution:** Verify base URL and check NetSuite RESTlet deployment

## Verification Checklist

Before requesting help, verify:

- [ ] All 7 environment variables are set in Supabase
- [ ] Base URL matches realm (sandbox has -sb1, production doesn't)
- [ ] No extra spaces or line breaks in credentials
- [ ] Realm is exactly `8031691_SB1` (sandbox) or `8031691` (production)
- [ ] Consumer key/secret pair match each other
- [ ] Token ID/secret pair match each other
- [ ] Credentials are from the correct environment (don't mix sandbox and production)
- [ ] Function deployed after setting/updating secrets
- [ ] Logs show all variables as `[SET - X characters]`

## Manual OAuth Test (Advanced)

If you want to verify OAuth independently, you can test the signature generation:

### Test Request Details

For a test request to search products:

```
Method: POST
URL: https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=customscript_item_search_rl&deploy=customdeploy_item_search_rl

Headers:
  Authorization: OAuth realm="8031691_SB1",oauth_consumer_key="...",oauth_nonce="...",oauth_signature="...",oauth_signature_method="HMAC-SHA256",oauth_timestamp="...",oauth_token="...",oauth_version="1.0"
  Content-Type: application/json

Body:
{
  "customerId": "1234567",
  "customerToken": "...",
  "filters": {
    "isTire": true
  }
}
```

### OAuth Base String Construction

The base string for signing should be:

```
POST&https%3A%2F%2F8031691-sb1.restlets.api.netsuite.com%2Fapp%2Fsite%2Fhosting%2Frestlet.nl&deploy%3Dcustomdeploy_item_search_rl%26oauth_consumer_key%3D...
```

**Important:**
1. All parameters must be percent-encoded
2. Parameters must be in alphabetical order
3. Signature is HMAC-SHA256 of the base string
4. Signing key is: `consumer_secret&token_secret` (both percent-encoded)

## Getting Help from Canada Tire

If you've verified everything above and still have issues, contact Canada Tire support with:

1. **Your logs** (with secrets masked)
2. **Environment** (sandbox or production)
3. **Account ID** (the numeric ID)
4. **Error details** (HTTP status, error messages)
5. **Request timestamp** (from logs)

They can check server-side logs and verify your credentials are active.

## Summary

The "malformed JSON" error is almost always an OAuth authentication issue. The enhanced debugging will show you:

1. ✅ Which credentials are set (and their length)
2. ✅ What request is being sent
3. ✅ What response is received
4. ✅ Specific error details with hints

After deploying the updated function, the logs will tell you exactly what's wrong. Most commonly, it's one of:
- Wrong realm
- Mismatched credentials
- Credentials from wrong environment

**Next Steps:**
1. Deploy the updated function
2. Make a test request
3. Check the logs for the detailed output
4. Use the information above to identify and fix the specific issue
