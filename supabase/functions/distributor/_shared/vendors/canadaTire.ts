import { AdapterError, assert } from "../errors.ts";
import { buildOAuthHeader, type OAuthCredentials } from "../oauth.ts";
import {
  type ApiResponse,
  type CanadaTireAction,
  type OrderDetails,
  type OrderItem,
  type ProductRow,
  type ProductSearchFilters,
  type ShippingInfo,
  type SubmitOrderResponseData,
  type UpdateOrderAddressResponseData,
} from "../types.ts";

const ROUTES = {
  searchProducts: { script: "customscript_item_search_rl", deploy: "customdeploy_item_search_rl" },
  getShipToAddresses: { script: "customscript_get_cust_addr_rl", deploy: "customdeploy_get_cust_addr_rl" },
  submitOrder: { script: "customscript_create_sales_order_rl", deploy: "customdeploy_create_sales_order_rl" },
  updateOrderAddress: { script: "customscript_update_order_addr_rl", deploy: "customdeploy_update_order_addr_rl" },
} as const satisfies Record<CanadaTireAction, { script: string; deploy: string }>;

export interface CanadaTireConfig {
  baseUrl: string;
  realm: string;
  credentials: OAuthCredentials & {
    customerId: string;
    customerToken: string;
  };
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 30000;

type ShippingRequirement =
  | { type: "addrId"; addrId: number }
  | { type: "full"; addr1: string; province: string; postalCode: string; country: string };

type CanadaTireResponseMap = {
  searchProducts: ProductRow[];
  getShipToAddresses: Array<{
    addrId: number;
    attention: string;
    addressee: string;
    addr1: string;
    addr2: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  }>;
  submitOrder: SubmitOrderResponseData;
  updateOrderAddress: UpdateOrderAddressResponseData;
};

function normalizeString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  assert(typeof value === "string", `${field} must be a string`);
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function normalizeNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  assert(typeof value === "number" && Number.isFinite(value), `${field} must be a finite number`);
  return value;
}

function normalizeInteger(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  assert(Number.isInteger(value), `${field} must be an integer`);
  return value as number;
}

function normalizeBoolean(value: unknown, field: string): boolean | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (value === "" || (typeof value === "string" && value.trim() === "")) {
    return undefined;
  }
  assert(typeof value === "boolean", `${field} must be a boolean, null, or empty string`);
  return value;
}

function validateFilters(input: unknown): ProductSearchFilters | undefined {
  if (input === undefined || input === null) {
    return undefined;
  }
  assert(typeof input === "object" && !Array.isArray(input), "filters must be an object");
  const raw = input as Record<string, unknown>;

  const filters: ProductSearchFilters = {};
  const width = normalizeNumber(raw.width, "filters.width");
  if (width !== undefined) filters.width = width;
  const rimSize = normalizeNumber(raw.rimSize, "filters.rimSize");
  if (rimSize !== undefined) filters.rimSize = rimSize;
  const aspectRatio = normalizeNumber(raw.aspectRatio, "filters.aspectRatio");
  if (aspectRatio !== undefined) filters.aspectRatio = aspectRatio;
  const size = normalizeString(raw.size, "filters.size");
  if (size) filters.size = size;
  if (raw.partNumber !== undefined) {
    assert(Array.isArray(raw.partNumber), "filters.partNumber must be an array");
    if (raw.partNumber.length > 0) {
      const parts = raw.partNumber.map((value, index) => {
        const part = normalizeString(value, `filters.partNumber[${index}]`);
        assert(part, `filters.partNumber[${index}] must be a non-empty string`);
        return part!;
      });
      filters.partNumber = parts;
    }
  }
  const brand = normalizeString(raw.brand, "filters.brand");
  if (brand) filters.brand = brand;
  const searchKey = normalizeString(raw.searchKey, "filters.searchKey");
  if (searchKey) filters.searchKey = searchKey;
  const isWinter = normalizeBoolean(raw.isWinter, "filters.isWinter");
  if (isWinter !== undefined) filters.isWinter = isWinter;
  const isRunFlat = normalizeBoolean(raw.isRunFlat, "filters.isRunFlat");
  if (isRunFlat !== undefined) filters.isRunFlat = isRunFlat;
  const isTire = normalizeBoolean(raw.isTire, "filters.isTire");
  if (isTire !== undefined) filters.isTire = isTire;
  const isWheel = normalizeBoolean(raw.isWheel, "filters.isWheel");
  if (isWheel !== undefined) filters.isWheel = isWheel;
  const page = normalizeInteger(raw.page, "filters.page");
  if (page !== undefined) {
    assert(page > 0, "filters.page must be greater than zero");
    filters.page = page;
  }

  return filters;
}

function ensureShippingRequirement(shipping: ShippingInfo): ShippingRequirement {
  const addrId = normalizeInteger(shipping.addrId, "shipping.addrId");
  if (addrId !== undefined) {
    assert(addrId > 0, "shipping.addrId must be a positive integer");
    return { type: "addrId", addrId };
  }

  const addr1 = normalizeString(shipping.addr1, "shipping.addr1");
  const province = normalizeString(shipping.province, "shipping.province");
  const postalCode = normalizeString(shipping.postalCode, "shipping.postalCode");
  const country = normalizeString(shipping.country, "shipping.country");

  assert(addr1 && province && postalCode && country, "shipping requires addrId or full address fields");

  return {
    type: "full",
    addr1,
    province: province!.toUpperCase(),
    postalCode: postalCode!,
    country: country!.toUpperCase(),
  };
}

function normalizeOrderItems(items: unknown): OrderItem[] {
  assert(Array.isArray(items) && items.length > 0, "orderDetails.items must be a non-empty array");
  return items.map((entry, index) => {
    assert(entry && typeof entry === "object", `orderDetails.items[${index}] must be an object`);
    const value = entry as Record<string, unknown>;
    const partNumber = normalizeString(value.partNumber, `orderDetails.items[${index}].partNumber`);
    assert(partNumber, `orderDetails.items[${index}].partNumber must be provided`);
    const quantity = normalizeInteger(value.quantity, `orderDetails.items[${index}].quantity`);
    assert(quantity && quantity > 0, `orderDetails.items[${index}].quantity must be a positive integer`);
    return {
      partNumber: partNumber!,
      quantity: quantity!,
    };
  });
}

function validateOrderDetails(input: unknown): OrderDetails {
  assert(input && typeof input === "object", "orderDetails must be provided");
  const raw = input as Record<string, unknown>;

  const location = normalizeString(raw.location, "orderDetails.location");
  assert(location, "orderDetails.location is required");

  const shippingInput = raw.shipping as ShippingInfo | undefined;
  assert(shippingInput && typeof shippingInput === "object", "orderDetails.shipping is required");
  const shipping = shippingInput as ShippingInfo;
  const requirement = ensureShippingRequirement(shipping);

  const normalizedShipping: ShippingInfo = { ...shipping };
  if (requirement.type === "addrId") {
    normalizedShipping.addrId = requirement.addrId;
    delete normalizedShipping.addr1;
    delete normalizedShipping.province;
    delete normalizedShipping.postalCode;
    delete normalizedShipping.country;
  } else {
    normalizedShipping.addrId = undefined;
    normalizedShipping.addr1 = requirement.addr1;
    normalizedShipping.province = requirement.province;
    normalizedShipping.postalCode = requirement.postalCode;
    normalizedShipping.country = requirement.country;
  }

  const poNumber = normalizeString(raw.poNumber, "orderDetails.poNumber");
  const email = normalizeString(raw.email, "orderDetails.email");
  const phone = normalizeString(raw.phone, "orderDetails.phone");
  const items = normalizeOrderItems(raw.items);

  const addressee = normalizeString(shipping.addressee, "orderDetails.shipping.addressee");
  if (addressee) {
    normalizedShipping.addressee = addressee;
  }
  const attention = normalizeString(shipping.attention, "orderDetails.shipping.attention");
  if (attention) {
    normalizedShipping.attention = attention;
  }
  const addr2 = normalizeString(shipping.addr2, "orderDetails.shipping.addr2");
  if (addr2) {
    normalizedShipping.addr2 = addr2;
  }
  const city = normalizeString(shipping.city, "orderDetails.shipping.city");
  if (city) {
    normalizedShipping.city = city;
  }

  const payload: OrderDetails = {
    location: location!,
    shipping: normalizedShipping,
    items,
  };

  if (poNumber) payload.poNumber = poNumber;
  if (email) payload.email = email;
  if (phone) payload.phone = phone;

  return payload;
}

async function postToEndpoint<T extends CanadaTireAction>(
  config: CanadaTireConfig,
  action: T,
  body: Record<string, unknown>,
): Promise<ApiResponse<CanadaTireResponseMap[T]>> {
  const route = ROUTES[action];
  const url = new URL(`${config.baseUrl}/restlet.nl`);
  url.searchParams.set("script", route.script);
  url.searchParams.set("deploy", route.deploy);

  const requestBody = {
    customerId: config.credentials.customerId,
    customerToken: config.credentials.customerToken,
    ...body,
  };

  console.log(`[Canada Tire API] ========== REQUEST START ==========`);
  console.log(`[Canada Tire API] Action: ${action}`);
  console.log(`[Canada Tire API] URL: ${url.toString()}`);
  console.log(`[Canada Tire API] Realm: ${config.realm}`);
  console.log(`[Canada Tire API] Request body:`, JSON.stringify(requestBody, null, 2));

  const authorization = await buildOAuthHeader(
    route,
    config.credentials,
    config.realm,
    url,
  );

  const maskedAuth = authorization.replace(/oauth_signature="[^"]+"/i, 'oauth_signature="***"');
  console.log(`[Canada Tire API] OAuth Header (masked):`, maskedAuth);

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

    console.log(`[Canada Tire API] Response status: ${response.status} ${response.statusText}`);
    console.log(`[Canada Tire API] Response headers:`, JSON.stringify(Object.fromEntries(response.headers.entries())));

    const text = await response.text();
    console.log(`[Canada Tire API] Response body (first 500 chars):`, text.substring(0, 500));

    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html') || text.startsWith('<HTML')) {
      console.error(`[Canada Tire API] Received HTML instead of JSON - Authentication likely failed`);
      console.error(`[Canada Tire API] Full HTML response (first 1000 chars):`, text.substring(0, 1000));
      throw new AdapterError("Canada Tire API returned HTML instead of JSON (OAuth authentication likely failed)", {
        status: 401,
        expose: true,
        details: {
          hint: "Check OAuth credentials (consumer key/secret, token ID/secret) and realm configuration",
          responsePreview: text.substring(0, 200),
        },
      });
    }

    if (!text || text.trim() === '') {
      console.error(`[Canada Tire API] Received empty response`);
      throw new AdapterError("Canada Tire API returned empty response", {
        status: 502,
        expose: true,
      });
    }

    let parsed: ApiResponse<CanadaTireResponseMap[T]>;
    try {
      parsed = JSON.parse(text) as ApiResponse<CanadaTireResponseMap[T]>;
      console.log(`[Canada Tire API] Parsed response (success=${parsed.success}):`, JSON.stringify(parsed, null, 2));
    } catch (parseError) {
      console.error(`[Canada Tire API] Failed to parse JSON:`, parseError);
      console.error(`[Canada Tire API] Raw text that failed to parse:`, text);
      throw new AdapterError("Canada Tire API returned malformed JSON", {
        status: 502,
        expose: true,
        cause: parseError,
        details: {
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
          responseText: text.substring(0, 500),
        },
      });
    }

    if (response.status === 401) {
      console.error(`[Canada Tire API] 401 Unauthorized - OAuth authentication failed`);
      throw new AdapterError("OAuth authentication failed", {
        status: 401,
        expose: true,
        details: {
          hint: "Verify consumer key, consumer secret, token ID, token secret, and realm",
          apiError: parsed.error,
        },
      });
    }

    if (!response.ok) {
      console.error(`[Canada Tire API] HTTP error ${response.status}:`, parsed);
      throw new AdapterError(parsed.error?.errorMsg || `HTTP ${response.status}`, {
        status: mapErrorStatus(parsed.error?.code, response.status),
        expose: true,
        details: { code: parsed.error?.code, message: parsed.error?.errorMsg },
      });
    }

    if (!parsed.success) {
      console.error(`[Canada Tire API] API returned success=false:`, parsed);
      throw new AdapterError(parsed.error?.errorMsg || "Canada Tire API error", {
        status: mapErrorStatus(parsed.error?.code, 502),
        expose: parsed.error?.code === 400 || parsed.error?.code === 401,
        details: { code: parsed.error?.code, message: parsed.error?.errorMsg },
      });
    }

    console.log(`[Canada Tire API] ========== REQUEST SUCCESS ==========`);
    return parsed;
  } catch (error) {
    console.error(`[Canada Tire API] ========== REQUEST FAILED ==========`);
    if (error instanceof AdapterError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AdapterError("Canada Tire API request timed out", {
        status: 504,
        expose: true,
      });
    }
    console.error(`[Canada Tire API] Unexpected error:`, error);
    throw new AdapterError("Unexpected error while contacting Canada Tire", {
      status: 502,
      expose: false,
      cause: error,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function mapErrorStatus(code: number | "" | undefined, fallback: number): number {
  if (code === 400 || code === 401 || code === 500) {
    return code;
  }
  return fallback;
}

export function createCanadaTireAdapter(config: CanadaTireConfig) {
  return {
    async searchProducts(payload: { filters?: unknown }) {
      const filters = validateFilters(payload.filters);
      const body = filters && Object.keys(filters).length > 0 ? { filters } : {};
      const response = await postToEndpoint(config, "searchProducts", body);
      return response;
    },
    async getShipToAddresses() {
      return await postToEndpoint(config, "getShipToAddresses", {});
    },
    async submitOrder(payload: { orderDetails: unknown }) {
      const orderDetails = validateOrderDetails(payload.orderDetails);
      return await postToEndpoint(config, "submitOrder", { orderDetails });
    },
    async updateOrderAddress(payload: { orderDetails: unknown }) {
      assert(payload.orderDetails && typeof payload.orderDetails === "object", "orderDetails must be provided");
      const raw = payload.orderDetails as Record<string, unknown>;
      const soId = normalizeInteger(raw.soId, "orderDetails.soId");
      assert(soId && soId > 0, "orderDetails.soId must be a positive integer");
      const shippingInput = raw.shipping as ShippingInfo | undefined;
      assert(shippingInput && typeof shippingInput === "object", "orderDetails.shipping is required");
      const requirement = ensureShippingRequirement(shippingInput);
      const normalizedShipping: ShippingInfo = { ...shippingInput };
      if (requirement.type === "addrId") {
        normalizedShipping.addrId = requirement.addrId;
        delete normalizedShipping.addr1;
        delete normalizedShipping.province;
        delete normalizedShipping.postalCode;
        delete normalizedShipping.country;
      } else {
        normalizedShipping.addrId = undefined;
        normalizedShipping.addr1 = requirement.addr1;
        normalizedShipping.province = requirement.province;
        normalizedShipping.postalCode = requirement.postalCode;
        normalizedShipping.country = requirement.country;
      }
      const addr2 = normalizeString(shippingInput.addr2, "orderDetails.shipping.addr2");
      if (addr2) normalizedShipping.addr2 = addr2;
      const attention = normalizeString(shippingInput.attention, "orderDetails.shipping.attention");
      if (attention) normalizedShipping.attention = attention;
      const addressee = normalizeString(shippingInput.addressee, "orderDetails.shipping.addressee");
      if (addressee) normalizedShipping.addressee = addressee;
      const city = normalizeString(shippingInput.city, "orderDetails.shipping.city");
      if (city) normalizedShipping.city = city;

      return await postToEndpoint(config, "updateOrderAddress", {
        orderDetails: {
          soId,
          shipping: normalizedShipping,
        },
      });
    },
  };
}