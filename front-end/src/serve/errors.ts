/**
 * Error handling utilities for the API service layer.
 * Provides consistent error handling, parsing, and custom error types.
 */

import { AxiosError } from 'axios';
import { ApiErrorResponse } from './types';

// =============================================================================
// ERROR CODES
// =============================================================================

/** Standard HTTP error codes */
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

/** Error categories for easier handling in UI */
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
  /** HTTP status code */
  readonly statusCode: number;
  
  /** Error category for UI handling */
  readonly category: ErrorCategory;
  
  /** Original error message from API */
  readonly apiMessage: string;
  
  /** The endpoint that was called */
  readonly endpoint?: string;
  
  /** Original axios error (if available) */
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
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if error is a specific HTTP status
   */
  isStatus(status: number): boolean {
    return this.statusCode === status;
  }

  /**
   * Check if error is an authentication error
   */
  isAuthError(): boolean {
    return this.category === 'authentication';
  }

  /**
   * Check if error is a validation error
   */
  isValidationError(): boolean {
    return this.category === 'validation';
  }

  /**
   * Check if error is a not found error
   */
  isNotFound(): boolean {
    return this.category === 'not_found';
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.category) {
      case 'authentication':
        return 'Please log in to continue.';
      case 'authorization':
        return 'You don\'t have permission to perform this action.';
      case 'not_found':
        return 'The requested resource was not found.';
      case 'conflict':
        return 'This resource already exists.';
      case 'file_error':
        return 'There was a problem with your file. Please check the size and format.';
      case 'server_error':
        return 'Something went wrong on our end. Please try again later.';
      case 'network_error':
        return 'Unable to connect to the server. Please check your internet connection.';
      case 'validation':
        return this.apiMessage; // Validation errors should show the specific message
      default:
        return 'An unexpected error occurred.';
    }
  }
}

// =============================================================================
// ERROR PARSING
// =============================================================================

/**
 * Determine error category from HTTP status code.
 */
function getErrorCategory(statusCode: number): ErrorCategory {
  if (statusCode === HTTP_STATUS.BAD_REQUEST) return 'validation';
  if (statusCode === HTTP_STATUS.UNAUTHORIZED) return 'authentication';
  if (statusCode === HTTP_STATUS.FORBIDDEN) return 'authorization';
  if (statusCode === HTTP_STATUS.NOT_FOUND) return 'not_found';
  if (statusCode === HTTP_STATUS.CONFLICT) return 'conflict';
  if (statusCode === HTTP_STATUS.PAYLOAD_TOO_LARGE || 
      statusCode === HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE) return 'file_error';
  if (statusCode >= 500) return 'server_error';
  return 'unknown';
}

/**
 * Extract error message from API response.
 */
function extractErrorMessage(data: unknown): string {
  if (typeof data === 'object' && data !== null) {
    const errorData = data as ApiErrorResponse;
    if (typeof errorData.error === 'string') {
      return errorData.error;
    }
  }
  if (typeof data === 'string') {
    return data;
  }
  return 'An unknown error occurred';
}

/**
 * Parse an Axios error into our ApiError format.
 */
export function parseAxiosError(error: AxiosError, endpoint?: string): ApiError {
  // Network error (no response)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return new ApiError(
        'Request timed out',
        0,
        'network_error',
        endpoint,
        error
      );
    }
    return new ApiError(
      error.message || 'Network error',
      0,
      'network_error',
      endpoint,
      error
    );
  }

  const { status, data } = error.response;
  const message = extractErrorMessage(data);
  const category = getErrorCategory(status);

  return new ApiError(message, status, category, endpoint, error);
}

/**
 * Parse any error into our ApiError format.
 */
export function parseError(error: unknown, endpoint?: string): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof AxiosError) {
    return parseAxiosError(error, endpoint);
  }

  if (error instanceof Error) {
    return new ApiError(
      error.message,
      0,
      'unknown',
      endpoint
    );
  }

  return new ApiError(
    'An unknown error occurred',
    0,
    'unknown',
    endpoint
  );
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * UUID validation regex pattern.
 */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Email validation regex pattern.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone validation regex pattern (E.164 format).
 */
export const PHONE_PATTERN = /^\+[1-9]\d{1,14}$/;

/**
 * Username validation regex pattern.
 */
export const USERNAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9._-]{2,49}$/;

/**
 * Slug validation regex pattern.
 */
export const SLUG_PATTERN = /^[a-z0-9-]+$/;

/**
 * Validate a UUID string.
 */
export function isValidUUID(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/**
 * Validate an email string.
 */
export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

/**
 * Validate a phone number (E.164 format).
 */
export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(value);
}

/**
 * Validate a username.
 */
export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value);
}

/**
 * Validate a slug.
 */
export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

/**
 * Validate latitude value (-90 to 90).
 */
export function isValidLatitude(value: number): boolean {
  return value >= -90 && value <= 90;
}

/**
 * Validate longitude value (-180 to 180).
 */
export function isValidLongitude(value: number): boolean {
  return value >= -180 && value <= 180;
}

/**
 * Validate proficiency level (1-5).
 */
export function isValidProficiencyLevel(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

// =============================================================================
// VALIDATION ERROR BUILDERS
// =============================================================================

/**
 * Create a validation error for required field.
 */
export function requiredFieldError(fieldName: string): ApiError {
  return new ApiError(
    `${fieldName} is required`,
    HTTP_STATUS.BAD_REQUEST,
    'validation'
  );
}

/**
 * Create a validation error for invalid format.
 */
export function invalidFormatError(fieldName: string, expectedFormat?: string): ApiError {
  const message = expectedFormat
    ? `Invalid ${fieldName} format. Expected: ${expectedFormat}`
    : `Invalid ${fieldName} format`;
  return new ApiError(message, HTTP_STATUS.BAD_REQUEST, 'validation');
}

/**
 * Create a validation error for field length.
 */
export function lengthError(fieldName: string, min?: number, max?: number): ApiError {
  let message: string;
  if (min !== undefined && max !== undefined) {
    message = `${fieldName} must be between ${min} and ${max} characters`;
  } else if (min !== undefined) {
    message = `${fieldName} must be at least ${min} characters`;
  } else if (max !== undefined) {
    message = `${fieldName} must be at most ${max} characters`;
  } else {
    message = `Invalid ${fieldName} length`;
  }
  return new ApiError(message, HTTP_STATUS.BAD_REQUEST, 'validation');
}

/**
 * Create a validation error for numeric range.
 */
export function rangeError(fieldName: string, min?: number, max?: number): ApiError {
  let message: string;
  if (min !== undefined && max !== undefined) {
    message = `${fieldName} must be between ${min} and ${max}`;
  } else if (min !== undefined) {
    message = `${fieldName} must be at least ${min}`;
  } else if (max !== undefined) {
    message = `${fieldName} must be at most ${max}`;
  } else {
    message = `Invalid ${fieldName} value`;
  }
  return new ApiError(message, HTTP_STATUS.BAD_REQUEST, 'validation');
}

// =============================================================================
// ERROR LOGGING
// =============================================================================

/**
 * Log an API error (can be customized for different logging solutions).
 */
export function logError(error: ApiError): void {
  if (__DEV__) {
    console.error('[API Error]', {
      message: error.message,
      statusCode: error.statusCode,
      category: error.category,
      endpoint: error.endpoint,
    });
  }
}

// Declare __DEV__ for TypeScript
declare const __DEV__: boolean;
