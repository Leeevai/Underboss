#
# Profile Routes - /profile, /profile/avatar, /profile/experiences, /profile/interests
#                  /user/<username>/profile, /user/<username>/profile/avatar, etc.
#

import datetime
import uuid
import FlaskSimpleAuth as fsa
from mediator import get_media_handler, MediaType

def register_routes(app):
    """Register profile routes with the Flask app."""
    from database import db
    import model
    
    # Get the media handler instance
    media_handler = get_media_handler()

    # =========================================================================
    # CURRENT USER PROFILE ROUTES - /profile/*
    # =========================================================================

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

    # PUT /profile - update current user's profile
    @app.put("/profile", authz="AUTH")
    def put_profile(auth: model.CurrentAuth, first_name: str|None = None, last_name: str|None = None,
                    display_name: str|None = None, bio: str|None = None, date_of_birth: str|None = None,
                    location_address: str|None = None, location_lat: float|None = None,
                    location_lng: float|None = None, timezone: str|None = None,
                    preferred_language: str|None = None):
        """Update the current user's profile information."""
        _validate_profile_update(location_lat, location_lng, date_of_birth)

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

    # PATCH /profile - partially update current user's profile
    @app.patch("/profile", authz="AUTH")
    def patch_profile(auth: model.CurrentAuth, first_name: str|None = None, last_name: str|None = None,
                      display_name: str|None = None, bio: str|None = None, date_of_birth: str|None = None,
                      location_address: str|None = None, location_lat: float|None = None,
                      location_lng: float|None = None, timezone: str|None = None,
                      preferred_language: str|None = None):
        """Partially update the current user's profile information."""
        _validate_profile_update(location_lat, location_lng, date_of_birth)

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

        # Validate upload using MediaHandler
        valid, error, ext = media_handler.validate_upload(
            filename, len(image_data), MediaType.AVATAR
        )
        fsa.checkVal(valid, error, 415 if "type" in error.lower() else 413)

        # Store avatar using MediaHandler (uses user_id as media_id)
        # Avatar compression is automatic in store_file for MediaType.AVATAR
        result = media_handler.store_avatar(image_data, ext, auth.aid)
        fsa.checkVal(result.success, result.error or "Failed to store avatar", 400)

        # Update avatar_url in database
        avatar_url = result.url
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

    # DELETE /profile/avatar - remove current user's avatar
    @app.delete("/profile/avatar", authz="AUTH")
    def delete_avatar(auth: model.CurrentAuth):
        """Delete the current user's avatar and reset to default (avatar_url becomes NULL)."""
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
                # Extract extension from URL and delete using MediaHandler
                filename = avatar_url.split("/")[-1]
                if "." in filename:
                    ext = filename.rsplit(".", 1)[1].lower()
                    media_handler.delete_avatar(auth.aid, ext)

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

    # Note: Avatar images are now served statically via Flask at /media/user/profile/<user_id>.<ext>
    # No separate endpoint needed - Flask's static folder serves these directly

    # =========================================================================
    # CURRENT USER EXPERIENCES - /profile/experiences/*
    # =========================================================================

    # GET /profile/experiences - get current user's experiences
    @app.get("/profile/experiences", authz="AUTH")
    def get_my_experiences(auth: model.CurrentAuth):
        """Get current user's work experiences."""
        experiences = db.get_user_experiences(user_id=auth.aid)
        return fsa.jsonify(experiences), 200

    # POST /profile/experiences - add experience to current user
    @app.post("/profile/experiences", authz="AUTH")
    def post_experience(auth: model.CurrentAuth, title: str, company: str|None = None,
                       description: str|None = None, start_date: str = None,
                       end_date: str|None = None, is_current: bool = False):
        """Add work experience to current user's profile."""
        fsa.checkVal(len(title.strip()) >= 2, "Title must be at least 2 characters", 400)

        # Validate dates
        try:
            start_dt = datetime.datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except ValueError:
            fsa.checkVal(False, "Invalid start_date format", 400)

        end_dt = None
        if end_date:
            try:
                end_dt = datetime.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                fsa.checkVal(end_dt >= start_dt, "End date must be after start date", 400)
            except ValueError:
                fsa.checkVal(False, "Invalid end_date format", 400)

        fsa.checkVal(not is_current or end_date is None, "Current experiences cannot have end date", 400)

        exp_id = db.insert_user_experience(
            user_id=auth.aid,
            title=title.strip(),
            company=company.strip() if company else None,
            description=description.strip() if description else None,
            start_date=start_dt,
            end_date=end_dt,
            is_current=is_current
        )

        return fsa.jsonify({"experience_id": exp_id}), 201

    # PATCH /profile/experiences/<exp_id> - update experience
    @app.patch("/profile/experiences/<exp_id>", authz="AUTH")
    def patch_experience(exp_id: str, auth: model.CurrentAuth, title: str|None = None,
                        company: str|None = None, description: str|None = None,
                        start_date: str|None = None, end_date: str|None = None,
                        is_current: bool|None = None):
        """Update a work experience."""
        try:
            uuid.UUID(exp_id)
        except ValueError:
            return {"error": "Invalid experience ID format"}, 400

        # Check ownership
        exp = db.get_user_experience_by_id(exp_id=exp_id)
        if not exp:
            return {"error": "Experience not found"}, 404
        if str(exp['user_id']) != auth.aid:
            return {"error": "Not authorized to update this experience"}, 403

        # Validate title if provided
        if title is not None:
            fsa.checkVal(len(title.strip()) >= 2, "Title must be at least 2 characters", 400)

        # Validate dates if provided
        start_dt = None
        if start_date:
            try:
                start_dt = datetime.datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except ValueError:
                fsa.checkVal(False, "Invalid start_date format", 400)

        end_dt = None
        if end_date:
            try:
                end_dt = datetime.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except ValueError:
                fsa.checkVal(False, "Invalid end_date format", 400)

        db.update_user_experience(
            exp_id=exp_id,
            title=title.strip() if title else None,
            company=company.strip() if company else None,
            description=description.strip() if description else None,
            start_date=start_dt,
            end_date=end_dt,
            is_current=is_current
        )

        return "", 204

    # DELETE /profile/experiences/<exp_id> - delete experience
    @app.delete("/profile/experiences/<exp_id>", authz="AUTH")
    def delete_experience(exp_id: str, auth: model.CurrentAuth):
        """Delete a work experience."""
        try:
            uuid.UUID(exp_id)
        except ValueError:
            return {"error": "Invalid experience ID format"}, 400

        # Check ownership
        exp = db.get_user_experience_by_id(exp_id=exp_id)
        if not exp:
            return {"error": "Experience not found"}, 404
        if str(exp['user_id']) != auth.aid:
            return {"error": "Not authorized to delete this experience"}, 403

        db.delete_user_experience(exp_id=exp_id)
        return "", 204

    # =========================================================================
    # CURRENT USER INTERESTS - /profile/interests/*
    # =========================================================================

    # GET /profile/interests - get current user's interests
    @app.get("/profile/interests", authz="AUTH")
    def get_my_interests(auth: model.CurrentAuth):
        """Get current user's interests."""
        interests = db.get_user_interests(user_id=auth.aid)
        return fsa.jsonify(interests), 200

    # POST /profile/interests - add interest to current user
    @app.post("/profile/interests", authz="AUTH")
    def post_interest(auth: model.CurrentAuth, category_id: str, proficiency_level: int = 1):
        """Add an interest to current user's profile."""
        try:
            uuid.UUID(category_id)
        except ValueError:
            return {"error": "Invalid category_id format"}, 400

        fsa.checkVal(1 <= proficiency_level <= 5, "Proficiency level must be 1-5", 400)

        # Check category exists
        category = db.get_category_by_id(category_id=category_id)
        if not category:
            return {"error": "Category not found"}, 404

        # Check if user already has this interest
        existing_interests = db.get_user_interests(user_id=auth.aid)
        for interest in existing_interests:
            if interest["category_id"] == category_id:
                return {"error": "Interest already exists"}, 409

        db.insert_user_interest(
            user_id=auth.aid,
            category_id=category_id,
            proficiency_level=proficiency_level
        )

        return "", 201

    # PATCH /profile/interests/<category_id> - update interest
    @app.patch("/profile/interests/<category_id>", authz="AUTH")
    def patch_interest(category_id: str, auth: model.CurrentAuth, proficiency_level: int):
        """Update an interest's proficiency level."""
        try:
            uuid.UUID(category_id)
        except ValueError:
            return {"error": "Invalid category_id format"}, 400

        fsa.checkVal(1 <= proficiency_level <= 5, "Proficiency level must be 1-5", 400)

        db.update_user_interest(
            user_id=auth.aid,
            category_id=category_id,
            proficiency_level=proficiency_level
        )

        return "", 204

    # DELETE /profile/interests/<category_id> - delete interest
    @app.delete("/profile/interests/<category_id>", authz="AUTH")
    def delete_interest(category_id: str, auth: model.CurrentAuth):
        """Delete an interest from current user's profile."""
        try:
            uuid.UUID(category_id)
        except ValueError:
            return {"error": "Invalid category_id format"}, 400

        # Check if user has this interest
        existing_interests = db.get_user_interests(user_id=auth.aid)
        interest_exists = any(i["category_id"] == category_id for i in existing_interests)
        if not interest_exists:
            return {"error": "Interest not found"}, 404

        db.delete_user_interest(user_id=auth.aid, category_id=category_id)
        return "", 204

    # =========================================================================
    # OTHER USER PROFILE ROUTES - /user/<username>/profile/*
    # =========================================================================

    # GET /user/<username>/profile - get any user's profile by username
    @app.get("/user/<username>/profile", authz="OPEN", authn="none")
    def get_user_profile_by_username(username: str):
        """Get any user's profile by username."""
        user = db.get_user_by_username(username=username)
        if not user:
            return {"error": f"User not found: {username}"}, 404

        profile = db.get_user_profile(user_id=user["id"])
        if not profile:
            return {"error": "Profile not found"}, 404

        # Add default avatar if none set
        if profile.get("avatar_url") is None:
            config = app.config.get("MEDIA_CONFIG", {})
            profile["avatar_url"] = config.get("default_avatar_url", "/media/user/profile/avatar.png")

        return fsa.jsonify(profile), 200

    # PATCH /user/<username>/profile - update user's profile (must be authenticated as that user)
    @app.patch("/user/<username>/profile", authz="AUTH")
    def patch_user_profile(auth: model.CurrentAuth, username: str, first_name: str|None = None, 
                          last_name: str|None = None, display_name: str|None = None, bio: str|None = None, 
                          date_of_birth: str|None = None, location_address: str|None = None, 
                          location_lat: float|None = None, location_lng: float|None = None, 
                          timezone: str|None = None, preferred_language: str|None = None):
        """Update user's profile - must be authenticated as that user."""
        user = db.get_user_by_username(username=username)
        if not user:
            return {"error": f"User not found: {username}"}, 404
        
        user_id = user["id"]
        fsa.checkVal(str(user_id) == str(auth.aid), "can only update your own profile", 403)
        
        _validate_profile_update(location_lat, location_lng, date_of_birth)

        db.update_user_profile(
            user_id=user_id,
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

    # Note: User avatars are served statically via Flask at /media/user/profile/<user_id>.<ext>
    # No separate endpoint needed - Flask's static folder serves these directly

    # GET /user/<username>/profile/experiences - get a user's experiences (public)
    @app.get("/user/<username>/profile/experiences", authz="OPEN", authn="none")
    def get_user_experiences(username: str):
        """Get a user's work experiences by username."""
        user = db.get_user_by_username(username=username)
        if not user:
            return {"error": f"User not found: {username}"}, 404
        
        experiences = db.get_user_experiences(user_id=user["id"])
        return fsa.jsonify(experiences), 200

    # GET /user/<username>/profile/interests - get a user's interests (public)
    @app.get("/user/<username>/profile/interests", authz="OPEN", authn="none")
    def get_user_interests(username: str):
        """Get a user's interests by username."""
        user = db.get_user_by_username(username=username)
        if not user:
            return {"error": f"User not found: {username}"}, 404
        
        interests = db.get_user_interests(user_id=user["id"])
        return fsa.jsonify(interests), 200

    # =========================================================================
    # HELPER FUNCTIONS
    # =========================================================================

    def _validate_profile_update(location_lat, location_lng, date_of_birth):
        """Validate profile update parameters."""
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


