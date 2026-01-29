/**
 * ASAP module - Request validators
 */

import type { AsapCreateRequest, AsapUpdateRequest } from './types';

const VALID_STATUSES = ['active', 'in_progress', 'completed', 'cancelled', 'disputed'];

/**
 * Validate ASAP create request
 */
export function validateAsapCreate(data: AsapCreateRequest): void {
  if (!data.paps_id || typeof data.paps_id !== 'string') {
    throw new Error('PAPS ID is required');
  }
  if (!data.accepted_user_id || typeof data.accepted_user_id !== 'string') {
    throw new Error('Accepted user ID is required');
  }
}

/**
 * Validate ASAP update request
 */
export function validateAsapUpdate(data: AsapUpdateRequest): void {
  if (!data.status || !VALID_STATUSES.includes(data.status)) {
    throw new Error(`Status is required and must be one of: ${VALID_STATUSES.join(', ')}`);
  }
}
