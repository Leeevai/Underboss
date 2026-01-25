#
# Deployment Makefile (for development only!)
#
# - you do NOT want to execute "drop.sql" in production!
# - schema management and usage should be distinct
#

.PHONY: perms
perms: wsgi $(F.gen) $(F.csv)
	chmod a+r $(F.conf) $(F.sql) $(F.py) $(F.gen) $(F.csv) $(F.html) $(F.md)
	for dir in www assets ; do
	  if [ -d $$dir ] ; then
	    find $$dir -type d -print0 | xargs -0 chmod a+rx
	    find $$dir -type f -print0 | xargs -0 chmod a+r
	  fi
	done

RSYNC	= rsync -rLpgodv

.PHONY: deploy
deploy: perms
	shopt -s -o errexit
	# send files
	$(RSYNC) $(F.conf) $(USER)@$(SERVER):conf/
	$(RSYNC) $(F.py) $(F.sql) $(F.gen) $(F.csv) $(USER)@$(SERVER):api/
	$(RSYNC) www/. $(USER)@$(SERVER):www/.
	# [ -d assets ] && $(RSYNC) assets/. $(USER)@$(SERVER):assets/.
	[ -d static ] && $(RSYNC) static/. $(USER)@$(SERVER):static/.
	# coldly kill connections and drop/create/fill tables
	ssh $(USER)@$(SERVER) \
	  psql \
	    -1 \
	    -v name=$(APP) \
	    -v ON_ERROR_STOP=on \
	    -c "\"SET STATEMENT_TIMEOUT TO '10s'\"" \
	    -c "\"\\cd api\"" \
	    -f conn_kill_all.sql \
	    -f drop.sql \
	    -f create.sql \
	    -f data.sql \
	    -d \"$(DBCONN)\"
	# reload and check application
	ssh $(USER)@$(SERVER) \
	  touch api/$(APP).wsgi
	sleep 3
	$(MAKE) check.server.info

# execute some script
%.exe: %.sql
	shopt -s -o errexit
	ssh $(USER)@$(SERVER) \
	  psql \
	    -1 \
	    -v name=$(APP) \
	    -v ON_ERROR_STOP=on \
	    -f app/$*.sql \
	    -d \"$(DBCONN)\"

%.html: %.md
	pandoc -s -o $@ $<

# check deployed server
APP_API	= $(APP_URL)/api
SLEEP   = 0.0

.PHONY: check.server.info
check.server.info:
	curl -s -i -u $(ADMIN) -d sleep=$(SLEEP) -X GET $(APP_API)/info || exit 1

.PHONY: check.server.info.jq
check.server.info.jq:
	@curl -s -u $(ADMIN) -d sleep=$(SLEEP) -X GET $(APP_API)/info | jq

.PHONY: check.server.index
check.server.index:
	curl -s $(APP_URL)/index.md || exit 1

.PHONY: check.server.stats
check.server.stats:
	curl -s -i -u $(ADMIN) $(APP_API)/stats || exit 1

.PHONY: check.server.stats.jq
check.server.stats.jq:
	@curl -s -u $(ADMIN) $(APP_API)/stats | jq

.PHONY: check.server.pytest
check.server.pytest: $(PYTHON_VENV)
	source $(PYTHON_VENV)/bin/activate
	export FLASK_TESTER_USER="login" FLASK_TESTER_PASS="password" FLASK_TESTER_AUTH="$(ADMIN),$(NOADM)"
	export FLASK_TESTER_APP="$(APP_API)"
	$(PYTEST) $(PYTOPT) -v test.py
