/**
 * Payments module - Endpoint definitions
 * 
 * @module serve/payments/endpoints
 */

import type { HttpMethod } from '../common/types';
import { validatePaymentCreate, validatePaymentStatusUpdate } from './validators';

export interface EndpointConfig {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
}

export const paymentEndpoints: Record<string, EndpointConfig> = {
  // ==========================================================================
  // USER PAYMENTS
  // ==========================================================================
  
  /** GET /payments - Get current user's payments (as payer or payee) */
  'payments.my': {
    method: 'GET',
    path: '/payments',
    auth: true,
  },
  
  // ==========================================================================
  // PAYMENT CRUD
  // ==========================================================================
  
  /** GET /payments/{payment_id} - Get specific payment details */
  'payments.get': {
    method: 'GET',
    path: '/payments/{payment_id}',
    auth: true,
  },
  
  /** PUT /payments/{payment_id}/status - Update payment status */
  'payments.updateStatus': {
    method: 'PUT',
    path: '/payments/{payment_id}/status',
    auth: true,
    validate: validatePaymentStatusUpdate,
  },
  
  /** DELETE /payments/{payment_id} - Delete payment (pending only unless admin) */
  'payments.delete': {
    method: 'DELETE',
    path: '/payments/{payment_id}',
    auth: true,
  },
  
  // ==========================================================================
  // PAPS PAYMENTS
  // ==========================================================================
  
  /** GET /paps/{paps_id}/payments - Get payments for a PAPS */
  'payments.listForPaps': {
    method: 'GET',
    path: '/paps/{paps_id}/payments',
    auth: true,
  },
  
  /** POST /paps/{paps_id}/payments - Create payment for PAPS */
  'payments.create': {
    method: 'POST',
    path: '/paps/{paps_id}/payments',
    auth: true,
    validate: validatePaymentCreate,
  },
};
