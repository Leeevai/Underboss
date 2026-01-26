/**
 * Authentication service endpoints.
 * Handles user registration, login, and authentication utilities.
 */

import { HttpMethod } from './types';
import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  MyselfResponse,
} from './types';
import {
  isValidUsername,
  isValidEmail,
  isValidPhone,
  requiredFieldError,
  invalidFormatError,
  lengthError,
} from './errors';

// =============================================================================
// ENDPOINT KEYS
// =============================================================================

export type AuthEndpoint =
  | 'AUTH_REGISTER'
  | 'AUTH_LOGIN'
  | 'AUTH_WHO_AM_I'
  | 'AUTH_MYSELF';

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const AUTH_DEFAULTS = {
  register: {
    phone: undefined,
  },
} as const;

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate registration request.
 */
export function validateRegisterRequest(data: RegisterRequest): void {
  // Username validation
  if (!data.username) {
    throw requiredFieldError('username');
  }
  if (data.username.length < 3 || data.username.length > 50) {
    throw lengthError('Username', 3, 50);
  }
  if (!isValidUsername(data.username)) {
    throw invalidFormatError('username', 'starts with letter, alphanumeric with -_.'); 
  }

  // Email validation
  if (!data.email) {
    throw requiredFieldError('email');
  }
  if (!isValidEmail(data.email)) {
    throw invalidFormatError('email');
  }

  // Password validation
  if (!data.password) {
    throw requiredFieldError('password');
  }

  // Phone validation (optional)
  if (data.phone && !isValidPhone(data.phone)) {
    throw invalidFormatError('phone', 'E.164 format (e.g., +1234567890)');
  }
}

/**
 * Validate login request.
 */
export function validateLoginRequest(data: LoginRequest): void {
  if (!data.login) {
    throw requiredFieldError('login');
  }
  if (!data.password) {
    throw requiredFieldError('password');
  }
}

// =============================================================================
// ENDPOINT CONFIGURATIONS
// =============================================================================

export interface EndpointConfig<TParams = unknown, TBody = unknown, TResponse = unknown> {
  method: HttpMethod;
  path: string;
  requiresAuth: boolean;
  validate?: (body: TBody) => void;
  defaultBody?: Partial<TBody>;
  defaultParams?: Partial<TParams>;
}

export const authEndpoints: Record<AuthEndpoint, EndpointConfig> = {
  AUTH_REGISTER: {
    method: 'POST',
    path: '/register',
    requiresAuth: false,
    validate: validateRegisterRequest as (body: unknown) => void,
    defaultBody: AUTH_DEFAULTS.register,
  },

  AUTH_LOGIN: {
    method: 'POST',
    path: '/login',
    requiresAuth: false,
    validate: validateLoginRequest as (body: unknown) => void,
  },

  AUTH_WHO_AM_I: {
    method: 'GET',
    path: '/who-am-i',
    requiresAuth: true,
  },

  AUTH_MYSELF: {
    method: 'GET',
    path: '/myself',
    requiresAuth: true,
  },
};

// =============================================================================
// TYPE MAPPINGS FOR ENDPOINTS
// =============================================================================

export interface AuthEndpointTypes {
  AUTH_REGISTER: {
    params: never;
    body: RegisterRequest;
    response: RegisterResponse;
  };
  AUTH_LOGIN: {
    params: never;
    body: LoginRequest;
    response: LoginResponse;
  };
  AUTH_WHO_AM_I: {
    params: never;
    body: never;
    response: string; // Returns just username string
  };
  AUTH_MYSELF: {
    params: never;
    body: never;
    response: MyselfResponse;
  };
}
