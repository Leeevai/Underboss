/**
 * SPAP module - Request validators
 */

import type { SpapCreateRequest, SpapUpdateRequest } from './types';

const VALID_STATUSES = ['pending', 'accepted', 'rejected', 'withdrawn'];

/**
 * Validate SPAP create request
 */
export function validateSpapCreate(data: SpapCreateRequest): void {
  if (!data.paps_id || typeof data.paps_id !== 'string') {
    throw new Error('PAPS ID is required');
  }
}

/**
 * Validate SPAP update request
 */
export function validateSpapUpdate(data: SpapUpdateRequest): void {
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    throw new Error(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
}
