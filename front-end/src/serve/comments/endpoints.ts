/**
 * Comments module - Endpoint definitions
 * 
 * Endpoints:
 * - List/create comments on PAPS: /paps/{paps_id}/comments
 * - Comment operations: /comments/{comment_id}
 * - Reply operations: /comments/{comment_id}/replies
 * - Thread retrieval: /comments/{comment_id}/thread
 * 
 * @module serve/comments/endpoints
 */

import type { HttpMethod } from '../common/types';
import { validateCommentCreate, validateCommentUpdate, validateCommentListParams } from './validators';

export interface EndpointConfig {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
}

export const commentEndpoints: Record<string, EndpointConfig> = {
  // ==========================================================================
  // Comments on PAPS
  // ==========================================================================
  
  /**
   * List comments on a PAPS
   * 
   * Path params: paps_id
   * Query params: parent_id, limit, offset
   * Response: CommentListResponse { comments, total }
   */
  'comments.list': {
    method: 'GET',
    path: '/paps/{paps_id}/comments',
    auth: true,
    validate: validateCommentListParams,
  },
  
  /**
   * Create a comment on a PAPS
   * 
   * Path params: paps_id
   * Request: CommentCreateRequest { content, parent_id? }
   * Response: CommentCreateResponse { id, message }
   */
  'comments.create': {
    method: 'POST',
    path: '/paps/{paps_id}/comments',
    auth: true,
    validate: validateCommentCreate,
  },

  // ==========================================================================
  // Individual comment operations
  // ==========================================================================
  
  /**
   * Get a single comment by ID
   * 
   * Path params: comment_id
   * Response: Comment
   */
  'comments.get': {
    method: 'GET',
    path: '/comments/{comment_id}',
    auth: true,
  },
  
  /**
   * Update a comment (owner only)
   * 
   * Path params: comment_id
   * Request: CommentUpdateRequest { content }
   * Response: CommentUpdateResponse { message }
   */
  'comments.update': {
    method: 'PUT',
    path: '/comments/{comment_id}',
    auth: true,
    validate: validateCommentUpdate,
  },
  
  /**
   * Delete a comment (soft delete - owner only)
   * 
   * Path params: comment_id
   * Response: CommentDeleteResponse { message }
   */
  'comments.delete': {
    method: 'DELETE',
    path: '/comments/{comment_id}',
    auth: true,
  },

  // ==========================================================================
  // Reply operations
  // ==========================================================================
  
  /**
   * List replies to a comment
   * 
   * Path params: comment_id
   * Query params: limit, offset
   * Response: CommentListResponse { comments, total }
   */
  'comments.replies.list': {
    method: 'GET',
    path: '/comments/{comment_id}/replies',
    auth: true,
    validate: validateCommentListParams,
  },
  
  /**
   * Create a reply to a comment
   * 
   * Path params: comment_id (parent)
   * Request: CommentCreateRequest { content } (parent_id auto-set)
   * Response: CommentCreateResponse { id, message }
   */
  'comments.replies.create': {
    method: 'POST',
    path: '/comments/{comment_id}/replies',
    auth: true,
    validate: validateCommentCreate,
  },

  // ==========================================================================
  // Thread operations
  // ==========================================================================
  
  /**
   * Get full comment thread (comment + all nested replies)
   * 
   * Path params: comment_id
   * Response: CommentThreadResponse { comment: CommentThread }
   */
  'comments.thread': {
    method: 'GET',
    path: '/comments/{comment_id}/thread',
    auth: true,
  },
};
