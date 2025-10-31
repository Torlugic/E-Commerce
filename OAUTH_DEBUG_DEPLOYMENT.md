# OAuth Debug - Quick Deployment Guide

## 🚨 You're Getting "Malformed JSON" Error

This means the API is returning HTML instead of JSON - **OAuth authentication is failing**.

## ✅ Deploy Enhanced Debug Version

```bash
# Deploy the updated function with enhanced debugging
supabase functions deploy distributor --no-verify-jwt
```

## 📊 What Changed

The function now includes:

1. ✅ **Environment variable verification** - Shows which credentials are set and their length
2. ✅ **HTML detection** - Detects HTML error pages and provides specific error message
3. ✅ **Enhanced logging** - Shows OAuth headers (masked), request/response details
4. ✅ **Better error messages** - Includes hints for fixing common issues

## 🔍 View Detailed Logs

```bash
# Watch logs in real-time
supabase functions logs distributor --tail

# Or view recent logs
supabase functions logs distributor
```

## 📝 What You'll See

### If Environment Variables Are Missing:
```
[Config] MISSING: CANADA_TIRE_CONSUMER_KEY
```
**Fix:** Set the missing variable with `supabase secrets set`

### If HTML Error Page Received:
```
[Canada Tire API] Received HTML instead of JSON - Authentication likely failed
[Canada Tire API] Full HTML response: <!DOCTYPE html>...
Error: OAuth authentication likely failed
Hint: Check OAuth credentials (consumer key/secret, token ID/secret) and realm
```

### If Configuration is OK:
```
[Distributor] ========== CONFIGURATION ==========
[Distributor] Base URL: https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting
[Distributor] Realm: 8031691_SB1
[Distributor] Customer ID: 1234567
[Distributor] Consumer Key length: 64
[Distributor] Token ID length: 64
```

## 🎯 Most Common Issues

| Log Shows | Problem | Solution |
|-----------|---------|----------|
| `MISSING: CANADA_TIRE_XXX` | Variable not set | `supabase secrets set CANADA_TIRE_XXX="value"` |
| `Received HTML instead of JSON` | OAuth failed | Check credentials match realm |
| `Realm: 8031691` but using sandbox | Wrong realm | Use `8031691_SB1` for sandbox |
| `Realm: 8031691_SB1` but using prod | Wrong realm | Use `8031691` for production |
| `Consumer Key length: 32` | Wrong length | Verify credentials are correct |
| `401 Unauthorized` | Invalid credentials | Re-verify all OAuth credentials |

## 🔧 Quick Fixes

### Issue: Wrong Realm
```bash
# For sandbox
supabase secrets set CANADA_TIRE_REALM="8031691_SB1"

# For production
supabase secrets set CANADA_TIRE_REALM="8031691"

# Redeploy
supabase functions deploy distributor --no-verify-jwt
```

### Issue: Invalid Credentials
```bash
# Re-set all OAuth credentials
supabase secrets set CANADA_TIRE_CONSUMER_KEY="your_key"
supabase secrets set CANADA_TIRE_CONSUMER_SECRET="your_secret"
supabase secrets set CANADA_TIRE_TOKEN_ID="your_token"
supabase secrets set CANADA_TIRE_TOKEN_SECRET="your_token_secret"

# Redeploy
supabase functions deploy distributor --no-verify-jwt
```

### Issue: All Variables Set But Still Failing
```bash
# Check logs for specific error
supabase functions logs distributor --tail

# Look for these patterns:
# - "Received HTML" = OAuth signature issue
# - "401" = Invalid credentials
# - "Empty response" = Wrong URL
```

## 📋 Verification Steps

1. **Deploy updated function:**
   ```bash
   supabase functions deploy distributor --no-verify-jwt
   ```

2. **Make a test request** (use /canada-tire page or curl)

3. **Check logs immediately:**
   ```bash
   supabase functions logs distributor --tail
   ```

4. **Look for configuration section:**
   - All variables should show `[SET - X characters]`
   - Base URL should match realm (sandbox vs production)
   - Credential lengths should be reasonable (typically 32-64 chars)

5. **Check request/response section:**
   - Request should show proper OAuth header
   - Response should be JSON, not HTML
   - Status should be 200 OK

## 🎓 Understanding the Logs

### Good Request (What You Want to See):
```
[Config] CANADA_TIRE_BASE_URL: https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting
[Config] CANADA_TIRE_CONSUMER_KEY: [SET - 64 characters]
[Config] CANADA_TIRE_CONSUMER_SECRET: [SET - 64 characters]
[Config] CANADA_TIRE_TOKEN_ID: [SET - 64 characters]
[Config] CANADA_TIRE_TOKEN_SECRET: [SET - 64 characters]

[Canada Tire API] ========== REQUEST START ==========
[Canada Tire API] Response status: 200 OK
[Canada Tire API] Parsed response (success=true)
[Canada Tire API] ========== REQUEST SUCCESS ==========
```

### Bad Request (OAuth Failure):
```
[Canada Tire API] Response status: 401 Unauthorized
[Canada Tire API] Received HTML instead of JSON
Error: OAuth authentication likely failed
Hint: Check OAuth credentials and realm configuration
```

## 📚 Full Documentation

- **[OAuth Troubleshooting Guide](./docs/TROUBLESHOOTING_OAUTH.md)** - Comprehensive OAuth debugging
- **[Testing Guide](./docs/CANADA_TIRE_TESTING.md)** - Full testing instructions
- **[Integration Summary](./docs/CANADA_TIRE_INTEGRATION_SUMMARY.md)** - Complete overview

## 🆘 Still Stuck?

After deploying and checking logs:

1. Copy the full log output from one request
2. Mask any sensitive values (replace actual credentials with `***`)
3. Look for the specific error message
4. Use the troubleshooting guide to identify the issue

The enhanced logging will tell you **exactly** what's wrong - you just need to look for:
- Missing variables
- Wrong realm
- HTML responses
- 401 errors
- Credential length mismatches

---

**Deploy now and check your logs!** 🚀

```bash
supabase functions deploy distributor --no-verify-jwt
supabase functions logs distributor --tail
```
