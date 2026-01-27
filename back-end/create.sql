-- ============================================
-- UNDERBOSS DATABASE SCHEMA
-- Complete database schema with all tables, indexes, triggers, and constraints
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Distance calculation function (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, 
    lon1 DECIMAL, 
    lat2 DECIMAL, 
    lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    R CONSTANT DECIMAL := 6371; -- Earth's radius in kilometers
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- CORE TABLES
-- ============================================

-- ROLE: User roles (admin, user, moderator)
CREATE TABLE ROLE (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USER: Core user accounts
CREATE TABLE "USER" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES ROLE(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT user_username_not_empty CHECK (LENGTH(TRIM(username)) >= 3),
    CONSTRAINT user_email_not_empty CHECK (LENGTH(TRIM(email)) >= 5),
    CONSTRAINT user_username_format CHECK (username ~ '^[a-zA-Z][-a-zA-Z0-9_\.]*$')
);

-- USER_PROFILE: Extended user profile information
CREATE TABLE USER_PROFILE (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES "USER"(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    bio TEXT,
    avatar_url VARCHAR(500),
    date_of_birth DATE,
    gender CHAR(1) CHECK (gender IN ('M', 'F', 'O', 'N')),
    location_address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    timezone VARCHAR(50),
    preferred_language VARCHAR(10) DEFAULT 'en',
    -- Rating aggregates (moving average)
    rating_average DECIMAL(3, 2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT profile_latitude_range CHECK (location_lat IS NULL OR (location_lat >= -90 AND location_lat <= 90)),
    CONSTRAINT profile_longitude_range CHECK (location_lng IS NULL OR (location_lng >= -180 AND location_lng <= 180)),
    CONSTRAINT profile_coordinates_pair CHECK ((location_lat IS NULL AND location_lng IS NULL) OR (location_lat IS NOT NULL AND location_lng IS NOT NULL)),
    CONSTRAINT profile_rating_valid CHECK (rating_average >= 0 AND rating_average <= 5),
    CONSTRAINT profile_rating_count_valid CHECK (rating_count >= 0)
);

-- USER_EXPERIENCE: Work history and experience
CREATE TABLE USER_EXPERIENCE (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    company VARCHAR(200),
    description TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT experience_title_not_empty CHECK (LENGTH(TRIM(title)) >= 1),
    CONSTRAINT experience_dates_valid CHECK (end_date IS NULL OR end_date >= start_date)
);

-- CATEGORY: Task/skill categories
CREATE TABLE CATEGORY (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES CATEGORY(id) ON DELETE SET NULL,
    icon_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT category_name_not_empty CHECK (LENGTH(TRIM(name)) >= 2),
    CONSTRAINT category_slug_not_empty CHECK (LENGTH(TRIM(slug)) >= 2),
    CONSTRAINT category_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- USER_INTEREST: User skill/interest categories with proficiency
CREATE TABLE USER_INTEREST (
    user_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES CATEGORY(id) ON DELETE CASCADE,
    proficiency_level INTEGER DEFAULT 3 CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, category_id)
);

-- ============================================
-- PAPS (JOB POSTING) TABLES
-- ============================================

-- PAPS: Job postings / tasks
CREATE TABLE PAPS (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(300),
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'published', 'closed', 'cancelled', 'expired', 'completed')),
    -- Location
    location_address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_timezone VARCHAR(50),
    -- Timing
    start_datetime TIMESTAMP,
    end_datetime TIMESTAMP,
    estimated_duration_minutes INTEGER,
    -- Payment
    payment_amount DECIMAL(12, 2),
    payment_currency VARCHAR(3) DEFAULT 'USD' CHECK (payment_currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY')),
    payment_type VARCHAR(20) DEFAULT 'fixed' CHECK (payment_type IN ('fixed', 'hourly', 'negotiable')),
    -- Limits
    max_applicants INTEGER DEFAULT 10,
    max_assignees INTEGER DEFAULT 1,
    -- Visibility
    is_public BOOLEAN DEFAULT TRUE,
    publish_at TIMESTAMP,
    expires_at TIMESTAMP,
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT paps_title_not_empty CHECK (LENGTH(TRIM(title)) >= 5),
    CONSTRAINT paps_description_not_empty CHECK (LENGTH(TRIM(description)) >= 20),
    CONSTRAINT paps_latitude_range CHECK (location_lat IS NULL OR (location_lat >= -90 AND location_lat <= 90)),
    CONSTRAINT paps_longitude_range CHECK (location_lng IS NULL OR (location_lng >= -180 AND location_lng <= 180)),
    CONSTRAINT paps_coordinates_pair CHECK ((location_lat IS NULL AND location_lng IS NULL) OR (location_lat IS NOT NULL AND location_lng IS NOT NULL)),
    CONSTRAINT paps_payment_non_negative CHECK (payment_amount IS NULL OR payment_amount >= 0),
    CONSTRAINT paps_max_applicants_positive CHECK (max_applicants > 0),
    CONSTRAINT paps_max_assignees_valid CHECK (max_assignees > 0 AND max_assignees <= max_applicants),
    CONSTRAINT paps_dates_valid CHECK (end_datetime IS NULL OR end_datetime > start_datetime),
    CONSTRAINT paps_expires_after_publish CHECK (expires_at IS NULL OR publish_at IS NULL OR expires_at > publish_at)
);

-- PAPS_CATEGORY: Many-to-many relation between PAPS and CATEGORY
CREATE TABLE PAPS_CATEGORY (
    paps_id UUID NOT NULL REFERENCES PAPS(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES CATEGORY(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    
    PRIMARY KEY (paps_id, category_id)
);

-- PAPS_MEDIA: Media files for job postings
CREATE TABLE PAPS_MEDIA (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paps_id UUID NOT NULL REFERENCES PAPS(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video', 'document')),
    file_extension VARCHAR(10) NOT NULL,
    file_size_bytes INTEGER,
    mime_type VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT paps_media_extension_not_empty CHECK (LENGTH(TRIM(file_extension)) >= 1),
    CONSTRAINT paps_media_order_non_negative CHECK (display_order >= 0)
);

-- PAPS_SCHEDULE: Recurring job schedules
CREATE TABLE PAPS_SCHEDULE (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paps_id UUID NOT NULL REFERENCES PAPS(id) ON DELETE CASCADE,
    recurrence_rule VARCHAR(50) CHECK (recurrence_rule IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CRON')),
    cron_expression VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    next_run_at TIMESTAMP,
    last_run_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT schedule_dates_valid CHECK (end_date IS NULL OR end_date >= start_date)
);

-- ============================================
-- SPAP (APPLICATION) TABLES
-- SPAP is a pure relationship table for applications
-- ============================================

-- SPAP: Job applications (relationship between user and PAPS)
CREATE TABLE SPAP (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paps_id UUID NOT NULL REFERENCES PAPS(id) ON DELETE RESTRICT,
    applicant_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE RESTRICT,
    -- Application content
    title VARCHAR(200),
    subtitle VARCHAR(300),
    message TEXT,
    -- Optional proposed terms
    proposed_payment DECIMAL(12, 2),
    -- Applicant location at time of application
    location_address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_timezone VARCHAR(50),
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'withdrawn', 'rejected', 'accepted')),
    -- Timestamps
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    
    CONSTRAINT spap_unique_application UNIQUE (paps_id, applicant_id),
    CONSTRAINT spap_latitude_range CHECK (location_lat IS NULL OR (location_lat >= -90 AND location_lat <= 90)),
    CONSTRAINT spap_longitude_range CHECK (location_lng IS NULL OR (location_lng >= -180 AND location_lng <= 180)),
    CONSTRAINT spap_coordinates_pair CHECK ((location_lat IS NULL AND location_lng IS NULL) OR (location_lat IS NOT NULL AND location_lng IS NOT NULL)),
    CONSTRAINT spap_proposed_payment_non_negative CHECK (proposed_payment IS NULL OR proposed_payment >= 0)
);

-- SPAP_MEDIA: Media files for applications
CREATE TABLE SPAP_MEDIA (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spap_id UUID NOT NULL REFERENCES SPAP(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video', 'document')),
    file_extension VARCHAR(10) NOT NULL,
    file_size_bytes INTEGER,
    mime_type VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT spap_media_extension_not_empty CHECK (LENGTH(TRIM(file_extension)) >= 1),
    CONSTRAINT spap_media_order_non_negative CHECK (display_order >= 0)
);

-- ============================================
-- ASAP (ASSIGNED JOB) TABLES
-- ASAP represents accepted assignments - NO reference to SPAP
-- ============================================

-- ASAP: Accepted job assignments
CREATE TABLE ASAP (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paps_id UUID NOT NULL REFERENCES PAPS(id) ON DELETE RESTRICT,
    -- The user who was accepted for the job
    accepted_user_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE RESTRICT,
    -- The PAPS owner (denormalized for easier queries)
    owner_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE RESTRICT,
    -- Assignment details (can be copied/modified from PAPS)
    title VARCHAR(200),
    subtitle VARCHAR(300),
    -- Location for the assignment
    location_address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_timezone VARCHAR(50),
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled', 'disputed')),
    -- Lifecycle timestamps
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    due_at TIMESTAMP,
    completed_at TIMESTAMP,
    -- For auto-cleanup after completion
    expires_at TIMESTAMP,
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Each user can only have one active assignment per PAPS
    CONSTRAINT asap_unique_assignment UNIQUE (paps_id, accepted_user_id),
    CONSTRAINT asap_latitude_range CHECK (location_lat IS NULL OR (location_lat >= -90 AND location_lat <= 90)),
    CONSTRAINT asap_longitude_range CHECK (location_lng IS NULL OR (location_lng >= -180 AND location_lng <= 180)),
    CONSTRAINT asap_coordinates_pair CHECK ((location_lat IS NULL AND location_lng IS NULL) OR (location_lat IS NOT NULL AND location_lng IS NOT NULL)),
    CONSTRAINT asap_due_after_start CHECK (due_at IS NULL OR started_at IS NULL OR due_at >= started_at),
    CONSTRAINT asap_completed_after_start CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at),
    CONSTRAINT asap_no_self_assignment CHECK (accepted_user_id != owner_id)
);

-- ASAP_MEDIA: Media files for assignments (uploaded by PAPS owner only)
CREATE TABLE ASAP_MEDIA (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asap_id UUID NOT NULL REFERENCES ASAP(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video', 'document')),
    file_extension VARCHAR(10) NOT NULL,
    file_size_bytes INTEGER,
    mime_type VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT asap_media_extension_not_empty CHECK (LENGTH(TRIM(file_extension)) >= 1),
    CONSTRAINT asap_media_order_non_negative CHECK (display_order >= 0)
);

-- ============================================
-- PAYMENT TABLES
-- ============================================

-- PAYMENT: Payment records for completed work
CREATE TABLE PAYMENT (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paps_id UUID NOT NULL REFERENCES PAPS(id) ON DELETE RESTRICT,
    payer_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE RESTRICT,
    payee_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE RESTRICT,
    -- Payment details
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('transfer', 'cash', 'check', 'crypto', 'paypal', 'stripe', 'other')),
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    -- External references
    external_reference VARCHAR(255),
    transaction_id VARCHAR(255),
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    
    CONSTRAINT payment_amount_positive CHECK (amount > 0),
    CONSTRAINT payment_no_self_pay CHECK (payer_id != payee_id),
    CONSTRAINT payment_paid_at_when_completed CHECK (status != 'completed' OR paid_at IS NOT NULL)
);

-- ============================================
-- CHAT TABLES
-- Chat threads reference EITHER SPAP OR ASAP (mutually exclusive)
-- ============================================

-- CHAT_THREAD: Conversation threads
CREATE TABLE CHAT_THREAD (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paps_id UUID NOT NULL REFERENCES PAPS(id) ON DELETE CASCADE,
    -- Mutually exclusive: either spap_id OR asap_id
    spap_id UUID REFERENCES SPAP(id) ON DELETE CASCADE,
    asap_id UUID REFERENCES ASAP(id) ON DELETE CASCADE,
    -- Thread type for queries
    thread_type VARCHAR(20) DEFAULT 'spap_discussion' CHECK (thread_type IN ('spap_discussion', 'asap_discussion', 'group_chat')),
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure exactly one of spap_id or asap_id is set
    CONSTRAINT chat_thread_exclusive_reference CHECK (
        (spap_id IS NOT NULL AND asap_id IS NULL) OR 
        (spap_id IS NULL AND asap_id IS NOT NULL)
    )
);

-- CHAT_PARTICIPANT: Thread participants
CREATE TABLE CHAT_PARTICIPANT (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES CHAT_THREAD(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'applicant', 'assignee', 'member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    
    CONSTRAINT chat_participant_unique UNIQUE (thread_id, user_id),
    CONSTRAINT chat_participant_dates_valid CHECK (left_at IS NULL OR left_at >= joined_at)
);

-- CHAT_MESSAGE: Individual messages
CREATE TABLE CHAT_MESSAGE (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES CHAT_THREAD(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES "USER"(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'document', 'system')),
    attachment_url VARCHAR(500),
    -- Read tracking
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    -- Timestamps
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP,
    
    CONSTRAINT chat_message_content_not_empty CHECK (LENGTH(TRIM(content)) >= 1),
    CONSTRAINT chat_message_read_at_valid CHECK (is_read = FALSE OR read_at IS NOT NULL)
);

-- ============================================
-- COMMENT TABLES
-- ============================================

-- COMMENT: Comments on PAPS (Instagram-style flat with single-level replies)
CREATE TABLE COMMENT (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paps_id UUID NOT NULL REFERENCES PAPS(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES "USER"(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES COMMENT(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT comment_content_not_empty CHECK (LENGTH(TRIM(content)) >= 1),
    CONSTRAINT comment_content_max_length CHECK (LENGTH(content) <= 5000),
    CONSTRAINT comment_no_self_reply CHECK (id != parent_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- User indexes
CREATE INDEX idx_user_email ON "USER"(email);
CREATE INDEX idx_user_phone ON "USER"(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_user_role ON "USER"(role_id);
CREATE INDEX idx_user_active ON "USER"(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_username ON "USER"(username);

-- Profile indexes
CREATE INDEX idx_profile_user ON USER_PROFILE(user_id);
CREATE INDEX idx_profile_location ON USER_PROFILE(location_lat, location_lng) WHERE location_lat IS NOT NULL;

-- PAPS indexes
CREATE INDEX idx_paps_owner ON PAPS(owner_id);
CREATE INDEX idx_paps_status ON PAPS(status);
CREATE INDEX idx_paps_published ON PAPS(publish_at) WHERE publish_at IS NOT NULL;
CREATE INDEX idx_paps_created ON PAPS(created_at);
CREATE INDEX idx_paps_location ON PAPS(location_lat, location_lng) WHERE location_lat IS NOT NULL;
CREATE INDEX idx_paps_deleted ON PAPS(deleted_at) WHERE deleted_at IS NULL;

-- PAPS_CATEGORY indexes
CREATE INDEX idx_paps_category_paps ON PAPS_CATEGORY(paps_id);
CREATE INDEX idx_paps_category_category ON PAPS_CATEGORY(category_id);
CREATE INDEX idx_paps_category_primary ON PAPS_CATEGORY(paps_id) WHERE is_primary = TRUE;

-- SPAP indexes
CREATE INDEX idx_spap_paps ON SPAP(paps_id);
CREATE INDEX idx_spap_applicant ON SPAP(applicant_id);
CREATE INDEX idx_spap_status ON SPAP(status);
CREATE INDEX idx_spap_applied ON SPAP(applied_at);

-- ASAP indexes
CREATE INDEX idx_asap_paps ON ASAP(paps_id);
CREATE INDEX idx_asap_accepted_user ON ASAP(accepted_user_id);
CREATE INDEX idx_asap_owner ON ASAP(owner_id);
CREATE INDEX idx_asap_status ON ASAP(status);
CREATE INDEX idx_asap_assigned ON ASAP(assigned_at);
CREATE INDEX idx_asap_completed ON ASAP(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_asap_expires ON ASAP(expires_at) WHERE expires_at IS NOT NULL;

-- Payment indexes
CREATE INDEX idx_payment_paps ON PAYMENT(paps_id);
CREATE INDEX idx_payment_payer ON PAYMENT(payer_id);
CREATE INDEX idx_payment_payee ON PAYMENT(payee_id);
CREATE INDEX idx_payment_status ON PAYMENT(status);
CREATE INDEX idx_payment_transaction ON PAYMENT(transaction_id) WHERE transaction_id IS NOT NULL;

-- Chat indexes
CREATE INDEX idx_chat_thread_paps ON CHAT_THREAD(paps_id);
CREATE INDEX idx_chat_thread_spap ON CHAT_THREAD(spap_id) WHERE spap_id IS NOT NULL;
CREATE INDEX idx_chat_thread_asap ON CHAT_THREAD(asap_id) WHERE asap_id IS NOT NULL;
CREATE INDEX idx_chat_message_thread ON CHAT_MESSAGE(thread_id);
CREATE INDEX idx_chat_message_sender ON CHAT_MESSAGE(sender_id);
CREATE INDEX idx_chat_message_sent ON CHAT_MESSAGE(sent_at);
CREATE INDEX idx_chat_participant_thread ON CHAT_PARTICIPANT(thread_id);
CREATE INDEX idx_chat_participant_user ON CHAT_PARTICIPANT(user_id);

-- Comment indexes
CREATE INDEX idx_comment_paps ON COMMENT(paps_id);
CREATE INDEX idx_comment_user ON COMMENT(user_id);
CREATE INDEX idx_comment_parent ON COMMENT(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_comment_deleted ON COMMENT(deleted_at) WHERE deleted_at IS NULL;

-- Category indexes
CREATE INDEX idx_category_parent ON CATEGORY(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_category_active ON CATEGORY(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_category_slug ON CATEGORY(slug);

-- User Interest/Experience indexes
CREATE INDEX idx_user_interest_user ON USER_INTEREST(user_id);
CREATE INDEX idx_user_interest_category ON USER_INTEREST(category_id);
CREATE INDEX idx_user_experience_user ON USER_EXPERIENCE(user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at triggers
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "USER"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profile_updated_at BEFORE UPDATE ON USER_PROFILE
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paps_updated_at BEFORE UPDATE ON PAPS
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_paps_schedule_updated_at BEFORE UPDATE ON PAPS_SCHEDULE
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asap_updated_at BEFORE UPDATE ON ASAP
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_updated_at BEFORE UPDATE ON PAYMENT
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_thread_updated_at BEFORE UPDATE ON CHAT_THREAD
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comment_updated_at BEFORE UPDATE ON COMMENT
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-CREATE USER PROFILE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO USER_PROFILE (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_user_profile
    AFTER INSERT ON "USER"
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ============================================
-- DATABASE CREATION COMPLETE
-- ============================================

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE 'Underboss database schema created successfully!';
    RAISE NOTICE 'Total tables created: %', table_count;
END $$;
