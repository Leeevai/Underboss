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
**Description**: Health check endpoint (testing only)  
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
    "flask": "version",
    "...": "other-package-versions"
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
{
  "user": "username-or-email-or-phone"
}
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

**Security**:
- Flask automatically handles path traversal protection
- Media URLs are returned by API endpoints after authorization checks
- Files are stored with UUID-based names to prevent enumeration

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
- `date_of_birth`: ISO 8601 date format (YYYY-MM-DD), cannot be in future

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
    "job_title": "string",
    "company_name": "string",
    "location": "string|null",
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD|null",
    "description": "string|null",
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
  "job_title": "string (required)",
  "company_name": "string (required)",
  "location": "string (optional)",
  "start_date": "YYYY-MM-DD (required)",
  "end_date": "YYYY-MM-DD (optional, must be after start_date)",
  "description": "string (optional)"
}
```

**Validation Rules**:
- `start_date`: ISO 8601 date, cannot be in future
- `end_date`: Must be after start_date if provided

**Success Response (201)**:
```json
{
  "experience_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid date format or end_date before start_date

---

### PUT /profile/experiences/{experience_id}
**Description**: Update specific work experience  
**Authorization**: AUTH

**Path Parameters**:
- `experience_id`: string (UUID)

**Request Body**: Same as POST /profile/experiences

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid date validation
- **403 Forbidden**: Not your experience
- **404 Not Found**: Experience not found

---

### DELETE /profile/experiences/{experience_id}
**Description**: Delete specific work experience  
**Authorization**: AUTH

**Path Parameters**:
- `experience_id`: string (UUID)

**Success Response (204)**: No content

**Error Responses**:
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
    "interest_id": "uuid",
    "user_id": "uuid",
    "category_id": "uuid",
    "category_name": "string",
    "category_slug": "string",
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
  "category_id": "uuid (required)"
}
```

**Success Response (201)**:
```json
{
  "interest_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Category not found
- **409 Conflict**: Interest already exists

---

### DELETE /profile/interests/{interest_id}
**Description**: Remove category interest  
**Authorization**: AUTH

**Path Parameters**:
- `interest_id`: string (UUID)

**Success Response (204)**: No content

**Error Responses**:
- **403 Forbidden**: Not your interest
- **404 Not Found**: Interest not found

---

### GET /user/{username}/profile
**Description**: Get another user's public profile  
**Authorization**: OPEN  
**Authentication**: None

**Path Parameters**:
- `username`: string - Username to look up

**Success Response (200)**: Same structure as GET /profile

**Error Responses**:
- **404 Not Found**: User not found

**Note**: User avatars are served statically at `/media/user/profile/{user_id}.{ext}`. Get user profile first to obtain the avatar URL.

---

### GET /user/{username}/profile/experiences
**Description**: Get another user's work experiences  
**Authorization**: OPEN

**Path Parameters**:
- `username`: string

**Success Response (200)**: Array of experience objects

---

### GET /user/{username}/profile/interests
**Description**: Get another user's category interests  
**Authorization**: OPEN

**Path Parameters**:
- `username`: string

**Success Response (200)**: Array of interest objects

---

## Category Management

### GET /categories
**Description**: Get all active categories  
**Authorization**: OPEN

**Query Parameters**:
- `parent_id`: string (UUID, optional) - Filter by parent category
- `active_only`: boolean (optional, default: true) - Show only active categories

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
    "display_order": 0,
    "created_at": "iso8601-timestamp",
    "updated_at": "iso8601-timestamp"
  }
]
```

---

### POST /categories
**Description**: Create new category (admin only)  
**Authorization**: ADMIN  
**Content-Type**: application/json

**Request Body**:
```json
{
  "name": "string (required, 1-100 chars)",
  "slug": "string (optional, auto-generated from name)",
  "description": "string (optional, max 500 chars)",
  "icon_url": "string (optional)",
  "parent_id": "uuid (optional)",
  "is_active": "boolean (optional, default: true)",
  "display_order": "integer (optional, default: 0)"
}
```

**Validation Rules**:
- `name`: 1-100 characters
- `slug`: Lowercase, alphanumeric + hyphens only
- `description`: Max 500 characters
- `parent_id`: Must exist if provided

**Success Response (201)**:
```json
{
  "category_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid validation
- **409 Conflict**: Category with slug already exists

---

### GET /categories/{category_id}
**Description**: Get specific category details  
**Authorization**: OPEN

**Path Parameters**:
- `category_id`: string (UUID)

**Success Response (200)**: Category object

**Error Responses**:
- **404 Not Found**: Category not found

---

### PUT /categories/{category_id}
**Description**: Update category (admin only)  
**Authorization**: ADMIN

**Path Parameters**:
- `category_id`: string (UUID)

**Request Body**: Same as POST /categories

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid validation
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
- Cascades to delete subcategories if no RESTRICT constraint

**Error Responses**:
- **400 Bad Request**: Category has active PAPS or children
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
- Max size: 2 MB

**Success Response (201)**:
```json
{
  "icon_url": "/media/category/{category_id}.{ext}"
}
```

**Note**: Category icons are served statically at the provided `icon_url`.

**Error Responses**:
- **404 Not Found**: Category not found
- **413 Payload Too Large**: File exceeds 2 MB
- **415 Unsupported Media Type**: Invalid file type

---

## Job Postings (PAPS)

### GET /paps
**Description**: Get all job postings with filters  
**Authorization**: OPEN

**Query Parameters**:
- `status`: string (optional) - Filter by status: "draft", "published", "closed", "expired"
- `owner_id`: string UUID (optional) - Filter by owner
- `category_id`: string UUID (optional) - Filter by category
- `location_lat`: float (optional) - Location latitude for radius search
- `location_lng`: float (optional) - Location longitude for radius search
- `radius_km`: float (optional, default: 10) - Search radius in kilometers
- `search`: string (optional) - Text search in title and description
- `min_payment`: float (optional) - Minimum payment amount
- `max_payment`: float (optional) - Maximum payment amount
- `payment_currency`: string (optional, default: "USD") - Currency filter
- `sort_by`: string (optional) - Sort field: "created_at", "payment_amount", "distance"
- `sort_order`: string (optional, default: "desc") - Sort order: "asc", "desc"
- `limit`: integer (optional, default: 50) - Max results
- `offset`: integer (optional, default: 0) - Pagination offset

**Success Response (200)**:
```json
{
  "paps": [
    {
      "paps_id": "uuid",
      "owner_id": "uuid",
      "owner_username": "string",
      "title": "string",
      "description": "string",
      "status": "published",
      "location_address": "string|null",
      "location_lat": "float|null",
      "location_lng": "float|null",
      "payment_amount": "float|null",
      "payment_currency": "USD",
      "created_at": "iso8601-timestamp",
      "updated_at": "iso8601-timestamp",
      "published_at": "iso8601-timestamp|null",
      "expires_at": "iso8601-timestamp|null",
      "categories": ["category1", "category2"],
      "media_count": 3,
      "distance_km": 5.2
    }
  ],
  "total": 123,
  "limit": 50,
  "offset": 0
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
  "title": "string (required, 5-200 chars)",
  "description": "string (required, 10-5000 chars)",
  "status": "string (optional, default: 'draft')",
  "location_address": "string (optional, max 500 chars)",
  "location_lat": "float (optional, -90 to 90)",
  "location_lng": "float (optional, -180 to 180)",
  "payment_amount": "float (optional, > 0)",
  "payment_currency": "string (optional, default: 'USD', 3 chars)",
  "expires_at": "iso8601-timestamp (optional)",
  "category_ids": ["uuid"] (optional, array of category UUIDs),
  "schedule": [
    {
      "start_time": "iso8601-timestamp (required)",
      "end_time": "iso8601-timestamp (required)",
      "is_recurring": "boolean (optional, default: false)",
      "recurrence_pattern": "string (optional): daily, weekly, monthly"
    }
  ]
}
```

**Validation Rules**:
- `title`: 5-200 characters
- `description`: 10-5000 characters
- `status`: "draft", "published", "closed", or "expired"
- `location_lat`: -90 to 90
- `location_lng`: -180 to 180
- `payment_amount`: Must be positive
- `payment_currency`: 3-letter code (USD, EUR, etc.)
- `expires_at`: Must be in future
- `category_ids`: Each must be valid category UUID
- `schedule.end_time`: Must be after start_time

**Success Response (201)**:
```json
{
  "paps_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed
- **404 Not Found**: Category not found

---

### GET /paps/{paps_id}
**Description**: Get specific job posting details  
**Authorization**: OPEN

**Path Parameters**:
- `paps_id`: string (UUID)

**Success Response (200)**:
```json
{
  "paps_id": "uuid",
  "owner_id": "uuid",
  "owner_username": "string",
  "owner_avatar": "string|null",
  "title": "string",
  "description": "string",
  "status": "published",
  "location_address": "string|null",
  "location_lat": "float|null",
  "location_lng": "float|null",
  "payment_amount": "float|null",
  "payment_currency": "USD",
  "created_at": "iso8601-timestamp",
  "updated_at": "iso8601-timestamp",
  "published_at": "iso8601-timestamp|null",
  "expires_at": "iso8601-timestamp|null",
  "categories": [
    {
      "category_id": "uuid",
      "name": "string",
      "slug": "string",
      "is_primary": true|false
    }
  ],
  "media": [
    {
      "media_id": "uuid",
      "file_url": "string",
      "file_type": "string",
      "file_size": 123456,
      "uploaded_at": "iso8601-timestamp"
    }
  ],
  "schedule": [
    {
      "schedule_id": "uuid",
      "start_time": "iso8601-timestamp",
      "end_time": "iso8601-timestamp",
      "is_recurring": true|false,
      "recurrence_pattern": "weekly|null"
    }
  ],
  "application_count": 5,
  "assignment_count": 1
}
```

**Error Responses**:
- **404 Not Found**: PAPS not found

---

### PUT /paps/{paps_id}
**Description**: Update job posting  
**Authorization**: AUTH (must be owner or admin)

**Path Parameters**:
- `paps_id`: string (UUID)

**Request Body**: Same as POST /paps

**Success Response (204)**: No content

**Error Responses**:
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: PAPS not found

---

### PATCH /paps/{paps_id}
**Description**: Partially update job posting  
**Authorization**: AUTH (must be owner or admin)

**Path Parameters**:
- `paps_id`: string (UUID)

**Request Body**: Same as POST /paps, all fields optional

**Success Response (204)**: No content

**Error Responses**:
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: PAPS not found

---

### DELETE /paps/{paps_id}
**Description**: Delete job posting  
**Authorization**: AUTH (must be owner) or ADMIN

**Path Parameters**:
- `paps_id`: string (UUID)

**Success Response (204)**: No content

**Side Effects**:
- Soft delete (sets deleted_at timestamp)
- Deletes all media files from disk
- Cascades to delete SPAPs, ASAPs, comments, etc.

**Error Responses**:
- **400 Bad Request**: Cannot delete PAPS with active payments (delete payments first)
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: PAPS not found

---

### POST /paps/{paps_id}/media
**Description**: Upload media file for job posting  
**Authorization**: AUTH (must be owner)  
**Content-Type**: multipart/form-data

**Path Parameters**:
- `paps_id`: string (UUID)

**Request**:
```
Content-Type: multipart/form-data

file: [binary file data]
```

**Validation Rules**:
- Allowed types: PNG, JPEG, JPG, GIF, WEBP, MP4, MOV, PDF
- Max size: 50 MB
- Max 10 media files per PAPS

**Success Response (201)**:
```json
{
  "uploaded_media": [
    {
      "media_id": "uuid",
      "media_url": "/media/post/{media_id}.{ext}",
      "media_type": "image|video|document",
      "file_size_bytes": 123456,
      "display_order": 1
    }
  ],
  "count": 1
}
```

**Note**: Media files are served statically at the provided `media_url`.

**Error Responses**:
- **400 Bad Request**: Max media limit reached or no file provided
- **403 Forbidden**: Not owner
- **413 Payload Too Large**: File exceeds 50 MB
- **415 Unsupported Media Type**: Invalid file type

---

### DELETE /paps/{paps_id}/media/{media_id}
**Description**: Delete media file from job posting  
**Authorization**: AUTH (must be owner) or ADMIN

**Path Parameters**:
- `paps_id`: string (UUID)
- `media_id`: string (UUID)

**Success Response (204)**: No content

**Side Effects**:
- Deletes file from disk

**Error Responses**:
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: Media not found

---

### GET /paps/{paps_id}/schedule
**Description**: Get job posting schedule  
**Authorization**: OPEN

**Path Parameters**:
- `paps_id`: string (UUID)

**Success Response (200)**:
```json
[
  {
    "schedule_id": "uuid",
    "paps_id": "uuid",
    "start_time": "iso8601-timestamp",
    "end_time": "iso8601-timestamp",
    "is_recurring": true|false,
    "recurrence_pattern": "weekly|null",
    "created_at": "iso8601-timestamp",
    "updated_at": "iso8601-timestamp"
  }
]
```

---

### POST /paps/{paps_id}/schedule
**Description**: Add schedule entry for job posting  
**Authorization**: AUTH (must be owner)

**Path Parameters**:
- `paps_id`: string (UUID)

**Request Body**:
```json
{
  "start_time": "iso8601-timestamp (required)",
  "end_time": "iso8601-timestamp (required)",
  "is_recurring": "boolean (optional, default: false)",
  "recurrence_pattern": "string (optional): daily, weekly, monthly"
}
```

**Validation Rules**:
- `end_time` must be after `start_time`

**Success Response (201)**:
```json
{
  "schedule_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: end_time before start_time
- **403 Forbidden**: Not owner
- **404 Not Found**: PAPS not found

---

### DELETE /paps/{paps_id}/schedule/{schedule_id}
**Description**: Delete schedule entry  
**Authorization**: AUTH (must be owner) or ADMIN

**Path Parameters**:
- `paps_id`: string (UUID)
- `schedule_id`: string (UUID)

**Success Response (204)**: No content

**Error Responses**:
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: Schedule entry not found

---

## Applications (SPAP)

### GET /spaps
**Description**: Get job applications with filters  
**Authorization**: AUTH

**Query Parameters**:
- `paps_id`: string UUID (optional) - Filter by job posting
- `applicant_id`: string UUID (optional) - Filter by applicant
- `status`: string (optional) - Filter by status: "pending", "accepted", "rejected", "withdrawn"

**Success Response (200)**:
```json
{
  "spaps": [
    {
      "spap_id": "uuid",
      "paps_id": "uuid",
      "paps_title": "string",
      "applicant_id": "uuid",
      "applicant_username": "string",
      "applicant_avatar": "string|null",
      "status": "pending",
      "message": "string|null",
      "applied_at": "iso8601-timestamp"
    }
  ]
}
```

---

### POST /spaps
**Description**: Apply for a job posting  
**Authorization**: AUTH  
**Content-Type**: application/json

**Request Body**:
```json
{
  "paps_id": "uuid (required)",
  "message": "string (optional, application message/cover letter)"
}
```

**Validation Rules**:
- Cannot apply to your own PAPS
- Cannot apply twice to same PAPS
- PAPS must be in "published" status

**Success Response (201)**:
```json
{
  "spap_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Cannot apply to own PAPS or already applied
- **404 Not Found**: PAPS not found or not published

---

### GET /spaps/{spap_id}
**Description**: Get specific application details  
**Authorization**: AUTH (must be applicant or PAPS owner or admin)

**Path Parameters**:
- `spap_id`: string (UUID)

**Success Response (200)**:
```json
{
  "spap_id": "uuid",
  "paps_id": "uuid",
  "paps_title": "string",
  "paps_description": "string",
  "applicant_id": "uuid",
  "applicant_username": "string",
  "applicant_avatar": "string|null",
  "applicant_email": "string",
  "applicant_phone": "string|null",
  "status": "pending",
  "message": "string|null",
  "applied_at": "iso8601-timestamp",
  "media": [
    {
      "media_id": "uuid",
      "file_url": "string",
      "file_type": "string"
    }
  ]
}
```

**Error Responses**:
- **403 Forbidden**: Not authorized to view
- **404 Not Found**: SPAP not found

---

### PATCH /spaps/{spap_id}
**Description**: Update application status or message  
**Authorization**: AUTH (applicant to update message, PAPS owner to update status)

**Path Parameters**:
- `spap_id`: string (UUID)

**Request Body**:
```json
{
  "status": "string (optional): pending, accepted, rejected, withdrawn",
  "message": "string (optional, application message)"
}
```

**Validation Rules**:
- Only applicant can update `message`
- Only PAPS owner can update `status` to "accepted" or "rejected"
- Only applicant can set status to "withdrawn"

**Success Response (204)**: No content

**Error Responses**:
- **403 Forbidden**: Not authorized
- **404 Not Found**: SPAP not found

---

### DELETE /spaps/{spap_id}
**Description**: Delete/withdraw application  
**Authorization**: AUTH (must be applicant) or ADMIN

**Path Parameters**:
- `spap_id`: string (UUID)

**Success Response (204)**: No content

**Side Effects**:
- Soft delete (sets deleted_at)
- Deletes all SPAP media files

**Error Responses**:
- **403 Forbidden**: Not applicant or admin
- **404 Not Found**: SPAP not found

---

### POST /spaps/{spap_id}/media
**Description**: Upload media for application  
**Authorization**: AUTH (must be applicant)  
**Content-Type**: multipart/form-data

**Path Parameters**:
- `spap_id`: string (UUID)

**Request**: Same format as PAPS media upload

**Validation Rules**:
- Allowed types: PNG, JPEG, JPG, GIF, WEBP, PDF
- Max size: 10 MB
- Max 5 media files per SPAP

**Success Response (201)**:
```json
{
  "uploaded_media": [
    {
      "media_id": "uuid",
      "media_url": "/media/spap/{media_id}.{ext}",
      "media_type": "image|video|document",
      "file_size_bytes": 123456,
      "display_order": 1
    }
  ],
  "count": 1
}
```

**Note**: Media files are served statically at the provided `media_url`.

**Error Responses**:
- **400 Bad Request**: Max media limit reached
- **403 Forbidden**: Not applicant
- **413 Payload Too Large**: File exceeds 10 MB
- **415 Unsupported Media Type**: Invalid file type

---

## Assignments (ASAP)

### GET /asaps
**Description**: Get job assignments with filters  
**Authorization**: AUTH

**Query Parameters**:
- `paps_id`: string UUID (optional) - Filter by job posting
- `accepted_user_id`: string UUID (optional) - Filter by accepted user
- `status`: string (optional) - Filter by status: "active", "in_progress", "completed", "cancelled", "disputed"

**Success Response (200)**:
```json
{
  "asaps": [
    {
      "asap_id": "uuid",
      "paps_id": "uuid",
      "paps_title": "string",
      "accepted_user_id": "uuid",
      "accepted_username": "string",
      "status": "in_progress",
      "assigned_at": "iso8601-timestamp",
      "started_at": "iso8601-timestamp|null",
      "completed_at": "iso8601-timestamp|null"
    }
  ]
}
```

---

### POST /asaps
**Description**: Create assignment from accepted application  
**Authorization**: AUTH (must be PAPS owner)  
**Content-Type**: application/json

**Request Body**:
```json
{
  "paps_id": "uuid (required)",
  "accepted_user_id": "uuid (required)"
}
```

**Validation Rules**:
- User must be PAPS owner
- accepted_user_id must have an accepted SPAP for this PAPS
- PAPS must be in "published" status

**Success Response (201)**:
```json
{
  "asap_id": "uuid"
}
```

**Side Effects**:
- Creates assignment with status "active"
- Links accepted user to PAPS

**Error Responses**:
- **400 Bad Request**: User has no accepted SPAP or validation failed
- **403 Forbidden**: Not PAPS owner
- **404 Not Found**: PAPS or user not found

---

### GET /asaps/{asap_id}
**Description**: Get specific assignment details  
**Authorization**: AUTH (must be involved user or admin)

**Path Parameters**:
- `asap_id`: string (UUID)

**Success Response (200)**:
```json
{
  "asap_id": "uuid",
  "paps_id": "uuid",
  "paps_title": "string",
  "paps_description": "string",
  "paps_location": "string|null",
  "paps_payment_amount": "float|null",
  "paps_payment_currency": "USD",
  "accepted_user_id": "uuid",
  "accepted_username": "string",
  "accepted_user_email": "string",
  "accepted_user_phone": "string|null",
  "status": "in_progress",
  "assigned_at": "iso8601-timestamp",
  "started_at": "iso8601-timestamp|null",
  "completed_at": "iso8601-timestamp|null",
  "media": [
    {
      "media_id": "uuid",
      "file_url": "string",
      "file_type": "string"
    }
  ]
}
```

**Error Responses**:
- **403 Forbidden**: Not involved in assignment
- **404 Not Found**: ASAP not found

---

### PATCH /asaps/{asap_id}
**Description**: Update assignment status  
**Authorization**: AUTH (must be owner or accepted user)

**Path Parameters**:
- `asap_id`: string (UUID)

**Request Body**:
```json
{
  "status": "string (required): active, in_progress, completed, cancelled, disputed"
}
```

**Validation Rules**:
- Owner can set: "active", "in_progress", "completed", "cancelled", "disputed"
- Accepted user can set: "in_progress", "completed"
- Cannot change status of already completed assignment

**Success Response (204)**: No content

**Side Effects**:
- If status set to "completed" and PAPS has payment_amount:
  - Automatically creates payment record
  - Payment links to PAPS (paps_id)
  - Payer: PAPS owner
  - Payee: Accepted user
  - Amount/Currency: From PAPS

**Error Responses**:
- **400 Bad Request**: Invalid status transition
- **403 Forbidden**: Not authorized
- **404 Not Found**: ASAP not found

---

### DELETE /asaps/{asap_id}
**Description**: Delete assignment  
**Authorization**: AUTH (must be owner) or ADMIN

**Path Parameters**:
- `asap_id`: string (UUID)

**Success Response (204)**: No content

**Side Effects**:
- Soft delete (sets deleted_at)
- Deletes all ASAP media files
- Can be deleted after payments are removed (PAYMENT→PAPS RESTRICT allows ASAP deletion)

**Error Responses**:
- **403 Forbidden**: Not owner or admin
- **404 Not Found**: ASAP not found

---

### POST /asaps/{asap_id}/media
**Description**: Upload media for assignment (proof of work)  
**Authorization**: AUTH (must be accepted user or owner)  
**Content-Type**: multipart/form-data

**Path Parameters**:
- `asap_id`: string (UUID)

**Request**: Same format as PAPS media upload

**Validation Rules**:
- Allowed types: PNG, JPEG, JPG, GIF, WEBP, MP4, MOV, PDF
- Max size: 50 MB
- Max 20 media files per ASAP

**Success Response (201)**:
```json
{
  "uploaded_media": [
    {
      "media_id": "uuid",
      "media_url": "/media/asap/{media_id}.{ext}",
      "media_type": "image|video|document",
      "file_size_bytes": 123456,
      "display_order": 1
    }
  ],
  "count": 1
}
```

**Note**: Media files are served statically at the provided `media_url`.

**Error Responses**:
- **400 Bad Request**: Max media limit reached
- **403 Forbidden**: Not involved in assignment
- **413 Payload Too Large**: File exceeds 50 MB
- **415 Unsupported Media Type**: Invalid file type

---

## Payment Management

### GET /paps/{paps_id}/payments
**Description**: Get all payments for a job posting  
**Authorization**: AUTH (must be PAPS owner or admin)

**Path Parameters**:
- `paps_id`: string (UUID)

**Success Response (200)**:
```json
{
  "payments": [
    {
      "payment_id": "uuid",
      "paps_id": "uuid",
      "paps_title": "string",
      "payer_id": "uuid",
      "payer_username": "string",
      "payee_id": "uuid",
      "payee_username": "string",
      "amount": 100.50,
      "currency": "USD",
      "status": "pending",
      "payment_method": "string|null",
      "transaction_id": "string|null",
      "created_at": "iso8601-timestamp",
      "updated_at": "iso8601-timestamp",
      "completed_at": "iso8601-timestamp|null"
    }
  ]
}
```

**Error Responses**:
- **403 Forbidden**: Not PAPS owner or admin
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
  "currency": "string (optional, default: 'USD', 3 chars)",
  "payment_method": "string (optional): card, bank_transfer, cash, paypal, etc.",
  "transaction_id": "string (optional) - External transaction reference"
}
```

**Validation Rules**:
- `amount`: Must be positive
- `currency`: 3-letter code (USD, EUR, etc.)
- `payee_id`: Must be valid user UUID
- PAPS must exist (RESTRICT constraint)
- Payer: Automatically set to PAPS owner (current user)

**Success Response (201)**:
```json
{
  "payment_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid amount or validation failed
- **403 Forbidden**: Not PAPS owner
- **404 Not Found**: PAPS or payee not found

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
  "paps_title": "string",
  "payer_id": "uuid",
  "payer_username": "string",
  "payer_email": "string",
  "payee_id": "uuid",
  "payee_username": "string",
  "payee_email": "string",
  "amount": 100.50,
  "currency": "USD",
  "status": "pending",
  "payment_method": "card",
  "transaction_id": "ext_txn_123",
  "created_at": "iso8601-timestamp",
  "updated_at": "iso8601-timestamp",
  "completed_at": "iso8601-timestamp|null"
}
```

**Error Responses**:
- **403 Forbidden**: Not involved in payment
- **404 Not Found**: Payment not found

---

### PATCH /payments/{payment_id}
**Description**: Update payment status  
**Authorization**: AUTH (must be payer or admin)

**Path Parameters**:
- `payment_id`: string (UUID)

**Request Body**:
```json
{
  "status": "string (optional): pending, processing, completed, failed, refunded",
  "payment_method": "string (optional)",
  "transaction_id": "string (optional)"
}
```

**Validation Rules**:
- Only payer or admin can update payment
- Status transitions: pending → processing → completed/failed
- Completed payments cannot be modified (except for refunded)

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid status transition
- **403 Forbidden**: Not payer or admin
- **404 Not Found**: Payment not found

---

### DELETE /payments/{payment_id}
**Description**: Delete payment record  
**Authorization**: ADMIN only

**Path Parameters**:
- `payment_id`: string (UUID)

**Success Response (204)**: No content

**Important**:
- Must delete payments before deleting PAPS (RESTRICT constraint)
- Soft delete (sets deleted_at timestamp)

**Error Responses**:
- **403 Forbidden**: Not admin
- **404 Not Found**: Payment not found

---

### GET /user/payments
**Description**: Get current user's payments (as payer or payee)  
**Authorization**: AUTH

**Query Parameters**:
- `role`: string (optional) - Filter by role: "payer", "payee"
- `status`: string (optional) - Filter by status: "pending", "completed", etc.

**Success Response (200)**:
```json
{
  "payments": [
    {
      "payment_id": "uuid",
      "paps_id": "uuid",
      "paps_title": "string",
      "payer_id": "uuid",
      "payer_username": "string",
      "payee_id": "uuid",
      "payee_username": "string",
      "amount": 100.50,
      "currency": "USD",
      "status": "completed",
      "payment_method": "card",
      "created_at": "iso8601-timestamp",
      "completed_at": "iso8601-timestamp"
    }
  ]
}
```

---

## Rating System

### GET /ratings/{user_id}
**Description**: Get ratings for a specific user  
**Authorization**: OPEN

**Path Parameters**:
- `user_id`: string (UUID or username)

**Success Response (200)**:
```json
{
  "user_id": "uuid",
  "username": "string",
  "average_rating": 4.5,
  "total_ratings": 23,
  "ratings": [
    {
      "rating_id": "uuid",
      "paps_id": "uuid",
      "paps_title": "string",
      "rater_id": "uuid",
      "rater_username": "string",
      "rated_user_id": "uuid",
      "rating": 5,
      "review": "Excellent work!",
      "created_at": "iso8601-timestamp"
    }
  ]
}
```

---

### POST /ratings
**Description**: Create rating for completed job  
**Authorization**: AUTH  
**Content-Type**: application/json

**Request Body**:
```json
{
  "paps_id": "uuid (required)",
  "rated_user_id": "uuid (required)",
  "rating": "integer (required, 1-5)",
  "review": "string (optional, max 1000 chars)"
}
```

**Validation Rules**:
- `rating`: Integer between 1 and 5
- PAPS must exist and be completed
- Must be involved in the job (owner or worker)
- Cannot rate yourself
- Can only rate once per PAPS
- `review`: Max 1000 characters

**Success Response (201)**:
```json
{
  "rating_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid rating value or validation failed
- **403 Forbidden**: Not involved in job or already rated
- **404 Not Found**: PAPS or rated user not found

---

### GET /ratings/{rating_id}
**Description**: Get specific rating details  
**Authorization**: OPEN

**Path Parameters**:
- `rating_id`: string (UUID)

**Success Response (200)**:
```json
{
  "rating_id": "uuid",
  "paps_id": "uuid",
  "paps_title": "string",
  "rater_id": "uuid",
  "rater_username": "string",
  "rater_avatar": "string|null",
  "rated_user_id": "uuid",
  "rated_username": "string",
  "rating": 5,
  "review": "Excellent work!",
  "created_at": "iso8601-timestamp"
}
```

**Error Responses**:
- **404 Not Found**: Rating not found

---

### PATCH /ratings/{rating_id}
**Description**: Update your rating  
**Authorization**: AUTH (must be rater)

**Path Parameters**:
- `rating_id`: string (UUID)

**Request Body**:
```json
{
  "rating": "integer (optional, 1-5)",
  "review": "string (optional, max 1000 chars)"
}
```

**Success Response (204)**: No content

**Error Responses**:
- **400 Bad Request**: Invalid rating value
- **403 Forbidden**: Not your rating
- **404 Not Found**: Rating not found

---

### DELETE /ratings/{rating_id}
**Description**: Delete rating  
**Authorization**: AUTH (must be rater) or ADMIN

**Path Parameters**:
- `rating_id`: string (UUID)

**Success Response (204)**: No content

**Error Responses**:
- **403 Forbidden**: Not your rating or admin
- **404 Not Found**: Rating not found

---

## Comment System

### GET /paps/{paps_id}/comments
**Description**: Get comments for a job posting  
**Authorization**: OPEN

**Path Parameters**:
- `paps_id`: string (UUID)

**Query Parameters**:
- `parent_id`: string UUID (optional) - Filter by parent comment (for replies)
- `limit`: integer (optional, default: 50)
- `offset`: integer (optional, default: 0)

**Success Response (200)**:
```json
{
  "comments": [
    {
      "comment_id": "uuid",
      "paps_id": "uuid",
      "user_id": "uuid",
      "username": "string",
      "user_avatar": "string|null",
      "parent_id": "uuid|null",
      "content": "string",
      "created_at": "iso8601-timestamp",
      "updated_at": "iso8601-timestamp",
      "reply_count": 3,
      "is_deleted": false
    }
  ],
  "total": 15
}
```

---

### POST /paps/{paps_id}/comments
**Description**: Create comment on job posting  
**Authorization**: AUTH  
**Content-Type**: application/json

**Path Parameters**:
- `paps_id`: string (UUID)

**Request Body**:
```json
{
  "content": "string (required, 1-2000 chars)",
  "parent_id": "uuid (optional) - Reply to another comment"
}
```

**Validation Rules**:
- `content`: 1-2000 characters
- `parent_id`: Must be valid comment on same PAPS if provided

**Success Response (201)**:
```json
{
  "comment_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Content too short/long or invalid parent
- **404 Not Found**: PAPS or parent comment not found

---

### GET /comments/{comment_id}
**Description**: Get specific comment  
**Authorization**: OPEN

**Path Parameters**:
- `comment_id`: string (UUID)

**Success Response (200)**:
```json
{
  "comment_id": "uuid",
  "paps_id": "uuid",
  "paps_title": "string",
  "user_id": "uuid",
  "username": "string",
  "user_avatar": "string|null",
  "parent_id": "uuid|null",
  "content": "string",
  "created_at": "iso8601-timestamp",
  "updated_at": "iso8601-timestamp",
  "is_deleted": false,
  "replies": [
    {
      "comment_id": "uuid",
      "user_id": "uuid",
      "username": "string",
      "content": "string",
      "created_at": "iso8601-timestamp"
    }
  ]
}
```

**Error Responses**:
- **404 Not Found**: Comment not found

---

### PATCH /comments/{comment_id}
**Description**: Update your comment  
**Authorization**: AUTH (must be comment author)

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
- **400 Bad Request**: Content validation failed
- **403 Forbidden**: Not your comment
- **404 Not Found**: Comment not found

---

### DELETE /comments/{comment_id}
**Description**: Delete comment  
**Authorization**: AUTH (must be author, PAPS owner, or admin)

**Path Parameters**:
- `comment_id`: string (UUID)

**Success Response (204)**: No content

**Side Effects**:
- Soft delete (sets deleted_at and is_deleted=true)
- Content replaced with "[deleted]"
- Preserves tree structure (replies remain)

**Error Responses**:
- **403 Forbidden**: Not authorized
- **404 Not Found**: Comment not found

---

## Chat System

### GET /chats
**Description**: Get current user's chat threads  
**Authorization**: AUTH

**Query Parameters**:
- `paps_id`: string UUID (optional) - Filter by job posting
- `unread_only`: boolean (optional) - Show only threads with unread messages

**Success Response (200)**:
```json
{
  "threads": [
    {
      "thread_id": "uuid",
      "paps_id": "uuid|null",
      "paps_title": "string|null",
      "spap_id": "uuid|null",
      "asap_id": "uuid|null",
      "participants": [
        {
          "user_id": "uuid",
          "username": "string",
          "avatar_url": "string|null"
        }
      ],
      "last_message": {
        "message_id": "uuid",
        "sender_id": "uuid",
        "sender_username": "string",
        "content": "string",
        "sent_at": "iso8601-timestamp"
      },
      "unread_count": 3,
      "created_at": "iso8601-timestamp",
      "updated_at": "iso8601-timestamp"
    }
  ]
}
```

---

### POST /chats
**Description**: Create new chat thread  
**Authorization**: AUTH  
**Content-Type**: application/json

**Request Body**:
```json
{
  "participant_ids": ["uuid"] (required, array of user UUIDs),
  "paps_id": "uuid (optional) - Associate with job posting",
  "spap_id": "uuid (optional) - Associate with application",
  "asap_id": "uuid (optional) - Associate with assignment",
  "initial_message": "string (optional) - First message content"
}
```

**Validation Rules**:
- At least 1 participant (excluding yourself)
- Max 10 participants per thread
- Cannot create duplicate threads with same participants

**Success Response (201)**:
```json
{
  "thread_id": "uuid"
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed or duplicate thread
- **404 Not Found**: Participant not found

---

### GET /chats/{thread_id}
**Description**: Get chat thread details  
**Authorization**: AUTH (must be participant)

**Path Parameters**:
- `thread_id`: string (UUID)

**Success Response (200)**:
```json
{
  "thread_id": "uuid",
  "paps_id": "uuid|null",
  "paps_title": "string|null",
  "spap_id": "uuid|null",
  "asap_id": "uuid|null",
  "participants": [
    {
      "user_id": "uuid",
      "username": "string",
      "avatar_url": "string|null",
      "joined_at": "iso8601-timestamp"
    }
  ],
  "created_at": "iso8601-timestamp",
  "updated_at": "iso8601-timestamp"
}
```

**Error Responses**:
- **403 Forbidden**: Not a participant
- **404 Not Found**: Thread not found

---

### DELETE /chats/{thread_id}
**Description**: Delete chat thread  
**Authorization**: AUTH (must be participant) or ADMIN

**Path Parameters**:
- `thread_id`: string (UUID)

**Success Response (204)**: No content

**Side Effects**:
- Soft delete (sets deleted_at)
- Deletes all messages in thread

**Error Responses**:
- **403 Forbidden**: Not participant or admin
- **404 Not Found**: Thread not found

---

### GET /chats/{thread_id}/messages
**Description**: Get messages in a thread  
**Authorization**: AUTH (must be participant)

**Path Parameters**:
- `thread_id`: string (UUID)

**Query Parameters**:
- `limit`: integer (optional, default: 50)
- `offset`: integer (optional, default: 0)
- `before`: string timestamp (optional) - Messages before this time
- `after`: string timestamp (optional) - Messages after this time

**Success Response (200)**:
```json
{
  "messages": [
    {
      "message_id": "uuid",
      "thread_id": "uuid",
      "sender_id": "uuid",
      "sender_username": "string",
      "sender_avatar": "string|null",
      "content": "string",
      "sent_at": "iso8601-timestamp",
      "read_by": ["uuid"],
      "is_system_message": false
    }
  ],
  "total": 42
}
```

**Error Responses**:
- **403 Forbidden**: Not a participant
- **404 Not Found**: Thread not found

---

### POST /chats/{thread_id}/messages
**Description**: Send message to thread  
**Authorization**: AUTH (must be participant)  
**Content-Type**: application/json

**Path Parameters**:
- `thread_id`: string (UUID)

**Request Body**:
```json
{
  "content": "string (required, 1-5000 chars)"
}
```

**Validation Rules**:
- `content`: 1-5000 characters
- Must be thread participant

**Success Response (201)**:
```json
{
  "message_id": "uuid"
}
```

**Side Effects**:
- Updates thread's updated_at timestamp
- Increments unread count for other participants

**Error Responses**:
- **400 Bad Request**: Content too short/long
- **403 Forbidden**: Not a participant
- **404 Not Found**: Thread not found

---

### POST /chats/{thread_id}/read
**Description**: Mark messages as read  
**Authorization**: AUTH (must be participant)

**Path Parameters**:
- `thread_id`: string (UUID)

**Request Body**:
```json
{
  "message_ids": ["uuid"] (optional, if omitted marks all as read)
}
```

**Success Response (204)**: No content

**Error Responses**:
- **403 Forbidden**: Not a participant
- **404 Not Found**: Thread not found

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

## Data Lifecycle and Constraints

### Deletion Order (RESTRICT Constraints)
1. **Delete PAYMENT before PAPS**: PAYMENT has RESTRICT constraint on PAPS
2. **Delete PAPS before USER**: Cannot delete user who owns PAPS with payments

### Cascade Deletions
- **PAPS deletion** → Cascades to SPAP, ASAP, COMMENT, CHAT_THREAD
- **SPAP deletion** → Cascades to ASAP (if ASAP references SPAP)
- **USER deletion** → Admin route handles all cascades explicitly

### Soft Deletes
- PAPS, SPAP, ASAP, COMMENT, PAYMENT: Use `deleted_at` timestamp
- Soft-deleted items excluded from normal queries
- Admin can query all items including deleted

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
- **Max Size**: 2 MB
- **Storage**: `media/category/{category_id}.{ext}`

### PAPS Media
- **Types**: PNG, JPEG, JPG, GIF, WEBP, MP4, MOV, PDF
- **Max Size**: 50 MB
- **Max Count**: 10 per PAPS
- **Storage**: `media/paps/{paps_id}/{media_id}.{ext}`

### SPAP Media
- **Types**: PNG, JPEG, JPG, GIF, WEBP, PDF
- **Max Size**: 10 MB
- **Max Count**: 5 per SPAP
- **Storage**: `media/spap/{spap_id}/{media_id}.{ext}`

### ASAP Media
- **Types**: PNG, JPEG, JPG, GIF, WEBP, MP4, MOV, PDF
- **Max Size**: 50 MB
- **Max Count**: 20 per ASAP
- **Storage**: `media/asap/{asap_id}/{media_id}.{ext}`

---

## Rate Limiting (Not Implemented)

Current implementation has no rate limiting. Consider adding:
- **Authentication**: 5 requests/minute per IP
- **Media Upload**: 10 uploads/hour per user
- **API Requests**: 100 requests/minute per user

---

## Pagination

Standard pagination parameters:
- `limit`: Max results per page (default: 50)
- `offset`: Number of results to skip (default: 0)

Response includes:
```json
{
  "results": [...],
  "total": 123,
  "limit": 50,
  "offset": 0
}
```

---

## Search and Filtering

### Text Search
- Case-insensitive
- Searches in multiple fields (title, description, username, etc.)
- Use `%` wildcard in SQL LIKE patterns

### Location Search
- Provides `location_lat`, `location_lng`, `radius_km`
- Returns results within radius
- Includes `distance_km` in response

### Status Filtering
- Most resources have `status` field
- Standard statuses: draft, published, closed, expired, pending, accepted, rejected, etc.

---

This documentation covers all API routes in the Underboss backend system. For implementation details, see the source code in `/api/` directory.
