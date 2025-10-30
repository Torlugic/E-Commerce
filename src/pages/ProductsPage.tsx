import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ProductList from "../components/product/ProductList";
import ProductFilters from "../components/product/ProductFilters";
import { fetchProducts, type ProductFilters as Filters } from "../services/catalog";
import type { Product, ProductVariant } from "../models/types";
import { useCart } from "../hooks/useCart";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchProducts({ signal: controller.signal, filters })
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
    };
  }, [filters]);

  const handleAddToCart = async (product: Product, variant: ProductVariant) => {
    try {
      await addItem(product.id, variant.id, 1);
      toast.success(`${product.title} added to cart`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not add to cart";
      toast.error(message);
    }
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <div className="max-w-[var(--container-max)] mx-auto space-y-[var(--space-lg)]">
      <header className="space-y-[var(--space-xs)]">
        <h1 className="text-3xl font-[var(--font-heading)] font-semibold">Products</h1>
        <p className="text-[var(--text-muted)]">Browse our tire catalogue.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-[var(--space-lg)]">
        <aside className="lg:col-span-1">
          <ProductFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={handleClearFilters}
          />
        </aside>

        <main className="lg:col-span-3">
          {error && (
            <div className="mb-[var(--space-md)] p-[var(--space-md)] bg-red-50 border border-red-200 rounded-[var(--radius-md)] text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-[var(--text-muted)]">Loading products…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)] mb-2">No products found matching your filters.</p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-sm text-[var(--link)] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="mb-[var(--space-md)] flex items-center justify-between">
                <p className="text-sm text-[var(--text-muted)]">
                  Showing {products.length} {products.length === 1 ? 'product' : 'products'}
                </p>
              </div>
              <ProductList products={products} onAddToCart={handleAddToCart} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
