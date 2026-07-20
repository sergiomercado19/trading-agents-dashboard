import { useAuthStore } from "@/store/authStore";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

class ApiClient {
  private baseUrl: string;
  private getAccessToken: () => string | null;
  private getRefreshToken: () => string | null;
  private refreshing: Promise<string | null> | null = null;

  constructor(
    baseUrl: string,
    getAccessToken: () => string | null,
    getRefreshToken: () => string | null,
  ) {
    this.baseUrl = baseUrl;
    this.getAccessToken = getAccessToken;
    this.getRefreshToken = getRefreshToken;
  }

  private async tryRefresh(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const resp = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
      return data.access_token;
    } catch {
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<T> {
    const token = this.getAccessToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && !isRetry) {
      // Deduplicate concurrent refresh attempts
      if (!this.refreshing) {
        this.refreshing = this.tryRefresh().finally(() => {
          this.refreshing = null;
        });
      }
      const newToken = await this.refreshing;
      if (newToken) {
        return this.request<T>(endpoint, options, true);
      }
      useAuthStore.getState().logout();
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || "Request failed");
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  }

  post<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiClient(
  API_BASE,
  () => useAuthStore.getState().accessToken,
  () => useAuthStore.getState().refreshToken,
);