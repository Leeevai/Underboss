#
# Schedule Routes - /paps/<paps_id>/schedules (PAPS schedule management)
#

import uuid
from datetime import datetime
import FlaskSimpleAuth as fsa

def register_routes(app):
    """Register schedule routes with the Flask app."""
    from database import db
    import model

    # ============================================
    # PAPS SCHEDULE MANAGEMENT
    # ============================================

    # GET /paps/<paps_id>/schedules - list all schedules for a PAPS
    @app.get("/paps/<paps_id>/schedules", authz="AUTH")
    def get_paps_schedules(paps_id: str, auth: model.CurrentAuth):
        """Get all schedules for a PAPS posting."""
        try:
            uuid.UUID(paps_id)
        except ValueError:
            return {"error": "Invalid PAPS ID format"}, 400

        # Verify PAPS exists - use admin view to get owner_id
        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAPS not found"}, 404

        # Only PAPS owner or admin can view schedules
        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized to view schedules for this PAPS"}, 403

        schedules = db.get_paps_schedules(paps_id=paps_id)
        return fsa.jsonify(list(schedules))

    # POST /paps/<paps_id>/schedules - create a schedule for a PAPS
    @app.post("/paps/<paps_id>/schedules", authz="AUTH")
    def create_paps_schedule(
        paps_id: str,
        auth: model.CurrentAuth,
        recurrence_rule: str,
        cron_expression: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        next_run_at: str | None = None
    ):
        """
        Create a schedule for a PAPS posting.

        Parameters:
        - recurrence_rule: Rule string (e.g., 'daily', 'weekly', 'monthly', 'custom')
        - cron_expression: Optional cron expression for precise scheduling
        - start_date: When the schedule becomes active (ISO format, defaults to now)
        - end_date: When the schedule expires (ISO format, optional)
        - next_run_at: Next scheduled run time (ISO format, computed if not provided)
        """
        try:
            uuid.UUID(paps_id)
        except ValueError:
            return {"error": "Invalid PAPS ID format"}, 400

        # Verify PAPS exists - use admin view to get owner_id
        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAPS not found"}, 404

        # Only PAPS owner or admin can create schedules
        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized to create schedules for this PAPS"}, 403

        # Validate and normalize recurrence_rule (DB uses uppercase: DAILY, WEEKLY, MONTHLY, YEARLY, CRON)
        valid_rules = ['daily', 'weekly', 'monthly', 'yearly', 'cron']
        rule_upper = recurrence_rule.upper()
        fsa.checkVal(rule_upper in [r.upper() for r in valid_rules],
                     f"Invalid recurrence_rule. Must be one of: {', '.join(valid_rules)}", 400)

        # If CRON rule, cron_expression is required
        if rule_upper == 'CRON':
            fsa.checkVal(cron_expression, "cron_expression is required for CRON recurrence", 400)

        # Parse dates if provided - start_date is required
        parsed_start_date = None
        parsed_end_date = None
        parsed_next_run = None

        if start_date:
            try:
                parsed_start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00')).date()
            except ValueError:
                return {"error": "Invalid start_date format. Use ISO 8601"}, 400
        else:
            # Default to today if not provided
            parsed_start_date = datetime.now().date()

        if end_date:
            try:
                parsed_end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00')).date()
            except ValueError:
                return {"error": "Invalid end_date format. Use ISO 8601"}, 400

        if next_run_at:
            try:
                parsed_next_run = datetime.fromisoformat(next_run_at.replace('Z', '+00:00'))
            except ValueError:
                return {"error": "Invalid next_run_at format. Use ISO 8601"}, 400

        # Validate date logic
        if parsed_start_date and parsed_end_date:
            fsa.checkVal(parsed_end_date >= parsed_start_date, "end_date must be after or equal to start_date", 400)

        schedule_id = db.insert_paps_schedule(
            paps_id=paps_id,
            recurrence_rule=rule_upper,
            cron_expression=cron_expression,
            start_date=parsed_start_date,
            end_date=parsed_end_date,
            next_run_at=parsed_next_run
        )

        return fsa.jsonify({"schedule_id": schedule_id}), 201

    # GET /paps/<paps_id>/schedules/<schedule_id> - get specific schedule
    @app.get("/paps/<paps_id>/schedules/<schedule_id>", authz="AUTH")
    def get_paps_schedule(paps_id: str, schedule_id: str, auth: model.CurrentAuth):
        """Get details of a specific PAPS schedule."""
        try:
            uuid.UUID(paps_id)
            uuid.UUID(schedule_id)
        except ValueError:
            return {"error": "Invalid ID format"}, 400

        # Verify PAPS exists
        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAPS not found"}, 404

        # Only PAPS owner or admin can view schedules
        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized to view this schedule"}, 403

        schedule = db.get_paps_schedule_by_id(schedule_id=schedule_id)
        if not schedule:
            return {"error": "Schedule not found"}, 404

        # Verify schedule belongs to the PAPS
        if str(schedule['paps_id']) != paps_id:
            return {"error": "Schedule does not belong to this PAPS"}, 400

        return fsa.jsonify(dict(schedule))

    # PUT /paps/<paps_id>/schedules/<schedule_id> - update schedule
    @app.put("/paps/<paps_id>/schedules/<schedule_id>", authz="AUTH")
    def update_paps_schedule(
        paps_id: str,
        schedule_id: str,
        auth: model.CurrentAuth,
        recurrence_rule: str | None = None,
        cron_expression: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        next_run_at: str | None = None,
        is_active: bool | None = None
    ):
        """Update an existing PAPS schedule."""
        try:
            uuid.UUID(paps_id)
            uuid.UUID(schedule_id)
        except ValueError:
            return {"error": "Invalid ID format"}, 400

        # Verify PAPS exists
        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAPS not found"}, 404

        # Only PAPS owner or admin can update schedules
        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized to update this schedule"}, 403

        # Verify schedule exists and belongs to PAPS
        schedule = db.get_paps_schedule_by_id(schedule_id=schedule_id)
        if not schedule:
            return {"error": "Schedule not found"}, 404

        if str(schedule['paps_id']) != paps_id:
            return {"error": "Schedule does not belong to this PAPS"}, 400

        # Use existing values for fields not provided
        # Normalize recurrence_rule to uppercase for DB
        if recurrence_rule is not None:
            final_recurrence_rule = recurrence_rule.upper()
        else:
            final_recurrence_rule = schedule['recurrence_rule']
        final_cron_expression = cron_expression if cron_expression is not None else schedule['cron_expression']
        final_is_active = is_active if is_active is not None else schedule['is_active']

        # Validate recurrence_rule (DB uses uppercase: DAILY, WEEKLY, MONTHLY, YEARLY, CRON)
        valid_rules = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CRON']
        fsa.checkVal(final_recurrence_rule in valid_rules,
                     f"Invalid recurrence_rule. Must be one of: {', '.join([r.lower() for r in valid_rules])}", 400)

        # If CRON rule, cron_expression is required
        if final_recurrence_rule == 'CRON':
            fsa.checkVal(final_cron_expression, "cron_expression is required for CRON recurrence", 400)

        # Parse dates if provided
        parsed_start_date = schedule['start_date']
        parsed_end_date = schedule['end_date']
        parsed_next_run = schedule['next_run_at']

        if start_date:
            try:
                parsed_start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00')).date()
            except ValueError:
                return {"error": "Invalid start_date format. Use ISO 8601"}, 400

        if end_date:
            try:
                parsed_end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00')).date()
            except ValueError:
                return {"error": "Invalid end_date format. Use ISO 8601"}, 400

        if next_run_at:
            try:
                parsed_next_run = datetime.fromisoformat(next_run_at.replace('Z', '+00:00'))
            except ValueError:
                return {"error": "Invalid next_run_at format. Use ISO 8601"}, 400

        # Validate date logic
        if parsed_start_date and parsed_end_date:
            fsa.checkVal(parsed_end_date >= parsed_start_date, "end_date must be after or equal to start_date", 400)

        db.update_paps_schedule(
            schedule_id=schedule_id,
            recurrence_rule=final_recurrence_rule,
            cron_expression=final_cron_expression,
            start_date=parsed_start_date,
            end_date=parsed_end_date,
            next_run_at=parsed_next_run,
            is_active=final_is_active
        )

        return "", 204

    # DELETE /paps/<paps_id>/schedules/<schedule_id> - delete schedule
    @app.delete("/paps/<paps_id>/schedules/<schedule_id>", authz="AUTH")
    def delete_paps_schedule(paps_id: str, schedule_id: str, auth: model.CurrentAuth):
        """Delete a PAPS schedule."""
        try:
            uuid.UUID(paps_id)
            uuid.UUID(schedule_id)
        except ValueError:
            return {"error": "Invalid ID format"}, 400

        # Verify PAPS exists
        paps = db.get_paps_by_id_admin(id=paps_id)
        if not paps:
            return {"error": "PAPS not found"}, 404

        # Only PAPS owner or admin can delete schedules
        if not auth.is_admin and str(paps['owner_id']) != auth.aid:
            return {"error": "Not authorized to delete this schedule"}, 403

        # Verify schedule exists and belongs to PAPS
        schedule = db.get_paps_schedule_by_id(schedule_id=schedule_id)
        if not schedule:
            return {"error": "Schedule not found"}, 404

        if str(schedule['paps_id']) != paps_id:
            return {"error": "Schedule does not belong to this PAPS"}, 400

        db.delete_paps_schedule(schedule_id=schedule_id)

        return "", 204
