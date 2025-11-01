const OAUTH_SIGNATURE_METHOD = "HMAC-SHA256";
const OAUTH_VERSION = "1.0";

export interface OAuthCredentials {
  consumerKey: string;
  consumerSecret: string;
  tokenId: string;
  tokenSecret: string;
}

export interface OAuthParams {
  script: string;
  deploy: string;
}

/**
 * OAuth percent-encoding as per RFC 3986.
 * Encodes special characters for OAuth signature generation.
 */
function oauthPercentEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%7E/g, "~");
}

function buildParameterString(entries: Array<[string, string]>): string {
  return entries
    .map(([key, value]) => `${oauthPercentEncode(key)}=${oauthPercentEncode(value)}`)
    .join("&");
}

/**
 * Generates HMAC-SHA256 signature for OAuth 1.0 authentication.
 * @param signingKey - Combined consumer secret and token secret
 * @param baseString - OAuth signature base string
 * @returns Base64-encoded signature
 */
async function signBaseString(signingKey: string, baseString: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingKey),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(baseString));
  const bytes = new Uint8Array(signature);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Builds OAuth 1.0 Authorization header for NetSuite RESTlet requests.
 *
 * @param params - RESTlet script and deploy parameters
 * @param credentials - OAuth consumer and token credentials
 * @param realm - NetSuite account identifier with optional environment suffix.
 *                Sandbox: "8031691_SB1" (with _SB1 suffix)
 *                Production: "8031691" (no suffix)
 *                Must match the environment of your BASE_URL.
 * @param requestUrl - The full RESTlet endpoint URL
 * @returns OAuth Authorization header value
 */
export async function buildOAuthHeader(
  params: OAuthParams,
  credentials: OAuthCredentials,
  realm: string,
  requestUrl: URL,
): Promise<string> {
  const oauthNonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const oauthTimestamp = Math.floor(Date.now() / 1000).toString();

  const baseEntries: Array<[string, string]> = [
    ["deploy", params.deploy],
    ["oauth_consumer_key", credentials.consumerKey],
    ["oauth_nonce", oauthNonce],
    ["oauth_signature_method", OAUTH_SIGNATURE_METHOD],
    ["oauth_timestamp", oauthTimestamp],
    ["oauth_token", credentials.tokenId],
    ["oauth_version", OAUTH_VERSION],
    ["script", params.script],
  ];

  baseEntries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  const normalizedUrl = `${requestUrl.protocol}//${requestUrl.host}${requestUrl.pathname}`;
  const parameterString = buildParameterString(baseEntries);
  const baseString = [
    "POST",
    oauthPercentEncode(normalizedUrl),
    oauthPercentEncode(parameterString),
  ].join("&");

  const signingKey = `${oauthPercentEncode(credentials.consumerSecret)}&${oauthPercentEncode(credentials.tokenSecret)}`;
  const signature = await signBaseString(signingKey, baseString);

  const headerParams: Array<[string, string]> = [
    ["realm", realm],
    ["oauth_consumer_key", credentials.consumerKey],
    ["oauth_token", credentials.tokenId],
    ["oauth_signature_method", OAUTH_SIGNATURE_METHOD],
    ["oauth_timestamp", oauthTimestamp],
    ["oauth_nonce", oauthNonce],
    ["oauth_version", OAUTH_VERSION],
    ["oauth_signature", signature],
  ];

  return `OAuth ${headerParams
    .map(([key, value]) => `${key}="${oauthPercentEncode(value)}"`)
    .join(",")}`;
}
