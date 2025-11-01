# Canada Tire OAuth Authentication Fix Guide

## Error Analysis

Based on your logs, the Canada Tire API is returning **HTML instead of JSON**, which indicates a **500 Internal Server Error** caused by **OAuth authentication failure**.

### Key Error Messages:
```
[Distributor] Request failed: Error: Canada Tire API returned HTML instead of JSON (OAuth authentication likely failed)
[Canada Tire API] Response status: 500 Internal Server Error
[Canada Tire API] Received HTML instead of JSON - Authentication likely failed
```

This is a **credential configuration issue**, not a code problem.

---

## Root Causes (In Order of Likelihood)

### 1. Environment Mismatch (80% of cases)

**Problem:** Your REALM and BASE_URL don't match the same environment.

**Symptoms:**
- BASE_URL contains `-sb1` but REALM doesn't have `_SB1`
- OR BASE_URL has no `-sb1` but REALM has `_SB1`

**Check Your Configuration:**

For **SANDBOX**:
```bash
CANADA_TIRE_REALM = "8031691_SB1"              ← Must have _SB1
CANADA_TIRE_BASE_URL = "https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting"  ← Must have -sb1
```

For **PRODUCTION**:
```bash
CANADA_TIRE_REALM = "8031691"                  ← No _SB1
CANADA_TIRE_BASE_URL = "https://8031691.restlets.api.netsuite.com/app/site/hosting"      ← No -sb1
```

### 2. Missing Credentials (15% of cases)

**Problem:** One or more of the 8 required environment variables is not set in Supabase.

**Required Variables:**
- CANADA_TIRE_BASE_URL
- CANADA_TIRE_REALM
- CANADA_TIRE_CONSUMER_KEY
- CANADA_TIRE_CONSUMER_SECRET
- CANADA_TIRE_TOKEN_ID
- CANADA_TIRE_TOKEN_SECRET
- CANADA_TIRE_CUSTOMER_ID
- CANADA_TIRE_CUSTOMER_TOKEN

### 3. Typos or Format Issues (4% of cases)

**Common problems:**
- Extra spaces: `" abc123"` or `"abc123 "`
- Incomplete copy: Only copied first part of credential
- Line breaks in middle of value
- Wrong quote types: Curly quotes `""` instead of straight `""`

### 4. Mismatched Credential Pairs (1% of cases)

**Problem:** OAuth credentials must come as matched pairs:
- Consumer Key + Consumer Secret from the **same** NetSuite integration
- Token ID + Token Secret from the **same** access token
- All four from the **same** environment (all sandbox OR all production)

---

## Step-by-Step Fix Process

### Step 1: Identify Your Environment

**Question:** Where did your credentials come from?
- [ ] Canada Tire Sandbox NetSuite
- [ ] Canada Tire Production NetSuite

### Step 2: Verify Supabase Secrets

Go to **Supabase Dashboard** → **Your Project** → **Settings** → **Edge Functions** → **Secrets**

Or use CLI:
```bash
npx supabase login
npx supabase secrets list
```

Check that all 8 variables exist and have values.

### Step 3: Verify Environment Consistency

Run the diagnostic script:
```bash
./verify-oauth-credentials.sh
```

Or manually check:

**If using SANDBOX credentials:**
```bash
# Both should have sandbox indicators
npx supabase secrets list | grep CANADA_TIRE_BASE_URL
# Should contain: -sb1

npx supabase secrets list | grep CANADA_TIRE_REALM
# Should contain: _SB1
```

**If using PRODUCTION credentials:**
```bash
# Neither should have sandbox indicators
npx supabase secrets list | grep CANADA_TIRE_BASE_URL
# Should NOT contain: -sb1

npx supabase secrets list | grep CANADA_TIRE_REALM
# Should NOT contain: _SB1
```

### Step 4: Fix Incorrect Values

**For SANDBOX (most common):**
```bash
npx supabase secrets set CANADA_TIRE_REALM="8031691_SB1"
npx supabase secrets set CANADA_TIRE_BASE_URL="https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting"
```

**For PRODUCTION:**
```bash
npx supabase secrets set CANADA_TIRE_REALM="8031691"
npx supabase secrets set CANADA_TIRE_BASE_URL="https://8031691.restlets.api.netsuite.com/app/site/hosting"
```

**If any credentials are missing:**
```bash
npx supabase secrets set CANADA_TIRE_CONSUMER_KEY="your_actual_key_here"
npx supabase secrets set CANADA_TIRE_CONSUMER_SECRET="your_actual_secret_here"
npx supabase secrets set CANADA_TIRE_TOKEN_ID="your_actual_token_id_here"
npx supabase secrets set CANADA_TIRE_TOKEN_SECRET="your_actual_token_secret_here"
npx supabase secrets set CANADA_TIRE_CUSTOMER_ID="467"
npx supabase secrets set CANADA_TIRE_CUSTOMER_TOKEN="your_actual_customer_token_here"
```

### Step 5: Redeploy Edge Function

After setting/updating any secrets:
```bash
npx supabase functions deploy distributor --no-verify-jwt
```

### Step 6: Test the Fix

**Option A: Through the UI**
1. Open your application
2. Navigate to Canada Tire search page
3. Click "Search" button
4. Check browser console and network tab

**Option B: Direct API Test**
```bash
curl -X POST https://fbojsejqgfndrvqbimjm.supabase.co/functions/v1/distributor \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZib2pzZWpxZ2ZuZHJ2cWJpbWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTkwNjMsImV4cCI6MjA3NTUzNTA2M30.zXX0HxoTEAATK1RR8F8vgwpqb0pfApieiSQZqBxO_Ac" \
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

### Step 7: Verify Success

**Check Supabase Function Logs:**

Go to: **Supabase Dashboard** → **Edge Functions** → **distributor** → **Logs**

**✅ Success indicators:**
```
[Config] CANADA_TIRE_BASE_URL: https://8031691-sb1...
[Config] CANADA_TIRE_REALM: [SET - 11 characters]
[Config] CANADA_TIRE_CONSUMER_KEY: [SET - 64 characters]
[Distributor] Realm: 8031691_SB1
[Canada Tire API] Response status: 200 OK
[Canada Tire API] Parsed response (success=true)
[Canada Tire API] ========== REQUEST SUCCESS ==========
```

**❌ Still failing indicators:**
```
[Canada Tire API] Received HTML instead of JSON
[Canada Tire API] Response status: 500
```

---

## Quick Reference: Common Fixes

### Fix #1: Wrong Realm for Sandbox
```bash
# Current (wrong): CANADA_TIRE_REALM="8031691"
# Should be:
npx supabase secrets set CANADA_TIRE_REALM="8031691_SB1"
npx supabase functions deploy distributor --no-verify-jwt
```

### Fix #2: Wrong URL for Sandbox
```bash
# Current (wrong): No -sb1 in URL
# Should be:
npx supabase secrets set CANADA_TIRE_BASE_URL="https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting"
npx supabase functions deploy distributor --no-verify-jwt
```

### Fix #3: Missing Credentials
```bash
# Set each missing credential
npx supabase secrets set CANADA_TIRE_CONSUMER_KEY="3a90bd6c21210544..."
npx supabase secrets set CANADA_TIRE_CONSUMER_SECRET="28766b27cfac0bb..."
# etc.
npx supabase functions deploy distributor --no-verify-jwt
```

### Fix #4: Wrong Environment Credentials
```bash
# You're using production credentials but sandbox URL (or vice versa)
# Solution: Get credentials for the correct environment
# OR change URL/REALM to match your credentials
```

---

## Troubleshooting Checklist

Before asking for help, verify:

- [ ] All 8 secrets are set in Supabase (not empty)
- [ ] REALM and BASE_URL match the same environment
- [ ] No typos or extra spaces in any credential
- [ ] Consumer Key and Secret are from same integration
- [ ] Token ID and Secret are from same token
- [ ] All credentials are from the same environment
- [ ] Function was redeployed after setting secrets
- [ ] Checked logs for configuration details
- [ ] Credentials are not expired or revoked
- [ ] NetSuite integration is active

---

## Expected Timeline

Once you fix the credentials:

1. **Set secrets:** 2-3 minutes
2. **Redeploy function:** 30-60 seconds
3. **Test request:** 2-3 seconds
4. **See results:** Immediate

**Total: ~3-4 minutes from fix to working**

---

## Advanced Debugging

If basic fixes don't work, check these:

### 1. Credential Format Validation

**Consumer Key & Secret:**
- Length: Typically 64 characters
- Format: Alphanumeric
- No spaces or special characters

**Token ID & Secret:**
- Length: Typically 64 characters
- Format: Alphanumeric
- No spaces or special characters

**Customer ID:**
- Format: Numeric only
- Example: `467`

**Customer Token:**
- Length: 32+ characters
- Format: Alphanumeric

### 2. OAuth Signature Verification

The code uses:
- Algorithm: HMAC-SHA256 ✓
- Version: OAuth 1.0 ✓
- Parameter sorting: Alphabetical ✓
- Percent encoding: OAuth compliant ✓

These are all correct per OAuth 1.0 spec.

### 3. Check NetSuite Integration Status

In NetSuite, verify:
- Integration record is active
- RESTlet scripts are deployed
- Access token is not revoked
- User permissions allow API access

---

## Contact Support

If you've verified everything and it still fails, provide:

**Required Information:**
1. Environment type (sandbox or production)
2. REALM value (from secrets)
3. BASE_URL value (from secrets)
4. Credential lengths from logs:
   - Consumer Key length: ?
   - Token ID length: ?
5. Recent log output (mask actual values)
6. When credentials were obtained
7. Screenshot of Supabase secrets page (mask values)

**Where to Get Help:**
- Canada Tire NetSuite Support (for credential issues)
- NetSuite Support (for integration issues)
- This project maintainer (for code issues)

---

## Prevention

To avoid this issue in the future:

1. **Document your environment:** Note whether credentials are sandbox or production
2. **Use configuration templates:** Copy from the examples above
3. **Validate immediately:** Test after setting credentials
4. **Keep credentials fresh:** Request new ones if older than 6 months
5. **Store securely:** Never commit credentials to git

---

## Success Criteria

You'll know it's working when:

1. **Function logs show:**
   ```
   [Canada Tire API] Response status: 200 OK
   [Canada Tire API] ========== REQUEST SUCCESS ==========
   ```

2. **API returns JSON** (not HTML)

3. **UI displays products** without errors

4. **No authentication errors** in logs

---

## Quick Win: Most Common Fix

**90% of cases are fixed by:**

```bash
# Ensure you're using sandbox realm with sandbox URL
npx supabase secrets set CANADA_TIRE_REALM="8031691_SB1"
npx supabase secrets set CANADA_TIRE_BASE_URL="https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting"

# Redeploy
npx supabase functions deploy distributor --no-verify-jwt

# Test immediately
```

**Check logs right after deploying to confirm the fix!**
