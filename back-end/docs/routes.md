# Underboss API Documentation

## Overview

This document describes all implemented API routes for the Underboss application. The API follows REST principles and returns JSON responses.

**Documentation Links:**
- [Developer Guide](DEV.md) - Setup and development workflow
- [Test Data Setup](TEST_DATA_SETUP.md) - How to set up test users
- [API Test Results](API_TEST_RESULTS.md) - Latest test coverage
- [Changelog](CHANGELOG.md) - Recent changes

## Architecture

The API is organized into modular route handlers in `src/api/`:

| Module | Routes | Purpose |
|--------|--------|---------|
| **system.py** | `/uptime`, `/info`, `/stats`, `/who-am-i`, `/myself` | System health and user info |
| **auth.py** | `/register`, `/login` | Authentication and registration |
| **profile.py** | `/profile`, `/users/{id}/profile` | User profile management |
| **experience.py** | `/profile/experiences` | Work experience CRUD |
| **category.py** | `/categories` | Category management |
| **interest.py** | `/profile/interests` | User interest management |
| **paps.py** | `/paps` | Job postings with media |
| **user.py** | `/users` | User administration |

## Authentication

The API supports three authentication methods:

- **Token**: Bearer token in Authorization header (format: `underboss:username:timestamp:hash`)
- **Basic**: HTTP Basic Auth (username/email/phone + password)
- **Param**: Form parameters (login + password)

Users can log in using any of these identifiers:

- Username
- Email address
- Phone number

## Media Management

The application handles file uploads for:

- **Profile avatars**: Images only (jpg, jpeg, png, gif, webp) - max 5MB
- **PAPS media**: Images and videos (jpg, jpeg, png, gif, webp, mp4, avi, mov, mkv) - max 50MB

Media files are stored in the `/media` directory:

- Profile avatars: `/media/user/profile/`
- PAPS media: `/media/post/`

## API Routes

### System & Admin (src/api/system.py)

### GET /uptime

Check server health (testing only).

- **Auth**: None
- **Returns**: `{"app": "name", "up": "duration"}`

### GET /info

Get detailed system information.

- **Auth**: Admin
- **Query params**: `sleep` (float, optional) - delay for testing
- **Returns**: System info including versions, database, status

### GET /stats

Get API statistics.

- **Auth**: Admin
- **Returns**: Connection pool statistics

---

### Authentication & Registration (src/api/auth.py)

### POST /register

Register a new user account.

- **Auth**: None (open)
- **Body**:

    ```json
    {  "username": "johndoe",  "email": "john@example.com",  "phone": "+1234567890",  "password": "SecurePass123"}
    
    ```

- **Returns**: `{"user_id": "uuid"}` (201)
- **Validation**:
  - Username: 3-50 characters
  - Email: valid email format
  - Phone: optional, E.164 format
  - Password: configured requirements

### GET /login

Get authentication token using Basic auth.

- **Auth**: Basic (username/email/phone + password)
- **Returns**: `{"token": "jwt_token"}` (200)

### POST /login

Get authentication token using form parameters.

- **Auth**: Param (login + password in body)
- **Body**: `{"login": "user@example.com", "password": "pass"}`
- **Returns**: `{"token": "jwt_token"}` (201)

### GET /who-am-i

Get current authenticated username.

- **Auth**: Required
- **Returns**: Current username as string

### GET /myself

Get full current user data.

- **Auth**: Required
- **Returns**: Complete user object with profile

---

### User Profile Management (src/api/profile.py)

### GET /profile

Get current user's profile.

- **Auth**: Required
- **Returns**:

    ```json
    {  "user_id": "uuid",  "username": "johndoe",  "email": "john@example.com",  "first_name": "John",  "last_name": "Doe",  "display_name": "John D.",  "bio": "Developer",  "avatar_url": "/media/user/profile/uuid.jpg",  "date_of_birth": "1990-01-01",  "location_address": "New York, NY",  "location_lat": 40.7128,  "location_lng": -74.0060,  "timezone": "America/New_York",  "preferred_language": "en"}
    
    ```

### GET /users/<user_id>/profile

Get any user's public profile.

- **Auth**: None (open)
- **Returns**: Public profile data

### PUT /profile

Update current user's profile.

- **Auth**: Required
- **Body**: Any subset of profile fields
- **Returns**: 204 No Content

### POST /profile/avatar

Upload profile avatar image.

- **Auth**: Required
- **Body**: Image file (multipart/form-data or binary)
- **Accepts**: jpg, jpeg, png, gif, webp (max 5MB)
- **Returns**: `{"avatar_url": "/media/user/profile/uuid.jpg"}` (201)

### GET /media/user/profile/<filename>

Serve profile avatar image.

- **Auth**: None (open)
- **Returns**: Image file

---

### User Experiences (src/api/experience.py)

### GET /profile/experiences

Get current user's work experiences.

- **Auth**: Required
- **Returns**: Array of experience objects

### GET /users/<user_id>/experiences

Get any user's work experiences.

- **Auth**: None (open)
- **Returns**: Array of experience objects

### POST /profile/experiences

Add work experience.

- **Auth**: Required
- **Body**:

    ```json
    {  "title": "Software Engineer",  "company": "Tech Corp",  "description": "Built amazing things",  "start_date": "2020-01-01",  "end_date": "2022-12-31",  "is_current": false}
    
    ```

- **Returns**: `{"experience_id": "uuid"}` (201)

### PATCH /profile/experiences/<exp_id>

Update work experience.

- **Auth**: Required (owner only)
- **Body**: Any subset of experience fields
- **Returns**: 204 No Content

### DELETE /profile/experiences/<exp_id>

Delete work experience.

- **Auth**: Required (owner only)
- **Returns**: 204 No Content

---

### Categories (src/api/category.py)

### GET /categories

List all active categories.

- **Auth**: None (open)
- **Returns**: Array of category objects

    ```json
    [  {    "id": "uuid",    "name": "Web Development",    "slug": "web-development",    "description": "Web development jobs",    "parent_id": null,    "icon_url": "/icons/web.svg",    "display_order": 1,    "is_active": true  }]
    
    ```

### GET /categories/<category_id>

Get specific category.

- **Auth**: None (open)
- **Returns**: Category object

### POST /categories

Create new category.

- **Auth**: Admin only
- **Body**:

    ```json
    {  "name": "Mobile Development",  "slug": "mobile-development",  "description": "iOS and Android jobs",  "parent_id": null,  "icon_url": "/icons/mobile.svg"}
    
    ```

- **Returns**: `{"category_id": "uuid"}` (201)

### PATCH /categories/<category_id>

Update category.

- **Auth**: Admin only
- **Body**: Any subset of category fields
- **Returns**: 204 No Content

### DELETE /categories/<category_id>

Delete category.

- **Auth**: Admin only
- **Returns**: 204 No Content

---

### User Interests (src/api/interest.py)

### GET /profile/interests

Get current user's interests/skills.

- **Auth**: Required
- **Returns**: Array of interests with category details

    ```json
    [  {    "user_id": "uuid",    "category_id": "uuid",    "proficiency_level": 4,    "category_name": "Web Development",    "category_slug": "web-development",    "category_icon": "/icons/web.svg",    "added_at": "2024-01-01T00:00:00Z"  }]
    
    ```

### GET /users/<user_id>/interests

Get any user's interests.

- **Auth**: None (open)
- **Returns**: Array of interests

### POST /profile/interests

Add interest to profile.

- **Auth**: Required
- **Body**:

    ```json
    {  "category_id": "uuid",  "proficiency_level": 4}
    
    ```

- **Validation**: proficiency_level must be 1-5
- **Returns**: 201 Created

### PATCH /profile/interests/<category_id>

Update interest proficiency.

- **Auth**: Required
- **Body**: `{"proficiency_level": 5}`
- **Returns**: 204 No Content

### DELETE /profile/interests/<category_id>

Remove interest from profile.

- **Auth**: Required
- **Returns**: 204 No Content

---

### PAPS (Job Posts) (src/api/paps.py)

### GET /paps

List PAPS with filtering and smart permissions.

- **Auth**: Optional
- **Query params**:
  - `status`: Filter by status (draft, published, closed, cancelled)
  - `category_id`: Filter by category UUID
  - `lat`, `lng`: User location for distance calculation
  - `max_distance`: Maximum distance in km
- **Permissions**:
  - **Public** (no auth): Only published & public PAPS
  - **Authenticated**: Own PAPS + published & public
  - **Admin**: All PAPS
- **Returns**: Array of PAPS with owner info, media URLs, categories, and distance

    ```json
    [  {    "id": "uuid",    "owner_id": "uuid",    "owner_username": "johndoe",    "owner_email": "john@example.com",    "owner_name": "John Doe",    "owner_avatar": "/media/user/profile/uuid.jpg",    "title": "Need help moving furniture",    "subtitle": "Quick 2-hour job",    "description": "Moving 3 pieces of furniture...",    "status": "published",    "location_address": "123 Main St, NYC",    "location_lat": 40.7128,    "location_lng": -74.0060,    "location_timezone": "America/New_York",    "start_datetime": "2024-02-01T10:00:00Z",    "end_datetime": "2024-02-01T12:00:00Z",    "estimated_duration_minutes": 120,    "payment_amount": 50.00,    "payment_currency": "USD",    "payment_type": "fixed",    "max_applicants": 10,    "max_assignees": 2,    "is_public": true,    "media_urls": [      {"url": "/media/post/file1.jpg", "type": "image"},      {"url": "/media/post/file2.mp4", "type": "video"}    ],    "categories": [      {"id": "uuid", "name": "Moving", "is_primary": true}    ],    "distance_km": 5.2,    "created_at": "2024-01-15T08:00:00Z"  }]
    
    ```

### GET /paps/<paps_id>

Get specific PAPS with full details.

- **Auth**: Optional
- **Permissions**: Same as GET /paps
- **Returns**: PAPS object enriched with:
  - Owner profile details
  - All media URLs
  - All categories
  - Comments count
  - Applications count

### POST /paps

Create new PAPS job posting.

- **Auth**: Required
- **Body**:

    ```json
    {  "title": "Need help moving",  "subtitle": "Quick job",  "description": "Need 2 people to help move furniture for about 2 hours",  "status": "draft",  "location_address": "123 Main St, NYC",  "location_lat": 40.7128,  "location_lng": -74.0060,  "location_timezone": "America/New_York",  "start_datetime": "2024-02-01T10:00:00Z",  "end_datetime": "2024-02-01T12:00:00Z",  "estimated_duration_minutes": 120,  "payment_amount": 50.00,  "payment_currency": "USD",  "payment_type": "fixed",  "max_applicants": 10,  "max_assignees": 2,  "is_public": true}
    
    ```

- **Validation**:
  - Title: min 5 characters
  - Description: min 20 characters
  - Payment amount: > 0
  - Payment type: fixed, hourly, negotiable
  - Max applicants: 1-100
  - Max assignees: ≤ max_applicants
  - Coordinates: valid ranges if provided
  - Dates: end > start if both provided
- **Returns**: `{"paps_id": "uuid"}` (201)

### PUT /paps/<paps_id>

Update PAPS.

- **Auth**: Required (owner or admin)
- **Body**: Any subset of PAPS fields
- **Returns**: 204 No Content

### DELETE /paps/<paps_id>

Soft delete PAPS.

- **Auth**: Required (owner or admin)
- **Returns**: 204 No Content

---

### PAPS Media

### POST /paps/<paps_id>/media

Upload media for PAPS.

- **Auth**: Required (owner or admin)
- **Body**: Media file (multipart/form-data or binary)
- **Accepts**: Images (jpg, jpeg, png, gif, webp) or videos (mp4, avi, mov, mkv) - max 50MB
- **Returns**: `{"media_url": "/media/post/filename.jpg", "index": 1}` (201)

### GET /media/post/<filename>

Serve PAPS media file.

- **Auth**: None (open)
- **Returns**: Media file (image or video)

---

### Admin User Management (src/api/user.py)

These routes are only available when `APP_USERS = True` in configuration.

### GET /users

List all users (with optional filter).

- **Auth**: Admin
- **Query params**: `flt` (string, optional) - filter by username/email/phone
- **Returns**: Array of user objects

### POST /users

Create new user (admin).

- **Auth**: Admin
- **Body**:

    ```json
    {  "username": "newuser",  "email": "new@example.com",  "phone": "+1234567890",  "password": "SecurePass123",  "is_admin": false}
    
    ```

- **Returns**: `{"user_id": "uuid"}` (201)

### GET /users/<user_id>

Get user details.

- **Auth**: Admin
- **Returns**: User object

### PATCH /users/<user_id>

Update user.

- **Auth**: Admin
- **Body**: Any subset of user fields (password, email, phone, is_admin)
- **Returns**: 204 No Content

### DELETE /users/<user_id>

Delete user.

- **Auth**: Admin
- **Note**: Cannot delete yourself
- **Returns**: 204 No Content

---

## Error Responses

All endpoints may return these error codes:

- **400 Bad Request**: Invalid parameters or validation errors
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **405 Method Not Allowed**: HTTP method not supported
- **409 Conflict**: Resource already exists (e.g., duplicate username)
- **413 Payload Too Large**: File too large
- **415 Unsupported Media Type**: Invalid file type

Error response format:

```json
{
  "error": "Descriptive error message"
}

```

---

## Frontend Integration Tips

### Getting PAPS with Full Context

When fetching PAPS, the API automatically includes:

- Owner profile (name, avatar, contact)
- Media URLs (ready to display)
- Categories (for filtering/display)
- Statistics (comments count, applications count)

This reduces the number of API calls needed from the frontend.

### Login Flexibility

Users can log in with username, email, OR phone number:

```jsx
// All of these work:
login({login: "johndoe", password: "pass"})
login({login: "john@example.com", password: "pass"})
login({login: "+1234567890", password: "pass"})

```

### File Uploads

For file uploads, use either:

**Multipart form data:**

```jsx
const formData = new FormData();
formData.append('image', file);
fetch('/profile/avatar', {
  method: 'POST',
  headers: {'Authorization': `Bearer ${token}`},
  body: formData
});

```

**Binary data:**

```jsx
fetch('/profile/avatar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'image/jpeg'
  },
  body: imageBlob
});

```

### Distance-Based PAPS Search

To show nearby jobs:

```jsx
navigator.geolocation.getCurrentPosition(pos => {
  const {latitude, longitude} = pos.coords;
  fetch(`/paps?lat=${latitude}&lng=${longitude}&max_distance=10`)
    .then(res => res.json())
    .then(paps => {
      // PAPS are sorted by creation date
      // Each includes distance_km field
    });
});

```

---

## Next Steps

### Not Yet Implemented

The following features from the business logic still need implementation:

1. **Comments System**
    - GET /paps/<paps_id>/comments
    - POST /paps/<paps_id>/comments
    - PATCH /comments/<comment_id>
    - DELETE /comments/<comment_id>
2. **SPAP (Applications)**
    - GET /paps/<paps_id>/applications
    - POST /paps/<paps_id>/apply
    - GET /applications/<spap_id>
    - PATCH /applications/<spap_id>
    - DELETE /applications/<spap_id>
3. **ASAP (Assignments)**
    - GET /assignments
    - GET /assignments/<asap_id>
    - PATCH /assignments/<asap_id>
    - POST /assignments/<asap_id>/media
4. **Payments**
    - GET /assignments/<asap_id>/payments
    - POST /assignments/<asap_id>/payments
    - GET /payments/<payment_id>
5. **Ratings & Reviews**
    - GET /assignments/<asap_id>/ratings
    - POST /assignments/<asap_id>/ratings
6. **Chat System**
    - GET /chats/<thread_id>
    - GET /chats/<thread_id>/messages
    - POST /chats/<thread_id>/messages
    - PATCH /messages/<message_id>
7. **Scheduling**
    - POST /paps/<paps_id>/schedule
    - GET /paps/<paps_id>/schedule
    - PATCH /schedules/<schedule_id>
    - DELETE /schedules/<schedule_id>

These features follow similar patterns to the implemented routes and can be added incrementally.
