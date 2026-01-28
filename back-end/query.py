#! /usr/bin/env python
#
# execute anodb queries from the command line…
#
# APP_NAME=… APP_CONFIG=local.mk APP_SECRET=… $0 "db.stats()"
#

import os
import sys
import anodb
import inspect

# load configuration file (hmmm… at least it works…)
exec(open(os.environ["APP_CONFIG"]).read())

# create database proxy instance, see database.py
db = anodb.DB(**DATABASE)

# run test commands
for code in sys.argv[1:]:
    print(f"# code: {code}")
    try:
        res = eval(code)
        if inspect.isgenerator(res):
           res = list(res)
        print(f"res ({type(res).__name__}): {res}")
    except Exception as e:
        print(f"failed: {e}")
