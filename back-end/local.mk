#
# Project Settings
#

APP	    = underboss

#
# TESTS
#
# delay to wait for flask when starting
DELAY   = 2
LOOP    = 8
# tcp port for local tests
PORT    = 5000
# extract first admin and noadm accounts
ADMIN   = $(shell grep -v '^#' test_users.in | grep ',TRUE' | head -1 | tr ',' ':' | cut -d: -f1,2)
NOADM   = $(shell grep -v '^#' test_users.in | grep ',FALSE' | head -1 | tr ',' ':' | cut -d: -f1,2)

#
# DEPLOYMENT
#
USER	= $(APP)
HOST	= mobapp.minesparis.psl.eu
SERVER  = mobapp-srv.minesparis.psl.eu
APP_URL	= https://$(APP).$(HOST)
DBCONN	= host=pagode user=$(APP) dbname=$(APP)
