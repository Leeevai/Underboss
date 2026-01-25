#
# Authentication and Authorization Helpers
#

import logging
import FlaskSimpleAuth as fsa
from database import db
from utils import log, print
import model

# create CurrentAuth object from current authenticated user
# NOTE authenticated users do have associated data
def current_auth(_: str, user: fsa.CurrentUser) -> model.CurrentAuth:
    ad = db.get_all_user_data(login=user)
    return model.CurrentAuth(**ad)

# authentication helper function
# Updated to support username, email, OR phone number login
def get_user_pass(login: str) -> str|None:
    """
    Get password hash for user identified by username, email, or phone.
    The login parameter can be any of these three identifiers.
    """
    res = db.get_user_login(login=login)
    return res["password"] if res else None

# group authorization helper function for "ADMIN"
def user_is_admin(login: str) -> bool:
    """
    Check if user is admin. Login can be username, email, or phone.
    """
    res = db.get_user_login(login=login)
    return res["is_admin"] if res else False

# TODO add other authorization hooks here, and register them in init_app

# register authentication and authorization helpers to FlaskSimpleAuth
def init_app(app):
    log.info(f"initializing auth for {app.name}")
    app.special_parameter(model.CurrentAuth, current_auth)
    app.get_user_pass(get_user_pass)
    app.group_check("ADMIN", user_is_admin)
    # app.object_perms(…)
