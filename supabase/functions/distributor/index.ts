//supabase>functions>distributor>index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Errors
class AdapterError extends Error {
  readonly status: number;
  readonly expose: boolean;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      status?: number;
      expose?: boolean;
      cause?: unknown;
      details?: Record<string, unknown>;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.status = options.status ?? 500;
    this.expose = options.expose ?? false;
    this.details = options.details;
  }
}

function assert(condition: unknown, message: string, status = 400): asserts condition {
  if (!condition) {
    throw new AdapterError(message, { status, expose: true });
  }
}

// Env helpers
function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new AdapterError(`Missing environment variable: ${name}`, {
      status: 500,
    });
  }
  return value;
}

function getEnv(name: string, fallback?: string): string | undefined {
  const value = Deno.env.get(name);
  if (value === undefined || value === "") {
    return fallback;
  }
  return value;
}

function sanitizeBaseUrl(value: string, label: string): string {
  try {
    const url = new URL(value);
    url.pathname = url.pathname.replace(/\/+$|$/, "");
    return url.toString().replace(/\/$/, "");
  } catch (error) {
    throw new AdapterError(`Invalid URL provided for ${label}`, {
      status: 500,
      cause: error,
    });
  }
}

// OAuth
const OAUTH_SIGNATURE_METHOD = "HMAC-SHA256";
const OAUTH_VERSION = "1.0";

interface OAuthCredentials {
  consumerKey: string;
  consumerSecret: string;
  tokenId: string;
  tokenSecret: string;
}

interface OAuthParams {
  script: string;
  deploy: string;
}

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

async function buildOAuthHeader(
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

// Types (inline only what's needed)
type CanadaTireAction = "searchProducts" | "getShipToAddresses" | "submitOrder" | "updateOrderAddress";

// Canada Tire Adapter (simplified inline version)
const ROUTES = {
  searchProducts: { script: "customscript_item_search_rl", deploy: "customdeploy_item_search_rl" },
  getShipToAddresses: { script: "customscript_get_cust_addr_rl", deploy: "customdeploy_get_cust_addr_rl" },
  submitOrder: { script: "customscript_create_sales_order_rl", deploy: "customdeploy_create_sales_order_rl" },
  updateOrderAddress: { script: "customscript_update_order_addr_rl", deploy: "customdeploy_update_order_addr_rl" },
} as const;

interface CanadaTireConfig {
  baseUrl: string;
  realm: string;
  credentials: OAuthCredentials & {
    customerId: string;
    customerToken: string;
  };
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 30000;

async function postToEndpoint(
  config: CanadaTireConfig,
  action: CanadaTireAction,
  body: Record<string, unknown>,
): Promise<any> {
  const route = ROUTES[action];
  const url = new URL(`${config.baseUrl}/restlet.nl`);
  url.searchParams.set("script", route.script);
  url.searchParams.set("deploy", route.deploy);

  const requestBody = {
    customerId: config.credentials.customerId,
    customerToken: config.credentials.customerToken,
    ...body,
  };

  console.log(`[Canada Tire API] Action: ${action}`);
  console.log(`[Canada Tire API] URL: ${url.toString()}`);
  console.log(`[Canada Tire API] Request body:`, JSON.stringify(requestBody, null, 2));

  const authorization = await buildOAuthHeader(
    route,
    config.credentials,
    config.realm,
    url,
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": authorization,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    console.log(`[Canada Tire API] Response status: ${response.status}`);

    const text = await response.text();
    console.log(`[Canada Tire API] Response body:`, text);
    const parsed = text ? JSON.parse(text) : { success: false, error: { code: 500, errorMsg: "Empty response" }, data: null };

    if (!response.ok || !parsed.success) {
      throw new AdapterError(parsed.error?.errorMsg || "Canada Tire API error", {
        status: parsed.error?.code || 502,
        expose: true,
      });
    }

    return parsed;
  } catch (error) {
    if (error instanceof AdapterError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AdapterError("Canada Tire API request timed out", {
        status: 504,
      });
    }
    throw new AdapterError("Unexpected error while contacting Canada Tire", {
      status: 502,
      cause: error,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function createCanadaTireAdapter(config: CanadaTireConfig) {
  return {
    async searchProducts(payload: any) {
      const body = payload.filters && Object.keys(payload.filters).length > 0 ? { filters: payload.filters } : {};
      return await postToEndpoint(config, "searchProducts", body);
    },
    async getShipToAddresses() {
      return await postToEndpoint(config, "getShipToAddresses", {});
    },
    async submitOrder(payload: any) {
      return await postToEndpoint(config, "submitOrder", { orderDetails: payload.orderDetails });
    },
    async updateOrderAddress(payload: any) {
      return await postToEndpoint(config, "updateOrderAddress", { orderDetails: payload.orderDetails });
    },
  };
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

let cachedAdapter: ReturnType<typeof createCanadaTireAdapter> | null = null;

function createAdapter(): ReturnType<typeof createCanadaTireAdapter> {
  if (cachedAdapter) {
    return cachedAdapter;
  }

  const baseUrl = sanitizeBaseUrl(getRequiredEnv("CANADA_TIRE_BASE_URL"), "CANADA_TIRE_BASE_URL");
  const realm = getEnv("CANADA_TIRE_REALM", "8031691_SB1")!;
  const credentials = {
    consumerKey: getRequiredEnv("CANADA_TIRE_CONSUMER_KEY"),
    consumerSecret: getRequiredEnv("CANADA_TIRE_CONSUMER_SECRET"),
    tokenId: getRequiredEnv("CANADA_TIRE_TOKEN_ID"),
    tokenSecret: getRequiredEnv("CANADA_TIRE_TOKEN_SECRET"),
    customerId: getRequiredEnv("CANADA_TIRE_CUSTOMER_ID"),
    customerToken: getRequiredEnv("CANADA_TIRE_CUSTOMER_TOKEN"),
  };

  const config: CanadaTireConfig = {
    baseUrl,
    realm,
    credentials,
  };

  cachedAdapter = createCanadaTireAdapter(config);
  return cachedAdapter;
}

function isCanadaTireAction(value: unknown): value is CanadaTireAction {
  return (
    value === "searchProducts" ||
    value === "getShipToAddresses" ||
    value === "submitOrder" ||
    value === "updateOrderAddress"
  );
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

function handleAdapterError(error: AdapterError): Response {
  const status = error.status ?? 500;
  if (!error.expose) {
    console.error("Distributor adapter error", {
      status,
      message: error.message,
      details: error.details,
    });
  }
  return jsonResponse(status, {
    success: false,
    error: {
      code: status,
      message: error.expose ? error.message : "An unexpected error occurred.",
    },
  });
}

function handleUnknownError(error: unknown): Response {
  console.error("Distributor handler crashed", error instanceof Error ? { message: error.message, stack: error.stack } : error);
  return jsonResponse(500, {
    success: false,
    error: {
      code: 500,
      message: "An unexpected error occurred.",
    },
  });
}

async function executeAction(
  adapter: ReturnType<typeof createCanadaTireAdapter>,
  action: CanadaTireAction,
  payload: any,
): Promise<any> {
  switch (action) {
    case "searchProducts":
      return await adapter.searchProducts(payload);
    case "getShipToAddresses":
      return await adapter.getShipToAddresses();
    case "submitOrder":
      return await adapter.submitOrder(payload);
    case "updateOrderAddress":
      return await adapter.updateOrderAddress(payload);
    default:
      throw new AdapterError("Unsupported action", { status: 400, expose: true });
  }
}

function parseRequestBody(body: unknown): any {
  if (!body || typeof body !== "object") {
    throw new AdapterError("Request body must be an object", { status: 400, expose: true });
  }

  const value = body as { vendor?: unknown; action?: unknown; payload?: unknown };
  if (value.vendor !== "canadaTire") {
    throw new AdapterError("Unsupported vendor", { status: 400, expose: true });
  }
  if (!isCanadaTireAction(value.action)) {
    throw new AdapterError("Unsupported action", { status: 400, expose: true });
  }

  const payload = (value.payload ?? {}) as any;

  return {
    vendor: "canadaTire",
    action: value.action,
    payload,
  };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(405, {
      success: false,
      error: { code: 405, message: "Method Not Allowed" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
    console.log("[Distributor] Received request body:", JSON.stringify(body, null, 2));
  } catch (error) {
    console.error("[Distributor] Failed to parse JSON:", error);
    return jsonResponse(400, {
      success: false,
      error: { code: 400, message: "Request body must be valid JSON" },
    });
  }

  let parsed: any;
  try {
    parsed = parseRequestBody(body);
    console.log("[Distributor] Parsed request:", JSON.stringify(parsed, null, 2));
  } catch (error) {
    console.error("[Distributor] Failed to parse request body:", error);
    if (error instanceof AdapterError) {
      return handleAdapterError(error);
    }
    return handleUnknownError(error);
  }

  try {
    const adapter = createAdapter();
    const response = await executeAction(adapter, parsed.action, parsed.payload);
    console.log("[Distributor] Request successful");
    return jsonResponse(200, response);
  } catch (error) {
    console.error("[Distributor] Request failed:", error);
    if (error instanceof AdapterError) {
      return handleAdapterError(error);
    }
    return handleUnknownError(error);
  }
});
