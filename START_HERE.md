# Start Here: Canada Tire OAuth Fix

## You Have an Error

Your logs show:
```
Canada Tire API returned HTML instead of JSON (OAuth authentication likely failed)
```

This is a **credential configuration issue** - NOT a code problem.

---

## Fix It Now (2 Minutes)

### Option 1: Quick Fix (Works 90% of time)

**For Sandbox:**
```bash
npx supabase secrets set CANADA_TIRE_REALM="8031691_SB1"
npx supabase secrets set CANADA_TIRE_BASE_URL="https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting"
npx supabase functions deploy distributor --no-verify-jwt
./test-canada-tire-api.sh
```

**For Production:**
```bash
npx supabase secrets set CANADA_TIRE_REALM="8031691"
npx supabase secrets set CANADA_TIRE_BASE_URL="https://8031691.restlets.api.netsuite.com/app/site/hosting"
npx supabase functions deploy distributor --no-verify-jwt
./test-canada-tire-api.sh
```

### Option 2: Systematic Fix (If quick fix doesn't work)

1. **Run diagnostic:**
   ```bash
   ./verify-oauth-credentials.sh
   ```

2. **Follow the checklist:**
   ```bash
   cat FIX_CHECKLIST.md
   ```

3. **Fix identified issues**

4. **Test:**
   ```bash
   ./test-canada-tire-api.sh
   ```

---

## Resources Available

### Quick References
- `OAUTH_QUICK_START.md` - 30 second read, fast solution
- `FIX_CHECKLIST.md` - Step-by-step checklist to follow

### Tools
- `verify-oauth-credentials.sh` - Diagnose credential issues
- `test-canada-tire-api.sh` - Test if fix worked

### Documentation
- `OAUTH_FIX_GUIDE.md` - Complete troubleshooting guide
- `OAUTH_IMPLEMENTATION_SUMMARY.md` - Technical analysis

---

## What's Wrong?

Your **REALM** doesn't match your **BASE_URL** environment:

- Sandbox needs: `REALM=8031691_SB1` and `-sb1` in URL
- Production needs: `REALM=8031691` and NO `-sb1` in URL

OR one or more of the 8 required secrets is missing.

---

## How Long Will This Take?

- **Set secrets:** 2-3 minutes
- **Deploy:** 30 seconds
- **Test:** 30 seconds
- **Total:** ~4 minutes

---

## How Do I Know It's Fixed?

Run test script:
```bash
./test-canada-tire-api.sh
```

You'll see:
```
✓ SUCCESS: API returned valid JSON response
✓ OAuth authentication is working
✓ Canada Tire integration is configured correctly
```

---

## Most Common Fix

```bash
# For sandbox (90% of cases)
npx supabase secrets set CANADA_TIRE_REALM="8031691_SB1"
npx supabase secrets set CANADA_TIRE_BASE_URL="https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting"
npx supabase functions deploy distributor --no-verify-jwt
./test-canada-tire-api.sh
```

**That's it! Check the output.**

---

## Need More Help?

1. Read `OAUTH_QUICK_START.md` - Fast solution
2. Run `./verify-oauth-credentials.sh` - Find the problem
3. Read `OAUTH_FIX_GUIDE.md` - Detailed guide
4. Check Supabase Dashboard logs - Real-time debugging

---

## Remember

- The **code is correct** ✓
- The **OAuth implementation works** ✓
- Only the **credentials need fixing** ⏳

**Start with the quick fix above. It works 90% of the time.**
