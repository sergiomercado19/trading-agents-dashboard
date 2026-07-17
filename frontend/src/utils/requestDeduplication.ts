/**
 * Request Deduplication Utility
 * Prevents duplicate in-flight requests for the same resource
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  abortController: AbortController;
}

interface DeduplicationOptions {
  /** Maximum time to keep a request in cache after resolution (ms) */
  cacheTTL?: number;
  /** Custom key generator */
  keyGenerator?: (args: unknown[]) => string;
}

const defaultOptions: Required<DeduplicationOptions> = {
  cacheTTL: 5000,
  keyGenerator: (args: unknown[]) => JSON.stringify(args),
};

/**
 * Creates a deduplicated version of an async function
 */
export function deduplicate<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  options: DeduplicationOptions = {}
): (...args: T) => Promise<R> {
  const { cacheTTL = 5000, keyGenerator = (args: unknown[]) => JSON.stringify(args) } = {
    ...defaultOptions,
    ...options,
  };

  const pending = new Map<string, PendingRequest<R>>();
  const cache = new Map<string, { data: R; expires: number }>();

  return async (...args: T): Promise<R> => {
    const key = keyGenerator(args);

    // Check cache first
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Check for pending request
    const existingPending = pending.get(key);
    if (existingPending) {
      return existingPending.promise;
    }

    // Create new request
    const abortController = new AbortController();
    const promise = (async () => {
      try {
        const result = await fn(...args);
        cache.set(key, { data: result, expires: Date.now() + cacheTTL });
        return result;
      } finally {
        pending.delete(key);
      }
    })();

    const pendingReq: PendingRequest<R> = { promise, abortController };
    pending.set(key, pendingReq);

    try {
      return await promise;
    } catch (error) {
      // Clean up on error
      pending.delete(key);
      throw error;
    }
  };
}

/**
 * Class-based deduplicator with more control
 */
export class RequestDeduplicator<T extends unknown[], R> {
  private fn: (...args: T) => Promise<R>;
  private pending = new Map<string, PendingRequest<R>>();
  private cache = new Map<string, { data: R; expires: number }>();
  private options: Required<DeduplicationOptions>;

  constructor(fn: (...args: T) => Promise<R>, options: DeduplicationOptions = {}) {
    this.fn = fn;
    this.options = { ...defaultOptions, ...options };
  }

  async execute(...args: T): Promise<R> {
    const key = this.options.keyGenerator(args);

    // Check cache
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Check pending
    const pendingReq = this.pending.get(key);
    if (pendingReq) {
      return pendingReq.promise;
    }

    // Create new request
    const abortController = new AbortController();
    const promise = (async () => {
      try {
        const result = await this.fn(...args);
        this.cache.set(key, { data: result, expires: Date.now() + this.options.cacheTTL });
        return result;
      } finally {
        this.pending.delete(key);
      }
    })();

    this.pending.set(key, { promise, abortController });

    try {
      return await promise;
    } catch (error) {
      this.pending.delete(key);
      throw error;
    }
  }

  /**
   * Invalidate cache for a specific key
   */
  invalidate(...args: T): void {
    const key = this.options.keyGenerator(args);
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache
   */
  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Cancel a pending request
   */
  cancel(...args: T): void {
    const key = this.options.keyGenerator(args);
    const pending = this.pending.get(key);
    if (pending) {
      pending.abortController.abort();
      this.pending.delete(key);
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAll(): void {
    this.pending.forEach((req) => req.abortController.abort());
    this.pending.clear();
  }

  /**
   * Get cache stats
   */
  getStats(): { cacheSize: number; pendingSize: number } {
    return {
      cacheSize: this.cache.size,
      pendingSize: this.pending.size,
    };
  }
}

/**
 * Hook for deduplicated requests
 */
import { useCallback, useRef } from "react";

export function useDeduplicatedRequest<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  options: DeduplicationOptions = {}
) {
  const deduplicatorRef = useRef<RequestDeduplicator<T, R>>();

  if (!deduplicatorRef.current) {
    deduplicatorRef.current = new RequestDeduplicator(fn, options);
  }

  const execute = useCallback(
    async (...args: T) => {
      return deduplicatorRef.current!.execute(...args);
    },
    [fn]
  );

  const invalidate = useCallback((...args: T) => {
    deduplicatorRef.current?.invalidate(...args);
  }, []);

  const invalidateAll = useCallback(() => {
    deduplicatorRef.current?.invalidateAll();
  }, []);

  const cancel = useCallback((...args: T) => {
    deduplicatorRef.current?.cancel(...args);
  }, []);

  const cancelAll = useCallback(() => {
    deduplicatorRef.current?.cancelAll();
  }, []);

  return { execute, invalidate, invalidateAll, cancel, cancelAll };
}

/**
 * React Query-like cache for components
 */
export interface CachedData<T> {
  data: T;
  timestamp: number;
  stale: boolean;
}

export function useRequestCache() {
  const cacheRef = useRef<Map<string, CachedData<unknown>>>(new Map());

  const get = useCallback(<T>(key: string, staleTime = 30000): T | null => {
    const cached = cacheRef.current.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > staleTime) {
      cached.stale = true;
    }

    return cached.data as T;
  }, []);

  const set = useCallback(<T>(key: string, data: T) => {
    cacheRef.current.set(key, { data, timestamp: Date.now(), stale: false });
  }, []);

  const invalidate = useCallback((key: string) => {
    cacheRef.current.delete(key);
  }, []);

  const invalidateAll = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const getStale = useCallback(<T>(key: string): T | null => {
    const cached = cacheRef.current.get(key);
    return (cached?.data as T) ?? null;
  }, []);

  return { get, set, invalidate, invalidateAll, getStale };
}

/**
 * Creates a key for query arguments
 */
export function createQueryKey(...parts: (string | number | boolean | null | undefined)[]): string {
  return parts.filter((p) => p !== null && p !== undefined).join(":");
}

/** @deprecated Use useDeduplicatedRequest instead */
export const useRequestDeduplication = useDeduplicatedRequest;