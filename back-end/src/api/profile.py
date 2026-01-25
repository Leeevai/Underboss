#
# Profile Routes - /user/profile, /user/profile/avatar, /user/<username>/profile, /user/<username>/profile/avatar
#

import datetime
from io import BytesIO
import FlaskSimpleAuth as fsa
from PIL import Image

def register_routes(app):
    """Register profile routes with the Flask app."""
    from database import db
    from utils import ensure_media_dir, PROFILE_IMG_DIR
    import model

    # GET /user/profile - get current user's profile
    @app.get("/user/profile", authz="AUTH")
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

    # GET /user/<username>/profile - get any user's profile by username
    def get_user_profile_public(username: str):
        """Get any user's profile by username."""
        user = db.get_user_by_username(username=username)
        if not user:
            return {"error": "User not found"}, 404

        profile = db.get_user_profile(user_id=user["id"])
        if not profile:
            return {"error": "Profile not found"}, 404

        # Add default avatar if none set
        if profile.get("avatar_url") is None:
            config = app.config.get("MEDIA_CONFIG", {})
            profile["avatar_url"] = config.get("default_avatar_url", "/media/user/profile/avatar.png")

        return fsa.jsonify(profile), 200

    # Route registered below - public profile viewing
    @app.get("/user/<username>/profile", authz="OPEN", authn="none")
    def get_user_profile_public_route(username: str):
        return get_user_profile_public(username)

    # PATCH /user/<username>/profile - update user's profile (must be authenticated as that user)
    @app.patch("/user/<username>/profile", authz="AUTH")
    def patch_user_profile(auth: model.CurrentAuth, username: str, first_name: str|None = None, 
                          last_name: str|None = None, display_name: str|None = None, bio: str|None = None, 
                          date_of_birth: str|None = None, location_address: str|None = None, 
                          location_lat: float|None = None, location_lng: float|None = None, 
                          timezone: str|None = None, preferred_language: str|None = None):
        """Update user's profile - must be authenticated as that user."""
        # Get user data to verify username matches authenticated user
        user_data = db.get_user_data(login=username)
        fsa.checkVal(user_data, f"no such user: {username}", 404)
        fsa.checkVal(str(user_data.get('aid')) == str(auth.aid), "can only update your own profile", 403)
        
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

    # PUT /user/profile - update current user's profile
    @app.put("/user/profile", authz="AUTH")
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

    # POST /user/profile/avatar - upload user profile avatar image
    @app.route("/user/profile/avatar", methods=["POST"], authz="AUTH")
    def post_avatar(auth: model.CurrentAuth):
        """Upload a profile avatar image. Accepts binary image data or multipart form data."""
        from flask import request
        from werkzeug.utils import secure_filename
        ensure_media_dir()
        config = app.config.get("MEDIA_CONFIG", {})

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
        avatar_extensions = config.get("avatar_extensions", {"jpg", "jpeg", "png", "gif", "webp"})
        ext = filename.rsplit(".", 1)[1].lower() if "." in filename else "png"
        fsa.checkVal(ext in avatar_extensions,
                    f"File type not allowed for avatars. Allowed: {', '.join(avatar_extensions)}", 415)

        # Compress before storage
        max_size = config.get("max_avatar_size", 5 * 1024 * 1024)
        def compress_avatar(data: bytes, ext: str) -> bytes:
            try:
                img = Image.open(BytesIO(data))
            except Exception:
                fsa.checkVal(False, "Invalid image data", 400)
            img_format = {
                "jpg": "JPEG",
                "jpeg": "JPEG",
                "png": "PNG",
                "gif": "GIF",
                "webp": "WEBP",
            }.get(ext, "PNG")
            if img_format == "JPEG" and img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            if img_format in ("JPEG", "WEBP"):
                quality = int(config.get("avatar_quality", 85))
                for q in [quality, 80, 75, 70, 60, 50]:
                    out = BytesIO()
                    img.save(out, format=img_format, quality=q, optimize=True)
                    if out.tell() <= max_size:
                        return out.getvalue()
                return out.getvalue()
            out = BytesIO()
            img.save(out, format=img_format, optimize=True)
            return out.getvalue()

        image_data = compress_avatar(image_data, ext)
        fsa.checkVal(len(image_data) <= max_size,
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

    # DELETE /user/profile/avatar - remove current user's avatar
    @app.delete("/user/profile/avatar", authz="AUTH")
    def delete_avatar(auth: model.CurrentAuth):
        """Delete the current user's avatar and reset to default (avatar_url becomes NULL)."""
        from werkzeug.utils import secure_filename
        config = app.config.get("MEDIA_CONFIG", {})
        default_avatar_url = config.get("default_avatar_url", "media/user/profile/avatar.png")
        profile = db.get_user_profile(user_id=auth.aid)
        # Only delete the file if it's not the default avatar
        if profile and profile.get("avatar_url"):
            avatar_url = profile["avatar_url"]
            # Check it's not the default avatar (with or without leading slash)
            is_default = (avatar_url == default_avatar_url or 
                         avatar_url == "/" + default_avatar_url or
                         avatar_url.endswith("/avatar.png"))
            if not is_default:
                filename = avatar_url.split("/")[-1]
                filepath = PROFILE_IMG_DIR / secure_filename(filename)
                if filepath.exists():
                    filepath.unlink()

        db.update_user_profile(
            user_id=auth.aid,
            first_name=None,
            last_name=None,
            display_name=None,
            bio=None,
            avatar_url=None,
            date_of_birth=None,
            location_address=None,
            location_lat=None,
            location_lng=None,
            timezone=None,
            preferred_language=None
        )

        return "", 204

    # GET /user/profile/avatar - serve current user's avatar image
    @app.get("/user/profile/avatar", authz="AUTH")
    def get_my_avatar(auth: model.CurrentAuth):
        """Serve current user's profile avatar image."""
        return _serve_avatar_for_user_id(auth.aid)

    # GET /user/<username>/profile/avatar - serve another user's avatar image
    @app.get("/user/<username>/profile/avatar", authz="AUTH")
    def get_user_avatar(username: str):
        """Serve another user's profile avatar image by username."""
        user = db.get_user_by_username(username=username)
        if not user:
            return {"error": "User not found"}, 404
        return _serve_avatar_for_user_id(user["id"])

    def _serve_avatar_for_user_id(user_id: str):
        """Serve avatar image for a given user id without exposing filename."""
        from flask import send_file
        from werkzeug.utils import secure_filename

        profile = db.get_user_profile(user_id=user_id)
        if not profile:
            return {"error": "Profile not found"}, 404

        avatar_url = profile.get("avatar_url")
        if avatar_url:
            filename = secure_filename(avatar_url.split("/")[-1])
            filepath = PROFILE_IMG_DIR / filename
        else:
            filepath = PROFILE_IMG_DIR / "avatar.png"

        if not filepath.exists():
            return {"error": "Avatar not found"}, 404

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
