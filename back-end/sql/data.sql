-- Minimal initial data for the application
-- Requires: create.sql has been run first
-- NOTE: Test users should be created using setup_test_data.py script

-- ============================================
-- ROLES
-- ============================================

INSERT INTO ROLE (name, description) VALUES
    ('admin', 'Administrator role'),
    ('user' , 'User role'),
    ('moderator', 'Moderator role')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- CATEGORIES
-- ============================================

INSERT INTO CATEGORY (name, slug, description, parent_id, icon_url, is_active, created_at) VALUES
    ('Technology', 'technology', 'Tech-related jobs and services', NULL, NULL,  TRUE, NOW()),
    ('Web Development', 'web-development', 'Website and web application development', (SELECT id FROM CATEGORY WHERE slug = 'technology'), NULL, TRUE, NOW()),
    ('Mobile Development', 'mobile-development', 'Mobile app development for iOS and Android', (SELECT id FROM CATEGORY WHERE slug = 'technology'), NULL, TRUE, NOW()),
    ('Design', 'design', 'Graphic design and creative services', NULL, NULL, TRUE, NOW()),
    ('Graphic Design', 'graphic-design', 'Visual design and branding', (SELECT id FROM CATEGORY WHERE slug = 'design'), NULL,  TRUE, NOW()),
    ('UI/UX Design', 'ui-ux-design', 'User interface and experience design', (SELECT id FROM CATEGORY WHERE slug = 'design'), NULL,  TRUE, NOW()),
    ('Writing', 'writing', 'Content creation and copywriting', NULL, NULL,  TRUE, NOW()),
    ('Content Writing', 'content-writing', 'Blog posts, articles, and web content', (SELECT id FROM CATEGORY WHERE slug = 'writing'), NULL,  TRUE, NOW()),
    ('Marketing', 'marketing', 'Marketing and advertising services', NULL, NULL,  TRUE, NOW()),
    ('SEO', 'seo', 'Search engine optimization services', (SELECT id FROM CATEGORY WHERE slug = 'marketing'), NULL,  TRUE, NOW()),
    ('Social Media', 'social-media', 'Social media management and marketing', (SELECT id FROM CATEGORY WHERE slug = 'marketing'), NULL,  TRUE, NOW()),
    ('Audio/Video', 'audio-video', 'Audio production and video editing', NULL, NULL,  TRUE, NOW()),
    ('Video Editing', 'video-editing', 'Video production and editing services', (SELECT id FROM CATEGORY WHERE slug = 'audio-video'), NULL,  TRUE, NOW()),
    ('Audio Production', 'audio-production', 'Podcast editing and music production', (SELECT id FROM CATEGORY WHERE slug = 'audio-video'), NULL,  TRUE, NOW())
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- NOTE: Test users and sample PAPS data
-- ============================================
-- To create test users, run: python setup_test_data.py
-- This will create users: hassan, clement, osman, enrique, calvin, hobbes
-- along with their profiles, interests, and sample PAPS/SPAP/ASAP data
