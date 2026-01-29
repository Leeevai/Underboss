# Avatar & Media Fetching Guide

## ⚠️ Important: How to Fetch Avatars and Media

### The Correct Way

**DO NOT** use authenticated endpoints like `/profile/avatar` or `/user/{username}/profile/avatar` to fetch images.

**DO** use the public `/media/{folder}/{subfolder}/{filename}` endpoint with the media URL returned from the API.

## How It Works

### 1. Upload an Avatar

```typescript
import { serv } from './serve';

const file = /* your File or Blob */;
const result = await serv('avatar.upload', { file });

console.log(result.avatar_url); 
// Output: "media/user/profile/550e8400-e29b-41d4-a716-446655440000.jpg"
```

### 2. Fetch the Avatar

```typescript
import { serv, getMediaUrl } from './serve';

// Get profile with avatar_url
const profile = await serv('profile.get');

// Convert to full URL
const avatarUrl = getMediaUrl(profile.avatar_url);
// Returns: "http://localhost:5000/media/user/profile/550e8400-e29b-41d4-a716-446655440000.jpg"

// Fetch using standard fetch (no authentication needed!)
if (avatarUrl) {
  const response = await fetch(avatarUrl);
  const blob = await response.blob();
  
  // Use the blob for <img src={URL.createObjectURL(blob)} />
  const imageUrl = URL.createObjectURL(blob);
}
```

### 3. Fetch Another User's Avatar

```typescript
import { serv, getMediaUrl } from './serve';

// Get public profile
const profile = await serv('profile.getByUsername', { username: 'johndoe' });

// Convert and fetch
const avatarUrl = getMediaUrl(profile.avatar_url);
if (avatarUrl) {
  const response = await fetch(avatarUrl);
  const blob = await response.blob();
}
```

## Why This Approach?

1. **No Authentication Required**: Media files are served publicly via `/media/*` endpoints
2. **CDN Ready**: These URLs can be cached and served by CDNs
3. **Consistent**: Same pattern for all media (avatars, category icons, paps media, etc.)
4. **Backend Standard**: The backend returns relative paths like `media/user/profile/uuid.ext`

## Media Types Supported

All media follows the same pattern:

| Type | Example Path | Endpoint |
|------|-------------|----------|
| User Avatar | `media/user/profile/{uuid}.jpg` | `/media/user/profile/{uuid}.jpg` |
| Category Icon | `media/category/{uuid}.png` | `/media/category/{uuid}.png` |
| Paps Media | `media/post/{paps_id}/{uuid}.jpg` | `/media/post/{paps_id}/{uuid}.jpg` |

## Helper Function

The `getMediaUrl()` function handles all the logic:

```typescript
/**
 * Convert media path to full URL
 * @param mediaPath - Path like "media/user/profile/uuid.jpg"
 * @returns Full URL or null if no path provided
 */
export function getMediaUrl(mediaPath: string | null | undefined): string | null
```

### Features:
- Returns `null` if input is `null` or `undefined`
- Handles paths with or without leading slash
- Detects and preserves full URLs (http://, https://)
- Constructs proper base URL based on environment

## Examples

### Display Avatar in React

```tsx
import { serv, getMediaUrl } from '../serve';
import { useState, useEffect } from 'react';

function ProfileAvatar({ username }: { username: string }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadAvatar() {
      const profile = await serv('profile.getByUsername', { username });
      const url = getMediaUrl(profile.avatar_url);
      setAvatarUrl(url);
    }
    loadAvatar();
  }, [username]);
  
  return avatarUrl ? (
    <img src={avatarUrl} alt={`${username}'s avatar`} />
  ) : (
    <div className="avatar-placeholder">No Avatar</div>
  );
}
```

### Display Paps Media

```tsx
import { serv, getMediaUrl } from '../serve';

async function displayPapsMedia(papsId: string) {
  const mediaList = await serv('paps.media.list', { paps_id: papsId });
  
  return mediaList.media.map(item => {
    const url = getMediaUrl(item.media_url);
    return url ? <img key={item.media_id} src={url} /> : null;
  });
}
```

## Migration from Old Code

If you have old code using the incorrect endpoints:

### ❌ OLD (Incorrect)
```typescript
// Don't do this
const blob = await serv('avatar.get');
const blob = await serv('avatar.getByUsername', { username });
```

### ✅ NEW (Correct)
```typescript
// Do this instead
const profile = await serv('profile.get');
const url = getMediaUrl(profile.avatar_url);
if (url) {
  const response = await fetch(url);
  const blob = await response.blob();
}
```

## Testing

See [run-tests.ts](./run-tests.ts) for comprehensive avatar upload and fetch tests.

Run tests with:
```bash
npx tsx src/serve/run-tests.ts
```

Tests include:
- ✅ Avatar upload
- ✅ Fetch own avatar via media URL
- ✅ Fetch other user's avatar via media URL  
- ✅ Delete avatar

---

**Last Updated**: January 30, 2026
