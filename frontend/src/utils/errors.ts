/**
 * API Error Classes
 * Standardized error handling across the application
 */

export enum ApiErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  CONNECTION_FAILED = 'CONNECTION_FAILED',

  // HTTP errors
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',

  // Application errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  STREAM_ERROR = 'STREAM_ERROR',
  CANCELLED = 'CANCELLED',
}

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export function statusToCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return ApiErrorCode.BAD_REQUEST;
    case 401:
      return ApiErrorCode.UNAUTHORIZED;
    case 403:
      return ApiErrorCode.FORBIDDEN;
    case 404:
      return ApiErrorCode.NOT_FOUND;
    case 409:
      return ApiErrorCode.CONFLICT;
    case 422:
      return ApiErrorCode.UNPROCESSABLE_ENTITY;
    case 429:
      return ApiErrorCode.TOO_MANY_REQUESTS;
    case 500:
      return ApiErrorCode.INTERNAL_SERVER_ERROR;
    case 503:
      return ApiErrorCode.SERVICE_UNAVAILABLE;
    case 504:
      return ApiErrorCode.GATEWAY_TIMEOUT;
    default:
      return status >= 500 ? ApiErrorCode.INTERNAL_SERVER_ERROR : ApiErrorCode.BAD_REQUEST;
  }
}

/**
 * Base API Error class
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: ApiErrorCode;
  public readonly body: unknown;
  public readonly timestamp: Date;
  public readonly requestUrl: string;
  public readonly requestMethod: string;

  constructor(
    message: string,
    status: number,
    code: ApiErrorCode,
    body: unknown = null,
    requestUrl = '',
    requestMethod = ''
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.body = body;
    this.timestamp = new Date();
    this.requestUrl = requestUrl;
    this.requestMethod = requestMethod;
  }

  isStatus(status: number): boolean {
    return this.status === status;
  }

  isStatusRange(range: '4xx' | '5xx'): boolean {
    if (range === '4xx') return this.status >= 400 && this.status < 500;
    if (range === '5xx') return this.status >= 500 && this.status < 600;
    return false;
  }

  isRetriable(): boolean {
    return (
      this.code === ApiErrorCode.NETWORK_ERROR ||
      this.code === ApiErrorCode.TIMEOUT ||
      this.code === ApiErrorCode.CONNECTION_FAILED ||
      this.isStatusRange('5xx') ||
      this.code === ApiErrorCode.TOO_MANY_REQUESTS
    );
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      body: this.body,
      timestamp: this.timestamp.toISOString(),
      requestUrl: this.requestUrl,
      requestMethod: this.requestMethod,
      stack: this.stack,
    };
  }
}

/**
 * Network/Connection Error
 */
export class NetworkError extends ApiError {
  constructor(message: string, originalError?: Error, requestUrl = '', requestMethod = '') {
    super(
      message,
      0,
      originalError instanceof TypeError && originalError.message.includes('fetch')
        ? ApiErrorCode.NETWORK_ERROR
        : ApiErrorCode.CONNECTION_FAILED,
      originalError,
      requestUrl,
      requestMethod
    );
    this.name = 'NetworkError';
  }
}

/**
 * Timeout Error (408)
 */
export class TimeoutError extends ApiError {
  constructor(message: string, requestUrl = '', requestMethod = '') {
    super(message, 408, ApiErrorCode.TIMEOUT, null, requestUrl, requestMethod);
    this.name = 'TimeoutError';
  }
}

/**
 * Validation Error (422)
 */
export class ValidationError extends ApiError {
  public readonly fields: Record<string, string[]>;

  constructor(message: string, fields: Record<string, string[]> = {}, body?: unknown) {
    super(message, 422, ApiErrorCode.UNPROCESSABLE_ENTITY, body);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

/**
 * Stream/SSE Error
 */
export class StreamError extends ApiError {
  constructor(message: string, body?: unknown) {
    super(message, 500, ApiErrorCode.STREAM_ERROR, body);
    this.name = 'StreamError';
  }
}

/**
 * Cancellation Error
 */
export class CancellationError extends ApiError {
  constructor(message = 'Request cancelled') {
    super(message, 499, ApiErrorCode.CANCELLED);
    this.name = 'CancellationError';
  }
}

export async function createApiError(
  response: Response,
  _requestUrl: string,
  _requestMethod: string
): Promise<ApiError> {
  let body: unknown = null;
  let message = `HTTP ${response.status}: ${response.statusText}`;

  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      body = await response.json();
      if (body && typeof body === 'object' && 'detail' in body) {
        message = String(body.detail);
      } else if (body && typeof body === 'object' && 'message' in body) {
        message = String(body.message);
      }
    } else {
      body = await response.text();
      message = String(body);
    }
  } catch {
    // Body parsing failed, use status text
  }

  const code = statusToCode(response.status);

  switch (response.status) {
    case 422:
      return new ValidationError(message, body as Record<string, string[]> | undefined, body);
    case 401:
    case 403:
      return new ApiError(message, response.status, code, body);
    case 404:
      return new ApiError(message, response.status, code, body);
    default:
      return new ApiError(message, response.status, code, body);
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

export function isRetriableError(error: unknown): boolean {
  if (error instanceof ApiError) return error.isRetriable();
  if (error instanceof NetworkError || error instanceof TimeoutError) return true;
  return false;
}