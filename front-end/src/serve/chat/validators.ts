/**
 * Chat module - Request validators
 * 
 * @module serve/chat/validators
 */

import type { ChatCreateRequest, MessageCreateRequest, MessageUpdateRequest, MessageListParams } from './types';

/** Maximum message content length */
export const MAX_MESSAGE_LENGTH = 5000;

/** Maximum participants per thread */
export const MAX_PARTICIPANTS = 10;

/** Default message list limit */
export const DEFAULT_MESSAGE_LIMIT = 50;

/** Maximum message list limit */
export const MAX_MESSAGE_LIMIT = 100;

/**
 * Validate chat create request
 * 
 * POST /chat
 */
export function validateChatCreate(data: ChatCreateRequest): void {
  // participant_ids is required and must have at least one
  if (!data.participant_ids || !Array.isArray(data.participant_ids)) {
    throw new Error('Participant IDs must be an array');
  }
  if (data.participant_ids.length === 0) {
    throw new Error('At least one participant is required');
  }
  if (data.participant_ids.length > MAX_PARTICIPANTS) {
    throw new Error(`Maximum ${MAX_PARTICIPANTS} participants per thread`);
  }

  // All participant IDs must be strings (UUIDs)
  for (const id of data.participant_ids) {
    if (typeof id !== 'string') {
      throw new Error('All participant IDs must be strings (UUIDs)');
    }
  }

  // Check for context association (optional but recommended)
  // At least one of paps_id, spap_id, or asap_id should be provided
  // Direct messages have none of these

  // Validate optional IDs are strings if provided
  if (data.paps_id !== undefined && typeof data.paps_id !== 'string') {
    throw new Error('PAPS ID must be a string (UUID)');
  }
  if (data.spap_id !== undefined && typeof data.spap_id !== 'string') {
    throw new Error('SPAP ID must be a string (UUID)');
  }
  if (data.asap_id !== undefined && typeof data.asap_id !== 'string') {
    throw new Error('ASAP ID must be a string (UUID)');
  }

  // Validate initial message if provided
  if (data.initial_message !== undefined) {
    if (typeof data.initial_message !== 'string') {
      throw new Error('Initial message must be a string');
    }
    if (data.initial_message.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Initial message must be at most ${MAX_MESSAGE_LENGTH} characters`);
    }
  }
}

/**
 * Validate message create request
 * 
 * POST /chat/{thread_id}/messages
 */
export function validateMessageCreate(data: MessageCreateRequest): void {
  // Content is required
  if (!data.content || typeof data.content !== 'string') {
    throw new Error('Content is required');
  }

  // Trim and check length
  const trimmed = data.content.trim();
  if (trimmed.length < 1) {
    throw new Error('Content cannot be empty');
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Content must be at most ${MAX_MESSAGE_LENGTH} characters`);
  }
}

/**
 * Validate message update request
 * 
 * PUT /chat/{thread_id}/messages/{message_id}
 */
export function validateMessageUpdate(data: MessageUpdateRequest): void {
  // Content is required
  if (!data.content || typeof data.content !== 'string') {
    throw new Error('Content is required');
  }

  // Trim and check length
  const trimmed = data.content.trim();
  if (trimmed.length < 1) {
    throw new Error('Content cannot be empty');
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Content must be at most ${MAX_MESSAGE_LENGTH} characters`);
  }
}

/**
 * Validate message list params
 * 
 * GET /chat/{thread_id}/messages
 */
export function validateMessageListParams(data: MessageListParams): void {
  if (data.limit !== undefined) {
    if (typeof data.limit !== 'number' || data.limit <= 0) {
      throw new Error('Limit must be a positive number');
    }
    if (data.limit > MAX_MESSAGE_LIMIT) {
      throw new Error(`Limit cannot exceed ${MAX_MESSAGE_LIMIT}`);
    }
  }

  if (data.offset !== undefined) {
    if (typeof data.offset !== 'number' || data.offset < 0) {
      throw new Error('Offset must be a non-negative number');
    }
  }

  // before and after are ISO datetime strings
  if (data.before !== undefined && typeof data.before !== 'string') {
    throw new Error('Before must be an ISO datetime string');
  }
  if (data.after !== undefined && typeof data.after !== 'string') {
    throw new Error('After must be an ISO datetime string');
  }
}
