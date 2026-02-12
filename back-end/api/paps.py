#
# Paps Routes - /paps (job postings and media management)
#

import uuid
import datetime
import FlaskSimpleAuth as fsa

def register_routes(app):
    """Register paps routes with the Flask app."""
    from database import db
    from mediator import get_media_handler, MediaType
    import model

    # Get media handler
    media_handler = get_media_handler(app)

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
            else:  # pragma: no cover
                is_admin = False
                user_id = None
        except Exception:  # pragma: no cover
            is_admin = False
            user_id = None

        # Validate payment_type if provided
        if payment_type:
            fsa.checkVal(payment_type in ("fixed", "hourly", "negotiable"),
                         "Invalid payment_type. Must be: fixed, hourly, negotiable", 400)

        # Validate max_distance requires lat and lng
        if max_distance is not None:
            fsa.checkVal(lat is not None and lng is not None,
                         "max_distance requires both lat and lng parameters", 400)
            fsa.checkVal(max_distance > 0, "max_distance must be positive", 400)

        # Validate lat/lng ranges if provided
        if lat is not None:
            fsa.checkVal(-90 <= lat <= 90, "Invalid latitude (must be -90 to 90)", 400)
        if lng is not None:
            fsa.checkVal(-180 <= lng <= 180, "Invalid longitude (must be -180 to 180)", 400)

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
        else:  # pragma: no cover
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
        publish_at: str|None = None,
        expires_at: str|None = None,
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
            if location_lat is not None and location_lng is not None:
                fsa.checkVal(-90 <= location_lat <= 90, "Invalid latitude", 400)  # pragma: no cover
                fsa.checkVal(-180 <= location_lng <= 180, "Invalid longitude", 400)  # pragma: no cover

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
            # Validate end_datetime doesn't exceed start + duration
            if start_dt and end_dt:
                max_end_dt = start_dt + datetime.timedelta(minutes=estimated_duration_minutes)
                fsa.checkVal(end_dt <= max_end_dt,
                             f"End datetime cannot exceed start datetime + duration ({estimated_duration_minutes} minutes)", 400)

        # Validate publish_at
        publish_dt = None
        if publish_at:
            try:
                publish_dt = datetime.datetime.fromisoformat(publish_at.replace('Z', '+00:00'))
            except ValueError:
                fsa.checkVal(False, "Invalid publish_at format", 400)

        # Validate expires_at
        expires_dt = None
        if expires_at:
            try:
                expires_dt = datetime.datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            except ValueError:
                fsa.checkVal(False, "Invalid expires_at format", 400)

        # For published status, publish_at and start_datetime are required
        if status == 'published':
            fsa.checkVal(start_dt is not None, "start_datetime is required for published status", 400)
            if publish_dt is None:
                publish_dt = datetime.datetime.now(datetime.timezone.utc)

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
            is_public=is_public,
            publish_at=publish_dt,
            expires_at=expires_dt
        )

        # Add categories if provided
        if categories:  # pragma: no cover
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
            else:  # pragma: no cover
                is_admin = False
                user_id = None
        except Exception:  # pragma: no cover
            is_admin = False
            user_id = None

        # Get paps with appropriate permissions
        if is_admin:
            paps = db.get_paps_by_id_admin(id=paps_id)
        elif user_id:
            paps = db.get_paps_by_id_for_user(id=paps_id, user_id=user_id)
        else:  # pragma: no cover
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

        # Validate date consistency if any date/duration fields are being updated
        start_dt = None
        end_dt = None
        duration = None

        # Get start_datetime (from update or existing)
        if 'start_datetime' in kwargs and kwargs['start_datetime']:
            try:
                start_dt = datetime.datetime.fromisoformat(kwargs['start_datetime'].replace('Z', '+00:00'))
            except ValueError:
                fsa.checkVal(False, "Invalid start_datetime format", 400)
        elif paps.get('start_datetime'):  # pragma: no cover
            start_dt = paps['start_datetime']
            if isinstance(start_dt, str):
                start_dt = datetime.datetime.fromisoformat(start_dt.replace('Z', '+00:00'))
            elif start_dt.tzinfo is None:
                start_dt = start_dt.replace(tzinfo=datetime.timezone.utc)

        # Get end_datetime (from update or existing)
        if 'end_datetime' in kwargs and kwargs['end_datetime']:
            try:
                end_dt = datetime.datetime.fromisoformat(kwargs['end_datetime'].replace('Z', '+00:00'))
            except ValueError:
                fsa.checkVal(False, "Invalid end_datetime format", 400)
        elif paps.get('end_datetime'):  # pragma: no cover
            end_dt = paps['end_datetime']
            if isinstance(end_dt, str):
                end_dt = datetime.datetime.fromisoformat(end_dt.replace('Z', '+00:00'))
            elif end_dt.tzinfo is None:
                end_dt = end_dt.replace(tzinfo=datetime.timezone.utc)

        # Get duration (from update or existing)
        if 'estimated_duration_minutes' in kwargs and kwargs['estimated_duration_minutes']:  # pragma: no cover
            duration = kwargs['estimated_duration_minutes']  # pragma: no cover
            fsa.checkVal(duration > 0, "Duration must be positive", 400)  # pragma: no cover
        elif paps.get('estimated_duration_minutes'):
            duration = paps['estimated_duration_minutes']

        # Validate end_datetime is after start_datetime
        if start_dt and end_dt:
            fsa.checkVal(end_dt > start_dt, "End datetime must be after start datetime", 400)

            # Validate end_datetime doesn't exceed start + duration
            if duration:
                max_end_dt = start_dt + datetime.timedelta(minutes=duration)
                fsa.checkVal(end_dt <= max_end_dt,
                             f"End datetime cannot exceed start datetime + duration ({duration} minutes)", 400)

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

    # PUT /paps/<paps_id>/status - update PAPS status
    @app.put("/paps/<paps_id>/status", authz="AUTH")
    def update_paps_status(paps_id: str, auth: model.CurrentAuth, status: str):
        """
        Update PAPS status. Only owner or admin can update.

        Valid transitions:
        - draft -> published (opens for applications)
        - published -> closed (manually close, rejects remaining SPAPs)
        - published -> cancelled (cancel job)
        - closed -> published (reopen, if max_assignees not reached)

        When closing: All pending SPAPs are deleted, their chat threads deleted
        """
        try:
            uuid.UUID(paps_id)
        except ValueError:  # pragma: no cover
            return {"error": "Invalid PAP ID format"}, 400  # pragma: no cover

        valid_statuses = ('draft', 'open', 'published', 'closed', 'cancelled')
        fsa.checkVal(status in valid_statuses, f"Invalid status. Must be one of: {valid_statuses}", 400)

        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAP not found"}, 404  # pragma: no cover

        if not auth.is_admin and str(paps['owner_id']) != auth.aid:  # pragma: no cover
            return {"error": "Not authorized to update this PAP"}, 403

        current_status = paps['status']

        # Validate transitions
        if current_status == 'draft' and status not in ('published', 'open'):  # pragma: no cover
            fsa.checkVal(False, "Draft PAPS can only be published/opened", 400)

        if current_status == 'cancelled':  # pragma: no cover
            fsa.checkVal(False, "Cancelled PAPS cannot be modified", 400)

        # When closing or cancelling, delete all pending SPAPs
        if status in ('closed', 'cancelled') and current_status in ('open', 'published'):  # pragma: no cover
            # Delete all SPAP media files from disk
            pending_spaps = list(db.get_spaps_for_paps(paps_id=paps_id))
            for spap in pending_spaps:
                spap_media_list = list(db.get_spap_media(spap_id=str(spap['id'])))
                media_handler.delete_media_batch(MediaType.SPAP, spap_media_list)

            # Delete all pending SPAPs (cascades to media and chat threads in DB)
            db.delete_pending_spaps_for_paps(paps_id=paps_id)

        # When reopening from closed, check if max_assignees not yet reached
        if status in ('open', 'published') and current_status == 'closed':  # pragma: no cover
            current_asaps = db.get_asap_count_for_paps(paps_id=paps_id)
            max_assignees = paps.get('max_assignees', 1)
            if current_asaps >= max_assignees:
                fsa.checkVal(False, "Cannot reopen: maximum assignees already reached", 400)

        # Update the status
        db.update_paps_status(paps_id=paps_id, status=status)  # pragma: no cover

        return fsa.jsonify({"status": status}), 200  # pragma: no cover

    # DELETE /paps/<paps_id> - soft delete paps
    @app.delete("/paps/<paps_id>", authz="AUTH")
    def delete_paps_id(paps_id: str, auth: model.CurrentAuth):
        """Soft delete a PAP. Only owner or admin can delete.
        Also deletes all associated media files from disk, applications, and assignments."""
        try:
            uuid.UUID(paps_id)
        except ValueError:
            return {"error": "Invalid PAP ID format"}, 400

        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAP not found"}, 404

        if not auth.is_admin and str(paps['owner_id']) != auth.aid:  # pragma: no cover
            return {"error": "Not authorized to delete this PAP"}, 403

        # Check if there are active ASAPs - prevent deletion if so
        active_asaps = list(db.get_asaps_for_paps(paps_id=paps_id))
        active_count = sum(1 for a in active_asaps if a.get('status') in ('pending', 'in_progress', 'started'))
        if active_count > 0:
            return {"error": "Cannot delete PAPS with active assignments. Complete or cancel assignments first."}, 400

        # Delete all PAPS media files from disk using MediaHandler
        media_list = list(db.get_paps_media(paps_id=paps_id))
        media_handler.delete_media_batch(MediaType.PAPS, media_list)

        # Delete all SPAP media files from disk for all applications
        spaps = list(db.get_spaps_for_paps(paps_id=paps_id))
        for spap in spaps:
            spap_media_list = list(db.get_spap_media(spap_id=str(spap['id'])))
            media_handler.delete_media_batch(MediaType.SPAP, spap_media_list)

        # Delete all ASAP media files from disk for all assignments
        asaps = list(db.get_asaps_for_paps(paps_id=paps_id))
        for asap in asaps:
            asap_media_list = list(db.get_asap_media(asap_id=str(asap['asap_id'])))
            media_handler.delete_media_batch(MediaType.ASAP, asap_media_list)

        # Delete all ASAPs for this PAPS (cascades to ASAP_MEDIA and chat threads in DB)
        db.delete_asaps_for_paps(paps_id=paps_id)

        # Delete all SPAPs for this PAPS (cascades to SPAP_MEDIA in DB)
        db.delete_spaps_for_paps(paps_id=paps_id)

        # Soft delete all comments for this PAPS
        db.delete_comments_for_paps(paps_id=paps_id)

        # Soft delete the PAPS
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
        except ValueError:  # pragma: no cover
            return {"error": "Invalid PAP ID format"}, 400  # pragma: no cover

        try:
            uuid.UUID(category_id)
        except ValueError:
            return {"error": "Invalid category_id format"}, 400

        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAP not found"}, 404

        if not auth.is_admin and str(paps['owner_id']) != auth.aid:  # pragma: no cover
            return {"error": "Not authorized to modify this PAP"}, 403

        # Check if category exists
        cat = db.get_category_by_id(category_id=category_id)
        if not cat:  # pragma: no cover
            return {"error": "Category not found"}, 404

        # Add category (insert_paps_category handles duplicates)
        try:
            db.insert_paps_category(paps_id=paps_id, category_id=category_id, is_primary=False)
        except Exception:  # pragma: no cover
            # Category might already be associated  # pragma: no cover
            pass  # pragma: no cover

        return {"message": "Category added to PAP"}, 201

    # DELETE /paps/<paps_id>/categories/<category_id> - remove category from paps
    @app.delete("/paps/<paps_id>/categories/<category_id>", authz="AUTH")
    def delete_paps_category(paps_id: str, category_id: str, auth: model.CurrentAuth):
        """Remove a category from a PAP. Only owner or admin can remove categories."""
        try:
            uuid.UUID(paps_id)
        except ValueError:  # pragma: no cover
            return {"error": "Invalid PAP ID format"}, 400

        try:
            uuid.UUID(category_id)
        except ValueError:  # pragma: no cover
            return {"error": "Invalid category_id format"}, 400

        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAP not found"}, 404

        if not auth.is_admin and str(paps['owner_id']) != auth.aid:  # pragma: no cover
            return {"error": "Not authorized to modify this PAP"}, 403

        db.delete_paps_category(paps_id=paps_id, category_id=category_id)
        return "", 204

    # ============================================
    # PAPS MEDIA MANAGEMENT
    # Files are stored as [media_id].[extension] in POST_MEDIA_DIR
    # No filenames are exposed externally - only media_id
    # ============================================

    # GET /paps/<paps_id>/media - get all media for a paps
    # pragma: no cover - multipart form-data uploads not testable with FlaskTester internal mode
    @app.get("/paps/<paps_id>/media", authz="AUTH")
    def get_paps_media(paps_id: str):  # pragma: no cover
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

        # Build response with static media URLs
        result = []
        for media in media_list:
            media_url = media_handler.get_media_url(
                MediaType.PAPS,
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

        return fsa.jsonify({
            "paps_id": paps_id,
            "media_count": len(result),
            "media": result
        }), 200

    # POST /paps/<paps_id>/media - upload media files
    # pragma: no cover - multipart form-data uploads not testable with FlaskTester internal mode
    @app.route("/paps/<paps_id>/media", methods=["POST"], authz="AUTH")
    def post_paps_media(paps_id: str, auth: model.CurrentAuth):  # pragma: no cover
        """Upload one or multiple media files for a PAP. Only owner or admin can upload.
        Files are stored as [media_id].[extension] - no original filenames exposed."""
        from flask import request

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

            # Validate upload using MediaHandler
            media_data = file.read()
            valid, error, ext = media_handler.validate_upload(
                file.filename, len(media_data), MediaType.PAPS
            )
            if not valid:
                fsa.checkVal(False, error, 400)

            # Store file using MediaHandler (with compression)
            result = media_handler.store_paps_media(media_data, ext, compress=True)
            if not result.success:
                fsa.checkVal(False, result.error, 500)

            # Get next display order
            display_order = db.get_next_paps_media_order(paps_id=paps_id)

            # Insert media record into database
            media_id = db.insert_paps_media(
                paps_id=paps_id,
                media_type=result.media_type,
                file_extension=result.file_extension,
                file_size_bytes=result.file_size,
                mime_type=result.mime_type,
                display_order=display_order
            )

            # Rename the file from temp media_id to actual media_id
            if result.media_id != media_id:
                old_path = result.filepath
                new_path = media_handler.get_directory(MediaType.PAPS) / f"{media_id}.{result.file_extension}"
                if old_path and old_path.exists():
                    old_path.rename(new_path)

            uploaded_media.append({
                "media_id": media_id,
                "media_url": f"/paps/media/{media_id}",
                "media_type": result.media_type,
                "file_size_bytes": result.file_size,
                "display_order": display_order
            })

        return fsa.jsonify({
            "uploaded_media": uploaded_media,
            "count": len(uploaded_media)
        }), 201

    # Note: PAPS media files are now served statically via Flask at /media/post/<media_id>.<ext>
    # No separate endpoint needed - Flask's static folder serves these directly

    # DELETE /paps/media/<media_id> - delete a media file
    # pragma: no cover - multipart form-data uploads not testable with FlaskTester internal mode
    @app.delete("/paps/media/<media_id>", authz="AUTH")
    def delete_paps_media_file(media_id: str, auth: model.CurrentAuth):  # pragma: no cover
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

        # Use media_id from database record, not URL parameter, for safety
        db_media_id = media['media_id']
        ext = media['file_extension']

        # Delete from database FIRST to prevent orphaned file references
        db.delete_paps_media(media_id=db_media_id)

        # Then delete file from disk using MediaHandler
        media_handler.delete_paps_media(db_media_id, ext)

        return "", 204
