/**
 * SPAP module - Types for job applications
 * 
 * SPAP = Job Application to a PAPS (job posting)
 */

import type { UUID, ISODateTime, SpapStatus, MediaItem } from '../common/types';

// =============================================================================
// SPAP ENTITY
// =============================================================================

/** SPAP (Job Application) - List item */
export interface Spap {
  id: UUID;
  paps_id: UUID;
  paps_title: string;
  applicant_id: UUID;
  status: SpapStatus;
  message: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** SPAP with full details */
export interface SpapDetail extends Spap {
  chat_thread_id: UUID | null;
  // Additional fields for applicant info (when viewing as owner)
  title?: string | null;
  subtitle?: string | null;
  proposed_payment?: number | null;
  location_address?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  location_timezone?: string | null;
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** POST /paps/{paps_id}/apply */
export interface SpapApplyRequest {
  message?: string;
  title?: string;
  subtitle?: string;
  proposed_payment?: number;
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  location_timezone?: string;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** GET /spap/my response */
export interface SpapMyResponse {
  applications: Spap[];
  count: number;
}

/** GET /paps/{paps_id}/applications response */
export interface SpapListByPapsResponse {
  applications: SpapDetail[];
  count: number;
}

/** POST /paps/{paps_id}/apply response */
export interface SpapApplyResponse {
  spap_id: UUID;
  chat_thread_id: UUID;
}

/** PUT /spap/{spap_id}/accept response */
export interface SpapAcceptResponse {
  asap_id: UUID;
}

/** SPAP media list response */
export interface SpapMediaListResponse {
  spap_id: UUID;
  media_count: number;
  media: MediaItem[];
}
