# Canada Tire API Integration - Testing & Troubleshooting Guide

## Overview

This document provides comprehensive instructions for testing the Canada Tire API integration, understanding the fixes implemented, and troubleshooting common issues.

## What Was Fixed

### 1. **Replaced Inline Adapter with Validated Version**

**Problem:** The distributor Edge Function (`supabase/functions/distributor/index.ts`) contained a simplified inline adapter that bypassed all validation logic. This caused malformed requests to be sent to the Canada Tire API, resulting in 400/401 errors.

**Solution:** Refactored the distributor function to import and use the validated `createCanadaTireAdapter` from `_shared/vendors/canadaTire.ts`, which includes:
- Type validation for all filter parameters
- Proper handling of empty strings and undefined values
- Array validation for `partNumber` field
- Boolean validation to prevent empty strings
- Number type coercion and validation

### 2. **Enhanced Request Validation**

**Key Improvements:**
- `partNumber` must be an array of non-empty strings or completely omitted
- Boolean fields (`isWinter`, `isTire`, etc.) are only sent when explicitly true/false
- Empty strings are converted to `undefined` and omitted from the request
- Numeric fields are validated and coerced to proper number types
- Filters object is only included when it contains actual values

### 3. **Added Debug Logging and Environment Validation**

**Features:**
- Environment variable `DEBUG=true` enables verbose logging
- Logs OAuth parameters, request payloads, and response data
- Validates all required environment variables on startup
- Logs configuration including base URL, realm, and customer ID
- CORS headers added for frontend compatibility

### 4. **Frontend Service Wrapper**

**Created:** `src/services/canadaTire.ts`
- Clean API for calling Canada Tire functions
- Automatic filter cleaning and validation
- Type-safe request/response interfaces
- Error handling with detailed messages
- Debug logging in development mode

### 5. **Test UI Component**

**Created:** `src/components/product/CanadaTireSearch.tsx`
- Full-featured search interface
- All filter options available
- Real-time results display
- Error handling and user feedback
- Accessible at `/canada-tire` route

## Testing Instructions

### Prerequisites

1. **Environment Variables:** Ensure all Canada Tire credentials are set in your Supabase project:
   ```bash
   supabase secrets set CANADA_TIRE_BASE_URL="https://..."
   supabase secrets set CANADA_TIRE_REALM="8031691_SB1"
   supabase secrets set CANADA_TIRE_CONSUMER_KEY="..."
   supabase secrets set CANADA_TIRE_CONSUMER_SECRET="..."
   supabase secrets set CANADA_TIRE_TOKEN_ID="..."
   supabase secrets set CANADA_TIRE_TOKEN_SECRET="..."
   supabase secrets set CANADA_TIRE_CUSTOMER_ID="..."
   supabase secrets set CANADA_TIRE_CUSTOMER_TOKEN="..."
   ```

2. **Deploy Edge Function:**
   ```bash
   supabase functions deploy distributor --no-verify-jwt
   ```

### Test Sequence

#### Test 1: Minimal Search (Empty Filters)
Navigate to `/canada-tire` and click "Search" without entering any filters.

**Expected Result:**
- Should return available products with default filtering (isTire: true)
- No 400/401 errors
- Products displayed in table format

#### Test 2: Single Filter
Add just one filter (e.g., Brand: "PIRELLI") and search.

**Expected Result:**
- Returns products matching the single filter
- Request includes only the specified filter

#### Test 3: Multiple Filters
Add multiple filters:
- Brand: PIRELLI
- Width: 225
- Rim Size: 17
- Winter: checked

**Expected Result:**
- Returns products matching all criteria
- All filters properly sent in request

#### Test 4: Numeric Filters
Test with numeric values:
- Width: 225
- Aspect Ratio: 45
- Rim Size: 17

**Expected Result:**
- Numbers properly sent as numeric types (not strings)
- No validation errors

#### Test 5: Boolean Filters
Test each checkbox independently:
- Winter only
- Run Flat only
- Tire only
- Wheel only

**Expected Result:**
- Boolean values sent as true/false (not empty strings)
- Unchecked boxes don't send the field

### Using Browser DevTools

1. Open Developer Console (F12)
2. Go to Network tab
3. Filter by "distributor" to see API calls
4. Inspect request payload and response

**Good Request Example:**
```json
{
  "vendor": "canadaTire",
  "action": "searchProducts",
  "payload": {
    "filters": {
      "brand": "PIRELLI",
      "width": 225,
      "rimSize": 17,
      "isWinter": true,
      "isTire": true
    }
  }
}
```

**Good Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "partNumber": "12345",
      "name": "Pirelli Winter Tire",
      "brand": "PIRELLI",
      "size": "225/45R17",
      "cost": "150.00",
      "msrp": "200.00",
      "isWinter": true,
      "isTire": true,
      ...
    }
  ]
}
```

## Troubleshooting

### Issue: 400 Bad Request

**Possible Causes:**
1. Invalid data types (e.g., string instead of number)
2. Empty string sent for optional field
3. partNumber sent as string instead of array
4. Boolean sent as empty string

**Debug Steps:**
1. Check browser console for request payload
2. Enable DEBUG mode on Edge Function
3. Check Supabase logs for validation errors
4. Verify filter values are correct types

**Solution:**
- The new validation should prevent these issues
- If still occurring, check that frontend is using the `canadaTire` service correctly

### Issue: 401 Unauthorized

**Possible Causes:**
1. Invalid OAuth credentials
2. OAuth signature mismatch
3. Expired token
4. Incorrect realm

**Debug Steps:**
1. Verify all environment variables are set
2. Check Supabase function logs for OAuth errors
3. Verify base URL matches realm (sandbox vs production)
4. Check token expiration

**Solution:**
```bash
# Re-set credentials
supabase secrets set CANADA_TIRE_CONSUMER_KEY="correct_key"
supabase secrets set CANADA_TIRE_TOKEN_ID="correct_token"
# Redeploy function
supabase functions deploy distributor --no-verify-jwt
```

### Issue: 500 Server Error

**Possible Causes:**
1. Missing environment variables
2. Malformed base URL
3. Network timeout
4. NetSuite API down

**Debug Steps:**
1. Check function logs: `supabase functions logs distributor`
2. Verify environment variables: Check Supabase dashboard
3. Test with minimal request (no filters)

**Solution:**
- Verify all env vars are set
- Check base URL format (must include protocol)
- Increase timeout if needed

### Issue: Empty Results

**Possible Causes:**
1. Filters too restrictive
2. No products match criteria
3. Inventory not available

**Debug Steps:**
1. Try with no filters
2. Relax filter criteria
3. Check if specific products exist in Canada Tire catalog

**Solution:**
- Start with broad search (no filters)
- Add filters incrementally
- Verify product availability with Canada Tire

### Issue: CORS Errors

**Possible Causes:**
1. Missing CORS headers in Edge Function
2. Incorrect OPTIONS handling

**Debug Steps:**
1. Check browser console for CORS error details
2. Verify Edge Function includes CORS headers
3. Check if OPTIONS request returns 200

**Solution:**
- CORS headers are now included in the fixed version
- If still occurring, verify Edge Function deployment

## Debug Mode

To enable detailed logging:

1. **Edge Function:**
   ```bash
   supabase secrets set DEBUG="true"
   supabase functions deploy distributor --no-verify-jwt
   ```

2. **Check Logs:**
   ```bash
   supabase functions logs distributor --tail
   ```

3. **Frontend:**
   - Debug logging automatically enabled in development mode
   - Check browser console for detailed request/response logs

## API Request Format

### Search Products
```typescript
{
  vendor: "canadaTire",
  action: "searchProducts",
  payload: {
    filters?: {
      width?: number;           // e.g., 225
      rimSize?: number;         // e.g., 17
      aspectRatio?: number;     // e.g., 45
      size?: string;            // e.g., "225/45R17"
      partNumber?: string[];    // e.g., ["12345", "67890"]
      brand?: string;           // e.g., "PIRELLI"
      searchKey?: string;       // General search term
      isWinter?: boolean;       // true or false only
      isRunFlat?: boolean;      // true or false only
      isTire?: boolean;         // true or false only
      isWheel?: boolean;        // true or false only
      page?: number;            // e.g., 1
    }
  }
}
```

### Get Shipping Addresses
```typescript
{
  vendor: "canadaTire",
  action: "getShipToAddresses",
  payload: {}
}
```

### Submit Order
```typescript
{
  vendor: "canadaTire",
  action: "submitOrder",
  payload: {
    orderDetails: {
      location: string;         // Required
      poNumber?: string;
      email?: string;
      phone?: string;
      shipping: {
        addrId?: number;        // Use address ID OR full address
        addr1?: string;
        addr2?: string;
        city?: string;
        province?: string;
        postalCode?: string;
        country?: string;
        attention?: string;
        addressee?: string;
      },
      items: [
        {
          partNumber: string;   // Required
          quantity: number;     // Required, must be > 0
        }
      ]
    }
  }
}
```

## Best Practices

1. **Start Simple:** Begin with minimal filters and add complexity incrementally
2. **Validate Input:** Always validate user input before sending to API
3. **Handle Errors:** Display user-friendly error messages
4. **Log Requests:** In development, log all requests for debugging
5. **Monitor Logs:** Regularly check Supabase function logs for issues
6. **Test Thoroughly:** Test all filter combinations before production use
7. **Cache Results:** Consider caching search results to reduce API calls
8. **Rate Limiting:** Be mindful of API rate limits

## Performance Tips

1. **Debounce Searches:** Wait for user to finish typing before searching
2. **Limit Results:** Use pagination to avoid large payloads
3. **Cache Filter Options:** Cache brands and sizes to reduce database queries
4. **Optimize Filters:** Use more specific filters to reduce result sets
5. **Monitor Timeouts:** Default timeout is 30s, adjust if needed

## Security Notes

1. **Never expose credentials:** All credentials must be in Supabase secrets
2. **Use environment variables:** Never hardcode API keys
3. **Validate input:** All input is validated before sending to API
4. **Use HTTPS:** Always use secure connections
5. **Audit logs:** Regularly review function logs for suspicious activity

## Next Steps

1. **Product Sync:** Create a scheduled function to sync Canada Tire products to local database
2. **Caching Layer:** Implement caching to reduce API calls and improve performance
3. **Order Management:** Integrate order submission with frontend checkout flow
4. **Monitoring:** Set up alerts for API failures or errors
5. **Analytics:** Track search patterns and popular filters

## Support

For issues not covered in this guide:
1. Check Supabase function logs: `supabase functions logs distributor`
2. Enable DEBUG mode for detailed logging
3. Review the Canada Tire API documentation
4. Contact Canada Tire support for API-specific issues
