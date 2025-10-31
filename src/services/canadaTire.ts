export interface CanadaTireProductFilters {
  width?: number;
  rimSize?: number;
  aspectRatio?: number;
  size?: string;
  partNumber?: string[];
  brand?: string;
  searchKey?: string;
  isWinter?: boolean;
  isRunFlat?: boolean;
  isTire?: boolean;
  isWheel?: boolean;
  page?: number;
}

export interface CanadaTireInventoryEntry {
  location: string;
  quantity: number;
}

export interface CanadaTireProduct {
  partNumber: string;
  name: string;
  performanceCategory: string;
  brand: string;
  model: string;
  size: string;
  isWinter: boolean;
  isRunFlat: boolean;
  isTire: boolean;
  isWheel: boolean;
  cost: string;
  msrp: string;
  inventory: CanadaTireInventoryEntry[];
}

export interface CanadaTireShipToAddress {
  addrId: number;
  attention: string;
  addressee: string;
  addr1: string;
  addr2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface CanadaTireOrderItem {
  partNumber: string;
  quantity: number;
}

export interface CanadaTireShippingInfo {
  addrId?: number;
  addr1?: string;
  addr2?: string;
  attention?: string;
  addressee?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export interface CanadaTireOrderDetails {
  poNumber?: string;
  location: string;
  email?: string;
  phone?: string;
  shipping: CanadaTireShippingInfo;
  items: CanadaTireOrderItem[];
}

export interface CanadaTireApiResponse<T> {
  data: T;
  success: boolean;
  error?: {
    code: number | "";
    errorMsg: string;
  };
}

export interface CanadaTireErrorResponse {
  success: false;
  error: {
    code: number;
    message: string;
  };
}

type CanadaTireAction = "searchProducts" | "getShipToAddresses" | "submitOrder" | "updateOrderAddress";

interface DistributorRequest<T> {
  vendor: "canadaTire";
  action: CanadaTireAction;
  payload: T;
}

const DEBUG = import.meta.env.DEV;

function debugLog(message: string, data?: unknown): void {
  if (DEBUG) {
    console.log(`[Canada Tire Service] ${message}`, data !== undefined ? data : "");
  }
}

function cleanFilters(filters: CanadaTireProductFilters): CanadaTireProductFilters {
  const cleaned: CanadaTireProductFilters = {};

  if (filters.width !== undefined && filters.width !== null && !isNaN(filters.width)) {
    cleaned.width = Number(filters.width);
  }

  if (filters.rimSize !== undefined && filters.rimSize !== null && !isNaN(filters.rimSize)) {
    cleaned.rimSize = Number(filters.rimSize);
  }

  if (filters.aspectRatio !== undefined && filters.aspectRatio !== null && !isNaN(filters.aspectRatio)) {
    cleaned.aspectRatio = Number(filters.aspectRatio);
  }

  if (filters.size && typeof filters.size === "string" && filters.size.trim()) {
    cleaned.size = filters.size.trim();
  }

  if (filters.partNumber && Array.isArray(filters.partNumber) && filters.partNumber.length > 0) {
    cleaned.partNumber = filters.partNumber.filter(p => p && typeof p === "string" && p.trim()).map(p => p.trim());
  }

  if (filters.brand && typeof filters.brand === "string" && filters.brand.trim()) {
    cleaned.brand = filters.brand.trim();
  }

  if (filters.searchKey && typeof filters.searchKey === "string" && filters.searchKey.trim()) {
    cleaned.searchKey = filters.searchKey.trim();
  }

  if (typeof filters.isWinter === "boolean") {
    cleaned.isWinter = filters.isWinter;
  }

  if (typeof filters.isRunFlat === "boolean") {
    cleaned.isRunFlat = filters.isRunFlat;
  }

  if (typeof filters.isTire === "boolean") {
    cleaned.isTire = filters.isTire;
  }

  if (typeof filters.isWheel === "boolean") {
    cleaned.isWheel = filters.isWheel;
  }

  if (filters.page !== undefined && filters.page !== null && Number.isInteger(filters.page) && filters.page > 0) {
    cleaned.page = filters.page;
  }

  return cleaned;
}

async function callDistributorFunction<T>(
  action: CanadaTireAction,
  payload: unknown
): Promise<CanadaTireApiResponse<T>> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const apiUrl = `${supabaseUrl}/functions/v1/distributor`;

  const request: DistributorRequest<unknown> = {
    vendor: "canadaTire",
    action,
    payload,
  };

  debugLog(`Calling distributor function: ${action}`, request);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    debugLog(`Response status: ${response.status}`);

    const data = await response.json();
    debugLog("Response data", data);

    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (!data.success) {
      throw new Error(data.error?.errorMsg || data.error?.message || "API request failed");
    }

    return data as CanadaTireApiResponse<T>;
  } catch (error) {
    console.error(`[Canada Tire Service] Error calling ${action}:`, error);
    throw error;
  }
}

export async function searchProducts(
  filters: CanadaTireProductFilters
): Promise<CanadaTireProduct[]> {
  const cleanedFilters = cleanFilters(filters);

  debugLog("Searching products with filters", cleanedFilters);

  const payload = Object.keys(cleanedFilters).length > 0
    ? { filters: cleanedFilters }
    : {};

  const response = await callDistributorFunction<CanadaTireProduct[]>("searchProducts", payload);
  return response.data;
}

export async function getShipToAddresses(): Promise<CanadaTireShipToAddress[]> {
  debugLog("Fetching ship-to addresses");
  const response = await callDistributorFunction<CanadaTireShipToAddress[]>("getShipToAddresses", {});
  return response.data;
}

export async function submitOrder(orderDetails: CanadaTireOrderDetails): Promise<{
  id: string;
  orderNumber: string;
  orderTotal: string;
  salesTax: string;
  tireTax: string;
  shippingCost: string;
  items: Array<{
    partNumber: string;
    quantity: number;
    itemTotal: string;
  }>;
}> {
  debugLog("Submitting order", orderDetails);
  const response = await callDistributorFunction<{
    id: string;
    orderNumber: string;
    orderTotal: string;
    salesTax: string;
    tireTax: string;
    shippingCost: string;
    items: Array<{
      partNumber: string;
      quantity: number;
      itemTotal: string;
    }>;
  }>("submitOrder", { orderDetails });
  return response.data;
}

export async function updateOrderAddress(
  soId: number,
  shipping: CanadaTireShippingInfo
): Promise<{ soId: number }> {
  debugLog("Updating order address", { soId, shipping });
  const response = await callDistributorFunction<{ soId: number }>("updateOrderAddress", {
    orderDetails: {
      soId,
      shipping,
    },
  });
  return response.data;
}
