import { AdapterError } from "./errors.ts";

export function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new AdapterError(`Missing environment variable: ${name}`, {
      status: 500,
    });
  }
  return value;
}

export function getEnv(name: string, fallback?: string): string | undefined {
  const value = Deno.env.get(name);
  if (value === undefined || value === "") {
    return fallback;
  }
  return value;
}

export function sanitizeBaseUrl(value: string, label: string): string {
  try {
    const url = new URL(value);
    url.pathname = url.pathname.replace(/\/+$|$/, "");
    return url.toString().replace(/\/$/, "");
  } catch (error) {
    throw new AdapterError(`Invalid URL provided for ${label}`, {
      status: 500,
      cause: error,
    });
  }
}