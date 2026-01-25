#
# Category Routes - /categories
#

import uuid
import re
import FlaskSimpleAuth as fsa

def register_routes(app):
    """Register category routes with the Flask app."""
    from database import db
    import model

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
        """Delete a category (admin only)."""
        try:
            uuid.UUID(category_id)
        except ValueError:
            return {"error": "Invalid category ID format"}, 400

        category = db.get_category_by_id(category_id=category_id)
        if not category:
            return {"error": "Category not found"}, 404

        db.delete_category(category_id=category_id)
        return "", 204
