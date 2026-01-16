-- ============================================================================
-- COMPLETE DATABASE SCHEMA WITH CONSTRAINTS
-- ============================================================================

-- ============================================================================
-- CORE ENTITIES: ROLES & USERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ROLE" (
    "role_id" SERIAL PRIMARY KEY,
    "name" TEXT UNIQUE NOT NULL,
    "description" TEXT DEFAULT 'No description provided.',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "role_name_not_empty" CHECK (LENGTH(TRIM("name")) > 0),
    CONSTRAINT "role_name_valid" CHECK ("name" IN ('admin', 'user'))
);

CREATE TABLE IF NOT EXISTS "USER" (
    "user_id" SERIAL PRIMARY KEY,
    "username" TEXT UNIQUE NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "phone_number" TEXT UNIQUE NOT NULL,
    "password_hash" TEXT NOT NULL,
    "password_salt" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL REFERENCES "ROLE"("role_id") ON DELETE RESTRICT,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "last_login" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_username_not_empty" CHECK (LENGTH(TRIM("username")) > 0),
    CONSTRAINT "user_username_length" CHECK (LENGTH("username") >= 3 AND LENGTH("username") <= 50),
    CONSTRAINT "user_email_format" CHECK ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT "user_phone_format" CHECK ("phone_number" ~ '^\+?[0-9]{10,15}$'),
    CONSTRAINT "user_first_name_not_empty" CHECK (LENGTH(TRIM("first_name")) > 0),
    CONSTRAINT "user_last_name_not_empty" CHECK (LENGTH(TRIM("last_name")) > 0),
    CONSTRAINT "user_password_hash_not_empty" CHECK (LENGTH("password_hash") > 0),
    CONSTRAINT "user_password_salt_not_empty" CHECK (LENGTH("password_salt") > 0)
);

CREATE TABLE IF NOT EXISTS "USER_PROFILE" (
    "profile_id" SERIAL PRIMARY KEY,
    "user_id" INTEGER UNIQUE NOT NULL REFERENCES "USER"("user_id") ON DELETE CASCADE,
    "bio" TEXT DEFAULT '',
    "avatar_image_url" TEXT DEFAULT '',
    "location_text" TEXT DEFAULT '',
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "timezone" TEXT DEFAULT 'UTC',
    "date_of_birth" DATE,
    "gender" TEXT DEFAULT 'M',
    "rating_average" DECIMAL(3,2) DEFAULT NULL,
    "rating_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profile_latitude_range" CHECK ("latitude" IS NULL OR ("latitude" >= -90 AND "latitude" <= 90)),
    CONSTRAINT "profile_longitude_range" CHECK ("longitude" IS NULL OR ("longitude" >= -180 AND "longitude" <= 180)),
    CONSTRAINT "profile_coordinates_pair" CHECK (("latitude" IS NULL AND "longitude" IS NULL) OR ("latitude" IS NOT NULL AND "longitude" IS NOT NULL)),
    CONSTRAINT "profile_timezone_not_empty" CHECK (LENGTH(TRIM("timezone")) > 0),
    CONSTRAINT "profile_gender_valid" CHECK ("gender" IN ('M', 'F', 'O', 'N')),
    CONSTRAINT "profile_rating_range" CHECK ("rating_average" IS NULL OR ("rating_average" >= 0 AND "rating_average" <= 5)),
    CONSTRAINT "profile_rating_count_positive" CHECK ("rating_count" >= 0),
    CONSTRAINT "profile_dob_reasonable" CHECK ("date_of_birth" IS NULL OR "date_of_birth" >= '1900-01-01'),
    CONSTRAINT "profile_bio_length" CHECK (LENGTH("bio") <= 5000)
);

CREATE TABLE IF NOT EXISTS "USER_EXPERIENCE" (
    "experience_id" BIGSERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL REFERENCES "USER"("user_id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "started_at" TIMESTAMP,
    "ended_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "experience_title_not_empty" CHECK (LENGTH(TRIM("title")) > 0),
    CONSTRAINT "experience_dates_valid" CHECK ("ended_at" IS NULL OR "started_at" IS NULL OR "ended_at" >= "started_at")
);

-- ============================================================================
-- CATEGORIES & INTERESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "CATEGORY" (
    "category_id" SERIAL PRIMARY KEY,
    "name" TEXT UNIQUE NOT NULL,
    "description" TEXT DEFAULT 'No description provided.',
    "slug" TEXT UNIQUE NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "category_name_not_empty" CHECK (LENGTH(TRIM("name")) > 0),
    CONSTRAINT "category_slug_not_empty" CHECK (LENGTH(TRIM("slug")) > 0),
    CONSTRAINT "category_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS "USER_INTEREST" (
    "user_interest_id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL REFERENCES "USER"("user_id") ON DELETE CASCADE,
    "category_id" INTEGER NOT NULL REFERENCES "CATEGORY"("category_id") ON DELETE CASCADE,
    "weight" DECIMAL(3,2) DEFAULT 1.0,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_interest_unique" UNIQUE("user_id", "category_id"),
    CONSTRAINT "user_interest_weight_positive" CHECK ("weight" > 0 AND "weight" <= 10)
);

-- ============================================================================
-- PAPS (JOB POSTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PAPS" (
    "paps_id" BIGSERIAL PRIMARY KEY,
    "owner_user_id" INTEGER NOT NULL REFERENCES "USER"("user_id") ON DELETE RESTRICT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subtitle" TEXT DEFAULT NULL,
    "location_text" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "timezone" TEXT DEFAULT 'UTC',
    "estimated_duration_minutes" INTEGER DEFAULT 60,
    "payment_amount" DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    "payment_currency" TEXT DEFAULT 'USD' NOT NULL,
    "payment_type" TEXT DEFAULT 'transfer' NOT NULL,
    "max_assignees" INTEGER DEFAULT 1 NOT NULL,
    "status" TEXT DEFAULT 'draft' NOT NULL,
    "published_at" TIMESTAMP,
    "expires_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "paps_title_not_empty" CHECK (LENGTH(TRIM("title")) > 0),
    CONSTRAINT "paps_title_length" CHECK (LENGTH("title") <= 200),
    CONSTRAINT "paps_description_not_empty" CHECK (LENGTH(TRIM("description")) > 0),
    CONSTRAINT "paps_location_not_empty" CHECK (LENGTH(TRIM("location_text")) > 0),
    CONSTRAINT "paps_latitude_range" CHECK ("latitude" IS NULL OR ("latitude" >= -90 AND "latitude" <= 90)),
    CONSTRAINT "paps_longitude_range" CHECK ("longitude" IS NULL OR ("longitude" >= -180 AND "longitude" <= 180)),
    CONSTRAINT "paps_coordinates_pair" CHECK (("latitude" IS NULL AND "longitude" IS NULL) OR ("latitude" IS NOT NULL AND "longitude" IS NOT NULL)),
    CONSTRAINT "paps_timezone_not_empty" CHECK (LENGTH(TRIM("timezone")) > 0),
    CONSTRAINT "paps_duration_positive" CHECK ("estimated_duration_minutes" > 0),
    CONSTRAINT "paps_payment_non_negative" CHECK ("payment_amount" >= 0),
    CONSTRAINT "paps_currency_valid" CHECK ("payment_currency" IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY')),
    CONSTRAINT "paps_payment_type_valid" CHECK ("payment_type" IN ('transfer', 'cash', 'check', 'crypto', 'other')),
    CONSTRAINT "paps_max_assignees_positive" CHECK ("max_assignees" >= 1),
    CONSTRAINT "paps_status_valid" CHECK ("status" IN ('draft', 'open', 'closed', 'cancelled', 'expired')),
    CONSTRAINT "paps_published_before_expires" CHECK ("expires_at" IS NULL OR "published_at" IS NULL OR "expires_at" > "published_at"),
    CONSTRAINT "paps_owner_unique_active" UNIQUE("owner_user_id", "paps_id")
);

CREATE TABLE IF NOT EXISTS "PAPS_CATEGORY" (
    "paps_category_id" BIGSERIAL PRIMARY KEY,
    "paps_id" BIGINT NOT NULL REFERENCES "PAPS"("paps_id") ON DELETE CASCADE,
    "category_id" INTEGER NOT NULL REFERENCES "CATEGORY"("category_id") ON DELETE CASCADE,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "paps_category_unique" UNIQUE("paps_id", "category_id")
);

CREATE TABLE IF NOT EXISTS "PAPS_MEDIA" (
    "paps_media_id" BIGSERIAL PRIMARY KEY,
    "paps_id" BIGINT NOT NULL REFERENCES "PAPS"("paps_id") ON DELETE CASCADE,
    "media_url" TEXT NOT NULL,
    "media_type" TEXT DEFAULT 'image' NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sort_order" INTEGER DEFAULT 0,
    CONSTRAINT "paps_media_url_not_empty" CHECK (LENGTH(TRIM("media_url")) > 0),
    CONSTRAINT "paps_media_type_valid" CHECK ("media_type" IN ('image', 'video', 'document')),
    CONSTRAINT "paps_media_sort_order_non_negative" CHECK ("sort_order" >= 0)
);

CREATE TABLE IF NOT EXISTS "PAPS_SCHEDULE" (
    "paps_schedule_id" BIGSERIAL PRIMARY KEY,
    "paps_id" BIGINT NOT NULL REFERENCES "PAPS"("paps_id") ON DELETE CASCADE,
    "is_recurring" BOOLEAN DEFAULT FALSE NOT NULL,
    "recurrence_rule" TEXT,
    "recurrence_interval" INTEGER,
    "recurrence_days_of_week" TEXT,
    "start_datetime" TIMESTAMP NOT NULL,
    "end_datetime" TIMESTAMP,
    "next_run_at" TIMESTAMP,
    "last_run_at" TIMESTAMP,
    "timezone" TEXT DEFAULT 'UTC' NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "schedule_end_after_start" CHECK ("end_datetime" IS NULL OR "end_datetime" > "start_datetime"),
    CONSTRAINT "schedule_recurrence_rule_valid" CHECK ("recurrence_rule" IS NULL OR "recurrence_rule" IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CRON')),
    CONSTRAINT "schedule_recurrence_interval_positive" CHECK ("recurrence_interval" IS NULL OR "recurrence_interval" > 0),
    CONSTRAINT "schedule_recurrence_days_format" CHECK ("recurrence_days_of_week" IS NULL OR "recurrence_days_of_week" ~ '^(MON|TUE|WED|THU|FRI|SAT|SUN)(,(MON|TUE|WED|THU|FRI|SAT|SUN))*$'),
    CONSTRAINT "schedule_recurring_has_rule" CHECK (NOT "is_recurring" OR "recurrence_rule" IS NOT NULL),
    CONSTRAINT "schedule_timezone_not_empty" CHECK (LENGTH(TRIM("timezone")) > 0)
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "COMMENT" (
    "comment_id" BIGSERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL REFERENCES "USER"("user_id") ON DELETE CASCADE,
    "paps_id" BIGINT NOT NULL REFERENCES "PAPS"("paps_id") ON DELETE CASCADE,
    "parent_comment_id" BIGINT DEFAULT NULL REFERENCES "COMMENT"("comment_id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "is_deleted" BOOLEAN DEFAULT FALSE NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comment_content_not_empty" CHECK (LENGTH(TRIM("content")) > 0),
    CONSTRAINT "comment_content_length" CHECK (LENGTH("content") <= 5000),
    CONSTRAINT "comment_no_self_parent" CHECK ("parent_comment_id" IS NULL OR "parent_comment_id" != "comment_id")
);

-- ============================================================================
-- SPAP (APPLICATIONS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "SPAP" (
    "spap_id" BIGSERIAL PRIMARY KEY,
    "paps_id" BIGINT NOT NULL REFERENCES "PAPS"("paps_id") ON DELETE RESTRICT,
    "applicant_user_id" INTEGER NOT NULL REFERENCES "USER"("user_id") ON DELETE RESTRICT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT DEFAULT NULL,
    "message" TEXT NOT NULL,
    "proposed_payment_amount" DECIMAL(10,2) DEFAULT NULL,
    "status" TEXT DEFAULT 'pending' NOT NULL,
    "location_text" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "timezone" TEXT DEFAULT 'UTC' NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "spap_title_not_empty" CHECK (LENGTH(TRIM("title")) > 0),
    CONSTRAINT "spap_message_not_empty" CHECK (LENGTH(TRIM("message")) > 0),
    CONSTRAINT "spap_location_not_empty" CHECK (LENGTH(TRIM("location_text")) > 0),
    CONSTRAINT "spap_latitude_range" CHECK ("latitude" IS NULL OR ("latitude" >= -90 AND "latitude" <= 90)),
    CONSTRAINT "spap_longitude_range" CHECK ("longitude" IS NULL OR ("longitude" >= -180 AND "longitude" <= 180)),
    CONSTRAINT "spap_coordinates_pair" CHECK (("latitude" IS NULL AND "longitude" IS NULL) OR ("latitude" IS NOT NULL AND "longitude" IS NOT NULL)),
    CONSTRAINT "spap_timezone_not_empty" CHECK (LENGTH(TRIM("timezone")) > 0),
    CONSTRAINT "spap_proposed_payment_non_negative" CHECK ("proposed_payment_amount" IS NULL OR "proposed_payment_amount" >= 0),
    CONSTRAINT "spap_status_valid" CHECK ("status" IN ('pending', 'withdrawn', 'rejected', 'accepted')),
    CONSTRAINT "spap_unique_per_user_paps" UNIQUE("paps_id", "applicant_user_id")
);

CREATE TABLE IF NOT EXISTS "SPAP_MEDIA" (
    "spap_media_id" BIGSERIAL PRIMARY KEY,
    "spap_id" BIGINT NOT NULL REFERENCES "SPAP"("spap_id") ON DELETE CASCADE,
    "media_url" TEXT NOT NULL,
    "media_type" TEXT DEFAULT 'image' NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sort_order" INTEGER DEFAULT 0,
    CONSTRAINT "spap_media_url_not_empty" CHECK (LENGTH(TRIM("media_url")) > 0),
    CONSTRAINT "spap_media_type_valid" CHECK ("media_type" IN ('image', 'video', 'document')),
    CONSTRAINT "spap_media_sort_order_non_negative" CHECK ("sort_order" >= 0)
);

-- ============================================================================
-- ASAP (ASSIGNED JOBS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ASAP" (
    "asap_id" BIGSERIAL PRIMARY KEY,
    "paps_id" BIGINT NOT NULL REFERENCES "PAPS"("paps_id") ON DELETE RESTRICT,
    "spap_id" BIGINT NOT NULL REFERENCES "SPAP"("spap_id") ON DELETE RESTRICT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT DEFAULT NULL,
    "status" TEXT DEFAULT 'pending' NOT NULL,
    "is_group_assignment" BOOLEAN DEFAULT FALSE NOT NULL,
    "location_text" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "timezone" TEXT DEFAULT 'UTC' NOT NULL,
    "started_at" TIMESTAMP,
    "due_at" TIMESTAMP,
    "completed_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asap_title_not_empty" CHECK (LENGTH(TRIM("title")) > 0),
    CONSTRAINT "asap_location_not_empty" CHECK (LENGTH(TRIM("location_text")) > 0),
    CONSTRAINT "asap_latitude_range" CHECK ("latitude" IS NULL OR ("latitude" >= -90 AND "latitude" <= 90)),
    CONSTRAINT "asap_longitude_range" CHECK ("longitude" IS NULL OR ("longitude" >= -180 AND "longitude" <= 180)),
    CONSTRAINT "asap_coordinates_pair" CHECK (("latitude" IS NULL AND "longitude" IS NULL) OR ("latitude" IS NOT NULL AND "longitude" IS NOT NULL)),
    CONSTRAINT "asap_timezone_not_empty" CHECK (LENGTH(TRIM("timezone")) > 0),
    CONSTRAINT "asap_status_valid" CHECK ("status" IN ('pending', 'in_progress', 'completed', 'cancelled', 'disputed')),
    CONSTRAINT "asap_due_after_start" CHECK ("due_at" IS NULL OR "started_at" IS NULL OR "due_at" > "started_at"),
    CONSTRAINT "asap_completed_after_start" CHECK ("completed_at" IS NULL OR "started_at" IS NULL OR "completed_at" >= "started_at"),
    CONSTRAINT "asap_unique_spap" UNIQUE("spap_id")
);

CREATE TABLE IF NOT EXISTS "ASAP_ASSIGNEE" (
    "asap_assignee_id" BIGSERIAL PRIMARY KEY,
    "asap_id" BIGINT NOT NULL REFERENCES "ASAP"("asap_id") ON DELETE CASCADE,
    "user_id" INTEGER NOT NULL REFERENCES "USER"("user_id") ON DELETE RESTRICT,
    "role" TEXT NOT NULL,
    "assigned_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMP,
    CONSTRAINT "asap_assignee_unique" UNIQUE("asap_id", "user_id"),
    CONSTRAINT "asap_assignee_role_valid" CHECK ("role" IN ('worker', 'co-worker', 'supervisor', 'observer')),
    CONSTRAINT "asap_assignee_dates_valid" CHECK ("unassigned_at" IS NULL OR "unassigned_at" >= "assigned_at")
);

CREATE TABLE IF NOT EXISTS "ASAP_MEDIA" (
    "asap_media_id" BIGSERIAL PRIMARY KEY,
    "asap_id" BIGINT NOT NULL REFERENCES "ASAP"("asap_id") ON DELETE CASCADE,
    "media_url" TEXT NOT NULL,
    "media_type" TEXT DEFAULT 'image' NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sort_order" INTEGER DEFAULT 0,
    CONSTRAINT "asap_media_url_not_empty" CHECK (LENGTH(TRIM("media_url")) > 0),
    CONSTRAINT "asap_media_type_valid" CHECK ("media_type" IN ('image', 'video', 'document')),
    CONSTRAINT "asap_media_sort_order_non_negative" CHECK ("sort_order" >= 0)
);

-- ============================================================================
-- RATINGS & REVIEWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "RATING" (
    "rating_id" BIGSERIAL PRIMARY KEY,
    "asap_id" BIGINT NOT NULL REFERENCES "ASAP"("asap_id") ON DELETE RESTRICT,
    "worker_user_id" INTEGER NOT NULL REFERENCES "USER"("user_id") ON DELETE RESTRICT,
    "rater_user_id" INTEGER NOT NULL REFERENCES "USER"("user_id") ON DELETE RESTRICT,
    "score" INTEGER NOT NULL,
    "review_text" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rating_score_range" CHECK ("score" >= 1 AND "score" <= 5),
    CONSTRAINT "rating_no_self_rate" CHECK ("worker_user_id" != "rater_user_id"),
    CONSTRAINT "rating_review_length" CHECK ("review_text" IS NULL OR LENGTH("review_text") <= 2000),
    CONSTRAINT "rating_unique_per_asap_worker_rater" UNIQUE("asap_id", "worker_user_id", "rater_user_id")
);

-- ============================================================================
-- CHAT SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS "CHAT_THREAD" (
    "chat_thread_id" BIGSERIAL PRIMARY KEY,
    "asap_id" BIGINT DEFAULT NULL REFERENCES "ASAP"("asap_id") ON DELETE SET NULL,
    "spap_id" BIGINT NOT NULL REFERENCES "SPAP"("spap_id") ON DELETE CASCADE,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_thread_unique_spap" UNIQUE("spap_id")
);

CREATE TABLE IF NOT EXISTS "CHAT_PARTICIPANT" (
    "chat_participant_id" BIGSERIAL PRIMARY KEY,
    "chat_thread_id" BIGINT NOT NULL REFERENCES "CHAT_THREAD"("chat_thread_id") ON DELETE CASCADE,
    "user_id" INTEGER NOT NULL REFERENCES "USER"("user_id") ON DELETE CASCADE,
    "joined_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP,
    CONSTRAINT "chat_participant_unique" UNIQUE("chat_thread_id", "user_id"),
    CONSTRAINT "chat_participant_dates_valid" CHECK ("left_at" IS NULL OR "left_at" >= "joined_at")
);

CREATE TABLE IF NOT EXISTS "CHAT_MESSAGE" (
    "chat_message_id" BIGSERIAL PRIMARY KEY,
    "chat_thread_id" BIGINT NOT NULL REFERENCES "CHAT_THREAD"("chat_thread_id") ON DELETE CASCADE,
    "sender_user_id" INTEGER NOT NULL REFERENCES "USER"("user_id") ON DELETE SET NULL,
    "message_type" TEXT DEFAULT 'text' NOT NULL,
    "content" TEXT NOT NULL,
    "attachment_url" TEXT,
    "is_read" BOOLEAN DEFAULT FALSE NOT NULL,
    "read_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_message_content_not_empty" CHECK (LENGTH(TRIM("content")) > 0),
    CONSTRAINT "chat_message_type_valid" CHECK ("message_type" IN ('text', 'image', 'video', 'document', 'system')),
    CONSTRAINT "chat_message_read_at_valid" CHECK (NOT "is_read" OR "read_at" IS NOT NULL)
);

-- ============================================================================
-- PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PAYMENT" (
    "payment_id" BIGSERIAL PRIMARY KEY,
    "asap_id" BIGINT NOT NULL REFERENCES "ASAP"("asap_id") ON DELETE RESTRICT,
    "payer_user_id" INTEGER NOT NULL REFERENCES "USER"("user_id") ON DELETE RESTRICT,
    "payee_user_id" INTEGER NOT NULL REFERENCES "USER"("user_id") ON DELETE RESTRICT,
    "amount" DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    "payment_currency" TEXT DEFAULT 'USD' NOT NULL,
    "method" TEXT DEFAULT 'transfer' NOT NULL,
    "status" TEXT DEFAULT 'pending' NOT NULL,
    "external_reference" TEXT,
    "paid_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_amount_positive" CHECK ("amount" > 0),
    CONSTRAINT "payment_currency_valid" CHECK ("payment_currency" IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY')),
    CONSTRAINT "payment_method_valid" CHECK ("method" IN ('transfer', 'cash', 'check', 'crypto', 'paypal', 'stripe', 'other')),
    CONSTRAINT "payment_status_valid" CHECK ("status" IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    CONSTRAINT "payment_no_self_pay" CHECK ("payer_user_id" != "payee_user_id"),
    CONSTRAINT "payment_paid_at_when_completed" CHECK (("status" != 'completed') OR ("paid_at" IS NOT NULL))
);

