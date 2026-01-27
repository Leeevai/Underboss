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

    # PUT /asap/<asap_id> - update assignment details (owner only)
    @app.put("/asap/<asap_id>", authz="AUTH")
    def update_asap(
        asap_id: str,
        auth: model.CurrentAuth,
        title: str | None = None,
        subtitle: str | None = None,
        location_address: str | None = None,
        location_lat: float | None = None,
        location_lng: float | None = None,
        location_timezone: str | None = None,
        due_at: str | None = None
    ):
        """Update assignment details. Only paps owner or admin can update."""
        try:
            uuid.UUID(asap_id)
        except ValueError:
            return {"error": "Invalid ASAP ID format"}, 400

        asap = db.get_asap_by_id(asap_id=asap_id)
        if not asap:
            return {"error": "Assignment not found"}, 404

        # Only paps owner or admin can update
        if not auth.is_admin and str(asap['owner_id']) != auth.aid:
            return {"error": "Not authorized to update this assignment"}, 403

        # Validate coordinates if provided
        if location_lat is not None or location_lng is not None:
            fsa.checkVal(location_lat is not None and location_lng is not None,
                        "Both lat and lng must be provided", 400)
            fsa.checkVal(-90 <= location_lat <= 90, "Invalid latitude", 400)
            fsa.checkVal(-180 <= location_lng <= 180, "Invalid longitude", 400)

        # Parse due_at if provided
        due_dt = None
        if due_at:
            try:
                due_dt = datetime.datetime.fromisoformat(due_at.replace('Z', '+00:00'))
            except ValueError:
                fsa.checkVal(False, "Invalid due_at format", 400)

        db.update_asap(
            asap_id=asap_id,
            title=title,
            subtitle=subtitle,
            location_address=location_address,
            location_lat=location_lat,
            location_lng=location_lng,
            location_timezone=location_timezone,
            due_at=due_dt
        )

        return "", 204

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
        # Set expiration 30 days after completion
        expires_at = (now + datetime.timedelta(days=30)) if status == 'completed' else None

        db.update_asap_status(
            asap_id=asap_id,
            status=status,
            started_at=started_at,
            completed_at=completed_at,
            expires_at=expires_at
        )

        # If completed, create payment record
        if status == 'completed':
            paps = db.get_paps_by_id_admin(id=asap['paps_id'])
            if paps and paps['payment_amount']:
                db.insert_payment(
                    asap_id=asap_id,
                    payer_id=asap['owner_id'],
                    payee_id=asap['accepted_user_id'],
                    amount=paps['payment_amount'],
                    currency=paps['payment_currency'] or 'USD',
                    payment_method=None
                )

        return "", 204

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
            result.append({
                "media_id": media['media_id'],
                "media_url": f"/asap/media/{media['media_id']}",
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

    # GET /asap/media/<media_id> - serve media file
    @app.get("/asap/media/<media_id>", authz="AUTH")
    def get_asap_media_file(media_id: str, auth: model.CurrentAuth):
        """Serve an ASAP media file."""
        from flask import send_file

        try:
            uuid.UUID(media_id)
        except ValueError:
            return {"error": "Invalid media ID format"}, 400

        media = db.get_asap_media_by_id(media_id=media_id)
        if not media:
            return {"error": "Media not found"}, 404

        # Check authorization
        asap = db.get_asap_by_id(asap_id=media['asap_id'])
        if not asap:
            return {"error": "Assignment not found"}, 404

        is_worker = str(asap['accepted_user_id']) == auth.aid
        is_owner = str(asap['owner_id']) == auth.aid
        if not auth.is_admin and not is_worker and not is_owner:
            return {"error": "Not authorized"}, 403

        # Use MediaHandler to get file path safely
        db_media_id = media['media_id']
        ext = media['file_extension']
        
        filepath = media_handler.get_file_path(MediaType.ASAP, db_media_id, ext)
        if not filepath:
            return {"error": "Media file not found on disk"}, 404

        return send_file(filepath, mimetype=media['mime_type'] or media_handler.get_mime_type(ext))

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
