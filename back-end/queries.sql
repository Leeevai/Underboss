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

-- name: get_user_by_id(user_id)^
SELECT * FROM "USER" WHERE id=:user_id;

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

-- ============================================
-- USER PROFILE QUERIES
-- ============================================

-- name: get_user_profile(user_id)^
SELECT * FROM USER_PROFILE WHERE user_id = :user_id::uuid;

-- name: get_user_profile_by_login(login)^
SELECT up.* FROM USER_PROFILE up
JOIN "USER" u ON up.user_id = u.id
WHERE u.username = :login OR u.email = :login;

-- name: update_user_profile(user_id, first_name, last_name, display_name, bio, avatar_url, date_of_birth, location_address, location_lat, location_lng, timezone, preferred_language)!
UPDATE USER_PROFILE SET
    first_name = COALESCE(:first_name, first_name),
    last_name = COALESCE(:last_name, last_name),
    display_name = COALESCE(:display_name, display_name),
    bio = COALESCE(:bio, bio),
    avatar_url = COALESCE(:avatar_url, avatar_url),
    date_of_birth = COALESCE(:date_of_birth, date_of_birth),
    location_address = COALESCE(:location_address, location_address),
    location_lat = COALESCE(:location_lat, location_lat),
    location_lng = COALESCE(:location_lng, location_lng),
    timezone = COALESCE(:timezone, timezone),
    preferred_language = COALESCE(:preferred_language, preferred_language),
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = :user_id::uuid;

