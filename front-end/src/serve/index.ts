/**
 * Serve - Centralized API Service Layer
 * 
 * This module provides a single point of communication with the Underboss backend.
 * All API calls from the frontend should go through the `serv` function.
 * 
 * @module serve
 * 
 * @example
 * // Basic usage - import serv
 * import { serv } from '../serve';
 * 
 * // Register
 * const { user_id } = await serv("register", { 
 *   username: "john", 
 *   email: "john@example.com", 
 *   password: "secret123" 
 * });
 * 
 * // Login
 * const { token } = await serv("login", { 
 *   login: "user@example.com", 
 *   password: "password123" 
 * });
 * 
 * // Get published jobs nearby
 * const { paps, total_count } = await serv("paps.list", { 
 *   status: "published",
 *   lat: 37.7749,
 *   lng: -122.4194,
 *   max_distance: 25 
 * });
 * 
 * // Get a specific PAPS
 * const papsDetail = await serv("paps.get", { 
 *   paps_id: "550e8400-e29b-41d4-a716-446655440000" 
 * });
 * 
 * // Update profile
 * await serv("profile.update", {
 *   first_name: "John",
 *   last_name: "Doe",
 *   bio: "Software developer"
 * });
 * 
 * // Upload avatar
 * await serv("avatar.upload", { file: imageFile });
 * 
 * @example
 * // Error handling
 * import { serv, ApiError } from '../serve';
 * 
 * try {
 *   await serv("login", { login: "wrong", password: "wrong" });
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     if (error.isAuthError()) {
 *       // Handle auth error
 *     }
 *     console.log(error.getUserMessage()); // User-friendly message
 *   }
 * }
 * 
 * @example
 * // Using types for type safety
 * import { serv } from '../serve';
 * import type { PapsCreateRequest } from '../serve/types';
 * 
 * const newPaps: PapsCreateRequest = {
 *   title: 'Need React Developer',
 *   description: 'Looking for an experienced React developer...',
 *   payment_amount: 500,
 *   payment_type: 'fixed'
 * };
 * 
 * const { paps_id } = await serv("paps.create", newPaps);
 */

// =============================================================================
// MAIN EXPORTS
// =============================================================================

// Main serv function and utilities
export {
  serv,
  axiosInstance,
  API_BASE_URL,
  isAuthenticated,
  setAuthToken,
  clearAuth,
  getEndpoints,
  getCurrentUser,
  getCachedProfile,
} from './serv';

// Type exports from serv
export type {
  Endpoint,
  EndpointRequestMap,
  EndpointResponseMap,
  UserInfo,
} from './serv';

// =============================================================================
// ERROR HANDLING
// =============================================================================

export {
  ApiError,
  parseError,
  parseAxiosError,
  logError,
  HTTP_STATUS,
  ErrorCategory,
} from './errors';

// Validation helpers
export {
  isValidUUID,
  isValidEmail,
  isValidPhone,
  isValidUsername,
  isValidSlug,
  isValidLatitude,
  isValidLongitude,
  isValidProficiencyLevel,
  UUID_PATTERN,
  EMAIL_PATTERN,
  PHONE_PATTERN,
  USERNAME_PATTERN,
  SLUG_PATTERN,
} from './errors';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Common types
export type {
  UUID,
  ISODateTime,
  ISODate,
  HttpMethod,
  AuthLevel,
  PapsStatus,
  SpapStatus,
  PaymentType,
  MediaType,
  ProficiencyLevel,
} from './types';

// User & Auth
export type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  MyselfResponse,
} from './types';

// Profile
export type {
  UserProfile,
  ProfileUpdateRequest,
  AvatarUploadResponse,
} from './types';

// Experiences
export type {
  Experience,
  ExperienceCreateRequest,
  ExperienceUpdateRequest,
  ExperienceCreateResponse,
} from './types';

// Interests
export type {
  Interest,
  InterestCreateRequest,
  InterestUpdateRequest,
} from './types';

// Categories
export type {
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  CategoryCreateResponse,
  CategoryIconResponse,
} from './types';

// PAPS
export type {
  Paps,
  PapsDetail,
  PapsCategory,
  PapsListResponse,
  PapsListParams,
  PapsCategoryInput,
  PapsCreateRequest,
  PapsUpdateRequest,
  PapsCreateResponse,
  PapsMedia,
  PapsMediaListResponse,
  MediaUploadResponse,
} from './types';

// Comments
export type {
  Comment,
  CommentsListResponse,
  CommentCreateRequest,
  CommentCreateResponse,
  CommentThreadResponse,
  RepliesListResponse,
} from './types';

// SPAP (Applications)
export type {
  Spap,
  SpapWithPaps,
  SpapListResponse,
  MyApplicationsResponse,
  SpapCreateRequest,
  SpapCreateResponse,
  SpapStatusUpdateRequest,
  SpapMedia,
  SpapMediaListResponse,
} from './types';

// Admin
export type {
  AdminUser,
  AdminUserCreateRequest,
  AdminUserUpdateRequest,
  AdminUserReplaceRequest,
} from './types';

// System
export type {
  UptimeResponse,
  SystemInfoResponse,
  StatsResponse,
  GitInfo,
} from './types';

// API Error
export type {
  ApiErrorResponse,
  ServiceRequest,
  FileUploadConfig,
} from './types';

// =============================================================================
// ENDPOINT TYPE EXPORTS
// =============================================================================

export type { AuthEndpoint, AuthEndpointTypes } from './auth';
export type { ProfileEndpoint, ProfileEndpointTypes } from './profile';
export type { CategoryEndpoint, CategoryEndpointTypes } from './categories';
export type { PapsEndpoint, PapsEndpointTypes } from './paps';
export type { CommentEndpoint, CommentEndpointTypes } from './comments';
export type { SpapEndpoint, SpapEndpointTypes } from './spap';
export type { SystemEndpoint, SystemEndpointTypes } from './system';

// =============================================================================
// CONSTANTS EXPORTS
// =============================================================================

export { PAPS_CONSTRAINTS, PAPS_DEFAULTS } from './paps';
export { COMMENT_CONSTRAINTS } from './comments';
export { SPAP_CONSTRAINTS, SPAP_DEFAULTS } from './spap';
export { AUTH_DEFAULTS } from './auth';
export { PROFILE_DEFAULTS } from './profile';
export { CATEGORY_DEFAULTS } from './categories';
