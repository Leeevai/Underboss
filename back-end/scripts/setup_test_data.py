#!/usr/bin/env python3
"""
Setup test data for the application.
This script creates test users, profiles, and sample data in the database.
Run this after create.sql to populate test data.
"""

import os
import sys
import shutil
import anodb  # type: ignore

# Static UUIDs for test users (for consistency across test runs)
USER_UUIDS = {
    "calvin": "00000000-0000-0000-0000-000000000001",
    "hobbes": "00000000-0000-0000-0000-000000000002",
    "hassan": "00000000-0000-0000-0000-000000000003",
    "clement": "00000000-0000-0000-0000-000000000004",
    "osman": "00000000-0000-0000-0000-000000000005",
    "enrique": "00000000-0000-0000-0000-000000000006"
}

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
        ],
        "experiences": [
            {
                "title": "Lead UI/UX Designer",
                "company": "Design Studio Paris",
                "start_date": "2020-06-01",
                "description": "Leading design team for mobile and web projects",
                "is_current": True
            },
            {
                "title": "Junior Designer",
                "company": "Creative Agency",
                "start_date": "2018-01-15",
                "end_date": "2020-05-31",
                "description": "Worked on branding and digital design projects"
            }
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
        ],
        "experiences": [
            {
                "title": "SEO Manager",
                "company": "Digital Marketing Co",
                "start_date": "2019-03-01",
                "description": "Managing SEO strategies for enterprise clients",
                "is_current": True
            }
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
        ],
        "experiences": [
            {
                "title": "Senior Content Writer",
                "company": "Media House Barcelona",
                "start_date": "2021-09-01",
                "description": "Creating content for digital platforms and podcasts",
                "is_current": True
            },
            {
                "title": "Audio Producer",
                "company": "Podcast Studio",
                "start_date": "2019-01-01",
                "end_date": "2021-08-31",
                "description": "Produced and edited podcasts for various clients"
            }
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

# Static UUIDs for test PAPS (for consistency)
PAPS_UUIDS = {
    "paps1": "00000000-0000-0000-1000-000000000001",
    "paps2": "00000000-0000-0000-1000-000000000002",
    "paps3": "00000000-0000-0000-1000-000000000003",
    "paps4": "00000000-0000-0000-1000-000000000004",
    "paps5": "00000000-0000-0000-1000-000000000005",
    "paps6": "00000000-0000-0000-1000-000000000006",
}

# Sample PAPS (job postings) for testing
TEST_PAPS = [
    {
        "id": "paps1",
        "owner_username": "clement",
        "title": "Need a Web Developer for E-commerce Site",
        "subtitle": "React + Node.js Project",
        "description": "Looking for an experienced web developer to build a modern e-commerce platform. Must have experience with React, Node.js, and PostgreSQL. The project involves building a responsive storefront, admin dashboard, and payment integration.",
        "status": "published",
        "location_address": "Paris, France",
        "location_lat": 48.8566,
        "location_lng": 2.3522,
        "payment_amount": 2500.00,
        "payment_currency": "EUR",
        "payment_type": "fixed",
        "max_applicants": 10,
        "max_assignees": 1,
        "is_public": True,
        "categories": [
            {"slug": "web-development", "is_primary": True},
            {"slug": "technology", "is_primary": False}
        ]
    },
    {
        "id": "paps2",
        "owner_username": "clement",
        "title": "Mobile App UI/UX Design",
        "subtitle": "Fitness Tracking App Redesign",
        "description": "Need a talented UI/UX designer to redesign our fitness tracking mobile app. Looking for someone who understands modern design trends and can create an intuitive user experience. Deliverables include wireframes, mockups, and a design system.",
        "status": "published",
        "location_address": "Remote",
        "payment_amount": 1800.00,
        "payment_currency": "EUR",
        "payment_type": "fixed",
        "max_applicants": 15,
        "max_assignees": 1,
        "is_public": True,
        "categories": [
            {"slug": "ui-ux-design", "is_primary": True},
            {"slug": "graphic-design", "is_primary": False},
            {"slug": "mobile-development", "is_primary": False}
        ]
    },
    {
        "id": "paps3",
        "owner_username": "osman",
        "title": "SEO Optimization for Tourism Website",
        "subtitle": "Boost Search Rankings",
        "description": "Looking for an SEO expert to optimize our tourism website. The site promotes vacation packages in Turkey. Need keyword research, on-page optimization, and a content strategy to improve organic rankings.",
        "status": "published",
        "location_address": "Istanbul, Turkey",
        "location_lat": 41.0082,
        "location_lng": 28.9784,
        "payment_amount": 75.00,
        "payment_currency": "USD",
        "payment_type": "hourly",
        "max_applicants": 5,
        "max_assignees": 1,
        "is_public": True,
        "categories": [
            {"slug": "seo", "is_primary": True}
        ]
    },
    {
        "id": "paps4",
        "owner_username": "enrique",
        "title": "Podcast Editing and Production",
        "subtitle": "Weekly Business Podcast",
        "description": "Need an audio producer to edit and produce a weekly business podcast. Episodes are typically 45-60 minutes. Tasks include noise reduction, EQ, adding intro/outro music, and mastering for various platforms.",
        "status": "published",
        "location_address": "Barcelona, Spain",
        "location_lat": 41.3851,
        "location_lng": 2.1734,
        "payment_amount": 150.00,
        "payment_currency": "EUR",
        "payment_type": "fixed",
        "max_applicants": 8,
        "max_assignees": 2,
        "is_public": True,
        "categories": [
            {"slug": "audio-production", "is_primary": True}
        ]
    },
    {
        "id": "paps5",
        "owner_username": "hassan",
        "title": "Social Media Content Creation",
        "subtitle": "Tech Startup Brand Building",
        "description": "Looking for a creative social media manager to create engaging content for our tech startup. Need someone who can create graphics, write captions, and maintain a consistent brand voice across Instagram, Twitter, and LinkedIn.",
        "status": "published",
        "location_address": "New York, NY",
        "location_lat": 40.7128,
        "location_lng": -74.0060,
        "payment_amount": 500.00,
        "payment_currency": "USD",
        "payment_type": "fixed",
        "max_applicants": 20,
        "max_assignees": 1,
        "is_public": True,
        "categories": [
            {"slug": "social-media", "is_primary": True},
            {"slug": "graphic-design", "is_primary": False},
            {"slug": "content-writing", "is_primary": False}
        ]
    },
    {
        "id": "paps6",
        "owner_username": "calvin",
        "title": "Video Editing for YouTube Channel",
        "subtitle": "Tech Review Videos",
        "description": "Admin-posted job for testing. Need a video editor for tech review content. Experience with Adobe Premiere or DaVinci Resolve required. Must be able to add motion graphics, transitions, and color grade footage.",
        "status": "draft",  # Draft status for admin testing
        "location_address": "Remote",
        "payment_amount": 200.00,
        "payment_currency": "USD",
        "payment_type": "fixed",
        "max_applicants": 10,
        "max_assignees": 1,
        "is_public": False,  # Not public for admin testing
        "categories": [
            {"slug": "video-editing", "is_primary": True}
        ]
    }
]


def setup_categories(app):
    """Create sample categories."""
    print("Setting up categories...")
    print("  Categories already created in data_minimal.sql")
    print("  Skipping category creation\n")
    return


def setup_users(app, db):
    """Create test users with profiles and data."""
    print("Setting up test users...")
    
    for user_data in TEST_USERS:
        username = user_data["username"]
        print(f"\n  Creating user: {username}")
        
        try:
            # Hash password
            password_hash = app.hash_password(user_data["password"])
            
            # Get static UUID for this user
            static_uuid = USER_UUIDS.get(username)
            
            # Insert user with static UUID
            print(f"    → Inserting with UUID: {static_uuid}")
            user_id = db.insert_user(
                user_id=static_uuid,  # Use static UUID
                username=username,
                email=user_data["email"],
                phone=user_data.get("phone"),
                password=password_hash,
                is_admin=user_data.get("is_admin", False)
            )
            print(f"    → insert_user returned: {user_id} (type: {type(user_id)})")
            
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
    
    # Use psycopg directly for better control
    import psycopg
    
    print("=" * 60)
    print("TEST DATA SETUP")
    print("=" * 60)
    print()
    
    # Get database config
    db_config = app.config["DATABASE"]
    conn_str = db_config.get('conn', 'dbname=underboss')
    
    try:
        with psycopg.connect(conn_str) as conn:
            with conn.cursor() as cur:
                print("Setting up test users...")
                
                for user_data in TEST_USERS:
                    username = user_data["username"]
                    print(f"\n  Creating user: {username}")
                    
                    try:
                        # Hash password
                        password_hash = app.hash_password(user_data["password"])
                        
                        # Get static UUID for this user
                        static_uuid = USER_UUIDS.get(username)
                        
                        # Get role ID
                        role_name = 'admin' if user_data.get("is_admin") else 'user'
                        cur.execute("SELECT id FROM ROLE WHERE name = %s", (role_name,))
                        role_result = cur.fetchone()
                        if not role_result:
                            print(f"    ✗ Role '{role_name}' not found in database!")
                            print(f"      Make sure data.sql has been run to create roles")
                            continue
                        role_id = role_result[0]
                        
                        # Insert user with static UUID
                        print(f"    → Inserting with UUID: {static_uuid}")
                        cur.execute("""
                            INSERT INTO "USER"(id, username, email, phone, password_hash, role_id)
                            VALUES (%s, %s, %s, %s, %s, %s)
                            ON CONFLICT (email) DO NOTHING
                            RETURNING id
                        """, (static_uuid, username, user_data["email"], user_data.get("phone"), password_hash, role_id))
                        
                        result = cur.fetchone()
                        if not result:
                            print(f"    ⚠ User {username} may already exist (conflict), skipping...")
                            continue
                        
                        user_id = str(result[0])
                        print(f"    ✓ User created with ID: {user_id}")
                        
                        # Copy profile picture if user has one
                        if user_data.get("has_avatar"):
                            avatar_filename = user_data.get("avatar_filename")
                            if avatar_filename:
                                # Construct paths
                                script_dir = os.path.dirname(os.path.abspath(__file__))
                                project_root = os.path.dirname(script_dir)
                                src_pic = os.path.join(project_root, "test_data", "profile", avatar_filename)
                                dest_dir = os.path.join(project_root, "media", "user", "profile")
                                dest_pic = os.path.join(dest_dir, f"{user_id}.jpg")
                                
                                # Ensure destination directory exists
                                os.makedirs(dest_dir, exist_ok=True)
                                
                                # Avatar URL to set in database
                                avatar_url = f"media/user/profile/{user_id}.jpg"
                                
                                # Check if destination already exists (e.g., from previous setup)
                                if os.path.exists(dest_pic):
                                    print(f"    ✓ Avatar already exists: {user_id}.jpg")
                                    # Update avatar_url in user_profile table
                                    cur.execute("""
                                        UPDATE user_profile 
                                        SET avatar_url = %s 
                                        WHERE user_id = %s
                                    """, (avatar_url, static_uuid))
                                    print(f"    ✓ Set avatar_url: {avatar_url}")
                                # Copy file if source exists
                                elif os.path.exists(src_pic):
                                    shutil.copy(src_pic, dest_pic)
                                    print(f"    ✓ Copied profile picture: {avatar_filename} → {user_id}.jpg")
                                    
                                    # Update avatar_url in user_profile table
                                    cur.execute("""
                                        UPDATE user_profile 
                                        SET avatar_url = %s 
                                        WHERE user_id = %s
                                    """, (avatar_url, static_uuid))
                                    print(f"    ✓ Set avatar_url: {avatar_url}")
                                else:
                                    print(f"    ⚠ Source image not found: {src_pic}")
                        
                        # Insert experiences if user has any
                        if "experiences" in user_data:
                            for exp in user_data["experiences"]:
                                try:
                                    cur.execute("""
                                        INSERT INTO USER_EXPERIENCE (user_id, title, company, description, start_date, end_date, is_current)
                                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                                    """, (
                                        static_uuid,
                                        exp.get("title"),
                                        exp.get("company"),
                                        exp.get("description"),
                                        exp.get("start_date"),
                                        exp.get("end_date"),
                                        exp.get("is_current", False)
                                    ))
                                    print(f"    ✓ Added experience: {exp.get('title')}")
                                except Exception as e:
                                    print(f"    ⚠ Could not add experience: {e}")
                        
                        # Insert user interests if any
                        if "interests" in user_data:
                            for interest in user_data["interests"]:
                                try:
                                    # Get category ID by slug
                                    cur.execute("SELECT id FROM CATEGORY WHERE slug = %s", (interest.get("category_slug"),))
                                    cat_result = cur.fetchone()
                                    if cat_result:
                                        category_id = cat_result[0]
                                        cur.execute("""
                                            INSERT INTO USER_INTEREST (user_id, category_id, proficiency_level)
                                            VALUES (%s, %s, %s)
                                            ON CONFLICT (user_id, category_id) DO UPDATE SET proficiency_level = %s
                                        """, (
                                            static_uuid,
                                            category_id,
                                            interest.get("proficiency", 3),
                                            interest.get("proficiency", 3)
                                        ))
                                        print(f"    ✓ Added interest: {interest.get('category_slug')} (proficiency: {interest.get('proficiency', 3)})")
                                    else:
                                        print(f"    ⚠ Category not found: {interest.get('category_slug')}")
                                except Exception as e:
                                    print(f"    ⚠ Could not add interest: {e}")
                        
                    except Exception as e:
                        print(f"    ✗ Error creating user {username}: {e}")
                        continue
                
                # Now create test PAPS
                print("\n" + "-" * 40)
                print("Setting up test PAPS...")
                
                # Import datetime for PAPS
                from datetime import datetime, timedelta
                
                for paps_data in TEST_PAPS:
                    paps_key = paps_data["id"]
                    paps_uuid = PAPS_UUIDS.get(paps_key)
                    owner_username = paps_data["owner_username"]
                    owner_uuid = USER_UUIDS.get(owner_username)
                    
                    if not owner_uuid:
                        print(f"  ⚠ Owner not found: {owner_username}")
                        continue
                    
                    print(f"\n  Creating PAPS: {paps_data['title'][:40]}...")
                    
                    try:
                        # For published status, we need publish_at and start_datetime
                        status = paps_data.get("status", "draft")
                        publish_at = None
                        start_datetime = None
                        
                        if status == "published":
                            publish_at = datetime.now()
                            start_datetime = datetime.now() + timedelta(days=7)  # Start in a week
                        
                        cur.execute("""
                            INSERT INTO PAPS (id, owner_id, title, subtitle, description, status,
                                location_address, location_lat, location_lng,
                                payment_amount, payment_currency, payment_type,
                                max_applicants, max_assignees, is_public, publish_at, start_datetime)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (id) DO NOTHING
                            RETURNING id
                        """, (
                            paps_uuid,
                            owner_uuid,
                            paps_data["title"],
                            paps_data.get("subtitle"),
                            paps_data["description"],
                            status,
                            paps_data.get("location_address"),
                            paps_data.get("location_lat"),
                            paps_data.get("location_lng"),
                            paps_data["payment_amount"],
                            paps_data.get("payment_currency", "USD"),
                            paps_data.get("payment_type", "fixed"),
                            paps_data.get("max_applicants", 10),
                            paps_data.get("max_assignees", 1),
                            paps_data.get("is_public", True),
                            publish_at,
                            start_datetime
                        ))
                        
                        result = cur.fetchone()
                        if result:
                            print(f"    ✓ PAPS created: {paps_uuid}")
                            
                            # Add categories for this PAPS
                            if "categories" in paps_data:
                                for cat in paps_data["categories"]:
                                    cur.execute("SELECT id FROM CATEGORY WHERE slug = %s", (cat["slug"],))
                                    cat_result = cur.fetchone()
                                    if cat_result:
                                        category_id = cat_result[0]
                                        cur.execute("""
                                            INSERT INTO PAPS_CATEGORY (paps_id, category_id, is_primary)
                                            VALUES (%s, %s, %s)
                                            ON CONFLICT (paps_id, category_id) DO NOTHING
                                        """, (paps_uuid, category_id, cat.get("is_primary", False)))
                                        print(f"    ✓ Added category: {cat['slug']}")
                        else:
                            print(f"    ⚠ PAPS may already exist: {paps_uuid}")
                            
                    except Exception as e:
                        print(f"    ✗ Error creating PAPS: {e}")
                        continue
                
                # Commit the transaction
                conn.commit()
                print("\n✓ All changes committed to database")
                
                # Verify
                cur.execute("SELECT COUNT(*) FROM \"USER\"")
                count = cur.fetchone()[0]
                print(f"  Total users in database: {count}")
        
    except Exception as e:
        print(f"\n✗ Error during setup: {e}")
        import traceback
        traceback.print_exc()
        raise
    
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
