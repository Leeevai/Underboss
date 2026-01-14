#! /usr/bin/env python3
#
# Run internal (flask) or external (requests) application tests.
#
# The test assumes some initial data and resets the database to the initial
# state, so that it can be run several times if no failure occurs.
#
# The test could initialize some database, but I also want to use it against a
# deployed version and differing databases, so keep it light.
#

import pytest
import re
import os
from FlaskTester import ft_authenticator, ft_client
import logging

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("test")

# real (or fake) authentication logins
ADMIN, NOADM, OTHER = "calvin", "hobbes", "susie"

@pytest.fixture
def api(ft_client):
    # get tokens for ADMIN and NOADM users (password set from env)
    res = ft_client.get("/login", login=ADMIN, auth="basic")
    assert res.is_json
    ft_client.setToken(ADMIN, res.json)
    res = ft_client.post("/login", login=NOADM, auth="param")
    assert res.is_json
    ft_client.setToken(NOADM, res.json)
    yield ft_client

# environment and running
def test_sanity(api):
    assert "FLASK_TESTER_APP" in os.environ
    res = api.get("/uptime", 200, login=None)
    assert res.json and isinstance(res.json, dict)
    assert "app" in res.json and "up" in res.json

# /who-am-i
def test_who_am_i(api):
    api.get("/who-am-i", 401)
    api.get("/who-am-i", 200, ADMIN, login=ADMIN)
    api.get("/who-am-i", 200, NOADM, login=NOADM)
    api.post("/who-am-i", 405, login=ADMIN)
    api.put("/who-am-i", 405, login=ADMIN)
    api.patch("/who-am-i", 405, login=ADMIN)
    api.delete("/who-am-i", 405, login=ADMIN)

# /myself
def test_myself(api):
    api.get("/myself", 401)
    res = api.get("/myself", 200, login=ADMIN)
    assert res.json["login"] == ADMIN and res.json["isadmin"] and res.json["aid"] == 1
    api.post("/myself", 405, login=ADMIN)
    api.put("/myself", 405, login=ADMIN)
    api.patch("/myself", 405, login=ADMIN)
    api.delete("/myself", 405, login=ADMIN)

# /login and keep tokens
def test_login(api):
    # test BASIC auth
    res = api.get("/who-am-i", 200, login=ADMIN, auth="basic")
    assert ADMIN in res.text
    log.warning(f"headers: {res.headers}")
    assert res.headers["FSA-User"] == f"{ADMIN} (basic)"
    # GET login with basic auth
    admin_token = api.get("/login", 200, login=ADMIN, auth="basic").json
    assert f":{ADMIN}:" in admin_token
    api.setToken(ADMIN, admin_token)
    res = api.get("/who-am-i", 200, login=ADMIN)
    assert ADMIN in res.text
    assert res.headers["FSA-User"] == f"{ADMIN} (token)"
    # hobbes
    noadm_token = api.get("/login", 200, login=NOADM, auth="basic").json
    assert f":{NOADM}:" in noadm_token
    api.setToken(NOADM, noadm_token)
    # same with POST and parameters
    api.post("/login", 401, login=None)
    res = api.post("/login", 201, data={"login": "calvin", "password": "hobbes"}, login=None)
    tok = res.json
    assert ":calvin:" in tok
    assert res.headers["FSA-User"] == "calvin (param)"
    res = api.post("/login", 201, json={"login": "calvin", "password": "hobbes"}, login=None)
    tok = res.json
    assert ":calvin:" in tok
    assert res.headers["FSA-User"] == "calvin (param)"
    # test token auth
    api.setToken(ADMIN, None)
    api.setToken(NOADM, None)

# /whatever # BAD URI
def test_whatever(api):
    api.get("/whatever", 404)
    api.post("/whatever", 404)
    api.delete("/whatever", 404)
    api.put("/whatever", 404)
    api.patch("/whatever", 404)

# /info
def test_info(api):
    # only GET is implemented
    api.get("/info", 200, f"\"{ADMIN}\"", login=ADMIN)
    api.get("/info", 200, login=ADMIN, json={"sleep": 1.0})
    api.get("/info", 200, login=ADMIN, data={"sleep": 0.1})
    api.get("/info", 403, login=NOADM)
    api.get("/info", 401, login=None)
    api.post("/info", 405)
    api.delete("/info", 405)
    api.put("/info", 405)
    api.patch("/info", 405)

def test_stats(api):
    api.get("/stats", 401, login=None)
    api.get("/stats", 200, r"[0-9]", login=ADMIN)
    api.get("/stats", 403, login=NOADM)
    api.post("/stats", 405, login=ADMIN)
    api.put("/stats", 405, login=ADMIN)
    api.patch("/stats", 405, login=ADMIN)
    api.delete("/stats", 405, login=ADMIN)
    res = api.get("/stats", 200, login=ADMIN)
    assert res.is_json and res.json is not None

# /register
def test_register(api):
    # register a new user
    user, pswd = "dyna-user", "dyna-user-pass-123"
    api.setPass(user, pswd)
    # bad login with a space
    api.post("/register", 400, data={"login": "this is a bad login", "password": pswd}, login=None)
    # login too short
    api.post("/register", 400, json={"login": "x", "password": pswd}, login=None)
    # login already exists
    api.post("/register", 409, data={"login": "calvin", "password": pswd}, login=None)
    # missing "login" parameter
    api.post("/register", 400, json={"password": pswd}, login=None)
    # missing "password" parameter
    api.post("/register", 400, data={"login": user}, login=None)
    # password is too short
    api.post("/register", 400, json={"login": "hello", "password": ""}, login=None)
    # password is too simple
    # api.post("/register", 400, json={"login": "hello", "password": "world!"}, login=None)
    # at last one which is expected to work!
    api.post("/register", 201, json={"login": user, "password": pswd}, login=None)
    user_token = api.get("/login", 200, r"^([^:]+:){3}[^:]+$", login=user).json
    api.setToken(user, user_token)
    api.get("/users/x", 400, r"x", login=ADMIN)
    api.get("/users/****", 400, r"\*\*\*\*", login=ADMIN)
    api.get(f"/users/{user}", 200, f"{user}", login=ADMIN)
    api.patch(f"/users/{user}", 204, data={"password": "pwd1!"}, login=ADMIN)
    api.patch(f"/users/{user}", 204, data={"is_admin": False}, login=ADMIN)
    api.patch(f"/users/{user}", 204, data={"email": "dyna@comics.net"}, login=ADMIN)
    api.patch(f"/users/{user}", 400, data={"email": "not-an-email"}, login=ADMIN)
    dyna = {"login": user, "password": pswd, "email": "dyna-no-spam@comics.net", "isadmin": True}
    api.put(f"/users/{user}", 204, data={"auth": dyna}, login=ADMIN)
    toto = dict(**dyna).update(login="toto")
    api.put(f"/users/{user}", 400, data={"auth": toto}, login=ADMIN)
    api.delete(f"/users/{user}", 204, login=ADMIN)
    api.put(f"/users/{user}", 404, data={"auth": dyna}, login=ADMIN)
    api.get("/users/no-such-user", 404, login=ADMIN)
    api.patch("/users/no-such-user", 404, login=ADMIN)
    api.delete("/users/no-such-user", 404, login=ADMIN)
    api.delete(f"/users/{ADMIN}", 400, login=ADMIN)
    api.setToken(user, None)
    api.setPass(user, None)

# /users
def test_users(api):
    api.get("/users", 401, login=None)
    api.get("/users", 403, login=NOADM)
    api.get("/users", 200, r"calvin", login=ADMIN)
    api.get("/users", 200, r"hobbes", json={"flt": "h%"}, login=ADMIN)
    api.post("/users", 400, login=ADMIN)
    api.post("/users", 400, json={"login": "ab", "password": "abc123!", "is_admin": False}, login=ADMIN)
    api.post("/users", 400, json={"login": "1abcd", "password": "abc123!", "is_admin": False}, login=ADMIN)
    api.post("/users", 201, json={"login": OTHER, "password": "abc123!", "is_admin": False}, login=ADMIN)
    api.post("/users", 409, json={"login": OTHER, "password": "abc123!", "is_admin": False}, login=ADMIN)
    api.delete(f"/users/{OTHER}", 204, login=ADMIN)
    api.put("/users", 405, login=ADMIN)
    api.patch("/users", 405, login=ADMIN)
    api.delete("/users", 405, login=ADMIN)

# http -> https
def test_redir(api):
    url = os.environ.get("FLASK_TESTER_APP", None)
    if url and re.match(r"https://", url):
        log.info(f"testing redirection to {url}")
        api._base_url = url.replace("https://", "http://")
        # redirect probably handled by reverse proxy
        api.get("/info", 302, allow_redirects=False)
        api.post("/info", 302, allow_redirects=False)
        api.put("/info", 302, allow_redirects=False)
        api.patch("/info", 302, allow_redirects=False)
        api.delete("/info", 302, allow_redirects=False)
        api._base_url = url
    else:
        pytest.skip("cannot test ssl redir without ssl")
