-- ============================================================================
-- SAMPLE DATA FOR DATABASE
-- ============================================================================
-- This file contains coherent sample data for testing and development
-- Password for all users: "Password123!" (hashed with bcrypt)
-- ============================================================================

-- ============================================================================
-- ROLES
-- ============================================================================

INSERT INTO "ROLE" ("role_id", "name", "description", "created_at", "updated_at") VALUES
(1, 'admin', 'Administrator with full system access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'user', 'Regular user with standard permissions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================================
-- USERS
-- ============================================================================
-- Password hash for "Password123!" using bcrypt
-- Salt: $2b$10$abcdefghijklmnopqrstuv

INSERT INTO "USER" ("user_id", "username", "email", "phone_number", "password_hash", "password_salt", "first_name", "last_name", "role_id", "is_active", "last_login", "created_at", "updated_at") VALUES
(1, 'admin_sarah', 'sarah.admin@papsplatform.com', '+14155551001', '$2b$10$abcdefghijklmnopqrstuv.hashedpassword1234567890', '$2b$10$abcdefghijklmnopqrstuv', 'Sarah', 'Anderson', 1, TRUE, '2025-01-16 10:30:00', '2024-01-01 08:00:00', '2025-01-16 10:30:00'),
(2, 'john_builder', 'john.doe@email.com', '+14155551002', '$2b$10$abcdefghijklmnopqrstuv.hashedpassword1234567890', '$2b$10$abcdefghijklmnopqrstuv', 'John', 'Doe', 2, TRUE, '2025-01-16 09:15:00', '2024-02-15 10:30:00', '2025-01-16 09:15:00'),
(3, 'emily_designer', 'emily.chen@email.com', '+14155551003', '$2b$10$abcdefghijklmnopqrstuv.hashedpassword1234567890', '$2b$10$abcdefghijklmnopqrstuv', 'Emily', 'Chen', 2, TRUE, '2025-01-16 08:45:00', '2024-03-10 14:20:00', '2025-01-16 08:45:00'),
(4, 'mike_handyman', 'mike.johnson@email.com', '+14155551004', '$2b$10$abcdefghijklmnopqrstuv.hashedpassword1234567890', '$2b$10$abcdefghijklmnopqrstuv', 'Mike', 'Johnson', 2, TRUE, '2025-01-15 18:20:00', '2024-04-05 11:00:00', '2025-01-15 18:20:00'),
(5, 'lisa_tutor', 'lisa.williams@email.com', '+14155551005', '$2b$10$abcdefghijklmnopqrstuv.hashedpassword1234567890', '$2b$10$abcdefghijklmnopqrstuv', 'Lisa', 'Williams', 2, TRUE, '2025-01-16 07:00:00', '2024-05-20 09:45:00', '2025-01-16 07:00:00'),
(6, 'david_photog', 'david.brown@email.com', '+14155551006', '$2b$10$abcdefghijklmnopqrstuv.hashedpassword1234567890', '$2b$10$abcdefghijklmnopqrstuv', 'David', 'Brown', 2, TRUE, '2025-01-15 16:30:00', '2024-06-12 13:15:00', '2025-01-15 16:30:00'),
(7, 'maria_cleaner', 'maria.garcia@email.com', '+14155551007', '$2b$10$abcdefghijklmnopqrstuv.hashedpassword1234567890', '$2b$10$abcdefghijklmnopqrstuv', 'Maria', 'Garcia', 2, TRUE, '2025-01-16 06:00:00', '2024-07-08 10:00:00', '2025-01-16 06:00:00'),
(8, 'james_techie', 'james.miller@email.com', '+14155551008', '$2b$10$abcdefghijklmnopqrstuv.hashedpassword1234567890', '$2b$10$abcdefghijklmnopqrstuv', 'James', 'Miller', 2, TRUE, '2025-01-15 20:00:00', '2024-08-22 15:30:00', '2025-01-15 20:00:00'),
(9, 'anna_gardener', 'anna.davis@email.com', '+14155551009', '$2b$10$abcdefghijklmnopqrstuv.hashedpassword1234567890', '$2b$10$abcdefghijklmnopqrstuv', 'Anna', 'Davis', 2, TRUE, '2025-01-16 05:30:00', '2024-09-14 12:00:00', '2025-01-16 05:30:00'),
(10, 'robert_writer', 'robert.wilson@email.com', '+14155551010', '$2b$10$abcdefghijklmnopqrstuv.hashedpassword1234567890', '$2b$10$abcdefghijklmnopqrstuv', 'Robert', 'Wilson', 2, TRUE, '2025-01-15 14:00:00', '2024-10-30 16:45:00', '2025-01-15 14:00:00');

-- ============================================================================
-- USER PROFILES
-- ============================================================================

INSERT INTO "USER_PROFILE" ("user_id", "bio", "avatar_image_url", "location_text", "latitude", "longitude", "timezone", "date_of_birth", "gender", "rating_average", "rating_count", "created_at", "updated_at") VALUES
(1, 'Platform administrator. Here to help users have the best experience possible.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', 'San Francisco, CA', 37.774929, -122.419416, 'America/Los_Angeles', '1985-03-15', 'F', NULL, 0, '2024-01-01 08:00:00', '2025-01-16 10:30:00'),
(2, 'Professional carpenter with 10+ years experience. Specialized in custom furniture and home renovations.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', 'Oakland, CA', 37.804364, -122.271114, 'America/Los_Angeles', '1988-07-22', 'M', 4.75, 24, '2024-02-15 10:30:00', '2025-01-16 09:15:00'),
(3, 'Freelance graphic designer and illustrator. Love bringing creative visions to life!', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily', 'Berkeley, CA', 37.871593, -122.272743, 'America/Los_Angeles', '1992-11-08', 'F', 4.90, 18, '2024-03-10 14:20:00', '2025-01-16 08:45:00'),
(4, 'Jack of all trades! Plumbing, electrical, painting - I can handle most home repairs.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', 'San Jose, CA', 37.338208, -121.886329, 'America/Los_Angeles', '1980-05-12', 'M', 4.60, 32, '2024-04-05 11:00:00', '2025-01-15 18:20:00'),
(5, 'Certified teacher with expertise in Math and Science. Patient and encouraging tutor for all ages.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa', 'Palo Alto, CA', 37.441883, -122.143019, 'America/Los_Angeles', '1990-09-30', 'F', 4.85, 15, '2024-05-20 09:45:00', '2025-01-16 07:00:00'),
(6, 'Professional photographer specializing in events, portraits, and product photography.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', 'San Francisco, CA', 37.774929, -122.419416, 'America/Los_Angeles', '1987-02-18', 'M', 4.70, 21, '2024-06-12 13:15:00', '2025-01-15 16:30:00'),
(7, 'Reliable house cleaner with attention to detail. Eco-friendly products available upon request.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', 'Daly City, CA', 37.687931, -122.470215, 'America/Los_Angeles', '1985-12-05', 'F', 4.95, 45, '2024-07-08 10:00:00', '2025-01-16 06:00:00'),
(8, 'IT specialist and computer repair expert. Software troubleshooting, hardware upgrades, network setup.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', 'Mountain View, CA', 37.386051, -122.083855, 'America/Los_Angeles', '1995-04-25', 'M', 4.65, 12, '2024-08-22 15:30:00', '2025-01-15 20:00:00'),
(9, 'Experienced gardener and landscaper. Transform your outdoor space into a beautiful oasis!', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna', 'Sunnyvale, CA', 37.368830, -122.036350, 'America/Los_Angeles', '1983-08-14', 'F', 4.80, 28, '2024-09-14 12:00:00', '2025-01-16 05:30:00'),
(10, 'Freelance content writer and copywriter. SEO-optimized content that engages and converts.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert', 'Fremont, CA', 37.548270, -121.988571, 'America/Los_Angeles', '1991-06-20', 'M', 4.55, 9, '2024-10-30 16:45:00', '2025-01-15 14:00:00');

-- ============================================================================
-- USER EXPERIENCE
-- ============================================================================

INSERT INTO "USER_EXPERIENCE" ("user_id", "title", "description", "started_at", "ended_at", "created_at", "updated_at") VALUES
(2, 'Master Carpenter', 'Worked on residential and commercial projects, specializing in custom cabinetry', '2014-06-01 00:00:00', '2020-12-31 00:00:00', '2024-02-15 10:30:00', '2024-02-15 10:30:00'),
(2, 'Freelance Carpenter', 'Independent contractor focusing on home renovations and furniture building', '2021-01-01 00:00:00', NULL, '2024-02-15 10:30:00', '2024-02-15 10:30:00'),
(3, 'Graphic Designer at Tech Startup', 'Led brand identity and marketing design initiatives', '2018-03-15 00:00:00', '2022-08-30 00:00:00', '2024-03-10 14:20:00', '2024-03-10 14:20:00'),
(3, 'Freelance Designer & Illustrator', 'Working with clients across various industries', '2022-09-01 00:00:00', NULL, '2024-03-10 14:20:00', '2024-03-10 14:20:00'),
(5, 'High School Math Teacher', 'Taught algebra and calculus to grades 9-12', '2015-09-01 00:00:00', '2023-06-30 00:00:00', '2024-05-20 09:45:00', '2024-05-20 09:45:00'),
(5, 'Private Tutor', 'One-on-one and group tutoring in STEM subjects', '2023-07-01 00:00:00', NULL, '2024-05-20 09:45:00', '2024-05-20 09:45:00');

-- ============================================================================
-- CATEGORIES
-- ============================================================================

INSERT INTO "CATEGORY" ("category_id", "name", "description", "slug", "created_at", "updated_at") VALUES
(1, 'Home Improvement', 'Carpentry, plumbing, electrical, and general repairs', 'home-improvement', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(2, 'Cleaning', 'House cleaning, deep cleaning, and organization', 'cleaning', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(3, 'Gardening & Landscaping', 'Lawn care, garden maintenance, and landscape design', 'gardening-landscaping', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(4, 'Technology', 'Computer repair, IT support, and tech assistance', 'technology', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(5, 'Education & Tutoring', 'Academic tutoring and educational support', 'education-tutoring', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(6, 'Photography & Video', 'Event photography, videography, and editing', 'photography-video', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(7, 'Writing & Content', 'Copywriting, content creation, and editing', 'writing-content', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(8, 'Design & Creative', 'Graphic design, illustration, and creative services', 'design-creative', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(9, 'Moving & Delivery', 'Moving assistance and delivery services', 'moving-delivery', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
(10, 'Pet Care', 'Dog walking, pet sitting, and grooming', 'pet-care', '2024-01-01 00:00:00', '2024-01-01 00:00:00');

-- ============================================================================
-- USER INTERESTS
-- ============================================================================

INSERT INTO "USER_INTEREST" ("user_id", "category_id", "weight", "created_at") VALUES
(2, 1, 5.0, '2024-02-15 10:30:00'),
(3, 8, 5.0, '2024-03-10 14:20:00'),
(3, 6, 3.0, '2024-03-10 14:20:00'),
(4, 1, 4.5, '2024-04-05 11:00:00'),
(5, 5, 5.0, '2024-05-20 09:45:00'),
(6, 6, 5.0, '2024-06-12 13:15:00'),
(6, 8, 2.5, '2024-06-12 13:15:00'),
(7, 2, 5.0, '2024-07-08 10:00:00'),
(8, 4, 5.0, '2024-08-22 15:30:00'),
(9, 3, 5.0, '2024-09-14 12:00:00'),
(10, 7, 5.0, '2024-10-30 16:45:00');

-- ============================================================================
-- PAPS (JOB POSTS)
-- ============================================================================

INSERT INTO "PAPS" ("paps_id", "owner_user_id", "title", "description", "subtitle", "location_text", "latitude", "longitude", "timezone", "estimated_duration_minutes", "payment_amount", "payment_currency", "payment_type", "max_assignees", "status", "published_at", "expires_at", "created_at", "updated_at") VALUES
(1, 1, 'Kitchen Cabinet Installation', 'Need experienced carpenter to install custom kitchen cabinets. All materials provided. Must have own tools.', 'Custom walnut cabinets, 15 units total', 'San Francisco, CA', 37.774929, -122.419416, 'America/Los_Angeles', 480, 800.00, 'USD', 'transfer', 1, 'completed', '2024-12-01 09:00:00', '2024-12-15 23:59:59', '2024-11-28 14:30:00', '2024-12-10 16:00:00'),
(2, 3, 'Deep House Cleaning', 'Moving out soon and need thorough deep cleaning of 2-bedroom apartment. Kitchen, bathrooms, living areas, and bedrooms.', '2BR apartment, approximately 1000 sq ft', 'Berkeley, CA', 37.871593, -122.272743, 'America/Los_Angeles', 240, 200.00, 'USD', 'cash', 1, 'completed', '2025-01-02 08:00:00', '2025-01-10 23:59:59', '2024-12-30 10:15:00', '2025-01-05 14:30:00'),
(3, 5, 'Logo Design for Small Business', 'Looking for creative designer to create a modern logo for my tutoring business. Need multiple concepts and revisions included.', 'Educational/friendly vibe preferred', 'Palo Alto, CA', 37.441883, -122.143019, 'America/Los_Angeles', 300, 350.00, 'USD', 'transfer', 1, 'closed', '2025-01-05 10:00:00', '2025-01-20 23:59:59', '2025-01-03 09:00:00', '2025-01-08 11:00:00'),
(4, 6, 'Fix Leaky Bathroom Faucet', 'Bathroom sink faucet has been dripping for weeks. Need someone to repair or replace it. I can purchase parts if needed.', 'Main bathroom, standard fixture', 'San Francisco, CA', 37.774929, -122.419416, 'America/Los_Angeles', 90, 120.00, 'USD', 'cash', 1, 'open', '2025-01-14 07:00:00', '2025-01-25 23:59:59', '2025-01-14 07:00:00', '2025-01-14 07:00:00'),
(5, 8, 'Weekly Garden Maintenance', 'Need regular gardening help for front and back yard. Mowing, weeding, trimming hedges, and general upkeep.', 'Recurring weekly service', 'Mountain View, CA', 37.386051, -122.083855, 'America/Los_Angeles', 180, 100.00, 'USD', 'transfer', 1, 'open', '2025-01-10 06:00:00', NULL, '2025-01-09 15:30:00', '2025-01-10 06:00:00'),
(6, 10, 'Wedding Photography', 'Looking for experienced photographer for outdoor wedding ceremony and reception. Need 6-8 hours coverage with edited photos.', 'June 14th wedding, 100 guests', 'Fremont, CA', 37.548270, -121.988571, 'America/Los_Angeles', 480, 1500.00, 'USD', 'transfer', 1, 'open', '2025-01-08 12:00:00', '2025-02-28 23:59:59', '2025-01-07 18:00:00', '2025-01-08 12:00:00'),
(7, 2, 'Computer Virus Removal & Tune-up', 'Laptop running very slow and getting popup ads. Need someone to clean it up and optimize performance.', 'Windows 10 laptop', 'Oakland, CA', 37.804364, -122.271114, 'America/Los_Angeles', 120, 80.00, 'USD', 'cash', 1, 'in_progress', '2025-01-12 14:00:00', '2025-01-22 23:59:59', '2025-01-12 14:00:00', '2025-01-15 10:00:00'),
(8, 9, 'Content Writing for Blog', 'Need 5 SEO-optimized blog posts (800-1000 words each) about sustainable living and eco-friendly practices.', 'Target audience: environmentally conscious millennials', 'Sunnyvale, CA', 37.368830, -122.036350, 'America/Los_Angeles', 600, 400.00, 'USD', 'transfer', 1, 'open', '2025-01-11 09:00:00', '2025-02-11 23:59:59', '2025-01-10 16:00:00', '2025-01-11 09:00:00'),
(9, 4, 'Math Tutoring for High School Student', 'Son struggling with Algebra 2. Need patient tutor for 2 sessions per week, each 90 minutes.', 'Preparing for SAT, grade 11', 'San Jose, CA', 37.338208, -121.886329, 'America/Los_Angeles', 90, 60.00, 'USD', 'cash', 1, 'open', '2025-01-13 11:00:00', '2025-03-13 23:59:59', '2025-01-12 20:00:00', '2025-01-13 11:00:00'),
(10, 7, 'Furniture Assembly Help', 'Bought new IKEA furniture (desk, bookshelf, dresser) and need help assembling. All parts included.', '3 pieces of furniture', 'Daly City, CA', 37.687931, -122.470215, 'America/Los_Angeles', 180, 100.00, 'USD', 'cash', 1, 'open', '2025-01-15 08:00:00', '2025-01-20 23:59:59', '2025-01-14 19:00:00', '2025-01-15 08:00:00');

-- ============================================================================
-- PAPS CATEGORIES
-- ============================================================================

INSERT INTO "PAPS_CATEGORY" ("paps_id", "category_id", "created_at") VALUES
(1, 1, '2024-11-28 14:30:00'),
(2, 2, '2024-12-30 10:15:00'),
(3, 8, '2025-01-03 09:00:00'),
(4, 1, '2025-01-14 07:00:00'),
(5, 3, '2025-01-09 15:30:00'),
(6, 6, '2025-01-07 18:00:00'),
(7, 4, '2025-01-12 14:00:00'),
(8, 7, '2025-01-10 16:00:00'),
(9, 5, '2025-01-12 20:00:00'),
(10, 1, '2025-01-14 19:00:00');

-- ============================================================================
-- PAPS MEDIA
-- ============================================================================

INSERT INTO "PAPS_MEDIA" ("paps_id", "media_url", "media_type", "sort_order", "created_at") VALUES
(1, 'https://images.unsplash.com/photo-1556912173-46c336c7fd55', 'image', 1, '2024-11-28 14:30:00'),
(1, 'https://images.unsplash.com/photo-1556911220-bff31c812dba', 'image', 2, '2024-11-28 14:30:00'),
(2, 'https://images.unsplash.com/photo-1581578731548-c64695cc6952', 'image', 1, '2024-12-30 10:15:00'),
(3, 'https://images.unsplash.com/photo-1626785774573-4b799315345d', 'image', 1, '2025-01-03 09:00:00'),
(5, 'https://images.unsplash.com/photo-1558904541-efa843a96f01', 'image', 1, '2025-01-09 15:30:00'),
(6, 'https://images.unsplash.com/photo-1519741497674-611481863552', 'image', 1, '2025-01-07 18:00:00');

-- ============================================================================
-- PAPS SCHEDULES
-- ============================================================================

INSERT INTO "PAPS_SCHEDULE" ("paps_id", "is_recurring", "recurrence_rule", "recurrence_interval", "recurrence_days_of_week", "start_datetime", "end_datetime", "next_run_at", "timezone", "created_at", "updated_at") VALUES
(1, FALSE, NULL, NULL, NULL, '2024-12-05 09:00:00', '2024-12-05 17:00:00', NULL, 'America/Los_Angeles', '2024-11-28 14:30:00', '2024-11-28 14:30:00'),
(2, FALSE, NULL, NULL, NULL, '2025-01-04 08:00:00', '2025-01-04 12:00:00', NULL, 'America/Los_Angeles', '2024-12-30 10:15:00', '2024-12-30 10:15:00'),
(5, TRUE, 'WEEKLY', 1, 'SAT', '2025-01-18 09:00:00', NULL, '2025-01-18 09:00:00', 'America/Los_Angeles', '2025-01-09 15:30:00', '2025-01-09 15:30:00'),
(6, FALSE, NULL, NULL, NULL, '2025-06-14 14:00:00', '2025-06-14 22:00:00', NULL, 'America/Los_Angeles', '2025-01-07 18:00:00', '2025-01-07 18:00:00'),
(9, TRUE, 'WEEKLY', 1, 'TUE,THU', '2025-01-16 16:00:00', NULL, '2025-01-16 16:00:00', 'America/Los_Angeles', '2025-01-12 20:00:00', '2025-01-12 20:00:00');

-- ============================================================================
-- COMMENTS
-- ============================================================================

INSERT INTO "COMMENT" ("user_id", "paps_id", "parent_comment_id", "content", "is_deleted", "created_at", "updated_at") VALUES
(2, 1, NULL, 'This looks like a great project! I have 10 years of cabinet installation experience. What type of wood are the cabinets?', FALSE, '2024-11-29 10:15:00', '2024-11-29 10:15:00'),
(1, 1, 1, 'They are custom walnut cabinets. Very high quality. Are you available Dec 5th?', FALSE, '2024-11-29 11:30:00', '2024-11-29 11:30:00'),
(2, 1, 2, 'Perfect! Yes, I am available. I will submit an application shortly.', FALSE, '2024-11-29 12:00:00', '2024-11-29 12:00:00'),
(7, 2, NULL, 'I have availability on January 4th. Do you need cleaning supplies provided or will you have them?', FALSE, '2025-01-02 09:30:00', '2025-01-02 09:30:00'),
(3, 2, 4, 'I have all basic supplies, but if you have eco-friendly products that would be great!', FALSE, '2025-01-02 10:00:00', '2025-01-02 10:00:00'),
(4, 4, NULL, 'Is the faucet a standard size? I might be able to help with this.', FALSE, '2025-01-14 08:00:00', '2025-01-14 08:00:00'),
(9, 5, NULL, 'I love gardening! How large is your yard? Do you have specific plants you want maintained?', FALSE, '2025-01-10 07:30:00', '2025-01-10 07:30:00');

-- ============================================================================
-- SPAPS (APPLICATIONS)
-- ============================================================================

INSERT INTO "SPAP" ("spap_id", "paps_id", "applicant_user_id", "title", "subtitle", "message", "proposed_payment_amount", "status", "location_text", "latitude", "longitude", "timezone", "created_at", "updated_at") VALUES
(1, 1, 2, 'Experienced Cabinet Installer Ready to Help', '10+ years professional carpentry', 'I have extensive experience with cabinet installation, especially custom pieces. I have all necessary tools and can complete this job efficiently. Available on your preferred date.', 800.00, 'accepted', 'Oakland, CA', 37.804364, -122.271114, 'America/Los_Angeles', '2024-11-29 13:00:00', '2024-12-01 10:00:00'),
(2, 2, 7, 'Professional Deep Cleaning Service', 'Eco-friendly products available', 'I specialize in move-out cleaning and pay attention to every detail. I bring my own eco-friendly supplies and guarantee your full deposit back. I have excellent references.', 200.00, 'accepted', 'Daly City, CA', 37.687931, -122.470215, 'America/Los_Angeles', '2025-01-02 11:00:00', '2025-01-02 15:00:00'),
(3, 3, 3, 'Creative Logo Design Package', 'Modern, professional designs with unlimited revisions', 'I would love to create a logo for your tutoring business! I specialize in educational branding and have worked with several tutors and schools. I will provide 3 initial concepts and unlimited revisions until you are completely satisfied.', 350.00, 'accepted', 'Berkeley, CA', 37.871593, -122.272743, 'America/Los_Angeles', '2025-01-05 14:00:00', '2025-01-06 09:00:00'),
(4, 4, 4, 'Quick Faucet Repair', 'Plumbing expert available today', 'I can fix your leaky faucet this afternoon. I have all the tools and common replacement parts. Usually these repairs take less than an hour.', 120.00, 'pending', 'San Jose, CA', 37.338208, -121.886329, 'America/Los_Angeles', '2025-01-14 09:00:00', '2025-01-14 09:00:00'),
(5, 5, 9, 'Professional Garden Maintenance', 'Weekly service with flexible scheduling', 'I have 12 years of landscaping experience and would be happy to maintain your garden weekly. I bring all my own equipment and can adjust the schedule as needed. I also offer seasonal planting services.', 100.00, 'accepted', 'Sunnyvale, CA', 37.368830, -122.036350, 'America/Los_Angeles', '2025-01-10 08:00:00', '2025-01-11 10:00:00'),
(6, 6, 6, 'Wedding Photography Premium Package', 'Full day coverage with professional editing', 'Congratulations on your wedding! I have photographed over 50 weddings and specialize in outdoor ceremonies. My package includes 8 hours of coverage, 500+ edited photos, and a beautiful online gallery. I would love to discuss your vision!', 1500.00, 'pending', 'San Francisco, CA', 37.774929, -122.419416, 'America/Los_Angeles', '2025-01-09 16:00:00', '2025-01-09 16:00:00'),
(7, 7, 8, 'Computer Cleanup & Optimization', 'Virus removal and performance tuning', 'I can remove all viruses and malware from your laptop and optimize it for better performance. I will also install antivirus software and show you how to keep it protected. Usually takes about 2 hours.', 80.00, 'accepted', 'Mountain View, CA', 37.386051, -122.083855, 'America/Los_Angeles', '2025-01-13 10:00:00', '2025-01-14 08:00:00'),
(8, 8, 10, 'SEO Blog Content Creation', '5 engaging, optimized articles', 'I specialize in writing eco-friendly and sustainability content. I will research keywords, create engaging content, and ensure each post is SEO-optimized. Each article will be 800-1000 words with proper headings and meta descriptions.', 400.00, 'pending', 'Fremont, CA', 37.548270, -121.988571, 'America/Los_Angeles', '2025-01-11 14:00:00', '2025-01-11 14:00:00'),
(9, 9, 5, 'Algebra 2 Tutoring - Certified Teacher', 'Experienced high school math educator', 'I taught Algebra 2 for 8 years and have helped many students prepare for the SAT. I focus on building confidence and understanding, not just memorization. I am available Tuesday and Thursday evenings.', 60.00, 'pending', 'Palo Alto, CA', 37.441883, -122.143019, 'America/Los_Angeles', '2025-01-13 15:00:00', '2025-01-13 15:00:00'),
(10, 10, 2, 'Furniture Assembly Expert', 'Fast and efficient assembly service', 'I have assembled hundreds of IKEA furniture pieces! I know all the tricks and can complete your 3 pieces in about 3 hours. I bring my own tools and clean up all packaging materials.', 100.00, 'pending', 'Oakland, CA', 37.804364, -122.271114, 'America/Los_Angeles', '2025-01-15 10:00:00', '2025-01-15 10:00:00'),
(11, 1, 4, 'Cabinet Installation Available', 'Handyman with cabinet experience', 'I have installed cabinets in several kitchens. While I specialize more in general repairs, I am confident I can handle this project. I am available on your timeline.', 750.00, 'rejected', 'San Jose, CA', 37.338208, -121.886329, 'America/Los_Angeles', '2024-11-29 15:00:00', '2024-12-01 09:00:00');

-- ============================================================================
-- SPAP MEDIA
-- ============================================================================

INSERT INTO "SPAP_MEDIA" ("spap_id", "media_url", "media_type", "sort_order", "created_at") VALUES
(1, 'https://images.unsplash.com/photo-1504148455328-c376907d081c', 'image', 1, '2024-11-29 13:00:00'),
(1, 'https://images.unsplash.com/photo-1581578731548-c64695cc6952', 'document', 2, '2024-11-29 13:00:00'),
(3, 'https://images.unsplash.com/photo-1561070791-2526d30994b5', 'image', 1, '2025-01-05 14:00:00'),
(3, 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea', 'image', 2, '2025-01-05 14:00:00'),
(6, 'https://images.unsplash.com/photo-1606800052052-a08af7148866', 'image', 1, '2025-01-09 16:00:00'),
(10, 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7', 'image', 1, '2025-01-15 10:00:00');

-- ============================================================================
-- ASAP (ASSIGNED JOBS)
-- ============================================================================

INSERT INTO "ASAP" ("asap_id", "paps_id", "spap_id", "title", "subtitle", "status", "is_group_assignment", "location_text", "latitude", "longitude", "timezone", "started_at", "due_at", "completed_at", "created_at", "updated_at") VALUES
(1, 1, 1, 'Kitchen Cabinet Installation', 'Custom walnut cabinets, 15 units total', 'completed', FALSE, 'San Francisco, CA', 37.774929, -122.419416, 'America/Los_Angeles', '2024-12-05 09:00:00', '2024-12-05 17:00:00', '2024-12-05 16:30:00', '2024-12-01 10:00:00', '2024-12-05 16:30:00'),
(2, 2, 2, 'Deep House Cleaning', '2BR apartment, approximately 1000 sq ft', 'completed', FALSE, 'Berkeley, CA', 37.871593, -122.272743, 'America/Los_Angeles', '2025-01-04 08:00:00', '2025-01-04 12:00:00', '2025-01-04 11:45:00', '2025-01-02 15:00:00', '2025-01-04 11:45:00'),
(3, 3, 3, 'Logo Design for Small Business', 'Educational/friendly vibe preferred', 'completed', FALSE, 'Palo Alto, CA', 37.441883, -122.143019, 'America/Los_Angeles', '2025-01-06 10:00:00', '2025-01-15 23:59:59', '2025-01-12 14:00:00', '2025-01-06 09:00:00', '2025-01-12 14:00:00'),
(4, 5, 5, 'Weekly Garden Maintenance', 'Recurring weekly service', 'in_progress', FALSE, 'Mountain View, CA', 37.386051, -122.083855, 'America/Los_Angeles', '2025-01-11 09:00:00', NULL, NULL, '2025-01-11 10:00:00', '2025-01-11 10:00:00'),
(5, 7, 7, 'Computer Virus Removal & Tune-up', 'Windows 10 laptop', 'in_progress', FALSE, 'Oakland, CA', 37.804364, -122.271114, 'America/Los_Angeles', '2025-01-15 14:00:00', '2025-01-15 16:00:00', NULL, '2025-01-14 08:00:00', '2025-01-15 14:00:00');

-- ============================================================================
-- ASAP ASSIGNEES
-- ============================================================================

INSERT INTO "ASAP_ASSIGNEE" ("asap_id", "user_id", "role", "assigned_at", "unassigned_at") VALUES
(1, 2, 'worker', '2024-12-01 10:00:00', NULL),
(2, 7, 'worker', '2025-01-02 15:00:00', NULL),
(3, 3, 'worker', '2025-01-06 09:00:00', NULL),
(4, 9, 'worker', '2025-01-11 10:00:00', NULL),
(5, 8, 'worker', '2025-01-14 08:00:00', NULL);

-- ============================================================================
-- ASAP MEDIA
-- ============================================================================

INSERT INTO "ASAP_MEDIA" ("asap_id", "media_url", "media_type", "sort_order", "created_at") VALUES
(1, 'https://images.unsplash.com/photo-1556911220-bff31c812dba', 'image', 1, '2024-12-05 16:30:00'),
(1, 'https://images.unsplash.com/photo-1556912173-46c336c7fd55', 'image', 2, '2024-12-05 16:30:00'),
(2, 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50', 'image', 1, '2025-01-04 11:45:00'),
(3, 'https://images.unsplash.com/photo-1626785774573-4b799315345d', 'image', 1, '2025-01-12 14:00:00'),
(3, 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960', 'image', 2, '2025-01-12 14:00:00');

-- ============================================================================
-- RATINGS & REVIEWS
-- ============================================================================

INSERT INTO "RATING" ("asap_id", "worker_user_id", "rater_user_id", "score", "review_text", "created_at") VALUES
(1, 2, 1, 5, 'John did an absolutely fantastic job installing the cabinets! They look professional and beautiful. He was on time, very careful with the work, and cleaned up everything perfectly. Highly recommend!', '2024-12-06 10:00:00'),
(2, 7, 3, 5, 'Maria is amazing! The apartment looks spotless - even better than when I moved in. She was thorough, professional, and used eco-friendly products as I requested. Will definitely hire again!', '2025-01-05 09:00:00'),
(3, 3, 5, 5, 'Emily created the perfect logo for my tutoring business! She really understood my vision and the designs were creative and professional. The revision process was smooth and she was very responsive. Love the final result!', '2025-01-13 10:00:00'),
(1, 2, 1, 5, 'Excellent craftsmanship and attention to detail. Would hire again without hesitation.', '2024-12-06 10:30:00'),
(2, 7, 3, 5, 'Best cleaning service I have used. Very impressed!', '2025-01-05 09:30:00');

-- ============================================================================
-- CHAT THREADS
-- ============================================================================

INSERT INTO "CHAT_THREAD" ("chat_thread_id", "asap_id", "spap_id", "created_at", "updated_at") VALUES
(1, 1, 1, '2024-11-29 13:00:00', '2024-12-05 16:30:00'),
(2, 2, 2, '2025-01-02 11:00:00', '2025-01-04 11:45:00'),
(3, 3, 3, '2025-01-05 14:00:00', '2025-01-12 14:00:00'),
(4, NULL, 4, '2025-01-14 09:00:00', '2025-01-14 09:00:00'),
(5, 4, 5, '2025-01-10 08:00:00', '2025-01-15 12:00:00'),
(6, NULL, 6, '2025-01-09 16:00:00', '2025-01-10 11:00:00'),
(7, 5, 7, '2025-01-13 10:00:00', '2025-01-15 15:00:00'),
(8, NULL, 8, '2025-01-11 14:00:00', '2025-01-12 09:00:00');

-- ============================================================================
-- CHAT PARTICIPANTS
-- ============================================================================

INSERT INTO "CHAT_PARTICIPANT" ("chat_thread_id", "user_id", "joined_at", "left_at") VALUES
(1, 1, '2024-11-29 13:00:00', NULL),
(1, 2, '2024-11-29 13:00:00', NULL),
(2, 3, '2025-01-02 11:00:00', NULL),
(2, 7, '2025-01-02 11:00:00', NULL),
(3, 5, '2025-01-05 14:00:00', NULL),
(3, 3, '2025-01-05 14:00:00', NULL),
(4, 6, '2025-01-14 09:00:00', NULL),
(4, 4, '2025-01-14 09:00:00', NULL),
(5, 8, '2025-01-10 08:00:00', NULL),
(5, 9, '2025-01-10 08:00:00', NULL),
(6, 10, '2025-01-09 16:00:00', NULL),
(6, 6, '2025-01-09 16:00:00', NULL),
(7, 2, '2025-01-13 10:00:00', NULL),
(7, 8, '2025-01-13 10:00:00', NULL),
(8, 9, '2025-01-11 14:00:00', NULL),
(8, 10, '2025-01-11 14:00:00', NULL);

-- ============================================================================
-- CHAT MESSAGES
-- ============================================================================

INSERT INTO "CHAT_MESSAGE" ("chat_thread_id", "sender_user_id", "message_type", "content", "attachment_url", "is_read", "read_at", "created_at") VALUES
(1, 2, 'text', 'Hi! I just submitted my application for the cabinet installation job. I am very excited about this project!', NULL, TRUE, '2024-11-29 13:05:00', '2024-11-29 13:00:00'),
(1, 1, 'text', 'Great! I saw your application and your experience looks perfect. Are you available on December 5th starting at 9 AM?', NULL, TRUE, '2024-11-29 13:30:00', '2024-11-29 13:15:00'),
(1, 2, 'text', 'Yes, that works perfectly for me. I will bring all my tools. Do you need me to pick up any specific hardware or will everything be on site?', NULL, TRUE, '2024-11-29 13:45:00', '2024-11-29 13:40:00'),
(1, 1, 'text', 'All hardware and materials will be ready. Just bring your tools. See you on the 5th!', NULL, TRUE, '2024-11-29 14:00:00', '2024-11-29 13:50:00'),
(1, 2, 'system', 'Application accepted', NULL, TRUE, '2024-12-01 10:00:00', '2024-12-01 10:00:00'),
(1, 2, 'text', 'On my way! Should arrive around 8:50 AM.', NULL, TRUE, '2024-12-05 08:30:00', '2024-12-05 08:30:00'),
(1, 2, 'text', 'All done! The cabinets look amazing. I have cleaned up and everything is ready.', NULL, TRUE, '2024-12-05 16:35:00', '2024-12-05 16:30:00'),
(2, 7, 'text', 'Hello! I am interested in your deep cleaning job. I can do it on January 4th. Do you have any specific areas you want me to focus on?', NULL, TRUE, '2025-01-02 11:05:00', '2025-01-02 11:00:00'),
(2, 3, 'text', 'Thanks for applying! The kitchen and bathrooms need the most attention. I will be moving out so it needs to be spotless for inspection.', NULL, TRUE, '2025-01-02 11:30:00', '2025-01-02 11:15:00'),
(2, 7, 'text', 'Perfect! I specialize in move-out cleaning and will make sure everything is inspection-ready. I will bring all my eco-friendly supplies.', NULL, TRUE, '2025-01-02 11:45:00', '2025-01-02 11:40:00'),
(2, 3, 'system', 'Application accepted', NULL, TRUE, '2025-01-02 15:00:00', '2025-01-02 15:00:00'),
(2, 7, 'text', 'Starting the cleaning now. Everything looks good so far!', NULL, TRUE, '2025-01-04 08:15:00', '2025-01-04 08:10:00'),
(3, 3, 'text', 'Hi Lisa! I would love to design your tutoring business logo. Can you tell me more about your teaching style and target audience?', NULL, TRUE, '2025-01-05 14:15:00', '2025-01-05 14:00:00'),
(3, 5, 'text', 'I focus on STEM subjects for high school students. I want something modern but approachable - not too corporate. Maybe incorporating books or lightbulb imagery?', NULL, TRUE, '2025-01-05 15:00:00', '2025-01-05 14:30:00'),
(3, 3, 'text', 'Perfect! I have some great ideas. I will send you 3 initial concepts by Monday. What colors do you prefer?', NULL, TRUE, '2025-01-05 15:30:00', '2025-01-05 15:15:00'),
(3, 5, 'text', 'I like blues and greens - calming but energetic colors. Thank you so much!', NULL, TRUE, '2025-01-05 16:00:00', '2025-01-05 15:45:00'),
(3, 3, 'system', 'Application accepted', NULL, TRUE, '2025-01-06 09:00:00', '2025-01-06 09:00:00'),
(3, 3, 'image', 'Here are the three initial logo concepts. Let me know which direction you like best!', 'https://images.unsplash.com/photo-1626785774573-4b799315345d', TRUE, '2025-01-07 10:30:00', '2025-01-07 10:00:00'),
(3, 5, 'text', 'I love concept #2! Can we try it with a slightly darker blue?', NULL, TRUE, '2025-01-07 14:00:00', '2025-01-07 13:30:00'),
(3, 3, 'image', 'Updated version with darker blue. How does this look?', 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960', TRUE, '2025-01-08 11:00:00', '2025-01-08 10:30:00'),
(3, 5, 'text', 'Absolutely perfect! This is exactly what I envisioned. Thank you!', NULL, TRUE, '2025-01-08 14:00:00', '2025-01-08 13:45:00'),
(5, 9, 'text', 'Hi! I am very interested in your weekly garden maintenance job. I have been doing landscaping for over 10 years.', NULL, TRUE, '2025-01-10 08:15:00', '2025-01-10 08:00:00'),
(5, 8, 'text', 'That sounds great! The front yard is mostly lawn with some hedges, and the back has a small vegetable garden and some flower beds.', NULL, TRUE, '2025-01-10 09:00:00', '2025-01-10 08:30:00'),
(5, 9, 'text', 'Perfect! I can handle all of that. Would Saturday mornings work for you? Around 9 AM?', NULL, TRUE, '2025-01-10 09:30:00', '2025-01-10 09:15:00'),
(5, 8, 'text', 'Saturday at 9 works perfectly. Looking forward to working with you!', NULL, TRUE, '2025-01-10 10:00:00', '2025-01-10 09:45:00'),
(5, 9, 'system', 'Application accepted', NULL, TRUE, '2025-01-11 10:00:00', '2025-01-11 10:00:00'),
(5, 9, 'text', 'Finished this weeks maintenance! The lawn looks great and I trimmed all the hedges. See you next Saturday!', NULL, TRUE, '2025-01-15 12:15:00', '2025-01-15 12:00:00'),
(7, 8, 'text', 'Hi John! I can help with your laptop today. I will remove all viruses and optimize the performance.', NULL, TRUE, '2025-01-13 10:15:00', '2025-01-13 10:00:00'),
(7, 2, 'text', 'That would be great! It has been running really slow. When can you come by?', NULL, TRUE, '2025-01-13 11:00:00', '2025-01-13 10:30:00'),
(7, 8, 'text', 'How about tomorrow afternoon around 2 PM? I will bring my tools and software.', NULL, TRUE, '2025-01-13 12:00:00', '2025-01-13 11:45:00'),
(7, 2, 'text', 'Perfect! See you tomorrow at 2.', NULL, TRUE, '2025-01-13 13:00:00', '2025-01-13 12:30:00'),
(7, 8, 'system', 'Application accepted', NULL, TRUE, '2025-01-14 08:00:00', '2025-01-14 08:00:00'),
(7, 8, 'text', 'Working on your laptop now. Found several viruses and malware. Cleaning everything up.', NULL, FALSE, NULL, '2025-01-15 14:30:00'),
(7, 8, 'text', 'All cleaned up! I also installed antivirus software and optimized your startup programs. Should run much faster now.', NULL, FALSE, NULL, '2025-01-15 15:30:00');

-- ============================================================================
-- PAYMENTS
-- ============================================================================

INSERT INTO "PAYMENT" ("asap_id", "payer_user_id", "payee_user_id", "amount", "payment_currency", "method", "status", "external_reference", "paid_at", "created_at", "updated_at") VALUES
(1, 1, 2, 800.00, 'USD', 'transfer', 'completed', 'TXN-20241206-001', '2024-12-06 09:00:00', '2024-12-05 16:30:00', '2024-12-06 09:00:00'),
(2, 3, 7, 200.00, 'USD', 'cash', 'completed', NULL, '2025-01-04 12:00:00', '2025-01-04 11:45:00', '2025-01-04 12:00:00'),
(3, 5, 3, 350.00, 'USD', 'transfer', 'completed', 'TXN-20250113-002', '2025-01-13 11:00:00', '2025-01-12 14:00:00', '2025-01-13 11:00:00'),
(4, 8, 9, 100.00, 'USD', 'transfer', 'completed', 'TXN-20250111-003', '2025-01-11 12:00:00', '2025-01-11 11:00:00', '2025-01-11 12:00:00'),
(5, 2, 8, 80.00, 'USD', 'cash', 'pending', NULL, NULL, '2025-01-15 14:00:00', '2025-01-15 14:00:00');

-- ============================================================================
-- UPDATE SEQUENCES
-- ============================================================================

SELECT setval('"ROLE_role_id_seq"', (SELECT MAX("role_id") FROM "ROLE"));
SELECT setval('"USER_user_id_seq"', (SELECT MAX("user_id") FROM "USER"));
SELECT setval('"USER_PROFILE_profile_id_seq"', (SELECT MAX("profile_id") FROM "USER_PROFILE"));
SELECT setval('"USER_EXPERIENCE_experience_id_seq"', (SELECT MAX("experience_id") FROM "USER_EXPERIENCE"));
SELECT setval('"CATEGORY_category_id_seq"', (SELECT MAX("category_id") FROM "CATEGORY"));
SELECT setval('"USER_INTEREST_user_interest_id_seq"', (SELECT MAX("user_interest_id") FROM "USER_INTEREST"));
SELECT setval('"PAPS_paps_id_seq"', (SELECT MAX("paps_id") FROM "PAPS"));
SELECT setval('"PAPS_CATEGORY_paps_category_id_seq"', (SELECT MAX("paps_category_id") FROM "PAPS_CATEGORY"));
SELECT setval('"PAPS_MEDIA_paps_media_id_seq"', (SELECT MAX("paps_media_id") FROM "PAPS_MEDIA"));
SELECT setval('"PAPS_SCHEDULE_paps_schedule_id_seq"', (SELECT MAX("paps_schedule_id") FROM "PAPS_SCHEDULE"));
SELECT setval('"COMMENT_comment_id_seq"', (SELECT MAX("comment_id") FROM "COMMENT"));
SELECT setval('"SPAP_spap_id_seq"', (SELECT MAX("spap_id") FROM "SPAP"));
SELECT setval('"SPAP_MEDIA_spap_media_id_seq"', (SELECT MAX("spap_media_id") FROM "SPAP_MEDIA"));
SELECT setval('"ASAP_asap_id_seq"', (SELECT MAX("asap_id") FROM "ASAP"));
SELECT setval('"ASAP_ASSIGNEE_asap_assignee_id_seq"', (SELECT MAX("asap_assignee_id") FROM "ASAP_ASSIGNEE"));
SELECT setval('"ASAP_MEDIA_asap_media_id_seq"', (SELECT MAX("asap_media_id") FROM "ASAP_MEDIA"));
SELECT setval('"RATING_rating_id_seq"', (SELECT MAX("rating_id") FROM "RATING"));
SELECT setval('"CHAT_THREAD_chat_thread_id_seq"', (SELECT MAX("chat_thread_id") FROM "CHAT_THREAD"));
SELECT setval('"CHAT_PARTICIPANT_chat_participant_id_seq"', (SELECT MAX("chat_participant_id") FROM "CHAT_PARTICIPANT"));
SELECT setval('"CHAT_MESSAGE_chat_message_id_seq"', (SELECT MAX("chat_message_id") FROM "CHAT_MESSAGE"));
SELECT setval('"PAYMENT_payment_id_seq"', (SELECT MAX("payment_id") FROM "PAYMENT"));

-- ============================================================================
-- END OF DATA.SQL
-- ============================================================================