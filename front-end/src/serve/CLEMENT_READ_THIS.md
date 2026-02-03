# Serve Module - Complete API Documentation

> **Last Updated**: February 2026  
> **Version**: 3.1  
> **Author**: Underboss Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [The `serv()` Function](#the-serv-function)
5. [Authentication Flow](#authentication-flow)
6. [Complete Endpoint Reference](#complete-endpoint-reference)
   - [System Endpoints](#system-endpoints)
   - [Authentication Endpoints](#authentication-endpoints)
   - [Profile Endpoints](#profile-endpoints)
   - [Avatar Endpoints](#avatar-endpoints)
   - [Experiences Endpoints](#experiences-endpoints)
   - [Interests Endpoints](#interests-endpoints)
   - [Categories Endpoints](#categories-endpoints)
   - [PAPS (Jobs) Endpoints](#paps-jobs-endpoints)
   - [PAPS Media Endpoints](#paps-media-endpoints)
   - [PAPS Schedule Endpoints](#paps-schedule-endpoints)
   - [PAPS Categories Endpoints](#paps-categories-endpoints)
   - [SPAP (Applications) Endpoints](#spap-applications-endpoints)
   - [ASAP (Assignments) Endpoints](#asap-assignments-endpoints)
   - [Payments Endpoints](#payments-endpoints)
   - [Ratings Endpoints](#ratings-endpoints)
   - [Comments Endpoints](#comments-endpoints)
   - [Chat Endpoints](#chat-endpoints)
   - [Admin Endpoints](#admin-endpoints)
7. [Type Reference](#type-reference)
8. [Error Handling](#error-handling)
9. [Advanced Usage](#advanced-usage)
10. [Adding New Endpoints](#adding-new-endpoints)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The `serve` module is the **single point of communication** between the Underboss mobile app and the backend API. Every API call goes through one function: `serv()`.

### Why Use This?

- **Type Safety**: Full TypeScript support with auto-complete
- **Validation**: Client-side validation before network calls
- **Consistency**: Same interface for all 80+ endpoints
- **Auth Management**: Automatic token handling
- **Error Handling**: Consistent error format across all endpoints

### Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:5000` |
| Production | `https://api.underboss.com` |

---

## Architecture

### Folder Structure

```
serve/
├── index.ts              # Main entry point - import from here!
├── serv.ts               # Core orchestrator function
├── run-tests.ts          # Automated test runner
├── serv.test.ts          # Usage examples
├── CLEMENT_READ_THIS.md  # This documentation
│
├── common/               # Shared utilities
│   ├── types.ts          # Base types (UUID, dates, enums, Gender, Currency, etc.)
│   ├── errors.ts         # ApiError class
│   └── index.ts
│
├── auth/                 # Authentication
│   ├── types.ts          # LoginRequest, UserInfo, etc.
│   ├── validators.ts     # Input validation
│   ├── endpoints.ts      # Endpoint config
│   └── index.ts
│
├── profile/              # User profiles
│   ├── types.ts          # UserProfile, Experience, Interest, ProfileRatingResponse
│   ├── validators.ts
│   ├── endpoints.ts
│   └── index.ts
│
├── categories/           # Category management
│   ├── types.ts
│   ├── validators.ts
│   ├── endpoints.ts
│   └── index.ts
│
├── paps/                 # Job postings
│   ├── types.ts          # Paps, PapsDetail, Schedule (with RecurrenceRule)
│   ├── validators.ts
│   ├── endpoints.ts
│   └── index.ts
│
├── spap/                 # Applications
│   ├── types.ts
│   ├── validators.ts
│   ├── endpoints.ts
│   └── index.ts
│
├── asap/                 # Assignments
│   ├── types.ts
│   ├── validators.ts
│   ├── endpoints.ts
│   └── index.ts
│
├── payments/             # Payment processing
│   ├── types.ts          # Payment, PaymentMethod, Currency
│   ├── validators.ts
│   ├── endpoints.ts
│   └── index.ts
│
├── ratings/              # Rating system (via ASAP)
│   ├── types.ts          # UserRating, RatingCreateRequest
│   ├── validators.ts
│   ├── endpoints.ts
│   └── index.ts
│
├── comments/             # Comment system (with threading)
│   ├── types.ts          # Comment, CommentThread
│   ├── validators.ts
│   ├── endpoints.ts
│   └── index.ts
│
├── chat/                 # Messaging (uses /chat singular path)
│   ├── types.ts          # ChatThread, ChatMessage, MessageType
│   ├── validators.ts
│   ├── endpoints.ts
│   └── index.ts
│
└── system/               # System & admin
    ├── types.ts          # AdminUser, SystemInfoResponse
    ├── validators.ts
    ├── endpoints.ts
    └── index.ts
```

---

## Quick Start

### Import

```typescript
// Always import from the main index
import { serv } from '../serve';

// Import with specific types
import { 
  serv, 
  UserInfo, 
  Paps, 
  PapsStatus,
  PaymentMethod,
  Currency,
  Gender,
  ApiError 
} from '../serve';
```

### Basic Example

```typescript
import { serv, ApiError } from '../serve';

async function example() {
  try {
    // Login
    const user = await serv('login', {
      login: 'user@example.com',
      password: 'password123'
    });
    console.log('Welcome', user.username);

    // Get profile
    const profile = await serv('profile.get');
    console.log('Name:', profile.first_name);

    // List jobs
    const result = await serv('paps.list', {
      status: 'published',
      limit: 10
    });
    console.log('Found', result.total, 'jobs');

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('API Error:', error.message);
    }
  }
}
```

---

## The `serv()` Function

### Signature

```typescript
async function serv<T extends Endpoint>(
  endpoint: T,
  data?: RequestData[T]
): Promise<ResponseData[T]>
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `endpoint` | `string` | The endpoint name (e.g., `'login'`, `'paps.list'`) |
| `data` | `object` | Request data (optional for GET requests) |

### How It Works

1. **Lookup**: Finds endpoint configuration by name
2. **Validate**: Runs client-side validation on input
3. **Build URL**: Replaces path parameters (e.g., `{paps_id}`)
4. **Auth**: Adds token header if required
5. **Request**: Makes HTTP request with proper method
6. **Process**: Handles special responses (e.g., save token on login)
7. **Return**: Returns typed response data

### Example Flow

```typescript
// You call:
await serv('paps.get', { paps_id: '123-456' });

// Internally:
// 1. Looks up config: { method: 'GET', path: '/paps/{paps_id}', auth: true }
// 2. Validates: paps_id is UUID ✓
// 3. Builds URL: /paps/123-456
// 4. Adds header: Authorization: Bearer <token>
// 5. Makes GET request
// 6. Returns PapsDetail object
```

---

## Authentication Flow

### Login Flow

```typescript
// 1. Register (optional - creates account)
const { userId } = await serv('register', {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'SecurePass123!'
});

// 2. Login - Token is saved automatically!
const user = await serv('login', {
  login: 'john@example.com',  // username, email, or phone
  password: 'SecurePass123!'
});

// Token is now stored in AppSettings
// All subsequent requests include it automatically

// 3. Verify auth state
const { username } = await serv('whoami');

// 4. Get full user info
const me = await serv('myself');
```

### Token Management

```typescript
import { 
  isAuthenticated, 
  setAuthToken, 
  clearAuth,
  getCurrentUser 
} from '../serve';

// Check if logged in
if (isAuthenticated()) {
  const user = getCurrentUser();
  console.log('Logged in as:', user?.username);
}

// Manual token management (rarely needed)
setAuthToken('custom-token');
clearAuth(); // Logout
```

---

## Complete Endpoint Reference

---

### System Endpoints

#### `system.uptime`

Check if server is running. **No authentication required.**

```typescript
const result = await serv('system.uptime');
```

**Response:**
```typescript
{
  app: string;    // "underboss"
  up: string;     // Server uptime as time delta string (e.g., "0:05:23")
}
```

---

#### `system.info`

Get comprehensive server information. **Requires authentication (any user).**

```typescript
const info = await serv('system.info');
```

**Response:**
```typescript
{
  app: string;               // "underboss"
  git: {
    remote: string;
    branch: string;
    commit: string;
    date: string;
  };
  authentication: {
    config: string[];
    user: string;
    auth: string;
  };
  db: {
    type: string;            // e.g., "postgresql"
    driver: string;
    version: string;
  };
  status: {
    started: string;         // ISO datetime
    now: string;             // ISO datetime
    connections: number;
    hits: number;
  };
  version: Record<string, string>;  // Dependency versions
}
```

---

#### `system.stats`

Get database connection pool statistics. **Requires authentication (any user).**

```typescript
const stats = await serv('system.stats');
```

**Response:**
```typescript
{
  pool_statistics: object;   // Database pool stats
}
```

---

### Authentication Endpoints

#### `register`

Create a new user account.

```typescript
const result = await serv('register', {
  username: 'john_doe',           // Required: 3-50 chars, alphanumeric + underscore
  email: 'john@example.com',      // Required: Valid email
  password: 'SecurePass123!',     // Required: 8+ chars, mixed case + number
  phone: '+1234567890'            // Optional: E.164 format
});
```

**Request:**
```typescript
interface RegisterRequest {
  username: string;     // 3-50 characters
  email: string;        // Valid email format
  password: string;     // Min 8 chars, uppercase, lowercase, number
  phone?: string;       // Optional, E.164 format
}
```

**Response:**
```typescript
{
  user_id: string;       // UUID of created user
}
```

**Errors:**
| Code | Description |
|------|-------------|
| 400 | Invalid input (validation failed) |
| 409 | Username or email already exists |

---

#### `login`

Authenticate and get access token. **Token is saved automatically.**

```typescript
const user = await serv('login', {
  login: 'john@example.com',  // Username, email, or phone
  password: 'SecurePass123!'
});
```

**Request:**
```typescript
interface LoginRequest {
  login: string;        // Username, email, or phone
  password: string;     // Account password
}
```

**Response:**
```typescript
interface UserInfo {
  userId: string;       // UUID
  username: string;     // Login username
  email: string;        // User email
  isAdmin: boolean;     // Admin status
}
```

**Side Effects:**
- Token is saved to `AppSettings.token`
- Username is saved to `AppSettings.username`

**Errors:**
| Code | Description |
|------|-------------|
| 401 | Invalid credentials |
| 403 | Account suspended |

---

#### `whoami`

Quick authentication check. Returns the current user's login identifier.

```typescript
const result = await serv('whoami');
console.log('Logged in as:', result.user);
```

**Response:**
```typescript
{
  user: string;   // The username/email/phone used to login
}
```

---

#### `myself`

Get full current user information.

```typescript
const me = await serv('myself');
```

**Response:**
```typescript
interface UserInfo {
  userId: string;
  username: string;
  email: string;
  isAdmin: boolean;
}
```

---

### Profile Endpoints

#### `profile.get`

Get current user's profile.

```typescript
const profile = await serv('profile.get');
```

**Response:**
```typescript
interface UserProfile {
  user_id: string;
  username: string;
  email?: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  bio: string | null;
  gender: 'M' | 'F' | 'O' | 'N' | null;  // Male, Female, Other, Not specified
  avatar_url: string | null;             // Path to avatar (e.g., "media/user/profile/uuid.png")
  date_of_birth: string | null;          // YYYY-MM-DD
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  timezone: string | null;
  preferred_language: string | null;
  created_at?: string;                   // ISO8601
  updated_at?: string;                   // ISO8601
}
```

**Note:** User rating is retrieved separately via `profile.rating` endpoint.

**Note:** Avatar images are served statically. Use `getMediaUrl(profile.avatar_url)` to get the full URL.

---

#### `profile.update`

Update current user's profile. Uses **PUT** method (replaces all fields).

For partial updates, use `profile.patch` instead.

```typescript
await serv('profile.update', {
  first_name: 'John',
  last_name: 'Doe',
  bio: 'Software developer and coffee enthusiast',
  gender: 'M',                       // 'M', 'F', 'O', or 'N'
  location_lat: 37.7749,
  location_lng: -122.4194,
  location_address: 'San Francisco, CA'
});
```

**Request:**
```typescript
interface ProfileUpdateRequest {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  bio?: string | null;
  gender?: 'M' | 'F' | 'O' | 'N' | null;
  date_of_birth?: string | null;     // YYYY-MM-DD
  location_address?: string | null;
  location_lat?: number | null;      // -90 to 90
  location_lng?: number | null;      // -180 to 180
  timezone?: string | null;
  preferred_language?: string | null;
}
```

**Response:** `204 No Content`

---

#### `profile.patch`

Partially update current user's profile. Uses **PATCH** method.

```typescript
await serv('profile.patch', {
  bio: 'Updated bio only'
});
```

**Request:** Same as `profile.update` - all fields optional

**Response:** `204 No Content`

---

#### `profile.getByUsername`

Get another user's public profile. **No authentication required.**

```typescript
const profile = await serv('profile.getByUsername', {
  username: 'jane_doe'
});
```

**Response:** `UserProfile` (public fields only)

---

#### `profile.updateByUsername`

Update a user's profile by username. **Must be authenticated as that user.**

```typescript
await serv('profile.updateByUsername', {
  username: 'jane_doe',
  bio: 'Updated bio'
});
```

**Response:** `204 No Content`

**Errors:**
| Code | Description |
|------|-------------|
| 403 | Can only update your own profile |
| 404 | User not found |

---

#### `profile.rating`

Get current user's rating summary.

```typescript
const rating = await serv('profile.rating');
console.log('Rating:', rating.rating_average);
console.log('Count:', rating.rating_count);
```

**Response:**
```typescript
interface ProfileRatingResponse {
  rating_average: number;
  rating_count: number;
}
```

---

### Avatar Endpoints

**Important:** Avatar images are served statically via the `/media/` path. There are no `avatar.get` or `avatar.getByUsername` endpoints. Instead:

1. Get the user's profile to obtain `avatar_url`
2. Use `getMediaUrl(avatar_url)` to construct the full URL
3. Use the URL directly in an `<Image>` component

```typescript
import { serv, getMediaUrl } from '../serve';

// Get avatar URL from profile
const profile = await serv('profile.get');
const avatarUrl = getMediaUrl(profile.avatar_url);  // Full URL or null

// For another user
const otherProfile = await serv('profile.getByUsername', { username: 'jane_doe' });
const otherAvatarUrl = getMediaUrl(otherProfile.avatar_url);
```

#### `avatar.upload`

Upload profile picture.

```typescript
import { launchImageLibrary } from 'react-native-image-picker';

// Pick image
const result = await launchImageLibrary({ mediaType: 'photo' });

if (result.assets?.[0]) {
  const file = {
    uri: result.assets[0].uri,
    type: result.assets[0].type,
    name: result.assets[0].fileName,
  } as any;

  const { avatar_url } = await serv('avatar.upload', { file });
  console.log('Avatar URL:', avatar_url);
}
```

**Request:**
```typescript
{
  file: Blob | File;  // Image file (PNG, JPG, GIF, WEBP)
}
```

**Response:**
```typescript
{
  avatar_url: string;  // e.g., "media/user/profile/{user_id}.png"
}
```

**Validation:**
- Max size: 5 MB
- Allowed types: PNG, JPG, JPEG, GIF, WEBP

---

#### `avatar.delete`

Remove profile picture.

```typescript
await serv('avatar.delete');
```

**Response:** `204 No Content`

---

**React Native Component Example:**

```typescript
import React, { useEffect, useState } from 'react';
import { Image, ActivityIndicator, View } from 'react-native';
import { serv, getMediaUrl } from '../serve';

interface UserAvatarProps {
  username: string;
  size?: number;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ username, size = 50 }) => {
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAvatar() {
      try {
        const profile = await serv('profile.getByUsername', { username });
        setAvatarUri(getMediaUrl(profile.avatar_url));
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAvatar();
  }, [username]);

  if (loading) {
    return <ActivityIndicator size="small" />;
  }

  return (
    <Image
      source={avatarUri ? { uri: avatarUri } : require('./default-avatar.png')}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  );
};
```

---

### Experiences Endpoints

Work experience entries on user profile.

#### `experiences.list`

Get current user's experiences.

```typescript
const experiences = await serv('experiences.list');
```

**Response:**
```typescript
Experience[]

interface Experience {
  experience_id: string;         // UUID
  user_id: string;
  title: string;                 // Job title (2+ chars)
  company: string | null;        // Company name
  description: string | null;    // Job description
  start_date: string;            // ISO8601 datetime
  end_date: string | null;       // ISO8601 or null if is_current
  is_current: boolean;           // Currently working here
  display_order: number;         // For sorting
  created_at: string;            // ISO8601
  updated_at?: string;
}
```

---

#### `experiences.create`

Add work experience.

```typescript
const result = await serv('experiences.create', {
  title: 'Senior Developer',
  company: 'Tech Corp',                  // Optional
  start_date: '2020-01-15T00:00:00Z',
  end_date: '2023-06-30T00:00:00Z',      // Omit if is_current: true
  is_current: false,                     // Set to true if current job
  description: 'Led development of mobile applications',
  display_order: 1
});
```

**Request:**
```typescript
interface ExperienceCreateRequest {
  title: string;           // Required (2+ chars)
  company?: string;        // Optional
  description?: string;    // Optional
  start_date: string;      // ISO8601, required
  end_date?: string;       // ISO8601, required if is_current is false
  is_current?: boolean;    // Default: false
  display_order?: number;
}
```

**Response:**
```typescript
{
  experience_id: string;   // UUID of created experience
}
```

**Validation:**
- `title`: At least 2 characters
- Cannot set both `is_current: true` AND provide `end_date`
- `end_date` must be after `start_date` if provided

---

#### `experiences.update`

Update existing experience. Uses **PATCH** method.

```typescript
await serv('experiences.update', {
  experience_id: 'uuid-here',
  title: 'Lead Developer',
  is_current: true,
  end_date: null               // Clear end_date when marking as current
});
```

**Request:**
```typescript
interface ExperienceUpdateRequest {
  experience_id: string;   // Required (path param)
  title?: string;
  company?: string | null;
  description?: string | null;
  start_date?: string;     // ISO8601
  end_date?: string | null;
  is_current?: boolean;
  display_order?: number;
}
```

**Response:** `204 No Content`

**Errors:**
| Code | Description |
|------|-------------|
| 400 | Invalid date validation or experience ID format |
| 403 | Not your experience |
| 404 | Experience not found |

---

#### `experiences.delete`

Remove experience.

```typescript
await serv('experiences.delete', {
  experience_id: 'uuid-here'
});
```

**Response:** `204 No Content`

---

#### `experiences.listByUsername`

Get another user's work experiences. **No authentication required.**

```typescript
const experiences = await serv('experiences.listByUsername', {
  username: 'jane_doe'
});
```

**Response:** `Experience[]`

---

### Interests Endpoints

Category interests linked to user profile.

#### `interests.list`

Get current user's interests.

```typescript
const interests = await serv('interests.list');
```

**Response:**
```typescript
Interest[]

interface Interest {
  category_id: string;           // Category UUID
  category_name: string;
  category_slug: string;
  proficiency_level: 1 | 2 | 3 | 4 | 5;  // Proficiency level
  created_at: string;
}
```

---

#### `interests.create`

Add interest.

```typescript
await serv('interests.create', {
  category_id: 'category-uuid',
  proficiency_level: 4           // Optional: 1-5, default: 1
});
```

**Request:**
```typescript
interface InterestCreateRequest {
  category_id: string;           // Required
  proficiency_level?: 1 | 2 | 3 | 4 | 5;  // Default: 1
}
```

**Response:** `201 Created` (empty body)

**Errors:**
| Code | Description |
|------|-------------|
| 400 | Invalid category_id format or proficiency level |
| 404 | Category not found |
| 409 | Interest already exists |

---

#### `interests.update`

Update interest (change proficiency level).

```typescript
await serv('interests.update', {
  category_id: 'category-uuid',  // Use category_id, not interest_id
  proficiency_level: 5
});
```

**Request:**
```typescript
interface InterestUpdateRequest {
  category_id: string;           // Required (path param)
  proficiency_level: 1 | 2 | 3 | 4 | 5;  // Required
}
```

**Response:** `204 No Content`

---

#### `interests.delete`

Remove interest.

```typescript
await serv('interests.delete', {
  category_id: 'category-uuid'   // Use category_id, not interest_id
});
```

**Response:** `204 No Content`

**Errors:**
| Code | Description |
|------|-------------|
| 400 | Invalid category_id format |
| 404 | Interest not found |

---

#### `interests.listByUsername`

Get another user's interests. **No authentication required.**

```typescript
const interests = await serv('interests.listByUsername', {
  username: 'jane_doe'
});
```

**Response:** `Interest[]`

---

### Categories Endpoints

Job categories for filtering and organization.

#### `categories.list`

Get all categories.

```typescript
const categories = await serv('categories.list');
```

**Response:**
```typescript
Category[]

interface Category {
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  parent_id: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}
```

---

#### `categories.get`

Get single category.

```typescript
const category = await serv('categories.get', {
  category_id: 'uuid'
});
```

---

#### `categories.create` (Admin)

Create category.

```typescript
const result = await serv('categories.create', {
  name: 'Web Development',
  slug: 'web-development',       // Optional, auto-generated
  description: 'Web development services',
  parent_id: 'parent-uuid',      // Optional
  is_active: true,
  display_order: 10
});
```

---

#### `categories.update` (Admin)

Update category. Uses **PATCH** method.

```typescript
await serv('categories.update', {
  category_id: 'uuid',
  name: 'Full Stack Development',
  is_active: true
});
```

**Response:** `204 No Content`

---

#### `categories.delete` (Admin)

Delete category.

```typescript
await serv('categories.delete', {
  category_id: 'uuid'
});
```

**Response:** `204 No Content`

**Side Effects:**
- Deletes category icon from disk

---

#### `categories.iconUpload` (Admin)

Upload category icon.

```typescript
const result = await serv('categories.iconUpload', {
  category_id: 'uuid',
  file: imageFile
});
```

**Response:**
```typescript
{
  icon_url: string;  // e.g., "/media/category/{category_id}.png"
}
```

**Validation:**
- Max size: 1 MB
- Allowed types: PNG, JPEG, JPG, GIF, WEBP, SVG

---

#### `categories.iconDelete` (Admin)

Delete category icon.

```typescript
await serv('categories.iconDelete', {
  category_id: 'uuid'
});
```

**Response:** `204 No Content`

---

### PAPS (Jobs) Endpoints

Job postings - the core of Underboss.

**PAPS Statuses:**
- `draft` - Not published yet
- `open` - Open for applications
- `published` - Publicly visible
- `closed` - No longer accepting applications
- `cancelled` - Job cancelled

**Payment Types:**
- `fixed` - Fixed price
- `hourly` - Hourly rate
- `negotiable` - To be negotiated

#### `paps.list`

List/search jobs with filters.

```typescript
const result = await serv('paps.list', {
  // Filters
  status: 'published',
  category_id: 'uuid',             // Filter by category
  owner_username: 'john_doe',      // Partial match on owner username

  // Location search
  lat: 37.7749,
  lng: -122.4194,
  max_distance: 25,                // km

  // Text search
  title_search: 'developer',       // Search in title and description

  // Payment filter
  min_price: 100,
  max_price: 1000,
  payment_type: 'fixed'
});

console.log(`Found ${result.total_count} jobs`);
result.paps.forEach(job => {
  console.log(job.title, job.payment_amount);
});
```

**Request:**
```typescript
interface PapsListParams {
  status?: 'draft' | 'open' | 'published' | 'closed' | 'cancelled';
  category_id?: string;
  lat?: number;
  lng?: number;
  max_distance?: number;           // km, requires lat/lng
  min_price?: number;
  max_price?: number;
  payment_type?: 'fixed' | 'hourly' | 'negotiable';
  owner_username?: string;         // Partial match
  title_search?: string;           // Search in title and description
}
```

**Notes:**
- Admins see ALL paps (no limit)
- Non-admin users see up to 1000 paps, ranked by interest match score

**Response:**
```typescript
interface PapsListResponse {
  paps: Paps[];
  total_count: number;
}

interface Paps {
  id: string;                       // UUID
  owner_id: string;
  owner_username: string;
  title: string;
  subtitle: string | null;
  description: string;
  status: PapsStatus;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_timezone: string | null;
  start_datetime: string | null;    // When job starts
  end_datetime: string | null;      // When job ends
  estimated_duration_minutes: number | null;
  payment_amount: number | null;
  payment_currency: string;         // e.g., "USD"
  payment_type: 'fixed' | 'hourly' | 'negotiable';
  max_applicants: number | null;
  max_assignees: number | null;
  is_public: boolean;
  publish_at: string | null;        // Scheduled publish time
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  categories: Category[];           // Associated categories
}
```

---

#### `paps.get`

Get detailed job information.

```typescript
const job = await serv('paps.get', {
  paps_id: 'uuid'
});
```

**Response:**
```typescript
interface PapsDetail extends Paps {
  comments_count: number;          // Number of comments
  applications_count: number;      // Number of applications (SPAPs)
}
```

---

#### `paps.create`

Create a job posting.

```typescript
const result = await serv('paps.create', {
  title: 'Need React Native Developer',      // Required: 5+ chars
  description: 'Looking for an experienced React Native developer...',  // Required: 20+ chars
  payment_amount: 5000,                      // Required: > 0
  payment_currency: 'USD',                   // Optional, default: 'USD'
  payment_type: 'fixed',                     // 'fixed', 'hourly', 'negotiable'
  status: 'draft',                           // 'draft', 'published', etc.
  subtitle: 'Mobile app project',            // Optional
  location_address: 'San Francisco, CA',
  location_lat: 37.7749,
  location_lng: -122.4194,
  location_timezone: 'America/Los_Angeles',
  start_datetime: '2025-02-01T09:00:00Z',    // Required for 'published' status
  end_datetime: '2025-02-28T17:00:00Z',      // Must be after start_datetime
  estimated_duration_minutes: 2400,          // 40 hours
  max_applicants: 10,                        // 1-100, default: 10
  max_assignees: 1,                          // Must not exceed max_applicants
  is_public: true,                           // Default: true
  categories: ['uuid1', { category_id: 'uuid2', is_primary: true }],  // Optional
  publish_at: '2025-01-15T00:00:00Z',        // Scheduled publish time
  expires_at: '2025-12-31T23:59:59Z'
});

console.log('Created job:', result.paps_id);
```

**Response:**
```typescript
{
  paps_id: string;   // UUID of created job
}
```

**Validation:**
- `title`: At least 5 characters
- `description`: At least 20 characters
- `payment_amount`: Must be positive
- `max_applicants`: 1-100
- `max_assignees`: Must not exceed max_applicants
- `location_lat`/`location_lng`: Both required if one is provided
- `end_datetime`: Must be after start_datetime
- `start_datetime`: Required for published status

---

#### `paps.update`

Update job posting. Uses **PUT** method.

```typescript
await serv('paps.update', {
  paps_id: 'uuid',
  title: 'Updated Title',
  payment_amount: 6000,
  status: 'published'
});
```

**Request:** Same fields as `paps.create` (all optional)

**Response:** `204 No Content`

**Errors:**
| Code | Description |
|------|-------------|
| 400 | Invalid PAP ID format or validation failed |
| 403 | Not owner or admin |
| 404 | PAPS not found |

---

#### `paps.updateStatus`

Update only the status of a PAPS.

```typescript
const result = await serv('paps.updateStatus', {
  paps_id: 'uuid',
  status: 'closed'
});
console.log('New status:', result.status);
```

**Request:**
```typescript
interface PapsStatusUpdateRequest {
  status: 'draft' | 'open' | 'published' | 'closed' | 'cancelled';
}
```

**Response:**
```typescript
{
  status: string;   // The new status
}
```

**Valid Transitions:**
- `draft` → `published` or `open`
- `published`/`open` → `closed` (deletes remaining SPAPs)
- `published`/`open` → `cancelled`
- `closed` → `published`/`open` (if max_assignees not reached)
- `cancelled` → Cannot be modified

**Side Effects:**
- When closing/cancelling: All pending SPAPs are deleted, their chat threads deleted

---

#### `paps.delete`

Soft delete job posting.

```typescript
await serv('paps.delete', {
  paps_id: 'uuid'
});
```

**Response:** `204 No Content`

**Side Effects:**
- Soft delete (sets deleted_at timestamp)
- Deletes all media files from disk (PAPS, SPAP, ASAP media)
- Deletes all SPAPs and ASAPs for this PAPS
- Deletes all comments

**Errors:**
| Code | Description |
|------|-------------|
| 400 | Cannot delete PAPS with active assignments or invalid ID |
| 403 | Not owner or admin |
| 404 | PAPS not found |

---

### PAPS Media Endpoints

#### `paps.media.list`

Get job media files.

```typescript
const result = await serv('paps.media.list', {
  paps_id: 'uuid'
});
```

**Response:**
```typescript
{
  paps_id: string;
  media_count: number;
  media: MediaItem[];
}

interface MediaItem {
  media_id: string;
  media_url: string;                 // e.g., "/media/post/{media_id}.jpg"
  media_type: 'image' | 'video' | 'document';
  file_size_bytes: number;
  mime_type: string;                 // e.g., "image/jpeg"
  display_order: number;
}
```

**Note:** Media files are served statically. Use `getMediaUrl(media_url)` to get full URL.

---

#### `paps.media.upload`

Upload media to job. Supports multiple files.

```typescript
const files = [imageFile1, imageFile2];  // Array of Blob/File

const result = await serv('paps.media.upload', {
  paps_id: 'uuid',
  files: files
});
```

**Response:**
```typescript
{
  uploaded_media: MediaItem[];
  count: number;
}
```

**Validation:**
- Allowed types: PNG, JPEG, JPG, GIF, WEBP, MP4, MOV, PDF
- Max size: 50 MB per file
- Images are compressed automatically

**Note:** Media files are served statically at `/media/post/{media_id}.{ext}`.

---

#### `paps.media.delete`

Delete media from job.

```typescript
await serv('paps.media.delete', {
  media_id: 'media-uuid'
});
```

**Response:** `204 No Content`

**Side Effects:**
- Deletes file from disk

---

### PAPS Schedule Endpoints

**Recurrence Rules:**
- `DAILY` - Every day
- `WEEKLY` - Every week
- `MONTHLY` - Every month
- `YEARLY` - Every year
- `CRON` - Custom cron expression

#### `paps.schedule.list`

Get job schedules.

```typescript
const schedules = await serv('paps.schedule.list', {
  paps_id: 'uuid'
});
```

**Response:**
```typescript
PapsSchedule[]

interface PapsSchedule {
  schedule_id: string;               // UUID
  paps_id: string;
  recurrence_rule: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CRON';
  cron_expression: string | null;    // For 'CRON' rule
  start_date: string | null;         // ISO8601
  end_date: string | null;           // ISO8601
  next_run_at: string | null;        // Next scheduled run (ISO8601)
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}
```

---

#### `paps.schedule.get`

Get specific schedule details.

```typescript
const schedule = await serv('paps.schedule.get', {
  paps_id: 'paps-uuid',
  schedule_id: 'schedule-uuid'
});
```

**Response:** `PapsSchedule`

---

#### `paps.schedule.create`

Create schedule entry.

```typescript
const result = await serv('paps.schedule.create', {
  paps_id: 'uuid',
  recurrence_rule: 'WEEKLY',
  start_date: '2025-03-01T00:00:00Z',
  end_date: '2025-06-30T00:00:00Z',
  is_active: true
});

// Or with custom cron
const customResult = await serv('paps.schedule.create', {
  paps_id: 'uuid',
  recurrence_rule: 'CRON',
  cron_expression: '0 9 * * 1-5',  // 9 AM weekdays
  start_date: '2025-03-01T00:00:00Z'
});

console.log('Created schedule:', result.schedule_id);
```

**Request:**
```typescript
interface ScheduleCreateRequest {
  recurrence_rule: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CRON';
  cron_expression?: string;        // Required if recurrence_rule is 'CRON'
  start_date?: string;             // ISO8601, defaults to current date
  end_date?: string;               // ISO8601, must be >= start_date
  next_run_at?: string;            // ISO8601, computed if not provided
}
```

**Response:**
```typescript
{
  schedule_id: string;
}
```

**Validation:**
- `recurrence_rule`: Must be one of: DAILY, WEEKLY, MONTHLY, YEARLY, CRON (case-insensitive input)
- `cron_expression`: Required when recurrence_rule is 'CRON'
- `end_date`: Must be after or equal to start_date

---

#### `paps.schedule.update`

Update schedule. Uses **PUT** method.

```typescript
await serv('paps.schedule.update', {
  paps_id: 'paps-uuid',
  schedule_id: 'schedule-uuid',
  recurrence_rule: 'MONTHLY',
  is_active: false
});
```

**Request:** Same fields as `paps.schedule.create` plus `schedule_id` (all optional except IDs)

**Response:** `204 No Content`

---

#### `paps.schedule.delete`

Delete schedule.

```typescript
await serv('paps.schedule.delete', {
  paps_id: 'paps-uuid',
  schedule_id: 'schedule-uuid'
});
```

**Response:** `204 No Content`

---

### PAPS Categories Endpoints

Manage categories associated with a PAPS.

#### `paps.categories.add`

Add a category to a PAPS.

```typescript
await serv('paps.categories.add', {
  paps_id: 'paps-uuid',
  category_id: 'category-uuid'
});
```

---

#### `paps.categories.remove`

Remove a category from a PAPS.

```typescript
await serv('paps.categories.remove', {
  paps_id: 'paps-uuid',
  category_id: 'category-uuid'
});
```

---

### SPAP (Applications) Endpoints

Job applications from workers.

**Application Statuses:**
- `pending` - Waiting for review
- `accepted` - Application accepted (creates ASAP)
- `rejected` - Application rejected

#### `spap.my`

Get current user's applications.

```typescript
const result = await serv('spap.my');
console.log('My applications:', result.applications);
```

**Response:**
```typescript
{
  applications: Spap[];
  count: number;
}

interface Spap {
  id: string;                  // SPAP UUID
  paps_id: string;
  paps_title: string;
  applicant_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  created_at: string;
  updated_at: string;
}
```

---

#### `spap.listByPaps`

Get all applications for a PAPS. **Must be PAPS owner or admin.**

```typescript
const result = await serv('spap.listByPaps', {
  paps_id: 'uuid'
});
```

**Response:**
```typescript
{
  applications: Spap[];
  count: number;
}
```

---

#### `spap.get`

Get application details. **Must be applicant, PAPS owner, or admin.**

```typescript
const app = await serv('spap.get', {
  spap_id: 'uuid'
});
```

**Response:**
```typescript
{
  id: string;
  paps_id: string;
  applicant_id: string;
  status: string;
  message: string | null;
  created_at: string;
  updated_at: string;
  chat_thread_id: string | null;
}
```

---

#### `spap.apply`

Apply for a job.

```typescript
const result = await serv('spap.apply', {
  paps_id: 'job-uuid',
  message: 'I would love to work on this project!',
  title: 'My Application',                    // Optional
  subtitle: 'Experienced developer',          // Optional
  proposed_payment: 450,                      // Optional: >= 0
  location_address: 'Remote',                 // Optional
  location_lat: 37.7749,                      // Optional
  location_lng: -122.4194,                    // Optional
  location_timezone: 'America/Los_Angeles'   // Optional
});

console.log('Applied:', result.spap_id);
console.log('Chat thread:', result.chat_thread_id);
```

**Response:**
```typescript
{
  spap_id: string;
  chat_thread_id: string;  // Chat thread created with PAPS owner
}
```

**Validation:**
- Cannot apply to your own PAPS
- Cannot apply twice to same PAPS
- Cannot apply if already assigned to this PAPS
- PAPS must be in "open" or "published" status
- Maximum applicants must not be reached

**Side Effects:**
- Creates a chat thread between applicant and owner

---

#### `spap.accept`

Accept an application. **PAPS owner only.**

```typescript
const result = await serv('spap.accept', {
  spap_id: 'uuid'
});

console.log('Created assignment:', result.asap_id);
```

**Response:**
```typescript
{
  asap_id: string;   // Created assignment UUID
}
```

**Side Effects:**
- Creates an ASAP (assignment)
- Transfers chat thread from SPAP to ASAP
- Deletes the SPAP
- If max_assignees reached: closes PAPS and deletes remaining SPAPs
- If multiple assignees: creates group chat

---

#### `spap.reject`

Reject an application. **PAPS owner only.**

```typescript
await serv('spap.reject', {
  spap_id: 'uuid'
});
```

**Response:** `204 No Content`

**Side Effects:**
- Deletes the SPAP and all its media
- Deletes the associated chat thread

---

#### `spap.withdraw`

Withdraw application. **Applicant only.**

```typescript
await serv('spap.withdraw', {
  spap_id: 'uuid'
});
```

**Response:** `204 No Content`

**Side Effects:**
- Deletes all SPAP media files from disk
- Deletes associated chat thread

**Note:** Cannot withdraw an accepted application.

---

#### `spap.media.list`

Get application media.

```typescript
const result = await serv('spap.media.list', {
  spap_id: 'uuid'
});
```

**Response:**
```typescript
{
  spap_id: string;
  media_count: number;
  media: MediaItem[];
}
```

---

#### `spap.media.upload`

Upload application media. **Applicant only, pending status only.**

```typescript
const result = await serv('spap.media.upload', {
  spap_id: 'uuid',
  files: [file1, file2]
});
```

**Validation:**
- Allowed types: PNG, JPEG, JPG, GIF, WEBP, PDF
- Max size: 10 MB
- Application must be in pending status

---

#### `spap.media.delete`

Delete application media.

```typescript
await serv('spap.media.delete', {
  media_id: 'media-uuid'
});
```

**Response:** `204 No Content`

---

#### `spap.chat`

Get chat thread for application.

```typescript
const thread = await serv('spap.chat', {
  spap_id: 'uuid'
});
```

**Response:** Chat thread object

---

### ASAP (Assignments) Endpoints

Active job assignments after application acceptance.

**Assignment Statuses:**
- `active` - Assignment created, ready to start
- `in_progress` - Work in progress
- `completed` - Work completed (triggers payment)
- `cancelled` - Assignment cancelled
- `disputed` - Payment/work dispute

#### `asap.my`

Get current user's assignments (as worker or owner).

```typescript
const result = await serv('asap.my');
console.log('As worker:', result.as_worker);
console.log('As owner:', result.as_owner);
```

**Response:**
```typescript
{
  as_worker: Asap[];           // Assignments where user is the worker
  as_owner: Asap[];            // Assignments where user owns the PAPS
  total_as_worker: number;
  total_as_owner: number;
}

interface Asap {
  asap_id: string;
  paps_id: string;
  paps_title: string;
  accepted_user_id: string;    // Worker ID
  owner_id: string;
  status: 'active' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}
```

---

#### `asap.listByPaps`

Get assignments for a PAPS. **Must be PAPS owner or admin.**

```typescript
const result = await serv('asap.listByPaps', {
  paps_id: 'uuid'
});
```

**Response:**
```typescript
{
  assignments: Asap[];
  count: number;
}
```

---

#### `asap.get`

Get assignment details.

```typescript
const assignment = await serv('asap.get', {
  asap_id: 'uuid'
});
```

**Response:**
```typescript
interface AsapDetail {
  asap_id: string;
  paps_id: string;
  paps_title: string;
  accepted_user_id: string;
  accepted_username: string;
  owner_id: string;
  owner_username: string;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}
```

---

#### `asap.updateStatus`

Update assignment status.

```typescript
// Start work
await serv('asap.updateStatus', {
  asap_id: 'uuid',
  status: 'in_progress'
});

// Complete work (triggers payment creation)
await serv('asap.updateStatus', {
  asap_id: 'uuid',
  status: 'completed'
});
```

**Request:**
```typescript
interface AsapStatusUpdateRequest {
  status: 'active' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
}
```

**Response:** `204 No Content`

**Permission Rules:**
- `in_progress`: Worker or owner can start
- `completed`: Only owner can mark as completed
- `cancelled`: Only owner or admin can cancel
- `disputed`: Either party can dispute
- `active`: Only admin can revert to active

**Side Effects:**
- If status set to "completed" and PAPS has payment_amount:
  - Automatically creates payment record
  - Payer: PAPS owner, Payee: Worker
  - Amount/Currency: From PAPS

---

#### `asap.delete`

Delete assignment. **Owner or admin only.**

```typescript
await serv('asap.delete', {
  asap_id: 'uuid'
});
```

**Response:** `204 No Content`

**Side Effects:**
- Deletes all ASAP media files from disk
- Cascades to delete chat threads

**Note:** Cannot delete completed assignments.

---

#### `asap.media.list`

Get assignment media.

```typescript
const result = await serv('asap.media.list', {
  asap_id: 'uuid'
});
```

**Response:**
```typescript
{
  asap_id: string;
  media_count: number;
  media: MediaItem[];
}
```

---

#### `asap.media.upload`

Upload assignment media (proof of work). **PAPS owner only.**

```typescript
const result = await serv('asap.media.upload', {
  asap_id: 'uuid',
  files: [file1, file2]
});
```

**Validation:**
- Allowed types: PNG, JPEG, JPG, GIF, WEBP, MP4, MOV, PDF
- Max size: 50 MB

---

#### `asap.media.delete`

Delete assignment media. **PAPS owner or admin only.**

```typescript
await serv('asap.media.delete', {
  media_id: 'media-uuid'
});
```

**Response:** `204 No Content`

---

#### `asap.rate`

Rate user for completed assignment.

```typescript
const result = await serv('asap.rate', {
  asap_id: 'uuid',
  score: 5        // 1-5
});
```

**Response:**
```typescript
{
  message: string;      // "Rating submitted successfully"
  rated_user_id: string;
  score: number;
}
```

**Validation:**
- ASAP must be completed
- Owner rates worker, worker rates owner (bidirectional)
- Individual ratings are NOT stored - only the moving average is updated

---

#### `asap.canRate`

Check if current user can rate this ASAP.

```typescript
const result = await serv('asap.canRate', {
  asap_id: 'uuid'
});

if (result.can_rate) {
  // Show rating UI
  console.log('User to rate:', result.user_to_rate_id);
}
```

**Response:**
```typescript
// If can rate:
{
  can_rate: true;
  user_to_rate_id: string;
  is_owner: boolean;
  is_worker: boolean;
}

// If cannot rate:
{
  can_rate: false;
  reason: string;  // e.g., "Assignment not yet completed"
}
```

---

#### `asap.chat`

Get chat thread for assignment.

```typescript
const thread = await serv('asap.chat', {
  asap_id: 'uuid'
});
```

**Response:** Chat thread object

---

### Payments Endpoints

**Payment Statuses:**
- `pending` - Payment created
- `processing` - Payment being processed
- `completed` - Payment successful
- `failed` - Payment failed
- `refunded` - Payment refunded
- `cancelled` - Payment cancelled

**Payment Methods:**
- `transfer` - Bank transfer
- `cash` - Cash payment
- `check` - Check payment
- `crypto` - Cryptocurrency
- `paypal` - PayPal
- `stripe` - Stripe
- `other` - Other method

**Currencies:**
- `USD`, `EUR`, `GBP`, `CAD`, `AUD`, `JPY`, `CNY`

#### `payments.my`

Get current user's payments (as payer or payee).

```typescript
const result = await serv('payments.my');
console.log('Sent:', result.sent);
console.log('Received:', result.received);
```

**Response:**
```typescript
{
  payments: Payment[];         // All payments
  sent: Payment[];             // Payments where user is payer
  received: Payment[];         // Payments where user is payee
  total_count: number;
}
```

---

#### `payments.listForPaps`

Get payments for a job. **Must be PAPS owner or admin.**

```typescript
const result = await serv('payments.listForPaps', {
  paps_id: 'job-uuid'
});
```

**Response:**
```typescript
{
  paps_id: string;
  payments: Payment[];
  count: number;
}
```

---

#### `payments.create`

Create payment for a job. **Must be PAPS owner.**

```typescript
const result = await serv('payments.create', {
  paps_id: 'job-uuid',
  payee_id: 'worker-uuid',
  amount: 500,
  currency: 'USD',
  payment_method: 'transfer'
});

console.log('Created payment:', result.payment_id);
```

**Request:**
```typescript
interface PaymentCreateRequest {
  paps_id: string;               // Required (path param)
  payee_id: string;              // Required (who receives)
  amount: number;                // Required, > 0
  currency?: string;             // Default: 'USD'
  payment_method?: string;       // 'transfer', 'cash', 'check', 'crypto', 'paypal', 'stripe', 'other'
}
```

**Response:**
```typescript
{
  payment_id: string;
}
```

---

#### `payments.get`

Get payment details. **Must be payer, payee, or admin.**

```typescript
const payment = await serv('payments.get', {
  payment_id: 'uuid'
});
```

**Response:**
```typescript
interface Payment {
  payment_id: string;
  paps_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  payment_method: string | null;
  transaction_id: string | null;
  external_reference: string | null;
  created_at: string;
  paid_at: string | null;        // When payment completed
}
```

---

#### `payments.updateStatus`

Update payment status. **Must be payer or admin.**

```typescript
await serv('payments.updateStatus', {
  payment_id: 'uuid',
  status: 'completed',
  transaction_id: 'stripe-txn-123',     // Optional
  external_reference: 'ref-456'         // Optional
});
```

**Request:**
```typescript
interface PaymentStatusUpdateRequest {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  transaction_id?: string;
  external_reference?: string;
}
```

**Response:** `204 No Content`

**Side Effects:**
- If status set to "completed": sets paid_at timestamp

**Note:** Cannot update completed/refunded/cancelled payments (except admin).

---

#### `payments.delete`

Delete payment record. **Must be payer or admin.**

```typescript
await serv('payments.delete', {
  payment_id: 'uuid'
});
```

**Response:** `204 No Content`

**Note:** Non-admins can only delete pending payments.

---

### Ratings Endpoints

User ratings after ASAP (assignment) completion. **Important:** Individual ratings are NOT stored - only the moving average is updated on user profiles.

**How ratings work:**
1. An ASAP is completed
2. Either party can rate the other via `asap.rate` endpoint
3. Owner rates worker, worker rates owner (bidirectional)
4. The rated user's `rating_average` and `rating_count` are updated

#### `ratings.forUser`

Get user's rating summary. **Requires authentication.**

```typescript
const result = await serv('ratings.forUser', {
  user_id: 'uuid'
});

console.log('Average:', result.rating_average);  // e.g., 4.5
console.log('Count:', result.rating_count);      // e.g., 23
```

**Response:**
```typescript
interface UserRating {
  user_id: string;
  rating_average: number;        // 1.0 - 5.0
  rating_count: number;          // Total ratings received
}
```

---

#### `ratings.my`

Get current user's rating summary. Same as `profile.rating`.

```typescript
const myRating = await serv('ratings.my');
console.log('My rating:', myRating.rating_average);
```

**Response:**
```typescript
{
  rating_average: number;
  rating_count: number;
}
```

---

**Note:** To submit a rating, use the `asap.rate` endpoint (see ASAP Endpoints section).

---

### Comments Endpoints

Comments on job postings with threading support.

**Comment Structure:**
- Top-level comments have `parent_id: null`
- Replies have `parent_id` set to parent comment's ID
- Use `/comments/{id}/replies` for nested reply operations
- Use `/comments/{id}/thread` to get full thread with nested replies

#### `comments.list`

Get comments for a job.

```typescript
const result = await serv('comments.list', {
  paps_id: 'job-uuid'
});
```

**Response:**
```typescript
{
  paps_id: string;
  comments: Comment[];
  count: number;                 // Comments in this response
  total_count: number;           // Total comments including replies
}

interface Comment {
  comment_id: string;            // UUID
  paps_id: string;
  user_id: string;
  username: string;
  user_avatar: string | null;
  parent_id: string | null;      // For replies
  content: string;
  reply_count: number;
  created_at: string;
  updated_at: string | null;
}
```

**Note:** Instagram-style comments - only top-level comments can have replies (max depth = 1).

---

#### `comments.create`

Add comment.

```typescript
// Top-level comment
const result = await serv('comments.create', {
  paps_id: 'job-uuid',
  content: 'Great opportunity!'
});

console.log('Created comment:', result.comment_id);
```

**Request:**
```typescript
{
  paps_id: string;              // Path param
  content: string;              // 1-2000 chars
}
```

**Response:**
```typescript
{
  comment_id: string;           // New comment UUID
}
```

---

#### `comments.replies.list`

Get replies to a comment.

```typescript
const result = await serv('comments.replies.list', {
  comment_id: 'parent-uuid'
});
```

**Response:**
```typescript
{
  parent_comment_id: string;
  replies: Comment[];
  count: number;
}
```

**Note:** Cannot get replies of a reply (only top-level comments have replies).

---

#### `comments.replies.create`

Reply to a comment.

```typescript
const result = await serv('comments.replies.create', {
  comment_id: 'parent-uuid',
  content: 'This is a reply!'
});
```

**Response:**
```typescript
{
  comment_id: string;   // New reply UUID
}
```

**Note:** Only top-level comments accept replies. Replies cannot have further replies.

---

#### `comments.thread`

Get comment with all its replies.

```typescript
const result = await serv('comments.thread', {
  comment_id: 'uuid'
});

console.log('Comment:', result.comment);
console.log('Replies:', result.replies);
```

**Response:**
```typescript
{
  comment: Comment;
  replies: Comment[];
  is_reply: boolean;
}
```

---

#### `comments.get`

Get single comment.

```typescript
const comment = await serv('comments.get', {
  comment_id: 'uuid'
});
```

**Response:** `Comment`

---

#### `comments.update`

Edit comment. Uses **PUT** method. **Author or admin only.**

```typescript
await serv('comments.update', {
  comment_id: 'uuid',
  content: 'Updated comment text'
});
```

**Request:**
```typescript
{
  content: string;   // 1-2000 chars
}
```

**Response:** `204 No Content`

---

#### `comments.delete`

Soft delete comment. **Author, PAPS owner, or admin only.**

```typescript
await serv('comments.delete', {
  comment_id: 'uuid'
});
```

**Response:** `204 No Content`

**Side Effects:**
- Soft delete (sets deleted_at timestamp)
- Also soft deletes all replies if this is a parent comment

---

### Chat Endpoints

Direct messaging between users. **Important:** Backend uses `/chat` (singular), not `/chats`.

**Thread Types:**
- `paps` - Associated with a PAPS
- `spap` - Associated with an application
- `asap` - Associated with an assignment
- `direct` - Direct message (no association)

**Message Types:**
- `text` - Regular text message
- `system` - System-generated message
- `image` - Image attachment
- `file` - File attachment

#### `chat.list`

Get chat threads.

```typescript
const result = await serv('chat.list', {
  unread_only: true,             // Optional
  paps_id: 'uuid',               // Optional: filter by PAPS
  thread_type: 'paps'            // Optional: 'paps', 'spap', 'asap', 'direct'
});
```

**Response:**
```typescript
{
  threads: ChatThread[];
  total: number;
}

interface ChatThread {
  id: string;                    // Thread UUID
  thread_type: 'paps' | 'spap' | 'asap' | 'direct';
  paps_id: string | null;
  paps_title: string | null;
  spap_id: string | null;
  asap_id: string | null;
  participants: ChatParticipant[];
  last_message: LastMessage | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

interface ChatParticipant {
  user_id: string;
  username: string;
  avatar_url: string | null;
  joined_at: string;
  role?: 'owner' | 'participant' | 'admin';
}

interface LastMessage {
  id: string;
  sender_id: string;
  sender_username: string;
  content: string;
  sent_at: string;
}
```

---

#### `chat.create`

Start new chat thread.

```typescript
const result = await serv('chat.create', {
  participant_ids: ['user-uuid'],
  paps_id: 'job-uuid',           // Optional: link to job
  initial_message: 'Hi! I have questions about your job posting.'
});

console.log('Thread:', result.id);
```

---

#### `chat.get`

Get thread details.

```typescript
const thread = await serv('chat.get', {
  thread_id: 'uuid'
});
```

---

#### `chat.leave`

Leave a thread (removes you as participant, doesn't delete for others).

```typescript
await serv('chat.leave', {
  thread_id: 'uuid'
});
```

---

#### `chat.messages.list`

Get messages in thread.

```typescript
const result = await serv('chat.messages.list', {
  thread_id: 'uuid',
  limit: 50,
  before: '2025-01-29T10:00:00Z',  // For pagination
  after: '2025-01-28T00:00:00Z'    // Optional: messages after this time
});
```

**Response:**
```typescript
{
  messages: ChatMessage[];
  total: number;
}

interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_username: string;
  sender_avatar: string | null;
  content: string;
  sent_at: string;
  edited_at: string | null;      // Set if message was edited
  read_by: string[];             // Array of user IDs who read this
  message_type: 'text' | 'system' | 'image' | 'file';
  is_system_message: boolean;
}
```

---

#### `chat.messages.send`

Send message.

```typescript
const result = await serv('chat.messages.send', {
  thread_id: 'uuid',
  content: 'Hello! How are you?'
});
```

---

#### `chat.messages.update`

Edit a message (sender only).

```typescript
await serv('chat.messages.update', {
  thread_id: 'thread-uuid',
  message_id: 'message-uuid',
  content: 'Updated message content'
});
```

---

#### `chat.messages.markRead`

Mark a specific message as read.

```typescript
await serv('chat.messages.markRead', {
  thread_id: 'thread-uuid',
  message_id: 'message-uuid'
});
```

---

#### `chat.markAllRead`

Mark all messages in thread as read.

```typescript
const result = await serv('chat.markAllRead', {
  thread_id: 'uuid'
});

console.log('Marked', result.marked_count, 'messages as read');
```

---

#### `chat.unreadCount`

Get unread message count for a thread.

```typescript
const result = await serv('chat.unreadCount', {
  thread_id: 'uuid'
});

console.log('Unread:', result.unread_count);
```

---

### Admin Endpoints

**All admin endpoints require admin privileges.**

#### `admin.users.list`

List all users.

```typescript
const result = await serv('admin.users.list');
console.log('Total users:', result.total);
result.users.forEach(u => console.log(u.login));
```

**Response:**
```typescript
interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
}

interface AdminUser {
  aid: string;               // User ID
  login: string;             // Username
  email: string;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
}
```

---

#### `admin.users.create`

Create user.

```typescript
const result = await serv('admin.users.create', {
  login: 'newuser',
  email: 'new@example.com',
  password: 'SecurePass123!',
  phone: '+1234567890',      // Optional
  is_admin: false
});

console.log('Created user:', result.user_id);
```

---

#### `admin.users.get`

Get user details.

```typescript
const result = await serv('admin.users.get', {
  user_id: 'uuid'
});
console.log('User:', result.user);
```

**Response:**
```typescript
interface AdminUserGetResponse {
  user: AdminUser;
}
```

---

#### `admin.users.update`

Partially update user (PATCH).

```typescript
await serv('admin.users.update', {
  user_id: 'uuid',
  is_admin: true,
  email: 'updated@example.com'
});
```

---

#### `admin.users.replace`

Replace user data (PUT).

```typescript
await serv('admin.users.replace', {
  user_id: 'uuid',
  auth: {
    login: 'updatedlogin',
    password: 'NewSecurePass123!',
    email: 'replaced@example.com',
    isadmin: false
  }
});
```

---

#### `admin.users.delete`

Delete user.

```typescript
await serv('admin.users.delete', {
  user_id: 'uuid'
});
```

---

## Type Reference

### Common Types

```typescript
// Unique identifier
type UUID = string;

// ISO 8601 datetime
type ISODateTime = string;  // "2025-01-29T10:30:00Z"

// Date only
type ISODate = string;      // "2025-01-29"

// Proficiency level for interests
type ProficiencyLevel = 1 | 2 | 3 | 4 | 5;

// Rating value
type RatingValue = 1 | 2 | 3 | 4 | 5;

// HTTP methods
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Gender options
type Gender = 'M' | 'F' | 'O' | 'N';  // Male, Female, Other, Not specified
```

### Status Enums

```typescript
type PapsStatus = 'draft' | 'open' | 'published' | 'closed' | 'cancelled';

type SpapStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

type AsapStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

type PaymentType = 'fixed' | 'hourly' | 'negotiable';
```

### Chat/Message Types

```typescript
type MessageType = 'text' | 'system' | 'image' | 'file';

type ThreadType = 'paps' | 'spap' | 'asap' | 'direct';

type ParticipantRole = 'owner' | 'participant' | 'admin';
```

### Schedule Types

```typescript
type RecurrenceRule = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CRON';
```

### Payment Types

```typescript
type PaymentMethod = 'transfer' | 'cash' | 'check' | 'crypto' | 'paypal' | 'stripe' | 'other';

type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CNY';
```

### Import All Types

```typescript
import {
  // Common
  UUID,
  ISODateTime,
  MediaItem,
  PaginatedResponse,
  Gender,
  RatingValue,
  
  // Enums
  PapsStatus,
  SpapStatus,
  AsapStatus,
  PaymentStatus,
  PaymentType,
  PaymentMethod,
  Currency,
  MessageType,
  ThreadType,
  ParticipantRole,
  RecurrenceRule,

  // Auth
  UserInfo,
  RegisterRequest,
  LoginRequest,

  // Profile
  UserProfile,
  ProfileUpdateRequest,
  ProfileRatingResponse,
  Experience,
  ExperienceCreateRequest,
  Interest,
  InterestCreateRequest,
  InterestUpdateRequest,

  // Categories
  Category,
  CategoryCreateRequest,

  // PAPS
  Paps,
  PapsDetail,
  PapsCreateRequest,
  PapsUpdateRequest,
  PapsStatusUpdateRequest,
  PapsListParams,
  PapsSchedule,
  ScheduleUpdateRequest,

  // SPAP
  Spap,
  SpapDetail,
  SpapCreateRequest,

  // ASAP
  Asap,
  AsapDetail,
  AsapCreateRequest,

  // Payments
  Payment,
  PaymentCreateRequest,
  PaymentStatusUpdateRequest,
  PaymentMyResponse,
  PaymentListByPapsResponse,

  // Ratings
  UserRating,
  RatingCreateRequest,

  // Comments
  Comment,
  CommentThread,
  CommentCreateRequest,
  CommentThreadResponse,

  // Chat
  ChatThread,
  ChatMessage,
  ChatParticipant,
  LastMessage,
  ChatCreateRequest,
  MessageCreateRequest,
  MessageUpdateRequest,
  LeaveThreadResponse,
  UnreadCountResponse,

  // System
  AdminUser,
  AdminUserListResponse,
  SystemInfoResponse,

  // Errors
  ApiError,
  ErrorCategory,
  HTTP_STATUS,
} from '../serve';
```

---

## Error Handling

### ApiError Class

```typescript
import { ApiError } from '../serve';

try {
  await serv('login', { login: 'bad', password: 'wrong' });
} catch (error) {
  if (error instanceof ApiError) {
    // Access error details
    console.log('Status:', error.status);        // 401
    console.log('Message:', error.message);      // "Invalid credentials"
    console.log('Code:', error.code);            // "INVALID_CREDENTIALS"
    console.log('Details:', error.details);      // Additional info

    // Helper methods
    if (error.isAuthError()) {
      // 401 Unauthorized
      navigateToLogin();
    }
    if (error.isNotFoundError()) {
      // 404 Not Found
      showNotFoundMessage();
    }
    if (error.isValidationError()) {
      // 400 Bad Request
      showValidationErrors(error.details);
    }
    if (error.isNetworkError()) {
      // Network connectivity issue
      showOfflineMessage();
    }
  }
}
```

### HTTP Status Codes

```typescript
import { HTTP_STATUS } from '../serve';

// Common status codes
HTTP_STATUS.OK                  // 200
HTTP_STATUS.CREATED             // 201
HTTP_STATUS.NO_CONTENT          // 204
HTTP_STATUS.BAD_REQUEST         // 400
HTTP_STATUS.UNAUTHORIZED        // 401
HTTP_STATUS.FORBIDDEN           // 403
HTTP_STATUS.NOT_FOUND           // 404
HTTP_STATUS.CONFLICT            // 409
HTTP_STATUS.INTERNAL_ERROR      // 500
```

### Error Code Reference

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Not logged in / invalid token |
| `FORBIDDEN` | 403 | No permission for this action |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `CONFLICT` | 409 | Resource already exists |
| `NETWORK_ERROR` | - | Connection failed |
| `TIMEOUT` | - | Request timed out |

---

## Advanced Usage

### Parallel Requests

```typescript
// Fetch multiple things at once
const [profile, categories, myJobs] = await Promise.all([
  serv('profile.get'),
  serv('categories.list'),
  serv('paps.list', { owner_id: userId })
]);
```

### Pagination Helper

```typescript
async function* paginateJobs(params: PapsListParams) {
  let offset = 0;
  const limit = 20;

  while (true) {
    const result = await serv('paps.list', {
      ...params,
      limit,
      offset
    });

    yield* result.paps;

    if (result.paps.length < limit) break;
    offset += limit;
  }
}

// Usage
for await (const job of paginateJobs({ status: 'published' })) {
  console.log(job.title);
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { serv, ApiError, Paps, PapsStatus } from '../serve';

function useJobs(status: PapsStatus) {
  const [jobs, setJobs] = useState<Paps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        const result = await serv('paps.list', { status });
        setJobs(result.paps);
        setError(null);
      } catch (e) {
        if (e instanceof ApiError) {
          setError(e.message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [status]);

  return { jobs, loading, error };
}
```

---

## Adding New Endpoints

### Step 1: Add Types

In `{module}/types.ts`:

```typescript
export interface MyNewRequest {
  field1: string;
  field2?: number;
}

export interface MyNewResponse {
  id: UUID;
  created_at: ISODateTime;
}
```

### Step 2: Add Validator

In `{module}/validators.ts`:

```typescript
export function validateMyNew(data: MyNewRequest): void {
  if (!data.field1 || data.field1.length < 3) {
    throw new Error('field1 must be at least 3 characters');
  }
  if (data.field2 !== undefined && data.field2 < 0) {
    throw new Error('field2 must be positive');
  }
}
```

### Step 3: Add Endpoint Config

In `{module}/endpoints.ts`:

```typescript
export const myEndpoints = {
  'mynew.create': {
    method: 'POST' as const,
    path: '/mynew',
    auth: true,
    validate: validateMyNew,
  },
  'mynew.get': {
    method: 'GET' as const,
    path: '/mynew/{id}',
    auth: true,
  },
};
```

### Step 4: Register in serv.ts

```typescript
import { myEndpoints } from './mymodule/endpoints';

const ENDPOINTS = {
  ...authEndpoints,
  ...myEndpoints,  // Add here
  // ...other endpoints
};
```

### Step 5: Export Types

In `index.ts`:

```typescript
export * from './mymodule/types';
```

---

## Testing

### Run All Tests

```bash
npx tsx src/serve/run-tests.ts
```

### Expected Output

```
╔════════════════════════════════════════════════╗
║   Underboss API Endpoint Tests                 ║
║   Backend: http://localhost:5000               ║
╚════════════════════════════════════════════════╝

━━━ SYSTEM ━━━
✓ system.uptime - App: underboss, Up: 1234.56

━━━ AUTH ━━━
✓ register - User ID: uuid
✓ login - Token received
✓ whoami - Username: testuser
✓ myself - Email: test@example.com

... (all tests)

════════════════════════════════════════════════
Passed: 26 | Failed: 0
════════════════════════════════════════════════
```

### Usage Examples

See `serv.test.ts` for comprehensive examples of every endpoint call.

---

## Troubleshooting

### "Invalid endpoint"

You called `serv()` with an endpoint name that doesn't exist.

**Solution:** Check the endpoint name matches exactly (case-sensitive).

```typescript
// Wrong
serv('Paps.List', ...)

// Right
serv('paps.list', ...)
```

### "Validation failed"

Input data doesn't meet requirements.

**Solution:** Check error message for specific field issues.

```typescript
try {
  await serv('paps.create', { title: 'Hi' });  // Too short
} catch (e) {
  console.log(e.message);  // "Title must be at least 5 characters"
}
```

### "UNAUTHORIZED" / "missing token"

Not logged in or token expired.

**Solution:** Login again.

```typescript
import { isAuthenticated, clearAuth } from '../serve';

if (!isAuthenticated()) {
  await serv('login', credentials);
}
```

### "NETWORK_ERROR"

Can't connect to backend.

**Checklist:**
1. Is backend running? (`http://localhost:5000/uptime`)
2. Correct URL in `AppSettings`?
3. Network connectivity?
4. CORS issues? (Web only)

### "Request timeout"

Request took too long (>30 seconds).

**Solution:** Check backend health, try again, or increase timeout.

---

## Best Practices

1. **Always use `serv()`** - Never make direct axios/fetch calls
2. **Handle errors** - Wrap calls in try/catch
3. **Type your data** - Use TypeScript interfaces
4. **Check auth state** - Before making auth-required calls
5. **Use examples** - Reference `serv.test.ts` when unsure
6. **Validate early** - Let validators catch issues before network

---

## Quick Reference Card

### Auth
```typescript
serv('register', { username, email, password })
serv('login', { login, password })
serv('whoami')
serv('myself')
```

### Profile
```typescript
serv('profile.get')
serv('profile.getByUsername', { username })
serv('profile.update', { first_name, last_name, bio })
serv('profile.patch', { first_name })  // Partial update
serv('profile.avatar.upload', { file })
serv('profile.avatar.delete')
serv('profile.rating')
```

### Experiences
```typescript
serv('experiences.list')
serv('experiences.listByUsername', { username })
serv('experiences.create', { title, company_name, start_date })
serv('experiences.update', { experience_id, title })
serv('experiences.delete', { experience_id })
```

### Interests
```typescript
serv('interests.list')
serv('interests.listByUsername', { username })
serv('interests.create', { category_id, proficiency_level })
serv('interests.update', { category_id, proficiency_level })
serv('interests.delete', { category_id })
```

### Jobs (PAPS)
```typescript
serv('paps.list', { status, payment_type, limit, offset })
serv('paps.get', { paps_id })
serv('paps.create', { title, description, payment_type, payment_amount })
serv('paps.update', { paps_id, ... })         // PUT - full replace
serv('paps.updateStatus', { paps_id, status })
serv('paps.delete', { paps_id })
// Media
serv('paps.media.list', { paps_id })
serv('paps.media.upload', { paps_id, file })
serv('paps.media.delete', { paps_id, media_id })
// Schedules
serv('paps.schedules.list', { paps_id })
serv('paps.schedules.get', { paps_id, schedule_id })
serv('paps.schedules.create', { paps_id, ... })
serv('paps.schedules.update', { paps_id, schedule_id, ... })
serv('paps.schedules.delete', { paps_id, schedule_id })
// Categories
serv('paps.categories.list', { paps_id })
serv('paps.categories.add', { paps_id, category_id })
serv('paps.categories.remove', { paps_id, category_id })
```

### Applications (SPAP)
```typescript
serv('spap.my')                           // My applications
serv('spap.listForPaps', { paps_id })     // Applications for a PAPS
serv('spap.get', { spap_id })
serv('spap.apply', { paps_id, message })  // Apply for job
serv('spap.accept', { spap_id })          // Accept application (owner)
serv('spap.reject', { spap_id, reason })  // Reject application (owner)
serv('spap.withdraw', { spap_id })        // Withdraw application (applicant)
serv('spap.chat', { spap_id })            // Get chat thread
```

### Assignments (ASAP)
```typescript
serv('asap.my')                              // My assignments
serv('asap.listForPaps', { paps_id })        // Assignments for a PAPS
serv('asap.get', { asap_id })
serv('asap.updateStatus', { asap_id, status })  // Update status
serv('asap.media', { asap_id })              // Get media
serv('asap.chat', { asap_id })               // Get chat thread
serv('asap.canRate', { asap_id })            // Check if can rate
serv('asap.rate', { asap_id, score })        // Submit rating
```

### Payments
```typescript
serv('payments.my')
serv('payments.listForPaps', { paps_id })
serv('payments.create', { paps_id, payee_id, amount, currency, payment_method })
serv('payments.get', { payment_id })
serv('payments.updateStatus', { payment_id, status })
serv('payments.delete', { payment_id })
```

### Ratings
```typescript
serv('ratings.forUser', { user_id })
serv('ratings.my')
// To submit rating, use asap.rate endpoint
```

### Comments
```typescript
serv('comments.list', { paps_id })
serv('comments.create', { paps_id, content })
serv('comments.get', { comment_id })
serv('comments.update', { comment_id, content })
serv('comments.delete', { comment_id })
serv('comments.replies.list', { comment_id })
serv('comments.replies.create', { comment_id, content })
serv('comments.thread', { comment_id })
```

### Chat
```typescript
serv('chat.list')
serv('chat.create', { participant_ids, initial_message })
serv('chat.get', { thread_id })
serv('chat.leave', { thread_id })
serv('chat.messages.list', { thread_id, limit, offset })
serv('chat.messages.send', { thread_id, content })
serv('chat.messages.update', { thread_id, message_id, content })
serv('chat.messages.markRead', { thread_id, message_id })
serv('chat.markAllRead', { thread_id })
serv('chat.unreadCount', { thread_id })
```

### Categories
```typescript
serv('categories.list')
serv('categories.get', { category_id })
serv('categories.create', { name, description })  // Admin
serv('categories.update', { category_id, ... })   // Admin
serv('categories.delete', { category_id })        // Admin
serv('categories.iconUpload', { category_id, file })  // Admin
serv('categories.iconDelete', { category_id })    // Admin
```

### System
```typescript
serv('system.uptime')     // Public
serv('system.info')       // Auth required
serv('system.stats')      // Auth required
```

---

*Happy coding! 🚀*

**Questions?** Check `serv.test.ts` for working examples of every endpoint.
