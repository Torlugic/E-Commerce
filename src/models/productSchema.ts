import type { Money, Product, ProductVariant } from "./types";
import {
  sanitizeAttributes,
  sanitizeSlug,
  sanitizeStringList,
  sanitizeText,
  sanitizeUrl,
} from "../utils/sanitize";

type ProductValidationLevel = "error" | "warning";

export type ProductValidationIssue = {
  level: ProductValidationLevel;
  message: string;
  path: (string | number)[];
};

export type ProductParseResult = {
  product: Product | null;
  issues: ProductValidationIssue[];
};

export type ProductListParseResult = {
  products: Product[];
  issues: ProductValidationIssue[];
};

type SanitizeMoneyOptions = {
  optional?: boolean;
};

function toIssue(
  level: ProductValidationLevel,
  message: string,
  path: (string | number)[]
): ProductValidationIssue {
  return { level, message, path };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function sanitizeCurrency(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = sanitizeText(value, { maxLength: 8, preserveCase: false });
  if (!normalized) {
    return null;
  }
  if (!/^[a-z]{3,8}$/.test(normalized)) {
    return null;
  }
  return normalized.toUpperCase();
}

function parseAmount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function sanitizeMoney(
  value: unknown,
  path: (string | number)[],
  options: SanitizeMoneyOptions = {}
): { money: Money | null; issues: ProductValidationIssue[] } {
  const { optional = false } = options;
  const issues: ProductValidationIssue[] = [];
  if (!isRecord(value)) {
    issues.push(toIssue(optional ? "warning" : "error", "must be an object", path));
    return { money: null, issues };
  }

  const amountValue = parseAmount(value.amount);
  if (amountValue === null) {
    issues.push(toIssue(optional ? "warning" : "error", "amount must be a number", [...path, "amount"]));
  }
  let amount = amountValue ?? 0;
  if (amountValue !== null && !Number.isInteger(amountValue)) {
    issues.push(toIssue("warning", "amount was rounded to the nearest cent", [...path, "amount"]));
    amount = Math.round(amountValue);
  }

  const currency = sanitizeCurrency(value.currency);
  if (!currency) {
    issues.push(toIssue(optional ? "warning" : "error", "currency must be an ISO 4217 code", [...path, "currency"]));
  }

  if (issues.some((issue) => issue.level === "error")) {
    return { money: null, issues };
  }
  if (!currency) {
    return { money: null, issues };
  }
  return {
    money: { amount, currency },
    issues,
  };
}

function sanitizeVariant(
  value: unknown,
  path: (string | number)[]
): { variant: ProductVariant | null; issues: ProductValidationIssue[] } {
  const issues: ProductValidationIssue[] = [];
  if (!isRecord(value)) {
    issues.push(toIssue("error", "variant must be an object", path));
    return { variant: null, issues };
  }

  const id = typeof value.id === "string" ? sanitizeText(value.id, { maxLength: 120 }) : "";
  if (!id) {
    issues.push(toIssue("error", "id is required", [...path, "id"]));
  }

  const sku = typeof value.sku === "string" ? sanitizeText(value.sku, { maxLength: 120 }) : "";
  if (!sku) {
    issues.push(toIssue("error", "sku is required", [...path, "sku"]));
  }

  const title = typeof value.title === "string" ? sanitizeText(value.title, { maxLength: 200 }) : "";
  if (!title) {
    issues.push(toIssue("error", "title is required", [...path, "title"]));
  }

  const priceResult = sanitizeMoney(value.price, [...path, "price"]);
  issues.push(...priceResult.issues);
  if (!priceResult.money) {
    issues.push(toIssue("error", "price is invalid", [...path, "price"]));
  }

  let compareAtPrice: Money | undefined;
  if (value.compareAtPrice !== undefined) {
    const compareResult = sanitizeMoney(value.compareAtPrice, [...path, "compareAtPrice"], { optional: true });
    issues.push(...compareResult.issues);
    compareAtPrice = compareResult.money ?? undefined;
  }

  let stock: number | undefined;
  if (value.stock !== undefined) {
    const parsedStock = parseAmount(value.stock);
    if (parsedStock !== null && parsedStock >= 0) {
      stock = Math.floor(parsedStock);
      if (!Number.isInteger(parsedStock)) {
        issues.push(toIssue("warning", "stock was rounded down to the nearest whole number", [...path, "stock"]));
      }
    } else {
      issues.push(toIssue("warning", "stock must be a non-negative number", [...path, "stock"]));
    }
  }

  const image = sanitizeUrl(typeof value.image === "string" ? value.image : undefined);
  if (value.image !== undefined && !image) {
    issues.push(toIssue("warning", "image was discarded because it is not http(s) or relative", [...path, "image"]));
  }

  const attributes = isRecord(value.attributes)
    ? sanitizeAttributes(value.attributes)
    : undefined;
  if (value.attributes !== undefined && !attributes) {
    issues.push(toIssue("warning", "attributes were discarded because no valid entries remained", [...path, "attributes"]));
  }

  if (issues.some((issue) => issue.level === "error")) {
    return { variant: null, issues };
  }

  const variant: ProductVariant = {
    id,
    sku,
    title,
    price: priceResult.money!,
    compareAtPrice,
    image,
    attributes,
    stock,
  };

  return { variant, issues };
}

function sanitizeProduct(value: Record<string, unknown>): {
  product: Product | null;
  issues: ProductValidationIssue[];
} {
  const issues: ProductValidationIssue[] = [];

  const id = typeof value.id === "string" ? sanitizeText(value.id, { maxLength: 120 }) : "";
  if (!id) {
    issues.push(toIssue("error", "id is required", ["id"]));
  }

  const slug = typeof value.slug === "string" ? sanitizeSlug(value.slug, { maxLength: 160 }) : "";
  if (!slug) {
    issues.push(toIssue("error", "slug is required", ["slug"]));
  }

  const title = typeof value.title === "string" ? sanitizeText(value.title, { maxLength: 200 }) : "";
  if (!title) {
    issues.push(toIssue("error", "title is required", ["title"]));
  }

  const variantIds = new Set<string>();
  const sanitizedVariants: ProductVariant[] = [];
  const variantsInput = asArray(value.variants) ?? [];
  if (!Array.isArray(value.variants)) {
    issues.push(toIssue("error", "variants must be an array", ["variants"]));
  }

  variantsInput.forEach((rawVariant, index) => {
    const result = sanitizeVariant(rawVariant, ["variants", index]);
    issues.push(...result.issues);
    if (!result.variant) {
      return;
    }
    if (variantIds.has(result.variant.id)) {
      issues.push(
        toIssue("warning", `duplicate variant id \"${result.variant.id}\" was ignored`, ["variants", index, "id"])
      );
      return;
    }
    variantIds.add(result.variant.id);
    sanitizedVariants.push(result.variant);
  });

  if (!sanitizedVariants.length) {
    issues.push(toIssue("error", "no valid variants remain after sanitization", ["variants"]));
  }

  const imagesInput = asArray(value.images) ?? [];
  const imageSet = new Set<string>();
  const images: string[] = [];
  imagesInput.forEach((rawImage, index) => {
    if (typeof rawImage !== "string") {
      issues.push(toIssue("warning", "image was discarded because it is not a string", ["images", index]));
      return;
    }
    const sanitized = sanitizeUrl(rawImage);
    if (!sanitized) {
      issues.push(
        toIssue("warning", "image was discarded because it is not http(s) or relative", ["images", index])
      );
      return;
    }
    if (imageSet.has(sanitized)) {
      return;
    }
    imageSet.add(sanitized);
    images.push(sanitized);
  });

  const description = typeof value.description === "string"
    ? sanitizeText(value.description, { maxLength: 2000, allowNewlines: true })
    : undefined;

  const tags = sanitizeStringList(value.tags, { maxLength: 60 });
  const categories = sanitizeStringList(value.categories, { maxLength: 80 });

  if (issues.some((issue) => issue.level === "error")) {
    return { product: null, issues };
  }

  const product: Product = {
    id,
    slug,
    title,
    description: description || undefined,
    images,
    variants: sanitizedVariants,
    tags: tags.length ? tags : undefined,
    categories: categories.length ? categories : undefined,
  };

  return { product, issues };
}

export function parseProduct(input: unknown): ProductParseResult {
  if (!isRecord(input)) {
    return {
      product: null,
      issues: [toIssue("error", "product must be an object", [])],
    };
  }
  return sanitizeProduct(input);
}

export function parseProductList(input: unknown): ProductListParseResult {
  if (!Array.isArray(input)) {
    return {
      products: [],
      issues: [toIssue("error", "expected an array of products", [])],
    };
  }

  const products: Product[] = [];
  const issues: ProductValidationIssue[] = [];
  const seen = new Set<string>();

  input.forEach((item, index) => {
    const result = parseProduct(item);
    result.issues.forEach((issue) => {
      issues.push({
        ...issue,
        path: [index, ...issue.path],
      });
    });
    if (!result.product) {
      return;
    }
    if (seen.has(result.product.id)) {
      issues.push(
        toIssue("warning", `duplicate product id \"${result.product.id}\" was ignored`, [index, "id"])
      );
      return;
    }
    seen.add(result.product.id);
    products.push(result.product);
  });

  return { products, issues };
}
