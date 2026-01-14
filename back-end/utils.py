import psycopg as pg
import FlaskSimpleAuth as fsa
import logging
import os

log = logging.getLogger(os.environ.get("APP_NAME", "app"))

# NOTE check APP_LOGGING_LEVEL configuration!
def print(*args):
    """Convenient overwrite to print as debug."""
    log.debug(" ".join(args))

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
