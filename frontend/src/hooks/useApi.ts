/**
 * useApi Hook
 * Standardized hook for CRUD operations with loading, error, and retry states
 */

import { useCallback, useRef, useState } from "react";
import { type ApiError, isRetriableError, createApiError } from "../lib/errors";

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export interface UseApiActions<T> {
  execute: (options?: { method?: string; body?: unknown; params?: Record<string, string | number | boolean | undefined | null>; timeout?: number; retry?: Partial<{ maxRetries: number; baseDelayMs: number; maxDelayMs: number; retriableStatuses: number[]; retriableCodes: string[] }>; signal?: AbortSignal; noRetry?: boolean; headers?: Record<string, string> }) => Promise<T | null>;
  reset: () => void;
  setData: (data: T) => void;
  setError: (error: ApiError | null) => void;
}

export interface UseApiOptions<T> {
  initialData?: T | null;
  retry?: Partial<{ maxRetries: number; baseDelayMs: number; maxDelayMs: number; retriableStatuses: number[]; retriableCodes: string[] }>;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  skip?: boolean;
}

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 8000,
  retriableStatuses: [429, 500, 502, 503, 504],
  retriableCodes: ["NETWORK_ERROR", "TIMEOUT", "CONNECTION_FAILED", "SERVICE_UNAVAILABLE", "GATEWAY_TIMEOUT"],
};

/**
 * Generic API hook for any endpoint
 */
export function useApi<T = unknown>(
  route: string | ((...args: unknown[]) => string),
  options: { initialData?: T | null; retry?: Partial<{ maxRetries: number; baseDelayMs: number; maxDelayMs: number; retriableStatuses: number[]; retriableCodes: string[] }>; onSuccess?: (data: T) => void; onError?: (error: ApiError) => void; skip?: boolean } = {}
): [UseApiState<T>, UseApiActions<T>] {
  const { initialData = null, retry, skip = false } = options;
  const routeRef = useRef(route);
  routeRef.current = route;

  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (options: { method?: string; body?: unknown; params?: Record<string, string | number | boolean | undefined | null>; timeout?: number; retry?: Partial<{ maxRetries: number; baseDelayMs: number; maxDelayMs: number; retriableStatuses: number[]; retriableCodes: string[] }>; signal?: AbortSignal; noRetry?: boolean; headers?: Record<string, string> } = {}): Promise<T | null> => {
      if (skip) return null;

      const { method = "GET", body, params, timeout = 30000, retry: optionsRetry, signal, noRetry = false, headers } = options;

      const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retry, ...optionsRetry };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const combinedSignal = signal
        ? AbortSignal.any([signal, controller.signal])
        : controller.signal;

      let attempt = 0;
      let lastError: Error | null = null;

      while (true) {
        try {
          const routePath = typeof routeRef.current === "function" ? routeRef.current() : routeRef.current;
          const url = new URL(routePath, window.location.origin);
          if (params) {
            Object.entries(params).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
              }
            });
          }

          const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json", ...headers },
            body: body ? JSON.stringify(body) : undefined,
            signal: combinedSignal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const error = await createApiError(response, routePath, method);
            throw error;
          }

          if (response.status === 204) return undefined as T;

          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json")) return (await response.json()) as T;
          if (contentType?.includes("text/")) return (await response.text()) as T;
          return (await response.blob()) as T;
        } catch (error) {
          clearTimeout(timeoutId);
          lastError = error instanceof Error ? error : new Error(String(error));

          if (error instanceof DOMException && error.name === "AbortError") {
            throw new Error("Request cancelled");
          }

          const shouldRetry =
            !noRetry &&
            attempt < retryConfig.maxRetries &&
            isRetriableError(lastError);

          if (!shouldRetry) throw lastError;

          const delay = Math.min(
            retryConfig.baseDelayMs * Math.pow(2, attempt),
            retryConfig.maxDelayMs
          );
          const jitter = delay * 0.25 * (Math.random() * 2 - 1);
          await new Promise((resolve) => setTimeout(resolve, delay + jitter));
          attempt++;
        } finally {
          clearTimeout(timeoutId);
        }
      }
    },
    [skip]
  );

  const reset = useCallback(() => {
    setState((prev) => ({ ...prev, loading: false, error: null }));
  }, []);

  const setData = useCallback((data: T) => {
    setState((prev) => ({ ...prev, data, loading: false, error: null }));
  }, []);

  const setError = useCallback((error: ApiError | null) => {
    setState((prev) => ({ ...prev, error, loading: false }));
  }, []);

  return [state, { execute, reset, setData, setError }];
}