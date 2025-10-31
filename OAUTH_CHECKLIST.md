# OAuth Authentication Failure - Debugging Checklist

## 🔴 Current Error
```
Canada Tire API returned HTML instead of JSON (OAuth authentication likely failed)
```

This means NetSuite is rejecting your OAuth credentials and returning an error page.

---

## ✅ Step-by-Step Diagnosis

### Step 1: Verify All Secrets Are Set

Go to **Supabase Dashboard → Your Project → Edge Functions → Secrets**

Check that ALL 8 variables exist:

- [ ] `CANADA_TIRE_BASE_URL`
- [ ] `CANADA_TIRE_REALM`
- [ ] `CANADA_TIRE_CONSUMER_KEY`
- [ ] `CANADA_TIRE_CONSUMER_SECRET`
- [ ] `CANADA_TIRE_TOKEN_ID`
- [ ] `CANADA_TIRE_TOKEN_SECRET`
- [ ] `CANADA_TIRE_CUSTOMER_ID`
- [ ] `CANADA_TIRE_CUSTOMER_TOKEN`

**If any are missing:** Set them immediately.

---

### Step 2: Verify Realm Matches Environment

#### For SANDBOX:
- [ ] `CANADA_TIRE_REALM` = `8031691_SB1`
- [ ] `CANADA_TIRE_BASE_URL` = `https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting`
- [ ] Note the `-sb1` in the URL

#### For PRODUCTION:
- [ ] `CANADA_TIRE_REALM` = `8031691`
- [ ] `CANADA_TIRE_BASE_URL` = `https://8031691.restlets.api.netsuite.com/app/site/hosting`
- [ ] Note: NO `-sb1` in the URL

**❌ Common Mistake:** Using sandbox realm with production URL (or vice versa)

---

### Step 3: Verify Credential Format

Check each credential for:

#### Base URL:
- [ ] Starts with `https://`
- [ ] No trailing slash
- [ ] Contains `-sb1` only if sandbox

#### Consumer Key:
- [ ] No extra spaces before/after
- [ ] Typically 64 characters long
- [ ] Alphanumeric string

#### Consumer Secret:
- [ ] No extra spaces before/after
- [ ] Typically 64 characters long
- [ ] Alphanumeric string

#### Token ID:
- [ ] No extra spaces before/after
- [ ] Typically 64 characters long
- [ ] Alphanumeric string

#### Token Secret:
- [ ] No extra spaces before/after
- [ ] Typically 64 characters long
- [ ] Alphanumeric string

#### Customer ID:
- [ ] Numeric only
- [ ] Typically 7 digits
- [ ] Example: `1234567`

#### Customer Token:
- [ ] No extra spaces before/after
- [ ] Typically 32+ characters
- [ ] Alphanumeric string

---

### Step 4: Check Credential Pairing

OAuth credentials must come in matched pairs from the SAME source:

- [ ] Consumer Key and Consumer Secret are from the same integration
- [ ] Token ID and Token Secret are from the same token
- [ ] All four OAuth credentials are from the same environment (sandbox OR production, not mixed)

**❌ Common Mistake:** Mixing credentials from different integrations or environments

---

### Step 5: Verify No Typos

Common copy-paste issues:

- [ ] No extra quotes around values
- [ ] No line breaks in the middle of credentials
- [ ] No spaces at beginning or end
- [ ] Using straight quotes `"` not curly quotes `""`
- [ ] All characters copied (not truncated)

---

### Step 6: Check Credential Age

OAuth tokens can expire:

- [ ] Credentials obtained recently (within last 6 months)
- [ ] Tokens still active in NetSuite
- [ ] Integration still enabled in Canada Tire's NetSuite account

**If credentials are old:** Request new ones from Canada Tire

---

## 🔧 How to Fix

### If Credentials Are Wrong:

```bash
# Set/update the incorrect credential(s)
supabase secrets set CANADA_TIRE_REALM="8031691_SB1"
supabase secrets set CANADA_TIRE_BASE_URL="https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting"

# Redeploy the function
supabase functions deploy distributor --no-verify-jwt

# Test and watch logs
supabase functions logs distributor --tail
```

### If All Credentials Are Correct:

The issue might be with the OAuth signature generation. The enhanced debug logs will show:

```
[Canada Tire API] OAuth Header (masked): OAuth realm="...",oauth_consumer_key="...",oauth_signature="***"
```

Check that the header includes all required parameters.

---

## 📊 What the Debug Logs Should Show

### ✅ Successful Configuration:

```
[Config] Verifying environment variables...
[Config] CANADA_TIRE_BASE_URL: https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting
[Config] CANADA_TIRE_REALM: [SET - 11 characters]
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
```

### ❌ If You See This:

```
[Config] MISSING: CANADA_TIRE_CONSUMER_KEY
```
→ **Action:** Set the missing variable

```
[Distributor] Realm: 8031691
[Distributor] Base URL: https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting
```
→ **Action:** Realm mismatch! Should be `8031691_SB1` for sandbox URL

```
[Distributor] Consumer Key length: 32
```
→ **Action:** Key seems too short, verify correct value

```
[Canada Tire API] Received HTML instead of JSON
```
→ **Action:** OAuth failed, double-check all credentials

---

## 🧪 Test After Fixing

1. **Redeploy:**
   ```bash
   supabase functions deploy distributor --no-verify-jwt
   ```

2. **Make test request** at: http://localhost:5173/canada-tire

3. **Check logs:**
   ```bash
   supabase functions logs distributor --tail
   ```

4. **Look for:**
   - `[Canada Tire API] Response status: 200 OK` ✅
   - `[Canada Tire API] ========== REQUEST SUCCESS ==========` ✅

---

## 🆘 Still Not Working?

If you've verified all the above and it still fails:

### 1. Get Exact Log Output

```bash
supabase functions logs distributor --tail
```

Look for these specific sections and note what they say:
- Configuration section (are all variables set?)
- OAuth header (is it being generated?)
- Response status (what HTTP code?)
- Response body (what does the HTML error say?)

### 2. Common Advanced Issues

**OAuth Signature Algorithm:**
- Our code uses HMAC-SHA256 (correct)
- Verify Canada Tire expects HMAC-SHA256 (not HMAC-SHA1)

**OAuth Parameter Order:**
- Our code alphabetically sorts parameters (correct)
- This is required by OAuth 1.0 spec

**Timestamp/Nonce:**
- Generated fresh for each request
- Should not be an issue

**Percent Encoding:**
- Our code uses proper OAuth percent encoding
- Handles special characters correctly

### 3. Contact Canada Tire Support

Provide them with:
- Your account ID
- Environment (sandbox/production)
- Request timestamp (from logs)
- Error details (from logs)
- OAuth header (masked signature)

They can check server-side logs and verify:
- Credentials are active
- Integration is enabled
- RESTlet endpoints are deployed
- Account has proper permissions

---

## 📋 Quick Reference

### Sandbox Configuration:
```bash
CANADA_TIRE_BASE_URL="https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting"
CANADA_TIRE_REALM="8031691_SB1"
```

### Production Configuration:
```bash
CANADA_TIRE_BASE_URL="https://8031691.restlets.api.netsuite.com/app/site/hosting"
CANADA_TIRE_REALM="8031691"
```

### After Any Change:
```bash
supabase functions deploy distributor --no-verify-jwt
supabase functions logs distributor --tail
```

---

## ✅ Success Criteria

You'll know it's working when logs show:

```
[Canada Tire API] ========== REQUEST START ==========
[Canada Tire API] Response status: 200 OK
[Canada Tire API] Parsed response (success=true)
[Canada Tire API] ========== REQUEST SUCCESS ==========
```

And the `/canada-tire` page displays products without errors.
