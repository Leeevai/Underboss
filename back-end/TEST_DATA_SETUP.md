# Test Data Setup

This document explains how to set up test data for the Underboss backend.

## Overview

Test data is now managed through a Python script (`setup_test_data.py`) rather than being hardcoded in SQL files. This makes test data more maintainable and flexible.

## Quick Start

After creating the database with `make underboss.db`, run:

```bash
make setup-test-data
```

This will create the following test users:

| Username  | Password     | Role  | Email                 |
|-----------|--------------|-------|-----------------------|
| hassan    | Password123  | USER  | hassan@example.com    |
| clement   | Password123  | USER  | clement@example.com   |
| osman     | Password123  | USER  | osman@example.com     |
| enrique   | Password123  | USER  | enrique@example.com   |
| calvin    | Hobbes123    | ADMIN | calvin@example.com    |
| hobbes    | Calvin123    | USER  | hobbes@example.com    |

## Manual Setup

You can also run the setup script directly:

```bash
source venv/bin/activate
export APP_NAME=underboss APP_CONFIG=local.conf APP_SECRET=<your_secret>
python setup_test_data.py
```

## Customizing Test Data

Edit `setup_test_data.py` to modify:
- User profiles (names, bios, etc.)
- User interests and proficiency levels  
- User experiences (work history)
- Categories

The script uses the same database queries as the main application, ensuring consistency.

## Database Files

- **create.sql**: Database schema (tables, triggers, views)
- **data_minimal.sql**: Minimal initial data (roles and categories only)
- **data.sql**: Legacy file with full test data (deprecated, kept for reference)

## Notes

- Categories are created in `data_minimal.sql` and loaded automatically
- User profiles, interests, and experiences can be added to the setup script as needed
- The setup script is idempotent - rerunning it will skip existing users
- For testing, you can delete test users: `psql underboss -c "DELETE FROM \"USER\" WHERE username IN ('hassan', 'clement', ...)"`
