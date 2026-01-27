#!/bin/bash

# ============================================
# UNDERBOSS COMPREHENSIVE API TEST SCRIPT
# ============================================
# Tests every endpoint, parameter combination, and workflow
# Covers all user scenarios from registration to payment completion
#
# Usage: ./comprehensive_test.sh [BASE_URL]
# Example: ./comprehensive_test.sh http://localhost:5000
#
# Requirements:
# - curl
# - jq (JSON processor)
# - Running Underboss server
# ============================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:5000}"
ADMIN_USER="calvin"
ADMIN_PASS="hobbes"
TEST_USER="hobbes"
TEST_PASS="calvin"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# ============================================
# UTILITY FUNCTIONS
# ============================================

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}[TEST $TOTAL_TESTS]${NC} $1"
}

print_success() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✓ PASS${NC}: $1\n"
}

print_fail() {
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo -e "${RED}✗ FAIL${NC}: $1\n"
}

print_summary() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}TEST SUMMARY${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "Total Tests:  ${TOTAL_TESTS}"
    echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"
    echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"
    echo -e "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
    echo -e "${BLUE}========================================${NC}\n"
}

# Check HTTP status code
check_status() {
    local expected=$1
    local actual=$2
    local desc=$3
    
    if [ "$actual" -eq "$expected" ]; then
        print_success "$desc (Status: $actual)"
        return 0
    else
        print_fail "$desc (Expected: $expected, Got: $actual)"
        return 1
    fi
}

# Make API call and store response
api_call() {
    local method=$1
    local endpoint=$2
    local auth=${3:-}
    local data=${4:-}
    
    local url="${BASE_URL}${endpoint}"
    local response_file=$(mktemp)
    local status_code
    
    if [ -n "$data" ]; then
        if [ -n "$auth" ]; then
            status_code=$(curl -s -w "%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth" \
                -d "$data" \
                "$url" -o "$response_file")
        else
            status_code=$(curl -s -w "%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$url" -o "$response_file")
        fi
    else
        if [ -n "$auth" ]; then
            status_code=$(curl -s -w "%{http_code}" -X "$method" \
                -H "Authorization: Bearer $auth" \
                "$url" -o "$response_file")
        else
            status_code=$(curl -s -w "%{http_code}" -X "$method" \
                "$url" -o "$response_file")
        fi
    fi
    
    echo "$status_code"
    echo "$response_file"
}

# Extract JSON field from response
extract_json() {
    local response_file=$1
    local field=$2
    jq -r ".$field" < "$response_file" 2>/dev/null || echo ""
}

# Generate random string
random_string() {
    local length=${1:-10}
    cat /dev/urandom | tr -dc 'a-z0-9' | fold -w "$length" | head -n 1
}

# ============================================
# SYSTEM & HEALTH CHECK TESTS
# ============================================

test_system_routes() {
    print_header "SYSTEM & HEALTH CHECK ROUTES"
    
    # Test 1: Health check (uptime)
    print_test "GET /uptime - Health check"
    read status response <<< $(api_call "GET" "/uptime")
    if check_status 200 "$status" "Health check successful"; then
        uptime=$(extract_json "$response" "up")
        echo "  Uptime: $uptime"
    fi
    rm -f "$response"
    
    # Test 2: Get info without auth (should fail)
    print_test "GET /info - Without authentication (should fail)"
    read status response <<< $(api_call "GET" "/info")
    check_status 401 "$status" "Info requires authentication"
    rm -f "$response"
    
    # Test 3: Get info with admin auth
    print_test "GET /info - With admin authentication"
    admin_token=$(get_admin_token)
    read status response <<< $(api_call "GET" "/info" "$admin_token")
    if check_status 200 "$status" "Info retrieved successfully"; then
        app=$(extract_json "$response" "app")
        echo "  App: $app"
    fi
    rm -f "$response"
    
    # Test 4: Get info with sleep parameter
    print_test "GET /info?sleep=0.1 - With sleep parameter"
    read status response <<< $(api_call "GET" "/info?sleep=0.1" "$admin_token")
    check_status 200 "$status" "Info with sleep parameter"
    rm -f "$response"
    
    # Test 5: Get stats
    print_test "GET /stats - Database pool statistics"
    read status response <<< $(api_call "GET" "/stats" "$admin_token")
    check_status 200 "$status" "Stats retrieved successfully"
    rm -f "$response"
    
    # Test 6: Who am I
    print_test "GET /who-am-i - Current user info"
    read status response <<< $(api_call "GET" "/who-am-i" "$admin_token")
    if check_status 200 "$status" "Who am I successful"; then
        user=$(extract_json "$response" "user")
        echo "  User: $user"
    fi
    rm -f "$response"
    
    # Test 7: Myself
    print_test "GET /myself - Detailed user info"
    read status response <<< $(api_call "GET" "/myself" "$admin_token")
    if check_status 200 "$status" "Myself successful"; then
        login=$(extract_json "$response" "login")
        isadmin=$(extract_json "$response" "isadmin")
        echo "  Login: $login, Admin: $isadmin"
    fi
    rm -f "$response"
}

# ============================================
# AUTHENTICATION TESTS
# ============================================

get_admin_token() {
    local response_file=$(mktemp)
    curl -s -X GET \
        -u "$ADMIN_USER:$ADMIN_PASS" \
        "${BASE_URL}/login" \
        -o "$response_file"
    local token=$(jq -r '.token' < "$response_file")
    rm -f "$response_file"
    echo "$token"
}

get_user_token() {
    local username=$1
    local password=$2
    local response_file=$(mktemp)
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"login\": \"$username\", \"password\": \"$password\"}" \
        "${BASE_URL}/login" \
        -o "$response_file"
    local token=$(jq -r '.token' < "$response_file")
    rm -f "$response_file"
    echo "$token"
}

test_authentication() {
    print_header "AUTHENTICATION ROUTES"
    
    # Test 1: Register new user
    print_test "POST /register - Create new user account"
    local new_username="testuser_$(random_string 8)"
    local new_email="${new_username}@example.com"
    local new_password="Test123!@#"
    local register_data="{\"username\": \"$new_username\", \"email\": \"$new_email\", \"password\": \"$new_password\"}"
    
    read status response <<< $(api_call "POST" "/register" "" "$register_data")
    if check_status 201 "$status" "User registration successful"; then
        NEW_USER_ID=$(extract_json "$response" "user_id")
        NEW_USERNAME="$new_username"
        NEW_PASSWORD="$new_password"
        echo "  User ID: $NEW_USER_ID"
        echo "  Username: $NEW_USERNAME"
    fi
    rm -f "$response"
    
    # Test 2: Register with invalid username (too short)
    print_test "POST /register - Invalid username (too short)"
    register_data='{"username": "ab", "email": "test@example.com", "password": "test123"}'
    read status response <<< $(api_call "POST" "/register" "" "$register_data")
    check_status 400 "$status" "Registration rejected for short username"
    rm -f "$response"
    
    # Test 3: Register with invalid email
    print_test "POST /register - Invalid email format"
    register_data='{"username": "testuser999", "email": "notanemail", "password": "test123"}'
    read status response <<< $(api_call "POST" "/register" "" "$register_data")
    check_status 400 "$status" "Registration rejected for invalid email"
    rm -f "$response"
    
    # Test 4: Register with phone number
    print_test "POST /register - With phone number"
    new_username="testuser_phone_$(random_string 6)"
    new_email="${new_username}@example.com"
    register_data="{\"username\": \"$new_username\", \"email\": \"$new_email\", \"password\": \"test123\", \"phone\": \"+14155551234\"}"
    read status response <<< $(api_call "POST" "/register" "" "$register_data")
    check_status 201 "$status" "Registration with phone successful"
    rm -f "$response"
    
    # Test 5: Register duplicate user
    print_test "POST /register - Duplicate username (should fail)"
    register_data="{\"username\": \"$NEW_USERNAME\", \"email\": \"different@example.com\", \"password\": \"test123\"}"
    read status response <<< $(api_call "POST" "/register" "" "$register_data")
    check_status 409 "$status" "Duplicate registration rejected"
    rm -f "$response"
    
    # Test 6: Login with Basic Auth (GET)
    print_test "GET /login - Login with Basic Auth"
    local response_file=$(mktemp)
    status=$(curl -s -w "%{http_code}" -X GET \
        -u "$NEW_USERNAME:$NEW_PASSWORD" \
        "${BASE_URL}/login" \
        -o "$response_file")
    if check_status 200 "$status" "Basic auth login successful"; then
        NEW_USER_TOKEN=$(jq -r '.token' < "$response_file")
        echo "  Token: ${NEW_USER_TOKEN:0:20}..."
    fi
    rm -f "$response_file"
    
    # Test 7: Login with form params (POST)
    print_test "POST /login - Login with form parameters"
    login_data="{\"login\": \"$NEW_USERNAME\", \"password\": \"$NEW_PASSWORD\"}"
    read status response <<< $(api_call "POST" "/login" "" "$login_data")
    if check_status 201 "$status" "Form login successful"; then
        token=$(extract_json "$response" "token")
        echo "  Token: ${token:0:20}..."
    fi
    rm -f "$response"
    
    # Test 8: Login with email
    print_test "POST /login - Login with email"
    login_data="{\"login\": \"$new_email\", \"password\": \"$NEW_PASSWORD\"}"
    read status response <<< $(api_call "POST" "/login" "" "$login_data")
    check_status 201 "$status" "Email login successful"
    rm -f "$response"
    
    # Test 9: Login with wrong password
    print_test "POST /login - Wrong password (should fail)"
    login_data="{\"login\": \"$NEW_USERNAME\", \"password\": \"wrongpassword\"}"
    read status response <<< $(api_call "POST" "/login" "" "$login_data")
    check_status 401 "$status" "Wrong password rejected"
    rm -f "$response"
    
    # Test 10: Login with non-existent user
    print_test "POST /login - Non-existent user (should fail)"
    login_data='{"login": "nonexistentuser999", "password": "test123"}'
    read status response <<< $(api_call "POST" "/login" "" "$login_data")
    check_status 401 "$status" "Non-existent user rejected"
    rm -f "$response"
}

# ============================================
# USER MANAGEMENT TESTS (ADMIN)
# ============================================

test_user_management() {
    print_header "USER MANAGEMENT ROUTES (ADMIN)"
    
    local admin_token=$(get_admin_token)
    
    # Test 1: Get all users
    print_test "GET /users - List all users"
    read status response <<< $(api_call "GET" "/users" "$admin_token")
    if check_status 200 "$status" "Users list retrieved"; then
        user_count=$(jq 'length' < "$response")
        echo "  Total users: $user_count"
    fi
    rm -f "$response"
    
    # Test 2: Get users with filter
    print_test "GET /users?flt=test - Filter users"
    read status response <<< $(api_call "GET" "/users?flt=test" "$admin_token")
    check_status 200 "$status" "Filtered users retrieved"
    rm -f "$response"
    
    # Test 3: Create user via admin
    print_test "POST /users - Admin create user"
    local admin_username="adminuser_$(random_string 6)"
    local admin_email="${admin_username}@example.com"
    user_data="{\"login\": \"$admin_username\", \"password\": \"admin123\", \"email\": \"$admin_email\", \"is_admin\": false}"
    read status response <<< $(api_call "POST" "/users" "$admin_token" "$user_data")
    if check_status 201 "$status" "Admin user creation successful"; then
        ADMIN_CREATED_USER_ID=$(extract_json "$response" "user_id")
        echo "  User ID: $ADMIN_CREATED_USER_ID"
    fi
    rm -f "$response"
    
    # Test 4: Get specific user by ID
    print_test "GET /users/{user_id} - Get user by UUID"
    read status response <<< $(api_call "GET" "/users/$ADMIN_CREATED_USER_ID" "$admin_token")
    if check_status 200 "$status" "User retrieved by ID"; then
        login=$(extract_json "$response" "login")
        echo "  Login: $login"
    fi
    rm -f "$response"
    
    # Test 5: Get specific user by username
    print_test "GET /users/{username} - Get user by username"
    read status response <<< $(api_call "GET" "/users/$admin_username" "$admin_token")
    check_status 200 "$status" "User retrieved by username"
    rm -f "$response"
    
    # Test 6: Update user with PATCH
    print_test "PATCH /users/{user_id} - Partial update"
    user_data='{"email": "newemail@example.com"}'
    read status response <<< $(api_call "PATCH" "/users/$ADMIN_CREATED_USER_ID" "$admin_token" "$user_data")
    check_status 204 "$status" "User partially updated"
    rm -f "$response"
    
    # Test 7: Update user password
    print_test "PATCH /users/{user_id} - Update password"
    user_data='{"password": "newpassword123"}'
    read status response <<< $(api_call "PATCH" "/users/$ADMIN_CREATED_USER_ID" "$admin_token" "$user_data")
    check_status 204 "$status" "User password updated"
    rm -f "$response"
    
    # Test 8: Update user is_admin
    print_test "PATCH /users/{user_id} - Make user admin"
    user_data='{"is_admin": true}'
    read status response <<< $(api_call "PATCH" "/users/$ADMIN_CREATED_USER_ID" "$admin_token" "$user_data")
    check_status 204 "$status" "User promoted to admin"
    rm -f "$response"
    
    # Test 9: Get non-existent user
    print_test "GET /users/{user_id} - Non-existent user (should fail)"
    read status response <<< $(api_call "GET" "/users/00000000-0000-0000-0000-000000000000" "$admin_token")
    check_status 404 "$status" "Non-existent user not found"
    rm -f "$response"
}

# ============================================
# PROFILE MANAGEMENT TESTS
# ============================================

test_profile_management() {
    print_header "PROFILE MANAGEMENT ROUTES"
    
    local user_token="$NEW_USER_TOKEN"
    
    # Test 1: Get current user profile
    print_test "GET /profile - Get current user profile"
    read status response <<< $(api_call "GET" "/profile" "$user_token")
    if check_status 200 "$status" "Profile retrieved"; then
        username=$(extract_json "$response" "username")
        avatar=$(extract_json "$response" "avatar_url")
        echo "  Username: $username"
        echo "  Avatar: $avatar"
    fi
    rm -f "$response"
    
    # Test 2: Update profile with PUT
    print_test "PUT /profile - Full profile update"
    profile_data='{"first_name": "Test", "last_name": "User", "bio": "This is my test bio", "location_address": "San Francisco, CA"}'
    read status response <<< $(api_call "PUT" "/profile" "$user_token" "$profile_data")
    check_status 204 "$status" "Profile updated successfully"
    rm -f "$response"
    
    # Test 3: Update profile with PATCH
    print_test "PATCH /profile - Partial profile update"
    profile_data='{"display_name": "TestUser Display", "preferred_language": "en"}'
    read status response <<< $(api_call "PATCH" "/profile" "$user_token" "$profile_data")
    check_status 204 "$status" "Profile partially updated"
    rm -f "$response"
    
    # Test 4: Update profile with location coordinates
    print_test "PUT /profile - Update with coordinates"
    profile_data='{"location_lat": 37.7749, "location_lng": -122.4194, "location_address": "San Francisco, CA"}'
    read status response <<< $(api_call "PUT" "/profile" "$user_token" "$profile_data")
    check_status 204 "$status" "Profile location updated"
    rm -f "$response"
    
    # Test 5: Update with invalid latitude
    print_test "PUT /profile - Invalid latitude (should fail)"
    profile_data='{"location_lat": 91.0, "location_lng": -122.0}'
    read status response <<< $(api_call "PUT" "/profile" "$user_token" "$profile_data")
    check_status 400 "$status" "Invalid latitude rejected"
    rm -f "$response"
    
    # Test 6: Update with date of birth
    print_test "PUT /profile - Update date of birth"
    profile_data='{"date_of_birth": "1990-01-15"}'
    read status response <<< $(api_call "PUT" "/profile" "$user_token" "$profile_data")
    check_status 204 "$status" "Date of birth updated"
    rm -f "$response"
    
    # Test 7: Get another user's profile
    print_test "GET /user/{username}/profile - Get public profile"
    read status response <<< $(api_call "GET" "/user/$TEST_USER/profile")
    if check_status 200 "$status" "Public profile retrieved"; then
        username=$(extract_json "$response" "username")
        echo "  Username: $username"
    fi
    rm -f "$response"
    
    # Test 8: Add work experience
    print_test "POST /profile/experiences - Add work experience"
    exp_data='{"job_title": "Software Engineer", "company_name": "Tech Corp", "start_date": "2020-01-01", "end_date": "2023-12-31", "description": "Developed awesome software"}'
    read status response <<< $(api_call "POST" "/profile/experiences" "$user_token" "$exp_data")
    if check_status 201 "$status" "Experience added"; then
        EXPERIENCE_ID=$(extract_json "$response" "experience_id")
        echo "  Experience ID: $EXPERIENCE_ID"
    fi
    rm -f "$response"
    
    # Test 9: Get experiences
    print_test "GET /profile/experiences - List experiences"
    read status response <<< $(api_call "GET" "/profile/experiences" "$user_token")
    if check_status 200 "$status" "Experiences retrieved"; then
        exp_count=$(jq 'length' < "$response")
        echo "  Experience count: $exp_count"
    fi
    rm -f "$response"
    
    # Test 10: Update experience
    print_test "PUT /profile/experiences/{id} - Update experience"
    exp_data='{"job_title": "Senior Software Engineer", "company_name": "Tech Corp", "start_date": "2020-01-01"}'
    read status response <<< $(api_call "PUT" "/profile/experiences/$EXPERIENCE_ID" "$user_token" "$exp_data")
    check_status 204 "$status" "Experience updated"
    rm -f "$response"
    
    # Test 11: Delete experience
    print_test "DELETE /profile/experiences/{id} - Delete experience"
    read status response <<< $(api_call "DELETE" "/profile/experiences/$EXPERIENCE_ID" "$user_token")
    check_status 204 "$status" "Experience deleted"
    rm -f "$response"
}

# ============================================
# CATEGORY TESTS
# ============================================

test_categories() {
    print_header "CATEGORY MANAGEMENT ROUTES"
    
    local admin_token=$(get_admin_token)
    local user_token="$NEW_USER_TOKEN"
    
    # Test 1: Get all categories
    print_test "GET /categories - List all categories"
    read status response <<< $(api_call "GET" "/categories")
    if check_status 200 "$status" "Categories retrieved"; then
        cat_count=$(jq 'length' < "$response")
        CATEGORY_ID=$(jq -r '.[0].category_id' < "$response")
        echo "  Category count: $cat_count"
        echo "  First category ID: $CATEGORY_ID"
    fi
    rm -f "$response"
    
    # Test 2: Get categories with parent filter
    print_test "GET /categories?parent_id=null - Root categories"
    read status response <<< $(api_call "GET" "/categories?parent_id=null")
    check_status 200 "$status" "Root categories retrieved"
    rm -f "$response"
    
    # Test 3: Create category (admin)
    print_test "POST /categories - Create new category"
    cat_name="TestCategory_$(random_string 6)"
    cat_data="{\"name\": \"$cat_name\", \"slug\": \"test-category-$(random_string 6)\", \"description\": \"Test category description\"}"
    read status response <<< $(api_call "POST" "/categories" "$admin_token" "$cat_data")
    if check_status 201 "$status" "Category created"; then
        TEST_CATEGORY_ID=$(extract_json "$response" "category_id")
        echo "  Category ID: $TEST_CATEGORY_ID"
    fi
    rm -f "$response"
    
    # Test 4: Create subcategory
    print_test "POST /categories - Create subcategory"
    cat_data="{\"name\": \"SubCategory $(random_string 4)\", \"slug\": \"sub-$(random_string 6)\", \"parent_id\": \"$TEST_CATEGORY_ID\"}"
    read status response <<< $(api_call "POST" "/categories" "$admin_token" "$cat_data")
    if check_status 201 "$status" "Subcategory created"; then
        SUB_CATEGORY_ID=$(extract_json "$response" "category_id")
    fi
    rm -f "$response"
    
    # Test 5: Get specific category
    print_test "GET /categories/{id} - Get category details"
    read status response <<< $(api_call "GET" "/categories/$TEST_CATEGORY_ID")
    if check_status 200 "$status" "Category details retrieved"; then
        name=$(extract_json "$response" "name")
        echo "  Name: $name"
    fi
    rm -f "$response"
    
    # Test 6: Update category
    print_test "PUT /categories/{id} - Update category"
    cat_data="{\"name\": \"$cat_name Updated\", \"description\": \"Updated description\", \"is_active\": true}"
    read status response <<< $(api_call "PUT" "/categories/$TEST_CATEGORY_ID" "$admin_token" "$cat_data")
    check_status 204 "$status" "Category updated"
    rm -f "$response"
    
    # Test 7: Add interest
    print_test "POST /profile/interests - Add category interest"
    interest_data="{\"category_id\": \"$CATEGORY_ID\"}"
    read status response <<< $(api_call "POST" "/profile/interests" "$user_token" "$interest_data")
    if check_status 201 "$status" "Interest added"; then
        INTEREST_ID=$(extract_json "$response" "interest_id")
    fi
    rm -f "$response"
    
    # Test 8: Get interests
    print_test "GET /profile/interests - List user interests"
    read status response <<< $(api_call "GET" "/profile/interests" "$user_token")
    if check_status 200 "$status" "Interests retrieved"; then
        interest_count=$(jq 'length' < "$response")
        echo "  Interest count: $interest_count"
    fi
    rm -f "$response"
    
    # Test 9: Delete interest
    print_test "DELETE /profile/interests/{id} - Remove interest"
    read status response <<< $(api_call "DELETE" "/profile/interests/$INTEREST_ID" "$user_token")
    check_status 204 "$status" "Interest removed"
    rm -f "$response"
}

# ============================================
# JOB POSTING (PAPS) TESTS
# ============================================

test_paps() {
    print_header "JOB POSTING (PAPS) ROUTES"
    
    local user_token="$NEW_USER_TOKEN"
    local admin_token=$(get_admin_token)
    
    # Test 1: Create draft PAPS
    print_test "POST /paps - Create draft job posting"
    paps_data=$(cat <<EOF
{
  "title": "Test Job $(random_string 6)",
  "description": "This is a test job posting with a detailed description that meets the minimum length requirement.",
  "status": "draft",
  "location_address": "123 Test Street, San Francisco, CA 94102",
  "location_lat": 37.7749,
  "location_lng": -122.4194,
  "payment_amount": 100.50,
  "payment_currency": "USD",
  "category_ids": ["$CATEGORY_ID"]
}
EOF
)
    read status response <<< $(api_call "POST" "/paps" "$user_token" "$paps_data")
    if check_status 201 "$status" "Draft PAPS created"; then
        DRAFT_PAPS_ID=$(extract_json "$response" "paps_id")
        echo "  PAPS ID: $DRAFT_PAPS_ID"
    fi
    rm -f "$response"
    
    # Test 2: Create published PAPS
    print_test "POST /paps - Create published job posting"
    paps_data=$(cat <<EOF
{
  "title": "Published Job $(random_string 6)",
  "description": "This is a published job posting that is visible to all users and accepting applications.",
  "status": "published",
  "location_address": "San Francisco, CA",
  "location_lat": 37.7749,
  "location_lng": -122.4194,
  "payment_amount": 250.00,
  "payment_currency": "USD",
  "category_ids": ["$CATEGORY_ID"]
}
EOF
)
    read status response <<< $(api_call "POST" "/paps" "$user_token" "$paps_data")
    if check_status 201 "$status" "Published PAPS created"; then
        PUBLISHED_PAPS_ID=$(extract_json "$response" "paps_id")
        echo "  PAPS ID: $PUBLISHED_PAPS_ID"
    fi
    rm -f "$response"
    
    # Test 3: Get all PAPS
    print_test "GET /paps - List all job postings"
    read status response <<< $(api_call "GET" "/paps")
    if check_status 200 "$status" "PAPS list retrieved"; then
        paps_count=$(jq '.paps | length' < "$response")
        total=$(extract_json "$response" "total")
        echo "  PAPS count: $paps_count"
        echo "  Total: $total"
    fi
    rm -f "$response"
    
    # Test 4: Filter by status
    print_test "GET /paps?status=published - Filter by status"
    read status response <<< $(api_call "GET" "/paps?status=published")
    if check_status 200 "$status" "Published PAPS retrieved"; then
        paps_count=$(jq '.paps | length' < "$response")
        echo "  Published count: $paps_count"
    fi
    rm -f "$response"
    
    # Test 5: Filter by owner
    print_test "GET /paps?owner_id={user_id} - Filter by owner"
    read status response <<< $(api_call "GET" "/paps?owner_id=$NEW_USER_ID")
    if check_status 200 "$status" "Owner PAPS retrieved"; then
        paps_count=$(jq '.paps | length' < "$response")
        echo "  Owner PAPS count: $paps_count"
    fi
    rm -f "$response"
    
    # Test 6: Filter by category
    print_test "GET /paps?category_id={id} - Filter by category"
    read status response <<< $(api_call "GET" "/paps?category_id=$CATEGORY_ID")
    check_status 200 "$status" "Category PAPS retrieved"
    rm -f "$response"
    
    # Test 7: Location search
    print_test "GET /paps?location_lat=37.7749&location_lng=-122.4194&radius_km=10"
    read status response <<< $(api_call "GET" "/paps?location_lat=37.7749&location_lng=-122.4194&radius_km=10")
    if check_status 200 "$status" "Location search successful"; then
        paps_count=$(jq '.paps | length' < "$response")
        echo "  Nearby PAPS: $paps_count"
    fi
    rm -f "$response"
    
    # Test 8: Text search
    print_test "GET /paps?search=test - Text search"
    read status response <<< $(api_call "GET" "/paps?search=test")
    check_status 200 "$status" "Text search successful"
    rm -f "$response"
    
    # Test 9: Payment range filter
    print_test "GET /paps?min_payment=50&max_payment=300"
    read status response <<< $(api_call "GET" "/paps?min_payment=50&max_payment=300")
    check_status 200 "$status" "Payment range filter successful"
    rm -f "$response"
    
    # Test 10: Sorting
    print_test "GET /paps?sort_by=payment_amount&sort_order=desc"
    read status response <<< $(api_call "GET" "/paps?sort_by=payment_amount&sort_order=desc")
    check_status 200 "$status" "Sorted PAPS retrieved"
    rm -f "$response"
    
    # Test 11: Pagination
    print_test "GET /paps?limit=5&offset=0 - Pagination"
    read status response <<< $(api_call "GET" "/paps?limit=5&offset=0")
    if check_status 200 "$status" "Paginated PAPS retrieved"; then
        limit=$(extract_json "$response" "limit")
        offset=$(extract_json "$response" "offset")
        echo "  Limit: $limit, Offset: $offset"
    fi
    rm -f "$response"
    
    # Test 12: Get specific PAPS
    print_test "GET /paps/{id} - Get PAPS details"
    read status response <<< $(api_call "GET" "/paps/$PUBLISHED_PAPS_ID")
    if check_status 200 "$status" "PAPS details retrieved"; then
        title=$(extract_json "$response" "title")
        status_field=$(extract_json "$response" "status")
        echo "  Title: $title"
        echo "  Status: $status_field"
    fi
    rm -f "$response"
    
    # Test 13: Update PAPS with PUT
    print_test "PUT /paps/{id} - Full update"
    paps_data='{"title": "Updated Test Job", "description": "Updated description for the test job posting with sufficient length.", "status": "published"}'
    read status response <<< $(api_call "PUT" "/paps/$DRAFT_PAPS_ID" "$user_token" "$paps_data")
    check_status 204 "$status" "PAPS fully updated"
    rm -f "$response"
    
    # Test 14: Update PAPS with PATCH
    print_test "PATCH /paps/{id} - Partial update"
    paps_data='{"payment_amount": 150.00}'
    read status response <<< $(api_call "PATCH" "/paps/$DRAFT_PAPS_ID" "$user_token" "$paps_data")
    check_status 204 "$status" "PAPS partially updated"
    rm -f "$response"
    
    # Test 15: Add schedule
    print_test "POST /paps/{id}/schedule - Add schedule entry"
    schedule_data='{"start_time": "2026-02-01T09:00:00Z", "end_time": "2026-02-01T17:00:00Z", "is_recurring": false}'
    read status response <<< $(api_call "POST" "/paps/$PUBLISHED_PAPS_ID/schedule" "$user_token" "$schedule_data")
    if check_status 201 "$status" "Schedule added"; then
        SCHEDULE_ID=$(extract_json "$response" "schedule_id")
    fi
    rm -f "$response"
    
    # Test 16: Get schedule
    print_test "GET /paps/{id}/schedule - Get schedule"
    read status response <<< $(api_call "GET" "/paps/$PUBLISHED_PAPS_ID/schedule")
    if check_status 200 "$status" "Schedule retrieved"; then
        schedule_count=$(jq 'length' < "$response")
        echo "  Schedule entries: $schedule_count"
    fi
    rm -f "$response"
}

# ============================================
# APPLICATION (SPAP) TESTS
# ============================================

test_spaps() {
    print_header "APPLICATION (SPAP) ROUTES"
    
    local test_token=$(get_user_token "$TEST_USER" "$TEST_PASS")
    local owner_token="$NEW_USER_TOKEN"
    
    # Test 1: Apply for job
    print_test "POST /spaps - Submit application"
    spap_data="{\"paps_id\": \"$PUBLISHED_PAPS_ID\", \"cover_letter\": \"I am very interested in this position and believe I would be a great fit. Here is my cover letter.\"}"
    read status response <<< $(api_call "POST" "/spaps" "$test_token" "$spap_data")
    if check_status 201 "$status" "Application submitted"; then
        SPAP_ID=$(extract_json "$response" "spap_id")
        echo "  SPAP ID: $SPAP_ID"
    fi
    rm -f "$response"
    
    # Test 2: Apply without cover letter
    print_test "POST /spaps - Application without cover letter"
    # Create another PAPS first
    paps_data='{"title": "Another Job", "description": "Another job for testing multiple applications on different jobs.", "status": "published"}'
    read status response <<< $(api_call "POST" "/paps" "$owner_token" "$paps_data")
    ANOTHER_PAPS_ID=$(extract_json "$response" "paps_id")
    rm -f "$response"
    
    spap_data="{\"paps_id\": \"$ANOTHER_PAPS_ID\"}"
    read status response <<< $(api_call "POST" "/spaps" "$test_token" "$spap_data")
    check_status 201 "$status" "Application without cover letter submitted"
    rm -f "$response"
    
    # Test 3: Apply to own PAPS (should fail)
    print_test "POST /spaps - Apply to own PAPS (should fail)"
    spap_data="{\"paps_id\": \"$PUBLISHED_PAPS_ID\"}"
    read status response <<< $(api_call "POST" "/spaps" "$owner_token" "$spap_data")
    check_status 400 "$status" "Cannot apply to own PAPS"
    rm -f "$response"
    
    # Test 4: Apply twice (should fail)
    print_test "POST /spaps - Duplicate application (should fail)"
    spap_data="{\"paps_id\": \"$PUBLISHED_PAPS_ID\", \"cover_letter\": \"Another application\"}"
    read status response <<< $(api_call "POST" "/spaps" "$test_token" "$spap_data")
    check_status 400 "$status" "Duplicate application rejected"
    rm -f "$response"
    
    # Test 5: Get all applications
    print_test "GET /spaps - List all applications"
    read status response <<< $(api_call "GET" "/spaps" "$test_token")
    if check_status 200 "$status" "Applications retrieved"; then
        spap_count=$(jq '.spaps | length' < "$response")
        echo "  Application count: $spap_count"
    fi
    rm -f "$response"
    
    # Test 6: Filter by PAPS
    print_test "GET /spaps?paps_id={id} - Filter by PAPS"
    read status response <<< $(api_call "GET" "/spaps?paps_id=$PUBLISHED_PAPS_ID" "$owner_token")
    if check_status 200 "$status" "PAPS applications retrieved"; then
        spap_count=$(jq '.spaps | length' < "$response")
        echo "  Applications for this PAPS: $spap_count"
    fi
    rm -f "$response"
    
    # Test 7: Filter by applicant
    print_test "GET /spaps?applicant_id={id} - Filter by applicant"
    # Get test user ID
    test_profile=$(mktemp)
    curl -s -H "Authorization: Bearer $test_token" "${BASE_URL}/profile" -o "$test_profile"
    TEST_USER_ID=$(jq -r '.user_id' < "$test_profile")
    rm -f "$test_profile"
    
    read status response <<< $(api_call "GET" "/spaps?applicant_id=$TEST_USER_ID" "$test_token")
    check_status 200 "$status" "Applicant SPAPs retrieved"
    rm -f "$response"
    
    # Test 8: Get specific SPAP
    print_test "GET /spaps/{id} - Get SPAP details"
    read status response <<< $(api_call "GET" "/spaps/$SPAP_ID" "$test_token")
    if check_status 200 "$status" "SPAP details retrieved"; then
        status_field=$(extract_json "$response" "status")
        echo "  Status: $status_field"
    fi
    rm -f "$response"
    
    # Test 9: Update cover letter
    print_test "PATCH /spaps/{id} - Update cover letter"
    spap_data='{"cover_letter": "Updated cover letter with more details about my qualifications."}'
    read status response <<< $(api_call "PATCH" "/spaps/$SPAP_ID" "$test_token" "$spap_data")
    check_status 204 "$status" "Cover letter updated"
    rm -f "$response"
    
    # Test 10: Accept application (by owner)
    print_test "PATCH /spaps/{id} - Accept application"
    spap_data='{"status": "accepted"}'
    read status response <<< $(api_call "PATCH" "/spaps/$SPAP_ID" "$owner_token" "$spap_data")
    check_status 204 "$status" "Application accepted"
    rm -f "$response"
}

# ============================================
# ASSIGNMENT (ASAP) TESTS
# ============================================

test_asaps() {
    print_header "ASSIGNMENT (ASAP) ROUTES"
    
    local owner_token="$NEW_USER_TOKEN"
    local test_token=$(get_user_token "$TEST_USER" "$TEST_PASS")
    
    # Test 1: Create assignment
    print_test "POST /asaps - Create assignment from accepted SPAP"
    asap_data="{\"spap_id\": \"$SPAP_ID\"}"
    read status response <<< $(api_call "POST" "/asaps" "$owner_token" "$asap_data")
    if check_status 201 "$status" "Assignment created"; then
        ASAP_ID=$(extract_json "$response" "asap_id")
        echo "  ASAP ID: $ASAP_ID"
    fi
    rm -f "$response"
    
    # Test 2: Get all assignments
    print_test "GET /asaps - List all assignments"
    read status response <<< $(api_call "GET" "/asaps" "$owner_token")
    if check_status 200 "$status" "Assignments retrieved"; then
        asap_count=$(jq '.asaps | length' < "$response")
        echo "  Assignment count: $asap_count"
    fi
    rm -f "$response"
    
    # Test 3: Filter by PAPS
    print_test "GET /asaps?paps_id={id} - Filter by PAPS"
    read status response <<< $(api_call "GET" "/asaps?paps_id=$PUBLISHED_PAPS_ID" "$owner_token")
    check_status 200 "$status" "PAPS assignments retrieved"
    rm -f "$response"
    
    # Test 4: Filter by accepted user
    print_test "GET /asaps?accepted_user_id={id} - Filter by worker"
    read status response <<< $(api_call "GET" "/asaps?accepted_user_id=$TEST_USER_ID" "$test_token")
    check_status 200 "$status" "Worker assignments retrieved"
    rm -f "$response"
    
    # Test 5: Get specific ASAP
    print_test "GET /asaps/{id} - Get ASAP details"
    read status response <<< $(api_call "GET" "/asaps/$ASAP_ID" "$owner_token")
    if check_status 200 "$status" "ASAP details retrieved"; then
        status_field=$(extract_json "$response" "status")
        echo "  Status: $status_field"
    fi
    rm -f "$response"
    
    # Test 6: Update to in_progress
    print_test "PATCH /asaps/{id} - Update to in_progress"
    asap_data='{"status": "in_progress"}'
    read status response <<< $(api_call "PATCH" "/asaps/$ASAP_ID" "$test_token" "$asap_data")
    check_status 204 "$status" "ASAP status updated to in_progress"
    rm -f "$response"
    
    # Test 7: Complete assignment (triggers auto-payment)
    print_test "PATCH /asaps/{id} - Complete assignment (auto-payment)"
    asap_data='{"status": "completed"}'
    read status response <<< $(api_call "PATCH" "/asaps/$ASAP_ID" "$owner_token" "$asap_data")
    if check_status 204 "$status" "ASAP completed (payment auto-created)"; then
        echo "  Auto-payment should be created"
    fi
    rm -f "$response"
}

# ============================================
# PAYMENT TESTS
# ============================================

test_payments() {
    print_header "PAYMENT ROUTES"
    
    local owner_token="$NEW_USER_TOKEN"
    local test_token=$(get_user_token "$TEST_USER" "$TEST_PASS")
    local admin_token=$(get_admin_token)
    
    # Test 1: Get payments for PAPS
    print_test "GET /paps/{id}/payments - List payments for PAPS"
    read status response <<< $(api_call "GET" "/paps/$PUBLISHED_PAPS_ID/payments" "$owner_token")
    if check_status 200 "$status" "PAPS payments retrieved"; then
        payment_count=$(jq '.payments | length' < "$response")
        echo "  Payment count: $payment_count (auto-created from ASAP)"
        if [ "$payment_count" -gt 0 ]; then
            AUTO_PAYMENT_ID=$(jq -r '.payments[0].payment_id' < "$response")
            echo "  Auto-payment ID: $AUTO_PAYMENT_ID"
        fi
    fi
    rm -f "$response"
    
    # Test 2: Create manual payment
    print_test "POST /paps/{id}/payments - Create manual payment"
    payment_data="{\"payee_id\": \"$TEST_USER_ID\", \"amount\": 50.00, \"currency\": \"USD\", \"payment_method\": \"cash\"}"
    read status response <<< $(api_call "POST" "/paps/$PUBLISHED_PAPS_ID/payments" "$owner_token" "$payment_data")
    if check_status 201 "$status" "Manual payment created"; then
        MANUAL_PAYMENT_ID=$(extract_json "$response" "payment_id")
        echo "  Payment ID: $MANUAL_PAYMENT_ID"
    fi
    rm -f "$response"
    
    # Test 3: Get specific payment
    print_test "GET /payments/{id} - Get payment details"
    if [ -n "${AUTO_PAYMENT_ID:-}" ]; then
        read status response <<< $(api_call "GET" "/payments/$AUTO_PAYMENT_ID" "$owner_token")
        if check_status 200 "$status" "Payment details retrieved"; then
            amount=$(extract_json "$response" "amount")
            currency=$(extract_json "$response" "currency")
            status_field=$(extract_json "$response" "status")
            echo "  Amount: $amount $currency"
            echo "  Status: $status_field"
        fi
        rm -f "$response"
    fi
    
    # Test 4: Update payment status
    print_test "PATCH /payments/{id} - Update payment status"
    if [ -n "${MANUAL_PAYMENT_ID:-}" ]; then
        payment_data='{"status": "completed", "transaction_id": "txn_123456"}'
        read status response <<< $(api_call "PATCH" "/payments/$MANUAL_PAYMENT_ID" "$owner_token" "$payment_data")
        check_status 204 "$status" "Payment status updated"
        rm -f "$response"
    fi
    
    # Test 5: Get user payments
    print_test "GET /user/payments - Get current user's payments"
    read status response <<< $(api_call "GET" "/user/payments" "$owner_token")
    if check_status 200 "$status" "User payments retrieved"; then
        payment_count=$(jq '.payments | length' < "$response")
        echo "  Payment count: $payment_count"
    fi
    rm -f "$response"
    
    # Test 6: Filter payments by role
    print_test "GET /user/payments?role=payer - Filter as payer"
    read status response <<< $(api_call "GET" "/user/payments?role=payer" "$owner_token")
    check_status 200 "$status" "Payer payments retrieved"
    rm -f "$response"
    
    print_test "GET /user/payments?role=payee - Filter as payee"
    read status response <<< $(api_call "GET" "/user/payments?role=payee" "$test_token")
    check_status 200 "$status" "Payee payments retrieved"
    rm -f "$response"
}

# ============================================
# RATING TESTS
# ============================================

test_ratings() {
    print_header "RATING ROUTES"
    
    local owner_token="$NEW_USER_TOKEN"
    local test_token=$(get_user_token "$TEST_USER" "$TEST_PASS")
    
    # Test 1: Create rating
    print_test "POST /ratings - Rate worker"
    rating_data="{\"paps_id\": \"$PUBLISHED_PAPS_ID\", \"rated_user_id\": \"$TEST_USER_ID\", \"rating\": 5, \"review\": \"Excellent work! Very professional and completed on time.\"}"
    read status response <<< $(api_call "POST" "/ratings" "$owner_token" "$rating_data")
    if check_status 201 "$status" "Rating created"; then
        RATING_ID=$(extract_json "$response" "rating_id")
        echo "  Rating ID: $RATING_ID"
    fi
    rm -f "$response"
    
    # Test 2: Get user ratings
    print_test "GET /ratings/{user_id} - Get user ratings"
    read status response <<< $(api_call "GET" "/ratings/$TEST_USER_ID")
    if check_status 200 "$status" "User ratings retrieved"; then
        avg_rating=$(extract_json "$response" "average_rating")
        total_ratings=$(extract_json "$response" "total_ratings")
        echo "  Average: $avg_rating, Total: $total_ratings"
    fi
    rm -f "$response"
    
    # Test 3: Get specific rating
    print_test "GET /ratings/{rating_id} - Get rating details"
    if [ -n "${RATING_ID:-}" ]; then
        read status response <<< $(api_call "GET" "/ratings/$RATING_ID")
        if check_status 200 "$status" "Rating details retrieved"; then
            rating=$(extract_json "$response" "rating")
            review=$(extract_json "$response" "review")
            echo "  Rating: $rating stars"
        fi
        rm -f "$response"
    fi
    
    # Test 4: Update rating
    print_test "PATCH /ratings/{id} - Update rating"
    if [ -n "${RATING_ID:-}" ]; then
        rating_data='{"rating": 4, "review": "Updated review: Good work overall."}'
        read status response <<< $(api_call "PATCH" "/ratings/$RATING_ID" "$owner_token" "$rating_data")
        check_status 204 "$status" "Rating updated"
        rm -f "$response"
    fi
    
    # Test 5: Rate with invalid score (should fail)
    print_test "POST /ratings - Invalid rating value (should fail)"
    rating_data="{\"paps_id\": \"$PUBLISHED_PAPS_ID\", \"rated_user_id\": \"$TEST_USER_ID\", \"rating\": 6}"
    read status response <<< $(api_call "POST" "/ratings" "$test_token" "$rating_data")
    check_status 400 "$status" "Invalid rating rejected"
    rm -f "$response"
}

# ============================================
# COMMENT TESTS
# ============================================

test_comments() {
    print_header "COMMENT ROUTES"
    
    local user_token="$NEW_USER_TOKEN"
    local test_token=$(get_user_token "$TEST_USER" "$TEST_PASS")
    
    # Test 1: Post comment
    print_test "POST /paps/{id}/comments - Post comment"
    comment_data='{"content": "This is a test comment on the job posting. Looks interesting!"}'
    read status response <<< $(api_call "POST" "/paps/$PUBLISHED_PAPS_ID/comments" "$user_token" "$comment_data")
    if check_status 201 "$status" "Comment posted"; then
        COMMENT_ID=$(extract_json "$response" "comment_id")
        echo "  Comment ID: $COMMENT_ID"
    fi
    rm -f "$response"
    
    # Test 2: Get all comments for PAPS
    print_test "GET /paps/{id}/comments - List comments"
    read status response <<< $(api_call "GET" "/paps/$PUBLISHED_PAPS_ID/comments")
    if check_status 200 "$status" "Comments retrieved"; then
        comment_count=$(jq '.comments | length' < "$response")
        echo "  Comment count: $comment_count"
    fi
    rm -f "$response"
    
    # Test 3: Post reply
    print_test "POST /paps/{id}/comments - Post reply"
    comment_data="{\"content\": \"This is a reply to the first comment.\", \"parent_id\": \"$COMMENT_ID\"}"
    read status response <<< $(api_call "POST" "/paps/$PUBLISHED_PAPS_ID/comments" "$test_token" "$comment_data")
    if check_status 201 "$status" "Reply posted"; then
        REPLY_ID=$(extract_json "$response" "comment_id")
    fi
    rm -f "$response"
    
    # Test 4: Get specific comment
    print_test "GET /comments/{id} - Get comment details"
    read status response <<< $(api_call "GET" "/comments/$COMMENT_ID")
    if check_status 200 "$status" "Comment details retrieved"; then
        content=$(extract_json "$response" "content")
        reply_count=$(jq '.replies | length' < "$response")
        echo "  Reply count: $reply_count"
    fi
    rm -f "$response"
    
    # Test 5: Update comment
    print_test "PATCH /comments/{id} - Update comment"
    comment_data='{"content": "Updated comment content with more details."}'
    read status response <<< $(api_call "PATCH" "/comments/$COMMENT_ID" "$user_token" "$comment_data")
    check_status 204 "$status" "Comment updated"
    rm -f "$response"
    
    # Test 6: Delete reply
    print_test "DELETE /comments/{id} - Delete reply"
    if [ -n "${REPLY_ID:-}" ]; then
        read status response <<< $(api_call "DELETE" "/comments/$REPLY_ID" "$test_token")
        check_status 204 "$status" "Reply deleted (soft delete)"
        rm -f "$response"
    fi
    
    # Test 7: Comment with pagination
    print_test "GET /paps/{id}/comments?limit=10&offset=0 - Paginated comments"
    read status response <<< $(api_call "GET" "/paps/$PUBLISHED_PAPS_ID/comments?limit=10&offset=0")
    check_status 200 "$status" "Paginated comments retrieved"
    rm -f "$response"
}

# ============================================
# FULL WORKFLOW TEST
# ============================================

test_full_workflow() {
    print_header "FULL WORKFLOW TEST"
    
    print_test "COMPLETE USER JOURNEY: Registration → Job Post → Application → Assignment → Payment → Rating"
    
    # Step 1: Register new job poster
    local poster_username="poster_$(random_string 8)"
    local poster_email="${poster_username}@example.com"
    local poster_password="Poster123!"
    local register_data="{\"username\": \"$poster_username\", \"email\": \"$poster_email\", \"password\": \"$poster_password\"}"
    
    read status response <<< $(api_call "POST" "/register" "" "$register_data")
    if check_status 201 "$status" "Step 1: Job poster registered"; then
        local poster_id=$(extract_json "$response" "user_id")
        echo "  Poster ID: $poster_id"
    fi
    rm -f "$response"
    
    # Step 2: Register new worker
    local worker_username="worker_$(random_string 8)"
    local worker_email="${worker_username}@example.com"
    local worker_password="Worker123!"
    register_data="{\"username\": \"$worker_username\", \"email\": \"$worker_email\", \"password\": \"$worker_password\"}"
    
    read status response <<< $(api_call "POST" "/register" "" "$register_data")
    if check_status 201 "$status" "Step 2: Worker registered"; then
        local worker_id=$(extract_json "$response" "user_id")
        echo "  Worker ID: $worker_id"
    fi
    rm -f "$response"
    
    # Step 3: Get tokens
    local poster_token=$(get_user_token "$poster_username" "$poster_password")
    local worker_token=$(get_user_token "$worker_username" "$worker_password")
    echo "  Poster token: ${poster_token:0:20}..."
    echo "  Worker token: ${worker_token:0:20}..."
    
    # Step 4: Update profiles
    profile_data='{"first_name": "Job", "last_name": "Poster", "bio": "Professional job poster"}'
    read status response <<< $(api_call "PUT" "/profile" "$poster_token" "$profile_data")
    check_status 204 "$status" "Step 3: Poster profile updated"
    rm -f "$response"
    
    profile_data='{"first_name": "Hard", "last_name": "Worker", "bio": "Reliable worker"}'
    read status response <<< $(api_call "PUT" "/profile" "$worker_token" "$profile_data")
    check_status 204 "$status" "Step 4: Worker profile updated"
    rm -f "$response"
    
    # Step 5: Post job
    paps_data=$(cat <<EOF
{
  "title": "Need Help Moving Furniture",
  "description": "I need someone to help me move furniture from my apartment to a new location. Should take about 3 hours.",
  "status": "published",
  "location_address": "123 Main St, San Francisco, CA",
  "location_lat": 37.7749,
  "location_lng": -122.4194,
  "payment_amount": 75.00,
  "payment_currency": "USD",
  "category_ids": ["$CATEGORY_ID"]
}
EOF
)
    read status response <<< $(api_call "POST" "/paps" "$poster_token" "$paps_data")
    if check_status 201 "$status" "Step 5: Job posted"; then
        local workflow_paps_id=$(extract_json "$response" "paps_id")
        echo "  PAPS ID: $workflow_paps_id"
    fi
    rm -f "$response"
    
    # Step 6: Worker applies
    spap_data="{\"paps_id\": \"$workflow_paps_id\", \"cover_letter\": \"I have experience moving furniture and am available to help!\"}"
    read status response <<< $(api_call "POST" "/spaps" "$worker_token" "$spap_data")
    if check_status 201 "$status" "Step 6: Application submitted"; then
        local workflow_spap_id=$(extract_json "$response" "spap_id")
        echo "  SPAP ID: $workflow_spap_id"
    fi
    rm -f "$response"
    
    # Step 7: Poster accepts application
    spap_data='{"status": "accepted"}'
    read status response <<< $(api_call "PATCH" "/spaps/$workflow_spap_id" "$poster_token" "$spap_data")
    check_status 204 "$status" "Step 7: Application accepted"
    rm -f "$response"
    
    # Step 8: Create assignment
    asap_data="{\"spap_id\": \"$workflow_spap_id\"}"
    read status response <<< $(api_call "POST" "/asaps" "$poster_token" "$asap_data")
    if check_status 201 "$status" "Step 8: Assignment created"; then
        local workflow_asap_id=$(extract_json "$response" "asap_id")
        echo "  ASAP ID: $workflow_asap_id"
    fi
    rm -f "$response"
    
    # Step 9: Worker starts work
    asap_data='{"status": "in_progress"}'
    read status response <<< $(api_call "PATCH" "/asaps/$workflow_asap_id" "$worker_token" "$asap_data")
    check_status 204 "$status" "Step 9: Work started"
    rm -f "$response"
    
    # Step 10: Poster marks complete (triggers auto-payment)
    asap_data='{"status": "completed"}'
    read status response <<< $(api_call "PATCH" "/asaps/$workflow_asap_id" "$poster_token" "$asap_data")
    check_status 204 "$status" "Step 10: Work completed (auto-payment created)"
    rm -f "$response"
    
    # Step 11: Verify payment created
    read status response <<< $(api_call "GET" "/paps/$workflow_paps_id/payments" "$poster_token")
    if check_status 200 "$status" "Step 11: Payment verified"; then
        payment_count=$(jq '.payments | length' < "$response")
        echo "  Payments created: $payment_count"
        if [ "$payment_count" -gt 0 ]; then
            local workflow_payment_id=$(jq -r '.payments[0].payment_id' < "$response")
            echo "  Payment ID: $workflow_payment_id"
            
            # Update payment to completed
            payment_data='{"status": "completed"}'
            read status2 response2 <<< $(api_call "PATCH" "/payments/$workflow_payment_id" "$poster_token" "$payment_data")
            check_status 204 "$status2" "Step 12: Payment marked complete"
            rm -f "$response2"
        fi
    fi
    rm -f "$response"
    
    # Step 13: Poster rates worker
    rating_data="{\"paps_id\": \"$workflow_paps_id\", \"rated_user_id\": \"$worker_id\", \"rating\": 5, \"review\": \"Great work! Very professional and efficient.\"}"
    read status response <<< $(api_call "POST" "/ratings" "$poster_token" "$rating_data")
    if check_status 201 "$status" "Step 13: Worker rated"; then
        local workflow_rating_id=$(extract_json "$response" "rating_id")
    fi
    rm -f "$response"
    
    # Step 14: Worker rates poster
    rating_data="{\"paps_id\": \"$workflow_paps_id\", \"rated_user_id\": \"$poster_id\", \"rating\": 5, \"review\": \"Easy to work with, clear instructions.\"}"
    read status response <<< $(api_call "POST" "/ratings" "$worker_token" "$rating_data")
    check_status 201 "$status" "Step 14: Poster rated"
    rm -f "$response"
    
    print_success "FULL WORKFLOW COMPLETED SUCCESSFULLY!"
}

# ============================================
# CLEANUP TESTS
# ============================================

test_cleanup() {
    print_header "CLEANUP & DELETION TESTS"
    
    local admin_token=$(get_admin_token)
    local user_token="$NEW_USER_TOKEN"
    
    # Test deletion order (must delete payments before PAPS)
    print_test "DELETE Payments → PAPS → User (correct order)"
    
    # Get payments for PAPS
    if [ -n "${PUBLISHED_PAPS_ID:-}" ]; then
        read status response <<< $(api_call "GET" "/paps/$PUBLISHED_PAPS_ID/payments" "$user_token")
        if [ "$status" -eq 200 ]; then
            payment_ids=$(jq -r '.payments[].payment_id' < "$response")
            for payment_id in $payment_ids; do
                print_test "DELETE /payments/$payment_id"
                read status2 response2 <<< $(api_call "DELETE" "/payments/$payment_id" "$admin_token")
                check_status 204 "$status2" "Payment deleted"
                rm -f "$response2"
            done
        fi
        rm -f "$response"
        
        # Now delete PAPS
        print_test "DELETE /paps/$PUBLISHED_PAPS_ID"
        read status response <<< $(api_call "DELETE" "/paps/$PUBLISHED_PAPS_ID" "$admin_token")
        check_status 204 "$status" "PAPS deleted"
        rm -f "$response"
    fi
    
    # Delete test category
    if [ -n "${SUB_CATEGORY_ID:-}" ]; then
        print_test "DELETE /categories/$SUB_CATEGORY_ID"
        read status response <<< $(api_call "DELETE" "/categories/$SUB_CATEGORY_ID" "$admin_token")
        check_status 204 "$status" "Subcategory deleted"
        rm -f "$response"
    fi
    
    if [ -n "${TEST_CATEGORY_ID:-}" ]; then
        print_test "DELETE /categories/$TEST_CATEGORY_ID"
        read status response <<< $(api_call "DELETE" "/categories/$TEST_CATEGORY_ID" "$admin_token")
        check_status 204 "$status" "Category deleted"
        rm -f "$response"
    fi
}

# ============================================
# MAIN EXECUTION
# ============================================

main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════╗"
    echo "║   UNDERBOSS COMPREHENSIVE TEST SUITE   ║"
    echo "╔════════════════════════════════════════╗"
    echo -e "${NC}"
    echo "Base URL: $BASE_URL"
    echo "Start Time: $(date)"
    echo ""
    
    # Check if server is running
    if ! curl -s -f "${BASE_URL}/uptime" > /dev/null 2>&1; then
        echo -e "${RED}ERROR: Server is not running at $BASE_URL${NC}"
        echo "Please start the server first with: make running"
        exit 1
    fi
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}ERROR: jq is not installed${NC}"
        echo "Please install jq: sudo apt install jq"
        exit 1
    fi
    
    # Run all test suites
    test_system_routes
    test_authentication
    test_user_management
    test_profile_management
    test_categories
    test_paps
    test_spaps
    test_asaps
    test_payments
    test_ratings
    test_comments
    test_full_workflow
    test_cleanup
    
    # Print summary
    print_summary
    
    echo "End Time: $(date)"
    
    # Exit with appropriate code
    if [ "$FAILED_TESTS" -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"
