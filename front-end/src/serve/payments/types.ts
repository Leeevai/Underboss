/**
 * Payments module - Types for payment management
 */

import type { UUID, ISODateTime, PaymentStatus } from '../common/types';

// =============================================================================
// PAYMENT ENTITY
// =============================================================================

/** Payment - List item */
export interface Payment {
  payment_id: UUID;
  paps_id: UUID;
  paps_title: string;
  payer_id: UUID;
  payer_username: string;
  payee_id: UUID;
  payee_username: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string | null;
  transaction_id: string | null;
  created_at: ISODateTime;
  updated_at?: ISODateTime;
  completed_at: ISODateTime | null;
}

/** Payment with full details */
export interface PaymentDetail extends Payment {
  payer_email: string;
  payee_email: string;
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** GET /user/payments params */
export interface PaymentListParams {
  role?: 'payer' | 'payee';
  status?: PaymentStatus;
}

/** POST /paps/{id}/payments */
export interface PaymentCreateRequest {
  payee_id: UUID;
  amount: number;
  currency?: string;
  payment_method?: string;
  transaction_id?: string;
}

/** PATCH /payments/{id} */
export interface PaymentUpdateRequest {
  status?: PaymentStatus;
  payment_method?: string;
  transaction_id?: string;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** GET /paps/{id}/payments response */
export interface PaymentListResponse {
  payments: Payment[];
}

/** POST /paps/{id}/payments response */
export interface PaymentCreateResponse {
  payment_id: UUID;
}
