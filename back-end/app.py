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
import datetime
import logging
import decimal
import json
import shutil
from pathlib import Path

# initial logging configuration
logging.basicConfig(level=logging.INFO)

from utils import log

# Clone test_media to media directory on startup
# This ensures sample media files are available for testing
def setup_media_from_test():
    """Copy test_media contents to media directory if test_media exists."""
    app_dir = Path(__file__).parent
    test_media_dir = app_dir / "test_media"
    media_dir = app_dir / "media"

    if test_media_dir.exists() and test_media_dir.is_dir():
        log.info("Copying test_media to media directory...")
        # Create media directory if it doesn't exist
        media_dir.mkdir(exist_ok=True)

        # Copy all contents from test_media to media
        for item in test_media_dir.iterdir():
            dest = media_dir / item.name
            if item.is_dir():
                # Copy directory tree, replacing existing
                if dest.exists():
                    shutil.rmtree(dest)
                shutil.copytree(item, dest)
            else:
                # Copy file
                shutil.copy2(item, dest)
        log.info(f"Test media copied to {media_dir}")

# start and configure flask service
import FlaskSimpleAuth as fsa
from flask.json.provider import DefaultJSONProvider  # type: ignore[import-not-found]

# Custom JSON provider to handle Decimal and other types
class CustomJSONProvider(DefaultJSONProvider):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            # Convert Decimal to float for JSON serialization
            return float(o)
        if isinstance(o, datetime.timedelta):
            # Convert timedelta to total seconds
            return o.total_seconds()
        return super().default(o)

app = fsa.Flask(os.environ["APP_NAME"], static_folder="media", static_url_path="/media")
app.json_provider_class = CustomJSONProvider
app.json = CustomJSONProvider(app)
app.config.from_envvar("APP_CONFIG")

if app.config.get("APP_TESTING", False):
    # Run media setup
    setup_media_from_test()

# setup application log
log.setLevel(app.config.get("APP_LOGGING_LEVEL", logging.NOTSET))
log.info(f"app log set to {logging.getLevelName(log.level)}")

log.info(f"started on {datetime.datetime.now(datetime.timezone.utc)}")

# persistent possibly pooled database connection
import database
database.init_app(app)

# authentication and authorization for the app
import auth
auth.init_app(app)

# Initialize media handler for centralized media management
import mediator
mediator.init_media_handler(app)

# Register all API routes from modular structure
import api
api.register_routes(app)

log.info("running…")
