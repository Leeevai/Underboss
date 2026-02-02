/**
 * PAPS module - Types for job postings
 * 
 * PAPS = Job Posting
 * 
 * @module serve/paps/types
 */

import type { UUID, ISODateTime, PapsStatus, PaymentType, MediaItem, RecurrenceRule } from '../common/types';

// =============================================================================
// CATEGORY REFERENCE
// =============================================================================

/** Category attached to PAPS */
export interface PapsCategory {
  category_id: UUID;
  name: string;
  slug: string;
  is_primary?: boolean;
}

// =============================================================================
// SCHEDULE
// =============================================================================

/**
 * Schedule entry for recurring PAPS
 * 
 * Recurrence rules: DAILY, WEEKLY, MONTHLY, YEARLY, CRON
 */
export interface PapsSchedule {
  schedule_id: UUID;
  paps_id: UUID;
  /** Recurrence rule type */
  recurrence_rule: RecurrenceRule;
  /** Cron expression (required if recurrence_rule is 'CRON') */
  cron_expression: string | null;
  /** When schedule starts */
  start_date: ISODateTime | null;
  /** When schedule expires */
  end_date: ISODateTime | null;
  /** Next scheduled run time */
  next_run_at: ISODateTime | null;
  /** Whether schedule is active */
  is_active: boolean;
  created_at: ISODateTime;
  updated_at?: ISODateTime;
}

/** 
 * POST /paps/{paps_id}/schedules - Create schedule request
 */
export interface ScheduleCreateRequest {
  /** Recurrence rule: daily, weekly, monthly, yearly, cron */
  recurrence_rule: string;
  /** Cron expression (required if recurrence_rule is 'cron') */
  cron_expression?: string;
  /** When schedule starts */
  start_date?: ISODateTime;
  /** When schedule expires */
  end_date?: ISODateTime;
  /** Next run time (computed if not provided) */
  next_run_at?: ISODateTime;
}

/** PUT /paps/{paps_id}/schedules/{schedule_id} - Update schedule request */
export interface ScheduleUpdateRequest {
  recurrence_rule?: string;
  cron_expression?: string;
  start_date?: ISODateTime;
  end_date?: ISODateTime;
  next_run_at?: ISODateTime;
  is_active?: boolean;
}

// =============================================================================
// PAPS ENTITY
// =============================================================================

/** 
 * PAPS (Job Posting) - List item returned from GET /paps
 */
export interface Paps {
  id: UUID;
  owner_id: UUID;
  owner_username: string;
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
  updated_at: ISODateTime;
  categories: PapsCategory[];
}

/** 
 * PAPS with full details - returned from GET /paps/{paps_id}
 */
export interface PapsDetail extends Paps {
  /** Number of comments on this PAPS */
  comments_count: number;
  /** Number of applications */
  applications_count: number;
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** 
 * GET /paps query params 
 */
export interface PapsListParams {
  /** Filter by status: draft, published, open, closed, cancelled */
  status?: PapsStatus;
  /** Filter by category UUID */
  category_id?: UUID;
  /** Latitude for distance search */
  lat?: number;
  /** Longitude for distance search */
  lng?: number;
  /** Maximum distance in km (requires lat/lng) */
  max_distance?: number;
  /** Minimum payment amount */
  min_price?: number;
  /** Maximum payment amount */
  max_price?: number;
  /** Filter by payment type: fixed, hourly, negotiable */
  payment_type?: PaymentType;
  /** Search by owner username (partial match) */
  owner_username?: string;
  /** Search in title and description (partial match) */
  title_search?: string;
  /** Results limit */
  limit?: number;
  /** Results offset */
  offset?: number;
}

/** 
 * POST /paps - Create PAPS request
 * 
 * Validation:
 * - title: 5+ characters
 * - description: 20+ characters
 * - payment_amount: must be positive
 * - max_applicants: 1-100
 * - max_assignees: must not exceed max_applicants
 * - location_lat/lng: both required if one is provided
 * - end_datetime: must be after start_datetime
 * - start_datetime: required for published status
 */
export interface PapsCreateRequest {
  /** Title (required, 5+ chars) */
  title: string;
  /** Description (required, 20+ chars) */
  description: string;
  /** Payment amount (required, > 0) */
  payment_amount: number;
  /** Payment currency (default: 'USD') */
  payment_currency?: string;
  /** Payment type: fixed, hourly, negotiable (default: 'fixed') */
  payment_type?: PaymentType;
  /** Max applicants (default: 10, range: 1-100) */
  max_applicants?: number;
  /** Max assignees (default: 1, must not exceed max_applicants) */
  max_assignees?: number;
  /** Subtitle */
  subtitle?: string;
  /** Location address */
  location_address?: string;
  /** Latitude (-90 to 90) */
  location_lat?: number;
  /** Longitude (-180 to 180) */
  location_lng?: number;
  /** Location timezone */
  location_timezone?: string;
  /** Start datetime (required for published status) */
  start_datetime?: ISODateTime;
  /** End datetime (must be after start_datetime) */
  end_datetime?: ISODateTime;
  /** Estimated duration in minutes */
  estimated_duration_minutes?: number;
  /** Whether publicly visible (default: true) */
  is_public?: boolean;
  /** Status: draft, published, closed, cancelled (default: 'draft') */
  status?: PapsStatus;
  /** When to publish */
  publish_at?: ISODateTime;
  /** When listing expires */
  expires_at?: ISODateTime;
  /** Category IDs or objects with is_primary */
  categories?: (UUID | { category_id: UUID; is_primary?: boolean })[];
}

/** PUT /paps/{paps_id} - Update PAPS request */
export interface PapsUpdateRequest {
  title?: string;
  description?: string;
  payment_amount?: number;
  payment_currency?: string;
  payment_type?: PaymentType;
  max_applicants?: number;
  max_assignees?: number;
  subtitle?: string | null;
  location_address?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  location_timezone?: string | null;
  start_datetime?: ISODateTime | null;
  end_datetime?: ISODateTime | null;
  estimated_duration_minutes?: number | null;
  is_public?: boolean;
  status?: PapsStatus;
  publish_at?: ISODateTime | null;
  expires_at?: ISODateTime | null;
  categories?: (UUID | { category_id: UUID; is_primary?: boolean })[];
}

/** PUT /paps/{paps_id}/status - Update status only */
export interface PapsStatusUpdateRequest {
  /** New status: draft, open, published, closed, cancelled */
  status: PapsStatus;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** GET /paps response */
export interface PapsListResponse {
  paps: Paps[];
  total_count: number;
}

/** POST /paps response */
export interface PapsCreateResponse {
  paps_id: UUID;
}

/** PUT /paps/{paps_id}/status response */
export interface PapsStatusResponse {
  status: PapsStatus;
}

/** POST /paps/{paps_id}/schedules response */
export interface ScheduleCreateResponse {
  schedule_id: UUID;
}

/** GET /paps/{paps_id}/media response */
export interface PapsMediaListResponse {
  paps_id: UUID;
  media_count: number;
  media: MediaItem[];
}

/** POST /paps/{paps_id}/categories/{category_id} response */
export interface PapsCategoryAddResponse {
  message: string;
}
