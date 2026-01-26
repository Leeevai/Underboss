#!/usr/bin/env python3
"""
Setup test media files for the Underboss application.
Downloads open source images and videos from various sources.
"""

import os
import sys
import requests
import shutil
from pathlib import Path

# Media directories
BASE_DIR = Path(__file__).parent.parent
TEST_MEDIA_DIR = BASE_DIR / "test_media"
PROFILE_DIR = TEST_MEDIA_DIR / "user" / "profile"
POST_MEDIA_DIR = TEST_MEDIA_DIR / "post"
SPAP_MEDIA_DIR = TEST_MEDIA_DIR / "spap"
CATEGORY_DIR = TEST_MEDIA_DIR / "category"

# User IDs from data.sql
USERS = {
    "calvin": "00000000-0000-0000-0000-000000000101",
    "hobbes": "00000000-0000-0000-0000-000000000102",
    "hassan": "00000000-0000-0000-0000-000000000201",
    "clement": "00000000-0000-0000-0000-000000000202",
    "osman": "00000000-0000-0000-0000-000000000203",
    "enrique": "00000000-0000-0000-0000-000000000204",
}

# PAPS IDs from data.sql
PAPS = {
    "ecommerce": "00000000-0000-0000-0003-000000000001",
    "mobileapp": "00000000-0000-0000-0003-000000000002",
    "branding": "00000000-0000-0000-0003-000000000003",
    "uiux": "00000000-0000-0000-0003-000000000004",
    "datapipeline": "00000000-0000-0000-0003-000000000005",
    "seo": "00000000-0000-0000-0003-000000000006",
}

# PAPS Media IDs (we'll create these)
PAPS_MEDIA = {
    "ecommerce_img1": "00000000-0000-0000-0004-000000000001",
    "ecommerce_img2": "00000000-0000-0000-0004-000000000002",
    "mobileapp_img1": "00000000-0000-0000-0004-000000000003",
    "branding_img1": "00000000-0000-0000-0004-000000000004",
    "uiux_img1": "00000000-0000-0000-0004-000000000005",
    "datapipeline_img1": "00000000-0000-0000-0004-000000000006",
    "seo_img1": "00000000-0000-0000-0004-000000000007",
}

# Open source image URLs (from Unsplash - free to use)
# Using picsum.photos for placeholder images
PROFILE_IMAGES = {
    "calvin": "https://picsum.photos/seed/calvin/400/400",
    "hobbes": "https://picsum.photos/seed/hobbes/400/400",
    "hassan": "https://picsum.photos/seed/hassan/400/400",
    "clement": "https://picsum.photos/seed/clement/400/400",
    "osman": "https://picsum.photos/seed/osman/400/400",
    "enrique": "https://picsum.photos/seed/enrique/400/400",
}

# PAPS project images
PAPS_IMAGES = {
    "ecommerce_img1": "https://picsum.photos/seed/ecommerce1/800/600",
    "ecommerce_img2": "https://picsum.photos/seed/ecommerce2/800/600",
    "mobileapp_img1": "https://picsum.photos/seed/mobileapp/800/600",
    "branding_img1": "https://picsum.photos/seed/branding/800/600",
    "uiux_img1": "https://picsum.photos/seed/uiux/800/600",
    "datapipeline_img1": "https://picsum.photos/seed/datapipeline/800/600",
    "seo_img1": "https://picsum.photos/seed/seo/800/600",
}

# Category icons
CATEGORY_IMAGES = {
    "web-development": "https://picsum.photos/seed/webdev/200/200",
    "mobile-development": "https://picsum.photos/seed/mobile/200/200",
    "design": "https://picsum.photos/seed/design/200/200",
    "data-science": "https://picsum.photos/seed/data/200/200",
    "marketing": "https://picsum.photos/seed/marketing/200/200",
    "writing": "https://picsum.photos/seed/writing/200/200",
    "video-production": "https://picsum.photos/seed/video/200/200",
    "music-audio": "https://picsum.photos/seed/music/200/200",
    "business": "https://picsum.photos/seed/business/200/200",
    "lifestyle": "https://picsum.photos/seed/lifestyle/200/200",
}


def download_file(url: str, dest_path: Path, timeout: int = 30) -> bool:
    """Download a file from URL to destination path."""
    try:
        print(f"  Downloading: {url}")
        response = requests.get(url, timeout=timeout, stream=True)
        response.raise_for_status()
        
        with open(dest_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"  ✓ Saved to: {dest_path}")
        return True
    except Exception as e:
        print(f"  ✗ Failed: {e}")
        return False


def create_placeholder_image(dest_path: Path, width: int = 400, height: int = 400, text: str = ""):
    """Create a simple placeholder image using PIL if download fails."""
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # Create a colored image
        import hashlib
        color_hash = int(hashlib.md5(text.encode()).hexdigest()[:6], 16)
        r = (color_hash >> 16) & 0xFF
        g = (color_hash >> 8) & 0xFF
        b = color_hash & 0xFF
        
        img = Image.new('RGB', (width, height), color=(r, g, b))
        draw = ImageDraw.Draw(img)
        
        # Add text
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
        except:
            font = ImageFont.load_default()
        
        # Center the text
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        x = (width - text_width) // 2
        y = (height - text_height) // 2
        
        draw.text((x, y), text, fill=(255, 255, 255), font=font)
        
        img.save(dest_path, "JPEG", quality=85)
        print(f"  ✓ Created placeholder: {dest_path}")
        return True
    except Exception as e:
        print(f"  ✗ Failed to create placeholder: {e}")
        return False


def create_placeholder_video(dest_path: Path, duration: int = 3, text: str = ""):
    """Create a simple placeholder video."""
    try:
        # Create a minimal valid MP4 file
        # This is a very simple approach - just copy a tiny valid mp4
        # For testing purposes, we'll create a text file that indicates it's a placeholder
        with open(dest_path, 'wb') as f:
            # Minimal ftyp box for MP4
            ftyp = bytes([
                0x00, 0x00, 0x00, 0x14,  # Size: 20 bytes
                0x66, 0x74, 0x79, 0x70,  # 'ftyp'
                0x69, 0x73, 0x6F, 0x6D,  # 'isom'
                0x00, 0x00, 0x02, 0x00,  # Version
                0x69, 0x73, 0x6F, 0x6D,  # Compatible brand: 'isom'
            ])
            f.write(ftyp)
        print(f"  ✓ Created minimal video placeholder: {dest_path}")
        return True
    except Exception as e:
        print(f"  ✗ Failed to create video placeholder: {e}")
        return False


def setup_directories():
    """Create all required media directories."""
    print("\n=== Creating directories ===")
    for dir_path in [PROFILE_DIR, POST_MEDIA_DIR, SPAP_MEDIA_DIR, CATEGORY_DIR]:
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"  ✓ {dir_path}")


def setup_profile_images():
    """Download profile images for all test users."""
    print("\n=== Setting up profile images ===")
    
    # Copy default avatar
    default_avatar_src = BASE_DIR / "media" / "user" / "profile" / "avatar.png"
    default_avatar_dst = PROFILE_DIR / "avatar.png"
    if default_avatar_src.exists():
        shutil.copy(default_avatar_src, default_avatar_dst)
        print(f"  ✓ Copied default avatar")
    else:
        # Create a simple default avatar
        create_placeholder_image(default_avatar_dst, 200, 200, "?")
    
    # Download/create profile images for each user
    for username, user_id in USERS.items():
        dest_path = PROFILE_DIR / f"{user_id}.jpg"
        url = PROFILE_IMAGES.get(username)
        
        if url:
            if not download_file(url, dest_path):
                create_placeholder_image(dest_path, 400, 400, username[0].upper())
        else:
            create_placeholder_image(dest_path, 400, 400, username[0].upper())


def setup_paps_media():
    """Download/create media for PAPS (job posts)."""
    print("\n=== Setting up PAPS media ===")
    
    for media_key, media_id in PAPS_MEDIA.items():
        dest_path = POST_MEDIA_DIR / f"{media_id}.jpg"
        url = PAPS_IMAGES.get(media_key)
        
        if url:
            if not download_file(url, dest_path):
                create_placeholder_image(dest_path, 800, 600, media_key)
        else:
            create_placeholder_image(dest_path, 800, 600, media_key)


def setup_category_icons():
    """Download/create category icons."""
    print("\n=== Setting up category icons ===")
    
    for category_slug, url in CATEGORY_IMAGES.items():
        dest_path = CATEGORY_DIR / f"{category_slug}.jpg"
        
        if not download_file(url, dest_path):
            create_placeholder_image(dest_path, 200, 200, category_slug[:2].upper())


def generate_paps_media_sql():
    """Generate SQL INSERT statements for PAPS_MEDIA table."""
    print("\n=== Generating SQL for PAPS_MEDIA ===")
    
    # Map media to PAPS
    media_mapping = {
        "ecommerce_img1": ("00000000-0000-0000-0003-000000000001", "image", "jpg", 50000, "image/jpeg", 1),
        "ecommerce_img2": ("00000000-0000-0000-0003-000000000001", "image", "jpg", 48000, "image/jpeg", 2),
        "mobileapp_img1": ("00000000-0000-0000-0003-000000000002", "image", "jpg", 52000, "image/jpeg", 1),
        "branding_img1": ("00000000-0000-0000-0003-000000000003", "image", "jpg", 45000, "image/jpeg", 1),
        "uiux_img1": ("00000000-0000-0000-0003-000000000004", "image", "jpg", 55000, "image/jpeg", 1),
        "datapipeline_img1": ("00000000-0000-0000-0003-000000000005", "image", "jpg", 47000, "image/jpeg", 1),
        "seo_img1": ("00000000-0000-0000-0003-000000000006", "image", "jpg", 42000, "image/jpeg", 1),
    }
    
    sql_lines = [
        "-- ============================================",
        "-- PAPS MEDIA (Job Post Images/Videos)",
        "-- ============================================",
        "INSERT INTO PAPS_MEDIA (id, paps_id, media_type, file_extension, file_size_bytes, mime_type, display_order) VALUES"
    ]
    
    values = []
    for media_key, media_id in PAPS_MEDIA.items():
        paps_id, media_type, ext, size, mime, order = media_mapping[media_key]
        values.append(f"  ('{media_id}', '{paps_id}', '{media_type}', '{ext}', {size}, '{mime}', {order})")
    
    sql_lines.append(",\n".join(values) + ";")
    
    sql = "\n".join(sql_lines)
    print(sql)
    return sql


def main():
    """Main function to setup all test media."""
    print("=" * 60)
    print("Underboss Test Media Setup")
    print("=" * 60)
    
    # Create directories
    setup_directories()
    
    # Setup profile images
    setup_profile_images()
    
    # Setup PAPS media
    setup_paps_media()
    
    # Setup category icons
    setup_category_icons()
    
    # Generate SQL for PAPS_MEDIA
    sql = generate_paps_media_sql()
    
    # Write SQL to file for reference
    sql_file = BASE_DIR / "scripts" / "paps_media_data.sql"
    with open(sql_file, 'w') as f:
        f.write(sql)
    print(f"\n✓ SQL written to: {sql_file}")
    
    print("\n" + "=" * 60)
    print("Setup complete!")
    print("=" * 60)
    print(f"\nTest media directory: {TEST_MEDIA_DIR}")
    print("\nTo use these files:")
    print("  1. Add the PAPS_MEDIA SQL to data.sql")
    print("  2. Run 'make clean && make check.pytest'")
    print("  3. The app will copy test_media to media on startup")


if __name__ == "__main__":
    main()
