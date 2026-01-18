-- ============================================
-- UNDERBOSS DATABASE SCHEMA
-- Status: FIXED & OPTIMIZED
-- PostgreSQL 14+
-- ============================================

-- ============================================
-- 0. EXTENSIONS & GLOBAL FUNCTIONS
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. UTILITY FUNCTION: UPDATED_AT AUTOMATION
-- Defined first so it is available for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. UTILITY FUNCTION: DISTANCE CALCULATION
-- Haversine formula
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lng1 DECIMAL, 
    lat2 DECIMAL, lng2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    r DECIMAL := 6371; -- Earth radius in kilometers
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dlat := RADIANS(lat2 - lat1);
    dlng := RADIANS(lng2 - lng1);
    
    a := SIN(dlat/2) * SIN(dlat/2) + 
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlng/2) * SIN(dlng/2);
    
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 1. USER MANAGEMENT
-- ============================================

CREATE TABLE ROLE (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT role_name_check CHECK (name IN ('worker', 'poster', 'admin', 'moderator'))
);

CREATE TABLE "USER" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    role_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    CONSTRAINT user_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT user_phone_format CHECK (phone IS NULL OR phone ~ '^\+?[1-9]\d{1,14}$'),
    CONSTRAINT user_role_fk FOREIGN KEY (role_id) REFERENCES ROLE(id) ON DELETE RESTRICT,
    CONSTRAINT user_last_login_check CHECK (last_login IS NULL OR last_login >= created_at)
);

CREATE TRIGGER update_user_updated_at 
    BEFORE UPDATE ON "USER"
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE USER_PROFILE (
    user_id UUID PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    date_of_birth DATE,
    location_address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT USER_PROFILE_user_fk FOREIGN KEY (user_id) REFERENCES "USER"(id) ON DELETE CASCADE,
    CONSTRAINT USER_PROFILE_lat_check CHECK (location_lat IS NULL OR (location_lat >= -90 AND location_lat <= 90)),
    CONSTRAINT USER_PROFILE_lng_check CHECK (location_lng IS NULL OR (location_lng >= -180 AND location_lng <= 180)),
    CONSTRAINT USER_PROFILE_dob_check CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE - INTERVAL '13 years'),
    CONSTRAINT USER_PROFILE_location_consistency CHECK (
        (location_lat IS NULL AND location_lng IS NULL AND location_address IS NULL) OR
        (location_lat IS NOT NULL AND location_lng IS NOT NULL)
    ),
    CONSTRAINT USER_PROFILE_display_name_check CHECK (display_name IS NULL OR LENGTH(TRIM(display_name)) >= 2)
);

CREATE TRIGGER update_USER_PROFILE_updated_at 
    BEFORE UPDATE ON USER_PROFILE
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE USER_EXPERIENCE (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    company VARCHAR(200),
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT USER_EXPERIENCE_user_fk FOREIGN KEY (user_id) REFERENCES "USER"(id) ON DELETE CASCADE,
    CONSTRAINT USER_EXPERIENCE_dates_check CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT USER_EXPERIENCE_current_check CHECK (
        (is_current = TRUE AND end_date IS NULL) OR 
        (is_current = FALSE)
    ),
    CONSTRAINT USER_EXPERIENCE_title_check CHECK (LENGTH(TRIM(title)) >= 2)
);

-- ============================================
-- 2. CATEGORIES & INTERESTS
-- ============================================

CREATE TABLE CATEGORY (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID,
    icon_url VARCHAR(500),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT category_parent_fk FOREIGN KEY (parent_id) REFERENCES CATEGORY(id) ON DELETE SET NULL,
    CONSTRAINT category_not_self_parent CHECK (parent_id IS NULL OR parent_id != id),
    CONSTRAINT category_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT category_name_check CHECK (LENGTH(TRIM(name)) >= 2)
);

CREATE TABLE USER_INTEREST (
    user_id UUID NOT NULL,
    category_id UUID NOT NULL,
    proficiency_level INTEGER NOT NULL DEFAULT 1,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, category_id),
    CONSTRAINT USER_INTEREST_user_fk FOREIGN KEY (user_id) REFERENCES "USER"(id) ON DELETE CASCADE,
    CONSTRAINT USER_INTEREST_category_fk FOREIGN KEY (category_id) REFERENCES CATEGORY(id) ON DELETE CASCADE,
    CONSTRAINT USER_INTEREST_proficiency_check CHECK (proficiency_level BETWEEN 1 AND 5)
);

-- ============================================
-- 3. PAPS (JOB POSTS)
-- ============================================

CREATE TABLE PAPS (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(300),
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    location_address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_timezone VARCHAR(50),
    start_datetime TIMESTAMP,
    end_datetime TIMESTAMP,
    estimated_duration_minutes INTEGER,
    payment_amount DECIMAL(10, 2) NOT NULL,
    payment_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_type VARCHAR(20) NOT NULL DEFAULT 'fixed',
    max_applicants INTEGER NOT NULL DEFAULT 10,
    max_assignees INTEGER NOT NULL DEFAULT 1,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    publish_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT paps_owner_fk FOREIGN KEY (owner_id) REFERENCES "USER"(id) ON DELETE RESTRICT,
    CONSTRAINT paps_status_check CHECK (status IN ('draft', 'published', 'closed', 'cancelled')),
    CONSTRAINT paps_payment_type_check CHECK (PAYMENT_type IN ('fixed', 'hourly', 'negotiable')),
    CONSTRAINT paps_payment_amount_check CHECK (PAYMENT_amount >= 0),
    CONSTRAINT paps_max_applicants_check CHECK (max_applicants > 0 AND max_applicants <= 100),
    CONSTRAINT paps_max_assignees_check CHECK (max_assignees > 0 AND max_assignees <= max_applicants),
    CONSTRAINT paps_title_check CHECK (LENGTH(TRIM(title)) >= 5),
    CONSTRAINT paps_description_check CHECK (LENGTH(TRIM(description)) >= 20),
    CONSTRAINT paps_dates_check CHECK (end_datetime IS NULL OR end_datetime > start_datetime),
    CONSTRAINT paps_duration_check CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0),
    CONSTRAINT paps_location_consistency CHECK (
        (location_lat IS NULL AND location_lng IS NULL) OR
        (location_lat IS NOT NULL AND location_lng IS NOT NULL)
    ),
    CONSTRAINT paps_lat_check CHECK (location_lat IS NULL OR (location_lat >= -90 AND location_lat <= 90)),
    CONSTRAINT paps_lng_check CHECK (location_lng IS NULL OR (location_lng >= -180 AND location_lng <= 180)),
    CONSTRAINT paps_publish_check CHECK (
        status != 'published' OR 
        (publish_at IS NOT NULL AND start_datetime IS NOT NULL)
    ),
    CONSTRAINT paps_expires_check CHECK (expires_at IS NULL OR expires_at > created_at),
    CONSTRAINT paps_deleted_check CHECK (deleted_at IS NULL OR deleted_at >= created_at)
);

CREATE TRIGGER update_paps_updated_at 
    BEFORE UPDATE ON PAPS
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE PAPS_MEDIA (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paps_id UUID NOT NULL,
    media_type VARCHAR(20) NOT NULL,
    media_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    file_size_bytes INTEGER,
    mime_type VARCHAR(100),
    display_order INTEGER NOT NULL DEFAULT 0,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT PAPS_MEDIA_paps_fk FOREIGN KEY (paps_id) REFERENCES PAPS(id) ON DELETE CASCADE,
    CONSTRAINT PAPS_MEDIA_type_check CHECK (media_type IN ('image', 'video', 'document')),
    CONSTRAINT PAPS_MEDIA_file_size_check CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
    CONSTRAINT PAPS_MEDIA_url_check CHECK (media_url ~* '^https?://')
);

CREATE TABLE PAPS_CATEGORY (
    paps_id UUID NOT NULL,
    category_id UUID NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (paps_id, category_id),
    CONSTRAINT PAPS_CATEGORY_paps_fk FOREIGN KEY (paps_id) REFERENCES PAPS(id) ON DELETE CASCADE,
    CONSTRAINT PAPS_CATEGORY_category_fk FOREIGN KEY (category_id) REFERENCES CATEGORY(id) ON DELETE RESTRICT
);

CREATE TABLE PAPS_SCHEDULE (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paps_id UUID NOT NULL UNIQUE,
    recurrence_rule TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    default_start_time TIME,
    default_duration_minutes INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT PAPS_SCHEDULE_paps_fk FOREIGN KEY (paps_id) REFERENCES PAPS(id) ON DELETE CASCADE,
    CONSTRAINT PAPS_SCHEDULE_dates_check CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT PAPS_SCHEDULE_duration_check CHECK (default_duration_minutes IS NULL OR default_duration_minutes > 0),
    CONSTRAINT PAPS_SCHEDULE_next_run_check CHECK (
        next_run_at IS NULL OR 
        (is_active = TRUE AND next_run_at >= start_date)
    ),
    CONSTRAINT PAPS_SCHEDULE_last_run_check CHECK (
        last_run_at IS NULL OR 
        last_run_at >= start_date
    )
);

CREATE TRIGGER update_PAPS_SCHEDULE_updated_at 
    BEFORE UPDATE ON PAPS_SCHEDULE
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. COMMENTS
-- ============================================

CREATE TABLE COMMENT (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paps_id UUID NOT NULL,
    user_id UUID NOT NULL,
    parent_id UUID,
    content TEXT NOT NULL,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT comment_paps_fk FOREIGN KEY (paps_id) REFERENCES PAPS(id) ON DELETE CASCADE,
    CONSTRAINT comment_user_fk FOREIGN KEY (user_id) REFERENCES "USER"(id) ON DELETE RESTRICT,
    CONSTRAINT comment_parent_fk FOREIGN KEY (parent_id) REFERENCES COMMENT(id) ON DELETE CASCADE,
    CONSTRAINT comment_not_self_parent CHECK (parent_id IS NULL OR parent_id != id),
    CONSTRAINT comment_content_check CHECK (LENGTH(TRIM(content)) >= 1),
    CONSTRAINT comment_deleted_check CHECK (deleted_at IS NULL OR deleted_at >= created_at),
    CONSTRAINT comment_edited_check CHECK (
        is_edited = FALSE OR 
        (is_edited = TRUE AND updated_at > created_at)
    )
);

CREATE TRIGGER update_comment_updated_at 
    BEFORE UPDATE ON COMMENT
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. SPAP (JOB APPLICATIONS)
-- ============================================

CREATE TABLE SPAP (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paps_id UUID NOT NULL,
    applicant_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    applicant_message TEXT,
    proposed_payment_amount DECIMAL(10, 2),
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    
    CONSTRAINT spap_paps_fk FOREIGN KEY (paps_id) REFERENCES PAPS(id) ON DELETE RESTRICT,
    CONSTRAINT spap_applicant_fk FOREIGN KEY (applicant_id) REFERENCES "USER"(id) ON DELETE RESTRICT,
    CONSTRAINT spap_status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    CONSTRAINT spap_unique_application UNIQUE (paps_id, applicant_id),
    CONSTRAINT spap_proposed_payment_check CHECK (proposed_payment_amount IS NULL OR proposed_payment_amount >= 0),
    
    -- Status-based timestamp constraints
    CONSTRAINT spap_pending_check CHECK (
        status != 'pending' OR 
        (reviewed_at IS NULL AND accepted_at IS NULL AND rejected_at IS NULL)
    ),
    CONSTRAINT spap_accepted_check CHECK (
        status != 'accepted' OR 
        (accepted_at IS NOT NULL AND rejected_at IS NULL AND reviewed_at IS NOT NULL)
    ),
    CONSTRAINT spap_rejected_check CHECK (
        status != 'rejected' OR 
        (rejected_at IS NOT NULL AND accepted_at IS NULL AND reviewed_at IS NOT NULL)
    ),
    CONSTRAINT spap_withdrawn_check CHECK (
        status != 'withdrawn' OR 
        (accepted_at IS NULL AND rejected_at IS NULL)
    ),
    
    -- Timestamp ordering
    CONSTRAINT spap_reviewed_after_applied CHECK (reviewed_at IS NULL OR reviewed_at >= applied_at),
    CONSTRAINT spap_accepted_after_reviewed CHECK (accepted_at IS NULL OR accepted_at >= reviewed_at),
    CONSTRAINT spap_rejected_after_reviewed CHECK (rejected_at IS NULL OR rejected_at >= reviewed_at),
    
    -- Mutual exclusivity
    CONSTRAINT spap_not_both_accepted_rejected CHECK (
        NOT (accepted_at IS NOT NULL AND rejected_at IS NOT NULL)
    )
);

CREATE TABLE SPAP_MEDIA (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spap_id UUID NOT NULL,
    media_type VARCHAR(20) NOT NULL,
    media_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    caption TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT SPAP_MEDIA_spap_fk FOREIGN KEY (spap_id) REFERENCES SPAP(id) ON DELETE CASCADE,
    CONSTRAINT SPAP_MEDIA_type_check CHECK (media_type IN ('image', 'video', 'document', 'certificate')),
    CONSTRAINT SPAP_MEDIA_url_check CHECK (media_url ~* '^https?://')
);

-- ============================================
-- 6. ASAP (ASSIGNED JOBS)
-- ============================================

CREATE TABLE ASAP (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paps_id UUID NOT NULL,
    accepted_spap_id UUID NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'assigned',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    completion_notes TEXT,
    cancellation_reason TEXT,
    is_group_assignment BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT asap_paps_fk FOREIGN KEY (paps_id) REFERENCES PAPS(id) ON DELETE RESTRICT,
    CONSTRAINT asap_spap_fk FOREIGN KEY (accepted_spap_id) REFERENCES SPAP(id) ON DELETE RESTRICT,
    CONSTRAINT asap_status_check CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled', 'disputed')),
    
    -- Status-based timestamp constraints
    CONSTRAINT asap_assigned_check CHECK (
        status != 'assigned' OR 
        (started_at IS NULL AND completed_at IS NULL AND cancelled_at IS NULL)
    ),
    CONSTRAINT asap_in_progress_check CHECK (
        status != 'in_progress' OR 
        (started_at IS NOT NULL AND completed_at IS NULL AND cancelled_at IS NULL)
    ),
    CONSTRAINT asap_completed_check CHECK (
        status != 'completed' OR 
        (started_at IS NOT NULL AND completed_at IS NOT NULL AND cancelled_at IS NULL AND completion_notes IS NOT NULL)
    ),
    CONSTRAINT asap_cancelled_check CHECK (
        status != 'cancelled' OR 
        (cancelled_at IS NOT NULL AND completed_at IS NULL AND cancellation_reason IS NOT NULL)
    ),
    
    -- Timestamp ordering
    CONSTRAINT asap_started_after_assigned CHECK (started_at IS NULL OR started_at >= assigned_at),
    CONSTRAINT asap_completed_after_started CHECK (completed_at IS NULL OR (started_at IS NOT NULL AND completed_at >= started_at)),
    CONSTRAINT asap_cancelled_after_assigned CHECK (cancelled_at IS NULL OR cancelled_at >= assigned_at),
    
    -- Mutual exclusivity
    CONSTRAINT asap_not_both_completed_cancelled CHECK (
        NOT (completed_at IS NOT NULL AND cancelled_at IS NOT NULL)
    ),
    
    -- Notes requirements
    CONSTRAINT asap_completion_notes_check CHECK (
        status != 'completed' OR LENGTH(TRIM(completion_notes)) >= 10
    ),
    CONSTRAINT asap_cancellation_reason_check CHECK (
        status != 'cancelled' OR LENGTH(TRIM(cancellation_reason)) >= 10
    )
);

CREATE TRIGGER update_asap_updated_at 
    BEFORE UPDATE ON ASAP
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE ASAP_ASSIGNEE (
    asap_id UUID NOT NULL,
    user_id UUID NOT NULL,
    ROLE VARCHAR(20) NOT NULL DEFAULT 'member',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    PRIMARY KEY (asap_id, user_id),
    CONSTRAINT ASAP_ASSIGNEE_asap_fk FOREIGN KEY (asap_id) REFERENCES ASAP(id) ON DELETE CASCADE,
    CONSTRAINT ASAP_ASSIGNEE_user_fk FOREIGN KEY (user_id) REFERENCES "USER"(id) ON DELETE RESTRICT,
    CONSTRAINT ASAP_ASSIGNEE_role_check CHECK (ROLE IN ('lead', 'member'))
);

CREATE TABLE ASAP_MEDIA (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asap_id UUID NOT NULL,
    uploaded_by UUID NOT NULL,
    media_type VARCHAR(20) NOT NULL,
    media_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    description TEXT,
    is_completion_proof BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ASAP_MEDIA_asap_fk FOREIGN KEY (asap_id) REFERENCES ASAP(id) ON DELETE CASCADE,
    CONSTRAINT ASAP_MEDIA_uploader_fk FOREIGN KEY (uploaded_by) REFERENCES "USER"(id) ON DELETE RESTRICT,
    CONSTRAINT ASAP_MEDIA_type_check CHECK (media_type IN ('image', 'video', 'document')),
    CONSTRAINT ASAP_MEDIA_url_check CHECK (media_url ~* '^https?://')
);

-- ============================================
-- 7. PAYMENT & RATING
-- ============================================

CREATE TABLE PAYMENT (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asap_id UUID NOT NULL UNIQUE,
    payer_id UUID NOT NULL,
    payee_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(20),
    transaction_id VARCHAR(255) UNIQUE,
    gateway_response TEXT,
    notes TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT payment_asap_fk FOREIGN KEY (asap_id) REFERENCES ASAP(id) ON DELETE RESTRICT,
    CONSTRAINT payment_payer_fk FOREIGN KEY (payer_id) REFERENCES "USER"(id) ON DELETE RESTRICT,
    CONSTRAINT payment_payee_fk FOREIGN KEY (payee_id) REFERENCES "USER"(id) ON DELETE RESTRICT,
    CONSTRAINT payment_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    CONSTRAINT payment_method_check CHECK (PAYMENT_method IS NULL OR payment_method IN ('card', 'bank', 'wallet', 'cash')),
    CONSTRAINT payment_amount_check CHECK (amount > 0),
    CONSTRAINT payment_different_users CHECK (payer_id != payee_id),
    
    -- Status-based constraints
    CONSTRAINT payment_completed_check CHECK (
        status != 'completed' OR 
        (paid_at IS NOT NULL AND transaction_id IS NOT NULL)
    ),
    CONSTRAINT payment_failed_check CHECK (
        status != 'failed' OR 
        gateway_response IS NOT NULL
    ),
    CONSTRAINT payment_paid_after_created CHECK (
        paid_at IS NULL OR paid_at >= created_at
    )
);

CREATE TRIGGER update_payment_updated_at 
    BEFORE UPDATE ON PAYMENT
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE RATING (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asap_id UUID NOT NULL,
    rater_id UUID NOT NULL,
    rated_id UUID NOT NULL,
    score INTEGER NOT NULL,
    COMMENT TEXT,
    rating_type VARCHAR(30) NOT NULL DEFAULT 'overall',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT rating_asap_fk FOREIGN KEY (asap_id) REFERENCES ASAP(id) ON DELETE RESTRICT,
    CONSTRAINT rating_rater_fk FOREIGN KEY (rater_id) REFERENCES "USER"(id) ON DELETE RESTRICT,
    CONSTRAINT rating_rated_fk FOREIGN KEY (rated_id) REFERENCES "USER"(id) ON DELETE RESTRICT,
    CONSTRAINT rating_unique_rating UNIQUE (asap_id, rater_id, rated_id, rating_type),
    CONSTRAINT rating_score_check CHECK (score BETWEEN 1 AND 5),
    CONSTRAINT rating_type_check CHECK (RATING_type IN ('skill', 'communication', 'professionalism', 'overall')),
    CONSTRAINT rating_different_users CHECK (rater_id != rated_id),
    CONSTRAINT rating_comment_check CHECK (COMMENT IS NULL OR LENGTH(TRIM(COMMENT)) >= 10)
);

CREATE TRIGGER update_rating_updated_at 
    BEFORE UPDATE ON RATING
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. CHAT SYSTEM
-- ============================================

CREATE TABLE CHAT_THREAD (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paps_id UUID,
    spap_id UUID,
    asap_id UUID,
    thread_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT CHAT_THREAD_paps_fk FOREIGN KEY (paps_id) REFERENCES PAPS(id) ON DELETE SET NULL,
    CONSTRAINT CHAT_THREAD_spap_fk FOREIGN KEY (spap_id) REFERENCES SPAP(id) ON DELETE SET NULL,
    CONSTRAINT CHAT_THREAD_asap_fk FOREIGN KEY (asap_id) REFERENCES ASAP(id) ON DELETE SET NULL,
    CONSTRAINT CHAT_THREAD_type_check CHECK (thread_type IN ('paps_inquiry', 'spap_discussion', 'asap_coordination')),
    CONSTRAINT CHAT_THREAD_status_check CHECK (status IN ('active', 'archived', 'deleted')),
    
    -- At least one context reference required
    CONSTRAINT CHAT_THREAD_context_check CHECK (
        paps_id IS NOT NULL OR spap_id IS NOT NULL OR asap_id IS NOT NULL
    ),
    
    -- Type-based context validation
    CONSTRAINT CHAT_THREAD_paps_inquiry_check CHECK (
        thread_type != 'paps_inquiry' OR paps_id IS NOT NULL
    ),
    CONSTRAINT CHAT_THREAD_spap_discussion_check CHECK (
        thread_type != 'spap_discussion' OR (paps_id IS NOT NULL AND spap_id IS NOT NULL)
    ),
    CONSTRAINT CHAT_THREAD_asap_coordination_check CHECK (
        thread_type != 'asap_coordination' OR (paps_id IS NOT NULL AND asap_id IS NOT NULL)
    )
);

CREATE TRIGGER update_CHAT_THREAD_updated_at 
    BEFORE UPDATE ON CHAT_THREAD
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE CHAT_PARTICIPANT (
    thread_id UUID NOT NULL,
    user_id UUID NOT NULL,
    ROLE VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP,
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    
    PRIMARY KEY (thread_id, user_id),
    CONSTRAINT CHAT_PARTICIPANT_thread_fk FOREIGN KEY (thread_id) REFERENCES CHAT_THREAD(id) ON DELETE CASCADE,
    CONSTRAINT CHAT_PARTICIPANT_user_fk FOREIGN KEY (user_id) REFERENCES "USER"(id) ON DELETE RESTRICT,
    CONSTRAINT CHAT_PARTICIPANT_role_check CHECK (ROLE IN ('owner', 'applicant', 'assignee', 'observer')),
    CONSTRAINT CHAT_PARTICIPANT_last_read_check CHECK (last_read_at IS NULL OR last_read_at >= joined_at)
);

CREATE TABLE CHAT_MESSAGE (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    attachment_url VARCHAR(500),
    attachment_mime_type VARCHAR(100),
    attachment_size_bytes INTEGER,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT CHAT_MESSAGE_thread_fk FOREIGN KEY (thread_id) REFERENCES CHAT_THREAD(id) ON DELETE CASCADE,
    CONSTRAINT CHAT_MESSAGE_sender_fk FOREIGN KEY (sender_id) REFERENCES "USER"(id) ON DELETE RESTRICT,
    CONSTRAINT CHAT_MESSAGE_type_check CHECK (message_type IN ('text', 'image', 'file', 'system')),
    CONSTRAINT CHAT_MESSAGE_content_check CHECK (LENGTH(TRIM(content)) >= 1),
    
    -- Attachment constraints
    CONSTRAINT CHAT_MESSAGE_attachment_consistency CHECK (
        (attachment_url IS NULL AND attachment_mime_type IS NULL AND attachment_size_bytes IS NULL) OR
        (attachment_url IS NOT NULL AND attachment_mime_type IS NOT NULL)
    ),
    CONSTRAINT CHAT_MESSAGE_attachment_size_check CHECK (
        attachment_size_bytes IS NULL OR attachment_size_bytes > 0
    ),
    CONSTRAINT CHAT_MESSAGE_attachment_url_check CHECK (
        attachment_url IS NULL OR attachment_url ~* '^https?://'
    ),
    
    -- Timestamp constraints
    CONSTRAINT CHAT_MESSAGE_edited_check CHECK (
        edited_at IS NULL OR edited_at > sent_at
    ),
    CONSTRAINT CHAT_MESSAGE_deleted_check CHECK (
        deleted_at IS NULL OR deleted_at >= sent_at
    )
);
