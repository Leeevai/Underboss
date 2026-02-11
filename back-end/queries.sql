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
       u.email, (r.name = 'admin') as is_admin
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

-- name: update_user_profile(user_id, first_name, last_name, display_name, bio, avatar_url, date_of_birth, gender, location_address, location_lat, location_lng, timezone, preferred_language)!
UPDATE USER_PROFILE SET
    first_name = COALESCE(:first_name, first_name),
    last_name = COALESCE(:last_name, last_name),
    display_name = COALESCE(:display_name, display_name),
    bio = COALESCE(:bio, bio),
    avatar_url = COALESCE(:avatar_url, avatar_url),
    date_of_birth = COALESCE(:date_of_birth, date_of_birth),
    gender = COALESCE(:gender, gender),
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

-- name: insert_user_experience(user_id, title, company, description, start_date, end_date, is_current, display_order)$
INSERT INTO USER_EXPERIENCE (user_id, title, company, description, start_date, end_date, is_current, display_order)
VALUES (:user_id::uuid, :title, :company, :description, :start_date, :end_date, :is_current, COALESCE(:display_order, 0))
RETURNING id::text;

-- name: update_user_experience(exp_id, title, company, description, start_date, end_date, is_current, display_order)!
UPDATE USER_EXPERIENCE SET
    title = COALESCE(:title, title),
    company = COALESCE(:company, company),
    description = COALESCE(:description, description),
    start_date = COALESCE(:start_date, start_date),
    end_date = COALESCE(:end_date, end_date),
    is_current = COALESCE(:is_current, is_current),
    display_order = COALESCE(:display_order, display_order)
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
    ui.created_at as added_at,
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

-- Hard delete a single paps (for cascade operations)
-- name: hard_delete_paps(id)!
DELETE FROM PAPS WHERE id = :id::uuid;

-- Hard delete all paps owned by a user (for user deletion cascade)
-- name: hard_delete_user_paps(owner_id)!
DELETE FROM PAPS WHERE owner_id = :owner_id::uuid;

-- Delete all PAPS_CATEGORY records for a user's paps (before hard delete)
-- name: delete_user_paps_categories(owner_id)!
DELETE FROM PAPS_CATEGORY WHERE paps_id IN (SELECT id FROM PAPS WHERE owner_id = :owner_id::uuid);

-- Get all paps IDs for a user (for cleanup operations)
-- name: get_user_paps_ids(owner_id)
SELECT id::text as paps_id FROM PAPS WHERE owner_id = :owner_id::uuid;

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

-- name: insert_spap(paps_id, applicant_id, message)$
INSERT INTO SPAP (paps_id, applicant_id, message)
VALUES (:paps_id::uuid, :applicant_id::uuid, :message)
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

-- ============================================
-- ASAP (ASSIGNED JOB) QUERIES
-- ============================================

-- Get all ASAPs for a PAPS
-- name: get_asaps_for_paps(paps_id)
SELECT 
    a.id::text as asap_id,
    a.paps_id::text,
    a.accepted_user_id::text,
    p.owner_id::text,
    p.title,
    a.status,
    a.assigned_at,
    a.started_at,
    a.completed_at,
    u.username as accepted_user_username,
    up.display_name as accepted_user_display_name,
    up.avatar_url as accepted_user_avatar
FROM ASAP a
JOIN PAPS p ON a.paps_id = p.id
JOIN "USER" u ON a.accepted_user_id = u.id
LEFT JOIN USER_PROFILE up ON u.id = up.user_id
WHERE a.paps_id = :paps_id::uuid
ORDER BY a.assigned_at DESC;

-- Get ASAP by ID
-- name: get_asap_by_id(asap_id)^
SELECT 
    a.id::text as asap_id,
    a.paps_id::text,
    a.accepted_user_id::text,
    p.owner_id::text,
    p.title,
    p.subtitle,
    p.location_address,
    p.location_lat,
    p.location_lng,
    a.status,
    a.assigned_at,
    a.started_at,
    a.completed_at,
    a.worker_confirmed,
    a.owner_confirmed,
    u.username as accepted_user_username,
    up.display_name as accepted_user_display_name,
    up.avatar_url as accepted_user_avatar,
    p.title as paps_title,
    p.payment_amount,
    p.payment_currency,
    p.payment_type,
    owner.username as owner_username
FROM ASAP a
JOIN PAPS p ON a.paps_id = p.id
JOIN "USER" u ON a.accepted_user_id = u.id
LEFT JOIN USER_PROFILE up ON u.id = up.user_id
JOIN "USER" owner ON p.owner_id = owner.id
WHERE a.id = :asap_id::uuid;

-- Get ASAPs by accepted user
-- name: get_asaps_by_user(user_id)
SELECT 
    a.id::text as asap_id,
    a.paps_id::text,
    a.accepted_user_id::text,
    p.owner_id::text,
    p.title,
    a.status,
    a.assigned_at,
    a.started_at,
    a.completed_at,
    a.worker_confirmed,
    a.owner_confirmed,
    p.title as paps_title,
    p.payment_amount,
    p.payment_currency,
    p.payment_type,
    owner.username as owner_username,
    owner_profile.display_name as owner_display_name
FROM ASAP a
JOIN PAPS p ON a.paps_id = p.id
JOIN "USER" owner ON p.owner_id = owner.id
LEFT JOIN USER_PROFILE owner_profile ON owner.id = owner_profile.user_id
WHERE a.accepted_user_id = :user_id::uuid
ORDER BY a.assigned_at DESC;

-- Get ASAPs by PAPS owner
-- name: get_asaps_by_owner(owner_id)
SELECT 
    a.id::text as asap_id,
    a.paps_id::text,
    a.accepted_user_id::text,
    p.owner_id::text,
    p.title,
    a.status,
    a.assigned_at,
    a.started_at,
    a.completed_at,
    a.worker_confirmed,
    a.owner_confirmed,
    p.title as paps_title,
    p.payment_amount,
    p.payment_currency,
    p.payment_type,
    u.username as accepted_user_username,
    up.display_name as accepted_user_display_name
FROM ASAP a
JOIN PAPS p ON a.paps_id = p.id
JOIN "USER" u ON a.accepted_user_id = u.id
LEFT JOIN USER_PROFILE up ON u.id = up.user_id
WHERE p.owner_id = :owner_id::uuid
ORDER BY a.assigned_at DESC;

-- Count ASAPs for a PAPS
-- name: get_asap_count_for_paps(paps_id)$
SELECT COUNT(*) FROM ASAP WHERE paps_id = :paps_id::uuid;

-- Check if user already has ASAP for a PAPS
-- name: get_asap_by_paps_and_user(paps_id, user_id)^
SELECT id::text as asap_id, status FROM ASAP 
WHERE paps_id = :paps_id::uuid AND accepted_user_id = :user_id::uuid;

-- Insert new ASAP (when accepting an application)
-- name: insert_asap(paps_id, accepted_user_id)$
INSERT INTO ASAP (paps_id, accepted_user_id)
VALUES (:paps_id::uuid, :accepted_user_id::uuid)
RETURNING id::text;

-- Update ASAP status
-- name: update_asap_status(asap_id, status, started_at, completed_at)!
UPDATE ASAP SET
    status = COALESCE(:status, status),
    started_at = COALESCE(:started_at, started_at),
    completed_at = COALESCE(:completed_at, completed_at)
WHERE id = :asap_id::uuid;

-- Confirm ASAP completion by worker
-- name: confirm_asap_worker(asap_id)!
UPDATE ASAP SET worker_confirmed = TRUE
WHERE id = :asap_id::uuid;

-- Confirm ASAP completion by owner
-- name: confirm_asap_owner(asap_id)!
UPDATE ASAP SET owner_confirmed = TRUE
WHERE id = :asap_id::uuid;

-- Complete ASAP when both have confirmed
-- name: try_complete_asap(asap_id, completed_at)^
UPDATE ASAP SET
    status = 'completed',
    completed_at = :completed_at
WHERE id = :asap_id::uuid
  AND worker_confirmed = TRUE
  AND owner_confirmed = TRUE
  AND status != 'completed'
RETURNING id::text;

-- Delete ASAP
-- name: delete_asap(asap_id)!
DELETE FROM ASAP WHERE id = :asap_id::uuid;

-- Delete all ASAPs for a PAPS
-- name: delete_asaps_for_paps(paps_id)!
DELETE FROM ASAP WHERE paps_id = :paps_id::uuid;

-- ============================================
-- ASAP_MEDIA QUERIES
-- ============================================

-- name: get_asap_media(asap_id)
SELECT id::text as media_id, asap_id::text, media_type, file_extension, file_size_bytes, mime_type, display_order, uploaded_at
FROM ASAP_MEDIA
WHERE asap_id = :asap_id::uuid
ORDER BY display_order ASC;

-- name: get_asap_media_by_id(media_id)^
SELECT id::text as media_id, asap_id::text, media_type, file_extension, file_size_bytes, mime_type, display_order, uploaded_at
FROM ASAP_MEDIA
WHERE id = :media_id::uuid;

-- name: insert_asap_media(asap_id, media_type, file_extension, file_size_bytes, mime_type, display_order)$
INSERT INTO ASAP_MEDIA (asap_id, media_type, file_extension, file_size_bytes, mime_type, display_order)
VALUES (:asap_id::uuid, :media_type, :file_extension, :file_size_bytes, :mime_type, :display_order)
RETURNING id::text;

-- name: delete_asap_media(media_id)!
DELETE FROM ASAP_MEDIA WHERE id = :media_id::uuid;

-- name: get_next_asap_media_order(asap_id)$
SELECT COALESCE(MAX(display_order), -1) + 1 FROM ASAP_MEDIA WHERE asap_id = :asap_id::uuid;

-- ============================================
-- PAYMENT QUERIES
-- ============================================

-- Get payment by ID
-- name: get_payment_by_id(payment_id)^
SELECT 
    p.id::text as payment_id,
    p.paps_id::text,
    p.payer_id::text,
    p.payee_id::text,
    p.amount,
    p.currency,
    p.payment_method,
    p.status,
    p.external_reference,
    p.transaction_id,
    p.created_at,
    p.updated_at,
    p.paid_at,
    payer.username as payer_username,
    payee.username as payee_username
FROM PAYMENT p
JOIN "USER" payer ON p.payer_id = payer.id
JOIN "USER" payee ON p.payee_id = payee.id
WHERE p.id = :payment_id::uuid;

-- Get payments for a PAPS
-- name: get_payments_for_paps(paps_id)
SELECT 
    p.id::text as payment_id,
    p.paps_id::text,
    p.payer_id::text,
    p.payee_id::text,
    p.amount,
    p.currency,
    p.payment_method,
    p.status,
    p.created_at,
    p.paid_at
FROM PAYMENT p
WHERE p.paps_id = :paps_id::uuid
ORDER BY p.created_at DESC;

-- Get payments by user (as payer or payee)
-- name: get_payments_by_user(user_id)
SELECT 
    p.id::text as payment_id,
    p.paps_id::text,
    p.payer_id::text,
    p.payee_id::text,
    p.amount,
    p.currency,
    p.payment_method,
    p.status,
    p.created_at,
    p.paid_at,
    CASE WHEN p.payer_id = :user_id::uuid THEN 'payer' ELSE 'payee' END as user_role,
    paps.title as paps_title
FROM PAYMENT p
JOIN PAPS paps ON p.paps_id = paps.id
WHERE p.payer_id = :user_id::uuid OR p.payee_id = :user_id::uuid
ORDER BY p.created_at DESC;

-- Insert new payment
-- name: insert_payment(paps_id, payer_id, payee_id, amount, currency, payment_method)$
INSERT INTO PAYMENT (paps_id, payer_id, payee_id, amount, currency, payment_method)
VALUES (:paps_id::uuid, :payer_id::uuid, :payee_id::uuid, :amount, :currency, :payment_method)
RETURNING id::text;

-- Update payment status
-- name: update_payment_status(payment_id, status, paid_at, transaction_id, external_reference)!
UPDATE PAYMENT SET
    status = COALESCE(:status, status),
    paid_at = COALESCE(:paid_at, paid_at),
    transaction_id = COALESCE(:transaction_id, transaction_id),
    external_reference = COALESCE(:external_reference, external_reference)
WHERE id = :payment_id::uuid;

-- Delete payment
-- name: delete_payment(payment_id)!
DELETE FROM PAYMENT WHERE id = :payment_id::uuid;

-- ============================================
-- CHAT THREAD QUERIES
-- ============================================

-- Get chat thread by ID
-- name: get_chat_thread_by_id(thread_id)^
SELECT 
    ct.id::text as thread_id,
    ct.paps_id::text,
    ct.spap_id::text,
    ct.asap_id::text,
    ct.thread_type,
    ct.created_at,
    ct.updated_at,
    p.title as paps_title
FROM CHAT_THREAD ct
JOIN PAPS p ON ct.paps_id = p.id
WHERE ct.id = :thread_id::uuid;

-- Get chat thread by SPAP
-- name: get_chat_thread_by_spap(spap_id)^
SELECT 
    ct.id::text as thread_id,
    ct.paps_id::text,
    ct.spap_id::text,
    ct.asap_id::text,
    ct.thread_type,
    ct.created_at
FROM CHAT_THREAD ct
WHERE ct.spap_id = :spap_id::uuid;

-- Get chat thread by ASAP
-- name: get_chat_thread_by_asap(asap_id)^
SELECT 
    ct.id::text as thread_id,
    ct.paps_id::text,
    ct.spap_id::text,
    ct.asap_id::text,
    ct.thread_type,
    ct.created_at
FROM CHAT_THREAD ct
WHERE ct.asap_id = :asap_id::uuid;

-- Get all chat threads for a PAPS
-- name: get_chat_threads_for_paps(paps_id)
SELECT 
    ct.id::text as thread_id,
    ct.paps_id::text,
    ct.spap_id::text,
    ct.asap_id::text,
    ct.thread_type,
    ct.created_at,
    (SELECT COUNT(*) FROM CHAT_MESSAGE cm WHERE cm.thread_id = ct.id) as message_count,
    (SELECT MAX(sent_at) FROM CHAT_MESSAGE cm WHERE cm.thread_id = ct.id) as last_message_at
FROM CHAT_THREAD ct
WHERE ct.paps_id = :paps_id::uuid
ORDER BY ct.created_at DESC;

-- Get chat threads for a user (where they are participant)
-- name: get_chat_threads_for_user(user_id)
SELECT 
    ct.id::text as thread_id,
    ct.paps_id::text,
    ct.spap_id::text,
    ct.asap_id::text,
    ct.thread_type,
    ct.created_at,
    p.title as paps_title,
    cp.role as user_role,
    (SELECT COUNT(*) FROM CHAT_MESSAGE cm WHERE cm.thread_id = ct.id AND cm.is_read = FALSE AND cm.sender_id != :user_id::uuid) as unread_count,
    (SELECT MAX(sent_at) FROM CHAT_MESSAGE cm WHERE cm.thread_id = ct.id) as last_message_at
FROM CHAT_THREAD ct
JOIN CHAT_PARTICIPANT cp ON ct.id = cp.thread_id
JOIN PAPS p ON ct.paps_id = p.id
WHERE cp.user_id = :user_id::uuid AND cp.left_at IS NULL
ORDER BY last_message_at DESC NULLS LAST;

-- Insert chat thread (for SPAP)
-- name: insert_chat_thread_for_spap(paps_id, spap_id)$
INSERT INTO CHAT_THREAD (paps_id, spap_id, thread_type)
VALUES (:paps_id::uuid, :spap_id::uuid, 'spap_discussion')
RETURNING id::text;

-- Insert chat thread (for ASAP)
-- name: insert_chat_thread_for_asap(paps_id, asap_id, thread_type)$
INSERT INTO CHAT_THREAD (paps_id, asap_id, thread_type)
VALUES (:paps_id::uuid, :asap_id::uuid, :thread_type)
RETURNING id::text;

-- Transfer chat thread from SPAP to ASAP
-- name: transfer_chat_thread_to_asap(thread_id, asap_id)!
UPDATE CHAT_THREAD SET
    spap_id = NULL,
    asap_id = :asap_id::uuid,
    thread_type = 'asap_discussion'
WHERE id = :thread_id::uuid;

-- Delete chat thread
-- name: delete_chat_thread(thread_id)!
DELETE FROM CHAT_THREAD WHERE id = :thread_id::uuid;

-- ============================================
-- CHAT PARTICIPANT QUERIES
-- ============================================

-- Get participants for a thread
-- name: get_chat_participants(thread_id)
SELECT 
    cp.id::text as participant_id,
    cp.thread_id::text,
    cp.user_id::text,
    cp.role,
    cp.joined_at,
    cp.left_at,
    u.username,
    up.display_name,
    up.avatar_url
FROM CHAT_PARTICIPANT cp
JOIN "USER" u ON cp.user_id = u.id
LEFT JOIN USER_PROFILE up ON u.id = up.user_id
WHERE cp.thread_id = :thread_id::uuid
ORDER BY cp.joined_at;

-- Check if user is participant
-- name: is_user_participant(thread_id, user_id)^
SELECT id::text as participant_id, role, left_at
FROM CHAT_PARTICIPANT
WHERE thread_id = :thread_id::uuid AND user_id = :user_id::uuid;

-- Add participant to thread
-- name: insert_chat_participant(thread_id, user_id, role)$
INSERT INTO CHAT_PARTICIPANT (thread_id, user_id, role)
VALUES (:thread_id::uuid, :user_id::uuid, :role)
ON CONFLICT (thread_id, user_id) DO UPDATE SET left_at = NULL, role = :role
RETURNING id::text;

-- Remove participant from thread (soft leave)
-- name: leave_chat_thread(thread_id, user_id)!
UPDATE CHAT_PARTICIPANT SET left_at = CURRENT_TIMESTAMP
WHERE thread_id = :thread_id::uuid AND user_id = :user_id::uuid;

-- ============================================
-- CHAT MESSAGE QUERIES
-- ============================================

-- Get messages for a thread
-- name: get_chat_messages(thread_id, limit_count, offset_count)
SELECT 
    cm.id::text as message_id,
    cm.thread_id::text,
    cm.sender_id::text,
    cm.content,
    cm.message_type,
    cm.attachment_url,
    cm.is_read,
    cm.read_at,
    cm.sent_at,
    cm.edited_at,
    u.username as sender_username,
    up.display_name as sender_display_name,
    up.avatar_url as sender_avatar
FROM CHAT_MESSAGE cm
LEFT JOIN "USER" u ON cm.sender_id = u.id
LEFT JOIN USER_PROFILE up ON u.id = up.user_id
WHERE cm.thread_id = :thread_id::uuid
ORDER BY cm.sent_at DESC
LIMIT :limit_count::integer OFFSET :offset_count::integer;

-- Get single message
-- name: get_chat_message_by_id(message_id)^
SELECT 
    cm.id::text as message_id,
    cm.thread_id::text,
    cm.sender_id::text,
    cm.content,
    cm.message_type,
    cm.attachment_url,
    cm.is_read,
    cm.sent_at
FROM CHAT_MESSAGE cm
WHERE cm.id = :message_id::uuid;

-- Insert message
-- name: insert_chat_message(thread_id, sender_id, content, message_type, attachment_url)$
INSERT INTO CHAT_MESSAGE (thread_id, sender_id, content, message_type, attachment_url)
VALUES (:thread_id::uuid, :sender_id::uuid, :content, :message_type, :attachment_url)
RETURNING id::text;

-- Update chat message content
-- name: update_chat_message(message_id, content)!
UPDATE CHAT_MESSAGE SET content = :content, edited_at = CURRENT_TIMESTAMP
WHERE id = :message_id::uuid;

-- Mark message as read
-- name: mark_message_read(message_id)!
UPDATE CHAT_MESSAGE SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
WHERE id = :message_id::uuid AND is_read = FALSE;

-- Mark all messages in thread as read for user
-- name: mark_thread_messages_read(thread_id, user_id)!
UPDATE CHAT_MESSAGE SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
WHERE thread_id = :thread_id::uuid AND sender_id != :user_id::uuid AND is_read = FALSE;

-- Get unread count for user in thread
-- name: get_unread_count(thread_id, user_id)$
SELECT COUNT(*) FROM CHAT_MESSAGE 
WHERE thread_id = :thread_id::uuid AND sender_id != :user_id::uuid AND is_read = FALSE;

-- ============================================
-- RATING QUERIES (Moving Average Only)
-- ============================================

-- Update user's rating average (moving average calculation)
-- This is called after each new rating, but individual ratings are not stored
-- name: update_user_rating(user_id, new_rating)!
UPDATE USER_PROFILE SET
    rating_average = (rating_average * rating_count + :new_rating) / (rating_count + 1),
    rating_count = rating_count + 1
WHERE user_id = :user_id::uuid;

-- Get user's rating info
-- name: get_user_rating(user_id)^
SELECT rating_average, rating_count
FROM USER_PROFILE
WHERE user_id = :user_id::uuid;

-- Check if rating is allowed (ASAP must be completed)
-- name: can_rate_asap(asap_id, rater_id)^
SELECT 
    a.id::text as asap_id,
    a.status,
    a.accepted_user_id::text,
    p.owner_id::text,
    CASE 
        WHEN p.owner_id = :rater_id::uuid THEN a.accepted_user_id
        WHEN a.accepted_user_id = :rater_id::uuid THEN p.owner_id
        ELSE NULL
    END as can_rate_user_id
FROM ASAP a
JOIN PAPS p ON a.paps_id = p.id
WHERE a.id = :asap_id::uuid AND a.status = 'completed';

-- ============================================
-- PAPS STATUS HELPER QUERIES
-- ============================================

-- Get pending SPAP count for a PAPS
-- name: get_pending_spap_count(paps_id)$
SELECT COUNT(*) FROM SPAP WHERE paps_id = :paps_id::uuid AND status = 'pending';

-- Update PAPS status (used when max_assignees reached)
-- name: update_paps_status(paps_id, status)!
UPDATE PAPS SET status = :status WHERE id = :paps_id::uuid;

-- Delete all pending SPAPs for a PAPS (when closing)
-- name: delete_pending_spaps_for_paps(paps_id)!
DELETE FROM SPAP WHERE paps_id = :paps_id::uuid AND status = 'pending';

-- Get group chat thread for a PAPS (for multiple assignees)
-- name: get_group_chat_for_paps(paps_id)^
SELECT id::text as thread_id
FROM CHAT_THREAD
WHERE paps_id = :paps_id::uuid AND thread_type = 'group_chat';

-- ============================================
-- CLEANUP QUERIES
-- ============================================

-- Get ASAPs completed more than 30 days ago (for deletion)
-- name: get_asaps_for_cleanup(days_old)
SELECT 
    a.id::text as asap_id,
    a.paps_id::text,
    a.accepted_user_id::text
FROM ASAP a
WHERE a.status = 'completed' 
  AND a.completed_at IS NOT NULL 
  AND a.completed_at < CURRENT_TIMESTAMP - (:days_old || ' days')::interval;

-- ============================================
-- PAPS SCHEDULE QUERIES (Recurring Jobs)
-- ============================================

-- Get all schedules for a PAPS
-- name: get_paps_schedules(paps_id)
SELECT 
    id::text as schedule_id,
    paps_id::text,
    recurrence_rule,
    cron_expression,
    start_date,
    end_date,
    next_run_at,
    last_run_at,
    is_active,
    created_at,
    updated_at
FROM PAPS_SCHEDULE
WHERE paps_id = :paps_id::uuid
ORDER BY start_date;

-- Get a specific schedule
-- name: get_paps_schedule_by_id(schedule_id)^
SELECT 
    ps.id::text as schedule_id,
    ps.paps_id::text,
    ps.recurrence_rule,
    ps.cron_expression,
    ps.start_date,
    ps.end_date,
    ps.next_run_at,
    ps.last_run_at,
    ps.is_active,
    ps.created_at,
    ps.updated_at,
    p.owner_id::text
FROM PAPS_SCHEDULE ps
JOIN PAPS p ON ps.paps_id = p.id
WHERE ps.id = :schedule_id::uuid;

-- Create a schedule
-- name: insert_paps_schedule(paps_id, recurrence_rule, cron_expression, start_date, end_date, next_run_at)$
INSERT INTO PAPS_SCHEDULE (paps_id, recurrence_rule, cron_expression, start_date, end_date, next_run_at)
VALUES (:paps_id::uuid, :recurrence_rule, :cron_expression, :start_date, :end_date, :next_run_at)
RETURNING id::text;

-- Update a schedule
-- name: update_paps_schedule(schedule_id, recurrence_rule, cron_expression, start_date, end_date, next_run_at, is_active)!
UPDATE PAPS_SCHEDULE SET
    recurrence_rule = COALESCE(:recurrence_rule, recurrence_rule),
    cron_expression = COALESCE(:cron_expression, cron_expression),
    start_date = COALESCE(:start_date, start_date),
    end_date = COALESCE(:end_date, end_date),
    next_run_at = COALESCE(:next_run_at, next_run_at),
    is_active = COALESCE(:is_active, is_active),
    updated_at = CURRENT_TIMESTAMP
WHERE id = :schedule_id::uuid;

-- Update last_run_at after schedule executes
-- name: update_schedule_last_run(schedule_id, next_run_at)!
UPDATE PAPS_SCHEDULE SET 
    last_run_at = CURRENT_TIMESTAMP,
    next_run_at = :next_run_at
WHERE id = :schedule_id::uuid;

-- Delete a schedule
-- name: delete_paps_schedule(schedule_id)!
DELETE FROM PAPS_SCHEDULE WHERE id = :schedule_id::uuid;

-- Delete all schedules for a PAPS
-- name: delete_paps_schedules(paps_id)!
DELETE FROM PAPS_SCHEDULE WHERE paps_id = :paps_id::uuid;

-- Get active schedules due for execution
-- name: get_due_schedules()
SELECT 
    ps.id::text as schedule_id,
    ps.paps_id::text,
    ps.recurrence_rule,
    ps.cron_expression,
    ps.start_date,
    ps.end_date,
    ps.next_run_at,
    p.owner_id::text
FROM PAPS_SCHEDULE ps
JOIN PAPS p ON ps.paps_id = p.id
WHERE ps.is_active = TRUE
  AND ps.next_run_at IS NOT NULL
  AND ps.next_run_at <= CURRENT_TIMESTAMP
  AND (ps.end_date IS NULL OR ps.end_date >= CURRENT_DATE)
  AND p.deleted_at IS NULL;