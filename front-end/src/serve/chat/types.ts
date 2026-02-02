/**
 * Chat module - Types for the chat system
 * 
 * Chat threads are associated with PAPS/SPAP/ASAP contexts.
 * Uses /chat (singular) path prefix in backend.
 * 
 * @module serve/chat/types
 */

import type { UUID, ISODateTime, MessageType, ThreadType, ParticipantRole } from '../common/types';

// =============================================================================
// CHAT ENTITIES
// =============================================================================

/** Chat participant */
export interface ChatParticipant {
  /** User ID */
  user_id: UUID;
  /** Username */
  username: string;
  /** Avatar URL */
  avatar_url: string | null;
  /** When user joined the thread */
  joined_at?: ISODateTime;
  /** Participant role (owner, participant, etc.) */
  role?: ParticipantRole;
}

/** 
 * Chat message
 * 
 * Returned by:
 * - GET /chat/{thread_id}/messages
 * - POST /chat/{thread_id}/messages
 */
export interface ChatMessage {
  /** Message ID */
  id: UUID;
  /** Thread ID this message belongs to */
  thread_id: UUID;
  /** Sender user ID */
  sender_id: UUID;
  /** Sender username */
  sender_username: string;
  /** Sender avatar URL */
  sender_avatar: string | null;
  /** Message text content */
  content: string;
  /** When message was sent */
  sent_at: ISODateTime;
  /** When message was last edited (null if never edited) */
  edited_at: ISODateTime | null;
  /** Array of user IDs who have read this message */
  read_by: UUID[];
  /** Message type (text, system, etc.) */
  message_type: MessageType;
  /** Whether this is a system-generated message */
  is_system_message: boolean;
}

/** Last message preview in thread list */
export interface LastMessage {
  /** Message ID */
  id: UUID;
  /** Sender user ID */
  sender_id: UUID;
  /** Sender username */
  sender_username: string;
  /** Message content (may be truncated) */
  content: string;
  /** When message was sent */
  sent_at: ISODateTime;
}

/** 
 * Chat thread - List item
 * 
 * Returned by GET /chat
 */
export interface ChatThread {
  /** Thread ID */
  id: UUID;
  /** Thread type (paps, spap, asap, direct) */
  thread_type: ThreadType;
  /** Associated PAPS ID (if any) */
  paps_id: UUID | null;
  /** Associated PAPS title (if any) */
  paps_title: string | null;
  /** Associated SPAP ID (if any) */
  spap_id: UUID | null;
  /** Associated ASAP ID (if any) */
  asap_id: UUID | null;
  /** Thread participants */
  participants: ChatParticipant[];
  /** Last message in thread (for preview) */
  last_message: LastMessage | null;
  /** Count of unread messages for current user */
  unread_count: number;
  /** When thread was created */
  created_at: ISODateTime;
  /** When thread was last updated */
  updated_at: ISODateTime;
}

/** Chat thread detail (same structure) */
export interface ChatThreadDetail extends ChatThread {}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** GET /chat query params */
export interface ChatListParams {
  /** Filter by PAPS ID */
  paps_id?: UUID;
  /** Show only threads with unread messages */
  unread_only?: boolean;
  /** Filter by thread type */
  thread_type?: ThreadType;
}

/** 
 * POST /chat request
 * Creates a new chat thread
 */
export interface ChatCreateRequest {
  /** User IDs to add as participants */
  participant_ids: UUID[];
  /** Associated PAPS ID (optional) */
  paps_id?: UUID;
  /** Associated SPAP ID (optional) */
  spap_id?: UUID;
  /** Associated ASAP ID (optional) */
  asap_id?: UUID;
  /** Initial message content (optional) */
  initial_message?: string;
}

/** GET /chat/{thread_id}/messages query params */
export interface MessageListParams {
  /** Number of messages to return (default: 50) */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Get messages before this timestamp */
  before?: ISODateTime;
  /** Get messages after this timestamp */
  after?: ISODateTime;
}

/** 
 * POST /chat/{thread_id}/messages request
 * Send a new message
 */
export interface MessageCreateRequest {
  /** Message text content (required, max 5000 chars) */
  content: string;
}

/** 
 * PUT /chat/{thread_id}/messages/{message_id} request
 * Edit an existing message (sender only)
 */
export interface MessageUpdateRequest {
  /** Updated message content (required, max 5000 chars) */
  content: string;
}

/** 
 * PUT /chat/{thread_id}/messages/{message_id}/read request
 * Mark a specific message as read
 * (empty body - just makes the request)
 */
export interface MarkMessageReadRequest {}

/** 
 * PUT /chat/{thread_id}/read request
 * Mark all messages in thread as read
 * (empty body - just makes the request)
 */
export interface MarkThreadReadRequest {}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** GET /chat response */
export interface ChatListResponse {
  /** Array of chat threads */
  threads: ChatThread[];
  /** Total count for pagination */
  total: number;
}

/** POST /chat response */
export interface ChatCreateResponse {
  /** Created thread ID */
  id: UUID;
  /** Success message */
  message: string;
}

/** GET /chat/{thread_id} response */
export interface ChatThreadResponse {
  /** Thread details */
  thread: ChatThreadDetail;
}

/** GET /chat/{thread_id}/messages response */
export interface MessageListResponse {
  /** Array of messages */
  messages: ChatMessage[];
  /** Total count for pagination */
  total: number;
}

/** POST /chat/{thread_id}/messages response */
export interface MessageCreateResponse {
  /** Created message ID */
  id: UUID;
  /** Success message */
  message: string;
}

/** PUT /chat/{thread_id}/messages/{message_id} response */
export interface MessageUpdateResponse {
  /** Success message */
  message: string;
}

/** PUT /chat/{thread_id}/messages/{message_id}/read response */
export interface MarkMessageReadResponse {
  /** Success message */
  message: string;
}

/** PUT /chat/{thread_id}/read response */
export interface MarkThreadReadResponse {
  /** Success message */
  message: string;
  /** Number of messages marked as read */
  marked_count: number;
}

/** DELETE /chat/{thread_id}/leave response */
export interface LeaveThreadResponse {
  /** Success message */
  message: string;
}

/** GET /chat/{thread_id}/unread response */
export interface UnreadCountResponse {
  /** Thread ID */
  thread_id: UUID;
  /** Number of unread messages */
  unread_count: number;
}

// =============================================================================
// LEGACY TYPE ALIASES
// =============================================================================

/** @deprecated Use ChatMessage with id field instead */
export interface LegacyChatMessage extends Omit<ChatMessage, 'id'> {
  message_id: UUID;
}

/** @deprecated Use ChatThread with id field instead */
export interface LegacyChatThread extends Omit<ChatThread, 'id'> {
  thread_id: UUID;
