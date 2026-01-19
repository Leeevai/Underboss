#
# Project Settings
#

APP	    = underboss
PYTHON  = python3
#
# TESTS
#
# delay to wait for flask when starting
DELAY   = 2
LOOP    = 8
# tcp port for local tests
PORT    = 5000
# extract first admin and noadm accounts
ADMIN = calvin:hobbes
NOADM = hobbes:calvin
#
# DEPLOYMENT
#
USER	= $(APP)
HOST	= mobapp.minesparis.psl.eu
SERVER  = mobapp-srv.minesparis.psl.eu
APP_URL	= https://$(APP).$(HOST)
DBCONN	= host=pagode user=$(APP) dbname=$(APP)
