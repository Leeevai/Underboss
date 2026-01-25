#
# User Routes - /users (admin testing routes)
#

import os
import FlaskSimpleAuth as fsa

def register_routes(app):
    """Register admin user routes with the Flask app (only if APP_USERS is enabled)."""
    from database import db
    from utils import log

    # Admin's /users routes for testing
    if app.config.get("APP_USERS", False):
        log.warning("/users testing routes are active")

        @app.get("/users", authz="ADMIN")
        def get_users(flt: str|None = None):
            res = db.get_user_all() if flt is None else db.get_user_filter(flt=flt)
            return fsa.jsonify(res), 200

        @app.post("/users", authz="ADMIN")
        def post_users(username: str, email: str, password: str, phone: str|None = None, is_admin: bool = False):
            aid = db.insert_user(username=username, email=email, phone=phone,
                                 password=app.hash_password(password), is_admin=is_admin, user_id=None)
            fsa.checkVal(aid, f"user {username} already created", 409)
            return fsa.jsonify({"user_id": aid}), 201

        @app.get("/users/<user_id>", authz="ADMIN")
        def get_users_id(user_id: str):
            res = db.get_user_data_by_id(user_id=user_id)
            fsa.checkVal(res, f"no such user: {user_id}", 404)
            return res, 200

        @app.patch("/users/<user_id>", authz="ADMIN")
        def patch_users_id(user_id: str, password: str|None = None, email: str|None = None,
                           phone: str|None = None, is_admin: bool|None = None):
            fsa.checkVal(db.get_user_by_id(user_id=user_id), f"no such user: {user_id}", 404)
            if password is not None:
                db.set_user_password(user_id=user_id, password=app.hash_password(password))
            if email is not None:
                db.set_user_email(user_id=user_id, email=email)
            if phone is not None:
                db.set_user_phone(user_id=user_id, phone=phone)
            if is_admin is not None:
                db.set_user_is_admin(user_id=user_id, is_admin=is_admin)
            return "", 204

        @app.delete("/users/<user_id>", authz="ADMIN")
        def delete_users_id(user_id: str):
            current_user_data = db.get_user_data(login=app.get_user())
            fsa.checkVal(user_id != current_user_data['aid'], "cannot delete oneself", 400)

            # Get user profile to find avatar
            try:
                profile = db.get_user_profile(user_id=user_id)
                # Delete profile picture if it exists
                if profile and profile.get('avatar_url'):
                    avatar_path = os.path.join(os.getcwd(), profile['avatar_url'].lstrip('/'))
                    if os.path.exists(avatar_path):
                        os.remove(avatar_path)
                        log.info(f"Deleted profile picture: {avatar_path}")
            except Exception as e:
                log.warning(f"Could not delete profile picture for user {user_id}: {e}")

            deleted = db.delete_user(user_id=user_id)
            fsa.checkVal(deleted, f"no such user: {user_id}", 404)
            return "", 204
