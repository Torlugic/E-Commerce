import type { Product, Cart } from "../models/types";

export const mockProducts: Product[] = [
  {
    id: "prod1",
    slug: "tire-205-55-16",
    title: "205/55R16 All-Season Tire",
    description: "Durable all-season tire.",
    images: ["https://via.placeholder.com/400x300?text=Tire"],
    variants: [
      {
        id: "v1",
        sku: "TIRE-205-55-16-B",
        title: "Black",
        price: { amount: 10000, currency: "CAD" },
        compareAtPrice: { amount: 12000, currency: "CAD" },
        image: "https://via.placeholder.com/400x300?text=Tire+Black",
        stock: 50,
        attributes: { color: "Black" },
      },
    ],
  },
  {
    id: "prod2",
    slug: "rim-17-5x114",
    title: "17\" Alloy Rim",
    description: "Stylish aluminum rim.",
    images: ["https://via.placeholder.com/400x300?text=Rim"],
    variants: [
      {
        id: "v2",
        sku: "RIM-17-5X114",
        title: "Gunmetal",
        price: { amount: 20000, currency: "CAD" },
        image: "https://via.placeholder.com/400x300?text=Rim+Gunmetal",
        stock: 20,
        attributes: { finish: "Gunmetal" },
      },
    ],
  },
];

export const mockCart: Cart = {
  items: [
    { productId: "prod1", variantId: "v1", quantity: 2 },
    { productId: "prod2", variantId: "v2", quantity: 1 },
  ],
  subtotal: { amount: 40000, currency: "CAD" },
  total: { amount: 40000, currency: "CAD" },
};
