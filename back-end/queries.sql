-- SQL queries to be fed to anodb/aiosql

-- name: now()$
SELECT CURRENT_TIMESTAMP;

-- name: version()$
SELECT VERSION();

-- ============================================
-- USER AUTHENTICATION & MANAGEMENT
-- ============================================

-- Allow login with username, email, or phone
-- name: get_user_login(login)^
SELECT u.password_hash as password, (r.name = 'admin') as is_admin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE u.username = :login OR u.email = :login OR u.phone = :login;

-- CAUTION may be used in several places
-- name: get_user_login_lock(login)^
SELECT u.password_hash as password, (r.name = 'admin') as is_admin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE u.username = :login OR u.email = :login OR u.phone = :login
FOR UPDATE;

-- name: get_user_all()
SELECT u.id::text as aid, u.username, u.email, u.phone, (r.name = 'admin') as is_admin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE u.is_active = TRUE
ORDER BY u.username;

-- name: get_user_filter(flt)
SELECT u.id::text as aid, u.username, u.email, u.phone, (r.name = 'admin') as is_admin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE (u.username LIKE :flt OR u.email LIKE :flt OR u.phone LIKE :flt)
  AND u.is_active = TRUE
ORDER BY u.username;

-- name: get_user_data(login)^
SELECT u.id::text as aid, u.username as login, u.email, u.phone, (r.name = 'admin') as is_admin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE u.username = :login OR u.email = :login OR u.phone = :login;

-- name: get_user_data_by_id(user_id)^
SELECT u.id::text as aid, u.username as login, u.email, u.phone, (r.name = 'admin') as is_admin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE u.id = :user_id::uuid;

-- name: get_all_user_data(login)^
SELECT u.id::text as aid, u.username as login, u.password_hash as password, 
       u.email, u.phone, (r.name = 'admin') as is_admin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE u.username = :login OR u.email = :login OR u.phone = :login;

-- name: get_user_by_id(user_id)^
SELECT id::text, username, email, phone FROM "USER" WHERE id=:user_id::uuid;

-- Insert with username, email, and optional phone
-- name: insert_user(username, email, phone, password, is_admin)$
INSERT INTO "USER"(username, email, phone, password_hash, role_id)
VALUES (
    :username,
    :email,
    :phone,
    :password,
    (SELECT id FROM ROLE WHERE name = CASE WHEN :is_admin THEN 'admin' ELSE 'worker' END)
)
ON CONFLICT (username) DO NOTHING
ON CONFLICT (email) DO NOTHING
ON CONFLICT (phone) DO NOTHING
RETURNING id::text as aid;

-- name: set_user_password(user_id, password)!
UPDATE "USER" SET password_hash = :password WHERE id = :user_id::uuid;

-- name: set_user_email(user_id, email)!
UPDATE "USER" SET email = :email WHERE id = :user_id::uuid;

-- name: set_user_phone(user_id, phone)!
UPDATE "USER" SET phone = :phone WHERE id = :user_id::uuid;

-- name: set_user_is_admin(user_id, is_admin)!
UPDATE "USER" 
SET role_id = (SELECT id FROM ROLE WHERE name = CASE WHEN :is_admin THEN 'admin' ELSE 'worker' END)
WHERE id = :user_id::uuid;

-- name: delete_user(user_id)!
DELETE FROM "USER" WHERE id = :user_id::uuid;

-- ============================================
-- USER PROFILE QUERIES
-- ============================================

-- name: get_user_profile(user_id)^
SELECT 
    up.*,
    u.username,
    u.email,
    COALESCE(up.avatar_url, '/media/user/profile/avatar.png') as avatar_url
FROM USER_PROFILE up
JOIN "USER" u ON up.user_id = u.id
WHERE up.user_id = :user_id::uuid;

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

-- ============================================
-- USER EXPERIENCE QUERIES
-- ============================================

-- name: get_user_experiences(user_id)
SELECT 
    id::text,
    user_id::text,
    title,
    company,
    description,
    start_date,
    end_date,
    is_current,
    display_order,
    created_at
FROM USER_EXPERIENCE
WHERE user_id = :user_id::uuid
ORDER BY display_order, start_date DESC;

-- name: get_user_experience_by_id(exp_id)^
SELECT * FROM USER_EXPERIENCE WHERE id = :exp_id::uuid;

-- name: insert_user_experience(user_id, title, company, description, start_date, end_date, is_current)$
INSERT INTO USER_EXPERIENCE (user_id, title, company, description, start_date, end_date, is_current)
VALUES (:user_id::uuid, :title, :company, :description, :start_date, :end_date, :is_current)
RETURNING id::text;

-- name: update_user_experience(exp_id, title, company, description, start_date, end_date, is_current)!
UPDATE USER_EXPERIENCE SET
    title = COALESCE(:title, title),
    company = COALESCE(:company, company),
    description = COALESCE(:description, description),
    start_date = COALESCE(:start_date, start_date),
    end_date = COALESCE(:end_date, end_date),
    is_current = COALESCE(:is_current, is_current)
WHERE id = :exp_id::uuid;

-- name: delete_user_experience(exp_id)!
DELETE FROM USER_EXPERIENCE WHERE id = :exp_id::uuid;

-- ============================================
-- CATEGORY QUERIES
-- ============================================

-- name: get_all_categories()
SELECT 
    id::text,
    name,
    slug,
    description,
    parent_id::text,
    icon_url,
    display_order,
    is_active,
    created_at
FROM CATEGORY
WHERE is_active = TRUE
ORDER BY display_order, name;

-- name: get_category_by_id(category_id)^
SELECT * FROM CATEGORY WHERE id = :category_id::uuid;

-- name: insert_category(name, slug, description, parent_id, icon_url)$
INSERT INTO CATEGORY (name, slug, description, parent_id, icon_url)
VALUES (:name, :slug, :description, :parent_id::uuid, :icon_url)
RETURNING id::text;

-- name: update_category(category_id, name, slug, description, parent_id, icon_url, is_active)!
UPDATE CATEGORY SET
    name = COALESCE(:name, name),
    slug = COALESCE(:slug, slug),
    description = COALESCE(:description, description),
    parent_id = COALESCE(:parent_id::uuid, parent_id),
    icon_url = COALESCE(:icon_url, icon_url),
    is_active = COALESCE(:is_active, is_active)
WHERE id = :category_id::uuid;

-- name: delete_category(category_id)!
DELETE FROM CATEGORY WHERE id = :category_id::uuid;

-- ============================================
-- USER INTEREST QUERIES
-- ============================================

-- name: get_user_interests(user_id)
SELECT 
    ui.user_id::text,
    ui.category_id::text,
    ui.proficiency_level,
    ui.added_at,
    c.name as category_name,
    c.slug as category_slug,
    c.icon_url as category_icon
FROM USER_INTEREST ui
JOIN CATEGORY c ON ui.category_id = c.id
WHERE ui.user_id = :user_id::uuid
ORDER BY ui.proficiency_level DESC, c.name;

-- name: insert_user_interest(user_id, category_id, proficiency_level)!
INSERT INTO USER_INTEREST (user_id, category_id, proficiency_level)
VALUES (:user_id::uuid, :category_id::uuid, :proficiency_level)
ON CONFLICT (user_id, category_id) 
DO UPDATE SET proficiency_level = :proficiency_level;

-- name: update_user_interest(user_id, category_id, proficiency_level)!
UPDATE USER_INTEREST 
SET proficiency_level = :proficiency_level
WHERE user_id = :user_id::uuid AND category_id = :category_id::uuid;

-- name: delete_user_interest(user_id, category_id)!
DELETE FROM USER_INTEREST 
WHERE user_id = :user_id::uuid AND category_id = :category_id::uuid;

-- ============================================
-- PAPS QUERIES
-- ============================================

-- Get all paps for admin (see everything)
-- name: get_all_paps_admin(status, category_id, lat, lng, max_distance)
SELECT DISTINCT
    p.id::text,
    p.owner_id::text,
    p.title,
    p.subtitle,
    p.description,
    p.status,
    p.location_address,
    p.location_lat,
    p.location_lng,
    p.location_timezone,
    p.start_datetime,
    p.end_datetime,
    p.estimated_duration_minutes,
    p.payment_amount,
    p.payment_currency,
    p.payment_type,
    p.max_applicants,
    p.max_assignees,
    p.is_public,
    p.publish_at,
    p.expires_at,
    p.created_at,
    p.updated_at,
    u.username as owner_username,
    u.email as owner_email,
    up.display_name as owner_name,
    up.avatar_url as owner_avatar,
    CASE 
        WHEN :lat IS NOT NULL AND :lng IS NOT NULL AND p.location_lat IS NOT NULL AND p.location_lng IS NOT NULL
        THEN calculate_distance(:lat, :lng, p.location_lat, p.location_lng)
        ELSE NULL
    END as distance_km
FROM PAPS p
JOIN "USER" u ON p.owner_id = u.id
LEFT JOIN USER_PROFILE up ON u.id = up.user_id
LEFT JOIN PAPS_CATEGORY pc ON p.id = pc.paps_id
WHERE p.deleted_at IS NULL
  AND (:status IS NULL OR p.status = :status)
  AND (:category_id IS NULL OR pc.category_id = :category_id::uuid)
  AND (
    :max_distance IS NULL 
    OR :lat IS NULL 
    OR :lng IS NULL 
    OR p.location_lat IS NULL 
    OR p.location_lng IS NULL
    OR calculate_distance(:lat, :lng, p.location_lat, p.location_lng) <= :max_distance
  )
ORDER BY p.created_at DESC;

-- Get paps for authenticated user (their own + published public)
-- name: get_paps_for_user(user_id, status, category_id, lat, lng, max_distance)
SELECT DISTINCT
    p.id::text,
    p.owner_id::text,
    p.title,
    p.subtitle,
    p.description,
    p.status,
    p.location_address,
    p.location_lat,
    p.location_lng,
    p.location_timezone,
    p.start_datetime,
    p.end_datetime,
    p.estimated_duration_minutes,
    p.payment_amount,
    p.payment_currency,
    p.payment_type,
    p.max_applicants,
    p.max_assignees,
    p.is_public,
    p.publish_at,
    p.expires_at,
    p.created_at,
    p.updated_at,
    u.username as owner_username,
    u.email as owner_email,
    up.display_name as owner_name,
    up.avatar_url as owner_avatar,
    CASE 
        WHEN :lat IS NOT NULL AND :lng IS NOT NULL AND p.location_lat IS NOT NULL AND p.location_lng IS NOT NULL
        THEN calculate_distance(:lat, :lng, p.location_lat, p.location_lng)
        ELSE NULL
    END as distance_km
FROM PAPS p
JOIN "USER" u ON p.owner_id = u.id
LEFT JOIN USER_PROFILE up ON u.id = up.user_id
LEFT JOIN PAPS_CATEGORY pc ON p.id = pc.paps_id
WHERE p.deleted_at IS NULL
  AND (
    p.owner_id = :user_id::uuid
    OR (p.status = 'published' AND p.is_public = TRUE AND (p.expires_at IS NULL OR p.expires_at > CURRENT_TIMESTAMP))
  )
  AND (:status IS NULL OR p.status = :status)
  AND (:category_id IS NULL OR pc.category_id = :category_id::uuid)
  AND (
    :max_distance IS NULL 
    OR :lat IS NULL 
    OR :lng IS NULL 
    OR p.location_lat IS NULL 
    OR p.location_lng IS NULL
    OR calculate_distance(:lat, :lng, p.location_lat, p.location_lng) <= :max_distance
  )
ORDER BY p.created_at DESC;

-- Get public paps only (for non-authenticated users)
-- name: get_all_paps_public(status, category_id, lat, lng, max_distance)
SELECT DISTINCT
    p.id::text,
    p.owner_id::text,
    p.title,
    p.subtitle,
    p.description,
    p.status,
    p.location_address,
    p.location_lat,
    p.location_lng,
    p.location_timezone,
    p.start_datetime,
    p.end_datetime,
    p.estimated_duration_minutes,
    p.payment_amount,
    p.payment_currency,
    p.payment_type,
    p.max_applicants,
    p.max_assignees,
    p.is_public,
    p.publish_at,
    p.expires_at,
    p.created_at,
    p.updated_at,
    u.username as owner_username,
    u.email as owner_email,
    up.display_name as owner_name,
    up.avatar_url as owner_avatar,
    CASE 
        WHEN :lat IS NOT NULL AND :lng IS NOT NULL AND p.location_lat IS NOT NULL AND p.location_lng IS NOT NULL
        THEN calculate_distance(:lat, :lng, p.location_lat, p.location_lng)
        ELSE NULL
    END as distance_km
FROM PAPS p
JOIN "USER" u ON p.owner_id = u.id
LEFT JOIN USER_PROFILE up ON u.id = up.user_id
LEFT JOIN PAPS_CATEGORY pc ON p.id = pc.paps_id
WHERE p.status = 'published'
  AND p.is_public = TRUE
  AND p.deleted_at IS NULL
  AND (p.expires_at IS NULL OR p.expires_at > CURRENT_TIMESTAMP)
  AND (:status IS NULL OR p.status = :status)
  AND (:category_id IS NULL OR pc.category_id = :category_id::uuid)
  AND (
    :max_distance IS NULL 
    OR :lat IS NULL 
    OR :lng IS NULL 
    OR p.location_lat IS NULL 
    OR p.location_lng IS NULL
    OR calculate_distance(:lat, :lng, p.location_lat, p.location_lng) <= :max_distance
  )
ORDER BY p.created_at DESC;

-- name: insert_paps(owner_id, title, subtitle, description, status, location_address, location_lat, location_lng, location_timezone, start_datetime, end_datetime, estimated_duration_minutes, payment_amount, payment_currency, payment_type, max_applicants, max_assignees, is_public)$
INSERT INTO PAPS (
    owner_id, title, subtitle, description, status,
    location_address, location_lat, location_lng, location_timezone,
    start_datetime, end_datetime, estimated_duration_minutes,
    payment_amount, payment_currency, payment_type,
    max_applicants, max_assignees, is_public
) VALUES (
    :owner_id::uuid, :title, :subtitle, :description, :status,
    :location_address, :location_lat, :location_lng, :location_timezone,
    :start_datetime, :end_datetime, :estimated_duration_minutes,
    :payment_amount, :payment_currency, :payment_type,
    :max_applicants, :max_assignees, :is_public
)
RETURNING id::text;

-- Get single paps by ID for public (published & public only)
-- name: get_paps_by_id_public(id)^
SELECT 
    p.*,
    u.username as owner_username,
    u.email as owner_email,
    up.display_name as owner_name,
    up.avatar_url as owner_avatar
FROM PAPS p
JOIN "USER" u ON p.owner_id = u.id
LEFT JOIN USER_PROFILE up ON u.id = up.user_id
WHERE p.id = :id::uuid
  AND p.status = 'published'
  AND p.is_public = TRUE
  AND p.deleted_at IS NULL
  AND (p.expires_at IS NULL OR p.expires_at > CURRENT_TIMESTAMP);

-- Get single paps by ID for authenticated user (their own + published public)
-- name: get_paps_by_id_for_user(id, user_id)^
SELECT 
    p.*,
    u.username as owner_username,
    u.email as owner_email,
    up.display_name as owner_name,
    up.avatar_url as owner_avatar
FROM PAPS p
JOIN "USER" u ON p.owner_id = u.id
LEFT JOIN USER_PROFILE up ON u.id = up.user_id
WHERE p.id = :id::uuid
  AND p.deleted_at IS NULL
  AND (
    p.owner_id = :user_id::uuid
    OR (p.status = 'published' AND p.is_public = TRUE AND (p.expires_at IS NULL OR p.expires_at > CURRENT_TIMESTAMP))
  );

-- Get single paps by ID for admin (see everything)
-- name: get_paps_by_id_admin(id)^
SELECT 
    p.*,
    u.username as owner_username,
    u.email as owner_email,
    up.display_name as owner_name,
    up.avatar_url as owner_avatar
FROM PAPS p
JOIN "USER" u ON p.owner_id = u.id
LEFT JOIN USER_PROFILE up ON u.id = up.user_id
WHERE p.id = :id::uuid AND p.deleted_at IS NULL;

-- name: update_paps(id, title, subtitle, description, status, location_address, location_lat, location_lng, location_timezone, start_datetime, end_datetime, estimated_duration_minutes, payment_amount, payment_currency, payment_type, max_applicants, max_assignees, is_public, publish_at, expires_at)!
UPDATE PAPS SET
    title = COALESCE(:title, title),
    subtitle = COALESCE(:subtitle, subtitle),
    description = COALESCE(:description, description),
    status = COALESCE(:status, status),
    location_address = COALESCE(:location_address, location_address),
    location_lat = COALESCE(:location_lat, location_lat),
    location_lng = COALESCE(:location_lng, location_lng),
    location_timezone = COALESCE(:location_timezone, location_timezone),
    start_datetime = COALESCE(:start_datetime, start_datetime),
    end_datetime = COALESCE(:end_datetime, end_datetime),
    estimated_duration_minutes = COALESCE(:estimated_duration_minutes, estimated_duration_minutes),
    payment_amount = COALESCE(:payment_amount, payment_amount),
    payment_currency = COALESCE(:payment_currency, payment_currency),
    payment_type = COALESCE(:payment_type, payment_type),
    max_applicants = COALESCE(:max_applicants, max_applicants),
    max_assignees = COALESCE(:max_assignees, max_assignees),
    is_public = COALESCE(:is_public, is_public),
    publish_at = COALESCE(:publish_at, publish_at),
    expires_at = COALESCE(:expires_at, expires_at),
    updated_at = CURRENT_TIMESTAMP
WHERE id = :id::uuid;

-- name: delete_paps(id)!
UPDATE PAPS SET deleted_at = CURRENT_TIMESTAMP WHERE id = :id::uuid;

-- ============================================
-- PAPS MEDIA QUERIES
-- ============================================

-- name: get_paps_media_urls(paps_id)
SELECT media_url, display_order, media_type
FROM PAPS_MEDIA
WHERE paps_id = :paps_id::uuid
ORDER BY display_order;

-- name: insert_paps_media(paps_id, media_type, media_url, file_size_bytes, mime_type, display_order)$
INSERT INTO PAPS_MEDIA (paps_id, media_type, media_url, file_size_bytes, mime_type, display_order)
VALUES (:paps_id::uuid, :media_type, :media_url, :file_size_bytes, :mime_type, :display_order)
RETURNING id::text;

-- ============================================
-- PAPS CATEGORY QUERIES
-- ============================================

-- name: get_paps_categories(paps_id)
SELECT 
    c.id::text as category_id,
    c.name as category_name,
    c.slug as category_slug,
    pc.is_primary
FROM PAPS_CATEGORY pc
JOIN CATEGORY c ON pc.category_id = c.id
WHERE pc.paps_id = :paps_id::uuid
ORDER BY pc.is_primary DESC, c.name;

-- ============================================
-- PAPS STATISTICS QUERIES
-- ============================================

-- name: get_paps_comments_count(paps_id)$
SELECT COUNT(*) FROM COMMENT 
WHERE paps_id = :paps_id::uuid AND deleted_at IS NULL;

-- name: get_paps_applications_count(paps_id)$
SELECT COUNT(*) FROM SPAP WHERE paps_id = :paps_id::uuid;