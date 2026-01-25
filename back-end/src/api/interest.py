#
# Interest Routes - /profile/interests, /users/<user_id>/interests
#

import uuid
import FlaskSimpleAuth as fsa

def register_routes(app):
    """Register interest routes with the Flask app."""
    from database import db
    import model

    # GET /profile/interests - get current user's interests
    @app.get("/profile/interests", authz="AUTH")
    def get_my_interests(auth: model.CurrentAuth):
        """Get current user's interests."""
        interests = db.get_user_interests(user_id=auth.aid)
        return fsa.jsonify(interests), 200

    # GET /users/<user_id>/interests - get any user's interests
    @app.get("/users/<user_id>/interests", authz="AUTH")
    def get_user_interests(user_id: str):
        """Get any user's interests."""
        try:
            uuid.UUID(user_id)
        except ValueError:
            return {"error": "Invalid user ID format"}, 400

        interests = db.get_user_interests(user_id=user_id)
        return fsa.jsonify(interests), 200

    # POST /profile/interests - add interest to current user
    @app.post("/profile/interests", authz="AUTH")
    def post_interest(auth: model.CurrentAuth, category_id: str, proficiency_level: int = 1):
        """Add an interest to current user's profile."""
        try:
            uuid.UUID(category_id)
        except ValueError:
            return {"error": "Invalid category_id format"}, 400

        fsa.checkVal(1 <= proficiency_level <= 5, "Proficiency level must be 1-5", 400)

        # Check category exists
        category = db.get_category_by_id(category_id=category_id)
        if not category:
            return {"error": "Category not found"}, 404

        db.insert_user_interest(
            user_id=auth.aid,
            category_id=category_id,
            proficiency_level=proficiency_level
        )

        return "", 201

    # PATCH /profile/interests/<category_id> - update interest
    @app.patch("/profile/interests/<category_id>", authz="AUTH")
    def patch_interest(category_id: str, auth: model.CurrentAuth, proficiency_level: int):
        """Update an interest's proficiency level."""
        try:
            uuid.UUID(category_id)
        except ValueError:
            return {"error": "Invalid category_id format"}, 400

        fsa.checkVal(1 <= proficiency_level <= 5, "Proficiency level must be 1-5", 400)

        db.update_user_interest(
            user_id=auth.aid,
            category_id=category_id,
            proficiency_level=proficiency_level
        )

        return "", 204

    # DELETE /profile/interests/<category_id> - delete interest
    @app.delete("/profile/interests/<category_id>", authz="AUTH")
    def delete_interest(category_id: str, auth: model.CurrentAuth):
        """Delete an interest from current user's profile."""
        try:
            uuid.UUID(category_id)
        except ValueError:
            return {"error": "Invalid category_id format"}, 400

        db.delete_user_interest(user_id=auth.aid, category_id=category_id)
        return "", 204
