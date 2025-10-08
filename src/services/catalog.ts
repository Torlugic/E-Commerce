import type { Product } from "../models/types";
import { mockProducts } from "../mocks/catalog";
import { apiFetch, usingMocks } from "./http";

const PRODUCTS_ENDPOINT = "/products";

export async function fetchProducts(): Promise<Product[]> {
  if (usingMocks()) {
    return mockProducts;
  }

  return apiFetch<Product[]>(PRODUCTS_ENDPOINT, { method: "GET" });
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  if (usingMocks()) {
    return mockProducts.find((p) => p.id === id);
  }

  return apiFetch<Product>(`${PRODUCTS_ENDPOINT}/${id}`, { method: "GET" });
}
