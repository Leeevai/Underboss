#
# Project Root Makefile
#
# make dev: install development environment (venv, node_modules…)
# make clean.dev: cleanup development environment

# forward target to sub directories
%.fe:
	$(MAKE) -C front-end $*

%.be:
	$(MAKE) -C back-end $*

# check target only runs on back-end (front-end has no checks)
check:
	$(MAKE) check.be

# parallel forward to both subdirectories
%:
	$(MAKE) $*.fe $*.be
