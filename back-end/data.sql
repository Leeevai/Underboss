--
-- import from local external file:
-- - user data are generated from "./test_users.in" for password encoding
-- - DO NOT INSERT DIRECTLY IN TABLE Auth!
--
\copy Auth(login, password, isadmin) from './test_users.csv' (format csv)

-- fix auth sequence for later inserts (see explanation below)
SELECT SETVAL('auth_aid_seq', MAX(aid)) FROM Auth;

--
-- others tables initial data
--

--
-- BEWARE if you have a serial primary key and use constants:
--   INSERT INTO Foo(fid, data) VALUES (1, 'Hello'), (2, 'World');
--
-- The following INSERT fails because the sequence reuses 1:
--   INSERT INTO Foo(data) VALUES ('Sue'); -- PK 1 already used
--
-- You must reset the sequence next value:
--   SELECT SETVAL('foo_fid_seq', MAX(fid)) FROM Foo;
