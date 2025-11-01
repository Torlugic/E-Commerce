# Canada Tire OAuth Integration — Terminology Guide

This guide clarifies the technical terms used throughout the Canada Tire integration documentation, especially the relationship between "realm" and "environment."

---

## Quick Reference

| Term | What It Means | Example |
|------|---------------|---------|
| **Environment** | The deployment context (Sandbox or Production) | Sandbox, Production |
| **Realm** | NetSuite account ID with optional environment suffix | `8031691_SB1` (sandbox)<br>`8031691` (production) |
| **Base URL** | The NetSuite RESTlet API endpoint | `https://8031691-sb1.restlets.api.netsuite.com/...` |
| **Consumer Key** | OAuth client identifier | 64-character alphanumeric string |
| **Consumer Secret** | OAuth client secret for signing | 64-character alphanumeric string |
| **Token ID** | OAuth access token identifier | 64-character alphanumeric string |
| **Token Secret** | OAuth access token secret for signing | 64-character alphanumeric string |
| **Customer ID** | Application-level customer identifier | Numeric (e.g., `467`) |
| **Customer Token** | Application-level customer authentication | 32+ character alphanumeric string |

---

## Understanding "Realm" vs "Environment"

### What Is a Realm?

**Realm** is the OAuth 1.0 standard term for an authentication scope identifier. In NetSuite's implementation, the realm is your **account ID** with an optional **environment suffix**.

### How Realm Maps to Environment

```
┌─────────────────────────────────────────────────────────────┐
│                    SANDBOX ENVIRONMENT                       │
├─────────────────────────────────────────────────────────────┤
│  Realm:     8031691_SB1          ← Note the _SB1 suffix     │
│  Base URL:  https://8031691-sb1.restlets.api...  ← Note -sb1│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   PRODUCTION ENVIRONMENT                     │
├─────────────────────────────────────────────────────────────┤
│  Realm:     8031691              ← No suffix                 │
│  Base URL:  https://8031691.restlets.api...      ← No -sb1  │
└─────────────────────────────────────────────────────────────┘
```

### Key Points

- **Realm** is the NetSuite-specific technical identifier
- **Environment** is the conceptual deployment context (sandbox or production)
- They must **always match**: sandbox realm with sandbox URL, production realm with production URL
- Mixing environments is the #1 cause of OAuth authentication failures

---

## Environment Identifiers Explained

### Sandbox Environment

**What It Is:**
A test environment for development and testing, isolated from production data.

**Realm Format:**
```
8031691_SB1
```
- Account ID: `8031691`
- Environment suffix: `_SB1` (Sandbox 1)

**Base URL Format:**
```
https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting
```
- Contains `-sb1` in the subdomain
- Matches the `_SB1` suffix in realm

**When to Use:**
- Development
- Testing
- Integration verification
- Before deploying to production

### Production Environment

**What It Is:**
The live environment with real customer data and transactions.

**Realm Format:**
```
8031691
```
- Account ID only: `8031691`
- No environment suffix

**Base URL Format:**
```
https://8031691.restlets.api.netsuite.com/app/site/hosting
```
- No `-sb1` in the subdomain
- Clean account ID only

**When to Use:**
- Live customer-facing application
- Real transactions
- Production data access

---

## OAuth Credentials Explained

### Consumer Key & Consumer Secret

**What They Are:**
OAuth client credentials that identify your integration application.

**Purpose:**
- Identify your application to NetSuite
- Used to sign requests
- Must be kept secret

**Format:**
- Typically 64 characters
- Alphanumeric
- Generated when creating a NetSuite integration record

**Important:**
- Consumer Key and Secret must be from the **same integration record**
- Must match the environment (sandbox or production)

### Token ID & Token Secret

**What They Are:**
OAuth access token credentials that represent a specific user or role.

**Purpose:**
- Represent the authenticated user/role
- Combined with consumer credentials to sign requests
- Grant specific permissions

**Format:**
- Typically 64 characters
- Alphanumeric
- Generated when creating an access token in NetSuite

**Important:**
- Token ID and Secret must be from the **same access token**
- Must match the environment (sandbox or production)
- Can expire or be revoked

### Customer ID & Customer Token

**What They Are:**
Application-level credentials specific to Canada Tire's API.

**Purpose:**
- Identify which customer account is making the request
- Additional layer of authentication beyond OAuth
- Passed in request body, not OAuth header

**Format:**
- Customer ID: Numeric (e.g., `467`)
- Customer Token: 32+ character alphanumeric string

**Important:**
- These are **separate** from OAuth credentials
- Provided by Canada Tire specifically for your account
- Must match the environment

---

## Common Terminology Mistakes

### Mistake 1: Confusing Realm with Base URL

❌ **Wrong:**
```bash
CANADA_TIRE_REALM="https://8031691-sb1.restlets.api.netsuite.com"
```

✅ **Correct:**
```bash
CANADA_TIRE_REALM="8031691_SB1"
CANADA_TIRE_BASE_URL="https://8031691-sb1.restlets.api.netsuite.com/app/site/hosting"
```

### Mistake 2: Mixing Sandbox and Production

❌ **Wrong:**
```bash
CANADA_TIRE_REALM="8031691"           # Production realm
CANADA_TIRE_BASE_URL="https://8031691-sb1.restlets.api..."  # Sandbox URL
```

✅ **Correct:**
```bash
# Both sandbox
CANADA_TIRE_REALM="8031691_SB1"
CANADA_TIRE_BASE_URL="https://8031691-sb1.restlets.api..."

# OR both production
CANADA_TIRE_REALM="8031691"
CANADA_TIRE_BASE_URL="https://8031691.restlets.api..."
```

### Mistake 3: Using Credentials from Different Environments

❌ **Wrong:**
Using sandbox Consumer Key with production Token ID

✅ **Correct:**
All OAuth credentials (Consumer Key, Consumer Secret, Token ID, Token Secret) from the same environment

---

## OAuth 1.0 Technical Details

### What Is OAuth 1.0?

OAuth 1.0 is an authorization protocol that allows applications to access APIs securely without exposing credentials. NetSuite uses OAuth 1.0 for RESTlet authentication.

### How OAuth 1.0 Works

1. **Request Parameters:** Your application includes OAuth parameters (consumer key, token, timestamp, nonce)
2. **Signature Generation:** These parameters are signed using HMAC-SHA256 with your secrets
3. **Request Sending:** The signed parameters go in the `Authorization` header
4. **Server Verification:** NetSuite verifies the signature using your stored credentials
5. **Access Granted:** If valid, the request is processed

### OAuth Header Structure

```
Authorization: OAuth
  realm="8031691_SB1",
  oauth_consumer_key="...",
  oauth_token="...",
  oauth_signature_method="HMAC-SHA256",
  oauth_timestamp="1234567890",
  oauth_nonce="...",
  oauth_version="1.0",
  oauth_signature="..."
```

**Key Components:**
- `realm`: Environment identifier (account ID with optional suffix)
- `oauth_consumer_key`: Identifies your integration
- `oauth_token`: Identifies your access token
- `oauth_signature`: Proves you have the secrets without sending them

---

## Troubleshooting by Terminology

### "Wrong Realm" Errors

**What It Means:**
Your realm doesn't match your base URL environment.

**Check:**
- Sandbox: Realm ends with `_SB1` AND URL contains `-sb1`
- Production: Realm has no suffix AND URL has no `-sb1`

**Fix:**
Align realm and URL to the same environment.

### "OAuth Authentication Failed" Errors

**What It Means:**
Your OAuth signature couldn't be verified.

**Common Causes:**
- Consumer Key doesn't match Consumer Secret
- Token ID doesn't match Token Secret
- Credentials from different environments
- Expired or revoked tokens

**Fix:**
Verify all four OAuth credentials are from the same integration and environment.

### "Invalid Customer" Errors

**What It Means:**
OAuth succeeded, but application-level customer validation failed.

**Common Causes:**
- Wrong Customer ID
- Wrong Customer Token
- Customer credentials from different environment

**Fix:**
Verify Customer ID and Customer Token are correct for your environment.

---

## Environment Configuration Checklist

When setting up credentials, verify:

- [ ] I know which environment I'm using (Sandbox or Production)
- [ ] My realm matches my environment:
  - [ ] Sandbox: `8031691_SB1`
  - [ ] Production: `8031691`
- [ ] My base URL matches my environment:
  - [ ] Sandbox: Contains `-sb1`
  - [ ] Production: No `-sb1`
- [ ] All OAuth credentials are from the same environment
- [ ] Consumer Key and Consumer Secret are from the same integration
- [ ] Token ID and Token Secret are from the same access token
- [ ] Customer ID and Customer Token match my environment

---

## Quick Decision Tree

```
Start: Which environment are you using?
   │
   ├─→ Sandbox
   │     ├─→ Set REALM to: 8031691_SB1
   │     ├─→ Set BASE_URL to: https://8031691-sb1.restlets.api...
   │     └─→ Use sandbox credentials
   │
   └─→ Production
         ├─→ Set REALM to: 8031691
         ├─→ Set BASE_URL to: https://8031691.restlets.api...
         └─→ Use production credentials
```

---

## Summary

- **Realm** = NetSuite account identifier (with optional `_SB1` for sandbox)
- **Environment** = Sandbox or Production deployment context
- **They must match** = Sandbox realm with sandbox URL, production with production
- **All credentials** must come from the same environment
- **Most OAuth errors** stem from environment/realm mismatches

When troubleshooting, always start by verifying your realm matches your intended environment.

---

**For detailed setup instructions, see:**
- `START_HERE.md` - Quick setup guide
- `OAUTH_FIX_GUIDE.md` - Troubleshooting OAuth issues
- `docs/DISTRIBUTOR_CANADA_TIRE.md` - Technical integration details
