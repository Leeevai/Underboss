/**
 * Comments module - Types for the comment system
 * 
 * Comments support threading via parent_id references.
 * - Top-level comments have parent_id = null
 * - Replies have parent_id = parent comment's id
 * 
 * @module serve/comments/types
 */

import type { UUID, ISODateTime } from '../common/types';

// =============================================================================
// COMMENT ENTITY
// =============================================================================

/** 
 * Comment - Base entity
 * 
 * Returned by:
 * - GET /paps/{paps_id}/comments
 * - GET /comments/{comment_id}/replies
 * - GET /comments/{comment_id}/thread
 */
export interface Comment {
  /** Comment ID (UUID) */
  id: UUID;
  /** PAPS ID this comment belongs to */
  paps_id: UUID;
  /** Author's user ID */
  user_id: UUID;
  /** Author's username */
  username: string;
  /** Author's avatar URL */
  user_avatar: string | null;
  /** Parent comment ID (null for top-level comments) */
  parent_id: UUID | null;
  /** Comment text content */
  content: string;
  /** Creation timestamp */
  created_at: ISODateTime;
  /** Last update timestamp */
  updated_at?: ISODateTime;
  /** Number of direct replies */
  reply_count: number;
  /** Whether comment has been soft-deleted */
  is_deleted: boolean;
}

/** 
 * Comment with nested replies
 * Used when fetching a comment thread
 */
export interface CommentThread extends Comment {
  /** Direct replies to this comment */
  replies: Comment[];
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** 
 * GET /paps/{paps_id}/comments query params
 * GET /comments/{comment_id}/replies query params
 */
export interface CommentListParams {
  /** Filter by parent comment (null = top-level only) */
  parent_id?: UUID | null;
  /** Number of comments to return (default: 20, max: 100) */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/** 
 * POST /paps/{paps_id}/comments request
 * POST /comments/{comment_id}/replies request
 */
export interface CommentCreateRequest {
  /** Comment text content (required, max 2000 chars) */
  content: string;
  /** Parent comment ID for replies (optional when posting to PAPS, not used for /replies) */
  parent_id?: UUID;
}

/** 
 * PUT /comments/{comment_id} request
 */
export interface CommentUpdateRequest {
  /** Updated comment text (required, max 2000 chars) */
  content: string;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** 
 * GET /paps/{paps_id}/comments response
 * GET /comments/{comment_id}/replies response
 */
export interface CommentListResponse {
  /** Array of comments */
  comments: Comment[];
  /** Total count for pagination */
  total: number;
}

/** 
 * POST /paps/{paps_id}/comments response
 * POST /comments/{comment_id}/replies response
 */
export interface CommentCreateResponse {
  /** Newly created comment ID */
  id: UUID;
  /** Success message */
  message: string;
}

/** 
 * PUT /comments/{comment_id} response
 */
export interface CommentUpdateResponse {
  /** Success message */
  message: string;
}

/** 
 * DELETE /comments/{comment_id} response
 */
export interface CommentDeleteResponse {
  /** Success message */
  message: string;
}

/** 
 * GET /comments/{comment_id}/thread response
 * Returns the comment with all nested replies
 */
export interface CommentThreadResponse {
  /** The comment with nested replies */
  comment: CommentThread;
}

// =============================================================================
// LEGACY TYPE ALIASES
// =============================================================================

/** @deprecated Use Comment with id field instead */
export interface LegacyComment extends Omit<Comment, 'id'> {
  comment_id: UUID;
}

/** @deprecated Use CommentThread instead */
export type CommentDetail = CommentThread;
