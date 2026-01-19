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

--
-- Other tables' initial data can go below
--