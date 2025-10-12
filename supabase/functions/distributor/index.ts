import { AdapterError } from "../_shared/errors.ts";
import { getEnv, getRequiredEnv, sanitizeBaseUrl } from "../_shared/env.ts";
import { createCanadaTireAdapter, type CanadaTireConfig } from "../_shared/vendors/canadaTire.ts";
import {
  type CanadaTireAction,
  type DistributorActionPayload,
  type DistributorRequestPayload,
  type DistributorResponse,
} from "../_shared/types.ts";

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

  const timeoutEnv = getEnv("CANADA_TIRE_TIMEOUT_MS");
  let timeoutMs: number | undefined;
  if (timeoutEnv) {
    const parsed = Number(timeoutEnv);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new AdapterError("CANADA_TIRE_TIMEOUT_MS must be a positive number", { status: 500 });
    }
    timeoutMs = parsed;
  }

  const config: CanadaTireConfig = {
    baseUrl,
    realm,
    credentials,
    timeoutMs,
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

async function executeAction<A extends CanadaTireAction>(
  adapter: ReturnType<typeof createCanadaTireAdapter>,
  action: A,
  payload: DistributorActionPayload[A],
): Promise<DistributorResponse<A>> {
  switch (action) {
    case "searchProducts":
      return (await adapter.searchProducts(payload)) as DistributorResponse<A>;
    case "getShipToAddresses":
      return (await adapter.getShipToAddresses()) as DistributorResponse<A>;
    case "submitOrder":
      return (await adapter.submitOrder(payload)) as DistributorResponse<A>;
    case "updateOrderAddress":
      return (await adapter.updateOrderAddress(payload)) as DistributorResponse<A>;
    default:
      throw new AdapterError("Unsupported action", { status: 400, expose: true });
  }
}

function parseRequestBody(body: unknown): DistributorRequestPayload<CanadaTireAction> {
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

  const payload = (value.payload ?? {}) as DistributorActionPayload[CanadaTireAction];

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
  } catch {
    return jsonResponse(400, {
      success: false,
      error: { code: 400, message: "Request body must be valid JSON" },
    });
  }

  let parsed: DistributorRequestPayload<CanadaTireAction>;
  try {
    parsed = parseRequestBody(body);
  } catch (error) {
    if (error instanceof AdapterError) {
      return handleAdapterError(error);
    }
    return handleUnknownError(error);
  }

  try {
    const adapter = createAdapter();
    const response = await executeAction(adapter, parsed.action, parsed.payload);
    return jsonResponse(200, response);
  } catch (error) {
    if (error instanceof AdapterError) {
      return handleAdapterError(error);
    }
    return handleUnknownError(error);
  }
});
