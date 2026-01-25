#
# shared global access to the database through AnoDB
#
# DB can be imported and used in any module, including blueprints.
#

import logging
from FlaskSimpleAuth import Reference, Flask, Response  # type: ignore
import anodb  # type: ignore
from utils import log, print

# TODO this is kind-of a psycopg utility function
def healthy(db) -> bool:  # pragma: no cover
    """Check for database idle connection health."""
    status = db._conn.info.transaction_status
    _ = status != 0 and log.error(f"db {db._id} health check on non idle connection: {status}")
    try:
        is_healthy = db._conn.execute("SELECT 1 AS one").fetchall() == [{"one": 1}]
        _ = is_healthy or log.error("db {db._id} health result error")
        db.commit()
        return is_healthy and db._conn.info.transaction_status == 0
    except Exception as e:
        log.error(f"db {db._id} health exception: {e}")
        return False

#
# empty proxy with a pool and timeout which should generate a 500 if triggered.
#
db = Reference(
    # useful hooks for anodb connections
    closer=lambda o: o.close(),
    stats=lambda o: o._stats(),
    health=healthy
)

# *ALWAYS* end transactions after request execution
def db_commit(res: Response) -> Response:
    """Commit or rollback depending on the response status."""
    if not db._has_obj():  # pragma: no cover
        return res  # nothing to do, no db was used (unlikely).
    try:
        status = db._conn.info.transaction_status
        log.debug(f"db {db._id} commit {res.status} {status}")
        if status == 0:  # idle  # pragma: no cover
            pass
        elif status in (1, 2):  # active, in tx
            if status == 1:  # pragma: no cover
                # it may occur if data from a previous SELECT was not extracted?
                log.warning(f"db {db._id} ACTIVE transaction on commit?!")
                # FIXME… close cursors? we do not have them available
            if res.status_code < 400:
                db.commit()
            else:  # 4xx and 5xx
                db.rollback()
        elif status == 3:  # in error  # pragma: no cover
            # FIXME force 4xx or 5xx?
            db.rollback()
        elif status == 4:  # unknown  # pragma: no cover
            log.error(f"db {db._id} UNKNOWN state forcibly closed after request")
            # FIXME force 5xx?
            db.close()
        else:  # pragma: no cover
            raise Exception(f"db {db._id} unexpected tx status: {status}")
    except Exception as err:  # pragma: no cover
        log.error(f"db {db._id} transaction failed: {err}")
        return Response("transaction failure", 500)
    finally:  # return connection to pool, if in bad state it should be dropped…
        db._ret_obj()
    return res

# this hook ensures that the database object is returned to the pool.
# NOTE this runs after connection or pool errors
def db_return(err):
    """Return db object to internal pool."""
    if err:  # pragma: no cover
        log.error(f"unhandled exception: {err}")
    if not db._has_obj():  # pragma: no cover
        return  # nothing to do, eg "get" raised an error
    else:  # pragma: no cover
        # NOTE this only runs if the db_commit hook did not return the obj
        try:
            status = db._conn.info.transaction_status
            if status in (1, 2, 3):  # ACTIVE, INTX, INERR
                log.error(f"db {db._id} unclosed tx ({status}): aborting")
                db.rollback()
                status = db._conn.info.transaction_status
            if status != 0:  # not IDLE
                log.error(f"db {db._id} unexpected tx status: {status}")
            if status == 4:  # UNKNOWN
                log.error(f"db {db._id} UNKNOWN state forcibly closed in teardown")
                db.close()
        except Exception as e:
            log.error(f"db {db._id} error: {e}")
        finally:  # return connection to pool, if in bad state it should be dropped…
            db._ret_obj()

def init_app(app: Flask):
    log.info(f"initializing database for {app.name}")
    # set pool parameters
    db._set_pool(**app.config["POOL"])
    # db actual (per-thread) initialization
    db.set(fun=lambda _i: anodb.DB(**app.config["DATABASE"]))
    # after_request may not be executed under some errors
    app.after_request(db_commit)
    # this is always executed, whatever happened
    app.teardown_request(db_return)
