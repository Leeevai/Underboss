#
# SPAP Routes - /spap (job applications and application media)
#

import uuid
import datetime
import FlaskSimpleAuth as fsa


def register_routes(app):
    """Register SPAP routes with the Flask app."""
    from database import db
    from mediator import get_media_handler, MediaType
    import model

    # Get media handler
    media_handler = get_media_handler(app)

    # ============================================
    # SPAP (APPLICATION) MANAGEMENT
    # ============================================

    # GET /paps/<paps_id>/applications - list all applications for a paps (owner/admin only)
    @app.get("/paps/<paps_id>/applications", authz="AUTH")
    def get_paps_applications(paps_id: str, auth: model.CurrentAuth):
        """Get all applications for a PAPS. Only paps owner or admin can view."""
        try:
            uuid.UUID(paps_id)
        except ValueError:
            return {"error": "Invalid PAPS ID format"}, 400

        # Get paps to check ownership
        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAPS not found"}, 404

        # Only owner or admin can view applications
        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized to view applications"}, 403

        applications = list(db.get_spaps_for_paps(paps_id=paps_id))
        return fsa.jsonify({"applications": applications, "count": len(applications)}), 200

    # GET /spap/my - get current user's applications
    @app.get("/spap/my", authz="AUTH")
    def get_my_applications(auth: model.CurrentAuth):
        """Get all applications submitted by the current user."""
        applications = list(db.get_spaps_by_applicant(applicant_id=auth.aid))
        return fsa.jsonify({"applications": applications, "count": len(applications)}), 200

    # POST /paps/<paps_id>/apply - apply to a paps
    @app.post("/paps/<paps_id>/apply", authz="AUTH")
    def apply_to_paps(
        paps_id: str,
        auth: model.CurrentAuth,
        message: str | None = None
    ):
        """Apply to a PAPS job posting. User cannot apply to their own paps."""
        try:
            uuid.UUID(paps_id)
        except ValueError:
            return {"error": "Invalid PAPS ID format"}, 400

        # Get paps
        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAPS not found"}, 404

        # Cannot apply to own paps
        if str(paps['owner_id']) == auth.aid:
            return {"error": "Cannot apply to your own PAPS"}, 403

        # Check if paps is published
        if paps['status'] != 'published':
            return {"error": "PAPS is not accepting applications"}, 400

        # Check if max_applicants reached
        current_count = db.get_paps_applications_count(paps_id=paps_id)
        if current_count >= paps['max_applicants']:
            return {"error": "Maximum number of applications reached"}, 400

        # Check if user already applied or was previously rejected
        existing = db.get_spap_by_paps_and_applicant(paps_id=paps_id, applicant_id=auth.aid)
        if existing:
            if existing['status'] == 'rejected':
                return {"error": "You were previously rejected from this PAPS and cannot reapply"}, 403
            return {"error": "You have already applied to this PAPS"}, 409

        # Create application
        spap_id = db.insert_spap(
            paps_id=paps_id,
            applicant_id=auth.aid,
            message=message.strip() if message else None
        )

        return fsa.jsonify({"spap_id": spap_id}), 201

    # GET /spap/<spap_id> - get application details
    @app.get("/spap/<spap_id>", authz="AUTH")
    def get_spap(spap_id: str, auth: model.CurrentAuth):
        """Get application details. Only applicant, paps owner, or admin can view."""
        try:
            uuid.UUID(spap_id)
        except ValueError:
            return {"error": "Invalid SPAP ID format"}, 400

        spap = db.get_spap_by_id(spap_id=spap_id)
        if not spap:
            return {"error": "Application not found"}, 404

        # Get paps to check ownership
        paps = db.get_paps_by_id_admin(id=spap['paps_id'])

        # Only applicant, paps owner, or admin can view
        is_applicant = str(spap['applicant_id']) == auth.aid
        is_owner = paps and str(paps['owner_id']) == auth.aid
        if not auth.is_admin and not is_applicant and not is_owner:
            return {"error": "Not authorized to view this application"}, 403

        return fsa.jsonify(spap), 200

    # DELETE /spap/<spap_id> - withdraw application (applicant only)
    @app.delete("/spap/<spap_id>", authz="AUTH")
    def withdraw_application(spap_id: str, auth: model.CurrentAuth):
        """Withdraw an application. Only the applicant can withdraw."""
        try:
            uuid.UUID(spap_id)
        except ValueError:
            return {"error": "Invalid SPAP ID format"}, 400

        spap = db.get_spap_by_id(spap_id=spap_id)
        if not spap:
            return {"error": "Application not found"}, 404

        # Only applicant can withdraw (or admin)
        if not auth.is_admin and str(spap['applicant_id']) != auth.aid:
            return {"error": "Not authorized to withdraw this application"}, 403

        # Cannot withdraw if already accepted or rejected
        if spap['status'] in ('accepted', 'rejected'):
            return {"error": f"Cannot withdraw application with status: {spap['status']}"}, 400

        # Delete media files from disk using MediaHandler
        media_list = list(db.get_spap_media(spap_id=spap_id))
        media_handler.delete_media_batch(MediaType.SPAP, media_list)

        # Delete application (cascades to media in DB)
        db.delete_spap(spap_id=spap_id)
        return "", 204

    # PUT /spap/<spap_id>/status - update application status (owner/admin only)
    @app.put("/spap/<spap_id>/status", authz="AUTH")
    def update_spap_status(spap_id: str, auth: model.CurrentAuth, status: str):
        """Update application status. Only paps owner or admin can update."""
        try:
            uuid.UUID(spap_id)
        except ValueError:
            return {"error": "Invalid SPAP ID format"}, 400

        fsa.checkVal(status in ('pending', 'accepted', 'rejected', 'withdrawn'),
                     "Invalid status. Must be: pending, accepted, rejected, withdrawn", 400)

        spap = db.get_spap_by_id(spap_id=spap_id)
        if not spap:
            return {"error": "Application not found"}, 404

        # Get paps to check ownership
        paps = db.get_paps_by_id_admin(id=spap['paps_id'])
        if not paps:
            return {"error": "PAPS not found"}, 404

        # Only paps owner or admin can update status
        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized to update this application"}, 403

        # Set timestamps based on status
        now = datetime.datetime.now(datetime.timezone.utc)
        reviewed_at = now if status in ('accepted', 'rejected') else None
        accepted_at = now if status == 'accepted' else None
        rejected_at = now if status == 'rejected' else None

        db.update_spap_status(
            spap_id=spap_id,
            status=status,
            reviewed_at=reviewed_at,
            accepted_at=accepted_at,
            rejected_at=rejected_at
        )

        return "", 204

    # ============================================
    # SPAP MEDIA MANAGEMENT
    # ============================================

    # GET /spap/<spap_id>/media - get all media for an application
    @app.get("/spap/<spap_id>/media", authz="AUTH")
    def get_spap_media(spap_id: str, auth: model.CurrentAuth):
        """Get all media for an application."""
        try:
            uuid.UUID(spap_id)
        except ValueError:
            return {"error": "Invalid SPAP ID format"}, 400

        spap = db.get_spap_by_id(spap_id=spap_id)
        if not spap:
            return {"error": "Application not found"}, 404

        # Check authorization (applicant, paps owner, or admin)
        paps = db.get_paps_by_id_admin(id=spap['paps_id'])
        is_applicant = str(spap['applicant_id']) == auth.aid
        is_owner = paps and str(paps['owner_id']) == auth.aid
        if not auth.is_admin and not is_applicant and not is_owner:
            return {"error": "Not authorized"}, 403

        media_list = list(db.get_spap_media(spap_id=spap_id))
        result = []
        for media in media_list:
            result.append({
                "media_id": media['media_id'],
                "media_url": f"/spap/media/{media['media_id']}",
                "media_type": media['media_type'],
                "file_size_bytes": media['file_size_bytes'],
                "mime_type": media['mime_type'],
                "display_order": media['display_order']
            })

        return fsa.jsonify({"spap_id": spap_id, "media_count": len(result), "media": result}), 200

    # POST /spap/<spap_id>/media - upload media to application
    @app.route("/spap/<spap_id>/media", methods=["POST"], authz="AUTH")
    def post_spap_media(spap_id: str, auth: model.CurrentAuth):
        """Upload media to an application. Only the applicant can upload."""
        from flask import request

        try:
            uuid.UUID(spap_id)
        except ValueError:
            return {"error": "Invalid SPAP ID format"}, 400

        spap = db.get_spap_by_id(spap_id=spap_id)
        if not spap:
            return {"error": "Application not found"}, 404

        # Only applicant can upload media
        if str(spap['applicant_id']) != auth.aid:
            return {"error": "Not authorized to upload media"}, 403

        # Cannot upload media if application is not pending
        if spap['status'] != 'pending':
            return {"error": "Cannot add media to non-pending application"}, 400

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
                file.filename, len(media_data), MediaType.SPAP
            )
            if not valid:
                fsa.checkVal(False, error, 400)

            # Store file using MediaHandler (with compression)
            result = media_handler.store_spap_media(media_data, ext, compress=True)
            if not result.success:
                fsa.checkVal(False, result.error, 500)

            display_order = db.get_next_spap_media_order(spap_id=spap_id)

            media_id = db.insert_spap_media(
                spap_id=spap_id,
                media_type=result.media_type,
                file_extension=result.file_extension,
                file_size_bytes=result.file_size,
                mime_type=result.mime_type,
                display_order=display_order
            )

            # Rename the file from temp media_id to actual media_id
            if result.media_id != media_id:
                old_path = result.filepath
                new_path = media_handler.get_directory(MediaType.SPAP) / f"{media_id}.{result.file_extension}"
                if old_path and old_path.exists():
                    old_path.rename(new_path)

            uploaded_media.append({
                "media_id": media_id,
                "media_url": f"/spap/media/{media_id}",
                "media_type": result.media_type,
                "file_size_bytes": result.file_size,
                "display_order": display_order
            })

        return fsa.jsonify({"uploaded_media": uploaded_media, "count": len(uploaded_media)}), 201

    # GET /spap/media/<media_id> - serve media file
    @app.get("/spap/media/<media_id>", authz="AUTH")
    def get_spap_media_file(media_id: str, auth: model.CurrentAuth):
        """Serve a SPAP media file."""
        from flask import send_file

        try:
            uuid.UUID(media_id)
        except ValueError:
            return {"error": "Invalid media ID format"}, 400

        media = db.get_spap_media_by_id(media_id=media_id)
        if not media:
            return {"error": "Media not found"}, 404

        # Check authorization
        spap = db.get_spap_by_id(spap_id=media['spap_id'])
        if not spap:
            return {"error": "Application not found"}, 404

        paps = db.get_paps_by_id_admin(id=spap['paps_id'])
        is_applicant = str(spap['applicant_id']) == auth.aid
        is_owner = paps and str(paps['owner_id']) == auth.aid
        if not auth.is_admin and not is_applicant and not is_owner:
            return {"error": "Not authorized"}, 403

        # Use MediaHandler to get file path safely
        db_media_id = media['media_id']
        ext = media['file_extension']
        
        filepath = media_handler.get_file_path(MediaType.SPAP, db_media_id, ext)
        if not filepath:
            return {"error": "Media file not found on disk"}, 404

        return send_file(filepath, mimetype=media['mime_type'] or media_handler.get_mime_type(ext))

    # DELETE /spap/media/<media_id> - delete media file
    @app.delete("/spap/media/<media_id>", authz="AUTH")
    def delete_spap_media_file(media_id: str, auth: model.CurrentAuth):
        """Delete a SPAP media file. Only applicant can delete."""
        try:
            uuid.UUID(media_id)
        except ValueError:
            return {"error": "Invalid media ID format"}, 400

        media = db.get_spap_media_by_id(media_id=media_id)
        if not media:
            return {"error": "Media not found"}, 404

        spap = db.get_spap_by_id(spap_id=media['spap_id'])
        if not spap:
            return {"error": "Application not found"}, 404

        # Only applicant can delete media (or admin)
        if not auth.is_admin and str(spap['applicant_id']) != auth.aid:
            return {"error": "Not authorized"}, 403

        # Cannot delete media if application is not pending
        if spap['status'] != 'pending':
            return {"error": "Cannot delete media from non-pending application"}, 400

        # Use media_id from database record for safety
        db_media_id = media['media_id']
        ext = media['file_extension']
        
        # Delete from database FIRST
        db.delete_spap_media(media_id=db_media_id)
        
        # Then delete file from disk using MediaHandler
        media_handler.delete_spap_media(db_media_id, ext)
        
        return "", 204
