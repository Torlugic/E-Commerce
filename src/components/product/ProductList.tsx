import React from "react";
import { mockProducts } from "../../mocks/catalog";
import type { Product } from "../../models/types";

export default function ProductList() {
  return (
    <div className="grid gap-[var(--space-lg)] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-[var(--space-lg)]">
      {mockProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const variant = product.variants[0];
  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-md)] shadow p-[var(--space-md)] flex flex-col">
      <img src={variant.image ?? product.images[0]} alt={product.title} className="w-full h-48 object-cover rounded-md" />
      <h3 className="mt-[var(--space-sm)] text-lg font-[var(--font-heading)]">
        {product.title}
      </h3>
      <p className="text-[var(--text-muted)] mt-[var(--space-sm)]">{product.description}</p>
      <div className="mt-auto flex items-center justify-between">
        <span className="font-bold">
          ${(variant.price.amount / 100).toFixed(2)} {variant.price.currency}
        </span>
        <button className="btn-primary px-3 py-1 rounded-[var(--radius-sm)]">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
