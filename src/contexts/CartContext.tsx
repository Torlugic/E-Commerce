import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Cart } from "../models/types";
import * as cartService from "../services/cart";

type CartContextType = {
  cart: Cart | null;
  loading: boolean;
  addItem: (productId: string, variantId: string, quantity?: number) => Promise<void>;
  updateItemQuantity: (productId: string, variantId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string, variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartCtx = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    cartService
      .fetchCart()
      .then((data) => {
        if (mounted) setCart(data);
      })
      .catch((err) => {
        console.error("Failed to load cart", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const addItem = useCallback(async (productId: string, variantId: string, quantity = 1) => {
    const next = await cartService.addItem(productId, variantId, quantity);
    setCart(next);
  }, []);

  const updateItemQuantity = useCallback(async (productId: string, variantId: string, quantity: number) => {
    const next = await cartService.updateItemQuantity(productId, variantId, quantity);
    setCart(next);
  }, []);

  const removeItem = useCallback(async (productId: string, variantId: string) => {
    const next = await cartService.removeItem(productId, variantId);
    setCart(next);
  }, []);

  const clearCartHandler = useCallback(async () => {
    const next = await cartService.clearCart();
    setCart(next);
  }, []);

  return (
    <CartCtx.Provider value={{ cart, loading, addItem, updateItemQuantity, removeItem, clearCart: clearCartHandler }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
