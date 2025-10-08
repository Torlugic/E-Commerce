import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ProductList from "../components/product/ProductList";
import { fetchProducts } from "../services/catalog";
import type { Product, ProductVariant } from "../models/types";
import { useCart } from "../contexts/CartContext";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchProducts({ signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) {
          setProducts(result);
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if ((err as { name?: string })?.name === "AbortError") return;
        console.error("Failed to load products", err);
        if (!controller.signal.aborted) {
          setError("We couldn't load products. Please try again later.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => {
      controller.abort();
    let mounted = true;
    setLoading(true);
    fetchProducts()
      .then((result) => {
        if (mounted) setProducts(result);
      })
      .catch((err) => {
        console.error("Failed to load products", err);
        if (mounted) setError("We couldn't load products. Please try again later.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddToCart = async (product: Product, variant: ProductVariant) => {
    try {
      await addItem(product.id, variant.id, 1);
      toast.success(`${product.title} added to cart`);
    } catch (err: any) {
      toast.error(err.message || "Could not add to cart");
    }
  };

  return (
    <div className="max-w-[var(--container-max)] mx-auto space-y-[var(--space-lg)]">
      <header className="space-y-[var(--space-xs)]">
        <h1 className="text-3xl font-[var(--font-heading)] font-semibold">Products</h1>
        <p className="text-[var(--text-muted)]">Browse the complete catalogue.</p>
      </header>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {loading ? (
        <p className="text-[var(--text-muted)]">Loading products…</p>
      ) : (
        <ProductList products={products} onAddToCart={handleAddToCart} />
      )}
    </div>
  );
}
