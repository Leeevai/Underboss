/**
 * SPAP (Applications) service endpoints.
 * Handles job applications CRUD and media operations.
 */

import { HttpMethod, UUID, SpapStatus } from './types';
import {
  Spap,
  SpapWithPaps,
  SpapListResponse,
  MyApplicationsResponse,
  SpapCreateRequest,
  SpapCreateResponse,
  SpapStatusUpdateRequest,
  SpapMedia,
  SpapMediaListResponse,
  MediaUploadResponse,
} from './types';
import {
  isValidUUID,
  invalidFormatError,
  ApiError,
  HTTP_STATUS,
} from './errors';

// =============================================================================
// ENDPOINT KEYS
// =============================================================================

export type SpapEndpoint =
  // SPAP CRUD
  | 'SPAP_LIST_FOR_PAPS'
  | 'SPAP_MY_APPLICATIONS'
  | 'SPAP_APPLY'
  | 'SPAP_GET'
  | 'SPAP_WITHDRAW'
  | 'SPAP_UPDATE_STATUS'
  // SPAP Media
  | 'SPAP_MEDIA_LIST'
  | 'SPAP_MEDIA_UPLOAD'
  | 'SPAP_MEDIA_GET'
  | 'SPAP_MEDIA_DELETE';

// =============================================================================
// CONSTANTS
// =============================================================================

export const SPAP_CONSTRAINTS = {
  statuses: ['pending', 'accepted', 'rejected', 'withdrawn'] as SpapStatus[],
} as const;

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const SPAP_DEFAULTS = {
  apply: {
    message: undefined,
  },
} as const;

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate SPAP status update request.
 */
export function validateSpapStatusUpdateRequest(data: SpapStatusUpdateRequest): void {
  if (!data.status) {
    throw new ApiError(
      'Status is required',
      HTTP_STATUS.BAD_REQUEST,
      'validation'
    );
  }

  if (!SPAP_CONSTRAINTS.statuses.includes(data.status)) {
    throw new ApiError(
      `Invalid status. Must be: ${SPAP_CONSTRAINTS.statuses.join(', ')}`,
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
    throw invalidFormatError('PAPS ID', 'UUID');
  }
}

/**
 * Validate SPAP ID path parameter.
 */
export function validateSpapIdParam(spapId: string): void {
  if (!isValidUUID(spapId)) {
    throw invalidFormatError('SPAP ID', 'UUID');
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
  isFileUpload?: boolean;
  fileFieldName?: string;
  multipleFiles?: boolean;
}

export const spapEndpoints: Record<SpapEndpoint, EndpointConfig> = {
  // SPAP CRUD
  SPAP_LIST_FOR_PAPS: {
    method: 'GET',
    path: '/paps/:paps_id/applications',
    requiresAuth: true,
    validatePathParams: (params) => validatePapsIdParam(params.paps_id),
  },

  SPAP_MY_APPLICATIONS: {
    method: 'GET',
    path: '/spap/my',
    requiresAuth: true,
  },

  SPAP_APPLY: {
    method: 'POST',
    path: '/paps/:paps_id/apply',
    requiresAuth: true,
    validatePathParams: (params) => validatePapsIdParam(params.paps_id),
    defaultBody: SPAP_DEFAULTS.apply,
  },

  SPAP_GET: {
    method: 'GET',
    path: '/spap/:spap_id',
    requiresAuth: true,
    validatePathParams: (params) => validateSpapIdParam(params.spap_id),
  },

  SPAP_WITHDRAW: {
    method: 'DELETE',
    path: '/spap/:spap_id',
    requiresAuth: true,
    validatePathParams: (params) => validateSpapIdParam(params.spap_id),
  },

  SPAP_UPDATE_STATUS: {
    method: 'PUT',
    path: '/spap/:spap_id/status',
    requiresAuth: true,
    validate: validateSpapStatusUpdateRequest as (body: unknown) => void,
    validatePathParams: (params) => validateSpapIdParam(params.spap_id),
  },

  // SPAP Media
  SPAP_MEDIA_LIST: {
    method: 'GET',
    path: '/spap/:spap_id/media',
    requiresAuth: true,
    validatePathParams: (params) => validateSpapIdParam(params.spap_id),
  },

  SPAP_MEDIA_UPLOAD: {
    method: 'POST',
    path: '/spap/:spap_id/media',
    requiresAuth: true,
    isFileUpload: true,
    fileFieldName: 'media',
    multipleFiles: true,
    validatePathParams: (params) => validateSpapIdParam(params.spap_id),
  },

  SPAP_MEDIA_GET: {
    method: 'GET',
    path: '/spap/media/:media_id',
    requiresAuth: true,
    validatePathParams: (params) => validateMediaIdParam(params.media_id),
  },

  SPAP_MEDIA_DELETE: {
    method: 'DELETE',
    path: '/spap/media/:media_id',
    requiresAuth: true,
    validatePathParams: (params) => validateMediaIdParam(params.media_id),
  },
};

// =============================================================================
// TYPE MAPPINGS FOR ENDPOINTS
// =============================================================================

export interface SpapEndpointTypes {
  SPAP_LIST_FOR_PAPS: {
    params: never;
    body: never;
    pathParams: { paps_id: UUID };
    response: SpapListResponse;
  };
  SPAP_MY_APPLICATIONS: {
    params: never;
    body: never;
    response: MyApplicationsResponse;
  };
  SPAP_APPLY: {
    params: never;
    body: SpapCreateRequest;
    pathParams: { paps_id: UUID };
    response: SpapCreateResponse;
  };
  SPAP_GET: {
    params: never;
    body: never;
    pathParams: { spap_id: UUID };
    response: Spap;
  };
  SPAP_WITHDRAW: {
    params: never;
    body: never;
    pathParams: { spap_id: UUID };
    response: void;
  };
  SPAP_UPDATE_STATUS: {
    params: never;
    body: SpapStatusUpdateRequest;
    pathParams: { spap_id: UUID };
    response: void;
  };
  SPAP_MEDIA_LIST: {
    params: never;
    body: never;
    pathParams: { spap_id: UUID };
    response: SpapMediaListResponse;
  };
  SPAP_MEDIA_UPLOAD: {
    params: never;
    body: never;
    pathParams: { spap_id: UUID };
    files: File[] | Blob[];
    response: MediaUploadResponse;
  };
  SPAP_MEDIA_GET: {
    params: never;
    body: never;
    pathParams: { media_id: UUID };
    response: Blob;
  };
  SPAP_MEDIA_DELETE: {
    params: never;
    body: never;
    pathParams: { media_id: UUID };
    response: void;
  };
}
