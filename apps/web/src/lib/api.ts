/**
 * API Client for backend communication.
 *
 * COOKIE-BASED AUTH:
 * - All requests include credentials: 'include' to send HttpOnly cookies
 * - No token management needed on frontend - cookies are handled automatically
 * - On 401, triggers auth failure callback to clear auth state
 */

/** Error codes from backend auth middleware */
export type AuthErrorCode =
  | "NO_TOKEN"
  | "TOKEN_EXPIRED"
  | "INVALID_TOKEN"
  | "USER_NOT_FOUND"
  | "STORE_NOT_FOUND"
  | "NO_ORG_ACCESS";

export interface ApiError {
  error?: string;
  code?: AuthErrorCode;
  message?: string;
  requiredPermissions?: string[];
  details?: string[] | string;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: ApiError;

  constructor(status: number, message: string, body: ApiError = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.body = body;
  }
}

const PERMISSION_LABELS: Record<string, string> = {
  POS_ACCESS: "POS Access",
  MANAGE_PRODUCTS: "Manage Products",
  MANAGE_INVENTORY: "Manage Inventory",
  VIEW_COST_PRICE: "View Cost Price",
  VIEW_ANALYTICS: "View Analytics",
  VIEW_DASHBOARD: "View Dashboard",
};

const DEV_API_BASE_URL =
  "https://bozorchi-devbackend-ikzdd4-b4a788-46-62-221-217.traefik.me";
const PROD_API_BASE_URL = "https://app.bozorchi.store";

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function resolveApiBaseUrl(): string {
  const explicitApiUrl = import.meta.env.VITE_API_URL?.trim();
  if (explicitApiUrl) {
    return trimTrailingSlash(explicitApiUrl);
  }

  if (!import.meta.env.DEV && typeof window !== "undefined") {
    const browserOrigin = window.location.origin?.trim();
    if (browserOrigin) {
      return trimTrailingSlash(browserOrigin);
    }
  }

  const customEnv = import.meta.env.VITE_ENV?.trim().toLowerCase();
  if (customEnv === "development") return DEV_API_BASE_URL;
  if (customEnv === "production" && !import.meta.env.DEV) {
    return PROD_API_BASE_URL;
  }

  return import.meta.env.DEV ? DEV_API_BASE_URL : PROD_API_BASE_URL;
}

function resolveFallbackBaseUrl(primaryBaseUrl: string): string | null {
  const candidates = new Set<string>();

  if (typeof window !== "undefined" && window.location.origin) {
    candidates.add(trimTrailingSlash(window.location.origin));
  }

  candidates.add(trimTrailingSlash(PROD_API_BASE_URL));

  const normalizedPrimary = trimTrailingSlash(primaryBaseUrl);
  for (const candidate of candidates) {
    if (candidate !== normalizedPrimary) {
      return candidate;
    }
  }

  return null;
}

export class ApiClient {
  private baseUrl: string;
  private fallbackBaseUrl: string | null;

  /**
   * Callback to handle auth failure (e.g., sign out and clear local auth state).
   * Set by AuthStore at runtime.
   */
  onAuthFailure: (() => Promise<void>) | null = null;

  constructor() {
    this.baseUrl = resolveApiBaseUrl();
    this.fallbackBaseUrl = resolveFallbackBaseUrl(this.baseUrl);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Check if an error response indicates an expired/invalid token.
   */
  private isAuthError(status: number, errorBody: ApiError): boolean {
    if (status !== 401) return false;
    const code = errorBody.code;
    return (
      code === "TOKEN_EXPIRED" ||
      code === "INVALID_TOKEN" ||
      code === "NO_TOKEN"
    );
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(init.headers as Record<string, string> | undefined),
    };

    if (!(init.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    let response: Response | null = null;
    let requestUrl = "";
    try {
      const baseUrls = [this.baseUrl];
      if (this.fallbackBaseUrl) {
        baseUrls.push(this.fallbackBaseUrl);
      }

      let lastError: unknown = null;
      for (let i = 0; i < baseUrls.length; i += 1) {
        requestUrl = new URL(path, baseUrls[i]!).toString();
        try {
          response = await fetch(requestUrl, {
            ...init,
            headers,
            credentials: "include", // Send cookies with every request
          });
          break;
        } catch (error) {
          lastError = error;
          if (i === baseUrls.length - 1) {
            const reason =
              lastError instanceof Error ? lastError.message : "Unknown error";
            throw new Error(
              `Network request failed: ${path} (tried: ${baseUrls.join(", ")}; ${reason})`
            );
          }
        }
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `Network request failed: ${requestUrl || path} (${reason})`
      );
    }

    if (!response) {
      throw new Error(`Network request failed: ${requestUrl || path}`);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let errorBody: ApiError = {};

      try {
        errorBody = JSON.parse(text) as ApiError;
      } catch {
        // Not JSON, use text as message
        errorBody = { message: text };
      }

      // Handle 401 errors - trigger auth failure
      if (this.isAuthError(response.status, errorBody)) {
        // Don't trigger failure for auth endpoints themselves
        if (
          !path.includes("/api/auth/login") &&
          !path.includes("/api/auth/register") &&
          !path.includes("/api/auth/logout")
        ) {
          if (this.onAuthFailure) {
            await this.onAuthFailure();
          }
        }
      }

      // Normalize permission errors so UI can show a clear message everywhere.
      const isPermissionError =
        response.status === 403 &&
        ((errorBody.message &&
          errorBody.message.toLowerCase().includes("insufficient permissions")) ||
          (errorBody.error &&
            errorBody.error.toLowerCase().includes("access denied")));
      if (isPermissionError) {
        const requiredPermissions = Array.isArray(errorBody.requiredPermissions)
          ? errorBody.requiredPermissions
            .map((permission) => PERMISSION_LABELS[permission] ?? permission)
            .join(", ")
          : "";
        const message = requiredPermissions
          ? `You do not have permission for this action. Required: ${requiredPermissions}.`
          : "You do not have permission for this action. Please contact your owner/admin.";
        throw new ApiRequestError(response.status, message, errorBody);
      }

      throw new ApiRequestError(
        response.status,
        errorBody.message ||
        errorBody.error ||
          `Request failed with status ${response.status}`,
        errorBody
      );
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return (await response.json()) as T;
  }

  get<T>(path: string) {
    return this.request<T>(path, { method: "GET" });
  }

  post<T, B = unknown>(path: string, body?: B) {
    return this.request<T>(path, {
      method: "POST",
      body:
        body instanceof FormData
          ? body
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
    });
  }

  put<T, B = unknown>(path: string, body?: B) {
    return this.request<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T, B = unknown>(path: string, body?: B) {
    return this.request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T, B = unknown>(path: string, body?: B) {
    return this.request<T>(path, {
      method: "DELETE",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async download(path: string) {
    const headers: Record<string, string> = {
      Accept: "application/octet-stream",
    };
    let response: Response | null = null;
    let requestUrl = "";
    try {
      const baseUrls = [this.baseUrl];
      if (this.fallbackBaseUrl) {
        baseUrls.push(this.fallbackBaseUrl);
      }

      let lastError: unknown = null;
      for (let i = 0; i < baseUrls.length; i += 1) {
        requestUrl = new URL(path, baseUrls[i]!).toString();
        try {
          response = await fetch(requestUrl, {
            method: "GET",
            headers,
            credentials: "include",
          });
          break;
        } catch (error) {
          lastError = error;
          if (i === baseUrls.length - 1) {
            const reason =
              lastError instanceof Error ? lastError.message : "Unknown error";
            throw new Error(
              `Download request failed: ${path} (tried: ${baseUrls.join(", ")}; ${reason})`
            );
          }
        }
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `Download request failed: ${requestUrl || path} (${reason})`
      );
    }

    if (!response) {
      throw new Error(`Download request failed: ${requestUrl || path}`);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || `Request failed with status ${response.status}`);
    }

    return await response.blob();
  }
}

export const api = new ApiClient();
