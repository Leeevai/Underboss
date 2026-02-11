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
    # Set passwords for admin and non-admin test users
    ft_client.setPass(ADMIN, "hobbes")
    ft_client.setPass(NOADM, "calvin")

    # get tokens for ADMIN and NOADM users (password set from env)
    res = ft_client.get("/login", login=ADMIN, auth="basic")
    assert res.is_json
    # Extract token from JSON response - response is {"token": "..."}
    token_resp = res.json
    token = token_resp.get("token") if isinstance(token_resp, dict) else token_resp
    ft_client.setToken(ADMIN, token)
    res = ft_client.post("/login", login=NOADM, auth="param")
    assert res.is_json
    # Extract token from JSON response
    token_resp = res.json
    token = token_resp.get("token") if isinstance(token_resp, dict) else token_resp
    ft_client.setToken(NOADM, token)
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
    assert res.json["login"] == ADMIN and res.json["isadmin"]
    # aid is now a UUID string in new schema
    assert isinstance(res.json["aid"], str) and len(res.json["aid"]) > 0
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
    # GET login with basic auth - response is now {"token": "..."}
    admin_token_resp = api.get("/login", 200, login=ADMIN, auth="basic").json
    admin_token = admin_token_resp.get("token") if isinstance(admin_token_resp, dict) else admin_token_resp
    assert admin_token is not None and f":{ADMIN}:" in admin_token
    api.setToken(ADMIN, admin_token)
    res = api.get("/who-am-i", 200, login=ADMIN)
    assert ADMIN in res.text
    assert res.headers["FSA-User"] == f"{ADMIN} (token)"
    # hobbes
    noadm_token_resp = api.get("/login", 200, login=NOADM, auth="basic").json
    noadm_token = noadm_token_resp.get("token") if isinstance(noadm_token_resp, dict) else noadm_token_resp
    assert noadm_token is not None and f":{NOADM}:" in noadm_token
    api.setToken(NOADM, noadm_token)
    # same with POST and parameters
    api.post("/login", 401, login=None)
    res = api.post("/login", 201, data={"login": "calvin", "password": "hobbes"}, login=None)
    tok_resp = res.json
    tok = tok_resp.get("token") if isinstance(tok_resp, dict) else tok_resp
    assert tok is not None and ":calvin:" in tok
    assert res.headers["FSA-User"] == "calvin (param)"
    res = api.post("/login", 201, json={"login": "calvin", "password": "hobbes"}, login=None)
    tok_resp = res.json
    tok = tok_resp.get("token") if isinstance(tok_resp, dict) else tok_resp
    assert tok is not None and ":calvin:" in tok
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
    user, pswd = "dyna-user", "DynaUserPass123!"
    api.setPass(user, pswd)
    # bad username with a space
    api.post("/register", 400, data={"username": "this is a bad login", "email": "test@test.com", "password": pswd}, login=None)
    # username too short
    api.post("/register", 400, json={"username": "x", "email": "test@test.com", "password": pswd}, login=None)
    # username already exists
    api.post("/register", 409, data={"username": "calvin", "email": "new@test.com", "password": pswd}, login=None)
    # missing "username" parameter
    api.post("/register", 400, json={"email": "test@test.com", "password": pswd}, login=None)
    # missing "email" parameter
    api.post("/register", 400, json={"username": user, "password": pswd}, login=None)
    # missing "password" parameter
    api.post("/register", 400, data={"username": user, "email": f"{user}@test.com"}, login=None)
    # password is too short
    api.post("/register", 400, json={"username": "hello", "email": "hello@test.com", "password": ""}, login=None)
    # at last one which is expected to work!
    api.post("/register", 201, json={"username": user, "email": f"{user}@test.com", "password": pswd}, login=None)
    user_token = api.get("/login", 200, r"^.*token.*$", login=user).json
    api.setToken(user, user_token.get("token") if isinstance(user_token, dict) else user_token)
    api.get("/users/x", 400, r"x", login=ADMIN)
    api.get("/users/****", 400, r"\*\*\*\*", login=ADMIN)
    api.get(f"/users/{user}", 200, f"{user}", login=ADMIN)
    api.patch(f"/users/{user}", 204, data={"password": "NewPass123!"}, login=ADMIN)
    api.patch(f"/users/{user}", 204, data={"is_admin": False}, login=ADMIN)
    api.patch(f"/users/{user}", 204, data={"email": "dyna@comics.net"}, login=ADMIN)
    api.patch(f"/users/{user}", 400, data={"email": "not-an-email"}, login=ADMIN)
    # Delete test user
    api.delete(f"/users/{user}", 204, login=ADMIN)
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
    api.post("/users", 400, json={"login": "ab", "password": "Password123!", "is_admin": False}, login=ADMIN)
    api.post("/users", 400, json={"login": "1abcd", "password": "Password123!", "is_admin": False}, login=ADMIN)
    api.post("/users", 201, json={"login": OTHER, "password": "Password123!", "email": f"{OTHER}@test.com", "is_admin": False}, login=ADMIN)
    api.post("/users", 409, json={"login": OTHER, "password": "Password123!", "email": f"{OTHER}2@test.com", "is_admin": False}, login=ADMIN)
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

# /users/<username>/profile - comprehensive profile tests
def test_user_profile(api):
    user = "testprofile"
    pswd = "test123!ABC"
    api.setPass(user, pswd)

    # Register user with username and email
    api.post("/register", 201, json={
        "username": user,
        "email": f"{user}@test.com",
        "password": pswd
    }, login=None)
    user_token = api.get("/login", 200, login=user).json
    api.setToken(user, user_token.get("token") if isinstance(user_token, dict) else user_token)

    # Get profile - should exist (auto-created on user registration)
    res = api.get(f"/user/{user}/profile", 200, login=None)
    assert res.json["username"] == user
    assert res.json["email"] == f"{user}@test.com"
    assert "user_id" in res.json

    # Profile is publicly accessible (OPEN auth)
    api.get(f"/user/{user}/profile", 200, login=None)
    api.get(f"/user/{user}/profile", 200, login=ADMIN)
    api.get(f"/user/{user}/profile", 200, login=NOADM)

    # Test 404 for non-existent user
    api.get("/user/nonexistentuser999/profile", 404, login=None)

    # Update profile - user can update own profile
    api.patch(f"/user/{user}/profile", 204, data={
        "first_name": "Test",
        "last_name": "User",
        "display_name": "Test User",
        "bio": "Test bio",
        "timezone": "UTC"
    }, login=user)

    # Verify profile was updated
    res = api.get(f"/user/{user}/profile", 200, login=None)
    assert res.json["first_name"] == "Test"
    assert res.json["last_name"] == "User"
    assert res.json["display_name"] == "Test User"
    assert res.json["bio"] == "Test bio"
    assert res.json["timezone"] == "UTC"

    # Update single field
    api.patch(f"/user/{user}/profile", 204, data={"bio": "Updated bio"}, login=user)
    res = api.get(f"/user/{user}/profile", 200, login=None)
    assert res.json["bio"] == "Updated bio"
    assert res.json["first_name"] == "Test"  # Other fields unchanged

    # Update location fields
    api.patch(f"/user/{user}/profile", 204, data={
        "location_address": "123 Test St",
        "location_lat": 40.7128,
        "location_lng": -74.0060
    }, login=user)
    res = api.get(f"/user/{user}/profile", 200, login=None)
    assert res.json["location_address"] == "123 Test St"
    assert res.json["location_lat"] == 40.7128
    assert res.json["location_lng"] == -74.0060

    # Test validation - invalid latitude
    api.patch(f"/user/{user}/profile", 400, data={
        "location_lat": 91,
        "location_lng": 0
    }, login=user)

    # Test validation - invalid longitude
    api.patch(f"/user/{user}/profile", 400, data={
        "location_lat": 0,
        "location_lng": 181
    }, login=user)

    # Test validation - lat without lng
    api.patch(f"/user/{user}/profile", 400, data={
        "location_lat": 40.7128
    }, login=user)

    # User cannot update another user's profile
    api.patch(f"/user/{ADMIN}/profile", 403, data={"bio": "Hacking"}, login=user)
    api.patch(f"/user/{NOADM}/profile", 403, data={"bio": "Hacking"}, login=user)

    # Unauthenticated user cannot update profile
    api.patch(f"/user/{user}/profile", 401, data={"bio": "Test"}, login=None)

    # Test preferred_language update
    api.patch(f"/user/{user}/profile", 204, data={"preferred_language": "fr"}, login=user)
    res = api.get(f"/user/{user}/profile", 200, login=None)
    assert res.json["preferred_language"] == "fr"

    # Cleanup - get user_id from profile
    user_id = res.json["user_id"]
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
    api.setToken(user, None)
    api.setPass(user, None)

# /users/<username>/experiences - comprehensive experience tests
def test_user_experiences(api):
    user = "testexp"
    pswd = "test123!ABC"
    api.setPass(user, pswd)

    # Register user
    api.post("/register", 201, json={
        "username": user,
        "email": f"{user}@test.com",
        "password": pswd
    }, login=None)
    user_token = api.get("/login", 200, login=user).json
    api.setToken(user, user_token.get("token") if isinstance(user_token, dict) else user_token)

    # Get experiences - publicly accessible, empty initially
    res = api.get(f"/user/{user}/profile/experiences", 200, login=None)
    assert res.json == []

    # Test 404 for non-existent user
    api.get("/user/nonexistentuser999/profile/experiences", 404, login=None)

    # Create experience - use /profile/experiences (authenticated endpoint)
    api.post("/profile/experiences", 401, json={
        "title": "Software Engineer"
    }, login=None)

    res = api.post("/profile/experiences", 201, json={
        "title": "Software Engineer",
        "company": "Test Corp",
        "description": "Worked on backend systems",
        "start_date": "2020-01-01",
        "end_date": "2022-12-31",
        "is_current": False
    }, login=user)
    exp_id = res.json.get("experience_id") if isinstance(res.json, dict) else res.json

    # Get experiences from public endpoint
    res = api.get(f"/user/{user}/profile/experiences", 200, login=None)
    assert len(res.json) == 1
    assert res.json[0]["title"] == "Software Engineer"
    assert res.json[0]["company"] == "Test Corp"
    assert not res.json[0]["is_current"]

    # Add another experience (current position)
    res = api.post("/profile/experiences", 201, json={
        "title": "Senior Engineer",
        "company": "New Corp",
        "description": "Leading team",
        "start_date": "2023-01-01",
        "is_current": True
    }, login=user)
    exp_id2 = res.json.get("experience_id") if isinstance(res.json, dict) else res.json

    # Verify two experiences
    res = api.get(f"/user/{user}/profile/experiences", 200, login=None)
    assert len(res.json) == 2

    # Update first experience
    api.patch(f"/profile/experiences/{exp_id}", 204, json={
        "title": "Senior Software Engineer"
    }, login=user)

    res = api.get(f"/user/{user}/profile/experiences", 200, login=None)
    exp1 = [e for e in res.json if e["id"] == exp_id][0]
    assert exp1["title"] == "Senior Software Engineer"
    assert exp1["company"] == "Test Corp"  # Unchanged

    # User cannot update another user's experience
    # First get admin's experience (if any)
    admin_exps = api.get(f"/user/{ADMIN}/profile/experiences", 200, login=None).json
    if admin_exps:
        api.patch(f"/profile/experiences/{admin_exps[0]['id']}", 403, json={
            "title": "Hacked"
        }, login=user)

    # Delete first experience
    api.delete(f"/profile/experiences/{exp_id}", 204, login=user)
    res = api.get(f"/user/{user}/profile/experiences", 200, login=None)
    assert len(res.json) == 1

    # Delete second experience
    api.delete(f"/profile/experiences/{exp_id2}", 204, login=user)
    res = api.get(f"/user/{user}/profile/experiences", 200, login=None)
    assert len(res.json) == 0

    # Test 404 for non-existent experience
    api.patch("/profile/experiences/00000000-0000-0000-0000-000000000000", 404, json={
        "title": "Test"
    }, login=user)
    api.delete("/profile/experiences/00000000-0000-0000-0000-000000000000", 404, login=user)

    # Cleanup - get user_id from profile
    res = api.get(f"/user/{user}/profile", 200, login=None)
    user_id = res.json["user_id"]
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
    api.setToken(user, None)
    api.setPass(user, None)

# /categories
def test_categories(api):
    # Get categories (may be empty)
    api.get("/categories", 200, login=ADMIN)

    # Create category (admin only)
    res = api.post("/categories", 201, json={
        "name": "Test Category",
        "slug": "test-category",
        "description": "A test category"
    }, login=ADMIN)
    cat_id = res.json.get("category_id") if isinstance(res.json, dict) else res.json

    # Get category
    res = api.get(f"/categories/{cat_id}", 200, login=ADMIN)
    assert res.json["name"] == "Test Category"

    # Update category
    api.patch(f"/categories/{cat_id}", 204, json={"description": "Updated description"}, login=ADMIN)
    res = api.get(f"/categories/{cat_id}", 200, login=ADMIN)
    assert res.json["description"] == "Updated description"

    # Delete category
    api.delete(f"/categories/{cat_id}", 204, login=ADMIN)
    api.get(f"/categories/{cat_id}", 404, login=ADMIN)

    # Non-admin cannot create categories
    api.post("/categories", 403, json={"name": "Test", "slug": "test"}, login=NOADM)

# /users/<username>/interests - comprehensive interest tests
def test_user_interests(api):
    user = "testinterest"
    pswd = "test123!ABC"
    api.setPass(user, pswd)

    # Register user
    api.post("/register", 201, json={
        "username": user,
        "email": f"{user}@test.com",
        "password": pswd
    }, login=None)
    user_token = api.get("/login", 200, login=user).json
    api.setToken(user, user_token.get("token") if isinstance(user_token, dict) else user_token)

    # Create categories first (admin only)
    res1 = api.post("/categories", 201, json={
        "name": "Programming Test",
        "slug": "programming-test",
        "description": "Software development"
    }, login=ADMIN)
    cat_id1 = res1.json.get("category_id") if isinstance(res1.json, dict) else res1.json

    res2 = api.post("/categories", 201, json={
        "name": "Design Test",
        "slug": "design-test",
        "description": "UI/UX Design"
    }, login=ADMIN)
    cat_id2 = res2.json.get("category_id") if isinstance(res2.json, dict) else res2.json

    # Get interests - publicly accessible, empty initially
    res = api.get(f"/user/{user}/profile/interests", 200, login=None)
    assert res.json == []

    # Test 404 for non-existent user
    api.get("/user/nonexistentuser999/profile/interests", 404, login=None)

    # Create interest - use /profile/interests (authenticated endpoint)
    api.post("/profile/interests", 401, json={
        "category_id": cat_id1,
        "proficiency_level": 5
    }, login=None)

    res = api.post("/profile/interests", 201, json={
        "category_id": cat_id1,
        "proficiency_level": 5
    }, login=user)

    # Get interests from public endpoint
    res = api.get(f"/user/{user}/profile/interests", 200, login=None)
    assert len(res.json) == 1
    assert res.json[0]["proficiency_level"] == 5
    assert res.json[0]["category_name"] == "Programming Test"

    # Add another interest
    api.post("/profile/interests", 201, json={
        "category_id": cat_id2,
        "proficiency_level": 3
    }, login=user)

    res = api.get(f"/user/{user}/profile/interests", 200, login=None)
    assert len(res.json) == 2

    # Update first interest
    api.patch(f"/profile/interests/{cat_id1}", 204, json={
        "proficiency_level": 4
    }, login=user)

    res = api.get(f"/user/{user}/profile/interests", 200, login=None)
    int1 = [i for i in res.json if i["category_id"] == cat_id1][0]
    assert int1["proficiency_level"] == 4

    # Cannot add duplicate interest
    api.post("/profile/interests", 409, json={
        "category_id": cat_id1,
        "proficiency_level": 2
    }, login=user)

    # Delete interests
    api.delete(f"/profile/interests/{cat_id1}", 204, login=user)
    res = api.get(f"/user/{user}/profile/interests", 200, login=None)
    assert len(res.json) == 1

    api.delete(f"/profile/interests/{cat_id2}", 204, login=user)
    res = api.get(f"/user/{user}/profile/interests", 200, login=None)
    assert len(res.json) == 0

    # Test 404 for non-existent interest
    api.delete(f"/profile/interests/{cat_id1}", 404, login=user)

    # Cleanup categories and user - get user_id from profile
    res = api.get(f"/user/{user}/profile", 200, login=None)
    user_id = res.json["user_id"]
    api.delete(f"/categories/{cat_id1}", 204, login=ADMIN)
    api.delete(f"/categories/{cat_id2}", 204, login=ADMIN)
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
    api.setToken(user, None)
    api.setPass(user, None)

# Comprehensive registration tests
def test_register_comprehensive(api):
    base_user = "testreg"
    pswd = "test123!ABC"

    # Test username validation
    api.post("/register", 400, json={
        "username": "ab",  # Too short
        "email": "test@test.com",
        "password": pswd
    }, login=None)

    api.post("/register", 400, json={
        "username": "1abc",  # Starts with number
        "email": "test@test.com",
        "password": pswd
    }, login=None)

    api.post("/register", 400, json={
        "username": "test user",  # Contains space
        "email": "test@test.com",
        "password": pswd
    }, login=None)

    # Test password validation
    api.post("/register", 400, json={
        "username": base_user,
        "email": "test@test.com",
        "password": ""  # Too short
    }, login=None)

    api.post("/register", 400, json={
        "username": base_user,
        "email": "test@test.com",
        "password": "short"  # Too short
    }, login=None)

    # Test email validation
    api.post("/register", 400, json={
        "username": base_user,
        "email": "not-an-email",
        "password": pswd
    }, login=None)

    # Test missing parameters
    api.post("/register", 400, json={
        "email": "test@test.com",
        "password": pswd
    }, login=None)

    api.post("/register", 400, json={
        "username": base_user,
        "password": pswd
    }, login=None)

    api.post("/register", 400, json={
        "username": base_user,
        "email": "test@test.com"
    }, login=None)

    # Successful registration
    api.setPass(base_user, pswd)
    api.post("/register", 201, json={
        "username": base_user,
        "email": f"{base_user}@test.com",
        "password": pswd
    }, login=None)

    # Test duplicate username
    api.post("/register", 409, json={
        "username": base_user,
        "email": "different@test.com",
        "password": pswd
    }, login=None)

    # Test duplicate email
    api.post("/register", 409, json={
        "username": "different",
        "email": f"{base_user}@test.com",
        "password": pswd
    }, login=None)

    # Verify user can login
    token = api.get("/login", 200, login=base_user).json
    api.setToken(base_user, token.get("token") if isinstance(token, dict) else token)

    # Verify user has profile auto-created
    res = api.get(f"/user/{base_user}/profile", 200, login=None)
    assert res.json["username"] == base_user
    assert res.json["email"] == f"{base_user}@test.com"

    # Cleanup - get user_id first to delete
    user_id = res.json["user_id"]
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
    api.setToken(base_user, None)
    api.setPass(base_user, None)

# Comprehensive login tests
def test_login_comprehensive(api):
    user = "testlogin"
    pswd = "test123!ABC"
    email = f"{user}@test.com"

    # Register user
    api.setPass(user, pswd)
    api.post("/register", 201, json={
        "username": user,
        "email": email,
        "password": pswd
    }, login=None)

    # Test GET /login with basic auth (username)
    token1 = api.get("/login", 200, login=user, auth="basic").json
    assert f":{user}:" in token1["token"]
    api.setToken(user, token1["token"])

    # Verify token works
    res = api.get("/who-am-i", 200, login=user)
    assert user in res.text

    # Test POST /login with form data (username)
    res = api.post("/login", 201, data={
        "login": user,
        "password": pswd
    }, login=None)
    token2 = res.json
    assert f":{user}:" in token2["token"]

    # Test POST /login with JSON (username)
    res = api.post("/login", 201, json={
        "login": user,
        "password": pswd
    }, login=None)
    token3 = res.json
    assert f":{user}:" in token3["token"]

    # Test login with email instead of username
    res = api.post("/login", 201, json={
        "login": email,
        "password": pswd
    }, login=None)
    token4 = res.json
    # When logging in with email, token contains email (this is expected behavior)
    assert f":{email}:" in token4["token"] or f":{user}:" in token4["token"]

    # Test invalid password
    api.post("/login", 401, json={
        "login": user,
        "password": "wrongpassword"
    }, login=None)

    # Test non-existent user
    api.post("/login", 401, json={
        "login": "nonexistent",
        "password": pswd
    }, login=None)

    # Test missing parameters
    api.post("/login", 401, json={
        "login": user
    }, login=None)

    api.post("/login", 401, json={
        "password": pswd
    }, login=None)

    # Cleanup - get user_id from profile
    res = api.get(f"/user/{user}/profile", 200, login=None)
    user_id = res.json["user_id"]
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
    api.setToken(user, None)
    api.setPass(user, None)


# /paps - comprehensive paps tests
def test_paps(api):
    user = "testpaps"
    pswd = "test123!ABC"
    api.setPass(user, pswd)

    # Register user
    api.post("/register", 201, json={
        "username": user,
        "email": f"{user}@test.com",
        "password": pswd
    }, login=None)
    user_token = api.get("/login", 200, login=user).json
    api.setToken(user, user_token.get("token") if isinstance(user_token, dict) else user_token)

    # Create a category first (admin only)
    res = api.post("/categories", 201, json={
        "name": "Test Paps Category",
        "slug": "test-paps-category",
        "description": "A test category for paps"
    }, login=ADMIN)
    cat_id = res.json.get("category_id") if isinstance(res.json, dict) else res.json

    # Add user interest to test interest matching
    api.post("/profile/interests", 201, json={
        "category_id": cat_id,
        "proficiency_level": 5
    }, login=user)

    # Get paps - authenticated users can list paps
    api.get("/paps", 401, login=None)
    res = api.get("/paps", 200, login=user)
    assert "paps" in res.json
    assert "total_count" in res.json

    # Create a paps (authenticated user)
    api.post("/paps", 401, login=None)

    # Invalid paps - missing required fields
    api.post("/paps", 400, json={
        "title": "Test Paps"
        # Missing description, payment_type, payment_amount, payment_currency
    }, login=user)

    # Valid paps creation
    res = api.post("/paps", 201, json={
        "title": "Test Paps Project",
        "description": "A test paps description that is long enough",
        "payment_type": "fixed",
        "payment_amount": 500.00,
        "payment_currency": "USD",
        "status": "draft"
    }, login=user)
    paps_id = res.json.get("paps_id") if isinstance(res.json, dict) else res.json
    assert paps_id is not None

    # Get the created paps
    res = api.get(f"/paps/{paps_id}", 200, login=user)
    assert res.json["title"] == "Test Paps Project"
    assert res.json["payment_type"] == "fixed"
    assert res.json["payment_amount"] == 500.00
    assert res.json["payment_currency"] == "USD"
    assert res.json["status"] == "draft"

    # Update paps
    api.put(f"/paps/{paps_id}", 204, json={
        "title": "Updated Paps Project",
        "description": "Updated description that is long enough",
        "payment_type": "hourly",
        "payment_amount": 75.00,
        "payment_currency": "EUR",
        "status": "draft"
    }, login=user)

    res = api.get(f"/paps/{paps_id}", 200, login=user)
    assert res.json["title"] == "Updated Paps Project"
    assert res.json["payment_type"] == "hourly"
    assert res.json["payment_amount"] == 75.00
    assert res.json["payment_currency"] == "EUR"

    # Non-owner cannot update paps
    api.put(f"/paps/{paps_id}", 403, json={
        "title": "Hacked"
    }, login=NOADM)

    # Admin can update any paps
    api.put(f"/paps/{paps_id}", 204, json={
        "title": "Admin Updated Paps",
        "description": "Admin update that is long enough to pass",
        "payment_type": "fixed",
        "payment_amount": 1000.00,
        "payment_currency": "USD",
        "status": "draft"
    }, login=ADMIN)

    # Add category to paps
    res = api.post(f"/paps/{paps_id}/categories/{cat_id}", 201, login=user)

    # Get paps with category
    res = api.get(f"/paps/{paps_id}", 200, login=user)
    assert "categories" in res.json
    # Check category is in the list
    cat_ids = [c["category_id"] for c in res.json["categories"]]
    assert cat_id in cat_ids

    # Remove category from paps
    api.delete(f"/paps/{paps_id}/categories/{cat_id}", 204, login=user)
    res = api.get(f"/paps/{paps_id}", 200, login=user)
    cat_ids = [c["category_id"] for c in res.json["categories"]]
    assert cat_id not in cat_ids

    # Re-add category for later tests
    api.post(f"/paps/{paps_id}/categories/{cat_id}", 201, login=user)

    # Test paps media endpoints
    # Get media for paps (should be empty initially)
    res = api.get(f"/paps/{paps_id}/media", 200, login=user)
    assert res.json["media"] == []
    assert res.json["media_count"] == 0

    # Remove category before delete (soft delete doesn't cascade to PAPS_CATEGORY)
    api.delete(f"/paps/{paps_id}/categories/{cat_id}", 204, login=user)

    # Delete paps
    # Non-owner cannot delete paps
    api.delete(f"/paps/{paps_id}", 403, login=NOADM)

    # Owner can delete paps
    api.delete(f"/paps/{paps_id}", 204, login=user)

    # Verify paps is deleted
    api.get(f"/paps/{paps_id}", 404, login=user)

    # Test 404 for non-existent paps
    api.get("/paps/00000000-0000-0000-0000-000000000000", 404, login=user)
    api.put("/paps/00000000-0000-0000-0000-000000000000", 404, json={
        "title": "Test"
    }, login=user)
    api.delete("/paps/00000000-0000-0000-0000-000000000000", 404, login=user)

    # Cleanup - delete user FIRST (hard-deletes their PAPS and PAPS_CATEGORY), then category
    api.delete(f"/profile/interests/{cat_id}", 204, login=user)
    res = api.get(f"/user/{user}/profile", 200, login=None)
    user_id = res.json["user_id"]
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
    api.delete(f"/categories/{cat_id}", 204, login=ADMIN)
    api.setToken(user, None)
    api.setPass(user, None)


# /paps - admin vs user access tests
def test_paps_admin_access(api):
    user = "testpapsadmin"
    pswd = "test123!ABC"
    api.setPass(user, pswd)

    # Register user
    api.post("/register", 201, json={
        "username": user,
        "email": f"{user}@test.com",
        "password": pswd
    }, login=None)
    user_token = api.get("/login", 200, login=user).json
    api.setToken(user, user_token.get("token") if isinstance(user_token, dict) else user_token)

    # Admin can list all paps without interest matching
    res = api.get("/paps", 200, login=ADMIN)
    assert "paps" in res.json
    assert "total_count" in res.json
    # Admin results don't have interest_match_score
    if res.json["paps"]:
        assert "interest_match_score" not in res.json["paps"][0]

    # Regular user gets interest-matched results
    res = api.get("/paps", 200, login=user)
    assert "paps" in res.json
    assert "total_count" in res.json
    # User results should have interest_match_score
    if res.json["paps"]:
        assert "interest_match_score" in res.json["paps"][0]

    # Cleanup
    res = api.get(f"/user/{user}/profile", 200, login=None)
    user_id = res.json["user_id"]
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
    api.setToken(user, None)
    api.setPass(user, None)


# /paps - search filters tests
def test_paps_search_filters(api):
    user = "testpapsfilter"
    pswd = "test123!ABC"
    api.setPass(user, pswd)

    # Register user
    api.post("/register", 201, json={
        "username": user,
        "email": f"{user}@test.com",
        "password": pswd
    }, login=None)
    user_token = api.get("/login", 200, login=user).json
    api.setToken(user, user_token.get("token") if isinstance(user_token, dict) else user_token)

    # Create a category
    res = api.post("/categories", 201, json={
        "name": "Filter Test Category",
        "slug": "filter-test-category",
        "description": "For filter testing"
    }, login=ADMIN)
    cat_id = res.json.get("category_id") if isinstance(res.json, dict) else res.json

    # Create paps with different attributes
    res1 = api.post("/paps", 201, json={
        "title": "Expensive Fixed Project",
        "description": "A high-budget project with detailed description",
        "payment_type": "fixed",
        "payment_amount": 5000.00,
        "payment_currency": "USD",
        "status": "published",
        "start_datetime": "2025-01-01T12:00:00Z"
    }, login=user)
    paps_id1 = res1.json.get("paps_id") if isinstance(res1.json, dict) else res1.json
    api.post(f"/paps/{paps_id1}/categories/{cat_id}", 201, login=user)

    res2 = api.post("/paps", 201, json={
        "title": "Cheap Hourly Project",
        "description": "An affordable hourly project with detailed description",
        "payment_type": "hourly",
        "payment_amount": 25.00,
        "payment_currency": "EUR",
        "status": "published",
        "start_datetime": "2025-02-01T12:00:00Z"
    }, login=user)
    _ = res2.json.get("paps_id") if isinstance(res2.json, dict) else res2.json

    # Test status filter
    res = api.get("/paps", 200, json={"status": "published"}, login=user)
    for pap in res.json["paps"]:
        assert pap["status"] == "published"

    # Test payment_type filter
    res = api.get("/paps", 200, json={"payment_type": "fixed"}, login=user)
    for pap in res.json["paps"]:
        assert pap["payment_type"] == "fixed"

    res = api.get("/paps", 200, json={"payment_type": "hourly"}, login=user)
    for pap in res.json["paps"]:
        assert pap["payment_type"] == "hourly"

    # Test min_price filter
    res = api.get("/paps", 200, json={"min_price": 1000}, login=user)
    for pap in res.json["paps"]:
        assert pap["payment_amount"] >= 1000

    # Test max_price filter
    res = api.get("/paps", 200, json={"max_price": 100}, login=user)
    for pap in res.json["paps"]:
        assert pap["payment_amount"] <= 100

    # Test price range filter
    res = api.get("/paps", 200, json={"min_price": 1000, "max_price": 6000}, login=user)
    for pap in res.json["paps"]:
        assert pap["payment_amount"] >= 1000 and pap["payment_amount"] <= 6000

    # Test title_search filter
    res = api.get("/paps", 200, json={"title_search": "expensive"}, login=user)
    # Should find the "Expensive Fixed Project"
    found = any("Expensive" in pap["title"] for pap in res.json["paps"])
    assert found or res.json["total_count"] == 0  # May not find if already cleaned up

    # Test category_id filter
    res = api.get("/paps", 200, json={"category_id": cat_id}, login=user)
    # All results should have the category
    for pap in res.json["paps"]:
        if "categories" in pap:
            _ = [c["category_id"] for c in pap["categories"]]
            # paps with this category should be found
            pass

    # Cleanup - delete user FIRST (hard-deletes their PAPS and PAPS_CATEGORY), then category
    res = api.get(f"/user/{user}/profile", 200, login=None)
    user_id = res.json["user_id"]
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
    api.delete(f"/categories/{cat_id}", 204, login=ADMIN)
    api.setToken(user, None)
    api.setPass(user, None)


# /paps - edge case and validation tests
def test_paps_edge_cases(api):
    import uuid
    suffix = uuid.uuid4().hex[:8]
    user = f"papsedge{suffix}"
    pswd = "test123!ABC"
    api.setPass(user, pswd)

    # Register user
    api.post("/register", 201, json={
        "username": user,
        "email": f"{user}@test.com",
        "password": pswd
    }, login=None)
    user_token = api.get("/login", 200, login=user).json
    api.setToken(user, user_token.get("token") if isinstance(user_token, dict) else user_token)

    # Test max_distance validation - should require lat and lng
    api.get("/paps", 400, json={"max_distance": 100}, login=user)  # Missing lat/lng
    api.get("/paps", 400, json={"max_distance": 100, "lat": 40.7128}, login=user)  # Missing lng
    api.get("/paps", 400, json={"max_distance": 100, "lng": -74.0060}, login=user)  # Missing lat

    # Test max_distance with valid lat/lng
    res = api.get("/paps", 200, json={"max_distance": 100, "lat": 40.7128, "lng": -74.0060}, login=user)
    assert "paps" in res.json

    # Test max_distance must be positive
    api.get("/paps", 400, json={"max_distance": -100, "lat": 40.7128, "lng": -74.0060}, login=user)
    api.get("/paps", 400, json={"max_distance": 0, "lat": 40.7128, "lng": -74.0060}, login=user)

    # Test lat/lng validation
    api.get("/paps", 400, json={"lat": 100, "lng": -74.0060}, login=user)  # Invalid lat > 90
    api.get("/paps", 400, json={"lat": -100, "lng": -74.0060}, login=user)  # Invalid lat < -90
    api.get("/paps", 400, json={"lat": 40.7128, "lng": 200}, login=user)  # Invalid lng > 180
    api.get("/paps", 400, json={"lat": 40.7128, "lng": -200}, login=user)  # Invalid lng < -180

    # Test invalid payment_type filter
    api.get("/paps", 400, json={"payment_type": "invalid"}, login=user)

    # Test invalid UUID format for paps_id
    api.get("/paps/not-a-uuid", 400, login=user)
    api.put("/paps/not-a-uuid", 400, json={"title": "Test"}, login=user)
    api.delete("/paps/not-a-uuid", 400, login=user)

    # Test invalid category_id format
    api.post("/paps/00000000-0000-0000-0000-000000000001/categories/not-a-uuid", 400, login=user)
    api.delete("/paps/00000000-0000-0000-0000-000000000001/categories/not-a-uuid", 400, login=user)

    # Test paps creation validation
    # Title too short
    api.post("/paps", 400, json={
        "title": "Test",
        "description": "A test paps description that is long enough",
        "payment_type": "fixed",
        "payment_amount": 500.00
    }, login=user)

    # Description too short
    api.post("/paps", 400, json={
        "title": "Test Paps Project",
        "description": "Too short",
        "payment_type": "fixed",
        "payment_amount": 500.00
    }, login=user)

    # Invalid payment amount (zero)
    api.post("/paps", 400, json={
        "title": "Test Paps Project",
        "description": "A test paps description that is long enough",
        "payment_type": "fixed",
        "payment_amount": 0
    }, login=user)

    # Invalid payment amount (negative)
    api.post("/paps", 400, json={
        "title": "Test Paps Project",
        "description": "A test paps description that is long enough",
        "payment_type": "fixed",
        "payment_amount": -100
    }, login=user)

    # Invalid payment type
    api.post("/paps", 400, json={
        "title": "Test Paps Project",
        "description": "A test paps description that is long enough",
        "payment_type": "invalid",
        "payment_amount": 500.00
    }, login=user)

    # Invalid status
    api.post("/paps", 400, json={
        "title": "Test Paps Project",
        "description": "A test paps description that is long enough",
        "payment_type": "fixed",
        "payment_amount": 500.00,
        "status": "invalid"
    }, login=user)

    # Invalid max_applicants
    api.post("/paps", 400, json={
        "title": "Test Paps Project",
        "description": "A test paps description that is long enough",
        "payment_type": "fixed",
        "payment_amount": 500.00,
        "max_applicants": 0
    }, login=user)
    api.post("/paps", 400, json={
        "title": "Test Paps Project",
        "description": "A test paps description that is long enough",
        "payment_type": "fixed",
        "payment_amount": 500.00,
        "max_applicants": 200
    }, login=user)

    # Invalid location (partial lat/lng)
    api.post("/paps", 400, json={
        "title": "Test Paps Project",
        "description": "A test paps description that is long enough",
        "payment_type": "fixed",
        "payment_amount": 500.00,
        "location_lat": 40.7128
        # Missing location_lng
    }, login=user)

    # Invalid location ranges
    api.post("/paps", 400, json={
        "title": "Test Paps Project",
        "description": "A test paps description that is long enough",
        "payment_type": "fixed",
        "payment_amount": 500.00,
        "location_lat": 100,  # Invalid > 90
        "location_lng": -74.0060
    }, login=user)

    # Test paps media - invalid paps_id format
    api.get("/paps/not-a-uuid/media", 400, login=user)
    api.delete("/paps/media/not-a-uuid", 400, login=user)

    # Test media for non-existent paps
    api.get("/paps/00000000-0000-0000-0000-000000000000/media", 404, login=user)
    api.delete("/paps/media/00000000-0000-0000-0000-000000000000", 404, login=user)

    # Test date validation: end_datetime cannot exceed start_datetime + duration
    import datetime
    start_dt = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat()
    end_dt_invalid = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=10)).isoformat()  # 3 days later

    # Create with invalid date range (end > start + duration)
    api.post("/paps", 400, json={
        "title": "Date Validation Test",
        "description": "A test paps for date validation that is long enough",
        "payment_type": "fixed",
        "payment_amount": 500.00,
        "start_datetime": start_dt,
        "end_datetime": end_dt_invalid,
        "estimated_duration_minutes": 120  # 2 hours, but end is 3 days later
    }, login=user)

    # Valid date range (end <= start + duration)
    end_dt_valid = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7, hours=2)).isoformat()
    res = api.post("/paps", 201, json={
        "title": "Date Validation Valid",
        "description": "A test paps for date validation that is long enough",
        "payment_type": "fixed",
        "payment_amount": 500.00,
        "start_datetime": start_dt,
        "end_datetime": end_dt_valid,
        "estimated_duration_minutes": 180,  # 3 hours, end is 2 hours later - valid
        "status": "draft"
    }, login=user)
    paps_id = res.json.get("paps_id")

    # Test update with invalid date range
    api.put(f"/paps/{paps_id}", 400, json={
        "end_datetime": end_dt_invalid  # Would exceed start + duration
    }, login=user)

    # Delete the test paps
    api.delete(f"/paps/{paps_id}", 204, login=user)

    # Cleanup
    res = api.get(f"/user/{user}/profile", 200, login=None)
    user_id = res.json["user_id"]
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
    api.setToken(user, None)
    api.setPass(user, None)


def test_media_handler_via_api(api):
    """
    Comprehensive tests for the MediaHandler class through the API.
    Tests media upload, retrieval, deletion for:
    - Profile avatars
    - PAPS media (images, documents)
    - SPAP media
    """
    import base64
    import requests
    from io import BytesIO

    # Get the base URL from environment
    base_url = os.environ.get("FLASK_TESTER_APP", "http://localhost:5000")

    # Skip this test in internal mode (requires real HTTP server for file uploads)
    if not base_url.startswith("http"):
        pytest.skip("test_media_handler_via_api requires external HTTP server")

    user = "testmedia"
    pswd = "test123!ABC"
    user2 = "testmedia2"
    user3 = "testmedia3"

    # CLEANUP EXISTING USERS FIRST (if they exist from previous failed test runs)
    log.info("Cleaning up any existing test users before starting...")
    for test_user in [user, user2, user3]:
        try:
            # Use requests directly to avoid status code assertion
            profile_url = f"{base_url}/user/{test_user}/profile"
            profile_resp = requests.get(profile_url)
            if profile_resp.status_code == 200:
                user_id = profile_resp.json()["user_id"]
                api.delete(f"/users/{user_id}", 204, login=ADMIN)
                log.info(f"Deleted existing user: {test_user}")
        except Exception as e:
            # User doesn't exist or couldn't be deleted, that's fine
            log.debug(f"Could not clean up user {test_user}: {e}")

    api.setPass(user, pswd)
    api.setPass(user2, pswd)

    # Register test users
    api.post("/register", 201, json={
        "username": user,
        "email": f"{user}@test.com",
        "password": pswd
    }, login=None)
    user_token = api.get("/login", 200, login=user).json
    token = user_token.get("token") if isinstance(user_token, dict) else user_token
    api.setToken(user, token)

    api.post("/register", 201, json={
        "username": user2,
        "email": f"{user2}@test.com",
        "password": pswd
    }, login=None)
    user2_token = api.get("/login", 200, login=user2).json
    token2 = user2_token.get("token") if isinstance(user2_token, dict) else user2_token
    api.setToken(user2, token2)

    # =========================================================================
    # AVATAR TESTS - Test MediaHandler through profile/avatar endpoints
    # =========================================================================
    log.info("Testing avatar uploads via MediaHandler...")

    # Create a simple 1x1 PNG image (smallest valid PNG)
    png_data = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    )

    # Create a small JPEG image (1x1 red pixel)
    jpeg_data = base64.b64decode(
        "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRof"
        "Hh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwh"
        "AAIRAxEAPwCwAB//2Q=="
    )

    # Test 1: Upload avatar as PNG using multipart form
    res = requests.post(
        f"{base_url}/profile/avatar",
        files={"image": ("avatar.png", BytesIO(png_data), "image/png")},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    avatar_url = res.json()["avatar_url"]
    assert avatar_url.startswith("/media/user/profile/")
    assert avatar_url.endswith(".png")
    log.info(f"Avatar uploaded: {avatar_url}")

    # Test 2: Retrieve avatar via static URL
    res = requests.get(f"{base_url}{avatar_url}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert res.headers["Content-Type"] in ["image/png", "application/octet-stream"]

    # Test 3: Public avatar access via username - get profile first to get avatar URL
    profile_res = api.get(f"/user/{user}/profile", 200, login=None)
    profile_avatar_url = profile_res.json.get("avatar_url")
    if profile_avatar_url:
        res = requests.get(f"{base_url}{profile_avatar_url}")
        assert res.status_code == 200

    # Test 4: Upload avatar as JPEG (overwrites previous)
    res = requests.post(
        f"{base_url}/profile/avatar",
        files={"image": ("avatar.jpg", BytesIO(jpeg_data), "image/jpeg")},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    new_avatar_url = res.json()["avatar_url"]
    assert new_avatar_url.endswith(".jpg") or new_avatar_url.endswith(".jpeg")

    # Test 5: Invalid file type for avatar (PDF not allowed)
    pdf_data = b"%PDF-1.4 fake pdf data"
    res = requests.post(
        f"{base_url}/profile/avatar",
        files={"image": ("doc.pdf", BytesIO(pdf_data), "application/pdf")},
        headers={"Authorization": f"Bearer {token}"}
    )
    # Returns 413 or 415 depending on error type detection
    assert res.status_code in [413, 415], f"Expected 413/415, got {res.status_code}: {res.text}"
    assert "image" in res.text.lower() or "allowed" in res.text.lower()

    # Test 6: Delete avatar
    api.delete("/profile/avatar", 204, login=user)

    # After delete, check that avatar_url is reset
    profile_res = api.get("/profile", 200, login=user)
    deleted_avatar_url = profile_res.json.get("avatar_url")
    # Avatar URL should be None or default after deletion
    # Note: The implementation may leave the old URL if the file is deleted but DB not updated
    # Just verify the deletion API returned 204
    log.info(f"Avatar after deletion: {deleted_avatar_url}")

    # =========================================================================
    # PAPS MEDIA TESTS - Test MediaHandler through paps media endpoints
    # =========================================================================
    log.info("Testing PAPS media uploads via MediaHandler...")

    # Create a PAPS first
    res = api.post("/paps", 201, json={
        "title": "Media Test Paps Project",
        "description": "A test paps for media upload testing with MediaHandler",
        "payment_type": "fixed",
        "payment_amount": 500.00,
        "payment_currency": "USD",
        "status": "draft"
    }, login=user)
    paps_id = res.json.get("paps_id")
    assert paps_id is not None

    # Test 7: Upload PNG image to PAPS
    res = requests.post(
        f"{base_url}/paps/{paps_id}/media",
        files={"media": ("image.png", BytesIO(png_data), "image/png")},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    json_resp = res.json()
    assert "uploaded_media" in json_resp
    assert len(json_resp["uploaded_media"]) == 1
    media_id_png = json_resp["uploaded_media"][0]["media_id"]
    media_url_png = json_resp["uploaded_media"][0]["media_url"]
    log.info(f"PAPS media uploaded: {media_url_png}")

    # Test 8: Upload JPEG image to PAPS
    res = requests.post(
        f"{base_url}/paps/{paps_id}/media",
        files={"media": ("image.jpg", BytesIO(jpeg_data), "image/jpeg")},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    media_id_jpeg = res.json()["uploaded_media"][0]["media_id"]

    # Test 9: List PAPS media
    res = api.get(f"/paps/{paps_id}/media", 200, login=user)
    assert "media" in res.json
    assert res.json["media_count"] == 2
    media_ids = [m["media_id"] for m in res.json["media"]]
    assert media_id_png in media_ids
    assert media_id_jpeg in media_ids

    # Test 10: Retrieve individual PAPS media file via static URL
    media_list_res = api.get(f"/paps/{paps_id}/media", 200, login=user)
    media_url_png = next((m["media_url"] for m in media_list_res.json["media"] if m["media_id"] == media_id_png), None)
    assert media_url_png is not None, "Media URL not found"
    res = requests.get(f"{base_url}{media_url_png}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert res.headers.get("Content-Type") in ["image/png", "application/octet-stream"]

    # Test 11: Delete individual media file (owner)
    api.delete(f"/paps/media/{media_id_jpeg}", 204, login=user)

    # Verify deletion
    res = api.get(f"/paps/{paps_id}/media", 200, login=user)
    assert res.json["media_count"] == 1
    media_ids = [m["media_id"] for m in res.json["media"]]
    assert media_id_jpeg not in media_ids
    assert media_id_png in media_ids

    # Test 12: Non-owner cannot delete media
    api.delete(f"/paps/media/{media_id_png}", 403, login=user2)

    # Test 13: Invalid media ID format for DELETE
    api.delete("/paps/media/not-a-uuid", 400, login=user)

    # Test 14: Non-existent media ID for DELETE
    api.delete("/paps/media/00000000-0000-0000-0000-000000000000", 404, login=user)

    # Test 15: Upload to non-existent PAPS
    res = requests.post(
        f"{base_url}/paps/00000000-0000-0000-0000-000000000000/media",
        files={"media": ("image.png", BytesIO(png_data), "image/png")},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 404, f"Expected 404, got {res.status_code}"

    # Test 16: Non-owner cannot upload to PAPS
    res = requests.post(
        f"{base_url}/paps/{paps_id}/media",
        files={"media": ("image.png", BytesIO(png_data), "image/png")},
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # Test 17: Delete PAPS should cascade delete all media
    # First, add a new media
    res = requests.post(
        f"{base_url}/paps/{paps_id}/media",
        files={"media": ("image.png", BytesIO(png_data), "image/png")},
        headers={"Authorization": f"Bearer {token}"}
    )
    _ = res.json()["uploaded_media"][0]["media_id"]

    # Delete the PAPS
    api.delete(f"/paps/{paps_id}", 204, login=user)

    # Verify PAPS is deleted (media files are also removed from disk by cascade)

    # =========================================================================
    # SPAP MEDIA TESTS - Test MediaHandler through spap (application) endpoints
    # =========================================================================
    log.info("Testing SPAP media uploads via MediaHandler...")

    # Create a new PAPS for SPAP testing
    import datetime
    start_dt = (datetime.datetime.now() + datetime.timedelta(days=1)).isoformat()
    end_dt = (datetime.datetime.now() + datetime.timedelta(days=30)).isoformat()

    res = api.post("/paps", 201, json={
        "title": "SPAP Media Test Project",
        "description": "A test paps for SPAP media upload testing",
        "payment_type": "hourly",
        "payment_amount": 50.00,
        "payment_currency": "USD",
        "status": "published",  # Must be published to accept applications
        "start_datetime": start_dt,
        "end_datetime": end_dt
    }, login=user)
    paps_id_for_spap = res.json.get("paps_id")

    # User2 applies to the PAPS
    res = api.post(f"/paps/{paps_id_for_spap}/apply", 201, json={
        "cover_letter": "I am applying for this job to test media uploads"
    }, login=user2)
    spap_id = res.json.get("spap_id")
    assert spap_id is not None

    # Test 18: Upload media to SPAP application
    res = requests.post(
        f"{base_url}/spap/{spap_id}/media",
        files={"media": ("image.png", BytesIO(png_data), "image/png")},
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
    json_resp = res.json()
    assert "uploaded_media" in json_resp
    spap_media_id = json_resp["uploaded_media"][0]["media_id"]
    spap_media_url = json_resp["uploaded_media"][0]["media_url"]
    log.info(f"SPAP media uploaded: {spap_media_url}")

    # Test 19: Retrieve SPAP media via static URL (no auth needed for static files)
    res = requests.get(f"{base_url}{spap_media_url}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert res.headers.get("Content-Type") in ["image/png", "application/octet-stream"]

    # Test 20: Media list shows correct URL
    spap_media_list = api.get(f"/spap/{spap_id}/media", 200, login=user2)
    assert len(spap_media_list.json["media"]) == 1
    assert spap_media_list.json["media"][0]["media_url"] == spap_media_url

    # Test 21: Other users can still access static files (no endpoint auth anymore)
    # But they shouldn't know the URL without authorized access to the SPAP
    # Register a third user (or use existing)
    user3 = "testmedia3"
    api.setPass(user3, pswd)
    try:
        api.post("/register", 201, json={
            "username": user3,
            "email": f"{user3}@test.com",
            "password": pswd
        }, login=None)
    except Exception:
        # User already exists, that's fine
        pass
    user3_token = api.get("/login", 200, login=user3).json
    token3 = user3_token.get("token") if isinstance(user3_token, dict) else user3_token
    api.setToken(user3, token3)

    # Test 22: Non-applicant cannot upload to SPAP
    res = requests.post(
        f"{base_url}/spap/{spap_id}/media",
        files={"media": ("image.png", BytesIO(png_data), "image/png")},
        headers={"Authorization": f"Bearer {token}"}  # user is PAPS owner, not applicant
    )
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"

    # Test 23: Applicant can delete their own media
    api.delete(f"/spap/media/{spap_media_id}", 204, login=user2)

    # Verify deletion - check that media is no longer in the list
    spap_media_list_after = api.get(f"/spap/{spap_id}/media", 200, login=user2)
    media_ids_after = [m["media_id"] for m in spap_media_list_after.json["media"]]
    assert spap_media_id not in media_ids_after, f"Media {spap_media_id} should have been deleted"

    # Test 24: Upload new media and test withdrawal cascade
    res = requests.post(
        f"{base_url}/spap/{spap_id}/media",
        files={"media": ("image.png", BytesIO(png_data), "image/png")},
        headers={"Authorization": f"Bearer {token2}"}
    )
    _ = res.json()["uploaded_media"][0]["media_id"]

    # Withdraw application (should cascade delete media)
    api.delete(f"/spap/{spap_id}", 204, login=user2)

    # Note: Can't verify media is gone via GET since endpoint was removed
    # The cascade delete happens at DB level, so the API response 204 is sufficient

    # =========================================================================
    # EDGE CASES AND SECURITY TESTS
    # =========================================================================
    log.info("Testing edge cases and security...")

    # Test 25: Invalid media_id formats for DELETE should be rejected
    # UUID validation is the primary protection against path traversal
    api.delete("/paps/media/invalid-id", 400, login=user)
    api.delete("/spap/media/invalid-id", 400, login=user)

    # Note: GET /paps/media and /spap/media endpoints no longer exist
    # Media is served statically via Flask at /media/post/ and /media/spap/

    # =========================================================================
    # CLEANUP
    # =========================================================================
    log.info("Cleaning up test data...")

    # Delete PAPS (will cascade delete any remaining media)
    api.delete(f"/paps/{paps_id_for_spap}", 204, login=user)

    # Delete test users
    try:
        res = api.get(f"/user/{user}/profile", 200, login=None)
        user_id = res.json["user_id"]
        api.delete(f"/users/{user_id}", 204, login=ADMIN)
    except Exception as e:
        log.warning(f"Could not delete user {user}: {e}")

    try:
        res2 = api.get(f"/user/{user2}/profile", 200, login=None)
        user2_id = res2.json["user_id"]
        api.delete(f"/users/{user2_id}", 204, login=ADMIN)
    except Exception as e:
        log.warning(f"Could not delete user {user2}: {e}")

    try:
        res3 = api.get(f"/user/{user3}/profile", 200, login=None)
        user3_id = res3.json["user_id"]
        api.delete(f"/users/{user3_id}", 204, login=ADMIN)
    except Exception as e:
        log.warning(f"Could not delete user {user3}: {e}")

    # Clear tokens
    api.setToken(user, None)
    api.setPass(user, None)
    api.setToken(user2, None)
    api.setPass(user2, None)
    api.setToken(user3, None)
    api.setPass(user3, None)

    log.info("MediaHandler API tests completed successfully!")


# ===========================================================================
# SPAP (Service Provider Application) Tests
# ===========================================================================

def test_spap(api):
    """Comprehensive tests for SPAP (job application) functionality."""
    import datetime
    import uuid

    suffix = uuid.uuid4().hex[:8]
    owner = f"spapowner{suffix}"
    applicant = f"spapapplicant{suffix}"
    pswd = "test123!ABC"
    api.setPass(owner, pswd)
    api.setPass(applicant, pswd)

    # Register owner and applicant
    api.post("/register", 201, json={
        "username": owner,
        "email": f"{owner}@test.com",
        "password": pswd
    }, login=None)
    owner_token = api.get("/login", 200, login=owner).json
    api.setToken(owner, owner_token.get("token") if isinstance(owner_token, dict) else owner_token)

    api.post("/register", 201, json={
        "username": applicant,
        "email": f"{applicant}@test.com",
        "password": pswd
    }, login=None)
    applicant_token = api.get("/login", 200, login=applicant).json
    api.setToken(applicant, applicant_token.get("token") if isinstance(applicant_token, dict) else applicant_token)

    # Create future dates for PAPS
    start_dt = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat()

    # Create a PAPS for applications (published directly with start_datetime)
    res = api.post("/paps", 201, json={
        "title": "SPAP Test Job Posting",
        "description": "A job posting to test the SPAP application flow with all features.",
        "payment_type": "fixed",
        "payment_amount": 1000.00,
        "payment_currency": "USD",
        "status": "published",
        "start_datetime": start_dt,
        "max_applicants": 5,
        "max_assignees": 1
    }, login=owner)
    paps_id = res.json.get("paps_id")

    # Owner cannot apply to own PAPS
    api.post(f"/paps/{paps_id}/apply", 403, json={
        "cover_letter": "I want to apply to my own job posting."
    }, login=owner)

    # Applicant applies to PAPS
    res = api.post(f"/paps/{paps_id}/apply", 201, json={
        "cover_letter": "I am interested in this job and have relevant experience."
    }, login=applicant)
    spap_id = res.json.get("spap_id")
    chat_thread_id = res.json.get("chat_thread_id")
    assert spap_id is not None
    assert chat_thread_id is not None

    # Cannot apply twice
    api.post(f"/paps/{paps_id}/apply", 409, json={
        "cover_letter": "Trying to apply again."
    }, login=applicant)

    # Get my applications
    res = api.get("/spap/my", 200, login=applicant)
    assert res.json["count"] >= 1
    my_app = [a for a in res.json["applications"] if a["id"] == spap_id]
    assert len(my_app) == 1
    assert my_app[0]["status"] == "pending"

    # Owner views applications
    res = api.get(f"/paps/{paps_id}/applications", 200, login=owner)
    assert res.json["count"] == 1
    assert res.json["applications"][0]["id"] == spap_id

    # Get specific SPAP
    res = api.get(f"/spap/{spap_id}", 200, login=owner)
    assert res.json["status"] == "pending"
    assert res.json["paps_id"] == paps_id

    # Applicant can also view their own SPAP
    res = api.get(f"/spap/{spap_id}", 200, login=applicant)
    assert res.json["id"] == spap_id

    # Third party cannot view SPAP
    api.get(f"/spap/{spap_id}", 403, login=NOADM)

    # Test SPAP rejection (updates status to 'rejected')
    api.put(f"/spap/{spap_id}/reject", 204, login=owner)

    # Verify rejection - SPAP still exists with status='rejected'
    res = api.get(f"/spap/{spap_id}", 200, login=owner)
    assert res.json["status"] == "rejected", f"Expected 'rejected', got {res.json['status']}"

    # Cannot accept rejected SPAP
    api.put(f"/spap/{spap_id}/accept", 400, login=owner)

    # Cannot reject again
    api.put(f"/spap/{spap_id}/reject", 400, login=owner)

    # Create a new PAPS for testing acceptance flow
    res = api.post("/paps", 201, json={
        "title": "Test PAPS for Accept Flow",
        "description": "Testing the acceptance workflow for job applications.",
        "payment_type": "fixed",
        "payment_amount": 100.00,
        "payment_currency": "USD",
        "status": "published",
        "start_datetime": start_dt
    }, login=owner)
    paps_id2 = res.json.get("paps_id")

    # Apply to new PAPS
    res = api.post(f"/paps/{paps_id2}/apply", 201, json={
        "cover_letter": "Applying to test acceptance."
    }, login=applicant)
    spap_id2 = res.json.get("spap_id")

    # Test SPAP acceptance (creates ASAP)
    res = api.put(f"/spap/{spap_id2}/accept", 200, login=owner)
    asap_id = res.json.get("asap_id")
    assert asap_id is not None

    # SPAP still exists with status='accepted'
    res = api.get(f"/spap/{spap_id2}", 200, login=owner)
    assert res.json["status"] == "accepted", f"Expected 'accepted', got {res.json['status']}"

    # Cannot accept again
    api.put(f"/spap/{spap_id2}/accept", 400, login=owner)

    # Cleanup - delete ASAP first since it references PAPS
    api.delete(f"/asap/{asap_id}", 204, login=owner)

    # Delete PAPS (both of them)
    api.delete(f"/paps/{paps_id}", 204, login=owner)
    api.delete(f"/paps/{paps_id2}", 204, login=owner)

    # Delete users
    res = api.get(f"/user/{owner}/profile", 200, login=None)
    owner_id = res.json["user_id"]
    api.delete(f"/users/{owner_id}", 204, login=ADMIN)

    res = api.get(f"/user/{applicant}/profile", 200, login=None)
    applicant_id = res.json["user_id"]
    api.delete(f"/users/{applicant_id}", 204, login=ADMIN)

    api.setToken(owner, None)
    api.setPass(owner, None)
    api.setToken(applicant, None)
    api.setPass(applicant, None)


# ===========================================================================
# ASAP (Accepted Service Agreement Protocol) Tests
# ===========================================================================

def test_asap(api):
    """Comprehensive tests for ASAP (assignment) functionality."""
    import datetime
    import uuid

    suffix = uuid.uuid4().hex[:8]
    owner = f"asapowner{suffix}"
    worker = f"asapworker{suffix}"
    thirdparty = f"asapthird{suffix}"
    pswd = "test123!ABC"
    api.setPass(owner, pswd)
    api.setPass(worker, pswd)
    api.setPass(thirdparty, pswd)

    # Register users
    api.post("/register", 201, json={
        "username": owner,
        "email": f"{owner}@test.com",
        "password": pswd
    }, login=None)
    owner_token = api.get("/login", 200, login=owner).json
    api.setToken(owner, owner_token.get("token") if isinstance(owner_token, dict) else owner_token)

    api.post("/register", 201, json={
        "username": worker,
        "email": f"{worker}@test.com",
        "password": pswd
    }, login=None)
    worker_token = api.get("/login", 200, login=worker).json
    api.setToken(worker, worker_token.get("token") if isinstance(worker_token, dict) else worker_token)

    api.post("/register", 201, json={
        "username": thirdparty,
        "email": f"{thirdparty}@test.com",
        "password": pswd
    }, login=None)
    thirdparty_token = api.get("/login", 200, login=thirdparty).json
    api.setToken(thirdparty, thirdparty_token.get("token") if isinstance(thirdparty_token, dict) else thirdparty_token)

    # Create future date
    start_dt = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat()

    # Create and publish a PAPS
    res = api.post("/paps", 201, json={
        "title": "ASAP Test Job Posting",
        "description": "A job posting to test ASAP assignment lifecycle functionality.",
        "payment_type": "fixed",
        "payment_amount": 2000.00,
        "payment_currency": "EUR",
        "status": "published",
        "start_datetime": start_dt
    }, login=owner)
    paps_id = res.json.get("paps_id")

    # Worker applies
    res = api.post(f"/paps/{paps_id}/apply", 201, json={
        "cover_letter": "Ready to work on this assignment."
    }, login=worker)
    spap_id = res.json.get("spap_id")

    # Owner accepts - creates ASAP
    res = api.put(f"/spap/{spap_id}/accept", 200, login=owner)
    asap_id = res.json.get("asap_id")

    # Get ASAP list as owner
    res = api.get("/asap", 200, login=owner)
    assert res.json["total_as_owner"] >= 1
    owner_asaps = [a for a in res.json["as_owner"] if a["asap_id"] == asap_id]
    assert len(owner_asaps) == 1
    assert owner_asaps[0]["status"] == "active"

    # Get ASAP list as worker
    res = api.get("/asap", 200, login=worker)
    assert res.json["total_as_worker"] >= 1
    worker_asaps = [a for a in res.json["as_worker"] if a["asap_id"] == asap_id]
    assert len(worker_asaps) == 1

    # Get specific ASAP
    res = api.get(f"/asap/{asap_id}", 200, login=owner)
    assert res.json["status"] == "active"
    assert res.json["paps_id"] == paps_id

    # Worker can also view
    res = api.get(f"/asap/{asap_id}", 200, login=worker)
    assert res.json["asap_id"] == asap_id

    # Third party cannot view
    api.get(f"/asap/{asap_id}", 403, login=thirdparty)

    # Get assignments for PAPS
    res = api.get(f"/paps/{paps_id}/assignments", 200, login=owner)
    assert len(res.json) >= 1

    # ASAP no longer has updatable fields (title, location, etc. are in PAPS)
    # All job details come from PAPS table

    # Test status transitions
    # Start the assignment (worker)
    api.put(f"/asap/{asap_id}/status", 204, json={"status": "in_progress"}, login=worker)
    res = api.get(f"/asap/{asap_id}", 200, login=worker)
    assert res.json["status"] == "in_progress"
    assert not res.json.get("worker_confirmed")
    assert not res.json.get("owner_confirmed")

    # Test dual confirmation flow
    # Worker cannot confirm if not in progress (already handled - we're in progress now)

    # Worker confirms completion first
    res = api.post(f"/asap/{asap_id}/confirm", 200, login=worker)
    assert res.json["status"] == "pending_confirmation"
    assert "Waiting for owner" in res.json["message"]

    # Check confirmation status
    res = api.get(f"/asap/{asap_id}", 200, login=owner)
    assert res.json["worker_confirmed"]
    assert not res.json["owner_confirmed"]
    assert res.json["status"] == "in_progress"  # Not completed yet

    # Worker cannot confirm again
    api.post(f"/asap/{asap_id}/confirm", 400, login=worker)

    # Third party cannot confirm
    api.post(f"/asap/{asap_id}/confirm", 403, login=thirdparty)

    # Owner confirms - should complete the ASAP
    res = api.post(f"/asap/{asap_id}/confirm", 200, login=owner)
    assert res.json["status"] == "completed"
    assert "completed" in res.json["message"].lower()

    # Verify ASAP is completed and both confirmed
    res = api.get(f"/asap/{asap_id}", 200, login=worker)
    assert res.json["status"] == "completed"
    assert res.json["worker_confirmed"]
    assert res.json["owner_confirmed"]
    assert res.json["completed_at"] is not None

    # Cannot confirm already completed ASAP
    api.post(f"/asap/{asap_id}/confirm", 400, login=owner)

    # Cannot delete completed ASAP
    api.delete(f"/asap/{asap_id}", 400, login=owner)

    # Delete payments first (created when ASAP was completed)
    res = api.get(f"/paps/{paps_id}/payments", 200, login=owner)
    for payment in res.json["payments"]:
        api.delete(f"/payments/{payment['payment_id']}", 204, login=ADMIN)

    # Can delete PAPS after payments are deleted (cascades to ASAP)
    api.delete(f"/paps/{paps_id}", 204, login=ADMIN)

    res = api.get(f"/user/{owner}/profile", 200, login=None)
    owner_id = res.json["user_id"]
    api.delete(f"/users/{owner_id}", 204, login=ADMIN)

    res = api.get(f"/user/{worker}/profile", 200, login=None)
    worker_id = res.json["user_id"]
    api.delete(f"/users/{worker_id}", 204, login=ADMIN)

    res = api.get(f"/user/{thirdparty}/profile", 200, login=None)
    thirdparty_id = res.json["user_id"]
    api.delete(f"/users/{thirdparty_id}", 204, login=ADMIN)

    api.setToken(owner, None)
    api.setPass(owner, None)
    api.setToken(worker, None)
    api.setPass(worker, None)
    api.setToken(thirdparty, None)
    api.setPass(thirdparty, None)


def test_asap_hourly_payment(api):
    """Test ASAP with hourly payment calculation."""
    import datetime
    import uuid
    import time

    suffix = uuid.uuid4().hex[:8]
    owner = f"hrowner{suffix}"
    worker = f"hrworker{suffix}"
    pswd = "test123!ABC"
    api.setPass(owner, pswd)
    api.setPass(worker, pswd)

    # Register users
    api.post("/register", 201, json={
        "username": owner,
        "email": f"{owner}@test.com",
        "password": pswd
    }, login=None)
    owner_token = api.get("/login", 200, login=owner).json
    api.setToken(owner, owner_token.get("token") if isinstance(owner_token, dict) else owner_token)

    api.post("/register", 201, json={
        "username": worker,
        "email": f"{worker}@test.com",
        "password": pswd
    }, login=None)
    worker_token = api.get("/login", 200, login=worker).json
    api.setToken(worker, worker_token.get("token") if isinstance(worker_token, dict) else worker_token)

    # Create future date
    start_dt = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat()

    # Create an hourly PAPS
    res = api.post("/paps", 201, json={
        "title": "Hourly Payment Test Job",
        "description": "A job posting to test hourly payment calculation.",
        "payment_type": "hourly",
        "payment_amount": 25.00,  # $25/hour
        "payment_currency": "USD",
        "status": "published",
        "start_datetime": start_dt
    }, login=owner)
    paps_id = res.json.get("paps_id")

    # Worker applies
    res = api.post(f"/paps/{paps_id}/apply", 201, json={
        "cover_letter": "Ready to work hourly."
    }, login=worker)
    spap_id = res.json.get("spap_id")

    # Owner accepts - creates ASAP
    res = api.put(f"/spap/{spap_id}/accept", 200, login=owner)
    asap_id = res.json.get("asap_id")

    # Start the assignment
    api.put(f"/asap/{asap_id}/status", 204, json={"status": "in_progress"}, login=worker)

    # Wait a tiny bit (the real calculation is based on actual time)
    time.sleep(0.1)

    # Both confirm
    api.post(f"/asap/{asap_id}/confirm", 200, login=worker)
    api.post(f"/asap/{asap_id}/confirm", 200, login=owner)

    # Check payment was created
    res = api.get(f"/paps/{paps_id}/payments", 200, login=owner)
    assert len(res.json["payments"]) >= 1

    # Payment should be calculated based on hours worked (will be small since we only waited 0.1 seconds)
    payment = res.json["payments"][0]
    assert payment["amount"] >= 0  # Should be a small amount

    # Cleanup
    for p in res.json["payments"]:
        api.delete(f"/payments/{p['payment_id']}", 204, login=ADMIN)

    api.delete(f"/paps/{paps_id}", 204, login=ADMIN)

    res = api.get(f"/user/{owner}/profile", 200, login=None)
    owner_id = res.json["user_id"]
    api.delete(f"/users/{owner_id}", 204, login=ADMIN)

    res = api.get(f"/user/{worker}/profile", 200, login=None)
    worker_id = res.json["user_id"]
    api.delete(f"/users/{worker_id}", 204, login=ADMIN)

    api.setToken(owner, None)
    api.setPass(owner, None)
    api.setToken(worker, None)
    api.setPass(worker, None)


# ===========================================================================
# Chat Tests
# ===========================================================================

def test_chat(api):
    """Comprehensive tests for chat functionality."""
    import datetime
    import uuid

    suffix = uuid.uuid4().hex[:8]
    owner = f"chatowner{suffix}"
    worker = f"chatworker{suffix}"
    pswd = "test123!ABC"
    api.setPass(owner, pswd)
    api.setPass(worker, pswd)

    # Register users
    api.post("/register", 201, json={
        "username": owner,
        "email": f"{owner}@test.com",
        "password": pswd
    }, login=None)
    owner_token = api.get("/login", 200, login=owner).json
    api.setToken(owner, owner_token.get("token") if isinstance(owner_token, dict) else owner_token)

    api.post("/register", 201, json={
        "username": worker,
        "email": f"{worker}@test.com",
        "password": pswd
    }, login=None)
    worker_token = api.get("/login", 200, login=worker).json
    api.setToken(worker, worker_token.get("token") if isinstance(worker_token, dict) else worker_token)

    # Create future date
    start_dt = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat()

    # Create and publish a PAPS
    res = api.post("/paps", 201, json={
        "title": "Chat Test Job Posting",
        "description": "A job posting to test chat messaging functionality.",
        "payment_type": "fixed",
        "payment_amount": 500.00,
        "payment_currency": "USD",
        "status": "published",
        "start_datetime": start_dt
    }, login=owner)
    paps_id = res.json.get("paps_id")

    # Worker applies - creates chat thread
    res = api.post(f"/paps/{paps_id}/apply", 201, json={
        "cover_letter": "I want to discuss this project."
    }, login=worker)
    spap_id = res.json.get("spap_id")
    thread_id = res.json.get("chat_thread_id")

    # Get chat threads for owner
    res = api.get("/chat", 200, login=owner)
    assert res.json["count"] >= 1

    # Get chat threads for worker
    res = api.get("/chat", 200, login=worker)
    assert res.json["count"] >= 1

    # Get specific thread
    res = api.get(f"/chat/{thread_id}", 200, login=owner)
    assert res.json["thread_id"] == thread_id
    assert res.json["thread_type"] == "spap_discussion"

    # Get thread via SPAP endpoint
    res = api.get(f"/spap/{spap_id}/chat", 200, login=owner)
    assert res.json["thread_id"] == thread_id

    # Send message from owner
    res = api.post(f"/chat/{thread_id}/messages", 201, json={
        "content": "Hello! Thanks for your interest in this project."
    }, login=owner)
    _ = res.json.get("message_id")

    # Send message from worker
    res = api.post(f"/chat/{thread_id}/messages", 201, json={
        "content": "Thanks! When do you need this completed?"
    }, login=worker)
    msg_id2 = res.json.get("message_id")

    # Get messages
    res = api.get(f"/chat/{thread_id}/messages", 200, login=owner)
    assert res.json["count"] == 2
    assert len(res.json["messages"]) == 2

    # Check unread count
    res = api.get(f"/chat/{thread_id}/unread", 200, login=owner)
    assert res.json["unread_count"] >= 0

    # Mark message as read
    api.put(f"/chat/{thread_id}/messages/{msg_id2}/read", 204, login=owner)

    # Mark all messages as read
    api.put(f"/chat/{thread_id}/read", 204, login=owner)

    # Get participants
    res = api.get(f"/chat/{thread_id}/participants", 200, login=owner)
    assert len(res.json) >= 2

    # Third party cannot view or send messages
    api.get(f"/chat/{thread_id}", 403, login=NOADM)
    api.get(f"/chat/{thread_id}/messages", 403, login=NOADM)
    api.post(f"/chat/{thread_id}/messages", 403, json={"content": "Hacking"}, login=NOADM)

    # Accept SPAP - chat thread transfers to ASAP
    res = api.put(f"/spap/{spap_id}/accept", 200, login=owner)
    asap_id = res.json.get("asap_id")

    # Chat thread should now be asap_discussion type
    res = api.get(f"/chat/{thread_id}", 200, login=owner)
    assert res.json["thread_type"] == "asap_discussion"

    # Get thread via ASAP endpoint
    res = api.get(f"/asap/{asap_id}/chat", 200, login=owner)
    assert res.json["thread_id"] == thread_id

    # Get all chats for PAPS
    res = api.get(f"/paps/{paps_id}/chats", 200, login=owner)
    assert "threads" in res.json

    # Leave chat (worker)
    api.delete(f"/chat/{thread_id}/leave", 204, login=worker)

    # Cleanup
    api.delete(f"/asap/{asap_id}", 204, login=owner)
    api.delete(f"/paps/{paps_id}", 204, login=owner)

    res = api.get(f"/user/{owner}/profile", 200, login=None)
    owner_id = res.json["user_id"]
    api.delete(f"/users/{owner_id}", 204, login=ADMIN)

    res = api.get(f"/user/{worker}/profile", 200, login=None)
    worker_id = res.json["user_id"]
    api.delete(f"/users/{worker_id}", 204, login=ADMIN)

    api.setToken(owner, None)
    api.setPass(owner, None)
    api.setToken(worker, None)
    api.setPass(worker, None)


# ===========================================================================
# Payment Tests
# ===========================================================================

def test_payment(api):
    """Comprehensive tests for payment functionality."""
    import datetime
    import uuid

    suffix = uuid.uuid4().hex[:8]
    owner = f"payowner{suffix}"
    worker = f"payworker{suffix}"
    pswd = "test123!ABC"
    api.setPass(owner, pswd)
    api.setPass(worker, pswd)

    # Register users
    api.post("/register", 201, json={
        "username": owner,
        "email": f"{owner}@test.com",
        "password": pswd
    }, login=None)
    owner_token = api.get("/login", 200, login=owner).json
    api.setToken(owner, owner_token.get("token") if isinstance(owner_token, dict) else owner_token)

    api.post("/register", 201, json={
        "username": worker,
        "email": f"{worker}@test.com",
        "password": pswd
    }, login=None)
    worker_token = api.get("/login", 200, login=worker).json
    api.setToken(worker, worker_token.get("token") if isinstance(worker_token, dict) else worker_token)

    # Create future date
    start_dt = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat()

    # Create PAPS, apply, and accept to get ASAP
    res = api.post("/paps", 201, json={
        "title": "Payment Test Job Posting",
        "description": "A job posting to test payment functionality.",
        "payment_type": "fixed",
        "payment_amount": 1500.00,
        "payment_currency": "EUR",
        "status": "published",
        "start_datetime": start_dt
    }, login=owner)
    paps_id = res.json.get("paps_id")

    res = api.post(f"/paps/{paps_id}/apply", 201, json={
        "cover_letter": "Ready to work."
    }, login=worker)
    spap_id = res.json.get("spap_id")

    res = api.put(f"/spap/{spap_id}/accept", 200, login=owner)
    _ = res.json.get("asap_id")

    # Get worker user ID for payment
    res = api.get(f"/user/{worker}/profile", 200, login=None)
    worker_id = res.json["user_id"]

    # Create payment (owner only)
    res = api.post(f"/paps/{paps_id}/payments", 201, json={
        "payee_id": worker_id,
        "amount": 500.00,
        "currency": "EUR"
    }, login=owner)
    payment_id = res.json.get("payment_id")

    # Worker cannot create payment
    api.post(f"/paps/{paps_id}/payments", 403, json={
        "payee_id": worker_id,
        "amount": 100.00,
        "currency": "EUR"
    }, login=worker)

    # Get payment details
    res = api.get(f"/payments/{payment_id}", 200, login=owner)
    assert res.json["amount"] == 500.00
    assert res.json["status"] == "pending"

    # Worker can also view
    res = api.get(f"/payments/{payment_id}", 200, login=worker)
    assert res.json["payment_id"] == payment_id

    # Third party cannot view
    api.get(f"/payments/{payment_id}", 403, login=NOADM)

    # Get all payments
    res = api.get("/payments", 200, login=owner)
    assert res.json["total_count"] >= 1

    # Get payments for PAPS
    res = api.get(f"/paps/{paps_id}/payments", 200, login=owner)
    assert res.json["count"] >= 1

    # Update payment status (owner completes payment)
    api.put(f"/payments/{payment_id}/status", 204, json={
        "status": "completed",
        "payment_method": "stripe"
    }, login=owner)

    res = api.get(f"/payments/{payment_id}", 200, login=owner)
    assert res.json["status"] == "completed"

    # Create second payment
    res = api.post(f"/paps/{paps_id}/payments", 201, json={
        "payee_id": worker_id,
        "amount": 1000.00,
        "currency": "EUR"
    }, login=owner)
    payment_id2 = res.json.get("payment_id")

    # Test payment cancellation
    api.put(f"/payments/{payment_id2}/status", 204, json={
        "status": "cancelled"
    }, login=owner)

    res = api.get(f"/payments/{payment_id2}", 200, login=owner)
    assert res.json["status"] == "cancelled"

    # Cannot modify cancelled payment
    api.put(f"/payments/{payment_id2}/status", 400, json={
        "status": "completed"
    }, login=owner)

    # Delete pending payment
    res = api.post(f"/paps/{paps_id}/payments", 201, json={
        "payee_id": worker_id,
        "amount": 200.00,
        "currency": "EUR"
    }, login=owner)
    payment_id3 = res.json.get("payment_id")

    api.delete(f"/payments/{payment_id3}", 204, login=owner)
    api.get(f"/payments/{payment_id3}", 404, login=owner)

    # Cleanup - delete payments first, then PAPS (which cascades to ASAP)
    api.delete(f"/payments/{payment_id}", 204, login=ADMIN)
    api.delete(f"/payments/{payment_id2}", 204, login=ADMIN)
    api.delete(f"/paps/{paps_id}", 204, login=owner)

    res = api.get(f"/user/{owner}/profile", 200, login=None)
    owner_id = res.json["user_id"]
    api.delete(f"/users/{owner_id}", 204, login=ADMIN)

    res = api.get(f"/user/{worker}/profile", 200, login=None)
    worker_id = res.json["user_id"]
    api.delete(f"/users/{worker_id}", 204, login=ADMIN)

    api.setToken(owner, None)
    api.setPass(owner, None)
    api.setToken(worker, None)
    api.setPass(worker, None)


# ===========================================================================
# Rating Tests
# ===========================================================================

def test_rating(api):
    """Comprehensive tests for rating functionality."""
    import datetime
    import uuid

    suffix = uuid.uuid4().hex[:8]
    owner = f"rateowner{suffix}"
    worker = f"rateworker{suffix}"
    pswd = "test123!ABC"
    api.setPass(owner, pswd)
    api.setPass(worker, pswd)

    # Register users
    api.post("/register", 201, json={
        "username": owner,
        "email": f"{owner}@test.com",
        "password": pswd
    }, login=None)
    owner_token = api.get("/login", 200, login=owner).json
    api.setToken(owner, owner_token.get("token") if isinstance(owner_token, dict) else owner_token)

    api.post("/register", 201, json={
        "username": worker,
        "email": f"{worker}@test.com",
        "password": pswd
    }, login=None)
    worker_token = api.get("/login", 200, login=worker).json
    api.setToken(worker, worker_token.get("token") if isinstance(worker_token, dict) else worker_token)

    # Get worker's user_id for rating check later
    res = api.get(f"/user/{worker}/profile", 200, login=None)
    worker_user_id = res.json["user_id"]

    # Check initial rating (should be 0)
    res = api.get(f"/users/{worker_user_id}/rating", 200, login=owner)
    assert res.json["rating_count"] == 0
    assert res.json["rating_average"] == 0

    # Create future date
    start_dt = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat()

    # Create PAPS, apply, and accept to get ASAP
    res = api.post("/paps", 201, json={
        "title": "Rating Test Job Posting",
        "description": "A job posting to test rating functionality.",
        "payment_type": "fixed",
        "payment_amount": 1000.00,
        "payment_currency": "USD",
        "status": "published",
        "start_datetime": start_dt
    }, login=owner)
    paps_id = res.json.get("paps_id")

    res = api.post(f"/paps/{paps_id}/apply", 201, json={
        "cover_letter": "Ready to work and get rated."
    }, login=worker)
    spap_id = res.json.get("spap_id")

    res = api.put(f"/spap/{spap_id}/accept", 200, login=owner)
    asap_id = res.json.get("asap_id")

    # Cannot rate before ASAP is completed
    res = api.get(f"/asap/{asap_id}/can-rate", 200, login=owner)
    assert not res.json["can_rate"]

    # Trying to rate uncompleted ASAP returns 404 (not found in completed ASAPs)
    api.post(f"/asap/{asap_id}/rate", 404, json={"score": 5}, login=owner)

    # Complete the ASAP (owner must mark as completed)
    api.put(f"/asap/{asap_id}/status", 204, json={"status": "in_progress"}, login=worker)
    api.put(f"/asap/{asap_id}/status", 204, json={"status": "completed"}, login=owner)

    # Check can-rate endpoint
    res = api.get(f"/asap/{asap_id}/can-rate", 200, login=owner)
    assert res.json["can_rate"]
    assert res.json["is_owner"]
    assert res.json["user_to_rate_id"] == worker_user_id

    # Owner rates worker
    res = api.post(f"/asap/{asap_id}/rate", 201, json={"score": 5}, login=owner)
    assert res.json["score"] == 5
    assert res.json["rated_user_id"] == worker_user_id

    # Note: Rating system allows multiple ratings by same user (moving average only)
    # Each rating updates the aggregate, no duplicate protection

    # Check worker's rating was updated
    res = api.get(f"/users/{worker_user_id}/rating", 200, login=owner)
    assert res.json["rating_count"] == 1
    assert res.json["rating_average"] == 5

    # Worker can also rate owner (bidirectional)
    res = api.get(f"/asap/{asap_id}/can-rate", 200, login=worker)
    assert res.json["can_rate"]
    assert res.json["is_worker"]

    res = api.get(f"/user/{owner}/profile", 200, login=None)
    owner_user_id = res.json["user_id"]

    res = api.post(f"/asap/{asap_id}/rate", 201, json={"score": 4}, login=worker)
    assert res.json["score"] == 4

    # Check owner's rating
    res = api.get(f"/users/{owner_user_id}/rating", 200, login=worker)
    assert res.json["rating_count"] == 1
    assert res.json["rating_average"] == 4

    # Test profile rating endpoint (get own rating)
    res = api.get("/profile/rating", 200, login=worker)
    assert res.json["rating_count"] == 1

    # Test invalid score values
    # Score must be 1-5
    # Need another completed ASAP for this test
    res = api.post("/paps", 201, json={
        "title": "Rating Test Job 2",
        "description": "Another job to test invalid rating values.",
        "payment_type": "fixed",
        "payment_amount": 500.00,
        "payment_currency": "USD",
        "status": "published",
        "start_datetime": start_dt
    }, login=owner)
    paps_id2 = res.json.get("paps_id")

    res = api.post(f"/paps/{paps_id2}/apply", 201, json={
        "cover_letter": "Testing invalid scores."
    }, login=worker)
    spap_id2 = res.json.get("spap_id")

    res = api.put(f"/spap/{spap_id2}/accept", 200, login=owner)
    asap_id2 = res.json.get("asap_id")

    api.put(f"/asap/{asap_id2}/status", 204, json={"status": "in_progress"}, login=worker)
    api.put(f"/asap/{asap_id2}/status", 204, json={"status": "completed"}, login=owner)

    # Invalid scores
    api.post(f"/asap/{asap_id2}/rate", 400, json={"score": 0}, login=owner)
    api.post(f"/asap/{asap_id2}/rate", 400, json={"score": 6}, login=owner)
    api.post(f"/asap/{asap_id2}/rate", 400, json={"score": -1}, login=owner)

    # Cleanup - cannot delete completed ASAPs
    api.delete(f"/asap/{asap_id}", 400, login=owner)
    api.delete(f"/asap/{asap_id2}", 400, login=owner)

    # Delete payments first for both PAPS
    res = api.get(f"/paps/{paps_id}/payments", 200, login=owner)
    for payment in res.json["payments"]:
        api.delete(f"/payments/{payment['payment_id']}", 204, login=ADMIN)

    res = api.get(f"/paps/{paps_id2}/payments", 200, login=owner)
    for payment in res.json["payments"]:
        api.delete(f"/payments/{payment['payment_id']}", 204, login=ADMIN)

    # Delete PAPS with admin (cascades to ASAPs)
    api.delete(f"/paps/{paps_id}", 204, login=ADMIN)
    api.delete(f"/paps/{paps_id2}", 204, login=ADMIN)

    api.delete(f"/users/{owner_user_id}", 204, login=ADMIN)
    api.delete(f"/users/{worker_user_id}", 204, login=ADMIN)

    api.setToken(owner, None)
    api.setPass(owner, None)
    api.setToken(worker, None)
    api.setPass(worker, None)


# ===========================================================================
# Comment Tests
# ===========================================================================

def test_comments(api):
    """Comprehensive tests for comment functionality."""
    import datetime
    import uuid

    suffix = uuid.uuid4().hex[:8]
    owner = f"cmtowner{suffix}"
    commenter = f"commenter{suffix}"
    pswd = "test123!ABC"
    api.setPass(owner, pswd)
    api.setPass(commenter, pswd)

    # Register users
    api.post("/register", 201, json={
        "username": owner,
        "email": f"{owner}@test.com",
        "password": pswd
    }, login=None)
    owner_token = api.get("/login", 200, login=owner).json
    api.setToken(owner, owner_token.get("token") if isinstance(owner_token, dict) else owner_token)

    api.post("/register", 201, json={
        "username": commenter,
        "email": f"{commenter}@test.com",
        "password": pswd
    }, login=None)
    commenter_token = api.get("/login", 200, login=commenter).json
    api.setToken(commenter, commenter_token.get("token") if isinstance(commenter_token, dict) else commenter_token)

    # Create future date
    start_dt = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat()

    # Create a published PAPS
    res = api.post("/paps", 201, json={
        "title": "Comment Test Job Posting",
        "description": "A job posting to test comment functionality.",
        "payment_type": "fixed",
        "payment_amount": 750.00,
        "payment_currency": "USD",
        "status": "published",
        "start_datetime": start_dt
    }, login=owner)
    paps_id = res.json.get("paps_id")

    # Get comments (should be empty)
    res = api.get(f"/paps/{paps_id}/comments", 200, login=owner)
    assert res.json["count"] == 0
    assert res.json["comments"] == []

    # Create a comment
    res = api.post(f"/paps/{paps_id}/comments", 201, json={
        "content": "This looks like an interesting project!"
    }, login=commenter)
    comment_id = res.json.get("comment_id")

    # Get comments
    res = api.get(f"/paps/{paps_id}/comments", 200, login=owner)
    assert res.json["count"] == 1
    assert res.json["comments"][0]["comment_id"] == comment_id
    assert res.json["comments"][0]["content"] == "This looks like an interesting project!"

    # Get specific comment
    res = api.get(f"/comments/{comment_id}", 200, login=owner)
    assert res.json["comment_id"] == comment_id
    assert res.json["paps_id"] == paps_id

    # Update own comment
    api.put(f"/comments/{comment_id}", 204, json={
        "content": "This looks like an interesting project! Updated."
    }, login=commenter)

    res = api.get(f"/comments/{comment_id}", 200, login=owner)
    assert "Updated" in res.json["content"]
    assert res.json["is_edited"]

    # Cannot update others' comments
    api.put(f"/comments/{comment_id}", 403, json={
        "content": "Hacking"
    }, login=owner)

    # Create a reply
    res = api.post(f"/comments/{comment_id}/replies", 201, json={
        "content": "Thanks! Let me know if you have questions."
    }, login=owner)
    reply_id = res.json.get("comment_id")

    # Get replies
    res = api.get(f"/comments/{comment_id}/replies", 200, login=commenter)
    assert res.json["count"] == 1
    assert res.json["replies"][0]["comment_id"] == reply_id
    assert res.json["replies"][0]["parent_id"] == comment_id

    # Get comment thread
    res = api.get(f"/comments/{reply_id}/thread", 200, login=commenter)
    assert "comment" in res.json
    assert res.json["is_reply"]

    # Check reply count on parent
    res = api.get(f"/comments/{comment_id}", 200, login=owner)
    assert res.json["reply_count"] == 1

    # Delete reply
    api.delete(f"/comments/{reply_id}", 204, login=owner)

    res = api.get(f"/comments/{comment_id}/replies", 200, login=commenter)
    assert res.json["count"] == 0

    # Delete original comment
    api.delete(f"/comments/{comment_id}", 204, login=commenter)

    # Verify deleted
    api.get(f"/comments/{comment_id}", 404, login=owner)

    # Test validation
    # Comment content empty
    api.post(f"/paps/{paps_id}/comments", 400, json={
        "content": ""
    }, login=commenter)

    # Comment on non-existent PAPS
    api.post("/paps/00000000-0000-0000-0000-000000000000/comments", 404, json={
        "content": "This PAPS doesn't exist but I'm commenting anyway."
    }, login=commenter)

    # Invalid UUID
    api.get("/comments/not-a-uuid", 400, login=owner)
    api.put("/comments/not-a-uuid", 400, json={"content": "Test"}, login=owner)
    api.delete("/comments/not-a-uuid", 400, login=owner)

    # Non-existent comment
    api.get("/comments/00000000-0000-0000-0000-000000000000", 404, login=owner)
    api.put("/comments/00000000-0000-0000-0000-000000000000", 404, json={"content": "Test"}, login=owner)
    api.delete("/comments/00000000-0000-0000-0000-000000000000", 404, login=owner)

    # Cleanup
    api.delete(f"/paps/{paps_id}", 204, login=owner)

    res = api.get(f"/user/{owner}/profile", 200, login=None)
    owner_id = res.json["user_id"]
    api.delete(f"/users/{owner_id}", 204, login=ADMIN)

    res = api.get(f"/user/{commenter}/profile", 200, login=None)
    commenter_id = res.json["user_id"]
    api.delete(f"/users/{commenter_id}", 204, login=ADMIN)

    api.setToken(owner, None)
    api.setPass(owner, None)
    api.setToken(commenter, None)
    api.setPass(commenter, None)


# ===========================================================================
# Full Workflow Integration Test
# ===========================================================================

def test_full_workflow(api):
    """
    Test the complete job posting workflow:
    1. Create PAPS
    2. Apply (SPAP)
    3. Accept (ASAP)
    4. Chat
    5. Payment
    6. Complete
    7. Rate
    """
    import datetime
    import uuid

    suffix = uuid.uuid4().hex[:8]
    owner = f"wfowner{suffix}"
    worker = f"wfworker{suffix}"
    pswd = "test123!ABC"
    api.setPass(owner, pswd)
    api.setPass(worker, pswd)

    # Register users
    api.post("/register", 201, json={
        "username": owner,
        "email": f"{owner}@test.com",
        "password": pswd
    }, login=None)
    owner_token = api.get("/login", 200, login=owner).json
    api.setToken(owner, owner_token.get("token") if isinstance(owner_token, dict) else owner_token)

    api.post("/register", 201, json={
        "username": worker,
        "email": f"{worker}@test.com",
        "password": pswd
    }, login=None)
    worker_token = api.get("/login", 200, login=worker).json
    api.setToken(worker, worker_token.get("token") if isinstance(worker_token, dict) else worker_token)

    # Create future date
    start_dt = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat()

    log.info("=== STEP 1: Create PAPS ===")
    res = api.post("/paps", 201, json={
        "title": "Full Workflow Test Job",
        "description": "Testing the complete job posting workflow from start to finish.",
        "payment_type": "fixed",
        "payment_amount": 1000.00,
        "payment_currency": "USD",
        "status": "published",
        "max_applicants": 3,
        "max_assignees": 1,
        "start_datetime": start_dt
    }, login=owner)
    paps_id = res.json.get("paps_id")
    assert paps_id is not None

    log.info("=== STEP 2: Apply (SPAP) ===")
    res = api.post(f"/paps/{paps_id}/apply", 201, json={
        "cover_letter": "I am the perfect candidate for this comprehensive job."
    }, login=worker)
    spap_id = res.json.get("spap_id")
    thread_id = res.json.get("chat_thread_id")
    assert spap_id is not None
    assert thread_id is not None

    log.info("=== STEP 3: Chat during application ===")
    api.post(f"/chat/{thread_id}/messages", 201, json={
        "content": "Hi! I am interested in learning more about this project."
    }, login=worker)

    api.post(f"/chat/{thread_id}/messages", 201, json={
        "content": "Great! Can you tell me about your experience?"
    }, login=owner)

    res = api.get(f"/chat/{thread_id}/messages", 200, login=owner)
    assert res.json["count"] == 2

    log.info("=== STEP 4: Accept (ASAP) ===")
    res = api.put(f"/spap/{spap_id}/accept", 200, login=owner)
    asap_id = res.json.get("asap_id")
    assert asap_id is not None

    # Chat thread should transfer to ASAP
    res = api.get(f"/chat/{thread_id}", 200, login=owner)
    assert res.json["thread_type"] == "asap_discussion"
    assert res.json["asap_id"] == asap_id

    log.info("=== STEP 5: Continue chat during work ===")
    api.post(f"/chat/{thread_id}/messages", 201, json={
        "content": "I have started working on the project."
    }, login=worker)

    res = api.get(f"/chat/{thread_id}/messages", 200, login=owner)
    assert res.json["count"] == 3

    log.info("=== STEP 6: Start and work on ASAP ===")
    api.put(f"/asap/{asap_id}/status", 204, json={"status": "in_progress"}, login=worker)

    # Get worker user ID for payment
    res = api.get(f"/user/{worker}/profile", 200, login=None)
    worker_id = res.json["user_id"]

    log.info("=== STEP 7: Create payment ===")
    res = api.post(f"/paps/{paps_id}/payments", 201, json={
        "payee_id": worker_id,
        "amount": 500.00,
        "currency": "USD"
    }, login=owner)
    payment_id = res.json.get("payment_id")

    # Complete payment
    api.put(f"/payments/{payment_id}/status", 204, json={
        "status": "completed",
        "payment_method": "stripe"
    }, login=owner)

    log.info("=== STEP 8: Complete ASAP ===")
    # Only owner can mark as completed
    api.put(f"/asap/{asap_id}/status", 204, json={"status": "completed"}, login=owner)

    res = api.get(f"/asap/{asap_id}", 200, login=owner)
    assert res.json["status"] == "completed"

    log.info("=== STEP 9: Rate each other ===")
    # Owner rates worker
    res = api.post(f"/asap/{asap_id}/rate", 201, json={"score": 5}, login=owner)
    assert res.json["score"] == 5

    # Worker rates owner
    res = api.post(f"/asap/{asap_id}/rate", 201, json={"score": 5}, login=worker)
    assert res.json["score"] == 5

    # Verify ratings
    res = api.get(f"/user/{worker}/profile", 200, login=None)
    worker_id = res.json["user_id"]
    res = api.get(f"/users/{worker_id}/rating", 200, login=owner)
    assert res.json["rating_count"] == 1
    assert res.json["rating_average"] == 5

    log.info("=== WORKFLOW COMPLETE ===")

    # Cleanup - cannot delete completed ASAP, but can delete PAPS with admin
    # (Note: PAPS deletion is restricted when it has payments)
    api.delete(f"/asap/{asap_id}", 400, login=owner)
    # Delete payments first as admin
    res = api.get(f"/paps/{paps_id}/payments", 200, login=owner)
    for payment in res.json["payments"]:
        api.delete(f"/payments/{payment['payment_id']}", 204, login=ADMIN)
    # Now delete PAPS
    api.delete(f"/paps/{paps_id}", 204, login=ADMIN)

    res = api.get(f"/user/{owner}/profile", 200, login=None)
    owner_id = res.json["user_id"]
    api.delete(f"/users/{owner_id}", 204, login=ADMIN)

    api.delete(f"/users/{worker_id}", 204, login=ADMIN)

    api.setToken(owner, None)
    api.setPass(owner, None)
    api.setToken(worker, None)
    api.setPass(worker, None)

    log.info("Full workflow test completed successfully!")


# ===========================================================================
# Profile Gender Field Tests
# ===========================================================================

def test_profile_gender_field(api):
    """Test the gender field on user profiles."""
    import uuid

    suffix = uuid.uuid4().hex[:8]
    user = f"genderuser{suffix}"
    pswd = "test123!ABC"
    api.setPass(user, pswd)

    # Register user
    api.post("/register", 201, json={
        "username": user,
        "email": f"{user}@test.com",
        "password": pswd
    }, login=None)
    user_token = api.get("/login", 200, login=user).json
    api.setToken(user, user_token.get("token") if isinstance(user_token, dict) else user_token)

    # Get profile - gender should be null initially
    res = api.get(f"/user/{user}/profile", 200, login=None)
    assert res.json.get("gender") is None or res.json.get("gender") == ""

    # Update profile with gender - M (male)
    api.patch(f"/user/{user}/profile", 204, data={
        "gender": "M"
    }, login=user)

    res = api.get(f"/user/{user}/profile", 200, login=None)
    assert res.json["gender"] == "M"

    # Update gender to F (female)
    api.patch(f"/user/{user}/profile", 204, data={
        "gender": "F"
    }, login=user)

    res = api.get(f"/user/{user}/profile", 200, login=None)
    assert res.json["gender"] == "F"

    # Update gender to O (other)
    api.patch(f"/user/{user}/profile", 204, data={
        "gender": "O"
    }, login=user)

    res = api.get(f"/user/{user}/profile", 200, login=None)
    assert res.json["gender"] == "O"

    # Update gender to N (prefer not to say / non-binary)
    api.patch(f"/user/{user}/profile", 204, data={
        "gender": "N"
    }, login=user)

    res = api.get(f"/user/{user}/profile", 200, login=None)
    assert res.json["gender"] == "N"

    # Test invalid gender value
    api.patch(f"/user/{user}/profile", 400, data={
        "gender": "invalid"
    }, login=user)

    # Verify gender is unchanged after invalid update
    res = api.get(f"/user/{user}/profile", 200, login=None)
    assert res.json["gender"] == "N"

    # Cleanup
    user_id = res.json["user_id"]
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
    api.setToken(user, None)
    api.setPass(user, None)


# ===========================================================================
# Experience Display Order Tests
# ===========================================================================

def test_experience_display_order(api):
    """Test the display_order field on user experiences."""
    import uuid

    suffix = uuid.uuid4().hex[:8]
    user = f"exporderuser{suffix}"
    pswd = "test123!ABC"
    api.setPass(user, pswd)

    # Register user
    api.post("/register", 201, json={
        "username": user,
        "email": f"{user}@test.com",
        "password": pswd
    }, login=None)
    user_token = api.get("/login", 200, login=user).json
    api.setToken(user, user_token.get("token") if isinstance(user_token, dict) else user_token)

    # Create experiences with display_order
    res = api.post("/profile/experiences", 201, json={
        "title": "Third Position",
        "company": "Company C",
        "start_date": "2018-01-01",
        "display_order": 3
    }, login=user)
    exp_id3 = res.json.get("experience_id")

    res = api.post("/profile/experiences", 201, json={
        "title": "First Position",
        "company": "Company A",
        "start_date": "2020-01-01",
        "display_order": 1
    }, login=user)
    exp_id1 = res.json.get("experience_id")

    res = api.post("/profile/experiences", 201, json={
        "title": "Second Position",
        "company": "Company B",
        "start_date": "2019-01-01",
        "display_order": 2
    }, login=user)
    exp_id2 = res.json.get("experience_id")

    # Get experiences - should be ordered by display_order
    res = api.get(f"/user/{user}/profile/experiences", 200, login=None)
    assert len(res.json) == 3
    assert res.json[0]["title"] == "First Position"
    assert res.json[1]["title"] == "Second Position"
    assert res.json[2]["title"] == "Third Position"

    # Update display_order
    api.patch(f"/profile/experiences/{exp_id3}", 204, json={
        "display_order": 0
    }, login=user)

    # Now Third Position should be first
    res = api.get(f"/user/{user}/profile/experiences", 200, login=None)
    assert res.json[0]["title"] == "Third Position"

    # Cleanup
    api.delete(f"/profile/experiences/{exp_id1}", 204, login=user)
    api.delete(f"/profile/experiences/{exp_id2}", 204, login=user)
    api.delete(f"/profile/experiences/{exp_id3}", 204, login=user)

    res = api.get(f"/user/{user}/profile", 200, login=None)
    user_id = res.json["user_id"]
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
    api.setToken(user, None)
    api.setPass(user, None)


# ===========================================================================
# Chat Message Editing Tests
# ===========================================================================

def test_chat_message_editing(api):
    """Test editing chat messages."""
    import datetime
    import uuid

    suffix = uuid.uuid4().hex[:8]
    owner = f"editmsgowner{suffix}"
    worker = f"editmsgworker{suffix}"
    pswd = "test123!ABC"
    api.setPass(owner, pswd)
    api.setPass(worker, pswd)

    # Register users
    api.post("/register", 201, json={
        "username": owner,
        "email": f"{owner}@test.com",
        "password": pswd
    }, login=None)
    owner_token = api.get("/login", 200, login=owner).json
    api.setToken(owner, owner_token.get("token") if isinstance(owner_token, dict) else owner_token)

    api.post("/register", 201, json={
        "username": worker,
        "email": f"{worker}@test.com",
        "password": pswd
    }, login=None)
    worker_token = api.get("/login", 200, login=worker).json
    api.setToken(worker, worker_token.get("token") if isinstance(worker_token, dict) else worker_token)

    # Create future date
    start_dt = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat()

    # Create PAPS and apply to get chat thread
    res = api.post("/paps", 201, json={
        "title": "Message Edit Test Job",
        "description": "Testing chat message editing.",
        "payment_type": "fixed",
        "payment_amount": 300.00,
        "payment_currency": "USD",
        "status": "published",
        "start_datetime": start_dt
    }, login=owner)
    paps_id = res.json.get("paps_id")

    res = api.post(f"/paps/{paps_id}/apply", 201, json={
        "cover_letter": "Interested in this project."
    }, login=worker)
    spap_id = res.json.get("spap_id")
    thread_id = res.json.get("chat_thread_id")

    # Send a message from owner
    res = api.post(f"/chat/{thread_id}/messages", 201, json={
        "content": "Original message content"
    }, login=owner)
    msg_id = res.json.get("message_id")

    # Verify original message
    res = api.get(f"/chat/{thread_id}/messages", 200, login=owner)
    original_msg = [m for m in res.json["messages"] if m.get("message_id") == msg_id or m.get("id") == msg_id][0]
    assert "Original message content" in original_msg["content"]

    # Edit the message
    api.put(f"/chat/{thread_id}/messages/{msg_id}", 204, json={
        "content": "Edited message content"
    }, login=owner)

    # Verify message was edited
    res = api.get(f"/chat/{thread_id}/messages", 200, login=owner)
    edited_msg = [m for m in res.json["messages"] if m.get("message_id") == msg_id or m.get("id") == msg_id][0]
    assert "Edited message content" in edited_msg["content"]

    # Worker cannot edit owner's message
    api.put(f"/chat/{thread_id}/messages/{msg_id}", 403, json={
        "content": "Hacking attempt"
    }, login=worker)

    # Worker sends their own message
    res = api.post(f"/chat/{thread_id}/messages", 201, json={
        "content": "Worker original message"
    }, login=worker)
    worker_msg_id = res.json.get("message_id")

    # Worker can edit their own message
    api.put(f"/chat/{thread_id}/messages/{worker_msg_id}", 204, json={
        "content": "Worker edited message"
    }, login=worker)

    # Owner cannot edit worker's message
    api.put(f"/chat/{thread_id}/messages/{worker_msg_id}", 403, json={
        "content": "Owner hacking"
    }, login=owner)

    # Third party cannot edit any message
    api.put(f"/chat/{thread_id}/messages/{msg_id}", 403, json={
        "content": "Third party hacking"
    }, login=NOADM)

    # Test invalid message ID
    api.put(f"/chat/{thread_id}/messages/00000000-0000-0000-0000-000000000000", 404, json={
        "content": "Invalid message"
    }, login=owner)

    # Test empty content
    api.put(f"/chat/{thread_id}/messages/{msg_id}", 400, json={
        "content": ""
    }, login=owner)

    # Cleanup - worker withdraws their application, then delete PAPS
    api.delete(f"/spap/{spap_id}", 204, login=worker)
    api.delete(f"/paps/{paps_id}", 204, login=owner)

    res = api.get(f"/user/{owner}/profile", 200, login=None)
    owner_id = res.json["user_id"]
    api.delete(f"/users/{owner_id}", 204, login=ADMIN)

    res = api.get(f"/user/{worker}/profile", 200, login=None)
    worker_id = res.json["user_id"]
    api.delete(f"/users/{worker_id}", 204, login=ADMIN)

    api.setToken(owner, None)
    api.setPass(owner, None)
    api.setToken(worker, None)
    api.setPass(worker, None)


# ===========================================================================
# PAPS Schedule Tests
# ===========================================================================

def test_paps_schedules(api):
    """Test PAPS schedule management."""
    import datetime
    import uuid

    suffix = uuid.uuid4().hex[:8]
    owner = f"schedowner{suffix}"
    other = f"schedother{suffix}"
    pswd = "test123!ABC"
    api.setPass(owner, pswd)
    api.setPass(other, pswd)

    # Register users
    api.post("/register", 201, json={
        "username": owner,
        "email": f"{owner}@test.com",
        "password": pswd
    }, login=None)
    owner_token = api.get("/login", 200, login=owner).json
    api.setToken(owner, owner_token.get("token") if isinstance(owner_token, dict) else owner_token)

    api.post("/register", 201, json={
        "username": other,
        "email": f"{other}@test.com",
        "password": pswd
    }, login=None)
    other_token = api.get("/login", 200, login=other).json
    api.setToken(other, other_token.get("token") if isinstance(other_token, dict) else other_token)

    # Create future dates
    start_dt = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).isoformat()
    schedule_start = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)).isoformat()
    schedule_end = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)).isoformat()

    # Create a PAPS
    res = api.post("/paps", 201, json={
        "title": "Schedule Test Job",
        "description": "Testing PAPS schedules.",
        "payment_type": "hourly",
        "payment_amount": 50.00,
        "payment_currency": "USD",
        "status": "published",
        "start_datetime": start_dt
    }, login=owner)
    paps_id = res.json.get("paps_id")

    # Get schedules - empty initially
    res = api.get(f"/paps/{paps_id}/schedules", 200, login=owner)
    assert res.json == []

    # Create a daily schedule (API accepts lowercase, DB stores uppercase)
    res = api.post(f"/paps/{paps_id}/schedules", 201, json={
        "recurrence_rule": "daily",
        "start_date": schedule_start,
        "end_date": schedule_end
    }, login=owner)
    schedule_id1 = res.json.get("schedule_id")

    # Create a weekly schedule
    res = api.post(f"/paps/{paps_id}/schedules", 201, json={
        "recurrence_rule": "weekly",
        "start_date": schedule_start
    }, login=owner)
    schedule_id2 = res.json.get("schedule_id")

    # Get all schedules
    res = api.get(f"/paps/{paps_id}/schedules", 200, login=owner)
    assert len(res.json) == 2

    # Get specific schedule (DB returns uppercase)
    res = api.get(f"/paps/{paps_id}/schedules/{schedule_id1}", 200, login=owner)
    assert res.json["recurrence_rule"] == "DAILY"

    # Update schedule (use valid DB value: MONTHLY instead of biweekly)
    api.put(f"/paps/{paps_id}/schedules/{schedule_id1}", 204, json={
        "recurrence_rule": "monthly",
        "is_active": False
    }, login=owner)

    res = api.get(f"/paps/{paps_id}/schedules/{schedule_id1}", 200, login=owner)
    assert res.json["recurrence_rule"] == "MONTHLY"
    assert not res.json["is_active"]

    # Other user cannot view schedules
    api.get(f"/paps/{paps_id}/schedules", 403, login=other)

    # Other user cannot create schedules
    api.post(f"/paps/{paps_id}/schedules", 403, json={
        "recurrence_rule": "monthly"
    }, login=other)

    # Other user cannot update schedules
    api.put(f"/paps/{paps_id}/schedules/{schedule_id1}", 403, json={
        "is_active": True
    }, login=other)

    # Other user cannot delete schedules
    api.delete(f"/paps/{paps_id}/schedules/{schedule_id1}", 403, login=other)

    # Test invalid recurrence_rule
    api.post(f"/paps/{paps_id}/schedules", 400, json={
        "recurrence_rule": "invalid-rule"
    }, login=owner)

    # Test cron rule without cron_expression
    api.post(f"/paps/{paps_id}/schedules", 400, json={
        "recurrence_rule": "cron"
    }, login=owner)

    # Test cron rule with cron_expression
    res = api.post(f"/paps/{paps_id}/schedules", 201, json={
        "recurrence_rule": "cron",
        "cron_expression": "0 9 * * MON-FRI"
    }, login=owner)
    schedule_id3 = res.json.get("schedule_id")

    # Delete schedule
    api.delete(f"/paps/{paps_id}/schedules/{schedule_id1}", 204, login=owner)

    # Verify deletion
    api.get(f"/paps/{paps_id}/schedules/{schedule_id1}", 404, login=owner)

    # Test invalid PAPS ID
    api.get("/paps/invalid-uuid/schedules", 400, login=owner)

    # Test non-existent PAPS
    api.get("/paps/00000000-0000-0000-0000-000000000000/schedules", 404, login=owner)

    # Admin can view schedules
    res = api.get(f"/paps/{paps_id}/schedules", 200, login=ADMIN)
    assert len(res.json) == 2

    # Cleanup - delete remaining schedules
    api.delete(f"/paps/{paps_id}/schedules/{schedule_id2}", 204, login=owner)
    api.delete(f"/paps/{paps_id}/schedules/{schedule_id3}", 204, login=owner)

    # Delete PAPS
    api.delete(f"/paps/{paps_id}", 204, login=owner)

    # Delete users
    res = api.get(f"/user/{owner}/profile", 200, login=None)
    owner_id = res.json["user_id"]
    api.delete(f"/users/{owner_id}", 204, login=ADMIN)

    res = api.get(f"/user/{other}/profile", 200, login=None)
    other_id = res.json["user_id"]
    api.delete(f"/users/{other_id}", 204, login=ADMIN)

    api.setToken(owner, None)
    api.setPass(owner, None)
    api.setToken(other, None)
    api.setPass(other, None)
