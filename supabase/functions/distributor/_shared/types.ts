export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error: {
    code: number | "";
    errorMsg: string;
  };
}

export interface BaseRequest {
  customerId: string;
  customerToken: string;
}

export interface ProductSearchFilters {
  width?: number;
  rimSize?: number;
  aspectRatio?: number;
  size?: string;
  partNumber?: string[];
  brand?: string;
  searchKey?: string;
  isWinter?: boolean | null;
  isRunFlat?: boolean | null;
  isTire?: boolean | null;
  isWheel?: boolean | null;
  page?: number;
}

export interface ProductSearchRequest extends BaseRequest {
  filters?: ProductSearchFilters;
}

export interface InventoryEntry {
  location: string;
  quantity: number;
}

export interface ProductRow {
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
  inventory: InventoryEntry[];
}

export type ShipToSearchRequest = BaseRequest;

export interface ShipToAddress {
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

export interface OrderItem {
  partNumber: string;
  quantity: number;
}

export interface ShippingInfo {
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

export interface OrderDetails {
  poNumber?: string;
  location: string;
  email?: string;
  phone?: string;
  shipping: ShippingInfo;
  items: OrderItem[];
}

export interface SubmitOrderRequest extends BaseRequest {
  orderDetails: OrderDetails;
}

export interface OrderResponseItem {
  partNumber: string;
  quantity: number;
  itemTotal: string;
}

export interface SubmitOrderResponseData {
  id: string;
  orderNumber: string;
  orderTotal: string;
  salesTax: string;
  tireTax: string;
  shippingCost: string;
  items: OrderResponseItem[];
}

export interface UpdateOrderAddressRequest extends BaseRequest {
  orderDetails: {
    soId: number;
    shipping: ShippingInfo;
  };
}

export interface UpdateOrderAddressResponseData {
  soId: number;
}

export type CanadaTireAction =
  | "searchProducts"
  | "getShipToAddresses"
  | "submitOrder"
  | "updateOrderAddress";

export interface DistributorRequestPayload<A extends CanadaTireAction> {
  action: A;
  vendor: "canadaTire";
  payload: DistributorActionPayload[A];
}

export interface SearchProductsPayload {
  filters?: ProductSearchFilters;
}

export interface SubmitOrderPayload {
  orderDetails: OrderDetails;
}

export interface UpdateOrderAddressPayload {
  orderDetails: {
    soId: number;
    shipping: ShippingInfo;
  };
}

export type DistributorActionPayload = {
  searchProducts: SearchProductsPayload;
  getShipToAddresses: Record<string, never>;
  submitOrder: SubmitOrderPayload;
  updateOrderAddress: UpdateOrderAddressPayload;
};

export type DistributorResponse<A extends CanadaTireAction> =
  A extends "searchProducts"
    ? ApiResponse<ProductRow[]>
    : A extends "getShipToAddresses"
      ? ApiResponse<ShipToAddress[]>
      : A extends "submitOrder"
        ? ApiResponse<SubmitOrderResponseData>
        : A extends "updateOrderAddress"
          ? ApiResponse<UpdateOrderAddressResponseData>
          : never;