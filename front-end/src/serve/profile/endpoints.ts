/**
 * Profile module - Endpoint definitions
 * 
 * @module serve/profile/endpoints
 */

import type { HttpMethod } from '../common/types';
import { 
  validateProfileUpdate, 
  validateExperienceCreate,
  validateExperienceUpdate,
  validateInterestCreate,
  validateInterestUpdate 
} from './validators';

export interface EndpointConfig {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
  isFileUpload?: boolean;
  fileField?: string;
}

export const profileEndpoints: Record<string, EndpointConfig> = {
  // ==========================================================================
  // PROFILE
  // ==========================================================================
  
  /** GET /profile - Get current user's profile */
  'profile.get': {
    method: 'GET',
    path: '/profile',
    auth: true,
  },
  
  /** PUT /profile - Update current user's profile (replace all) */
  'profile.update': {
    method: 'PUT',
    path: '/profile',
    auth: true,
    validate: validateProfileUpdate,
  },
  
  /** PATCH /profile - Partially update current user's profile */
  'profile.patch': {
    method: 'PATCH',
    path: '/profile',
    auth: true,
    validate: validateProfileUpdate,
  },
  
  /** GET /user/{username}/profile - Get another user's public profile */
  'profile.getByUsername': {
    method: 'GET',
    path: '/user/{username}/profile',
    auth: false,  // OPEN
  },
  
  /** PATCH /user/{username}/profile - Update user's profile (must be that user) */
  'profile.updateByUsername': {
    method: 'PATCH',
    path: '/user/{username}/profile',
    auth: true,
    validate: validateProfileUpdate,
  },
  
  /** GET /profile/rating - Get current user's rating */
  'profile.rating': {
    method: 'GET',
    path: '/profile/rating',
    auth: true,
  },

  // ==========================================================================
  // AVATAR
  // ==========================================================================
  
  /** POST /profile/avatar - Upload profile avatar (max 5MB, PNG/JPEG/GIF/WEBP) */
  'avatar.upload': {
    method: 'POST',
    path: '/profile/avatar',
    auth: true,
    isFileUpload: true,
    fileField: 'image',
  },
  
  /** DELETE /profile/avatar - Delete current user's avatar */
  'avatar.delete': {
    method: 'DELETE',
    path: '/profile/avatar',
    auth: true,
  },

  // ==========================================================================
  // EXPERIENCES
  // ==========================================================================
  
  /** GET /profile/experiences - Get current user's experiences */
  'experiences.list': {
    method: 'GET',
    path: '/profile/experiences',
    auth: true,
  },
  
  /** POST /profile/experiences - Add new experience */
  'experiences.create': {
    method: 'POST',
    path: '/profile/experiences',
    auth: true,
    validate: validateExperienceCreate,
  },
  
  /** PATCH /profile/experiences/{exp_id} - Update experience */
  'experiences.update': {
    method: 'PATCH',
    path: '/profile/experiences/{experience_id}',
    auth: true,
    validate: validateExperienceUpdate,
  },
  
  /** DELETE /profile/experiences/{exp_id} - Delete experience */
  'experiences.delete': {
    method: 'DELETE',
    path: '/profile/experiences/{experience_id}',
    auth: true,
  },
  
  /** GET /user/{username}/profile/experiences - Get user's experiences */
  'experiences.listByUsername': {
    method: 'GET',
    path: '/user/{username}/profile/experiences',
    auth: false,  // OPEN
  },

  // ==========================================================================
  // INTERESTS
  // ==========================================================================
  
  /** GET /profile/interests - Get current user's interests */
  'interests.list': {
    method: 'GET',
    path: '/profile/interests',
    auth: true,
  },
  
  /** POST /profile/interests - Add interest */
  'interests.create': {
    method: 'POST',
    path: '/profile/interests',
    auth: true,
    validate: validateInterestCreate,
  },
  
  /** PATCH /profile/interests/{category_id} - Update interest proficiency */
  'interests.update': {
    method: 'PATCH',
    path: '/profile/interests/{category_id}',
    auth: true,
    validate: validateInterestUpdate,
  },
  
  /** DELETE /profile/interests/{category_id} - Remove interest */
  'interests.delete': {
    method: 'DELETE',
    path: '/profile/interests/{category_id}',
    auth: true,
  },
  
  /** GET /user/{username}/profile/interests - Get user's interests */
  'interests.listByUsername': {
    method: 'GET',
    path: '/user/{username}/profile/interests',
    auth: false,  // OPEN
  },
};
