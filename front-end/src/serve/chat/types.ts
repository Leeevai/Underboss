/**
 * Chat module - Types for the chat system
 */

import type { UUID, ISODateTime } from '../common/types';

// =============================================================================
// CHAT ENTITIES
// =============================================================================

/** Chat participant */
export interface ChatParticipant {
  user_id: UUID;
  username: string;
  avatar_url: string | null;
  joined_at?: ISODateTime;
}

/** Chat message */
export interface ChatMessage {
  message_id: UUID;
  thread_id: UUID;
  sender_id: UUID;
  sender_username: string;
  sender_avatar: string | null;
  content: string;
  sent_at: ISODateTime;
  read_by: UUID[];
  is_system_message: boolean;
}

/** Last message preview */
export interface LastMessage {
  message_id: UUID;
  sender_id: UUID;
  sender_username: string;
  content: string;
  sent_at: ISODateTime;
}

/** Chat thread - List item */
export interface ChatThread {
  thread_id: UUID;
  paps_id: UUID | null;
  paps_title: string | null;
  spap_id: UUID | null;
  asap_id: UUID | null;
  participants: ChatParticipant[];
  last_message: LastMessage | null;
  unread_count: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** Chat thread detail */
export interface ChatThreadDetail extends ChatThread {
  // Same as ChatThread for now
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** GET /chats params */
export interface ChatListParams {
  paps_id?: UUID;
  unread_only?: boolean;
}

/** POST /chats */
export interface ChatCreateRequest {
  participant_ids: UUID[];
  paps_id?: UUID;
  spap_id?: UUID;
  asap_id?: UUID;
  initial_message?: string;
}

/** GET /chats/{id}/messages params */
export interface MessageListParams {
  limit?: number;
  offset?: number;
  before?: ISODateTime;
  after?: ISODateTime;
}

/** POST /chats/{id}/messages */
export interface MessageCreateRequest {
  content: string;
}

/** POST /chats/{id}/read */
export interface MarkReadRequest {
  message_ids?: UUID[];
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** GET /chats response */
export interface ChatListResponse {
  threads: ChatThread[];
}

/** POST /chats response */
export interface ChatCreateResponse {
  thread_id: UUID;
}

/** GET /chats/{id}/messages response */
export interface MessageListResponse {
  messages: ChatMessage[];
  total: number;
}

/** POST /chats/{id}/messages response */
export interface MessageCreateResponse {
  message_id: UUID;
}
