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

-- ============================================
-- USER INTERESTS
-- ============================================

INSERT INTO USER_INTEREST (user_id, category_id, proficiency_level, added_at)
SELECT u.id, c.id, 
CASE 
  WHEN u.username = 'hassan' AND c.slug = 'web-development' THEN 4
  WHEN u.username = 'hassan' AND c.slug = 'mobile-development' THEN 3
  WHEN u.username = 'clement' AND c.slug = 'graphic-design' THEN 5
  WHEN u.username = 'clement' AND c.slug = 'ui-ux-design' THEN 4
  WHEN u.username = 'clement' AND c.slug = 'social-media' THEN 4
  WHEN u.username = 'osman' AND c.slug = 'seo' THEN 5
  WHEN u.username = 'osman' AND c.slug = 'video-editing' THEN 3
  WHEN u.username = 'enrique' AND c.slug = 'content-writing' THEN 4
  WHEN u.username = 'enrique' AND c.slug = 'audio-production' THEN 4
  WHEN u.username = 'hobbes' AND c.slug = 'technology' THEN 3
  WHEN u.username = 'calvin' AND c.slug = 'technology' THEN 4
  WHEN u.username = 'calvin' AND c.slug = 'design' THEN 3
END, NOW()
FROM "USER" u, CATEGORY c
WHERE (u.username, c.slug) IN (
  ('hassan', 'web-development'),
  ('hassan', 'mobile-development'),
  ('clement', 'graphic-design'),
  ('clement', 'ui-ux-design'),
  ('clement', 'social-media'),
  ('osman', 'seo'),
  ('osman', 'video-editing'),
  ('enrique', 'content-writing'),
  ('enrique', 'audio-production'),
  ('hobbes', 'technology'),
  ('calvin', 'technology'),
  ('calvin', 'design')
)
ON CONFLICT (user_id, category_id) DO NOTHING;

-- ============================================
-- USER EXPERIENCE
-- ============================================

INSERT INTO USER_EXPERIENCE (user_id, title, company, description, start_date, end_date, is_current, display_order, created_at)
SELECT u.id, 
CASE 
  WHEN u.username = 'hassan' AND display_order = 1 THEN 'Senior Web Developer'
  WHEN u.username = 'hassan' AND display_order = 2 THEN 'Mobile App Developer'
  WHEN u.username = 'clement' THEN 'Graphic Designer'
  WHEN u.username = 'osman' THEN 'SEO Specialist'
  WHEN u.username = 'enrique' AND display_order = 1 THEN 'Technical Writer'
  WHEN u.username = 'enrique' AND display_order = 2 THEN 'Content Creator'
END,
CASE 
  WHEN u.username = 'hassan' AND display_order = 1 THEN 'TechCorp'
  WHEN u.username = 'hassan' AND display_order = 2 THEN 'AppStudio'
  WHEN u.username = 'clement' THEN 'DesignAgency'
  WHEN u.username = 'osman' THEN 'DigitalMarketing Inc'
  WHEN u.username = 'enrique' AND display_order = 1 THEN 'DocuTech'
  WHEN u.username = 'enrique' AND display_order = 2 THEN 'MediaHouse'
END,
CASE 
  WHEN u.username = 'hassan' AND display_order = 1 THEN 'Developed full-stack web applications using React and Node.js'
  WHEN u.username = 'hassan' AND display_order = 2 THEN 'Built cross-platform mobile apps with React Native'
  WHEN u.username = 'clement' THEN 'Created visual designs for branding and marketing campaigns'
  WHEN u.username = 'osman' THEN 'Optimized websites for search engines and managed PPC campaigns'
  WHEN u.username = 'enrique' AND display_order = 1 THEN 'Wrote API documentation and user guides for software products'
  WHEN u.username = 'enrique' AND display_order = 2 THEN 'Produced podcast content and edited audio files'
END,
CASE 
  WHEN u.username = 'hassan' AND display_order = 1 THEN '2020-01-01'::DATE
  WHEN u.username = 'hassan' AND display_order = 2 THEN '2018-06-01'::DATE
  WHEN u.username = 'clement' THEN '2019-03-01'::DATE
  WHEN u.username = 'osman' THEN '2021-01-01'::DATE
  WHEN u.username = 'enrique' AND display_order = 1 THEN '2019-09-01'::DATE
  WHEN u.username = 'enrique' AND display_order = 2 THEN '2017-05-01'::DATE
END,
CASE 
  WHEN u.username = 'hassan' AND display_order = 2 THEN '2019-12-31'::DATE
  WHEN u.username = 'enrique' AND display_order = 2 THEN '2019-08-31'::DATE
  ELSE NULL
END,
CASE 
  WHEN u.username IN ('hassan', 'clement', 'osman', 'enrique') AND display_order = 1 THEN TRUE
  ELSE FALSE
END,
display_order, NOW()
FROM "USER" u
CROSS JOIN (VALUES (1), (2)) AS t(display_order)
WHERE (u.username = 'hassan' AND display_order IN (1,2)) OR
      (u.username = 'clement' AND display_order = 1) OR
      (u.username = 'osman' AND display_order = 1) OR
      (u.username = 'enrique' AND display_order IN (1,2))
ON CONFLICT DO NOTHING;

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

-- ============================================
-- PAPS MEDIA
-- ============================================

INSERT INTO PAPS_MEDIA (paps_id, media_type, media_url, thumbnail_url, file_size_bytes, mime_type, display_order, uploaded_at) VALUES
-- Full-Stack Web Developer (hassan) - image
((SELECT id FROM PAPS WHERE title = 'Full-Stack Web Developer Needed'), 'image', 'https://example.com/media/post/paps_media_123e4567-e89b-12d3-a456-426614174000_1.png', NULL, 2048576, 'image/png', 1, NOW()),

-- Mobile App Development (hassan) - video
((SELECT id FROM PAPS WHERE title = 'Mobile App Development'), 'video', 'https://example.com/media/post/paps_media_123e4567-e89b-12d3-a456-426614174000_2.mp4', 'https://example.com/media/post/paps_media_123e4567-e89b-12d3-a456-426614174000_1.png', 15728640, 'video/mp4', 1, NOW()),

-- Video Editing for YouTube Channel (osman) - video
((SELECT id FROM PAPS WHERE title = 'Video Editing for YouTube Channel'), 'video', 'https://example.com/media/post/paps_media_123e4567-e89b-12d3-a456-426614174000_2.mp4', NULL, 15728640, 'video/mp4', 1, NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- SPAP (JOB APPLICATIONS)
-- ============================================

INSERT INTO SPAP (paps_id, applicant_id, status, applicant_message, proposed_payment_amount, applied_at, reviewed_at, accepted_at, rejected_at) VALUES
-- Hobbes applies to Hassan's web dev job - accepted
((SELECT id FROM PAPS WHERE title = 'Full-Stack Web Developer Needed'), (SELECT id FROM "USER" WHERE username = 'hobbes'), 'accepted', 'I have extensive experience in full-stack development and would love to work on this project.', NULL, '2026-01-16 10:00:00', '2026-01-17 14:00:00', '2026-01-17 14:00:00', NULL),

-- Osman applies to Enrique's writing job - pending
((SELECT id FROM PAPS WHERE title = 'Technical Writing Documentation'), (SELECT id FROM "USER" WHERE username = 'osman'), 'pending', 'I have strong technical writing skills and API documentation experience.', NULL, '2026-01-19 09:00:00', NULL, NULL, NULL),

-- Clement applies to Calvin's UI/UX job - accepted
((SELECT id FROM PAPS WHERE title = 'UI/UX Design for Mobile App'), (SELECT id FROM "USER" WHERE username = 'clement'), 'accepted', 'I specialize in UI/UX design for mobile applications.', NULL, '2026-01-18 11:00:00', '2026-01-19 16:00:00', '2026-01-19 16:00:00', NULL),

-- Enrique applies to Osman's video editing - rejected
((SELECT id FROM PAPS WHERE title = 'Video Editing for YouTube Channel'), (SELECT id FROM "USER" WHERE username = 'enrique'), 'rejected', 'I have some video editing experience and would like to contribute.', NULL, '2026-01-17 13:00:00', '2026-01-18 10:00:00', NULL, '2026-01-18 10:00:00'),

-- Hassan applies to Hobbes' data analysis - accepted
((SELECT id FROM PAPS WHERE title = 'Data Analysis Project'), (SELECT id FROM "USER" WHERE username = 'hassan'), 'accepted', 'I have Python and data analysis skills perfect for this project.', NULL, '2026-01-20 08:00:00', '2026-01-21 12:00:00', '2026-01-21 12:00:00', NULL)
ON CONFLICT (paps_id, applicant_id) DO NOTHING;

-- ============================================
-- ASAP (ASSIGNED JOBS)
-- ============================================

INSERT INTO ASAP (paps_id, accepted_spap_id, status, assigned_at, started_at, completed_at, completion_notes, created_at, updated_at) VALUES
-- Hobbes assigned to Hassan's web dev job
((SELECT id FROM PAPS WHERE title = 'Full-Stack Web Developer Needed' LIMIT 1), (SELECT id FROM SPAP WHERE paps_id = (SELECT id FROM PAPS WHERE title = 'Full-Stack Web Developer Needed' LIMIT 1) AND applicant_id = (SELECT id FROM "USER" WHERE username = 'hobbes') LIMIT 1), 'assigned', '2026-01-17 14:00:00', NULL, NULL, NULL, NOW(), NOW()),

-- Clement assigned to Calvin's UI/UX job - completed
((SELECT id FROM PAPS WHERE title = 'UI/UX Design for Mobile App' LIMIT 1), (SELECT id FROM SPAP WHERE paps_id = (SELECT id FROM PAPS WHERE title = 'UI/UX Design for Mobile App' LIMIT 1) AND applicant_id = (SELECT id FROM "USER" WHERE username = 'clement') LIMIT 1), 'completed', '2026-01-19 16:00:00', '2026-01-20 09:00:00', '2026-01-25 17:00:00', 'Successfully redesigned the UI with improved user flows and modern design elements.', NOW(), NOW()),

-- Hassan assigned to Hobbes' data analysis job - in progress
((SELECT id FROM PAPS WHERE title = 'Data Analysis Project' LIMIT 1), (SELECT id FROM SPAP WHERE paps_id = (SELECT id FROM PAPS WHERE title = 'Data Analysis Project' LIMIT 1) AND applicant_id = (SELECT id FROM "USER" WHERE username = 'hassan') LIMIT 1), 'in_progress', '2026-01-21 12:00:00', '2026-01-22 10:00:00', NULL, NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- ASAP ASSIGNEE
-- ============================================

INSERT INTO ASAP_ASSIGNEE (asap_id, user_id, ROLE, assigned_at, is_active) VALUES
-- Hobbes as member for web dev
((SELECT id FROM ASAP WHERE paps_id = (SELECT id FROM PAPS WHERE title = 'Full-Stack Web Developer Needed' LIMIT 1) LIMIT 1), (SELECT id FROM "USER" WHERE username = 'hobbes'), 'member', '2026-01-17 14:00:00', TRUE),

-- Clement as lead for UI/UX
((SELECT id FROM ASAP WHERE paps_id = (SELECT id FROM PAPS WHERE title = 'UI/UX Design for Mobile App' LIMIT 1) LIMIT 1), (SELECT id FROM "USER" WHERE username = 'clement'), 'lead', '2026-01-19 16:00:00', TRUE),

-- Hassan as member for data analysis
((SELECT id FROM ASAP WHERE paps_id = (SELECT id FROM PAPS WHERE title = 'Data Analysis Project' LIMIT 1) LIMIT 1), (SELECT id FROM "USER" WHERE username = 'hassan'), 'member', '2026-01-21 12:00:00', TRUE)
ON CONFLICT (asap_id, user_id) DO NOTHING;

-- ============================================
-- PAYMENT
-- ============================================

INSERT INTO PAYMENT (asap_id, payer_id, payee_id, amount, currency, status, transaction_id, paid_at, created_at, updated_at) VALUES
-- Calvin pays Clement for UI/UX work
((SELECT id FROM ASAP WHERE paps_id = (SELECT id FROM PAPS WHERE title = 'UI/UX Design for Mobile App' LIMIT 1) LIMIT 1), (SELECT id FROM "USER" WHERE username = 'calvin'), (SELECT id FROM "USER" WHERE username = 'clement'), 1350.00, 'USD', 'completed', 'txn_1234567890', '2026-01-26 10:00:00', NOW(), NOW())
ON CONFLICT (asap_id) DO NOTHING;

-- ============================================
-- RATING
-- ============================================

INSERT INTO RATING (asap_id, rater_id, rated_id, score, COMMENT, rating_type, created_at, updated_at) VALUES
-- Calvin rates Clement for UI/UX work
((SELECT id FROM ASAP WHERE paps_id = (SELECT id FROM PAPS WHERE title = 'UI/UX Design for Mobile App' LIMIT 1) LIMIT 1), (SELECT id FROM "USER" WHERE username = 'calvin'), (SELECT id FROM "USER" WHERE username = 'clement'), 5, 'Excellent work on the UI redesign. Very professional and creative.', 'overall', NOW(), NOW()),
((SELECT id FROM ASAP WHERE paps_id = (SELECT id FROM PAPS WHERE title = 'UI/UX Design for Mobile App' LIMIT 1) LIMIT 1), (SELECT id FROM "USER" WHERE username = 'calvin'), (SELECT id FROM "USER" WHERE username = 'clement'), 5, 'Great communication and attention to detail.', 'communication', NOW(), NOW()),
((SELECT id FROM ASAP WHERE paps_id = (SELECT id FROM PAPS WHERE title = 'UI/UX Design for Mobile App' LIMIT 1) LIMIT 1), (SELECT id FROM "USER" WHERE username = 'calvin'), (SELECT id FROM "USER" WHERE username = 'clement'), 5, 'Delivered high-quality designs on time.', 'professionalism', NOW(), NOW()),

-- Clement rates Calvin for the job posting
((SELECT id FROM ASAP WHERE paps_id = (SELECT id FROM PAPS WHERE title = 'UI/UX Design for Mobile App' LIMIT 1) LIMIT 1), (SELECT id FROM "USER" WHERE username = 'clement'), (SELECT id FROM "USER" WHERE username = 'calvin'), 4, 'Clear requirements and timely feedback.', 'overall', NOW(), NOW()),
((SELECT id FROM ASAP WHERE paps_id = (SELECT id FROM PAPS WHERE title = 'UI/UX Design for Mobile App' LIMIT 1) LIMIT 1), (SELECT id FROM "USER" WHERE username = 'clement'), (SELECT id FROM "USER" WHERE username = 'calvin'), 4, 'Professional and responsive.', 'communication', NOW(), NOW())
ON CONFLICT (asap_id, rater_id, rated_id, rating_type) DO NOTHING;

-- ============================================
-- COMMENT
-- ============================================

-- Main comments
INSERT INTO COMMENT (paps_id, user_id, content, created_at, updated_at) VALUES
((SELECT id FROM PAPS WHERE title = 'Full-Stack Web Developer Needed'), (SELECT id FROM "USER" WHERE username = 'hobbes'), 'This looks like a great project! Do you have any specific tech stack preferences?', NOW(), NOW()),
((SELECT id FROM PAPS WHERE title = 'UI/UX Design for Mobile App'), (SELECT id FROM "USER" WHERE username = 'enrique'), 'Can you provide more details about the current app?', NOW(), NOW()),
((SELECT id FROM PAPS WHERE title = 'Video Editing for YouTube Channel'), (SELECT id FROM "USER" WHERE username = 'clement'), 'What software do you use for editing?', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Reply comments
INSERT INTO COMMENT (paps_id, user_id, parent_id, content, created_at, updated_at) VALUES
((SELECT id FROM PAPS WHERE title = 'Full-Stack Web Developer Needed'), (SELECT id FROM "USER" WHERE username = 'hassan'), (SELECT id FROM COMMENT WHERE paps_id = (SELECT id FROM PAPS WHERE title = 'Full-Stack Web Developer Needed') AND user_id = (SELECT id FROM "USER" WHERE username = 'hobbes') AND parent_id IS NULL LIMIT 1), 'React for frontend and Node.js for backend would be ideal.', NOW(), NOW()),
((SELECT id FROM PAPS WHERE title = 'UI/UX Design for Mobile App'), (SELECT id FROM "USER" WHERE username = 'calvin'), (SELECT id FROM COMMENT WHERE paps_id = (SELECT id FROM PAPS WHERE title = 'UI/UX Design for Mobile App') AND user_id = (SELECT id FROM "USER" WHERE username = 'enrique') AND parent_id IS NULL LIMIT 1), 'It''s an iOS app for fitness tracking. I can share screenshots.', NOW(), NOW())
ON CONFLICT DO NOTHING;