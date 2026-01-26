/**
 * PAPS (Job Postings) service endpoints.
 * Handles job posting CRUD, categories, and media operations.
 */

import { HttpMethod, UUID, PapsStatus, PaymentType } from './types';
import {
  Paps,
  PapsDetail,
  PapsListResponse,
  PapsListParams,
  PapsCreateRequest,
  PapsUpdateRequest,
  PapsCreateResponse,
  PapsMedia,
  PapsMediaListResponse,
  MediaUploadResponse,
} from './types';
import {
  isValidUUID,
  isValidLatitude,
  isValidLongitude,
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

export type PapsEndpoint =
  // PAPS CRUD
  | 'PAPS_LIST'
  | 'PAPS_GET'
  | 'PAPS_CREATE'
  | 'PAPS_UPDATE'
  | 'PAPS_DELETE'
  // PAPS Categories
  | 'PAPS_CATEGORY_ADD'
  | 'PAPS_CATEGORY_REMOVE'
  // PAPS Media
  | 'PAPS_MEDIA_LIST'
  | 'PAPS_MEDIA_UPLOAD'
  | 'PAPS_MEDIA_GET'
  | 'PAPS_MEDIA_DELETE';

// =============================================================================
// CONSTANTS
// =============================================================================

export const PAPS_CONSTRAINTS = {
  titleMinLength: 5,
  descriptionMinLength: 20,
  maxApplicantsMin: 1,
  maxApplicantsMax: 100,
  paymentTypes: ['fixed', 'hourly', 'negotiable'] as PaymentType[],
  statuses: ['draft', 'published', 'closed', 'cancelled'] as PapsStatus[],
} as const;

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const PAPS_DEFAULTS = {
  create: {
    payment_currency: 'USD',
    payment_type: 'fixed' as PaymentType,
    max_applicants: 10,
    max_assignees: 1,
    is_public: true,
    status: 'draft' as PapsStatus,
  },
  list: {
    // No defaults - all optional
  },
} as const;

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate PAPS creation request.
 */
export function validatePapsCreateRequest(data: PapsCreateRequest): void {
  // Title validation
  if (!data.title) {
    throw requiredFieldError('title');
  }
  if (data.title.length < PAPS_CONSTRAINTS.titleMinLength) {
    throw lengthError('Title', PAPS_CONSTRAINTS.titleMinLength);
  }

  // Description validation
  if (!data.description) {
    throw requiredFieldError('description');
  }
  if (data.description.length < PAPS_CONSTRAINTS.descriptionMinLength) {
    throw lengthError('Description', PAPS_CONSTRAINTS.descriptionMinLength);
  }

  // Payment validation
  if (data.payment_amount === undefined || data.payment_amount === null) {
    throw requiredFieldError('payment_amount');
  }
  if (data.payment_amount <= 0) {
    throw new ApiError(
      'Payment amount must be positive',
      HTTP_STATUS.BAD_REQUEST,
      'validation'
    );
  }

  if (data.payment_type && !PAPS_CONSTRAINTS.paymentTypes.includes(data.payment_type)) {
    throw invalidFormatError('payment type', PAPS_CONSTRAINTS.paymentTypes.join(', '));
  }

  // Max applicants validation
  if (data.max_applicants !== undefined) {
    if (data.max_applicants < PAPS_CONSTRAINTS.maxApplicantsMin || 
        data.max_applicants > PAPS_CONSTRAINTS.maxApplicantsMax) {
      throw rangeError('Max applicants', PAPS_CONSTRAINTS.maxApplicantsMin, PAPS_CONSTRAINTS.maxApplicantsMax);
    }
  }

  // Max assignees validation
  if (data.max_assignees !== undefined) {
    if (data.max_assignees < 1) {
      throw new ApiError(
        'Max assignees must be positive',
        HTTP_STATUS.BAD_REQUEST,
        'validation'
      );
    }
    const maxApplicants = data.max_applicants ?? PAPS_DEFAULTS.create.max_applicants;
    if (data.max_assignees > maxApplicants) {
      throw new ApiError(
        'Max assignees must not exceed max applicants',
        HTTP_STATUS.BAD_REQUEST,
        'validation'
      );
    }
  }

  // Status validation
  if (data.status && !PAPS_CONSTRAINTS.statuses.includes(data.status)) {
    throw invalidFormatError('status', PAPS_CONSTRAINTS.statuses.join(', '));
  }

  // Location validation - both lat/lng required together
  const hasLat = data.location_lat !== undefined;
  const hasLng = data.location_lng !== undefined;
  if (hasLat !== hasLng) {
    throw new ApiError(
      'Both lat and lng must be provided',
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

  // Datetime validation
  if (data.end_datetime && data.start_datetime) {
    const start = new Date(data.start_datetime);
    const end = new Date(data.end_datetime);
    if (end <= start) {
      throw new ApiError(
        'End datetime must be after start datetime',
        HTTP_STATUS.BAD_REQUEST,
        'validation'
      );
    }
  }

  // Duration validation
  if (data.estimated_duration_minutes !== undefined && data.estimated_duration_minutes <= 0) {
    throw new ApiError(
      'Duration must be positive',
      HTTP_STATUS.BAD_REQUEST,
      'validation'
    );
  }

  // Published status requires start_datetime
  if (data.status === 'published' && !data.start_datetime) {
    throw new ApiError(
      'start_datetime is required for published status',
      HTTP_STATUS.BAD_REQUEST,
      'validation'
    );
  }

  // Categories validation
  if (data.categories) {
    for (const cat of data.categories) {
      const catId = typeof cat === 'string' ? cat : cat.category_id;
      if (!isValidUUID(catId)) {
        throw invalidFormatError('category_id', 'UUID');
      }
    }
  }
}

/**
 * Validate PAPS update request.
 */
export function validatePapsUpdateRequest(data: PapsUpdateRequest): void {
  if (data.title !== undefined && data.title.length < PAPS_CONSTRAINTS.titleMinLength) {
    throw lengthError('Title', PAPS_CONSTRAINTS.titleMinLength);
  }

  if (data.description !== undefined && data.description.length < PAPS_CONSTRAINTS.descriptionMinLength) {
    throw lengthError('Description', PAPS_CONSTRAINTS.descriptionMinLength);
  }

  if (data.payment_amount !== undefined && data.payment_amount <= 0) {
    throw new ApiError(
      'Payment amount must be positive',
      HTTP_STATUS.BAD_REQUEST,
      'validation'
    );
  }

  if (data.payment_type && !PAPS_CONSTRAINTS.paymentTypes.includes(data.payment_type)) {
    throw invalidFormatError('payment type', PAPS_CONSTRAINTS.paymentTypes.join(', '));
  }

  if (data.max_applicants !== undefined) {
    if (data.max_applicants < PAPS_CONSTRAINTS.maxApplicantsMin || 
        data.max_applicants > PAPS_CONSTRAINTS.maxApplicantsMax) {
      throw rangeError('Max applicants', PAPS_CONSTRAINTS.maxApplicantsMin, PAPS_CONSTRAINTS.maxApplicantsMax);
    }
  }

  if (data.status && !PAPS_CONSTRAINTS.statuses.includes(data.status)) {
    throw invalidFormatError('status', PAPS_CONSTRAINTS.statuses.join(', '));
  }

  const hasLat = data.location_lat !== undefined;
  const hasLng = data.location_lng !== undefined;
  if (hasLat !== hasLng) {
    throw new ApiError(
      'Both lat and lng must be provided',
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
}

/**
 * Validate PAPS list query parameters.
 */
export function validatePapsListParams(params: PapsListParams): void {
  if (params.category_id && !isValidUUID(params.category_id)) {
    throw invalidFormatError('category_id', 'UUID');
  }

  if (params.payment_type && !PAPS_CONSTRAINTS.paymentTypes.includes(params.payment_type)) {
    throw invalidFormatError('payment_type', PAPS_CONSTRAINTS.paymentTypes.join(', '));
  }

  if (params.status && !PAPS_CONSTRAINTS.statuses.includes(params.status)) {
    throw invalidFormatError('status', PAPS_CONSTRAINTS.statuses.join(', '));
  }

  // Location search validation
  const hasLat = params.lat !== undefined;
  const hasLng = params.lng !== undefined;
  if (hasLat !== hasLng) {
    throw new ApiError(
      'Both lat and lng required for location search',
      HTTP_STATUS.BAD_REQUEST,
      'validation'
    );
  }

  if (hasLat && !isValidLatitude(params.lat!)) {
    throw invalidFormatError('latitude', '-90 to 90');
  }

  if (hasLng && !isValidLongitude(params.lng!)) {
    throw invalidFormatError('longitude', '-180 to 180');
  }

  if (params.max_distance !== undefined && params.max_distance <= 0) {
    throw new ApiError(
      'max_distance must be positive',
      HTTP_STATUS.BAD_REQUEST,
      'validation'
    );
  }

  if (params.min_price !== undefined && params.min_price < 0) {
    throw new ApiError(
      'min_price cannot be negative',
      HTTP_STATUS.BAD_REQUEST,
      'validation'
    );
  }

  if (params.max_price !== undefined && params.max_price < 0) {
    throw new ApiError(
      'max_price cannot be negative',
      HTTP_STATUS.BAD_REQUEST,
      'validation'
    );
  }
}

/**
 * Validate PAPS ID path parameter.
 */
export function validatePapsIdParam(papsId: string): void {
  if (!isValidUUID(papsId)) {
    throw invalidFormatError('PAP ID', 'UUID');
  }
}

/**
 * Validate media ID path parameter.
 */
export function validateMediaIdParam(mediaId: string): void {
  if (!isValidUUID(mediaId)) {
    throw invalidFormatError('media ID', 'UUID');
  }
}

/**
 * Validate category ID path parameter.
 */
export function validateCategoryIdParam(categoryId: string): void {
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
  validateParams?: (params: TParams) => void;
  validatePathParams?: (params: Record<string, string>) => void;
  defaultBody?: Partial<TBody>;
  defaultParams?: Partial<TParams>;
  isFileUpload?: boolean;
  fileFieldName?: string;
  multipleFiles?: boolean;
}

export const papsEndpoints: Record<PapsEndpoint, EndpointConfig> = {
  // PAPS CRUD
  PAPS_LIST: {
    method: 'GET',
    path: '/paps',
    requiresAuth: true,
    validateParams: validatePapsListParams as (params: unknown) => void,
  },

  PAPS_GET: {
    method: 'GET',
    path: '/paps/:paps_id',
    requiresAuth: true,
    validatePathParams: (params) => validatePapsIdParam(params.paps_id),
  },

  PAPS_CREATE: {
    method: 'POST',
    path: '/paps',
    requiresAuth: true,
    validate: validatePapsCreateRequest as (body: unknown) => void,
    defaultBody: PAPS_DEFAULTS.create,
  },

  PAPS_UPDATE: {
    method: 'PUT',
    path: '/paps/:paps_id',
    requiresAuth: true,
    validate: validatePapsUpdateRequest as (body: unknown) => void,
    validatePathParams: (params) => validatePapsIdParam(params.paps_id),
  },

  PAPS_DELETE: {
    method: 'DELETE',
    path: '/paps/:paps_id',
    requiresAuth: true,
    validatePathParams: (params) => validatePapsIdParam(params.paps_id),
  },

  // PAPS Categories
  PAPS_CATEGORY_ADD: {
    method: 'POST',
    path: '/paps/:paps_id/categories/:category_id',
    requiresAuth: true,
    validatePathParams: (params) => {
      validatePapsIdParam(params.paps_id);
      validateCategoryIdParam(params.category_id);
    },
  },

  PAPS_CATEGORY_REMOVE: {
    method: 'DELETE',
    path: '/paps/:paps_id/categories/:category_id',
    requiresAuth: true,
    validatePathParams: (params) => {
      validatePapsIdParam(params.paps_id);
      validateCategoryIdParam(params.category_id);
    },
  },

  // PAPS Media
  PAPS_MEDIA_LIST: {
    method: 'GET',
    path: '/paps/:paps_id/media',
    requiresAuth: true,
    validatePathParams: (params) => validatePapsIdParam(params.paps_id),
  },

  PAPS_MEDIA_UPLOAD: {
    method: 'POST',
    path: '/paps/:paps_id/media',
    requiresAuth: true,
    isFileUpload: true,
    fileFieldName: 'media',
    multipleFiles: true,
    validatePathParams: (params) => validatePapsIdParam(params.paps_id),
  },

  PAPS_MEDIA_GET: {
    method: 'GET',
    path: '/paps/media/:media_id',
    requiresAuth: true,
    validatePathParams: (params) => validateMediaIdParam(params.media_id),
  },

  PAPS_MEDIA_DELETE: {
    method: 'DELETE',
    path: '/paps/media/:media_id',
    requiresAuth: true,
    validatePathParams: (params) => validateMediaIdParam(params.media_id),
  },
};

// =============================================================================
// TYPE MAPPINGS FOR ENDPOINTS
// =============================================================================

export interface PapsEndpointTypes {
  PAPS_LIST: {
    params: PapsListParams;
    body: never;
    response: PapsListResponse;
  };
  PAPS_GET: {
    params: never;
    body: never;
    pathParams: { paps_id: UUID };
    response: PapsDetail;
  };
  PAPS_CREATE: {
    params: never;
    body: PapsCreateRequest;
    response: PapsCreateResponse;
  };
  PAPS_UPDATE: {
    params: never;
    body: PapsUpdateRequest;
    pathParams: { paps_id: UUID };
    response: void;
  };
  PAPS_DELETE: {
    params: never;
    body: never;
    pathParams: { paps_id: UUID };
    response: void;
  };
  PAPS_CATEGORY_ADD: {
    params: never;
    body: never;
    pathParams: { paps_id: UUID; category_id: UUID };
    response: { message: string };
  };
  PAPS_CATEGORY_REMOVE: {
    params: never;
    body: never;
    pathParams: { paps_id: UUID; category_id: UUID };
    response: void;
  };
  PAPS_MEDIA_LIST: {
    params: never;
    body: never;
    pathParams: { paps_id: UUID };
    response: PapsMediaListResponse;
  };
  PAPS_MEDIA_UPLOAD: {
    params: never;
    body: never;
    pathParams: { paps_id: UUID };
    files: File[] | Blob[];
    response: MediaUploadResponse;
  };
  PAPS_MEDIA_GET: {
    params: never;
    body: never;
    pathParams: { media_id: UUID };
    response: Blob;
  };
  PAPS_MEDIA_DELETE: {
    params: never;
    body: never;
    pathParams: { media_id: UUID };
    response: void;
  };
}
