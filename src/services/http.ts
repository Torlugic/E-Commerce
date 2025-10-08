const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "";
const useMocksEnv = import.meta.env.VITE_USE_MOCKS?.trim()?.toLowerCase();

const shouldUseMocks =
  !baseUrl ||
  useMocksEnv === undefined ||
  useMocksEnv === "" ||
  useMocksEnv === "true";

export const apiConfig = {
  baseUrl,
  shouldUseMocks,
};

export function isApiConfigured() {
  return Boolean(baseUrl);
}

export function usingMocks() {
  return shouldUseMocks;
}

export type ApiRequestInit = RequestInit & {
  /**
   * Set to false if you want to send FormData or other body types without JSON headers.
   * Defaults to true, automatically applying JSON content type + accept headers.
   */
  json?: boolean;
};

export async function apiFetch<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  if (!baseUrl) {
    throw new Error(
      "VITE_API_BASE_URL is not configured. Provide it or keep VITE_USE_MOCKS=true to rely on the front-end mocks."
    );
  }

  const { json = true, headers, ...rest } = init;

  const response = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    headers: json
      ? {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(headers ?? {}),
        }
      : headers,
    ...rest,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText || "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}
