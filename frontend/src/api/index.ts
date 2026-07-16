/**
 * API Module - Main Entry Point
 * Export all API-related modules from here
 */

// Types
export * from './types';

// Routes
export * from './routes';

// Client
export { ApiClient, api, type ApiRequestOptions, type RetryConfig, type RequestContext } from './client';

// Helpers - re-export from client for backward compatibility
export { fetchJson, postJson, getJson, postForm, createEventSource } from './client';

// Errors
export {
  ApiError,
  NetworkError,
  TimeoutError,
  ValidationError,
  StreamError,
  CancellationError,
  createApiError,
  isApiError,
  isNetworkError,
  isTimeoutError,
  isRetriableError,
  ApiErrorCode,
  HTTP_STATUS,
  statusToCode,
} from '../lib/errors';