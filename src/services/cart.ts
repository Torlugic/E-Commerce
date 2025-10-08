import type { Cart, CartItem } from "../models/types";
import { mockProducts } from "../mocks/catalog";
import { apiFetch, usingMocks } from "./http";

const CART_STORAGE_KEY = "cart-state";
const CART_ENDPOINT = "/cart";

function createEmptyCart(): Cart {
  const currency = mockProducts[0]?.variants[0]?.price.currency ?? "CAD";
  return {
    items: [],
    subtotal: { amount: 0, currency },
    total: { amount: 0, currency },
  };
}

function readLocalCart(): Cart {
  if (typeof window === "undefined") {
    return createEmptyCart();
  }
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return createEmptyCart();
    }
    const parsed: Cart = JSON.parse(raw);
    return recalculateTotals(parsed.items);
  } catch {
    return createEmptyCart();
  }
}

function writeLocalCart(cart: Cart) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // ignore quota errors
  }
}

function recalculateTotals(items: CartItem[]): Cart {
  let amount = 0;
  for (const item of items) {
    const product = mockProducts.find((p) => p.id === item.productId);
    const variant = product?.variants.find((v) => v.id === item.variantId);
    if (!variant) continue;
    amount += variant.price.amount * item.quantity;
  }

  const currency = mockProducts[0]?.variants[0]?.price.currency ?? "CAD";

  return {
    items,
    subtotal: { amount, currency },
    total: { amount, currency },
  };
}

export async function fetchCart(): Promise<Cart> {
  if (usingMocks()) {
    return readLocalCart();
  }

  return apiFetch<Cart>(CART_ENDPOINT, { method: "GET" });
}

export async function addItem(productId: string, variantId: string, quantity = 1): Promise<Cart> {
  if (usingMocks()) {
    const cart = readLocalCart();
    const existing = cart.items.find(
      (item) => item.productId === productId && item.variantId === variantId
    );

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ productId, variantId, quantity });
    }

    const next = recalculateTotals(cart.items);
    writeLocalCart(next);
    return next;
  }

  return apiFetch<Cart>(CART_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({ productId, variantId, quantity }),
  });
}

export async function updateItemQuantity(productId: string, variantId: string, quantity: number): Promise<Cart> {
  if (quantity <= 0) {
    return removeItem(productId, variantId);
  }

  if (usingMocks()) {
    const cart = readLocalCart();
    const existing = cart.items.find(
      (item) => item.productId === productId && item.variantId === variantId
    );

    if (existing) {
      existing.quantity = quantity;
    }

    const next = recalculateTotals(cart.items);
    writeLocalCart(next);
    return next;
  }

  return apiFetch<Cart>(`${CART_ENDPOINT}/${productId}/${variantId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export async function removeItem(productId: string, variantId: string): Promise<Cart> {
  if (usingMocks()) {
    const cart = readLocalCart();
    const nextItems = cart.items.filter(
      (item) => !(item.productId === productId && item.variantId === variantId)
    );
    const next = recalculateTotals(nextItems);
    writeLocalCart(next);
    return next;
  }

  return apiFetch<Cart>(`${CART_ENDPOINT}/${productId}/${variantId}`, {
    method: "DELETE",
  });
}

export async function clearCart(): Promise<Cart> {
  if (usingMocks()) {
    const cleared = createEmptyCart();
    writeLocalCart(cleared);
    return cleared;
  }

  return apiFetch<Cart>(`${CART_ENDPOINT}/clear`, { method: "POST" });
}
