import Constants from "expo-constants";

export interface ApiClientOptions {
  baseUrl?: string;
}

export class ApiClient {
  private baseUrl: string;

  // Overridable methods - bound by AuthStore at runtime to eliminate race conditions
  getAuthToken: () => Promise<string | null> = async () => {
    return null;
  };

  setAuthToken: (token: string | null) => Promise<void> = async (token) => {
    // No-op: Cookies are handled by the browser/native networking
  };

  // Called when auth fails (e.g., invalid token) - bound by AuthStore
  onAuthFailure?: () => Promise<void>;

  constructor() {
    this.baseUrl = "https://app.bozorchi.store";
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(init.headers as Record<string, string> | undefined),
    };

    // Only set Content-Type for non-FormData requests
    if (!(init.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    // Credentials 'include' is required for cookies in some environments,
    // though React Native iOS/Android handles cookies by default.
    // Adding it ensures compatibility if moving to standard fetch in web environments.
    const response = await fetch(this.baseUrl + path, {
      ...init,
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");

      // Handle 401 Unauthorized globally
      if (response.status === 401 && this.onAuthFailure) {
        await this.onAuthFailure();
      }

      throw new Error(text || `Request failed with status ${response.status}`);
    }

    // Some endpoints might return no content
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return (await response.json()) as T;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, {
      method: "GET",
    });
  }

  post<T, B = unknown>(path: string, body?: B): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });
  }

  put<T, B = unknown>(path: string, body?: B): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }

  // AI Chat Methods
  async sendChatMessage(
    message: string,
    conversationId?: string,
    conversationHistory?: unknown[]
  ): Promise<{
    reply: string;
    conversationId: string;
    conversationHistory?: unknown[];
  }> {
    return this.post("/api/ai/chat", {
      message,
      conversationId,
      conversationHistory,
    });
  }

  async clearConversation(
    conversationId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.delete(`/api/ai/conversation/${conversationId}`);
  }

  async getVoiceToken(): Promise<{
    token: string;
  }> {
    return this.get<{ token: string }>(`/api/ai/token`);
  }

  async getAIHealth(): Promise<{
    status: string;
    service: string;
    activeConversations: number;
    features: { chat: boolean; voice: boolean };
  }> {
    return this.get("/api/ai/health");
  }
}

export const api = new ApiClient();
