/**
 * Chat module - Endpoint definitions
 * 
 * IMPORTANT: Backend uses /chat (singular), not /chats
 * 
 * Endpoints:
 * - Thread management: GET/POST /chat, GET /chat/{id}, DELETE /chat/{id}/leave
 * - Messages: GET/POST /chat/{id}/messages, PUT /chat/{id}/messages/{id}
 * - Read status: PUT /chat/{id}/messages/{id}/read, PUT /chat/{id}/read
 * - Unread count: GET /chat/{id}/unread
 * 
 * @module serve/chat/endpoints
 */

import type { HttpMethod } from '../common/types';
import { validateChatCreate, validateMessageCreate, validateMessageUpdate, validateMessageListParams } from './validators';

export interface EndpointConfig {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
}

export const chatEndpoints: Record<string, EndpointConfig> = {
  // ==========================================================================
  // Chat threads
  // ==========================================================================
  
  /**
   * List all chat threads for current user
   * 
   * Query params: paps_id, unread_only, thread_type
   * Response: ChatListResponse { threads, total }
   */
  'chat.list': {
    method: 'GET',
    path: '/chat',
    auth: true,
  },
  
  /**
   * Create a new chat thread
   * 
   * Request: ChatCreateRequest { participant_ids, paps_id?, spap_id?, asap_id?, initial_message? }
   * Response: ChatCreateResponse { id, message }
   */
  'chat.create': {
    method: 'POST',
    path: '/chat',
    auth: true,
    validate: validateChatCreate,
  },
  
  /**
   * Get a specific chat thread
   * 
   * Path params: thread_id
   * Response: ChatThreadResponse { thread }
   */
  'chat.get': {
    method: 'GET',
    path: '/chat/{thread_id}',
    auth: true,
  },
  
  /**
   * Leave a chat thread (removes current user as participant)
   * Does NOT delete the thread for other participants
   * 
   * Path params: thread_id
   * Response: LeaveThreadResponse { message }
   */
  'chat.leave': {
    method: 'DELETE',
    path: '/chat/{thread_id}/leave',
    auth: true,
  },

  // ==========================================================================
  // Messages
  // ==========================================================================
  
  /**
   * List messages in a chat thread
   * 
   * Path params: thread_id
   * Query params: limit, offset, before, after
   * Response: MessageListResponse { messages, total }
   */
  'chat.messages.list': {
    method: 'GET',
    path: '/chat/{thread_id}/messages',
    auth: true,
    validate: validateMessageListParams,
  },
  
  /**
   * Send a message to a chat thread
   * 
   * Path params: thread_id
   * Request: MessageCreateRequest { content }
   * Response: MessageCreateResponse { id, message }
   */
  'chat.messages.send': {
    method: 'POST',
    path: '/chat/{thread_id}/messages',
    auth: true,
    validate: validateMessageCreate,
  },
  
  /**
   * Edit a message (sender only)
   * 
   * Path params: thread_id, message_id
   * Request: MessageUpdateRequest { content }
   * Response: MessageUpdateResponse { message }
   */
  'chat.messages.update': {
    method: 'PUT',
    path: '/chat/{thread_id}/messages/{message_id}',
    auth: true,
    validate: validateMessageUpdate,
  },

  // ==========================================================================
  // Read status
  // ==========================================================================
  
  /**
   * Mark a specific message as read
   * 
   * Path params: thread_id, message_id
   * Response: MarkMessageReadResponse { message }
   */
  'chat.messages.markRead': {
    method: 'PUT',
    path: '/chat/{thread_id}/messages/{message_id}/read',
    auth: true,
  },
  
  /**
   * Mark all messages in thread as read
   * 
   * Path params: thread_id
   * Response: MarkThreadReadResponse { message, marked_count }
   */
  'chat.markAllRead': {
    method: 'PUT',
    path: '/chat/{thread_id}/read',
    auth: true,
  },
  
  /**
   * Get unread message count for a thread
   * 
   * Path params: thread_id
   * Response: UnreadCountResponse { thread_id, unread_count }
   */
  'chat.unreadCount': {
    method: 'GET',
    path: '/chat/{thread_id}/unread',
};
