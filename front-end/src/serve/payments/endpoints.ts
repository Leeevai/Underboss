/**
 * Payments module - Endpoint definitions
 */

import type { HttpMethod } from '../common/types';
import { validatePaymentCreate, validatePaymentUpdate } from './validators';

export interface EndpointConfig {
  method: HttpMethod;
  path: string;
  auth: boolean;
  validate?: (data: any) => void;
}

export const paymentEndpoints: Record<string, EndpointConfig> = {
  // PAPS Payments
  'payments.listForPaps': {
    method: 'GET',
    path: '/paps/{paps_id}/payments',
    auth: true,
  },
  'payments.create': {
    method: 'POST',
    path: '/paps/{paps_id}/payments',
    auth: true,
    validate: validatePaymentCreate,
  },

  // Payment CRUD
  'payments.get': {
    method: 'GET',
    path: '/payments/{payment_id}',
    auth: true,
  },
  'payments.update': {
    method: 'PATCH',
    path: '/payments/{payment_id}',
    auth: true,
    validate: validatePaymentUpdate,
  },
  'payments.delete': {
    method: 'DELETE',
    path: '/payments/{payment_id}',
    auth: true,  // Admin only
  },

  // User payments
  'payments.my': {
    method: 'GET',
    path: '/user/payments',
    auth: true,
  },
};
