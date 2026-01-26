/**
 * Type definitions for all API entities and request/response shapes.
 * These types ensure type safety and consistency across all API calls.
 */

// =============================================================================
// COMMON TYPES
// =============================================================================

/** UUID v4 format string */
export type UUID = string;

/** ISO 8601 datetime string */
export type ISODateTime = string;

/** ISO 8601 date string */
export type ISODate = string;

/** HTTP methods supported by the API */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Authentication levels */
export type AuthLevel = 'OPEN' | 'AUTH' | 'ADMIN';

// =============================================================================
// ENUMS
// =============================================================================

/** PAPS (Job Posting) status */
export type PapsStatus = 'draft' | 'published' | 'closed' | 'cancelled';

/** SPAP (Application) status */
export type SpapStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

/** Payment types */
export type PaymentType = 'fixed' | 'hourly' | 'negotiable';

/** Media types */
export type MediaType = 'image' | 'video' | 'document';

/** Proficiency levels for interests (1-5) */
export type ProficiencyLevel = 1 | 2 | 3 | 4 | 5;

// =============================================================================
// USER & AUTH ENTITIES
// =============================================================================

/** User registration request */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

/** User registration response */
export interface RegisterResponse {
  user_id: UUID;
}

/** Login request (POST method) */
export interface LoginRequest {
  login: string; // username, email, or phone
  password: string;
}

/** Login response */
export interface LoginResponse {
  token: string;
}

/** Current user info from /myself */
export interface MyselfResponse {
  login: string;
  password: string; // hashed - don't expose to frontend
  email: string;
  isadmin: boolean;
  aid: UUID;
}

// =============================================================================
// PROFILE ENTITIES
// =============================================================================

/** User profile */
export interface UserProfile {
  user_id: UUID;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string;
  date_of_birth: ISODate | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  timezone: string | null;
  preferred_language: string | null;
}

/** Profile update request */
export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  bio?: string;
  date_of_birth?: ISODate;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  timezone?: string;
  preferred_language?: string;
}

/** Avatar upload response */
export interface AvatarUploadResponse {
  avatar_url: string;
}

// =============================================================================
// EXPERIENCE ENTITIES
// =============================================================================

/** User work experience */
export interface Experience {
  id: UUID;
  user_id: UUID;
  title: string;
  company: string | null;
  description: string | null;
  start_date: ISODateTime;
  end_date: ISODateTime | null;
  is_current: boolean;
  created_at: ISODateTime;
}

/** Experience creation request */
export interface ExperienceCreateRequest {
  title: string;
  company?: string;
  description?: string;
  start_date: ISODateTime;
  end_date?: ISODateTime;
  is_current?: boolean;
}

/** Experience update request */
export interface ExperienceUpdateRequest {
  title?: string;
  company?: string;
  description?: string;
  start_date?: ISODateTime;
  end_date?: ISODateTime;
  is_current?: boolean;
}

/** Experience creation response */
export interface ExperienceCreateResponse {
  experience_id: UUID;
}

// =============================================================================
// INTEREST ENTITIES
// =============================================================================

/** User interest (linked to category) */
export interface Interest {
  user_id: UUID;
  category_id: UUID;
  proficiency_level: ProficiencyLevel;
  category_name: string;
  category_slug: string;
  category_icon: string;
  added_at: ISODateTime;
}

/** Interest creation request */
export interface InterestCreateRequest {
  category_id: UUID;
  proficiency_level?: ProficiencyLevel;
}

/** Interest update request */
export interface InterestUpdateRequest {
  proficiency_level: ProficiencyLevel;
}

// =============================================================================
// CATEGORY ENTITIES
// =============================================================================

/** Category */
export interface Category {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  parent_id: UUID | null;
  icon_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: ISODateTime;
}

/** Category creation request (admin only) */
export interface CategoryCreateRequest {
  name: string;
  slug: string;
  description?: string;
  parent_id?: UUID;
  icon_url?: string;
}

/** Category update request (admin only) */
export interface CategoryUpdateRequest {
  name?: string;
  slug?: string;
  description?: string;
  parent_id?: UUID;
  icon_url?: string;
  is_active?: boolean;
}

/** Category creation response */
export interface CategoryCreateResponse {
  category_id: UUID;
}

/** Category icon upload response */
export interface CategoryIconResponse {
  icon_url: string;
}

// =============================================================================
// PAPS (JOB POSTING) ENTITIES
// =============================================================================

/** Category attached to PAPS */
export interface PapsCategory {
  id: UUID;
  name: string;
  slug: string;
  is_primary: boolean;
}

/** PAPS (Job Posting) */
export interface Paps {
  id: UUID;
  owner_id: UUID;
  owner_username: string;
  owner_email: string;
  owner_name: string | null;
  owner_avatar: string | null;
  title: string;
  subtitle: string | null;
  description: string;
  status: PapsStatus;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_timezone: string | null;
  start_datetime: ISODateTime | null;
  end_datetime: ISODateTime | null;
  estimated_duration_minutes: number | null;
  payment_amount: number;
  payment_currency: string;
  payment_type: PaymentType;
  max_applicants: number;
  max_assignees: number;
  is_public: boolean;
  publish_at: ISODateTime | null;
  expires_at: ISODateTime | null;
  created_at: ISODateTime;
  deleted_at: ISODateTime | null;
  distance_km?: number;
  interest_match_score?: number;
  categories: PapsCategory[];
}

/** PAPS with additional details */
export interface PapsDetail extends Paps {
  comments_count: number;
  applications_count: number;
}

/** PAPS list response */
export interface PapsListResponse {
  paps: Paps[];
  total_count: number;
}

/** PAPS list query parameters */
export interface PapsListParams {
  status?: PapsStatus;
  category_id?: UUID;
  lat?: number;
  lng?: number;
  max_distance?: number;
  min_price?: number;
  max_price?: number;
  payment_type?: PaymentType;
  owner_username?: string;
  title_search?: string;
}

/** Category reference for PAPS creation */
export interface PapsCategoryInput {
  category_id: UUID;
  is_primary?: boolean;
}

/** PAPS creation request */
export interface PapsCreateRequest {
  title: string;
  description: string;
  payment_amount: number;
  payment_currency?: string;
  payment_type?: PaymentType;
  max_applicants?: number;
  max_assignees?: number;
  subtitle?: string;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  location_timezone?: string;
  start_datetime?: ISODateTime;
  end_datetime?: ISODateTime;
  estimated_duration_minutes?: number;
  is_public?: boolean;
  status?: PapsStatus;
  publish_at?: ISODateTime;
  expires_at?: ISODateTime;
  categories?: (PapsCategoryInput | UUID)[];
}

/** PAPS update request */
export interface PapsUpdateRequest extends Partial<PapsCreateRequest> {}

/** PAPS creation response */
export interface PapsCreateResponse {
  paps_id: UUID;
}

// =============================================================================
// PAPS MEDIA ENTITIES
// =============================================================================

/** PAPS media item */
export interface PapsMedia {
  media_id: UUID;
  media_url: string;
  media_type: 'image' | 'video';
  file_size_bytes: number;
  mime_type: string;
  display_order: number;
}

/** PAPS media list response */
export interface PapsMediaListResponse {
  paps_id: UUID;
  media_count: number;
  media: PapsMedia[];
}

/** Media upload response */
export interface MediaUploadResponse {
  uploaded_media: PapsMedia[];
  count: number;
}

// =============================================================================
// COMMENT ENTITIES
// =============================================================================

/** Comment */
export interface Comment {
  id: UUID;
  paps_id: UUID;
  user_id: UUID;
  content: string;
  parent_id: UUID | null;
  author_username: string;
  author_name: string | null;
  author_avatar: string | null;
  reply_count: number;
  created_at: ISODateTime;
  updated_at: ISODateTime | null;
  deleted_at: ISODateTime | null;
}

/** Comments list response */
export interface CommentsListResponse {
  paps_id: UUID;
  comments: Comment[];
  count: number;
  total_count: number;
}

/** Comment creation request */
export interface CommentCreateRequest {
  content: string;
}

/** Comment creation response */
export interface CommentCreateResponse {
  comment_id: UUID;
}

/** Comment thread response */
export interface CommentThreadResponse {
  comment: Comment;
  replies: Comment[];
  is_reply: boolean;
}

/** Replies list response */
export interface RepliesListResponse {
  parent_comment_id: UUID;
  replies: Comment[];
  count: number;
}

// =============================================================================
// SPAP (APPLICATION) ENTITIES
// =============================================================================

/** SPAP (Job Application) */
export interface Spap {
  id: UUID;
  paps_id: UUID;
  applicant_id: UUID;
  applicant_username: string;
  applicant_name: string | null;
  applicant_avatar: string | null;
  status: SpapStatus;
  message: string | null;
  applied_at: ISODateTime;
  reviewed_at: ISODateTime | null;
  accepted_at: ISODateTime | null;
  rejected_at: ISODateTime | null;
}

/** SPAP with PAPS info (for applicant's view) */
export interface SpapWithPaps extends Spap {
  paps_title: string;
  paps_owner_username: string;
}

/** SPAP list response (for PAPS owner) */
export interface SpapListResponse {
  applications: Spap[];
  count: number;
}

/** My applications response */
export interface MyApplicationsResponse {
  applications: SpapWithPaps[];
  count: number;
}

/** SPAP creation request */
export interface SpapCreateRequest {
  message?: string;
}

/** SPAP creation response */
export interface SpapCreateResponse {
  spap_id: UUID;
}

/** SPAP status update request */
export interface SpapStatusUpdateRequest {
  status: SpapStatus;
}

// =============================================================================
// SPAP MEDIA ENTITIES
// =============================================================================

/** SPAP media item */
export interface SpapMedia {
  media_id: UUID;
  media_url: string;
  media_type: MediaType;
  file_size_bytes: number;
  mime_type: string;
  display_order: number;
}

/** SPAP media list response */
export interface SpapMediaListResponse {
  spap_id: UUID;
  media_count: number;
  media: SpapMedia[];
}

// =============================================================================
// ADMIN ENTITIES
// =============================================================================

/** Admin user view */
export interface AdminUser {
  aid: UUID;
  login: string;
  email: string;
  phone: string | null;
  is_admin: boolean;
  created_at: ISODateTime;
}

/** Admin user creation request */
export interface AdminUserCreateRequest {
  login: string;
  password: string;
  email?: string;
  phone?: string;
  is_admin?: boolean;
}

/** Admin user update request */
export interface AdminUserUpdateRequest {
  password?: string;
  email?: string;
  phone?: string;
  is_admin?: boolean;
}

/** Admin user replace request */
export interface AdminUserReplaceRequest {
  auth: {
    login: string;
    password: string;
    email?: string;
    isadmin?: boolean;
  };
}

// =============================================================================
// SYSTEM ENTITIES
// =============================================================================

/** Uptime response */
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

/** System info response */
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
  version: {
    python: string;
    FlaskSimpleAuth: string;
    postgres: string;
  };
}

/** Stats response */
export interface StatsResponse {
  pool_size: number;
  active_connections: number;
  idle_connections: number;
  waiting_requests: number;
}

// =============================================================================
// API ERROR RESPONSE
// =============================================================================

/** API error response */
export interface ApiErrorResponse {
  error: string;
}

// =============================================================================
// SERVICE REQUEST TYPES
// =============================================================================

/** Base service request configuration */
export interface ServiceRequest<TParams = unknown, TBody = unknown> {
  params?: TParams;
  body?: TBody;
  pathParams?: Record<string, string>;
}

/** File upload configuration */
export interface FileUploadConfig {
  file?: File | Blob;
  files?: File[] | Blob[];
  fieldName?: string;
}
