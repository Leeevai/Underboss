# React Native App Refactoring - Complete Guide

## Overview

This document details the complete refactoring of the React Native application to implement proper app-wide settings, authentication flow, profile management, and PAPS (job posts) feed.

## Architecture Changes

### 1. AppSettings as Global State Manager

- **Location**: `src/AppSettings.ts`
- **Purpose**: Central store for user session data, preferences, and authentication state
- **Key Properties**:
  - `token`: JWT authentication token
  - `username`: Current user's username
  - `userId`: Current user's UUID
  - `isProfileComplete`: Flag to track if user has completed their profile
  - `darkTheme`, `autoRotate`, `notifications`: User preferences

### 2. Authentication Flow

#### New Flow Sequence

```
1. User opens app → Login/Register screen
2. User registers → Success → Profile Setup screen (mandatory)
3. User completes profile → Main app with PAPS feed
4. User logs in → Check if profile complete → Main app or Profile Setup
```

#### Implementation Details

- **Login Component** (`src/login/Login.tsx`): Handles both login and registration tabs
- **Credentials Component** (`src/login/Credentials.tsx`): Login form with Basic Auth
- **CreateAccount Component** (`src/login/CreateAccount.tsx`): Registration form
- **Profile Setup** (`src/profile/ProfileSetup.tsx`): Post-registration profile completion

### 3. Main Application Structure

#### Root Component Flow

```typescript
Root.tsx
├── Header (shows username/login status)
└── Container
    ├── Login (if not authenticated)
    ├── ProfileSetup (if authenticated but profile incomplete)
    └── MainView (if authenticated and profile complete)
        ├── Navigation (bottom tabs)
        ├── Feed (PAPS list - default)
        ├── Search (search functionality)
        └── Settings (user preferences)
```

### 4. API Integration

#### Profile API Endpoints Used

- `GET /profile` - Fetch current user profile
- `PUT /profile` - Update profile information
- `POST /profile/avatar` - Upload profile picture

#### PAPS API Endpoints Used

- `GET /paps` - Fetch all accessible PAPS (with optional filters)
- `GET /paps/<paps_id>` - Get specific PAP details
- `POST /paps/<paps_id>/comments` - Comment on a PAP
- `POST /paps/<paps_id>/applications` - Apply to a PAP

### 5. Component Structure

#### New Components Created

**ProfileSetup** (`src/profile/ProfileSetup.tsx`)

- Purpose: Initial profile setup after registration
- Fields: First name, last name, display name, bio, avatar upload
- Validation: All fields required before proceeding

**PapsFeed** (`src/feed/PapsFeed.tsx`)

- Purpose: Instagram-like feed of job postings
- Features:
  - Infinite scroll with pagination
  - Pull-to-refresh
  - Display PAP cards with images, title, description, payment
  - Like/comment/apply actions

**PapCard** (`src/feed/PapCard.tsx`)

- Purpose: Individual PAP display component
- Shows: Owner info, images, title, description, payment, location, actions

**Navigation** (`src/navigation/BottomTabs.tsx`)

- Purpose: Bottom tab navigation
- Tabs: Feed, Search, Profile, Settings

### 6. Data Flow

#### Authentication State Management

```
AppSettings.token (empty)
    ↓
User logs in/registers
    ↓
Token stored in AppSettings
    ↓
API calls include: Authorization: Bearer <token>
    ↓
Profile check via GET /profile
    ↓
AppSettings.isProfileComplete set
    ↓
Route to appropriate screen
```

#### Profile Completion Flow

```
User registers → POST /register
    ↓
Login with credentials → GET /login
    ↓
Store token in AppSettings
    ↓
Check profile completeness → GET /profile
    ↓
If incomplete → ProfileSetup screen
    ↓
User fills form → PUT /profile
    ↓
Upload avatar → POST /profile/avatar
    ↓
Set AppSettings.isProfileComplete = true
    ↓
Navigate to MainView
```

#### PAPS Feed Data Flow

```
MainView loads → PapsFeed component
    ↓
Fetch PAPS → GET /paps
    ↓
Display in FlatList
    ↓
User scrolls → Load more (pagination)
    ↓
User pulls down → Refresh data
    ↓
User taps PAP → Navigate to detail view
```

## Key Code Changes

### 1. AppSettings Enhancement

```typescript
export default class AppSettings {
  static token: string = '';
  static username: string = '';
  static userId: string = '';
  static isProfileComplete: boolean = false;
  static userProfile: any = null;
  
  // Clear all on logout
  static clearSession() {
    this.token = '';
    this.username = '';
    this.userId = '';
    this.isProfileComplete = false;
    this.userProfile = null;
  }
}
```

### 2. Axios Configuration

All API calls now use:

```typescript
axios.defaults.baseURL = baseUrl;

// For authenticated requests:
axios.get('/endpoint', {
  headers: { Authorization: `Bearer ${AppSettings.token}` }
})
```

### 3. Root Component Logic

```typescript
// Determine which view to show
if (!AppSettings.token) {
  // Show Login
} else if (!AppSettings.isProfileComplete) {
  // Show ProfileSetup
} else {
  // Show MainView with Navigation
}
```

## File Structure

```
src/
├── AppSettings.ts (Enhanced)
├── Root.tsx (Refactored)
├── common/
│   ├── const.ts
│   ├── KivCard.tsx
│   └── KivTextInput.tsx
├── header/
│   └── Header.tsx (Updated)
├── login/
│   ├── Login.tsx (Container)
│   ├── Credentials.tsx (Login form)
│   └── CreateAccount.tsx (Registration form)
├── profile/
│   └── ProfileSetup.tsx (NEW)
├── feed/
│   ├── PapsFeed.tsx (NEW)
│   └── PapCard.tsx (NEW)
├── navigation/
│   └── BottomTabs.tsx (NEW)
├── search/
│   └── SearchPage.tsx (Enhanced)
└── settings/
    └── SettingsPage.tsx (Enhanced with AppSettings)
```

## Testing Checklist

### Authentication Flow

- [ ] Register new user
- [ ] Verify redirect to ProfileSetup
- [ ] Complete profile with all fields
- [ ] Verify redirect to MainView
- [ ] Log out
- [ ] Log back in
- [ ] Verify direct access to MainView (profile already complete)

### Profile Management

- [ ] Upload avatar image
- [ ] Update profile fields
- [ ] Verify changes persist after logout/login

### PAPS Feed

- [ ] View list of PAPS
- [ ] Scroll to load more
- [ ] Pull to refresh
- [ ] Tap PAP to view details
- [ ] Test with no PAPS available

### Navigation

- [ ] Switch between tabs
- [ ] Verify state persists across tabs
- [ ] Test deep linking (if applicable)

### Settings

- [ ] Change theme preference
- [ ] Toggle notifications
- [ ] Verify preferences saved in AppSettings
- [ ] Test logout functionality

## Performance Optimizations

1. **Memoization**: Use `React.memo()` for PapCard components
2. **Image Caching**: Implement image caching for avatars and PAP media
3. **Pagination**: Load PAPS in batches (10-20 at a time)
4. **Debouncing**: Debounce search input (300ms)
5. **Lazy Loading**: Lazy load images as they appear in viewport

## Security Considerations

1. **Token Storage**: Consider using secure storage (AsyncStorage or SecureStore)
2. **Token Refresh**: Implement token refresh mechanism
3. **Input Validation**: Validate all user inputs before API calls
4. **Error Handling**: Proper error messages without exposing sensitive info
5. **HTTPS Only**: Ensure all API calls use HTTPS

## Future Enhancements

1. **Offline Support**: Cache PAPS for offline viewing
2. **Push Notifications**: Integrate for new PAPS and messages
3. **Real-time Updates**: WebSocket for live PAP updates
4. **Advanced Filters**: Category, location, payment range filters
5. **Social Features**: Follow users, share PAPS
6. **Analytics**: Track user engagement with PAPS

## Implementation Summary

### What Was Changed

1. **Root.tsx**: Complete refactor with authentication flow management
2. **AppSettings.ts**: Enhanced with session management and helper methods
3. **ProfileSetup.tsx**: NEW - Post-registration profile completion screen
4. **PapsFeed.tsx**: NEW - Instagram-like feed with pagination and pull-to-refresh
5. **PapCard.tsx**: NEW - Individual job post card component
6. **MainView.tsx**: Refactored with bottom tab navigation
7. **SettingsPage.tsx**: Enhanced to use AppSettings globally
8. **ProfilePage.tsx**: NEW - User profile view with experiences and interests
9. **SearchPage.tsx**: Enhanced with category filters and debounced search
10. **Login.tsx**: Remains as container for Credentials and CreateAccount

### Navigation Flow

```
App Launch
    ↓
Check AppSettings.token
    ↓
├─ No Token → Login Screen
│   ├─ Login Tab → Credentials Form
│   └─ Register Tab → CreateAccount Form
│       └─ Success → Auto-login → Profile Check
│
└─ Has Token → Check Profile Complete
    ├─ Profile Incomplete → ProfileSetup Screen
    │   └─ Complete → MainView
    │
    └─ Profile Complete → MainView
        └─ Bottom Navigation:
            ├─ Feed (Default)
            ├─ Search
            ├─ Profile
            └─ Settings (with Logout)
```

### Key Features Implemented

**Authentication:**

- Login with username/email + password
- Registration with profile setup requirement
- Token-based authentication stored in AppSettings
- Automatic profile completeness check

**Profile Management:**

- Post-registration profile setup (mandatory)
- Avatar upload with image picker
- Profile viewing with stats
- Experience and interests display

**PAPS Feed:**

- Instagram-style card layout
- Infinite scroll pagination
- Pull-to-refresh
- Display owner info, images, payment, location
- Like/comment/share action buttons

**Search:**

- Debounced search input (500ms)
- Category filter chips
- Real-time results
- Empty state handling

**Settings:**

- User preferences sync with AppSettings
- Dark theme toggle
- Notifications toggle
- Auto-rotate toggle
- Logout with confirmation

**Navigation:**

- Bottom tab bar (Feed, Search, Profile, Settings)
- Tab state management
- Active tab highlighting

## Common Issues & Solutions

### Issue: Token not persisting after app restart

**Solution**: Implement AsyncStorage to persist token:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// On login
await AsyncStorage.setItem('token', AppSettings.token);

// On app launch
const token = await AsyncStorage.getItem('token');
if (token) AppSettings.token = token;
```

### Issue: Profile check fails on login

**Solution**: Add retry logic and proper error handling in Root.tsx

### Issue: Images not loading in PAPS feed

**Solution**: Ensure BASE_URL in const.ts includes the correct domain, use absolute URLs

### Issue: Navigation state not updating

**Solution**: Use state variables to trigger re-renders (useState hook)

### Issue: Image picker not working

**Solution**: Install expo-image-picker:

```bash
expo install expo-image-picker
```

### Issue: Axios baseURL not working

**Solution**: Verify baseUrl in const.ts and axios.defaults.baseURL assignment

## Deployment Notes

1. Update API base URL for production in `const.ts`
2. Enable production mode for React Native
3. Remove console.log statements
4. Test on both iOS and Android
5. Verify all API endpoints are accessible from production

## Support & Maintenance

For questions or issues:

1. Check this documentation first
2. Review API documentation at `/info` endpoint
3. Check React Native and React Navigation docs
4. Contact backend team for API-related issues

---

# Installation & Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

## Dependencies Installation

```bash
# Core React Native dependencies (already installed)
npm install react react-native

# Navigation (if not already installed)
npm install @react-navigation/native @react-navigation/native-stack

# HTTP client
npm install axios

# Image picker for avatar upload
expo install expo-image-picker

# Async storage for token persistence (optional but recommended)
expo install @react-native-async-storage/async-storage

# UI components (if needed)
npm install react-native-elements
```

## Project Structure

```
src/
├── AppSettings.ts              # Global state manager
├── Root.tsx                    # Main app component with routing logic
│
├── common/
│   ├── const.ts                # API base URL and constants
│   ├── KivCard.tsx             # Reusable card component
│   └── KivTextInput.tsx        # Reusable text input component
│
├── header/
│   └── Header.tsx              # Top header showing username
│
├── login/
│   ├── Login.tsx               # Login container (tabs)
│   ├── Credentials.tsx         # Login form
│   ├── CreateAccount.tsx       # Registration form
│   └── DefaultProfilePicture.tsx
│
├── profile/
│   ├── ProfileSetup.tsx        # NEW: Post-registration profile setup
│   └── ProfilePage.tsx         # NEW: User profile view
│
├── feed/
│   ├── PapsFeed.tsx            # NEW: Instagram-like PAPS feed
│   └── PapCard.tsx             # NEW: Individual PAP card component
│
├── search/
│   └── SearchPage.tsx          # Enhanced search with filters
│
├── settings/
│   └── SettingsPage.tsx        # Settings with AppSettings integration
│
└── main/
    └── MainView.tsx            # Main view with bottom navigation
```

## Configuration Steps

### 1. Update API Base URL

Edit `src/common/const.ts`:

```typescript
export const baseUrl = 'https://your-api-domain.com/api'
// Or for local development:
// export const baseUrl = 'http://localhost:8000'
```

### 2. Configure Axios

In `Root.tsx`, axios is already configured:

```typescript
import axios from 'axios'
import { baseUrl } from './common/const'

axios.defaults.baseURL = baseUrl
```

### 3. Configure Image Picker Permissions

Add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos",
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera"
        }
      ]
    ]
  }
}
```

### 4. Optional: Add Token Persistence

Create `src/utils/storage.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppSettings from '../AppSettings';

export const saveToken = async (token: string) => {
  try {
    await AsyncStorage.setItem('auth_token', token);
    AppSettings.token = token;
  } catch (error) {
    console.error('Failed to save token:', error);
  }
};

export const loadToken = async () => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      AppSettings.token = token;
      return token;
    }
  } catch (error) {
    console.error('Failed to load token:', error);
  }
  return null;
};

export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem('auth_token');
    AppSettings.clearSession();
  } catch (error) {
    console.error('Failed to clear token:', error);
  }
};
```

Then update `Root.tsx`:

```typescript
import { loadToken } from './utils/storage';

useEffect(() => {
  const initApp = async () => {
    await loadToken();
    checkAuthStatus();
  };
  initApp();
}, []);
```

## Running the App

```bash
# Start development server
expo start

# Run on iOS
expo start --ios

# Run on Android
expo start --android

# Run on web (if configured)
expo start --web
```

## Testing the Flow

### 1. Test Registration Flow

```
1. Open app (no token) → See Login screen
2. Click "Create Account >" button
3. Fill form (username, email, password)
4. Click "Create Account"
5. Automatically redirected to ProfileSetup
6. Fill profile (first name, last name, display name, bio)
7. Optionally upload avatar
8. Click "Complete Setup"
9. Redirected to MainView with Feed tab active
```

### 2. Test Login Flow

```
1. Log out from Settings
2. Fill login form (username or email + password)
3. Click "Login"
4. If profile complete → MainView
5. If profile incomplete → ProfileSetup
```

### 3. Test Navigation

```
1. From MainView, tap Feed tab → See PAPS list
2. Tap Search tab → See search interface
3. Tap Profile tab → See user profile
4. Tap Settings tab → See settings
```

### 4. Test PAPS Feed

```
1. Scroll down → Load more PAPS (pagination)
2. Pull down → Refresh feed
3. Tap a PAP card → (Future: open detail view)
```

## API Endpoints Used

### Authentication

- `POST /register` - Create new user account
- `GET /login` - Login with Basic Auth
- `POST /login` - Login with form params

### Profile

- `GET /profile` - Get current user profile
- `PUT /profile` - Update profile information
- `POST /profile/avatar` - Upload avatar image
- `GET /profile/experiences` - Get user experiences
- `GET /profile/interests` - Get user interests

### PAPS

- `GET /paps` - List all accessible PAPS (with filters)
- `GET /paps/<paps_id>` - Get specific PAP details

### Categories

- `GET /categories` - List all categories

## Environment Variables

Create `.env` file (optional):

```env
API_BASE_URL=https://your-api-domain.com/api
```

Then use in `const.ts`:

```typescript
export const baseUrl = process.env.API_BASE_URL || 'http://localhost:8000'
```

## Build for Production

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Or use EAS Build
eas build --platform ios
eas build --platform android
```

## Troubleshooting

### "Cannot find module" errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
```

### Expo not starting

```bash
# Clear Expo cache
expo start -c
```

### Image picker not working

```bash
# Rebuild with new permissions
expo prebuild --clean
```

### API calls failing

1. Check baseUrl in const.ts
2. Verify backend is running
3. Check network connectivity
4. Verify CORS settings on backend

## Next Steps

1. Implement AsyncStorage for token persistence
2. Add PAP detail view screen
3. Implement comment system
4. Add application submission
5. Add real-time notifications
6. Implement user following system
7. Add deep linking support

## Support

For issues or questions:

- Check the main Refactoring Guide document
- Review API documentation
- Contact backend team for API issues
- Check React Native and Expo documentation

**Last Updated**: January 2026  
**Version**: 2.0.0  
**Contributors**: Development Team, aka Hassan
