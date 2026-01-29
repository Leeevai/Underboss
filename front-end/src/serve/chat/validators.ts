/**
 * Chat module - Request validators
 */

import type { ChatCreateRequest, MessageCreateRequest, MessageListParams } from './types';

/**
 * Validate chat create request
 */
export function validateChatCreate(data: ChatCreateRequest): void {
  if (!data.participant_ids || !Array.isArray(data.participant_ids) || data.participant_ids.length === 0) {
    throw new Error('At least one participant is required');
  }
  if (data.participant_ids.length > 10) {
    throw new Error('Max 10 participants per thread');
  }

  if (data.initial_message && data.initial_message.length > 5000) {
    throw new Error('Initial message must be max 5000 characters');
  }
}

/**
 * Validate message create request
 */
export function validateMessageCreate(data: MessageCreateRequest): void {
  if (!data.content || typeof data.content !== 'string') {
    throw new Error('Content is required');
  }
  if (data.content.length < 1 || data.content.length > 5000) {
    throw new Error('Content must be 1-5000 characters');
  }
}

/**
 * Validate message list params
 */
export function validateMessageListParams(data: MessageListParams): void {
  if (data.limit !== undefined && data.limit <= 0) {
    throw new Error('Limit must be positive');
  }
  if (data.offset !== undefined && data.offset < 0) {
    throw new Error('Offset cannot be negative');
  }
}
