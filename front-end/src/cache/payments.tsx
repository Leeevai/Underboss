import { useCallback, useRef } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import type { Payment, PaymentMyResponse } from "../serve/payments";
import type { PaymentStatus } from "../serve/common/types";
import { serv } from "../serve/serv";

// =============================================================================
// BASE ATOMS
// =============================================================================

// All payments (combined)
const allPaymentsAtom = atom<Payment[]>([]);

// Payments I sent (as payer/owner)
const sentPaymentsAtom = atom<Payment[]>([]);

// Payments I received (as payee/worker)
const receivedPaymentsAtom = atom<Payment[]>([]);

// Loading and error states
const paymentsLoadingAtom = atom<boolean>(false);
const paymentsErrorAtom = atom<string | null>(null);

// =============================================================================
// DERIVED ATOMS - filtered by status
// =============================================================================

// Pending payments (need action)
export const pendingPaymentsAtom = atom((get) => {
  const all = get(allPaymentsAtom);
  return all.filter((p) => p.status === "pending" || p.status === "processing");
});

// Completed payments
export const completedPaymentsAtom = atom((get) => {
  const all = get(allPaymentsAtom);
  return all.filter((p) => p.status === "completed");
});

// Failed/cancelled payments
export const failedPaymentsAtom = atom((get) => {
  const all = get(allPaymentsAtom);
  return all.filter((p) => p.status === "failed" || p.status === "cancelled" || p.status === "refunded");
});

// Total amount received (completed only)
export const totalReceivedAtom = atom((get) => {
  const received = get(receivedPaymentsAtom);
  return received
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);
});

// Total amount sent (completed only)
export const totalSentAtom = atom((get) => {
  const sent = get(sentPaymentsAtom);
  return sent
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);
});

// =============================================================================
// HOOKS
// =============================================================================

export const usePayments = () => {
  const [allPayments, setAllPayments] = useAtom(allPaymentsAtom);
  const [sentPayments, setSentPayments] = useAtom(sentPaymentsAtom);
  const [receivedPayments, setReceivedPayments] = useAtom(receivedPaymentsAtom);
  const [loading, setLoading] = useAtom(paymentsLoadingAtom);
  const [error, setError] = useAtom(paymentsErrorAtom);
  
  // Use ref to prevent duplicate fetches
  const fetchingRef = useRef(false);

  const fetchPayments = useCallback(async (forceRefresh = false) => {
    if (fetchingRef.current && !forceRefresh) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const response: PaymentMyResponse = await serv("payments.my");
      setAllPayments(response.payments || []);
      setSentPayments(response.sent || []);
      setReceivedPayments(response.received || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load payments";
      setError(message);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [setAllPayments, setSentPayments, setReceivedPayments, setLoading, setError]);

  // Update payment status
  const updatePaymentStatus = useCallback(async (
    paymentId: string,
    status: PaymentStatus,
    transactionId?: string,
    externalReference?: string
  ) => {
    try {
      await serv("payments.updateStatus", {
        payment_id: paymentId,
        status,
        transaction_id: transactionId,
        external_reference: externalReference,
      });
      
      // Update in cache
      const updateStatus = (payments: Payment[]) =>
        payments.map((p) =>
          p.payment_id === paymentId
            ? { ...p, status, paid_at: status === "completed" ? new Date().toISOString() : p.paid_at }
            : p
        );
      
      setAllPayments(updateStatus);
      setSentPayments(updateStatus);
      setReceivedPayments(updateStatus);
    } catch (err) {
      throw err;
    }
  }, [setAllPayments, setSentPayments, setReceivedPayments]);

  // Get derived atoms
  const pending = useAtomValue(pendingPaymentsAtom);
  const completed = useAtomValue(completedPaymentsAtom);
  const failed = useAtomValue(failedPaymentsAtom);
  const totalReceived = useAtomValue(totalReceivedAtom);
  const totalSent = useAtomValue(totalSentAtom);

  return {
    // Raw data
    allPayments,
    sentPayments,
    receivedPayments,
    // Filtered
    pending,
    completed,
    failed,
    // Stats
    totalReceived,
    totalSent,
    // State
    loading,
    error,
    // Actions
    refresh: fetchPayments,
    updateStatus: updatePaymentStatus,
  };
};

// =============================================================================
// STANDALONE FUNCTIONS
// =============================================================================

// Get a specific payment detail
export const getPaymentDetail = async (paymentId: string) => {
  return await serv("payments.get", { payment_id: paymentId });
};

// Create a payment for a PAPS
export const createPayment = async (
  papsId: string,
  payeeId: string,
  amount: number,
  currency?: string,
  paymentMethod?: string
) => {
  return await serv("payments.create", {
    paps_id: papsId,
    payee_id: payeeId,
    amount,
    currency,
    payment_method: paymentMethod,
  });
};
