#
# API Module - Contains all route handlers organized by resource
#

from . import system
from . import auth
from . import profile
from . import category
from . import paps
from . import spap
from . import user
from . import comment

def register_routes(app):
    """Register all API route modules with the Flask app."""
    system.register_routes(app)
    auth.register_routes(app)
    profile.register_routes(app)
    category.register_routes(app)
    paps.register_routes(app)
    spap.register_routes(app)
    user.register_routes(app)
    comment.register_routes(app)
