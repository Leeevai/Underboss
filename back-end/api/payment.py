#
# Payment Routes - /payment (payment management)
#

import uuid
import datetime
import FlaskSimpleAuth as fsa


def register_routes(app):
    """Register Payment routes with the Flask app."""
    from database import db
    import model

    # ============================================
    # PAYMENT MANAGEMENT
    # ============================================

    # GET /payments - list all payments for current user
    @app.get("/payments", authz="AUTH")
    def get_my_payments(auth: model.CurrentAuth):
        """Get all payments where the current user is payer or payee."""
        payments = list(db.get_payments_by_user(user_id=auth.aid))
        
        # Separate into sent and received
        sent = [p for p in payments if p.get('user_role') == 'payer']
        received = [p for p in payments if p.get('user_role') == 'payee']
        
        return fsa.jsonify({
            "payments": payments,
            "sent": sent,
            "received": received,
            "total_count": len(payments)
        }), 200

    # GET /payments/<payment_id> - get payment details
    @app.get("/payments/<payment_id>", authz="AUTH")
    def get_payment(payment_id: str, auth: model.CurrentAuth):
        """Get payment details. Only payer, payee, or admin can view."""
        try:
            uuid.UUID(payment_id)
        except ValueError:
            return {"error": "Invalid payment ID format"}, 400

        payment = db.get_payment_by_id(payment_id=payment_id)
        if not payment:
            return {"error": "Payment not found"}, 404

        # Only payer, payee, or admin can view
        is_payer = str(payment['payer_id']) == auth.aid
        is_payee = str(payment['payee_id']) == auth.aid
        if not auth.is_admin and not is_payer and not is_payee:
            return {"error": "Not authorized to view this payment"}, 403

        return fsa.jsonify(payment), 200

    # GET /asap/<asap_id>/payments - get payments for an assignment
    @app.get("/asap/<asap_id>/payments", authz="AUTH")
    def get_asap_payments(asap_id: str, auth: model.CurrentAuth):
        """Get all payments for an assignment."""
        try:
            uuid.UUID(asap_id)
        except ValueError:
            return {"error": "Invalid ASAP ID format"}, 400

        asap = db.get_asap_by_id(asap_id=asap_id)
        if not asap:
            return {"error": "Assignment not found"}, 404

        # Only worker, owner, or admin can view
        is_worker = str(asap['accepted_user_id']) == auth.aid
        is_owner = str(asap['owner_id']) == auth.aid
        if not auth.is_admin and not is_worker and not is_owner:
            return {"error": "Not authorized"}, 403

        payments = list(db.get_payments_for_asap(asap_id=asap_id))
        return fsa.jsonify({"asap_id": asap_id, "payments": payments, "count": len(payments)}), 200

    # PUT /payments/<payment_id>/status - update payment status
    @app.put("/payments/<payment_id>/status", authz="AUTH")
    def update_payment_status(
        payment_id: str,
        auth: model.CurrentAuth,
        status: str,
        transaction_id: str | None = None,
        external_reference: str | None = None
    ):
        """Update payment status. Only payer (or admin) can update."""
        try:
            uuid.UUID(payment_id)
        except ValueError:
            return {"error": "Invalid payment ID format"}, 400

        fsa.checkVal(status in ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'),
                    "Invalid status", 400)

        payment = db.get_payment_by_id(payment_id=payment_id)
        if not payment:
            return {"error": "Payment not found"}, 404

        # Only payer or admin can update payment status
        is_payer = str(payment['payer_id']) == auth.aid
        if not auth.is_admin and not is_payer:
            return {"error": "Only the payer or admin can update payment status"}, 403

        # Cannot update already completed/refunded/cancelled payments (except admin)
        if not auth.is_admin and payment['status'] in ('completed', 'refunded', 'cancelled'):
            return {"error": f"Cannot update payment with status: {payment['status']}"}, 400

        paid_at = None
        if status == 'completed':
            paid_at = datetime.datetime.now(datetime.timezone.utc)

        db.update_payment_status(
            payment_id=payment_id,
            status=status,
            paid_at=paid_at,
            transaction_id=transaction_id,
            external_reference=external_reference
        )

        return "", 204

    # POST /asap/<asap_id>/payments - create a new payment (for partial/milestone payments)
    @app.post("/asap/<asap_id>/payments", authz="AUTH")
    def create_payment(
        asap_id: str,
        auth: model.CurrentAuth,
        amount: float,
        currency: str = "USD",
        payment_method: str | None = None
    ):
        """Create a new payment for an assignment. Only the paps owner can create."""
        try:
            uuid.UUID(asap_id)
        except ValueError:
            return {"error": "Invalid ASAP ID format"}, 400

        fsa.checkVal(amount > 0, "Amount must be positive", 400)
        fsa.checkVal(currency in ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY'),
                    "Invalid currency", 400)
        if payment_method:
            fsa.checkVal(payment_method in ('transfer', 'cash', 'check', 'crypto', 'paypal', 'stripe', 'other'),
                        "Invalid payment method", 400)

        asap = db.get_asap_by_id(asap_id=asap_id)
        if not asap:
            return {"error": "Assignment not found"}, 404

        # Only the paps owner can create payments
        if not auth.is_admin and str(asap['owner_id']) != auth.aid:
            return {"error": "Only the PAPS owner can create payments"}, 403

        payment_id = db.insert_payment(
            asap_id=asap_id,
            payer_id=asap['owner_id'],
            payee_id=asap['accepted_user_id'],
            amount=amount,
            currency=currency,
            payment_method=payment_method
        )

        return fsa.jsonify({"payment_id": payment_id}), 201

    # DELETE /payments/<payment_id> - cancel/delete a pending payment
    @app.delete("/payments/<payment_id>", authz="AUTH")
    def delete_payment(payment_id: str, auth: model.CurrentAuth):
        """Delete a pending payment. Only payer or admin can delete."""
        try:
            uuid.UUID(payment_id)
        except ValueError:
            return {"error": "Invalid payment ID format"}, 400

        payment = db.get_payment_by_id(payment_id=payment_id)
        if not payment:
            return {"error": "Payment not found"}, 404

        # Only payer or admin can delete
        is_payer = str(payment['payer_id']) == auth.aid
        if not auth.is_admin and not is_payer:
            return {"error": "Not authorized"}, 403

        # Can only delete pending payments (or admin can delete any)
        if not auth.is_admin and payment['status'] != 'pending':
            return {"error": "Can only delete pending payments"}, 400

        db.delete_payment(payment_id=payment_id)
        return "", 204
