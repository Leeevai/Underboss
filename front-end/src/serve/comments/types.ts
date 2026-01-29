/**
 * Comments module - Types for the comment system
 */

import type { UUID, ISODateTime } from '../common/types';

// =============================================================================
// COMMENT ENTITY
// =============================================================================

/** Comment - List item */
export interface Comment {
  comment_id: UUID;
  paps_id: UUID;
  user_id: UUID;
  username: string;
  user_avatar: string | null;
  parent_id: UUID | null;
  content: string;
  created_at: ISODateTime;
  updated_at?: ISODateTime;
  reply_count: number;
  is_deleted: boolean;
}

/** Comment with replies */
export interface CommentDetail extends Comment {
  paps_title: string;
  replies: Comment[];
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** GET /paps/{id}/comments params */
export interface CommentListParams {
  parent_id?: UUID;
  limit?: number;
  offset?: number;
}

/** POST /paps/{id}/comments */
export interface CommentCreateRequest {
  content: string;
  parent_id?: UUID;
}

/** PATCH /comments/{id} */
export interface CommentUpdateRequest {
  content: string;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** GET /paps/{id}/comments response */
export interface CommentListResponse {
  comments: Comment[];
  total: number;
}

/** POST /paps/{id}/comments response */
export interface CommentCreateResponse {
  comment_id: UUID;
}
