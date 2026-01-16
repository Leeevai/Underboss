

CREATE TABLE IF NOT EXISTS "Role"(
  "role_id" SERIAL8 PRIMARY KEY,
  "name" string UNIQUE NOT NULL,
  "description" string DEFAULT "No description provided."
)

CREATE TABLE IF NOT EXISTS "User" (
    "user_id" SERIAL PRIMARY KEY,
    "username" UNIQUE TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email" UNIQUE TEXT NOT NULL,
    "phone_number" UNIQUE TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "password_salt" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role_id" FOREIGN KEY REFERENCES "Role"("role_id") NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "last_login" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Category"(
    "category_id" SERIAL PRIMARY KEY,
    "name" UNIQUE TEXT NOT NULL,
    "description" TEXT DEFAULT "No description provided."
    "slug" TEXT UNIQUE NOT NULL
)