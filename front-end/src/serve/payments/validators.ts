/**
 * Payments module - Request validators
 */

import type { PaymentCreateRequest, PaymentUpdateRequest } from './types';

const VALID_STATUSES = ['pending', 'processing', 'completed', 'failed', 'refunded'];

/**
 * Validate payment create request
 */
export function validatePaymentCreate(data: PaymentCreateRequest): void {
  if (!data.payee_id || typeof data.payee_id !== 'string') {
    throw new Error('Payee ID is required');
  }

  if (data.amount === undefined || typeof data.amount !== 'number') {
    throw new Error('Amount is required');
  }
  if (data.amount <= 0) {
    throw new Error('Amount must be positive');
  }

  if (data.currency && data.currency.length !== 3) {
    throw new Error('Currency must be 3-letter code (e.g., USD)');
  }
}

/**
 * Validate payment update request
 */
export function validatePaymentUpdate(data: PaymentUpdateRequest): void {
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    throw new Error(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
}
