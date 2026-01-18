-- SQL queries to be fed to anodb/aiosql

-- name: now()$
SELECT CURRENT_TIMESTAMP;

-- name: version()$
SELECT VERSION();

-- CAUTION used in several places
-- name: get_auth_login(login)^
SELECT u.password_hash as password, (r.name = 'admin') as isadmin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE u.email = :login;

-- CAUTION may be used in several places
-- name: get_auth_login_lock(login)^
SELECT u.password_hash as password, (r.name = 'admin') as isadmin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE u.email = :login
FOR UPDATE;

-- name: get_auth_all()
SELECT u.email as login, u.email, (r.name = 'admin') as isadmin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
ORDER BY 1;

-- name: get_auth_filter(flt)
SELECT u.email as login, u.email, (r.name = 'admin') as isadmin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE u.email LIKE :flt
ORDER BY 1;

-- name: get_auth_data(login)^
SELECT u.id::text as aid, u.email as login, u.email, (r.name = 'admin') as isadmin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE u.email = :login;

-- name: get_all_auth_data(login)^
SELECT u.id::text as aid, u.email as login, u.password_hash as password, u.email, (r.name = 'admin') as isadmin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE u.email = :login;

-- name: insert_auth(login, password, is_admin)$
INSERT INTO "USER"(email, password_hash, role_id)
VALUES (
    :login,
    :password,
    (SELECT id FROM ROLE WHERE name = CASE WHEN :is_admin THEN 'admin' ELSE 'worker' END)
)
ON CONFLICT (email) DO NOTHING
RETURNING id::text as aid;

-- name: set_user_password(login, password)!
UPDATE "USER" SET password_hash = :password WHERE email = :login;

-- name: set_user_email(login, email)!
UPDATE "USER" SET email = :email WHERE email = :login;

-- name: set_user_is_admin(login, is_admin)!
UPDATE "USER" 
SET role_id = (SELECT id FROM ROLE WHERE name = CASE WHEN :is_admin THEN 'admin' ELSE 'worker' END)
WHERE email = :login;

-- name: update_auth(a)!
UPDATE "USER"
  SET
    email = :a.email,
    role_id = (SELECT id FROM ROLE WHERE name = CASE WHEN :a.isadmin THEN 'admin' ELSE 'worker' END),
    password_hash = :a.password  -- WARN must be hashed!
  WHERE email = :a.login;

-- name: delete_user(login)!
DELETE FROM "USER" WHERE email = :login;
