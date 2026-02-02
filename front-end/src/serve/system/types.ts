/**
 * System module - Types for system endpoints
 * 
 * System endpoints provide:
 * - Health/uptime monitoring
 * - System information (git, db, stats)
 * - Admin user management (admin only)
 * 
 * @module serve/system/types
 */

import type { UUID, ISODateTime } from '../common/types';

// =============================================================================
// SYSTEM INFO
// =============================================================================

/** 
 * GET /uptime response
 * Public endpoint - no auth required
 */
export interface UptimeResponse {
  /** Application name */
  app: string;
  /** Uptime duration string */
  up: string;
}

/** Git repository info */
export interface GitInfo {
  /** Remote URL */
  remote: string;
  /** Current branch */
  branch: string;
  /** Current commit hash */
  commit: string;
  /** Commit date */
  date: string;
}

/** Database info */
export interface DatabaseInfo {
  /** Database type (e.g., 'postgresql') */
  type: string;
  /** Driver name */
  driver: string;
  /** Database version */
  version: string;
}

/** Server status info */
export interface ServerStatus {
  /** When server started (ISO datetime) */
  started: ISODateTime;
  /** Current time (ISO datetime) */
  now: ISODateTime;
  /** Current connection count */
  connections: number;
  /** Total request hits */
  hits: number;
}

/** 
 * GET /info response
 * Requires authentication
 */
export interface SystemInfoResponse {
  /** Application name */
  app: string;
  /** Git repository info */
  git: GitInfo;
  /** Authentication configuration */
  authentication: {
    config: string[];
    user: string;
    auth: string;
  };
  /** Database info */
  db: DatabaseInfo;
  /** Server status */
  status: ServerStatus;
  /** Version info for dependencies */
  version: Record<string, string>;
}

/** 
 * GET /stats response
 * Requires authentication
 */
export interface StatsResponse {
  /** Database pool statistics */
  pool_statistics: Record<string, unknown>;
}

// =============================================================================
// ADMIN USER MANAGEMENT
// =============================================================================

/** 
 * Admin user view
 * Returned by GET /users (admin only)
 */
export interface AdminUser {
  /** User ID (UUID) */
  aid: UUID;
  /** Username/login */
  login: string;
  /** Email address */
  email: string;
  /** Phone number */
  phone: string | null;
  /** Whether user has admin privileges */
  is_admin: boolean;
  /** Account creation timestamp */
  created_at: ISODateTime;
  /** Last update timestamp */
  updated_at?: ISODateTime;
}

/** 
 * GET /users response (admin only)
 * Lists all users in the system
 */
export interface AdminUserListResponse {
  /** Array of admin user views */
  users: AdminUser[];
  /** Total count */
  total: number;
}

/** 
 * GET /users/{user_id} response (admin only)
 */
export interface AdminUserGetResponse {
  /** User details */
  user: AdminUser;
}

/** 
 * POST /users request (admin only)
 * Create a new user
 */
export interface AdminUserCreateRequest {
  /** Username/login (required) */
  login: string;
  /** Password (required) */
  password: string;
  /** Email address (optional) */
  email?: string;
  /** Phone number (optional) */
  phone?: string;
  /** Grant admin privileges (optional, default: false) */
  is_admin?: boolean;
}

/** 
 * PATCH /users/{user_id} request (admin only)
 * Partially update a user
 */
export interface AdminUserUpdateRequest {
  /** New password */
  password?: string;
  /** New email */
  email?: string;
  /** New phone */
  phone?: string;
  /** Update admin status */
  is_admin?: boolean;
}

/** 
 * PUT /users/{user_id} request (admin only)
 * Replace user data
 */
export interface AdminUserReplaceRequest {
  auth: {
    /** Username/login (required) */
    login: string;
    /** Password (required) */
    password: string;
    /** Email address */
    email?: string;
    /** Admin status */
    isadmin?: boolean;
  };
}

/** POST /users response (admin only) */
export interface AdminUserCreateResponse {
  /** Created user ID */
  user_id: UUID;
  /** Success message */
  message: string;
}

/** PATCH /users/{user_id} response (admin only) */
export interface AdminUserUpdateResponse {
  /** Success message */
  message: string;
}

/** DELETE /users/{user_id} response (admin only) */
export interface AdminUserDeleteResponse {
  /** Success message */
  message: string;
