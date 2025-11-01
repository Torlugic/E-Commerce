import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { AdapterError, assert } from "../_shared/errors.ts";
import { getRequiredEnv, getEnv, sanitizeBaseUrl } from "../_shared/env.ts";
import { createCanadaTireAdapter, type CanadaTireConfig } from "../_shared/vendors/canadaTire.ts";
import type { CanadaTireAction } from "../_shared/types.ts";

const DEBUG = getEnv("DEBUG", "false") === "true";

function debugLog(message: string, data?: unknown): void {
  if (DEBUG) {
    console.log(`[Distributor Debug] ${message}`, data !== undefined ? JSON.stringify(data, null, 2) : "");
  }
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

function getCorsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
    "Access-Control-Max-Age": "86400",
  };
}

let cachedAdapter: ReturnType<typeof createCanadaTireAdapter> | null = null;

function createAdapter(): ReturnType<typeof createCanadaTireAdapter> {
  if (cachedAdapter) {
    debugLog("Using cached Canada Tire adapter");
    return cachedAdapter;
  }

  debugLog("Creating new Canada Tire adapter");

  const requiredVars = [
    'CANADA_TIRE_BASE_URL',
    'CANADA_TIRE_CONSUMER_KEY',
    'CANADA_TIRE_CONSUMER_SECRET',
    'CANADA_TIRE_TOKEN_ID',
    'CANADA_TIRE_TOKEN_SECRET',
    'CANADA_TIRE_CUSTOMER_ID',
    'CANADA_TIRE_CUSTOMER_TOKEN'
  ];

  console.log(`[Config] Verifying environment variables...`);
  for (const varName of requiredVars) {
    const value = Deno.env.get(varName);
    if (!value) {
      console.error(`[Config] MISSING: ${varName}`);
      throw new AdapterError(`Missing environment variable: ${varName}`, { status: 500 });
    }
    if (!varName.includes('SECRET') && !varName.includes('TOKEN')) {
      console.log(`[Config] ${varName}: ${value}`);
    } else {
      console.log(`[Config] ${varName}: [SET - ${value.length} characters]`);
    }
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

  const environmentType = realm.includes('_SB1') ? 'Sandbox (Testing)' : 'Production (Live)';

  console.log(`[Distributor] ========== CONFIGURATION ==========`);
  console.log(`[Distributor] Environment: ${environmentType}`);
  console.log(`[Distributor] Base URL: ${baseUrl}`);
  console.log(`[Distributor] Realm (Environment ID): ${realm}`);
  console.log(`[Distributor] Customer ID: ${credentials.customerId}`);
  console.log(`[Distributor] Consumer Key length: ${credentials.consumerKey.length}`);
  console.log(`[Distributor] Token ID length: ${credentials.tokenId.length}`);
  console.log(`[Distributor] =======================================`);

  debugLog("Full credentials (first 10 chars)", {
    consumerKey: credentials.consumerKey.substring(0, 10) + "...",
    tokenId: credentials.tokenId.substring(0, 10) + "...",
    customerId: credentials.customerId,
  });

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

function jsonResponse(status: number, body: unknown, request?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...getCorsHeaders(request) },
  });
}

function handleAdapterError(error: AdapterError, request?: Request): Response {
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
  }, request);
}

function handleUnknownError(error: unknown, request?: Request): Response {
  console.error("Distributor handler crashed", error instanceof Error ? { message: error.message, stack: error.stack } : error);
  return jsonResponse(500, {
    success: false,
    error: {
      code: 500,
      message: "An unexpected error occurred.",
    },
  }, request);
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
  const origin = request.headers.get("Origin");
  console.log(`[Distributor] ${request.method} request from origin: ${origin || "none"}`);

  if (request.method === "OPTIONS") {
    console.log("[Distributor] Handling OPTIONS preflight request");
    const corsHeaders = getCorsHeaders(request);
    console.log("[Distributor] Returning CORS headers:", corsHeaders);
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, {
      success: false,
      error: { code: 405, message: "Method Not Allowed" },
    }, request);
  }

  let body: unknown;
  try {
    body = await request.json();
    console.log("[Distributor] Received request body:", JSON.stringify(body, null, 2));
    debugLog("Raw request body", body);
  } catch (error) {
    console.error("[Distributor] Failed to parse JSON:", error);
    return jsonResponse(400, {
      success: false,
      error: { code: 400, message: "Request body must be valid JSON" },
    }, request);
  }

  let parsed: any;
  try {
    parsed = parseRequestBody(body);
    console.log("[Distributor] Parsed request:", JSON.stringify(parsed, null, 2));
    debugLog("Validated payload", parsed.payload);
  } catch (error) {
    console.error("[Distributor] Failed to parse request body:", error);
    if (error instanceof AdapterError) {
      return handleAdapterError(error, request);
    }
    return handleUnknownError(error, request);
  }

  try {
    const adapter = createAdapter();
    console.log(`[Distributor] Executing action: ${parsed.action}`);
    const response = await executeAction(adapter, parsed.action, parsed.payload);
    console.log("[Distributor] Request successful");
    debugLog("Response data", response);
    return jsonResponse(200, response, request);
  } catch (error) {
    console.error("[Distributor] Request failed:", error);
    if (error instanceof AdapterError) {
      return handleAdapterError(error, request);
    }
    return handleUnknownError(error, request);
  }
});