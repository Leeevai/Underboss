#!/usr/bin/env python3
"""
Setup category icons from open source SVG icons.

Creates SVG icons (Material Design style / public domain) for the
seed categories in the database.

Run: python scripts/setup_category_icons.py
Or:  APP_NAME=underboss APP_CONFIG=config/local.conf python scripts/setup_category_icons.py
"""

import os
import sys
import pathlib

# Add src to path for imports
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent / "src"))

# Category icon mappings using Material Design style SVG icons
# All icons are simple SVG paths, public domain / CC0
# Format: slug -> svg_content
CATEGORY_ICONS = {
    # Technology category - using a simple gear/cog icon
    "technology": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/></svg>""",

    # Web Development - code brackets
    "web-development": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 3a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2H3v2h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h2v-2H8v-5a2 2 0 0 0-2-2a2 2 0 0 0 2-2V5h2V3H8m8 0a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1v2h-1a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-2v-2h2v-5a2 2 0 0 1 2-2a2 2 0 0 1-2-2V5h-2V3h2Z"/></svg>""",

    # Mobile Development - smartphone
    "mobile-development": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 1H7a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2m0 18H7V5h10v14m-5 2a1 1 0 0 1-1-1a1 1 0 0 1 1-1a1 1 0 0 1 1 1a1 1 0 0 1-1 1Z"/></svg>""",

    # Design - palette
    "design": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22A10 10 0 0 1 2 12A10 10 0 0 1 12 2c5.5 0 10 4 10 9a6 6 0 0 1-6 6h-1.8c-.3 0-.5.2-.5.5c0 .1.1.2.1.3c.4.5.6 1.1.6 1.7a2.5 2.5 0 0 1-2.4 2.5m0-18a8 8 0 0 0-8 8a8 8 0 0 0 8 8c.3 0 .5-.2.5-.5c0-.2-.1-.3-.1-.4c-.4-.5-.6-1-.6-1.6c0-1.4 1.1-2.5 2.5-2.5H16a4 4 0 0 0 4-4c0-3.9-3.6-7-8-7m-5.5 6c.8 0 1.5.7 1.5 1.5S7.3 13 6.5 13S5 12.3 5 11.5S5.7 10 6.5 10m3-4c.8 0 1.5.7 1.5 1.5S10.3 9 9.5 9S8 8.3 8 7.5S8.7 6 9.5 6m5 0c.8 0 1.5.7 1.5 1.5S15.3 9 14.5 9S13 8.3 13 7.5S13.7 6 14.5 6m3 4c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5Z"/></svg>""",

    # Graphic Design - vector bezier
    "graphic-design": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h4v2H7v4H5V4a2 2 0 0 1 2-2m10 0a2 2 0 0 1 2 2v4h-2V4h-4V2h4M7 17v3h4v2H7a2 2 0 0 1-2-2v-3h2m10 3v-3h2v3a2 2 0 0 1-2 2h-4v-2h4m-8-6a3 3 0 0 1 3-3a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3Z"/></svg>""",

    # UI/UX Design - layout
    "ui-ux-design": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4m0 2h16v4H4V4m0 6h6v10H4V10m8 0h8v4h-8v-4m0 6h8v4h-8v-4Z"/></svg>""",

    # Writing - pen/pencil
    "writing": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83l3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25Z"/></svg>""",

    # Content Writing - document text
    "content-writing": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6m4 18H6V4h7v5h5v11M8 12h8v2H8v-2m0 4h8v2H8v-2m0-8h5v2H8V8Z"/></svg>""",

    # Marketing - megaphone
    "marketing": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-4h3l5 4V4l-5 4m9.5 4A4.5 4.5 0 0 0 17 7.2v9.6c2.5-.7 4.5-2.9 4.5-4.8Z"/></svg>""",

    # SEO - search/magnify with chart
    "seo": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5m-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14m-2-4h5v1h-5V10m0-2h5v1h-5V8m0 4h3v1h-3v-1Z"/></svg>""",

    # Social Media - share network
    "social-media": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81a3 3 0 0 0 3-3a3 3 0 0 0-3-3a3 3 0 0 0-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.15c-.05.21-.08.43-.08.66c0 1.61 1.31 2.91 2.92 2.91a2.92 2.92 0 0 0 2.92-2.91A2.92 2.92 0 0 0 18 16.08Z"/></svg>""",

    # Audio/Video - play media
    "audio-video": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4M14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2Z"/></svg>""",

    # Video Editing - film/movie
    "video-editing": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4h-4Z"/></svg>""",

    # Audio Production - microphone/headphones
    "audio-production": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3m7 9c0 3.53-2.61 6.44-6 6.93V21h-2v-3.07c-3.39-.49-6-3.4-6-6.93h2a5 5 0 0 0 5 5a5 5 0 0 0 5-5h2Z"/></svg>""",
}


def setup_category_icons():
    """Create SVG icon files for all seed categories."""
    media_dir = pathlib.Path(__file__).parent.parent / "media" / "category"
    media_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("CATEGORY ICON SETUP")
    print("=" * 60)
    print()

    # Create a simple default icon
    default_icon = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2Z"/></svg>"""

    default_path = media_dir / "default.svg"
    default_path.write_text(default_icon)
    print(f"  ✓ Created default icon: {default_path}")

    # Check if we can connect to the database
    if "APP_NAME" not in os.environ:
        # Just create the static files without database connection
        print("\n  ! No APP_NAME set - creating static icons by slug only")
        for slug, svg_content in CATEGORY_ICONS.items():
            icon_path = media_dir / f"{slug}.svg"
            icon_path.write_text(svg_content)
            print(f"  ✓ Created icon: {icon_path}")

        print("\n" + "=" * 60)
        print("SETUP COMPLETE (static files only)")
        print("=" * 60)
        print(f"\nCreated {len(CATEGORY_ICONS) + 1} icon files in {media_dir}")
        print("\nTo link icons to categories in the database, run:")
        print("  APP_NAME=underboss APP_CONFIG=config/local.conf python scripts/setup_category_icons.py")
        return

    # Now we need to get the category IDs from the database to create proper filenames
    import psycopg

    # Read config to get database connection
    config_file = os.environ.get("APP_CONFIG", "config/local.conf")
    config = {}
    exec(open(config_file).read(), config)
    db_config = config.get("DATABASE", {})
    conn_str = db_config.get("conn", "")

    try:
        conn = psycopg.connect(conn_str)
        cur = conn.cursor()

        for slug, svg_content in CATEGORY_ICONS.items():
            # Get category by slug
            cur.execute("SELECT id FROM category WHERE slug = %s", (slug,))
            row = cur.fetchone()
            if row:
                category_id = row[0]
                icon_path = media_dir / f"{category_id}.svg"
                icon_path.write_text(svg_content)

                # Update database with icon_url
                icon_url = f"/media/category/{category_id}.svg"
                cur.execute("UPDATE category SET icon_url = %s WHERE id = %s", (icon_url, category_id))
                print(f"  ✓ Created icon for '{slug}': {icon_path}")
            else:
                # Create by slug name for reference
                icon_path = media_dir / f"{slug}.svg"
                icon_path.write_text(svg_content)
                print(f"  ! Category '{slug}' not found in DB, saved as: {icon_path}")

        conn.commit()
        conn.close()

        print("\n" + "=" * 60)
        print("SETUP COMPLETE")
        print("=" * 60)
        print(f"\nCreated {len(CATEGORY_ICONS) + 1} icon files in {media_dir}")
        print("Database updated with icon_url for all found categories.")

    except Exception as e:
        print(f"\n  ✗ Database error: {e}")
        print("  Creating icons by slug name only...")

        for slug, svg_content in CATEGORY_ICONS.items():
            icon_path = media_dir / f"{slug}.svg"
            icon_path.write_text(svg_content)
            print(f"  ✓ Created icon: {icon_path}")

        print("\n" + "=" * 60)
        print("SETUP COMPLETE (static files only)")
        print("=" * 60)


if __name__ == "__main__":
    setup_category_icons()
