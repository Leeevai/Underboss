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
import uuid
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
        },
        # running status
        "status": {
            "started": str(started),
            "now": now,
            "connections": db._nobjs,
            "hits": app._fsa._cm._cache.hits(),
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
    print("generating pool stats…")
    return db._pool.stats()

# GET /who-am-i
@app.get("/who-am-i", authz="AUTH", authn=ADMIN_AUTHN)
def get_who_am_i(user: fsa.CurrentUser):
    return jsonify(user), 200

# GET /myself
@app.get("/myself", authz="AUTH", authn=ADMIN_AUTHN)
def get_myself(auth: model.CurrentAuth):
    return jsonify(auth), 200

# ============================================
# AUTHENTICATION & REGISTRATION
# ============================================

# POST /register (login, email, phone, password)
@app.post("/register", authz="OPEN", authn="none")
def post_register(username: str, email: str, password: str, phone: str|None = None):
    """Register a new user with username, email, optional phone, and password."""
    # Validate username
    fsa.checkVal(len(username.strip()) >= 3 and len(username.strip()) <= 50, 
                "Username must be 3-50 characters", 400)
    
    # Validate email format
    import re
    email_regex = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    fsa.checkVal(re.match(email_regex, email), "Invalid email format", 400)
    
    # Validate phone if provided
    if phone:
        phone_regex = r'^\+?[1-9]\d{1,14}$'
        fsa.checkVal(re.match(phone_regex, phone), "Invalid phone format", 400)
    
    # Insert user
    aid = db.insert_user(
        username=username.strip(), 
        email=email.strip(), 
        phone=phone.strip() if phone else None,
        password=app.hash_password(password), 
        is_admin=False
    )
    fsa.checkVal(aid, f"User with this username, email, or phone already exists", 409)
    return jsonify({"user_id": aid}), 201

# GET /login
@app.get("/login", authz="AUTH", authn="basic")
def get_login(user: fsa.CurrentUser):
    """Login with Basic auth (username/email/phone + password) to get token."""
    return jsonify({"token": app.create_token(user)}), 200

# POST /login (login, password)
@app.post("/login", authz="AUTH", authn="param")
def post_login(user: fsa.CurrentUser):
    """Login with form params (login + password) to get token."""
    return jsonify({"token": app.create_token(user)}), 201

# ============================================
# USER PROFILE MANAGEMENT
# ============================================

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
    
    return jsonify(profile), 200

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
    
    return jsonify(profile), 200

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
    from utils import PROFILE_IMG_DIR
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
    from utils import PROFILE_IMG_DIR
    
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

# ============================================
# USER EXPERIENCES
# ============================================

# GET /profile/experiences - get current user's experiences
@app.get("/profile/experiences", authz="AUTH")
def get_my_experiences(auth: model.CurrentAuth):
    """Get current user's work experiences."""
    experiences = db.get_user_experiences(user_id=auth.aid)
    return jsonify(experiences), 200

# GET /users/<user_id>/experiences - get any user's experiences
@app.get("/users/<user_id>/experiences", authz="OPEN", authn="none")
def get_user_experiences(user_id: str):
    """Get any user's work experiences."""
    try:
        uuid.UUID(user_id)
    except ValueError:
        return {"error": "Invalid user ID format"}, 400
    
    experiences = db.get_user_experiences(user_id=user_id)
    return jsonify(experiences), 200

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
    
    return jsonify({"experience_id": exp_id}), 201

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

# ============================================
# CATEGORIES
# ============================================

# GET /categories - list all active categories
@app.get("/categories", authz="OPEN", authn="none")
def get_categories():
    """Get all active categories."""
    categories = db.get_all_categories()
    return jsonify(categories), 200

# GET /categories/<category_id> - get specific category
@app.get("/categories/<category_id>", authz="OPEN", authn="none")
def get_category(category_id: str):
    """Get a specific category by ID."""
    try:
        uuid.UUID(category_id)
    except ValueError:
        return {"error": "Invalid category ID format"}, 400
    
    category = db.get_category_by_id(category_id=category_id)
    if not category:
        return {"error": "Category not found"}, 404
    
    return jsonify(category), 200

# POST /categories - create category (admin only)
@app.post("/categories", authz="ADMIN")
def post_category(auth: model.CurrentAuth, name: str, slug: str, 
                 description: str|None = None, parent_id: str|None = None,
                 icon_url: str|None = None):
    """Create a new category (admin only)."""
    fsa.checkVal(len(name.strip()) >= 2, "Name must be at least 2 characters", 400)
    fsa.checkVal(re.match(r'^[a-z0-9-]+$', slug), "Slug must be lowercase letters, numbers, and hyphens", 400)
    
    if parent_id:
        try:
            uuid.UUID(parent_id)
        except ValueError:
            return {"error": "Invalid parent_id format"}, 400
    
    cat_id = db.insert_category(
        name=name.strip(),
        slug=slug.strip(),
        description=description.strip() if description else None,
        parent_id=parent_id,
        icon_url=icon_url
    )
    
    return jsonify({"category_id": cat_id}), 201

# PATCH /categories/<category_id> - update category (admin only)
@app.patch("/categories/<category_id>", authz="ADMIN")
def patch_category(category_id: str, auth: model.CurrentAuth, name: str|None = None, 
                  slug: str|None = None, description: str|None = None,
                  parent_id: str|None = None, icon_url: str|None = None,
                  is_active: bool|None = None):
    """Update a category (admin only)."""
    try:
        uuid.UUID(category_id)
    except ValueError:
        return {"error": "Invalid category ID format"}, 400
    
    category = db.get_category_by_id(category_id=category_id)
    if not category:
        return {"error": "Category not found"}, 404
    
    if name is not None:
        fsa.checkVal(len(name.strip()) >= 2, "Name must be at least 2 characters", 400)
    
    if slug is not None:
        fsa.checkVal(re.match(r'^[a-z0-9-]+$', slug), "Slug must be lowercase letters, numbers, and hyphens", 400)
    
    db.update_category(
        category_id=category_id,
        name=name.strip() if name else None,
        slug=slug.strip() if slug else None,
        description=description.strip() if description else None,
        parent_id=parent_id,
        icon_url=icon_url,
        is_active=is_active
    )
    
    return "", 204

# DELETE /categories/<category_id> - delete category (admin only)
@app.delete("/categories/<category_id>", authz="ADMIN")
def delete_category(category_id: str, auth: model.CurrentAuth):
    """Delete a category (admin only)."""
    try:
        uuid.UUID(category_id)
    except ValueError:
        return {"error": "Invalid category ID format"}, 400
    
    category = db.get_category_by_id(category_id=category_id)
    if not category:
        return {"error": "Category not found"}, 404
    
    db.delete_category(category_id=category_id)
    return "", 204

# ============================================
# USER INTERESTS
# ============================================

# GET /profile/interests - get current user's interests
@app.get("/profile/interests", authz="AUTH")
def get_my_interests(auth: model.CurrentAuth):
    """Get current user's interests."""
    interests = db.get_user_interests(user_id=auth.aid)
    return jsonify(interests), 200

# GET /users/<user_id>/interests - get any user's interests
@app.get("/users/<user_id>/interests", authz="OPEN", authn="none")
def get_user_interests(user_id: str):
    """Get any user's interests."""
    try:
        uuid.UUID(user_id)
    except ValueError:
        return {"error": "Invalid user ID format"}, 400
    
    interests = db.get_user_interests(user_id=user_id)
    return jsonify(interests), 200

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
    
    db.delete_user_interest(user_id=auth.aid, category_id=category_id)
    return "", 204

# ============================================
# PAPS (JOB POSTS)
# ============================================

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
    except:
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
    
    return jsonify(paps), 200

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
    
    return jsonify({"paps_id": pid}), 201

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
    except:
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
    
    # Enrich with media and categories
    paps['media_urls'] = db.get_paps_media_urls(paps_id=paps_id)
    paps['categories'] = db.get_paps_categories(paps_id=paps_id)
    paps['comments_count'] = db.get_paps_comments_count(paps_id=paps_id)
    paps['applications_count'] = db.get_paps_applications_count(paps_id=paps_id)
    
    return jsonify(paps), 200

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
    
    # Add other fields as needed...
    # This pattern continues for all updatable fields
    
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
    from utils import POST_MEDIA_DIR
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
    from utils import POST_MEDIA_DIR
    
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


# Admin's /users routes for testing
if app.config.get("APP_USERS", False):
    log.warning("/users testing routes are active")

    @app.get("/users", authz="ADMIN")
    def get_users(flt: str|None = None):
        res = db.get_user_all() if flt is None else db.get_user_filter(flt=flt)
        return jsonify(res), 200

    @app.post("/users", authz="ADMIN")
    def post_users(username: str, email: str, password: str, phone: str|None = None, is_admin: bool = False):
        aid = db.insert_user(username=username, email=email, phone=phone, 
                           password=app.hash_password(password), is_admin=is_admin)
        fsa.checkVal(aid, f"user {username} already created", 409)
        return jsonify({"user_id": aid}), 201

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
        deleted = db.delete_user(user_id=user_id)
        fsa.checkVal(deleted, f"no such user: {user_id}", 404)
        return "", 204

log.info("running…")