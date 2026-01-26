--
-- Static Test Data for Underboss
-- This file populates the database with test data
--
-- IMPORTANT: This uses the UUID-based schema
-- Admin users (calvin/hobbes) and additional test users are added statically
--

-- ============================================
-- ROLES
-- ============================================
INSERT INTO ROLE (id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Administrator with full access'),
  ('00000000-0000-0000-0000-000000000002', 'user', 'Regular user'),
  ('00000000-0000-0000-0000-000000000003', 'moderator', 'Content moderator');

-- ============================================
-- ADMIN USERS (calvin and hobbes)
-- ============================================
-- calvin:hobbes (admin), hobbes:calvin (user)
-- Passwords hashed with bcrypt rounds=4
INSERT INTO "USER" (id, username, email, password_hash, role_id, is_verified) VALUES
  ('00000000-0000-0000-0000-000000000101', 'calvin', 'calvin@test.com', '$2b$04$qaD0DOXO4TqiHOuQVqJji.qiam5qpiXVYa7/OcnhctnzYNY3cfijS', '00000000-0000-0000-0000-000000000001', TRUE),
  ('00000000-0000-0000-0000-000000000102', 'hobbes', 'hobbes@test.com', '$2b$04$GwzU.F2cQ58I.K6oLO89fOGboeDizJChaDuJ4gXmU4kYVguhvcXPC', '00000000-0000-0000-0000-000000000002', TRUE);

-- ============================================
-- STATIC TEST USERS
-- ============================================
-- hassan, clement, osman, enrique
-- All passwords are '123' (bcrypt hashed with rounds=12)
INSERT INTO "USER" (id, username, email, password_hash, role_id, is_verified) VALUES
  ('00000000-0000-0000-0000-000000000201', 'hassan', 'hassan@test.com', '$2b$12$xv7JrnyBduNMbEA/Js2HGub/uxW997pXU/ujpqhl5ZUErWnm6toVm', '00000000-0000-0000-0000-000000000002', TRUE),
  ('00000000-0000-0000-0000-000000000202', 'clement', 'clement@test.com', '$2b$12$xv7JrnyBduNMbEA/Js2HGub/uxW997pXU/ujpqhl5ZUErWnm6toVm', '00000000-0000-0000-0000-000000000002', TRUE),
  ('00000000-0000-0000-0000-000000000203', 'osman', 'osman@test.com', '$2b$12$xv7JrnyBduNMbEA/Js2HGub/uxW997pXU/ujpqhl5ZUErWnm6toVm', '00000000-0000-0000-0000-000000000002', TRUE),
  ('00000000-0000-0000-0000-000000000204', 'enrique', 'enrique@test.com', '$2b$12$xv7JrnyBduNMbEA/Js2HGub/uxW997pXU/ujpqhl5ZUErWnm6toVm', '00000000-0000-0000-0000-000000000002', TRUE);

-- ============================================
-- USER PROFILES (auto-created by trigger, update details)
-- ============================================
UPDATE USER_PROFILE SET
  first_name = 'Calvin',
  last_name = 'Admin',
  display_name = 'Calvin the Admin',
  bio = 'System administrator and test account',
  location_address = 'Paris, France',
  location_lat = 48.8566,
  location_lng = 2.3522,
  avatar_url = 'media/user/profile/00000000-0000-0000-0000-000000000101.jpg'
WHERE user_id = '00000000-0000-0000-0000-000000000101';

UPDATE USER_PROFILE SET
  first_name = 'Hobbes',
  last_name = 'User',
  display_name = 'Hobbes the Tiger',
  bio = 'Regular test user account',
  location_address = 'Lyon, France',
  location_lat = 45.7640,
  location_lng = 4.8357,
  avatar_url = 'media/user/profile/00000000-0000-0000-0000-000000000102.jpg'
WHERE user_id = '00000000-0000-0000-0000-000000000102';

UPDATE USER_PROFILE SET
  first_name = 'Hassan',
  last_name = 'Developer',
  display_name = 'Hassan Dev',
  bio = 'Full-stack developer passionate about creating awesome apps.',
  location_address = 'Paris, France',
  location_lat = 48.8566,
  location_lng = 2.3522,
  avatar_url = 'media/user/profile/00000000-0000-0000-0000-000000000201.jpg'
WHERE user_id = '00000000-0000-0000-0000-000000000201';

UPDATE USER_PROFILE SET
  first_name = 'Clement',
  last_name = 'Designer',
  display_name = 'Clement D',
  bio = 'UI/UX designer with 5 years of experience.',
  location_address = 'Lyon, France',
  location_lat = 45.7640,
  location_lng = 4.8357,
  avatar_url = 'media/user/profile/00000000-0000-0000-0000-000000000202.jpg'
WHERE user_id = '00000000-0000-0000-0000-000000000202';

UPDATE USER_PROFILE SET
  first_name = 'Osman',
  last_name = 'Engineer',
  display_name = 'Osman E',
  bio = 'Data engineer specializing in big data solutions.',
  location_address = 'Marseille, France',
  location_lat = 43.2965,
  location_lng = 5.3698,
  avatar_url = 'media/user/profile/00000000-0000-0000-0000-000000000203.jpg'
WHERE user_id = '00000000-0000-0000-0000-000000000203';

UPDATE USER_PROFILE SET
  first_name = 'Enrique',
  last_name = 'Marketing',
  display_name = 'Enrique M',
  bio = 'Digital marketing expert with focus on SEO.',
  location_address = 'Nice, France',
  location_lat = 43.7102,
  location_lng = 7.2620,
  avatar_url = 'media/user/profile/00000000-0000-0000-0000-000000000204.jpg'
WHERE user_id = '00000000-0000-0000-0000-000000000204';

-- ============================================
-- USER EXPERIENCES
-- ============================================
INSERT INTO USER_EXPERIENCE (id, user_id, title, company, description, start_date, end_date, is_current, display_order) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000201', 'Senior Developer', 'TechCorp', 'Building scalable web applications', '2020-01-01', NULL, TRUE, 1),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000201', 'Junior Developer', 'StartupXYZ', 'Full-stack development', '2018-06-01', '2019-12-31', FALSE, 2),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000202', 'Lead Designer', 'DesignStudio', 'Leading the design team', '2019-03-01', NULL, TRUE, 1),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000203', 'Data Engineer', 'DataCo', 'Building ETL pipelines', '2021-01-01', NULL, TRUE, 1),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000204', 'Marketing Manager', 'AdAgency', 'Managing digital campaigns', '2020-06-01', NULL, TRUE, 1);

-- ============================================
-- CATEGORIES
-- ============================================
INSERT INTO CATEGORY (id, name, slug, description, icon_url) VALUES
  ('00000000-0000-0000-0002-000000000001', 'Web Development', 'web-development', 'Web development services including frontend and backend', '/media/category/web-development.png'),
  ('00000000-0000-0000-0002-000000000002', 'Mobile Development', 'mobile-development', 'Mobile app development for iOS and Android', '/media/category/mobile-development.png'),
  ('00000000-0000-0000-0002-000000000003', 'Design', 'design', 'UI/UX design, graphic design, and branding', '/media/category/design.png'),
  ('00000000-0000-0000-0002-000000000004', 'Marketing', 'marketing', 'Digital marketing, SEO, and social media', '/media/category/marketing.png'),
  ('00000000-0000-0000-0002-000000000005', 'Data Science', 'data-science', 'Data analysis, machine learning, and AI', '/media/category/data-science.png'),
  ('00000000-0000-0000-0002-000000000006', 'Writing', 'writing', 'Content writing, copywriting, and editing', '/media/category/writing.png'),
  ('00000000-0000-0000-0002-000000000007', 'Photography', 'photography', 'Photo and video services', '/media/category/photography.png'),
  ('00000000-0000-0000-0002-000000000008', 'Music', 'music', 'Music production and audio services', '/media/category/music.png');

-- ============================================
-- USER INTERESTS
-- ============================================
-- Hassan interests
INSERT INTO USER_INTEREST (user_id, category_id, proficiency_level) VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0002-000000000001', 5),  -- Web Dev (expert)
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0002-000000000002', 4),  -- Mobile Dev
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0002-000000000005', 3);  -- Data Science

-- Clement interests
INSERT INTO USER_INTEREST (user_id, category_id, proficiency_level) VALUES
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0002-000000000003', 5),  -- Design (expert)
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0002-000000000001', 3),  -- Web Dev
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0002-000000000007', 4);  -- Photography

-- Osman interests
INSERT INTO USER_INTEREST (user_id, category_id, proficiency_level) VALUES
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0002-000000000005', 5),  -- Data Science (expert)
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0002-000000000001', 4),  -- Web Dev
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0002-000000000002', 3);  -- Mobile Dev

-- Enrique interests
INSERT INTO USER_INTEREST (user_id, category_id, proficiency_level) VALUES
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0002-000000000004', 5),  -- Marketing (expert)
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0002-000000000006', 4),  -- Writing
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0002-000000000003', 3);  -- Design

-- ============================================
-- PAPS (Job Posts)
-- ============================================
-- Hassan's jobs
INSERT INTO PAPS (id, owner_id, title, subtitle, description, status, location_address, location_lat, location_lng, payment_amount, payment_currency, payment_type, max_applicants, is_public, publish_at, start_datetime) VALUES
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000201', 'Build a Modern E-commerce Website', 'Full-stack development needed', 'Looking for an experienced developer to build a complete e-commerce website using React and Node.js. Must include payment integration, user authentication, and admin dashboard.', 'published', 'Paris, France', 48.8566, 2.3522, 5000.00, 'EUR', 'fixed', 5, TRUE, NOW(), NOW() + INTERVAL '7 days'),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000201', 'Mobile App Development Project', 'iOS and Android app needed', 'Need a mobile developer to create a cross-platform app for our delivery service. Should include real-time tracking, push notifications, and payment integration.', 'published', 'Paris, France', 48.8566, 2.3522, 8000.00, 'EUR', 'fixed', 3, TRUE, NOW(), NOW() + INTERVAL '14 days');

-- Clement's jobs
INSERT INTO PAPS (id, owner_id, title, subtitle, description, status, location_address, location_lat, location_lng, payment_amount, payment_currency, payment_type, max_applicants, is_public, publish_at, start_datetime) VALUES
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000202', 'Redesign Company Brand Identity', 'Complete brand refresh needed', 'Looking for a talented designer to revamp our entire brand identity including logo, color palette, typography, and brand guidelines document.', 'published', 'Lyon, France', 45.7640, 4.8357, 3000.00, 'EUR', 'fixed', 10, TRUE, NOW(), NOW() + INTERVAL '10 days'),
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0000-000000000202', 'UI/UX Design for Mobile Application', 'App design with prototypes', 'Need comprehensive UI/UX design for a fitness tracking app. Must include wireframes, mockups, and interactive prototypes for both iOS and Android.', 'draft', 'Lyon, France', 45.7640, 4.8357, 2500.00, 'EUR', 'fixed', 5, TRUE, NULL, NULL);

-- Osman's jobs
INSERT INTO PAPS (id, owner_id, title, subtitle, description, status, location_address, location_lat, location_lng, payment_amount, payment_currency, payment_type, max_applicants, is_public, publish_at, start_datetime) VALUES
  ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000203', 'Data Pipeline Implementation', 'ETL pipeline development', 'Looking for a data engineer to build a scalable ETL pipeline using Apache Spark and AWS services. Should handle large volumes of real-time data processing.', 'published', 'Marseille, France', 43.2965, 5.3698, 6000.00, 'EUR', 'fixed', 3, TRUE, NOW(), NOW() + INTERVAL '21 days');

-- Enrique's jobs
INSERT INTO PAPS (id, owner_id, title, subtitle, description, status, location_address, location_lat, location_lng, payment_amount, payment_currency, payment_type, max_applicants, is_public, publish_at, start_datetime) VALUES
  ('00000000-0000-0000-0003-000000000006', '00000000-0000-0000-0000-000000000204', 'SEO Optimization Campaign', 'Improve website ranking', 'Need an SEO expert to perform comprehensive website audit and implement optimization strategies. Goal is to improve organic search rankings by 50%.', 'published', 'Nice, France', 43.7102, 7.2620, 1500.00, 'EUR', 'hourly', 8, TRUE, NOW(), NOW() + INTERVAL '5 days');

-- ============================================
-- PAPS CATEGORIES
-- ============================================
INSERT INTO PAPS_CATEGORY (paps_id, category_id, is_primary) VALUES
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000001', TRUE),   -- E-commerce: Web Development
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000002', TRUE),   -- Mobile App: Mobile Development
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000001', FALSE),  -- Mobile App: Web Development (secondary)
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000003', TRUE),   -- Brand Identity: Design
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0002-000000000003', TRUE),   -- UI/UX: Design
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0002-000000000002', FALSE),  -- UI/UX: Mobile Development (secondary)
  ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0002-000000000005', TRUE),   -- Data Pipeline: Data Science
  ('00000000-0000-0000-0003-000000000006', '00000000-0000-0000-0002-000000000004', TRUE);   -- SEO: Marketing

-- ============================================
-- PAPS MEDIA (Job Post Images/Videos)
-- ============================================
INSERT INTO PAPS_MEDIA (id, paps_id, media_type, file_extension, file_size_bytes, mime_type, display_order) VALUES
  ('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0003-000000000001', 'image', 'jpg', 50000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0003-000000000001', 'image', 'jpg', 48000, 'image/jpeg', 2),
  ('00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0003-000000000002', 'image', 'jpg', 52000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000004', '00000000-0000-0000-0003-000000000003', 'image', 'jpg', 45000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000005', '00000000-0000-0000-0003-000000000004', 'image', 'jpg', 55000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000006', '00000000-0000-0000-0003-000000000005', 'image', 'jpg', 47000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000007', '00000000-0000-0000-0003-000000000006', 'image', 'jpg', 42000, 'image/jpeg', 1);

-- ============================================
-- SPAP (Job Applications)
-- ============================================
-- Clement applies to Hassan's e-commerce job
INSERT INTO SPAP (id, paps_id, applicant_id, status, message) VALUES
  ('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000202', 'pending', 'I have extensive experience in web design and can help create beautiful UI for your e-commerce site.');

-- Osman applies to Hassan's mobile app job
INSERT INTO SPAP (id, paps_id, applicant_id, status, message) VALUES
  ('00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000203', 'pending', 'I can help with the backend and data aspects of your mobile app.');

-- Hassan applies to Clement's brand job
INSERT INTO SPAP (id, paps_id, applicant_id, status, message, reviewed_at, accepted_at) VALUES
  ('00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000201', 'accepted', 'I have design experience as well and would love to help with web aspects of branding.', NOW(), NOW());

-- Enrique applies to Osman's data job
INSERT INTO SPAP (id, paps_id, applicant_id, status, message) VALUES
  ('00000000-0000-0000-0004-000000000004', '00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000204', 'pending', 'I can help with the marketing and presentation aspects of your data project.');

-- ============================================
-- COMMENTS
-- ============================================
-- Comments on Hassan's e-commerce job
INSERT INTO COMMENT (id, paps_id, user_id, content) VALUES
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000202', 'What is the expected timeline for this project?');
INSERT INTO COMMENT (id, paps_id, user_id, parent_id, content) VALUES
  ('00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0005-000000000001', 'We are looking at about 2-3 months for the full project.');
INSERT INTO COMMENT (id, paps_id, user_id, content) VALUES
  ('00000000-0000-0000-0005-000000000003', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000203', 'Is remote work acceptable for this position?');
INSERT INTO COMMENT (id, paps_id, user_id, parent_id, content) VALUES
  ('00000000-0000-0000-0005-000000000004', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0005-000000000003', 'Yes, fully remote is fine!');

-- Comments on Clement's brand job
INSERT INTO COMMENT (id, paps_id, user_id, content) VALUES
  ('00000000-0000-0000-0005-000000000005', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000204', 'Do you have any existing brand guidelines we should follow?');
INSERT INTO COMMENT (id, paps_id, user_id, parent_id, content) VALUES
  ('00000000-0000-0000-0005-000000000006', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0005-000000000005', 'We want a complete refresh, so feel free to be creative.');

-- Comments on Osman's data job
INSERT INTO COMMENT (id, paps_id, user_id, content) VALUES
  ('00000000-0000-0000-0005-000000000007', '00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000201', 'What is the expected data volume per day?');
INSERT INTO COMMENT (id, paps_id, user_id, parent_id, content) VALUES
  ('00000000-0000-0000-0005-000000000008', '00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0005-000000000007', 'We expect about 10GB of data per day initially, scaling to 100GB.');

-- ============================================
-- ASAP (Assigned Jobs) - For accepted applications
-- ============================================
INSERT INTO ASAP (id, paps_id, accepted_spap_id, assigned_at, status) VALUES
  ('00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0004-000000000003', NOW(), 'assigned');

-- ============================================
-- ASAP ASSIGNEES
-- ============================================
INSERT INTO ASAP_ASSIGNEE (asap_id, user_id, role) VALUES
  ('00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0000-000000000201', 'lead');

-- ============================================
-- CHAT THREADS
-- ============================================
-- Chat thread for Hassan's application to Clement's job
INSERT INTO CHAT_THREAD (id, paps_id, spap_id, thread_type, created_at) VALUES
  ('00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0004-000000000003', 'spap_discussion', NOW());

-- ============================================
-- CHAT PARTICIPANTS
-- ============================================
INSERT INTO CHAT_PARTICIPANT (thread_id, user_id, role, joined_at) VALUES
  ('00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0000-000000000201', 'applicant', NOW()),
  ('00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0000-000000000202', 'owner', NOW());

-- ============================================
-- CHAT MESSAGES
-- ============================================
INSERT INTO CHAT_MESSAGE (id, thread_id, sender_id, content, sent_at) VALUES
  ('00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0000-000000000202', 'Hi Hassan! Thanks for applying. When can you start?', NOW() - INTERVAL '2 hours'),
  ('00000000-0000-0000-0008-000000000002', '00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0000-000000000201', 'Hi Clement! I can start next week.', NOW() - INTERVAL '1 hour'),
  ('00000000-0000-0000-0008-000000000003', '00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0000-000000000202', 'Perfect! Let me send you the details.', NOW() - INTERVAL '30 minutes');

-- ============================================
-- End of static test data
-- ============================================
