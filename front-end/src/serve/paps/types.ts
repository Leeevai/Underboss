/**
 * PAPS module - Types for job postings
 */

import type { UUID, ISODateTime, PapsStatus, MediaItem } from '../common/types';

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

/** Schedule entry */
export interface PapsSchedule {
  schedule_id: UUID;
  paps_id: UUID;
  start_time: ISODateTime;
  end_time: ISODateTime;
  is_recurring: boolean;
  recurrence_pattern: 'daily' | 'weekly' | 'monthly' | null;
  created_at?: ISODateTime;
  updated_at?: ISODateTime;
}

/** Schedule create request */
export interface ScheduleCreateRequest {
  start_time: ISODateTime;
  end_time: ISODateTime;
  is_recurring?: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly';
}

// =============================================================================
// PAPS ENTITY
// =============================================================================

/** PAPS (Job Posting) - List item */
export interface Paps {
  paps_id: UUID;
  owner_id: UUID;
  owner_username: string;
  owner_avatar?: string | null;
  title: string;
  description: string;
  status: PapsStatus;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  payment_amount: number | null;
  payment_currency: string;
  created_at: ISODateTime;
  updated_at?: ISODateTime;
  published_at: ISODateTime | null;
  expires_at: ISODateTime | null;
  categories: string[];  // Category names
  media_count: number;
  distance_km?: number;
}

/** PAPS with full details */
export interface PapsDetail extends Omit<Paps, 'categories'> {
  categories: PapsCategory[];
  media: MediaItem[];
  schedule: PapsSchedule[];
  application_count: number;
  assignment_count: number;
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** GET /paps params */
export interface PapsListParams {
  status?: PapsStatus;
  owner_id?: UUID;
  category_id?: UUID;
  location_lat?: number;
  location_lng?: number;
  radius_km?: number;
  search?: string;
  min_payment?: number;
  max_payment?: number;
  payment_currency?: string;
  sort_by?: 'created_at' | 'payment_amount' | 'distance';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/** POST /paps */
export interface PapsCreateRequest {
  title: string;
  description: string;
  status?: PapsStatus;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  payment_amount?: number;
  payment_currency?: string;
  expires_at?: ISODateTime;
  category_ids?: UUID[];
  schedule?: ScheduleCreateRequest[];
}

/** PUT/PATCH /paps/{id} */
export interface PapsUpdateRequest {
  title?: string;
  description?: string;
  status?: PapsStatus;
  location_address?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  payment_amount?: number | null;
  payment_currency?: string;
  expires_at?: ISODateTime | null;
  category_ids?: UUID[];
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** GET /paps response */
export interface PapsListResponse {
  paps: Paps[];
  total: number;
  limit: number;
  offset: number;
}

/** POST /paps response */
export interface PapsCreateResponse {
  paps_id: UUID;
}

/** POST /paps/{id}/schedule response */
export interface ScheduleCreateResponse {
  schedule_id: UUID;
}

/** PAPS media list response */
export interface PapsMediaListResponse {
  paps_id: UUID;
  media_count: number;
  media: MediaItem[];
}
