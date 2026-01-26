/**
 * Categories service endpoints.
 * Handles category CRUD operations and icons.
 */

import { HttpMethod, UUID } from './types';
import {
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  CategoryCreateResponse,
  CategoryIconResponse,
} from './types';
import {
  isValidUUID,
  isValidSlug,
  requiredFieldError,
  invalidFormatError,
  lengthError,
} from './errors';

// =============================================================================
// ENDPOINT KEYS
// =============================================================================

export type CategoryEndpoint =
  | 'CATEGORIES_LIST'
  | 'CATEGORIES_GET'
  | 'CATEGORIES_CREATE'
  | 'CATEGORIES_UPDATE'
  | 'CATEGORIES_DELETE'
  | 'CATEGORIES_ICON_UPLOAD'
  | 'CATEGORIES_ICON_GET'
  | 'CATEGORIES_ICON_DELETE';

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const CATEGORY_DEFAULTS = {
  create: {
    description: undefined,
    parent_id: undefined,
    icon_url: undefined,
  },
  update: {
    is_active: true,
  },
} as const;

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate category creation request.
 */
export function validateCategoryCreateRequest(data: CategoryCreateRequest): void {
  if (!data.name) {
    throw requiredFieldError('name');
  }
  if (data.name.length < 2) {
    throw lengthError('Name', 2);
  }

  if (!data.slug) {
    throw requiredFieldError('slug');
  }
  if (!isValidSlug(data.slug)) {
    throw invalidFormatError('slug', 'lowercase letters, numbers, and hyphens');
  }

  if (data.parent_id && !isValidUUID(data.parent_id)) {
    throw invalidFormatError('parent_id', 'UUID');
  }
}

/**
 * Validate category update request.
 */
export function validateCategoryUpdateRequest(data: CategoryUpdateRequest): void {
  if (data.name !== undefined && data.name.length < 2) {
    throw lengthError('Name', 2);
  }

  if (data.slug !== undefined && !isValidSlug(data.slug)) {
    throw invalidFormatError('slug', 'lowercase letters, numbers, and hyphens');
  }

  if (data.parent_id && !isValidUUID(data.parent_id)) {
    throw invalidFormatError('parent_id', 'UUID');
  }
}

/**
 * Validate category ID path parameter.
 */
export function validateCategoryIdParam(categoryId: string): void {
  if (!isValidUUID(categoryId)) {
    throw invalidFormatError('category ID', 'UUID');
  }
}

// =============================================================================
// ENDPOINT CONFIGURATIONS
// =============================================================================

export interface EndpointConfig<TParams = unknown, TBody = unknown, TResponse = unknown> {
  method: HttpMethod;
  path: string;
  requiresAuth: boolean;
  requiresAdmin?: boolean;
  validate?: (body: TBody) => void;
  validatePathParams?: (params: Record<string, string>) => void;
  defaultBody?: Partial<TBody>;
  isFileUpload?: boolean;
  fileFieldName?: string;
}

export const categoryEndpoints: Record<CategoryEndpoint, EndpointConfig> = {
  CATEGORIES_LIST: {
    method: 'GET',
    path: '/categories',
    requiresAuth: true,
  },

  CATEGORIES_GET: {
    method: 'GET',
    path: '/categories/:category_id',
    requiresAuth: true,
    validatePathParams: (params) => validateCategoryIdParam(params.category_id),
  },

  CATEGORIES_CREATE: {
    method: 'POST',
    path: '/categories',
    requiresAuth: true,
    requiresAdmin: true,
    validate: validateCategoryCreateRequest as (body: unknown) => void,
    defaultBody: CATEGORY_DEFAULTS.create,
  },

  CATEGORIES_UPDATE: {
    method: 'PATCH',
    path: '/categories/:category_id',
    requiresAuth: true,
    requiresAdmin: true,
    validate: validateCategoryUpdateRequest as (body: unknown) => void,
    validatePathParams: (params) => validateCategoryIdParam(params.category_id),
  },

  CATEGORIES_DELETE: {
    method: 'DELETE',
    path: '/categories/:category_id',
    requiresAuth: true,
    requiresAdmin: true,
    validatePathParams: (params) => validateCategoryIdParam(params.category_id),
  },

  CATEGORIES_ICON_UPLOAD: {
    method: 'POST',
    path: '/categories/:category_id/icon',
    requiresAuth: true,
    requiresAdmin: true,
    isFileUpload: true,
    fileFieldName: 'image',
    validatePathParams: (params) => validateCategoryIdParam(params.category_id),
  },

  CATEGORIES_ICON_GET: {
    method: 'GET',
    path: '/categories/:category_id/icon',
    requiresAuth: true,
    validatePathParams: (params) => validateCategoryIdParam(params.category_id),
  },

  CATEGORIES_ICON_DELETE: {
    method: 'DELETE',
    path: '/categories/:category_id/icon',
    requiresAuth: true,
    requiresAdmin: true,
    validatePathParams: (params) => validateCategoryIdParam(params.category_id),
  },
};

// =============================================================================
// TYPE MAPPINGS FOR ENDPOINTS
// =============================================================================

export interface CategoryEndpointTypes {
  CATEGORIES_LIST: {
    params: never;
    body: never;
    response: Category[];
  };
  CATEGORIES_GET: {
    params: never;
    body: never;
    pathParams: { category_id: UUID };
    response: Category;
  };
  CATEGORIES_CREATE: {
    params: never;
    body: CategoryCreateRequest;
    response: CategoryCreateResponse;
  };
  CATEGORIES_UPDATE: {
    params: never;
    body: CategoryUpdateRequest;
    pathParams: { category_id: UUID };
    response: void;
  };
  CATEGORIES_DELETE: {
    params: never;
    body: never;
    pathParams: { category_id: UUID };
    response: void;
  };
  CATEGORIES_ICON_UPLOAD: {
    params: never;
    body: never;
    pathParams: { category_id: UUID };
    file: File | Blob;
    response: CategoryIconResponse;
  };
  CATEGORIES_ICON_GET: {
    params: never;
    body: never;
    pathParams: { category_id: UUID };
    response: Blob;
  };
  CATEGORIES_ICON_DELETE: {
    params: never;
    body: never;
    pathParams: { category_id: UUID };
    response: void;
  };
}
