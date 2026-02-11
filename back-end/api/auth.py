#
# Authentication Routes - /register, /login
#

import re
import FlaskSimpleAuth as fsa

def register_routes(app):
    """Register authentication routes with the Flask app."""
    from database import db

    # POST /register (login, email, phone, password)
    # NOTE: This MUST be OPEN so new users can register without a token
    @app.post("/register", authz="OPEN", authn="none")
    def post_register(username: str, email: str, password: str, phone: str|None = None):
        """Register a new user with username, email, optional phone, and password."""
        # Validate username length
        fsa.checkVal(len(username.strip()) >= 3 and len(username.strip()) <= 50,
                     "Username must be 3-50 characters", 400)

        # Validate username format (no spaces, must start with letter)
        username_regex = r'^[a-zA-Z][-a-zA-Z0-9_\.]*$'
        fsa.checkVal(bool(re.match(username_regex, username.strip())),
                     "Username can only contain letters, numbers, hyphens, underscores, and dots. Must start with a letter.", 400)

        # Validate email format
        email_regex = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        fsa.checkVal(bool(re.match(email_regex, email)), "Invalid email format", 400)

        # Validate phone if provided
        if phone:
            phone_regex = r'^\+?[1-9]\d{1,14}$'
            fsa.checkVal(bool(re.match(phone_regex, phone)), "Invalid phone format", 400)

        # Insert user
        aid = db.insert_user(
            username=username.strip(),
            email=email.strip(),
            phone=phone.strip() if phone else None,
            password=app.hash_password(password),
            is_admin=False,
            user_id=None
        )
        fsa.checkVal(aid, "User with this username, email, or phone already exists", 409)
        return fsa.jsonify({"user_id": aid}), 201

    # GET /login
    # NOTE: This MUST be OPEN so users can get tokens; authn="basic" checks credentials
    @app.get("/login", authz="OPEN", authn="basic")
    def get_login(user: fsa.CurrentUser):
        """Login with Basic auth (username/email/phone + password) to get token."""
        login = db.get_user_login(login=user)
        fsa.checkVal(login and login.get("login"), "Invalid login", 401)
        return fsa.jsonify({"token": app.create_token(login["login"])}), 200

    # POST /login (login, password)
    # NOTE: This MUST be OPEN so users can get tokens; authn="param" checks credentials
    @app.post("/login", authz="OPEN", authn="param")
    def post_login(user: fsa.CurrentUser):
        """Login with form params (login + password) to get token."""
        login = db.get_user_login(login=user)
        fsa.checkVal(login and login.get("login"), "Invalid login", 401)
        return fsa.jsonify({"token": app.create_token(login["login"])}), 201
