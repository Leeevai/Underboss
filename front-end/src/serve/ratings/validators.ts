/**
 * Ratings module - Request validators
 * 
 * The rating system works via ASAP completion - users rate each other
 * after an ASAP is completed. Individual ratings are not stored.
 * 
 * @module serve/ratings/validators
 */

import type { RatingCreateRequest } from './types';

/** Valid rating scores (1-5 scale) */
export const VALID_RATING_SCORES = [1, 2, 3, 4, 5] as const;

/**
 * Validate rating create request
 * 
 * POST /asap/{asap_id}/rate
 * Request body: { score: number }
 * 
 * Validation rules:
 * - score is required
 * - score must be integer 1-5
 */
export function validateRatingCreate(data: RatingCreateRequest): void {
  // Score is required
  if (data.score === undefined || data.score === null) {
    throw new Error('Score is required');
  }

  // Score must be a number
  if (typeof data.score !== 'number') {
    throw new Error('Score must be a number');
  }

  // Score must be integer 1-5
  if (!Number.isInteger(data.score) || data.score < 1 || data.score > 5) {
    throw new Error('Score must be an integer between 1 and 5');
  }
}

/**
 * Validate rating score value
 * Utility function for inline validation
 */
export function isValidRatingScore(score: unknown): score is 1 | 2 | 3 | 4 | 5 {
  return (
    typeof score === 'number' &&
    Number.isInteger(score) &&
    score >= 1 &&
    score <= 5
  );
