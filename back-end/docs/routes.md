# Underboss API Documentation

> **Version:** 1.0.0  
> **Last Updated:** January 26, 2026  
> **Base URL:** `http://localhost:5000` (development)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [Error Handling](#error-handling)
5. [API Routes](#api-routes)
   - [System & Health](#system--health)
   - [Authentication & Registration](#authentication--registration)
   - [User Profile](#user-profile)
   - [Profile Avatar](#profile-avatar)
   - [User Experiences](#user-experiences)
   - [User Interests](#user-interests)
   - [Categories](#categories)
   - [Category Icons](#category-icons)
   - [PAPS (Job Postings)](#paps-job-postings)
   - [PAPS Categories](#paps-categories)
   - [PAPS Media](#paps-media)
   - [Comments](#comments)
   - [Comment Replies](#comment-replies)
   - [SPAP (Applications)](#spap-applications)
   - [SPAP Media](#spap-media)
   - [Admin User Management](#admin-user-management)
6. [Data Types Reference](#data-types-reference)
7. [Frontend Integration Guide](#frontend-integration-guide)

---

## Overview

Underboss is a job posting and application platform. The API enables users to:

- **Create and manage job postings (PAPS)** with media, categories, and location
- **Apply to jobs (SPAP)** with optional attachments
- **Comment on job postings** (Instagram-style with single-level replies)
- **Manage user profiles** with avatars, experiences, and interests
- **Search and filter jobs** by location, price, category, and more

### Architecture

| Module | Base Route | Purpose |
|--------|------------|---------|
| `system.py` | `/uptime`, `/info`, `/stats`, `/who-am-i`, `/myself` | System health and user info |
| `auth.py` | `/register`, `/login` | User registration and authentication |
| `profile.py` | `/profile`, `/user/<username>/profile` | User profile management |
| `category.py` | `/categories` | Category CRUD and icons |
| `paps.py` | `/paps` | Job postings with media |
| `comment.py` | `/paps/<id>/comments`, `/comments` | Instagram-style comments |
| `spap.py` | `/spap`, `/paps/<id>/applications` | Job applications |
| `user.py` | `/users` | Admin user management (testing) |

---

## Authentication

### Methods

The API supports three authentication methods:

| Method | Header/Parameter | Format | Example |
|--------|------------------|--------|---------|
| **Token** | `Authorization: Bearer <token>` | `underboss:username:timestamp:hash` | `Bearer underboss:johndoe:1706000000:abc123` |
| **Basic** | `Authorization: Basic <base64>` | Base64 encoded `login:password` | `Basic am9objpwYXNz` |
| **Param** | Form body | `{"login": "...", "password": "..."}` | `{"login": "john", "password": "pass123"}` |

### Login Identifiers

Users can authenticate using any of these identifiers:
- **Username:** `johndoe`
- **Email:** `john@example.com`
- **Phone:** `+1234567890`

### Authorization Levels

| Level | Description |
|-------|-------------|
| `OPEN` | No authentication required |
| `AUTH` | Any authenticated user |
| `ADMIN` | Admin users only (requires `is_admin: true`) |

---

## Common Patterns

### UUID Format

All entity IDs use UUID v4 format:
```
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Example: 550e8400-e29b-41d4-a716-446655440000
```

### Soft Delete

Deleted resources are marked with a `deleted_at` timestamp rather than being permanently removed. This allows for:
- Data recovery
- Maintaining referential integrity
- Audit trails

### Date/Time Format

All dates use ISO 8601 format:
```
2026-01-26T10:30:00Z
2026-01-26T10:30:00+00:00
```

### Pagination

List endpoints may return paginated results:
```json
{
  "items": [...],
  "count": 25,
  "total_count": 150
}
```

---

## Error Handling

### Error Response Format

All errors follow this structure:
```json
{
  "error": "Human-readable error message"
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| **200** | OK | Successful GET request |
| **201** | Created | Successful POST request |
| **204** | No Content | Successful PUT/PATCH/DELETE |
| **400** | Bad Request | Invalid parameters, validation failure |
| **401** | Unauthorized | Missing or invalid authentication |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Resource doesn't exist or was deleted |
| **409** | Conflict | Duplicate resource (e.g., username taken) |
| **413** | Payload Too Large | File exceeds size limit |
| **415** | Unsupported Media Type | Invalid file type |

### Common Error Messages

| Error | Meaning |
|-------|---------|
| `"Invalid <field> format"` | UUID or other format validation failed |
| `"<Resource> not found"` | Entity doesn't exist or was soft-deleted |
| `"Not authorized to..."` | Permission denied for this action |
| `"<Field> must be at least X characters"` | Validation constraint |
| `"User with this username, email, or phone already exists"` | Duplicate registration |

---

## API Routes

---

## System & Health

### GET /uptime

Check if the server is running. **Only available in testing mode.**

| Property | Value |
|----------|-------|
| **Auth** | None (`OPEN`) |
| **Rate Limit** | None |

**Response 200:**
```json
{
  "app": "underboss",
  "up": "0:05:32.123456"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `app` | string | Application name |
| `up` | string | Time since server started (duration format) |

---

### GET /info

Get detailed system information including versions, database status, and authentication details.

| Property | Value |
|----------|-------|
| **Auth** | Admin only |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sleep` | float | No | 0.0 | Artificial delay for testing (seconds) |

**Response 200:**
```json
{
  "app": "underboss",
  "git": {
    "remote": "origin/main",
    "branch": "main",
    "commit": "abc123def",
    "date": "2026-01-26"
  },
  "authentication": {
    "config": ["token", "basic", "param"],
    "user": "admin",
    "auth": "token"
  },
  "db": {
    "type": "postgresql",
    "driver": "psycopg",
    "version": "15.2"
  },
  "status": {
    "started": "2026-01-26T10:00:00+00:00",
    "now": "2026-01-26T10:05:32+00:00",
    "connections": 5,
    "hits": 1234
  },
  "version": {
    "python": "3.11.0",
    "FlaskSimpleAuth": "1.2.3",
    "postgres": "15.2"
  }
}
```

---

### GET /stats

Get database connection pool statistics.

| Property | Value |
|----------|-------|
| **Auth** | Admin only |

**Response 200:**
```json
{
  "pool_size": 10,
  "active_connections": 3,
  "idle_connections": 7,
  "waiting_requests": 0
}
```

---

### GET /who-am-i

Get the current authenticated user's username.

| Property | Value |
|----------|-------|
| **Auth** | Required (any authenticated user) |

**Response 200:**
```json
"johndoe"
```

---

### GET /myself

Get complete current user data including authentication details.

| Property | Value |
|----------|-------|
| **Auth** | Required (any authenticated user) |

**Response 200:**
```json
{
  "login": "johndoe",
  "password": "$2b$12$hashedpassword...",
  "email": "john@example.com",
  "isadmin": false,
  "aid": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `login` | string | Username |
| `password` | string | Hashed password (never expose to frontend) |
| `email` | string | User's email address |
| `isadmin` | boolean | Whether user has admin privileges |
| `aid` | UUID | User's unique identifier |

---

## Authentication & Registration

### POST /register

Register a new user account.

| Property | Value |
|----------|-------|
| **Auth** | None (`OPEN`) |

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `username` | string | Yes | 3-50 chars, starts with letter, alphanumeric + `-_.` | Unique username |
| `email` | string | Yes | Valid email format | Unique email address |
| `password` | string | Yes | Per server config | Account password |
| `phone` | string | No | E.164 format (e.g., `+1234567890`) | Optional phone number |

**Request Example:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890"
}
```

**Response 201:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Username must be 3-50 characters"` | Username too short or long |
| 400 | `"Username can only contain letters, numbers, hyphens, underscores, and dots. Must start with a letter."` | Invalid username format |
| 400 | `"Invalid email format"` | Email doesn't match regex |
| 400 | `"Invalid phone format"` | Phone doesn't match E.164 format |
| 409 | `"User with this username, email, or phone already exists"` | Duplicate user |

---

### GET /login

Get authentication token using HTTP Basic authentication.

| Property | Value |
|----------|-------|
| **Auth** | Basic Auth (credentials in header) |

**Headers:**
```
Authorization: Basic base64(username:password)
```

**Response 200:**
```json
{
  "token": "underboss:johndoe:1706270000:abc123def456..."
}
```

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 401 | `"Invalid login"` | Wrong username/email/phone or password |

---

### POST /login

Get authentication token using form parameters.

| Property | Value |
|----------|-------|
| **Auth** | None (credentials in body) |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `login` | string | Yes | Username, email, or phone |
| `password` | string | Yes | Account password |

**Request Example:**
```json
{
  "login": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response 201:**
```json
{
  "token": "underboss:johndoe:1706270000:abc123def456..."
}
```

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 401 | `"Invalid login"` | Wrong credentials |

---

## User Profile

### GET /profile

Get the current authenticated user's profile.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Response 200:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "display_name": "John D.",
  "bio": "Software developer passionate about mobile apps",
  "avatar_url": "/media/user/profile/550e8400-e29b-41d4-a716-446655440000.jpg",
  "date_of_birth": "1990-05-15",
  "location_address": "San Francisco, CA",
  "location_lat": 37.7749,
  "location_lng": -122.4194,
  "timezone": "America/Los_Angeles",
  "preferred_language": "en"
}
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `user_id` | UUID | No | User's unique identifier |
| `username` | string | No | Login username |
| `email` | string | No | Email address |
| `first_name` | string | Yes | First name |
| `last_name` | string | Yes | Last name |
| `display_name` | string | Yes | Preferred display name |
| `bio` | string | Yes | User biography/description |
| `avatar_url` | string | No | URL to avatar image (defaults to `/media/user/profile/avatar.png`) |
| `date_of_birth` | date | Yes | Birth date (ISO format) |
| `location_address` | string | Yes | Human-readable address |
| `location_lat` | float | Yes | Latitude (-90 to 90) |
| `location_lng` | float | Yes | Longitude (-180 to 180) |
| `timezone` | string | Yes | IANA timezone (e.g., `America/New_York`) |
| `preferred_language` | string | Yes | Language code (e.g., `en`, `es`, `fr`) |

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 404 | `"Profile not found"` | User has no profile record |

---

### PUT /profile

Replace/update the current user's profile. All provided fields will be updated.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `first_name` | string | No | - | First name |
| `last_name` | string | No | - | Last name |
| `display_name` | string | No | - | Display name |
| `bio` | string | No | - | Biography |
| `date_of_birth` | string | No | ISO date format | Birth date |
| `location_address` | string | No | - | Address text |
| `location_lat` | float | No | -90 to 90 | Latitude (requires `location_lng`) |
| `location_lng` | float | No | -180 to 180 | Longitude (requires `location_lat`) |
| `timezone` | string | No | IANA timezone | Timezone |
| `preferred_language` | string | No | - | Language code |

**Request Example:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "bio": "Updated bio text",
  "location_lat": 37.7749,
  "location_lng": -122.4194
}
```

**Response 204:** No content (success)

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Both lat and lng required"` | Only one coordinate provided |
| 400 | `"Invalid latitude"` | lat outside -90 to 90 |
| 400 | `"Invalid longitude"` | lng outside -180 to 180 |
| 400 | `"Invalid date_of_birth format"` | Date not in ISO format |

---

### PATCH /profile

Partially update the current user's profile. Same as PUT.

---

### GET /user/\<username\>/profile

Get any user's public profile by username.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `username` | string | Target user's username |

**Response 200:** Same as GET /profile

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 404 | `"User not found: {username}"` | Username doesn't exist |
| 404 | `"Profile not found"` | User has no profile |

---

### PATCH /user/\<username\>/profile

Update a user's profile. **Must be authenticated as that user.**

| Property | Value |
|----------|-------|
| **Auth** | Required (owner only) |

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 403 | `"can only update your own profile"` | Trying to update another user's profile |

---

## Profile Avatar

### POST /profile/avatar

Upload a profile avatar image.

| Property | Value |
|----------|-------|
| **Auth** | Required |
| **Content-Type** | `multipart/form-data` or `image/*` |

**Request Options:**

**Option 1: Multipart form data**
```
POST /profile/avatar
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="image"; filename="avatar.jpg"
Content-Type: image/jpeg

[binary image data]
--boundary--
```

**Option 2: Binary upload**
```
POST /profile/avatar
Content-Type: image/jpeg

[binary image data]
```

**Constraints:**

| Constraint | Value |
|------------|-------|
| Max file size | 5 MB |
| Allowed formats | jpg, jpeg, png, gif, webp |
| Compression | Automatic (quality adjusted to fit size limit) |

**Response 201:**
```json
{
  "avatar_url": "/media/user/profile/550e8400-e29b-41d4-a716-446655440000.jpg"
}
```

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"No image data provided"` | Empty request body |
| 400 | `"No file selected"` | Empty file in multipart |
| 400 | `"Invalid image data"` | Corrupted or invalid image |
| 413 | `"File too large (max 5MB)"` | File exceeds size limit after compression |
| 415 | `"File type not allowed for avatars. Allowed: jpg, jpeg, png, gif, webp"` | Unsupported format |

---

### GET /profile/avatar

Get the current user's avatar image.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Response 200:** Binary image data with appropriate `Content-Type` header

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 404 | `"Avatar not found"` | No avatar file exists |

---

### DELETE /profile/avatar

Remove the current user's avatar (resets to default).

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Response 204:** No content (success)

---

### GET /user/\<username\>/profile/avatar

Get another user's avatar by username.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 404 | `"User not found: {username}"` | Username doesn't exist |

---

## User Experiences

### GET /profile/experiences

Get the current user's work experiences.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Response 200:**
```json
[
  {
    "id": "exp-uuid-1",
    "user_id": "user-uuid",
    "title": "Senior Developer",
    "company": "Tech Corp",
    "description": "Led mobile development team",
    "start_date": "2020-01-15T00:00:00+00:00",
    "end_date": "2023-06-30T00:00:00+00:00",
    "is_current": false,
    "created_at": "2024-01-01T00:00:00+00:00"
  },
  {
    "id": "exp-uuid-2",
    "user_id": "user-uuid",
    "title": "Tech Lead",
    "company": "StartupXYZ",
    "description": "Building innovative products",
    "start_date": "2023-07-01T00:00:00+00:00",
    "end_date": null,
    "is_current": true,
    "created_at": "2024-01-01T00:00:00+00:00"
  }
]
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | UUID | No | Experience unique identifier |
| `user_id` | UUID | No | Owner user ID |
| `title` | string | No | Job title |
| `company` | string | Yes | Company name |
| `description` | string | Yes | Role description |
| `start_date` | datetime | No | When the role started |
| `end_date` | datetime | Yes | When the role ended (null if current) |
| `is_current` | boolean | No | Whether this is the current role |
| `created_at` | datetime | No | Record creation time |

---

### POST /profile/experiences

Add a new work experience.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `title` | string | Yes | Min 2 characters | Job title |
| `company` | string | No | - | Company name |
| `description` | string | No | - | Role description |
| `start_date` | string | Yes | ISO datetime | Start date |
| `end_date` | string | No | ISO datetime, must be after start_date | End date |
| `is_current` | boolean | No | Default: false | Is this the current role? |

**Request Example:**
```json
{
  "title": "Software Engineer",
  "company": "Tech Corp",
  "description": "Building mobile applications",
  "start_date": "2023-01-01T00:00:00Z",
  "end_date": null,
  "is_current": true
}
```

**Response 201:**
```json
{
  "experience_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Title must be at least 2 characters"` | Title too short |
| 400 | `"Invalid start_date format"` | Not ISO datetime |
| 400 | `"Invalid end_date format"` | Not ISO datetime |
| 400 | `"End date must be after start date"` | end_date <= start_date |
| 400 | `"Current experiences cannot have end date"` | is_current=true with end_date |

---

### PATCH /profile/experiences/\<exp_id\>

Update an existing experience.

| Property | Value |
|----------|-------|
| **Auth** | Required (owner only) |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `exp_id` | UUID | Experience ID to update |

**Request Body:** Any subset of POST fields

**Response 204:** No content (success)

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid experience ID format"` | Not a valid UUID |
| 403 | `"Not authorized to update this experience"` | Not the owner |
| 404 | `"Experience not found"` | ID doesn't exist |

---

### DELETE /profile/experiences/\<exp_id\>

Delete an experience.

| Property | Value |
|----------|-------|
| **Auth** | Required (owner only) |

**Response 204:** No content (success)

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid experience ID format"` | Not a valid UUID |
| 403 | `"Not authorized to delete this experience"` | Not the owner |
| 404 | `"Experience not found"` | ID doesn't exist |

---

### GET /user/\<username\>/profile/experiences

Get another user's experiences.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 404 | `"User not found: {username}"` | Username doesn't exist |

---

## User Interests

Interests link users to categories with a proficiency level (1-5 scale).

### GET /profile/interests

Get the current user's interests.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Response 200:**
```json
[
  {
    "user_id": "user-uuid",
    "category_id": "cat-uuid-1",
    "proficiency_level": 4,
    "category_name": "Web Development",
    "category_slug": "web-development",
    "category_icon": "/media/category/cat-uuid-1.svg",
    "added_at": "2024-01-15T10:30:00+00:00"
  },
  {
    "user_id": "user-uuid",
    "category_id": "cat-uuid-2",
    "proficiency_level": 5,
    "category_name": "Mobile Development",
    "category_slug": "mobile-development",
    "category_icon": "/media/category/cat-uuid-2.png",
    "added_at": "2024-02-01T08:00:00+00:00"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | UUID | User ID |
| `category_id` | UUID | Category ID |
| `proficiency_level` | integer | Skill level (1-5) |
| `category_name` | string | Category display name |
| `category_slug` | string | URL-friendly category identifier |
| `category_icon` | string | Category icon URL |
| `added_at` | datetime | When interest was added |

---

### POST /profile/interests

Add a new interest.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `category_id` | UUID | Yes | Must exist | Category to add |
| `proficiency_level` | integer | No | 1-5 (default: 1) | Skill level |

**Request Example:**
```json
{
  "category_id": "550e8400-e29b-41d4-a716-446655440000",
  "proficiency_level": 4
}
```

**Response 201:** Empty body (success)

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid category_id format"` | Not a valid UUID |
| 400 | `"Proficiency level must be 1-5"` | Level out of range |
| 404 | `"Category not found"` | Category doesn't exist |
| 409 | `"Interest already exists"` | User already has this interest |

---

### PATCH /profile/interests/\<category_id\>

Update an interest's proficiency level.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `proficiency_level` | integer | Yes | 1-5 | New skill level |

**Response 204:** No content (success)

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid category_id format"` | Not a valid UUID |
| 400 | `"Proficiency level must be 1-5"` | Level out of range |

---

### DELETE /profile/interests/\<category_id\>

Remove an interest from profile.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Response 204:** No content (success)

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid category_id format"` | Not a valid UUID |
| 404 | `"Interest not found"` | User doesn't have this interest |

---

### GET /user/\<username\>/profile/interests

Get another user's interests.

| Property | Value |
|----------|-------|
| **Auth** | Required |

---

## Categories

Categories organize PAPS (jobs) and user interests.

### GET /categories

List all active categories.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Response 200:**
```json
[
  {
    "id": "cat-uuid-1",
    "name": "Web Development",
    "slug": "web-development",
    "description": "Frontend and backend web development",
    "parent_id": null,
    "icon_url": "/media/category/cat-uuid-1.svg",
    "display_order": 1,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00+00:00"
  },
  {
    "id": "cat-uuid-2",
    "name": "React",
    "slug": "react",
    "description": "React.js development",
    "parent_id": "cat-uuid-1",
    "icon_url": "/media/category/cat-uuid-2.png",
    "display_order": 1,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00+00:00"
  }
]
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | UUID | No | Category unique identifier |
| `name` | string | No | Display name |
| `slug` | string | No | URL-friendly identifier (lowercase, hyphens) |
| `description` | string | Yes | Category description |
| `parent_id` | UUID | Yes | Parent category for hierarchical structure |
| `icon_url` | string | Yes | Path to category icon |
| `display_order` | integer | No | Sorting order |
| `is_active` | boolean | No | Whether category is active |
| `created_at` | datetime | No | Creation timestamp |

---

### GET /categories/\<category_id\>

Get a specific category by ID.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Response 200:** Single category object (same structure as list item)

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid category ID format"` | Not a valid UUID |
| 404 | `"Category not found"` | ID doesn't exist |

---

### POST /categories

Create a new category. **Admin only.**

| Property | Value |
|----------|-------|
| **Auth** | Admin only |

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `name` | string | Yes | Min 2 characters | Display name |
| `slug` | string | Yes | Lowercase letters, numbers, hyphens only | URL identifier |
| `description` | string | No | - | Category description |
| `parent_id` | UUID | No | Must exist | Parent category |
| `icon_url` | string | No | - | Icon path (usually set via icon upload) |

**Request Example:**
```json
{
  "name": "Mobile Development",
  "slug": "mobile-development",
  "description": "iOS and Android development",
  "parent_id": null
}
```

**Response 201:**
```json
{
  "category_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Name must be at least 2 characters"` | Name too short |
| 400 | `"Slug must be lowercase letters, numbers, and hyphens"` | Invalid slug format |
| 400 | `"Invalid parent_id format"` | parent_id not a valid UUID |

---

### PATCH /categories/\<category_id\>

Update a category. **Admin only.**

| Property | Value |
|----------|-------|
| **Auth** | Admin only |

**Request Body:** Any subset of POST fields, plus:

| Field | Type | Description |
|-------|------|-------------|
| `is_active` | boolean | Enable/disable category |

**Response 204:** No content (success)

---

### DELETE /categories/\<category_id\>

Delete a category and its icon. **Admin only.**

| Property | Value |
|----------|-------|
| **Auth** | Admin only |

**Response 204:** No content (success)

---

## Category Icons

### POST /categories/\<category_id\>/icon

Upload a category icon. **Admin only.**

| Property | Value |
|----------|-------|
| **Auth** | Admin only |
| **Content-Type** | `multipart/form-data` or `image/*` |

**Constraints:**

| Constraint | Value |
|------------|-------|
| Max file size | 1 MB |
| Allowed formats | jpg, jpeg, png, gif, webp, svg |

**Response 201:**
```json
{
  "icon_url": "/media/category/cat-uuid.svg"
}
```

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"No image data provided"` | Empty request |
| 413 | `"File too large (max 1MB)"` | Exceeds size limit |
| 415 | `"File type not allowed for icons..."` | Unsupported format |

---

### GET /categories/\<category_id\>/icon

Get category icon image.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Response 200:** Binary image data

**Note:** Returns default icon if category has no custom icon.

---

### DELETE /categories/\<category_id\>/icon

Remove category icon (resets to default). **Admin only.**

| Property | Value |
|----------|-------|
| **Auth** | Admin only |

**Response 204:** No content (success)

---

## PAPS (Job Postings)

PAPS (Post A Project/Service) are job postings that users can create and others can apply to.

### GET /paps

List PAPS with comprehensive filtering and smart permissions.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `draft`, `published`, `closed`, `cancelled` |
| `category_id` | UUID | No | Filter by category |
| `lat` | float | No | User latitude for distance calculation |
| `lng` | float | No | User longitude for distance calculation |
| `max_distance` | float | No | Maximum distance in kilometers |
| `min_price` | float | No | Minimum payment amount |
| `max_price` | float | No | Maximum payment amount |
| `payment_type` | string | No | Filter: `fixed`, `hourly`, `negotiable` |
| `owner_username` | string | No | Filter by owner username (partial match) |
| `title_search` | string | No | Search in title and description |

**Permission Logic:**
- **Regular users:** See up to 1000 PAPS, ranked by interest match score
- **Admin users:** See ALL PAPS (no limit)

**Response 200:**
```json
{
  "paps": [
    {
      "id": "paps-uuid-1",
      "owner_id": "user-uuid",
      "owner_username": "johndoe",
      "owner_email": "john@example.com",
      "owner_name": "John Doe",
      "owner_avatar": "/media/user/profile/user-uuid.jpg",
      "title": "Need help with React project",
      "subtitle": "3-day frontend work",
      "description": "Looking for experienced React developer to help build dashboard components...",
      "status": "published",
      "location_address": "San Francisco, CA",
      "location_lat": 37.7749,
      "location_lng": -122.4194,
      "location_timezone": "America/Los_Angeles",
      "start_datetime": "2026-02-01T09:00:00+00:00",
      "end_datetime": "2026-02-03T18:00:00+00:00",
      "estimated_duration_minutes": 1440,
      "payment_amount": 500.00,
      "payment_currency": "USD",
      "payment_type": "fixed",
      "max_applicants": 20,
      "max_assignees": 2,
      "is_public": true,
      "publish_at": "2026-01-26T00:00:00+00:00",
      "expires_at": "2026-02-15T00:00:00+00:00",
      "created_at": "2026-01-25T10:00:00+00:00",
      "deleted_at": null,
      "distance_km": 5.2,
      "interest_match_score": 85,
      "categories": [
        {
          "id": "cat-uuid-1",
          "name": "Web Development",
          "slug": "web-development",
          "is_primary": true
        }
      ]
    }
  ],
  "total_count": 1
}
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | UUID | No | PAPS unique identifier |
| `owner_id` | UUID | No | Creator's user ID |
| `owner_username` | string | No | Creator's username |
| `owner_email` | string | No | Creator's email |
| `owner_name` | string | Yes | Creator's display name |
| `owner_avatar` | string | Yes | Creator's avatar URL |
| `title` | string | No | Job title (min 5 chars) |
| `subtitle` | string | Yes | Short subtitle |
| `description` | string | No | Full description (min 20 chars) |
| `status` | string | No | `draft`, `published`, `closed`, `cancelled` |
| `location_address` | string | Yes | Human-readable address |
| `location_lat` | float | Yes | Latitude |
| `location_lng` | float | Yes | Longitude |
| `location_timezone` | string | Yes | IANA timezone |
| `start_datetime` | datetime | Yes | When work begins |
| `end_datetime` | datetime | Yes | When work ends |
| `estimated_duration_minutes` | integer | Yes | Expected duration |
| `payment_amount` | float | No | Payment amount (> 0) |
| `payment_currency` | string | No | Currency code (e.g., `USD`) |
| `payment_type` | string | No | `fixed`, `hourly`, `negotiable` |
| `max_applicants` | integer | No | Max applications allowed (1-100) |
| `max_assignees` | integer | No | Max workers to assign (≤ max_applicants) |
| `is_public` | boolean | No | Public visibility |
| `publish_at` | datetime | Yes | Scheduled publish time |
| `expires_at` | datetime | Yes | When PAPS expires |
| `created_at` | datetime | No | Creation timestamp |
| `deleted_at` | datetime | Yes | Soft delete timestamp |
| `distance_km` | float | Yes | Distance from search location |
| `interest_match_score` | integer | Yes | Match with user's interests (0-100) |
| `categories` | array | No | Associated categories |

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid payment_type. Must be: fixed, hourly, negotiable"` | Bad payment_type filter |

---

### GET /paps/\<paps_id\>

Get a specific PAPS with full details.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Response 200:** Single PAPS object plus:

| Additional Field | Type | Description |
|------------------|------|-------------|
| `comments_count` | integer | Total comments on this PAPS |
| `applications_count` | integer | Total applications received |

**Note:** Media is NOT included. Use `GET /paps/<paps_id>/media` separately.

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid PAP ID format"` | Not a valid UUID |
| 404 | `"PAP not found or not accessible"` | Doesn't exist or no permission |

---

### POST /paps

Create a new PAPS job posting.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `title` | string | Yes | Min 5 characters | Job title |
| `description` | string | Yes | Min 20 characters | Full description |
| `payment_amount` | float | Yes | > 0 | Payment amount |
| `payment_currency` | string | No | Default: `USD` | Currency code |
| `payment_type` | string | No | `fixed`, `hourly`, `negotiable` (default: `fixed`) | Payment type |
| `max_applicants` | integer | No | 1-100 (default: 10) | Max applications |
| `max_assignees` | integer | No | ≤ max_applicants (default: 1) | Max workers |
| `subtitle` | string | No | - | Short subtitle |
| `location_address` | string | No | - | Address text |
| `location_lat` | float | No | -90 to 90 | Latitude |
| `location_lng` | float | No | -180 to 180 | Longitude |
| `location_timezone` | string | No | IANA timezone | Timezone |
| `start_datetime` | string | No | ISO datetime | Work start |
| `end_datetime` | string | No | Must be after start | Work end |
| `estimated_duration_minutes` | integer | No | > 0 | Duration |
| `is_public` | boolean | No | Default: true | Public visibility |
| `status` | string | No | Default: `draft` | Initial status |
| `publish_at` | string | No | ISO datetime | Scheduled publish |
| `expires_at` | string | No | ISO datetime | Expiration date |
| `categories` | array | No | Array of category objects or UUIDs | Categories to add |

**Categories Format:**
```json
{
  "categories": [
    {"category_id": "uuid-1", "is_primary": true},
    {"category_id": "uuid-2", "is_primary": false},
    "uuid-3"
  ]
}
```

**Request Example:**
```json
{
  "title": "Need React Developer",
  "description": "Looking for an experienced React developer to help build a dashboard with charts and data tables. Must know TypeScript.",
  "payment_amount": 500.00,
  "payment_currency": "USD",
  "payment_type": "fixed",
  "max_applicants": 20,
  "max_assignees": 2,
  "location_address": "San Francisco, CA",
  "location_lat": 37.7749,
  "location_lng": -122.4194,
  "start_datetime": "2026-02-01T09:00:00Z",
  "end_datetime": "2026-02-03T18:00:00Z",
  "status": "published",
  "categories": [
    {"category_id": "cat-uuid-1", "is_primary": true}
  ]
}
```

**Response 201:**
```json
{
  "paps_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Title must be at least 5 characters"` | Title too short |
| 400 | `"Description must be at least 20 characters"` | Description too short |
| 400 | `"Payment amount must be positive"` | payment_amount ≤ 0 |
| 400 | `"Invalid payment type"` | Not fixed/hourly/negotiable |
| 400 | `"Max applicants must be 1-100"` | Out of range |
| 400 | `"Max assignees must be positive and not exceed max applicants"` | Invalid assignees |
| 400 | `"Invalid status"` | Not draft/published/closed/cancelled |
| 400 | `"Both lat and lng must be provided"` | Only one coordinate given |
| 400 | `"Invalid latitude"` | Outside -90 to 90 |
| 400 | `"Invalid longitude"` | Outside -180 to 180 |
| 400 | `"Invalid start_datetime format"` | Not ISO format |
| 400 | `"Invalid end_datetime format"` | Not ISO format |
| 400 | `"End datetime must be after start datetime"` | end ≤ start |
| 400 | `"Duration must be positive"` | duration ≤ 0 |
| 400 | `"start_datetime is required for published status"` | Publishing without start date |

---

### PUT /paps/\<paps_id\>

Update a PAPS. Owner or admin only.

| Property | Value |
|----------|-------|
| **Auth** | Required (owner or admin) |

**Request Body:** Any subset of POST fields

**Response 204:** No content (success)

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid PAP ID format"` | Not a valid UUID |
| 403 | `"Not authorized to update this PAP"` | Not owner or admin |
| 404 | `"PAP not found"` | Doesn't exist |

---

### DELETE /paps/\<paps_id\>

Soft delete a PAPS. Also deletes all associated media files and applications.

| Property | Value |
|----------|-------|
| **Auth** | Required (owner or admin) |

**Cascade Behavior:**
- All PAPS media files deleted from disk
- All applications (SPAP) deleted
- All application media files deleted from disk
- All comments soft deleted

**Response 204:** No content (success)

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid PAP ID format"` | Not a valid UUID |
| 403 | `"Not authorized to delete this PAP"` | Not owner or admin |
| 404 | `"PAP not found"` | Doesn't exist |

---

## PAPS Categories

### POST /paps/\<paps_id\>/categories/\<category_id\>

Add a category to a PAPS.

| Property | Value |
|----------|-------|
| **Auth** | Required (owner or admin) |

**Response 201:**
```json
{
  "message": "Category added to PAP"
}
```

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid PAP ID format"` | Invalid PAPS UUID |
| 400 | `"Invalid category_id format"` | Invalid category UUID |
| 403 | `"Not authorized to modify this PAP"` | Not owner or admin |
| 404 | `"PAP not found"` | PAPS doesn't exist |
| 404 | `"Category not found"` | Category doesn't exist |

---

### DELETE /paps/\<paps_id\>/categories/\<category_id\>

Remove a category from a PAPS.

| Property | Value |
|----------|-------|
| **Auth** | Required (owner or admin) |

**Response 204:** No content (success)

---

## PAPS Media

Media files are stored with UUID-based filenames. Original filenames are never exposed.

### GET /paps/\<paps_id\>/media

Get all media metadata for a PAPS.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Response 200:**
```json
{
  "paps_id": "paps-uuid",
  "media_count": 3,
  "media": [
    {
      "media_id": "media-uuid-1",
      "media_url": "/paps/media/media-uuid-1",
      "media_type": "image",
      "file_size_bytes": 245000,
      "mime_type": "image/jpeg",
      "display_order": 1
    },
    {
      "media_id": "media-uuid-2",
      "media_url": "/paps/media/media-uuid-2",
      "media_type": "video",
      "file_size_bytes": 15000000,
      "mime_type": "video/mp4",
      "display_order": 2
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `media_id` | UUID | Media unique identifier |
| `media_url` | string | URL to retrieve the file |
| `media_type` | string | `image` or `video` |
| `file_size_bytes` | integer | File size in bytes |
| `mime_type` | string | MIME type (e.g., `image/jpeg`) |
| `display_order` | integer | Display ordering |

---

### POST /paps/\<paps_id\>/media

Upload media files to a PAPS. Supports multiple files.

| Property | Value |
|----------|-------|
| **Auth** | Required (owner or admin) |
| **Content-Type** | `multipart/form-data` |

**Request:**
```
POST /paps/{paps_id}/media
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="media"; filename="photo1.jpg"
Content-Type: image/jpeg

[binary data]
--boundary
Content-Disposition: form-data; name="media"; filename="video.mp4"
Content-Type: video/mp4

[binary data]
--boundary--
```

**Constraints:**

| Constraint | Value |
|------------|-------|
| Max file size | 50 MB |
| Image formats | jpg, jpeg, png, gif, webp |
| Video formats | mp4, avi, mov, mkv |

**Response 201:**
```json
{
  "uploaded_media": [
    {
      "media_id": "media-uuid-1",
      "media_url": "/paps/media/media-uuid-1",
      "media_type": "image",
      "file_size_bytes": 245000,
      "display_order": 1
    }
  ],
  "count": 1
}
```

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"No media files provided"` | Missing `media` field |
| 400 | `"No files selected"` | Empty files list |
| 403 | `"Not authorized"` | Not owner or admin |
| 413 | `"File too large (max 50MB)"` | Exceeds size limit |
| 415 | `"File type not allowed..."` | Unsupported format |

---

### GET /paps/media/\<media_id\>

Retrieve a media file by ID.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Response 200:** Binary file data with appropriate `Content-Type` header

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid media ID format"` | Not a valid UUID |
| 404 | `"Media not found"` | Doesn't exist in database |
| 404 | `"Media not accessible"` | No permission to view PAPS |
| 404 | `"Media file not found on disk"` | File missing from storage |

---

### DELETE /paps/media/\<media_id\>

Delete a media file from PAPS.

| Property | Value |
|----------|-------|
| **Auth** | Required (owner or admin) |

**Response 204:** No content (success)

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid media ID format"` | Not a valid UUID |
| 403 | `"Not authorized to delete this media"` | Not owner or admin |
| 404 | `"Media not found"` | Doesn't exist |

---

## Comments

Instagram-style comments: flat structure with single-level replies only.

### GET /paps/\<paps_id\>/comments

Get all top-level comments for a PAPS.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Response 200:**
```json
{
  "paps_id": "paps-uuid",
  "comments": [
    {
      "id": "comment-uuid-1",
      "paps_id": "paps-uuid",
      "user_id": "user-uuid",
      "content": "Great opportunity!",
      "parent_id": null,
      "author_username": "janedoe",
      "author_name": "Jane Doe",
      "author_avatar": "/media/user/profile/user-uuid.jpg",
      "reply_count": 3,
      "created_at": "2026-01-26T10:00:00+00:00",
      "updated_at": null,
      "deleted_at": null
    }
  ],
  "count": 1,
  "total_count": 4
}
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | UUID | No | Comment unique identifier |
| `paps_id` | UUID | No | Parent PAPS ID |
| `user_id` | UUID | No | Author's user ID |
| `content` | string | No | Comment text (1-2000 chars) |
| `parent_id` | UUID | Yes | Parent comment ID (null for top-level) |
| `author_username` | string | No | Author's username |
| `author_name` | string | Yes | Author's display name |
| `author_avatar` | string | Yes | Author's avatar URL |
| `reply_count` | integer | No | Number of replies (top-level only) |
| `created_at` | datetime | No | Creation timestamp |
| `updated_at` | datetime | Yes | Last edit timestamp |
| `deleted_at` | datetime | Yes | Soft delete timestamp |

| Response Field | Description |
|----------------|-------------|
| `count` | Number of top-level comments returned |
| `total_count` | Total comments including replies |

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid PAPS ID format"` | Not a valid UUID |
| 404 | `"PAPS not found"` | PAPS doesn't exist |

---

### POST /paps/\<paps_id\>/comments

Create a new top-level comment.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `content` | string | Yes | 1-2000 characters | Comment text |

**Request Example:**
```json
{
  "content": "This looks like a great opportunity! I'd love to learn more about the timeline."
}
```

**Response 201:**
```json
{
  "comment_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid PAPS ID format"` | Not a valid UUID |
| 400 | `"Comment cannot be empty"` | Empty content |
| 400 | `"Comment too long (max 2000 characters)"` | Exceeds limit |
| 400 | `"Cannot comment on deleted PAPS"` | PAPS was soft deleted |
| 404 | `"PAPS not found"` | PAPS doesn't exist |

---

### GET /comments/\<comment_id\>

Get a specific comment by ID.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Response 200:** Single comment object

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid comment ID format"` | Not a valid UUID |
| 404 | `"Comment not found"` | Doesn't exist |
| 404 | `"Comment has been deleted"` | Was soft deleted |

---

### PUT /comments/\<comment_id\>

Edit a comment. Author or admin only.

| Property | Value |
|----------|-------|
| **Auth** | Required (author or admin) |

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `content` | string | Yes | 1-2000 characters | Updated text |

**Response 204:** No content (success)

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid comment ID format"` | Not a valid UUID |
| 400 | `"Comment cannot be empty"` | Empty content |
| 400 | `"Comment too long (max 2000 characters)"` | Exceeds limit |
| 403 | `"Not authorized to edit this comment"` | Not author or admin |
| 404 | `"Comment not found"` | Doesn't exist |
| 404 | `"Comment has been deleted"` | Was soft deleted |

---

### DELETE /comments/\<comment_id\>

Soft delete a comment. Author, PAPS owner, or admin can delete.

| Property | Value |
|----------|-------|
| **Auth** | Required (author, PAPS owner, or admin) |

**Cascade Behavior:** If deleting a top-level comment, all replies are also soft deleted.

**Response 204:** No content (success)

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid comment ID format"` | Not a valid UUID |
| 403 | `"Not authorized to delete this comment"` | No permission |
| 404 | `"Comment not found"` | Doesn't exist |
| 404 | `"Comment already deleted"` | Already soft deleted |

---

## Comment Replies

Replies are limited to one level (Instagram-style). You cannot reply to a reply.

### GET /comments/\<comment_id\>/replies

Get all replies to a comment.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Response 200:**
```json
{
  "parent_comment_id": "comment-uuid",
  "replies": [
    {
      "id": "reply-uuid-1",
      "paps_id": "paps-uuid",
      "user_id": "user-uuid-2",
      "content": "Thanks for your interest!",
      "parent_id": "comment-uuid",
      "author_username": "johndoe",
      "author_name": "John Doe",
      "author_avatar": "/media/user/profile/user-uuid-2.jpg",
      "created_at": "2026-01-26T11:00:00+00:00"
    }
  ],
  "count": 1
}
```

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid comment ID format"` | Not a valid UUID |
| 400 | `"Cannot get replies of a reply"` | Trying to get replies of a reply |
| 404 | `"Comment not found"` | Doesn't exist |
| 404 | `"Comment has been deleted"` | Was soft deleted |

---

### POST /comments/\<comment_id\>/replies

Reply to a comment. Only top-level comments accept replies.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `content` | string | Yes | 1-2000 characters | Reply text |

**Response 201:**
```json
{
  "comment_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid comment ID format"` | Not a valid UUID |
| 400 | `"Reply cannot be empty"` | Empty content |
| 400 | `"Reply too long (max 2000 characters)"` | Exceeds limit |
| 400 | `"Cannot reply to a reply. Only top-level comments accept replies."` | Trying to nest replies |
| 400 | `"Cannot reply to a deleted comment"` | Parent was soft deleted |
| 400 | `"Cannot reply - PAPS has been deleted"` | PAPS was soft deleted |
| 404 | `"Comment not found"` | Parent doesn't exist |

---

### GET /comments/\<comment_id\>/thread

Get a comment with all its replies in one call.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Response 200:**
```json
{
  "comment": {
    "id": "comment-uuid",
    "content": "Great opportunity!",
    "author_username": "janedoe"
  },
  "replies": [
    {
      "id": "reply-uuid-1",
      "content": "Thanks!"
    }
  ],
  "is_reply": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `comment` | object | The requested comment |
| `replies` | array | All replies (empty if comment is a reply) |
| `is_reply` | boolean | Whether the requested comment is itself a reply |

---

## SPAP (Applications)

SPAP (Submit Project Application) represents job applications to PAPS.

### GET /paps/\<paps_id\>/applications

Get all applications for a PAPS. **Owner or admin only.**

| Property | Value |
|----------|-------|
| **Auth** | Required (PAPS owner or admin) |

**Response 200:**
```json
{
  "applications": [
    {
      "id": "spap-uuid-1",
      "paps_id": "paps-uuid",
      "applicant_id": "user-uuid",
      "applicant_username": "applicant1",
      "applicant_name": "App Licant",
      "applicant_avatar": "/media/user/profile/user-uuid.jpg",
      "status": "pending",
      "message": "I'm very interested in this opportunity...",
      "applied_at": "2026-01-26T12:00:00+00:00",
      "reviewed_at": null,
      "accepted_at": null,
      "rejected_at": null
    }
  ],
  "count": 1
}
```

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | UUID | No | Application unique identifier |
| `paps_id` | UUID | No | Target PAPS ID |
| `applicant_id` | UUID | No | Applicant's user ID |
| `applicant_username` | string | No | Applicant's username |
| `applicant_name` | string | Yes | Applicant's display name |
| `applicant_avatar` | string | Yes | Applicant's avatar URL |
| `status` | string | No | `pending`, `accepted`, `rejected`, `withdrawn` |
| `message` | string | Yes | Application message from applicant |
| `applied_at` | datetime | No | When application was submitted |
| `reviewed_at` | datetime | Yes | When owner reviewed the application |
| `accepted_at` | datetime | Yes | When application was accepted |
| `rejected_at` | datetime | Yes | When application was rejected |

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid PAPS ID format"` | Not a valid UUID |
| 403 | `"Not authorized to view applications"` | Not owner or admin |
| 404 | `"PAPS not found"` | PAPS doesn't exist |

---

### GET /spap/my

Get all applications submitted by the current user.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Response 200:**
```json
{
  "applications": [
    {
      "id": "spap-uuid-1",
      "paps_id": "paps-uuid",
      "paps_title": "Need React Developer",
      "paps_owner_username": "johndoe",
      "status": "pending",
      "message": "I'd love to work on this project...",
      "applied_at": "2026-01-26T12:00:00+00:00"
    }
  ],
  "count": 1
}
```

---

### POST /paps/\<paps_id\>/apply

Apply to a PAPS job posting.

| Property | Value |
|----------|-------|
| **Auth** | Required |

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `message` | string | No | - | Cover letter / application message |

**Request Example:**
```json
{
  "message": "I'm a React developer with 5 years of experience. I'd love to help build your dashboard!"
}
```

**Response 201:**
```json
{
  "spap_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Business Rules:**
- Cannot apply to your own PAPS
- PAPS must have status `published`
- Cannot exceed `max_applicants` limit
- Cannot apply if you've already applied
- **Cannot apply if you were previously rejected from this PAPS**

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid PAPS ID format"` | Not a valid UUID |
| 400 | `"PAPS is not accepting applications"` | Status is not `published` |
| 400 | `"Maximum number of applications reached"` | max_applicants exceeded |
| 403 | `"Cannot apply to your own PAPS"` | You own the PAPS |
| 403 | `"You were previously rejected from this PAPS and cannot reapply"` | Previously rejected |
| 404 | `"PAPS not found"` | PAPS doesn't exist |
| 409 | `"You have already applied to this PAPS"` | Duplicate application |

---

### GET /spap/\<spap_id\>

Get application details.

| Property | Value |
|----------|-------|
| **Auth** | Required (applicant, PAPS owner, or admin) |

**Response 200:** Single application object

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid SPAP ID format"` | Not a valid UUID |
| 403 | `"Not authorized to view this application"` | No permission |
| 404 | `"Application not found"` | Doesn't exist |

---

### DELETE /spap/\<spap_id\>

Withdraw an application. Applicant or admin only.

| Property | Value |
|----------|-------|
| **Auth** | Required (applicant or admin) |

**Business Rules:**
- Cannot withdraw if already accepted or rejected
- Deletes associated media files from disk

**Response 204:** No content (success)

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid SPAP ID format"` | Not a valid UUID |
| 400 | `"Cannot withdraw application with status: {status}"` | Already accepted/rejected |
| 403 | `"Not authorized to withdraw this application"` | Not applicant or admin |
| 404 | `"Application not found"` | Doesn't exist |

---

### PUT /spap/\<spap_id\>/status

Update application status. PAPS owner or admin only.

| Property | Value |
|----------|-------|
| **Auth** | Required (PAPS owner or admin) |

**Request Body:**

| Field | Type | Required | Values | Description |
|-------|------|----------|--------|-------------|
| `status` | string | Yes | `pending`, `accepted`, `rejected`, `withdrawn` | New status |

**Request Example:**
```json
{
  "status": "accepted"
}
```

**Response 204:** No content (success)

**Automatic Timestamp Updates:**
- `accepted` → sets `reviewed_at` and `accepted_at`
- `rejected` → sets `reviewed_at` and `rejected_at`
- Other statuses → clears timestamps

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid SPAP ID format"` | Not a valid UUID |
| 400 | `"Invalid status. Must be: pending, accepted, rejected, withdrawn"` | Bad status value |
| 403 | `"Not authorized to update this application"` | Not owner or admin |
| 404 | `"Application not found"` | Application doesn't exist |
| 404 | `"PAPS not found"` | PAPS doesn't exist |

---

## SPAP Media

Applicants can attach media files to their applications.

### GET /spap/\<spap_id\>/media

Get all media for an application.

| Property | Value |
|----------|-------|
| **Auth** | Required (applicant, PAPS owner, or admin) |

**Response 200:**
```json
{
  "spap_id": "spap-uuid",
  "media_count": 2,
  "media": [
    {
      "media_id": "media-uuid-1",
      "media_url": "/spap/media/media-uuid-1",
      "media_type": "document",
      "file_size_bytes": 125000,
      "mime_type": "application/pdf",
      "display_order": 1
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `media_type` | string | `image`, `video`, or `document` |

---

### POST /spap/\<spap_id\>/media

Upload media to an application. Applicant only, and only while status is `pending`.

| Property | Value |
|----------|-------|
| **Auth** | Required (applicant only) |
| **Content-Type** | `multipart/form-data` |

**Constraints:**

| Constraint | Value |
|------------|-------|
| Max file size | 50 MB |
| Image formats | jpg, jpeg, png, gif, webp |
| Video formats | mp4, avi, mov, mkv |
| Document formats | pdf, doc, docx |

**Response 201:**
```json
{
  "uploaded_media": [
    {
      "media_id": "media-uuid-1",
      "media_url": "/spap/media/media-uuid-1",
      "media_type": "document",
      "file_size_bytes": 125000,
      "display_order": 1
    }
  ],
  "count": 1
}
```

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"No media files provided"` | Missing `media` field |
| 400 | `"Cannot add media to non-pending application"` | Application already reviewed |
| 403 | `"Not authorized to upload media"` | Not the applicant |
| 413 | `"File too large (max 50MB)"` | Exceeds size limit |
| 415 | `"File type not allowed..."` | Unsupported format |

---

### GET /spap/media/\<media_id\>

Retrieve an application media file.

| Property | Value |
|----------|-------|
| **Auth** | Required (applicant, PAPS owner, or admin) |

**Response 200:** Binary file data

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid media ID format"` | Not a valid UUID |
| 403 | `"Not authorized"` | No permission |
| 404 | `"Media not found"` | Doesn't exist |
| 404 | `"Media file not found on disk"` | File missing |

---

### DELETE /spap/media/\<media_id\>

Delete an application media file. Applicant only, and only while status is `pending`.

| Property | Value |
|----------|-------|
| **Auth** | Required (applicant or admin) |

**Response 204:** No content (success)

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"Invalid media ID format"` | Not a valid UUID |
| 400 | `"Cannot delete media from non-pending application"` | Already reviewed |
| 403 | `"Not authorized"` | Not applicant or admin |
| 404 | `"Media not found"` | Doesn't exist |

---

## Admin User Management

These routes are **only available when `APP_USERS = True`** in server configuration (typically testing/development).

### GET /users

List all users with optional filter.

| Property | Value |
|----------|-------|
| **Auth** | Admin only |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `flt` | string | No | Filter by username/email/phone (partial match) |

**Response 200:**
```json
[
  {
    "aid": "user-uuid",
    "login": "johndoe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "is_admin": false,
    "created_at": "2024-01-01T00:00:00+00:00"
  }
]
```

---

### POST /users

Create a new user (admin).

| Property | Value |
|----------|-------|
| **Auth** | Admin only |

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `login` | string | Yes | Min 3 chars, starts with letter | Username |
| `password` | string | Yes | - | Password |
| `email` | string | No | - | Email address |
| `phone` | string | No | - | Phone number |
| `is_admin` | boolean | No | Default: false | Admin privileges |

**Response 201:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"username must be at least 3 characters"` | Too short |
| 400 | `"username must start with a letter..."` | Invalid format |
| 409 | `"user {login} already created"` | Duplicate |

---

### GET /users/\<user_id\>

Get user details by ID or username.

| Property | Value |
|----------|-------|
| **Auth** | Admin only |

**Path Parameter:** UUID or username

**Response 200:** User object

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"invalid user identifier: {user_id}"` | Not UUID or valid username |
| 404 | `"no such user: {user_id}"` | User doesn't exist |

---

### PATCH /users/\<user_id\>

Update user fields.

| Property | Value |
|----------|-------|
| **Auth** | Admin only |

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `password` | string | New password |
| `email` | string | New email |
| `phone` | string | New phone |
| `is_admin` | boolean | Admin status |

**Response 204:** No content (success)

---

### PUT /users/\<user_id\>

Replace user data completely.

| Property | Value |
|----------|-------|
| **Auth** | Admin only |

**Request Body:**
```json
{
  "auth": {
    "login": "username",
    "password": "newpass",
    "email": "new@email.com",
    "isadmin": false
  }
}
```

**Response 204:** No content (success)

---

### DELETE /users/\<user_id\>

Delete a user and their avatar.

| Property | Value |
|----------|-------|
| **Auth** | Admin only |

**Business Rules:**
- Cannot delete yourself
- Deletes user's avatar file (if not default)

**Response 204:** No content (success)

**Errors:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | `"invalid user identifier: {user_id}"` | Bad format |
| 400 | `"cannot delete oneself"` | Trying to self-delete |
| 404 | `"no such user: {user_id}"` | User doesn't exist |

---

## Data Types Reference

### UUID

All IDs use UUID v4 format:
```
Pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Example: 550e8400-e29b-41d4-a716-446655440000
```

### DateTime

ISO 8601 format with timezone:
```
2026-01-26T10:30:00Z
2026-01-26T10:30:00+00:00
```

### Status Enums

**PAPS Status:**
| Value | Description |
|-------|-------------|
| `draft` | Not visible, still being edited |
| `published` | Active and accepting applications |
| `closed` | No longer accepting applications |
| `cancelled` | Cancelled by owner |

**SPAP Status:**
| Value | Description |
|-------|-------------|
| `pending` | Awaiting review |
| `accepted` | Application accepted |
| `rejected` | Application rejected |
| `withdrawn` | Withdrawn by applicant |

### Payment Types

| Value | Description |
|-------|-------------|
| `fixed` | Fixed total payment |
| `hourly` | Hourly rate |
| `negotiable` | Open to negotiation |

### File Constraints

| Context | Max Size | Formats |
|---------|----------|---------|
| Avatar | 5 MB | jpg, jpeg, png, gif, webp |
| Category Icon | 1 MB | jpg, jpeg, png, gif, webp, svg |
| PAPS Media | 50 MB | jpg, jpeg, png, gif, webp, mp4, avi, mov, mkv |
| SPAP Media | 50 MB | jpg, jpeg, png, gif, webp, mp4, avi, mov, mkv, pdf, doc, docx |

---

## Frontend Integration Guide

### Authentication Flow

```javascript
// 1. Register new user
const registerResponse = await fetch('/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
});
const { user_id } = await registerResponse.json();

// 2. Login to get token
const loginResponse = await fetch('/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    login: 'johndoe',  // Can be username, email, or phone
    password: 'SecurePass123!'
  })
});
const { token } = await loginResponse.json();

// 3. Use token for authenticated requests
const profileResponse = await fetch('/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### File Upload Examples

**Avatar Upload (multipart):**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

await fetch('/profile/avatar', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

**Multiple Media Upload:**
```javascript
const formData = new FormData();
for (const file of fileInput.files) {
  formData.append('media', file);
}

await fetch(`/paps/${papsId}/media`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### Location-Based Search

```javascript
// Get user's location
navigator.geolocation.getCurrentPosition(async (pos) => {
  const { latitude, longitude } = pos.coords;
  
  // Search for nearby jobs
  const response = await fetch(
    `/paps?lat=${latitude}&lng=${longitude}&max_distance=10&status=published`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  const { paps, total_count } = await response.json();
  // paps includes distance_km field
});
```

### Error Handling Pattern

```javascript
async function apiCall(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Unknown error');
  }
  
  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
}

// Usage
try {
  const paps = await apiCall('/paps');
} catch (error) {
  console.error('API Error:', error.message);
}
```

### Comment Thread Display

```javascript
// Load comments for a PAPS
const commentsResponse = await apiCall(`/paps/${papsId}/comments`);
const { comments, total_count } = commentsResponse;

// For each comment with replies, load the thread
for (const comment of comments) {
  if (comment.reply_count > 0) {
    const threadResponse = await apiCall(`/comments/${comment.id}/thread`);
    comment.replies = threadResponse.replies;
  }
}
```

### Application Flow

```javascript
// 1. Apply to a PAPS
const applyResponse = await apiCall(`/paps/${papsId}/apply`, {
  method: 'POST',
  body: JSON.stringify({
    message: 'I would love to work on this project!'
  })
});
const { spap_id } = applyResponse;

// 2. Upload supporting documents
const formData = new FormData();
formData.append('media', resumeFile);
await fetch(`/spap/${spap_id}/media`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

// 3. Check application status
const myApps = await apiCall('/spap/my');
```

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

## Support

For issues or questions, refer to:
- [Developer Guide](DEV.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [Test Data Setup](TEST_DATA_SETUP.md)
