#
# API Module - Contains all route handlers organized by resource
#

from . import system
from . import auth
from . import profile
from . import experience
from . import category
from . import interest
from . import paps
from . import user

def register_routes(app):
    """Register all API route modules with the Flask app."""
    system.register_routes(app)
    auth.register_routes(app)
    profile.register_routes(app)
    experience.register_routes(app)
    category.register_routes(app)
    interest.register_routes(app)
    paps.register_routes(app)
    user.register_routes(app)
