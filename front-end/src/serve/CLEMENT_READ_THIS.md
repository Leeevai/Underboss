# Serve Module - Complete API Documentation

> **Last Updated**: January 2025  
> **Version**: 2.0  
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
- **Consistency**: Same interface for all 70+ endpoints
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
│   ├── types.ts          # Base types (UUID, dates, enums)
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
│   ├── types.ts          # UserProfile, Experience, Interest
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
│   ├── types.ts          # Paps, PapsDetail, Schedule
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
│   ├── types.ts
│   ├── validators.ts
│   ├── endpoints.ts
│   └── index.ts
│
├── ratings/              # Rating system
│   ├── types.ts
│   ├── validators.ts
│   ├── endpoints.ts
│   └── index.ts
│
├── comments/             # Comment system
│   ├── types.ts
│   ├── validators.ts
│   ├── endpoints.ts
│   └── index.ts
│
├── chat/                 # Messaging
│   ├── types.ts
│   ├── validators.ts
│   ├── endpoints.ts
│   └── index.ts
│
└── system/               # System & admin
    ├── types.ts
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
  avatar_url: string | null;
  date_of_birth: string | null;      // YYYY-MM-DD
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  timezone: string | null;
  preferred_language: string | null;
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
  experience_id: string;       // UUID
  user_id: string;
  title: string;               // Job title
  company_name: string;
  location: string | null;
  start_date: string;          // YYYY-MM-DD
  end_date: string | null;     // YYYY-MM-DD or null if current
  description: string | null;
  created_at: string;          // ISO8601
  updated_at?: string;
}
```

---

#### `experiences.create`

Add work experience.

```typescript
const result = await serv('experiences.create', {
  title: 'Senior Developer',
  company_name: 'Tech Corp',
  location: 'San Francisco, CA',
  start_date: '2020-01-15',
  end_date: '2023-06-30',        // Omit if current job
  description: 'Led development of mobile applications'
});
```

**Request:**
```typescript
interface ExperienceCreateRequest {
  title: string;           // Required
  company_name: string;    // Required
  location?: string;
  start_date: string;      // YYYY-MM-DD, required
  end_date?: string;       // YYYY-MM-DD, optional
  description?: string;
}
```

**Response:**
```typescript
{
  experience_id: string;   // UUID of created experience
}
```

---

#### `experiences.update`

Update existing experience.

```typescript
await serv('experiences.update', {
  experience_id: 'uuid-here',
  title: 'Lead Developer',
  description: 'Updated description'
});
```

**Request:**
```typescript
interface ExperienceUpdateRequest {
  experience_id: string;   // Required (path param)
  title?: string;
  company_name?: string;
  location?: string | null;
  start_date?: string;
  end_date?: string | null;
  description?: string | null;
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
  interest_id: string;
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
  interest_id: string;
}
```

---

#### `interests.delete`

Remove interest.

```typescript
await serv('interests.delete', {
  interest_id: 'interest-uuid'
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
  status?: 'draft' | 'published' | 'closed' | 'cancelled';
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
  paps_id: string;
  owner_id: string;
  owner_username: string;
  title: string;
  description: string;
  status: PapsStatus;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  payment_amount: number | null;
  payment_currency: string;
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
  description: 'Looking for an experienced React Native developer...',
  payment_amount: 5000,
  payment_currency: 'USD',
  status: 'draft',               // 'draft' or 'published'
  location_address: 'San Francisco, CA',
  location_lat: 37.7749,
  location_lng: -122.4194,
  category_ids: ['uuid1', 'uuid2'],
  expires_at: '2025-12-31T23:59:59Z'
});

console.log('Created job:', result.paps_id);
```

**Request:**
```typescript
interface PapsCreateRequest {
  title: string;                 // 5-200 chars
  description: string;           // 10-5000 chars
  payment_amount: number;        // Required, > 0
  payment_currency?: string;     // Default: 'USD'
  status?: PapsStatus;           // Default: 'draft'
  location_address?: string;
  location_lat?: number;         // -90 to 90
  location_lng?: number;         // -180 to 180
  category_ids?: string[];
  expires_at?: string;           // ISO8601
}
```

**Response:**
```typescript
{
  paps_id: string;
}
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

#### `paps.schedule.list`

Get job schedule.

```typescript
const schedule = await serv('paps.schedule.list', {
  paps_id: 'uuid'
});
```

**Response:**
```typescript
PapsSchedule[]

interface PapsSchedule {
  schedule_id: string;
  paps_id: string;
  start_time: string;              // ISO8601
  end_time: string;                // ISO8601
  is_recurring: boolean;
  recurrence_pattern: string | null;  // 'daily', 'weekly', 'monthly'
  created_at: string;
}
```

---

#### `paps.schedule.create`

Add schedule entry.

```typescript
const result = await serv('paps.schedule.create', {
  paps_id: 'uuid',
  start_time: '2025-03-01T09:00:00Z',
  end_time: '2025-03-01T17:00:00Z',
  is_recurring: true,
  recurrence_pattern: 'weekly'
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

#### `payments.listForPaps`

Get payments for a job.

```typescript
const result = await serv('payments.listForPaps', {
  paps_id: 'job-uuid'
});
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
  payment_method: 'card'         // 'card', 'bank', 'wallet'
});
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
  payment_id: string;
  paps_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  transaction_id: string | null;
  created_at: string;
  completed_at: string | null;
}
```

---

#### `payments.update`

Update payment status.

```typescript
await serv('payments.update', {
  payment_id: 'uuid',
  status: 'completed',
  transaction_id: 'stripe-txn-123'
});
```

---

#### `payments.my`

Get user's payments.

```typescript
// As receiver (worker)
const received = await serv('payments.my', {
  role: 'payee'
});

// As sender (job owner)
const sent = await serv('payments.my', {
  role: 'payer'
});
```

---

### Ratings Endpoints

User ratings after job completion.

#### `ratings.forUser`

Get user's ratings.

```typescript
const result = await serv('ratings.forUser', {
  user_id: 'uuid'
});

console.log('Average:', result.average_rating);
console.log('Total:', result.total_ratings);
```

**Response:**
```typescript
interface UserRatings {
  user_id: string;
  average_rating: number;        // 1.0 - 5.0
  total_ratings: number;
  ratings: Rating[];
}

interface Rating {
  rating_id: string;
  paps_id: string;
  paps_title: string;
  rater_id: string;
  rater_username: string;
  rated_user_id: string;
  rating: number;                // 1-5
  review: string | null;
  created_at: string;
}
```

---

#### `ratings.create`

Rate a user.

```typescript
const result = await serv('ratings.create', {
  paps_id: 'job-uuid',
  rated_user_id: 'user-uuid',
  rating: 5,                     // 1-5
  review: 'Excellent work! Highly recommended.'
});
```

---

#### `ratings.update`

Update rating.

```typescript
await serv('ratings.update', {
  rating_id: 'uuid',
  rating: 4,
  review: 'Updated review'
});
```

---

#### `ratings.delete`

Delete rating.

```typescript
await serv('ratings.delete', {
  rating_id: 'uuid'
});
```

---

### Comments Endpoints

Comments on job postings.

#### `comments.list`

Get comments for a job.

```typescript
const result = await serv('comments.list', {
  paps_id: 'job-uuid',
  limit: 20,
  offset: 0
});
```

**Response:**
```typescript
{
  comments: CommentDetail[];
  total: number;
}

interface CommentDetail {
  comment_id: string;
  paps_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  content: string;
  parent_id: string | null;      // For replies
  replies_count: number;
  created_at: string;
  updated_at: string | null;
  is_owner: boolean;
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

// Reply to comment
const reply = await serv('comments.create', {
  paps_id: 'job-uuid',
  content: 'Thanks for your interest!',
  parent_id: 'comment-uuid'      // Makes it a reply
});
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

Edit comment.

```typescript
await serv('comments.update', {
  comment_id: 'uuid',
  content: 'Updated comment text'
});
```

---

#### `comments.delete`

Delete comment.

```typescript
await serv('comments.delete', {
  comment_id: 'uuid'
});
```

---

### Chat Endpoints

Direct messaging between users.

#### `chat.list`

Get chat threads.

```typescript
const result = await serv('chat.list', {
  unread_only: true,             // Optional
  limit: 20
});
```

**Response:**
```typescript
{
  threads: ChatThread[];
  total: number;
}

interface ChatThread {
  thread_id: string;
  paps_id: string | null;
  paps_title: string | null;
  participants: ChatParticipant[];
  last_message: ChatMessage | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

interface ChatParticipant {
  user_id: string;
  username: string;
  avatar_url: string | null;
  joined_at: string;
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

console.log('Thread:', result.thread_id);
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

#### `chat.delete`

Leave thread.

```typescript
await serv('chat.delete', {
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
  before: 'message-uuid'         // For pagination
});
```

**Response:**
```typescript
{
  messages: ChatMessage[];
  total: number;
  has_more: boolean;
}

interface ChatMessage {
  message_id: string;
  thread_id: string;
  sender_id: string;
  sender_username: string;
  content: string;
  is_read: boolean;
  created_at: string;
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

#### `chat.messages.read`

Mark messages as read.

```typescript
await serv('chat.messages.read', {
  thread_id: 'uuid'
});
```

---

### Admin Endpoints

**All admin endpoints require admin privileges.**

#### `admin.users.list`

List all users.

```typescript
const users = await serv('admin.users.list');
```

---

#### `admin.users.create`

Create user.

```typescript
const result = await serv('admin.users.create', {
  login: 'newuser',
  email: 'new@example.com',
  password: 'SecurePass123!',
  is_admin: false
});
```

---

#### `admin.users.get`

Get user details.

```typescript
const user = await serv('admin.users.get', {
  user_id: 'uuid'
});
```

---

#### `admin.users.update`

Update user.

```typescript
await serv('admin.users.update', {
  user_id: 'uuid',
  is_admin: true
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

// HTTP methods
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
```

### Status Enums

```typescript
type PapsStatus = 'draft' | 'published' | 'closed' | 'cancelled';

type SpapStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

type AsapStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
```

### Import All Types

```typescript
import {
  // Common
  UUID,
  ISODateTime,
  MediaItem,
  PaginatedResponse,

  // Auth
  UserInfo,
  RegisterRequest,
  LoginRequest,

  // Profile
  UserProfile,
  ProfileUpdateRequest,
  Experience,
  ExperienceCreateRequest,
  Interest,
  InterestCreateRequest,

  // Categories
  Category,
  CategoryCreateRequest,

  // PAPS
  Paps,
  PapsDetail,
  PapsStatus,
  PapsCreateRequest,
  PapsUpdateRequest,
  PapsListParams,
  PapsSchedule,

  // SPAP
  Spap,
  SpapDetail,
  SpapStatus,
  SpapCreateRequest,

  // ASAP
  Asap,
  AsapDetail,
  AsapStatus,
  AsapCreateRequest,

  // Payments
  Payment,
  PaymentStatus,
  PaymentCreateRequest,

  // Ratings
  Rating,
  UserRatings,
  RatingCreateRequest,

  // Comments
  Comment,
  CommentDetail,
  CommentCreateRequest,

  // Chat
  ChatThread,
  ChatMessage,
  ChatParticipant,
  ChatCreateRequest,

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
