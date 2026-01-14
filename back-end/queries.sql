-- SQL queries to be fed to anodb/aiosql

-- name: now()$
SELECT CURRENT_TIMESTAMP;

-- name: version()$
SELECT VERSION();

-- CAUTION used in several places
-- name: get_auth_login(login)^
SELECT password, isadmin
FROM Auth
WHERE login = :login;

-- CAUTION may be used in several places
-- name: get_auth_login_lock(login)^
SELECT password, isadmin
FROM Auth
WHERE login = :login
FOR UPDATE;

-- name: get_auth_all()
SELECT login, email, isadmin
FROM Auth
ORDER BY 1;

-- name: get_auth_filter(flt)
SELECT login, email, isadmin
FROM Auth
WHERE login LIKE :flt
ORDER BY 1;

-- name: get_auth_data(login)^
SELECT aid, login, email, isadmin
FROM Auth
WHERE login = :login;

-- name: get_all_auth_data(login)^
SELECT aid, login, password, email, isadmin
FROM Auth
WHERE login = :login;

-- name: insert_auth(login, password, is_admin)$
INSERT INTO Auth(login, password, isadmin)
VALUES (:login, :password, :is_admin)
ON CONFLICT DO NOTHING
RETURNING aid;

-- name: set_user_password(login, password)!
UPDATE Auth SET password = :password WHERE login = :login;

-- name: set_user_email(login, email)!
UPDATE Auth SET email = :email WHERE login = :login;

-- name: set_user_is_admin(login, is_admin)!
UPDATE Auth SET isadmin = :is_admin WHERE login = :login;

-- name: update_auth(a)!
UPDATE Auth
  SET
    email = :a.email,
    isadmin = :a.isadmin,
    password = :a.password  -- WARN must be hashed!
  WHERE login = :a.login;

-- name: delete_user(login)!
DELETE FROM Auth WHERE login = :login;
