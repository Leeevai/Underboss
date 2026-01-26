#
# models for data validation
#
# - direct: type inheritance + raise
# - see also: pydandic

import pydantic
import FlaskSimpleAuth as fsa
import re

class Login(str):
    """A login is just a string with constraints.

    This class checks that submitted new logins are compliant.
    """

    def __init__(self, login: str):
        str.__init__(login)
        if len(login) < 3:
            raise ValueError(f"login must be at least 3 chars: {login}")
        if not re.match(r"^[a-zA-Z][-a-zA-Z0-9_@\.]*$", login):
            raise ValueError(f"login can only contain simple characters: {login}")

@pydantic.dataclasses.dataclass
class Auth:
    login: str
    password: str
    email: str|None
    is_admin: bool

@pydantic.dataclasses.dataclass
class CurrentAuth(Auth):
    aid: str  # UUID as text in new schema
