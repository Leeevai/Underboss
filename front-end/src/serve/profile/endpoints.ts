/**
 * Profile module - Endpoint definitions
 */

import type { HttpMethod } from '../common/types';
import { 
  validateProfileUpdate, 
  validateExperienceCreate,
  validateExperienceUpdate,
  validateInterestCreate 
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
  // Profile
  'profile.get': {
    method: 'GET',
    path: '/profile',
    auth: true,
  },
  'profile.update': {
    method: 'PUT',
    path: '/profile',
    auth: true,
    validate: validateProfileUpdate,
  },
  'profile.patch': {
    method: 'PATCH',
    path: '/profile',
    auth: true,
    validate: validateProfileUpdate,
  },
  'profile.getByUsername': {
    method: 'GET',
    path: '/user/{username}/profile',
    auth: false,
  },

  // Avatar
  'avatar.upload': {
    method: 'POST',
    path: '/profile/avatar',
    auth: true,
    isFileUpload: true,
    fileField: 'image',
  },
  'avatar.get': {
    method: 'GET',
    path: '/profile/avatar',
    auth: true,
  },
  'avatar.delete': {
    method: 'DELETE',
    path: '/profile/avatar',
    auth: true,
  },
  'avatar.getByUsername': {
    method: 'GET',
    path: '/user/{username}/profile/avatar',
    auth: false,
  },

  // Experiences
  'experiences.list': {
    method: 'GET',
    path: '/profile/experiences',
    auth: true,
  },
  'experiences.create': {
    method: 'POST',
    path: '/profile/experiences',
    auth: true,
    validate: validateExperienceCreate,
  },
  'experiences.update': {
    method: 'PUT',
    path: '/profile/experiences/{experience_id}',
    auth: true,
    validate: validateExperienceUpdate,
  },
  'experiences.delete': {
    method: 'DELETE',
    path: '/profile/experiences/{experience_id}',
    auth: true,
  },
  'experiences.listByUsername': {
    method: 'GET',
    path: '/user/{username}/profile/experiences',
    auth: false,
  },

  // Interests
  'interests.list': {
    method: 'GET',
    path: '/profile/interests',
    auth: true,
  },
  'interests.create': {
    method: 'POST',
    path: '/profile/interests',
    auth: true,
    validate: validateInterestCreate,
  },
  'interests.delete': {
    method: 'DELETE',
    path: '/profile/interests/{interest_id}',
    auth: true,
  },
  'interests.listByUsername': {
    method: 'GET',
    path: '/user/{username}/profile/interests',
    auth: false,
  },
};
