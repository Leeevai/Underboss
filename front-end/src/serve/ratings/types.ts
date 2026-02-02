/**
 * Ratings module - Types for the rating system
 * 
 * The rating system works via ASAP (completed assignments).
 * Individual ratings are NOT stored - only the moving average is updated.
 * 
 * @module serve/ratings/types
 */

import type { UUID, RatingValue } from '../common/types';

// =============================================================================
// RATING RESPONSE
// =============================================================================

/** 
 * GET /users/{user_id}/rating response
 * GET /profile/rating response
 */
export interface UserRating {
  user_id?: UUID;
  rating_average: number;
  rating_count: number;
}

// =============================================================================
// REQUEST TYPES (via ASAP)
// =============================================================================

/** 
 * POST /asap/{asap_id}/rate request
 * 
 * Validation:
 * - ASAP must be completed
 * - Must be either the PAPS owner or the worker
 * - Owner rates worker, worker rates owner (bidirectional)
 */
export interface RatingCreateRequest {
  /** Rating score 1-5 (required) */
  score: RatingValue;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** POST /asap/{asap_id}/rate response */
export interface RatingCreateResponse {
  message: string;
  rated_user_id: UUID;
  score: number;
}

// Legacy type aliases
export type Rating = UserRating;
export type UserRatings = UserRating;
export type RatingUpdateRequest = never;  // Ratings cannot be updated
