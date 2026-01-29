/**
 * Common type definitions shared across all API modules.
 */

// =============================================================================
// PRIMITIVE TYPES
// =============================================================================

/** UUID v4 format string */
export type UUID = string;

/** ISO 8601 datetime string */
export type ISODateTime = string;

/** ISO 8601 date string (YYYY-MM-DD) */
export type ISODate = string;

/** HTTP methods supported by the API */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Authentication levels */
export type AuthLevel = 'OPEN' | 'AUTH' | 'ADMIN';

// =============================================================================
// ENUMS
// =============================================================================

/** PAPS (Job Posting) status */
export type PapsStatus = 'draft' | 'published' | 'closed' | 'expired';

/** SPAP (Application) status */
export type SpapStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

/** ASAP (Assignment) status */
export type AsapStatus = 'active' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

/** Payment status */
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

/** Payment types */
export type PaymentType = 'fixed' | 'hourly' | 'negotiable';

/** Media types */
export type MediaType = 'image' | 'video' | 'document';

/** Proficiency levels for interests (1-5) */
export type ProficiencyLevel = 1 | 2 | 3 | 4 | 5;

/** Rating value (1-5) */
export type RatingValue = 1 | 2 | 3 | 4 | 5;

// =============================================================================
// API ERROR
// =============================================================================

/** API error response */
export interface ApiErrorResponse {
  error: string;
}

// =============================================================================
// PAGINATION
// =============================================================================

/** Standard pagination params */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  total: number;
  limit: number;
  offset: number;
  items: T[];
}

// =============================================================================
// FILE UPLOAD
// =============================================================================

/** File upload configuration */
export interface FileUploadConfig {
  file?: File | Blob;
  files?: File[] | Blob[];
  fieldName?: string;
}

// =============================================================================
// MEDIA ENTITIES (shared across PAPS, SPAP, ASAP)
// =============================================================================

/** Media item */
export interface MediaItem {
  media_id: UUID;
  media_url: string;
  media_type: MediaType;
  file_size_bytes: number;
  mime_type?: string;
  display_order: number;
  uploaded_at?: ISODateTime;
}

/** Media upload response */
export interface MediaUploadResponse {
  uploaded_media: MediaItem[];
  count: number;
}

/** Media list response */
export interface MediaListResponse {
  media_count: number;
  media: MediaItem[];
}
