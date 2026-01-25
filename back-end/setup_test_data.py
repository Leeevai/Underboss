#!/usr/bin/env python3
"""
Setup test data for the application.
This script creates test users, profiles, and sample data in the database.
Run this after create.sql to populate test data.
"""

import os
import sys
from database import db

# Test user configurations
TEST_USERS = [
    {
        "username": "hassan",
        "email": "hassan@example.com",
        "password": "Password123",  # Will be hashed
        "is_admin": False,
        "profile": {
            "first_name": "Hassan",
            "last_name": "Developer",
            "display_name": "Hassan",
            "bio": "Full-stack developer passionate about building great products",
            "location_address": "New York, NY",
            "location_lat": 40.7128,
            "location_lng": -74.0060,
            "timezone": "America/New_York",
            "preferred_language": "en"
        },
        "interests": [
            {"category_slug": "web-development", "proficiency": 4},
            {"category_slug": "mobile-development", "proficiency": 3}
        ],
        "experiences": [
            {
                "title": "Senior Full Stack Developer",
                "company": "Tech Corp",
                "location": "New York, NY",
                "start_date": "2021-01-01",
                "description": "Leading development of web applications"
            }
        ]
    },
    {
        "username": "clement",
        "email": "clement@example.com",
        "password": "Password123",
        "is_admin": False,
        "has_avatar": True,
        "avatar_filename": "clement.jpg",
        "profile": {
            "first_name": "Clement",
            "last_name": "Designer",
            "display_name": "Clement",
            "bio": "Creative designer specializing in UI/UX",
            "location_address": "Paris, France",
            "location_lat": 48.8566,
            "location_lng": 2.3522,
            "timezone": "Europe/Paris",
            "preferred_language": "fr"
        },
        "interests": [
            {"category_slug": "graphic-design", "proficiency": 5},
            {"category_slug": "ui-ux-design", "proficiency": 4},
            {"category_slug": "social-media", "proficiency": 4}
        ]
    },
    {
        "username": "osman",
        "email": "osman@example.com",
        "password": "Password123",
        "is_admin": False,
        "has_avatar": True,
        "avatar_filename": "osman.jpg",
        "profile": {
            "first_name": "Osman",
            "last_name": "Marketer",
            "display_name": "Osman",
            "bio": "Digital marketing expert and SEO specialist",
            "location_address": "Istanbul, Turkey",
            "location_lat": 41.0082,
            "location_lng": 28.9784,
            "timezone": "Europe/Istanbul",
            "preferred_language": "tr"
        },
        "interests": [
            {"category_slug": "seo", "proficiency": 5},
            {"category_slug": "video-editing", "proficiency": 3}
        ]
    },
    {
        "username": "enrique",
        "email": "enrique@example.com",
        "password": "Password123",
        "is_admin": False,
        "has_avatar": True,
        "avatar_filename": "enrique.jpg",
        "profile": {
            "first_name": "Enrique",
            "last_name": "Writer",
            "display_name": "Enrique",
            "bio": "Content writer and audio producer",
            "location_address": "Barcelona, Spain",
            "location_lat": 41.3851,
            "location_lng": 2.1734,
            "timezone": "Europe/Madrid",
            "preferred_language": "es"
        },
        "interests": [
            {"category_slug": "content-writing", "proficiency": 4},
            {"category_slug": "audio-production", "proficiency": 4}
        ]
    },
    {
        "username": "calvin",
        "email": "calvin@example.com",
        "password": "Hobbes123",
        "is_admin": True,
        "profile": {
            "first_name": "Calvin",
            "last_name": "Admin",
            "display_name": "Calvin",
            "bio": "System administrator",
            "timezone": "America/New_York",
            "preferred_language": "en"
        },
        "interests": [
            {"category_slug": "technology", "proficiency": 4},
            {"category_slug": "design", "proficiency": 3}
        ]
    },
    {
        "username": "hobbes",
        "email": "hobbes@example.com",
        "password": "Calvin123",
        "is_admin": False,
        "profile": {
            "first_name": "Hobbes",
            "last_name": "User",
            "display_name": "Hobbes",
            "bio": "Regular user for testing",
            "timezone": "America/New_York",
            "preferred_language": "en"
        },
        "interests": [
            {"category_slug": "technology", "proficiency": 3}
        ]
    }
]

# Sample categories
SAMPLE_CATEGORIES = [
    {"name": "Web Development", "slug": "web-development", "description": "Frontend and backend web development"},
    {"name": "Mobile Development", "slug": "mobile-development", "description": "iOS and Android app development"},
    {"name": "Graphic Design", "slug": "graphic-design", "description": "Visual design and graphics"},
    {"name": "UI/UX Design", "slug": "ui-ux-design", "description": "User interface and experience design"},
    {"name": "Social Media", "slug": "social-media", "description": "Social media marketing and management"},
    {"name": "SEO", "slug": "seo", "description": "Search engine optimization"},
    {"name": "Video Editing", "slug": "video-editing", "description": "Video production and editing"},
    {"name": "Content Writing", "slug": "content-writing", "description": "Blog posts, articles, and copywriting"},
    {"name": "Audio Production", "slug": "audio-production", "description": "Music and audio production"},
    {"name": "Technology", "slug": "technology", "description": "General technology and computing"},
    {"name": "Design", "slug": "design", "description": "General design work"}
]


def setup_categories(app):
    """Create sample categories."""
    print("Setting up categories...")
    print("  Categories already created in data_minimal.sql")
    print("  Skipping category creation\n")
    return


def setup_users(app):
    """Create test users with profiles and data."""
    print("Setting up test users...")
    
    for user_data in TEST_USERS:
        username = user_data["username"]
        print(f"\n  Creating user: {username}")
        
        try:
            # Hash password
            password_hash = app.hash_password(user_data["password"])
            
            # Insert user
            user_id = db.insert_user(
                username=username,
                email=user_data["email"],
                phone=user_data.get("phone"),
                password=password_hash,
                is_admin=user_data.get("is_admin", False)
            )
            
            if not user_id:
                print(f"    ⚠ User {username} may already exist, skipping...")
                continue
                
            print(f"    ✓ User created with ID: {user_id}")
            
            # Update profile if provided
            if "profile" in user_data:
                profile = user_data["profile"]
                
                # Handle avatar for users with avatar files
                if user_data.get("has_avatar"):
                    profile["avatar_url"] = f"/media/user/profile/{user_id}.jpg"
                
                # Add optional fields with defaults
                if "date_of_birth" not in profile:
                    profile["date_of_birth"] = None
                if "avatar_url" not in profile:
                    profile["avatar_url"] = None
                    
                # Simplify profile - remove optional complex fields that may have constraints
                safe_profile = {
                    "first_name": profile.get("first_name"),
                    "last_name": profile.get("last_name"),
                    "display_name": profile.get("display_name"),
                    "bio": profile.get("bio"),
                    "avatar_url": profile.get("avatar_url"),
                    "date_of_birth": profile.get("date_of_birth"),
                    "timezone": profile.get("timezone"),
                    "preferred_language": profile.get("preferred_language", "en")  # Default to en
                }
                
                # Remove None values
                safe_profile = {k: v for k, v in safe_profile.items() if v is not None}
                
                try:
                    db.update_user_profile(user_id=user_id, **safe_profile)
                    print(f"    ✓ Profile updated")
                except Exception as e:
                    print(f"    ⚠ Could not update profile: {e}")
            
            # Skip interests and experiences for now - add them manually or extend script later
            print(f"    ⚠ Skipping interests and experiences (not implemented yet)")
                        
        except Exception as e:
            print(f"    ✗ Error creating user {username}: {e}")
            continue


def main():
    """Main setup function."""
    # Check environment
    if "APP_NAME" not in os.environ:
        print("Error: APP_NAME environment variable not set")
        print("Run: export APP_NAME=underboss APP_CONFIG=local.conf APP_SECRET=<secret>")
        sys.exit(1)
    
    # Import app to get access to hash_password
    try:
        from app import app
    except Exception as e:
        print(f"Error importing app: {e}")
        print("Make sure APP_NAME, APP_CONFIG, and APP_SECRET environment variables are set")
        sys.exit(1)
    
    print("=" * 60)
    print("TEST DATA SETUP")
    print("=" * 60)
    print()
    
    # Setup data
    setup_categories(app)
    setup_users(app)
    
    print()
    print("=" * 60)
    print("SETUP COMPLETE")
    print("=" * 60)
    print()
    print("Test users created:")
    for user in TEST_USERS:
        role = "ADMIN" if user.get("is_admin") else "USER"
        print(f"  • {user['username']:12} (password: {user['password']:10}) [{role}]")
    print()


if __name__ == "__main__":
    main()
