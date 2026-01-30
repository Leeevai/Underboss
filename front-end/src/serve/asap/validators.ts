/**
 * ASAP module - Request validators
 */

import type { AsapStatusUpdateRequest, AsapRateRequest } from './types';

const VALID_STATUSES = ['active', 'in_progress', 'completed', 'cancelled', 'disputed'];

/**
 * Validate ASAP status update request
 */
export function validateAsapStatusUpdate(data: AsapStatusUpdateRequest): void {
  if (!data.status || !VALID_STATUSES.includes(data.status)) {
    throw new Error(`Status is required and must be one of: ${VALID_STATUSES.join(', ')}`);
  }
}

/**
 * Validate ASAP rating request
 */
export function validateAsapRate(data: AsapRateRequest): void {
  if (typeof data.score !== 'number' || data.score < 1 || data.score > 5) {
    throw new Error('Score must be an integer between 1 and 5');
  }
}
