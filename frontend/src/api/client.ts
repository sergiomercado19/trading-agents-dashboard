/**
 * Typed API Client
 * - Centralized error handling
 * - Retry logic with exponential backoff
 * - AbortController support for cancellation
 * - Full TypeScript type safety
 */

import { type Route } from './routes';
import {
  CancellationError,
  TimeoutError,
  isRetriableError,
  createApiError,
} from '../lib/errors';

/**
 * Default retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retriableStatuses: number[];
  retriableCodes: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 8000,
  retriableStatuses: [429, 500, 502, 503, 504],
  retriableCodes: ['NETWORK_ERROR', 'TIMEOUT', 'CONNECTION_FAILED', 'SERVICE_UNAVAILABLE', 'GATEWAY_TIMEOUT'],
};

/**
 * Request options extending standard fetch options
 */
export interface ApiRequestOptions<TBody = unknown> extends Omit<RequestInit, 'body' | 'method'> {
  /** HTTP method */
  method?: string;
  /** Request body */
  body?: TBody;
  /** Query parameters */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** Request timeout in ms */
  timeout?: number;
  /** Retry configuration */
  retry?: Partial<RetryConfig>;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Skip automatic retry */
  noRetry?: boolean;
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * Request context for logging/debugging
 */
export interface RequestContext {
  url: string;
  method: string;
  timestamp: Date;
  attempt: number;
  retryAfter?: number;
}

/**
 * Typed API Client
 * Accepts either Route objects or string paths for backward compatibility
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl = '/api', defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
  }

  /**
   * Build full URL with path and query parameters
   */
  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    // Handle relative paths properly without using URL constructor with relative base
    const base = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    let url = `${base}${cleanPath}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }
    return url;
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
    const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
    const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
    // Add jitter: ±25%
    const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
    return Math.floor(cappedDelay + jitter);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Core request method with retry logic
   */
  async request<TResponse, TBody = unknown>(
    route: Route<any, TResponse> | string,
    options: ApiRequestOptions<TBody> = {}
  ): Promise<TResponse> {
    const isStringRoute = typeof route === 'string';

    const {
      method = isStringRoute ? 'GET' : route.method,
      body,
      params,
      timeout = 30000,
      retry,
      signal,
      noRetry = false,
      headers,
      ...fetchOptions
    } = options;

    // Prepare body
    let requestBody: BodyInit | undefined;
    if (body !== undefined && body !== null) {
      if (typeof body === 'string' || body instanceof FormData || body instanceof Blob || body instanceof URLSearchParams) {
        requestBody = body;
      } else {
        requestBody = JSON.stringify(body);
      }
    }

    // Prepare request
    const url = this.buildUrl(isStringRoute ? route : route.path, params);
    const requestHeaders = { ...this.defaultHeaders, ...headers };
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retry };

    // Create AbortController for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeout);

    // Combine signals
    const combinedSignal = signal
      ? AbortSignal.any([signal, abortController.signal])
      : abortController.signal;

    let attempt = 0;
    let lastError: Error | null = null;

    while (true) {
      try {
        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: requestBody,
          signal: combinedSignal,
          ...fetchOptions,
        });

        clearTimeout(timeoutId);

        // Handle non-OK responses
        if (!response.ok) {
          const error = await createApiError(response, url, method);
          throw error;
        }

        // Handle 204 No Content
        if (response.status === 204) {
          return undefined as TResponse;
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return (await response.json()) as TResponse;
        }
        if (contentType?.includes('text/')) {
          return (await response.text()) as TResponse;
        }
        return (await response.blob()) as TResponse;
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error instanceof Error ? error : new Error(String(error));

        // Handle abort
        if (error instanceof DOMException && error.name === 'AbortError') {
          if (signal?.aborted) {
            throw new CancellationError('Request cancelled');
          }
          throw new TimeoutError(`Request timeout after ${timeout}ms`, url, method);
        }

        // Check if we should retry
        const shouldRetry =
          !noRetry &&
          attempt < retryConfig.maxRetries &&
          isRetriableError(lastError);

        if (!shouldRetry) {
          throw lastError;
        }

        // Calculate delay and wait
        const delay = this.calculateDelay(attempt, retryConfig);
        await this.sleep(delay);
        attempt++;
      }
    }
  }

  /**
   * Convenience methods for common HTTP verbs
   */
  get<TResponse, TParams extends Record<string, string | number | boolean | undefined | null> = Record<string, string | number | boolean | undefined | null>>(
    route: Route<any, TResponse> | string,
    params?: TParams,
    options?: Omit<ApiRequestOptions, 'body' | 'method'>
  ): Promise<TResponse> {
    return this.request(route, { ...options, method: 'GET', params });
  }

  post<TResponse, TBody = unknown>(
    route: Route<any, TResponse> | string,
    body?: TBody,
    options?: ApiRequestOptions<TBody>
  ): Promise<TResponse> {
    return this.request(route, { ...options, method: 'POST', body });
  }

  patch<TResponse, TBody = unknown>(
    route: Route<any, TResponse> | string,
    body?: TBody,
    options?: ApiRequestOptions<TBody>
  ): Promise<TResponse> {
    return this.request(route, { ...options, method: 'PATCH', body });
  }

  put<TResponse, TBody = unknown>(
    route: Route<any, TResponse> | string,
    body?: TBody,
    options?: ApiRequestOptions<TBody>
  ): Promise<TResponse> {
    return this.request(route, { ...options, method: 'PUT', body });
  }

  delete<TResponse>(
    route: Route<any, TResponse> | string,
    options?: ApiRequestOptions
  ): Promise<TResponse> {
    return this.request(route, { ...options, method: 'DELETE' });
  }
}

/**
 * Default client instance
 */
export const api = new ApiClient();

/**
 * Backward-compatible helpers
 */
export const fetchJson = <T>(path: string, options?: ApiRequestOptions) => api.get<T>(path, undefined, options);
export const postJson = <T, TBody = unknown>(path: string, body: TBody, options?: ApiRequestOptions<TBody>) => api.post<T, TBody>(path, body, options);
export const getJson = <T>(path: string, params?: Record<string, string | number | boolean | undefined | null>, options?: Omit<ApiRequestOptions, 'body' | 'method'>) => api.get<T, Record<string, string | number | boolean | undefined | null>>(path, (params ?? undefined) as Record<string, string | number | boolean | undefined | null> | undefined, options);
export const postForm = (path: string, formData: FormData, options?: ApiRequestOptions<FormData>) => api.request(path, { ...options, method: 'POST', body: formData, headers: {} });
export const createEventSource = (path: string): EventSource => new EventSource(`${api['baseUrl']}${path}`);

/**
 * Create a client with custom base URL (e.g., for different environments)
 */
export function createApiClient(baseUrl: string, defaultHeaders?: Record<string, string>): ApiClient {
  return new ApiClient(baseUrl, defaultHeaders);
}