# Product Setup Guide

This guide will help you configure Canada Tire API credentials and populate your product database.

## Step 1: Configure Canada Tire API Credentials

You need to add the Canada Tire API credentials as secrets in your Supabase project.

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Click **Add Secret** and add each of the following:

```
CANADA_TIRE_BASE_URL=https://8031691-sb1.restlets.api.netsuite.com
CANADA_TIRE_CONSUMER_KEY=3a90bdb6c212105447e61ee1ea1a307c8046724aafbf233eb49de76799fa0e2
CANADA_TIRE_CONSUMER_SECRET=d0c553e6c20680bea6900d6ff868d8f76297495f1cbb43bfcf1e3327f6e45ef3
CANADA_TIRE_TOKEN_ID=2876eb82fcac0bbf4c98a5302116e3d1384f11dba8163f5de06105f8f00d9be
CANADA_TIRE_TOKEN_SECRET=beb5eff2b0d59f08e20771411ea21953715418c427beb7fa630183f9902b47cc
CANADA_TIRE_CUSTOMER_ID=467
CANADA_TIRE_CUSTOMER_TOKEN=QLAoi#U41&mubDf
```

4. Click **Save** after adding each secret

### Using Supabase CLI (Alternative)

If you have the Supabase CLI installed:

```bash
supabase secrets set CANADA_TIRE_BASE_URL=https://8031691-sb1.restlets.api.netsuite.com
supabase secrets set CANADA_TIRE_CONSUMER_KEY=3a90bdb6c212105447e61ee1ea1a307c8046724aafbf233eb49de76799fa0e2
supabase secrets set CANADA_TIRE_CONSUMER_SECRET=d0c553e6c20680bea6900d6ff868d8f76297495f1cbb43bfcf1e3327f6e45ef3
supabase secrets set CANADA_TIRE_TOKEN_ID=2876eb82fcac0bbf4c98a5302116e3d1384f11dba8163f5de06105f8f00d9be
supabase secrets set CANADA_TIRE_TOKEN_SECRET=beb5eff2b0d59f08e20771411ea21953715418c427beb7fa630183f9902b47cc
supabase secrets set CANADA_TIRE_CUSTOMER_ID=467
supabase secrets set CANADA_TIRE_CUSTOMER_TOKEN=QLAoi#U41&mubDf
```

## Step 2: Test the Distributor Edge Function

After setting up credentials, test the distributor function to ensure Canada Tire API connection works:

```bash
curl -X POST \
  "YOUR_SUPABASE_URL/functions/v1/distributor" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
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

Replace:
- `YOUR_SUPABASE_URL` with your Supabase URL from `.env`
- `YOUR_SUPABASE_ANON_KEY` with your Supabase anon key from `.env`

You should receive a JSON response with tire products if the connection is successful.

## Step 3: Run Initial Product Sync

Once the distributor function works, run the sync function to populate your database:

```bash
curl -X POST \
  "YOUR_SUPABASE_URL/functions/v1/sync-products" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"
```

This will:
- Fetch all tires from Canada Tire API
- Parse tire specifications and sizes
- Calculate retail pricing with markup
- Store products in your database
- Return a summary of products added/updated

The sync should take 30-60 seconds depending on the number of products.

## Step 4: Verify Products in Database

You can verify products were added by:

1. **Using Supabase Dashboard:**
   - Go to **Table Editor** → **products**
   - You should see tire products with details

2. **Using your application:**
   - Visit the home page - it should now show featured products
   - Visit `/products` - you should see the full catalog with filters

## Step 5: Set Up Scheduled Syncing (Optional)

To keep inventory fresh, set up a scheduled job:

1. Go to Supabase Dashboard → **Database** → **Cron Jobs**
2. Create a new cron job to call the sync-products function every 4 hours:

```sql
SELECT cron.schedule(
  'sync-canada-tire-products',
  '0 */4 * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/sync-products',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
  )
  $$
);
```

Replace:
- `YOUR_SUPABASE_URL` with your Supabase URL
- `YOUR_SERVICE_ROLE_KEY` with your service role key (keep this secret!)

## Troubleshooting

### Products not showing up

1. Check that Edge Function secrets are set correctly
2. Check sync logs table: `SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;`
3. Look for error messages in the logs

### Pricing looks wrong

The sync function applies a 35% markup to wholesale prices, bounded by 95%-115% of MSRP. You can adjust the markup logic in `supabase/functions/sync-products/index.ts` if needed.

### Images not loading

Currently using a placeholder tire image from Pexels. You can:
1. Add actual tire images to Canada Tire product data
2. Update the `image_url` field in the database
3. Upload images to Supabase Storage and reference them

## Need Help?

- Check the Supabase function logs in the dashboard
- Review the sync_logs table for detailed sync history
- Ensure your Canada Tire API credentials are valid and active
