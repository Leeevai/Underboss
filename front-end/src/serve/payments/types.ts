/**
 * Payments module - Types for payment management
 * 
 * @module serve/payments/types
 */

import type { UUID, ISODateTime, PaymentStatus, PaymentMethod, Currency } from '../common/types';

// =============================================================================
// PAYMENT ENTITY
// =============================================================================

/** 
 * Payment - List item 
 * 
 * @see GET /payments
 */
export interface Payment {
  payment_id: UUID;
  paps_id: UUID;
  payer_id: UUID;
  payee_id: UUID;
  amount: number;
  currency: Currency | string;
  status: PaymentStatus;
  payment_method: PaymentMethod | string | null;
  transaction_id: string | null;
  external_reference: string | null;
  created_at: ISODateTime;
  paid_at: ISODateTime | null;
  /** User's role in this payment: 'payer' or 'payee' */
  user_role?: 'payer' | 'payee';
}

/** 
 * Payment with full details 
 * 
 * @see GET /payments/{payment_id}
 */
export interface PaymentDetail extends Payment {
  // Same fields as Payment currently
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** GET /payments query params */
export interface PaymentListParams {
  role?: 'payer' | 'payee';
  status?: PaymentStatus;
}

/** 
 * POST /paps/{paps_id}/payments - Create payment
 * 
 * Supported currencies: USD, EUR, GBP, CAD, AUD, JPY, CNY
 * Payment methods: transfer, cash, check, crypto, paypal, stripe, other
 */
export interface PaymentCreateRequest {
  /** Worker receiving payment (required) */
  payee_id: UUID;
  /** Amount (required, > 0) */
  amount: number;
  /** Currency (default: 'USD') */
  currency?: Currency | string;
  /** Payment method */
  payment_method?: PaymentMethod | string;
}

/** 
 * PUT /payments/{payment_id}/status - Update payment status
 * 
 * Validation:
 * - Only payer or admin can update
 * - Cannot update completed/refunded/cancelled payments (except admin)
 * 
 * Side effects:
 * - If status set to "completed": sets paid_at timestamp
 */
export interface PaymentStatusUpdateRequest {
  /** New status: pending, processing, completed, failed, refunded, cancelled */
  status: PaymentStatus;
  /** External transaction ID */
  transaction_id?: string;
  /** External reference */
  external_reference?: string;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/** 
 * GET /payments response - User's payments 
 */
export interface PaymentMyResponse {
  payments: Payment[];
  sent: Payment[];
  received: Payment[];
  total_count: number;
}

/** 
 * GET /paps/{paps_id}/payments response 
 */
export interface PaymentListByPapsResponse {
  paps_id: UUID;
  payments: Payment[];
  count: number;
}

/** 
 * POST /paps/{paps_id}/payments response 
 */
export interface PaymentCreateResponse {
  payment_id: UUID;
}

// Legacy type aliases
export type PaymentListResponse = PaymentMyResponse;
export type PaymentUpdateRequest = PaymentStatusUpdateRequest;
