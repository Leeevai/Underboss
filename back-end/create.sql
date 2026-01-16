

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
    "gender" TEXT DEFAULT "",
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

