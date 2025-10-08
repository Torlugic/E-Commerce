import React from "react";
import { mockCart, mockProducts } from "../../mocks/catalog";
import type { CartItem } from "../../models/types";

export default function CartPage() {
  const cart = mockCart;

  const getProduct = (productId: string) =>
    mockProducts.find((p) => p.id === productId);

  return (
    <div className="max-w-[var(--container-max)] mx-auto px-[var(--space-lg)] space-y-[var(--space-lg)]">
      <h2 className="text-2xl font-[var(--font-heading)] font-semibold">Your Shopping Cart</h2>
      {cart.items.length === 0 ? (
        <p className="text-[var(--text-muted)]">Your cart is empty.</p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {cart.items.map((item: CartItem) => {
            const prod = getProduct(item.productId);
            const variant = prod?.variants.find((v) => v.id === item.variantId);
            if (!prod || !variant) return null;
            return (
              <li key={`${item.productId}-${item.variantId}`} className="flex items-center py-[var(--space-md)]">
                <img src={variant.image ?? prod.images[0]} alt={prod.title} className="w-16 h-16 object-cover rounded-md" />
                <div className="ml-[var(--space-md)] flex-1">
                  <h3 className="font-[var(--font-heading)]">{prod.title}</h3>
                  <p className="text-[var(--text-muted)]">
                    {variant.attributes ? Object.entries(variant.attributes).map(([k, v]) => `${k}: ${v} `) : null}
                  </p>
                  <p className="mt-[var(--space-sm)]">Qty: {item.quantity}</p>
                </div>
                <span className="font-bold">
                  ${(variant.price.amount * item.quantity / 100).toFixed(2)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="pt-[var(--space-lg)] border-t border-[var(--border)] flex justify-between text-lg">
        <span>Subtotal</span>
        <span className="font-bold">
          ${(cart.subtotal.amount / 100).toFixed(2)} {cart.subtotal.currency}
        </span>
      </div>
      <div className="mt-[var(--space-md)]">
        <button className="btn-primary px-5 py-2">Proceed to Checkout</button>
      </div>
    </div>
  );
}
