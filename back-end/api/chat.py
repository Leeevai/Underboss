#
# Chat Routes - /chat (chat threads and messages)
#

import uuid
import FlaskSimpleAuth as fsa


def register_routes(app):
    """Register Chat routes with the Flask app."""
    from database import db
    import model

    # ============================================
    # CHAT THREAD MANAGEMENT
    # ============================================

    # GET /chat - list all chat threads for current user
    @app.get("/chat", authz="AUTH")
    def get_my_chat_threads(auth: model.CurrentAuth):
        """Get all chat threads where the current user is a participant."""
        threads = list(db.get_chat_threads_for_user(user_id=auth.aid))
        return fsa.jsonify({"threads": threads, "count": len(threads)}), 200

    # GET /chat/<thread_id> - get chat thread details
    @app.get("/chat/<thread_id>", authz="AUTH")
    def get_chat_thread(thread_id: str, auth: model.CurrentAuth):
        """Get chat thread details. Only participants can view."""
        try:
            uuid.UUID(thread_id)
        except ValueError:
            return {"error": "Invalid thread ID format"}, 400

        thread = db.get_chat_thread_by_id(thread_id=thread_id)
        if not thread:
            return {"error": "Chat thread not found"}, 404

        # Check if user is a participant
        participant = db.is_user_participant(thread_id=thread_id, user_id=auth.aid)
        if not participant and not auth.is_admin:
            return {"error": "Not authorized to view this chat"}, 403

        # If participant has left, deny access
        if participant and participant.get('left_at'):
            return {"error": "You have left this chat thread"}, 403

        # Get participants
        participants = list(db.get_chat_participants(thread_id=thread_id))
        thread['participants'] = participants

        return fsa.jsonify(thread), 200

    # GET /chat/<thread_id>/messages - get messages in a thread
    @app.get("/chat/<thread_id>/messages", authz="AUTH")
    def get_chat_messages(
        thread_id: str,
        auth: model.CurrentAuth,
        limit: int = 50,
        offset: int = 0
    ):
        """Get messages in a chat thread. Only participants can view."""
        try:
            uuid.UUID(thread_id)
        except ValueError:
            return {"error": "Invalid thread ID format"}, 400

        fsa.checkVal(1 <= limit <= 100, "Limit must be between 1 and 100", 400)
        fsa.checkVal(offset >= 0, "Offset must be non-negative", 400)

        thread = db.get_chat_thread_by_id(thread_id=thread_id)
        if not thread:
            return {"error": "Chat thread not found"}, 404

        # Check if user is a participant
        participant = db.is_user_participant(thread_id=thread_id, user_id=auth.aid)
        if not participant and not auth.is_admin:
            return {"error": "Not authorized to view this chat"}, 403

        if participant and participant.get('left_at'):
            return {"error": "You have left this chat thread"}, 403

        messages = list(db.get_chat_messages(
            thread_id=thread_id,
            limit_count=limit,
            offset_count=offset
        ))

        # Mark messages as read for this user
        db.mark_thread_messages_read(thread_id=thread_id, user_id=auth.aid)

        return fsa.jsonify({
            "thread_id": thread_id,
            "messages": messages,
            "count": len(messages),
            "limit": limit,
            "offset": offset
        }), 200

    # POST /chat/<thread_id>/messages - send a message
    @app.post("/chat/<thread_id>/messages", authz="AUTH")
    def post_chat_message(
        thread_id: str,
        auth: model.CurrentAuth,
        content: str,
        message_type: str = "text",
        attachment_url: str | None = None
    ):
        """Send a message in a chat thread. Only participants can send."""
        try:
            uuid.UUID(thread_id)
        except ValueError:
            return {"error": "Invalid thread ID format"}, 400

        fsa.checkVal(len(content.strip()) >= 1, "Message content cannot be empty", 400)
        fsa.checkVal(len(content) <= 5000, "Message content too long (max 5000 chars)", 400)
        fsa.checkVal(message_type in ('text', 'image', 'video', 'document', 'system'),
                     "Invalid message type", 400)

        thread = db.get_chat_thread_by_id(thread_id=thread_id)
        if not thread:
            return {"error": "Chat thread not found"}, 404

        # Check if user is a participant
        participant = db.is_user_participant(thread_id=thread_id, user_id=auth.aid)
        if not participant:
            return {"error": "Not authorized to send messages in this chat"}, 403

        if participant.get('left_at'):
            return {"error": "You have left this chat thread"}, 403

        # Only admins can send system messages
        if message_type == 'system' and not auth.is_admin:
            return {"error": "Only system can send system messages"}, 403

        message_id = db.insert_chat_message(
            thread_id=thread_id,
            sender_id=auth.aid,
            content=content.strip(),
            message_type=message_type,
            attachment_url=attachment_url
        )

        return fsa.jsonify({"message_id": message_id}), 201

    # PUT /chat/<thread_id>/messages/<message_id> - edit a message
    @app.put("/chat/<thread_id>/messages/<message_id>", authz="AUTH")
    def edit_message(thread_id: str, message_id: str, auth: model.CurrentAuth, content: str):
        """Edit a chat message. Only the sender can edit their own messages."""
        try:
            uuid.UUID(thread_id)
            uuid.UUID(message_id)
        except ValueError:
            return {"error": "Invalid ID format"}, 400

        fsa.checkVal(len(content.strip()) >= 1, "Message content cannot be empty", 400)
        fsa.checkVal(len(content) <= 5000, "Message content too long (max 5000 chars)", 400)

        # Get the message to check ownership
        message = db.get_chat_message_by_id(message_id=message_id)
        if not message:
            return {"error": "Message not found"}, 404

        # Verify the message belongs to this thread
        if message['thread_id'] != thread_id:
            return {"error": "Message does not belong to this thread"}, 400

        # Only the sender can edit (or admin)
        if not auth.is_admin and message['sender_id'] != auth.aid:
            return {"error": "Only the message sender can edit this message"}, 403

        # System messages cannot be edited
        if message.get('message_type') == 'system':
            return {"error": "System messages cannot be edited"}, 400

        db.update_chat_message(message_id=message_id, content=content.strip())

        return "", 204

    # PUT /chat/<thread_id>/messages/<message_id>/read - mark message as read
    @app.put("/chat/<thread_id>/messages/<message_id>/read", authz="AUTH")
    def mark_message_read(thread_id: str, message_id: str, auth: model.CurrentAuth):
        """Mark a specific message as read."""
        try:
            uuid.UUID(thread_id)
            uuid.UUID(message_id)
        except ValueError:
            return {"error": "Invalid ID format"}, 400

        # Check if user is a participant
        participant = db.is_user_participant(thread_id=thread_id, user_id=auth.aid)
        if not participant:
            return {"error": "Not authorized"}, 403

        db.mark_message_read(message_id=message_id)
        return "", 204

    # PUT /chat/<thread_id>/read - mark all messages as read
    @app.put("/chat/<thread_id>/read", authz="AUTH")
    def mark_thread_read(thread_id: str, auth: model.CurrentAuth):
        """Mark all messages in a thread as read for the current user."""
        try:
            uuid.UUID(thread_id)
        except ValueError:
            return {"error": "Invalid thread ID format"}, 400

        # Check if user is a participant
        participant = db.is_user_participant(thread_id=thread_id, user_id=auth.aid)
        if not participant:
            return {"error": "Not authorized"}, 403

        db.mark_thread_messages_read(thread_id=thread_id, user_id=auth.aid)
        return "", 204

    # GET /chat/<thread_id>/participants - get participants
    @app.get("/chat/<thread_id>/participants", authz="AUTH")
    def get_chat_participants(thread_id: str, auth: model.CurrentAuth):
        """Get all participants in a chat thread."""
        try:
            uuid.UUID(thread_id)
        except ValueError:
            return {"error": "Invalid thread ID format"}, 400

        # Check if user is a participant
        participant = db.is_user_participant(thread_id=thread_id, user_id=auth.aid)
        if not participant and not auth.is_admin:
            return {"error": "Not authorized"}, 403

        participants = list(db.get_chat_participants(thread_id=thread_id))
        return fsa.jsonify({"thread_id": thread_id, "participants": participants}), 200

    # DELETE /chat/<thread_id>/leave - leave a chat thread
    @app.delete("/chat/<thread_id>/leave", authz="AUTH")
    def leave_chat_thread(thread_id: str, auth: model.CurrentAuth):
        """Leave a chat thread. User will no longer receive messages."""
        try:
            uuid.UUID(thread_id)
        except ValueError:
            return {"error": "Invalid thread ID format"}, 400

        # Check if user is a participant
        participant = db.is_user_participant(thread_id=thread_id, user_id=auth.aid)
        if not participant:
            return {"error": "You are not a participant in this chat"}, 404

        if participant.get('left_at'):
            return {"error": "You have already left this chat thread"}, 400

        db.leave_chat_thread(thread_id=thread_id, user_id=auth.aid)
        return "", 204

    # GET /chat/<thread_id>/unread - get unread count
    @app.get("/chat/<thread_id>/unread", authz="AUTH")
    def get_unread_count(thread_id: str, auth: model.CurrentAuth):
        """Get unread message count for a chat thread."""
        try:
            uuid.UUID(thread_id)
        except ValueError:
            return {"error": "Invalid thread ID format"}, 400

        # Check if user is a participant
        participant = db.is_user_participant(thread_id=thread_id, user_id=auth.aid)
        if not participant:
            return {"error": "Not authorized"}, 403

        count = db.get_unread_count(thread_id=thread_id, user_id=auth.aid)
        return fsa.jsonify({"thread_id": thread_id, "unread_count": count}), 200

    # ============================================
    # CHAT THREAD LOOKUP BY CONTEXT
    # ============================================

    # GET /spap/<spap_id>/chat - get chat thread for a SPAP
    @app.get("/spap/<spap_id>/chat", authz="AUTH")
    def get_spap_chat(spap_id: str, auth: model.CurrentAuth):
        """Get the chat thread associated with a SPAP application."""
        try:
            uuid.UUID(spap_id)
        except ValueError:
            return {"error": "Invalid SPAP ID format"}, 400

        spap = db.get_spap_by_id(spap_id=spap_id)
        if not spap:
            return {"error": "Application not found"}, 404

        # Check authorization
        paps = db.get_paps_by_id_admin(id=spap['paps_id'])
        is_applicant = str(spap['applicant_id']) == auth.aid
        is_owner = paps and str(paps['owner_id']) == auth.aid
        if not auth.is_admin and not is_applicant and not is_owner:
            return {"error": "Not authorized"}, 403

        thread = db.get_chat_thread_by_spap(spap_id=spap_id)
        if not thread:  # pragma: no cover - requires DB inconsistency
            return {"error": "No chat thread found for this application"}, 404

        return fsa.jsonify(thread), 200

    # GET /asap/<asap_id>/chat - get chat thread for an ASAP
    @app.get("/asap/<asap_id>/chat", authz="AUTH")
    def get_asap_chat(asap_id: str, auth: model.CurrentAuth):
        """Get the chat thread associated with an ASAP assignment."""
        try:
            uuid.UUID(asap_id)
        except ValueError:
            return {"error": "Invalid ASAP ID format"}, 400

        asap = db.get_asap_by_id(asap_id=asap_id)
        if not asap:
            return {"error": "Assignment not found"}, 404

        # Check authorization
        is_worker = str(asap['accepted_user_id']) == auth.aid
        is_owner = str(asap['owner_id']) == auth.aid
        if not auth.is_admin and not is_worker and not is_owner:
            return {"error": "Not authorized"}, 403

        thread = db.get_chat_thread_by_asap(asap_id=asap_id)
        if not thread:  # pragma: no cover - requires DB inconsistency
            return {"error": "No chat thread found for this assignment"}, 404

        return fsa.jsonify(thread), 200

    # GET /paps/<paps_id>/chats - get all chat threads for a PAPS (owner/admin only)
    @app.get("/paps/<paps_id>/chats", authz="AUTH")
    def get_paps_chats(paps_id: str, auth: model.CurrentAuth):
        """Get all chat threads for a PAPS. Only owner or admin can view."""
        try:
            uuid.UUID(paps_id)
        except ValueError:
            return {"error": "Invalid PAPS ID format"}, 400

        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAPS not found"}, 404

        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized"}, 403

        threads = list(db.get_chat_threads_for_paps(paps_id=paps_id))
        return fsa.jsonify({"threads": threads, "count": len(threads)}), 200
