-- SQL queries to be fed to anodb/aiosql

-- name: now()$
SELECT CURRENT_TIMESTAMP;

-- name: version()$
SELECT VERSION();

-- ============================================
-- USER AUTHENTICATION & MANAGEMENT
-- ============================================

-- name: get_role_id(name)^
SELECT id FROM ROLE WHERE name = :name;

-- Allow login with username, email, or phone
-- name: get_user_login(login)^
SELECT u.username as login, u.password_hash as password, (r.name = 'admin') as is_admin
FROM "USER" u
JOIN ROLE r ON u.role_id = r.id
WHERE u.username = :login OR u.email = :login OR u.phone = :login;

-- CAUTION may be used in several places
-- name: get_user_login_lock(login)^
SELECT u.username as login, u.password_hash as password, (r.name = 'admin') as is_admin
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

-- name: get_user_by_username(username)^
SELECT id::text, username, email, phone FROM "USER" WHERE username=:username;

-- Insert with username, email, and optional phone
-- name: insert_user(username, email, phone, password, is_admin, user_id)$
INSERT INTO "USER"(id, username, email, phone, password_hash, role_id)
VALUES (
    COALESCE(:user_id::uuid, gen_random_uuid()),
    :username,
    :email,
    :phone,
    :password,
    (SELECT id FROM ROLE WHERE name = CASE WHEN :is_admin THEN 'admin' ELSE 'user' END)
)
ON CONFLICT DO NOTHING
RETURNING id::text as aid;

-- name: set_user_password(user_id, password)!
UPDATE "USER" SET password_hash = :password WHERE id = :user_id::uuid;

-- name: set_user_email(user_id, email)!
UPDATE "USER" SET email = :email WHERE id = :user_id::uuid;

-- name: set_user_phone(user_id, phone)!
UPDATE "USER" SET phone = :phone WHERE id = :user_id::uuid;

-- name: set_user_is_admin(user_id, is_admin)!
UPDATE "USER" 
SET role_id = (SELECT id FROM ROLE WHERE name = CASE WHEN :is_admin THEN 'admin' ELSE 'user' END)
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
    is_active,
    created_at
FROM CATEGORY
WHERE is_active = TRUE
ORDER BY name;

-- name: get_category_by_id(category_id)^
SELECT * FROM CATEGORY WHERE id = :category_id::uuid;

-- name: get_category_by_slug(slug)^
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
WHERE slug = :slug AND is_active = TRUE;

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
-- FIXED: Added casts for ALL optional parameters
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
        WHEN :lat::numeric IS NOT NULL AND :lng::numeric IS NOT NULL AND p.location_lat IS NOT NULL AND p.location_lng IS NOT NULL
        THEN calculate_distance(:lat::numeric, :lng::numeric, p.location_lat, p.location_lng)
        ELSE NULL
    END as distance_km
FROM PAPS p
JOIN "USER" u ON p.owner_id = u.id
LEFT JOIN USER_PROFILE up ON u.id = up.user_id
LEFT JOIN PAPS_CATEGORY pc ON p.id = pc.paps_id
WHERE p.deleted_at IS NULL
  AND (:status::text IS NULL OR p.status = :status::text)
  AND (:category_id::uuid IS NULL OR pc.category_id = :category_id::uuid)
  AND (
    :max_distance::numeric IS NULL 
    OR :lat::numeric IS NULL 
    OR :lng::numeric IS NULL 
    OR p.location_lat IS NULL 
    OR p.location_lng IS NULL
    OR calculate_distance(:lat::numeric, :lng::numeric, p.location_lat, p.location_lng) <= :max_distance::numeric
  )
ORDER BY p.created_at DESC;

-- Get paps for authenticated user (their own + published public)
-- FIXED: Added casts for ALL optional parameters
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
        WHEN :lat::numeric IS NOT NULL AND :lng::numeric IS NOT NULL AND p.location_lat IS NOT NULL AND p.location_lng IS NOT NULL
        THEN calculate_distance(:lat::numeric, :lng::numeric, p.location_lat, p.location_lng)
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
  AND (:status::text IS NULL OR p.status = :status::text)
  AND (:category_id::uuid IS NULL OR pc.category_id = :category_id::uuid)
  AND (
    :max_distance::numeric IS NULL 
    OR :lat::numeric IS NULL 
    OR :lng::numeric IS NULL 
    OR p.location_lat IS NULL 
    OR p.location_lng IS NULL
    OR calculate_distance(:lat::numeric, :lng::numeric, p.location_lat, p.location_lng) <= :max_distance::numeric
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
        WHEN :lat::numeric IS NOT NULL AND :lng::numeric IS NOT NULL AND p.location_lat IS NOT NULL AND p.location_lng IS NOT NULL
        THEN calculate_distance(:lat::numeric, :lng::numeric, p.location_lat, p.location_lng)
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
  AND (:status::text IS NULL OR p.status = :status::text)
  AND (:category_id::uuid IS NULL OR pc.category_id = :category_id::uuid)
  AND (
    :max_distance::numeric IS NULL 
    OR :lat::numeric IS NULL 
    OR :lng::numeric IS NULL 
    OR p.location_lat IS NULL 
    OR p.location_lng IS NULL
    OR calculate_distance(:lat::numeric, :lng::numeric, p.location_lat, p.location_lng) <= :max_distance::numeric
  )
ORDER BY p.created_at DESC;

-- name: insert_paps(owner_id, title, subtitle, description, status, location_address, location_lat, location_lng, location_timezone, start_datetime, end_datetime, estimated_duration_minutes, payment_amount, payment_currency, payment_type, max_applicants, max_assignees, is_public, publish_at, expires_at)$
INSERT INTO PAPS (
    owner_id, title, subtitle, description, status,
    location_address, location_lat, location_lng, location_timezone,
    start_datetime, end_datetime, estimated_duration_minutes,
    payment_amount, payment_currency, payment_type,
    max_applicants, max_assignees, is_public, publish_at, expires_at
) VALUES (
    :owner_id::uuid, :title, :subtitle, :description, :status,
    :location_address, :location_lat, :location_lng, :location_timezone,
    :start_datetime, :end_datetime, :estimated_duration_minutes,
    :payment_amount, :payment_currency, :payment_type,
    :max_applicants, :max_assignees, :is_public, :publish_at, :expires_at
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

-- Get all media for a paps (returns media_id and extension for URL construction)
-- name: get_paps_media(paps_id)
SELECT 
    id::text as media_id,
    media_type,
    file_extension,
    file_size_bytes,
    mime_type,
    display_order
FROM PAPS_MEDIA
WHERE paps_id = :paps_id::uuid
ORDER BY display_order;

-- Get single media by ID
-- name: get_paps_media_by_id(media_id)^
SELECT 
    pm.id::text as media_id,
    pm.paps_id::text,
    pm.media_type,
    pm.file_extension,
    pm.file_size_bytes,
    pm.mime_type,
    pm.display_order
FROM PAPS_MEDIA pm
WHERE pm.id = :media_id::uuid;

-- Insert paps media (returns the generated media_id)
-- name: insert_paps_media(paps_id, media_type, file_extension, file_size_bytes, mime_type, display_order)$
INSERT INTO PAPS_MEDIA (paps_id, media_type, file_extension, file_size_bytes, mime_type, display_order)
VALUES (:paps_id::uuid, :media_type, :file_extension, :file_size_bytes, :mime_type, :display_order)
RETURNING id::text;

-- Delete paps media
-- name: delete_paps_media(media_id)!
DELETE FROM PAPS_MEDIA WHERE id = :media_id::uuid;

-- Get next display order for paps media
-- name: get_next_paps_media_order(paps_id)$
SELECT COALESCE(MAX(display_order), 0) + 1 FROM PAPS_MEDIA WHERE paps_id = :paps_id::uuid;

-- ============================================
-- INTEREST-BASED PAPS MATCHING QUERY
-- For non-admin users: Returns paps ranked by matching user interests
-- ============================================

-- Get paps matched by user interests (for non-admin users)
-- Returns paps where user has interests in the paps categories, ranked by proficiency sum
-- name: get_paps_by_interest_match(user_id, status, category_id, lat, lng, max_distance, min_price, max_price, payment_type, owner_username, title_search, limit_count)
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
        WHEN :lat::numeric IS NOT NULL AND :lng::numeric IS NOT NULL AND p.location_lat IS NOT NULL AND p.location_lng IS NOT NULL
        THEN calculate_distance(:lat::numeric, :lng::numeric, p.location_lat, p.location_lng)
        ELSE NULL
    END as distance_km,
    COALESCE(interest_match.match_score, 0) as interest_match_score
FROM PAPS p
JOIN "USER" u ON p.owner_id = u.id
LEFT JOIN USER_PROFILE up ON u.id = up.user_id
LEFT JOIN PAPS_CATEGORY pc ON p.id = pc.paps_id
LEFT JOIN (
    -- Calculate match score: sum of user's proficiency levels for matching categories
    SELECT pc2.paps_id, SUM(ui.proficiency_level) as match_score
    FROM PAPS_CATEGORY pc2
    JOIN USER_INTEREST ui ON pc2.category_id = ui.category_id
    WHERE ui.user_id = :user_id::uuid
    GROUP BY pc2.paps_id
) interest_match ON p.id = interest_match.paps_id
WHERE p.deleted_at IS NULL
  AND (
    p.owner_id = :user_id::uuid
    OR (p.status = 'published' AND p.is_public = TRUE AND (p.expires_at IS NULL OR p.expires_at > CURRENT_TIMESTAMP))
  )
  AND (:status::text IS NULL OR p.status = :status::text)
  AND (:category_id::uuid IS NULL OR pc.category_id = :category_id::uuid)
  AND (:min_price::numeric IS NULL OR p.payment_amount >= :min_price::numeric)
  AND (:max_price::numeric IS NULL OR p.payment_amount <= :max_price::numeric)
  AND (:payment_type::text IS NULL OR p.payment_type = :payment_type::text)
  AND (:owner_username::text IS NULL OR u.username ILIKE '%%' || :owner_username::text || '%%')
  AND (:title_search::text IS NULL OR p.title ILIKE '%%' || :title_search::text || '%%' OR p.description ILIKE '%%' || :title_search::text || '%%')
  AND (
    :max_distance::numeric IS NULL 
    OR :lat::numeric IS NULL 
    OR :lng::numeric IS NULL 
    OR p.location_lat IS NULL 
    OR p.location_lng IS NULL
    OR calculate_distance(:lat::numeric, :lng::numeric, p.location_lat, p.location_lng) <= :max_distance::numeric
  )
ORDER BY interest_match_score DESC NULLS LAST, p.created_at DESC
LIMIT :limit_count::integer;

-- Get all paps for admin with enhanced filters
-- name: get_paps_admin_search(status, category_id, lat, lng, max_distance, min_price, max_price, payment_type, owner_username, title_search)
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
        WHEN :lat::numeric IS NOT NULL AND :lng::numeric IS NOT NULL AND p.location_lat IS NOT NULL AND p.location_lng IS NOT NULL
        THEN calculate_distance(:lat::numeric, :lng::numeric, p.location_lat, p.location_lng)
        ELSE NULL
    END as distance_km
FROM PAPS p
JOIN "USER" u ON p.owner_id = u.id
LEFT JOIN USER_PROFILE up ON u.id = up.user_id
LEFT JOIN PAPS_CATEGORY pc ON p.id = pc.paps_id
WHERE p.deleted_at IS NULL
  AND (:status::text IS NULL OR p.status = :status::text)
  AND (:category_id::uuid IS NULL OR pc.category_id = :category_id::uuid)
  AND (:min_price::numeric IS NULL OR p.payment_amount >= :min_price::numeric)
  AND (:max_price::numeric IS NULL OR p.payment_amount <= :max_price::numeric)
  AND (:payment_type::text IS NULL OR p.payment_type = :payment_type::text)
  AND (:owner_username::text IS NULL OR u.username ILIKE '%%' || :owner_username::text || '%%')
  AND (:title_search::text IS NULL OR p.title ILIKE '%%' || :title_search::text || '%%' OR p.description ILIKE '%%' || :title_search::text || '%%')
  AND (
    :max_distance::numeric IS NULL 
    OR :lat::numeric IS NULL 
    OR :lng::numeric IS NULL 
    OR p.location_lat IS NULL 
    OR p.location_lng IS NULL
    OR calculate_distance(:lat::numeric, :lng::numeric, p.location_lat, p.location_lng) <= :max_distance::numeric
  )
ORDER BY p.created_at DESC;

-- Insert paps category
-- name: insert_paps_category(paps_id, category_id, is_primary)!
INSERT INTO PAPS_CATEGORY (paps_id, category_id, is_primary)
VALUES (:paps_id::uuid, :category_id::uuid, :is_primary)
ON CONFLICT (paps_id, category_id) DO UPDATE SET is_primary = :is_primary;

-- Delete paps category
-- name: delete_paps_category(paps_id, category_id)!
DELETE FROM PAPS_CATEGORY
WHERE paps_id = :paps_id::uuid AND category_id = :category_id::uuid;

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

-- ============================================
-- SPAP (JOB APPLICATIONS) QUERIES
-- ============================================

-- name: get_spap_by_id(spap_id)^
SELECT s.*, u.username as applicant_username
FROM SPAP s
JOIN "USER" u ON s.applicant_id = u.id
WHERE s.id = :spap_id::uuid;

-- name: get_spaps_for_paps(paps_id)
SELECT s.*, u.username as applicant_username
FROM SPAP s
JOIN "USER" u ON s.applicant_id = u.id
WHERE s.paps_id = :paps_id::uuid
ORDER BY s.applied_at DESC;

-- name: get_spaps_by_applicant(applicant_id)
SELECT s.*, p.title as paps_title
FROM SPAP s
JOIN PAPS p ON s.paps_id = p.id
WHERE s.applicant_id = :applicant_id::uuid
ORDER BY s.applied_at DESC;

-- name: get_spap_by_paps_and_applicant(paps_id, applicant_id)^
SELECT * FROM SPAP
WHERE paps_id = :paps_id::uuid AND applicant_id = :applicant_id::uuid;

-- name: insert_spap(paps_id, applicant_id, title, subtitle, message, proposed_payment_amount, location_address, location_lat, location_lng, location_timezone)$
INSERT INTO SPAP (paps_id, applicant_id, title, subtitle, message, proposed_payment_amount, 
                  location_address, location_lat, location_lng, location_timezone)
VALUES (:paps_id::uuid, :applicant_id::uuid, :title, :subtitle, :message, :proposed_payment_amount,
        :location_address, :location_lat, :location_lng, :location_timezone)
RETURNING id;

-- name: update_spap_status(spap_id, status, reviewed_at, accepted_at, rejected_at)!
UPDATE SPAP SET
    status = COALESCE(:status, status),
    reviewed_at = COALESCE(:reviewed_at, reviewed_at),
    accepted_at = COALESCE(:accepted_at, accepted_at),
    rejected_at = COALESCE(:rejected_at, rejected_at)
WHERE id = :spap_id::uuid;

-- name: delete_spap(spap_id)!
DELETE FROM SPAP WHERE id = :spap_id::uuid;

-- name: delete_spaps_for_paps(paps_id)!
DELETE FROM SPAP WHERE paps_id = :paps_id::uuid;

-- ============================================
-- COMMENT QUERIES (Instagram-style: flat with single-level replies)
-- ============================================

-- Get all top-level comments for a paps (parent_id IS NULL)
-- name: get_paps_comments(paps_id)
SELECT 
    c.id::text as comment_id,
    c.paps_id::text,
    c.user_id::text,
    c.parent_id::text,
    c.content,
    c.is_edited,
    c.created_at,
    c.updated_at,
    c.deleted_at,
    u.username as author_username,
    up.display_name as author_display_name,
    up.avatar_url as author_avatar,
    (SELECT COUNT(*) FROM COMMENT r WHERE r.parent_id = c.id AND r.deleted_at IS NULL) as reply_count
FROM COMMENT c
JOIN "USER" u ON c.user_id = u.id
LEFT JOIN USER_PROFILE up ON u.id = up.user_id
WHERE c.paps_id = :paps_id::uuid
  AND c.parent_id IS NULL
  AND c.deleted_at IS NULL
ORDER BY c.created_at DESC;

-- Get a specific comment by ID
-- name: get_comment_by_id(comment_id)^
SELECT 
    c.id::text as comment_id,
    c.paps_id::text,
    c.user_id::text,
    c.parent_id::text,
    c.content,
    c.is_edited,
    c.created_at,
    c.updated_at,
    c.deleted_at,
    u.username as author_username,
    up.display_name as author_display_name,
    up.avatar_url as author_avatar,
    (SELECT COUNT(*) FROM COMMENT r WHERE r.parent_id = c.id AND r.deleted_at IS NULL) as reply_count
FROM COMMENT c
JOIN "USER" u ON c.user_id = u.id
LEFT JOIN USER_PROFILE up ON u.id = up.user_id
WHERE c.id = :comment_id::uuid;

-- Get replies to a comment (single level deep only)
-- name: get_comment_replies(comment_id)
SELECT 
    c.id::text as comment_id,
    c.paps_id::text,
    c.user_id::text,
    c.parent_id::text,
    c.content,
    c.is_edited,
    c.created_at,
    c.updated_at,
    c.deleted_at,
    u.username as author_username,
    up.display_name as author_display_name,
    up.avatar_url as author_avatar
FROM COMMENT c
JOIN "USER" u ON c.user_id = u.id
LEFT JOIN USER_PROFILE up ON u.id = up.user_id
WHERE c.parent_id = :comment_id::uuid
  AND c.deleted_at IS NULL
ORDER BY c.created_at ASC;

-- Insert a new comment
-- name: insert_comment(paps_id, user_id, content, parent_id)$
INSERT INTO COMMENT (paps_id, user_id, content, parent_id)
VALUES (:paps_id::uuid, :user_id::uuid, :content, :parent_id::uuid)
RETURNING id;

-- Update comment content
-- name: update_comment(comment_id, content)!
UPDATE COMMENT SET
    content = :content,
    is_edited = TRUE
WHERE id = :comment_id::uuid AND deleted_at IS NULL;

-- Soft delete a comment
-- name: delete_comment(comment_id)!
UPDATE COMMENT SET deleted_at = CURRENT_TIMESTAMP WHERE id = :comment_id::uuid;

-- Get comment count for a paps
-- name: get_paps_comment_count(paps_id)$
SELECT COUNT(*) FROM COMMENT 
WHERE paps_id = :paps_id::uuid AND deleted_at IS NULL;

-- Get top-level comment count for a paps
-- name: get_paps_top_comment_count(paps_id)$
SELECT COUNT(*) FROM COMMENT 
WHERE paps_id = :paps_id::uuid AND parent_id IS NULL AND deleted_at IS NULL;

-- Soft delete all comments for a paps
-- name: delete_comments_for_paps(paps_id)!
UPDATE COMMENT SET deleted_at = CURRENT_TIMESTAMP 
WHERE paps_id = :paps_id::uuid AND deleted_at IS NULL;

-- Soft delete replies when parent comment is deleted
-- name: delete_comment_replies(parent_id)!
UPDATE COMMENT SET deleted_at = CURRENT_TIMESTAMP 
WHERE parent_id = :parent_id::uuid AND deleted_at IS NULL;

-- ============================================
-- SPAP_MEDIA QUERIES
-- ============================================

-- name: get_spap_media(spap_id)
SELECT id as media_id, spap_id, media_type, file_extension, file_size_bytes, mime_type, display_order, uploaded_at
FROM SPAP_MEDIA
WHERE spap_id = :spap_id::uuid
ORDER BY display_order ASC;

-- name: get_spap_media_by_id(media_id)^
SELECT id as media_id, spap_id, media_type, file_extension, file_size_bytes, mime_type, display_order, uploaded_at
FROM SPAP_MEDIA
WHERE id = :media_id::uuid;

-- name: insert_spap_media(spap_id, media_type, file_extension, file_size_bytes, mime_type, display_order)$
INSERT INTO SPAP_MEDIA (spap_id, media_type, file_extension, file_size_bytes, mime_type, display_order)
VALUES (:spap_id::uuid, :media_type, :file_extension, :file_size_bytes, :mime_type, :display_order)
RETURNING id;

-- name: delete_spap_media(media_id)!
DELETE FROM SPAP_MEDIA WHERE id = :media_id::uuid;

-- name: get_next_spap_media_order(spap_id)$
SELECT COALESCE(MAX(display_order), -1) + 1 FROM SPAP_MEDIA WHERE spap_id = :spap_id::uuid;