/**
 * API Error Classes and Utilities
 */

export enum ApiErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNPROCESSABLE = 'UNPROCESSABLE',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  INTERNAL_SERVER = 'INTERNAL_SERVER',
  UNKNOWN = 'UNKNOWN',
}

export const HTTP_STATUS = {
  OK: 200,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export function statusToCode(status: number): ApiErrorCode {
  switch (status) {
    case 400: return ApiErrorCode.BAD_REQUEST;
    case 401: return ApiErrorCode.UNAUTHORIZED;
    case 403: return ApiErrorCode.FORBIDDEN;
    case 404: return ApiErrorCode.NOT_FOUND;
    case 409: return ApiErrorCode.CONFLICT;
    case 422: return ApiErrorCode.UNPROCESSABLE;
    case 429: return ApiErrorCode.TOO_MANY_REQUESTS;
    case 500: return ApiErrorCode.INTERNAL_SERVER;
    case 502: return ApiErrorCode.SERVICE_UNAVAILABLE;
    case 503: return ApiErrorCode.SERVICE_UNAVAILABLE;
    case 504: return ApiErrorCode.GATEWAY_TIMEOUT;
    default: return ApiErrorCode.UNKNOWN;
  }
}

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;
  url: string;
  method: string;
  details?: unknown;

  constructor(message: string, code: ApiErrorCode, status: number, url: string, method: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.url = url;
    this.method = method;
    this.details = details;
  }
}

export class NetworkError extends ApiError {
  constructor(message: string, url: string, method: string) {
    super(message, ApiErrorCode.NETWORK_ERROR, 0, url, method);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends ApiError {
  constructor(message: string, url: string, method: string) {
    super(message, ApiErrorCode.TIMEOUT, 0, url, method);
    this.name = 'TimeoutError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, status: number, url: string, method: string, details?: unknown) {
    super(message, ApiErrorCode.BAD_REQUEST, status, url, method, details);
    this.name = 'ValidationError';
  }
}

export class StreamError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, { cause });
    this.name = 'StreamError';
  }
}

export class CancellationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CancellationError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

export function isRetriableError(error: Error): boolean {
  if (error instanceof ApiError) {
    return [
      ApiErrorCode.NETWORK_ERROR,
      ApiErrorCode.TIMEOUT,
      ApiErrorCode.CONNECTION_FAILED,
      ApiErrorCode.SERVICE_UNAVAILABLE,
      ApiErrorCode.GATEWAY_TIMEOUT,
      ApiErrorCode.TOO_MANY_REQUESTS,
    ].includes(error.code);
  }
  return true;
}

export async function createApiError(response: Response, url: string, method: string): Promise<ApiError> {
  let details: unknown;
  try {
    const text = await response.text();
    try {
      details = JSON.parse(text);
    } catch {
      details = text;
    }
  } catch {
    details = undefined;
  }

  const code = statusToCode(response.status);
  const message = `API error ${response.status}: ${method} ${url}`;

  switch (response.status) {
    case 400:
    case 401:
    case 403:
    case 404:
    case 409:
    case 422:
      return new ValidationError(message, response.status, url, method, details);
    default:
      return new ApiError(message, code, response.status, url, method, details);
  }
}
