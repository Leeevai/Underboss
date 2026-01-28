# 🖼️ Avatar Endpoints - Complete Guide

## ✅ Available Endpoints

The `serv` system has **4 avatar endpoints** fully implemented:

| Endpoint | Purpose | Auth Required |
|----------|---------|---------------|
| `avatar.upload` | Upload your own avatar | ✅ Yes |
| `avatar.get` | Get your own avatar | ✅ Yes |
| `avatar.delete` | Delete your own avatar | ✅ Yes |
| `avatar.getByUsername` | Get another user's avatar | ✅ Yes |

---

## 📝 Usage Examples

### 1. Upload Your Avatar

```typescript
import { serv } from '../serve';
import { launchImageLibrary } from 'react-native-image-picker';

// Pick image
const result = await launchImageLibrary({ mediaType: 'photo' });

if (result.assets?.[0]) {
  const file = {
    uri: result.assets[0].uri,
    type: result.assets[0].type,
    name: result.assets[0].fileName,
  } as any;
  
  // Upload
  const { avatar_url } = await serv("avatar.upload", { file });
  console.log("Avatar uploaded:", avatar_url);
  // Returns: { avatar_url: "media/user/profile/{user_id}.ext" }
}
```

### 2. Get Your Own Avatar

```typescript
import { serv } from '../serve';

// Get your avatar (returns Blob)
const myAvatar = await serv("avatar.get");

// Convert to URL for React Native
const avatarUrl = URL.createObjectURL(myAvatar);

// Use in Image component
<Image source={{ uri: avatarUrl }} style={styles.avatar} />
```

### 3. Delete Your Avatar

```typescript
import { serv } from '../serve';

// Delete avatar (resets to default)
await serv("avatar.delete");
console.log("Avatar deleted");
```

### 4. Get Another User's Avatar ⭐ NEW

```typescript
import { serv } from '../serve';

// Get any user's avatar by username
const avatarBlob = await serv("avatar.getByUsername", { 
  username: "john_doe" 
});

// Convert to URL
const avatarUrl = URL.createObjectURL(avatarBlob);

// Use in a user profile view or feed
<Image source={{ uri: avatarUrl }} style={styles.userAvatar} />
```

---

## 🔧 Advanced Usage

### Convert Blob to Base64

```typescript
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Usage
const avatarBlob = await serv("avatar.getByUsername", { username: "jane" });
const base64 = await blobToBase64(avatarBlob);
// base64 = "data:image/png;base64,iVBORw0KG..."
```

### Handle Missing Avatars

```typescript
import { serv, ApiError } from '../serve';

async function getUserAvatar(username: string): Promise<string | null> {
  try {
    const blob = await serv("avatar.getByUsername", { username });
    return URL.createObjectURL(blob);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFoundError()) {
      // User has no avatar - use default
      return null;
    }
    throw error; // Re-throw other errors
  }
}

// Usage
const avatarUrl = await getUserAvatar("john") ?? DEFAULT_AVATAR_URL;
```

### Cache Avatars

```typescript
const avatarCache = new Map<string, string>();

async function getCachedAvatar(username: string): Promise<string> {
  // Check cache
  if (avatarCache.has(username)) {
    return avatarCache.get(username)!;
  }

  // Fetch from API
  const blob = await serv("avatar.getByUsername", { username });
  const url = URL.createObjectURL(blob);

  // Cache it
  avatarCache.set(username, url);
  return url;
}
```

---

## 🎨 React Native Component Example

```typescript
import React, { useEffect, useState } from 'react';
import { Image, ActivityIndicator, View } from 'react-native';
import { serv, ApiError } from '../serve';

interface UserAvatarProps {
  username: string;
  size?: number;
  defaultAvatar?: any;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  username, 
  size = 50,
  defaultAvatar = require('./default-avatar.png')
}) => {
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAvatar() {
      try {
        const blob = await serv("avatar.getByUsername", { username });
        const url = URL.createObjectURL(blob);
        setAvatarUri(url);
      } catch (error) {
        if (error instanceof ApiError && error.isNotFoundError()) {
          // Use default avatar
          setAvatarUri(null);
        } else {
          console.error('Failed to load avatar:', error);
        }
      } finally {
        setLoading(false);
      }
    }

    loadAvatar();
  }, [username]);

  if (loading) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center' }}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <Image
      source={avatarUri ? { uri: avatarUri } : defaultAvatar}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  );
};

// Usage
<UserAvatar username="john_doe" size={80} />
```

---

## 🧪 Testing

### Run the Test Script

```bash
npx tsx src/serve/test-avatar-by-username.ts
```

This will:
1. Register a test user
2. Login
3. Fetch the user's avatar
4. Display the result

### Add to Main Test Suite

The endpoint is already tested in `run-tests.ts`:

```bash
npx tsx src/serve/run-tests.ts
```

---

## 🔒 Security & Permissions

- **Authentication Required**: All avatar endpoints require a valid token
- **Public Access**: Any authenticated user can view any other user's avatar
- **File Validation**: Only image files (PNG, JPG, GIF, WEBP) up to 5MB
- **Automatic Resize**: Backend automatically resizes/compresses avatars

---

## 📊 Response Types

```typescript
// avatar.upload
type AvatarUploadResponse = {
  avatar_url: string; // "media/user/profile/{user_id}.ext"
};

// avatar.get
type AvatarGetResponse = Blob;

// avatar.delete
type AvatarDeleteResponse = void;

// avatar.getByUsername
type AvatarGetByUsernameResponse = Blob;
```

---

## ⚠️ Error Handling

```typescript
try {
  const avatar = await serv("avatar.getByUsername", { username });
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isNotFoundError()) {
      console.log("User has no avatar");
    } else if (error.isAuthError()) {
      console.log("Not authenticated");
    } else if (error.isNetworkError()) {
      console.log("Network error");
    }
  }
}
```

---

## 📋 Quick Reference

```typescript
// Upload avatar
await serv("avatar.upload", { file: imageFile });

// Get my avatar
const myAvatar = await serv("avatar.get");

// Get another user's avatar ⭐
const userAvatar = await serv("avatar.getByUsername", { username: "john" });

// Delete my avatar
await serv("avatar.delete");
```

---

## 🎯 Common Use Cases

1. **User Profile Screen**: Display user's own avatar
   ```typescript
   const avatar = await serv("avatar.get");
   ```

2. **Feed/List View**: Display multiple users' avatars
   ```typescript
   const avatars = await Promise.all(
     users.map(u => serv("avatar.getByUsername", { username: u.username }))
   );
   ```

3. **Chat Messages**: Show sender's avatar
   ```typescript
   const senderAvatar = await serv("avatar.getByUsername", { 
     username: message.sender_username 
   });
   ```

4. **Application Reviews**: Show applicant's avatar
   ```typescript
   const applicantAvatar = await serv("avatar.getByUsername", { 
     username: application.applicant_username 
   });
   ```

---

**Last Updated**: January 28, 2026  
**Status**: ✅ Fully Implemented & Tested
