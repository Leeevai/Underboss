/**
 * Comments module - Request validators
 * 
 * @module serve/comments/validators
 */

import type { CommentCreateRequest, CommentUpdateRequest, CommentListParams } from './types';

/** Maximum comment content length */
export const MAX_COMMENT_LENGTH = 2000;

/** Default pagination limit */
export const DEFAULT_LIMIT = 20;

/** Maximum pagination limit */
export const MAX_LIMIT = 100;

/**
 * Validate comment list params
 * 
 * GET /paps/{paps_id}/comments query params
 * GET /comments/{comment_id}/replies query params
 */
export function validateCommentListParams(data: CommentListParams): void {
  if (data.limit !== undefined) {
    if (typeof data.limit !== 'number' || data.limit <= 0) {
      throw new Error('Limit must be a positive number');
    }
    if (data.limit > MAX_LIMIT) {
      throw new Error(`Limit cannot exceed ${MAX_LIMIT}`);
    }
  }

  if (data.offset !== undefined) {
    if (typeof data.offset !== 'number' || data.offset < 0) {
      throw new Error('Offset must be a non-negative number');
    }
  }

  // parent_id can be string (UUID) or null (for top-level only)
  if (data.parent_id !== undefined && data.parent_id !== null) {
    if (typeof data.parent_id !== 'string') {
      throw new Error('Parent ID must be a string (UUID) or null');
    }
  }
}

/**
 * Validate comment create request
 * 
 * POST /paps/{paps_id}/comments
 * POST /comments/{comment_id}/replies
 */
export function validateCommentCreate(data: CommentCreateRequest): void {
  // Content is required
  if (!data.content || typeof data.content !== 'string') {
    throw new Error('Content is required');
  }

  // Trim and check length
  const trimmed = data.content.trim();
  if (trimmed.length < 1) {
    throw new Error('Content cannot be empty');
  }
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Content must be at most ${MAX_COMMENT_LENGTH} characters`);
  }

  // parent_id is optional (for top-level comments on PAPS)
  if (data.parent_id !== undefined && typeof data.parent_id !== 'string') {
    throw new Error('Parent ID must be a string (UUID)');
  }
}

/**
 * Validate comment update request
 * 
 * PUT /comments/{comment_id}
 */
export function validateCommentUpdate(data: CommentUpdateRequest): void {
  // Content is required
  if (!data.content || typeof data.content !== 'string') {
    throw new Error('Content is required');
  }

  // Trim and check length
  const trimmed = data.content.trim();
  if (trimmed.length < 1) {
    throw new Error('Content cannot be empty');
  }
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Content must be at most ${MAX_COMMENT_LENGTH} characters`);
  }
}
