/**
 * System module - Types for system endpoints
 */

import type { UUID, ISODateTime } from '../common/types';

// =============================================================================
// SYSTEM INFO
// =============================================================================

/** GET /uptime response */
export interface UptimeResponse {
  app: string;
  up: string;
}

/** Git info */
export interface GitInfo {
  remote: string;
  branch: string;
  commit: string;
  date: string;
}

/** GET /info response */
export interface SystemInfoResponse {
  app: string;
  git: GitInfo;
  authentication: {
    config: string[];
    user: string;
    auth: string;
  };
  db: {
    type: string;
    driver: string;
    version: string;
  };
  status: {
    started: ISODateTime;
    now: ISODateTime;
    connections: number;
    hits: number;
  };
  version: Record<string, string>;
}

/** GET /stats response */
export interface StatsResponse {
  pool_statistics: Record<string, unknown>;
}

// =============================================================================
// ADMIN USER MANAGEMENT
// =============================================================================

/** Admin user view */
export interface AdminUser {
  aid: UUID;
  login: string;
  email: string;
  phone: string | null;
  is_admin: boolean;
  created_at: ISODateTime;
  updated_at?: ISODateTime;
}

/** POST /users */
export interface AdminUserCreateRequest {
  login: string;
  password: string;
  email?: string;
  phone?: string;
  is_admin?: boolean;
}

/** PATCH /users/{id} */
export interface AdminUserUpdateRequest {
  password?: string;
  email?: string;
  phone?: string;
  is_admin?: boolean;
}

/** PUT /users/{id} */
export interface AdminUserReplaceRequest {
  auth: {
    login: string;
    password: string;
    email?: string;
    isadmin?: boolean;
  };
}

/** POST /users response */
export interface AdminUserCreateResponse {
  user_id: UUID;
}
