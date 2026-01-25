#
# Paps Routes - /paps (job postings and media management)
#

import uuid
import re
import datetime
import FlaskSimpleAuth as fsa

def register_routes(app):
    """Register paps routes with the Flask app."""
    from database import db
    from utils import ensure_media_dir, allowed_file, get_max_file_size, get_allowed_extensions, POST_MEDIA_DIR
    import model

    # GET /paps - list all accessible paps
    @app.get("/paps", authz="OPEN", authn="none")
    def get_paps(status: str|None = None, category_id: str|None = None,
                lat: float|None = None, lng: float|None = None, max_distance: float|None = None):
        """
        Get PAPS postings with optional filters.
        Non-authenticated users see all paps.
        Authenticated users see their own paps plus published & public ones.
        Admins see all paps.
        """
        # Get current user if authenticated
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

        # Admins see all, users see published + their own, public see all
        if is_admin:
            paps = list(db.get_all_paps_admin(
                status=status,
                category_id=category_id,
                lat=lat,
                lng=lng,
                max_distance=max_distance
            ))
        elif user_id:
            paps = list(db.get_paps_for_user(
                user_id=user_id,
                status=status,
                category_id=category_id,
                lat=lat,
                lng=lng,
                max_distance=max_distance
            ))
        else:
            paps = list(db.get_all_paps_admin(
                status=None,
                category_id=category_id,
                lat=lat,
                lng=lng,
                max_distance=max_distance
            ))

        # For each paps, include media URLs
        for pap in paps:
            pap['media_urls'] = list(db.get_paps_media_urls(paps_id=str(pap['id'])))
            pap['categories'] = list(db.get_paps_categories(paps_id=str(pap['id'])))

        return fsa.jsonify(paps), 200

    # POST /paps - create new paps
    @app.post("/paps", authz="AUTH")
    def post_paps(auth: model.CurrentAuth, title: str, description: str,
                 payment_amount: float, payment_currency: str = "USD",
                 payment_type: str = "fixed", max_applicants: int = 10,
                 max_assignees: int = 1, subtitle: str|None = None,
                 location_address: str|None = None, location_lat: float|None = None,
                 location_lng: float|None = None, location_timezone: str|None = None,
                 start_datetime: str|None = None, end_datetime: str|None = None,
                 estimated_duration_minutes: int|None = None, is_public: bool = True,
                 status: str = "draft"):
        """Create a new PAPS job posting."""
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

        return fsa.jsonify({"paps_id": pid}), 201

    # GET /paps/<paps_id> - get specific paps with full details
    @app.get("/paps/<paps_id>", authz="OPEN", authn="none")
    def get_paps_id(paps_id: str):
        """Get a specific PAP by ID with full details including owner, media, and categories."""
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

        # Enrich with media and categories (convert generators to lists for JSON)
        paps['media_urls'] = list(db.get_paps_media_urls(paps_id=paps_id))
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
        """Soft delete a PAP. Only owner or admin can delete."""
        try:
            uuid.UUID(paps_id)
        except ValueError:
            return {"error": "Invalid PAP ID format"}, 400

        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAP not found"}, 404

        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized to delete this PAP"}, 403

        db.delete_paps(id=paps_id)
        return "", 204

    # ============================================
    # PAPS MEDIA MANAGEMENT
    # ============================================

    # POST /paps/media/<paps_id> - upload multiple media files
    @app.route("/paps/media/<paps_id>", methods=["POST"], authz="AUTH")
    def post_paps_media(paps_id: str, auth: model.CurrentAuth):
        """Upload one or multiple media files for a PAP. Only owner or admin can upload."""
        from flask import request
        from werkzeug.utils import secure_filename
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

        # Find next index
        existing_files = list(POST_MEDIA_DIR.glob(f"paps_media_{paps_id}_*.*"))
        indices = []
        for f in existing_files:
            match = re.match(rf"paps_media_{re.escape(paps_id)}_(\d+)\..*", f.name)
            if match:
                indices.append(int(match.group(1)))
        next_index = max(indices) + 1 if indices else 1

        uploaded_media = []

        # Handle multiple file uploads
        if "media" in request.files:
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

                # Save file
                filename = secure_filename(f"paps_media_{paps_id}_{next_index}.{ext}")
                filepath = POST_MEDIA_DIR / filename
                filepath.write_bytes(media_data)

                # Determine media type
                media_type = "image" if ext in {"jpg", "jpeg", "png", "gif", "webp"} else "video"

                # Insert media record
                media_url = f"/paps/media/{filename}"
                db.insert_paps_media(
                    paps_id=paps_id,
                    media_type=media_type,
                    media_url=media_url,
                    file_size_bytes=file_size,
                    mime_type=file.content_type or f"image/{ext}",
                    display_order=next_index
                )

                uploaded_media.append({
                    "media_url": media_url,
                    "index": next_index,
                    "filename": filename,
                    "media_type": media_type,
                    "file_size": file_size
                })

                next_index += 1
        else:
            return {"error": "No media files provided"}, 400

        return {"uploaded_media": uploaded_media, "count": len(uploaded_media)}, 201

    # GET /paps/media/<filename> - serve paps media
    @app.get("/paps/media/<filename>", authz="OPEN", authn="none")
    def get_paps_media_file(filename: str):
        """Serve a PAPS media file."""
        from flask import send_file
        from werkzeug.utils import secure_filename

        filename = secure_filename(filename)
        filepath = POST_MEDIA_DIR / filename

        if not filepath.exists():
            return {"error": "Media file not found"}, 404

        ext = filepath.suffix[1:]
        if ext in {"jpg", "jpeg", "png", "gif", "webp"}:
            mimetype = f"image/{ext}"
        elif ext in {"mp4", "avi", "mov", "mkv"}:
            mimetype = f"video/{ext}"
        else:
            mimetype = "application/octet-stream"

        return send_file(filepath, mimetype=mimetype)
