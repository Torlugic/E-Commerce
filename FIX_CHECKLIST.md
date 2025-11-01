# OAuth Fix Checklist ✓

## Quick Status Check

Run this first:
```bash
./verify-oauth-credentials.sh
```

---

## Step-by-Step Fix

### Step 1: Identify Environment
- [ ] My credentials are from: **Sandbox** ☐ or **Production** ☐

### Step 2: Set Correct REALM and BASE_URL

**If Sandbox:**
```bash
npx supabase secrets set CANADA_TIRE_REALM="8031691_SB1"
npx supabase secrets set CANADA_TIRE_BASE_URL="https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting"
```
- [ ] REALM set with `_SB1` suffix
- [ ] URL contains `-sb1`

**If Production:**
```bash
npx supabase secrets set CANADA_TIRE_REALM="8031691"
npx supabase secrets set CANADA_TIRE_BASE_URL="https://8031691.restlets.api.netsuite.com/app/site/hosting"
```
- [ ] REALM has NO `_SB1` suffix
- [ ] URL has NO `-sb1`

### Step 3: Verify All 8 Secrets Are Set

```bash
npx supabase secrets list
```

Check for:
- [ ] CANADA_TIRE_BASE_URL
- [ ] CANADA_TIRE_REALM
- [ ] CANADA_TIRE_CONSUMER_KEY
- [ ] CANADA_TIRE_CONSUMER_SECRET
- [ ] CANADA_TIRE_TOKEN_ID
- [ ] CANADA_TIRE_TOKEN_SECRET
- [ ] CANADA_TIRE_CUSTOMER_ID
- [ ] CANADA_TIRE_CUSTOMER_TOKEN

**If any are missing, set them:**
```bash
npx supabase secrets set SECRET_NAME="secret_value"
```

### Step 4: Deploy Function

```bash
npx supabase functions deploy distributor --no-verify-jwt
```
- [ ] Deployment completed successfully
- [ ] No errors in deployment output

### Step 5: Test Integration

```bash
./test-canada-tire-api.sh
```

**Expected output:**
- [ ] ✓ SUCCESS: API returned valid JSON response
- [ ] ✓ OAuth authentication is working
- [ ] Products returned: (some number > 0)

### Step 6: Verify in Supabase Dashboard

Go to: **Supabase Dashboard → Functions → distributor → Logs**

**Look for:**
- [ ] `[Canada Tire API] Response status: 200 OK`
- [ ] `[Canada Tire API] ========== REQUEST SUCCESS ==========`
- [ ] `[Distributor] Realm: 8031691_SB1` (or `8031691` for production)

### Step 7: Test UI

1. Open your application
2. Navigate to Canada Tire search page
3. Click "Search"

**Verify:**
- [ ] Products load without errors
- [ ] No console errors
- [ ] Product details display correctly

---

## Troubleshooting

### If Test Still Fails

**Error: "Received HTML instead of JSON"**
- [ ] Double-check REALM matches URL environment
- [ ] Verify no typos in credentials
- [ ] Confirm credentials are from correct environment
- [ ] Check credentials are not expired

**Error: "Missing environment variable"**
- [ ] Set the missing secret
- [ ] Redeploy function
- [ ] Test again

**Error: "Invalid JSON response"**
- [ ] Check Supabase function logs for details
- [ ] Verify credentials have no extra spaces
- [ ] Confirm credentials are complete (not truncated)

### Get Help

1. Run: `./verify-oauth-credentials.sh`
2. Read: `OAUTH_FIX_GUIDE.md`
3. Check: Supabase Dashboard logs
4. Share: Log output (mask credential values)

---

## Success Criteria

You're done when you see:

✓ Test script passes all checks
✓ Function logs show 200 OK
✓ UI displays products
✓ No authentication errors

---

## Quick Commands Reference

```bash
# Check secrets
npx supabase secrets list

# Set a secret
npx supabase secrets set SECRET_NAME="value"

# Deploy function
npx supabase functions deploy distributor --no-verify-jwt

# Test integration
./test-canada-tire-api.sh

# Verify credentials
./verify-oauth-credentials.sh

# View logs
# (Use Supabase Dashboard)
```

---

## Most Common Fix (90% of cases)

```bash
# For sandbox
npx supabase secrets set CANADA_TIRE_REALM="8031691_SB1"
npx supabase secrets set CANADA_TIRE_BASE_URL="https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting"
npx supabase functions deploy distributor --no-verify-jwt
./test-canada-tire-api.sh
```

**Check the test output immediately!**

---

**Print this checklist and mark items as you complete them.**
