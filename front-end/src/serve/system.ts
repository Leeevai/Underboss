/**
 * System service endpoints.
 * Handles system health checks and info (admin endpoints).
 */

import { HttpMethod } from './types';
import {
  UptimeResponse,
  SystemInfoResponse,
  StatsResponse,
  AdminUser,
  AdminUserCreateRequest,
  AdminUserUpdateRequest,
  AdminUserReplaceRequest,
} from './types';
import {
  isValidUUID,
  isValidUsername,
  requiredFieldError,
  invalidFormatError,
  lengthError,
} from './errors';

// =============================================================================
// ENDPOINT KEYS
// =============================================================================

export type SystemEndpoint =
  | 'SYSTEM_UPTIME'
  | 'SYSTEM_INFO'
  | 'SYSTEM_STATS'
  // Admin User Management
  | 'ADMIN_USERS_LIST'
  | 'ADMIN_USER_CREATE'
  | 'ADMIN_USER_GET'
  | 'ADMIN_USER_UPDATE'
  | 'ADMIN_USER_REPLACE'
  | 'ADMIN_USER_DELETE';

// =============================================================================
// QUERY PARAMS
// =============================================================================

export interface SystemInfoParams {
  sleep?: number;
}

export interface AdminUsersListParams {
  flt?: string;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate admin user creation request.
 */
export function validateAdminUserCreateRequest(data: AdminUserCreateRequest): void {
  if (!data.login) {
    throw requiredFieldError('login');
  }
  if (data.login.length < 3) {
    throw lengthError('Username', 3);
  }
  if (!isValidUsername(data.login)) {
    throw invalidFormatError('username', 'starts with letter, alphanumeric with -_.');
  }
  if (!data.password) {
    throw requiredFieldError('password');
  }
}

/**
 * Validate user ID path parameter (can be UUID or username).
 */
export function validateUserIdParam(userId: string): void {
  // Can be either UUID or username
  if (!isValidUUID(userId) && !isValidUsername(userId)) {
    throw invalidFormatError('user identifier', 'UUID or username');
  }
}

// =============================================================================
// ENDPOINT CONFIGURATIONS
// =============================================================================

export interface EndpointConfig<TParams = unknown, TBody = unknown, TResponse = unknown> {
  method: HttpMethod;
  path: string;
  requiresAuth: boolean;
  requiresAdmin?: boolean;
  validate?: (body: TBody) => void;
  validatePathParams?: (params: Record<string, string>) => void;
}

export const systemEndpoints: Record<SystemEndpoint, EndpointConfig> = {
  SYSTEM_UPTIME: {
    method: 'GET',
    path: '/uptime',
    requiresAuth: false,
  },

  SYSTEM_INFO: {
    method: 'GET',
    path: '/info',
    requiresAuth: true,
    requiresAdmin: true,
  },

  SYSTEM_STATS: {
    method: 'GET',
    path: '/stats',
    requiresAuth: true,
    requiresAdmin: true,
  },

  // Admin User Management
  ADMIN_USERS_LIST: {
    method: 'GET',
    path: '/users',
    requiresAuth: true,
    requiresAdmin: true,
  },

  ADMIN_USER_CREATE: {
    method: 'POST',
    path: '/users',
    requiresAuth: true,
    requiresAdmin: true,
    validate: validateAdminUserCreateRequest as (body: unknown) => void,
  },

  ADMIN_USER_GET: {
    method: 'GET',
    path: '/users/:user_id',
    requiresAuth: true,
    requiresAdmin: true,
    validatePathParams: (params) => validateUserIdParam(params.user_id),
  },

  ADMIN_USER_UPDATE: {
    method: 'PATCH',
    path: '/users/:user_id',
    requiresAuth: true,
    requiresAdmin: true,
    validatePathParams: (params) => validateUserIdParam(params.user_id),
  },

  ADMIN_USER_REPLACE: {
    method: 'PUT',
    path: '/users/:user_id',
    requiresAuth: true,
    requiresAdmin: true,
    validatePathParams: (params) => validateUserIdParam(params.user_id),
  },

  ADMIN_USER_DELETE: {
    method: 'DELETE',
    path: '/users/:user_id',
    requiresAuth: true,
    requiresAdmin: true,
    validatePathParams: (params) => validateUserIdParam(params.user_id),
  },
};

// =============================================================================
// TYPE MAPPINGS FOR ENDPOINTS
// =============================================================================

export interface SystemEndpointTypes {
  SYSTEM_UPTIME: {
    params: never;
    body: never;
    response: UptimeResponse;
  };
  SYSTEM_INFO: {
    params: SystemInfoParams;
    body: never;
    response: SystemInfoResponse;
  };
  SYSTEM_STATS: {
    params: never;
    body: never;
    response: StatsResponse;
  };
  ADMIN_USERS_LIST: {
    params: AdminUsersListParams;
    body: never;
    response: AdminUser[];
  };
  ADMIN_USER_CREATE: {
    params: never;
    body: AdminUserCreateRequest;
    response: { user_id: string };
  };
  ADMIN_USER_GET: {
    params: never;
    body: never;
    pathParams: { user_id: string };
    response: AdminUser;
  };
  ADMIN_USER_UPDATE: {
    params: never;
    body: AdminUserUpdateRequest;
    pathParams: { user_id: string };
    response: void;
  };
  ADMIN_USER_REPLACE: {
    params: never;
    body: AdminUserReplaceRequest;
    pathParams: { user_id: string };
    response: void;
  };
  ADMIN_USER_DELETE: {
    params: never;
    body: never;
    pathParams: { user_id: string };
    response: void;
  };
}
