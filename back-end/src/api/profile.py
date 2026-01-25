#
# Profile Routes - /profile, /profile/avatar, /users/<user_id>/profile, /media/user/profile/<filename>
#

import uuid
import datetime
import FlaskSimpleAuth as fsa

def register_routes(app):
    """Register profile routes with the Flask app."""
    from database import db
    from utils import ensure_media_dir, PROFILE_IMG_DIR
    import model

    # GET /profile - get current user's profile
    @app.get("/profile", authz="AUTH")
    def get_profile(auth: model.CurrentAuth):
        """Get the current authenticated user's profile."""
        profile = db.get_user_profile(user_id=auth.aid)
        if not profile:
            return {"error": "Profile not found"}, 404

        # If user has no avatar, use default from config
        if profile.get("avatar_url") is None:
            config = app.config.get("MEDIA_CONFIG", {})
            profile["avatar_url"] = config.get("default_avatar_url", "/media/user/profile/avatar.png")

        return fsa.jsonify(profile), 200

    # GET /users/<user_id>/profile - get any user's public profile
    @app.get("/users/<user_id>/profile", authz="OPEN", authn="none")
    def get_user_profile_public(user_id: str):
        """Get any user's public profile by user ID."""
        try:
            uuid.UUID(user_id)
        except ValueError:
            return {"error": "Invalid user ID format"}, 400

        profile = db.get_user_profile(user_id=user_id)
        if not profile:
            return {"error": "Profile not found"}, 404

        # Add default avatar if none set
        if profile.get("avatar_url") is None:
            config = app.config.get("MEDIA_CONFIG", {})
            profile["avatar_url"] = config.get("default_avatar_url", "/media/user/profile/avatar.png")

        return fsa.jsonify(profile), 200

    # PUT /profile - update current user's profile
    @app.put("/profile", authz="AUTH")
    def put_profile(auth: model.CurrentAuth, first_name: str|None = None, last_name: str|None = None,
                    display_name: str|None = None, bio: str|None = None, date_of_birth: str|None = None,
                    location_address: str|None = None, location_lat: float|None = None,
                    location_lng: float|None = None, timezone: str|None = None,
                    preferred_language: str|None = None):
        """Update the current user's profile information."""
        # Validate optional location params
        if (location_lat is not None or location_lng is not None):
            fsa.checkVal(location_lat is not None and location_lng is not None,
                        "Both lat and lng required", 400)
            fsa.checkVal(-90 <= location_lat <= 90, "Invalid latitude", 400)
            fsa.checkVal(-180 <= location_lng <= 180, "Invalid longitude", 400)

        # Validate optional date_of_birth
        if date_of_birth is not None:
            try:
                datetime.datetime.fromisoformat(date_of_birth.replace('Z', '+00:00'))
            except ValueError:
                fsa.checkVal(False, "Invalid date_of_birth format", 400)

        db.update_user_profile(
            user_id=auth.aid,
            first_name=first_name.strip() if first_name else None,
            last_name=last_name.strip() if last_name else None,
            display_name=display_name.strip() if display_name else None,
            bio=bio.strip() if bio else None,
            avatar_url=None,
            date_of_birth=date_of_birth,
            location_address=location_address.strip() if location_address else None,
            location_lat=location_lat,
            location_lng=location_lng,
            timezone=timezone,
            preferred_language=preferred_language
        )
        return "", 204

    # POST /profile/avatar - upload user profile avatar image
    @app.route("/profile/avatar", methods=["POST"], authz="AUTH")
    def post_avatar(auth: model.CurrentAuth):
        """Upload a profile avatar image. Accepts binary image data or multipart form data."""
        from flask import request
        from werkzeug.utils import secure_filename
        ensure_media_dir()

        # Try to get image from multipart files first, then from raw body
        image_data = None
        filename = "avatar.png"

        if "image" in request.files:
            file = request.files["image"]
            fsa.checkVal(file.filename != "", "No file selected", 400)
            filename = file.filename
            image_data = file.read()
        elif request.data:
            image_data = request.data
            content_type = request.headers.get("Content-Type", "image/png")
            if "jpeg" in content_type or "jpg" in content_type:
                filename = "avatar.jpg"
            elif "png" in content_type:
                filename = "avatar.png"
            elif "gif" in content_type:
                filename = "avatar.gif"
            elif "webp" in content_type:
                filename = "avatar.webp"
        else:
            fsa.checkVal(False, "No image data provided", 400)

        # Validate file type - only images for avatars
        avatar_extensions = {"jpg", "jpeg", "png", "gif", "webp"}
        ext = filename.rsplit(".", 1)[1].lower() if "." in filename else "png"
        fsa.checkVal(ext in avatar_extensions,
                    f"File type not allowed for avatars. Allowed: {', '.join(avatar_extensions)}", 415)

        # Check file size
        file_size = len(image_data)
        max_size = 5 * 1024 * 1024  # 5MB for avatars
        fsa.checkVal(file_size <= max_size,
                    f"File too large (max {max_size / 1024 / 1024}MB)", 413)

        # Save file with user_id as name to ensure uniqueness
        filename = secure_filename(f"{auth.aid}.{ext}")
        filepath = PROFILE_IMG_DIR / filename
        filepath.write_bytes(image_data)

        # Update avatar_url in database
        avatar_url = f"/media/user/profile/{filename}"
        db.update_user_profile(
            user_id=auth.aid,
            first_name=None,
            last_name=None,
            display_name=None,
            bio=None,
            avatar_url=avatar_url,
            date_of_birth=None,
            location_address=None,
            location_lat=None,
            location_lng=None,
            timezone=None,
            preferred_language=None
        )

        return {"avatar_url": avatar_url}, 201

    # GET /media/user/profile/<filename> - serve avatar image
    @app.get("/media/user/profile/<filename>", authz="OPEN", authn="none")
    def get_avatar_image(filename: str):
        """Serve a user's profile avatar image."""
        from flask import send_file
        from werkzeug.utils import secure_filename

        filename = secure_filename(filename)
        filepath = PROFILE_IMG_DIR / filename

        if not filepath.exists():
            # Return default avatar
            default_avatar = PROFILE_IMG_DIR / "avatar.png"
            if default_avatar.exists():
                return send_file(default_avatar, mimetype="image/png")
            return {"error": "Avatar not found"}, 404

        # Determine mimetype
        ext = filepath.suffix[1:]
        if ext in {"jpg", "jpeg"}:
            mimetype = "image/jpeg"
        elif ext == "png":
            mimetype = "image/png"
        elif ext == "gif":
            mimetype = "image/gif"
        elif ext == "webp":
            mimetype = "image/webp"
        else:
            mimetype = "application/octet-stream"

        return send_file(filepath, mimetype=mimetype)
