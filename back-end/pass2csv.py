import re
import fileinput
import bcrypt

for line in fileinput.input():
    if not re.match(r"^\s*(#.*)?$", line):  # skip comments and blank lines
        w = re.split(r",", line.strip(), 2)
        p = bcrypt.hashpw(w[1].encode("UTF8"), bcrypt.gensalt(rounds=4, prefix=b"2b"))
        print(f'"{w[0]}","{p.decode("ascii")}",{w[2] if len(w) > 2 else None}')
