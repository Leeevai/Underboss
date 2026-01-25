# Backend Developer Documentation

## 📚 Documentation

- **[README](README.md)** - Project overview and quick start
- **[API Routes](routes.md)** - Complete API endpoint documentation  
- **[Test Data Setup](TEST_DATA_SETUP.md)** - How to set up test users and data
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions
- **[Changelog](CHANGELOG.md)** - Recent changes and updates

See also [external documentations](https://mobapp.minesparis.psl.eu/docs/links/).

## 📁 Project Structure

### Application Source (src/)

```
src/
├── api/                   # Modular API route handlers
│   ├── __init__.py       # Route registration
│   ├── system.py         # System endpoints (/uptime, /info, /stats)
│   ├── auth.py           # Authentication (/register, /login)
│   ├── profile.py        # User profile management
│   ├── experience.py     # Work experience CRUD
│   ├── category.py       # Category management
│   ├── interest.py       # User interest management
│   ├── paps.py           # Job postings (PAPS) with media
│   └── user.py           # User management (admin)
├── app.py                # Main Flask application (50 lines)
├── auth.py               # Authentication/authorization helpers
├── database.py           # Database bridge (AnoDB + AioSQL + Psycopg)
├── model.py              # Type definitions for validation
├── utils.py              # Utility functions
└── version.py            # Auto-generated version info
```

### Database (sql/)

- **create.sql** - Database schema (tables, indexes, constraints)
- **data_minimal.sql** - Minimal initial data (roles, categories)
- **queries.sql** - Named SQL queries loaded via AioSQL
- **drop.sql** - Drop all schema objects

### Scripts

- **scripts/setup_test_data.py** - Creates test users with static UUIDs

### Configuration

- **config/local.conf** - Local development configuration
- **config/server.conf** - Production server configuration
- **requirements.txt** - Production dependencies
- **dev-requirements.txt** - Development dependencies

### Testing

- **test.py** - Pytest test suite
- **query.py** - Test individual SQL queries
- **test_users.in** - Test user definitions

### Automation

- **Makefile** - Build automation
- **local.mk** - Local configuration
- **deploy.mk** - Deployment rules

### Media Storage

```
media/
├── user/profile/         # User avatar images
├── post/                 # Job posting images/videos
└── category/             # Category icons
```

## Environment

Set `PYTHON` to change python version, default is `python`.

Set `PYTHON_VENV` to change python venv location, default is `venv`.

## Useful Make Targets

The [`Makefile`](Makefile) automates some common tasks.
Check that you understand how they work.

- generate developer environment and activate it in the current terminal:

  ```sh
  make dev
  source venv/bin/activate
  ```

  > 💡 the environment can be deactivated by typing `deactivate` in the terminal.

- cleanup generated files, stop everything:

  ```sh
  make clean       # standard cleanup
  make clean.dev   # also remove developer environment
  ```

- start app in verbose dev mode on local port 5000, and check that it works from another terminal:

  ```sh
  # first terminal, ctrl-c to stop showing logs, show again with "make log"
  make log

  # second terminal
  curl -i -X GET http://localhost:5000/info
  # see first terminal for traces of the request!
  ```

  > 💡 In development, it is useful to have a separate terminal which shows
  > continuously the contents of the log file and think to look at it especially
  > when things go wrong…

- stop running app:

  ```sh
  make stop       # soft version
  make full-stop  # hard version when things go wrong…
  ```

- run tests: all, type checking (`mypy`, `pyright`), style checking (`flake8`,
  `black`, `ruff`) or with a run check against a postgres database (`pytest`)…

  ```sh
  make check           # run all available tests, from:
  make check.mypy      # syntax and type checking
  make check.pyright   # another syntax and type checking
  make check.black     # style checking
  make check.flake8    # style checking
  make check.ruff      # style checking
  make check.pytest    # pytest run against Postgres
  make check.coverage  # coverage based on pytest run
  ```

- see web site locally on port _3000_:

  ```sh
  make www
  ```

- send application to remote server and check its status:

  ```sh
  make deploy
  make check.server.info
  make check.server.info.jq  # nicer
  make check.server.stats
  make check.server.stats.jq  # nicer
  ```

- test an `anodb/aiosql` query:

  ```sh
  make Q='db.version()' query
  make Q='db.get_auth_data(login="calvin")' query
  ```

- run some SQL scripts on the **deployed** server:

  ```sh
  make conn_list.exe  # show database connections
  ```

## Change project name

- update `APP` (`local.mk`)
- update docsify configuration (`www/index.html`)
- remove logo file
- update home page (`README.md`)
