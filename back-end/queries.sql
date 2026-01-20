-- SQL queries to be fed to anodb/aiosql

-- name: now()$
SELECT CURRENT_TIMESTAMP;

-- name: version()$
SELECT VERSION();


-- Allow login with either username or email
-- name: get_user_login(login)^
SELECT u.password_hash as password, (r.name = 'admin') as is_admin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE u.username = :login OR u.email = :login;

-- CAUTION may be used in several places
-- name: get_user_login_lock(login)^
SELECT u.password_hash as password, (r.name = 'admin') as is_admin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE u.username = :login OR u.email = :login
FOR UPDATE;

-- name: get_user_all()
SELECT u.username as login, u.email, (r.name = 'admin') as is_admin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
ORDER BY 1;

-- name: get_user_filter(flt)
SELECT u.username as login, u.email, (r.name = 'admin') as is_admin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE u.username LIKE :flt OR u.email LIKE :flt
ORDER BY 1;

-- name: get_user_data(login)^
SELECT u.id::text as aid, u.username as login, u.email, (r.name = 'admin') as is_admin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE u.username = :login OR u.email = :login;

-- name: get_all_user_data(login)^
SELECT u.id::text as aid, u.username as login, u.password_hash as password, u.email, (r.name = 'admin') as is_admin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE u.username = :login OR u.email = :login;

-- Insert with username and email
-- name: insert_user(login, email, password, is_admin)$
INSERT INTO "USER"(username, email, password_hash, role_id)
VALUES (
    :login,
    :email,
    :password,
    (SELECT id FROM ROLE WHERE name = CASE WHEN :is_admin THEN 'admin' ELSE 'worker' END)
)
ON CONFLICT (username) DO NOTHING
RETURNING id::text as aid;

-- name: set_user_password(login, password)!
UPDATE "USER" SET password_hash = :password WHERE username = :login OR email = :login;

-- name: set_user_email(login, email)!
UPDATE "USER" SET email = :email WHERE username = :login OR email = :login;

-- name: set_user_is_admin(login, is_admin)!
UPDATE "USER" 
SET role_id = (SELECT id FROM ROLE WHERE name = CASE WHEN :is_admin THEN 'admin' ELSE 'worker' END)
WHERE username = :login OR email = :login;

-- name: update_user(a)!
UPDATE "USER"
  SET
    email = :a.email,
    role_id = (SELECT id FROM ROLE WHERE name = CASE WHEN :a.is_admin THEN 'admin' ELSE 'worker' END),
    password_hash = :a.password  -- WARN must be hashed!
  WHERE username = :a.login OR email = :a.login;

-- name: delete_user(login)!
DELETE FROM "USER" WHERE username = :login OR email = :login;

-- name: get_all_paps_admin()
SELECT * FROM PAPS;

-- name: get_all_paps_user()
SELECT p.*,username FROM PAPS AS p JOIN "USER" ON p.owner_id = "USER".id WHERE is_public = TRUE AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);

-- name: insert_paps(owner_id, title, subtitle, description, status, location_address, location_lat, location_lng, start_datetime, end_datetime, estimated_duration_minutes, payment_amount, payment_currency, payment_type, max_applicants, max_assignees, is_public)$
INSERT INTO PAPS (
    owner_id, 
    title, 
    subtitle, 
    description, 
    status, 
    location_address, 
    location_lat, 
    location_lng, 
    start_datetime, 
    end_datetime, 
    estimated_duration_minutes, 
    payment_amount, 
    payment_currency, 
    payment_type, 
    max_applicants, 
    max_assignees, 
    is_public
) VALUES (
    :owner_id::uuid, 
    :title, 
    :subtitle, 
    :description, 
    :status, 
    :location_address, 
    :location_lat, 
    :location_lng, 
    :start_datetime, 
    :end_datetime, 
    :estimated_duration_minutes, 
    :payment_amount, 
    :payment_currency, 
    :payment_type, 
    :max_applicants, 
    :max_assignees, 
    :is_public
)
RETURNING id::text as pid;

