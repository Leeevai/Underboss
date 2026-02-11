#
# Back-end Very Useful Development Makefile
#

SHELL	= /bin/bash
.ONESHELL:

# app parameters
include local.mk

ifndef APP
$(error missing APP macro)
endif

# allow to override python & venv
ifndef PYTHON
PYTHON	= python
endif

ifndef PYTHON_VENV
PYTHON_VENV	= venv
endif

# installation phases
PYTHON_ENV  = $(PYTHON_VENV)/.pip
PYTHON_RUN  = $(PYTHON_VENV)/.run
PYTHON_DEV  = $(PYTHON_VENV)/.dev

# checks
NETCAT      = nc

# use colortail if available
has_clt	= $(shell type colortail > /dev/null 2>&1 && echo 1)
has_stb	= $(shell type stdbuf > /dev/null 2>&1 && echo 1)

ifeq ($(has_clt)$(has_stb),11)
TAIL	= stdbuf -i0 -o0 -e0 colortail -n 100 -k .colortail.conf -q
else
TAIL	= tail -n 100
endif

# generate a banner
define banner
  @banner=echo
  type figlet >& /dev/null && banner=figlet
  $$banner $(1) | sed 's/^/#   /'
endef

.PHONY: banner
banner:
	$(call banner, $(APP))

# default target
.PHONY: default
default: clean

# special excluded python files
E.py    = version.py test.py pass2csv.py query.py $(APP).wsgi

# application files
F.py	= $(filter-out $(E.py), $(wildcard *.py))
F.sql	= $(wildcard *.sql)
F.conf	= $(wildcard *.conf)
F.in	= $(wildcard *.in)
F.md	=
F.html  =

# file derivations
F.csv	= $(F.in:%.in=%.csv)
F.gen	= version.py $(APP).wsgi

# all application source files, whether generated or not
F.src	= $(F.py) $(F.gen) $(F.csv) $(F.sql) $(F.conf) Makefile api/*.py

#
# Local Postgres Database for Testing
#

PG		= psql -X -v ON_ERROR_STOP=1 -v name=$(APP)
PGOPT	=
DB		= $(APP)
DB.sql  = drop.sql create.sql data.sql

# .postgres file is created by tee
# FIXME not reintrant
.postgres: $(DB.sql) $(F.csv)
	###
	#
	# Creating database "$(DB)"
	#
	$(NETCAT) -z localhost $(PORT) >& /dev/null && {
	  echo "# Error server already running on $(PORT): do 'make clean'" | tee -a app.log >&2
	  exit 1
	}
	shopt -s -o pipefail errexit
	createdb $(DB) || {
	  echo "# Error on database $(DB): do 'make clean'" | tee -a app.log >&2
	  exit 1
	}
	$(PG) $(PGOPT) $(addprefix -f , $(DB.sql)) $(DB) | tee -a app.log $@

# build the database
.PHONY: $(APP).db
$(APP).db: .postgres

.PHONY: db
db: $(APP).db

# execute an aiosql query with the test database
Q   = db.now()

.PHONY: query
query: $(PYTHON_RUN) .postgres
	###
	#
	# Querying $(DB) database…
	#
	source $(PYTHON_VENV)/bin/activate
	export APP_NAME=$(APP) APP_SECRET=$(APP.secret) APP_CONFIG=local.conf
	$(PYTHON) ./query.py '$(subst ',\',$(Q))'  # '

#
# Cleanup
#

.PHONY: clean
clean: full-stop
	###
	#
	# Cleaning
	#
	[ -f app.log ] && echo -e "# REMOVING app.log! RESTART \"make log\"…" >> app.log
	$(RM) app.log app.pid $(F.gen) $(F.csv) .coverage *~
	$(RM) -r __pycache__ .pytype .pytest_cache .postgres htmlcov .ruff_cache
	dropdb $(DB) || exit 0

.PHONY: clean.dev
clean.dev: clean
	###
	#
	# Cleaning Python venv
	#
	$(RM) -r $(PYTHON_VENV) .mypy_cache

#
# Check that all seems okay
#
COMMANDS	= psql git $(PYTHON) pip flask pytest pyright ruff flake8

.PHONY: check.env
check.env: $(PYTHON_DEV) $(PYTHON_RUN)
	###
	#
	# Checking command availability
	#
	source $(PYTHON_VENV)/bin/activate
	for cmd in $(COMMANDS) ; do
	  type $$cmd || { echo "missing: $$cmd" >&2 ; exit 1 ; }
	done
	echo "# env seems OK"

#
# Python Virtual Env
#
# Pipenv, Hatch, Poetry, PDM, UV… are not really needed
#
.PHONY: $(PYTHON_VENV)
$(PYTHON_VENV): $(PYTHON_DEV)

$(PYTHON_ENV):
	###
	#
	# Creating Python venv
	#
	$(PYTHON) -m venv $(PYTHON_VENV)
	source $(PYTHON_VENV)/bin/activate
	pip install -U pip
	touch $@

$(PYTHON_RUN): $(PYTHON_ENV) requirements.txt
	###
	#
	# Installing Python requirements
	#
	source $(PYTHON_VENV)/bin/activate
	pip install -r requirements.txt
	touch $@

$(PYTHON_DEV): $(PYTHON_ENV) dev-requirements.txt
	###
	#
	# Installing Python requirements for development
	#
	source $(PYTHON_VENV)/bin/activate
	pip install -r dev-requirements.txt
	touch $@

.PHONY: venv.up
venv.up: $(PYTHON_ENV)
	###
	#
	# Updating Python venv
	#
	source $(PYTHON_VENV)/bin/activate
	pip install -U $$(pip freeze | cut -d= -f1)

.PHONY: dev
dev: $(PYTHON_RUN) $(PYTHON_DEV)

#
# Generated Files
#

# version information accessible under /info
version.py: $(F.py) $(F.sql) Makefile
	###
	#
	# Generating file "$@"
	#
	remote=$$(git config --get remote.origin.url)
	branch=$$(git rev-parse --abbrev-ref HEAD)
	rev=$$(git log -1|head -1|cut -d' ' -f2)
	date=$$(git log -1 --format="%cI")
	len=$$(git log | grep '^commit ' | wc -l)
	if [ "$$(git status | grep 'nothing to commit')" ] ; then
	  changed=""
	else
	  changed="M"
	fi
	{
	  echo "remote = \"$$remote\""
	  echo "branch = \"$$branch\""
	  echo "commit = \"$$len$$changed ($$rev)\""
	  echo "date = \"$$date\""
	} > $@

# force rebuilding version.py
.PHONY: version
version:
	$(RM) version.py && $(MAKE) version.py

# application WSGI launcher with environment

#
# the application secret is derived from its sources
# this is mostly okay for development and pre-prod
#
HASH        = shasum -a 256
F.secret    = $(F.py) $(F.sql) $(F.in) Makefile api/*.py
APP.secret  = $(shell cat $(F.secret) | $(HASH) | cut -d' ' -f1)

.PHONY: secret
secret:
	###
	#
	# Showing generated deployment secret
	#
	@echo "app: $(APP)"
	echo "files: $(F.secret)"
	echo "secret: $(APP.secret)"

$(APP).wsgi: $(F.secret)
	###
	#
	# Generating deployment file "$@"
	#
	{
	  echo "# GENERATED FILE, DO NOT EDIT!"
	  echo "import os"
	  echo "os.environ[\"APP_NAME\"] = \"$(APP)\""
	  echo "os.environ[\"APP_CONFIG\"] = \"/home/$(APP)/conf/server.conf\""
	  echo "os.environ[\"APP_SECRET\"] = \"$(APP.secret)\""
	  echo "from app import app as application"
	} > $@

.PHONY: wsgi
wsgi: version
	$(RM) $(APP).wsgi && $(MAKE) $(APP).wsgi

# user accounts with hashed passwords
.PRECIOUS: $(F.csv)
$(F.csv): $(PYTHON_RUN)
%.csv: %.in
	###
	#
	# Generating user accounts for "$(APP)"
	#
	source $(PYTHON_VENV)/bin/activate
	$(PYTHON) ./pass2csv.py < $< > $@

#
# Flask process management
#

# defaults for local tests
FLASK		= flask
FLASK.opt	= --host="0.0.0.0" --port="$(PORT)" --extra-files local.conf:queries.sql

# start app: as it is launched in background, we do not know if it failed
.PRECIOUS: app.pid
app.pid: $(PYTHON_RUN) .postgres
	###
	#
	# Starting local Flask server
	#
	# NOTE stop on any error
	shopt -s -o pipefail errexit
	# hidden dependency to avoid restarting vs reloading
	$(MAKE) banner
	$(MAKE) version.py
	source $(PYTHON_VENV)/bin/activate
	export APP_NAME=$(APP) APP_CONFIG="local.conf" APP_SECRET=$(APP.secret)
	export PPP_WERKZEUG_WORKAROUND="1"  # grrr…
	type $(FLASK) || exit 1  # check for flask command
	# check for port availability
	$(NETCAT) -z localhost $(PORT) >& /dev/null && {
	  echo "# port $(PORT) already in use: do 'make clean'" | tee -a app.log >&2
	  exit 2
	}
	echo "# starting application…" >> app.log
	$(call banner, "$(APP)  log  file") >> app.log
	$(FLASK) --debug --app=app.py run $(FLASK.opt) >> app.log 2>&1 &
	pid=$$!
	echo $$pid > $@
	echo "# $(APP) pid: $$pid" | tee -a app.log
	echo "# waiting up to $$(( $(DELAY) + $(LOOP) )) seconds for server" | tee -a app.log
	sleep $(DELAY)
	# loop till the port is binded ...
	let loop=$(LOOP)
	while ! $(NETCAT) -z localhost $(PORT) >& /dev/null ; do
	  let loop--
	  if [ $$loop -eq 0 ] ; then
	    echo "# port $(PORT) is not coming up after $(LOOP)" >> app.log
	    $(TAIL) app.log
	    exit 3
	  fi
	  sleep 1
	done
	# ... and is actually responding
	while [[ $$(curl -si $(LOC_URL)/uptime | head -1) != "HTTP/1.1 200"* ]] ; do
	  let loop--
	  if [ $$loop -eq 0 ] ; then
	    echo "# server $(LOC_URL) is not responding after $(LOOP)" >> app.log
	    $(TAIL) app.log
	    exit 3
	  fi
	  sleep 1
	done
	echo "# server $(LOC_URL) running after $$(( $(DELAY) + $(LOOP) - $$loop))" | tee -a app.log

.PHONY: run
run: app.pid

.PHONY: running
running: run
	###
	#
	# Checking that flask server is running
	#
	# TCP port $(PORT)
	$(NETCAT) -z localhost $(PORT) >& /dev/null
	port_ko=$$?
	if [ $$port_ko -ne 0 ] ; then
	  echo "# port $(PORT) is NOT responding…" >> app.log
	  $(TAIL) app.log
	  exit $$port_ko
	fi
	# HTTP response on /info
	curl_status="$(shell curl -si -X GET -u $(ADMIN) -s $(LOC_URL)/info | head -1)"
	if [[ "$$curl_status" == "HTTP/1.1 200 OK" ]] ; then
	  echo "# /info is ok: app running in background…" | tee -a app.log >&2
	else
	  echo "# /info is KO: app NOT running properly: ($$curl_status)" >> app.log
	  $(TAIL) app.log
	  exit 1
	fi

# show available routes
.PHONY: routes
routes: $(PYTHON_RUN) version .postgres
	###
	#
	# Showing application routes
	#
	source $(PYTHON_VENV)/bin/activate
	export APP_NAME=$(APP) APP_CONFIG="local.conf" APP_SECRET=$(APP.secret)
	$(FLASK) --debug --app=app.py routes -s match

.PHONY: log
log: running
	###
	#
	# Show logs of currently running flask server
	#
	$(TAIL) -f app.log

# soft stop…
.PHONY: term-stop
term-stop:
	###
	#
	# Stopping currently running flask server, if any
	#
	[ -f app.pid ] && {
	  [ -f app.log ] && echo "# TERMINATING FLASK SERVER…" >> app.log
	  kill -SIGTERM $$(cat app.pid)
	  [ -f app.log ] && echo "# FLASK SERVER TERMINATED!" >> app.log
	}
	$(RM) app.pid

ifeq ($(shell uname), Linux)
PKILL	= pkill
else  # MacOS ?
PKILL	= pkill -f
endif

# hard stop…
.PHONY: full-stop
full-stop: stop
	###
	#
	# Killing currently running flask server, if any
	#
	[ -f app.log ] && echo "# KILLING ALL FLASK SERVERS (just in case)…" >> app.log
	$(PKILL) $(FLASK) || exit 0

.PHONY: stop
stop: term-stop

#
# Local tests
#

LOC_URL = http://localhost:$(PORT)
PYTEST  = pytest --log-level=debug --capture=tee-sys -v
PYTOPT  =

# extract user:pass,... for flask-tester
APP_AUTH	= $(shell grep '^[a-zA-Z]' test_users.in | cut -d',' -f1,2 | tr ',\012' ':,' | sed -e 's/,$$//')

.PHONY: app_auth
app_auth:
	@echo "APP_AUTH=$(APP_AUTH)"

.PHONY: check.info
check.info:
	curl -si -X GET -u $(ADMIN) $(LOC_URL)/info

.PHONY: check.stats
check.stats:
	curl -si -X GET -u $(ADMIN) $(LOC_URL)/stats

.PHONY: check.local.info
check.local.info: check.info

# FIXME should it be internal?
.PHONY: check.pytest
check.pytest: check.pytest.external

.PHONY: check.pytest.external
check.pytest.external: $(PYTHON_DEV) $(PYTHON_RUN) $(F.src)
	###
	#
	# Checking EXTERNAL tests
	#
	shopt -s -o errexit
	source $(PYTHON_VENV)/bin/activate
	# start test server
	$(MAKE) running
	# external tests: URL to retrieve the server + admin/noadmin auth
	export FLASK_TESTER_USER="login" FLASK_TESTER_PASS="password" FLASK_TESTER_AUTH="$(APP_AUTH)"
	export FLASK_TESTER_APP="$(LOC_URL)"
	$(PYTEST) $(PYTOPT) test.py
	# stop test server
	$(MAKE) stop

.PHONY: check.pytest.internal
check.pytest.internal: $(PYTHON_DEV) $(PYTHON_RUN) $(F.src) .postgres
	###
	#
	# Checking INTERNAL tests
	#
	source $(PYTHON_VENV)/bin/activate
	# internal tests: CONFIG but **no** URL
	export APP_NAME=$(APP) APP_CONFIG="local.conf" APP_SECRET=$(APP.secret)
	export FLASK_TESTER_USER="login" FLASK_TESTER_PASS="password" FLASK_TESTER_AUTH="$(APP_AUTH)"
	export FLASK_TESTER_APP="app"
	$(PYTEST) $(PYTOPT) test.py

.PHONY: check.local.pytest
check.local.pytest: check.pytest

.PHONY: check.coverage
check.coverage: $(PYTHON_DEV)
	###
	#
	# Checking code coverage
	#
	source $(PYTHON_VENV)/bin/activate
	$(MAKE) PYTEST="coverage run -m $(PYTEST)" check.pytest.internal
	coverage report --precision=1 --show-missing --fail-under=100 $(F.py) version.py

.PHONY: check.pyright
check.pyright: $(PYTHON_DEV) $(F.py) $(F.gen)
	###
	#
	# Checking types with pyright
	#
	source $(PYTHON_VENV)/bin/activate
	pyright $(F.py) $(F.gen) test.py

.PHONY: check.mypy
check.mypy: $(PYTHON_DEV) $(F.py) $(F.gen)
	###
	#
	# Checking types with mypy
	#
	# report syntax and type errors
	source $(PYTHON_VENV)/bin/activate
	mypy --ignore-missing-imports --implicit-optional $(F.py) $(F.gen) test.py

.PHONY: check.pytype
check.pytype: $(PYTHON_DEV) $(F.py) $(F.gen)
	###
	#
	# Checking types with pytype
	#
	# report syntax and type errors
	source $(PYTHON_VENV)/bin/activate
	pytype $(F.py) $(F.gen) test.py

# NOTE just for tests
# I'm not a fan of black agressive reformating, especially what is
# done to long expressions and function calls.
.PHONY: check.black
check.black: $(PYTHON_DEV) $(F.py)
	###
	#
	# Checking style with black
	#
	source $(PYTHON_VENV)/bin/activate
	black --check --diff --verbose -l 100 $(F.py) test.py

# flake8/ruff rules to ignore
IGNORE  = E227,E302,E305,F401,E402,E501,F811

.PHONY: check.ruff
check.ruff: $(PYTHON_DEV) $(F.py)
	###
	#
	# Checking style with ruff
	#
	source $(PYTHON_VENV)/bin/activate
	ruff check --ignore=$(IGNORE) $(F.py) test.py

.PHONY: check.flake8
check.flake8: $(PYTHON_DEV) $(F.py) $(F.gen)
	###
	#
	# Checking style with flake8
	#
	source $(PYTHON_VENV)/bin/activate
	flake8 --ignore=E126,E127,$(IGNORE),W503,W504 $(F.py) $(F.gen) test.py

.PHONY: check
check: clean
	###
	#
	# Checking everything
	#
	shopt -s -o errexit
	$(MAKE) check.env
	$(MAKE) check.pyright
	$(MAKE) check.ruff
	$(MAKE) check.flake8
	$(MAKE) check.pytest    # external
	$(MAKE) clean
	$(MAKE) check.coverage  # internal
	$(MAKE) clean

#
# DEPLOY
#
-include deploy.mk

#
# MEDIA
#
-include media.mk

.PHONY: www
www:
	# see at http://localhost:3000/
	cd www && python -m http.server 3000

#
# STATS
#
.PHONY: counts
counts:
	###
	#
	# Showing $(APP) code statistics
	#
	# queries: $(shell egrep "^\\s*--\\s*name\\s*:" $(F.sql) | wc -l)
	# tables: $(shell egrep -i "^\\s*create\\s+table" $(F.sql) | wc -l)
	# routes: $(shell egrep -i "^\\s*@app\.(route|get|post|patch|put|delete)" $(F.py) | wc -l)
	cloc --by-file-by-lang $(F.py) test.py $(F.sql)

.PHONY: commits
commits:
	git log | grep "^Author" | cut -d: -f2 | sort | uniq -c | sort -nr
