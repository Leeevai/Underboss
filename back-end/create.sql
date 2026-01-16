

CREATE TABLE IF NOT EXISTS "ROLE"(
  "role_id" SERIAL8 PRIMARY KEY,
  "name" string UNIQUE NOT NULL,
  "description" string DEFAULT "No description provided."
);

CREATE TABLE IF NOT EXISTS "USER" (
    "user_id" SERIAL PRIMARY KEY,
    "username" UNIQUE TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email" UNIQUE TEXT NOT NULL,
    "phone_number" UNIQUE TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "password_salt" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role_id" FOREIGN KEY REFERENCES "ROLE"("role_id") NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "last_login" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS "USER_PROFILE" (
    "profile_id" SERIAL PRIMARY KEY,
    "user_id" FOREIGN KEY REFERENCES "User"("user_id") UNIQUE NOT NULL,
    "bio" TEXT DEFAULT "",
    "avatar_image_url" TEXT DEFAULT "",
    "location_text" TEXT DEFAULT "",
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "timezone" TEXT DEFAULT "",
    "date_of_birth" DATE DEFAULT CURRENT_TIMESTAMP,
    "gender" TEXT DEFAULT "M",
    "rating_average" DECIMAL(2,3) DEFAULT NULL,
    "rating_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "CATEGORY"(
    "category_id" SERIAL PRIMARY KEY,
    "name" UNIQUE TEXT NOT NULL,
    "description" TEXT DEFAULT "No description provided."
    "slug" TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS "USER_INTEREST"(
    "user_interest_id" SERIAL PRIMARY KEY,
    "user_id" FOREIGN KEY REFERENCES "USER"("user_id") NOT NULL,
    "category_id" FOREIGN KEY REFERENCES "CATEGORY"("category_id") NOT NULL,
    UNIQUE("user_id", "category_id")
);

CREATE TABLE IF NOT EXISTS "PAPS" (
    "paps_id" BIGSERIAL PRIMARY KEY,
    "owner_user_id" FOREIGN KEY REFERENCES "USER"("user_id") NOT NULL UNIQUE,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subtitle" TEXT DEFAULT "",
    "location_text" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "timezone" TEXT DEFAULT "",
    "estimated_duration_minutes" INTEGER DEFAULT 60,
    "payement_amount" DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    "payemend_currency" TEXT DEFAULT "USD" NOT NULL,
    "payement_type" TEXT DEFAULT "transfer" NOT NULL, 
    "max_assignees" INTEGER DEFAULT 1 NOT NULL,
    "status" TEXT DEFAULT "open" NOT NULL,
    "published_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL '15 minutes',
    "expires_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL '10 days',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SPAP" (
  "spap_id" SERIAL PRIMARY KEY,
  "paps_id" FOREIGN KEY REFERENCES "PAPS"("paps_id") NOT NULL,
  "applicant_user_id" FOREIGN KEY REFERENCES "USER"("user_id") NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT DEFAULT NULL,
  "message" TEXT NOT NULL,
  "proposed_payement_amount" DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  "status" TEXT DEFAULT "open" NOT NULL,
  "location_text" TEXT NOT NULL,
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "timezone" TEXT DEFAULT "" NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

CREATE TABLE IF NOT EXISTS "PAPS_CATEGORY"(
    "paps_category_id" SERIAL PRIMARY KEY,
    "paps_id" FOREIGN KEY REFERENCES "PAPS"("paps_id") NOT NULL,
    "category_id" FOREIGN KEY REFERENCES "CATEGORY"("category_id") NOT NULL,
    UNIQUE("paps_id", "category_id")
);

CREATE TABLE IF NOT EXISTS "PAPS_MEDIA"
(
    "paps_media_id" SERIAL PRIMARY KEY,
    "paps_id" FOREIGN KEY REFERENCES "PAPS"("paps_id") NOT NULL,
    "media_url" TEXT NOT NULL,
    "media_type" TEXT DEFAULT "image" NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sort_order" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "PAPS_SCHEDULE"(
    "paps_schedule_id" SERIAL PRIMARY KEY,
    "paps_id" FOREIGN KEY REFERENCES "PAPS"("paps_id") NOT NULL,
    "is_recurring" BOOLEAN DEFAULT FALSE NOT NULL,
    "recurrence_rule" TEXT,
    "recurrence_interval" INTEGER,
    "recurrence_days_of_week" TEXT,
    "start_datetime" TIMESTAMP NOT NULL,
    "end_datetime" TIMESTAMP NOT NULL,
    "next_run_at" TIMESTAMP,
    "last_run_at" TIMESTAMP,
    "timezone" TEXT DEFAULT "UTC" NOT NULL
);

CREATE TABLE IF NOT EXISTS "COMMENT" (
    "comment_id" SERIAL PRIMARY KEY,
    "user_id" FOREIGN KEY REFERENCES "USER"("user_id") NOT NULL,
    "paps_id" FOREIGN KEY REFERENCES "PAPS"("paps_id") NOT NULL,
    "parent_comment_id" FOREIGN KEY REFERENCES "COMMENT"("comment_id"),
    "content" TEXT NOT NULL,
    "is_deleted" BOOLEAN DEFAULT FALSE NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);