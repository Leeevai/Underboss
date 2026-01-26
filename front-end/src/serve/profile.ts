/**
 * Profile service endpoints.
 * Handles user profiles, avatars, experiences, and interests.
 */

import { HttpMethod, UUID, ProficiencyLevel } from './types';
import {
  UserProfile,
  ProfileUpdateRequest,
  AvatarUploadResponse,
  Experience,
  ExperienceCreateRequest,
  ExperienceUpdateRequest,
  ExperienceCreateResponse,
  Interest,
  InterestCreateRequest,
  InterestUpdateRequest,
} from './types';
import {
  isValidUUID,
  isValidLatitude,
  isValidLongitude,
  isValidProficiencyLevel,
  requiredFieldError,
  invalidFormatError,
  lengthError,
  rangeError,
  ApiError,
  HTTP_STATUS,
} from './errors';

// =============================================================================
// ENDPOINT KEYS
// =============================================================================

export type ProfileEndpoint =
  // Profile
  | 'PROFILE_GET'
  | 'PROFILE_UPDATE'
  | 'PROFILE_GET_BY_USERNAME'
  | 'PROFILE_UPDATE_BY_USERNAME'
  // Avatar
  | 'AVATAR_UPLOAD'
  | 'AVATAR_GET'
  | 'AVATAR_DELETE'
  | 'AVATAR_GET_BY_USERNAME'
  // Experiences
  | 'EXPERIENCES_LIST'
  | 'EXPERIENCES_CREATE'
  | 'EXPERIENCES_UPDATE'
  | 'EXPERIENCES_DELETE'
  | 'EXPERIENCES_LIST_BY_USERNAME'
  // Interests
  | 'INTERESTS_LIST'
  | 'INTERESTS_CREATE'
  | 'INTERESTS_UPDATE'
  | 'INTERESTS_DELETE'
  | 'INTERESTS_LIST_BY_USERNAME';

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const PROFILE_DEFAULTS = {
  profileUpdate: {
    // All fields optional
  },
  experienceCreate: {
    is_current: false,
  },
  interestCreate: {
    proficiency_level: 1 as ProficiencyLevel,
  },
} as const;

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate profile update request.
 */
export function validateProfileUpdateRequest(data: ProfileUpdateRequest): void {
  // Coordinates validation - both must be provided together
  const hasLat = data.location_lat !== undefined;
  const hasLng = data.location_lng !== undefined;
  
  if (hasLat !== hasLng) {
    throw new ApiError(
      'Both lat and lng required',
      HTTP_STATUS.BAD_REQUEST,
      'validation'
    );
  }

  if (hasLat && !isValidLatitude(data.location_lat!)) {
    throw invalidFormatError('latitude', '-90 to 90');
  }

  if (hasLng && !isValidLongitude(data.location_lng!)) {
    throw invalidFormatError('longitude', '-180 to 180');
  }

  // Date validation
  if (data.date_of_birth) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date_of_birth)) {
      throw invalidFormatError('date_of_birth', 'ISO date (YYYY-MM-DD)');
    }
  }
}

/**
 * Validate experience creation request.
 */
export function validateExperienceCreateRequest(data: ExperienceCreateRequest): void {
  if (!data.title) {
    throw requiredFieldError('title');
  }
  if (data.title.length < 2) {
    throw lengthError('Title', 2);
  }

  if (!data.start_date) {
    throw requiredFieldError('start_date');
  }

  // If end_date is provided, it must be after start_date
  if (data.end_date && data.start_date) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    if (end <= start) {
      throw new ApiError(
        'End date must be after start date',
        HTTP_STATUS.BAD_REQUEST,
        'validation'
      );
    }
  }

  // Current experiences cannot have end date
  if (data.is_current && data.end_date) {
    throw new ApiError(
      'Current experiences cannot have end date',
      HTTP_STATUS.BAD_REQUEST,
      'validation'
    );
  }
}

/**
 * Validate experience update request.
 */
export function validateExperienceUpdateRequest(data: ExperienceUpdateRequest): void {
  if (data.title !== undefined && data.title.length < 2) {
    throw lengthError('Title', 2);
  }

  // If both dates provided, validate order
  if (data.end_date && data.start_date) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    if (end <= start) {
      throw new ApiError(
        'End date must be after start date',
        HTTP_STATUS.BAD_REQUEST,
        'validation'
      );
    }
  }

  if (data.is_current && data.end_date) {
    throw new ApiError(
      'Current experiences cannot have end date',
      HTTP_STATUS.BAD_REQUEST,
      'validation'
    );
  }
}

/**
 * Validate interest creation request.
 */
export function validateInterestCreateRequest(data: InterestCreateRequest): void {
  if (!data.category_id) {
    throw requiredFieldError('category_id');
  }
  if (!isValidUUID(data.category_id)) {
    throw invalidFormatError('category_id', 'UUID');
  }
  if (data.proficiency_level !== undefined && !isValidProficiencyLevel(data.proficiency_level)) {
    throw rangeError('Proficiency level', 1, 5);
  }
}

/**
 * Validate interest update request.
 */
export function validateInterestUpdateRequest(data: InterestUpdateRequest): void {
  if (!isValidProficiencyLevel(data.proficiency_level)) {
    throw rangeError('Proficiency level', 1, 5);
  }
}

/**
 * Validate path parameter for experience/interest operations.
 */
export function validateExperienceId(expId: string): void {
  if (!isValidUUID(expId)) {
    throw invalidFormatError('experience ID', 'UUID');
  }
}

export function validateCategoryId(categoryId: string): void {
  if (!isValidUUID(categoryId)) {
    throw invalidFormatError('category_id', 'UUID');
  }
}

// =============================================================================
// ENDPOINT CONFIGURATIONS
// =============================================================================

export interface EndpointConfig<TParams = unknown, TBody = unknown, TResponse = unknown> {
  method: HttpMethod;
  path: string;
  requiresAuth: boolean;
  validate?: (body: TBody) => void;
  validatePathParams?: (params: Record<string, string>) => void;
  defaultBody?: Partial<TBody>;
  defaultParams?: Partial<TParams>;
  isFileUpload?: boolean;
  fileFieldName?: string;
}

export const profileEndpoints: Record<ProfileEndpoint, EndpointConfig> = {
  // Profile endpoints
  PROFILE_GET: {
    method: 'GET',
    path: '/profile',
    requiresAuth: true,
  },

  PROFILE_UPDATE: {
    method: 'PUT',
    path: '/profile',
    requiresAuth: true,
    validate: validateProfileUpdateRequest as (body: unknown) => void,
  },

  PROFILE_GET_BY_USERNAME: {
    method: 'GET',
    path: '/user/:username/profile',
    requiresAuth: true,
  },

  PROFILE_UPDATE_BY_USERNAME: {
    method: 'PATCH',
    path: '/user/:username/profile',
    requiresAuth: true,
    validate: validateProfileUpdateRequest as (body: unknown) => void,
  },

  // Avatar endpoints
  AVATAR_UPLOAD: {
    method: 'POST',
    path: '/profile/avatar',
    requiresAuth: true,
    isFileUpload: true,
    fileFieldName: 'image',
  },

  AVATAR_GET: {
    method: 'GET',
    path: '/profile/avatar',
    requiresAuth: true,
  },

  AVATAR_DELETE: {
    method: 'DELETE',
    path: '/profile/avatar',
    requiresAuth: true,
  },

  AVATAR_GET_BY_USERNAME: {
    method: 'GET',
    path: '/user/:username/profile/avatar',
    requiresAuth: true,
  },

  // Experience endpoints
  EXPERIENCES_LIST: {
    method: 'GET',
    path: '/profile/experiences',
    requiresAuth: true,
  },

  EXPERIENCES_CREATE: {
    method: 'POST',
    path: '/profile/experiences',
    requiresAuth: true,
    validate: validateExperienceCreateRequest as (body: unknown) => void,
    defaultBody: PROFILE_DEFAULTS.experienceCreate,
  },

  EXPERIENCES_UPDATE: {
    method: 'PATCH',
    path: '/profile/experiences/:exp_id',
    requiresAuth: true,
    validate: validateExperienceUpdateRequest as (body: unknown) => void,
    validatePathParams: (params) => validateExperienceId(params.exp_id),
  },

  EXPERIENCES_DELETE: {
    method: 'DELETE',
    path: '/profile/experiences/:exp_id',
    requiresAuth: true,
    validatePathParams: (params) => validateExperienceId(params.exp_id),
  },

  EXPERIENCES_LIST_BY_USERNAME: {
    method: 'GET',
    path: '/user/:username/profile/experiences',
    requiresAuth: true,
  },

  // Interest endpoints
  INTERESTS_LIST: {
    method: 'GET',
    path: '/profile/interests',
    requiresAuth: true,
  },

  INTERESTS_CREATE: {
    method: 'POST',
    path: '/profile/interests',
    requiresAuth: true,
    validate: validateInterestCreateRequest as (body: unknown) => void,
    defaultBody: PROFILE_DEFAULTS.interestCreate,
  },

  INTERESTS_UPDATE: {
    method: 'PATCH',
    path: '/profile/interests/:category_id',
    requiresAuth: true,
    validate: validateInterestUpdateRequest as (body: unknown) => void,
    validatePathParams: (params) => validateCategoryId(params.category_id),
  },

  INTERESTS_DELETE: {
    method: 'DELETE',
    path: '/profile/interests/:category_id',
    requiresAuth: true,
    validatePathParams: (params) => validateCategoryId(params.category_id),
  },

  INTERESTS_LIST_BY_USERNAME: {
    method: 'GET',
    path: '/user/:username/profile/interests',
    requiresAuth: true,
  },
};

// =============================================================================
// TYPE MAPPINGS FOR ENDPOINTS
// =============================================================================

export interface ProfileEndpointTypes {
  PROFILE_GET: {
    params: never;
    body: never;
    response: UserProfile;
  };
  PROFILE_UPDATE: {
    params: never;
    body: ProfileUpdateRequest;
    response: void;
  };
  PROFILE_GET_BY_USERNAME: {
    params: never;
    body: never;
    pathParams: { username: string };
    response: UserProfile;
  };
  PROFILE_UPDATE_BY_USERNAME: {
    params: never;
    body: ProfileUpdateRequest;
    pathParams: { username: string };
    response: void;
  };
  AVATAR_UPLOAD: {
    params: never;
    body: never;
    file: File | Blob;
    response: AvatarUploadResponse;
  };
  AVATAR_GET: {
    params: never;
    body: never;
    response: Blob;
  };
  AVATAR_DELETE: {
    params: never;
    body: never;
    response: void;
  };
  AVATAR_GET_BY_USERNAME: {
    params: never;
    body: never;
    pathParams: { username: string };
    response: Blob;
  };
  EXPERIENCES_LIST: {
    params: never;
    body: never;
    response: Experience[];
  };
  EXPERIENCES_CREATE: {
    params: never;
    body: ExperienceCreateRequest;
    response: ExperienceCreateResponse;
  };
  EXPERIENCES_UPDATE: {
    params: never;
    body: ExperienceUpdateRequest;
    pathParams: { exp_id: UUID };
    response: void;
  };
  EXPERIENCES_DELETE: {
    params: never;
    body: never;
    pathParams: { exp_id: UUID };
    response: void;
  };
  EXPERIENCES_LIST_BY_USERNAME: {
    params: never;
    body: never;
    pathParams: { username: string };
    response: Experience[];
  };
  INTERESTS_LIST: {
    params: never;
    body: never;
    response: Interest[];
  };
  INTERESTS_CREATE: {
    params: never;
    body: InterestCreateRequest;
    response: void;
  };
  INTERESTS_UPDATE: {
    params: never;
    body: InterestUpdateRequest;
    pathParams: { category_id: UUID };
    response: void;
  };
  INTERESTS_DELETE: {
    params: never;
    body: never;
    pathParams: { category_id: UUID };
    response: void;
  };
  INTERESTS_LIST_BY_USERNAME: {
    params: never;
    body: never;
    pathParams: { username: string };
    response: Interest[];
  };
}
