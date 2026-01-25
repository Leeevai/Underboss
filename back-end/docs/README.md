# Underboss Backend

A modular Flask REST API for the Underboss job marketplace platform.

## 📚 Documentation

- **[Developer Guide](DEV.md)** - Setup, development workflow, and deployment
- **[API Routes](routes.md)** - Complete API endpoint documentation
- **[Test Data Setup](TEST_DATA_SETUP.md)** - How to set up test users and data
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions
- **[Changelog](CHANGELOG.md)** - Recent changes and updates
- **[API Test Results](API_TEST_RESULTS.md)** - Latest test coverage report

## 🚀 Quick Start

### 1. Set up environment
```bash
make dev                    # Create venv and install dependencies
source venv/bin/activate   # Activate virtual environment
```

### 2. Create database and test data
```bash
make underboss.db          # Create database and schema
make setup-test-data       # Create test users
```

### 3. Start the server
```bash
make log                   # Start Flask development server
```

The server will be available at `http://localhost:5000`

### 4. Run tests
```bash
make check.pytest          # Run pytest suite
make check                 # Run all checks (pytest, pyright, ruff, flake8)
```

## 🏗️ Architecture

### Modular API Structure

The application is organized into focused modules:

```
src/
├── api/                   # API route modules
│   ├── __init__.py       # Route registration
│   ├── system.py         # System endpoints (/uptime, /info, /stats)
│   ├── auth.py           # Authentication (/register, /login)
│   ├── profile.py        # User profiles
│   ├── experience.py     # Work experiences
│   ├── category.py       # Categories
│   ├── interest.py       # User interests
│   ├── paps.py           # Job postings (PAPS)
│   └── user.py           # User management (admin)
├── app.py                # Main application (50 lines)
├── auth.py               # Auth helpers
├── database.py           # Database bridge (AnoDB + AioSQL + Psycopg)
├── model.py              # Type definitions
├── utils.py              # Utility functions
└── version.py            # Auto-generated version info
```

### Database

- **PostgreSQL** database with full-text search and UUID support
- **Schema**: See `sql/create.sql` for tables and relationships
- **Queries**: SQL queries in `sql/queries.sql` (loaded via AioSQL)

### Authentication

- Bearer token authentication (format: `underboss:username:timestamp:hash`)
- HTTP Basic Auth support
- Role-based authorization (USER, ADMIN)

## 📊 API Coverage

**28/28 endpoints tested and working** (100% pass rate)

- System Routes: 5/5 ✅
- Auth Routes: 2/2 ✅
- Profile Routes: 3/3 ✅
- Experience Routes: 3/3 ✅
- Category Routes: 3/3 ✅
- Interest Routes: 4/4 ✅
- PAPS Routes: 5/5 ✅
- User Admin Routes: 3/3 ✅

See [API Test Results](API_TEST_RESULTS.md) for details.

## 🔧 Development

### Makefile Targets

```bash
make dev            # Setup development environment
make log            # Start development server
make clean          # Stop server and clean up
make check          # Run all checks (tests + linting)
make check.pytest   # Run pytest tests
make check.pyright  # Type checking
make check.ruff     # Code formatting check
make check.flake8   # Linting
```

### Project Status

- ✅ Modular API architecture implemented
- ✅ Comprehensive test coverage (28 endpoints)
- ✅ User management and authentication
- ✅ Profile, experience, and interest management
- ✅ Category system
- ✅ Job posting system (PAPS)
- ✅ Media file uploads (avatars, job images/videos)

## 📝 Recent Updates

**2026-01-25**: API Modularization
- Refactored monolithic `app.py` (1087 lines) into 8 focused modules
- Main app reduced to 50 lines (95% reduction)
- All 28 API endpoints tested and working
- Fixed SQL query bugs and parameter issues

See [Changelog](CHANGELOG.md) for full history.
