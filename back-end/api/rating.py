#
# Rating Routes - /rating (rating management - moving average only)
#

import uuid
import FlaskSimpleAuth as fsa


def register_routes(app):
    """Register Rating routes with the Flask app."""
    from database import db
    import model

    # ============================================
    # RATING MANAGEMENT (Moving Average Only)
    # Individual ratings are not stored - only aggregates
    # ============================================

    # GET /users/<user_id>/rating - get user's rating
    @app.get("/users/<user_id>/rating", authz="AUTH")
    def get_user_rating(user_id: str):
        """Get a user's rating average and count."""
        try:
            uuid.UUID(user_id)
        except ValueError:
            return {"error": "Invalid user ID format"}, 400

        rating = db.get_user_rating(user_id=user_id)
        if not rating:
            return {"error": "User not found"}, 404

        return fsa.jsonify({
            "user_id": user_id,
            "rating_average": float(rating['rating_average'] or 0),
            "rating_count": rating['rating_count'] or 0
        }), 200

    # GET /profile/rating - get current user's rating
    @app.get("/profile/rating", authz="AUTH")
    def get_my_rating(auth: model.CurrentAuth):
        """Get the current user's rating average and count."""
        rating = db.get_user_rating(user_id=auth.aid)
        if not rating:
            return {"error": "Profile not found"}, 404

        return fsa.jsonify({
            "rating_average": float(rating['rating_average'] or 0),
            "rating_count": rating['rating_count'] or 0
        }), 200

    # POST /asap/<asap_id>/rate - rate a user for a completed ASAP
    @app.post("/asap/<asap_id>/rate", authz="AUTH")
    def rate_user(
        asap_id: str,
        auth: model.CurrentAuth,
        score: int
    ):
        """
        Rate a user after ASAP completion.
        - PAPS owner rates the worker
        - Worker can also rate the owner (bidirectional)

        Note: Individual ratings are NOT stored. Only the user's moving average
        is updated. This endpoint can only be called ONCE per rater/ratee/asap combination.
        """
        try:
            uuid.UUID(asap_id)
        except ValueError:
            return {"error": "Invalid ASAP ID format"}, 400

        fsa.checkVal(1 <= score <= 5, "Score must be between 1 and 5", 400)

        # Check if rating is allowed
        rating_check = db.can_rate_asap(asap_id=asap_id, rater_id=auth.aid)

        if not rating_check:
            return {"error": "Assignment not found or not completed"}, 404

        if rating_check['status'] != 'completed':
            return {"error": "Can only rate completed assignments"}, 400

        can_rate_user_id = rating_check.get('can_rate_user_id')

        if not can_rate_user_id:
            return {"error": "You are not authorized to rate this assignment"}, 403

        # Check if this is owner or worker
        is_owner = str(rating_check['owner_id']) == auth.aid
        is_worker = str(rating_check['accepted_user_id']) == auth.aid

        if not is_owner and not is_worker:
            return {"error": "Only the PAPS owner or worker can submit ratings"}, 403

        # The user being rated
        user_to_rate = str(can_rate_user_id)

        # Update the rated user's moving average
        # Note: We don't store individual ratings, just update the aggregate
        db.update_user_rating(user_id=user_to_rate, new_rating=score)

        return fsa.jsonify({
            "message": "Rating submitted successfully",
            "rated_user_id": user_to_rate,
            "score": score
        }), 201

    # GET /asap/<asap_id>/can-rate - check if current user can rate
    @app.get("/asap/<asap_id>/can-rate", authz="AUTH")
    def can_rate(asap_id: str, auth: model.CurrentAuth):
        """Check if the current user can submit a rating for this ASAP."""
        try:
            uuid.UUID(asap_id)
        except ValueError:
            return {"error": "Invalid ASAP ID format"}, 400

        rating_check = db.can_rate_asap(asap_id=asap_id, rater_id=auth.aid)

        if not rating_check:
            return fsa.jsonify({
                "can_rate": False,
                "reason": "Assignment not found or not completed"
            }), 200

        if rating_check['status'] != 'completed':
            return fsa.jsonify({
                "can_rate": False,
                "reason": "Assignment not yet completed"
            }), 200

        can_rate_user_id = rating_check.get('can_rate_user_id')
        if not can_rate_user_id:
            return fsa.jsonify({
                "can_rate": False,
                "reason": "You are not a participant in this assignment"
            }), 200

        return fsa.jsonify({
            "can_rate": True,
            "user_to_rate_id": str(can_rate_user_id),
            "is_owner": str(rating_check['owner_id']) == auth.aid,
            "is_worker": str(rating_check['accepted_user_id']) == auth.aid
        }), 200
