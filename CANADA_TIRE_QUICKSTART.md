# Canada Tire API Integration - Quick Start

## 🚀 Get Started in 5 Minutes

### 1. Deploy the Edge Function

```bash
supabase functions deploy distributor --no-verify-jwt
```

### 2. Test in Browser

Start the dev server:
```bash
npm run dev
```

Navigate to: **http://localhost:5173/canada-tire**

### 3. Run a Search

1. Leave filters at defaults (Tire checkbox = checked)
2. Click **Search**
3. View results in the table

**Expected:** Products displayed with no errors

---

## ✅ What Was Fixed

The integration had **critical validation issues** causing 400/401 errors:

| Problem | Solution |
|---------|----------|
| Empty strings sent for optional fields | Now omitted entirely |
| `partNumber` sent as string | Now sent as array or omitted |
| Numbers sent as strings | Now properly typed as numbers |
| Booleans sent as empty strings | Now sent as true/false only |
| No validation logic | Full validation in place |

---

## 🔧 Quick Test Commands

### Test with curl:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/distributor \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "canadaTire",
    "action": "searchProducts",
    "payload": {
      "filters": {
        "brand": "PIRELLI",
        "rimSize": 17,
        "isTire": true
      }
    }
  }'
```

### Test from frontend:
```typescript
import { searchProducts } from './services/canadaTire';

const results = await searchProducts({
  brand: "PIRELLI",
  rimSize: 17,
  isTire: true
});
```

---

## 🐛 Debug Mode

Enable detailed logging:

```bash
supabase secrets set DEBUG="true"
supabase functions deploy distributor --no-verify-jwt
supabase functions logs distributor --tail
```

---

## 📊 Test Results Expected

### Minimal Search (default filters)
```
Request: { "filters": { "isTire": true } }
Response: 200 OK, ~50-200 products
```

### Filtered Search
```
Request: { "filters": { "brand": "PIRELLI", "rimSize": 17 } }
Response: 200 OK, ~10-50 products
```

### Complex Search
```
Request: {
  "filters": {
    "brand": "PIRELLI",
    "width": 225,
    "rimSize": 17,
    "isWinter": true
  }
}
Response: 200 OK, ~5-20 products
```

---

## 🔥 Common Issues

### Issue: 400 Bad Request
**Fix:** Ensure filters use correct types (numbers as numbers, not strings)

### Issue: 401 Unauthorized
**Fix:** Verify all environment variables are set in Supabase

### Issue: Empty Results
**Fix:** Relax filter criteria (try brand only first)

---

## 📚 Full Documentation

- **[Integration Summary](./docs/CANADA_TIRE_INTEGRATION_SUMMARY.md)** - Complete overview
- **[Testing Guide](./docs/CANADA_TIRE_TESTING.md)** - Comprehensive testing instructions
- **[Fix Details](./docs/CANADA_TIRE_FIXES.md)** - Technical implementation details

---

## ✨ New Features

1. **Frontend Service:** `src/services/canadaTire.ts`
2. **Test UI:** Available at `/canada-tire` route
3. **Type Safety:** Full TypeScript support
4. **Debug Logging:** Enable with `DEBUG=true`
5. **CORS Support:** Frontend integration ready

---

## 🎯 Quick Validation

Run this checklist:

- [ ] Edge Function deployed
- [ ] Dev server running
- [ ] Navigate to `/canada-tire` page
- [ ] Click "Search" button
- [ ] Products displayed in table
- [ ] No errors in console

**If all checked:** ✅ Integration working!

---

## 🚨 Need Help?

1. Check browser console for errors
2. Enable DEBUG mode (see above)
3. Review [Testing Guide](./docs/CANADA_TIRE_TESTING.md)
4. Check Supabase function logs

---

**That's it!** The integration is now ready to use. 🎉
