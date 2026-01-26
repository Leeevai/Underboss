#
# COMMENT Routes - /paps/<paps_id>/comments (Instagram-style comments)
#
# Instagram-style means:
# - Flat structure with only single-level replies
# - Top-level comments on a PAPS
# - Replies to comments (but replies cannot have further replies)
#

import uuid
import FlaskSimpleAuth as fsa


def register_routes(app):
    """Register Comment routes with the Flask app."""
    from database import db
    import model

    # ============================================
    # COMMENT MANAGEMENT
    # ============================================

    # GET /paps/<paps_id>/comments - list all top-level comments for a paps
    @app.get("/paps/<paps_id>/comments", authz="AUTH")
    def get_paps_comments(paps_id: str, auth: model.CurrentAuth):
        """Get all top-level comments for a PAPS with author info and reply count."""
        try:
            uuid.UUID(paps_id)
        except ValueError:
            return {"error": "Invalid PAPS ID format"}, 400

        # Check paps exists
        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAPS not found"}, 404

        comments = list(db.get_paps_comments(paps_id=paps_id))
        total_count = db.get_paps_comment_count(paps_id=paps_id)

        return fsa.jsonify({
            "paps_id": paps_id,
            "comments": comments,
            "count": len(comments),
            "total_count": total_count  # Includes replies
        }), 200

    # POST /paps/<paps_id>/comments - create a new top-level comment
    @app.post("/paps/<paps_id>/comments", authz="AUTH")
    def post_paps_comment(paps_id: str, auth: model.CurrentAuth, content: str):
        """Create a new top-level comment on a PAPS."""
        try:
            uuid.UUID(paps_id)
        except ValueError:
            return {"error": "Invalid PAPS ID format"}, 400

        # Validate content
        fsa.checkVal(len(content.strip()) >= 1, "Comment cannot be empty", 400)
        fsa.checkVal(len(content.strip()) <= 2000, "Comment too long (max 2000 characters)", 400)

        # Check paps exists and is accessible
        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAPS not found"}, 404

        # Check if paps is deleted
        if paps.get('deleted_at'):
            return {"error": "Cannot comment on deleted PAPS"}, 400

        # Create comment
        comment_id = db.insert_comment(
            paps_id=paps_id,
            user_id=auth.aid,
            content=content.strip(),
            parent_id=None
        )

        return fsa.jsonify({"comment_id": comment_id}), 201

    # GET /comments/<comment_id> - get a specific comment
    @app.get("/comments/<comment_id>", authz="AUTH")
    def get_comment(comment_id: str, auth: model.CurrentAuth):
        """Get a specific comment by ID."""
        try:
            uuid.UUID(comment_id)
        except ValueError:
            return {"error": "Invalid comment ID format"}, 400

        comment = db.get_comment_by_id(comment_id=comment_id)
        if not comment:
            return {"error": "Comment not found"}, 404

        # Check if soft deleted
        if comment.get('deleted_at'):
            return {"error": "Comment has been deleted"}, 404

        return fsa.jsonify(comment), 200

    # PUT /comments/<comment_id> - edit a comment
    @app.put("/comments/<comment_id>", authz="AUTH")
    def put_comment(comment_id: str, auth: model.CurrentAuth, content: str):
        """Edit a comment. Only the author can edit."""
        try:
            uuid.UUID(comment_id)
        except ValueError:
            return {"error": "Invalid comment ID format"}, 400

        # Validate content
        fsa.checkVal(len(content.strip()) >= 1, "Comment cannot be empty", 400)
        fsa.checkVal(len(content.strip()) <= 2000, "Comment too long (max 2000 characters)", 400)

        comment = db.get_comment_by_id(comment_id=comment_id)
        if not comment:
            return {"error": "Comment not found"}, 404

        # Check if soft deleted
        if comment.get('deleted_at'):
            return {"error": "Comment has been deleted"}, 404

        # Only author can edit (or admin)
        if not auth.is_admin and comment['user_id'] != auth.aid:
            return {"error": "Not authorized to edit this comment"}, 403

        db.update_comment(comment_id=comment_id, content=content.strip())
        return "", 204

    # DELETE /comments/<comment_id> - delete a comment
    @app.delete("/comments/<comment_id>", authz="AUTH")
    def delete_comment(comment_id: str, auth: model.CurrentAuth):
        """Soft delete a comment. Author, PAPS owner, or admin can delete."""
        try:
            uuid.UUID(comment_id)
        except ValueError:
            return {"error": "Invalid comment ID format"}, 400

        comment = db.get_comment_by_id(comment_id=comment_id)
        if not comment:
            return {"error": "Comment not found"}, 404

        # Check if already deleted
        if comment.get('deleted_at'):
            return {"error": "Comment already deleted"}, 404

        # Get paps to check ownership
        paps = db.get_paps_by_id_admin(id=comment['paps_id'])

        # Check authorization: author, paps owner, or admin
        is_author = comment['user_id'] == auth.aid
        is_paps_owner = paps and str(paps['owner_id']) == auth.aid
        if not auth.is_admin and not is_author and not is_paps_owner:
            return {"error": "Not authorized to delete this comment"}, 403

        # Soft delete replies if this is a parent comment
        if not comment.get('parent_id'):
            db.delete_comment_replies(parent_id=comment_id)

        db.delete_comment(comment_id=comment_id)
        return "", 204

    # ============================================
    # COMMENT REPLIES (Single-level only)
    # ============================================

    # GET /comments/<comment_id>/replies - get replies to a comment
    @app.get("/comments/<comment_id>/replies", authz="AUTH")
    def get_comment_replies(comment_id: str, auth: model.CurrentAuth):
        """Get all replies to a comment."""
        try:
            uuid.UUID(comment_id)
        except ValueError:
            return {"error": "Invalid comment ID format"}, 400

        # Check parent comment exists
        parent = db.get_comment_by_id(comment_id=comment_id)
        if not parent:
            return {"error": "Comment not found"}, 404

        if parent.get('deleted_at'):
            return {"error": "Comment has been deleted"}, 404

        # Instagram-style: cannot get replies of a reply
        if parent.get('parent_id'):
            return {"error": "Cannot get replies of a reply"}, 400

        replies = list(db.get_comment_replies(comment_id=comment_id))

        return fsa.jsonify({
            "parent_comment_id": comment_id,
            "replies": replies,
            "count": len(replies)
        }), 200

    # POST /comments/<comment_id>/replies - reply to a comment
    @app.post("/comments/<comment_id>/replies", authz="AUTH")
    def post_comment_reply(comment_id: str, auth: model.CurrentAuth, content: str):
        """Reply to a comment. Instagram-style: only top-level comments can have replies."""
        try:
            uuid.UUID(comment_id)
        except ValueError:
            return {"error": "Invalid comment ID format"}, 400

        # Validate content
        fsa.checkVal(len(content.strip()) >= 1, "Reply cannot be empty", 400)
        fsa.checkVal(len(content.strip()) <= 2000, "Reply too long (max 2000 characters)", 400)

        # Check parent comment exists
        parent = db.get_comment_by_id(comment_id=comment_id)
        if not parent:
            return {"error": "Comment not found"}, 404

        if parent.get('deleted_at'):
            return {"error": "Cannot reply to a deleted comment"}, 400

        # Instagram-style: only top-level comments can have replies
        # Replies cannot have further replies (max depth = 1)
        if parent.get('parent_id'):
            return {"error": "Cannot reply to a reply. Only top-level comments accept replies."}, 400

        # Check paps is not deleted
        paps = db.get_paps_by_id_admin(id=parent['paps_id'])
        if not paps or paps.get('deleted_at'):
            return {"error": "Cannot reply - PAPS has been deleted"}, 400

        # Create reply
        reply_id = db.insert_comment(
            paps_id=parent['paps_id'],
            user_id=auth.aid,
            content=content.strip(),
            parent_id=comment_id
        )

        return fsa.jsonify({"comment_id": reply_id}), 201

    # ============================================
    # CONVENIENCE: GET COMMENT WITH REPLIES
    # ============================================

    # GET /comments/<comment_id>/thread - get comment with all its replies
    @app.get("/comments/<comment_id>/thread", authz="AUTH")
    def get_comment_thread(comment_id: str, auth: model.CurrentAuth):
        """Get a comment and all its replies in one call."""
        try:
            uuid.UUID(comment_id)
        except ValueError:
            return {"error": "Invalid comment ID format"}, 400

        comment = db.get_comment_by_id(comment_id=comment_id)
        if not comment:
            return {"error": "Comment not found"}, 404

        if comment.get('deleted_at'):
            return {"error": "Comment has been deleted"}, 404

        # If this is a reply, return just the reply
        if comment.get('parent_id'):
            return fsa.jsonify({
                "comment": comment,
                "replies": [],
                "is_reply": True
            }), 200

        # Get replies
        replies = list(db.get_comment_replies(comment_id=comment_id))

        return fsa.jsonify({
            "comment": comment,
            "replies": replies,
            "is_reply": False
        }), 200
