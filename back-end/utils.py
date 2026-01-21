import psycopg as pg
import FlaskSimpleAuth as fsa
import logging
import os
import pathlib
from werkzeug.utils import secure_filename

log = logging.getLogger(os.environ.get("APP_NAME", "app"))

# Media storage configuration
MEDIA_DIR = pathlib.Path("media")
PROFILE_IMG_DIR = MEDIA_DIR / "user" / "profile"

# NOTE: ALLOWED_EXTENSIONS and MAX_FILE_SIZE are defined in local.conf
# They are loaded from app.config at runtime via get_media_config()

# NOTE check APP_LOGGING_LEVEL configuration!
def print(*args):
    """Convenient overwrite to print as debug."""
    log.debug(" ".join(args))

def get_media_config(app=None):
    """
    Get media configuration from Flask app config.
    If app is not provided, use default values.
    """
    if app and "MEDIA_CONFIG" in app.config:
        return app.config["MEDIA_CONFIG"]
    else:
        # Default fallback values
        return {
            "allowed_extensions": {"jpg", "jpeg", "png", "gif", "webp"},
            "max_file_size": 5 * 1024 * 1024,  # 5MB
        }

# Media management helper functions
def ensure_media_dir():
    """Create media directories if they don't exist."""
    PROFILE_IMG_DIR.mkdir(parents=True, exist_ok=True)

def allowed_file(filename: str, app=None) -> bool:
    """Check if file extension is allowed."""
    config = get_media_config(app)
    allowed_exts = config.get("allowed_extensions", {"jpg", "jpeg", "png", "gif", "webp"})
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_exts

def get_avatar_url(login: str) -> str:
    """Generate avatar URL path for a user based on login."""
    return f"/profile/avatar/{login}"

def get_max_file_size(app=None) -> int:
    """Get maximum file size in bytes."""
    config = get_media_config(app)
    return config.get("max_file_size", 5 * 1024 * 1024)

def get_allowed_extensions(app=None) -> set:
    """Get allowed file extensions."""
    config = get_media_config(app)
    return config.get("allowed_extensions", {"jpg", "jpeg", "png", "gif", "webp"})

# this function is passed to anodb to filter database errors
# NOTE we could also rely on @app.errorhandler for this purpose
def dbex(ex: BaseException) -> BaseException:
    """Turn some exceptions into 400."""
    log.error(f"db error: {ex}")
    if isinstance(ex, (pg.IntegrityError, pg.DataError)):
        return fsa.ErrorResponse(f"db error: {type(ex).__name__}", 400)
    else:  # pragma: no cover
        # Interface, Database, Operational,  Internal, Programming errors
        return ex
