/**
 * Error handling utilities for the API service layer.
 */

import { AxiosError } from 'axios';
import type { ApiErrorResponse } from './types';

// =============================================================================
// HTTP STATUS CODES
// =============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// =============================================================================
// ERROR CATEGORIES
// =============================================================================

export type ErrorCategory =
  | 'validation'      // Bad input (400)
  | 'authentication'  // Not logged in (401)
  | 'authorization'   // Not allowed (403)
  | 'not_found'       // Resource not found (404)
  | 'conflict'        // Duplicate resource (409)
  | 'file_error'      // File too large or wrong type (413, 415)
  | 'server_error'    // Server error (500+)
  | 'network_error'   // Network/connection issues
  | 'unknown';        // Unknown error

// =============================================================================
// CUSTOM ERROR CLASS
// =============================================================================

/**
 * Custom API error class with additional metadata.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly category: ErrorCategory;
  readonly apiMessage: string;
  readonly endpoint?: string;
  readonly originalError?: AxiosError;

  constructor(
    message: string,
    statusCode: number,
    category: ErrorCategory,
    endpoint?: string,
    originalError?: AxiosError
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.category = category;
    this.apiMessage = message;
    this.endpoint = endpoint;
    this.originalError = originalError;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  isStatus(status: number): boolean {
    return this.statusCode === status;
  }

  isAuthError(): boolean {
    return this.category === 'authentication';
  }

  isNotFound(): boolean {
    return this.category === 'not_found';
  }

  isValidationError(): boolean {
    return this.category === 'validation';
  }

  getUserMessage(): string {
    switch (this.category) {
      case 'authentication':
        return 'Please log in to continue.';
      case 'authorization':
        return 'You do not have permission to perform this action.';
      case 'not_found':
        return 'The requested resource was not found.';
      case 'conflict':
        return 'This resource already exists.';
      case 'validation':
        return this.apiMessage || 'Please check your input.';
      case 'file_error':
        return this.apiMessage || 'File upload failed.';
      case 'network_error':
        return 'Unable to connect to the server.';
      case 'server_error':
        return 'Something went wrong. Please try again later.';
      default:
        return 'An unexpected error occurred.';
    }
  }
}

// =============================================================================
// ERROR PARSING
// =============================================================================

function getErrorCategory(statusCode: number): ErrorCategory {
  switch (statusCode) {
    case HTTP_STATUS.BAD_REQUEST:
      return 'validation';
    case HTTP_STATUS.UNAUTHORIZED:
      return 'authentication';
    case HTTP_STATUS.FORBIDDEN:
      return 'authorization';
    case HTTP_STATUS.NOT_FOUND:
      return 'not_found';
    case HTTP_STATUS.CONFLICT:
      return 'conflict';
    case HTTP_STATUS.PAYLOAD_TOO_LARGE:
    case HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE:
      return 'file_error';
    default:
      return statusCode >= 500 ? 'server_error' : 'unknown';
  }
}

/**
 * Parse any error into an ApiError
 */
export function parseError(error: unknown, endpoint?: string): ApiError {
  // Already an ApiError
  if (error instanceof ApiError) {
    return error;
  }

  // Axios error
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as ApiErrorResponse | undefined;
    const message = data?.error ?? error.message ?? 'Request failed';
    const category = error.response ? getErrorCategory(status) : 'network_error';

    return new ApiError(message, status, category, endpoint, error);
  }

  // Standard error
  if (error instanceof Error) {
    return new ApiError(error.message, 0, 'unknown', endpoint);
  }

  // Unknown
  return new ApiError(String(error), 0, 'unknown', endpoint);
}

/**
 * Log error in development mode
 */
export function logError(error: ApiError): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.error(`[API Error] ${error.endpoint}: ${error.statusCode} - ${error.message}`);
  }
}

declare const __DEV__: boolean;
