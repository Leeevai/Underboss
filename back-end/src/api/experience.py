#
# Experience Routes - /profile/experiences, /users/<user_id>/experiences
#

import uuid
import datetime
import FlaskSimpleAuth as fsa

def register_routes(app):
    """Register experience routes with the Flask app."""
    from database import db
    import model

    # GET /profile/experiences - get current user's experiences
    @app.get("/profile/experiences", authz="AUTH")
    def get_my_experiences(auth: model.CurrentAuth):
        """Get current user's work experiences."""
        experiences = db.get_user_experiences(user_id=auth.aid)
        return fsa.jsonify(experiences), 200

    # GET /users/<user_id>/experiences - get any user's experiences
    @app.get("/users/<user_id>/experiences", authz="OPEN", authn="none")
    def get_user_experiences(user_id: str):
        """Get any user's work experiences."""
        try:
            uuid.UUID(user_id)
        except ValueError:
            return {"error": "Invalid user ID format"}, 400

        experiences = db.get_user_experiences(user_id=user_id)
        return fsa.jsonify(experiences), 200

    # POST /profile/experiences - add experience to current user
    @app.post("/profile/experiences", authz="AUTH")
    def post_experience(auth: model.CurrentAuth, title: str, company: str|None = None,
                       description: str|None = None, start_date: str = None,
                       end_date: str|None = None, is_current: bool = False):
        """Add work experience to current user's profile."""
        fsa.checkVal(len(title.strip()) >= 2, "Title must be at least 2 characters", 400)

        # Validate dates
        try:
            start_dt = datetime.datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except ValueError:
            fsa.checkVal(False, "Invalid start_date format", 400)

        end_dt = None
        if end_date:
            try:
                end_dt = datetime.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                fsa.checkVal(end_dt >= start_dt, "End date must be after start date", 400)
            except ValueError:
                fsa.checkVal(False, "Invalid end_date format", 400)

        fsa.checkVal(not is_current or end_date is None, "Current experiences cannot have end date", 400)

        exp_id = db.insert_user_experience(
            user_id=auth.aid,
            title=title.strip(),
            company=company.strip() if company else None,
            description=description.strip() if description else None,
            start_date=start_dt,
            end_date=end_dt,
            is_current=is_current
        )

        return fsa.jsonify({"experience_id": exp_id}), 201

    # PATCH /profile/experiences/<exp_id> - update experience
    @app.patch("/profile/experiences/<exp_id>", authz="AUTH")
    def patch_experience(exp_id: str, auth: model.CurrentAuth, title: str|None = None,
                        company: str|None = None, description: str|None = None,
                        start_date: str|None = None, end_date: str|None = None,
                        is_current: bool|None = None):
        """Update a work experience."""
        try:
            uuid.UUID(exp_id)
        except ValueError:
            return {"error": "Invalid experience ID format"}, 400

        # Check ownership
        exp = db.get_user_experience_by_id(exp_id=exp_id)
        if not exp:
            return {"error": "Experience not found"}, 404
        if str(exp['user_id']) != auth.aid:
            return {"error": "Not authorized to update this experience"}, 403

        # Validate title if provided
        if title is not None:
            fsa.checkVal(len(title.strip()) >= 2, "Title must be at least 2 characters", 400)

        # Validate dates if provided
        start_dt = None
        if start_date:
            try:
                start_dt = datetime.datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except ValueError:
                fsa.checkVal(False, "Invalid start_date format", 400)

        end_dt = None
        if end_date:
            try:
                end_dt = datetime.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except ValueError:
                fsa.checkVal(False, "Invalid end_date format", 400)

        db.update_user_experience(
            exp_id=exp_id,
            title=title.strip() if title else None,
            company=company.strip() if company else None,
            description=description.strip() if description else None,
            start_date=start_dt,
            end_date=end_dt,
            is_current=is_current
        )

        return "", 204

    # DELETE /profile/experiences/<exp_id> - delete experience
    @app.delete("/profile/experiences/<exp_id>", authz="AUTH")
    def delete_experience(exp_id: str, auth: model.CurrentAuth):
        """Delete a work experience."""
        try:
            uuid.UUID(exp_id)
        except ValueError:
            return {"error": "Invalid experience ID format"}, 400

        # Check ownership
        exp = db.get_user_experience_by_id(exp_id=exp_id)
        if not exp:
            return {"error": "Experience not found"}, 404
        if str(exp['user_id']) != auth.aid:
            return {"error": "Not authorized to delete this experience"}, 403

        db.delete_user_experience(exp_id=exp_id)
        return "", 204
