-- Initial data for the application
-- Requires: create.sql has been run first
-- Requires: test_users.csv has been generated from test_users.in

-- First, ensure ROLE table has the required roles
INSERT INTO ROLE (name, description) VALUES
    ('admin', 'Administrator role'),
    ('worker', 'Worker role'),
    ('poster', 'Poster role'),
    ('moderator', 'Moderator role')
ON CONFLICT (name) DO NOTHING;

-- Import user data from CSV using a temporary table
-- This is necessary because we need to map is_admin boolean to role_id UUID

CREATE TEMP TABLE temp_users (
    username VARCHAR(50),
    email VARCHAR(255),
    password_hash VARCHAR(255),
    is_admin BOOLEAN
);

-- Import from CSV file (format: username,email,password_hash,is_admin)
\copy temp_users(username, email, password_hash, is_admin) from './test_users.csv' (format csv)

-- Insert into USER table with role lookup
INSERT INTO "USER" (username, email, password_hash, role_id, is_active, is_verified)
SELECT 
    username,
    email, 
    password_hash, 
    (SELECT id FROM ROLE WHERE name = CASE WHEN is_admin THEN 'admin' ELSE 'worker' END),
    TRUE,
    TRUE
FROM temp_users
ON CONFLICT (email) DO NOTHING;

-- Clean up
DROP TABLE temp_users;

-- ============================================
-- USER PROFILE SETUP
-- ============================================
-- Users with profile pictures: clement, enrique, osman
-- Users without profile pictures: hassan (uses default)
-- Profiles are auto-created by trigger, but we need to set avatar_urls for those with images

UPDATE USER_PROFILE 
SET avatar_url = 'media/user/profile/clement'
WHERE user_id = (SELECT id FROM "USER" WHERE username = 'clement');

UPDATE USER_PROFILE 
SET avatar_url = 'media/user/profile/enrique'
WHERE user_id = (SELECT id FROM "USER" WHERE username = 'enrique');

UPDATE USER_PROFILE 
SET avatar_url = 'media/user/profile/osman'
WHERE user_id = (SELECT id FROM "USER" WHERE username = 'osman');

-- hassan and admins without profile pics will use the default avatar
-- Set by the app when avatar_url is NULL

--
-- Other tables' initial data can go below
--

-- INSERT INTO PAPS (owner_id, title, subtitle, description, status, location_address, location_lat, location_lng, location_timezone, start_datetime, end_datetime, estimated_duration_minutes, payment_amount, payment_currency, payment_type, max_applicants, max_assignees, is_public, publish_at, expires_at, created_at, updated_at, deleted_at) VALUES
-- ('1', 'Website Development', 'Build a new e-commerce site', 'Looking for a skilled developer to create a full e-commerce website with payment integration.', 'draft', '123 Main St, Cityville', 34.052235, -118.243683, 'America/Los_Angeles', '2026-01-25 09:00:00', NULL, 120, 1500.00, 'USD', 'fixed', 10, 2, TRUE, NULL, NULL, NOW(), NOW(), NULL),

-- ('2', 'Graphic Design', 'Create marketing materials', 'Need a designer to create flyers, brochures, and social media graphics.', 'published', '456 South St, Townsville', 40.712776, -74.005974, 'America/New_York', '2026-02-01 10:30:00', '2026-02-28 12:00:00', 90, 800.00, 'USD', 'fixed', 5, 1, TRUE, '2026-01-20 08:00:00', '2026-03-20 08:00:00', NOW(), NOW(), NULL),

-- ('3', 'Podcast Editing', 'Edit and produce podcast episodes', 'Seeking an audio engineer to edit our podcast episodes and enhance sound quality.', 'closed', '789 East St, Villageville', 34.052235, -118.243683, 'America/Los_Angeles', '2026-01-10 14:00:00', '2026-01-20 16:00:00', 120, 300.00, 'USD', 'hourly', 8, 1, FALSE, NULL, '2026-02-20 08:00:00', NOW(), NOW(), NULL),

-- ('4', 'SEO Optimization', 'Optimize website for search engines', 'Looking for an expert to optimize my website for better search engine ranking.', 'cancelled', NULL, NULL, NULL, 'America/New_York', '2026-01-18 11:00:00', '2026-01-25 13:00:00', 60, 500.00, 'USD', 'negotiable', 15, 3, TRUE, NULL, '2026-01-25 08:00:00', NOW(), NOW(), NULL),

-- ('5', 'Content Writing', 'Write engaging blog posts', 'Need an experienced writer to create engaging blog posts on various topics.', 'draft', NULL, NULL, NULL, NULL, NULL, NULL, 45, 240.00, 'EUR', 'fixed', 5, 1, TRUE, NULL, NULL, NOW(), NOW(), NULL);