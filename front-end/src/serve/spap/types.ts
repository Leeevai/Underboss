/**
 * SPAP module - Types for job applications
 */

import type { UUID, ISODateTime, SpapStatus, MediaItem } from '../common/types';

// =============================================================================
// SPAP ENTITY
// =============================================================================

/** SPAP (Job Application) - List item */
export interface Spap {
  spap_id: UUID;
  paps_id: UUID;
  paps_title: string;
  applicant_id: UUID;
  applicant_username: string;
  applicant_avatar: string | null;
  status: SpapStatus;
  message: string | null;
  applied_at: ISODateTime;
}

/** SPAP with full details */
export interface SpapDetail extends Spap {
  paps_description: string;
  applicant_email: string;
  applicant_phone: string | null;
  media: MediaItem[];
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** GET /spaps params */
export interface SpapListParams {
  paps_id?: UUID;
  applicant_id?: UUID;
  status?: SpapStatus;
}

/** POST /spaps */
export interface SpapCreateRequest {
  paps_id: UUID;
  message?: string;
}

/** PATCH /spaps/{id} */
export interface SpapUpdateRequest {
  status?: SpapStatus;
  message?: string;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** GET /spaps response */
export interface SpapListResponse {
  spaps: Spap[];
}

/** POST /spaps response */
export interface SpapCreateResponse {
  spap_id: UUID;
}

/** SPAP media list response */
export interface SpapMediaListResponse {
  spap_id: UUID;
  media_count: number;
  media: MediaItem[];
}
