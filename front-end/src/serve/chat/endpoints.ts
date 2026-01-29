/**
 * Chat module - Endpoint definitions
 */

import type { HttpMethod } from '../common/types';
import { validateChatCreate, validateMessageCreate, validateMessageListParams } from './validators';

export interface EndpointConfig {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
}

export const chatEndpoints: Record<string, EndpointConfig> = {
  // Chat threads
  'chat.list': {
    method: 'GET',
    path: '/chats',
    auth: true,
  },
  'chat.create': {
    method: 'POST',
    path: '/chats',
    auth: true,
    validate: validateChatCreate,
  },
  'chat.get': {
    method: 'GET',
    path: '/chats/{thread_id}',
    auth: true,
  },
  'chat.delete': {
    method: 'DELETE',
    path: '/chats/{thread_id}',
    auth: true,
  },

  // Messages
  'chat.messages.list': {
    method: 'GET',
    path: '/chats/{thread_id}/messages',
    auth: true,
    validate: validateMessageListParams,
  },
  'chat.messages.send': {
    method: 'POST',
    path: '/chats/{thread_id}/messages',
    auth: true,
    validate: validateMessageCreate,
  },
  'chat.messages.read': {
    method: 'POST',
    path: '/chats/{thread_id}/read',
    auth: true,
  },
};
