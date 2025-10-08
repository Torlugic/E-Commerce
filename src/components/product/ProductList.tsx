import type { Product, ProductVariant } from "../../models/types";

type Props = {
  products: Product[];
  onAddToCart?: (product: Product, variant: ProductVariant) => void;
};

export default function ProductList({ products, onAddToCart }: Props) {
  if (!products.length) {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] p-[var(--space-xl)] text-center text-[var(--text-muted)]">
        No products found.
      </div>
    );
  }

  return (
    <div className="grid gap-[var(--space-lg)] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}

type CardProps = {
  product: Product;
  onAddToCart?: (product: Product, variant: ProductVariant) => void;
};

function ProductCard({ product, onAddToCart }: CardProps) {
  const variant = product.variants[0];
  if (!variant) return null;

  const handleClick = () => {
    onAddToCart?.(product, variant);
  };

  return (
    <article className="bg-[var(--surface)] rounded-[var(--radius-md)] shadow-sm border border-[color-mix(in oklab,var(--border) 80%,transparent)] overflow-hidden flex flex-col">
      <div className="relative h-52 overflow-hidden">
        <img
          src={variant.image ?? product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col gap-[var(--space-sm)] p-[var(--space-md)]">
        <div>
          <h3 className="text-lg font-[var(--font-heading)] font-semibold">{product.title}</h3>
          {product.description && (
            <p className="text-sm text-[var(--text-muted)] mt-[var(--space-xs)]">
              {product.description}
            </p>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div className="font-semibold text-base">
            ${(variant.price.amount / 100).toFixed(2)} {variant.price.currency}
          </div>
          <button
            type="button"
            onClick={handleClick}
            className="btn-primary px-3 py-2 text-sm font-medium"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}
