/**
 * Auth module - Types for authentication endpoints
 */

import type { UUID } from '../common/types';

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** POST /register */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

/** POST /login */
export interface LoginRequest {
  login: string;  // username, email, or phone
  password: string;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** POST /register response */
export interface RegisterResponse {
  user_id: UUID;
}

/** POST /login response (raw from API) */
export interface LoginResponse {
  token: string;
}

/** GET /who-am-i response (raw) */
export interface WhoAmIRawResponse {
  user: string;
}

/** GET /myself response (raw from API) */
export interface MyselfRawResponse {
  login: string;
  password: string;  // hashed - don't expose
  email: string;
  isadmin: boolean;
  aid: UUID;
}

// =============================================================================
// CLEAN USER-FACING TYPES
// =============================================================================

/** Clean user info returned to frontend (no sensitive data) */
export interface UserInfo {
  userId: string;
  username: string;
  email: string;
  isAdmin: boolean;
}
