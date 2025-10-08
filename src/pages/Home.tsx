import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ParallaxSection from "../components/ui/ParallaxSection";
import ProductList from "../components/product/ProductList";
import { brand } from "../config/brand";
import type { Product, ProductVariant } from "../models/types";
import { fetchProducts } from "../services/catalog";
import { useCart } from "../hooks/useCart";

export default function Home() {
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
          setError("We couldn't load featured products. Please try again later.");
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
  }, []);

  const featuredProducts = useMemo(() => products.slice(0, 3), [products]);

  const handleAddToCart = async (product: Product, variant: ProductVariant) => {
    try {
      await addItem(product.id, variant.id, 1);
      toast.success(`${product.title} added to cart`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not add to cart";
      toast.error(message);
    }
  };

  const heroImage = brand.marketing?.heroImage ?? "https://images.unsplash.com/photo-1517940310602-4d2b220d9b6a?q=80&w=1600&auto=format&fit=crop";

  return (
    <div className="space-y-[var(--space-3xl)]">
      <ParallaxSection image={heroImage} height="70vh" strength={0.3}>
        <div className="space-y-[var(--space-md)]">
          <p className="uppercase tracking-[0.4rem] text-sm text-[var(--text-muted)]">
            {brand.siteName}
          </p>
          <h1 className="text-4xl md:text-6xl font-[var(--font-heading)] font-bold text-[var(--text)]">
            {brand.marketing?.heroTagline ?? "Find your perfect fit."}
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            {brand.marketing?.heroSub ?? "White-glove e-commerce for modern retailers."}
          </p>
          <div className="flex flex-wrap justify-center gap-[var(--space-md)]">
            <a href="/products" className="btn-primary px-6 py-3 text-base font-semibold">
              Shop Now
            </a>
            <a
              href={brand.links.contact}
              className="px-6 py-3 text-base border border-[var(--border)] rounded-[var(--radius-md)] hover:bg-[var(--surface)]"
            >
              Talk to us
            </a>
          </div>
        </div>
      </ParallaxSection>

      <section className="max-w-[var(--container-max)] mx-auto space-y-[var(--space-lg)] px-[var(--space-lg)]">
        <header className="space-y-[var(--space-xs)] text-center">
          <h2 className="text-3xl font-[var(--font-heading)] font-semibold">
            {brand.marketing?.featuredCategoriesTitle ?? "Featured Categories"}
          </h2>
          <p className="text-[var(--text-muted)]">
            {brand.marketing?.featuredCategoriesSubtitle ?? "Shop our most popular collections."}
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-lg)]">
          {(brand.marketing?.featuredCategories ?? []).map((category) => (
            <a
              key={category.name}
              href={category.href}
              className="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-[var(--space-lg)] shadow-sm hover:border-[var(--accent)] transition"
            >
              <h3 className="text-xl font-semibold mb-[var(--space-sm)] group-hover:text-[var(--accent)]">
                {category.name}
              </h3>
              <span className="text-sm text-[var(--text-muted)] group-hover:text-[var(--accent)]">Shop now →</span>
            </a>
          ))}
        </div>
      </section>

      <section className="max-w-[var(--container-max)] mx-auto space-y-[var(--space-lg)] px-[var(--space-lg)]">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-[var(--space-md)]">
          <div>
            <h2 className="text-3xl font-[var(--font-heading)] font-semibold">Latest arrivals</h2>
            <p className="text-[var(--text-muted)]">Handpicked gear to elevate your build.</p>
          </div>
          <a href="/products" className="text-[var(--accent)] font-medium">View all products</a>
        </header>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading ? (
          <p className="text-[var(--text-muted)]">Loading featured products…</p>
        ) : (
          <ProductList products={featuredProducts} onAddToCart={handleAddToCart} />
        )}
      </section>
    </div>
  );
}
