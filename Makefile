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

# parallel forward to both subdirectories
%:
	$(MAKE) $*.fe $*.be
