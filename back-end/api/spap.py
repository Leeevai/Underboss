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
    # HELPER FUNCTIONS
    # ============================================

    def create_chat_thread_for_spap(paps_id: str, spap_id: str, applicant_id: str, owner_id: str, paps_title: str = None, applicant_username: str = None):
        """Create a chat thread for a new SPAP, add participants, and send automated message."""
        thread_id = db.insert_chat_thread_for_spap(paps_id=paps_id, spap_id=spap_id)
        db.insert_chat_participant(thread_id=thread_id, user_id=applicant_id, role='applicant')
        db.insert_chat_participant(thread_id=thread_id, user_id=owner_id, role='owner')
        
        # Send automated system message about the application
        if paps_title and applicant_username:
            auto_message = f"{applicant_username} has applied to: {paps_title}"
        elif applicant_username:
            auto_message = f"{applicant_username} has applied to your posting"
        else:
            auto_message = "A new application has been submitted"
        
        db.insert_chat_message(
            thread_id=thread_id,
            sender_id='',  # Empty string for system message (converted to NULL in DB)
            content=auto_message,
            message_type='system',
            attachment_url=None
        )
        
        return thread_id

    def accept_application(spap: dict, paps: dict, auth: model.CurrentAuth):
        """
        Accept a SPAP application:
        1. Check if max_assignees is not reached
        2. Create ASAP
        3. Transfer chat thread from SPAP to ASAP
        4. Update SPAP status to 'accepted'
        5. If max_assignees reached, close PAPS and reject remaining SPAPs
        """
        paps_id = str(spap['paps_id'])
        applicant_id = str(spap['applicant_id'])
        owner_id = str(paps['owner_id'])
        spap_id = str(spap['id'])

        # Check current ASAP count
        current_asaps = db.get_asap_count_for_paps(paps_id=paps_id)
        max_assignees = paps.get('max_assignees', 1)

        if current_asaps >= max_assignees:
            return None, "Maximum number of assignees already reached"

        # Create ASAP
        asap_id = db.insert_asap(
            paps_id=paps_id,
            accepted_user_id=applicant_id
        )

        # Transfer chat thread from SPAP to ASAP
        chat_thread = db.get_chat_thread_by_spap(spap_id=spap_id)
        if chat_thread:
            db.transfer_chat_thread_to_asap(thread_id=chat_thread['thread_id'], asap_id=asap_id)
            # Update participant role from applicant to assignee
            db.insert_chat_participant(thread_id=chat_thread['thread_id'], user_id=applicant_id, role='assignee')
        else:
            # Create new chat thread for ASAP if none exists
            thread_id = db.insert_chat_thread_for_asap(paps_id=paps_id, asap_id=asap_id, thread_type='asap_discussion')
            db.insert_chat_participant(thread_id=thread_id, user_id=applicant_id, role='assignee')
            db.insert_chat_participant(thread_id=thread_id, user_id=owner_id, role='owner')

        # Update SPAP status to 'accepted' (keep record, don't delete)
        db.update_spap_status(spap_id=spap_id, status='accepted')

        # Check if we've reached max_assignees
        new_asap_count = current_asaps + 1
        if new_asap_count >= max_assignees:
            # Close the PAPS
            db.update_paps_status(paps_id=paps_id, status='closed')

            # Reject all remaining pending SPAPs (keep records)
            db.reject_pending_spaps_for_paps(paps_id=paps_id)

            # Create group chat if multiple assignees
            if max_assignees > 1:
                all_asaps = list(db.get_asaps_for_paps(paps_id=paps_id))
                if len(all_asaps) > 1:
                    group_thread_id = db.insert_chat_thread_for_asap(
                        paps_id=paps_id,
                        asap_id=asap_id,  # Link to the latest ASAP
                        thread_type='group_chat'
                    )
                    # Add owner as participant
                    db.insert_chat_participant(thread_id=group_thread_id, user_id=owner_id, role='owner')
                    # Add all assignees as participants
                    for a in all_asaps:
                        db.insert_chat_participant(
                            thread_id=group_thread_id,
                            user_id=str(a['accepted_user_id']),
                            role='assignee'
                        )

        return asap_id, None

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
        message: str | None = None,
        title: str | None = None,
        subtitle: str | None = None,
        proposed_payment: float | None = None,
        location_address: str | None = None,
        location_lat: float | None = None,
        location_lng: float | None = None,
        location_timezone: str | None = None
    ):
        """
        Apply to a PAPS job posting.
        - User cannot apply to their own paps
        - PAPS must be in 'open' status
        - Number of ASAPs must be less than max_assignees
        - Creates a chat thread between applicant and owner
        """
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

        # Check if paps is open (accepting applications)
        if paps['status'] not in ('open', 'published'):  # 'published' for backward compat
            return {"error": "PAPS is not accepting applications"}, 400

        # Check if max_assignees already reached
        current_asaps = db.get_asap_count_for_paps(paps_id=paps_id)
        if current_asaps >= paps.get('max_assignees', 1):
            return {"error": "Maximum number of assignees already reached"}, 400

        # Check if user already applied
        existing = db.get_spap_by_paps_and_applicant(paps_id=paps_id, applicant_id=auth.aid)
        if existing:
            return {"error": "You have already applied to this PAPS"}, 409

        # Check if user was already accepted (has ASAP)
        existing_asap = db.get_asap_by_paps_and_user(paps_id=paps_id, user_id=auth.aid)
        if existing_asap:
            return {"error": "You are already assigned to this PAPS"}, 409

        # Validate coordinates if provided
        if location_lat is not None or location_lng is not None:
            fsa.checkVal(location_lat is not None and location_lng is not None,
                         "Both lat and lng must be provided", 400)
            if location_lat is not None and location_lng is not None:
                fsa.checkVal(-90 <= location_lat <= 90, "Invalid latitude", 400)
                fsa.checkVal(-180 <= location_lng <= 180, "Invalid longitude", 400)

        # Validate proposed_payment if provided
        if proposed_payment is not None:
            fsa.checkVal(proposed_payment >= 0, "Proposed payment must be non-negative", 400)

        # Create application
        spap_id = db.insert_spap(
            paps_id=paps_id,
            applicant_id=auth.aid,
            message=message.strip() if message else None
        )

        # Transition PAPS from 'published' to 'open' when first application arrives
        if paps['status'] == 'published':
            db.update_paps_status(paps_id=paps_id, status='open')

        # Create chat thread for this application (with auto message)
        chat_thread_id = create_chat_thread_for_spap(
            paps_id=paps_id,
            spap_id=str(spap_id),
            applicant_id=auth.aid,
            owner_id=str(paps['owner_id']),
            paps_title=paps.get('title'),
            applicant_username=auth.login
        )

        return fsa.jsonify({
            "spap_id": str(spap_id),
            "chat_thread_id": chat_thread_id
        }), 201

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

        # Include chat thread info
        chat_thread = db.get_chat_thread_by_spap(spap_id=spap_id)
        if chat_thread:
            spap['chat_thread_id'] = chat_thread['thread_id']

        return fsa.jsonify(spap), 200

    # DELETE /spap/<spap_id> - withdraw application (applicant only)
    @app.delete("/spap/<spap_id>", authz="AUTH")
    def withdraw_application(spap_id: str, auth: model.CurrentAuth):
        """Withdraw an application. Only the applicant can withdraw. Sets status to 'withdrawn'."""
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

        # Cannot withdraw if already withdrawn
        if spap['status'] == 'withdrawn':
            return {"error": "Application already withdrawn"}, 400

        # Delete the chat thread associated with this SPAP
        chat_thread = db.get_chat_thread_by_spap(spap_id=spap_id)
        deleted_thread_id = None
        if chat_thread:
            deleted_thread_id = str(chat_thread['thread_id'])
            db.delete_chat_thread(thread_id=deleted_thread_id)

        # Update status to 'withdrawn' instead of deleting
        db.update_spap_status(spap_id=spap_id, status='withdrawn')
        return fsa.jsonify({"deleted_thread_id": deleted_thread_id}), 200

    # PUT /spap/<spap_id>/accept - accept an application (owner only)
    @app.put("/spap/<spap_id>/accept", authz="AUTH")
    def accept_spap(spap_id: str, auth: model.CurrentAuth):
        """
        Accept an application.
        - Creates an ASAP
        - Transfers chat thread to ASAP
        - Updates SPAP status to 'accepted'
        - If max_assignees reached: closes PAPS and rejects remaining SPAPs
        """
        try:
            uuid.UUID(spap_id)
        except ValueError:
            return {"error": "Invalid SPAP ID format"}, 400

        spap = db.get_spap_by_id(spap_id=spap_id)
        if not spap:
            return {"error": "Application not found"}, 404

        if spap['status'] != 'pending':
            return {"error": f"Cannot accept application with status: {spap['status']}"}, 400

        # Get paps to check ownership
        paps = db.get_paps_by_id_admin(id=spap['paps_id'])
        if not paps:
            return {"error": "PAPS not found"}, 404

        # Only paps owner or admin can accept
        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized to accept applications"}, 403

        # Accept the application
        asap_id, error = accept_application(spap, paps, auth)
        if error:
            return {"error": error}, 400

        return fsa.jsonify({"asap_id": asap_id}), 200

    # PUT /spap/<spap_id>/reject - reject an application (owner only)
    @app.put("/spap/<spap_id>/reject", authz="AUTH")
    def reject_spap(spap_id: str, auth: model.CurrentAuth):
        """
        Reject an application.
        - Updates SPAP status to 'rejected'
        - Deletes the chat thread associated with this application
        - Keeps the record for history
        """
        try:
            uuid.UUID(spap_id)
        except ValueError:
            return {"error": "Invalid SPAP ID format"}, 400

        spap = db.get_spap_by_id(spap_id=spap_id)
        if not spap:
            return {"error": "Application not found"}, 404

        if spap['status'] != 'pending':
            return {"error": f"Cannot reject application with status: {spap['status']}"}, 400

        # Get paps to check ownership
        paps = db.get_paps_by_id_admin(id=spap['paps_id'])
        if not paps:
            return {"error": "PAPS not found"}, 404

        # Only paps owner or admin can reject
        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized to reject applications"}, 403

        # Delete the chat thread associated with this SPAP
        chat_thread = db.get_chat_thread_by_spap(spap_id=spap_id)
        deleted_thread_id = None
        if chat_thread:
            deleted_thread_id = str(chat_thread['thread_id'])
            db.delete_chat_thread(thread_id=deleted_thread_id)

        # Update SPAP status to 'rejected'
        db.update_spap_status(spap_id=spap_id, status='rejected')

        return fsa.jsonify({"deleted_thread_id": deleted_thread_id}), 200

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
            media_url = media_handler.get_media_url(
                MediaType.SPAP,
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

            media_url = media_handler.get_media_url(
                MediaType.SPAP,
                media_id,
                result.file_extension or ""
            )
            uploaded_media.append({
                "media_id": media_id,
                "media_url": media_url,
                "media_type": result.media_type,
                "file_size_bytes": result.file_size,
                "display_order": display_order
            })

        return fsa.jsonify({"uploaded_media": uploaded_media, "count": len(uploaded_media)}), 201

    # Note: SPAP media files are now served statically via Flask at /media/spap/<media_id>.<ext>
    # No separate endpoint needed - Flask's static folder serves these directly

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
