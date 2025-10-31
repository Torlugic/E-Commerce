# 🚨 QUICK FIX: OAuth Authentication Failure

## Your Error:
```
Canada Tire API returned HTML instead of JSON (OAuth authentication likely failed)
```

## What This Means:
The Canada Tire API is rejecting your OAuth credentials and returning an HTML error page.

---

## ⚡ Quick Fix (Most Common Issues)

### Issue #1: Wrong Realm (80% of cases)

**Check your Supabase secrets:**

#### If using SANDBOX:
```bash
# Should be:
CANADA_TIRE_REALM="8031691_SB1"     # ← Note the _SB1
CANADA_TIRE_BASE_URL="https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting"  # ← Note -sb1
```

#### If using PRODUCTION:
```bash
# Should be:
CANADA_TIRE_REALM="8031691"         # ← No _SB1
CANADA_TIRE_BASE_URL="https://8031691.restlets.api.netsuite.com/app/site/hosting"      # ← No -sb1
```

**Fix it:**
```bash
# For sandbox:
supabase secrets set CANADA_TIRE_REALM="8031691_SB1"
supabase secrets set CANADA_TIRE_BASE_URL="https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting"

# For production:
supabase secrets set CANADA_TIRE_REALM="8031691"
supabase secrets set CANADA_TIRE_BASE_URL="https://8031691.restlets.api.netsuite.com/app/site/hosting"

# Redeploy:
supabase functions deploy distributor --no-verify-jwt
```

---

### Issue #2: Missing Credentials

**Check Supabase Dashboard:**
1. Go to: Dashboard → Your Project → Edge Functions → Secrets
2. Verify ALL 8 variables exist:
   - `CANADA_TIRE_BASE_URL`
   - `CANADA_TIRE_REALM`
   - `CANADA_TIRE_CONSUMER_KEY`
   - `CANADA_TIRE_CONSUMER_SECRET`
   - `CANADA_TIRE_TOKEN_ID`
   - `CANADA_TIRE_TOKEN_SECRET`
   - `CANADA_TIRE_CUSTOMER_ID`
   - `CANADA_TIRE_CUSTOMER_TOKEN`

**If any are missing, set them:**
```bash
supabase secrets set CANADA_TIRE_CONSUMER_KEY="your_key_here"
supabase secrets set CANADA_TIRE_CONSUMER_SECRET="your_secret_here"
supabase secrets set CANADA_TIRE_TOKEN_ID="your_token_id_here"
supabase secrets set CANADA_TIRE_TOKEN_SECRET="your_token_secret_here"
supabase secrets set CANADA_TIRE_CUSTOMER_ID="your_customer_id"
supabase secrets set CANADA_TIRE_CUSTOMER_TOKEN="your_customer_token"

supabase functions deploy distributor --no-verify-jwt
```

---

### Issue #3: Typos in Credentials

**Common mistakes when copying:**
- ❌ Extra spaces: `" abc123"` or `"abc123 "`
- ❌ Line breaks in middle of credential
- ❌ Wrong quotes: `"abc123"` (curly) instead of `"abc123"` (straight)
- ❌ Truncated value (didn't copy all characters)

**Check and fix:**
```bash
# Re-copy credentials carefully, ensuring:
# - No spaces before/after
# - Complete value copied
# - Straight quotes only

supabase secrets set CANADA_TIRE_CONSUMER_KEY="abc123..."
# Repeat for all credentials

supabase functions deploy distributor --no-verify-jwt
```

---

### Issue #4: Mismatched Environment Credentials

**Problem:** Using sandbox credentials with production URL (or vice versa)

**How to check:**
- Your credentials came from: Sandbox ☐ or Production ☐
- Your BASE_URL has `-sb1`: Yes ☐ or No ☐
- Your REALM ends with `_SB1`: Yes ☐ or No ☐

**They must all match:**
- Sandbox credentials → `-sb1` URL → `_SB1` realm
- Production credentials → no `-sb1` → no `_SB1`

---

## 🔍 Verify the Fix

### 1. Check the Enhanced Logs:

```bash
supabase functions logs distributor --tail
```

### 2. Make a test request:
- Go to: http://localhost:5173/canada-tire
- Click "Search"

### 3. Look for Success in Logs:

**✅ You should see:**
```
[Config] CANADA_TIRE_BASE_URL: https://8031691-sb1...
[Config] CANADA_TIRE_REALM: [SET - 11 characters]
[Config] CANADA_TIRE_CONSUMER_KEY: [SET - 64 characters]
...
[Distributor] Realm: 8031691_SB1
[Canada Tire API] Response status: 200 OK
[Canada Tire API] ========== REQUEST SUCCESS ==========
```

**❌ If you still see:**
```
[Canada Tire API] Received HTML instead of JSON
```
→ Credentials are still incorrect. Double-check each one.

---

## 📋 Quick Checklist

Before asking for help, verify:

- [ ] All 8 secrets are set in Supabase Dashboard
- [ ] Realm matches URL environment (both sandbox or both production)
- [ ] No typos or extra spaces in any credential
- [ ] Consumer Key and Secret are a matched pair
- [ ] Token ID and Secret are a matched pair
- [ ] All credentials from same environment
- [ ] Function redeployed after setting secrets
- [ ] Logs checked for configuration details

---

## 🎯 Expected Timeline

Once credentials are correct:
1. Set secrets: **1 minute**
2. Redeploy function: **30 seconds**
3. Test request: **2 seconds**
4. See results: **Immediate**

**Total: ~2 minutes from fix to working**

---

## 📞 Still Stuck?

If you've verified everything above and it still fails:

### Share These Details:

1. **Log output from:**
   ```bash
   supabase functions logs distributor
   ```
   (Make sure to mask actual credential values with `***`)

2. **Which environment:** Sandbox or Production?

3. **Realm value:** What's set in your secrets?

4. **Base URL value:** What's set in your secrets?

5. **Credential lengths from logs:**
   - Consumer Key length: ?
   - Token ID length: ?

This information will immediately identify the issue.

---

## 🚀 Most Likely Fix

**90% of "HTML instead of JSON" errors are fixed by:**

```bash
# Set correct realm for your environment
supabase secrets set CANADA_TIRE_REALM="8031691_SB1"  # for sandbox

# Ensure base URL matches
supabase secrets set CANADA_TIRE_BASE_URL="https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting"

# Redeploy
supabase functions deploy distributor --no-verify-jwt

# Test
# Go to http://localhost:5173/canada-tire and click Search
```

**Check logs immediately to confirm!**
