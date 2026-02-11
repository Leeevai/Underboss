#
# ASAP Routes - /asap (assigned jobs and assignment media)
#

import uuid
import datetime
import FlaskSimpleAuth as fsa


def register_routes(app):
    """Register ASAP routes with the Flask app."""
    from database import db
    from mediator import get_media_handler, MediaType
    import model

    # Get media handler
    media_handler = get_media_handler(app)

    # ============================================
    # ASAP (ASSIGNED JOB) MANAGEMENT
    # ============================================

    # GET /asap - list all assignments for current user
    @app.get("/asap", authz="AUTH")
    def get_my_asaps(auth: model.CurrentAuth):
        """Get all assignments for the current user (as assignee or owner)."""
        # Get assignments where user is the accepted worker
        as_worker = list(db.get_asaps_by_user(user_id=auth.aid))
        # Get assignments where user is the PAPS owner
        as_owner = list(db.get_asaps_by_owner(owner_id=auth.aid))

        return fsa.jsonify({
            "as_worker": as_worker,
            "as_owner": as_owner,
            "total_as_worker": len(as_worker),
            "total_as_owner": len(as_owner)
        }), 200

    # GET /paps/<paps_id>/assignments - list all assignments for a PAPS
    @app.get("/paps/<paps_id>/assignments", authz="AUTH")
    def get_paps_assignments(paps_id: str, auth: model.CurrentAuth):
        """Get all assignments for a PAPS. Only paps owner or admin can view."""
        try:
            uuid.UUID(paps_id)
        except ValueError:
            return {"error": "Invalid PAPS ID format"}, 400

        # Get paps to check ownership
        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAPS not found"}, 404

        # Only owner or admin can view all assignments
        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized to view assignments"}, 403

        assignments = list(db.get_asaps_for_paps(paps_id=paps_id))
        return fsa.jsonify({"assignments": assignments, "count": len(assignments)}), 200

    # GET /asap/<asap_id> - get assignment details
    @app.get("/asap/<asap_id>", authz="AUTH")
    def get_asap(asap_id: str, auth: model.CurrentAuth):
        """Get assignment details. Only accepted user, paps owner, or admin can view."""
        try:
            uuid.UUID(asap_id)
        except ValueError:
            return {"error": "Invalid ASAP ID format"}, 400

        asap = db.get_asap_by_id(asap_id=asap_id)
        if not asap:
            return {"error": "Assignment not found"}, 404

        # Only accepted user, paps owner, or admin can view
        is_worker = str(asap['accepted_user_id']) == auth.aid
        is_owner = str(asap['owner_id']) == auth.aid
        if not auth.is_admin and not is_worker and not is_owner:
            return {"error": "Not authorized to view this assignment"}, 403

        return fsa.jsonify(asap), 200

    # PUT /asap/<asap_id>/status - update assignment status
    @app.put("/asap/<asap_id>/status", authz="AUTH")
    def update_asap_status(asap_id: str, auth: model.CurrentAuth, status: str):
        """Update assignment status. Different permissions for different status changes."""
        try:
            uuid.UUID(asap_id)
        except ValueError:
            return {"error": "Invalid ASAP ID format"}, 400

        fsa.checkVal(status in ('active', 'in_progress', 'completed', 'cancelled', 'disputed'),
                     "Invalid status. Must be: active, in_progress, completed, cancelled, disputed", 400)

        asap = db.get_asap_by_id(asap_id=asap_id)
        if not asap:
            return {"error": "Assignment not found"}, 404

        is_worker = str(asap['accepted_user_id']) == auth.aid
        is_owner = str(asap['owner_id']) == auth.aid

        # Permission rules for status changes
        if status == 'in_progress':
            # Worker or owner can start
            if not auth.is_admin and not is_worker and not is_owner:
                return {"error": "Not authorized to start this assignment"}, 403
        elif status == 'completed':
            # Only owner can mark as completed (triggers payment/rating)
            if not auth.is_admin and not is_owner:
                return {"error": "Only the PAPS owner can mark as completed"}, 403
        elif status == 'cancelled':
            # Owner or admin can cancel
            if not auth.is_admin and not is_owner:
                return {"error": "Not authorized to cancel this assignment"}, 403
        elif status == 'disputed':
            # Either party can dispute
            if not auth.is_admin and not is_worker and not is_owner:
                return {"error": "Not authorized to dispute this assignment"}, 403
        elif status == 'active':
            # Only admin can revert to active
            if not auth.is_admin:
                return {"error": "Only admin can revert to active status"}, 403

        now = datetime.datetime.now(datetime.timezone.utc)
        started_at = now if status == 'in_progress' and asap['started_at'] is None else None
        completed_at = now if status == 'completed' else None

        db.update_asap_status(
            asap_id=asap_id,
            status=status,
            started_at=started_at,
            completed_at=completed_at
        )

        # NOTE: For completed status, payment is now handled by the dual-confirmation endpoint
        # The status endpoint is for admin use or other status changes

        return "", 204

    # POST /asap/<asap_id>/confirm - confirm ASAP completion (dual confirmation required)
    @app.post("/asap/<asap_id>/confirm", authz="AUTH")
    def confirm_asap_completion(asap_id: str, auth: model.CurrentAuth):
        """Confirm ASAP completion. Both worker and owner must confirm for completion."""
        try:
            uuid.UUID(asap_id)
        except ValueError:
            return {"error": "Invalid ASAP ID format"}, 400

        asap = db.get_asap_by_id(asap_id=asap_id)
        if not asap:
            return {"error": "Assignment not found"}, 404

        # Check if already completed
        if asap['status'] == 'completed':
            return {"error": "Assignment already completed"}, 400

        # Must be in_progress to confirm
        if asap['status'] != 'in_progress':
            return {"error": "Assignment must be in progress to confirm completion"}, 400

        is_worker = str(asap['accepted_user_id']) == auth.aid
        is_owner = str(asap['owner_id']) == auth.aid

        if not auth.is_admin and not is_worker and not is_owner:
            return {"error": "Not authorized to confirm this assignment"}, 403

        # Record the confirmation
        if is_worker:
            if asap.get('worker_confirmed'):
                return {"error": "You have already confirmed"}, 400
            db.confirm_asap_worker(asap_id=asap_id)
        elif is_owner:
            if asap.get('owner_confirmed'):
                return {"error": "You have already confirmed"}, 400
            db.confirm_asap_owner(asap_id=asap_id)

        # Try to complete (only succeeds if both have confirmed)
        now = datetime.datetime.now(datetime.timezone.utc)
        result = db.try_complete_asap(asap_id=asap_id, completed_at=now)

        if result:
            # Both confirmed - create payment record with proper calculation
            paps = db.get_paps_by_id_admin(id=asap['paps_id'])
            if paps and paps['payment_amount']:
                amount = paps['payment_amount']

                # Calculate hourly payment: hours worked * rate
                if paps.get('payment_type') == 'hourly' and asap.get('started_at'):
                    started_at = asap['started_at']
                    # Ensure both datetimes are timezone-aware for subtraction
                    if started_at.tzinfo is None:
                        started_at = started_at.replace(tzinfo=datetime.timezone.utc)
                    hours_worked = (now - started_at).total_seconds() / 3600
                    # Convert Decimal to float for multiplication
                    rate = float(paps['payment_amount'])
                    amount = max(0.01, round(hours_worked * rate, 2))  # Minimum $0.01

                db.insert_payment(
                    paps_id=asap['paps_id'],
                    payer_id=asap['owner_id'],
                    payee_id=asap['accepted_user_id'],
                    amount=amount,
                    currency=paps['payment_currency'] or 'USD',
                    payment_method=None
                )

            # Check if all ASAPs for this PAPS are completed
            paps_id = str(asap['paps_id'])
            incomplete_count = db.get_incomplete_asap_count(paps_id=paps_id)
            if incomplete_count == 0:
                # All assignments completed - mark PAPS as completed
                db.update_paps_status(paps_id=paps_id, status='completed')

            return fsa.jsonify({
                "status": "completed",
                "message": "Assignment completed successfully"
            }), 200
        else:
            # Waiting for other party
            other_party = "owner" if is_worker else "worker"
            return fsa.jsonify({
                "status": "pending_confirmation",
                "message": f"Confirmation recorded. Waiting for {other_party} to confirm."
            }), 200

    # DELETE /asap/<asap_id> - cancel/delete assignment (owner/admin only)
    @app.delete("/asap/<asap_id>", authz="AUTH")
    def delete_asap(asap_id: str, auth: model.CurrentAuth):
        """Delete an assignment. Only paps owner or admin can delete."""
        try:
            uuid.UUID(asap_id)
        except ValueError:
            return {"error": "Invalid ASAP ID format"}, 400

        asap = db.get_asap_by_id(asap_id=asap_id)
        if not asap:
            return {"error": "Assignment not found"}, 404

        # Only paps owner or admin can delete
        if not auth.is_admin and str(asap['owner_id']) != auth.aid:
            return {"error": "Not authorized to delete this assignment"}, 403

        # Cannot delete completed assignments
        if asap['status'] == 'completed':
            return {"error": "Cannot delete completed assignments"}, 400

        # Delete media files from disk
        media_list = list(db.get_asap_media(asap_id=asap_id))
        media_handler.delete_media_batch(MediaType.ASAP, media_list)

        # Delete the assignment (cascades to media, payments, chat threads in DB)
        db.delete_asap(asap_id=asap_id)

        return "", 204

    # ============================================
    # ASAP MEDIA MANAGEMENT
    # ============================================

    # GET /asap/<asap_id>/media - get all media for an assignment
    @app.get("/asap/<asap_id>/media", authz="AUTH")
    def get_asap_media(asap_id: str, auth: model.CurrentAuth):
        """Get all media for an assignment."""
        try:
            uuid.UUID(asap_id)
        except ValueError:
            return {"error": "Invalid ASAP ID format"}, 400

        asap = db.get_asap_by_id(asap_id=asap_id)
        if not asap:
            return {"error": "Assignment not found"}, 404

        # Check authorization (worker, owner, or admin)
        is_worker = str(asap['accepted_user_id']) == auth.aid
        is_owner = str(asap['owner_id']) == auth.aid
        if not auth.is_admin and not is_worker and not is_owner:
            return {"error": "Not authorized"}, 403

        media_list = list(db.get_asap_media(asap_id=asap_id))
        result = []
        for media in media_list:
            media_url = media_handler.get_media_url(
                MediaType.ASAP,
                media['media_id'],
                media['file_extension']
            )
            result.append({
                "media_id": media['media_id'],
                "media_url": media_url,
                "media_type": media['media_type'],
                "file_size_bytes": media['file_size_bytes'],
                "mime_type": media['mime_type'],
                "display_order": media['display_order']
            })

        return fsa.jsonify({"asap_id": asap_id, "media_count": len(result), "media": result}), 200

    # POST /asap/<asap_id>/media - upload media to assignment (owner only)
    @app.route("/asap/<asap_id>/media", methods=["POST"], authz="AUTH")
    def post_asap_media(asap_id: str, auth: model.CurrentAuth):
        """Upload media to an assignment. Only the paps owner can upload."""
        from flask import request

        try:
            uuid.UUID(asap_id)
        except ValueError:
            return {"error": "Invalid ASAP ID format"}, 400

        asap = db.get_asap_by_id(asap_id=asap_id)
        if not asap:
            return {"error": "Assignment not found"}, 404

        # Only paps owner can upload media (per business rules)
        if not auth.is_admin and str(asap['owner_id']) != auth.aid:
            return {"error": "Only the PAPS owner can upload media to assignments"}, 403

        uploaded_media = []

        if "media" not in request.files:
            return {"error": "No media files provided"}, 400

        files = request.files.getlist("media")
        if not files:
            return {"error": "No files selected"}, 400

        for file in files:
            if not file.filename:
                continue

            # Validate upload using MediaHandler
            media_data = file.read()
            valid, error, ext = media_handler.validate_upload(
                file.filename, len(media_data), MediaType.ASAP
            )
            if not valid:
                fsa.checkVal(False, error, 400)

            # Store file using MediaHandler (with compression)
            result = media_handler.store_asap_media(media_data, ext, compress=True)
            if not result.success:
                fsa.checkVal(False, result.error, 500)

            display_order = db.get_next_asap_media_order(asap_id=asap_id)

            media_id = db.insert_asap_media(
                asap_id=asap_id,
                media_type=result.media_type,
                file_extension=result.file_extension,
                file_size_bytes=result.file_size,
                mime_type=result.mime_type,
                display_order=display_order
            )

            # Rename the file from temp media_id to actual media_id
            if result.media_id != media_id:
                old_path = result.filepath
                new_path = media_handler.get_directory(MediaType.ASAP) / f"{media_id}.{result.file_extension}"
                if old_path and old_path.exists():
                    old_path.rename(new_path)

            uploaded_media.append({
                "media_id": media_id,
                "media_url": f"/asap/media/{media_id}",
                "media_type": result.media_type,
                "file_size_bytes": result.file_size,
                "display_order": display_order
            })

        return fsa.jsonify({"uploaded_media": uploaded_media, "count": len(uploaded_media)}), 201

    # Note: ASAP media files are now served statically via Flask at /media/asap/<media_id>.<ext>
    # No separate endpoint needed - Flask's static folder serves these directly

    # DELETE /asap/media/<media_id> - delete media file (owner only)
    @app.delete("/asap/media/<media_id>", authz="AUTH")
    def delete_asap_media_file(media_id: str, auth: model.CurrentAuth):
        """Delete an ASAP media file. Only paps owner can delete."""
        try:
            uuid.UUID(media_id)
        except ValueError:
            return {"error": "Invalid media ID format"}, 400

        media = db.get_asap_media_by_id(media_id=media_id)
        if not media:
            return {"error": "Media not found"}, 404

        asap = db.get_asap_by_id(asap_id=media['asap_id'])
        if not asap:
            return {"error": "Assignment not found"}, 404

        # Only paps owner can delete media (or admin)
        if not auth.is_admin and str(asap['owner_id']) != auth.aid:
            return {"error": "Not authorized"}, 403

        # Use media_id from database record for safety
        db_media_id = media['media_id']
        ext = media['file_extension']

        # Delete from database FIRST
        db.delete_asap_media(media_id=db_media_id)

        # Then delete file from disk using MediaHandler
        media_handler.delete_asap_media(db_media_id, ext)

        return "", 204
