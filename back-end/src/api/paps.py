#
# Paps Routes - /paps (job postings and media management)
#

import uuid
import datetime
import FlaskSimpleAuth as fsa

def register_routes(app):
    """Register paps routes with the Flask app."""
    from database import db
    from utils import ensure_media_dir, allowed_file, get_max_file_size, get_allowed_extensions, POST_MEDIA_DIR
    import model

    # Maximum paps for non-admin users (interest-matched)
    MAX_PAPS_FOR_USER = 1000

    # ============================================
    # PAPS LISTING AND SEARCH
    # ============================================

    # GET /paps - list all accessible paps with comprehensive search filters
    @app.get("/paps", authz="AUTH")
    def get_paps(
        status: str|None = None,
        category_id: str|None = None,
        lat: float|None = None,
        lng: float|None = None,
        max_distance: float|None = None,
        min_price: float|None = None,
        max_price: float|None = None,
        payment_type: str|None = None,
        owner_username: str|None = None,
        title_search: str|None = None
    ):
        """
        Get PAPS postings with optional filters.
        - Admins see ALL paps (no limit)
        - Non-admin users see up to 1000 paps, ranked by interest match score
        
        Filters:
        - status: draft, published, closed, cancelled
        - category_id: Filter by category UUID
        - lat, lng, max_distance: Location-based filtering
        - min_price, max_price: Payment amount range
        - payment_type: fixed, hourly, negotiable
        - owner_username: Search by owner username (partial match)
        - title_search: Search in title and description (partial match)
        """
        # Get current user
        try:
            user = app.get_user(required=False)
            if user:
                user_data = db.get_user_data(login=user)
                is_admin = user_data.get('is_admin', False) if user_data else False
                user_id = user_data.get('aid') if user_data else None
            else:
                is_admin = False
                user_id = None
        except Exception:
            is_admin = False
            user_id = None

        # Validate payment_type if provided
        if payment_type:
            fsa.checkVal(payment_type in ("fixed", "hourly", "negotiable"), 
                        "Invalid payment_type. Must be: fixed, hourly, negotiable", 400)

        # Admins see all paps
        if is_admin:
            paps = list(db.get_paps_admin_search(
                status=status,
                category_id=category_id,
                lat=lat,
                lng=lng,
                max_distance=max_distance,
                min_price=min_price,
                max_price=max_price,
                payment_type=payment_type,
                owner_username=owner_username,
                title_search=title_search
            ))
        elif user_id:
            # Non-admin users get interest-matched paps (up to MAX_PAPS_FOR_USER)
            paps = list(db.get_paps_by_interest_match(
                user_id=user_id,
                status=status,
                category_id=category_id,
                lat=lat,
                lng=lng,
                max_distance=max_distance,
                min_price=min_price,
                max_price=max_price,
                payment_type=payment_type,
                owner_username=owner_username,
                title_search=title_search,
                limit_count=MAX_PAPS_FOR_USER
            ))
        else:
            # Fallback (shouldn't happen with AUTH, but safety first)
            paps = list(db.get_paps_admin_search(
                status=status,
                category_id=category_id,
                lat=lat,
                lng=lng,
                max_distance=max_distance,
                min_price=min_price,
                max_price=max_price,
                payment_type=payment_type,
                owner_username=owner_username,
                title_search=title_search
            ))

        # For each paps, include categories (but NOT media - use separate endpoint)
        for pap in paps:
            pap['categories'] = list(db.get_paps_categories(paps_id=str(pap['id'])))

        return fsa.jsonify({"paps": paps, "total_count": len(paps)}), 200

    # POST /paps - create new paps
    @app.post("/paps", authz="AUTH")
    def post_paps(
        auth: model.CurrentAuth,
        title: str,
        description: str,
        payment_amount: float,
        payment_currency: str = "USD",
        payment_type: str = "fixed",
        max_applicants: int = 10,
        max_assignees: int = 1,
        subtitle: str|None = None,
        location_address: str|None = None,
        location_lat: float|None = None,
        location_lng: float|None = None,
        location_timezone: str|None = None,
        start_datetime: str|None = None,
        end_datetime: str|None = None,
        estimated_duration_minutes: int|None = None,
        is_public: bool = True,
        status: str = "draft",
        categories: list|None = None
    ):
        """Create a new PAPS job posting with optional categories."""
        # Validate required fields
        fsa.checkVal(len(title.strip()) >= 5, "Title must be at least 5 characters", 400)
        fsa.checkVal(len(description.strip()) >= 20, "Description must be at least 20 characters", 400)
        fsa.checkVal(payment_amount > 0, "Payment amount must be positive", 400)
        fsa.checkVal(payment_type in ("fixed", "hourly", "negotiable"), "Invalid payment type", 400)
        fsa.checkVal(max_applicants > 0 and max_applicants <= 100, "Max applicants must be 1-100", 400)
        fsa.checkVal(max_assignees > 0 and max_assignees <= max_applicants,
                    "Max assignees must be positive and not exceed max applicants", 400)
        fsa.checkVal(status in ('draft', 'published', 'closed', 'cancelled'), "Invalid status", 400)

        # Validate location if provided
        if location_lat is not None or location_lng is not None:
            fsa.checkVal(location_lat is not None and location_lng is not None,
                        "Both lat and lng must be provided", 400)
            fsa.checkVal(-90 <= location_lat <= 90, "Invalid latitude", 400)
            fsa.checkVal(-180 <= location_lng <= 180, "Invalid longitude", 400)

        # Validate dates if provided
        start_dt = None
        if start_datetime:
            try:
                start_dt = datetime.datetime.fromisoformat(start_datetime.replace('Z', '+00:00'))
            except ValueError:
                fsa.checkVal(False, "Invalid start_datetime format", 400)

        end_dt = None
        if end_datetime:
            try:
                end_dt = datetime.datetime.fromisoformat(end_datetime.replace('Z', '+00:00'))
                if start_dt and end_dt <= start_dt:
                    fsa.checkVal(False, "End datetime must be after start datetime", 400)
            except ValueError:
                fsa.checkVal(False, "Invalid end_datetime format", 400)

        if estimated_duration_minutes is not None:
            fsa.checkVal(estimated_duration_minutes > 0, "Duration must be positive", 400)

        # Insert the PAPS
        pid = db.insert_paps(
            owner_id=auth.aid,
            title=title.strip(),
            subtitle=subtitle.strip() if subtitle else None,
            description=description.strip(),
            status=status,
            location_address=location_address.strip() if location_address else None,
            location_lat=location_lat,
            location_lng=location_lng,
            location_timezone=location_timezone,
            start_datetime=start_dt,
            end_datetime=end_dt,
            estimated_duration_minutes=estimated_duration_minutes,
            payment_amount=payment_amount,
            payment_currency=payment_currency,
            payment_type=payment_type,
            max_applicants=max_applicants,
            max_assignees=max_assignees,
            is_public=is_public
        )

        # Add categories if provided
        if categories:
            for cat in categories:
                if isinstance(cat, dict):
                    category_id = cat.get('category_id')
                    is_primary = cat.get('is_primary', False)
                else:
                    category_id = cat
                    is_primary = False
                
                if category_id:
                    try:
                        db.insert_paps_category(paps_id=pid, category_id=category_id, is_primary=is_primary)
                    except Exception:
                        pass  # Category may not exist, skip silently

        return fsa.jsonify({"paps_id": pid}), 201

    # GET /paps/<paps_id> - get specific paps with full details
    @app.get("/paps/<paps_id>", authz="AUTH")
    def get_paps_id(paps_id: str):
        """Get a specific PAP by ID with full details including owner and categories.
        Media is NOT included - use GET /paps/<paps_id>/media instead."""
        try:
            uuid.UUID(paps_id)
        except ValueError:
            return {"error": "Invalid PAP ID format"}, 400

        # Check if user is authenticated
        try:
            user = app.get_user(required=False)
            if user:
                user_data = db.get_user_data(login=user)
                is_admin = user_data.get('is_admin', False) if user_data else False
                user_id = user_data.get('aid') if user_data else None
            else:
                is_admin = False
                user_id = None
        except Exception:
            is_admin = False
            user_id = None

        # Get paps with appropriate permissions
        if is_admin:
            paps = db.get_paps_by_id_admin(id=paps_id)
        elif user_id:
            paps = db.get_paps_by_id_for_user(id=paps_id, user_id=user_id)
        else:
            paps = db.get_paps_by_id_public(id=paps_id)

        if not paps:
            return {"error": "PAP not found or not accessible"}, 404

        # Enrich with categories (but NOT media - use separate endpoint)
        paps['categories'] = list(db.get_paps_categories(paps_id=paps_id))
        paps['comments_count'] = db.get_paps_comments_count(paps_id=paps_id)
        paps['applications_count'] = db.get_paps_applications_count(paps_id=paps_id)

        return fsa.jsonify(paps), 200

    # PUT /paps/<paps_id> - update paps
    @app.put("/paps/<paps_id>", authz="AUTH")
    def put_paps_id(paps_id: str, auth: model.CurrentAuth, **kwargs):
        """Update a PAP. Only owner or admin can update."""
        try:
            uuid.UUID(paps_id)
        except ValueError:
            return {"error": "Invalid PAP ID format"}, 400

        # Get the PAP to check ownership
        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAP not found"}, 404

        # Check permission: owner or admin
        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized to update this PAP"}, 403

        # Extract and validate all possible update fields
        updates = {}

        if 'title' in kwargs and kwargs['title'] is not None:
            fsa.checkVal(len(kwargs['title'].strip()) >= 5, "Title must be at least 5 characters", 400)
            updates['title'] = kwargs['title'].strip()

        if 'description' in kwargs and kwargs['description'] is not None:
            fsa.checkVal(len(kwargs['description'].strip()) >= 20, "Description must be at least 20 characters", 400)
            updates['description'] = kwargs['description'].strip()

        if 'payment_amount' in kwargs and kwargs['payment_amount'] is not None:
            fsa.checkVal(kwargs['payment_amount'] > 0, "Payment amount must be positive", 400)
            updates['payment_amount'] = kwargs['payment_amount']

        # Extract other fields from kwargs (with simple validation)
        simple_fields = ['subtitle', 'status', 'location_address', 'location_lat', 'location_lng', 
                        'location_timezone', 'start_datetime', 'end_datetime', 'estimated_duration_minutes',
                        'payment_currency', 'payment_type', 'max_applicants', 'max_assignees', 
                        'is_public', 'publish_at', 'expires_at']
        for field in simple_fields:
            if field in kwargs:
                updates[field] = kwargs[field]

        # Add all missing fields with None defaults to match SQL query signature
        all_fields = ['title', 'subtitle', 'description', 'status', 'location_address', 'location_lat', 
                      'location_lng', 'location_timezone', 'start_datetime', 'end_datetime', 
                      'estimated_duration_minutes', 'payment_amount', 'payment_currency', 'payment_type', 
                      'max_applicants', 'max_assignees', 'is_public', 'publish_at', 'expires_at']
        for field in all_fields:
            if field not in updates:
                updates[field] = None

        db.update_paps(id=paps_id, **updates)
        return "", 204

    # DELETE /paps/<paps_id> - soft delete paps
    @app.delete("/paps/<paps_id>", authz="AUTH")
    def delete_paps_id(paps_id: str, auth: model.CurrentAuth):
        """Soft delete a PAP. Only owner or admin can delete.
        Also deletes all associated media files from disk."""
        try:
            uuid.UUID(paps_id)
        except ValueError:
            return {"error": "Invalid PAP ID format"}, 400

        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAP not found"}, 404

        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized to delete this PAP"}, 403

        # Delete all media files from disk before deleting the paps
        media_list = list(db.get_paps_media(paps_id=paps_id))
        for media in media_list:
            ext = media.get('file_extension', 'png')
            filename = f"{media['media_id']}.{ext}"
            filepath = POST_MEDIA_DIR / filename
            if filepath.exists():
                filepath.unlink()

        db.delete_paps(id=paps_id)
        return "", 204

    # ============================================
    # PAPS CATEGORY MANAGEMENT
    # ============================================

    # POST /paps/<paps_id>/categories/<category_id> - add category to paps
    @app.post("/paps/<paps_id>/categories/<category_id>", authz="AUTH")
    def post_paps_category(paps_id: str, category_id: str, auth: model.CurrentAuth):
        """Add a category to a PAP. Only owner or admin can add categories."""
        try:
            uuid.UUID(paps_id)
        except ValueError:
            return {"error": "Invalid PAP ID format"}, 400

        try:
            uuid.UUID(category_id)
        except ValueError:
            return {"error": "Invalid category_id format"}, 400

        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAP not found"}, 404

        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized to modify this PAP"}, 403

        # Check if category exists
        cat = db.get_category_by_id(category_id=category_id)
        if not cat:
            return {"error": "Category not found"}, 404

        # Add category (insert_paps_category handles duplicates)
        try:
            db.insert_paps_category(paps_id=paps_id, category_id=category_id, is_primary=False)
        except Exception:
            # Category might already be associated
            pass

        return {"message": "Category added to PAP"}, 201

    # DELETE /paps/<paps_id>/categories/<category_id> - remove category from paps
    @app.delete("/paps/<paps_id>/categories/<category_id>", authz="AUTH")
    def delete_paps_category(paps_id: str, category_id: str, auth: model.CurrentAuth):
        """Remove a category from a PAP. Only owner or admin can remove categories."""
        try:
            uuid.UUID(paps_id)
        except ValueError:
            return {"error": "Invalid PAP ID format"}, 400

        try:
            uuid.UUID(category_id)
        except ValueError:
            return {"error": "Invalid category_id format"}, 400

        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAP not found"}, 404

        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized to modify this PAP"}, 403

        db.delete_paps_category(paps_id=paps_id, category_id=category_id)
        return "", 204

    # ============================================
    # PAPS MEDIA MANAGEMENT
    # Files are stored as [media_id].[extension] in POST_MEDIA_DIR
    # No filenames are exposed externally - only media_id
    # ============================================

    # GET /paps/<paps_id>/media - get all media for a paps
    @app.get("/paps/<paps_id>/media", authz="AUTH")
    def get_paps_media(paps_id: str):
        """Get all media associated with a PAP.
        Returns media metadata with URLs for retrieval via GET /paps/media/<media_id>"""
        try:
            uuid.UUID(paps_id)
        except ValueError:
            return {"error": "Invalid PAP ID format"}, 400

        # Check if user is authenticated and has access to this paps
        try:
            user = app.get_user(required=False)
            if user:
                user_data = db.get_user_data(login=user)
                is_admin = user_data.get('is_admin', False) if user_data else False
                user_id = user_data.get('aid') if user_data else None
            else:
                is_admin = False
                user_id = None
        except Exception:
            is_admin = False
            user_id = None

        # Check access to the paps
        if is_admin:
            paps = db.get_paps_by_id_admin(id=paps_id)
        elif user_id:
            paps = db.get_paps_by_id_for_user(id=paps_id, user_id=user_id)
        else:
            paps = db.get_paps_by_id_public(id=paps_id)

        if not paps:
            return {"error": "PAP not found or not accessible"}, 404

        # Get all media for this paps
        media_list = list(db.get_paps_media(paps_id=paps_id))
        
        # Build response with media URLs (only media_id exposed, not filenames)
        result = []
        for media in media_list:
            result.append({
                "media_id": media['media_id'],
                "media_url": f"/paps/media/{media['media_id']}",
                "media_type": media['media_type'],
                "file_size_bytes": media['file_size_bytes'],
                "mime_type": media['mime_type'],
                "display_order": media['display_order']
            })

        return fsa.jsonify({
            "paps_id": paps_id,
            "media_count": len(result),
            "media": result
        }), 200

    # POST /paps/<paps_id>/media - upload media files
    @app.route("/paps/<paps_id>/media", methods=["POST"], authz="AUTH")
    def post_paps_media(paps_id: str, auth: model.CurrentAuth):
        """Upload one or multiple media files for a PAP. Only owner or admin can upload.
        Files are stored as [media_id].[extension] - no original filenames exposed."""
        from flask import request
        ensure_media_dir()

        try:
            uuid.UUID(paps_id)
        except ValueError:
            return {"error": "Invalid PAP ID format"}, 400

        # Check ownership
        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAP not found"}, 404
        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized"}, 403

        uploaded_media = []

        # Handle multiple file uploads
        if "media" not in request.files:
            return {"error": "No media files provided"}, 400

        files = request.files.getlist("media")
        if not files:
            return {"error": "No files selected"}, 400

        for file in files:
            if not file.filename:
                continue

            # Extract extension
            ext = file.filename.rsplit(".", 1)[1].lower() if "." in file.filename else "png"

            # Validate file type
            fsa.checkVal(allowed_file(f"dummy.{ext}", app),
                         f"File type not allowed. Allowed: {', '.join(get_allowed_extensions(app))}", 415)

            # Read and validate file size
            media_data = file.read()
            file_size = len(media_data)
            max_size = get_max_file_size(app)
            fsa.checkVal(file_size <= max_size,
                         f"File too large (max {max_size / 1024 / 1024}MB)", 413)

            # Determine media type
            media_type = "image" if ext in {"jpg", "jpeg", "png", "gif", "webp"} else "video"

            # Get next display order
            display_order = db.get_next_paps_media_order(paps_id=paps_id)

            # Insert media record first to get the media_id
            media_id = db.insert_paps_media(
                paps_id=paps_id,
                media_type=media_type,
                file_extension=ext,
                file_size_bytes=file_size,
                mime_type=file.content_type or f"{media_type}/{ext}",
                display_order=display_order
            )

            # Save file using media_id as filename (no original filename exposed)
            filename = f"{media_id}.{ext}"
            filepath = POST_MEDIA_DIR / filename
            filepath.write_bytes(media_data)

            uploaded_media.append({
                "media_id": media_id,
                "media_url": f"/paps/media/{media_id}",
                "media_type": media_type,
                "file_size_bytes": file_size,
                "display_order": display_order
            })

        return fsa.jsonify({
            "uploaded_media": uploaded_media,
            "count": len(uploaded_media)
        }), 201

    # GET /paps/media/<media_id> - serve a media file by ID
    @app.get("/paps/media/<media_id>", authz="AUTH")
    def get_paps_media_file(media_id: str):
        """Serve a PAPS media file by its media_id.
        No filename is exposed - client receives file content directly."""
        from flask import send_file

        try:
            uuid.UUID(media_id)
        except ValueError:
            return {"error": "Invalid media ID format"}, 400

        # Get media metadata
        media = db.get_paps_media_by_id(media_id=media_id)
        if not media:
            return {"error": "Media not found"}, 404

        # Check if user has access to the paps this media belongs to
        try:
            user = app.get_user(required=False)
            if user:
                user_data = db.get_user_data(login=user)
                is_admin = user_data.get('is_admin', False) if user_data else False
                user_id = user_data.get('aid') if user_data else None
            else:
                is_admin = False
                user_id = None
        except Exception:
            is_admin = False
            user_id = None

        # Check access to the paps
        if is_admin:
            paps = db.get_paps_by_id_admin(id=media['paps_id'])
        elif user_id:
            paps = db.get_paps_by_id_for_user(id=media['paps_id'], user_id=user_id)
        else:
            paps = db.get_paps_by_id_public(id=media['paps_id'])

        if not paps:
            return {"error": "Media not accessible"}, 404

        # Build filepath from media_id and extension
        ext = media['file_extension']
        filename = f"{media_id}.{ext}"
        filepath = POST_MEDIA_DIR / filename

        if not filepath.exists():
            return {"error": "Media file not found on disk"}, 404

        return send_file(filepath, mimetype=media['mime_type'] or f"{media['media_type']}/{ext}")

    # DELETE /paps/media/<media_id> - delete a media file
    @app.delete("/paps/media/<media_id>", authz="AUTH")
    def delete_paps_media_file(media_id: str, auth: model.CurrentAuth):
        """Delete a PAPS media file. Only owner or admin can delete."""
        try:
            uuid.UUID(media_id)
        except ValueError:
            return {"error": "Invalid media ID format"}, 400

        # Get media metadata
        media = db.get_paps_media_by_id(media_id=media_id)
        if not media:
            return {"error": "Media not found"}, 404

        # Check ownership of the paps
        paps = db.get_paps_by_id_admin(id=media['paps_id'])
        if not paps:
            return {"error": "PAP not found"}, 404

        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized to delete this media"}, 403

        # Delete file from disk
        ext = media['file_extension']
        filename = f"{media_id}.{ext}"
        filepath = POST_MEDIA_DIR / filename
        if filepath.exists():
            filepath.unlink()

        # Delete from database
        db.delete_paps_media(media_id=media_id)

        return "", 204
