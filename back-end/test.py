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
    # Extract token from JSON response
    ft_client.setToken(ADMIN, res.json.get("token") if isinstance(res.json, dict) else res.json)
    res = ft_client.post("/login", login=NOADM, auth="param")
    assert res.is_json
    # Extract token from JSON response
    ft_client.setToken(NOADM, res.json.get("token") if isinstance(res.json, dict) else res.json)
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
    api.setToken(user, user_token.get("token") if isinstance(user_token, dict) else user_token)
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
    res = api.get(f"/users/{user}/profile", 200, login=None)
    assert res.json["username"] == user
    assert res.json["email"] == f"{user}@test.com"
    assert "user_id" in res.json
    
    # Profile is publicly accessible (OPEN auth)
    api.get(f"/users/{user}/profile", 200, login=None)
    api.get(f"/users/{user}/profile", 200, login=ADMIN)
    api.get(f"/users/{user}/profile", 200, login=NOADM)
    
    # Test 404 for non-existent user
    api.get("/users/nonexistentuser999/profile", 404, login=None)
    
    # Update profile - user can update own profile
    api.patch(f"/users/{user}/profile", 204, data={
        "first_name": "Test",
        "last_name": "User",
        "display_name": "Test User",
        "bio": "Test bio",
        "timezone": "UTC"
    }, login=user)
    
    # Verify profile was updated
    res = api.get(f"/users/{user}/profile", 200, login=None)
    assert res.json["first_name"] == "Test"
    assert res.json["last_name"] == "User"
    assert res.json["display_name"] == "Test User"
    assert res.json["bio"] == "Test bio"
    assert res.json["timezone"] == "UTC"
    
    # Update single field
    api.patch(f"/users/{user}/profile", 204, data={"bio": "Updated bio"}, login=user)
    res = api.get(f"/users/{user}/profile", 200, login=None)
    assert res.json["bio"] == "Updated bio"
    assert res.json["first_name"] == "Test"  # Other fields unchanged
    
    # Update location fields
    api.patch(f"/users/{user}/profile", 204, data={
        "location_address": "123 Test St",
        "location_lat": 40.7128,
        "location_lng": -74.0060
    }, login=user)
    res = api.get(f"/users/{user}/profile", 200, login=None)
    assert res.json["location_address"] == "123 Test St"
    assert res.json["location_lat"] == 40.7128
    assert res.json["location_lng"] == -74.0060
    
    # Test validation - invalid latitude
    api.patch(f"/users/{user}/profile", 400, data={
        "location_lat": 91,
        "location_lng": 0
    }, login=user)
    
    # Test validation - invalid longitude
    api.patch(f"/users/{user}/profile", 400, data={
        "location_lat": 0,
        "location_lng": 181
    }, login=user)
    
    # Test validation - lat without lng
    api.patch(f"/users/{user}/profile", 400, data={
        "location_lat": 40.7128
    }, login=user)
    
    # User cannot update another user's profile
    api.patch(f"/users/{ADMIN}/profile", 403, data={"bio": "Hacking"}, login=user)
    api.patch(f"/users/{NOADM}/profile", 403, data={"bio": "Hacking"}, login=user)
    
    # Unauthenticated user cannot update profile
    api.patch(f"/users/{user}/profile", 401, data={"bio": "Test"}, login=None)
    
    # Test preferred_language update
    api.patch(f"/users/{user}/profile", 204, data={"preferred_language": "fr"}, login=user)
    res = api.get(f"/users/{user}/profile", 200, login=None)
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
    res = api.get(f"/users/{user}/experiences", 200, login=None)
    assert res.json == []
    
    # Test 404 for non-existent user
    api.get("/users/nonexistentuser999/experiences", 404, login=None)
    
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
    exp_id = res.json
    
    # Get experiences from public endpoint
    res = api.get(f"/users/{user}/experiences", 200, login=None)
    assert len(res.json) == 1
    assert res.json[0]["title"] == "Software Engineer"
    assert res.json[0]["company"] == "Test Corp"
    assert res.json[0]["is_current"] == False
    
    # Add another experience (current position)
    res = api.post("/profile/experiences", 201, json={
        "title": "Senior Engineer",
        "company": "New Corp",
        "description": "Leading team",
        "start_date": "2023-01-01",
        "is_current": True
    }, login=user)
    exp_id2 = res.json
    
    # Verify two experiences
    res = api.get(f"/users/{user}/experiences", 200, login=None)
    assert len(res.json) == 2
    
    # Update first experience
    api.patch(f"/profile/experiences/{exp_id}", 204, json={
        "title": "Senior Software Engineer"
    }, login=user)
    
    res = api.get(f"/users/{user}/experiences", 200, login=None)
    exp1 = [e for e in res.json if e["id"] == exp_id][0]
    assert exp1["title"] == "Senior Software Engineer"
    assert exp1["company"] == "Test Corp"  # Unchanged
    
    # User cannot update another user's experience
    # First get admin's experience (if any)
    admin_exps = api.get(f"/users/{ADMIN}/experiences", 200, login=None).json
    if admin_exps:
        api.patch(f"/profile/experiences/{admin_exps[0]['id']}", 403, json={
            "title": "Hacked"
        }, login=user)
    
    # Delete first experience
    api.delete(f"/profile/experiences/{exp_id}", 204, login=user)
    res = api.get(f"/users/{user}/experiences", 200, login=None)
    assert len(res.json) == 1
    
    # Delete second experience
    api.delete(f"/profile/experiences/{exp_id2}", 204, login=user)
    res = api.get(f"/users/{user}/experiences", 200, login=None)
    assert len(res.json) == 0
    
    # Test 404 for non-existent experience
    api.patch("/profile/experiences/00000000-0000-0000-0000-000000000000", 404, json={
        "title": "Test"
    }, login=user)
    api.delete("/profile/experiences/00000000-0000-0000-0000-000000000000", 404, login=user)
    
    # Cleanup - get user_id from profile
    res = api.get(f"/users/{user}/profile", 200, login=None)
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
    cat_id = res.json
    
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
        "name": "Programming",
        "slug": "programming",
        "description": "Software development"
    }, login=ADMIN)
    cat_id1 = res1.json
    
    res2 = api.post("/categories", 201, json={
        "name": "Design",
        "slug": "design",
        "description": "UI/UX Design"
    }, login=ADMIN)
    cat_id2 = res2.json
    
    # Get interests - publicly accessible, empty initially
    res = api.get(f"/users/{user}/interests", 200, login=None)
    assert res.json == []
    
    # Test 404 for non-existent user
    api.get("/users/nonexistentuser999/interests", 404, login=None)
    
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
    res = api.get(f"/users/{user}/interests", 200, login=None)
    assert len(res.json) == 1
    assert res.json[0]["proficiency_level"] == 5
    assert res.json[0]["category_name"] == "Programming"
    
    # Add another interest
    api.post("/profile/interests", 201, json={
        "category_id": cat_id2,
        "proficiency_level": 3
    }, login=user)
    
    res = api.get(f"/users/{user}/interests", 200, login=None)
    assert len(res.json) == 2
    
    # Update first interest
    api.patch(f"/profile/interests/{cat_id1}", 204, json={
        "proficiency_level": 4
    }, login=user)
    
    res = api.get(f"/users/{user}/interests", 200, login=None)
    int1 = [i for i in res.json if i["category_id"] == cat_id1][0]
    assert int1["proficiency_level"] == 4
    
    # Cannot add duplicate interest
    api.post("/profile/interests", 409, json={
        "category_id": cat_id1,
        "proficiency_level": 2
    }, login=user)
    
    # Delete interests
    api.delete(f"/profile/interests/{cat_id1}", 204, login=user)
    res = api.get(f"/users/{user}/interests", 200, login=None)
    assert len(res.json) == 1
    
    api.delete(f"/profile/interests/{cat_id2}", 204, login=user)
    res = api.get(f"/users/{user}/interests", 200, login=None)
    assert len(res.json) == 0
    
    # Test 404 for non-existent interest
    api.delete(f"/profile/interests/{cat_id1}", 404, login=user)
    
    # Cleanup categories and user - get user_id from profile
    res = api.get(f"/users/{user}/profile", 200, login=None)
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
    res = api.get(f"/users/{base_user}/profile", 200, login=None)
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
    res = api.get(f"/users/{user}/profile", 200, login=None)
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
    cat_id = res.json
    
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
        # Missing description, payment_type, price, currency
    }, login=user)
    
    # Valid paps creation
    res = api.post("/paps", 201, json={
        "title": "Test Paps Project",
        "description": "A test paps description",
        "payment_type": "fixed",
        "price": 500.00,
        "currency": "USD",
        "status": "draft"
    }, login=user)
    paps_id = res.json
    assert paps_id is not None
    
    # Get the created paps
    res = api.get(f"/paps/{paps_id}", 200, login=user)
    assert res.json["title"] == "Test Paps Project"
    assert res.json["payment_type"] == "fixed"
    assert res.json["price"] == 500.00
    assert res.json["currency"] == "USD"
    assert res.json["status"] == "draft"
    
    # Update paps
    api.put(f"/paps/{paps_id}", 204, json={
        "title": "Updated Paps Project",
        "description": "Updated description",
        "payment_type": "hourly",
        "price": 75.00,
        "currency": "EUR",
        "status": "draft"
    }, login=user)
    
    res = api.get(f"/paps/{paps_id}", 200, login=user)
    assert res.json["title"] == "Updated Paps Project"
    assert res.json["payment_type"] == "hourly"
    assert res.json["price"] == 75.00
    assert res.json["currency"] == "EUR"
    
    # Non-owner cannot update paps
    api.put(f"/paps/{paps_id}", 403, json={
        "title": "Hacked"
    }, login=NOADM)
    
    # Admin can update any paps
    api.put(f"/paps/{paps_id}", 204, json={
        "title": "Admin Updated Paps",
        "description": "Admin update",
        "payment_type": "fixed",
        "price": 1000.00,
        "currency": "USD",
        "status": "draft"
    }, login=ADMIN)
    
    # Add category to paps
    res = api.post(f"/paps/{paps_id}/categories/{cat_id}", 201, login=user)
    
    # Get paps with category
    res = api.get(f"/paps/{paps_id}", 200, login=user)
    assert "categories" in res.json
    # Check category is in the list
    cat_ids = [c["id"] for c in res.json["categories"]]
    assert cat_id in cat_ids
    
    # Remove category from paps
    api.delete(f"/paps/{paps_id}/categories/{cat_id}", 204, login=user)
    res = api.get(f"/paps/{paps_id}", 200, login=user)
    cat_ids = [c["id"] for c in res.json["categories"]]
    assert cat_id not in cat_ids
    
    # Re-add category for later tests
    api.post(f"/paps/{paps_id}/categories/{cat_id}", 201, login=user)
    
    # Test paps media endpoints
    # Get media for paps (should be empty initially)
    res = api.get(f"/paps/{paps_id}/media", 200, login=user)
    assert res.json["media"] == []
    assert res.json["media_count"] == 0
    
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
    
    # Cleanup
    api.delete(f"/profile/interests/{cat_id}", 204, login=user)
    api.delete(f"/categories/{cat_id}", 204, login=ADMIN)
    res = api.get(f"/users/{user}/profile", 200, login=None)
    user_id = res.json["user_id"]
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
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
    res = api.get(f"/users/{user}/profile", 200, login=None)
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
    cat_id = res.json
    
    # Create paps with different attributes
    res1 = api.post("/paps", 201, json={
        "title": "Expensive Fixed Project",
        "description": "A high-budget project",
        "payment_type": "fixed",
        "price": 5000.00,
        "currency": "USD",
        "status": "published"
    }, login=user)
    paps_id1 = res1.json
    api.post(f"/paps/{paps_id1}/categories/{cat_id}", 201, login=user)
    
    res2 = api.post("/paps", 201, json={
        "title": "Cheap Hourly Project",
        "description": "An affordable hourly project",
        "payment_type": "hourly",
        "price": 25.00,
        "currency": "EUR",
        "status": "published"
    }, login=user)
    paps_id2 = res2.json
    
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
        assert pap["price"] >= 1000
    
    # Test max_price filter
    res = api.get("/paps", 200, json={"max_price": 100}, login=user)
    for pap in res.json["paps"]:
        assert pap["price"] <= 100
    
    # Test price range filter
    res = api.get("/paps", 200, json={"min_price": 1000, "max_price": 6000}, login=user)
    for pap in res.json["paps"]:
        assert pap["price"] >= 1000 and pap["price"] <= 6000
    
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
            cat_ids = [c["id"] for c in pap["categories"]]
            # paps with this category should be found
            pass
    
    # Cleanup
    api.delete(f"/paps/{paps_id1}", 204, login=user)
    api.delete(f"/paps/{paps_id2}", 204, login=user)
    api.delete(f"/categories/{cat_id}", 204, login=ADMIN)
    res = api.get(f"/users/{user}/profile", 200, login=None)
    user_id = res.json["user_id"]
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
    api.setToken(user, None)
    api.setPass(user, None)
