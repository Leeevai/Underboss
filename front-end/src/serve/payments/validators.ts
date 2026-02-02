/**
 * Payments module - Request validators
 * 
 * @module serve/payments/validators
 */

import type { PaymentCreateRequest, PaymentStatusUpdateRequest } from './types';

const VALID_STATUSES = ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'];
const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY'];
const VALID_PAYMENT_METHODS = ['transfer', 'cash', 'check', 'crypto', 'paypal', 'stripe', 'other'];

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

  if (data.currency) {
    if (data.currency.length !== 3) {
      throw new Error('Currency must be 3-letter code (e.g., USD)');
    }
    if (!VALID_CURRENCIES.includes(data.currency.toUpperCase())) {
      throw new Error(`Currency must be one of: ${VALID_CURRENCIES.join(', ')}`);
    }
  }

  if (data.payment_method && !VALID_PAYMENT_METHODS.includes(data.payment_method)) {
    throw new Error(`Payment method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`);
  }
}

/**
 * Validate payment status update request
 */
export function validatePaymentStatusUpdate(data: PaymentStatusUpdateRequest): void {
  if (!data.status) {
    throw new Error('Status is required');
  }
  if (!VALID_STATUSES.includes(data.status)) {
    throw new Error(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
}

// Legacy export
export const validatePaymentUpdate = validatePaymentStatusUpdate;
