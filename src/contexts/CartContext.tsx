import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type { Cart } from "../models/types";
import type { CartContextValue } from "./cartTypes";
import * as cartService from "../services/cart";

// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
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

  const value: CartContextValue = {
    cart,
    loading,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart: clearCartHandler,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
