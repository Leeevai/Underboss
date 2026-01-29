/**
 * Ratings module - Endpoint definitions
 */

import type { HttpMethod } from '../common/types';
import { validateRatingCreate, validateRatingUpdate } from './validators';

export interface EndpointConfig {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
}

export const ratingEndpoints: Record<string, EndpointConfig> = {
  // User ratings
  'ratings.forUser': {
    method: 'GET',
    path: '/ratings/{user_id}',
    auth: false,
  },

  // Rating CRUD
  'ratings.create': {
    method: 'POST',
    path: '/ratings',
    auth: true,
    validate: validateRatingCreate,
  },
  'ratings.get': {
    method: 'GET',
    path: '/ratings/{rating_id}',
    auth: false,
  },
  'ratings.update': {
    method: 'PATCH',
    path: '/ratings/{rating_id}',
    auth: true,
    validate: validateRatingUpdate,
  },
  'ratings.delete': {
    method: 'DELETE',
    path: '/ratings/{rating_id}',
    auth: true,
  },
};
