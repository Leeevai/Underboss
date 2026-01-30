# Underboss API Routes Documentation

Complete API reference for the Underboss backend system. All routes, parameters, types, responses, and error codes.

## Table of Contents

1. [Authentication](#authentication)
2. [System Routes](#system-routes)
3. [User Management](#user-management)
4. [Profile Management](#profile-management)
5. [Category Management](#category-management)
6. [Job Postings (PAPS)](#job-postings-paps)
7. [Applications (SPAP)](#applications-spap)
8. [Assignments (ASAP)](#assignments-asap)
9. [Payment Management](#payment-management)
10. [Rating System](#rating-system)
11. [Comment System](#comment-system)
12. [Chat System](#chat-system)

---

## Authentication

### POST /register
**Description**: Register a new user account  
**Authorization**: OPEN (no authentication required)  
**Content-Type**: application/json

**Request Body**:
```json
{
  "username": "string (required, 3-50 chars, must start with letter)",
  "email": "string (required, valid email format)",
  "password": "string (required)",
  "phone": "string (optional, E.164 format: +1234567890)"
}
```

**Validation Rules**:
- `username`: 3-50 characters, starts with letter, can contain letters, numbers, hyphens, underscores, dots
- `email`: Valid email format (RFC 5322)
- `phone`: E.164 international format (optional)
- `password`: Any string (hashed server-side)

**Success Response (201)**:
```json
{
  "user_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed
  ```json
  {"error": "Username must be 3-50 characters"}
  {"error": "Invalid email format"}
  {"error": "Invalid phone format"}
  ```
- **409 Conflict**: User already exists
  ```json
  {"error": "User with this username, email, or phone already exists"}
  ```

---

### GET /login
**Description**: Login using HTTP Basic Auth to receive JWT token  
**Authorization**: OPEN (requires Basic Auth header)  
**Authentication**: Basic (username:password or email:password or phone:password)

**Request Headers**:
```
Authorization: Basic base64(login:password)
```

**Success Response (200)**:
```json
{
  "token": "jwt-token-string"
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid credentials
  ```json
  {"error": "Invalid login"}
  ```

---

### POST /login
**Description**: Login using form parameters to receive JWT token  
**Authorization**: OPEN (requires login/password in body)  
**Content-Type**: application/json

**Request Body**:
```json
{
  "login": "string (username, email, or phone)",
  "password": "string"
}
```

**Success Response (201)**:
```json
{
  "token": "jwt-token-string"
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid credentials
  ```json
  {"error": "Invalid login"}
  ```

---

## System Routes

### GET /uptime
**Description**: Health check endpoint (testing only, when APP_TESTING=True)  
**Authorization**: OPEN  
**Authentication**: None

**Success Response (200)**:
```json
{
  "app": "underboss",
  "up": "time-delta-string"
}
```

---

### GET /info
**Description**: Get comprehensive system information  
**Authorization**: ADMIN only  
**Authentication**: token, basic, or param

**Query Parameters**:
- `sleep`: float (optional) - Artificial delay in seconds for testing

**Success Response (200)**:
```json
{
  "app": "underboss",
  "git": {
    "remote": "git-remote-url",
    "branch": "branch-name",
    "commit": "commit-hash-and-count",
    "date": "iso8601-date"
  },
  "authentication": {
    "config": "auth-config",
    "user": "current-user",
    "auth": "auth-source"
  },
  "db": {
    "type": "postgres",
    "driver": "driver-name",
    "version": "version-string"
  },
  "status": {
    "started": "iso8601-timestamp",
    "now": "current-timestamp",
    "connections": 123,
    "hits": 456
  },
  "version": {
    "uname": "os-info-object",
    "python": "python-version",
    "postgres": "postgres-version",
    "underboss": "commit-id",
    "FlaskSimpleAuth": "version",
    "flask": "version"
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Not admin

---

### GET /stats
**Description**: Get database connection pool statistics  
**Authorization**: ADMIN only  
**Authentication**: token, basic, or param

**Success Response (200)**:
```json
{
  "pool_statistics": "statistics-object"
}
```

---

### GET /who-am-i
**Description**: Get current authenticated user information  
**Authorization**: AUTH (any authenticated user)  
**Authentication**: token, basic, or param

**Success Response (200)**:
```json
"username-or-email-or-phone"
```

---

### GET /myself
**Description**: Get detailed current user authentication data  
**Authorization**: AUTH  
**Authentication**: token, basic, or param

**Success Response (200)**:
```json
{
  "login": "username",
  "password": "hashed-password",
  "email": "user@example.com",
  "isadmin": true|false,
  "aid": "user-uuid"
}
```

---

### Static Media Serving
**Description**: All media files are served statically via Flask's built-in static file serving  
**Authorization**: OPEN (no authentication required for reading media files)  
**Base URL**: `/media/`

**Media Paths**:
- **User Avatars**: `/media/user/profile/{user_id}.{ext}`
- **Category Icons**: `/media/category/{category_id}.{ext}`
- **PAPS Media**: `/media/post/{media_id}.{ext}`
- **SPAP Media**: `/media/spap/{media_id}.{ext}`
- **ASAP Media**: `/media/asap/{media_id}.{ext}`

**Example URLs**:
```
http://localhost:5000/media/user/profile/123e4567-e89b-12d3-a456-426614174000.png
http://localhost:5000/media/post/987fcdeb-51a2-34c5-b789-123456789abc.jpg
http://localhost:5000/media/spap/456789ab-cdef-1234-5678-90abcdef1234.pdf
```

**Success Response (200)**:
- Returns binary file content with appropriate Content-Type header

**Error Responses**:
- **404 Not Found**: File does not exist

---

## User Management

**Note**: These routes are only available when `APP_USERS=True` in config (testing mode)

### GET /users
**Description**: Get list of all users (admin testing)  
**Authorization**: ADMIN  
**Authentication**: token, basic, or param

**Query Parameters**:
- `flt`: string (optional) - Filter string for user search

**Success Response (200)**:
```json
[
  {
    "aid": "uuid",
    "login": "username",
    "email": "user@example.com",
    "phone": "+1234567890",
    "is_admin": true|false,
    "created_at": "iso8601-timestamp",
    "updated_at": "iso8601-timestamp"
  }
]
```

---

### POST /users
**Description**: Create a new user (admin testing)  
**Authorization**: ADMIN  
**Content-Type**: application/json

**Request Body**:
```json
{
  "login": "string (required, 3+ chars, starts with letter)",
  "password": "string (required)",
  "email": "string (optional)",
  "phone": "string (optional)",
  "is_admin": "boolean (optional, default: false)"
}
```

**Success Response (201)**:
```json
{
  "user_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid username format
- **409 Conflict**: User already exists

---

### GET /users/{user_id}
**Description**: Get specific user data (UUID or username)  
**Authorization**: ADMIN

**Path Parameters**:
- `user_id`: string - User UUID or username

**Success Response (200)**:
```json
{
  "aid": "uuid",
  "login": "username",
  "email": "user@example.com",
  "phone": "+1234567890",
  "is_admin": true|false,
  "created_at": "iso8601-timestamp",
  "updated_at": "iso8601-timestamp"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid user identifier
- **404 Not Found**: User not found

---

### PATCH /users/{user_id}
**Description**: Partially update user data  
**Authorization**: ADMIN

**Path Parameters**:
- `user_id`: string - User UUID or username

**Request Body** (all optional):
```json
{
  "password": "string",
  "email": "string (valid email format)",
  "phone": "string",
  "is_admin": "boolean"
}
```

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid user identifier or email format
- **404 Not Found**: User not found

---

### PUT /users/{user_id}
**Description**: Replace user data completely  
**Authorization**: ADMIN

**Path Parameters**:
- `user_id`: string - User UUID or username

**Request Body**:
```json
{
  "auth": {
    "login": "string (must match user_id)",
    "password": "string",
    "email": "string",
    "isadmin": "boolean"
  }
}
```

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Login doesn't match user_id or invalid identifier
- **404 Not Found**: User not found

---

### DELETE /users/{user_id}
**Description**: Delete a user and all their data  
**Authorization**: ADMIN

**Path Parameters**:
- `user_id`: string - User UUID or username

**Success Response (204)**: No content

**Side Effects**:
- Deletes user profile and avatar from disk
- Hard deletes all user's PAPS and related media
- Cascades to delete all related records (SPAPs, ASAPs, comments, etc.)

**Error Responses**:
- **400 Bad Request**: Cannot delete yourself or invalid identifier
- **404 Not Found**: User not found

---

## Profile Management

### GET /profile
**Description**: Get current user's profile  
**Authorization**: AUTH

**Success Response (200)**:
```json
{
  "user_id": "uuid",
  "username": "string",
  "first_name": "string|null",
  "last_name": "string|null",
  "display_name": "string|null",
  "bio": "string|null",
  "avatar_url": "string (URL or default)",
  "date_of_birth": "YYYY-MM-DD|null",
  "location_address": "string|null",
  "location_lat": "float|null",
  "location_lng": "float|null",
  "timezone": "string|null",
  "preferred_language": "string|null",
  "created_at": "iso8601-timestamp",
  "updated_at": "iso8601-timestamp"
}
```

**Error Responses**:
- **404 Not Found**: Profile not found

---

### PUT /profile
**Description**: Update current user's profile (replaces all fields)  
**Authorization**: AUTH  
**Content-Type**: application/json

**Request Body** (all optional):
```json
{
  "first_name": "string|null",
  "last_name": "string|null",
  "display_name": "string|null",
  "bio": "string|null",
  "date_of_birth": "YYYY-MM-DD|null",
  "location_address": "string|null",
  "location_lat": "float (-90 to 90)|null",
  "location_lng": "float (-180 to 180)|null",
  "timezone": "string|null",
  "preferred_language": "string|null"
}
```

**Validation Rules**:
- `location_lat`: -90 to 90 (decimal degrees)
- `location_lng`: -180 to 180 (decimal degrees)
- `date_of_birth`: ISO 8601 date format (YYYY-MM-DD)

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid latitude, longitude, or date format

---

### PATCH /profile
**Description**: Partially update current user's profile  
**Authorization**: AUTH  
**Content-Type**: application/json

**Request Body**: Same as PUT /profile, all fields optional

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid validation

---

### POST /profile/avatar
**Description**: Upload profile avatar image  
**Authorization**: AUTH  
**Content-Type**: multipart/form-data OR image/*

**Request**:
- **Option 1 - Multipart Form Data**:
  ```
  Content-Type: multipart/form-data
  
  image: [binary file data]
  ```

- **Option 2 - Raw Binary**:
  ```
  Content-Type: image/png (or image/jpeg, image/gif, image/webp)
  
  [raw binary image data]
  ```

**Validation Rules**:
- Allowed types: PNG, JPEG, JPG, GIF, WEBP
- Max size: 5 MB (5242880 bytes)
- Image automatically compressed/resized for avatars

**Success Response (201)**:
```json
{
  "avatar_url": "media/user/profile/uuid.ext"
}
```

**Error Responses**:
- **400 Bad Request**: No image data provided
- **413 Payload Too Large**: File exceeds 5 MB
- **415 Unsupported Media Type**: Invalid file type

---

### DELETE /profile/avatar
**Description**: Delete current user's avatar, reset to default  
**Authorization**: AUTH

**Success Response (204)**: No content

**Side Effects**:
- Deletes avatar file from disk (if not default)
- Sets avatar_url to NULL in database

**Note**: Avatar images are served statically at `/media/user/profile/{user_id}.{ext}`

---

### GET /profile/experiences
**Description**: Get current user's work experiences  
**Authorization**: AUTH

**Success Response (200)**:
```json
[
  {
    "experience_id": "uuid",
    "user_id": "uuid",
    "title": "string",
    "company": "string|null",
    "description": "string|null",
    "start_date": "iso8601-timestamp",
    "end_date": "iso8601-timestamp|null",
    "is_current": "boolean",
    "created_at": "iso8601-timestamp",
    "updated_at": "iso8601-timestamp"
  }
]
```

---

### POST /profile/experiences
**Description**: Add new work experience  
**Authorization**: AUTH  
**Content-Type**: application/json

**Request Body**:
```json
{
  "title": "string (required, 2+ chars)",
  "company": "string (optional)",
  "description": "string (optional)",
  "start_date": "iso8601-timestamp (required)",
  "end_date": "iso8601-timestamp (optional, must be after start_date)",
  "is_current": "boolean (optional, default: false)"
}
```

**Validation Rules**:
- `title`: At least 2 characters
- `start_date`: ISO 8601 format
- `end_date`: Must be after start_date if provided
- Cannot have end_date if is_current is true

**Success Response (201)**:
```json
{
  "experience_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid date format or end_date before start_date

---

### PATCH /profile/experiences/{exp_id}
**Description**: Update specific work experience  
**Authorization**: AUTH

**Path Parameters**:
- `exp_id`: string (UUID)

**Request Body** (all optional):
```json
{
  "title": "string",
  "company": "string",
  "description": "string",
  "start_date": "iso8601-timestamp",
  "end_date": "iso8601-timestamp",
  "is_current": "boolean"
}
```

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid date validation or experience ID format
- **403 Forbidden**: Not your experience
- **404 Not Found**: Experience not found

---

### DELETE /profile/experiences/{exp_id}
**Description**: Delete specific work experience  
**Authorization**: AUTH

**Path Parameters**:
- `exp_id`: string (UUID)

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid experience ID format
- **403 Forbidden**: Not your experience
- **404 Not Found**: Experience not found

---

### GET /profile/interests
**Description**: Get current user's category interests  
**Authorization**: AUTH

**Success Response (200)**:
```json
[
  {
    "category_id": "uuid",
    "category_name": "string",
    "category_slug": "string",
    "proficiency_level": 1-5,
    "created_at": "iso8601-timestamp"
  }
]
```

---

### POST /profile/interests
**Description**: Add category interest  
**Authorization**: AUTH  
**Content-Type**: application/json

**Request Body**:
```json
{
  "category_id": "uuid (required)",
  "proficiency_level": "integer (optional, 1-5, default: 1)"
}
```

**Success Response (201)**: No content (empty body)

**Error Responses**:
- **400 Bad Request**: Invalid category_id format or proficiency level
- **404 Not Found**: Category not found
- **409 Conflict**: Interest already exists

---

### PATCH /profile/interests/{category_id}
**Description**: Update interest proficiency level  
**Authorization**: AUTH

**Path Parameters**:
- `category_id`: string (UUID)

**Request Body**:
```json
{
  "proficiency_level": "integer (required, 1-5)"
}
```

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid category_id format or proficiency level

---

### DELETE /profile/interests/{category_id}
**Description**: Remove category interest  
**Authorization**: AUTH

**Path Parameters**:
- `category_id`: string (UUID) - The category ID to remove from interests

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid category_id format
- **404 Not Found**: Interest not found

---

### GET /profile/rating
**Description**: Get current user's rating  
**Authorization**: AUTH

**Success Response (200)**:
```json
{
  "rating_average": 4.5,
  "rating_count": 23
}
```

**Error Responses**:
- **404 Not Found**: Profile not found

---

### GET /user/{username}/profile
**Description**: Get another user's public profile  
**Authorization**: OPEN  
**Authentication**: None

**Path Parameters**:
- `username`: string - Username to look up

**Success Response (200)**: Same structure as GET /profile

**Error Responses**:
- **404 Not Found**: User or profile not found

**Note**: User avatars are served statically at `/media/user/profile/{user_id}.{ext}`. Get user profile first to obtain the avatar URL.

---

### PATCH /user/{username}/profile
**Description**: Update a user's profile (must be authenticated as that user)  
**Authorization**: AUTH

**Path Parameters**:
- `username`: string

**Request Body**: Same as PATCH /profile

**Success Response (204)**: No content

**Error Responses**:
- **403 Forbidden**: Can only update your own profile
- **404 Not Found**: User not found

---

### GET /user/{username}/profile/experiences
**Description**: Get another user's work experiences  
**Authorization**: OPEN

**Path Parameters**:
- `username`: string

**Success Response (200)**: Array of experience objects

**Error Responses**:
- **404 Not Found**: User not found

---

### GET /user/{username}/profile/interests
**Description**: Get another user's category interests  
**Authorization**: OPEN

**Path Parameters**:
- `username`: string

**Success Response (200)**: Array of interest objects

**Error Responses**:
- **404 Not Found**: User not found

---

## Category Management

### GET /categories
**Description**: Get all active categories  
**Authorization**: AUTH

**Success Response (200)**:
```json
[
  {
    "category_id": "uuid",
    "name": "string",
    "slug": "string",
    "description": "string|null",
    "icon_url": "string|null",
    "parent_id": "uuid|null",
    "is_active": true|false,
    "created_at": "iso8601-timestamp",
    "updated_at": "iso8601-timestamp"
  }
]
```

---

### GET /categories/{category_id}
**Description**: Get specific category details  
**Authorization**: AUTH

**Path Parameters**:
- `category_id`: string (UUID)

**Success Response (200)**: Category object

**Error Responses**:
- **400 Bad Request**: Invalid category ID format
- **404 Not Found**: Category not found

---

### POST /categories
**Description**: Create new category (admin only)  
**Authorization**: ADMIN  
**Content-Type**: application/json

**Request Body**:
```json
{
  "name": "string (required, 2+ chars)",
  "slug": "string (required, lowercase letters, numbers, hyphens)",
  "description": "string (optional)",
  "parent_id": "uuid (optional)",
  "icon_url": "string (optional)"
}
```

**Validation Rules**:
- `name`: At least 2 characters
- `slug`: Lowercase letters, numbers, and hyphens only
- `parent_id`: Must exist if provided

**Success Response (201)**:
```json
{
  "category_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid validation

---

### PATCH /categories/{category_id}
**Description**: Update category (admin only)  
**Authorization**: ADMIN

**Path Parameters**:
- `category_id`: string (UUID)

**Request Body** (all optional):
```json
{
  "name": "string",
  "slug": "string",
  "description": "string",
  "parent_id": "uuid",
  "icon_url": "string",
  "is_active": "boolean"
}
```

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid validation or category ID format
- **404 Not Found**: Category not found

---

### DELETE /categories/{category_id}
**Description**: Delete category (admin only)  
**Authorization**: ADMIN

**Path Parameters**:
- `category_id`: string (UUID)

**Success Response (204)**: No content

**Side Effects**:
- Deletes category icon from disk

**Error Responses**:
- **400 Bad Request**: Invalid category ID format
- **404 Not Found**: Category not found

---

### POST /categories/{category_id}/icon
**Description**: Upload category icon (admin only)  
**Authorization**: ADMIN  
**Content-Type**: multipart/form-data OR image/*

**Path Parameters**:
- `category_id`: string (UUID)

**Request**: Same format as avatar upload

**Validation Rules**:
- Allowed types: PNG, JPEG, JPG, GIF, WEBP, SVG
- Max size: 1 MB

**Success Response (201)**:
```json
{
  "icon_url": "/media/category/{category_id}.{ext}"
}
```

**Note**: Category icons are served statically at the provided `icon_url`.

**Error Responses**:
- **400 Bad Request**: No image data provided or invalid category ID
- **404 Not Found**: Category not found
- **413 Payload Too Large**: File exceeds 1 MB
- **415 Unsupported Media Type**: Invalid file type

---

### DELETE /categories/{category_id}/icon
**Description**: Delete category icon (admin only)  
**Authorization**: ADMIN

**Path Parameters**:
- `category_id`: string (UUID)

**Success Response (204)**: No content

**Side Effects**:
- Deletes icon file from disk
- Sets icon_url to NULL in database

**Error Responses**:
- **400 Bad Request**: Invalid category ID format
- **404 Not Found**: Category not found

---

## Job Postings (PAPS)

### GET /paps
**Description**: Get all job postings with filters  
**Authorization**: AUTH

**Query Parameters**:
- `status`: string (optional) - Filter by status: "draft", "published", "open", "closed", "cancelled"
- `category_id`: string UUID (optional) - Filter by category
- `lat`: float (optional) - Location latitude for distance search
- `lng`: float (optional) - Location longitude for distance search
- `max_distance`: float (optional) - Maximum distance in km (requires lat/lng)
- `min_price`: float (optional) - Minimum payment amount
- `max_price`: float (optional) - Maximum payment amount
- `payment_type`: string (optional) - Filter by payment type: "fixed", "hourly", "negotiable"
- `owner_username`: string (optional) - Search by owner username (partial match)
- `title_search`: string (optional) - Search in title and description (partial match)

**Notes**:
- Admins see ALL paps (no limit)
- Non-admin users see up to 1000 paps, ranked by interest match score

**Success Response (200)**:
```json
{
  "paps": [
    {
      "id": "uuid",
      "owner_id": "uuid",
      "owner_username": "string",
      "title": "string",
      "subtitle": "string|null",
      "description": "string",
      "status": "published",
      "location_address": "string|null",
      "location_lat": "float|null",
      "location_lng": "float|null",
      "location_timezone": "string|null",
      "start_datetime": "iso8601-timestamp|null",
      "end_datetime": "iso8601-timestamp|null",
      "estimated_duration_minutes": "integer|null",
      "payment_amount": "float",
      "payment_currency": "USD",
      "payment_type": "fixed",
      "max_applicants": 10,
      "max_assignees": 1,
      "is_public": true,
      "publish_at": "iso8601-timestamp|null",
      "expires_at": "iso8601-timestamp|null",
      "created_at": "iso8601-timestamp",
      "updated_at": "iso8601-timestamp",
      "categories": [...]
    }
  ],
  "total_count": 123
}
```

---

### POST /paps
**Description**: Create new job posting  
**Authorization**: AUTH  
**Content-Type**: application/json

**Request Body**:
```json
{
  "title": "string (required, 5+ chars)",
  "description": "string (required, 20+ chars)",
  "payment_amount": "float (required, > 0)",
  "payment_currency": "string (optional, default: 'USD')",
  "payment_type": "string (optional, default: 'fixed'): fixed, hourly, negotiable",
  "max_applicants": "integer (optional, default: 10, 1-100)",
  "max_assignees": "integer (optional, default: 1)",
  "subtitle": "string (optional)",
  "location_address": "string (optional)",
  "location_lat": "float (optional, -90 to 90)",
  "location_lng": "float (optional, -180 to 180)",
  "location_timezone": "string (optional)",
  "start_datetime": "iso8601-timestamp (optional, required for published)",
  "end_datetime": "iso8601-timestamp (optional, must be after start)",
  "estimated_duration_minutes": "integer (optional, > 0)",
  "is_public": "boolean (optional, default: true)",
  "status": "string (optional, default: 'draft'): draft, published, closed, cancelled",
  "publish_at": "iso8601-timestamp (optional)",
  "expires_at": "iso8601-timestamp (optional)",
  "categories": ["uuid or {category_id, is_primary}"] (optional)
}
```

**Validation Rules**:
- `title`: At least 5 characters
- `description`: At least 20 characters
- `payment_amount`: Must be positive
- `payment_type`: "fixed", "hourly", or "negotiable"
- `max_applicants`: 1-100
- `max_assignees`: Must not exceed max_applicants
- `location_lat`/`location_lng`: Both required if one is provided
- `end_datetime`: Must be after start_datetime
- `start_datetime`: Required for published status

**Success Response (201)**:
```json
{
  "paps_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed

---

### GET /paps/{paps_id}
**Description**: Get specific job posting details  
**Authorization**: AUTH

**Path Parameters**:
- `paps_id`: string (UUID)

**Success Response (200)**:
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "owner_username": "string",
  "title": "string",
  "subtitle": "string|null",
  "description": "string",
  "status": "published",
  "location_address": "string|null",
  "location_lat": "float|null",
  "location_lng": "float|null",
  "location_timezone": "string|null",
  "start_datetime": "iso8601-timestamp|null",
  "end_datetime": "iso8601-timestamp|null",
  "estimated_duration_minutes": "integer|null",
  "payment_amount": "float",
  "payment_currency": "USD",
  "payment_type": "fixed",
  "max_applicants": 10,
  "max_assignees": 1,
  "is_public": true,
  "publish_at": "iso8601-timestamp|null",
  "expires_at": "iso8601-timestamp|null",
  "created_at": "iso8601-timestamp",
  "updated_at": "iso8601-timestamp",
  "categories": [...],
  "comments_count": 5,
  "applications_count": 3
}
```

**Error Responses**:
- **400 Bad Request**: Invalid PAP ID format
- **404 Not Found**: PAPS not found or not accessible

---

### PUT /paps/{paps_id}
**Description**: Update job posting  
**Authorization**: AUTH (must be owner or admin)

**Path Parameters**:
- `paps_id`: string (UUID)

**Request Body**: Same fields as POST /paps (all optional)

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid PAP ID format or validation failed
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: PAPS not found

---

### PUT /paps/{paps_id}/status
**Description**: Update PAPS status  
**Authorization**: AUTH (must be owner or admin)

**Path Parameters**:
- `paps_id`: string (UUID)

**Request Body**:
```json
{
  "status": "string (required): draft, open, published, closed, cancelled"
}
```

**Valid Transitions**:
- `draft` → `published` or `open` (opens for applications)
- `published`/`open` → `closed` (manually close, deletes remaining SPAPs)
- `published`/`open` → `cancelled` (cancel job)
- `closed` → `published`/`open` (reopen, if max_assignees not reached)
- `cancelled` → Cannot be modified

**Success Response (200)**:
```json
{
  "status": "closed"
}
```

**Side Effects**:
- When closing/cancelling: All pending SPAPs are deleted, their chat threads deleted

**Error Responses**:
- **400 Bad Request**: Invalid status or transition
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: PAPS not found

---

### DELETE /paps/{paps_id}
**Description**: Soft delete job posting  
**Authorization**: AUTH (must be owner) or ADMIN

**Path Parameters**:
- `paps_id`: string (UUID)

**Success Response (204)**: No content

**Side Effects**:
- Soft delete (sets deleted_at timestamp)
- Deletes all media files from disk (PAPS, SPAP, ASAP media)
- Deletes all SPAPs and ASAPs for this PAPS
- Deletes all comments

**Error Responses**:
- **400 Bad Request**: Cannot delete PAPS with active assignments or invalid ID format
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: PAPS not found

---

### POST /paps/{paps_id}/categories/{category_id}
**Description**: Add category to PAPS  
**Authorization**: AUTH (must be owner or admin)

**Path Parameters**:
- `paps_id`: string (UUID)
- `category_id`: string (UUID)

**Success Response (201)**:
```json
{
  "message": "Category added to PAP"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid ID format
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: PAPS or category not found

---

### DELETE /paps/{paps_id}/categories/{category_id}
**Description**: Remove category from PAPS  
**Authorization**: AUTH (must be owner or admin)

**Path Parameters**:
- `paps_id`: string (UUID)
- `category_id`: string (UUID)

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid ID format
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: PAPS not found

---

### GET /paps/{paps_id}/media
**Description**: Get all media for a PAPS  
**Authorization**: AUTH

**Path Parameters**:
- `paps_id`: string (UUID)

**Success Response (200)**:
```json
{
  "paps_id": "uuid",
  "media_count": 3,
  "media": [
    {
      "media_id": "uuid",
      "media_url": "/media/post/{media_id}.{ext}",
      "media_type": "image|video|document",
      "file_size_bytes": 123456,
      "mime_type": "image/jpeg",
      "display_order": 1
    }
  ]
}
```

**Error Responses**:
- **400 Bad Request**: Invalid PAP ID format
- **404 Not Found**: PAPS not found or not accessible

---

### POST /paps/{paps_id}/media
**Description**: Upload media file for job posting  
**Authorization**: AUTH (must be owner or admin)  
**Content-Type**: multipart/form-data

**Path Parameters**:
- `paps_id`: string (UUID)

**Request**:
```
Content-Type: multipart/form-data

media: [binary file data] (can be multiple files)
```

**Validation Rules**:
- Allowed types: PNG, JPEG, JPG, GIF, WEBP, MP4, MOV, PDF
- Max size: 50 MB
- Images are compressed automatically

**Success Response (201)**:
```json
{
  "uploaded_media": [
    {
      "media_id": "uuid",
      "media_url": "/paps/media/{media_id}",
      "media_type": "image|video|document",
      "file_size_bytes": 123456,
      "display_order": 1
    }
  ],
  "count": 1
}
```

**Note**: Media files are served statically at `/media/post/{media_id}.{ext}`.

**Error Responses**:
- **400 Bad Request**: No file provided or invalid PAP ID format
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: PAPS not found
- **413 Payload Too Large**: File exceeds 50 MB
- **415 Unsupported Media Type**: Invalid file type

---

### DELETE /paps/media/{media_id}
**Description**: Delete media file from job posting  
**Authorization**: AUTH (must be owner) or ADMIN

**Path Parameters**:
- `media_id`: string (UUID)

**Success Response (204)**: No content

**Side Effects**:
- Deletes file from disk

**Error Responses**:
- **400 Bad Request**: Invalid media ID format
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: Media not found

---

## Applications (SPAP)

### GET /spap/my
**Description**: Get current user's applications  
**Authorization**: AUTH

**Success Response (200)**:
```json
{
  "applications": [
    {
      "id": "uuid",
      "paps_id": "uuid",
      "paps_title": "string",
      "applicant_id": "uuid",
      "status": "pending",
      "message": "string|null",
      "created_at": "iso8601-timestamp",
      "updated_at": "iso8601-timestamp"
    }
  ],
  "count": 5
}
```

---

### GET /paps/{paps_id}/applications
**Description**: Get all applications for a PAPS (owner/admin only)  
**Authorization**: AUTH (must be PAPS owner or admin)

**Path Parameters**:
- `paps_id`: string (UUID)

**Success Response (200)**:
```json
{
  "applications": [...],
  "count": 5
}
```

**Error Responses**:
- **400 Bad Request**: Invalid PAPS ID format
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: PAPS not found

---

### POST /paps/{paps_id}/apply
**Description**: Apply to a job posting  
**Authorization**: AUTH  
**Content-Type**: application/json

**Path Parameters**:
- `paps_id`: string (UUID)

**Request Body**:
```json
{
  "message": "string (optional, application message/cover letter)",
  "title": "string (optional)",
  "subtitle": "string (optional)",
  "proposed_payment": "float (optional, >= 0)",
  "location_address": "string (optional)",
  "location_lat": "float (optional, -90 to 90)",
  "location_lng": "float (optional, -180 to 180)",
  "location_timezone": "string (optional)"
}
```

**Validation Rules**:
- Cannot apply to your own PAPS
- Cannot apply twice to same PAPS
- Cannot apply if already assigned to this PAPS
- PAPS must be in "open" or "published" status
- Maximum assignees must not be reached

**Success Response (201)**:
```json
{
  "spap_id": "uuid",
  "chat_thread_id": "uuid"
}
```

**Side Effects**:
- Creates a chat thread between applicant and owner

**Error Responses**:
- **400 Bad Request**: Invalid PAPS ID, already applied, or max assignees reached
- **403 Forbidden**: Cannot apply to own PAPS
- **404 Not Found**: PAPS not found
- **409 Conflict**: Already applied or already assigned

---

### GET /spap/{spap_id}
**Description**: Get specific application details  
**Authorization**: AUTH (must be applicant, PAPS owner, or admin)

**Path Parameters**:
- `spap_id`: string (UUID)

**Success Response (200)**:
```json
{
  "id": "uuid",
  "paps_id": "uuid",
  "applicant_id": "uuid",
  "status": "pending",
  "message": "string|null",
  "created_at": "iso8601-timestamp",
  "updated_at": "iso8601-timestamp",
  "chat_thread_id": "uuid|null"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid SPAP ID format
- **403 Forbidden**: Not authorized to view
- **404 Not Found**: SPAP not found

---

### DELETE /spap/{spap_id}
**Description**: Withdraw application (applicant only)  
**Authorization**: AUTH (must be applicant) or ADMIN

**Path Parameters**:
- `spap_id`: string (UUID)

**Success Response (204)**: No content

**Side Effects**:
- Deletes all SPAP media files from disk
- Deletes associated chat thread

**Error Responses**:
- **400 Bad Request**: Invalid SPAP ID format or cannot withdraw accepted application
- **403 Forbidden**: Not applicant or admin
- **404 Not Found**: SPAP not found

---

### PUT /spap/{spap_id}/accept
**Description**: Accept an application (PAPS owner only)  
**Authorization**: AUTH (must be PAPS owner or admin)

**Path Parameters**:
- `spap_id`: string (UUID)

**Success Response (200)**:
```json
{
  "asap_id": "uuid"
}
```

**Side Effects**:
- Creates an ASAP (assignment)
- Transfers chat thread from SPAP to ASAP
- Deletes the SPAP
- If max_assignees reached: closes PAPS and deletes remaining SPAPs
- If multiple assignees: creates group chat

**Error Responses**:
- **400 Bad Request**: Invalid ID, not pending status, or max assignees reached
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: SPAP or PAPS not found

---

### PUT /spap/{spap_id}/reject
**Description**: Reject an application (PAPS owner only)  
**Authorization**: AUTH (must be PAPS owner or admin)

**Path Parameters**:
- `spap_id`: string (UUID)

**Success Response (204)**: No content

**Side Effects**:
- Deletes the SPAP and all its media
- Deletes the associated chat thread

**Error Responses**:
- **400 Bad Request**: Invalid ID or not pending status
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: SPAP or PAPS not found

---

### GET /spap/{spap_id}/media
**Description**: Get all media for an application  
**Authorization**: AUTH (must be applicant, PAPS owner, or admin)

**Path Parameters**:
- `spap_id`: string (UUID)

**Success Response (200)**:
```json
{
  "spap_id": "uuid",
  "media_count": 2,
  "media": [
    {
      "media_id": "uuid",
      "media_url": "/media/spap/{media_id}.{ext}",
      "media_type": "image|document",
      "file_size_bytes": 123456,
      "mime_type": "image/jpeg",
      "display_order": 1
    }
  ]
}
```

**Error Responses**:
- **400 Bad Request**: Invalid SPAP ID format
- **403 Forbidden**: Not authorized
- **404 Not Found**: SPAP not found

---

### POST /spap/{spap_id}/media
**Description**: Upload media for application  
**Authorization**: AUTH (must be applicant)  
**Content-Type**: multipart/form-data

**Path Parameters**:
- `spap_id`: string (UUID)

**Request**:
```
Content-Type: multipart/form-data

media: [binary file data] (can be multiple files)
```

**Validation Rules**:
- Allowed types: PNG, JPEG, JPG, GIF, WEBP, PDF
- Max size: 10 MB
- Application must be in pending status

**Success Response (201)**:
```json
{
  "uploaded_media": [...],
  "count": 1
}
```

**Note**: Media files are served statically at `/media/spap/{media_id}.{ext}`.

**Error Responses**:
- **400 Bad Request**: No file, invalid ID, or non-pending application
- **403 Forbidden**: Not applicant
- **404 Not Found**: SPAP not found
- **413 Payload Too Large**: File exceeds 10 MB
- **415 Unsupported Media Type**: Invalid file type

---

### DELETE /spap/media/{media_id}
**Description**: Delete SPAP media file  
**Authorization**: AUTH (must be applicant) or ADMIN

**Path Parameters**:
- `media_id`: string (UUID)

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid ID format or non-pending application
- **403 Forbidden**: Not applicant or admin
- **404 Not Found**: Media or SPAP not found

---

## Assignments (ASAP)

### GET /asap
**Description**: Get current user's assignments (as worker or owner)  
**Authorization**: AUTH

**Success Response (200)**:
```json
{
  "as_worker": [
    {
      "asap_id": "uuid",
      "paps_id": "uuid",
      "paps_title": "string",
      "accepted_user_id": "uuid",
      "owner_id": "uuid",
      "status": "in_progress",
      "created_at": "iso8601-timestamp",
      "started_at": "iso8601-timestamp|null",
      "completed_at": "iso8601-timestamp|null"
    }
  ],
  "as_owner": [...],
  "total_as_worker": 3,
  "total_as_owner": 5
}
```

---

### GET /paps/{paps_id}/assignments
**Description**: Get all assignments for a PAPS  
**Authorization**: AUTH (must be PAPS owner or admin)

**Path Parameters**:
- `paps_id`: string (UUID)

**Success Response (200)**:
```json
{
  "assignments": [...],
  "count": 2
}
```

**Error Responses**:
- **400 Bad Request**: Invalid PAPS ID format
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: PAPS not found

---

### GET /asap/{asap_id}
**Description**: Get specific assignment details  
**Authorization**: AUTH (must be worker, owner, or admin)

**Path Parameters**:
- `asap_id`: string (UUID)

**Success Response (200)**:
```json
{
  "asap_id": "uuid",
  "paps_id": "uuid",
  "paps_title": "string",
  "accepted_user_id": "uuid",
  "accepted_username": "string",
  "owner_id": "uuid",
  "owner_username": "string",
  "status": "in_progress",
  "created_at": "iso8601-timestamp",
  "started_at": "iso8601-timestamp|null",
  "completed_at": "iso8601-timestamp|null"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid ASAP ID format
- **403 Forbidden**: Not involved in assignment
- **404 Not Found**: Assignment not found

---

### PUT /asap/{asap_id}/status
**Description**: Update assignment status  
**Authorization**: AUTH (must be owner or worker, depending on status)

**Path Parameters**:
- `asap_id`: string (UUID)

**Request Body**:
```json
{
  "status": "string (required): active, in_progress, completed, cancelled, disputed"
}
```

**Permission Rules**:
- `in_progress`: Worker or owner can start
- `completed`: Only owner can mark as completed (triggers payment)
- `cancelled`: Only owner or admin can cancel
- `disputed`: Either party can dispute
- `active`: Only admin can revert to active

**Success Response (204)**: No content

**Side Effects**:
- If status set to "completed" and PAPS has payment_amount:
  - Automatically creates payment record
  - Payer: PAPS owner
  - Payee: Worker
  - Amount/Currency: From PAPS

**Error Responses**:
- **400 Bad Request**: Invalid status
- **403 Forbidden**: Not authorized for this status change
- **404 Not Found**: Assignment not found

---

### DELETE /asap/{asap_id}
**Description**: Delete assignment  
**Authorization**: AUTH (must be owner) or ADMIN

**Path Parameters**:
- `asap_id`: string (UUID)

**Success Response (204)**: No content

**Side Effects**:
- Deletes all ASAP media files from disk
- Cascades to delete chat threads

**Error Responses**:
- **400 Bad Request**: Invalid ID format or cannot delete completed assignments
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: Assignment not found

---

### GET /asap/{asap_id}/media
**Description**: Get all media for an assignment  
**Authorization**: AUTH (must be worker, owner, or admin)

**Path Parameters**:
- `asap_id`: string (UUID)

**Success Response (200)**:
```json
{
  "asap_id": "uuid",
  "media_count": 3,
  "media": [
    {
      "media_id": "uuid",
      "media_url": "/media/asap/{media_id}.{ext}",
      "media_type": "image|video|document",
      "file_size_bytes": 123456,
      "mime_type": "image/jpeg",
      "display_order": 1
    }
  ]
}
```

**Error Responses**:
- **400 Bad Request**: Invalid ASAP ID format
- **403 Forbidden**: Not authorized
- **404 Not Found**: Assignment not found

---

### POST /asap/{asap_id}/media
**Description**: Upload media for assignment (proof of work)  
**Authorization**: AUTH (must be PAPS owner only)  
**Content-Type**: multipart/form-data

**Path Parameters**:
- `asap_id`: string (UUID)

**Request**:
```
Content-Type: multipart/form-data

media: [binary file data] (can be multiple files)
```

**Validation Rules**:
- Allowed types: PNG, JPEG, JPG, GIF, WEBP, MP4, MOV, PDF
- Max size: 50 MB

**Success Response (201)**:
```json
{
  "uploaded_media": [...],
  "count": 1
}
```

**Note**: Media files are served statically at `/media/asap/{media_id}.{ext}`.

**Error Responses**:
- **400 Bad Request**: No file or invalid ASAP ID format
- **403 Forbidden**: Only PAPS owner can upload media
- **404 Not Found**: Assignment not found
- **413 Payload Too Large**: File exceeds 50 MB
- **415 Unsupported Media Type**: Invalid file type

---

### DELETE /asap/media/{media_id}
**Description**: Delete ASAP media file  
**Authorization**: AUTH (must be PAPS owner) or ADMIN

**Path Parameters**:
- `media_id`: string (UUID)

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid media ID format
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: Media or assignment not found

---

## Payment Management

### GET /payments
**Description**: Get current user's payments (as payer or payee)  
**Authorization**: AUTH

**Success Response (200)**:
```json
{
  "payments": [
    {
      "payment_id": "uuid",
      "paps_id": "uuid",
      "payer_id": "uuid",
      "payee_id": "uuid",
      "amount": 100.50,
      "currency": "USD",
      "status": "pending",
      "payment_method": "string|null",
      "transaction_id": "string|null",
      "external_reference": "string|null",
      "created_at": "iso8601-timestamp",
      "paid_at": "iso8601-timestamp|null",
      "user_role": "payer|payee"
    }
  ],
  "sent": [...],
  "received": [...],
  "total_count": 10
}
```

---

### GET /payments/{payment_id}
**Description**: Get specific payment details  
**Authorization**: AUTH (must be payer, payee, or admin)

**Path Parameters**:
- `payment_id`: string (UUID)

**Success Response (200)**:
```json
{
  "payment_id": "uuid",
  "paps_id": "uuid",
  "payer_id": "uuid",
  "payee_id": "uuid",
  "amount": 100.50,
  "currency": "USD",
  "status": "pending",
  "payment_method": "string|null",
  "transaction_id": "string|null",
  "external_reference": "string|null",
  "created_at": "iso8601-timestamp",
  "paid_at": "iso8601-timestamp|null"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid payment ID format
- **403 Forbidden**: Not involved in payment
- **404 Not Found**: Payment not found

---

### GET /paps/{paps_id}/payments
**Description**: Get all payments for a job posting  
**Authorization**: AUTH (must be PAPS owner or admin)

**Path Parameters**:
- `paps_id`: string (UUID)

**Success Response (200)**:
```json
{
  "paps_id": "uuid",
  "payments": [...],
  "count": 2
}
```

**Error Responses**:
- **400 Bad Request**: Invalid PAPS ID format
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: PAPS not found

---

### POST /paps/{paps_id}/payments
**Description**: Create payment for a job posting  
**Authorization**: AUTH (must be PAPS owner)  
**Content-Type**: application/json

**Path Parameters**:
- `paps_id`: string (UUID)

**Request Body**:
```json
{
  "payee_id": "uuid (required) - Worker receiving payment",
  "amount": "float (required, > 0)",
  "currency": "string (optional, default: 'USD'): USD, EUR, GBP, CAD, AUD, JPY, CNY",
  "payment_method": "string (optional): transfer, cash, check, crypto, paypal, stripe, other"
}
```

**Success Response (201)**:
```json
{
  "payment_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid amount, currency, or payment method
- **403 Forbidden**: Not PAPS owner
- **404 Not Found**: PAPS not found

---

### PUT /payments/{payment_id}/status
**Description**: Update payment status  
**Authorization**: AUTH (must be payer or admin)

**Path Parameters**:
- `payment_id`: string (UUID)

**Request Body**:
```json
{
  "status": "string (required): pending, processing, completed, failed, refunded, cancelled",
  "transaction_id": "string (optional)",
  "external_reference": "string (optional)"
}
```

**Validation Rules**:
- Only payer or admin can update
- Cannot update completed/refunded/cancelled payments (except admin)

**Success Response (204)**: No content

**Side Effects**:
- If status set to "completed": sets paid_at timestamp

**Error Responses**:
- **400 Bad Request**: Invalid status or cannot modify final status
- **403 Forbidden**: Not payer or admin
- **404 Not Found**: Payment not found

---

### DELETE /payments/{payment_id}
**Description**: Delete payment record  
**Authorization**: AUTH (must be payer) or ADMIN

**Path Parameters**:
- `payment_id`: string (UUID)

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid ID format or can only delete pending payments (non-admin)
- **403 Forbidden**: Not payer or admin
- **404 Not Found**: Payment not found

---

## Rating System

### GET /users/{user_id}/rating
**Description**: Get a user's rating average and count  
**Authorization**: AUTH

**Path Parameters**:
- `user_id`: string (UUID)

**Success Response (200)**:
```json
{
  "user_id": "uuid",
  "rating_average": 4.5,
  "rating_count": 23
}
```

**Error Responses**:
- **400 Bad Request**: Invalid user ID format
- **404 Not Found**: User not found

---

### GET /profile/rating
**Description**: Get current user's rating  
**Authorization**: AUTH

**Success Response (200)**:
```json
{
  "rating_average": 4.5,
  "rating_count": 23
}
```

**Error Responses**:
- **404 Not Found**: Profile not found

---

### POST /asap/{asap_id}/rate
**Description**: Rate a user for a completed ASAP  
**Authorization**: AUTH (must be owner or worker)  
**Content-Type**: application/json

**Path Parameters**:
- `asap_id`: string (UUID)

**Request Body**:
```json
{
  "score": "integer (required, 1-5)"
}
```

**Validation Rules**:
- ASAP must be completed
- Must be either the PAPS owner or the worker
- Owner rates worker, worker rates owner (bidirectional)
- Individual ratings are NOT stored - only the moving average is updated

**Success Response (201)**:
```json
{
  "message": "Rating submitted successfully",
  "rated_user_id": "uuid",
  "score": 5
}
```

**Error Responses**:
- **400 Bad Request**: Invalid score (not 1-5), ASAP not completed
- **403 Forbidden**: Not authorized to rate
- **404 Not Found**: Assignment not found

---

### GET /asap/{asap_id}/can-rate
**Description**: Check if current user can rate this ASAP  
**Authorization**: AUTH

**Path Parameters**:
- `asap_id`: string (UUID)

**Success Response (200)**:
```json
{
  "can_rate": true,
  "user_to_rate_id": "uuid",
  "is_owner": true|false,
  "is_worker": true|false
}
```

or if cannot rate:

```json
{
  "can_rate": false,
  "reason": "Assignment not yet completed"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid ASAP ID format

---

## Comment System

### GET /paps/{paps_id}/comments
**Description**: Get top-level comments for a job posting  
**Authorization**: AUTH

**Path Parameters**:
- `paps_id`: string (UUID)

**Success Response (200)**:
```json
{
  "paps_id": "uuid",
  "comments": [
    {
      "comment_id": "uuid",
      "paps_id": "uuid",
      "user_id": "uuid",
      "username": "string",
      "user_avatar": "string|null",
      "parent_id": null,
      "content": "string",
      "reply_count": 3,
      "created_at": "iso8601-timestamp",
      "updated_at": "iso8601-timestamp"
    }
  ],
  "count": 5,
  "total_count": 15
}
```

**Error Responses**:
- **400 Bad Request**: Invalid PAPS ID format
- **404 Not Found**: PAPS not found

---

### POST /paps/{paps_id}/comments
**Description**: Create top-level comment on job posting  
**Authorization**: AUTH  
**Content-Type**: application/json

**Path Parameters**:
- `paps_id`: string (UUID)

**Request Body**:
```json
{
  "content": "string (required, 1-2000 chars)"
}
```

**Success Response (201)**:
```json
{
  "comment_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Content empty, too long, invalid PAPS ID, or PAPS deleted
- **404 Not Found**: PAPS not found

---

### GET /comments/{comment_id}
**Description**: Get specific comment  
**Authorization**: AUTH

**Path Parameters**:
- `comment_id`: string (UUID)

**Success Response (200)**:
```json
{
  "comment_id": "uuid",
  "paps_id": "uuid",
  "user_id": "uuid",
  "username": "string",
  "parent_id": "uuid|null",
  "content": "string",
  "created_at": "iso8601-timestamp",
  "updated_at": "iso8601-timestamp"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid comment ID format
- **404 Not Found**: Comment not found or deleted

---

### PUT /comments/{comment_id}
**Description**: Edit a comment  
**Authorization**: AUTH (must be comment author or admin)

**Path Parameters**:
- `comment_id`: string (UUID)

**Request Body**:
```json
{
  "content": "string (required, 1-2000 chars)"
}
```

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Content empty/too long or invalid comment ID format
- **403 Forbidden**: Not author or admin
- **404 Not Found**: Comment not found or deleted

---

### DELETE /comments/{comment_id}
**Description**: Soft delete comment  
**Authorization**: AUTH (must be author, PAPS owner, or admin)

**Path Parameters**:
- `comment_id`: string (UUID)

**Success Response (204)**: No content

**Side Effects**:
- Soft delete (sets deleted_at timestamp)
- Also soft deletes all replies if this is a parent comment

**Error Responses**:
- **400 Bad Request**: Invalid comment ID format
- **403 Forbidden**: Not authorized
- **404 Not Found**: Comment not found or already deleted

---

### GET /comments/{comment_id}/replies
**Description**: Get replies to a comment  
**Authorization**: AUTH

**Path Parameters**:
- `comment_id`: string (UUID)

**Success Response (200)**:
```json
{
  "parent_comment_id": "uuid",
  "replies": [...],
  "count": 3
}
```

**Notes**:
- Instagram-style: Only top-level comments can have replies
- Cannot get replies of a reply

**Error Responses**:
- **400 Bad Request**: Invalid ID format or trying to get replies of a reply
- **404 Not Found**: Comment not found or deleted

---

### POST /comments/{comment_id}/replies
**Description**: Reply to a comment  
**Authorization**: AUTH  
**Content-Type**: application/json

**Path Parameters**:
- `comment_id`: string (UUID)

**Request Body**:
```json
{
  "content": "string (required, 1-2000 chars)"
}
```

**Notes**:
- Instagram-style: Only top-level comments accept replies
- Replies cannot have further replies (max depth = 1)

**Success Response (201)**:
```json
{
  "comment_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Content validation, invalid ID, replying to a reply, or PAPS deleted
- **404 Not Found**: Comment not found

---

### GET /comments/{comment_id}/thread
**Description**: Get comment with all its replies  
**Authorization**: AUTH

**Path Parameters**:
- `comment_id`: string (UUID)

**Success Response (200)**:
```json
{
  "comment": {...},
  "replies": [...],
  "is_reply": false
}
```

**Error Responses**:
- **400 Bad Request**: Invalid comment ID format
- **404 Not Found**: Comment not found or deleted

---

## Chat System

### GET /chat
**Description**: Get current user's chat threads  
**Authorization**: AUTH

**Success Response (200)**:
```json
{
  "threads": [
    {
      "thread_id": "uuid",
      "paps_id": "uuid|null",
      "spap_id": "uuid|null",
      "asap_id": "uuid|null",
      "thread_type": "spap_discussion|asap_discussion|group_chat",
      "created_at": "iso8601-timestamp",
      "updated_at": "iso8601-timestamp"
    }
  ],
  "count": 5
}
```

---

### GET /chat/{thread_id}
**Description**: Get chat thread details  
**Authorization**: AUTH (must be participant or admin)

**Path Parameters**:
- `thread_id`: string (UUID)

**Success Response (200)**:
```json
{
  "thread_id": "uuid",
  "paps_id": "uuid|null",
  "spap_id": "uuid|null",
  "asap_id": "uuid|null",
  "thread_type": "string",
  "participants": [
    {
      "user_id": "uuid",
      "username": "string",
      "role": "applicant|owner|assignee",
      "joined_at": "iso8601-timestamp",
      "left_at": "iso8601-timestamp|null"
    }
  ],
  "created_at": "iso8601-timestamp"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid thread ID format
- **403 Forbidden**: Not a participant or has left the thread
- **404 Not Found**: Thread not found

---

### GET /chat/{thread_id}/messages
**Description**: Get messages in a thread  
**Authorization**: AUTH (must be participant)

**Path Parameters**:
- `thread_id`: string (UUID)

**Query Parameters**:
- `limit`: integer (optional, default: 50, 1-100)
- `offset`: integer (optional, default: 0)

**Success Response (200)**:
```json
{
  "thread_id": "uuid",
  "messages": [
    {
      "message_id": "uuid",
      "thread_id": "uuid",
      "sender_id": "uuid",
      "sender_username": "string",
      "content": "string",
      "message_type": "text|image|video|document|system",
      "attachment_url": "string|null",
      "sent_at": "iso8601-timestamp",
      "is_read": true|false
    }
  ],
  "count": 50,
  "limit": 50,
  "offset": 0
}
```

**Side Effects**:
- Messages are marked as read for the current user

**Error Responses**:
- **400 Bad Request**: Invalid thread ID format or limit/offset values
- **403 Forbidden**: Not a participant or has left
- **404 Not Found**: Thread not found

---

### POST /chat/{thread_id}/messages
**Description**: Send message to thread  
**Authorization**: AUTH (must be participant)  
**Content-Type**: application/json

**Path Parameters**:
- `thread_id`: string (UUID)

**Request Body**:
```json
{
  "content": "string (required, 1-5000 chars)",
  "message_type": "string (optional, default: 'text'): text, image, video, document, system",
  "attachment_url": "string (optional)"
}
```

**Notes**:
- Only admins can send system messages

**Success Response (201)**:
```json
{
  "message_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Content empty/too long or invalid message type
- **403 Forbidden**: Not a participant, has left, or trying to send system message
- **404 Not Found**: Thread not found

---

### PUT /chat/{thread_id}/messages/{message_id}/read
**Description**: Mark a specific message as read  
**Authorization**: AUTH (must be participant)

**Path Parameters**:
- `thread_id`: string (UUID)
- `message_id`: string (UUID)

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid ID format
- **403 Forbidden**: Not a participant

---

### PUT /chat/{thread_id}/read
**Description**: Mark all messages in thread as read  
**Authorization**: AUTH (must be participant)

**Path Parameters**:
- `thread_id`: string (UUID)

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid thread ID format
- **403 Forbidden**: Not a participant

---

### GET /chat/{thread_id}/participants
**Description**: Get thread participants  
**Authorization**: AUTH (must be participant or admin)

**Path Parameters**:
- `thread_id`: string (UUID)

**Success Response (200)**:
```json
{
  "thread_id": "uuid",
  "participants": [...]
}
```

**Error Responses**:
- **400 Bad Request**: Invalid thread ID format
- **403 Forbidden**: Not authorized

---

### DELETE /chat/{thread_id}/leave
**Description**: Leave a chat thread  
**Authorization**: AUTH (must be participant)

**Path Parameters**:
- `thread_id`: string (UUID)

**Success Response (204)**: No content

**Side Effects**:
- Sets left_at timestamp for the participant
- User will no longer receive messages

**Error Responses**:
- **400 Bad Request**: Invalid ID format or already left
- **404 Not Found**: Not a participant

---

### GET /chat/{thread_id}/unread
**Description**: Get unread message count  
**Authorization**: AUTH (must be participant)

**Path Parameters**:
- `thread_id`: string (UUID)

**Success Response (200)**:
```json
{
  "thread_id": "uuid",
  "unread_count": 5
}
```

**Error Responses**:
- **400 Bad Request**: Invalid thread ID format
- **403 Forbidden**: Not a participant

---

### GET /spap/{spap_id}/chat
**Description**: Get chat thread for a SPAP application  
**Authorization**: AUTH (must be applicant, PAPS owner, or admin)

**Path Parameters**:
- `spap_id`: string (UUID)

**Success Response (200)**: Chat thread object

**Error Responses**:
- **400 Bad Request**: Invalid SPAP ID format
- **403 Forbidden**: Not authorized
- **404 Not Found**: SPAP or chat thread not found

---

### GET /asap/{asap_id}/chat
**Description**: Get chat thread for an ASAP assignment  
**Authorization**: AUTH (must be worker, owner, or admin)

**Path Parameters**:
- `asap_id`: string (UUID)

**Success Response (200)**: Chat thread object

**Error Responses**:
- **400 Bad Request**: Invalid ASAP ID format
- **403 Forbidden**: Not authorized
- **404 Not Found**: ASAP or chat thread not found

---

### GET /paps/{paps_id}/chats
**Description**: Get all chat threads for a PAPS  
**Authorization**: AUTH (must be PAPS owner or admin)

**Path Parameters**:
- `paps_id`: string (UUID)

**Success Response (200)**:
```json
{
  "threads": [...],
  "count": 5
}
```

**Error Responses**:
- **400 Bad Request**: Invalid PAPS ID format
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: PAPS not found

---

## Common Error Codes

### 400 Bad Request
- Invalid request parameters
- Validation failed
- Business logic violation

### 401 Unauthorized
- Missing or invalid authentication token
- Invalid credentials

### 403 Forbidden
- Insufficient permissions
- Not resource owner
- Not admin when required

### 404 Not Found
- Resource doesn't exist
- Deleted resource

### 409 Conflict
- Resource already exists
- Duplicate constraint violation

### 413 Payload Too Large
- File upload exceeds size limit

### 415 Unsupported Media Type
- Invalid file type for upload

### 500 Internal Server Error
- Unexpected server error
- Database error

---

## Authentication Flow

1. **Registration**: POST /register → Get user_id
2. **Login**: GET or POST /login → Get JWT token
3. **Authenticated Requests**: Include token in header:
   ```
   Authorization: Bearer {token}
   ```
4. **Token Refresh**: Login again to get new token
5. **Admin Routes**: Require `is_admin=true` in user record

---

## Media Upload Guidelines

### Avatar
- **Types**: PNG, JPEG, JPG, GIF, WEBP
- **Max Size**: 5 MB
- **Compression**: Automatic
- **Storage**: `media/user/profile/{user_id}.{ext}`

### Category Icon
- **Types**: PNG, JPEG, JPG, GIF, WEBP, SVG
- **Max Size**: 1 MB
- **Storage**: `media/category/{category_id}.{ext}`

### PAPS Media
- **Types**: PNG, JPEG, JPG, GIF, WEBP, MP4, MOV, PDF
- **Max Size**: 50 MB
- **Compression**: Automatic for images
- **Storage**: `media/post/{media_id}.{ext}`

### SPAP Media
- **Types**: PNG, JPEG, JPG, GIF, WEBP, PDF
- **Max Size**: 10 MB
- **Compression**: Automatic for images
- **Storage**: `media/spap/{media_id}.{ext}`

### ASAP Media
- **Types**: PNG, JPEG, JPG, GIF, WEBP, MP4, MOV, PDF
- **Max Size**: 50 MB
- **Compression**: Automatic for images
- **Storage**: `media/asap/{media_id}.{ext}`

---

This documentation covers all API routes in the Underboss backend system. For implementation details, see the source code in `/api/` directory.
