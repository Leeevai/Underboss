# Changelog

## Recent Changes

### API Modularization (2026-01-25)
- ✅ **Refactored monolithic `app.py` (1087 lines) into 8 focused API modules**
  - Created `src/api/` directory structure
  - Split routes into: system, auth, profile, experience, category, interest, paps, user
  - Reduced main `app.py` to 50 lines (95% reduction)
  - Total code: 1,122 lines across 9 files (better organized)

- ✅ **Bug Fixes During Testing**
  - Fixed `insert_user()` missing `user_id` parameter (auth.py, user.py)
  - Removed non-existent `display_order` column from category queries
  - Fixed generator serialization issues in paps endpoint
  - Added missing parameter defaults for `update_paps()` query
  
- ✅ **Comprehensive API Testing**
  - Created automated test suite covering all 28 endpoints
  - All tests passing (100% success rate)
  - Verified authentication, authorization, and CRUD operations
  - See `docs/API_TEST_RESULTS.md` for detailed results

### Schema Migration (Completed)
- ✅ Migrated from `Auth` table to `USER`/`ROLE` schema
- ✅ Updated all queries to use new schema
- ✅ Changed `aid` from `int` to `str` (UUID as text)
- ✅ Changed `isadmin` to `is_admin` throughout codebase

### Function Renaming (Completed)
- ✅ Renamed all `get_auth_*` functions to `get_user_*`
- ✅ Renamed `insert_auth` to `insert_user`
- ✅ Renamed `update_auth` to `update_user`
- ✅ Updated all references in `app.py`, `auth.py`, and `queries.sql`

### New Routes Implemented (Completed)
- ✅ User Profile Routes:
  - `GET /users/<login>/profile` - Get user profile
  - `PATCH /users/<login>/profile` - Create/update user profile

- ✅ User Experience Routes:
  - `GET /users/<login>/experiences` - List user experiences
  - `POST /users/<login>/experiences` - Create experience
  - `PATCH /users/<login>/experiences/<exp_id>` - Update experience
  - `DELETE /users/<login>/experiences/<exp_id>` - Delete experience

- ✅ Category Routes:
  - `GET /categories` - List all categories
  - `POST /categories` - Create category (admin only)
  - `GET /categories/<category_id>` - Get category
  - `PATCH /categories/<category_id>` - Update category (admin only)
  - `DELETE /categories/<category_id>` - Delete category (admin only)

- ✅ User Interest Routes:
  - `GET /users/<login>/interests` - List user interests
  - `POST /users/<login>/interests` - Add interest
  - `PATCH /users/<login>/interests/<category_id>` - Update interest
  - `DELETE /users/<login>/interests/<category_id>` - Remove interest

### Database Queries Added (33 total)
- User management: 8 queries
- User profiles: 3 queries
- User experiences: 5 queries
- Categories: 5 queries
- User interests: 5 queries
- Helper queries: 7 queries

### Tests Added (14 test functions)
- ✅ `test_user_profile` - Profile CRUD with authorization
- ✅ `test_user_experiences` - Experience CRUD operations
- ✅ `test_categories` - Category CRUD (admin only)
- ✅ `test_user_interests` - Interest CRUD with category dependency
- Plus existing tests for authentication, users, etc.

### Documentation Updated
- ✅ Updated `DOC.md` with new schema and API examples
- ✅ Updated `README.md` with quick start guide
- ✅ Created `TROUBLESHOOTING.md` with common issues and solutions
- ✅ Created `CHANGELOG.md` (this file)

### Code Quality
- ✅ All Python files compile successfully (syntax check passed)
- ✅ No linter errors
- ✅ Proper error handling and authorization checks
- ✅ Consistent code style

## Known Issues

### Environment: Anaconda/Conda Python Conflict
- **Issue**: `AttributeError: class must define a '_type_' attribute` when importing psycopg
- **Cause**: Anaconda Python's ctypes module interfering with venv
- **Status**: Documented in `TROUBLESHOOTING.md`
- **Workaround**: Deactivate conda before using venv, or use system Python
- **Impact**: Prevents server from starting in environments with anaconda active
- **Code Status**: Code is correct; this is purely an environment issue

## Next Steps (Not Yet Implemented)

The following routes from the specification are still pending:
- PAPS (job posts) routes
- SPAP (applications) routes  
- ASAP (assignments) routes
- Comments routes
- Chat system routes
- Payment routes
- Rating routes

These will be implemented in future iterations.

