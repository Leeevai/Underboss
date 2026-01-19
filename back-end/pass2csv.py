import re
import fileinput
import bcrypt

for line in fileinput.input():
    if not re.match(r"^\s*(#.*)?$", line):  # skip comments and blank lines
        # Expected input format: username,email,password,is_admin
        parts = re.split(r",", line.strip())
        
        if len(parts) >= 3:
            username = parts[0]
            email = parts[1]
            password = parts[2]
            is_admin = parts[3] if len(parts) > 3 else "FALSE"
            
            # Hash the password
            password_hash = bcrypt.hashpw(password.encode("UTF8"), bcrypt.gensalt(rounds=4, prefix=b"2b"))
            
            # Output format: username,email,password_hash,is_admin
            print(f'{username},{email},{password_hash.decode("ascii")},{is_admin}')