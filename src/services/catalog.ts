import type { Product } from "../models/types";
import { mockProducts } from "../mocks/catalog";
import { apiFetch, usingMocks } from "./http";
import {
  parseProduct,
  parseProductList,
  type ProductValidationIssue,
} from "../models/productSchema";

const PRODUCTS_ENDPOINT = "/products";

type FetchProductsOptions = {
  signal?: AbortSignal;
};

type FetchProductOptions = {
  signal?: AbortSignal;
};

function logValidationIssues(
  label: string,
  issues: ProductValidationIssue[],
  identifier?: string
) {
  if (!issues.length) {
    return;
  }
  const target = identifier ? `${label} (${identifier})` : label;
  const warnings = issues.filter((issue) => issue.level === "warning");
  const errors = issues.filter((issue) => issue.level === "error");

  if (errors.length) {
    console.error(`${target} validation errors`, errors.map(formatIssue));
  }
  if (warnings.length) {
    console.warn(`${target} validation warnings`, warnings.map(formatIssue));
  }
}

function formatIssue(issue: ProductValidationIssue) {
  return {
    path: issue.path.length ? issue.path.join(".") : "(root)",
    message: issue.message,
  };
}

export async function fetchProducts(options: FetchProductsOptions = {}): Promise<Product[]> {
  if (usingMocks()) {
    const result = parseProductList(mockProducts);
    logValidationIssues("Mock product list", result.issues);
    return result.products;
  }

  const raw = await apiFetch<unknown>(PRODUCTS_ENDPOINT, {
    method: "GET",
    signal: options.signal,
  });

  const result = parseProductList(raw);
  logValidationIssues("Product list", result.issues);
  return result.products;
}

export async function fetchProductById(
  id: string,
  options: FetchProductOptions = {}
): Promise<Product | undefined> {
  const trimmedId = id.trim();
  if (!trimmedId) {
    return undefined;
  }

  if (usingMocks()) {
    const match = mockProducts.find((product) => product.id === trimmedId || product.slug === trimmedId);
    if (!match) {
      return undefined;
    }
    const parsed = parseProduct(match);
    logValidationIssues("Mock product", parsed.issues, trimmedId);
    return parsed.product ?? undefined;
  }

  const raw = await apiFetch<unknown>(`${PRODUCTS_ENDPOINT}/${encodeURIComponent(trimmedId)}`, {
    method: "GET",
    signal: options.signal,
  });

  const parsed = parseProduct(raw);
  logValidationIssues("Product", parsed.issues, trimmedId);
  return parsed.product ?? undefined;
}
