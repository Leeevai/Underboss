/**
 * System module - Endpoint definitions
 * 
 * System endpoints:
 * - /uptime - Health check (public)
 * - /info - Detailed system info (authenticated)
 * - /stats - Database statistics (authenticated)
 * 
 * Admin user management (admin only):
 * - /users - List/create users
 * - /users/{user_id} - Get/update/delete users
 * 
 * @module serve/system/endpoints
 */

import type { HttpMethod } from '../common/types';
import { validateAdminUserCreate, validateAdminUserUpdate, validateAdminUserReplace } from './validators';

export interface EndpointConfig {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
}

export const systemEndpoints: Record<string, EndpointConfig> = {
  // ==========================================================================
  // System info (public/authenticated)
  // ==========================================================================
  
  /**
   * Health check / uptime
   * Public endpoint - no authentication required
   * 
   * Response: UptimeResponse { app, up }
   */
  'system.uptime': {
    method: 'GET',
    path: '/uptime',
    auth: false,
  },

  /**
   * Public app configuration
   * No authentication required
   * 
   * Response: { default_avatar_url }
   */
  'system.config': {
    method: 'GET',
    path: '/config',
    auth: false,
  },
  
  /**
   * Detailed system information
   * Requires authentication (any user)
   * 
   * Response: SystemInfoResponse { app, git, authentication, db, status, version }
   */
  'system.info': {
    method: 'GET',
    path: '/info',
    auth: true,
  },
  
  /**
   * Database pool statistics
   * Requires authentication (any user)
   * 
   * Response: StatsResponse { pool_statistics }
   */
  'system.stats': {
    method: 'GET',
    path: '/stats',
    auth: true,
  },

  // ==========================================================================
  // Admin user management (admin only)
  // ==========================================================================
  
  /**
   * List all users
   * Admin only
   * 
   * Response: AdminUserListResponse { users, total }
   */
  'admin.users.list': {
    method: 'GET',
    path: '/users',
    auth: true,
  },
  
  /**
   * Create a new user
   * Admin only
   * 
   * Request: AdminUserCreateRequest { login, password, email?, phone?, is_admin? }
   * Response: AdminUserCreateResponse { user_id, message }
   */
  'admin.users.create': {
    method: 'POST',
    path: '/users',
    auth: true,
    validate: validateAdminUserCreate,
  },
  
  /**
   * Get user details
   * Admin only
   * 
   * Path params: user_id
   * Response: AdminUserGetResponse { user }
   */
  'admin.users.get': {
    method: 'GET',
    path: '/users/{user_id}',
    auth: true,
  },
  
  /**
   * Partially update a user
   * Admin only
   * 
   * Path params: user_id
   * Request: AdminUserUpdateRequest { password?, email?, phone?, is_admin? }
   * Response: AdminUserUpdateResponse { message }
   */
  'admin.users.update': {
    method: 'PATCH',
    path: '/users/{user_id}',
    auth: true,
    validate: validateAdminUserUpdate,
  },
  
  /**
   * Replace user data entirely
   * Admin only
   * 
   * Path params: user_id
   * Request: AdminUserReplaceRequest { auth: { login, password, email?, isadmin? } }
   * Response: AdminUserUpdateResponse { message }
   */
  'admin.users.replace': {
    method: 'PUT',
    path: '/users/{user_id}',
    auth: true,
    validate: validateAdminUserReplace,
  },
  
  /**
   * Delete a user
   * Admin only
   * 
   * Path params: user_id
   * Response: AdminUserDeleteResponse { message }
   */
  'admin.users.delete': {
    method: 'DELETE',
    path: '/users/{user_id}',
    auth: true,
  },
};
