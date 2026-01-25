#
# Category Routes - /categories, /categories/<category_id>/icon
#

import uuid
import re
from io import BytesIO
import FlaskSimpleAuth as fsa
from PIL import Image

def register_routes(app):
    """Register category routes with the Flask app."""
    from database import db
    from utils import ensure_media_dir, CATEGORY_IMG_DIR
    import model

    # =========================================================================
    # CATEGORY CRUD ROUTES
    # =========================================================================

    # GET /categories - list all active categories
    @app.get("/categories", authz="AUTH")
    def get_categories():
        """Get all active categories."""
        categories = db.get_all_categories()
        return fsa.jsonify(categories), 200

    # GET /categories/<category_id> - get specific category
    @app.get("/categories/<category_id>", authz="AUTH")
    def get_category(category_id: str):
        """Get a specific category by ID."""
        try:
            uuid.UUID(category_id)
        except ValueError:
            return {"error": "Invalid category ID format"}, 400

        category = db.get_category_by_id(category_id=category_id)
        if not category:
            return {"error": "Category not found"}, 404

        return fsa.jsonify(category), 200

    # POST /categories - create category (admin only)
    @app.post("/categories", authz="ADMIN")
    def post_category(auth: model.CurrentAuth, name: str, slug: str,
                     description: str|None = None, parent_id: str|None = None,
                     icon_url: str|None = None):
        """Create a new category (admin only)."""
        fsa.checkVal(len(name.strip()) >= 2, "Name must be at least 2 characters", 400)
        fsa.checkVal(re.match(r'^[a-z0-9-]+$', slug), "Slug must be lowercase letters, numbers, and hyphens", 400)

        if parent_id:
            try:
                uuid.UUID(parent_id)
            except ValueError:
                return {"error": "Invalid parent_id format"}, 400

        cat_id = db.insert_category(
            name=name.strip(),
            slug=slug.strip(),
            description=description.strip() if description else None,
            parent_id=parent_id,
            icon_url=icon_url
        )

        return fsa.jsonify({"category_id": cat_id}), 201

    # PATCH /categories/<category_id> - update category (admin only)
    @app.patch("/categories/<category_id>", authz="ADMIN")
    def patch_category(category_id: str, auth: model.CurrentAuth, name: str|None = None,
                      slug: str|None = None, description: str|None = None,
                      parent_id: str|None = None, icon_url: str|None = None,
                      is_active: bool|None = None):
        """Update a category (admin only)."""
        try:
            uuid.UUID(category_id)
        except ValueError:
            return {"error": "Invalid category ID format"}, 400

        category = db.get_category_by_id(category_id=category_id)
        if not category:
            return {"error": "Category not found"}, 404

        if name is not None:
            fsa.checkVal(len(name.strip()) >= 2, "Name must be at least 2 characters", 400)

        if slug is not None:
            fsa.checkVal(re.match(r'^[a-z0-9-]+$', slug), "Slug must be lowercase letters, numbers, and hyphens", 400)

        db.update_category(
            category_id=category_id,
            name=name.strip() if name else None,
            slug=slug.strip() if slug else None,
            description=description.strip() if description else None,
            parent_id=parent_id,
            icon_url=icon_url,
            is_active=is_active
        )

        return "", 204

    # DELETE /categories/<category_id> - delete category (admin only)
    @app.delete("/categories/<category_id>", authz="ADMIN")
    def delete_category(category_id: str, auth: model.CurrentAuth):
        """Delete a category (admin only). Also removes associated icon file."""
        try:
            uuid.UUID(category_id)
        except ValueError:
            return {"error": "Invalid category ID format"}, 400

        category = db.get_category_by_id(category_id=category_id)
        if not category:
            return {"error": "Category not found"}, 404

        # Delete icon file if it exists
        _delete_category_icon_file(category_id)

        db.delete_category(category_id=category_id)
        return "", 204

    # =========================================================================
    # CATEGORY ICON ROUTES
    # =========================================================================

    # POST /categories/<category_id>/icon - upload category icon (admin only)
    @app.route("/categories/<category_id>/icon", methods=["POST"], authz="ADMIN")
    def post_category_icon(category_id: str, auth: model.CurrentAuth):
        """Upload a category icon image. Accepts binary image data or multipart form data."""
        from flask import request
        from werkzeug.utils import secure_filename

        try:
            uuid.UUID(category_id)
        except ValueError:
            return {"error": "Invalid category ID format"}, 400

        category = db.get_category_by_id(category_id=category_id)
        if not category:
            return {"error": "Category not found"}, 404

        ensure_media_dir()
        config = app.config.get("MEDIA_CONFIG", {})

        # Try to get image from multipart files first, then from raw body
        image_data = None
        filename = "icon.png"

        if "image" in request.files:
            file = request.files["image"]
            fsa.checkVal(file.filename != "", "No file selected", 400)
            filename = file.filename
            image_data = file.read()
        elif request.data:
            image_data = request.data
            content_type = request.headers.get("Content-Type", "image/png")
            if "jpeg" in content_type or "jpg" in content_type:
                filename = "icon.jpg"
            elif "png" in content_type:
                filename = "icon.png"
            elif "gif" in content_type:
                filename = "icon.gif"
            elif "webp" in content_type:
                filename = "icon.webp"
            elif "svg" in content_type:
                filename = "icon.svg"
        else:
            fsa.checkVal(False, "No image data provided", 400)

        # Validate file type - only images for icons
        icon_extensions = config.get("icon_extensions", {"jpg", "jpeg", "png", "gif", "webp", "svg"})
        ext = filename.rsplit(".", 1)[1].lower() if "." in filename else "png"
        fsa.checkVal(ext in icon_extensions,
                    f"File type not allowed for icons. Allowed: {', '.join(icon_extensions)}", 415)

        # Handle SVG separately (no compression)
        if ext == "svg":
            max_size = config.get("max_icon_size", 1 * 1024 * 1024)  # 1MB for icons
            fsa.checkVal(len(image_data) <= max_size,
                        f"File too large (max {max_size / 1024 / 1024}MB)", 413)
        else:
            # Compress before storage
            max_size = config.get("max_icon_size", 1 * 1024 * 1024)
            image_data = _compress_icon(image_data, ext, max_size, config)
            fsa.checkVal(len(image_data) <= max_size,
                        f"File too large (max {max_size / 1024 / 1024}MB)", 413)

        # Delete old icon if exists (different extension)
        _delete_category_icon_file(category_id)

        # Save file with category_id as name to ensure uniqueness
        filename = secure_filename(f"{category_id}.{ext}")
        filepath = CATEGORY_IMG_DIR / filename
        filepath.write_bytes(image_data)

        # Update icon_url in database
        icon_url = f"/media/category/{filename}"
        db.update_category(
            category_id=category_id,
            name=None,
            slug=None,
            description=None,
            parent_id=None,
            icon_url=icon_url,
            is_active=None
        )
        return {"icon_url": icon_url}, 201

    # GET /categories/<category_id>/icon - serve category icon
    @app.get("/categories/<category_id>/icon", authz="AUTH")
    def get_category_icon(category_id: str):
        """Serve category icon image."""
        from flask import send_file
        from werkzeug.utils import secure_filename

        try:
            uuid.UUID(category_id)
        except ValueError:
            return {"error": "Invalid category ID format"}, 400

        category = db.get_category_by_id(category_id=category_id)
        if not category:
            return {"error": "Category not found"}, 404

        icon_url = category.get("icon_url")
        if icon_url:
            filename = secure_filename(icon_url.split("/")[-1])
            filepath = CATEGORY_IMG_DIR / filename
        else:
            # Return default icon
            filepath = CATEGORY_IMG_DIR / "default.png"

        if not filepath.exists():
            return {"error": "Icon not found"}, 404

        ext = filepath.suffix[1:].lower()
        mimetype_map = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "gif": "image/gif",
            "webp": "image/webp",
            "svg": "image/svg+xml",
        }
        mimetype = mimetype_map.get(ext, "application/octet-stream")

        return send_file(filepath, mimetype=mimetype)

    # DELETE /categories/<category_id>/icon - delete category icon (admin only)
    @app.delete("/categories/<category_id>/icon", authz="ADMIN")
    def delete_category_icon(category_id: str, auth: model.CurrentAuth):
        """Delete a category icon and reset to default (icon_url becomes NULL)."""
        try:
            uuid.UUID(category_id)
        except ValueError:
            return {"error": "Invalid category ID format"}, 400

        category = db.get_category_by_id(category_id=category_id)
        if not category:
            return {"error": "Category not found"}, 404

        # Delete icon file if exists
        _delete_category_icon_file(category_id)

        # Set icon_url to NULL in database
        db.update_category(
            category_id=category_id,
            name=None,
            slug=None,
            description=None,
            parent_id=None,
            icon_url="",  # Empty string will be converted to NULL by NULLIF
            is_active=None
        )

        return "", 204

    # =========================================================================
    # HELPER FUNCTIONS
    # =========================================================================

    def _compress_icon(data: bytes, ext: str, max_size: int, config: dict) -> bytes:
        """Compress icon image data."""
        try:
            img = Image.open(BytesIO(data))
        except Exception:
            fsa.checkVal(False, "Invalid image data", 400)

        img_format = {
            "jpg": "JPEG",
            "jpeg": "JPEG",
            "png": "PNG",
            "gif": "GIF",
            "webp": "WEBP",
        }.get(ext, "PNG")

        if img_format == "JPEG" and img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        if img_format in ("JPEG", "WEBP"):
            quality = int(config.get("icon_quality", 85))
            for q in [quality, 80, 75, 70, 60, 50]:
                out = BytesIO()
                img.save(out, format=img_format, quality=q, optimize=True)
                if out.tell() <= max_size:
                    return out.getvalue()
            return out.getvalue()

        out = BytesIO()
        img.save(out, format=img_format, optimize=True)
        return out.getvalue()

    def _delete_category_icon_file(category_id: str):
        """Delete category icon file from filesystem."""
        from werkzeug.utils import secure_filename
        
        # Check all possible extensions
        for ext in ["png", "jpg", "jpeg", "gif", "webp", "svg"]:
            filename = secure_filename(f"{category_id}.{ext}")
            filepath = CATEGORY_IMG_DIR / filename
            if filepath.exists():
                filepath.unlink()
