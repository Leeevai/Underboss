/**
 * Ratings module - Types for the rating system
 */

import type { UUID, ISODateTime, RatingValue } from '../common/types';

// =============================================================================
// RATING ENTITY
// =============================================================================

/** Rating - List item */
export interface Rating {
  rating_id: UUID;
  paps_id: UUID;
  paps_title: string;
  rater_id: UUID;
  rater_username: string;
  rater_avatar?: string | null;
  rated_user_id: UUID;
  rated_username?: string;
  rating: RatingValue;
  review: string | null;
  created_at: ISODateTime;
}

/** User ratings summary */
export interface UserRatings {
  user_id: UUID;
  username: string;
  average_rating: number;
  total_ratings: number;
  ratings: Rating[];
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** POST /ratings */
export interface RatingCreateRequest {
  paps_id: UUID;
  rated_user_id: UUID;
  rating: RatingValue;
  review?: string;
}

/** PATCH /ratings/{id} */
export interface RatingUpdateRequest {
  rating?: RatingValue;
  review?: string;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** POST /ratings response */
export interface RatingCreateResponse {
  rating_id: UUID;
}
