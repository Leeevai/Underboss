/**
 * ASAP module - Types for job assignments
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
  accepted_username: string;
  status: AsapStatus;
  assigned_at: ISODateTime;
  started_at: ISODateTime | null;
  completed_at: ISODateTime | null;
}

/** ASAP with full details */
export interface AsapDetail extends Asap {
  paps_description: string;
  paps_location: string | null;
  paps_payment_amount: number | null;
  paps_payment_currency: string;
  accepted_user_email: string;
  accepted_user_phone: string | null;
  media: MediaItem[];
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** GET /asaps params */
export interface AsapListParams {
  paps_id?: UUID;
  accepted_user_id?: UUID;
  status?: AsapStatus;
}

/** POST /asaps */
export interface AsapCreateRequest {
  paps_id: UUID;
  accepted_user_id: UUID;
}

/** PATCH /asaps/{id} */
export interface AsapUpdateRequest {
  status: AsapStatus;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** GET /asaps response */
export interface AsapListResponse {
  asaps: Asap[];
}

/** POST /asaps response */
export interface AsapCreateResponse {
  asap_id: UUID;
}

/** ASAP media list response */
export interface AsapMediaListResponse {
  asap_id: UUID;
  media_count: number;
  media: MediaItem[];
}
