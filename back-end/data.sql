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
SET avatar_url = 'media/user/profile/clement.png'
WHERE user_id = (SELECT id FROM "USER" WHERE username = 'clement');

UPDATE USER_PROFILE 
SET avatar_url = 'media/user/profile/enrique.png'
WHERE user_id = (SELECT id FROM "USER" WHERE username = 'enrique');

UPDATE USER_PROFILE 
SET avatar_url = 'media/user/profile/osman.png'
WHERE user_id = (SELECT id FROM "USER" WHERE username = 'osman');

-- hassan and admins without profile pics will use the default avatar
-- Set by the app when avatar_url is NULL

--
-- Other tables' initial data can go below
--

-- ============================================
-- CATEGORIES
-- ============================================

INSERT INTO CATEGORY (name, slug, description, parent_id, icon_url, display_order, is_active, created_at) VALUES
    ('Technology', 'technology', 'Tech-related jobs and services', NULL, 'icon/tech.png', 1, TRUE, NOW()),
    ('Web Development', 'web-development', 'Website and web application development', (SELECT id FROM CATEGORY WHERE slug = 'technology'), 'icon/web-dev.png', 1, TRUE, NOW()),
    ('Mobile Development', 'mobile-development', 'Mobile app development for iOS and Android', (SELECT id FROM CATEGORY WHERE slug = 'technology'), 'icon/mobile-dev.png', 2, TRUE, NOW()),
    ('Design', 'design', 'Graphic design and creative services', NULL, 'icon/design.png', 2, TRUE, NOW()),
    ('Graphic Design', 'graphic-design', 'Visual design and branding', (SELECT id FROM CATEGORY WHERE slug = 'design'), 'icon/graphic-design.png', 1, TRUE, NOW()),
    ('UI/UX Design', 'ui-ux-design', 'User interface and experience design', (SELECT id FROM CATEGORY WHERE slug = 'design'), 'icon/ui-ux.png', 2, TRUE, NOW()),
    ('Writing', 'writing', 'Content creation and copywriting', NULL, 'icon/writing.png', 3, TRUE, NOW()),
    ('Content Writing', 'content-writing', 'Blog posts, articles, and web content', (SELECT id FROM CATEGORY WHERE slug = 'writing'), 'icon/content-writing.png', 1, TRUE, NOW()),
    ('Marketing', 'marketing', 'Marketing and advertising services', NULL, 'icon/marketing.png', 4, TRUE, NOW()),
    ('SEO', 'seo', 'Search engine optimization services', (SELECT id FROM CATEGORY WHERE slug = 'marketing'), 'icon/seo.png', 1, TRUE, NOW()),
    ('Social Media', 'social-media', 'Social media management and marketing', (SELECT id FROM CATEGORY WHERE slug = 'marketing'), 'icon/social-media.png', 2, TRUE, NOW()),
    ('Audio/Video', 'audio-video', 'Audio production and video editing', NULL, 'icon/audio-video.png', 5, TRUE, NOW()),
    ('Video Editing', 'video-editing', 'Video production and editing services', (SELECT id FROM CATEGORY WHERE slug = 'audio-video'), 'icon/video-editing.png', 1, TRUE, NOW()),
    ('Audio Production', 'audio-production', 'Podcast editing and music production', (SELECT id FROM CATEGORY WHERE slug = 'audio-video'), 'icon/audio-prod.png', 2, TRUE, NOW())
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- FAKE PAPS DATA
-- ============================================

INSERT INTO PAPS (owner_id, title, subtitle, description, status, location_address, location_lat, location_lng, location_timezone, start_datetime, end_datetime, estimated_duration_minutes, payment_amount, payment_currency, payment_type, max_applicants, max_assignees, is_public, publish_at, expires_at, created_at, updated_at) VALUES
-- Hassan's posts
((SELECT id FROM "USER" WHERE username = 'hassan'), 'Full-Stack Web Developer Needed', 'Build a responsive e-commerce platform', 'Looking for an experienced full-stack developer to build a modern e-commerce website with React frontend and Node.js backend. Must have experience with payment integrations, user authentication, and responsive design. Project includes product catalog, shopping cart, and admin dashboard.', 'published', 'Paris, France', 48.8566, 2.3522, 'Europe/Paris', '2026-02-01 09:00:00', '2026-03-01 17:00:00', 480, 2500.00, 'EUR', 'fixed', 8, 1, TRUE, '2026-01-15 10:00:00', '2026-04-01 23:59:59', NOW(), NOW()),

((SELECT id FROM "USER" WHERE username = 'hassan'), 'Mobile App Development', 'iOS/Android app for fitness tracking', 'Need a skilled mobile developer to create a cross-platform fitness tracking app. Features include workout logging, progress tracking, social sharing, and integration with wearable devices. Experience with React Native preferred.', 'published', 'Remote', NULL, NULL, 'UTC', '2026-02-15 10:00:00', '2026-04-15 18:00:00', 360, 1800.00, 'USD', 'fixed', 6, 1, TRUE, '2026-01-20 14:00:00', '2026-05-01 23:59:59', NOW(), NOW()),

-- Clement's posts
((SELECT id FROM "USER" WHERE username = 'clement'), 'Logo Design & Branding', 'Complete brand identity for startup', 'Seeking a creative designer to develop a complete brand identity including logo, color palette, typography, and brand guidelines. The startup is in the tech space, targeting young professionals. Please include portfolio examples in your application.', 'published', 'Lyon, France', 45.7640, 4.8357, 'Europe/Paris', '2026-02-10 09:00:00', '2026-02-20 17:00:00', 120, 800.00, 'EUR', 'fixed', 5, 1, TRUE, '2026-01-25 11:00:00', '2026-03-01 23:59:59', NOW(), NOW()),

((SELECT id FROM "USER" WHERE username = 'clement'), 'Social Media Content Creation', 'Monthly content calendar and graphics', 'Need a social media specialist to create engaging content for our Instagram and LinkedIn accounts. This includes graphic design, copywriting, and content strategy for a B2B tech company. 20 posts per month, mix of images, carousels, and stories.', 'draft', 'Remote', NULL, NULL, 'Europe/Paris', '2026-03-01 09:00:00', NULL, 60, 400.00, 'EUR', 'fixed', 4, 1, TRUE, NULL, NULL, NOW(), NOW()),

-- Osman's posts
((SELECT id FROM "USER" WHERE username = 'osman'), 'SEO Audit & Optimization', 'Improve website search rankings', 'Experienced SEO specialist needed to perform a comprehensive audit of our website and implement optimization strategies. Focus on technical SEO, content optimization, and link building. Must provide before/after analytics.', 'published', 'Istanbul, Turkey', 41.0082, 28.9784, 'Europe/Istanbul', '2026-02-05 10:00:00', '2026-02-25 16:00:00', 90, 600.00, 'USD', 'fixed', 7, 1, TRUE, '2026-01-18 12:00:00', '2026-03-15 23:59:59', NOW(), NOW()),

((SELECT id FROM "USER" WHERE username = 'osman'), 'Video Editing for YouTube Channel', 'Edit and produce weekly videos', 'Looking for a talented video editor to help with our YouTube channel. Tasks include cutting raw footage, adding transitions, music, and text overlays. Experience with Adobe Premiere or Final Cut Pro required. We produce educational tech content.', 'published', 'Remote', NULL, NULL, 'Europe/Istanbul', '2026-02-20 14:00:00', '2026-05-20 17:00:00', 180, 800.00, 'USD', 'hourly', 3, 1, TRUE, '2026-01-30 09:00:00', '2026-06-01 23:59:59', NOW(), NOW()),

-- Enrique's posts
((SELECT id FROM "USER" WHERE username = 'enrique'), 'Technical Writing Documentation', 'API documentation and user guides', 'Need a technical writer to create comprehensive documentation for our SaaS platform. This includes API reference documentation, user guides, and developer tutorials. Experience with API documentation tools like Swagger/OpenAPI preferred.', 'published', 'Madrid, Spain', 40.4168, -3.7038, 'Europe/Madrid', '2026-03-01 09:00:00', '2026-04-01 18:00:00', 240, 1200.00, 'EUR', 'fixed', 5, 1, TRUE, '2026-01-22 13:00:00', '2026-04-15 23:59:59', NOW(), NOW()),

((SELECT id FROM "USER" WHERE username = 'enrique'), 'Podcast Production Services', 'Complete podcast editing and production', 'Seeking a podcast producer to handle editing, mixing, and mastering for our weekly tech podcast. Experience with audio software like Adobe Audition or Logic Pro essential. Must be able to meet tight deadlines and provide high-quality deliverables.', 'closed', 'Barcelona, Spain', 41.3851, 2.1734, 'Europe/Madrid', '2026-01-15 10:00:00', '2026-01-30 16:00:00', 150, 500.00, 'EUR', 'fixed', 4, 1, FALSE, '2026-01-10 08:00:00', '2026-02-15 23:59:59', NOW(), NOW()),

-- Hobbes' posts (worker)
((SELECT id FROM "USER" WHERE username = 'hobbes'), 'Data Analysis Project', 'Analyze sales data and create reports', 'Freelance data analyst needed to analyze our sales data and create insightful reports. Experience with Python, pandas, and data visualization tools required. The project involves cleaning data, performing statistical analysis, and creating dashboards.', 'published', 'Remote', NULL, NULL, 'America/New_York', '2026-02-25 09:00:00', '2026-03-10 17:00:00', 200, 750.00, 'USD', 'fixed', 6, 1, TRUE, '2026-01-28 10:00:00', '2026-04-01 23:59:59', NOW(), NOW()),

-- Calvin's posts (admin - but can post too)
((SELECT id FROM "USER" WHERE username = 'calvin'), 'UI/UX Design for Mobile App', 'Redesign user interface for existing app', 'Experienced UI/UX designer needed to redesign the user interface of our mobile application. Current app needs modernization with better user flows, improved accessibility, and contemporary design trends. Wireframes and prototypes required.', 'published', 'San Francisco, CA', 37.7749, -122.4194, 'America/Los_Angeles', '2026-03-05 10:00:00', '2026-04-05 18:00:00', 300, 1500.00, 'USD', 'fixed', 4, 1, TRUE, '2026-01-26 14:00:00', '2026-05-01 23:59:59', NOW(), NOW());

-- ============================================
-- PAPS CATEGORIES (assign categories to PAPs)
-- ============================================

INSERT INTO PAPS_CATEGORY (paps_id, category_id, is_primary, assigned_at) VALUES
-- Full-Stack Web Developer (hassan)
((SELECT id FROM PAPS WHERE title = 'Full-Stack Web Developer Needed'), (SELECT id FROM CATEGORY WHERE slug = 'web-development'), TRUE, NOW()),
((SELECT id FROM PAPS WHERE title = 'Full-Stack Web Developer Needed'), (SELECT id FROM CATEGORY WHERE slug = 'technology'), FALSE, NOW()),

-- Mobile App Development (hassan)
((SELECT id FROM PAPS WHERE title = 'Mobile App Development'), (SELECT id FROM CATEGORY WHERE slug = 'mobile-development'), TRUE, NOW()),
((SELECT id FROM PAPS WHERE title = 'Mobile App Development'), (SELECT id FROM CATEGORY WHERE slug = 'technology'), FALSE, NOW()),

-- Logo Design & Branding (clement)
((SELECT id FROM PAPS WHERE title = 'Logo Design & Branding'), (SELECT id FROM CATEGORY WHERE slug = 'graphic-design'), TRUE, NOW()),
((SELECT id FROM PAPS WHERE title = 'Logo Design & Branding'), (SELECT id FROM CATEGORY WHERE slug = 'design'), FALSE, NOW()),

-- Social Media Content Creation (clement)
((SELECT id FROM PAPS WHERE title = 'Social Media Content Creation'), (SELECT id FROM CATEGORY WHERE slug = 'social-media'), TRUE, NOW()),
((SELECT id FROM PAPS WHERE title = 'Social Media Content Creation'), (SELECT id FROM CATEGORY WHERE slug = 'marketing'), FALSE, NOW()),

-- SEO Audit & Optimization (osman)
((SELECT id FROM PAPS WHERE title = 'SEO Audit & Optimization'), (SELECT id FROM CATEGORY WHERE slug = 'seo'), TRUE, NOW()),
((SELECT id FROM PAPS WHERE title = 'SEO Audit & Optimization'), (SELECT id FROM CATEGORY WHERE slug = 'marketing'), FALSE, NOW()),

-- Video Editing for YouTube Channel (osman)
((SELECT id FROM PAPS WHERE title = 'Video Editing for YouTube Channel'), (SELECT id FROM CATEGORY WHERE slug = 'video-editing'), TRUE, NOW()),
((SELECT id FROM PAPS WHERE title = 'Video Editing for YouTube Channel'), (SELECT id FROM CATEGORY WHERE slug = 'audio-video'), FALSE, NOW()),

-- Technical Writing Documentation (enrique)
((SELECT id FROM PAPS WHERE title = 'Technical Writing Documentation'), (SELECT id FROM CATEGORY WHERE slug = 'content-writing'), TRUE, NOW()),
((SELECT id FROM PAPS WHERE title = 'Technical Writing Documentation'), (SELECT id FROM CATEGORY WHERE slug = 'writing'), FALSE, NOW()),

-- Podcast Production Services (enrique)
((SELECT id FROM PAPS WHERE title = 'Podcast Production Services'), (SELECT id FROM CATEGORY WHERE slug = 'audio-production'), TRUE, NOW()),
((SELECT id FROM PAPS WHERE title = 'Podcast Production Services'), (SELECT id FROM CATEGORY WHERE slug = 'audio-video'), FALSE, NOW()),

-- Data Analysis Project (hobbes)
((SELECT id FROM PAPS WHERE title = 'Data Analysis Project'), (SELECT id FROM CATEGORY WHERE slug = 'technology'), TRUE, NOW()),

-- UI/UX Design for Mobile App (calvin)
((SELECT id FROM PAPS WHERE title = 'UI/UX Design for Mobile App'), (SELECT id FROM CATEGORY WHERE slug = 'ui-ux-design'), TRUE, NOW()),
((SELECT id FROM PAPS WHERE title = 'UI/UX Design for Mobile App'), (SELECT id FROM CATEGORY WHERE slug = 'design'), FALSE, NOW()),
((SELECT id FROM PAPS WHERE title = 'UI/UX Design for Mobile App'), (SELECT id FROM CATEGORY WHERE slug = 'mobile-development'), FALSE, NOW());