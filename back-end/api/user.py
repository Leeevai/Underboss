#
# User Routes - /users (admin testing routes)
#

import os
import re
import FlaskSimpleAuth as fsa

# Helper regex patterns
UUID_REGEX = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
USERNAME_REGEX = r'^[a-zA-Z][-a-zA-Z0-9_\.]*$'

def register_routes(app):
    """Register admin user routes with the Flask app (only if APP_USERS is enabled)."""
    from database import db
    from utils import log

    def resolve_user_id(user_identifier: str):
        """
        Resolve a user identifier (UUID or username) to the user data.
        Returns (user_data, resolved_uuid) or (None, None) if not found.
        Raises ValueError with appropriate message for invalid format.
        """
        # If it's a valid UUID, use get_user_data_by_id
        if re.match(UUID_REGEX, user_identifier, re.IGNORECASE):
            user_data = db.get_user_data_by_id(user_id=user_identifier)
            return user_data, user_identifier
        # If it's a valid username, use get_user_data
        elif re.match(USERNAME_REGEX, user_identifier) and len(user_identifier) >= 3:
            user_data = db.get_user_data(login=user_identifier)
            if user_data:
                return user_data, user_data.get('aid')
            return None, None
        else:
            # Invalid format
            raise ValueError(f"invalid user identifier: {user_identifier}")
    
    # Admin's /users routes for testing
    if app.config.get("APP_USERS", False):
        log.warning("/users testing routes are active")

        @app.get("/users", authz="ADMIN")
        def get_users(flt: str|None = None):
            res = db.get_user_all() if flt is None else db.get_user_filter(flt=flt)
            return fsa.jsonify(res), 200

        @app.post("/users", authz="ADMIN")
        def post_users(login: str, password: str, email: str|None = None, phone: str|None = None, is_admin: bool = False):
            # Validate username (login) format
            fsa.checkVal(len(login) >= 3, "username must be at least 3 characters", 400)
            fsa.checkVal(re.match(USERNAME_REGEX, login), "username must start with a letter and contain only letters, digits, hyphens, underscores, or dots", 400)
            
            aid = db.insert_user(username=login, email=email, phone=phone,
                                 password=app.hash_password(password), is_admin=is_admin, user_id=None)
            fsa.checkVal(aid, f"user {login} already created", 409)
            return fsa.jsonify({"user_id": aid}), 201

        @app.get("/users/<user_id>", authz="ADMIN")
        def get_users_id(user_id: str):
            try:
                res, _ = resolve_user_id(user_id)
            except ValueError as e:
                fsa.checkVal(False, str(e), 400)
            
            fsa.checkVal(res, f"no such user: {user_id}", 404)
            return res, 200

        @app.patch("/users/<user_id>", authz="ADMIN")
        def patch_users_id(user_id: str, password: str|None = None, email: str|None = None,
                           phone: str|None = None, is_admin: bool|None = None):
            import re
            try:
                user_data, resolved_id = resolve_user_id(user_id)
            except ValueError as e:
                fsa.checkVal(False, str(e), 400)
            
            fsa.checkVal(user_data, f"no such user: {user_id}", 404)
            
            if password is not None:
                db.set_user_password(user_id=resolved_id, password=app.hash_password(password))
            if email is not None:
                # Validate email format
                email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                fsa.checkVal(re.match(email_pattern, email), f"Invalid email format: {email}", 400)
                db.set_user_email(user_id=resolved_id, email=email)
            if phone is not None:
                db.set_user_phone(user_id=resolved_id, phone=phone)
            if is_admin is not None:
                db.set_user_is_admin(user_id=resolved_id, is_admin=is_admin)
            return "", 204

        @app.put("/users/<user_id>", authz="ADMIN")
        def put_users_id(user_id: str, auth: dict = None):
            """Replace user data completely."""         
            try:
                user_data, resolved_id = resolve_user_id(user_id)
            except ValueError as e:
                fsa.checkVal(False, str(e), 400)
            
            fsa.checkVal(user_data, f"no such user: {user_id}", 404)
            
            if auth:
                # Validate the auth dict has required login matching the user_id
                login = auth.get('login')
                fsa.checkVal(login and login == user_id, f"login must match user: {user_id}", 400)
                
                # Update all fields
                if 'password' in auth:
                    db.set_user_password(user_id=resolved_id, password=app.hash_password(auth['password']))
                if 'email' in auth:
                    db.set_user_email(user_id=resolved_id, email=auth['email'])
                if 'isadmin' in auth:
                    db.set_user_is_admin(user_id=resolved_id, is_admin=auth['isadmin'])
            
            return "", 204

        @app.delete("/users/<user_id>", authz="ADMIN")
        def delete_users_id(user_id: str):
            try:
                user_data, resolved_id = resolve_user_id(user_id)
            except ValueError as e:
                fsa.checkVal(False, str(e), 400)
            
            current_user_data = db.get_user_data(login=app.get_user())
            fsa.checkVal(resolved_id != current_user_data['aid'], "cannot delete oneself", 400)

            # Get user profile to find avatar
            try:
                profile = db.get_user_profile(user_id=resolved_id)
                # Delete profile picture if it exists and is NOT the default avatar
                if profile and profile.get('avatar_url'):
                    config = app.config.get("MEDIA_CONFIG", {})
                    default_avatar = config.get("default_avatar_url", "media/user/profile/avatar.png")
                    # Only delete if it's not the default avatar
                    if profile['avatar_url'] != default_avatar and not profile['avatar_url'].endswith('/avatar.png'):
                        avatar_path = os.path.join(os.getcwd(), profile['avatar_url'].lstrip('/'))
                        if os.path.exists(avatar_path):
                            os.remove(avatar_path)
                            log.info(f"Deleted profile picture: {avatar_path}")
            except Exception as e:
                log.warning(f"Could not delete profile picture for user {user_id}: {e}")

            # Hard delete all user's PAPS and related data before deleting user
            try:
                # Get all paps IDs for media cleanup
                user_paps = db.get_user_paps_ids(owner_id=resolved_id)
                
                # Delete paps media files from disk
                for paps in user_paps:
                    paps_id = paps['paps_id']
                    media_list = db.get_paps_media(paps_id=paps_id)
                    for media in media_list:
                        media_path = os.path.join(os.getcwd(), f"media/paps/{paps_id}/{media['media_id']}.{media['file_extension']}")
                        if os.path.exists(media_path):
                            os.remove(media_path)
                            log.info(f"Deleted paps media: {media_path}")
                
                # Delete PAPS_CATEGORY records first (foreign key constraint)
                db.delete_user_paps_categories(owner_id=resolved_id)
                
                # Hard delete all user's PAPS (cascades to PAPS_MEDIA in DB)
                db.hard_delete_user_paps(owner_id=resolved_id)
                log.info(f"Hard deleted all PAPS for user {user_id}")
            except Exception as e:
                log.warning(f"Could not delete PAPS for user {user_id}: {e}")

            deleted = db.delete_user(user_id=resolved_id)
            fsa.checkVal(deleted, f"no such user: {user_id}", 404)
            return "", 204
