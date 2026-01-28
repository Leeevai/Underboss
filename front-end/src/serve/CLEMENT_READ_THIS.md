# 📚 CLEMENT READ THIS - The Ultimate Guide to Using `serv`

Hey Clement! This document explains everything you need to know about our API service layer. Read this carefully - it will save you hours of debugging.

---

## 🧪 Running Tests

### Run All Tests

To run the complete test suite against the backend:

```bash
npx tsx src/serve/run-tests.ts
```

This will test all endpoints: auth, profile, categories, PAPS, comments, applications, etc.

### Run a Single Test

To run just one specific test function, edit [run-tests.ts](run-tests.ts) and modify the `runTests()` function at the bottom to call only the test you want:

```typescript
// At the bottom of run-tests.ts, comment out tests you don't want to run:
async function runTests() {
  // ... setup code ...
  
  // Comment out sections you don't need:
  // section('AUTH');
  // track(await testLogin());
  
  // Run only what you need:
  section('PAPS');
  track(await testPapsList());
  track(await testPapsCreate());
  
  // ... etc
}
```

### Reference File

[serv.test.ts](serv.test.ts) is a reference file showing how to use every endpoint. It's not meant to be executed - it's documentation with TypeScript examples.

---

## 🎯 TL;DR (Quick Start)

```typescript
import { serv } from '../serve';

// Login - token is automatically saved, user info returned!
const user = await serv("login", { login: "john", password: "secret123" });
console.log(`Welcome ${user.username}!`);

// Now all authenticated requests just work
const { paps } = await serv("paps.list");
```

**The magic:** `serv` automatically handles:
- ✅ Saving your auth token after login
- ✅ Caching your user info (username, userId, etc.)
- ✅ Caching your profile data
- ✅ Returning clean data (no internal stuff like password hashes)

---

## 📁 File Structure

```
src/serve/
├── serv.ts              # 🌟 THE MAIN FILE - The serv() function
├── types.ts             # All TypeScript types/interfaces  
├── errors.ts            # Error handling (ApiError class)
├── auth.ts              # Auth validators
├── profile.ts           # Profile validators
├── categories.ts        # Categories validators
├── paps.ts              # PAPS (jobs) validators
├── comments.ts          # Comments validators
├── spap.ts              # Applications validators
├── system.ts            # System validators
├── index.ts             # All exports bundled
└── CLEMENT_READ_THIS.md # 👈 You are here!
```

---

## 🚀 How to Use `serv`

### Basic Pattern

```typescript
const response = await serv("endpoint.name", requestData);
```

The function automatically:
1. Picks the right HTTP method (GET, POST, PUT, etc.)
2. Builds the URL (including path parameters)
3. Adds authentication headers when needed
4. Validates your request data
5. Makes the API call
6. **Auto-saves tokens and user data to AppSettings**
7. **Returns clean, user-facing data (no internal info)**
8. Handles errors properly

### Import

```typescript
import { serv } from '../serve';

// With types and helpers
import { 
  serv, 
  isAuthenticated, 
  clearAuth,
  getCurrentUser,
  getCachedProfile,
  type UserInfo 
} from '../serve';
```

---

## 🔐 Authentication (THE IMPORTANT PART!)

### Login Flow

```typescript
import { serv, isAuthenticated, getCurrentUser } from '../serve';

// Login - that's it! Token is automatically saved
const user = await serv("login", {
  login: "clement",         // can be username, email, or phone
  password: "SuperSecret123!"
});

// user contains clean info:
console.log(user.userId);    // "550e8400-e29b-41d4-a716-446655440000"
console.log(user.username);  // "clement"
console.log(user.email);     // "clement@example.com"
console.log(user.isAdmin);   // false

// Check if logged in
if (isAuthenticated()) {
  console.log("User is logged in!");
}

// Get cached user info anytime
const currentUser = getCurrentUser();
if (currentUser) {
  console.log(`Hello ${currentUser.username}`);
}
```

### Register Flow

```typescript
// Register - returns just the user ID
const { userId } = await serv("register", {
  username: "clement",
  email: "clement@example.com",
  password: "SuperSecret123!",
  phone: "+1234567890"  // optional
});

console.log(`Account created! ID: ${userId}`);

// Note: Register does NOT auto-login. Call login after:
const user = await serv("login", {
  login: "clement",
  password: "SuperSecret123!"
});
```

### Logout

```typescript
import { clearAuth } from '../serve';

// Clears token, username, userId, profile cache - everything
clearAuth();
```

### What `login` Returns

```typescript
interface UserInfo {
  userId: string;    // UUID
  username: string;  // Username
  email: string;     // Email
  isAdmin: boolean;  // Is admin user?
}

// NO password hash, NO internal IDs, NO sensitive data!
```

---

## 👤 Profile

### Get & Update Profile

```typescript
// Get your profile - also caches it in AppSettings
const profile = await serv("profile.get");
console.log(profile.first_name, profile.bio);

// Update profile - also updates the cache
const updated = await serv("profile.update", {
  first_name: "Clement",
  last_name: "Doe",
  bio: "React Native developer",
  location_address: "Paris, France",
  location_lat: 48.8566,
  location_lng: 2.3522
});

// Get cached profile anytime (no API call)
import { getCachedProfile } from '../serve';
const cached = getCachedProfile();
```

### Check Profile Completion

```typescript
import AppSettings from '../AppSettings';

// After profile.get or profile.update, this is auto-set
if (AppSettings.isProfileComplete) {
  // User has first_name and last_name filled
  navigateToHome();
} else {
  navigateToCompleteProfile();
}
```

---

## 🖼️ Avatar

```typescript
// Upload avatar (React Native)
import { launchImageLibrary } from 'react-native-image-picker';

const result = await launchImageLibrary({ mediaType: 'photo' });
if (result.assets?.[0]) {
  const file = {
    uri: result.assets[0].uri,
    type: result.assets[0].type,
    name: result.assets[0].fileName,
  } as any;
  
  const { avatar_url } = await serv("avatar.upload", { file });
  console.log("New avatar:", avatar_url);
}

// Delete avatar
await serv("avatar.delete");

// Get someone's avatar
const avatarBlob = await serv("avatar.getByUsername", { username: "john" });
```

---

## 💼 Experiences

```typescript
// List experiences
const experiences = await serv("experiences.list");

// Add experience
const { experience_id } = await serv("experiences.create", {
  title: "Senior React Developer",
  company: "TechCorp",
  description: "Built mobile apps with React Native",
  start_date: "2022-01-15T00:00:00Z",
  is_current: true
});

// Update experience
await serv("experiences.update", {
  exp_id: experience_id,
  title: "Lead React Developer",
  is_current: false,
  end_date: "2024-06-30T00:00:00Z"
});

// Delete experience
await serv("experiences.delete", { exp_id: experience_id });
```

---

## ⭐ Interests

```typescript
// Add interest in a category
await serv("interests.create", {
  category_id: "uuid-of-react-native-category",
  proficiency_level: 4  // 1-5 scale
});

// Update proficiency level
await serv("interests.update", {
  category_id: "uuid-of-react-native-category",
  proficiency_level: 5
});

// List your interests
const interests = await serv("interests.list");

// Delete interest
await serv("interests.delete", { category_id: "uuid" });
```

---

## 📂 Categories

```typescript
// Get all categories
const categories = await serv("categories.list");

// Get specific category
const category = await serv("categories.get", { 
  category_id: "uuid-here" 
});
```

---

## 📝 PAPS (Job Postings)

This is the main feature - PAPS are job postings!

### List Jobs

```typescript
// List all published jobs nearby
const { paps, total_count } = await serv("paps.list", {
  status: "published",
  lat: 48.8566,          // Paris coordinates
  lng: 2.3522,
  max_distance: 50,      // within 50km
  payment_type: "fixed"
});

console.log(`Found ${total_count} jobs`);
paps.forEach(job => {
  console.log(`${job.title} - €${job.payment_amount}`);
});

// List without filters
const { paps: allPaps } = await serv("paps.list");
```

### Get Job Details

```typescript
const job = await serv("paps.get", { paps_id: "uuid-here" });

console.log(job.title, job.description);
console.log(`${job.comments_count} comments`);
console.log(`${job.applications_count} applications`);
```

### Create Job

```typescript
const { paps_id } = await serv("paps.create", {
  title: "Need React Native Developer",
  description: "Building a mobile app for food delivery...",
  payment_amount: 500,
  payment_type: "fixed",
  payment_currency: "EUR",
  location_address: "Paris, France",
  location_lat: 48.8566,
  location_lng: 2.3522,
  max_applicants: 10,
  status: "published"  // or "draft"
});
```

### Update & Delete Job

```typescript
// Update
await serv("paps.update", {
  paps_id: "uuid",
  title: "Need Senior React Native Developer",
  payment_amount: 750
});

// Delete
await serv("paps.delete", { paps_id: "uuid" });
```

---

## 📸 PAPS Media

```typescript
// Upload images to a job
const { uploaded_media, count } = await serv("paps.media.upload", {
  paps_id: "uuid-here",
  files: [image1, image2, image3]
});

console.log(`Uploaded ${count} files`);

// List media
const { media } = await serv("paps.media.list", { paps_id: "uuid" });

// Delete media
await serv("paps.media.delete", { media_id: "uuid" });
```

---

## 💬 Comments

Instagram-style threaded comments!

```typescript
// List comments on a job
const { comments, total_count } = await serv("comments.list", { 
  paps_id: "uuid-here" 
});

// Add a comment
const { comment_id } = await serv("comments.create", {
  paps_id: "uuid-here",
  content: "This looks like a great opportunity!"
});

// Reply to a comment
await serv("comments.reply", {
  comment_id: comment_id,
  content: "Thanks! Feel free to apply 😊"
});

// Get full thread (parent + all replies)
const { comment, replies, is_reply } = await serv("comments.thread", {
  comment_id: comment_id
});

// Delete comment
await serv("comments.delete", { comment_id: "uuid" });
```

---

## 📨 SPAP (Job Applications)

SPAP = Someone applying to a PAPS

```typescript
// Apply to a job
const { spap_id } = await serv("spap.apply", {
  paps_id: "uuid-here",
  message: "I'd love to work on this! I have 5 years of experience..."
});

// View my applications
const { applications } = await serv("spap.my");
applications.forEach(app => {
  console.log(`${app.paps_title}: ${app.status}`);
});

// As job owner: view applications for your job
const { applications: apps } = await serv("spap.listForPaps", { 
  paps_id: "uuid-here" 
});

// Accept/reject application (job owner only)
await serv("spap.updateStatus", {
  spap_id: "applicant-spap-id",
  status: "accepted"  // or "rejected"
});

// Withdraw my application
await serv("spap.withdraw", { spap_id: "uuid" });
```

---

## ⚠️ Error Handling

```typescript
import { serv, ApiError } from '../serve';

try {
  await serv("login", { login: "wrong", password: "wrong" });
} catch (error) {
  if (error instanceof ApiError) {
    // Check error type
    if (error.isAuthError()) {
      console.log("Invalid credentials");
    } else if (error.isValidationError()) {
      console.log("Invalid data:", error.message);
    } else if (error.isNotFoundError()) {
      console.log("Not found");
    } else if (error.isNetworkError()) {
      console.log("Network error - check connection");
    }
    
    // Show user-friendly message
    Alert.alert("Error", error.getUserMessage());
  }
}
```

---

## 🎨 TypeScript Magic

The `serv` function is fully typed:

```typescript
// TypeScript knows this returns UserInfo
const user = await serv("login", {
  login: "test",
  password: "secret123"
});
user.username; // ✅ TypeScript knows this exists

// TypeScript ERROR - missing required fields!
await serv("register", { username: "test" }); // ❌

// TypeScript knows paps is Paps[] and total_count is number
const { paps, total_count } = await serv("paps.list");
```

---

## 📌 Quick Reference Card

```typescript
// === AUTH (auto-saves tokens!) ===
serv("register", { username, email, password }) // → { userId }
serv("login", { login, password })              // → UserInfo (auto-saved!)
serv("whoami")                                  // → { username }
serv("myself")                                  // → UserInfo

// === PROFILE (auto-cached!) ===
serv("profile.get")                             // → UserProfile
serv("profile.update", { first_name?, ... })    // → UserProfile
serv("avatar.upload", { file })                 // → { avatar_url }
serv("avatar.delete")

// === EXPERIENCES ===
serv("experiences.list")
serv("experiences.create", { title, start_date, ... })
serv("experiences.update", { exp_id, title?, ... })
serv("experiences.delete", { exp_id })

// === INTERESTS ===
serv("interests.list")
serv("interests.create", { category_id, proficiency_level? })
serv("interests.update", { category_id, proficiency_level })
serv("interests.delete", { category_id })

// === CATEGORIES ===
serv("categories.list")
serv("categories.get", { category_id })

// === PAPS (JOBS) ===
serv("paps.list", { status?, lat?, lng?, ... })
serv("paps.get", { paps_id })
serv("paps.create", { title, description, payment_amount, ... })
serv("paps.update", { paps_id, ... })
serv("paps.delete", { paps_id })
serv("paps.media.upload", { paps_id, files })

// === COMMENTS ===
serv("comments.list", { paps_id })
serv("comments.create", { paps_id, content })
serv("comments.reply", { comment_id, content })
serv("comments.delete", { comment_id })

// === APPLICATIONS ===
serv("spap.my")
serv("spap.apply", { paps_id, message? })
serv("spap.withdraw", { spap_id })
serv("spap.updateStatus", { spap_id, status })
```

---

## 🛠️ Helper Functions

```typescript
import { 
  isAuthenticated,   // Check if user is logged in
  clearAuth,         // Logout - clears everything
  getCurrentUser,    // Get cached user info (no API call)
  getCachedProfile,  // Get cached profile (no API call)
} from '../serve';

// Check auth
if (isAuthenticated()) {
  const user = getCurrentUser();
  console.log(`Logged in as ${user?.username}`);
}

// Logout
clearAuth();  // Clears token, username, userId, profile, everything
```

---

## 🆘 Common Mistakes to Avoid

### ❌ Don't use axios directly
```typescript
// BAD
import axios from 'axios';
await axios.get('/paps');

// GOOD
import { serv } from '../serve';
await serv("paps.list");
```

### ❌ Don't manually save token after login
```typescript
// BAD - unnecessary, serv does this automatically!
const response = await serv("login", { ... });
AppSettings.token = response.token;  // ❌ Not needed!

// GOOD - just login, token is auto-saved
const user = await serv("login", { ... });
console.log(user.username);  // ✅ Clean user info
```

### ❌ Don't access internal data that's not returned
```typescript
// BAD - password is NOT returned (security!)
const user = await serv("login", { ... });
console.log(user.password);  // ❌ undefined!

// GOOD - use the clean UserInfo
console.log(user.username, user.email, user.isAdmin);
```

---

## 🔑 What Gets Auto-Saved to AppSettings

| Action | What's Saved |
|--------|--------------|
| `serv("login", ...)` | `token`, `userId`, `username` |
| `serv("myself")` | `userId`, `username` |
| `serv("profile.get")` | `userProfile`, `isProfileComplete` |
| `serv("profile.update", ...)` | `userProfile`, `isProfileComplete` |
| `clearAuth()` | Clears ALL of the above |

---

## 🤔 Questions?

If something doesn't work:

1. Check `isAuthenticated()` - are you logged in?
2. Check the error: `error.getUserMessage()`
3. Check network tab in dev tools
4. Check backend logs
5. Ask Hassan! 😄

---

**Last updated:** January 2026  
**Author:** Hassan (with AI assistance)
