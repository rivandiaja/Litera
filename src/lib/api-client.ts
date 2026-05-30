import { ApiError } from "./api-error";
import { getStoredToken } from "./auth-storage";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string | null;
  responseType?: "json" | "text" | "blob";
}

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

async function readPayload(response: Response, responseType: ApiRequestOptions["responseType"] = "json") {
  if (response.status === 204) return undefined;
  if (response.ok && responseType === "blob") return response.blob();
  if (response.ok && responseType === "text") return response.text();

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  return response.text();
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, token: requestToken, responseType, headers: requestHeaders, ...fetchOptions } = options;
  const token = requestToken ?? getStoredToken();
  const headers = new Headers(requestHeaders);
  const hasBody = body !== undefined;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...fetchOptions,
      headers,
      body: hasBody ? (isFormData ? body as BodyInit : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw ApiError.network();
  }

  const payload = await readPayload(response, responseType);
  if (!response.ok) {
    throw ApiError.fromResponse(response.status, payload);
  }

  return payload as T;
}
