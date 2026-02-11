# Underboss - Complete Technical Documentation

**Version**: 1.0.0  
**Last Updated**: February 11, 2026

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Backend Deep Dive](#backend-deep-dive)
4. [Frontend Deep Dive](#frontend-deep-dive)
5. [Database Architecture](#database-architecture)
6. [API Integration](#api-integration)
7. [Authentication & Security](#authentication--security)
8. [State Management](#state-management)
9. [Media Handling](#media-handling)
10. [Development Setup](#development-setup)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Performance Optimization](#performance-optimization)
14. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Design

Underboss is a **full-stack job marketplace platform** connecting job posters (PAPS) with workers (SPAP applicants → ASAP assignees). The system uses a **client-server architecture** with:

- **Frontend**: React Native mobile application (iOS/Android/Web)
- **Backend**: Python Flask REST API
- **Database**: PostgreSQL with spatial extensions
- **Media Storage**: Filesystem-based with URL serving

### Core Workflow

```
User Registration → Profile Setup → Browse PAPS → Apply (SPAP) → 
Assignment (ASAP) → Complete Work → Payment Generation → Rating
```

### Design Patterns

- **Backend**:
  - Repository Pattern (database.py + queries.sql)
  - Blueprint Pattern (modular API routes)
  - Mediator Pattern (media file handling)
  - Factory Pattern (media handler creation)
  
- **Frontend**:
  - Atomic State Management (Jotai atoms)
  - Component Composition (functional React)
  - Service Layer Pattern (serve/ module)
  - Cache-Aside Pattern (cache/ hooks)

---

## Technology Stack

### Backend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Flask | 3.x | Web framework |
| **Auth** | FlaskSimpleAuth | 35.6+ | JWT/Basic/Param auth |
| **Database** | PostgreSQL | 14+ | Primary data store |
| **DB Interface** | anodb + aiosql | 15.0+ | Async SQL queries |
| **ORM** | None | - | Direct SQL for performance |
| **Password** | bcrypt | latest | Password hashing |
| **Validation** | Pydantic | latest | Request validation |
| **Images** | Pillow | latest | Image processing |
| **Server** | Gunicorn/Werkzeug | - | WSGI server |

### Frontend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React Native | 0.82.1 | Cross-platform UI |
| **Language** | TypeScript | 5.8+ | Type safety |
| **State** | Jotai | 2.17+ | Atomic state mgmt |
| **Navigation** | React Navigation | 7.x | Screen routing |
| **HTTP** | Axios | 1.13+ | API requests |
| **Storage** | AsyncStorage | 2.2+ | Local persistence |
| **Images** | Image Picker | 8.2+ | Photo selection |
| **Calendar** | react-native-calendars | 1.1314+ | Date selection |
| **Maps** | WebView + Leaflet | - | Location display |
| **Build** | Webpack | 5.103+ | Web bundling |
| **Metro** | Metro | 0.82+ | React Native bundling |

### Development Tools

- **Version Control**: Git
- **Package Managers**: pip (backend), npm (frontend)
- **Testing**: pytest (backend), Jest (frontend)
- **Linting**: pylint/flake8 (backend), ESLint (frontend)
- **Build**: Makefile automation
- **Documentation**: Markdown

---

## Backend Deep Dive

### Project Structure

```
back-end/
├── api/                      # Modular API routes
│   ├── __init__.py          # Route registration
│   ├── auth.py              # /register, /login
│   ├── system.py            # /uptime, /version, /stats
│   ├── user.py              # /users (admin)
│   ├── profile.py           # /profile
│   ├── category.py          # /categories
│   ├── paps.py              # /paps (job postings)
│   ├── schedule.py          # /paps/schedules
│   ├── spap.py              # /spap (applications)
│   ├── asap.py              # /asap (assignments)
│   ├── payment.py           # /payments
│   ├── rating.py            # /ratings
│   ├── comment.py           # /comments
│   └── chat.py              # /chats
├── docs/                     # Documentation
│   ├── README.md            # Backend overview
│   ├── routes.md            # Complete API reference
│   ├── testing.md           # Test documentation
│   └── database_schema.mmd  # Mermaid diagram
├── media/                    # User-uploaded files
│   ├── user/profile/        # Profile avatars
│   ├── category/            # Category icons
│   ├── paps/                # Job media
│   ├── spap/                # Application media
│   └── asap/                # Assignment media
├── test_media/              # Sample media for dev
├── app.py                   # Application entry point
├── auth.py                  # Authentication helpers
├── database.py              # DB connection & repo
├── mediator.py              # Media file management
├── model.py                 # Data models
├── utils.py                 # Utility functions
├── version.py               # Auto-generated version
├── create.sql               # Database schema (DDL)
├── queries.sql              # SQL queries (aiosql)
├── data.sql                 # Seed data
├── drop.sql                 # Database cleanup
├── test.py                  # Test suite
├── comprehensive_test.sh    # Bash API tests
├── Makefile                 # Build automation
├── requirements.txt         # Python dependencies
├── local.conf               # Development config
└── server.conf              # Production config
```

### Database Connection (database.py)

```python
# Uses anodb for async connection pooling
# Queries loaded from queries.sql via aiosql
# Automatic rollback on errors
# Connection pooling with ProxyPatternPool

def init_app(app):
    """Initialize database with app config"""
    # Load SQL queries from queries.sql
    # Create connection pool
    # Register with Flask app context
```

### Media Handling (mediator.py)

```python
class MediaHandler:
    """Central media file management"""
    
    def save_file(self, file, entity_type, entity_id, file_type):
        """Save uploaded file with generated UUID name"""
        # Validate file type & size
        # Generate unique filename
        # Create directory structure
        # Save with secure permissions
        # Return relative URL
    
    def delete_file(self, url):
        """Delete file from filesystem"""
        # Verify file exists
        # Check permissions
        # Remove file
    
    def get_media_url(self, relative_path):
        """Convert relative path to full URL"""
```

### Authentication (auth.py)

```python
# Three authentication methods supported:
# 1. JWT Bearer Token (default)
# 2. HTTP Basic Auth (login:password)
# 3. Token in query params (?token=...)

def init_app(app):
    """Configure FlaskSimpleAuth"""
    # Set token secret
    # Configure auth methods
    # Set token expiration (24h)
    # Define admin role check
    
def get_user_from_token():
    """Extract user from JWT token"""
    
def requires_admin():
    """Decorator for admin-only routes"""
```

### API Route Pattern

```python
# Example from api/paps.py

@app.route('/paps', methods=['GET'])
@app.auth(AUTH)
def list_paps():
    """List PAPS with filters"""
    # Extract query parameters
    # Validate with Pydantic model
    # Call database query
    # Process results
    # Return JSON response
    
@app.route('/paps/<paps_id>', methods=['GET'])
@app.auth(AUTH)
def get_paps(paps_id: UUID):
    """Get specific PAPS details"""
    # Validate UUID
    # Query database with JOIN for details
    # Check permissions
    # Return enriched data
```

### SQL Query Organization (queries.sql)

```sql
-- name: get_paps_with_details
-- Get PAPS with owner and category info
SELECT p.*, 
       u.username as owner_username,
       COUNT(DISTINCT s.id) as application_count,
       COUNT(DISTINCT a.id) as assignment_count
FROM PAPS p
JOIN "USER" u ON p.owner_id = u.id
LEFT JOIN SPAP s ON s.paps_id = p.id
LEFT JOIN ASAP a ON a.paps_id = p.id
WHERE p.id = :paps_id AND p.deleted_at IS NULL
GROUP BY p.id, u.username;

-- name: search_paps_by_location
-- Find PAPS within radius
SELECT p.*, 
       calculate_distance(:user_lat, :user_lng, 
                         p.location_lat, p.location_lng) as distance
FROM PAPS p
WHERE p.status = 'published' 
  AND p.deleted_at IS NULL
  AND calculate_distance(:user_lat, :user_lng, 
                        p.location_lat, p.location_lng) <= :max_distance
ORDER BY distance ASC;
```

### Configuration Files

**local.conf** (Development)
```python
{
    "APP_LOGGING_LEVEL": "DEBUG",
    "APP_TESTING": True,
    "APP_USERS": True,
    "FSA_AUTH": "bearer",
    "FSA_TOKEN_TYPE": "jwt",
    "FSA_TOKEN_DELAY": 1440,  # 24 hours
    "DB_HOST": "localhost",
    "DB_PORT": 5432,
    "DB_NAME": "underboss",
    "DB_USER": "underboss_user",
    "MEDIA_BASE_PATH": "./media",
    "MEDIA_MAX_SIZE": 10485760,  # 10MB
}
```

---

## Frontend Deep Dive

### Project Structure

```
front-end/
├── src/
│   ├── AppSettings.ts           # Global state manager
│   ├── Root.tsx                 # App entry with auth flow
│   ├── cache/                   # Jotai atoms & hooks
│   │   ├── asaps.tsx           # ASAP assignments cache
│   │   ├── categories.tsx       # Categories cache
│   │   ├── chats.tsx           # Chat threads cache
│   │   ├── paps.tsx            # PAPS jobs cache
│   │   ├── payments.tsx        # Payments cache
│   │   ├── profiles.tsx        # User profiles cache
│   │   └── spaps.tsx           # Applications cache
│   ├── calendar/               # Schedule selection
│   │   └── calendarTEMP.tsx    # Date picker for ASAP
│   ├── chat/                   # Messaging system
│   │   ├── ChatBubble.tsx      # Message display
│   │   ├── ChatDetail.tsx      # Conversation screen
│   │   ├── ChatList.tsx        # Thread list
│   │   └── ChatScreen.tsx      # Chat container
│   ├── common/                 # Shared components
│   │   ├── const.ts            # Constants
│   │   ├── KivCard.tsx         # Card component
│   │   ├── KivTextInput.tsx    # Input component
│   │   ├── MediaViewer.tsx     # Image/video display
│   │   └── theme.tsx           # Theme system
│   ├── feed/                   # Job feed
│   │   ├── NearbyPapsMap.tsx   # Map with job locations
│   │   ├── PapsFeed.tsx        # Main feed screen
│   │   ├── PapsListModal.tsx   # Full list modal
│   │   └── PapsPost.tsx        # Individual job card
│   ├── header/                 # Navigation header
│   │   ├── Header.tsx          # Header component
│   │   └── underbossbar.tsx    # App bar
│   ├── login/                  # Authentication
│   │   ├── CreateAccount.tsx   # Registration form
│   │   ├── Credentials.tsx     # Login form
│   │   └── Login.tsx           # Auth container
│   ├── main/                   # Main app screen
│   │   └── MainView.tsx        # Bottom tab navigation
│   ├── pages/                  # Screen pages
│   │   ├── ModifyProfil.tsx    # Profile editor
│   │   ├── PayementPage.tsx    # Payment details
│   │   ├── ProfilePage.tsx     # User profile
│   │   └── SettingsPage.tsx    # App settings
│   ├── posting/                # Job posting
│   │   └── posting_page.tsx    # Create/edit PAPS
│   ├── res/                    # Resources
│   │   └── icons/              # Icon files
│   ├── serve/                  # API service layer
│   │   ├── serv.ts             # Main API client
│   │   ├── index.ts            # Exports
│   │   ├── auth/               # Auth types
│   │   ├── asap/               # ASAP types
│   │   ├── categories/         # Category types
│   │   ├── chat/               # Chat types
│   │   ├── comments/           # Comment types
│   │   ├── common/             # Shared types
│   │   ├── paps/               # PAPS types
│   │   ├── payments/           # Payment types
│   │   ├── profile/            # Profile types
│   │   ├── ratings/            # Rating types
│   │   ├── spap/               # SPAP types
│   │   └── system/             # System types
│   └── spap/                   # Job applications
│       ├── PapsApplicationsModal.tsx  # Application list
│       ├── ReceivedSpapCard.tsx       # Application card
│       ├── SpapFeed.tsx              # My applications
│       └── SpapPoster.tsx            # Application form
├── android/                    # Android native code
├── ios/                        # iOS native code
├── web/                        # Web build files
├── App.tsx                     # Root component
├── index.js                    # Entry point
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
└── Makefile                    # Build scripts
```

### Service Layer (serve/serv.ts)

```typescript
// Central API client with type safety

export async function serv<T = any>(
  endpoint: string,
  data?: Record<string, any>
): Promise<T> {
  // Get endpoint config
  const config = endpoints[endpoint];
  
  // Build URL with path params
  let url = replacePath Params(config.path, data);
  
  // Add query params for GET
  if (config.method === 'GET') {
    url += buildQueryString(data);
  }
  
  // Validate request data
  if (config.validate) {
    config.validate(data);
  }
  
  // Handle file uploads
  if (config.isFileUpload) {
    return uploadFile(url, data, config);
  }
  
  // Make request with axios
  const response = await axiosInstance.request({
    method: config.method,
    url,
    data: config.method !== 'GET' ? data : undefined,
    headers: {
      Authorization: `Bearer ${AppSettings.token}`,
    },
  });
  
  // Save token if login
  if (endpoint === 'login' && response.data.token) {
    setAuthToken(response.data.token);
  }
  
  return response.data;
}
```

### State Management (Jotai Atoms)

```typescript
// cache/paps.tsx - Example of atomic state

// Base data atom
const papsAtom = atom<Paps[]>([]);

// Derived atoms - computed from base
const featuredPapsAtom = atom((get) => {
  const paps = get(papsAtom);
  return [...paps]
    .sort((a, b) => b.payment_amount - a.payment_amount)
    .slice(0, 5);
});

// Hook with auto-fetch
export const usePaps = () => {
  const [paps, setPaps] = useAtom(papsAtom);
  const [loading, setLoading] = useAtom(papsLoadingAtom);
  
  const fetchPaps = useCallback(async () => {
    setLoading(true);
    const response = await serv('paps.list', { status: 'published' });
    setPaps(response.paps);
    setLoading(false);
  }, []);
  
  // Auto-fetch on mount
  useEffect(() => {
    if (paps.length === 0) fetchPaps();
  }, []);
  
  return { paps, loading, fetchPaps };
};
```

### Component Pattern

```typescript
// Example: PapsPost.tsx - Job card component

export default function PapsPost({ pap }: { pap: Paps }) {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const { avatarUrl } = useAvatarUrl(pap.owner_username);
  
  // Fetch detailed data on modal open
  useEffect(() => {
    if (modalVisible) {
      serv('paps.get', { paps_id: pap.id }).then(setDetail);
    }
  }, [modalVisible]);
  
  return (
    <TouchableOpacity onPress={() => setModalVisible(true)}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {/* Card content */}
      </View>
      
      <Modal visible={modalVisible}>
        {/* Full details */}
      </Modal>
    </TouchableOpacity>
  );
}
```

### Theme System (common/theme.tsx)

```typescript
export const BRAND = {
  primary: '#10B981',      // Emerald green
  secondary: '#3B82F6',    // Blue
  accent: '#F59E0B',       // Amber
  danger: '#EF4444',       // Red
  success: '#10B981',      // Green
  warning: '#F59E0B',      // Amber
};

export const useTheme = () => {
  const isDark = AppSettings.darkTheme;
  
  const colors = {
    // Background
    background: isDark ? '#0F172A' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#FFFFFF',
    
    // Text
    text: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#CBD5E1' : '#475569',
    
    // Borders
    border: isDark ? '#334155' : '#E2E8F0',
    
    // Brand colors
    primary: BRAND.primary,
    // ... more colors
  };
  
  return { colors, isDark };
};
```

---

## Database Architecture

### Schema Overview

**19 Tables** organized into domains:

1. **User Domain** (4 tables)
   - USER: Core accounts
   - USER_PROFILE: Extended info
   - USER_EXPERIENCE: Work history
   - ROLE: User roles

2. **Category Domain** (2 tables)
   - CATEGORY: Job categories
   - USER_INTEREST: User preferences

3. **PAPS Domain** (4 tables)
   - PAPS: Job postings
   - PAPS_CATEGORY: Many-to-many
   - PAPS_MEDIA: Attachments
   - PAPS_SCHEDULE: Time slots

4. **Application Domain** (4 tables)
   - SPAP: Applications
   - SPAP_MEDIA: Portfolio
   - ASAP: Assignments
   - ASAP_MEDIA: Work proof

5. **Transaction Domain** (2 tables)
   - PAYMENT: Transactions
   - RATING: Feedback

6. **Communication Domain** (3 tables)
   - CHAT_THREAD: Conversations
   - CHAT_PARTICIPANT: Members
   - CHAT_MESSAGE: Messages
   - COMMENT: PAPS comments

### Key Tables Detail

#### USER Table

```sql
CREATE TABLE "USER" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES ROLE(id),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT user_username_not_empty 
        CHECK (LENGTH(TRIM(username)) >= 3),
    CONSTRAINT user_username_format 
        CHECK (username ~ '^[a-zA-Z][-a-zA-Z0-9_\.]*$')
);

-- Trigger for auto-updating timestamps
CREATE TRIGGER user_updated_at
    BEFORE UPDATE ON "USER"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

#### PAPS Table (Job Postings)

```sql
CREATE TABLE PAPS (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES "USER"(id),
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(500),
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    
    -- Location
    location_address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    
    -- Payment
    payment_amount DECIMAL(10, 2),
    payment_currency VARCHAR(3) DEFAULT 'USD',
    payment_type VARCHAR(20),
    
    -- Limits
    max_assignees INTEGER DEFAULT 1,
    expires_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT paps_status_valid 
        CHECK (status IN ('draft', 'published', 'closed', 'expired')),
    CONSTRAINT paps_payment_type_valid 
        CHECK (payment_type IN ('fixed', 'hourly', 'negotiable'))
);

-- Indexes for common queries
CREATE INDEX idx_paps_owner ON PAPS(owner_id);
CREATE INDEX idx_paps_status ON PAPS(status);
CREATE INDEX idx_paps_location ON PAPS(location_lat, location_lng);
CREATE INDEX idx_paps_created ON PAPS(created_at DESC);
```

#### SPAP Table (Applications)

```sql
CREATE TABLE SPAP (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paps_id UUID NOT NULL REFERENCES PAPS(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES "USER"(id),
    status VARCHAR(20) DEFAULT 'pending',
    message TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT spap_status_valid 
        CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    CONSTRAINT spap_unique_application 
        UNIQUE (paps_id, applicant_id)
);
```

#### ASAP Table (Assignments)

```sql
CREATE TABLE ASAP (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paps_id UUID NOT NULL REFERENCES PAPS(id) ON DELETE RESTRICT,
    accepted_user_id UUID NOT NULL REFERENCES "USER"(id),
    status VARCHAR(20) DEFAULT 'active',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    CONSTRAINT asap_status_valid 
        CHECK (status IN ('active', 'in_progress', 'completed', 
                         'cancelled', 'disputed')),
    CONSTRAINT asap_unique_assignment 
        UNIQUE (paps_id, accepted_user_id)
);

-- Trigger: Auto-create payment on completion
CREATE OR REPLACE FUNCTION auto_create_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO PAYMENT (
            paps_id, payer_id, payee_id, 
            amount, currency, status
        )
        SELECT 
            NEW.paps_id,
            p.owner_id,
            NEW.accepted_user_id,
            p.payment_amount,
            p.payment_currency,
            'pending'
        FROM PAPS p
        WHERE p.id = NEW.paps_id 
          AND p.payment_amount IS NOT NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER asap_create_payment
    AFTER UPDATE ON ASAP
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_payment();
```

### Database Functions

```sql
-- Calculate distance between two coordinates (Haversine)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lon1 DECIMAL, 
    lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    R CONSTANT DECIMAL := 6371; -- km
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    a := sin(dlat/2) * sin(dlat/2) + 
         cos(radians(lat1)) * cos(radians(lat2)) * 
         sin(dlon/2) * sin(dlon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## API Integration

### Endpoint Configuration

All endpoints defined in `front-end/src/serve/{domain}/endpoints.ts`:

```typescript
export const papsEndpoints: Record<string, EndpointConfig> = {
  'paps.list': {
    method: 'GET',
    path: '/paps',
    auth: true,
    validate: validatePapsListParams,
  },
  'paps.get': {
    method: 'GET',
    path: '/paps/{paps_id}',
    auth: true,
  },
  'paps.create': {
    method: 'POST',
    path: '/paps',
    auth: true,
    validate: validatePapsCreate,
    isFileUpload: false,
  },
  'paps.media.add': {
    method: 'POST',
    path: '/paps/{paps_id}/media',
    auth: true,
    isFileUpload: true,
    fileField: 'file',
    multiFile: true,
  },
};
```

### Request Flow

```
Component 
  → serv('endpoint', data)
    → Get endpoint config
    → Validate data
    → Build URL
    → Add auth header
    → Make axios request
      → Backend route handler
        → Validate params
        → Check permissions
        → Query database
        → Process results
        → Return JSON
      ← Response
    ← Parse response
  ← Update state
```

### Error Handling

```typescript
// Custom error class
export class ApiError extends Error {
  category: ErrorCategory;
  statusCode: number;
  endpoint?: string;
  
  getUserMessage(): string {
    // User-friendly error messages
  }
}

// Usage in components
try {
  await serv('paps.create', formData);
} catch (error) {
  if (error instanceof ApiError) {
    Alert.alert('Error', error.getUserMessage());
  }
}
```

---

## Authentication & Security

### Authentication Flow

1. **Registration**
   ```
   POST /register
   → Hash password with bcrypt
   → Create USER record
   → Auto-create USER_PROFILE
   → Return user_id
   ```

2. **Login**
   ```
   GET/POST /login (Basic Auth or form)
   → Verify password hash
   → Generate JWT token (24h expiry)
   → Return token + user info
   ```

3. **Authenticated Requests**
   ```
   Any endpoint with @app.auth(AUTH)
   → Extract Bearer token from header
   → Verify JWT signature
   → Decode user_id
   → Check user is_active
   → Proceed with request
   ```

### Token Structure

```json
{
  "sub": "user-uuid-here",
  "username": "john_doe",
  "is_admin": false,
  "iat": 1707681600,
  "exp": 1707768000
}
```

### Security Measures

1. **Password Security**
   - bcrypt hashing with automatic salt
   - Minimum 8 characters (recommended)
   - No plaintext storage

2. **SQL Injection Prevention**
   - Parameterized queries (aiosql)
   - No string concatenation
   - Input validation with Pydantic

3. **XSS Prevention**
   - JSON responses only
   - No HTML rendering backend
   - Content-type validation

4. **CSRF Protection**
   - Stateless JWT tokens
   - No cookies used
   - Origin validation

5. **File Upload Security**
   - File type validation
   - Size limits (10MB)
   - UUID filenames
   - Separate storage directory
   - No script execution

6. **API Rate Limiting**
   - Token-based throttling
   - Per-user request limits
   - DDoS protection

---

## State Management

### Jotai Architecture

**Atomic State Pattern**: Each data domain has its own atom

```typescript
// Base atoms - single source of truth
const papsAtom = atom<Paps[]>([]);
const papsLoadingAtom = atom<boolean>(false);
const papsErrorAtom = atom<string | null>(null);

// Derived atoms - computed values
const featuredPapsAtom = atom((get) => {
  return get(papsAtom).sort(byPayment).slice(0, 5);
});

// Write atom - actions
const refreshPapsAtom = atom(
  null,
  async (get, set) => {
    set(papsLoadingAtom, true);
    const data = await serv('paps.list');
    set(papsAtom, data.paps);
    set(papsLoadingAtom, false);
  }
);
```

### Cache Strategy

1. **On-Demand Loading**: Fetch data when first accessed
2. **Optimistic Updates**: Update UI immediately, sync later
3. **Stale-While-Revalidate**: Show cached data, refresh in background
4. **Manual Refresh**: Pull-to-refresh triggers re-fetch

### AppSettings (Global State)

```typescript
// src/AppSettings.ts - Global app state

class AppSettingsClass {
  // Auth
  token: string | null = null;
  username: string | null = null;
  userId: string | null = null;
  
  // User
  userProfile: UserProfile | null = null;
  isProfileComplete: boolean = false;
  
  // Preferences
  darkTheme: boolean = false;
  autoRotate: boolean = false;
  notifications: boolean = true;
  
  // Helpers
  isAuthenticated(): boolean {
    return !!this.token;
  }
  
  async loadProfile(): Promise<void> {
    const profile = await serv('profile.get');
    this.userProfile = profile;
    this.checkProfileComplete();
  }
  
  logout(): void {
    this.token = null;
    this.username = null;
    // Clear all atoms
  }
}

export const AppSettings = new AppSettingsClass();
```

---

## Media Handling

### Backend Media Storage

```python
# mediator.py - Media handler

class MediaHandler:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        
    def save_file(
        self, 
        file: FileStorage,
        entity_type: str,  # 'paps', 'profile', 'category'
        entity_id: str,    # UUID
        file_type: str     # 'image', 'video', 'pdf'
    ) -> str:
        # Validate file type
        if not self._is_valid_type(file, file_type):
            raise ValueError("Invalid file type")
        
        # Generate UUID filename
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid4()}.{ext}"
        
        # Create directory structure
        dir_path = self.base_path / entity_type / entity_id
        dir_path.mkdir(parents=True, exist_ok=True)
        
        # Save file
        file_path = dir_path / filename
        file.save(file_path)
        
        # Return relative URL
        return f"/media/{entity_type}/{entity_id}/{filename}"
```

### Frontend Media Upload

```typescript
// Upload with react-native-image-picker

import { launchImageLibrary } from 'react-native-image-picker';

const uploadMedia = async (papsId: string) => {
  // Pick image
  const result = await launchImageLibrary({
    mediaType: 'photo',
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
  });
  
  if (result.assets?.[0]) {
    const asset = result.assets[0];
    
    // Upload via serv
    const response = await serv('paps.media.add', {
      paps_id: papsId,
      file: {
        uri: asset.uri,
        type: asset.type,
        name: asset.fileName,
      },
    });
    
    return response.media_url;
  }
};
```

### Media Display

```typescript
// MediaViewer component - adaptive display

<MediaViewer
  media={[
    { media_type: 'image', media_url: '/media/...' },
    { media_type: 'video', media_url: '/media/...' },
  ]}
  layout="grid"      // or 'carousel'
  maxVisible={5}     // show +N badge
/>

// Generates URLs via getMediaUrl()
const fullUrl = getMediaUrl('/media/paps/123/abc.jpg');
// → http://localhost:5000/media/paps/123/abc.jpg
```

---

## Development Setup

### Prerequisites

```bash
# System requirements
- macOS / Linux / Windows WSL
- Python 3.12+
- Node.js 20+
- PostgreSQL 14+
- Git

# Install tools
brew install python node postgresql git  # macOS
sudo apt install python3 nodejs postgresql git  # Linux
```

### Backend Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd underboss/back-end

# 2. Create database
createdb underboss
psql underboss < create.sql
psql underboss < data.sql

# 3. Configure environment
cp local.conf.example local.conf
export APP_NAME=underboss
export APP_CONFIG=local.conf
export APP_SECRET=your-secret-key-here

# 4. Install dependencies
make dev  # Creates venv, installs requirements

# 5. Run server
make run  # Starts Flask on port 5000

# 6. Verify
curl http://localhost:5000/uptime
```

### Frontend Setup

```bash
# 1. Navigate to front-end
cd ../front-end

# 2. Install dependencies
make dev  # Runs npm install

# 3. Run web version
make web  # Starts on http://localhost:8080

# 4. Run mobile (Android)
# Start Metro bundler
npm start

# Connect device/emulator
adb devices
adb reverse tcp:5000 tcp:5000  # Forward backend port

# Run app
npm run android

# 5. Run mobile (iOS)
cd ios && pod install && cd ..
npm run ios
```

### Database Management

```bash
# Reset database
make db.clean  # Drop all tables
make db.create  # Recreate schema
make db.data  # Load seed data

# Backup database
pg_dump underboss > backup.sql

# Restore database
psql underboss < backup.sql

# Check database stats
make db.stats  # Shows table sizes, indexes
```

### Common Issues

**Issue**: Database connection failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list  # macOS

# Check connection
psql -U underboss_user -d underboss -h localhost
```

**Issue**: Port 5000 already in use
```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change port in local.conf
{"APP_PORT": 5001}
```

**Issue**: React Native build fails
```bash
# Clean build artifacts
cd android && ./gradlew clean && cd ..
cd ios && pod deintegrate && pod install && cd ..

# Clear Metro cache
npm start -- --reset-cache
```

---

## Testing

### Backend Testing

```bash
# Run test suite
make test  # Runs pytest

# Run comprehensive API tests
./comprehensive_test.sh

# Run specific test file
pytest test.py::test_user_registration -v

# With coverage
pytest --cov=api --cov-report=html

# Load testing
ab -n 1000 -c 10 http://localhost:5000/paps
```

### comprehensive_test.sh

Bash script testing **100+ scenarios**:

```bash
#!/bin/bash
# Tests all endpoints with various parameters

# System routes
test_uptime
test_version
test_stats

# Authentication
test_register_valid
test_register_invalid_username
test_register_duplicate
test_login_basic_auth
test_login_form
test_login_invalid

# User management
test_list_users
test_get_user
test_update_user
test_admin_operations

# PAPS workflow
test_create_paps_draft
test_publish_paps
test_search_paps_location
test_filter_paps_payment
test_paps_schedules

# SPAP workflow
test_apply_to_paps
test_update_application
test_withdraw_application

# ASAP workflow
test_create_assignment
test_complete_assignment
test_auto_payment_creation

# Ratings & Comments
test_rate_user
test_comment_on_paps
```

### Frontend Testing

```bash
# Run Jest tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test PapsFeed.test.tsx

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# E2E testing (if configured)
detox test
```

### Manual Testing Checklist

**Authentication Flow**
- [ ] Register new user
- [ ] Login with username
- [ ] Login with email
- [ ] Login with phone
- [ ] Invalid credentials error
- [ ] Token expires after 24h

**Profile Management**
- [ ] View own profile
- [ ] Update profile fields
- [ ] Upload avatar
- [ ] Add experience
- [ ] Add interests
- [ ] View public profile

**PAPS Workflow**
- [ ] Create draft PAPS
- [ ] Publish PAPS
- [ ] Edit PAPS
- [ ] Add media
- [ ] Create schedule
- [ ] Search by location
- [ ] Filter by category

**Application Workflow**
- [ ] Apply to PAPS
- [ ] Upload portfolio
- [ ] Withdraw application
- [ ] Owner accepts application
- [ ] Assignment created

**Payment Flow**
- [ ] Complete assignment
- [ ] Payment auto-created
- [ ] View payment details
- [ ] Payment status updates

---

## Deployment

### Backend Deployment

#### Using Gunicorn (Production)

```bash
# Install Gunicorn
pip install gunicorn

# Run with config
gunicorn -c gunicorn.conf.py app:app

# gunicorn.conf.py
bind = "0.0.0.0:5000"
workers = 4
worker_class = "sync"
timeout = 120
keepalive = 5
accesslog = "-"
errorlog = "-"
```

#### Using Docker

```dockerfile
# Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 5000

# Run app
CMD ["gunicorn", "-c", "gunicorn.conf.py", "app:app"]
```

```bash
# Build and run
docker build -t underboss-backend .
docker run -p 5000:5000 \
  -e APP_CONFIG=server.conf \
  -e APP_SECRET=$SECRET \
  underboss-backend
```

#### Environment Variables

```bash
# Production .env
APP_NAME=underboss
APP_CONFIG=server.conf
APP_SECRET=<your-production-secret>
DB_HOST=postgres.example.com
DB_PORT=5432
DB_NAME=underboss_prod
DB_USER=underboss_prod
DB_PASSWORD=<db-password>
MEDIA_BASE_PATH=/var/www/underboss/media
```

### Frontend Deployment

#### Android APK Build

```bash
cd android

# Generate signing key
keytool -genkey -v -keystore underboss.keystore \
  -alias underboss -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
./gradlew assembleRelease

# Output: app/build/outputs/apk/release/app-release.apk
```

#### iOS App Store Build

```bash
# 1. Open Xcode
open ios/Underboss.xcworkspace

# 2. Select "Any iOS Device"
# 3. Product → Archive
# 4. Distribute App → App Store Connect
# 5. Follow TestFlight/App Store submission
```

#### Web Deployment

```bash
# Build production bundle
npm run build

# Output: dist/
# Deploy to static hosting (Netlify, Vercel, S3)

# Nginx config
server {
    listen 80;
    server_name app.underboss.com;
    root /var/www/underboss/dist;
    
    location / {
        try_files $uri /index.html;
    }
    
    location /media/ {
        proxy_pass http://backend:5000/media/;
    }
}
```

---

## Performance Optimization

### Backend Optimizations

1. **Database Indexes**
   ```sql
   -- Already created in create.sql
   CREATE INDEX idx_paps_location ON PAPS(location_lat, location_lng);
   CREATE INDEX idx_paps_status ON PAPS(status);
   CREATE INDEX idx_paps_created ON PAPS(created_at DESC);
   ```

2. **SQL Query Optimization**
   - Use JOINs instead of multiple queries
   - Add LIMIT for pagination
   - Use EXISTS instead of COUNT for checks
   - Avoid SELECT * except when necessary

3. **Connection Pooling**
   ```python
   # ProxyPatternPool automatically pools connections
   # Configured in database.py
   pool_size = 10
   max_overflow = 20
   ```

4. **Caching**
   ```python
   # Implement Redis for frequent queries
   from redis import Redis
   cache = Redis(host='localhost', port=6379)
   
   def get_categories():
       cached = cache.get('categories')
       if cached:
           return json.loads(cached)
       
       categories = db.query("SELECT * FROM CATEGORY")
       cache.setex('categories', 3600, json.dumps(categories))
       return categories
   ```

### Frontend Optimizations

1. **Component Memoization**
   ```typescript
   export default React.memo(PapsPost, (prev, next) => {
     return prev.pap.id === next.pap.id;
   });
   ```

2. **Image Optimization**
   ```typescript
   <Image
     source={{ uri: imageUrl }}
     resizeMode="cover"
     style={styles.image}
     // Lazy loading
     loadingIndicatorSource={placeholderImage}
   />
   ```

3. **List Virtualization**
   ```typescript
   <FlatList
     data={paps}
     renderItem={renderPap}
     keyExtractor={item => item.id}
     // Performance props
     initialNumToRender={10}
     maxToRenderPerBatch={10}
     windowSize={5}
     removeClippedSubviews={true}
   />
   ```

4. **Bundle Size Reduction**
   ```json
   // webpack.config.js
   optimization: {
     splitChunks: {
       chunks: 'all',
       cacheGroups: {
         vendor: {
           test: /[\\/]node_modules[\\/]/,
           name: 'vendors',
         },
       },
     },
   }
   ```

---

## Troubleshooting

### Common Backend Issues

**Problem**: Import errors when running tests
```bash
# Solution: Install in development mode
pip install -e .
```

**Problem**: Database queries timing out
```sql
-- Check long-running queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;

-- Kill query
SELECT pg_cancel_backend(pid);
```

**Problem**: Media files not serving
```python
# Check MEDIA_BASE_PATH in config
# Verify file permissions
chmod -R 755 media/
chown -R www-data:www-data media/
```

### Common Frontend Issues

**Problem**: "Network request failed"
```typescript
// Check BASE_URL in serve/serv.ts
// Verify backend is running
// Check CORS settings on backend
```

**Problem**: Jotai state not updating
```typescript
// Verify atom is being set, not mutated
setPaps(newPaps);  // ✓ Correct
paps.push(newPap); // ✗ Wrong (mutation)
```

**Problem**: Android build fails
```bash
# Clear build cache
cd android
./gradlew clean
rm -rf .gradle build app/build
cd ..

# Rebuild
npm run android
```

### Debug Tools

**Backend**
```python
# Enable debug logging
logging.basicConfig(level=logging.DEBUG)

# Use Flask debugger
app.config['DEBUG'] = True

# Print SQL queries
import logging
logging.getLogger('aiosql').setLevel(logging.DEBUG)
```

**Frontend**
```typescript
// Use Reactotron for debugging
import Reactotron from 'reactotron-react-native';

Reactotron
  .configure()
  .useReactNative()
  .connect();

// Log state changes
Reactotron.log('Paps loaded', paps);
```

---

## Documentation References

### Backend Documentation
- [Backend README](back-end/docs/README.md) - Architecture & concepts
- [API Routes Reference](back-end/docs/routes.md) - Complete endpoint docs
- [Testing Guide](back-end/docs/testing.md) - Test suite documentation
- [Database Schema](back-end/docs/database_schema.mmd) - Mermaid diagram

### Frontend Documentation
- [Frontend README](front-end/README.md) - Quick start guide
- [Routes Documentation](front-end/routes.md) - API endpoint reference
- [Avatar Guide](front-end/src/serve/AVATAR_GUIDE.md) - Avatar handling
- [Clement's Guide](front-end/src/serve/CLEMENT_READ_THIS.md) - Serve layer

### Key Files
- `create.sql` - Database schema definition
- `queries.sql` - All SQL queries (aiosql format)
- `data.sql` - Seed data for development
- `app.py` - Backend application entry
- `App.tsx` - Frontend application entry
- `package.json` - Frontend dependencies
- `requirements.txt` - Backend dependencies

---

## Change Log

### Version 1.0.0 (February 11, 2026)
- Initial comprehensive documentation
- Added map view with OpenStreetMap (WebView-based, no API key)
- Documented complete backend architecture
- Documented complete frontend architecture
- Added all 19 database tables documentation
- Covered all API endpoints
- Included testing procedures
- Added deployment guides

---

## Contributing

### Code Style

**Backend** (Python)
- Follow PEP 8
- Use type hints
- Document with docstrings
- 4-space indentation

**Frontend** (TypeScript)
- Follow ESLint config
- Use TypeScript types
- Document complex logic
- 2-space indentation

### Pull Request Process

1. Create feature branch
2. Make changes with tests
3. Update documentation
4. Run linter & tests
5. Submit PR with description
6. Address review comments
7. Merge after approval

### Commit Message Format

```
type(scope): subject

body

footer
```

**Types**: feat, fix, docs, style, refactor, test, chore

**Example**:
```
feat(paps): add location-based search

Implemented Haversine distance calculation for finding
nearby jobs within specified radius.

Closes #123
```

---

**End of Technical Documentation**
