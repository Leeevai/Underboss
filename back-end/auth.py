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
    ad = db.get_all_auth_data(login=user)
    return model.CurrentAuth(**ad)

def get_user_pass(login: str) -> str|None:
    res = db.get_auth_login(login=login)
    return res["password"] if res else None

# group authorization helper function for "ADMIN"
def user_is_admin(login: str) -> bool:
    res = db.get_auth_login(login=login)
    return res["is_admin"] if res else False  

# TODO add other authorization hooks here, and register them in init_app

# register authentication and authorization helpers to FlaskSimpleAuth
def init_app(app):
    log.info(f"initializing auth for {app.name}")
    app.special_parameter(model.CurrentAuth, current_auth)
    app.get_user_pass(get_user_pass)
    app.group_check("ADMIN", user_is_admin)
    # app.object_perms(…)
