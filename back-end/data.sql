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
  last_name = 'Anderson',
  display_name = 'Calvin the Admin',
  bio = 'System administrator and security expert. Passionate about keeping systems secure and running smoothly.',
  location_address = 'Paris, France',
  location_lat = 48.8566,
  location_lng = 2.3522,
  avatar_url = '/media/user/profile/00000000-0000-0000-0000-000000000101.jpg'
WHERE user_id = '00000000-0000-0000-0000-000000000101';

UPDATE USER_PROFILE SET
  first_name = 'Hobbes',
  last_name = 'Thompson',
  display_name = 'Hobbes the Tiger',
  bio = 'Creative professional specializing in video editing and content creation. Always exploring new storytelling techniques.',
  location_address = 'Lyon, France',
  location_lat = 45.7640,
  location_lng = 4.8357,
  avatar_url = '/media/user/profile/00000000-0000-0000-0000-000000000102.jpg'
WHERE user_id = '00000000-0000-0000-0000-000000000102';

UPDATE USER_PROFILE SET
  first_name = 'Hassan',
  last_name = 'Benali',
  display_name = 'Hassan Dev',
  bio = 'Full-stack developer passionate about creating awesome web and mobile applications. Specialized in React, Node.js, and Python.',
  location_address = 'Paris, France',
  location_lat = 48.8566,
  location_lng = 2.3522,
  avatar_url = '/media/user/profile/00000000-0000-0000-0000-000000000201.jpg'
WHERE user_id = '00000000-0000-0000-0000-000000000201';

UPDATE USER_PROFILE SET
  first_name = 'Clement',
  last_name = 'Dubois',
  display_name = 'Clement D',
  bio = 'UI/UX designer with 5 years of experience. Expert in creating beautiful, user-friendly interfaces that people love to use.',
  location_address = 'Lyon, France',
  location_lat = 45.7640,
  location_lng = 4.8357,
  avatar_url = '/media/user/profile/00000000-0000-0000-0000-000000000202.jpg'
WHERE user_id = '00000000-0000-0000-0000-000000000202';

UPDATE USER_PROFILE SET
  first_name = 'Osman',
  last_name = 'Yilmaz',
  display_name = 'Osman E',
  bio = 'Data engineer specializing in big data solutions, ETL pipelines, and machine learning infrastructure. Love working with Python and Spark.',
  location_address = 'Marseille, France',
  location_lat = 43.2965,
  location_lng = 5.3698,
  avatar_url = '/media/user/profile/00000000-0000-0000-0000-000000000203.jpg'
WHERE user_id = '00000000-0000-0000-0000-000000000203';

UPDATE USER_PROFILE SET
  first_name = 'Enrique',
  last_name = 'Garcia',
  display_name = 'Enrique M',
  bio = 'Digital marketing expert with focus on SEO, content strategy, and social media marketing. Results-driven approach to growing online presence.',
  location_address = 'Nice, France',
  location_lat = 43.7102,
  location_lng = 7.2620,
  avatar_url = '/media/user/profile/00000000-0000-0000-0000-000000000204.jpg'
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
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000201', 'Mobile App Development Project', 'iOS and Android app needed', 'Need a mobile developer to create a cross-platform app for our delivery service. Should include real-time tracking, push notifications, and payment integration.', 'published', 'Paris, France', 48.8566, 2.3522, 8000.00, 'EUR', 'fixed', 3, TRUE, NOW(), NOW() + INTERVAL '14 days'),
  ('00000000-0000-0000-0003-000000000013', '00000000-0000-0000-0000-000000000201', 'Python Backend API Development', 'REST API for SaaS platform', 'Need to build a robust REST API using FastAPI/Django. Should include authentication, rate limiting, and comprehensive documentation. PostgreSQL database integration required.', 'published', 'Paris, France', 48.8566, 2.3522, 4500.00, 'EUR', 'fixed', 5, TRUE, NOW(), NOW() + INTERVAL '10 days'),
  ('00000000-0000-0000-0003-000000000014', '00000000-0000-0000-0000-000000000201', 'DevOps Engineer Needed', 'CI/CD pipeline setup', 'Looking for DevOps engineer to set up complete CI/CD pipeline using GitHub Actions, Docker, and Kubernetes. Should include monitoring and logging solutions.', 'published', 'Paris, France', 48.8566, 2.3522, 3500.00, 'EUR', 'fixed', 4, TRUE, NOW(), NOW() + INTERVAL '15 days');

-- Clement's jobs
INSERT INTO PAPS (id, owner_id, title, subtitle, description, status, location_address, location_lat, location_lng, payment_amount, payment_currency, payment_type, max_applicants, is_public, publish_at, start_datetime) VALUES
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000202', 'Redesign Company Brand Identity', 'Complete brand refresh needed', 'Looking for a talented designer to revamp our entire brand identity including logo, color palette, typography, and brand guidelines document.', 'published', 'Lyon, France', 45.7640, 4.8357, 3000.00, 'EUR', 'fixed', 10, TRUE, NOW(), NOW() + INTERVAL '10 days'),
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0000-000000000202', 'UI/UX Design for Mobile Application', 'App design with prototypes', 'Need comprehensive UI/UX design for a fitness tracking app. Must include wireframes, mockups, and interactive prototypes for both iOS and Android.', 'draft', 'Lyon, France', 45.7640, 4.8357, 2500.00, 'EUR', 'fixed', 5, TRUE, NULL, NULL),
  ('00000000-0000-0000-0003-000000000015', '00000000-0000-0000-0000-000000000202', 'Logo Design for Tech Startup', 'Modern minimalist logo needed', 'Looking for a creative designer to create a memorable logo for our tech startup. Should be modern, minimalist, and work well in both color and monochrome.', 'published', 'Lyon, France', 45.7640, 4.8357, 800.00, 'EUR', 'fixed', 15, TRUE, NOW(), NOW() + INTERVAL '5 days'),
  ('00000000-0000-0000-0003-000000000016', '00000000-0000-0000-0000-000000000202', 'Product Photography Session', 'Professional photos for e-commerce', 'Need professional photographer for product photography session. About 50 products need to be photographed with multiple angles and lighting setups.', 'published', 'Lyon, France', 45.7640, 4.8357, 1200.00, 'EUR', 'fixed', 8, TRUE, NOW(), NOW() + INTERVAL '8 days'),
  ('00000000-0000-0000-0003-000000000017', '00000000-0000-0000-0000-000000000202', 'Illustration Work for Children Book', 'Colorful illustrations needed', 'Looking for illustrator to create 20 colorful illustrations for a children book. Style should be playful, engaging, and appeal to 5-8 year olds.', 'published', 'Lyon, France', 45.7640, 4.8357, 2200.00, 'EUR', 'fixed', 10, TRUE, NOW(), NOW() + INTERVAL '20 days');

-- Osman's jobs
INSERT INTO PAPS (id, owner_id, title, subtitle, description, status, location_address, location_lat, location_lng, payment_amount, payment_currency, payment_type, max_applicants, is_public, publish_at, start_datetime) VALUES
  ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000203', 'Data Pipeline Implementation', 'ETL pipeline development', 'Looking for a data engineer to build a scalable ETL pipeline using Apache Spark and AWS services. Should handle large volumes of real-time data processing.', 'published', 'Marseille, France', 43.2965, 5.3698, 6000.00, 'EUR', 'fixed', 3, TRUE, NOW(), NOW() + INTERVAL '21 days'),
  ('00000000-0000-0000-0003-000000000018', '00000000-0000-0000-0000-000000000203', 'Machine Learning Model Development', 'Predictive analytics model', 'Need ML engineer to develop predictive model for customer churn. Should use Python, scikit-learn, and include model evaluation and deployment strategy.', 'published', 'Marseille, France', 43.2965, 5.3698, 5500.00, 'EUR', 'fixed', 4, TRUE, NOW(), NOW() + INTERVAL '18 days'),
  ('00000000-0000-0000-0003-000000000019', '00000000-0000-0000-0000-000000000203', 'Data Visualization Dashboard', 'Interactive analytics dashboard', 'Looking for developer to create interactive data visualization dashboard using D3.js or Plotly. Should connect to our API and update in real-time.', 'published', 'Marseille, France', 43.2965, 5.3698, 3800.00, 'EUR', 'fixed', 6, TRUE, NOW(), NOW() + INTERVAL '12 days');

-- Enrique's jobs
INSERT INTO PAPS (id, owner_id, title, subtitle, description, status, location_address, location_lat, location_lng, payment_amount, payment_currency, payment_type, max_applicants, is_public, publish_at, start_datetime) VALUES
  ('00000000-0000-0000-0003-000000000006', '00000000-0000-0000-0000-000000000204', 'SEO Optimization Campaign', 'Improve website ranking', 'Need an SEO expert to perform comprehensive website audit and implement optimization strategies. Goal is to improve organic search rankings by 50%.', 'published', 'Nice, France', 43.7102, 7.2620, 1500.00, 'EUR', 'hourly', 8, TRUE, NOW(), NOW() + INTERVAL '5 days'),
  ('00000000-0000-0000-0003-000000000020', '00000000-0000-0000-0000-000000000204', 'Content Writing for Blog', 'Technical blog articles', 'Looking for technical writer to create 10 high-quality blog articles about web development, DevOps, and cloud computing. Each article should be 1500-2000 words.', 'published', 'Nice, France', 43.7102, 7.2620, 2000.00, 'EUR', 'fixed', 12, TRUE, NOW(), NOW() + INTERVAL '25 days'),
  ('00000000-0000-0000-0003-000000000021', '00000000-0000-0000-0000-000000000204', 'Social Media Marketing Campaign', 'Instagram and Facebook ads', 'Need digital marketer to run social media ad campaigns on Instagram and Facebook. Budget is €500 for ads, payment is for management and optimization.', 'published', 'Nice, France', 43.7102, 7.2620, 1800.00, 'EUR', 'fixed', 10, TRUE, NOW(), NOW() + INTERVAL '7 days'),
  ('00000000-0000-0000-0003-000000000022', '00000000-0000-0000-0000-000000000204', 'Email Marketing Automation', 'Setup automated email sequences', 'Looking for marketing automation expert to set up email sequences in Mailchimp. Should include welcome series, abandoned cart, and re-engagement campaigns.', 'draft', 'Nice, France', 43.7102, 7.2620, 1200.00, 'EUR', 'fixed', 6, TRUE, NULL, NULL);

-- Hobbes's jobs
INSERT INTO PAPS (id, owner_id, title, subtitle, description, status, location_address, location_lat, location_lng, payment_amount, payment_currency, payment_type, max_applicants, is_public, publish_at, start_datetime) VALUES
  ('00000000-0000-0000-0003-000000000007', '00000000-0000-0000-0000-000000000102', 'Video Editing for YouTube Channel', 'Weekly video editing service', 'Need video editor for YouTube channel. Will provide raw footage, need edited videos with transitions, text overlays, and color grading. About 4 videos per month.', 'published', 'Lyon, France', 45.7640, 4.8357, 800.00, 'EUR', 'hourly', 10, TRUE, NOW(), NOW() + INTERVAL '3 days'),
  ('00000000-0000-0000-0003-000000000008', '00000000-0000-0000-0000-000000000102', 'Music Composition for Game', 'Original game soundtrack', 'Looking for composer to create original music for indie game. Need 5-6 tracks of varying moods (menu, gameplay, boss battle). Electronic/orchestral hybrid style preferred.', 'published', 'Lyon, France', 45.7640, 4.8357, 3500.00, 'EUR', 'fixed', 8, TRUE, NOW(), NOW() + INTERVAL '30 days'),
  ('00000000-0000-0000-0003-000000000009', '00000000-0000-0000-0000-000000000102', 'WordPress Website Setup', 'Business website with blog', 'Need WordPress expert to set up professional business website with blog functionality. Should include theme customization, plugin setup, and basic SEO configuration.', 'published', 'Lyon, France', 45.7640, 4.8357, 1500.00, 'EUR', 'fixed', 12, TRUE, NOW(), NOW() + INTERVAL '9 days');

-- Calvin's jobs
INSERT INTO PAPS (id, owner_id, title, subtitle, description, status, location_address, location_lat, location_lng, payment_amount, payment_currency, payment_type, max_applicants, is_public, publish_at, start_datetime) VALUES
  ('00000000-0000-0000-0003-000000000010', '00000000-0000-0000-0000-000000000101', 'Network Security Audit', 'Comprehensive security assessment', 'Looking for cybersecurity expert to perform comprehensive security audit of our infrastructure. Should include penetration testing, vulnerability assessment, and detailed report.', 'published', 'Paris, France', 48.8566, 2.3522, 7500.00, 'EUR', 'fixed', 3, TRUE, NOW(), NOW() + INTERVAL '14 days'),
  ('00000000-0000-0000-0003-000000000011', '00000000-0000-0000-0000-000000000101', 'Database Migration Project', 'MySQL to PostgreSQL migration', 'Need database expert to migrate our application from MySQL to PostgreSQL. Should include schema conversion, data migration, and query optimization.', 'published', 'Paris, France', 48.8566, 2.3522, 5000.00, 'EUR', 'fixed', 4, TRUE, NOW(), NOW() + INTERVAL '20 days'),
  ('00000000-0000-0000-0003-000000000012', '00000000-0000-0000-0000-000000000101', 'Technical Documentation Writer', 'API documentation and guides', 'Looking for technical writer to create comprehensive API documentation and user guides. Should be familiar with OpenAPI/Swagger and Markdown.', 'published', 'Paris, France', 48.8566, 2.3522, 2800.00, 'EUR', 'fixed', 8, TRUE, NOW(), NOW() + INTERVAL '15 days');

-- ============================================
-- PAPS CATEGORIES
-- ============================================
INSERT INTO PAPS_CATEGORY (paps_id, category_id, is_primary) VALUES
  -- Hassan's jobs
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000001', TRUE),   -- E-commerce: Web Development
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000002', TRUE),   -- Mobile App: Mobile Development
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000001', FALSE),  -- Mobile App: Web Development (secondary)
  ('00000000-0000-0000-0003-000000000013', '00000000-0000-0000-0002-000000000001', TRUE),   -- Python API: Web Development
  ('00000000-0000-0000-0003-000000000014', '00000000-0000-0000-0002-000000000001', TRUE),   -- DevOps: Web Development
  
  -- Clement's jobs
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000003', TRUE),   -- Brand Identity: Design
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0002-000000000003', TRUE),   -- UI/UX: Design
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0002-000000000002', FALSE),  -- UI/UX: Mobile Development (secondary)
  ('00000000-0000-0000-0003-000000000015', '00000000-0000-0000-0002-000000000003', TRUE),   -- Logo Design: Design
  ('00000000-0000-0000-0003-000000000016', '00000000-0000-0000-0002-000000000007', TRUE),   -- Product Photography: Photography
  ('00000000-0000-0000-0003-000000000017', '00000000-0000-0000-0002-000000000003', TRUE),   -- Illustration: Design
  
  -- Osman's jobs
  ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0002-000000000005', TRUE),   -- Data Pipeline: Data Science
  ('00000000-0000-0000-0003-000000000018', '00000000-0000-0000-0002-000000000005', TRUE),   -- ML Model: Data Science
  ('00000000-0000-0000-0003-000000000019', '00000000-0000-0000-0002-000000000005', TRUE),   -- Data Viz: Data Science
  ('00000000-0000-0000-0003-000000000019', '00000000-0000-0000-0002-000000000001', FALSE),  -- Data Viz: Web Development (secondary)
  
  -- Enrique's jobs
  ('00000000-0000-0000-0003-000000000006', '00000000-0000-0000-0002-000000000004', TRUE),   -- SEO: Marketing
  ('00000000-0000-0000-0003-000000000020', '00000000-0000-0000-0002-000000000006', TRUE),   -- Content Writing: Writing
  ('00000000-0000-0000-0003-000000000020', '00000000-0000-0000-0002-000000000004', FALSE),  -- Content Writing: Marketing (secondary)
  ('00000000-0000-0000-0003-000000000021', '00000000-0000-0000-0002-000000000004', TRUE),   -- Social Media: Marketing
  ('00000000-0000-0000-0003-000000000022', '00000000-0000-0000-0002-000000000004', TRUE),   -- Email Marketing: Marketing
  
  -- Hobbes's jobs
  ('00000000-0000-0000-0003-000000000007', '00000000-0000-0000-0002-000000000007', TRUE),   -- Video Editing: Photography (video)
  ('00000000-0000-0000-0003-000000000008', '00000000-0000-0000-0002-000000000008', TRUE),   -- Music Composition: Music
  ('00000000-0000-0000-0003-000000000009', '00000000-0000-0000-0002-000000000001', TRUE),   -- WordPress: Web Development
  
  -- Calvin's jobs
  ('00000000-0000-0000-0003-000000000010', '00000000-0000-0000-0002-000000000001', TRUE),   -- Security Audit: Web Development
  ('00000000-0000-0000-0003-000000000011', '00000000-0000-0000-0002-000000000005', TRUE),   -- Database Migration: Data Science
  ('00000000-0000-0000-0003-000000000012', '00000000-0000-0000-0002-000000000006', TRUE);   -- Tech Documentation: Writing

-- ============================================
-- PAPS MEDIA (Job Post Images/Videos)
-- ============================================
INSERT INTO PAPS_MEDIA (id, paps_id, media_type, file_extension, file_size_bytes, mime_type, display_order) VALUES
  -- Hassan's jobs
  ('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0003-000000000001', 'image', 'jpg', 50000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0003-000000000001', 'image', 'jpg', 48000, 'image/jpeg', 2),
  ('00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0003-000000000002', 'image', 'jpg', 52000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000030', '00000000-0000-0000-0003-000000000013', 'image', 'jpg', 45000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000031', '00000000-0000-0000-0003-000000000014', 'image', 'jpg', 48000, 'image/jpeg', 1),
  
  -- Clement's jobs
  ('00000000-0000-0000-0004-000000000004', '00000000-0000-0000-0003-000000000003', 'image', 'jpg', 45000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000005', '00000000-0000-0000-0003-000000000004', 'image', 'jpg', 55000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000032', '00000000-0000-0000-0003-000000000015', 'image', 'jpg', 42000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000033', '00000000-0000-0000-0003-000000000016', 'image', 'jpg', 58000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000034', '00000000-0000-0000-0003-000000000017', 'image', 'jpg', 53000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000035', '00000000-0000-0000-0003-000000000017', 'image', 'jpg', 51000, 'image/jpeg', 2),
  
  -- Osman's jobs
  ('00000000-0000-0000-0004-000000000006', '00000000-0000-0000-0003-000000000005', 'image', 'jpg', 47000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000036', '00000000-0000-0000-0003-000000000018', 'image', 'jpg', 49000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000037', '00000000-0000-0000-0003-000000000019', 'image', 'jpg', 54000, 'image/jpeg', 1),
  
  -- Enrique's jobs
  ('00000000-0000-0000-0004-000000000007', '00000000-0000-0000-0003-000000000006', 'image', 'jpg', 42000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000038', '00000000-0000-0000-0003-000000000020', 'image', 'jpg', 44000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000039', '00000000-0000-0000-0003-000000000021', 'image', 'jpg', 56000, 'image/jpeg', 1),
  
  -- Hobbes's jobs
  ('00000000-0000-0000-0004-000000000040', '00000000-0000-0000-0003-000000000007', 'video', 'mp4', 1500000, 'video/mp4', 1),
  ('00000000-0000-0000-0004-000000000041', '00000000-0000-0000-0003-000000000008', 'image', 'jpg', 47000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000042', '00000000-0000-0000-0003-000000000009', 'image', 'jpg', 43000, 'image/jpeg', 1),
  
  -- Calvin's jobs
  ('00000000-0000-0000-0004-000000000043', '00000000-0000-0000-0003-000000000010', 'image', 'jpg', 51000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000044', '00000000-0000-0000-0003-000000000011', 'image', 'jpg', 46000, 'image/jpeg', 1),
  ('00000000-0000-0000-0004-000000000045', '00000000-0000-0000-0003-000000000012', 'image', 'jpg', 48000, 'image/jpeg', 1);

-- ============================================
-- SPAP (Job Applications)
-- Note: Only pending/withdrawn/rejected SPAPs exist here
-- Accepted SPAPs are deleted when ASAP is created (per business rules)
-- ============================================
-- Applications to Hassan's jobs
INSERT INTO SPAP (id, paps_id, applicant_id, status, message) VALUES
  ('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000202', 'pending', 'I have extensive experience in web design and can help create beautiful UI for your e-commerce site.'),
  ('00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000203', 'pending', 'I can help with the backend and data aspects of your mobile app.'),
  ('00000000-0000-0000-0004-000000000050', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000204', 'pending', 'I can help with SEO and marketing strategies for your e-commerce platform to drive traffic.'),
  ('00000000-0000-0000-0004-000000000051', '00000000-0000-0000-0003-000000000013', '00000000-0000-0000-0000-000000000203', 'pending', 'Expert in Python, FastAPI, and PostgreSQL. I have built several similar REST APIs.'),
  ('00000000-0000-0000-0004-000000000052', '00000000-0000-0000-0003-000000000014', '00000000-0000-0000-0000-000000000102', 'pending', 'DevOps engineer with 5+ years experience in Docker, Kubernetes, and CI/CD pipelines.');

-- Applications to Clement's jobs
-- Note: Hassan's application to brand job (0003) was ACCEPTED, so SPAP was deleted and ASAP created
INSERT INTO SPAP (id, paps_id, applicant_id, status, message) VALUES
  ('00000000-0000-0000-0004-000000000053', '00000000-0000-0000-0003-000000000015', '00000000-0000-0000-0000-000000000201', 'pending', 'I specialize in modern minimalist logo design. Check out my portfolio!'),
  ('00000000-0000-0000-0004-000000000054', '00000000-0000-0000-0003-000000000015', '00000000-0000-0000-0000-000000000204', 'pending', 'Creative designer with 7 years experience in brand identity and logo design.'),
  ('00000000-0000-0000-0004-000000000055', '00000000-0000-0000-0003-000000000016', '00000000-0000-0000-0000-000000000102', 'pending', 'Professional photographer specializing in product photography with studio setup.'),
  ('00000000-0000-0000-0004-000000000056', '00000000-0000-0000-0003-000000000017', '00000000-0000-0000-0000-000000000204', 'pending', 'Illustrator with experience in children books. My style is colorful and engaging.');

-- Applications to Osman's jobs
INSERT INTO SPAP (id, paps_id, applicant_id, status, message) VALUES
  ('00000000-0000-0000-0004-000000000004', '00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000204', 'pending', 'I can help with the marketing and presentation aspects of your data project.'),
  ('00000000-0000-0000-0004-000000000057', '00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000201', 'pending', 'Experienced with Apache Spark, AWS EMR, and real-time data processing pipelines.'),
  ('00000000-0000-0000-0004-000000000058', '00000000-0000-0000-0003-000000000018', '00000000-0000-0000-0000-000000000201', 'pending', 'ML engineer with experience in customer analytics and churn prediction models.'),
  ('00000000-0000-0000-0004-000000000059', '00000000-0000-0000-0003-000000000019', '00000000-0000-0000-0000-000000000102', 'pending', 'Full-stack dev with expertise in D3.js and Plotly for data visualization.');

-- Applications to Enrique's jobs
INSERT INTO SPAP (id, paps_id, applicant_id, status, message) VALUES
  ('00000000-0000-0000-0004-000000000060', '00000000-0000-0000-0003-000000000006', '00000000-0000-0000-0000-000000000201', 'rejected', 'SEO specialist with proven track record of improving rankings.'),
  ('00000000-0000-0000-0004-000000000061', '00000000-0000-0000-0003-000000000020', '00000000-0000-0000-0000-000000000201', 'pending', 'Technical writer with development background. Can explain complex topics clearly.'),
  ('00000000-0000-0000-0004-000000000062', '00000000-0000-0000-0003-000000000020', '00000000-0000-0000-0000-000000000102', 'pending', 'Content writer with 8 years experience in technical blog writing.'),
  ('00000000-0000-0000-0004-000000000063', '00000000-0000-0000-0003-000000000021', '00000000-0000-0000-0000-000000000202', 'pending', 'Digital marketing expert specializing in social media advertising and optimization.');

-- Applications to Hobbes's jobs
INSERT INTO SPAP (id, paps_id, applicant_id, status, message) VALUES
  ('00000000-0000-0000-0004-000000000064', '00000000-0000-0000-0003-000000000007', '00000000-0000-0000-0000-000000000202', 'pending', 'Video editor with YouTube experience. Familiar with fast-paced editing and effects.'),
  ('00000000-0000-0000-0004-000000000065', '00000000-0000-0000-0003-000000000008', '00000000-0000-0000-0000-000000000204', 'pending', 'Composer specializing in game soundtracks. Can create electronic/orchestral hybrid music.'),
  ('00000000-0000-0000-0004-000000000066', '00000000-0000-0000-0003-000000000009', '00000000-0000-0000-0000-000000000201', 'pending', 'WordPress expert with 100+ sites built. Specialized in business websites and SEO.'),
  ('00000000-0000-0000-0004-000000000067', '00000000-0000-0000-0003-000000000009', '00000000-0000-0000-0000-000000000203', 'withdrawn', 'WordPress developer. (Withdrawn - found another opportunity)');

-- Applications to Calvin's jobs
INSERT INTO SPAP (id, paps_id, applicant_id, status, message) VALUES
  ('00000000-0000-0000-0004-000000000068', '00000000-0000-0000-0003-000000000010', '00000000-0000-0000-0000-000000000203', 'pending', 'Cybersecurity expert with OSCP certification. Experienced in pentesting and security audits.'),
  ('00000000-0000-0000-0004-000000000069', '00000000-0000-0000-0003-000000000011', '00000000-0000-0000-0000-000000000203', 'pending', 'Database architect specializing in PostgreSQL. Have done multiple MySQL to PG migrations.'),
  ('00000000-0000-0000-0004-000000000070', '00000000-0000-0000-0003-000000000012', '00000000-0000-0000-0000-000000000204', 'pending', 'Technical writer experienced with API documentation, OpenAPI, and developer docs.');

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

-- Comments on Hassan's mobile app job
INSERT INTO COMMENT (id, paps_id, user_id, content) VALUES
  ('00000000-0000-0000-0005-000000000030', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000102', 'What technology stack are you considering for this project?');
INSERT INTO COMMENT (id, paps_id, user_id, parent_id, content) VALUES
  ('00000000-0000-0000-0005-000000000031', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0005-000000000030', 'React Native preferred, but open to Flutter as well.');

-- Comments on Clement's brand job
INSERT INTO COMMENT (id, paps_id, user_id, content) VALUES
  ('00000000-0000-0000-0005-000000000005', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000204', 'Do you have any existing brand guidelines we should follow?');
INSERT INTO COMMENT (id, paps_id, user_id, parent_id, content) VALUES
  ('00000000-0000-0000-0005-000000000006', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0005-000000000005', 'We want a complete refresh, so feel free to be creative.');

-- Comments on Clement's logo design job
INSERT INTO COMMENT (id, paps_id, user_id, content) VALUES
  ('00000000-0000-0000-0005-000000000032', '00000000-0000-0000-0003-000000000015', '00000000-0000-0000-0000-000000000203', 'What industry is the startup in?');
INSERT INTO COMMENT (id, paps_id, user_id, parent_id, content) VALUES
  ('00000000-0000-0000-0005-000000000033', '00000000-0000-0000-0003-000000000015', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0005-000000000032', 'FinTech space, we want something that conveys trust and innovation.');

-- Comments on Osman's data job
INSERT INTO COMMENT (id, paps_id, user_id, content) VALUES
  ('00000000-0000-0000-0005-000000000007', '00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000201', 'What is the expected data volume per day?');
INSERT INTO COMMENT (id, paps_id, user_id, parent_id, content) VALUES
  ('00000000-0000-0000-0005-000000000008', '00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0005-000000000007', 'We expect about 10GB of data per day initially, scaling to 100GB.');

-- Comments on Osman's ML model job
INSERT INTO COMMENT (id, paps_id, user_id, content) VALUES
  ('00000000-0000-0000-0005-000000000034', '00000000-0000-0000-0003-000000000018', '00000000-0000-0000-0000-000000000202', 'Do you have historical data available for training?');
INSERT INTO COMMENT (id, paps_id, user_id, parent_id, content) VALUES
  ('00000000-0000-0000-0005-000000000035', '00000000-0000-0000-0003-000000000018', '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0005-000000000034', 'Yes, we have 3 years of customer data with features already extracted.');

-- Comments on Enrique's content writing job
INSERT INTO COMMENT (id, paps_id, user_id, content) VALUES
  ('00000000-0000-0000-0005-000000000036', '00000000-0000-0000-0003-000000000020', '00000000-0000-0000-0000-000000000203', 'Can you provide a list of topics you want covered?');
INSERT INTO COMMENT (id, paps_id, user_id, parent_id, content) VALUES
  ('00000000-0000-0000-0005-000000000037', '00000000-0000-0000-0003-000000000020', '00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0005-000000000036', 'Yes, I will share a detailed topic list with keywords and target audience.');

-- Comments on Hobbes's video editing job
INSERT INTO COMMENT (id, paps_id, user_id, content) VALUES
  ('00000000-0000-0000-0005-000000000038', '00000000-0000-0000-0003-000000000007', '00000000-0000-0000-0000-000000000201', 'What is the average length of each video?');
INSERT INTO COMMENT (id, paps_id, user_id, parent_id, content) VALUES
  ('00000000-0000-0000-0005-000000000039', '00000000-0000-0000-0003-000000000007', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0005-000000000038', 'Usually 10-15 minutes. Some may go up to 20 minutes.');

-- Comments on Calvin's security audit job
INSERT INTO COMMENT (id, paps_id, user_id, content) VALUES
  ('00000000-0000-0000-0005-000000000040', '00000000-0000-0000-0003-000000000010', '00000000-0000-0000-0000-000000000204', 'What is the scope - web application only or infrastructure as well?');
INSERT INTO COMMENT (id, paps_id, user_id, parent_id, content) VALUES
  ('00000000-0000-0000-0005-000000000041', '00000000-0000-0000-0003-000000000010', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0005-000000000040', 'Full scope including web app, API, database, and AWS infrastructure.');

-- ============================================
-- ASAP (Assigned Jobs) - For accepted applications
-- Note: ASAP is a minimal association table with only essential fields
-- All job details (title, location, payment, owner) are in PAPS
-- ============================================
INSERT INTO ASAP (id, paps_id, accepted_user_id, status, assigned_at) VALUES
  ('00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000201', 'active', NOW()),
  ('00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0003-000000000007', '00000000-0000-0000-0000-000000000202', 'active', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0003-000000000011', '00000000-0000-0000-0000-000000000203', 'completed', NOW() - INTERVAL '10 days');

-- ============================================
-- PAYMENTS (for completed ASAPs)
-- ============================================
-- No payments yet since no ASAP is completed

-- ============================================
-- CHAT THREADS
-- Note: Chat threads reference EITHER spap_id OR asap_id (mutually exclusive)
-- ============================================
-- Chat thread for pending application (clement -> hassan's e-commerce job)
INSERT INTO CHAT_THREAD (id, paps_id, spap_id, thread_type, created_at) VALUES
  ('00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0004-000000000001', 'spap_discussion', NOW());

-- Chat thread for pending application (osman -> hassan's mobile job)
INSERT INTO CHAT_THREAD (id, paps_id, spap_id, thread_type, created_at) VALUES
  ('00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0004-000000000002', 'spap_discussion', NOW());

-- Chat thread for ACCEPTED assignment (hassan's work on clement's brand job) - linked to ASAP now
INSERT INTO CHAT_THREAD (id, paps_id, asap_id, thread_type, created_at) VALUES
  ('00000000-0000-0000-0007-000000000003', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0006-000000000001', 'asap_discussion', NOW());

-- Chat thread for pending application (enrique -> osman's data job)
INSERT INTO CHAT_THREAD (id, paps_id, spap_id, thread_type, created_at) VALUES
  ('00000000-0000-0000-0007-000000000004', '00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0004-000000000004', 'spap_discussion', NOW());

-- Chat thread for ACCEPTED assignment (clement -> hobbes's video editing) - linked to ASAP
INSERT INTO CHAT_THREAD (id, paps_id, asap_id, thread_type, created_at) VALUES
  ('00000000-0000-0000-0007-000000000005', '00000000-0000-0000-0003-000000000007', '00000000-0000-0000-0006-000000000002', 'asap_discussion', NOW() - INTERVAL '2 days');

-- Chat thread for COMPLETED assignment (osman -> calvin's database migration) - linked to ASAP
INSERT INTO CHAT_THREAD (id, paps_id, asap_id, thread_type, created_at) VALUES
  ('00000000-0000-0000-0007-000000000006', '00000000-0000-0000-0003-000000000011', '00000000-0000-0000-0006-000000000003', 'asap_discussion', NOW() - INTERVAL '10 days');

-- Additional chat threads for newer applications
INSERT INTO CHAT_THREAD (id, paps_id, spap_id, thread_type, created_at) VALUES
  ('00000000-0000-0000-0007-000000000007', '00000000-0000-0000-0003-000000000013', '00000000-0000-0000-0004-000000000051', 'spap_discussion', NOW()),
  ('00000000-0000-0000-0007-000000000008', '00000000-0000-0000-0003-000000000015', '00000000-0000-0000-0004-000000000053', 'spap_discussion', NOW()),
  ('00000000-0000-0000-0007-000000000009', '00000000-0000-0000-0003-000000000018', '00000000-0000-0000-0004-000000000058', 'spap_discussion', NOW()),
  ('00000000-0000-0000-0007-000000000010', '00000000-0000-0000-0003-000000000020', '00000000-0000-0000-0004-000000000061', 'spap_discussion', NOW());

-- ============================================
-- CHAT PARTICIPANTS
-- ============================================
-- Participants for clement -> hassan's e-commerce job chat
INSERT INTO CHAT_PARTICIPANT (thread_id, user_id, role, joined_at) VALUES
  ('00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0000-000000000202', 'applicant', NOW()),
  ('00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0000-000000000201', 'owner', NOW());

-- Participants for osman -> hassan's mobile job chat
INSERT INTO CHAT_PARTICIPANT (thread_id, user_id, role, joined_at) VALUES
  ('00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0000-000000000203', 'applicant', NOW()),
  ('00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0000-000000000201', 'owner', NOW());

-- Participants for hassan's accepted work on clement's brand job (ASAP chat)
INSERT INTO CHAT_PARTICIPANT (thread_id, user_id, role, joined_at) VALUES
  ('00000000-0000-0000-0007-000000000003', '00000000-0000-0000-0000-000000000201', 'assignee', NOW()),
  ('00000000-0000-0000-0007-000000000003', '00000000-0000-0000-0000-000000000202', 'owner', NOW());

-- Participants for enrique -> osman's data job chat
INSERT INTO CHAT_PARTICIPANT (thread_id, user_id, role, joined_at) VALUES
  ('00000000-0000-0000-0007-000000000004', '00000000-0000-0000-0000-000000000204', 'applicant', NOW()),
  ('00000000-0000-0000-0007-000000000004', '00000000-0000-0000-0000-000000000203', 'owner', NOW());

-- Participants for clement's accepted work on hobbes's video editing (ASAP chat)
INSERT INTO CHAT_PARTICIPANT (thread_id, user_id, role, joined_at) VALUES
  ('00000000-0000-0000-0007-000000000005', '00000000-0000-0000-0000-000000000202', 'assignee', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0007-000000000005', '00000000-0000-0000-0000-000000000102', 'owner', NOW() - INTERVAL '2 days');

-- Participants for osman's completed work on calvin's database migration (ASAP chat)
INSERT INTO CHAT_PARTICIPANT (thread_id, user_id, role, joined_at) VALUES
  ('00000000-0000-0000-0007-000000000006', '00000000-0000-0000-0000-000000000203', 'assignee', NOW() - INTERVAL '10 days'),
  ('00000000-0000-0000-0007-000000000006', '00000000-0000-0000-0000-000000000101', 'owner', NOW() - INTERVAL '10 days');

-- Additional participants for newer chat threads
INSERT INTO CHAT_PARTICIPANT (thread_id, user_id, role, joined_at) VALUES
  ('00000000-0000-0000-0007-000000000007', '00000000-0000-0000-0000-000000000203', 'applicant', NOW()),
  ('00000000-0000-0000-0007-000000000007', '00000000-0000-0000-0000-000000000201', 'owner', NOW()),
  ('00000000-0000-0000-0007-000000000008', '00000000-0000-0000-0000-000000000201', 'applicant', NOW()),
  ('00000000-0000-0000-0007-000000000008', '00000000-0000-0000-0000-000000000202', 'owner', NOW()),
  ('00000000-0000-0000-0007-000000000009', '00000000-0000-0000-0000-000000000201', 'applicant', NOW()),
  ('00000000-0000-0000-0007-000000000009', '00000000-0000-0000-0000-000000000203', 'owner', NOW()),
  ('00000000-0000-0000-0007-000000000010', '00000000-0000-0000-0000-000000000201', 'applicant', NOW()),
  ('00000000-0000-0000-0007-000000000010', '00000000-0000-0000-0000-000000000204', 'owner', NOW());

-- ============================================
-- CHAT MESSAGES
-- ============================================
-- Messages in clement -> hassan's e-commerce job chat
INSERT INTO CHAT_MESSAGE (id, thread_id, sender_id, content, sent_at) VALUES
  ('00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0000-000000000202', 'Hi Hassan! I''m interested in helping with the UI design for your e-commerce project.', NOW() - INTERVAL '3 hours'),
  ('00000000-0000-0000-0008-000000000002', '00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0000-000000000201', 'Hi Clement! Thanks for applying. Can you share some of your previous work?', NOW() - INTERVAL '2 hours');

-- Messages in hassan's accepted work on clement's brand job
INSERT INTO CHAT_MESSAGE (id, thread_id, sender_id, content, sent_at) VALUES
  ('00000000-0000-0000-0008-000000000003', '00000000-0000-0000-0007-000000000003', '00000000-0000-0000-0000-000000000202', 'Welcome to the project Hassan! When can you start?', NOW() - INTERVAL '2 hours'),
  ('00000000-0000-0000-0008-000000000004', '00000000-0000-0000-0007-000000000003', '00000000-0000-0000-0000-000000000201', 'Hi Clement! I can start next week. Looking forward to it!', NOW() - INTERVAL '1 hour'),
  ('00000000-0000-0000-0008-000000000005', '00000000-0000-0000-0007-000000000003', '00000000-0000-0000-0000-000000000202', 'Perfect! I''ll send you the brand guidelines and assets.', NOW() - INTERVAL '30 minutes');

-- Messages in clement's work on hobbes's video editing
INSERT INTO CHAT_MESSAGE (id, thread_id, sender_id, content, sent_at) VALUES
  ('00000000-0000-0000-0008-000000000020', '00000000-0000-0000-0007-000000000005', '00000000-0000-0000-0000-000000000102', 'Hi Clement! Excited to have you on board. I''ll send the first batch of raw footage.', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0008-000000000021', '00000000-0000-0000-0007-000000000005', '00000000-0000-0000-0000-000000000202', 'Great! I''ll start working on them this week.', NOW() - INTERVAL '2 days' + INTERVAL '3 hours'),
  ('00000000-0000-0000-0008-000000000022', '00000000-0000-0000-0007-000000000005', '00000000-0000-0000-0000-000000000202', 'First video is ready for review!', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0008-000000000023', '00000000-0000-0000-0007-000000000005', '00000000-0000-0000-0000-000000000102', 'Looks amazing! Love the transitions.', NOW() - INTERVAL '12 hours');

-- Messages in osman's completed work on calvin's database migration
INSERT INTO CHAT_MESSAGE (id, thread_id, sender_id, content, sent_at) VALUES
  ('00000000-0000-0000-0008-000000000024', '00000000-0000-0000-0007-000000000006', '00000000-0000-0000-0000-000000000101', 'Hi Osman, let''s discuss the migration plan.', NOW() - INTERVAL '10 days'),
  ('00000000-0000-0000-0008-000000000025', '00000000-0000-0000-0007-000000000006', '00000000-0000-0000-0000-000000000203', 'Sure! I suggest we do a staged migration with a test run first.', NOW() - INTERVAL '10 days' + INTERVAL '1 hour'),
  ('00000000-0000-0000-0008-000000000026', '00000000-0000-0000-0007-000000000006', '00000000-0000-0000-0000-000000000203', 'Migration completed successfully! All tests passing.', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0008-000000000027', '00000000-0000-0000-0007-000000000006', '00000000-0000-0000-0000-000000000101', 'Excellent work! Everything looks great.', NOW() - INTERVAL '5 days' + INTERVAL '2 hours');

-- Messages in osman -> hassan's mobile job chat
INSERT INTO CHAT_MESSAGE (id, thread_id, sender_id, content, sent_at) VALUES
  ('00000000-0000-0000-0008-000000000030', '00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0000-000000000203', 'Hi Hassan! I''m very interested in this project. Can we discuss the tech stack?', NOW() - INTERVAL '5 hours'),
  ('00000000-0000-0000-0008-000000000031', '00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0000-000000000201', 'Hi Osman! Sure, thinking React Native with Firebase for backend.', NOW() - INTERVAL '4 hours');

-- Messages in hassan -> clement's logo design chat
INSERT INTO CHAT_MESSAGE (id, thread_id, sender_id, content, sent_at) VALUES
  ('00000000-0000-0000-0008-000000000032', '00000000-0000-0000-0007-000000000008', '00000000-0000-0000-0000-000000000201', 'Hi! I have some great ideas for a fintech logo.', NOW() - INTERVAL '2 hours'),
  ('00000000-0000-0000-0008-000000000033', '00000000-0000-0000-0007-000000000008', '00000000-0000-0000-0000-000000000202', 'Perfect! Would love to see some initial sketches.', NOW() - INTERVAL '1 hour');

-- Messages in osman -> hassan's python API chat
INSERT INTO CHAT_MESSAGE (id, thread_id, sender_id, content, sent_at) VALUES
  ('00000000-0000-0000-0008-000000000034', '00000000-0000-0000-0007-000000000007', '00000000-0000-0000-0000-000000000203', 'Hi Hassan! I have extensive experience with FastAPI and PostgreSQL.', NOW() - INTERVAL '4 hours'),
  ('00000000-0000-0000-0008-000000000035', '00000000-0000-0000-0007-000000000007', '00000000-0000-0000-0000-000000000201', 'Great! Can you share your GitHub profile?', NOW() - INTERVAL '3 hours'),
  ('00000000-0000-0000-0008-000000000036', '00000000-0000-0000-0007-000000000007', '00000000-0000-0000-0000-000000000203', 'Sure, here it is: github.com/osman-data. I also attached my portfolio PDF.', NOW() - INTERVAL '2 hours');

-- Messages in hassan -> osman's ML job chat  
INSERT INTO CHAT_MESSAGE (id, thread_id, sender_id, content, sent_at) VALUES
  ('00000000-0000-0000-0008-000000000037', '00000000-0000-0000-0007-000000000009', '00000000-0000-0000-0000-000000000201', 'Hi Osman! I have worked on similar churn prediction models before.', NOW() - INTERVAL '6 hours'),
  ('00000000-0000-0000-0008-000000000038', '00000000-0000-0000-0007-000000000009', '00000000-0000-0000-0000-000000000203', 'That sounds perfect! What libraries do you typically use?', NOW() - INTERVAL '5 hours'),
  ('00000000-0000-0000-0008-000000000039', '00000000-0000-0000-0007-000000000009', '00000000-0000-0000-0000-000000000201', 'Primarily scikit-learn for classical ML, and XGBoost for gradient boosting. Also familiar with TensorFlow.', NOW() - INTERVAL '4 hours'),
  ('00000000-0000-0000-0008-000000000040', '00000000-0000-0000-0007-000000000009', '00000000-0000-0000-0000-000000000203', 'Excellent! Let me review your application and get back to you.', NOW() - INTERVAL '3 hours');

-- Messages in hassan -> enrique's content writing chat
INSERT INTO CHAT_MESSAGE (id, thread_id, sender_id, content, sent_at) VALUES
  ('00000000-0000-0000-0008-000000000041', '00000000-0000-0000-0007-000000000010', '00000000-0000-0000-0000-000000000201', 'Hi Enrique! I''m interested in writing technical content for your blog.', NOW() - INTERVAL '8 hours'),
  ('00000000-0000-0000-0008-000000000042', '00000000-0000-0000-0007-000000000010', '00000000-0000-0000-0000-000000000204', 'Great to hear! Do you have samples of technical writing?', NOW() - INTERVAL '7 hours'),
  ('00000000-0000-0000-0008-000000000043', '00000000-0000-0000-0007-000000000010', '00000000-0000-0000-0000-000000000201', 'Yes! I''ve attached a PDF with some of my published articles on web development.', NOW() - INTERVAL '6 hours'),
  ('00000000-0000-0000-0008-000000000044', '00000000-0000-0000-0007-000000000010', '00000000-0000-0000-0000-000000000204', 'These look excellent. Very clear explanations. Let me discuss with the team.', NOW() - INTERVAL '5 hours');

-- ============================================
-- PAPS_SCHEDULE (Recurring job schedules)
-- ============================================
INSERT INTO PAPS_SCHEDULE (id, paps_id, recurrence_rule, start_date, end_date, next_run_at, is_active) VALUES
  -- Video editing is weekly recurring
  ('00000000-0000-0000-0009-000000000001', '00000000-0000-0000-0003-000000000007', 'WEEKLY', '2026-02-10', '2026-06-10', NOW() + INTERVAL '3 days', TRUE),
  -- Content writing has monthly schedule
  ('00000000-0000-0000-0009-000000000002', '00000000-0000-0000-0003-000000000020', 'MONTHLY', '2026-02-01', '2026-12-31', NOW() + INTERVAL '25 days', TRUE),
  -- Social media campaign is weekly
  ('00000000-0000-0000-0009-000000000003', '00000000-0000-0000-0003-000000000021', 'WEEKLY', '2026-02-15', '2026-05-15', NOW() + INTERVAL '7 days', TRUE),
  -- SEO campaign is monthly
  ('00000000-0000-0000-0009-000000000004', '00000000-0000-0000-0003-000000000006', 'MONTHLY', '2026-02-01', '2026-08-01', NOW() + INTERVAL '5 days', TRUE);

-- ============================================
-- SPAP_MEDIA (Application media attachments)
-- Files stored in: media/spap/{media_id}.{ext}
-- ============================================
INSERT INTO SPAP_MEDIA (id, spap_id, media_type, file_extension, file_size_bytes, mime_type, display_order) VALUES
  -- Clement's portfolio for e-commerce job
  ('00000000-0000-0000-000a-000000000001', '00000000-0000-0000-0004-000000000001', 'document', 'pdf', 250000, 'application/pdf', 1),
  ('00000000-0000-0000-000a-000000000002', '00000000-0000-0000-0004-000000000001', 'image', 'jpg', 85000, 'image/jpeg', 2),
  -- Osman's data portfolio for mobile job
  ('00000000-0000-0000-000a-000000000003', '00000000-0000-0000-0004-000000000002', 'document', 'pdf', 320000, 'application/pdf', 1),
  -- Osman's portfolio for Python API job
  ('00000000-0000-0000-000a-000000000004', '00000000-0000-0000-0004-000000000051', 'document', 'pdf', 180000, 'application/pdf', 1),
  ('00000000-0000-0000-000a-000000000005', '00000000-0000-0000-0004-000000000051', 'image', 'jpg', 92000, 'image/jpeg', 2),
  -- Hassan's portfolio for logo design
  ('00000000-0000-0000-000a-000000000006', '00000000-0000-0000-0004-000000000053', 'image', 'jpg', 75000, 'image/jpeg', 1),
  ('00000000-0000-0000-000a-000000000007', '00000000-0000-0000-0004-000000000053', 'image', 'jpg', 68000, 'image/jpeg', 2),
  -- Hobbes's photography samples for product photography
  ('00000000-0000-0000-000a-000000000008', '00000000-0000-0000-0004-000000000055', 'image', 'jpg', 95000, 'image/jpeg', 1),
  ('00000000-0000-0000-000a-000000000009', '00000000-0000-0000-0004-000000000055', 'image', 'jpg', 88000, 'image/jpeg', 2),
  -- Enrique's illustration samples
  ('00000000-0000-0000-000a-000000000010', '00000000-0000-0000-0004-000000000056', 'image', 'jpg', 110000, 'image/jpeg', 1),
  -- Hassan's ML experience docs
  ('00000000-0000-0000-000a-000000000011', '00000000-0000-0000-0004-000000000058', 'document', 'pdf', 420000, 'application/pdf', 1),
  -- Hassan's technical writing samples
  ('00000000-0000-0000-000a-000000000012', '00000000-0000-0000-0004-000000000061', 'document', 'pdf', 380000, 'application/pdf', 1),
  -- Clement's social media portfolio
  ('00000000-0000-0000-000a-000000000013', '00000000-0000-0000-0004-000000000063', 'image', 'jpg', 72000, 'image/jpeg', 1),
  -- Hassan's WordPress portfolio
  ('00000000-0000-0000-000a-000000000014', '00000000-0000-0000-0004-000000000066', 'image', 'jpg', 82000, 'image/jpeg', 1),
  ('00000000-0000-0000-000a-000000000015', '00000000-0000-0000-0004-000000000066', 'document', 'pdf', 290000, 'application/pdf', 2),
  -- Osman's security certifications
  ('00000000-0000-0000-000a-000000000016', '00000000-0000-0000-0004-000000000068', 'document', 'pdf', 150000, 'application/pdf', 1),
  -- Enrique's documentation samples
  ('00000000-0000-0000-000a-000000000017', '00000000-0000-0000-0004-000000000070', 'document', 'pdf', 275000, 'application/pdf', 1);

-- ============================================
-- Additional ASAPs (More accepted assignments)
-- ============================================
INSERT INTO ASAP (id, paps_id, accepted_user_id, status, assigned_at, started_at, completed_at) VALUES
  -- Enrique accepted for illustration job (completed)
  ('00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0003-000000000017', '00000000-0000-0000-0000-000000000204', 'completed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '3 days'),
  -- Hassan accepted for WordPress job (in_progress)
  ('00000000-0000-0000-0006-000000000005', '00000000-0000-0000-0003-000000000009', '00000000-0000-0000-0000-000000000201', 'in_progress', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NULL),
  -- Osman accepted for data pipeline job (in_progress)
  ('00000000-0000-0000-0006-000000000006', '00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000201', 'in_progress', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', NULL),
  -- Hobbes accepted for DevOps job (active - not started yet)
  ('00000000-0000-0000-0006-000000000007', '00000000-0000-0000-0003-000000000014', '00000000-0000-0000-0000-000000000102', 'active', NOW() - INTERVAL '1 day', NULL, NULL);

-- ============================================
-- ASAP_MEDIA (Assignment media - proof of work, deliverables)
-- Files stored in: media/asap/{media_id}.{ext}
-- ============================================
INSERT INTO ASAP_MEDIA (id, asap_id, media_type, file_extension, file_size_bytes, mime_type, display_order) VALUES
  -- Hassan's brand design deliverables for Clement
  ('00000000-0000-0000-000b-000000000001', '00000000-0000-0000-0006-000000000001', 'image', 'jpg', 125000, 'image/jpeg', 1),
  ('00000000-0000-0000-000b-000000000002', '00000000-0000-0000-0006-000000000001', 'document', 'pdf', 450000, 'application/pdf', 2),
  -- Clement's edited video for Hobbes
  ('00000000-0000-0000-000b-000000000003', '00000000-0000-0000-0006-000000000002', 'video', 'mp4', 15000000, 'video/mp4', 1),
  -- Osman's migration documentation for Calvin (completed job)
  ('00000000-0000-0000-000b-000000000004', '00000000-0000-0000-0006-000000000003', 'document', 'pdf', 380000, 'application/pdf', 1),
  ('00000000-0000-0000-000b-000000000005', '00000000-0000-0000-0006-000000000003', 'image', 'jpg', 95000, 'image/jpeg', 2),
  -- Enrique's illustrations for children's book (completed)
  ('00000000-0000-0000-000b-000000000006', '00000000-0000-0000-0006-000000000004', 'image', 'jpg', 180000, 'image/jpeg', 1),
  ('00000000-0000-0000-000b-000000000007', '00000000-0000-0000-0006-000000000004', 'image', 'jpg', 175000, 'image/jpeg', 2),
  ('00000000-0000-0000-000b-000000000008', '00000000-0000-0000-0006-000000000004', 'image', 'jpg', 168000, 'image/jpeg', 3),
  -- Hassan's WordPress progress for Hobbes
  ('00000000-0000-0000-000b-000000000009', '00000000-0000-0000-0006-000000000005', 'image', 'jpg', 88000, 'image/jpeg', 1),
  -- Hassan's data pipeline progress for Osman
  ('00000000-0000-0000-000b-000000000010', '00000000-0000-0000-0006-000000000006', 'document', 'pdf', 220000, 'application/pdf', 1);

-- ============================================
-- Additional chat threads for new ASAPs
-- ============================================
INSERT INTO CHAT_THREAD (id, paps_id, asap_id, thread_type, created_at) VALUES
  -- Enrique's illustration work chat
  ('00000000-0000-0000-0007-000000000011', '00000000-0000-0000-0003-000000000017', '00000000-0000-0000-0006-000000000004', 'asap_discussion', NOW() - INTERVAL '15 days'),
  -- Hassan's WordPress work chat
  ('00000000-0000-0000-0007-000000000012', '00000000-0000-0000-0003-000000000009', '00000000-0000-0000-0006-000000000005', 'asap_discussion', NOW() - INTERVAL '5 days'),
  -- Hassan's data pipeline work chat
  ('00000000-0000-0000-0007-000000000013', '00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0006-000000000006', 'asap_discussion', NOW() - INTERVAL '7 days'),
  -- Hobbes's DevOps work chat
  ('00000000-0000-0000-0007-000000000014', '00000000-0000-0000-0003-000000000014', '00000000-0000-0000-0006-000000000007', 'asap_discussion', NOW() - INTERVAL '1 day');

-- Additional chat participants
INSERT INTO CHAT_PARTICIPANT (thread_id, user_id, role, joined_at) VALUES
  -- Enrique's illustration work
  ('00000000-0000-0000-0007-000000000011', '00000000-0000-0000-0000-000000000204', 'assignee', NOW() - INTERVAL '15 days'),
  ('00000000-0000-0000-0007-000000000011', '00000000-0000-0000-0000-000000000202', 'owner', NOW() - INTERVAL '15 days'),
  -- Hassan's WordPress work
  ('00000000-0000-0000-0007-000000000012', '00000000-0000-0000-0000-000000000201', 'assignee', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0007-000000000012', '00000000-0000-0000-0000-000000000102', 'owner', NOW() - INTERVAL '5 days'),
  -- Hassan's data pipeline work
  ('00000000-0000-0000-0007-000000000013', '00000000-0000-0000-0000-000000000201', 'assignee', NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0007-000000000013', '00000000-0000-0000-0000-000000000203', 'owner', NOW() - INTERVAL '7 days'),
  -- Hobbes's DevOps work
  ('00000000-0000-0000-0007-000000000014', '00000000-0000-0000-0000-000000000102', 'assignee', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0007-000000000014', '00000000-0000-0000-0000-000000000201', 'owner', NOW() - INTERVAL '1 day');

-- Additional chat messages for new ASAP chats
INSERT INTO CHAT_MESSAGE (id, thread_id, sender_id, content, sent_at) VALUES
  -- Enrique's illustration work messages
  ('00000000-0000-0000-0008-000000000050', '00000000-0000-0000-0007-000000000011', '00000000-0000-0000-0000-000000000202', 'Welcome Enrique! Here are the story details for the illustrations.', NOW() - INTERVAL '15 days'),
  ('00000000-0000-0000-0008-000000000051', '00000000-0000-0000-0007-000000000011', '00000000-0000-0000-0000-000000000204', 'Thank you! I''ll start with the character sketches first.', NOW() - INTERVAL '15 days' + INTERVAL '2 hours'),
  ('00000000-0000-0000-0008-000000000052', '00000000-0000-0000-0007-000000000011', '00000000-0000-0000-0000-000000000204', 'Here are the first 5 illustrations for review!', NOW() - INTERVAL '10 days'),
  ('00000000-0000-0000-0008-000000000053', '00000000-0000-0000-0007-000000000011', '00000000-0000-0000-0000-000000000202', 'These look wonderful! The colors are perfect.', NOW() - INTERVAL '10 days' + INTERVAL '3 hours'),
  ('00000000-0000-0000-0008-000000000054', '00000000-0000-0000-0007-000000000011', '00000000-0000-0000-0000-000000000204', 'All 20 illustrations are now complete!', NOW() - INTERVAL '4 days'),
  ('00000000-0000-0000-0008-000000000055', '00000000-0000-0000-0007-000000000011', '00000000-0000-0000-0000-000000000202', 'Excellent work! Marking the job as complete now.', NOW() - INTERVAL '3 days'),
  
  -- Hassan's WordPress work messages
  ('00000000-0000-0000-0008-000000000056', '00000000-0000-0000-0007-000000000012', '00000000-0000-0000-0000-000000000102', 'Hi Hassan! Excited to have you on the WordPress project.', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0008-000000000057', '00000000-0000-0000-0007-000000000012', '00000000-0000-0000-0000-000000000201', 'Thanks Hobbes! I''ve reviewed your requirements. Starting with theme setup.', NOW() - INTERVAL '5 days' + INTERVAL '1 hour'),
  ('00000000-0000-0000-0008-000000000058', '00000000-0000-0000-0007-000000000012', '00000000-0000-0000-0000-000000000201', 'Theme is installed and customized. Here''s a preview screenshot.', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0008-000000000059', '00000000-0000-0000-0007-000000000012', '00000000-0000-0000-0000-000000000102', 'Looking great! Can we add a contact form?', NOW() - INTERVAL '3 days' + INTERVAL '2 hours'),
  ('00000000-0000-0000-0008-000000000060', '00000000-0000-0000-0007-000000000012', '00000000-0000-0000-0000-000000000201', 'Already on it! Will have it ready tomorrow.', NOW() - INTERVAL '2 days'),
  
  -- Hassan's data pipeline work messages
  ('00000000-0000-0000-0008-000000000061', '00000000-0000-0000-0007-000000000013', '00000000-0000-0000-0000-000000000203', 'Welcome to the project Hassan! Here''s the data source documentation.', NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0008-000000000062', '00000000-0000-0000-0007-000000000013', '00000000-0000-0000-0000-000000000201', 'Thanks Osman! I''ll start with the extraction layer design.', NOW() - INTERVAL '7 days' + INTERVAL '30 minutes'),
  ('00000000-0000-0000-0008-000000000063', '00000000-0000-0000-0007-000000000013', '00000000-0000-0000-0000-000000000201', 'ETL pipeline architecture document is ready. Please review.', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0008-000000000064', '00000000-0000-0000-0007-000000000013', '00000000-0000-0000-0000-000000000203', 'Looks solid! Approved. You can proceed with implementation.', NOW() - INTERVAL '5 days' + INTERVAL '4 hours'),
  ('00000000-0000-0000-0008-000000000065', '00000000-0000-0000-0007-000000000013', '00000000-0000-0000-0000-000000000201', 'First batch of Spark jobs are deployed and tested. Processing 5GB successfully.', NOW() - INTERVAL '2 days'),
  
  -- Hobbes's DevOps work messages
  ('00000000-0000-0000-0008-000000000066', '00000000-0000-0000-0007-000000000014', '00000000-0000-0000-0000-000000000201', 'Welcome to the project Hobbes! Here are the CI/CD requirements.', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0008-000000000067', '00000000-0000-0000-0007-000000000014', '00000000-0000-0000-0000-000000000102', 'Thanks Hassan! I''ll review and propose a pipeline architecture.', NOW() - INTERVAL '1 day' + INTERVAL '1 hour'),
  ('00000000-0000-0000-0008-000000000068', '00000000-0000-0000-0007-000000000014', '00000000-0000-0000-0000-000000000102', 'Here''s my proposed architecture using GitHub Actions and ArgoCD.', NOW() - INTERVAL '12 hours');

-- ============================================
-- PAYMENTS (for completed ASAPs)
-- ============================================
INSERT INTO PAYMENT (id, paps_id, payer_id, payee_id, amount, currency, payment_method, status, created_at, paid_at) VALUES
  -- Payment for Osman's completed database migration (ASAP 3)
  ('00000000-0000-0000-000c-000000000001', '00000000-0000-0000-0003-000000000011', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000203', 5000.00, 'EUR', 'transfer', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
  -- Payment for Enrique's completed illustrations (ASAP 4)
  ('00000000-0000-0000-000c-000000000002', '00000000-0000-0000-0003-000000000017', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000204', 2200.00, 'EUR', 'paypal', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
  -- Pending payment for Hassan's brand work (ASAP 1 - still active but partial payment)
  ('00000000-0000-0000-000c-000000000003', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000201', 1500.00, 'EUR', 'transfer', 'pending', NOW() - INTERVAL '1 day', NULL);

-- ============================================
-- UPDATE USER RATINGS (for completed jobs)
-- ============================================
-- Osman got rated 5.0 for database migration
UPDATE USER_PROFILE SET rating_average = 5.00, rating_count = 1 WHERE user_id = '00000000-0000-0000-0000-000000000203';
-- Enrique got rated 4.5 for illustrations
UPDATE USER_PROFILE SET rating_average = 4.50, rating_count = 1 WHERE user_id = '00000000-0000-0000-0000-000000000204';
-- Hassan has 2 ratings averaging 4.75
UPDATE USER_PROFILE SET rating_average = 4.75, rating_count = 2 WHERE user_id = '00000000-0000-0000-0000-000000000201';
-- Clement has 1 rating of 4.0
UPDATE USER_PROFILE SET rating_average = 4.00, rating_count = 1 WHERE user_id = '00000000-0000-0000-0000-000000000202';

-- ============================================
-- Additional more SPAP chat threads
-- ============================================
INSERT INTO CHAT_THREAD (id, paps_id, spap_id, thread_type, created_at) VALUES
  -- More application chats
  ('00000000-0000-0000-0007-000000000015', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0004-000000000050', 'spap_discussion', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0007-000000000016', '00000000-0000-0000-0003-000000000014', '00000000-0000-0000-0004-000000000052', 'spap_discussion', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0007-000000000017', '00000000-0000-0000-0003-000000000015', '00000000-0000-0000-0004-000000000054', 'spap_discussion', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0007-000000000018', '00000000-0000-0000-0003-000000000016', '00000000-0000-0000-0004-000000000055', 'spap_discussion', NOW() - INTERVAL '4 days'),
  ('00000000-0000-0000-0007-000000000019', '00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0004-000000000057', 'spap_discussion', NOW() - INTERVAL '8 days'),
  ('00000000-0000-0000-0007-000000000020', '00000000-0000-0000-0003-000000000019', '00000000-0000-0000-0004-000000000059', 'spap_discussion', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0007-000000000021', '00000000-0000-0000-0003-000000000020', '00000000-0000-0000-0004-000000000062', 'spap_discussion', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0007-000000000022', '00000000-0000-0000-0003-000000000021', '00000000-0000-0000-0004-000000000063', 'spap_discussion', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0007-000000000023', '00000000-0000-0000-0003-000000000007', '00000000-0000-0000-0004-000000000064', 'spap_discussion', NOW() - INTERVAL '6 days'),
  ('00000000-0000-0000-0007-000000000024', '00000000-0000-0000-0003-000000000008', '00000000-0000-0000-0004-000000000065', 'spap_discussion', NOW() - INTERVAL '4 days'),
  ('00000000-0000-0000-0007-000000000025', '00000000-0000-0000-0003-000000000010', '00000000-0000-0000-0004-000000000068', 'spap_discussion', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0007-000000000026', '00000000-0000-0000-0003-000000000012', '00000000-0000-0000-0004-000000000070', 'spap_discussion', NOW() - INTERVAL '3 days');

-- Participants for additional chat threads
INSERT INTO CHAT_PARTICIPANT (thread_id, user_id, role, joined_at) VALUES
  ('00000000-0000-0000-0007-000000000015', '00000000-0000-0000-0000-000000000204', 'applicant', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0007-000000000015', '00000000-0000-0000-0000-000000000201', 'owner', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0007-000000000016', '00000000-0000-0000-0000-000000000102', 'applicant', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0007-000000000016', '00000000-0000-0000-0000-000000000201', 'owner', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0007-000000000017', '00000000-0000-0000-0000-000000000204', 'applicant', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0007-000000000017', '00000000-0000-0000-0000-000000000202', 'owner', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0007-000000000018', '00000000-0000-0000-0000-000000000102', 'applicant', NOW() - INTERVAL '4 days'),
  ('00000000-0000-0000-0007-000000000018', '00000000-0000-0000-0000-000000000202', 'owner', NOW() - INTERVAL '4 days'),
  ('00000000-0000-0000-0007-000000000019', '00000000-0000-0000-0000-000000000201', 'applicant', NOW() - INTERVAL '8 days'),
  ('00000000-0000-0000-0007-000000000019', '00000000-0000-0000-0000-000000000203', 'owner', NOW() - INTERVAL '8 days'),
  ('00000000-0000-0000-0007-000000000020', '00000000-0000-0000-0000-000000000102', 'applicant', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0007-000000000020', '00000000-0000-0000-0000-000000000203', 'owner', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0007-000000000021', '00000000-0000-0000-0000-000000000102', 'applicant', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0007-000000000021', '00000000-0000-0000-0000-000000000204', 'owner', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0007-000000000022', '00000000-0000-0000-0000-000000000202', 'applicant', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0007-000000000022', '00000000-0000-0000-0000-000000000204', 'owner', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0007-000000000023', '00000000-0000-0000-0000-000000000202', 'applicant', NOW() - INTERVAL '6 days'),
  ('00000000-0000-0000-0007-000000000023', '00000000-0000-0000-0000-000000000102', 'owner', NOW() - INTERVAL '6 days'),
  ('00000000-0000-0000-0007-000000000024', '00000000-0000-0000-0000-000000000204', 'applicant', NOW() - INTERVAL '4 days'),
  ('00000000-0000-0000-0007-000000000024', '00000000-0000-0000-0000-000000000102', 'owner', NOW() - INTERVAL '4 days'),
  ('00000000-0000-0000-0007-000000000025', '00000000-0000-0000-0000-000000000203', 'applicant', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0007-000000000025', '00000000-0000-0000-0000-000000000101', 'owner', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0007-000000000026', '00000000-0000-0000-0000-000000000204', 'applicant', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0007-000000000026', '00000000-0000-0000-0000-000000000101', 'owner', NOW() - INTERVAL '3 days');

-- Messages for additional chat threads
INSERT INTO CHAT_MESSAGE (id, thread_id, sender_id, content, sent_at) VALUES
  -- Enrique -> Hassan's e-commerce chat
  ('00000000-0000-0000-0008-000000000070', '00000000-0000-0000-0007-000000000015', '00000000-0000-0000-0000-000000000204', 'Hi Hassan! I can help with the marketing strategy for your e-commerce platform.', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0008-000000000071', '00000000-0000-0000-0007-000000000015', '00000000-0000-0000-0000-000000000201', 'Thanks for applying! What SEO strategies would you recommend?', NOW() - INTERVAL '2 days' + INTERVAL '1 hour'),
  ('00000000-0000-0000-0008-000000000072', '00000000-0000-0000-0007-000000000015', '00000000-0000-0000-0000-000000000204', 'I would focus on product page optimization and structured data markup.', NOW() - INTERVAL '2 days' + INTERVAL '2 hours'),
  
  -- Hobbes -> Hassan's DevOps chat
  ('00000000-0000-0000-0008-000000000073', '00000000-0000-0000-0007-000000000016', '00000000-0000-0000-0000-000000000102', 'Hi Hassan! I''m very interested in this DevOps project.', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0008-000000000074', '00000000-0000-0000-0007-000000000016', '00000000-0000-0000-0000-000000000201', 'Great! What''s your experience with Kubernetes?', NOW() - INTERVAL '3 days' + INTERVAL '30 minutes'),
  ('00000000-0000-0000-0008-000000000075', '00000000-0000-0000-0007-000000000016', '00000000-0000-0000-0000-000000000102', 'I have CKA certification and have managed clusters with 50+ nodes.', NOW() - INTERVAL '3 days' + INTERVAL '1 hour'),
  
  -- Enrique -> Clement's logo design chat
  ('00000000-0000-0000-0008-000000000076', '00000000-0000-0000-0007-000000000017', '00000000-0000-0000-0000-000000000204', 'Hi Clement! I love designing logos with a marketing perspective.', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0008-000000000077', '00000000-0000-0000-0007-000000000017', '00000000-0000-0000-0000-000000000202', 'That''s a unique approach! Can you show me some examples?', NOW() - INTERVAL '1 day' + INTERVAL '2 hours'),
  
  -- Hobbes -> Clement's product photography chat
  ('00000000-0000-0000-0008-000000000078', '00000000-0000-0000-0007-000000000018', '00000000-0000-0000-0000-000000000102', 'Hi Clement! I have a professional studio setup perfect for product shots.', NOW() - INTERVAL '4 days'),
  ('00000000-0000-0000-0008-000000000079', '00000000-0000-0000-0007-000000000018', '00000000-0000-0000-0000-000000000202', 'That sounds ideal! What lighting equipment do you use?', NOW() - INTERVAL '4 days' + INTERVAL '1 hour'),
  ('00000000-0000-0000-0008-000000000080', '00000000-0000-0000-0007-000000000018', '00000000-0000-0000-0000-000000000102', 'I use Profoto D2 strobes with a variety of modifiers. Here are some samples.', NOW() - INTERVAL '4 days' + INTERVAL '2 hours'),
  
  -- Hassan -> Osman's data pipeline chat (before acceptance)
  ('00000000-0000-0000-0008-000000000081', '00000000-0000-0000-0007-000000000019', '00000000-0000-0000-0000-000000000201', 'Hi Osman! I have 5 years experience with Apache Spark and AWS.', NOW() - INTERVAL '8 days'),
  ('00000000-0000-0000-0008-000000000082', '00000000-0000-0000-0007-000000000019', '00000000-0000-0000-0000-000000000203', 'Impressive! Have you worked with real-time streaming?', NOW() - INTERVAL '8 days' + INTERVAL '1 hour'),
  ('00000000-0000-0000-0008-000000000083', '00000000-0000-0000-0007-000000000019', '00000000-0000-0000-0000-000000000201', 'Yes, extensively with Kafka and Spark Streaming. I''ve attached my portfolio.', NOW() - INTERVAL '8 days' + INTERVAL '2 hours'),
  ('00000000-0000-0000-0008-000000000084', '00000000-0000-0000-0007-000000000019', '00000000-0000-0000-0000-000000000203', 'This is exactly what I''m looking for. I''m accepting your application!', NOW() - INTERVAL '7 days'),
  
  -- Hobbes -> Osman's data viz chat
  ('00000000-0000-0000-0008-000000000085', '00000000-0000-0000-0007-000000000020', '00000000-0000-0000-0000-000000000102', 'Hi Osman! I''m experienced with D3.js and real-time dashboards.', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0008-000000000086', '00000000-0000-0000-0007-000000000020', '00000000-0000-0000-0000-000000000203', 'Great! What frameworks have you used for the backend integration?', NOW() - INTERVAL '2 days' + INTERVAL '1 hour'),
  
  -- Hobbes -> Enrique's content writing chat
  ('00000000-0000-0000-0008-000000000087', '00000000-0000-0000-0007-000000000021', '00000000-0000-0000-0000-000000000102', 'Hi Enrique! I can write engaging technical content.', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0008-000000000088', '00000000-0000-0000-0007-000000000021', '00000000-0000-0000-0000-000000000204', 'Thanks! Do you have experience with web development topics?', NOW() - INTERVAL '3 days' + INTERVAL '2 hours'),
  
  -- Clement -> Enrique's social media chat
  ('00000000-0000-0000-0008-000000000089', '00000000-0000-0000-0007-000000000022', '00000000-0000-0000-0000-000000000202', 'Hi Enrique! I''ve managed social media campaigns for design agencies.', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0008-000000000090', '00000000-0000-0000-0007-000000000022', '00000000-0000-0000-0000-000000000204', 'That''s relevant experience! What was your best campaign result?', NOW() - INTERVAL '5 days' + INTERVAL '1 hour'),
  
  -- Clement -> Hobbes's video editing chat (before acceptance)
  ('00000000-0000-0000-0008-000000000091', '00000000-0000-0000-0007-000000000023', '00000000-0000-0000-0000-000000000202', 'Hi Hobbes! I''m passionate about video editing and storytelling.', NOW() - INTERVAL '6 days'),
  ('00000000-0000-0000-0008-000000000092', '00000000-0000-0000-0007-000000000023', '00000000-0000-0000-0000-000000000102', 'That''s great! What editing software do you prefer?', NOW() - INTERVAL '6 days' + INTERVAL '1 hour'),
  ('00000000-0000-0000-0008-000000000093', '00000000-0000-0000-0007-000000000023', '00000000-0000-0000-0000-000000000202', 'Primarily DaVinci Resolve and Premiere Pro. I can work in either.', NOW() - INTERVAL '6 days' + INTERVAL '2 hours'),
  ('00000000-0000-0000-0008-000000000094', '00000000-0000-0000-0007-000000000023', '00000000-0000-0000-0000-000000000102', 'Perfect! I use Resolve too. I''m accepting your application.', NOW() - INTERVAL '5 days'),
  
  -- Enrique -> Hobbes's music composition chat
  ('00000000-0000-0000-0008-000000000095', '00000000-0000-0000-0007-000000000024', '00000000-0000-0000-0000-000000000204', 'Hi Hobbes! I compose electronic and orchestral hybrid music.', NOW() - INTERVAL '4 days'),
  ('00000000-0000-0000-0008-000000000096', '00000000-0000-0000-0007-000000000024', '00000000-0000-0000-0000-000000000102', 'That''s exactly the style I''m looking for! Can you share samples?', NOW() - INTERVAL '4 days' + INTERVAL '30 minutes'),
  ('00000000-0000-0000-0008-000000000097', '00000000-0000-0000-0007-000000000024', '00000000-0000-0000-0000-000000000204', 'Here are links to my SoundCloud and some game projects I''ve worked on.', NOW() - INTERVAL '4 days' + INTERVAL '1 hour'),
  
  -- Osman -> Calvin's security audit chat
  ('00000000-0000-0000-0008-000000000098', '00000000-0000-0000-0007-000000000025', '00000000-0000-0000-0000-000000000203', 'Hi Calvin! I have OSCP certification and extensive pentesting experience.', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0008-000000000099', '00000000-0000-0000-0007-000000000025', '00000000-0000-0000-0000-000000000101', 'Impressive credentials! What tools do you typically use?', NOW() - INTERVAL '5 days' + INTERVAL '1 hour'),
  ('00000000-0000-0000-0008-000000000100', '00000000-0000-0000-0007-000000000025', '00000000-0000-0000-0000-000000000203', 'Burp Suite, Nmap, Metasploit, and custom Python scripts for automation.', NOW() - INTERVAL '5 days' + INTERVAL '2 hours'),
  
  -- Enrique -> Calvin's tech documentation chat
  ('00000000-0000-0000-0008-000000000101', '00000000-0000-0000-0007-000000000026', '00000000-0000-0000-0000-000000000204', 'Hi Calvin! I have extensive experience writing API documentation.', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0008-000000000102', '00000000-0000-0000-0007-000000000026', '00000000-0000-0000-0000-000000000101', 'Great! Are you familiar with OpenAPI/Swagger?', NOW() - INTERVAL '3 days' + INTERVAL '30 minutes'),
  ('00000000-0000-0000-0008-000000000103', '00000000-0000-0000-0007-000000000026', '00000000-0000-0000-0000-000000000204', 'Yes, I''ve written docs for 20+ APIs using OpenAPI spec and Redoc.', NOW() - INTERVAL '3 days' + INTERVAL '1 hour');

-- ============================================
-- End of static test data
-- ============================================
