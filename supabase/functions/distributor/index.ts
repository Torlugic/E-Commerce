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

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

let cachedAdapter: ReturnType<typeof createCanadaTireAdapter> | null = null;

function createAdapter(): ReturnType<typeof createCanadaTireAdapter> {
  if (cachedAdapter) {
    debugLog("Using cached Canada Tire adapter");
    return cachedAdapter;
  }

  debugLog("Creating new Canada Tire adapter");

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

  console.log(`[Distributor] Configured Canada Tire adapter:`);
  console.log(`  - Base URL: ${baseUrl}`);
  console.log(`  - Realm: ${realm}`);
  console.log(`  - Customer ID: ${credentials.customerId}`);
  debugLog("Full credentials", {
    consumerKey: credentials.consumerKey,
    tokenId: credentials.tokenId,
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

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...CORS_HEADERS },
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
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: CORS_HEADERS,
    });
  }

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
    debugLog("Raw request body", body);
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
    debugLog("Validated payload", parsed.payload);
  } catch (error) {
    console.error("[Distributor] Failed to parse request body:", error);
    if (error instanceof AdapterError) {
      return handleAdapterError(error);
    }
    return handleUnknownError(error);
  }

  try {
    const adapter = createAdapter();
    console.log(`[Distributor] Executing action: ${parsed.action}`);
    const response = await executeAction(adapter, parsed.action, parsed.payload);
    console.log("[Distributor] Request successful");
    debugLog("Response data", response);
    return jsonResponse(200, response);
  } catch (error) {
    console.error("[Distributor] Request failed:", error);
    if (error instanceof AdapterError) {
      return handleAdapterError(error);
    }
    return handleUnknownError(error);
  }
});
