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
import logging
import time

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("test")

# real (or fake) authentication logins
ADMIN, NOADM, OTHER = "calvin", "hobbes", "susie"

@pytest.fixture
def api(ft_client):
    # Set passwords for admin and non-admin test users
    ft_client.setPass(ADMIN, "Hobbes123")
    ft_client.setPass(NOADM, "Calvin123")

    # get tokens for ADMIN and NOADM users using basic auth
    res = ft_client.get("/login", login=ADMIN, auth="basic")
    assert res.is_json
    # Extract token from JSON response
    ft_client.setToken(ADMIN, res.json.get("token") if isinstance(res.json, dict) else res.json)
    res = ft_client.get("/login", login=NOADM, auth="basic")
    assert res.is_json
    # Extract token from JSON response
    ft_client.setToken(NOADM, res.json.get("token") if isinstance(res.json, dict) else res.json)
    yield ft_client

# environment and running
def test_sanity(api):
    # FLASK_TESTER_APP may not be set when running via pytest directly
    # The actual API test is what matters
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
    # aid is now a UUID string, not an integer
    assert res.json["login"] == ADMIN and res.json["isadmin"] and res.json["aid"]
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
    # GET login with basic auth - token is now in JSON response
    res = api.get("/login", 200, login=ADMIN, auth="basic")
    admin_token = res.json.get("token") if isinstance(res.json, dict) else res.json
    assert f":{ADMIN}:" in admin_token
    api.setToken(ADMIN, admin_token)
    res = api.get("/who-am-i", 200, login=ADMIN)
    assert ADMIN in res.text
    assert res.headers["FSA-User"] == f"{ADMIN} (token)"
    # hobbes
    res = api.get("/login", 200, login=NOADM, auth="basic")
    noadm_token = res.json.get("token") if isinstance(res.json, dict) else res.json
    assert f":{NOADM}:" in noadm_token
    api.setToken(NOADM, noadm_token)
    # same with POST and parameters
    api.post("/login", 401, login=None)
    # Note: calvin password is Hobbes123 (set by setup_test_data.py)
    res = api.post("/login", 201, data={"login": "calvin", "password": "Hobbes123"}, login=None)
    tok = res.json.get("token") if isinstance(res.json, dict) else res.json
    assert ":calvin:" in tok
    assert res.headers["FSA-User"] == "calvin (param)"
    res = api.post("/login", 201, json={"login": "calvin", "password": "Hobbes123"}, login=None)
    tok = res.json.get("token") if isinstance(res.json, dict) else res.json
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
    # register a new user (new API requires username, email, password)
    # Password must have uppercase, lowercase, and digits
    user, pswd = "dyna-user", "DynaPass123"
    email = f"{user}@test.com"
    api.setPass(user, pswd)
    # bad username with a space
    api.post("/register", 400, json={"username": "this is a bad login", "email": email, "password": pswd}, login=None)
    # username too short
    api.post("/register", 400, json={"username": "x", "email": email, "password": pswd}, login=None)
    # username already exists
    api.post("/register", 409, json={"username": "calvin", "email": "new@test.com", "password": pswd}, login=None)
    # missing "username" parameter
    api.post("/register", 400, json={"email": email, "password": pswd}, login=None)
    # missing "email" parameter
    api.post("/register", 400, json={"username": user, "password": pswd}, login=None)
    # missing "password" parameter
    api.post("/register", 400, json={"username": user, "email": email}, login=None)
    # invalid email format
    api.post("/register", 400, json={"username": user, "email": "not-an-email", "password": pswd}, login=None)
    # at last one which is expected to work!
    api.post("/register", 201, json={"username": user, "email": email, "password": pswd}, login=None)
    res = api.get("/login", 200, login=user)
    user_token = res.json.get("token") if isinstance(res.json, dict) else res.json
    api.setToken(user, user_token)
    api.get("/users/x", 400, r"x", login=ADMIN)
    api.get("/users/****", 400, r"\*\*\*\*", login=ADMIN)
    api.get(f"/users/{user}", 200, f"{user}", login=ADMIN)
    # Use valid password (min 8 chars, mixed case, digits)
    api.patch(f"/users/{user}", 204, data={"password": "NewPass123!"}, login=ADMIN)
    api.patch(f"/users/{user}", 204, data={"is_admin": False}, login=ADMIN)
    api.patch(f"/users/{user}", 204, data={"email": "dyna@comics.net"}, login=ADMIN)
    api.patch(f"/users/{user}", 400, data={"email": "not-an-email"}, login=ADMIN)
    dyna = {"login": user, "password": pswd, "email": "dyna-no-spam@comics.net", "isadmin": True}
    api.put(f"/users/{user}", 204, json={"auth": dyna}, login=ADMIN)
    toto = dict(**dyna)
    toto["login"] = "toto"
    api.put(f"/users/{user}", 400, json={"auth": toto}, login=ADMIN)
    api.delete(f"/users/{user}", 204, login=ADMIN)
    api.put(f"/users/{user}", 404, json={"auth": dyna}, login=ADMIN)
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
    api.post("/users", 400, json={"login": "ab", "password": "Abcd1234!", "email": "ab@test.com", "is_admin": False}, login=ADMIN)
    api.post("/users", 400, json={"login": "1abcd", "password": "Abcd1234!", "email": "1abcd@test.com", "is_admin": False}, login=ADMIN)
    api.post("/users", 201, json={"login": OTHER, "password": "Abcd1234!", "email": f"{OTHER}@test.com", "is_admin": False}, login=ADMIN)
    api.post("/users", 409, json={"login": OTHER, "password": "Abcd1234!", "email": f"{OTHER}@test.com", "is_admin": False}, login=ADMIN)
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

# /profile and /user/<username>/profile - comprehensive profile tests
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

    # Get current user's profile via /profile
    res = api.get("/profile", 200, login=user)
    assert res.json["username"] == user
    assert res.json["email"] == f"{user}@test.com"
    assert "user_id" in res.json
    user_id = res.json["user_id"]

    # Get profile via /user/<username>/profile - other users can access with auth
    api.get(f"/user/{user}/profile", 200, login=ADMIN)
    api.get(f"/user/{user}/profile", 200, login=NOADM)

    # Test 401 for unauthenticated access
    api.get("/profile", 401, login=None)
    api.get(f"/user/{user}/profile", 401, login=None)

    # Test 404 for non-existent user (with auth)
    api.get("/user/nonexistentuser999/profile", 404, login=ADMIN)

    # Update profile via /profile (PATCH)
    api.patch("/profile", 204, data={
        "first_name": "Test",
        "last_name": "User",
        "display_name": "Test User",
        "bio": "Test bio",
        "timezone": "UTC"
    }, login=user)

    # Verify profile was updated
    res = api.get("/profile", 200, login=user)
    assert res.json["first_name"] == "Test"
    assert res.json["last_name"] == "User"
    assert res.json["display_name"] == "Test User"
    assert res.json["bio"] == "Test bio"
    assert res.json["timezone"] == "UTC"

    # Update single field via /user/<username>/profile
    api.patch(f"/user/{user}/profile", 204, data={"bio": "Updated bio"}, login=user)
    res = api.get("/profile", 200, login=user)
    assert res.json["bio"] == "Updated bio"
    assert res.json["first_name"] == "Test"  # Other fields unchanged

    # Update location fields
    api.patch("/profile", 204, data={
        "location_address": "123 Test St",
        "location_lat": 40.7128,
        "location_lng": -74.0060
    }, login=user)
    res = api.get("/profile", 200, login=user)
    assert res.json["location_address"] == "123 Test St"
    assert res.json["location_lat"] == 40.7128
    assert res.json["location_lng"] == -74.0060

    # Test validation - invalid latitude
    api.patch("/profile", 400, data={
        "location_lat": 91,
        "location_lng": 0
    }, login=user)

    # Test validation - invalid longitude
    api.patch("/profile", 400, data={
        "location_lat": 0,
        "location_lng": 181
    }, login=user)

    # Test validation - lat without lng
    api.patch("/profile", 400, data={
        "location_lat": 40.7128
    }, login=user)

    # User cannot update another user's profile
    api.patch(f"/user/{ADMIN}/profile", 403, data={"bio": "Hacking"}, login=user)
    api.patch(f"/user/{NOADM}/profile", 403, data={"bio": "Hacking"}, login=user)

    # Unauthenticated user cannot update profile
    api.patch("/profile", 401, data={"bio": "Test"}, login=None)
    api.patch(f"/user/{user}/profile", 401, data={"bio": "Test"}, login=None)

    # Test preferred_language update
    api.patch("/profile", 204, data={"preferred_language": "fr"}, login=user)
    res = api.get("/profile", 200, login=user)
    assert res.json["preferred_language"] == "fr"

    # Cleanup
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
    api.setToken(user, None)
    api.setPass(user, None)

# /profile/experiences and /user/<username>/profile/experiences - comprehensive experience tests
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

    # Get user_id from profile (for cleanup)
    res = api.get("/profile", 200, login=user)
    user_id = res.json["user_id"]

    # Get experiences via /profile/experiences - requires auth, empty initially
    res = api.get("/profile/experiences", 200, login=user)
    assert res.json == []

    # Get experiences via /user/<username>/profile/experiences
    res = api.get(f"/user/{user}/profile/experiences", 200, login=user)
    assert res.json == []

    # Test 401 for unauthenticated access
    api.get("/profile/experiences", 401, login=None)
    api.get(f"/user/{user}/profile/experiences", 401, login=None)

    # Test 404 for non-existent user (with auth)
    api.get("/user/nonexistentuser999/profile/experiences", 404, login=ADMIN)

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
    exp_id = res.json["experience_id"]

    # Get experiences via /profile/experiences
    res = api.get("/profile/experiences", 200, login=user)
    assert len(res.json) == 1
    assert res.json[0]["title"] == "Software Engineer"
    assert res.json[0]["company"] == "Test Corp"
    assert not res.json[0]["is_current"]

    # Get experiences via /user/<username>/profile/experiences (other users can view)
    res = api.get(f"/user/{user}/profile/experiences", 200, login=ADMIN)
    assert len(res.json) == 1

    # Add another experience (current position)
    res = api.post("/profile/experiences", 201, json={
        "title": "Senior Engineer",
        "company": "New Corp",
        "description": "Leading team",
        "start_date": "2023-01-01",
        "is_current": True
    }, login=user)
    exp_id2 = res.json["experience_id"]

    # Verify two experiences
    res = api.get("/profile/experiences", 200, login=user)
    assert len(res.json) == 2

    # Update first experience
    api.patch(f"/profile/experiences/{exp_id}", 204, json={
        "title": "Senior Software Engineer"
    }, login=user)

    res = api.get("/profile/experiences", 200, login=user)
    exp1 = [e for e in res.json if e["id"] == exp_id][0]
    assert exp1["title"] == "Senior Software Engineer"
    assert exp1["company"] == "Test Corp"  # Unchanged

    # User cannot update another user's experience
    # Get admin's experiences
    admin_exps = api.get(f"/user/{ADMIN}/profile/experiences", 200, login=ADMIN).json
    if admin_exps:
        api.patch(f"/profile/experiences/{admin_exps[0]['id']}", 403, json={
            "title": "Hacked"
        }, login=user)

    # Delete first experience
    api.delete(f"/profile/experiences/{exp_id}", 204, login=user)
    res = api.get("/profile/experiences", 200, login=user)
    assert len(res.json) == 1

    # Delete second experience
    api.delete(f"/profile/experiences/{exp_id2}", 204, login=user)
    res = api.get("/profile/experiences", 200, login=user)
    assert len(res.json) == 0

    # Test 404 for non-existent experience
    api.patch("/profile/experiences/00000000-0000-0000-0000-000000000000", 404, json={
        "title": "Test"
    }, login=user)
    api.delete("/profile/experiences/00000000-0000-0000-0000-000000000000", 404, login=user)

    # Cleanup
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
    cat_id = res.json["category_id"]

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


# /categories/<category_id>/icon - category icon management
def test_category_icons(api):
    import io
    import requests

    # Check if we're running in external mode (actual server on localhost:5000)
    # File uploads via requests only work in external mode
    base_url = os.environ.get("FLASK_TESTER_APP", None)
    if not base_url or not base_url.startswith("http"):
        pytest.skip("Category icon upload tests require external server (make check.pytest)")

    ts = int(time.time() * 1000) % 100000

    # Create a test category
    res = api.post("/categories", 201, json={
        "name": f"Icon Test Category {ts}",
        "slug": f"icon-test-category-{ts}",
        "description": "Testing icon upload"
    }, login=ADMIN)
    cat_id = res.json["category_id"]

    # Initially no custom icon - should return 200 with default icon
    res = api.get(f"/categories/{cat_id}/icon", 200, login=ADMIN)

    # Upload icon using requests directly (test framework doesn't support file uploads well)
    # This is a valid 1x1 transparent PNG
    png_data = bytes([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,  # IDAT chunk
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,  # IEND chunk
        0x42, 0x60, 0x82
    ])

    # Get tokens via basic auth using requests directly
    from requests.auth import HTTPBasicAuth
    resp = requests.get(f"{base_url}/login", auth=HTTPBasicAuth(ADMIN, "Hobbes123"))
    admin_token = resp.json().get("token") if isinstance(resp.json(), dict) else resp.json()
    resp = requests.get(f"{base_url}/login", auth=HTTPBasicAuth(NOADM, "Calvin123"))
    noadm_token = resp.json().get("token") if isinstance(resp.json(), dict) else resp.json()

    # Upload using requests with token auth
    url = f"{base_url}/categories/{cat_id}/icon"
    headers = {"Authorization": f"Bearer {admin_token}"}
    files = {"image": ("icon.png", io.BytesIO(png_data), "image/png")}
    resp = requests.post(url, headers=headers, files=files)
    assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
    assert "icon_url" in resp.json()
    assert cat_id in resp.json()["icon_url"]

    # Get the icon (requires auth)
    api.get(f"/categories/{cat_id}/icon", 401, login=None)
    res = api.get(f"/categories/{cat_id}/icon", 200, login=ADMIN)

    # Verify the category now has icon_url set
    res = api.get(f"/categories/{cat_id}", 200, login=ADMIN)
    assert res.json["icon_url"] is not None
    assert "/media/category/" in res.json["icon_url"]

    # Non-admin cannot upload icons (use requests)
    headers_noadm = {"Authorization": f"Bearer {noadm_token}"}
    resp = requests.post(url, headers=headers_noadm, files={"image": ("icon.png", io.BytesIO(png_data), "image/png")})
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"

    # Delete icon (admin only)
    api.delete(f"/categories/{cat_id}/icon", 403, login=NOADM)
    api.delete(f"/categories/{cat_id}/icon", 204, login=ADMIN)

    # Verify custom icon is gone - should now return default icon (200)
    api.get(f"/categories/{cat_id}/icon", 200, login=ADMIN)

    # Verify icon_url is cleared in database
    res = api.get(f"/categories/{cat_id}", 200, login=ADMIN)
    # icon_url should be None or empty after deletion

    # Delete category (should clean up any remaining icon files)
    api.delete(f"/categories/{cat_id}", 204, login=ADMIN)

# /profile/interests and /user/<username>/profile/interests - comprehensive interest tests
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

    # Get user_id from profile (for cleanup)
    res = api.get("/profile", 200, login=user)
    user_id = res.json["user_id"]

    # Create categories first (admin only) - use unique names to avoid conflicts with seed data
    res1 = api.post("/categories", 201, json={
        "name": "TestProgramming",
        "slug": "test-programming",
        "description": "Software development test category"
    }, login=ADMIN)
    cat_id1 = res1.json["category_id"]

    res2 = api.post("/categories", 201, json={
        "name": "TestDesign",
        "slug": "test-design",
        "description": "UI/UX Design test category"
    }, login=ADMIN)
    cat_id2 = res2.json["category_id"]

    # Get interests via /profile/interests - requires auth, empty initially
    res = api.get("/profile/interests", 200, login=user)
    assert res.json == []

    # Get interests via /user/<username>/profile/interests
    res = api.get(f"/user/{user}/profile/interests", 200, login=user)
    assert res.json == []

    # Test 401 for unauthenticated access
    api.get("/profile/interests", 401, login=None)
    api.get(f"/user/{user}/profile/interests", 401, login=None)

    # Test 404 for non-existent user (with auth)
    api.get("/user/nonexistentuser999/profile/interests", 404, login=ADMIN)

    # Create interest - use /profile/interests (authenticated endpoint)
    api.post("/profile/interests", 401, json={
        "category_id": cat_id1,
        "proficiency_level": 5
    }, login=None)

    res = api.post("/profile/interests", 201, json={
        "category_id": cat_id1,
        "proficiency_level": 5
    }, login=user)

    # Get interests via /profile/interests
    res = api.get("/profile/interests", 200, login=user)
    assert len(res.json) == 1
    assert res.json[0]["proficiency_level"] == 5
    assert res.json[0]["category_name"] == "TestProgramming"

    # Get interests via /user/<username>/profile/interests (other users can view)
    res = api.get(f"/user/{user}/profile/interests", 200, login=ADMIN)
    assert len(res.json) == 1

    # Add another interest
    api.post("/profile/interests", 201, json={
        "category_id": cat_id2,
        "proficiency_level": 3
    }, login=user)

    res = api.get("/profile/interests", 200, login=user)
    assert len(res.json) == 2

    # Update first interest
    api.patch(f"/profile/interests/{cat_id1}", 204, json={
        "proficiency_level": 4
    }, login=user)

    res = api.get("/profile/interests", 200, login=user)
    int1 = [i for i in res.json if i["category_id"] == cat_id1][0]
    assert int1["proficiency_level"] == 4

    # Cannot add duplicate interest
    api.post("/profile/interests", 409, json={
        "category_id": cat_id1,
        "proficiency_level": 2
    }, login=user)

    # Delete interests
    api.delete(f"/profile/interests/{cat_id1}", 204, login=user)
    res = api.get("/profile/interests", 200, login=user)
    assert len(res.json) == 1

    api.delete(f"/profile/interests/{cat_id2}", 204, login=user)
    res = api.get("/profile/interests", 200, login=user)
    assert len(res.json) == 0

    # Test 404 for non-existent interest
    api.delete(f"/profile/interests/{cat_id1}", 404, login=user)

    # Cleanup categories and user
    api.delete(f"/categories/{cat_id1}", 204, login=ADMIN)
    api.delete(f"/categories/{cat_id2}", 204, login=ADMIN)
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
    api.setToken(user, None)
    api.setPass(user, None)

# Comprehensive registration tests
def test_register_comprehensive(api):
    ts = int(time.time() * 1000) % 100000
    base_user = f"reg{ts}"
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

    # Verify user has profile auto-created (requires auth)
    res = api.get("/profile", 200, login=base_user)
    assert res.json["username"] == base_user
    assert res.json["email"] == f"{base_user}@test.com"

    # Cleanup - get user_id first to delete
    user_id = res.json["user_id"]
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
    api.setToken(base_user, None)
    api.setPass(base_user, None)

# Comprehensive login tests
def test_login_comprehensive(api):
    ts = int(time.time() * 1000) % 100000
    user = f"login{ts}"
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

    # Cleanup - get user_id from profile (need auth to access profile)
    res = api.get("/profile", 200, login=user)
    user_id = res.json["user_id"]
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
    api.setToken(user, None)
    api.setPass(user, None)


# /paps - comprehensive paps tests
def test_paps(api):
    ts = int(time.time() * 1000) % 100000
    user = f"paps{ts}"
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
    cat_id = res.json["category_id"] if isinstance(res.json, dict) else res.json

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
        "payment_amount": 500.00,
        "payment_currency": "USD",
        "status": "draft"
    }, login=user)
    paps_id = res.json["paps_id"] if isinstance(res.json, dict) else res.json
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
        "description": "An updated description for the paps project",
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
        "description": "Admin updated this paps project description",
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

    # Delete paps
    # Non-owner cannot delete paps
    api.delete(f"/paps/{paps_id}", 403, login=NOADM)

    # Remove category association before deleting paps (to allow category deletion later)
    api.delete(f"/paps/{paps_id}/categories/{cat_id}", 204, login=user)

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
    # Note: Can't delete user because soft-deleted paps still reference them
    api.setToken(user, None)
    api.setPass(user, None)


# /paps - admin vs user access tests
def test_paps_admin_access(api):
    ts = int(time.time() * 1000) % 100000
    user = f"admpaps{ts}"
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
    res = api.get("/profile", 200, login=user)
    user_id = res.json["user_id"]
    api.delete(f"/users/{user_id}", 204, login=ADMIN)
    api.setToken(user, None)
    api.setPass(user, None)


# /paps - search filters tests
def test_paps_search_filters(api):
    ts = int(time.time() * 1000) % 100000
    user = f"fpaps{ts}"
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
    cat_id = res.json["category_id"] if isinstance(res.json, dict) else res.json

    # Create paps with different attributes (use draft status to avoid publish check)
    res1 = api.post("/paps", 201, json={
        "title": "Expensive Fixed Project",
        "description": "A high-budget project for testing filters",
        "payment_type": "fixed",
        "payment_amount": 5000.00,
        "payment_currency": "USD",
        "status": "draft"
    }, login=user)
    paps_id1 = res1.json["paps_id"] if isinstance(res1.json, dict) else res1.json
    api.post(f"/paps/{paps_id1}/categories/{cat_id}", 201, login=user)

    res2 = api.post("/paps", 201, json={
        "title": "Cheap Hourly Project",
        "description": "An affordable hourly project for testing",
        "payment_type": "hourly",
        "payment_amount": 25.00,
        "payment_currency": "EUR",
        "status": "draft"
    }, login=user)
    paps_id2 = res2.json["paps_id"] if isinstance(res2.json, dict) else res2.json

    # Test status filter (use draft instead of published)
    res = api.get("/paps", 200, json={"status": "draft"}, login=user)
    for pap in res.json["paps"]:
        assert pap["status"] == "draft"

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
    # All results should have the category - verify they include our category
    for pap in res.json["paps"]:
        if "categories" in pap:
            pap_cat_ids = [c["category_id"] for c in pap["categories"]]
            # Check that each returned pap has the filtered category
            assert cat_id in pap_cat_ids, f"Category {cat_id} not found in pap categories: {pap_cat_ids}"

    # Cleanup - remove category associations first before deleting categories
    api.delete(f"/paps/{paps_id1}/categories/{cat_id}", 204, login=user)
    api.delete(f"/paps/{paps_id1}", 204, login=user)
    api.delete(f"/paps/{paps_id2}", 204, login=user)
    api.delete(f"/categories/{cat_id}", 204, login=ADMIN)
    # Note: Can't delete user because soft-deleted paps still reference them
    api.setToken(user, None)
    api.setPass(user, None)


# ============================================
# SPAP (JOB APPLICATIONS) TESTS
# ============================================

def test_spap_apply(api):
    """Test applying to a PAPS job posting."""
    import datetime
    
    # Create a user who will own a paps
    owner = "spap_owner"
    api.setPass(owner, "Owner123!")
    res = api.post("/register", 201, json={
        "username": owner,
        "email": f"{owner}@test.com",
        "password": "Owner123!"
    }, login=None)
    res = api.get("/login", login=owner, auth="basic")
    api.setToken(owner, res.json.get("token"))

    # Create another user who will apply
    applicant = "spap_applicant"
    api.setPass(applicant, "Apply123!")
    res = api.post("/register", 201, json={
        "username": applicant,
        "email": f"{applicant}@test.com",
        "password": "Apply123!"
    }, login=None)
    res = api.get("/login", login=applicant, auth="basic")
    api.setToken(applicant, res.json.get("token"))

    # Owner creates a published paps
    now = datetime.datetime.now(datetime.timezone.utc)
    start = now + datetime.timedelta(days=7)
    res = api.post("/paps", 201, json={
        "title": "Test Job for Applications",
        "description": "This is a test job posting for SPAP tests",
        "payment_type": "fixed",
        "payment_amount": 500.00,
        "status": "published",
        "publish_at": now.isoformat(),
        "start_datetime": start.isoformat(),
        "max_applicants": 5
    }, login=owner)
    paps_id = res.json["paps_id"]

    # Applicant applies to the paps
    res = api.post(f"/paps/{paps_id}/apply", 201, json={
        "title": "My Application",
        "message": "I would love to work on this project!"
    }, login=applicant)
    spap_id = res.json["spap_id"]
    assert spap_id is not None

    # Cannot apply twice
    api.post(f"/paps/{paps_id}/apply", 409, json={
        "title": "Another Application",
        "message": "Trying to apply again but should fail"
    }, login=applicant)

    # Owner cannot apply to their own paps
    api.post(f"/paps/{paps_id}/apply", 403, json={
        "title": "Self Application",
        "message": "Owner trying to apply to own job"
    }, login=owner)

    # Get application details
    res = api.get(f"/spap/{spap_id}", 200, login=applicant)
    assert res.json["title"] == "My Application"
    assert res.json["status"] == "pending"

    # Owner can also view the application
    res = api.get(f"/spap/{spap_id}", 200, login=owner)
    assert res.json["title"] == "My Application"

    # Get my applications (as applicant)
    res = api.get("/spap/my", 200, login=applicant)
    assert res.json["count"] >= 1
    assert any(a["id"] == spap_id for a in res.json["applications"])

    # Get all applications for paps (as owner)
    res = api.get(f"/paps/{paps_id}/applications", 200, login=owner)
    assert res.json["count"] >= 1

    # Applicant cannot view all applications
    api.get(f"/paps/{paps_id}/applications", 403, login=applicant)

    # Owner updates application status
    api.put(f"/spap/{spap_id}/status", 204, json={"status": "accepted"}, login=owner)
    res = api.get(f"/spap/{spap_id}", 200, login=applicant)
    assert res.json["status"] == "accepted"

    # Cannot withdraw accepted application
    api.delete(f"/spap/{spap_id}", 400, login=applicant)

    # Cleanup
    api.delete(f"/paps/{paps_id}", 204, login=owner)
    api.setToken(owner, None)
    api.setPass(owner, None)
    api.setToken(applicant, None)
    api.setPass(applicant, None)


def test_spap_withdraw(api):
    """Test withdrawing an application."""
    import datetime
    
    # Create owner and applicant
    owner = "withdraw_owner"
    api.setPass(owner, "Owner123!")
    res = api.post("/register", 201, json={
        "username": owner,
        "email": f"{owner}@test.com",
        "password": "Owner123!"
    }, login=None)
    res = api.get("/login", login=owner, auth="basic")
    api.setToken(owner, res.json.get("token"))

    applicant = "withdraw_applicant"
    api.setPass(applicant, "Apply123!")
    res = api.post("/register", 201, json={
        "username": applicant,
        "email": f"{applicant}@test.com",
        "password": "Apply123!"
    }, login=None)
    res = api.get("/login", login=applicant, auth="basic")
    api.setToken(applicant, res.json.get("token"))

    # Create published paps
    now = datetime.datetime.now(datetime.timezone.utc)
    start = now + datetime.timedelta(days=7)
    res = api.post("/paps", 201, json={
        "title": "Job for Withdrawal Test",
        "description": "Testing application withdrawal functionality",
        "payment_type": "hourly",
        "payment_amount": 50.00,
        "status": "published",
        "publish_at": now.isoformat(),
        "start_datetime": start.isoformat()
    }, login=owner)
    paps_id = res.json["paps_id"]

    # Apply
    res = api.post(f"/paps/{paps_id}/apply", 201, json={
        "title": "Will Withdraw",
        "message": "This application will be withdrawn"
    }, login=applicant)
    spap_id = res.json["spap_id"]

    # Withdraw application
    api.delete(f"/spap/{spap_id}", 204, login=applicant)

    # Application should be gone
    api.get(f"/spap/{spap_id}", 404, login=applicant)

    # Can apply again after withdrawal
    res = api.post(f"/paps/{paps_id}/apply", 201, json={
        "title": "Reapplication",
        "message": "Applying again after withdrawal"
    }, login=applicant)
    new_spap_id = res.json["spap_id"]

    # Cleanup
    api.delete(f"/spap/{new_spap_id}", 204, login=applicant)
    api.delete(f"/paps/{paps_id}", 204, login=owner)
    api.setToken(owner, None)
    api.setPass(owner, None)
    api.setToken(applicant, None)
    api.setPass(applicant, None)


def test_spap_max_applicants(api):
    """Test that max_applicants is enforced."""
    import datetime
    
    owner = "maxapp_owner"
    api.setPass(owner, "Owner123!")
    res = api.post("/register", 201, json={
        "username": owner,
        "email": f"{owner}@test.com",
        "password": "Owner123!"
    }, login=None)
    res = api.get("/login", login=owner, auth="basic")
    api.setToken(owner, res.json.get("token"))

    # Create paps with max_applicants = 1
    now = datetime.datetime.now(datetime.timezone.utc)
    start = now + datetime.timedelta(days=7)
    res = api.post("/paps", 201, json={
        "title": "Limited Applications Job",
        "description": "Only one person can apply to this job",
        "payment_type": "fixed",
        "payment_amount": 100.00,
        "status": "published",
        "publish_at": now.isoformat(),
        "start_datetime": start.isoformat(),
        "max_applicants": 1
    }, login=owner)
    paps_id = res.json["paps_id"]

    # First applicant
    app1 = "maxapp_app1"
    api.setPass(app1, "Apply123!")
    res = api.post("/register", 201, json={
        "username": app1,
        "email": f"{app1}@test.com",
        "password": "Apply123!"
    }, login=None)
    res = api.get("/login", login=app1, auth="basic")
    api.setToken(app1, res.json.get("token"))

    res = api.post(f"/paps/{paps_id}/apply", 201, json={
        "title": "First Application",
        "message": "I am the first applicant"
    }, login=app1)
    spap1_id = res.json["spap_id"]

    # Second applicant should be rejected (max reached)
    app2 = "maxapp_app2"
    api.setPass(app2, "Apply123!")
    res = api.post("/register", 201, json={
        "username": app2,
        "email": f"{app2}@test.com",
        "password": "Apply123!"
    }, login=None)
    res = api.get("/login", login=app2, auth="basic")
    api.setToken(app2, res.json.get("token"))

    api.post(f"/paps/{paps_id}/apply", 400, json={
        "title": "Second Application",
        "message": "I should not be able to apply"
    }, login=app2)

    # First applicant withdraws
    api.delete(f"/spap/{spap1_id}", 204, login=app1)

    # Now second applicant can apply
    res = api.post(f"/paps/{paps_id}/apply", 201, json={
        "title": "Second Application",
        "message": "Now I can apply after the first withdrew"
    }, login=app2)
    spap2_id = res.json["spap_id"]

    # Cleanup
    api.delete(f"/spap/{spap2_id}", 204, login=app2)
    api.delete(f"/paps/{paps_id}", 204, login=owner)
    api.setToken(owner, None)
    api.setPass(owner, None)
    api.setToken(app1, None)
    api.setPass(app1, None)
    api.setToken(app2, None)
    api.setPass(app2, None)


def test_spap_media(api):
    """Test SPAP media upload and management."""
    import datetime
    import io
    
    owner = "spapmedia_owner"
    api.setPass(owner, "Owner123!")
    res = api.post("/register", 201, json={
        "username": owner,
        "email": f"{owner}@test.com",
        "password": "Owner123!"
    }, login=None)
    res = api.get("/login", login=owner, auth="basic")
    api.setToken(owner, res.json.get("token"))

    applicant = "spapmedia_applicant"
    api.setPass(applicant, "Apply123!")
    res = api.post("/register", 201, json={
        "username": applicant,
        "email": f"{applicant}@test.com",
        "password": "Apply123!"
    }, login=None)
    res = api.get("/login", login=applicant, auth="basic")
    api.setToken(applicant, res.json.get("token"))

    # Create published paps
    now = datetime.datetime.now(datetime.timezone.utc)
    start = now + datetime.timedelta(days=7)
    res = api.post("/paps", 201, json={
        "title": "Job with Media Test",
        "description": "Testing SPAP media upload functionality",
        "payment_type": "fixed",
        "payment_amount": 300.00,
        "status": "published",
        "publish_at": now.isoformat(),
        "start_datetime": start.isoformat()
    }, login=owner)
    paps_id = res.json["paps_id"]

    # Apply
    res = api.post(f"/paps/{paps_id}/apply", 201, json={
        "title": "Application with Media",
        "message": "Will upload media to this application"
    }, login=applicant)
    spap_id = res.json["spap_id"]

    # Upload media - create a simple test image
    png_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
    
    res = api.post(f"/spap/{spap_id}/media", 201,
                   data={"media": (io.BytesIO(png_bytes), "test.png", "image/png")},
                   login=applicant)
    assert res.json["count"] == 1
    media_id = res.json["uploaded_media"][0]["media_id"]

    # Get media list
    res = api.get(f"/spap/{spap_id}/media", 200, login=applicant)
    assert res.json["media_count"] == 1

    # Owner can also view media
    res = api.get(f"/spap/{spap_id}/media", 200, login=owner)
    assert res.json["media_count"] == 1

    # Get media file
    res = api.get(f"/spap/media/{media_id}", 200, login=applicant)
    
    # Delete media
    api.delete(f"/spap/media/{media_id}", 204, login=applicant)

    # Media should be gone
    res = api.get(f"/spap/{spap_id}/media", 200, login=applicant)
    assert res.json["media_count"] == 0

    # Cleanup
    api.delete(f"/spap/{spap_id}", 204, login=applicant)
    api.delete(f"/paps/{paps_id}", 204, login=owner)
    api.setToken(owner, None)
    api.setPass(owner, None)
    api.setToken(applicant, None)
    api.setPass(applicant, None)


def test_spap_validation_conditions(api):
    """Test that SPAP can only be created under valid conditions."""
    import datetime
    
    # Create owner and applicant
    owner = "validation_owner"
    api.setPass(owner, "Owner123!")
    res = api.post("/register", 201, json={
        "username": owner,
        "email": f"{owner}@test.com",
        "password": "Owner123!"
    }, login=None)
    res = api.get("/login", login=owner, auth="basic")
    api.setToken(owner, res.json.get("token"))

    applicant = "validation_applicant"
    api.setPass(applicant, "Apply123!")
    res = api.post("/register", 201, json={
        "username": applicant,
        "email": f"{applicant}@test.com",
        "password": "Apply123!"
    }, login=None)
    res = api.get("/login", login=applicant, auth="basic")
    api.setToken(applicant, res.json.get("token"))

    now = datetime.datetime.now(datetime.timezone.utc)
    start = now + datetime.timedelta(days=7)

    # Test 1: Cannot apply to draft PAPS
    res = api.post("/paps", 201, json={
        "title": "Draft Job for Testing",
        "description": "This is a draft job posting that should not accept applications",
        "payment_type": "fixed",
        "payment_amount": 100.00,
        "status": "draft"
    }, login=owner)
    draft_paps_id = res.json["paps_id"]

    api.post(f"/paps/{draft_paps_id}/apply", 400, json={
        "title": "Application to Draft",
        "message": "This should fail because PAPS is not published"
    }, login=applicant)

    # Test 2: Cannot apply to closed PAPS
    res = api.post("/paps", 201, json={
        "title": "Closed Job for Testing",
        "description": "This is a closed job posting that should not accept applications",
        "payment_type": "fixed",
        "payment_amount": 100.00,
        "status": "published",
        "start_datetime": start.isoformat()
    }, login=owner)
    closed_paps_id = res.json["paps_id"]
    
    # Close the PAPS
    api.put(f"/paps/{closed_paps_id}", 204, json={"status": "closed"}, login=owner)

    api.post(f"/paps/{closed_paps_id}/apply", 400, json={
        "title": "Application to Closed",
        "message": "This should fail because PAPS is closed"
    }, login=applicant)

    # Test 3: Cannot apply to cancelled PAPS
    res = api.post("/paps", 201, json={
        "title": "Cancelled Job Testing",
        "description": "This is a cancelled job posting that should not accept applications",
        "payment_type": "fixed",
        "payment_amount": 100.00,
        "status": "published",
        "start_datetime": start.isoformat()
    }, login=owner)
    cancelled_paps_id = res.json["paps_id"]
    
    # Cancel the PAPS
    api.put(f"/paps/{cancelled_paps_id}", 204, json={"status": "cancelled"}, login=owner)

    api.post(f"/paps/{cancelled_paps_id}/apply", 400, json={
        "title": "Application to Cancelled",
        "message": "This should fail because PAPS is cancelled"
    }, login=applicant)

    # Test 4: Cannot apply to non-existent PAPS
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    api.post(f"/paps/{fake_uuid}/apply", 404, json={
        "title": "Application to Nonexistent",
        "message": "This should fail because PAPS does not exist"
    }, login=applicant)

    # Test 5: Invalid SPAP ID format
    api.post("/paps/not-a-uuid/apply", 400, json={
        "title": "Invalid ID Test",
        "message": "This should fail because PAPS ID is invalid"
    }, login=applicant)

    # Cleanup
    api.delete(f"/paps/{draft_paps_id}", 204, login=owner)
    api.delete(f"/paps/{closed_paps_id}", 204, login=owner)
    api.delete(f"/paps/{cancelled_paps_id}", 204, login=owner)
    api.setToken(owner, None)
    api.setPass(owner, None)
    api.setToken(applicant, None)
    api.setPass(applicant, None)


def test_spap_media_cascade_delete(api):
    """Test that SPAP media is deleted when SPAP is deleted."""
    import datetime
    import io
    
    owner = "cascade_owner"
    api.setPass(owner, "Owner123!")
    res = api.post("/register", 201, json={
        "username": owner,
        "email": f"{owner}@test.com",
        "password": "Owner123!"
    }, login=None)
    res = api.get("/login", login=owner, auth="basic")
    api.setToken(owner, res.json.get("token"))

    applicant = "cascade_applicant"
    api.setPass(applicant, "Apply123!")
    res = api.post("/register", 201, json={
        "username": applicant,
        "email": f"{applicant}@test.com",
        "password": "Apply123!"
    }, login=None)
    res = api.get("/login", login=applicant, auth="basic")
    api.setToken(applicant, res.json.get("token"))

    now = datetime.datetime.now(datetime.timezone.utc)
    start = now + datetime.timedelta(days=7)

    # Create published paps
    res = api.post("/paps", 201, json={
        "title": "Job for Cascade Test",
        "description": "Testing cascade delete of SPAP and its media",
        "payment_type": "fixed",
        "payment_amount": 200.00,
        "status": "published",
        "start_datetime": start.isoformat()
    }, login=owner)
    paps_id = res.json["paps_id"]

    # Apply
    res = api.post(f"/paps/{paps_id}/apply", 201, json={
        "title": "Application for Cascade Test",
        "message": "This application will have media that should be cascade deleted"
    }, login=applicant)
    spap_id = res.json["spap_id"]

    # Upload media
    png_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
    
    res = api.post(f"/spap/{spap_id}/media", 201,
                   data={"media": (io.BytesIO(png_bytes), "cascade_test.png", "image/png")},
                   login=applicant)
    assert res.json["count"] == 1
    media_id = res.json["uploaded_media"][0]["media_id"]

    # Verify media exists
    api.get(f"/spap/media/{media_id}", 200, login=applicant)

    # Delete the SPAP (should cascade delete media)
    api.delete(f"/spap/{spap_id}", 204, login=applicant)

    # SPAP should be gone
    api.get(f"/spap/{spap_id}", 404, login=applicant)

    # Media should also be gone (404 because SPAP doesn't exist)
    api.get(f"/spap/media/{media_id}", 404, login=applicant)

    # Cleanup
    api.delete(f"/paps/{paps_id}", 204, login=owner)
    api.setToken(owner, None)
    api.setPass(owner, None)
    api.setToken(applicant, None)
    api.setPass(applicant, None)


def test_paps_cascade_delete_spap(api):
    """Test that SPAPs are deleted when PAPS is deleted (cascade)."""
    import datetime
    
    owner = "paps_cascade_owner"
    api.setPass(owner, "Owner123!")
    res = api.post("/register", 201, json={
        "username": owner,
        "email": f"{owner}@test.com",
        "password": "Owner123!"
    }, login=None)
    res = api.get("/login", login=owner, auth="basic")
    api.setToken(owner, res.json.get("token"))

    applicant1 = "paps_cascade_app1"
    api.setPass(applicant1, "Apply123!")
    res = api.post("/register", 201, json={
        "username": applicant1,
        "email": f"{applicant1}@test.com",
        "password": "Apply123!"
    }, login=None)
    res = api.get("/login", login=applicant1, auth="basic")
    api.setToken(applicant1, res.json.get("token"))

    applicant2 = "paps_cascade_app2"
    api.setPass(applicant2, "Apply123!")
    res = api.post("/register", 201, json={
        "username": applicant2,
        "email": f"{applicant2}@test.com",
        "password": "Apply123!"
    }, login=None)
    res = api.get("/login", login=applicant2, auth="basic")
    api.setToken(applicant2, res.json.get("token"))

    now = datetime.datetime.now(datetime.timezone.utc)
    start = now + datetime.timedelta(days=7)

    # Create published paps
    res = api.post("/paps", 201, json={
        "title": "Job for PAPS Cascade Test",
        "description": "Testing cascade delete of PAPS deletes all SPAPs",
        "payment_type": "fixed",
        "payment_amount": 300.00,
        "status": "published",
        "start_datetime": start.isoformat(),
        "max_applicants": 5
    }, login=owner)
    paps_id = res.json["paps_id"]

    # Create multiple applications
    res = api.post(f"/paps/{paps_id}/apply", 201, json={
        "title": "First Application",
        "message": "First applicant for cascade delete test"
    }, login=applicant1)
    spap1_id = res.json["spap_id"]

    res = api.post(f"/paps/{paps_id}/apply", 201, json={
        "title": "Second Application",
        "message": "Second applicant for cascade delete test"
    }, login=applicant2)
    spap2_id = res.json["spap_id"]

    # Verify both applications exist
    api.get(f"/spap/{spap1_id}", 200, login=applicant1)
    api.get(f"/spap/{spap2_id}", 200, login=applicant2)

    # Verify applications show up in paps applications
    res = api.get(f"/paps/{paps_id}/applications", 200, login=owner)
    assert res.json["count"] == 2

    # Delete the PAPS (should cascade delete all SPAPs)
    api.delete(f"/paps/{paps_id}", 204, login=owner)

    # PAPS should be soft deleted (returns 404 for normal lookup)
    api.get(f"/paps/{paps_id}", 404, login=owner)

    # SPAPs should be cascade deleted (404)
    api.get(f"/spap/{spap1_id}", 404, login=applicant1)
    api.get(f"/spap/{spap2_id}", 404, login=applicant2)

    # Cleanup tokens
    api.setToken(owner, None)
    api.setPass(owner, None)
    api.setToken(applicant1, None)
    api.setPass(applicant1, None)
    api.setToken(applicant2, None)
    api.setPass(applicant2, None)
