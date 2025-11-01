#!/bin/bash

# OAuth Credential Verification Script
# This script helps diagnose Canada Tire OAuth authentication issues

set -e

echo "========================================"
echo "Canada Tire OAuth Credential Validator"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a secret exists and get its length
check_secret() {
    local secret_name=$1
    local expected_type=$2

    echo -n "Checking ${secret_name}... "

    # Try to get the secret value length from Supabase
    if ! command -v supabase &> /dev/null; then
        echo -e "${YELLOW}WARN${NC}: Supabase CLI not available locally"
        return 1
    fi

    # Note: This requires being logged in to Supabase
    local value=$(npx supabase secrets list 2>/dev/null | grep "^${secret_name}" | awk '{print $2}')

    if [ -z "$value" ]; then
        echo -e "${RED}MISSING${NC}"
        return 1
    else
        local length=${#value}
        echo -e "${GREEN}SET${NC} (${length} characters)"

        # Validate expected lengths
        case $expected_type in
            "url")
                if [[ ! $value =~ ^https:// ]]; then
                    echo -e "  ${RED}ERROR${NC}: Should start with https://"
                fi
                ;;
            "realm")
                if [[ $length -lt 5 ]]; then
                    echo -e "  ${YELLOW}WARN${NC}: Realm seems too short"
                fi
                ;;
            "key")
                if [[ $length -lt 32 ]]; then
                    echo -e "  ${YELLOW}WARN${NC}: Key seems too short (expected ~64 chars)"
                fi
                ;;
            "customer_id")
                if [[ ! $value =~ ^[0-9]+$ ]]; then
                    echo -e "  ${RED}ERROR${NC}: Should be numeric only"
                fi
                ;;
        esac
        return 0
    fi
}

echo "Step 1: Checking Supabase CLI availability"
echo "-------------------------------------------"
if ! command -v npx &> /dev/null; then
    echo -e "${RED}ERROR${NC}: npx not found. Please install Node.js"
    exit 1
fi
echo -e "${GREEN}✓${NC} npx available"
echo ""

echo "Step 2: Checking Supabase authentication"
echo "-----------------------------------------"
if ! npx supabase projects list &> /dev/null; then
    echo -e "${RED}ERROR${NC}: Not logged in to Supabase"
    echo ""
    echo "Please run: ${BLUE}npx supabase login${NC}"
    echo ""
    echo "Then re-run this script."
    exit 1
fi
echo -e "${GREEN}✓${NC} Authenticated"
echo ""

echo "Step 3: Verifying all required secrets exist"
echo "---------------------------------------------"
check_secret "CANADA_TIRE_BASE_URL" "url"
check_secret "CANADA_TIRE_REALM" "realm"
check_secret "CANADA_TIRE_CONSUMER_KEY" "key"
check_secret "CANADA_TIRE_CONSUMER_SECRET" "key"
check_secret "CANADA_TIRE_TOKEN_ID" "key"
check_secret "CANADA_TIRE_TOKEN_SECRET" "key"
check_secret "CANADA_TIRE_CUSTOMER_ID" "customer_id"
check_secret "CANADA_TIRE_CUSTOMER_TOKEN" "key"
echo ""

echo "Step 4: Environment consistency check"
echo "--------------------------------------"
BASE_URL=$(npx supabase secrets list 2>/dev/null | grep "^CANADA_TIRE_BASE_URL" | awk '{print $2}')
REALM=$(npx supabase secrets list 2>/dev/null | grep "^CANADA_TIRE_REALM" | awk '{print $2}')

if [ -n "$BASE_URL" ] && [ -n "$REALM" ]; then
    if [[ $BASE_URL == *"-sb1"* ]]; then
        echo -e "${BLUE}Environment detected: SANDBOX${NC}"
        if [[ $REALM == *"_SB1"* ]]; then
            echo -e "${GREEN}✓${NC} Realm matches sandbox environment"
        else
            echo -e "${RED}✗${NC} REALM should end with '_SB1' for sandbox"
            echo "  Current: $REALM"
            echo "  Expected: ${REALM}_SB1 or 8031691_SB1"
        fi
    else
        echo -e "${BLUE}Environment detected: PRODUCTION${NC}"
        if [[ $REALM == *"_SB1"* ]]; then
            echo -e "${RED}✗${NC} REALM should NOT contain '_SB1' for production"
            echo "  Current: $REALM"
            echo "  Expected: Remove _SB1 suffix"
        else
            echo -e "${GREEN}✓${NC} Realm matches production environment"
        fi
    fi
else
    echo -e "${YELLOW}WARN${NC}: Cannot determine environment (BASE_URL or REALM missing)"
fi
echo ""

echo "Step 5: Recommendations"
echo "-----------------------"
echo "If authentication is failing:"
echo ""
echo "1. ${BLUE}Verify environment match:${NC}"
echo "   Sandbox: REALM='8031691_SB1' + URL contains '-sb1'"
echo "   Production: REALM='8031691' + URL has no '-sb1'"
echo ""
echo "2. ${BLUE}Check for typos:${NC}"
echo "   - No extra spaces before/after values"
echo "   - No line breaks in credentials"
echo "   - All characters copied completely"
echo ""
echo "3. ${BLUE}Verify credential pairing:${NC}"
echo "   - Consumer Key + Secret from same integration"
echo "   - Token ID + Secret from same token"
echo "   - All from same environment"
echo ""
echo "4. ${BLUE}After any changes:${NC}"
echo "   npx supabase functions deploy distributor --no-verify-jwt"
echo ""
echo "5. ${BLUE}Monitor logs:${NC}"
echo "   Check Supabase Dashboard → Functions → distributor → Logs"
echo ""
echo "========================================"
echo "Verification Complete"
echo "========================================"
