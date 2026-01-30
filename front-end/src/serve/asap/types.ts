/**
 * ASAP module - Types for job assignments
 * 
 * ASAP = Job Assignment (created when an application is accepted)
 */

import type { UUID, ISODateTime, AsapStatus, MediaItem } from '../common/types';

// =============================================================================
// ASAP ENTITY
// =============================================================================

/** ASAP (Job Assignment) - List item */
export interface Asap {
  asap_id: UUID;
  paps_id: UUID;
  paps_title: string;
  accepted_user_id: UUID;
  owner_id: UUID;
  status: AsapStatus;
  created_at: ISODateTime;
  started_at: ISODateTime | null;
  completed_at: ISODateTime | null;
}

/** ASAP with full details */
export interface AsapDetail extends Asap {
  accepted_username: string;
  owner_username: string;
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** PUT /asap/{asap_id}/status */
export interface AsapStatusUpdateRequest {
  status: AsapStatus;
}

/** POST /asap/{asap_id}/rate */
export interface AsapRateRequest {
  score: number; // 1-5
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** GET /asap response */
export interface AsapMyResponse {
  as_worker: Asap[];
  as_owner: Asap[];
  total_as_worker: number;
  total_as_owner: number;
}

/** GET /paps/{paps_id}/assignments response */
export interface AsapListByPapsResponse {
  assignments: AsapDetail[];
  count: number;
}

/** POST /asap/{asap_id}/rate response */
export interface AsapRateResponse {
  message: string;
  rated_user_id: UUID;
  score: number;
}

/** GET /asap/{asap_id}/can-rate response */
export interface AsapCanRateResponse {
  can_rate: boolean;
  user_to_rate_id?: UUID;
  is_owner?: boolean;
  is_worker?: boolean;
  reason?: string;
}

/** ASAP media list response */
export interface AsapMediaListResponse {
  asap_id: UUID;
  media_count: number;
  media: MediaItem[];
}
