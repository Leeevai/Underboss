/**
 * Comments module - Request validators
 */

import type { CommentCreateRequest, CommentUpdateRequest, CommentListParams } from './types';

/**
 * Validate comment list params
 */
export function validateCommentListParams(data: CommentListParams): void {
  if (data.limit !== undefined && data.limit <= 0) {
    throw new Error('Limit must be positive');
  }
  if (data.offset !== undefined && data.offset < 0) {
    throw new Error('Offset cannot be negative');
  }
}

/**
 * Validate comment create request
 */
export function validateCommentCreate(data: CommentCreateRequest): void {
  if (!data.content || typeof data.content !== 'string') {
    throw new Error('Content is required');
  }
  if (data.content.length < 1 || data.content.length > 2000) {
    throw new Error('Content must be 1-2000 characters');
  }
}

/**
 * Validate comment update request
 */
export function validateCommentUpdate(data: CommentUpdateRequest): void {
  if (!data.content || typeof data.content !== 'string') {
    throw new Error('Content is required');
  }
  if (data.content.length < 1 || data.content.length > 2000) {
    throw new Error('Content must be 1-2000 characters');
  }
}
