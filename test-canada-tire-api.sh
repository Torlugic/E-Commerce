#!/bin/bash

# Test script for Canada Tire API integration
# Tests the distributor Edge Function to verify OAuth is working

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "========================================"
echo "Canada Tire API Integration Test"
echo "========================================"
echo ""

# Check if required env vars are set
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo -e "${RED}ERROR${NC}: VITE_SUPABASE_URL not set in .env"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}ERROR${NC}: VITE_SUPABASE_ANON_KEY not set in .env"
    exit 1
fi

FUNCTION_URL="${VITE_SUPABASE_URL}/functions/v1/distributor"

echo "Testing endpoint: ${FUNCTION_URL}"
echo ""

# Test 1: Search Products (with filters)
echo "Test 1: Searching for tires..."
echo "-------------------------------------------"

RESPONSE=$(curl -s -X POST "${FUNCTION_URL}" \
  -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "canadaTire",
    "action": "searchProducts",
    "payload": {
      "filters": {
        "isTire": true
      }
    }
  }')

# Check if response is HTML (error) or JSON (success)
if echo "$RESPONSE" | grep -q "<!DOCTYPE\|<html\|<HTML"; then
    echo -e "${RED}✗ FAILED${NC}: Received HTML instead of JSON"
    echo ""
    echo "This indicates OAuth authentication failure."
    echo ""
    echo "Response preview:"
    echo "$RESPONSE" | head -20
    echo ""
    echo -e "${YELLOW}Action Required:${NC}"
    echo "1. Check OAUTH_FIX_GUIDE.md for detailed troubleshooting"
    echo "2. Verify your Supabase secrets are correct"
    echo "3. Ensure REALM and BASE_URL match the same environment"
    echo ""
    exit 1
fi

# Try to parse as JSON
if ! echo "$RESPONSE" | jq . > /dev/null 2>&1; then
    echo -e "${RED}✗ FAILED${NC}: Invalid JSON response"
    echo ""
    echo "Response:"
    echo "$RESPONSE"
    exit 1
fi

# Check if success field is true
SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')

if [ "$SUCCESS" == "true" ]; then
    echo -e "${GREEN}✓ SUCCESS${NC}: API returned valid JSON response"
    echo ""

    # Show some results
    DATA_COUNT=$(echo "$RESPONSE" | jq -r '.data | length // 0')
    echo "Products returned: ${DATA_COUNT}"

    if [ "$DATA_COUNT" -gt 0 ]; then
        echo ""
        echo "Sample product:"
        echo "$RESPONSE" | jq -r '.data[0] | {
          partNumber: .partNumber,
          brand: .brand,
          description: .description,
          price: .price
        }'
    fi
else
    echo -e "${RED}✗ FAILED${NC}: API returned success=false"
    echo ""
    ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error.message // "Unknown error"')
    echo "Error: ${ERROR_MSG}"
    echo ""
    echo "Full response:"
    echo "$RESPONSE" | jq .
    exit 1
fi

echo ""
echo "-------------------------------------------"

# Test 2: Search Products (no filters)
echo ""
echo "Test 2: Searching all products..."
echo "-------------------------------------------"

RESPONSE2=$(curl -s -X POST "${FUNCTION_URL}" \
  -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "canadaTire",
    "action": "searchProducts",
    "payload": {}
  }')

SUCCESS2=$(echo "$RESPONSE2" | jq -r '.success // false')

if [ "$SUCCESS2" == "true" ]; then
    echo -e "${GREEN}✓ SUCCESS${NC}: Search without filters works"
    DATA_COUNT2=$(echo "$RESPONSE2" | jq -r '.data | length // 0')
    echo "Products returned: ${DATA_COUNT2}"
else
    echo -e "${YELLOW}⚠ WARN${NC}: Search without filters returned error"
    echo "$RESPONSE2" | jq .
fi

echo ""
echo "-------------------------------------------"

# Test 3: Get Ship To Addresses
echo ""
echo "Test 3: Getting shipping addresses..."
echo "-------------------------------------------"

RESPONSE3=$(curl -s -X POST "${FUNCTION_URL}" \
  -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "canadaTire",
    "action": "getShipToAddresses",
    "payload": {}
  }')

SUCCESS3=$(echo "$RESPONSE3" | jq -r '.success // false')

if [ "$SUCCESS3" == "true" ]; then
    echo -e "${GREEN}✓ SUCCESS${NC}: Ship to addresses retrieved"
    ADDR_COUNT=$(echo "$RESPONSE3" | jq -r '.data | length // 0')
    echo "Addresses available: ${ADDR_COUNT}"
else
    echo -e "${YELLOW}⚠ WARN${NC}: Could not retrieve addresses"
    echo "$RESPONSE3" | jq .
fi

echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo ""

if [ "$SUCCESS" == "true" ]; then
    echo -e "${GREEN}✓ OAuth authentication is working${NC}"
    echo -e "${GREEN}✓ Product search is functional${NC}"
    echo -e "${GREEN}✓ Canada Tire integration is configured correctly${NC}"
    echo ""
    echo "Next steps:"
    echo "- Your application should now be able to search products"
    echo "- Test the UI at your application URL"
    echo "- Check Supabase function logs for detailed request info"
else
    echo -e "${RED}✗ OAuth authentication is failing${NC}"
    echo ""
    echo "Follow these steps:"
    echo "1. Read OAUTH_FIX_GUIDE.md for detailed instructions"
    echo "2. Run ./verify-oauth-credentials.sh to check configuration"
    echo "3. Fix any credential issues found"
    echo "4. Redeploy: npx supabase functions deploy distributor --no-verify-jwt"
    echo "5. Run this test script again"
    exit 1
fi

echo ""
