const CONTROL_RANGE = "\\u0000-\\u001F\\u007F-\\u009F";
const CONTROL_EXCEPT_NEWLINES_RANGE = "\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F";

const CONTROL_CHARS = new RegExp(`[${CONTROL_RANGE}]`, "g");
const CONTROL_EXCEPT_NEWLINES = new RegExp(`[${CONTROL_EXCEPT_NEWLINES_RANGE}]`, "g");

type SanitizeTextOptions = {
  maxLength?: number;
  allowNewlines?: boolean;
  preserveCase?: boolean;
};

type SanitizeListOptions = SanitizeTextOptions & {
  dedupe?: boolean;
};

function trimToLength(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength);
}

export function sanitizeText(value: string, options: SanitizeTextOptions = {}): string {
  const { maxLength = 512, allowNewlines = false, preserveCase = true } = options;
  const pattern = allowNewlines ? CONTROL_EXCEPT_NEWLINES : CONTROL_CHARS;
  const cleaned = value.replace(pattern, "");
  const trimmed = preserveCase ? cleaned.trim() : cleaned.trim().toLowerCase();
  return trimToLength(trimmed, maxLength);
}

export function sanitizeSlug(value: string, options: { maxLength?: number } = {}): string {
  const { maxLength = 160 } = options;
  const normalized = sanitizeText(value, { maxLength: maxLength * 2, preserveCase: false });
  const slug = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return trimToLength(slug, maxLength);
}

export function sanitizeUrl(value?: string | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = sanitizeText(value, { maxLength: 2048 }).replace(/\s+/g, "");
  if (!trimmed) {
    return undefined;
  }
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch (error) {
    console.warn("Invalid URL discarded", error);
    return undefined;
  }
  return undefined;
}

export function sanitizeStringList(
  list: unknown,
  options: SanitizeListOptions = {}
): string[] {
  if (!Array.isArray(list)) {
    return [];
  }
  const { dedupe = true, ...textOptions } = options;
  const seen = new Set<string>();
  const sanitized: string[] = [];
  for (const item of list) {
    if (typeof item !== "string") continue;
    const clean = sanitizeText(item, textOptions);
    if (!clean) continue;
    if (dedupe) {
      const key = clean.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
    }
    sanitized.push(clean);
  }
  return sanitized;
}

export function sanitizeAttributes(
  attributes?: Record<string, unknown>
): Record<string, string> | undefined {
  if (!attributes) {
    return undefined;
  }
  const entries: [string, string][] = [];
  for (const [rawKey, rawValue] of Object.entries(attributes)) {
    if (typeof rawKey !== "string" || typeof rawValue !== "string") continue;
    const key = sanitizeText(rawKey, { maxLength: 60 });
    const value = sanitizeText(rawValue, { maxLength: 120, allowNewlines: false });
    if (!key || !value) continue;
    entries.push([key, value]);
  }
  if (!entries.length) {
    return undefined;
  }
  return Object.fromEntries(entries);
}
