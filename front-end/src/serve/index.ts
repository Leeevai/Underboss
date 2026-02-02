/**
 * Serve - Centralized API Service Layer
 * 
 * This module provides a single point of communication with the Underboss backend.
 * All API calls from the frontend should go through the `serv` function.
 * 
 * @module serve
 * 
 * @example
 * import { serv } from '../serve';
 * 
 * // Register
 * const { userId } = await serv("register", { 
 *   username: "john", email: "john@example.com", password: "secret123" 
 * });
 * 
 * // Login (auto-saves token)
 * const userInfo = await serv("login", { login: "john", password: "secret123" });
 * 
 * // Get jobs
 * const { paps, total } = await serv("paps.list", { status: "published" });
 */

// =============================================================================
// MAIN EXPORTS
// =============================================================================

export {
  serv,
  axiosInstance,
  API_BASE_URL,
  getMediaUrl,
  isAuthenticated,
  setAuthToken,
  clearAuth,
  getEndpoints,
  getCurrentUser,
  getCachedProfile,
} from './serv';

export type { Endpoint } from './serv';

// =============================================================================
// COMMON TYPES & ERRORS
// =============================================================================

export { ApiError, HTTP_STATUS, parseError, logError } from './common/errors';
export type { ErrorCategory } from './common/errors';

export type {
  UUID,
  ISODateTime,
  ISODate,
  HttpMethod,
  AuthLevel,
  PapsStatus,
  SpapStatus,
  AsapStatus,
  PaymentStatus,
  PaymentType,
  PaymentMethod,
  Currency,
  MediaType,
  ProficiencyLevel,
  RatingValue,
  MessageType,
  ThreadType,
  ParticipantRole,
  RecurrenceRule,
  Gender,
  UserRatingInfo,
  PaginationParams,
  PaginatedResponse,
  MediaItem,
  MediaUploadResponse,
  MediaListResponse,
} from './common/types';

// =============================================================================
// AUTH TYPES
// =============================================================================

export type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  UserInfo,
} from './auth/types';

// =============================================================================
// PROFILE TYPES
// =============================================================================

export type {
  UserProfile,
  ProfileUpdateRequest,
  AvatarUploadResponse,
  Experience,
  ExperienceCreateRequest,
  ExperienceUpdateRequest,
  ExperienceCreateResponse,
  Interest,
  InterestCreateRequest,
  InterestUpdateRequest,
  InterestCreateResponse,
  ProfileRatingResponse,
} from './profile/types';

// =============================================================================
// CATEGORIES TYPES
// =============================================================================

export type {
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  CategoryListParams,
  CategoryCreateResponse,
  CategoryIconResponse,
} from './categories/types';

// =============================================================================
// PAPS TYPES
// =============================================================================

export type {
  Paps,
  PapsDetail,
  PapsCategory,
  PapsSchedule,
  PapsListParams,
  PapsCreateRequest,
  PapsUpdateRequest,
  PapsStatusUpdateRequest,
  ScheduleUpdateRequest,
  PapsListResponse,
  PapsCreateResponse,
  PapsStatusResponse,
  PapsCategoryAddResponse,
  PapsMediaListResponse,
  ScheduleCreateRequest,
  ScheduleCreateResponse,
} from './paps/types';

// =============================================================================
// SPAP TYPES
// =============================================================================

export type {
  Spap,
  SpapDetail,
  SpapListParams,
  SpapCreateRequest,
  SpapUpdateRequest,
  SpapListResponse,
  SpapCreateResponse,
  SpapMediaListResponse,
} from './spap/types';

// =============================================================================
// ASAP TYPES
// =============================================================================

export type {
  Asap,
  AsapDetail,
  AsapListParams,
  AsapCreateRequest,
  AsapUpdateRequest,
  AsapListResponse,
  AsapCreateResponse,
  AsapMediaListResponse,
} from './asap/types';

// =============================================================================
// PAYMENTS TYPES
// =============================================================================

export type {
  Payment,
  PaymentDetail,
  PaymentListParams,
  PaymentCreateRequest,
  PaymentUpdateRequest,
  PaymentStatusUpdateRequest,
  PaymentListResponse,
  PaymentMyResponse,
  PaymentListByPapsResponse,
  PaymentCreateResponse,
} from './payments/types';

// =============================================================================
// RATINGS TYPES
// =============================================================================

export type {
  Rating,
  UserRating,
  RatingCreateRequest,
  RatingCreateResponse,
} from './ratings/types';

// =============================================================================
// COMMENTS TYPES
// =============================================================================

export type {
  Comment,
  CommentThread,
  CommentListParams,
  CommentCreateRequest,
  CommentUpdateRequest,
  CommentListResponse,
  CommentCreateResponse,
  CommentUpdateResponse,
  CommentDeleteResponse,
  CommentThreadResponse,
} from './comments/types';

// =============================================================================
// CHAT TYPES
// =============================================================================

export type {
  ChatThread,
  ChatThreadDetail,
  ChatMessage,
  ChatParticipant,
  LastMessage,
  ChatListParams,
  ChatCreateRequest,
  MessageListParams,
  MessageCreateRequest,
  MessageUpdateRequest,
  MarkMessageReadRequest,
  MarkThreadReadRequest,
  ChatListResponse,
  ChatCreateResponse,
  ChatThreadResponse,
  MessageListResponse,
  MessageCreateResponse,
  MessageUpdateResponse,
  MarkMessageReadResponse,
  MarkThreadReadResponse,
  LeaveThreadResponse,
  UnreadCountResponse,
} from './chat/types';

// =============================================================================
// SYSTEM TYPES
// =============================================================================

export type {
  UptimeResponse,
  SystemInfoResponse,
  StatsResponse,
  GitInfo,
  DatabaseInfo,
  ServerStatus,
  AdminUser,
  AdminUserListResponse,
  AdminUserGetResponse,
  AdminUserCreateRequest,
  AdminUserUpdateRequest,
  AdminUserReplaceRequest,
  AdminUserCreateResponse,
  AdminUserUpdateResponse,
  AdminUserDeleteResponse,
} from './system/types';