# Back-End Developer Documentation

See [external documentations](https://mobapp.minesparis.psl.eu/docs/links/).

## Local Files

The following files are available in the `back-end` directory:

- Documentation:
  - [`README.md`](README.md) root documentation file.
  - [`DOC.md`](DOC.md) design documentation.
  - [`DEV.md`](DEV.md) developer documentation (this file).
- Application sources:
  - [`app.py`](app.py) a marvellous _Flask_ application which gives the time.
  - [`auth.py`](auth.py) authentication and authorization helpers.
  - [`database.py`](database.py) database bridge based on _AnoDB_, _AioSQL_ and _PsycoPg_.
  - [`queries.sql`](queries.sql) SQL queries for the aiosql wrapper.
  - [`model.py`](model.py) types for input validation.
  - [`utils.py`](utils.py) miscellaneous utility functions.
- Database:
  - [`create.sql`](create.sql) create initial application schema.
  - [`data.sql`](data.sql) insert initial test data (2 tests users).
  - [`drop.sql`](drop.sql) drop application schema.
- Configuration and dependencies:
  - [`local.conf`](local.conf) app debug configuration with a local _Postgres_.
  - [`server.conf`](server.conf) app development configuration on `mobapp.minesparis.psl.eu`.
  - [`requirements.txt`](requirements.txt) python modules to run the app.
  - [`dev-requirements.txt`](dev-requirements.txt) python modules to check the app.
- Testing:
  - [`test.py`](test.py) full-coverage _pytest_ tests with some help from _FlaskTester_.
  - [`query.py`](query.py) script to call an SQL function defined in `queries.sql`, see `make query` below.
  - [`test_users.in`](test_users.in) initial application accounts.
  - [`pass2csv.py`](pass2csv.py) generate app accounts from `test_users.in` to `test_users.csv`.
- Automation:
  - [`Makefile`](Makefile) which wondefully automates some tasks by running `make some-task`.
  - [`local.mk`](local.mk) local configuration, set `APP` for the application name.
  - [`deploy.mk`](deploy.mk) deployment rules.
  - `conn_*.sql`, `no_admin.sql` SQL scripts useful for pre-prod deployment.
- Web Site:
  - [`www`](www) docsified non-generated site.

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
