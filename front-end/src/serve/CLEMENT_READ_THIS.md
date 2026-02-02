# Serve Module - Complete API Documentation

> **Last Updated**: January 2025  
> **Version**: 3.0  
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
  up: number;     // Server uptime in seconds
}
```

---

#### `system.info`

Get server information. **Admin only.**

```typescript
const info = await serv('system.info');
```

**Response:**
```typescript
{
  version: string;
  environment: string;
  database: string;
  uptime: number;
}
```

---

#### `system.stats`

Get server statistics. **Admin only.**

```typescript
const stats = await serv('system.stats');
```

**Response:**
```typescript
{
  pool_statistics: object;
  active_connections: number;
  total_requests: number;
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
  userId: string;       // UUID of created user
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

Quick authentication check.

```typescript
const result = await serv('whoami');
console.log('Logged in as:', result.username);
```

**Response:**
```typescript
{
  username: string;
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
  avatar_url: string | null;
  date_of_birth: string | null;      // YYYY-MM-DD
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  timezone: string | null;
  preferred_language: string | null;
  rating_average: number;            // User's average rating
  rating_count: number;              // Number of ratings received
  created_at?: string;               // ISO8601
  updated_at?: string;               // ISO8601
}
```

---

#### `profile.update`

Update current user's profile.

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

**Response:** Updated `UserProfile`

---

#### `profile.getByUsername`

Get another user's public profile.

```typescript
const profile = await serv('profile.getByUsername', {
  username: 'jane_doe'
});
```

**Response:** `UserProfile` (public fields only)

---

#### `profile.updateByUsername` (Admin)

Update a user's profile by username. **Admin only.**

```typescript
await serv('profile.updateByUsername', {
  username: 'jane_doe',
  bio: 'Updated bio'
});
```

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

#### `avatar.get`

Get current user's avatar as Blob.

```typescript
const blob = await serv('avatar.get');
const imageUrl = URL.createObjectURL(blob);

// Use in React Native Image
<Image source={{ uri: imageUrl }} />
```

**Response:** `Blob` (image data)

---

#### `avatar.delete`

Remove profile picture.

```typescript
await serv('avatar.delete');
```

**Response:** `void`

---

#### `avatar.getByUsername`

Get any user's avatar.

```typescript
const blob = await serv('avatar.getByUsername', {
  username: 'jane_doe'
});
const imageUrl = URL.createObjectURL(blob);
```

**Request:**
```typescript
{
  username: string;
}
```

**Response:** `Blob`

**Advanced Avatar Usage:**

```typescript
// Convert Blob to Base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Handle missing avatars
async function getUserAvatar(username: string): Promise<string | null> {
  try {
    const blob = await serv('avatar.getByUsername', { username });
    return URL.createObjectURL(blob);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFoundError()) {
      return null;  // User has no avatar
    }
    throw error;
  }
}

// Cache avatars
const avatarCache = new Map<string, string>();

async function getCachedAvatar(username: string): Promise<string> {
  if (avatarCache.has(username)) {
    return avatarCache.get(username)!;
  }
  const blob = await serv('avatar.getByUsername', { username });
  const url = URL.createObjectURL(blob);
  avatarCache.set(username, url);
  return url;
}
```

**React Native Component Example:**

```typescript
import React, { useEffect, useState } from 'react';
import { Image, ActivityIndicator, View } from 'react-native';
import { serv, ApiError } from '../serve';

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
        const blob = await serv('avatar.getByUsername', { username });
        setAvatarUri(URL.createObjectURL(blob));
      } catch (error) {
        if (!(error instanceof ApiError && error.isNotFoundError())) {
          console.error('Failed to load avatar:', error);
        }
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
  id: string;                    // UUID
  user_id: string;
  title: string;                 // Job title
  company: string;               // Company name
  location: string | null;
  start_date: string;            // YYYY-MM-DD
  end_date: string | null;       // YYYY-MM-DD or null if is_current
  is_current: boolean;           // Currently working here
  description: string | null;
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
  company: 'Tech Corp',
  location: 'San Francisco, CA',
  start_date: '2020-01-15',
  end_date: '2023-06-30',        // Omit if is_current: true
  is_current: false,             // Set to true if current job
  description: 'Led development of mobile applications',
  display_order: 1
});
```

**Request:**
```typescript
interface ExperienceCreateRequest {
  title: string;           // Required
  company: string;         // Required
  location?: string;
  start_date: string;      // YYYY-MM-DD, required
  end_date?: string;       // YYYY-MM-DD, required if is_current is false
  is_current?: boolean;    // Default: false
  description?: string;
  display_order?: number;
}
```

**Response:**
```typescript
{
  id: string;              // UUID of created experience
}
```

**Validation:**
- Cannot set both `is_current: true` AND provide `end_date`
- `end_date` is required if `is_current` is false

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
  company?: string;
  location?: string | null;
  start_date?: string;
  end_date?: string | null;
  is_current?: boolean;
  description?: string | null;
  display_order?: number;
}
```

---

#### `experiences.delete`

Remove experience.

```typescript
await serv('experiences.delete', {
  experience_id: 'uuid-here'
});
```

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
  id: string;                  // Interest ID
  user_id: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  proficiency_level?: 1 | 2 | 3 | 4 | 5;
  created_at: string;
}
```

---

#### `interests.create`

Add interest.

```typescript
const result = await serv('interests.create', {
  category_id: 'category-uuid',
  proficiency_level: 4           // Optional: 1-5
});
```

**Response:**
```typescript
{
  id: string;                    // Interest ID
}
```

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
  proficiency_level: 1 | 2 | 3 | 4 | 5;
}
```

---

#### `interests.delete`

Remove interest.

```typescript
await serv('interests.delete', {
  category_id: 'category-uuid'   // Use category_id, not interest_id
});
```

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

Update category.

```typescript
await serv('categories.update', {
  category_id: 'uuid',
  name: 'Full Stack Development'
});
```

---

#### `categories.delete` (Admin)

Delete category.

```typescript
await serv('categories.delete', {
  category_id: 'uuid'
});
```

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
- `milestone` - Milestone-based
- `negotiable` - To be negotiated

#### `paps.list`

List/search jobs with filters.

```typescript
const result = await serv('paps.list', {
  // Filters
  status: 'published',
  category_ids: ['uuid1', 'uuid2'],
  owner_id: 'user-uuid',

  // Location search
  location_lat: 37.7749,
  location_lng: -122.4194,
  radius_km: 25,

  // Text search
  search: 'developer',

  // Payment filter
  min_payment: 100,
  max_payment: 1000,
  payment_currency: 'USD',

  // Pagination & sorting
  sort_by: 'created_at',        // 'created_at', 'payment_amount', 'distance'
  sort_order: 'desc',           // 'asc', 'desc'
  limit: 20,
  offset: 0
});

console.log(`Found ${result.total} jobs`);
result.paps.forEach(job => {
  console.log(job.title, job.payment_amount);
});
```

**Request:**
```typescript
interface PapsListParams {
  status?: 'draft' | 'open' | 'published' | 'closed' | 'cancelled';
  owner_id?: string;
  category_ids?: string[];
  location_lat?: number;
  location_lng?: number;
  radius_km?: number;
  search?: string;
  min_payment?: number;
  max_payment?: number;
  payment_currency?: string;
  sort_by?: 'created_at' | 'payment_amount' | 'distance';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
```

**Response:**
```typescript
interface PapsListResponse {
  paps: Paps[];
  total: number;
  limit: number;
  offset: number;
}

interface Paps {
  id: string;                       // UUID (was paps_id)
  owner_id: string;
  owner_username: string;
  title: string;
  subtitle: string | null;          // NEW
  description: string;
  status: PapsStatus;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_timezone: string | null; // NEW
  start_datetime: string | null;    // NEW: When job starts
  end_datetime: string | null;      // NEW: When job ends
  estimated_duration_minutes: number | null; // NEW
  payment_amount: number | null;
  payment_currency: string;
  payment_type: PaymentType;        // NEW: 'fixed', 'hourly', etc.
  max_applicants: number | null;    // NEW
  max_assignees: number | null;     // NEW
  is_public: boolean;               // NEW
  publish_at: string | null;        // NEW: Scheduled publish time
  created_at: string;
  updated_at: string;
  published_at: string | null;
  expires_at: string | null;
  categories: string[];
  media_count: number;
  distance_km?: number;
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
  owner_profile: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  media: MediaItem[];
  schedule: PapsSchedule[];
  application_count: number;
  comment_count: number;
  is_owner: boolean;
  has_applied: boolean;
}
```

---

#### `paps.create`

Create a job posting.

```typescript
const result = await serv('paps.create', {
  title: 'Need React Native Developer',
  subtitle: 'Mobile app project',           // Optional
  description: 'Looking for an experienced React Native developer...',
  payment_amount: 5000,
  payment_currency: 'USD',
  payment_type: 'fixed',                    // 'fixed', 'hourly', 'milestone', 'negotiable'
  status: 'draft',
  location_address: 'San Francisco, CA',
  location_lat: 37.7749,
  location_lng: -122.4194,
  location_timezone: 'America/Los_Angeles', // Optional
  start_datetime: '2025-02-01T09:00:00Z',   // Optional
  end_datetime: '2025-02-28T17:00:00Z',     // Optional
  estimated_duration_minutes: 2400,          // 40 hours
  max_applicants: 10,                       // Optional
  max_assignees: 1,                         // Optional
  is_public: true,                          // Default: true
  category_ids: ['uuid1', 'uuid2'],
  expires_at: '2025-12-31T23:59:59Z'
});

console.log('Created job:', result.id);
```

---

#### `paps.update`

Update job posting.

```typescript
await serv('paps.update', {
  paps_id: 'uuid',
  title: 'Updated Title',
  payment_amount: 6000,
  status: 'published'
});
```

---

#### `paps.updateStatus`

Update only the status of a PAPS.

```typescript
await serv('paps.updateStatus', {
  paps_id: 'uuid',
  status: 'closed'
});
```

**Request:**
```typescript
interface PapsStatusUpdateRequest {
  status: PapsStatus;
}
```

---

#### `paps.delete`

Delete job posting.

```typescript
await serv('paps.delete', {
  paps_id: 'uuid'
});
```

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
  media: MediaItem[];
  media_count: number;
}

interface MediaItem {
  media_id: string;
  url: string;
  media_type: 'image' | 'video' | 'document';
  filename: string | null;
  file_size: number | null;
  created_at: string;
}
```

---

#### `paps.media.upload`

Upload media to job.

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
  media: MediaItem[];
  count: number;
}
```

---

#### `paps.media.delete`

Delete media from job.

```typescript
await serv('paps.media.delete', {
  paps_id: 'uuid',
  media_id: 'media-uuid'
});
```

---

### PAPS Schedule Endpoints

**Recurrence Rules:**
- `none` - One-time schedule
- `daily` - Every day
- `weekly` - Every week
- `biweekly` - Every two weeks
- `monthly` - Every month
- `custom` - Custom cron expression

#### `paps.schedule.list`

Get job schedule. **Note:** Uses `/schedules` path (plural).

```typescript
const schedule = await serv('paps.schedule.list', {
  paps_id: 'uuid'
});
```

**Response:**
```typescript
PapsSchedule[]

interface PapsSchedule {
  id: string;                      // Schedule ID
  paps_id: string;
  recurrence_rule: RecurrenceRule; // 'none', 'daily', 'weekly', etc.
  cron_expression: string | null;  // For 'custom' rule
  start_date: string | null;       // YYYY-MM-DD
  end_date: string | null;         // YYYY-MM-DD
  next_run_at: string | null;      // Next scheduled run (ISO8601)
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}
```

---

#### `paps.schedule.get`

Get schedule details.

```typescript
const schedule = await serv('paps.schedule.get', {
  paps_id: 'uuid'
});
```

---

#### `paps.schedule.create`

Add schedule entry.

```typescript
const result = await serv('paps.schedule.create', {
  paps_id: 'uuid',
  recurrence_rule: 'weekly',
  start_date: '2025-03-01',
  end_date: '2025-06-30',
  is_active: true
});

// Or with custom cron
const customResult = await serv('paps.schedule.create', {
  paps_id: 'uuid',
  recurrence_rule: 'custom',
  cron_expression: '0 9 * * 1-5',  // 9 AM weekdays
  start_date: '2025-03-01'
});
```

**Request:**
```typescript
interface ScheduleCreateRequest {
  recurrence_rule: RecurrenceRule;
  cron_expression?: string;        // Required if recurrence_rule is 'custom'
  start_date?: string;             // YYYY-MM-DD
  end_date?: string;               // YYYY-MM-DD
  is_active?: boolean;             // Default: true
}
```

---

#### `paps.schedule.update`

Update schedule.

```typescript
await serv('paps.schedule.update', {
  paps_id: 'uuid',
  recurrence_rule: 'biweekly',
  is_active: false
});
```

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
- `accepted` - Application accepted
- `rejected` - Application rejected
- `withdrawn` - Applicant withdrew

#### `spap.list`

List user's applications.

```typescript
const result = await serv('spap.list', {
  status: 'pending',             // Optional filter
  role: 'applicant',             // 'applicant' or 'owner'
  paps_id: 'uuid',               // Optional: filter by job
  limit: 20,
  offset: 0
});
```

**Response:**
```typescript
{
  spaps: Spap[];
  total: number;
  limit: number;
  offset: number;
}

interface Spap {
  spap_id: string;
  paps_id: string;
  paps_title: string;
  applicant_id: string;
  applicant_username: string;
  message: string | null;
  status: SpapStatus;
  created_at: string;
  updated_at: string;
}
```

---

#### `spap.get`

Get application details.

```typescript
const app = await serv('spap.get', {
  spap_id: 'uuid'
});
```

---

#### `spap.create`

Apply for a job.

```typescript
const result = await serv('spap.create', {
  paps_id: 'job-uuid',
  message: 'I would love to work on this project!'
});

console.log('Applied:', result.spap_id);
```

---

#### `spap.update`

Update application (accept/reject).

```typescript
// Job owner accepts application
await serv('spap.update', {
  spap_id: 'uuid',
  status: 'accepted'
});

// Applicant withdraws
await serv('spap.update', {
  spap_id: 'uuid',
  status: 'withdrawn'
});
```

---

#### `spap.delete`

Delete/withdraw application.

```typescript
await serv('spap.delete', {
  spap_id: 'uuid'
});
```

---

### ASAP (Assignments) Endpoints

Active job assignments after application acceptance.

**Assignment Statuses:**
- `pending` - Assignment created, not started
- `in_progress` - Work in progress
- `completed` - Work completed
- `cancelled` - Assignment cancelled
- `disputed` - Payment/work dispute

#### `asap.list`

List assignments.

```typescript
const result = await serv('asap.list', {
  status: 'in_progress',
  role: 'worker',                // 'worker' or 'owner'
  limit: 20
});
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
  owner_id: string;
  owner_username: string;
  worker_id: string;
  worker_username: string;
  status: AsapStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  payment_status: string;
  media: MediaItem[];
}
```

---

#### `asap.create`

Create assignment (after accepting application).

```typescript
const result = await serv('asap.create', {
  paps_id: 'job-uuid',
  accepted_user_id: 'worker-uuid'
});
```

---

#### `asap.update`

Update assignment status.

```typescript
// Start work
await serv('asap.update', {
  asap_id: 'uuid',
  status: 'in_progress'
});

// Complete work
await serv('asap.update', {
  asap_id: 'uuid',
  status: 'completed'
});
```

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
- `card` - Credit/debit card
- `bank_transfer` - Bank transfer
- `wallet` - Digital wallet
- `cash` - Cash payment
- `crypto` - Cryptocurrency

**Currencies:**
- `USD`, `EUR`, `GBP`, `CAD`, `AUD`, `JPY`, `CNY`, `INR`, `BRL`, `MXN`

#### `payments.listForPaps`

Get payments for a job.

```typescript
const result = await serv('payments.listForPaps', {
  paps_id: 'job-uuid'
});
```

**Response:**
```typescript
interface PaymentListByPapsResponse {
  payments: Payment[];
  total: number;
}
```

---

#### `payments.my`

Get current user's payments.

```typescript
// All my payments
const payments = await serv('payments.my');

// Filter by role
const received = await serv('payments.my', {
  role: 'payee'                  // Payments I received
});

const sent = await serv('payments.my', {
  role: 'payer'                  // Payments I made
});
```

**Response:**
```typescript
interface PaymentMyResponse {
  payments: Payment[];
  total: number;
}
```

---

#### `payments.create`

Create payment.

```typescript
const result = await serv('payments.create', {
  paps_id: 'job-uuid',
  payee_id: 'worker-uuid',
  amount: 500,
  currency: 'USD',
  payment_method: 'card'
});
```

**Request:**
```typescript
interface PaymentCreateRequest {
  paps_id: string;               // Required
  payee_id: string;              // Required (who receives)
  amount: number;                // Required, > 0
  currency?: Currency;           // Default: 'USD'
  payment_method?: PaymentMethod; // Default: 'card'
}
```

---

#### `payments.get`

Get payment details.

```typescript
const payment = await serv('payments.get', {
  payment_id: 'uuid'
});
```

**Response:**
```typescript
interface Payment {
  id: string;                    // UUID
  paps_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  transaction_id: string | null;
  created_at: string;
  paid_at: string | null;        // When payment completed
}
```

---

#### `payments.update`

Update payment (for processing integrations).

```typescript
await serv('payments.update', {
  payment_id: 'uuid',
  transaction_id: 'stripe-txn-123'
});
```

---

#### `payments.updateStatus`

Update payment status.

```typescript
await serv('payments.updateStatus', {
  payment_id: 'uuid',
  status: 'completed'
});
```

**Request:**
```typescript
interface PaymentStatusUpdateRequest {
  status: PaymentStatus;         // 'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
}
```

---

### Ratings Endpoints

User ratings after ASAP (assignment) completion. **Important:** Individual ratings are NOT stored - only the moving average is updated on user profiles.

**How ratings work:**
1. An ASAP is completed
2. Either party can rate the other via `POST /asap/{asap_id}/rate`
3. Owner rates worker, worker rates owner (bidirectional)
4. The rated user's `rating_average` and `rating_count` are updated

#### `ratings.forUser`

Get user's rating summary.

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

Get current user's rating summary.

```typescript
const myRating = await serv('ratings.my');
console.log('My rating:', myRating.rating_average);
```

**Response:** `UserRating`

---

#### `ratings.create` (via ASAP)

Rate a user after ASAP completion. **Note:** Use `asap.rate` endpoint instead.

```typescript
// Better: Use asap.rate directly
const result = await serv('asap.rate', {
  asap_id: 'asap-uuid',
  score: 5                       // 1-5
});
```

**Request:**
```typescript
interface RatingCreateRequest {
  score: 1 | 2 | 3 | 4 | 5;     // Required
}
```

**Validation:**
- ASAP must be completed
- Must be owner or worker of the ASAP
- Can only rate once per ASAP per direction

---

#### `asap.canRate`

Check if current user can rate an ASAP.

```typescript
const { can_rate, reason } = await serv('asap.canRate', {
  asap_id: 'uuid'
});

if (can_rate) {
  // Show rating UI
}
```

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
  paps_id: 'job-uuid',
  parent_id: null,               // null = top-level only
  limit: 20,
  offset: 0
});
```

**Response:**
```typescript
{
  comments: Comment[];
  total: number;
}

interface Comment {
  id: string;                    // UUID
  paps_id: string;
  user_id: string;
  username: string;
  user_avatar: string | null;
  parent_id: string | null;      // For replies
  content: string;
  reply_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string | null;
}
```

---

#### `comments.create`

Add comment.

```typescript
// Top-level comment
const result = await serv('comments.create', {
  paps_id: 'job-uuid',
  content: 'Great opportunity!'
});

// Reply to comment (alternative method)
const reply = await serv('comments.create', {
  paps_id: 'job-uuid',
  content: 'Thanks for your interest!',
  parent_id: 'comment-uuid'      // Makes it a reply
});
```

**Response:**
```typescript
{
  id: string;                    // New comment UUID
  message: string;
}
```

---

#### `comments.replies.list`

Get replies to a comment.

```typescript
const replies = await serv('comments.replies.list', {
  comment_id: 'parent-uuid',
  limit: 20
});
```

---

#### `comments.replies.create`

Add reply to a comment (preferred over using parent_id).

```typescript
const reply = await serv('comments.replies.create', {
  comment_id: 'parent-uuid',
  content: 'This is a reply!'
});
```

---

#### `comments.thread`

Get full comment thread with nested replies.

```typescript
const thread = await serv('comments.thread', {
  comment_id: 'uuid'
});

// Returns comment with all replies nested
console.log(thread.comment.replies);
```

**Response:**
```typescript
interface CommentThreadResponse {
  comment: CommentThread;        // Comment with nested replies[]
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

---

#### `comments.update`

Edit comment (owner only).

```typescript
await serv('comments.update', {
  comment_id: 'uuid',
  content: 'Updated comment text'
});
```

---

#### `comments.delete`

Delete comment (soft delete - owner only).

```typescript
await serv('comments.delete', {
  comment_id: 'uuid'
});
```

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

type PaymentType = 'fixed' | 'hourly' | 'milestone' | 'negotiable';
```

### Chat/Message Types

```typescript
type MessageType = 'text' | 'system' | 'image' | 'file';

type ThreadType = 'paps' | 'spap' | 'asap' | 'direct';

type ParticipantRole = 'owner' | 'participant' | 'admin';
```

### Schedule Types

```typescript
type RecurrenceRule = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
```

### Payment Types

```typescript
type PaymentMethod = 'card' | 'bank_transfer' | 'wallet' | 'cash' | 'crypto';

type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CNY' | 'INR' | 'BRL' | 'MXN';
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
serv('profile.update', { first_name, last_name, bio })
serv('avatar.upload', { file })
serv('avatar.get')
serv('avatar.getByUsername', { username })
```

### Experiences
```typescript
serv('experiences.list')
serv('experiences.create', { title, company_name, start_date })
serv('experiences.update', { experience_id, title })
serv('experiences.delete', { experience_id })
```

### Jobs
```typescript
serv('paps.list', { status, limit })
serv('paps.get', { paps_id })
serv('paps.create', { title, description, payment_amount })
serv('paps.update', { paps_id, ... })
serv('paps.delete', { paps_id })
```

### Applications
```typescript
serv('spap.list', { status })
serv('spap.create', { paps_id, message })
serv('spap.update', { spap_id, status })
```

### Assignments
```typescript
serv('asap.list', { status })
serv('asap.create', { paps_id, accepted_user_id })
serv('asap.update', { asap_id, status })
```

### Payments
```typescript
serv('payments.my', { role })
serv('payments.create', { paps_id, payee_id, amount, currency })
serv('payments.get', { payment_id })
```

### Ratings
```typescript
serv('ratings.forUser', { user_id })
serv('ratings.create', { paps_id, rated_user_id, rating, review })
```

### Comments
```typescript
serv('comments.list', { paps_id })
serv('comments.create', { paps_id, content })
serv('comments.delete', { comment_id })
```

### Chat
```typescript
serv('chat.list')
serv('chat.create', { participant_ids, initial_message })
serv('chat.messages.list', { thread_id })
serv('chat.messages.send', { thread_id, content })
serv('chat.messages.read', { thread_id })
```

### Categories
```typescript
serv('categories.list')
serv('categories.get', { category_id })
```

### System
```typescript
serv('system.uptime')
serv('system.info')       // Admin
serv('system.stats')      // Admin
```

---

*Happy coding! 🚀*

**Questions?** Check `serv.test.ts` for working examples of every endpoint.
