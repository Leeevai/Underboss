# Underboss Backend Documentation

Complete documentation for the Underboss backend system - a job marketplace platform connecting people who post jobs (PAPS) with people who want to work (workers through SPAP applications and ASAP assignments).

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Core Concepts](#core-concepts)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [Authentication & Authorization](#authentication--authorization)
7. [Media Handling](#media-handling)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Development Setup](#development-setup)

---

## Architecture Overview

### Tech Stack

- **Framework**: Flask with FlaskSimpleAuth
- **Database**: PostgreSQL 14+
- **Python**: 3.12+
- **SQL Interface**: aiosql + anodb
- **Authentication**: JWT tokens, HTTP Basic, Parameter-based
- **Media Storage**: Local filesystem
- **Testing**: pytest

### Design Patterns

- **Repository Pattern**: Database access through `database.py`
- **Mediator Pattern**: Media handling through `mediator.py`
- **Blueprint Pattern**: API routes organized by domain (`api/` folder)
- **Factory Pattern**: Media handler creation

### Key Features

- Multi-authentication support (JWT, Basic, Parameter)
- Role-based access control (Admin, User)
- Soft deletes for audit trails
- Automatic profile creation on user registration
- Auto-payment generation on job completion
- Location-based search with radius filtering
- Category-based job classification
- Comment threading system
- Real-time chat messaging

---

## Project Structure

```
back-end/
├── api/                    # API route modules
│   ├── __init__.py        # Route registration
│   ├── auth.py            # Authentication routes
│   ├── system.py          # System information routes
│   ├── user.py            # User management (admin)
│   ├── profile.py         # User profile management
│   ├── category.py        # Category management
│   ├── paps.py            # Job posting management
│   ├── schedule.py        # PAPS schedule management
│   ├── spap.py            # Application management
│   ├── asap.py            # Assignment management
│   ├── payment.py         # Payment management
│   ├── rating.py          # Rating system
│   ├── comment.py         # Comment system
│   └── chat.py            # Chat messaging
├── docs/                   # Documentation
│   ├── README.md          # This file
│   ├── routes.md          # API routes reference
│   ├── database.md        # Database schema details
│   └── testing.md         # Testing guide
├── media/                  # User-uploaded files
│   ├── user/profile/      # Profile avatars
│   ├── category/          # Category icons
│   ├── paps/              # Job posting media
│   ├── spap/              # Application media
│   └── asap/              # Assignment media
├── app.py                  # Flask application entry
├── auth.py                 # Authentication helpers
├── database.py             # Database connection & queries
├── mediator.py             # Media handling
├── model.py                # Data models
├── utils.py                # Utility functions
├── version.py              # Version info (auto-generated)
├── create.sql              # Database schema
├── queries.sql             # SQL queries
├── data.sql                # Seed data
├── drop.sql                # Database cleanup
├── test.py                 # Test suite
├── Makefile                # Build automation
├── requirements.txt        # Python dependencies
└── local.conf              # Local configuration
```

---

## Core Concepts

### PAPS (People Are Posting Stuff)

**Job Postings** created by users who need work done.

**Lifecycle**:
1. **Draft**: Created but not visible
2. **Published**: Visible and accepting applications
3. **Closed**: No longer accepting applications
4. **Expired**: Past expiration date

**Features**:
- Title, description, location
- Payment amount and currency
- Multiple categories (with primary)
- Schedule (date/time slots)
- Media attachments (photos, videos, PDFs)
- Expiration date

### SPAP (Some People Are Participating)

**Applications** submitted by workers wanting to do the job. SPAP is a minimal association table linking users to PAPS they've applied for.

**Lifecycle**:
1. **Pending**: Submitted, awaiting review
2. **Accepted**: Owner approved (ready for assignment)
3. **Rejected**: Owner declined
4. **Withdrawn**: Applicant cancelled

**Features**:
- Application message (optional cover letter)
- Status tracking
- Media attachments (portfolio, certifications)
- Application timestamp

**Note**: All job details (title, location, payment) are in PAPS, not duplicated in SPAP.

### ASAP (Assignments Specified Are Possible)

**Assignments** created when owner accepts an application. ASAP is a minimal association table linking accepted users to PAPS.

**Lifecycle**:
1. **Active**: Assignment created, ready to start
2. **In Progress**: Work has begun
3. **Completed**: Work finished
4. **Cancelled**: Assignment terminated
5. **Disputed**: Issues with assignment

**Features**:
- Links accepted users to PAPS
- Status and timestamp tracking (assigned_at, started_at, completed_at)
- Media attachments (proof of work)
- **Auto-payment**: When marked "completed" with payment_amount set in PAPS

**Note**: All job details (title, location, payment, owner) are in PAPS, not duplicated in ASAP.

### PAYMENT

**Payment records** tracking financial transactions.

**Key Details**:
- References **PAPS** (not ASAP) - allows ASAP deletion after completion
- Payer: PAPS owner
- Payee: Worker (accepted_user_id)
- Auto-created when ASAP marked "completed"
- RESTRICT constraint: must delete payments before PAPS

**Lifecycle**:
1. **Pending**: Payment initiated
2. **Processing**: Payment in progress
3. **Completed**: Payment successful
4. **Failed**: Payment unsuccessful
5. **Refunded**: Payment reversed

### USER & PROFILE

**User**: Authentication data (username, email, phone, password, is_admin)
**Profile**: Public information (name, bio, avatar, location, experiences, interests)

**Auto-creation**: Profile automatically created on user registration.

### CATEGORY

**Hierarchical classification** for job postings.

**Structure**:
- Name, slug, description
- Icon URL
- Parent category (for subcategories)
- Display order
- Active/inactive status

### RATING

**Feedback system** for completed jobs.

**Rules**:
- 1-5 star rating
- Optional text review
- Can only rate users you've worked with
- One rating per PAPS
- Cannot rate yourself

### COMMENT

**Discussion threads** on job postings.

**Features**:
- Threaded replies (parent_id)
- Soft delete (preserves structure)
- Timestamps for created/updated

### CHAT

**Private messaging** between users.

**Features**:
- Thread-based conversations
- Multiple participants (up to 10)
- Can associate with PAPS/SPAP/ASAP
- Read receipts
- Unread count tracking

---

## Database Schema

### Core Tables

#### USER
```sql
CREATE TABLE "USER" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### USER_PROFILE
```sql
CREATE TABLE USER_PROFILE (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    date_of_birth DATE,
    location_address VARCHAR(500),
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    timezone VARCHAR(50),
    preferred_language VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### CATEGORY
```sql
CREATE TABLE CATEGORY (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(500),
    icon_url VARCHAR(500),
    parent_id UUID REFERENCES CATEGORY(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### PAPS
```sql
CREATE TABLE PAPS (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    location_address VARCHAR(500),
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    payment_amount DECIMAL(10,2),
    payment_currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP,
    expires_at TIMESTAMP,
    deleted_at TIMESTAMP
);
```

#### SPAP
```sql
CREATE TABLE SPAP (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paps_id UUID NOT NULL REFERENCES PAPS(id) ON DELETE RESTRICT,
    applicant_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE RESTRICT,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'withdrawn', 'rejected', 'accepted')),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT spap_unique_application UNIQUE (paps_id, applicant_id)
);
```

#### ASAP
```sql
CREATE TABLE ASAP (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paps_id UUID NOT NULL REFERENCES PAPS(id) ON DELETE RESTRICT,
    accepted_user_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled', 'disputed')),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    CONSTRAINT asap_unique_assignment UNIQUE (paps_id, accepted_user_id),
    CONSTRAINT asap_completed_after_start CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
);
```

#### PAYMENT
```sql
CREATE TABLE PAYMENT (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paps_id UUID NOT NULL REFERENCES PAPS(id) ON DELETE RESTRICT,
    payer_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE RESTRICT,
    payee_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE RESTRICT,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### Relationship Tables

- **SPAP**: Minimal association table linking users (applicants) to PAPS (many-to-many)
- **ASAP**: Minimal association table linking accepted users to PAPS (many-to-many)
- **PAPS_CATEGORY**: Links PAPS to categories (many-to-many)
- **USER_INTEREST**: Links users to category interests
- **USER_EXPERIENCE**: Work experience entries
- **PAPS_SCHEDULE**: Time slots for job postings
- **PAPS_MEDIA**, **SPAP_MEDIA**, **ASAP_MEDIA**: File attachments

### Constraint Summary

**CASCADE Deletes**:
- USER → USER_PROFILE, USER_INTEREST, USER_EXPERIENCE
- PAPS → SPAP, ASAP, COMMENT, PAPS_MEDIA, PAPS_CATEGORY, PAPS_SCHEDULE
- SPAP → SPAP_MEDIA
- ASAP → ASAP_MEDIA

**RESTRICT Deletes**:
- PAYMENT → PAPS (must delete payments first)
- PAPS → USER (owner)
- SPAP → USER (applicant)
- ASAP → USER (owner, accepted_user)

**Soft Deletes** (deleted_at timestamp):
- PAPS, SPAP, ASAP, COMMENT, PAYMENT

---

## API Documentation

See [routes.md](routes.md) for complete API reference.

### Quick Reference

**Authentication**:
- `POST /register` - Create account
- `GET /login` - Get token (Basic Auth)
- `POST /login` - Get token (Form Auth)

**Profiles**:
- `GET /profile` - Current user profile
- `PUT/PATCH /profile` - Update profile
- `POST /profile/avatar` - Upload avatar
- `GET /user/{username}/profile` - Public profile

**Job Postings**:
- `GET /paps` - List all jobs (with filters)
- `POST /paps` - Create job posting
- `GET /paps/{id}` - Job details
- `PUT/PATCH /paps/{id}` - Update job
- `DELETE /paps/{id}` - Delete job

**Applications**:
- `POST /spaps` - Apply for job
- `GET /spaps` - List applications
- `PATCH /spaps/{id}` - Update status

**Assignments**:
- `POST /asaps` - Create assignment
- `PATCH /asaps/{id}` - Update status (triggers auto-payment)

**Payments**:
- `GET /paps/{id}/payments` - List payments for job
- `POST /paps/{id}/payments` - Create payment
- `PATCH /payments/{id}` - Update payment status

---

## Authentication & Authorization

### Authentication Methods

1. **JWT Token** (Recommended for frontend)
   ```
   Authorization: Bearer <token>
   ```

2. **HTTP Basic Auth**
   ```
   Authorization: Basic base64(username:password)
   ```

3. **Parameter Auth** (Form data)
   ```json
   {
     "login": "username",
     "password": "password"
   }
   ```

### Authorization Levels

- **OPEN**: No authentication required (registration, login, public profiles)
- **AUTH**: Any authenticated user
- **ADMIN**: Users with `is_admin=true`
- **OWNER**: Resource owner (checked in route logic)

### Login Identifiers

Users can login with:
- Username
- Email address
- Phone number

### Token Generation

```python
token = app.create_token(username)
```

Tokens contain:
- Username
- Expiration time (configurable)
- Signature (HMAC-SHA256)

---

## Media Handling

### MediaHandler (mediator.py)

Centralized media management system.

**Features**:
- File type validation
- Size limit enforcement
- Automatic image compression
- Unique filename generation
- Directory organization
- Safe file deletion

### Media Types

```python
class MediaType(Enum):
    AVATAR = "avatar"           # User profile pictures
    CATEGORY_ICON = "category"  # Category icons
    PAPS_MEDIA = "paps"         # Job posting media
    SPAP_MEDIA = "spap"         # Application media
    ASAP_MEDIA = "asap"         # Assignment media
```

### Configuration

```python
MEDIA_CONFIG = {
    "avatar": {
        "max_size": 5 * 1024 * 1024,  # 5 MB
        "allowed_types": ["png", "jpg", "jpeg", "gif", "webp"],
        "path": "media/user/profile",
        "compress": True,  # Auto-compress avatars
        "max_dimension": 800  # Max width/height
    },
    "category": {
        "max_size": 2 * 1024 * 1024,  # 2 MB
        "allowed_types": ["png", "jpg", "jpeg", "gif", "webp", "svg"],
        "path": "media/category"
    },
    "paps": {
        "max_size": 50 * 1024 * 1024,  # 50 MB
        "allowed_types": ["png", "jpg", "jpeg", "gif", "webp", "mp4", "mov", "pdf"],
        "path": "media/paps",
        "max_files": 10
    }
}
```

### Upload Flow

1. **Validate**: Check file type and size
2. **Generate**: Create unique filename (UUID)
3. **Store**: Save to appropriate directory
4. **Compress**: If image and compression enabled
5. **Database**: Save URL in database
6. **Return**: URL to frontend

### Deletion Flow

1. **Get**: Retrieve file path from database
2. **Delete**: Remove file from disk
3. **Update**: Clear URL in database

---

## Testing

### Test Suite (test.py)

Comprehensive pytest suite with 27 tests covering all functionality.

**Test Categories**:
- System routes (info, stats, uptime)
- Authentication (register, login)
- User management (CRUD operations)
- Profile management (CRUD, avatar, experiences, interests)
- Categories (CRUD, icons)
- PAPS (CRUD, media, schedule, search, filters)
- SPAP (applications, status updates)
- ASAP (assignments, status updates, auto-payment)
- Payments (CRUD, by PAPS, by user)
- Ratings (create, update, delete)
- Comments (threads, replies, soft delete)
- Full workflow (end-to-end scenario)

### Running Tests

```bash
# Run all tests
make check.pytest

# Run specific test
pytest test.py::test_payment -v

# Run with coverage
pytest --cov=. test.py

# Run in parallel
pytest -n auto test.py
```

### Test Environment

**Requirements**:
- PostgreSQL database "underboss"
- Flask server on port 5000
- Test data loaded from test_users.csv

**Setup**:
```bash
make clean          # Clean environment
make running        # Start server
pytest test.py -v   # Run tests
make stop           # Stop server
```

### Test Fixtures

```python
@pytest.fixture
def api():
    """Flask test client with authentication helpers."""
    return FlaskTesterAPI(
        url="http://localhost:5000",
        user="login",
        pwd="password",
        auth="calvin:hobbes,hobbes:calvin"
    )
```

### Test Data

**Admin User**: `calvin` / `hobbes`
**Regular User**: `hobbes` / `calvin`

Generated from `test_users.in` via `pass2csv.py`.

---

## Deployment

### Requirements

- **Python**: 3.12+
- **PostgreSQL**: 14+
- **OS**: Linux (tested on Ubuntu)

### Environment Variables

```bash
export APP_NAME="underboss"
export APP_CONFIG="/path/to/server.conf"
export APP_SECRET="<64-char-hex-string>"
export DATABASE_URL="postgresql://user:pass@localhost/underboss"
```

### Configuration File (server.conf)

```python
# Database
DATABASE = {
    "host": "localhost",
    "port": 5432,
    "db": "underboss",
    "user": "underboss_user",
    "password": "secure_password"
}

# Authentication
FSA_AUTH = ["token", "basic", "param"]
FSA_TOKEN_TYPE = "jwt"
FSA_TOKEN_ALGO = "HS256"
FSA_TOKEN_DELAY = datetime.timedelta(hours=24)

# Media
MEDIA_ROOT = "/var/www/underboss/media"

# Features
APP_USERS = False  # Disable admin /users routes in production
APP_TESTING = False  # Disable /uptime route
```

### Database Setup

```bash
# Create database
createdb underboss

# Initialize schema
psql underboss < drop.sql
psql underboss < create.sql
psql underboss < data.sql
```

### WSGI Deployment (Apache/mod_wsgi)

**underboss.wsgi**:
```python
import os
os.environ["APP_NAME"] = "underboss"
os.environ["APP_CONFIG"] = "/home/underboss/conf/server.conf"
os.environ["APP_SECRET"] = "<secret>"
from app import app as application
```

**Apache Config**:
```apache
<VirtualHost *:443>
    ServerName underboss.example.com
    
    WSGIDaemonProcess underboss user=underboss group=underboss threads=5
    WSGIScriptAlias / /home/underboss/app/underboss.wsgi
    
    <Directory /home/underboss/app>
        WSGIProcessGroup underboss
        WSGIApplicationGroup %{GLOBAL}
        Require all granted
    </Directory>
    
    Alias /media /home/underboss/app/media
    <Directory /home/underboss/app/media>
        Require all granted
    </Directory>
    
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/underboss.crt
    SSLCertificateKeyFile /etc/ssl/private/underboss.key
</VirtualHost>
```

### Production Checklist

- [ ] Set secure `APP_SECRET` (64-char random hex)
- [ ] Disable `APP_USERS` and `APP_TESTING`
- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure firewall (allow 443, block 5000)
- [ ] Set up log rotation
- [ ] Configure monitoring (uptime, errors)
- [ ] Set restrictive file permissions on media directories
- [ ] Enable rate limiting (not currently implemented)
- [ ] Set up CORS if needed for frontend

---

## Development Setup

### Prerequisites

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Python 3.12+
sudo apt install python3.12 python3.12-venv

# Install development tools
sudo apt install make git
```

### Quick Start

```bash
# Clone repository
git clone <repo-url>
cd back-end

# Create virtual environment
python3.12 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install -r dev-requirements.txt

# Setup database
createdb underboss
make .postgres

# Run tests
make check.pytest

# Start development server
make running

# Access API
curl http://localhost:5000/info
```

### Makefile Targets

```bash
make clean          # Clean all generated files and database
make .postgres      # Initialize database
make running        # Start Flask development server
make stop           # Stop Flask server
make check.pytest   # Run all tests
make log            # Tail application log
make version.py     # Generate version info from git
```

### Development Workflow

1. **Make changes** to code
2. **Run tests**: `make check.pytest`
3. **Check logs**: `make log`
4. **Commit**: `git commit -m "feat: description"`
5. **Push**: `git push`

### Code Organization

**Route Modules** (`api/*.py`):
```python
def register_routes(app):
    """Register routes with Flask app."""
    from database import db
    
    @app.get("/endpoint", authz="AUTH")
    def get_endpoint(auth: model.CurrentAuth):
        # Implementation
        return result, 200
```

**Database Queries** (`queries.sql`):
```sql
-- name: get_something
-- Get something by ID
SELECT * FROM table WHERE id = :id;
```

**Database Access** (`database.py`):
```python
class Database:
    def get_something(self, id: str):
        return self._db.get_something(id=id)
```

### Debugging

**Enable Debug Mode**:
```bash
flask --debug --app=app.py run
```

**Database Queries**:
```sql
-- Check active connections
SELECT * FROM pg_stat_activity WHERE datname = 'underboss';

-- View table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Logs**:
```bash
# Application log
tail -f app.log

# PostgreSQL log
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## Common Issues & Solutions

### Database Connection Errors

**Issue**: `psql: FATAL: database "underboss" does not exist`

**Solution**:
```bash
createdb underboss
make .postgres
```

### Port Already in Use

**Issue**: `port 5000 already in use`

**Solution**:
```bash
make clean  # Kills all Flask processes
make running
```

### Import Errors

**Issue**: `ModuleNotFoundError: No module named 'FlaskSimpleAuth'`

**Solution**:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Permission Denied on Media Files

**Issue**: `Permission denied: 'media/user/profile/avatar.png'`

**Solution**:
```bash
chmod -R 755 media/
chown -R $USER:$USER media/
```

### Foreign Key Constraint Violations

**Issue**: `violates foreign key constraint "payment_paps_id_fkey"`

**Solution**: Delete in correct order:
```bash
# 1. Delete payments first
DELETE FROM payment WHERE paps_id = '<uuid>';

# 2. Then delete PAPS
DELETE FROM paps WHERE id = '<uuid>';
```

---

## Performance Considerations

### Database Indexes

All major foreign keys and frequently queried columns are indexed:
- `idx_user_email`, `idx_user_phone`, `idx_user_username`
- `idx_paps_owner`, `idx_paps_status`, `idx_paps_location`
- `idx_spap_paps`, `idx_spap_applicant`
- `idx_asap_paps`, `idx_asap_accepted_user`
- `idx_payment_paps`, `idx_payment_payer`, `idx_payment_payee`

### Query Optimization

**Use LIMIT and OFFSET** for pagination:
```python
paps = db.get_paps_all(limit=50, offset=0)
```

**Avoid N+1 Queries** with JOINs:
```sql
-- Good: Single query with JOIN
SELECT p.*, u.login as owner_username
FROM paps p
JOIN "USER" u ON p.owner_id = u.id;

-- Bad: N queries
SELECT * FROM paps;
-- Then for each: SELECT login FROM "USER" WHERE id = ?
```

### Connection Pooling

anodb uses ProxyPatternPool for connection management:
```python
db = anodb.DB(
    "postgres",
    "postgresql://user:pass@localhost/underboss",
    pool_size=10,
    max_overflow=5
)
```

### Caching

FlaskSimpleAuth includes caching for:
- User authentication data
- Password hash verification
- Token validation

---

## Security Best Practices

### Input Validation

- All inputs validated before database queries
- Regular expressions for email, phone, username
- Length limits on all text fields
- Type checking on numeric fields

### SQL Injection Prevention

- All queries use parameterized statements (aiosql)
- No string concatenation for SQL
- ORM-style parameter binding

### Authentication Security

- Passwords hashed with bcrypt (via FlaskSimpleAuth)
- JWT tokens signed with HS256
- Token expiration enforced
- No passwords in logs or responses

### Authorization Checks

```python
# Check ownership
fsa.checkVal(paps["owner_id"] == auth.aid, "Not authorized", 403)

# Check admin
fsa.checkVal(auth.is_admin, "Admin only", 403)
```

### File Upload Security

- Whitelist of allowed extensions
- File size limits enforced
- Path traversal prevention
- Unique filenames (UUID-based)
- No execution permissions on uploads

### CORS Configuration

Configure CORS for production:
```python
from flask_cors import CORS

CORS(app, origins=[
    "https://underboss.example.com",
    "https://app.underboss.example.com"
])
```

---

## Monitoring & Logging

### Application Logs

**Log File**: `app.log`

**Log Levels**:
- DEBUG: Detailed diagnostic info
- INFO: General informational messages
- WARNING: Warning messages
- ERROR: Error messages
- CRITICAL: Critical errors

**Custom Logging**:
```python
from utils import log

log.info("Job posting created", extra={"paps_id": paps_id})
log.error("Payment failed", extra={"payment_id": payment_id})
```

### Database Monitoring

**Active Connections**:
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'underboss';
```

**Slow Queries**:
```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Health Checks

**Uptime Endpoint** (testing only):
```bash
curl http://localhost:5000/uptime
```

**Database Check**:
```bash
psql -U underboss_user -d underboss -c "SELECT 1;"
```

---

## Future Enhancements

### Planned Features

- [ ] WebSocket support for real-time chat
- [ ] Push notifications for new messages/applications
- [ ] Email notifications (job accepted, payment received)
- [ ] SMS notifications via Twilio
- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Advanced search (Elasticsearch)
- [ ] Job recommendations based on interests
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] Rate limiting middleware
- [ ] Redis caching layer
- [ ] Celery background tasks
- [ ] File virus scanning
- [ ] Geolocation autocomplete
- [ ] Multi-language support (i18n)
- [ ] API versioning

### Scalability Considerations

**Horizontal Scaling**:
- Stateless application (JWT tokens)
- Shared database (PostgreSQL cluster)
- Shared media storage (S3/MinIO)
- Load balancer (Nginx/HAProxy)

**Vertical Scaling**:
- Increase PostgreSQL resources
- Optimize queries and indexes
- Enable query caching
- Increase connection pool size

**Microservices**:
- Split payment service
- Split chat service
- Split media service
- Use message queue (RabbitMQ/Kafka)

---

## Contributing

### Code Style

- **Python**: PEP 8
- **SQL**: Uppercase keywords, lowercase identifiers
- **Naming**: snake_case for variables, PascalCase for classes

### Commit Messages

Follow conventional commits:
```
feat: Add payment status filtering
fix: Correct ASAP auto-payment creation
refactor: Simplify profile update logic
docs: Update API documentation
test: Add SPAP media upload tests
```

### Pull Request Process

1. Create feature branch: `git checkout -b feat/new-feature`
2. Make changes and add tests
3. Run test suite: `make check.pytest`
4. Commit with conventional messages
5. Push branch: `git push origin feat/new-feature`
6. Create pull request
7. Address review feedback
8. Merge when approved

---

## Support

For issues, questions, or contributions:
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@underboss.example.com

---

## License

[Specify your license here]

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

---

**Last Updated**: 2026-01-27
**Version**: 1.0.0
**Author**: Underboss Development Team
