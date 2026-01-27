-- ============================================
-- UNDERBOSS DATABASE CLEANUP
-- Drops all tables, views, indexes, and functions
-- ============================================

-- ============================================
-- 1. DROP VIEWS
-- ============================================

DROP VIEW IF EXISTS v_active_assignments CASCADE;
DROP VIEW IF EXISTS v_user_posting_stats CASCADE;
DROP VIEW IF EXISTS v_user_application_stats CASCADE;
DROP VIEW IF EXISTS v_user_ratings CASCADE;
DROP VIEW IF EXISTS v_active_paps CASCADE;

-- ============================================
-- 2. DROP TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_user_updated_at ON "USER" CASCADE;
DROP TRIGGER IF EXISTS update_user_profile_updated_at ON USER_PROFILE CASCADE;
DROP TRIGGER IF EXISTS update_USER_PROFILE_updated_at ON USER_PROFILE CASCADE;
DROP TRIGGER IF EXISTS update_paps_updated_at ON PAPS CASCADE;
DROP TRIGGER IF EXISTS update_paps_schedule_updated_at ON PAPS_SCHEDULE CASCADE;
DROP TRIGGER IF EXISTS update_PAPS_SCHEDULE_updated_at ON PAPS_SCHEDULE CASCADE;
DROP TRIGGER IF EXISTS update_comment_updated_at ON COMMENT CASCADE;
DROP TRIGGER IF EXISTS update_asap_updated_at ON ASAP CASCADE;
DROP TRIGGER IF EXISTS update_payment_updated_at ON PAYMENT CASCADE;
DROP TRIGGER IF EXISTS update_chat_thread_updated_at ON CHAT_THREAD CASCADE;
DROP TRIGGER IF EXISTS update_CHAT_THREAD_updated_at ON CHAT_THREAD CASCADE;
DROP TRIGGER IF EXISTS auto_create_user_profile ON "USER" CASCADE;

-- ============================================
-- 3. DROP INDEXES
-- ============================================

-- User indexes
DROP INDEX IF EXISTS idx_user_email CASCADE;
DROP INDEX IF EXISTS idx_user_phone CASCADE;
DROP INDEX IF EXISTS idx_user_role CASCADE;
DROP INDEX IF EXISTS idx_user_active CASCADE;
DROP INDEX IF EXISTS idx_user_username CASCADE;

-- Profile indexes
DROP INDEX IF EXISTS idx_profile_user CASCADE;
DROP INDEX IF EXISTS idx_profile_location CASCADE;

-- PAPS indexes
DROP INDEX IF EXISTS idx_paps_owner CASCADE;
DROP INDEX IF EXISTS idx_paps_status CASCADE;
DROP INDEX IF EXISTS idx_paps_published CASCADE;
DROP INDEX IF EXISTS idx_paps_created CASCADE;
DROP INDEX IF EXISTS idx_paps_location CASCADE;
DROP INDEX IF EXISTS idx_paps_location_lat_lng CASCADE;
DROP INDEX IF EXISTS idx_paps_deleted CASCADE;

-- PAPS_CATEGORY indexes
DROP INDEX IF EXISTS idx_paps_category_paps CASCADE;
DROP INDEX IF EXISTS idx_paps_category_category CASCADE;
DROP INDEX IF EXISTS idx_paps_category_primary CASCADE;
DROP INDEX IF EXISTS idx_PAPS_CATEGORY_primary CASCADE;

-- SPAP indexes
DROP INDEX IF EXISTS idx_spap_paps CASCADE;
DROP INDEX IF EXISTS idx_spap_applicant CASCADE;
DROP INDEX IF EXISTS idx_spap_status CASCADE;
DROP INDEX IF EXISTS idx_spap_applied CASCADE;

-- ASAP indexes
DROP INDEX IF EXISTS idx_asap_paps CASCADE;
DROP INDEX IF EXISTS idx_asap_spap CASCADE;
DROP INDEX IF EXISTS idx_asap_accepted_user CASCADE;
DROP INDEX IF EXISTS idx_asap_owner CASCADE;
DROP INDEX IF EXISTS idx_asap_status CASCADE;
DROP INDEX IF EXISTS idx_asap_assigned CASCADE;
DROP INDEX IF EXISTS idx_asap_completed CASCADE;
DROP INDEX IF EXISTS idx_asap_expires CASCADE;
DROP INDEX IF EXISTS idx_ASAP_ASSIGNEE_lead CASCADE;

-- Payment indexes
DROP INDEX IF EXISTS idx_payment_asap CASCADE;
DROP INDEX IF EXISTS idx_payment_payer CASCADE;
DROP INDEX IF EXISTS idx_payment_payee CASCADE;
DROP INDEX IF EXISTS idx_payment_status CASCADE;
DROP INDEX IF EXISTS idx_payment_transaction CASCADE;

-- Chat indexes
DROP INDEX IF EXISTS idx_chat_thread_paps CASCADE;
DROP INDEX IF EXISTS idx_chat_thread_spap CASCADE;
DROP INDEX IF EXISTS idx_chat_thread_asap CASCADE;
DROP INDEX IF EXISTS idx_chat_message_thread CASCADE;
DROP INDEX IF EXISTS idx_chat_message_sender CASCADE;
DROP INDEX IF EXISTS idx_chat_message_sent CASCADE;
DROP INDEX IF EXISTS idx_chat_participant_thread CASCADE;
DROP INDEX IF EXISTS idx_chat_participant_user CASCADE;
DROP INDEX IF EXISTS idx_CHAT_THREAD_paps CASCADE;
DROP INDEX IF EXISTS idx_CHAT_THREAD_spap CASCADE;
DROP INDEX IF EXISTS idx_CHAT_THREAD_asap CASCADE;
DROP INDEX IF EXISTS idx_CHAT_MESSAGE_thread CASCADE;
DROP INDEX IF EXISTS idx_CHAT_MESSAGE_sender CASCADE;

-- Comment indexes
DROP INDEX IF EXISTS idx_comment_paps CASCADE;
DROP INDEX IF EXISTS idx_comment_user CASCADE;
DROP INDEX IF EXISTS idx_comment_parent CASCADE;
DROP INDEX IF EXISTS idx_comment_deleted CASCADE;

-- Category indexes
DROP INDEX IF EXISTS idx_category_parent CASCADE;
DROP INDEX IF EXISTS idx_category_active CASCADE;
DROP INDEX IF EXISTS idx_category_slug CASCADE;

-- User Interest/Experience indexes
DROP INDEX IF EXISTS idx_user_interest_user CASCADE;
DROP INDEX IF EXISTS idx_user_interest_category CASCADE;
DROP INDEX IF EXISTS idx_user_experience_user CASCADE;

-- ============================================
-- 4. DROP TABLES (in reverse dependency order)
-- ============================================

-- Chat tables
DROP TABLE IF EXISTS CHAT_MESSAGE CASCADE;
DROP TABLE IF EXISTS CHAT_PARTICIPANT CASCADE;
DROP TABLE IF EXISTS CHAT_THREAD CASCADE;

-- Payment table
DROP TABLE IF EXISTS PAYMENT CASCADE;

-- ASAP tables
DROP TABLE IF EXISTS ASAP_MEDIA CASCADE;
DROP TABLE IF EXISTS ASAP CASCADE;

-- SPAP tables
DROP TABLE IF EXISTS SPAP_MEDIA CASCADE;
DROP TABLE IF EXISTS SPAP CASCADE;

-- Comment table
DROP TABLE IF EXISTS COMMENT CASCADE;

-- PAPS tables
DROP TABLE IF EXISTS PAPS_SCHEDULE CASCADE;
DROP TABLE IF EXISTS PAPS_CATEGORY CASCADE;
DROP TABLE IF EXISTS PAPS_MEDIA CASCADE;
DROP TABLE IF EXISTS PAPS CASCADE;

-- Category and User Interest tables
DROP TABLE IF EXISTS USER_INTEREST CASCADE;
DROP TABLE IF EXISTS CATEGORY CASCADE;

-- User tables
DROP TABLE IF EXISTS USER_EXPERIENCE CASCADE;
DROP TABLE IF EXISTS USER_PROFILE CASCADE;
DROP TABLE IF EXISTS "USER" CASCADE;
DROP TABLE IF EXISTS ROLE CASCADE;

-- ============================================
-- 5. DROP FUNCTIONS
-- ============================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS create_user_profile() CASCADE;

-- ============================================
-- 6. DROP EXTENSIONS
-- ============================================

DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- ============================================
-- DATABASE CLEANUP COMPLETE
-- ============================================

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE 'Underboss database cleanup complete!';
    RAISE NOTICE 'Remaining tables: %', table_count;
    RAISE NOTICE 'All views dropped';
    RAISE NOTICE 'All indexes dropped';
    RAISE NOTICE 'All triggers dropped';
    RAISE NOTICE 'All functions dropped';
END $$;
