--
-- Authentication Data
--
-- *MUST* be consistent with "data.sql" import and "test_users.in"
CREATE TABLE IF NOT EXISTS Auth(
  aid SERIAL8 PRIMARY KEY,
  login TEXT UNIQUE NOT NULL
    CHECK (LENGTH(login) >= 3 AND login ~ E'^[a-zA-Z][-a-zA-Z0-9_@\\.]*$'),
  email TEXT DEFAULT NULL CHECK (email IS NULL OR email ~ E'@'),
  password TEXT NOT NULL,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  isadmin BOOLEAN NOT NULL DEFAULT FALSE
);
