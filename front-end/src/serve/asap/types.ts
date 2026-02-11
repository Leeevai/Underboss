/**
 * ASAP module - Types for job assignments
 * 
 * ASAP = Job Assignment (created when an application is accepted)
 * 
 * @module serve/asap/types
 */

import type { UUID, ISODateTime, AsapStatus, MediaItem } from '../common/types';

// =============================================================================
// ASAP ENTITY
// =============================================================================

/** 
 * ASAP (Job Assignment) - List item 
 * 
 * @see GET /asap
 */
export interface Asap {
  asap_id: UUID;
  paps_id: UUID;
  paps_title: string;
  accepted_user_id: UUID;
  owner_id: UUID;
  owner_username: string;
  owner_display_name: string | null;
  status: AsapStatus;
  assigned_at: ISODateTime;
  started_at: ISODateTime | null;
  completed_at: ISODateTime | null;
  worker_confirmed: boolean;
  owner_confirmed: boolean;
  payment_amount: number | null;
  payment_currency: string | null;
  payment_type: 'fixed' | 'hourly' | 'negotiable' | null;
}

/** 
 * ASAP with full details 
 * 
 * @see GET /asap/{asap_id}
 */
export interface AsapDetail extends Asap {
  accepted_username: string;
  owner_username: string;
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** 
 * PUT /asap/{asap_id}/status - Update status
 * 
 * Permission rules:
 * - in_progress: Worker or owner can start
 * - completed: Only owner can mark (triggers payment)
 * - cancelled: Only owner or admin
 * - disputed: Either party can dispute
 * - active: Only admin can revert
 */
export interface AsapStatusUpdateRequest {
  status: AsapStatus;
}

/** 
 * POST /asap/{asap_id}/rate - Rate user
 * 
 * Validation:
 * - ASAP must be completed
 * - Must be either the PAPS owner or the worker
 * - Owner rates worker, worker rates owner
 */
export interface AsapRateRequest {
  /** Rating score 1-5 */
  score: number;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** 
 * GET /asap response - Current user's assignments 
 */
export interface AsapMyResponse {
  as_worker: Asap[];
  as_owner: Asap[];
  total_as_worker: number;
  total_as_owner: number;
}

/** 
 * GET /paps/{paps_id}/assignments response 
 */
export interface AsapListByPapsResponse {
  assignments: AsapDetail[];
  count: number;
}

/** 
 * POST /asap/{asap_id}/rate response 
 */
export interface AsapRateResponse {
  message: string;
  rated_user_id: UUID;
  score: number;
}

/** 
 * GET /asap/{asap_id}/can-rate response 
 */
export interface AsapCanRateResponse {
  can_rate: boolean;
  user_to_rate_id?: UUID;
  is_owner?: boolean;
  is_worker?: boolean;
  reason?: string;
}

/**
 * POST /asap/{asap_id}/confirm response
 */
export interface AsapConfirmResponse {
  status: 'completed' | 'pending_confirmation';
  message: string;
}

/** 
 * GET /asap/{asap_id}/media response 
 */
export interface AsapMediaListResponse {
  asap_id: UUID;
  media_count: number;
  media: MediaItem[];
}

// Legacy type aliases
export type AsapListParams = Record<string, never>;
export type AsapCreateRequest = never;  // Created via spap.accept
export type AsapUpdateRequest = AsapStatusUpdateRequest;
export type AsapListResponse = AsapMyResponse;
export type AsapCreateResponse = never;
