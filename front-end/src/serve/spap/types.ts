/**
 * SPAP module - Types for job applications
 * 
 * SPAP = Job Application to a PAPS (job posting)
 * 
 * @module serve/spap/types
 */

import type { UUID, ISODateTime, SpapStatus, MediaItem } from '../common/types';

// =============================================================================
// SPAP ENTITY
// =============================================================================

/** 
 * SPAP (Job Application) - List item 
 * 
 * @see GET /spap/my
 */
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

/** 
 * SPAP with full details 
 * 
 * @see GET /spap/{spap_id}
 */
export interface SpapDetail extends Spap {
  chat_thread_id: UUID | null;
  /** Application title */
  title: string | null;
  /** Application subtitle */
  subtitle: string | null;
  /** Proposed payment amount */
  proposed_payment: number | null;
  /** Location address */
  location_address: string | null;
  /** Location latitude */
  location_lat: number | null;
  /** Location longitude */
  location_lng: number | null;
  /** Location timezone */
  location_timezone: string | null;
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** 
 * POST /paps/{paps_id}/apply - Apply to job posting
 * 
 * Validation:
 * - Cannot apply to your own PAPS
 * - Cannot apply twice to same PAPS
 * - Cannot apply if already assigned to this PAPS
 * - PAPS must be in "open" or "published" status
 * - Maximum assignees must not be reached
 */
export interface SpapApplyRequest {
  /** Application message/cover letter */
  message?: string;
  /** Application title */
  title?: string;
  /** Application subtitle */
  subtitle?: string;
  /** Proposed payment amount (>= 0) */
  proposed_payment?: number;
  /** Location address */
  location_address?: string;
  /** Location latitude (-90 to 90) */
  location_lat?: number;
  /** Location longitude (-180 to 180) */
  location_lng?: number;
  /** Location timezone */
  location_timezone?: string;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** 
 * GET /spap/my response 
 */
export interface SpapMyResponse {
  applications: Spap[];
  count: number;
}

/** 
 * GET /paps/{paps_id}/applications response (owner only) 
 */
export interface SpapListByPapsResponse {
  applications: SpapDetail[];
  count: number;
}

/** 
 * POST /paps/{paps_id}/apply response 
 * 
 * Side effects:
 * - Creates a chat thread between applicant and owner
 */
export interface SpapApplyResponse {
  spap_id: UUID;
  chat_thread_id: UUID;
}

/** 
 * PUT /spap/{spap_id}/accept response 
 * 
 * Side effects:
 * - Creates an ASAP (assignment)
 * - Transfers chat thread from SPAP to ASAP
 * - Deletes the SPAP
 * - If max_assignees reached: closes PAPS and deletes remaining SPAPs
 */
export interface SpapAcceptResponse {
  asap_id: UUID;
}

/** 
 * GET /spap/{spap_id}/media response 
 */
export interface SpapMediaListResponse {
  spap_id: UUID;
  media_count: number;
  media: MediaItem[];
}

// Legacy type aliases for backward compatibility
export type SpapListParams = Record<string, never>;  // No params for spap.my
export type SpapCreateRequest = SpapApplyRequest;
export type SpapUpdateRequest = never;  // No update endpoint
export type SpapListResponse = SpapMyResponse;
export type SpapCreateResponse = SpapApplyResponse;
