import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useCart } from "../../contexts/CartContext";
import { fetchProducts } from "../../services/catalog";
import type { Product, ProductVariant } from "../../models/types";

type DetailedCartItem = {
  product: Product;
  variant: ProductVariant;
  quantity: number;
  lineTotal: number;
};

export default function CartPage() {
  const { cart, loading, removeItem, updateItemQuantity, clearCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setCatalogLoading(true);
    fetchProducts()
      .then((result) => {
        if (mounted) setProducts(result);
      })
      .catch((err) => {
        console.error("Failed to load products", err);
        if (mounted) setError("Unable to load products right now");
      })
      .finally(() => {
        if (mounted) setCatalogLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const items: DetailedCartItem[] = useMemo(() => {
    if (!cart) return [];
    return cart.items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        const variant = product?.variants.find((v) => v.id === item.variantId);
        if (!product || !variant) return null;
        return {
          product,
          variant,
          quantity: item.quantity,
          lineTotal: variant.price.amount * item.quantity,
        } satisfies DetailedCartItem;
      })
      .filter((value): value is DetailedCartItem => Boolean(value));
  }, [cart, products]);

  const currency = items[0]?.variant.price.currency ?? cart?.subtotal.currency ?? "CAD";
  const subtotal = cart?.subtotal.amount ?? items.reduce((sum, item) => sum + item.lineTotal, 0);

  const handleQuantityChange = async (productId: string, variantId: string, nextQuantity: number) => {
    try {
      await updateItemQuantity(productId, variantId, nextQuantity);
    } catch (err: any) {
      toast.error(err.message || "Unable to update quantity");
    }
  };

  const handleRemove = async (productId: string, variantId: string) => {
    try {
      await removeItem(productId, variantId);
      toast.success("Item removed from cart");
    } catch (err: any) {
      toast.error(err.message || "Unable to remove item");
    }
  };

  const handleClear = async () => {
    try {
      await clearCart();
      toast.success("Cart cleared");
    } catch (err: any) {
      toast.error(err.message || "Unable to clear cart");
    }
  };

  const isEmpty = !items.length && !loading && !catalogLoading;

  return (
    <div className="max-w-[var(--container-max)] mx-auto space-y-[var(--space-lg)]">
      <div className="flex items-center justify-between flex-wrap gap-[var(--space-md)]">
        <div>
          <h2 className="text-2xl font-[var(--font-heading)] font-semibold">Your Shopping Cart</h2>
          {error && <p className="text-sm text-red-500 mt-[var(--space-xs)]">{error}</p>}
        </div>
        {!isEmpty && (
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)]"
            disabled={loading}
          >
            Clear cart
          </button>
        )}
      </div>

      {loading || catalogLoading ? (
        <p className="text-[var(--text-muted)]">Loading your items…</p>
      ) : isEmpty ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] p-[var(--space-xl)] text-center text-[var(--text-muted)]">
          Your cart is empty. Browse our <a href="/products" className="text-[var(--accent)] underline">products</a> to add items.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {items.map(({ product, variant, quantity, lineTotal }) => (
            <li key={`${product.id}-${variant.id}`} className="flex flex-col gap-[var(--space-sm)] py-[var(--space-md)] sm:flex-row sm:items-center">
              <div className="flex items-center gap-[var(--space-md)] flex-1">
                <img
                  src={variant.image ?? product.images[0]}
                  alt={product.title}
                  className="w-20 h-20 object-cover rounded-[var(--radius-md)]"
                />
                <div className="space-y-[var(--space-xs)]">
                  <h3 className="font-[var(--font-heading)] text-lg">{product.title}</h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    {Object.entries(variant.attributes ?? {}).map(([key, value]) => `${key}: ${value}`).join(", ") || variant.title}
                  </p>
                  <div className="flex items-center gap-[var(--space-sm)] text-sm">
                    <label htmlFor={`qty-${product.id}-${variant.id}`} className="text-[var(--text-muted)]">
                      Qty
                    </label>
                    <input
                      id={`qty-${product.id}-${variant.id}`}
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => {
                        const parsed = Number(e.target.value);
                        if (Number.isNaN(parsed)) return;
                        handleQuantityChange(product.id, variant.id, Math.max(1, parsed));
                      }}
                      className="w-20 rounded border border-[var(--border)] bg-transparent px-2 py-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemove(product.id, variant.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-right text-lg font-semibold">
                ${(lineTotal / 100).toFixed(2)} {currency}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!isEmpty && (
        <div className="pt-[var(--space-lg)] border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[var(--space-md)] text-lg">
          <div>
            <span className="text-[var(--text-muted)]">Subtotal</span>
          </div>
          <div className="font-bold text-2xl">
            ${(subtotal / 100).toFixed(2)} {currency}
          </div>
        </div>
      )}

      {!isEmpty && (
        <div className="mt-[var(--space-md)] flex flex-wrap gap-[var(--space-md)]">
          <button className="btn-primary px-5 py-3 text-base">Proceed to Checkout</button>
          <a href="/products" className="px-5 py-3 text-base border border-[var(--border)] rounded-[var(--radius-md)] hover:bg-[var(--surface)]">
            Continue shopping
          </a>
        </div>
      )}
    </div>
  );
}
