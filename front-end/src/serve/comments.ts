/**
 * Comments service endpoints.
 * Handles Instagram-style comments with single-level replies.
 */

import { HttpMethod, UUID } from './types';
import {
  Comment,
  CommentsListResponse,
  CommentCreateRequest,
  CommentCreateResponse,
  CommentThreadResponse,
  RepliesListResponse,
} from './types';
import {
  isValidUUID,
  requiredFieldError,
  invalidFormatError,
  lengthError,
  ApiError,
  HTTP_STATUS,
} from './errors';

// =============================================================================
// ENDPOINT KEYS
// =============================================================================

export type CommentEndpoint =
  // PAPS Comments
  | 'COMMENTS_LIST'
  | 'COMMENTS_CREATE'
  // Single Comment
  | 'COMMENT_GET'
  | 'COMMENT_UPDATE'
  | 'COMMENT_DELETE'
  // Replies
  | 'REPLIES_LIST'
  | 'REPLY_CREATE'
  | 'COMMENT_THREAD';

// =============================================================================
// CONSTANTS
// =============================================================================

export const COMMENT_CONSTRAINTS = {
  minLength: 1,
  maxLength: 2000,
} as const;

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate comment creation request.
 */
export function validateCommentCreateRequest(data: CommentCreateRequest): void {
  if (!data.content) {
    throw new ApiError(
      'Comment cannot be empty',
      HTTP_STATUS.BAD_REQUEST,
      'validation'
    );
  }

  if (data.content.length > COMMENT_CONSTRAINTS.maxLength) {
    throw new ApiError(
      `Comment too long (max ${COMMENT_CONSTRAINTS.maxLength} characters)`,
      HTTP_STATUS.BAD_REQUEST,
      'validation'
    );
  }
}

/**
 * Validate reply creation request.
 */
export function validateReplyCreateRequest(data: CommentCreateRequest): void {
  if (!data.content) {
    throw new ApiError(
      'Reply cannot be empty',
      HTTP_STATUS.BAD_REQUEST,
      'validation'
    );
  }

  if (data.content.length > COMMENT_CONSTRAINTS.maxLength) {
    throw new ApiError(
      `Reply too long (max ${COMMENT_CONSTRAINTS.maxLength} characters)`,
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
 * Validate comment ID path parameter.
 */
export function validateCommentIdParam(commentId: string): void {
  if (!isValidUUID(commentId)) {
    throw invalidFormatError('comment ID', 'UUID');
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
}

export const commentEndpoints: Record<CommentEndpoint, EndpointConfig> = {
  // PAPS Comments
  COMMENTS_LIST: {
    method: 'GET',
    path: '/paps/:paps_id/comments',
    requiresAuth: true,
    validatePathParams: (params) => validatePapsIdParam(params.paps_id),
  },

  COMMENTS_CREATE: {
    method: 'POST',
    path: '/paps/:paps_id/comments',
    requiresAuth: true,
    validate: validateCommentCreateRequest as (body: unknown) => void,
    validatePathParams: (params) => validatePapsIdParam(params.paps_id),
  },

  // Single Comment
  COMMENT_GET: {
    method: 'GET',
    path: '/comments/:comment_id',
    requiresAuth: true,
    validatePathParams: (params) => validateCommentIdParam(params.comment_id),
  },

  COMMENT_UPDATE: {
    method: 'PUT',
    path: '/comments/:comment_id',
    requiresAuth: true,
    validate: validateCommentCreateRequest as (body: unknown) => void,
    validatePathParams: (params) => validateCommentIdParam(params.comment_id),
  },

  COMMENT_DELETE: {
    method: 'DELETE',
    path: '/comments/:comment_id',
    requiresAuth: true,
    validatePathParams: (params) => validateCommentIdParam(params.comment_id),
  },

  // Replies
  REPLIES_LIST: {
    method: 'GET',
    path: '/comments/:comment_id/replies',
    requiresAuth: true,
    validatePathParams: (params) => validateCommentIdParam(params.comment_id),
  },

  REPLY_CREATE: {
    method: 'POST',
    path: '/comments/:comment_id/replies',
    requiresAuth: true,
    validate: validateReplyCreateRequest as (body: unknown) => void,
    validatePathParams: (params) => validateCommentIdParam(params.comment_id),
  },

  COMMENT_THREAD: {
    method: 'GET',
    path: '/comments/:comment_id/thread',
    requiresAuth: true,
    validatePathParams: (params) => validateCommentIdParam(params.comment_id),
  },
};

// =============================================================================
// TYPE MAPPINGS FOR ENDPOINTS
// =============================================================================

export interface CommentEndpointTypes {
  COMMENTS_LIST: {
    params: never;
    body: never;
    pathParams: { paps_id: UUID };
    response: CommentsListResponse;
  };
  COMMENTS_CREATE: {
    params: never;
    body: CommentCreateRequest;
    pathParams: { paps_id: UUID };
    response: CommentCreateResponse;
  };
  COMMENT_GET: {
    params: never;
    body: never;
    pathParams: { comment_id: UUID };
    response: Comment;
  };
  COMMENT_UPDATE: {
    params: never;
    body: CommentCreateRequest;
    pathParams: { comment_id: UUID };
    response: void;
  };
  COMMENT_DELETE: {
    params: never;
    body: never;
    pathParams: { comment_id: UUID };
    response: void;
  };
  REPLIES_LIST: {
    params: never;
    body: never;
    pathParams: { comment_id: UUID };
    response: RepliesListResponse;
  };
  REPLY_CREATE: {
    params: never;
    body: CommentCreateRequest;
    pathParams: { comment_id: UUID };
    response: CommentCreateResponse;
  };
  COMMENT_THREAD: {
    params: never;
    body: never;
    pathParams: { comment_id: UUID };
    response: CommentThreadResponse;
  };
}
