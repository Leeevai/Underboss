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

# initial logging configuration
logging.basicConfig(level=logging.INFO)

from utils import log

# start and configure flask service
import FlaskSimpleAuth as fsa
from flask.json.provider import DefaultJSONProvider

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

app = fsa.Flask(os.environ["APP_NAME"], static_folder=None)
app.json_provider_class = CustomJSONProvider
app.json = CustomJSONProvider(app)
app.config.from_envvar("APP_CONFIG")

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

# Register all API routes from modular structure
import api
api.register_routes(app)

log.info("running…")
