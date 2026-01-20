# Project Underboss

This describes the project back end.

- See the [design documentation](DOC.md) for user stories, API routes and database design.

  > 🙏 Keep it up to date!

- See the [developer documentation](DEV.md) for file setup, tasks, deployment and so on.

- See the [routes](ROUTES.md).

- See [troubleshooting guide](TROUBLESHOOTING.md) for common issues and solutions.

## Quick Start

1. **Set up environment:**
   ```bash
   make dev
   source venv/bin/activate
   ```

2. **Start the server:**
   ```bash
   make log
   ```

3. **Run tests:**
   ```bash
   make check.pytest
   ```

## Recent Changes

- Migrated from `Auth` table to `USER`/`ROLE` schema
- Renamed all `auth_*` functions to `user_*` functions
- Added user profile management routes
- Added user experience management routes
- Added category management routes
- Added user interest management routes

See commit history for details.
