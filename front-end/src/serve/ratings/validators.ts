/**
 * Ratings module - Request validators
 */

import type { RatingCreateRequest, RatingUpdateRequest } from './types';

/**
 * Validate rating create request
 */
export function validateRatingCreate(data: RatingCreateRequest): void {
  if (!data.paps_id || typeof data.paps_id !== 'string') {
    throw new Error('PAPS ID is required');
  }

  if (!data.rated_user_id || typeof data.rated_user_id !== 'string') {
    throw new Error('Rated user ID is required');
  }

  if (data.rating === undefined || typeof data.rating !== 'number') {
    throw new Error('Rating is required');
  }
  if (data.rating < 1 || data.rating > 5 || !Number.isInteger(data.rating)) {
    throw new Error('Rating must be an integer between 1 and 5');
  }

  if (data.review && data.review.length > 1000) {
    throw new Error('Review must be max 1000 characters');
  }
}

/**
 * Validate rating update request
 */
export function validateRatingUpdate(data: RatingUpdateRequest): void {
  if (data.rating !== undefined) {
    if (data.rating < 1 || data.rating > 5 || !Number.isInteger(data.rating)) {
      throw new Error('Rating must be an integer between 1 and 5');
    }
  }

  if (data.review && data.review.length > 1000) {
    throw new Error('Review must be max 1000 characters');
  }
}
