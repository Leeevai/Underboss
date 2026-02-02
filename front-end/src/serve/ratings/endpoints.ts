/**
 * Ratings module - Endpoint definitions
 * 
 * NOTE: Ratings are created through ASAP completion, not a direct /ratings endpoint.
 * Individual ratings are NOT stored - only the moving average is updated on user profiles.
 * 
 * Key endpoints:
 * - GET /users/{user_id}/rating - Get any user's rating
 * - GET /profile/rating - Get current user's rating (via profile module)
 * - POST /asap/{asap_id}/rate - Submit a rating after ASAP completion (via asap module)
 * - GET /asap/{asap_id}/can-rate - Check if current user can rate (via asap module)
 * 
 * @module serve/ratings/endpoints
 */

import type { HttpMethod } from '../common/types';
import { validateRatingCreate } from './validators';

export interface EndpointConfig {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
}

export const ratingEndpoints: Record<string, EndpointConfig> = {
  /**
   * Get user's rating
   * 
   * Path params: user_id
   * Response: UserRating { user_id, rating_average, rating_count }
   */
  'ratings.forUser': {
    method: 'GET',
    path: '/users/{user_id}/rating',
    auth: false,
  },

  /**
   * Get current user's rating (convenience, same as profile.rating)
   * Requires authentication
   * 
   * Response: UserRating { rating_average, rating_count }
   */
  'ratings.my': {
    method: 'GET',
    path: '/profile/rating',
    auth: true,
  },

  // ==========================================================================
  // Rating actions via ASAP module (included here for reference)
  // Use asap module endpoints for these:
  // - asap.rate: POST /asap/{asap_id}/rate - Submit rating after completion
  // - asap.canRate: GET /asap/{asap_id}/can-rate - Check if can rate
  // ==========================================================================

  /**
   * @deprecated Use asap.rate instead
   * Included for backwards compatibility reference
   */
  'ratings.create': {
    method: 'POST',
    path: '/asap/{asap_id}/rate',
    auth: true,
    validate: validateRatingCreate,
  },
};
