#
# System Routes - /info, /stats, /uptime, /who-am-i, /myself
#

import sys
import datetime
import logging
from importlib.metadata import version as pkg_version
import FlaskSimpleAuth as fsa

def register_routes(app):
    """Register system routes with the Flask app."""
    from database import db
    from utils import log
    import version
    import model

    # Store started time when module loads
    started = datetime.datetime.now(datetime.timezone.utc)

    # Define ADMIN_AUTHN here for routes
    ADMIN_AUTHN = ["token", "basic", "param"]

    # under testing, quick route to check whether the server is running
    # NOTE: This MUST be OPEN for health checks (no auth required)
    if app.config.get("APP_TESTING", False):
        @app.get("/uptime", authz="OPEN", authn="none")
        def get_uptime():
            running = db.now() - started
            return {"app": app.name, "up": running}, 200

    # GET /info (sleep?)
    @app.get("/info", authz="ADMIN", authn=ADMIN_AUTHN)
    def get_info(sleep: float = 0.0):
        import os
        import time

        # take db early to create an artificially long transaction
        now = db.now()

        # possibly include a delay, for testing purposes…
        if sleep > 0.0:
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
        from utils import print
        print("generating pool stats…")
        return db._pool.stats()

    # GET /who-am-i
    @app.get("/who-am-i", authz="AUTH", authn=ADMIN_AUTHN)
    def get_who_am_i(user: fsa.CurrentUser):
        return fsa.jsonify(user), 200

    # GET /myself
    @app.get("/myself", authz="AUTH", authn=ADMIN_AUTHN)
    def get_myself(auth: model.CurrentAuth):
        # Convert auth to dict and rename is_admin to isadmin for backward compatibility
        result = {
            "login": auth.login,
            "password": auth.password,
            "email": auth.email,
            "isadmin": auth.is_admin,
            "aid": auth.aid
        }
        return fsa.jsonify(result), 200

    # Serve static media files using Flask's native routing
    from flask import send_from_directory
    import os
    
    @app.route("/media/<folder>/<filename>", methods=["GET"], authz="OPEN", authn="none")
    def serve_media_file(folder: str, filename: str):
        """Serve static media files (profile avatars, category icons, etc.)."""
        # Security: prevent directory traversal
        if ".." in folder or ".." in filename:
            return {"error": "Invalid path"}, 400
        
        media_dir = os.path.join(os.getcwd(), "media", folder)
        return send_from_directory(media_dir, filename)
    
    @app.route("/media/<folder>/<subfolder>/<filename>", methods=["GET"], authz="OPEN", authn="none")
    def serve_media_file_nested(folder: str, subfolder: str, filename: str):
        """Serve nested static media files (e.g., user/profile/avatar.jpg)."""
        # Security: prevent directory traversal
        if ".." in folder or ".." in subfolder or ".." in filename:
            return {"error": "Invalid path"}, 400
        
        media_dir = os.path.join(os.getcwd(), "media", folder, subfolder)
        return send_from_directory(media_dir, filename)
