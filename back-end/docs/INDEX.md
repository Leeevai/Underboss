# Documentation Index

Complete documentation for the Underboss backend API.

## 📖 Core Documentation

### [README.md](README.md)
**Main entry point** - Project overview, quick start guide, architecture summary, and recent updates.

**Start here if you're new to the project.**

### [DEV.md](DEV.md)
**Developer Guide** - Complete development workflow, project structure, make targets, environment setup, and deployment.

**Use this for:**
- Setting up your development environment
- Understanding the project structure
- Learning about build automation
- Deployment procedures

### [routes.md](routes.md)
**API Reference** - Comprehensive documentation of all 28 API endpoints with request/response examples.

**Use this for:**
- API endpoint documentation
- Request/response formats
- Authentication methods
- Query parameters and validation rules

## 🔧 Operational Documentation

### [TEST_DATA_SETUP.md](TEST_DATA_SETUP.md)
**Test Data Guide** - How to set up test users with static UUIDs for development and testing.

**Use this for:**
- Creating test users
- Understanding test data structure
- Customizing test scenarios

### [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
**Troubleshooting Guide** - Common issues and their solutions.

**Use this for:**
- Environment setup problems
- Database connection issues
- Testing failures
- Common code issues

## 📊 Reference Documentation

### [API_TEST_RESULTS.md](API_TEST_RESULTS.md)
**Test Coverage Report** - Latest comprehensive API test results showing all 28 endpoints tested and passing.

**Use this for:**
- Understanding test coverage
- Verifying API functionality
- Reviewing bug fixes

### [CHANGELOG.md](CHANGELOG.md)
**Change Log** - History of recent changes, migrations, and updates to the codebase.

**Use this for:**
- Understanding recent changes
- Migration notes
- Feature additions

## 🚀 Quick Links by Task

### I want to...

**Get started developing**
1. [README.md](README.md#quick-start) - Quick start guide
2. [DEV.md](DEV.md#environment) - Environment setup
3. [TEST_DATA_SETUP.md](TEST_DATA_SETUP.md#quick-start) - Create test users

**Understand the API**
1. [routes.md](routes.md) - Complete API documentation
2. [README.md](README.md#architecture) - Architecture overview
3. [API_TEST_RESULTS.md](API_TEST_RESULTS.md) - Test coverage

**Fix a problem**
1. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
2. [DEV.md](DEV.md#useful-make-targets) - Development tools
3. [README.md](README.md#development) - Development workflow

**See what's new**
1. [CHANGELOG.md](CHANGELOG.md) - Recent changes
2. [API_TEST_RESULTS.md](API_TEST_RESULTS.md) - Latest test results
3. [README.md](README.md#recent-updates) - Quick summary

## 📁 Documentation Organization

```
docs/
├── INDEX.md               # This file - documentation index
├── README.md              # Main entry point and overview
├── DEV.md                 # Developer guide and workflow
├── routes.md              # Complete API reference
├── TEST_DATA_SETUP.md     # Test data guide
├── TROUBLESHOOTING.md     # Common issues and solutions
├── API_TEST_RESULTS.md    # Latest test coverage report
└── CHANGELOG.md           # Change history
```

## 🏗️ Project Structure

The backend is organized into focused modules:

- **src/api/** - Modular API route handlers (8 modules)
- **src/** - Core application code (app.py, auth.py, database.py, etc.)
- **sql/** - Database schema and queries
- **tests/** - Pytest test suite
- **config/** - Configuration files
- **scripts/** - Utility scripts
- **media/** - User-uploaded files

See [DEV.md](DEV.md#project-structure) for detailed structure.

## 📈 Current Status

- ✅ **28/28 API endpoints** tested and working
- ✅ **Modular architecture** implemented (8 focused modules)
- ✅ **Comprehensive tests** with 100% pass rate
- ✅ **Complete documentation** covering all aspects

Last updated: 2026-01-25
