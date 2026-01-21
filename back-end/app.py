#
# Any Application Bootstrap
#
# Environment:
#
# - APP_NAME: application name
# - APP_CONFIG: path to configuration file
# - APP_SECRET: secret for token signatures
#
# Configuration:
#
# - APP_LOGGING_LEVEL: level of logging
# - APP_TESTING: enable testing route /uptime
# - APP_USERS: enable /users routes for testing
#

import os
import re
import sys
import datetime
from importlib.metadata import version as pkg_version

# initial logging configuration
import logging
logging.basicConfig(level=logging.INFO)

from utils import log, print, ensure_media_dir, allowed_file, get_avatar_url, get_max_file_size, get_allowed_extensions

# start and configure flask service
import FlaskSimpleAuth as fsa
jsonify = fsa.jsonify

app = fsa.Flask(os.environ["APP_NAME"], static_folder=None)
app.config.from_envvar("APP_CONFIG")

# setup application log
log.setLevel(app.config.get("APP_LOGGING_LEVEL", logging.NOTSET))
log.info(f"app log set to {logging.getLevelName(log.level)}")

started = datetime.datetime.now(datetime.timezone.utc)
log.info(f"started on {started}")

# persistent possibly pooled database connection
import database
database.init_app(app)
db = database.db

# authentication and authorization for the app
import auth
auth.init_app(app)

# allow any authentication for admins, for some special routes only
ADMIN_AUTHN = ["token", "basic", "param"]

# predefined data structures
import model

# under testing, quick route to check whether the server is running
if app.config.get("APP_TESTING", False):
    @app.get("/uptime", authz="OPEN", authn="none")
    def get_uptime():
        running = db.now() - started
        return {"app": app.name, "up": running}, 200

#
# General information about running app.
#
# GET /info (sleep?)
@app.get("/info", authz="ADMIN", authn=ADMIN_AUTHN)
def get_info(sleep: float = 0.0):

    import version

    # take db early to create an artificially long transaction
    now = db.now()

    # possibly include a delay, for testing purposes…
    if sleep > 0.0:
        import time
        time.sleep(sleep)

    # describe app
    info = {
        # running
        "app": app.name,
        # git info
        "git": {
            "remote": version.remote,
            "branch": version.branch,
            "commit": version.commit,
            "date": version.date,
        },
        # authn data
        "authentication": {
            "config": app.config.get("FSA_AUTH", None),
            "user": app.get_user(required=False),
            "auth": app._fsa._local.source,
        },
        # database
        "db": {
            "type": app.config["DATABASE"]["db"],
            "driver": db._db,
            "version": db._db_version,
            # not shown: database connection parameters…
        },
        # running status
        "status": {
            "started": str(started),
            "now": now,
            "connections": db._nobjs,
            "hits": app._fsa._cm._cache.hits(),  # type: ignore
        },
        # package versions
        "version": {
            "uname": os.uname(),
            "python": sys.version,
            db._db: db._db_version,
            "postgres": db.version(),
            app.name: version.commit.split(" ")[0],
        },
    }

    # other package versions
    for pkg in ("FlaskSimpleAuth", "flask", "aiosql", "anodb", "cachetools",
                "CacheToolsUtils", "ProxyPatternPool"):
        info["version"][pkg] = pkg_version(pkg)

    return info, 200

# GET /stats
@app.get("/stats", authz="ADMIN", authn=ADMIN_AUTHN)
def get_stats():
    print("generating pool stats…")  # for coverage on "print"
    return db._pool.stats()  # type: ignore

# GET /who-am-i
@app.get("/who-am-i", authz="AUTH", authn=ADMIN_AUTHN)
def get_who_am_i(user: fsa.CurrentUser):
    return jsonify(user), 200

# GET /myself
@app.get("/myself", authz="AUTH", authn=ADMIN_AUTHN)
def get_myself(auth: model.CurrentAuth):
    return jsonify(auth), 200

# POST /register (login, email, password)
@app.post("/register", authz="OPEN", authn="none")
def post_register(login: model.Login, email: str, password: str):
    # NOTE passwords have constraints, see configuration
    aid = db.insert_user(login=login, email=email, password=app.hash_password(password), is_admin=False)
    fsa.checkVal(aid, f"user {login} already registered", 409)
    return jsonify(aid), 201

# GET /login
@app.get("/login", authz="AUTH", authn="basic")
def get_login(user: fsa.CurrentUser):
    return jsonify(app.create_token(user)), 200

# POST /login (login, password)
#
# NOTE web-oriented approach is to use POST
@app.post("/login", authz="AUTH", authn="param")
def post_login(user: fsa.CurrentUser):
    return jsonify(app.create_token(user)), 201

# Information about PAPS
#
# GET /paps - returns different data based on user role
@app.get("/paps", authz="AUTH")
def get_paps(user: fsa.CurrentUser):
    """
    Get PAPS postings. Admins see all PAPS, regular users see only public ones.
    """
    if user.is_admin:
        paps = db.get_all_paps_admin()
    else:
        paps = db.get_all_paps_user()
    return jsonify(paps), 200

# POST /paps
@app.post("/paps", authz="AUTH")
def post_paps(user: fsa.CurrentUser, title: str, description: str, payment_amount: float, payment_currency: str = "USD", payment_type: str = "fixed", max_applicants: int = 1, max_assignees: int = 1, location_address: str|None = None, location_lat: float|None = None, location_lng: float|None = None, subtitle: str|None = None, start_datetime: str|None = None, end_datetime: str|None = None, estimated_duration_minutes: int|None = None, is_public: bool = True):
    # Validate required fields
    fsa.checkVal(len(title.strip()) >= 5, "Title must be at least 5 characters", 400)
    fsa.checkVal(len(description.strip()) >= 20, "Description must be at least 20 characters", 400)
    fsa.checkVal(payment_amount > 0, "Payment amount must be positive", 400)
    fsa.checkVal(payment_type in ("fixed", "hourly", "negotiable"), "Invalid payment type", 400)
    fsa.checkVal(max_applicants > 0 and max_applicants <= 100, "Max applicants must be between 1 and 100", 400)
    fsa.checkVal(max_assignees > 0 and max_assignees <= max_applicants, "Max assignees must be positive and not exceed max applicants", 400)
    if location_lat is not None or location_lng is not None:
        fsa.checkVal(location_lat is not None and location_lng is not None, "Both lat and lng must be provided for location", 400)
        fsa.checkVal(-90 <= location_lat <= 90, "Invalid latitude", 400)
        fsa.checkVal(-180 <= location_lng <= 180, "Invalid longitude", 400)
    if start_datetime is not None:
        # Assuming datetime is passed as ISO string
        try:
            start_dt = datetime.datetime.fromisoformat(start_datetime.replace('Z', '+00:00'))
        except ValueError:
            fsa.checkVal(False, "Invalid start_datetime format", 400)
    if end_datetime is not None:
        try:
            end_dt = datetime.datetime.fromisoformat(end_datetime.replace('Z', '+00:00'))
            if start_datetime is not None and end_dt <= start_dt:
                fsa.checkVal(False, "End datetime must be after start datetime", 400)
        except ValueError:
            fsa.checkVal(False, "Invalid end_datetime format", 400)
    
    # Insert the PAPS
    pid = db.insert_paps(
        owner_id=user.id,
        title=title.strip(),
        subtitle=subtitle.strip() if subtitle else None,
        description=description.strip(),
        status="draft",  # Default to draft, can be published later
        location_address=location_address,
        location_lat=location_lat,
        location_lng=location_lng,
        start_datetime=start_dt if start_datetime else None,
        end_datetime=end_dt if end_datetime else None,
        estimated_duration_minutes=estimated_duration_minutes,
        payment_amount=payment_amount,
        payment_currency=payment_currency,
        payment_type=payment_type,
        max_applicants=max_applicants,
        max_assignees=max_assignees,
        is_public=is_public
    )
    return jsonify(pid), 201

# User Profile Management
#
import pathlib
from werkzeug.utils import secure_filename

# GET /profile - get current user's profile
@app.get("/profile", authz="AUTH")
def get_profile(user: fsa.CurrentUser):
    """Get the current authenticated user's profile."""
    profile = db.get_user_profile(user_id=user.id)
    if not profile:
        return {"error": "Profile not found"}, 404
    return jsonify(profile), 200

# PUT /profile - update current user's profile
@app.put("/profile", authz="AUTH")
def put_profile(user: fsa.CurrentUser, first_name: str|None = None, last_name: str|None = None, 
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
        user_id=user.id,
        first_name=first_name.strip() if first_name else None,
        last_name=last_name.strip() if last_name else None,
        display_name=display_name.strip() if display_name else None,
        bio=bio.strip() if bio else None,
        avatar_url=None,  # Avatar URL updated via dedicated endpoint
        date_of_birth=date_of_birth,
        location_address=location_address.strip() if location_address else None,
        location_lat=location_lat,
        location_lng=location_lng,
        timezone=timezone,
        preferred_language=preferred_language
    )
    return "", 204

# POST /profile/avatar - upload user profile avatar image
@app.post("/profile/avatar", authz="AUTH")
def post_avatar(user: fsa.CurrentUser):
    """Upload a profile avatar image. Expects multipart form data with 'image' field."""
    ensure_media_dir()
    
    # Check if image file is in request
    fsa.checkVal("image" in fsa.request.files, "No image file provided", 400)
    
    file = fsa.request.files["image"]
    fsa.checkVal(file.filename != "", "No file selected", 400)
    fsa.checkVal(allowed_file(file.filename, app), 
                f"File type not allowed. Allowed: {', '.join(get_allowed_extensions(app))}", 415)
    
    # Check file size
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Reset to start
    max_size = get_max_file_size(app)
    fsa.checkVal(file_size <= max_size, 
                f"File too large (max {max_size / 1024 / 1024}MB)", 413)
    
    # Save file with user_id as name to ensure uniqueness and overwrite
    from utils import PROFILE_IMG_DIR
    filename = secure_filename(f"{user.id}.jpg")
    filepath = PROFILE_IMG_DIR / filename
    file.save(filepath)
    
    # Update avatar_url in database
    avatar_url = get_avatar_url(user.id)
    db.update_user_profile(
        user_id=user.id,
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

# GET /profile/avatar/<user_id> - retrieve user's profile avatar image
@app.get("/profile/avatar/<user_id>", authz="OPEN", authn="none")
def get_avatar(user_id: str):
    """Get a user's profile avatar image by user ID."""
    from utils import PROFILE_IMG_DIR
    filepath = PROFILE_IMG_DIR / secure_filename(f"{user_id}.jpg")
    
    if not filepath.exists():
        return {"error": "Avatar not found"}, 404
    
    # Serve the image file with proper content-type
    from flask import send_file
    return send_file(filepath, mimetype="image/jpeg")



# Admin's /users
#
# user management routes for testing, disable with APP_USERS = False
#
if app.config.get("APP_USERS", False):
    log.warning("/users testing routes are active")

    # GET /users (flt?)
    @app.get("/users", authz="ADMIN")
    def get_users(flt: str|None = None):
        res = db.get_user_all() if flt is None else db.get_user_filter(flt=flt)
        return jsonify(res), 200

    # POST /users (login, password, is_admin)
    @app.post("/users", authz="ADMIN")
    def post_users(login: model.Login, password: str, is_admin: bool):
        # NOTE ON CONFLICT RETURNING returns NULL, triggering the 409
        aid = db.insert_user(login=login, email=login, password=app.hash_password(password), is_admin=is_admin)
        fsa.checkVal(aid, f"user {login} already created", 409)
        return jsonify(aid), 201

    # GET /users/<login>
    @app.get("/users/<login>", authz="ADMIN")
    def get_users_login(login: model.Login):
        res = db.get_user_data(login=login)
        fsa.checkVal(res, f"no such user: {login}", 404)
        return res, 200

    # PATCH /users/<login> (password?, email?, is_admin?)
    @app.patch("/users/<login>", authz="ADMIN")
    def patch_users_login(login: model.Login, password: str|None = None, email: str|None = None, is_admin: bool|None = None):
        fsa.checkVal(db.get_user_login_lock(login=login), f"no such user: {login}", 404)
        if password is not None:
            db.set_user_password(login=login, password=app.hash_password(password))
        if email is not None:
            db.set_user_email(login=login, email=email)
        if is_admin is not None:
            db.set_user_is_admin(login=login, is_admin=is_admin)
        return "", 204

    # PUT /users/<login> (auth)
    @app.put("/users/<login>", authz="ADMIN")
    def put_users_login(login: model.Login, auth: model.Auth):
        fsa.checkVal(login == auth.login, f"inconsistent login: {login} vs {auth.login}", 400)
        auth.password = app.hash_password(auth.password)
        # anodb expects object with attributes matching query parameters
        fsa.checkVal(db.update_user(a=auth), f"no such user: {login}", 404)
        return "", 204

    # DELETE /users/<login>
    @app.delete("/users/<login>", authz="ADMIN")
    def delete_users_login(login: model.Login):
        # should it also forbid deleting admins?
        fsa.checkVal(login != app.get_user(), "cannot delete oneself", 400)
        # NOTE a user should rather be disactivated
        deleted = db.delete_user(login=login)
        fsa.checkVal(deleted, f"no such user: {login}", 404)
        app.auth_uncache(login)
        return "", 204

# TODO add new routes here.
# NOTE if this file becomes too large, consider using blueprints.
# NOTE group and object permissions should only use "authz=…".
# NOTE if so, only "token" authentication is allowed (see FSA_DEFAULT_AUTH in "local.conf")
# NOTE comment out the configuration directive to allow more authentication schemes.

# NOTE keep this as the last line of code
log.info("running…")
