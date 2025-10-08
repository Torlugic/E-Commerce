// types.ts

export type Money = {
  amount: number;        // in smallest unit (e.g. cents) or decimal as per your choice
  currency: string;      // e.g. "CAD"
};

export interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  price: Money;
  compareAtPrice?: Money;  // for discounted
  image?: string;
  attributes?: Record<string, string>; // e.g. { size: "Large", color: "Black" }
  stock?: number;
}

export interface Product {
  id: string;
  title: string;
  description?: string;
  images: string[];
  variants: ProductVariant[];
  // optional branding / SEO fields
  slug: string;
  tags?: string[];
  categories?: string[];
}

/// Cart

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface Cart {
  id?: string;  // optional, for guest carts
  items: CartItem[];
  // You might also include applied discounts, shipping, totals (computed)
  subtotal: Money;
  discountAmount?: Money;
  total: Money;
}

/// Order & OrderItem

export interface OrderItem {
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: Money;        // price per item at time of order
  totalPrice: Money;       // unitPrice * quantity minus discount
}

export interface Order {
  id: string;
  userId?: string;         // optional for guest orders
  items: OrderItem[];
  subtotal: Money;
  discountAmount?: Money;
  taxAmount?: Money;
  shippingCost?: Money;
  total: Money;
  createdAt: string;       // ISO date string
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled" | string;
  shippingAddress?: Address;
  billingAddress?: Address;
}

export interface Address {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  province?: string;
  postalCode: string;
  country: string;
}

/// User

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  // optional: addresses, phone, etc.
  addressBook?: Address[];
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}
