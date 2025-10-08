import type { Cart } from "../models/types";

export type CartContextValue = {
  cart: Cart | null;
  loading: boolean;
  addItem: (productId: string, variantId: string, quantity?: number) => Promise<void>;
  updateItemQuantity: (productId: string, variantId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string, variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
};
