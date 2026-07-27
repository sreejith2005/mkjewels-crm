-- Forward-only legacy Not Bought Follow-Up parity: display action point, idempotent sync, and one save contract.
ALTER TABLE "public"."not_bought_followups" ADD COLUMN "action_point" text;

CREATE OR REPLACE FUNCTION "public"."save_not_bought_followup"(
  p_followup_id uuid,
  p_followup_status text,
  p_call_response text,
  p_next_followup_date date DEFAULT NULL,
  p_remark text DEFAULT NULL
) RETURNS "public"."not_bought_followups"
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor_role "public"."user_role"; target "public"."not_bought_followups"; normalized_status text;
BEGIN
  actor_role := "public"."current_user_role"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  SELECT * INTO target FROM "public"."not_bought_followups" WHERE id = p_followup_id FOR UPDATE;
  IF target.id IS NULL THEN RAISE EXCEPTION 'follow-up not found' USING ERRCODE = 'no_data_found'; END IF;
  IF NOT "public"."is_super_admin"() AND NOT "public"."is_branch_staff"(target.branch_id) THEN RAISE EXCEPTION 'you may only update follow-ups from your own branch' USING ERRCODE = 'insufficient_privilege'; END IF;
  normalized_status := upper(btrim(COALESCE(p_followup_status, '')));
  IF normalized_status NOT IN ('PENDING', 'IN PROCESS', 'FOLLOW UP DONE') THEN RAISE EXCEPTION 'invalid follow-up status' USING ERRCODE = 'check_violation'; END IF;
  IF upper(btrim(COALESCE(p_call_response, ''))) NOT IN ('CONNECTED', 'NOT PICKED', 'SWITCHED OFF', 'WHATSAPP ONLY', 'WRONG NUMBER') THEN RAISE EXCEPTION 'invalid call response' USING ERRCODE = 'check_violation'; END IF;
  IF normalized_status <> 'FOLLOW UP DONE' AND NULLIF(btrim(COALESCE(p_remark, '')), '') IS NULL THEN RAISE EXCEPTION 'follow-up remark is required unless done' USING ERRCODE = 'check_violation'; END IF;
  UPDATE "public"."not_bought_followups"
  SET status = normalized_status, call_response = upper(btrim(p_call_response)), remark = NULLIF(btrim(p_remark), ''), next_followup_date = CASE WHEN normalized_status = 'FOLLOW UP DONE' THEN NULL ELSE p_next_followup_date END
  WHERE id = p_followup_id RETURNING * INTO target;
  RETURN target;
END; $$;
REVOKE ALL ON FUNCTION "public"."save_not_bought_followup"(uuid,text,text,date,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."save_not_bought_followup"(uuid,text,text,date,text) TO authenticated;

CREATE OR REPLACE FUNCTION "public"."sync_not_bought_followups"()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor_role "public"."user_role"; inserted_count integer;
BEGIN
  actor_role := "public"."current_user_role"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  WITH eligible AS (
    SELECT timeline.id AS timeline_id, timeline.client_id, timeline.reference_number, timeline.branch_id, timeline.event_date,
      NULLIF(concat_ws('; ', array_to_string(form.not_bought_reasons, ', '), form.not_bought_other), '') AS initial_remark
    FROM "public"."visit_forms" form
    JOIN "public"."client_timeline" timeline ON timeline.id = form.client_timeline_id
    WHERE form.did_buy = false
       OR (timeline.buy_status IN ('REPAIR_PLACED', 'REPAIR_PICKUP', 'ORDER_PLACED', 'ORDER_PICKUP')
           AND upper(COALESCE(form.repair_or_order_approach, '')) = 'YES'
           AND cardinality(timeline.seen_categories) > 0)
  ), inserted AS (
    INSERT INTO "public"."not_bought_followups" (client_id, reference_number, status, next_followup_date, remark, entered_by, branch_id, source_timeline_id, source_visit_form_id)
    SELECT eligible.client_id, eligible.reference_number, 'PENDING', eligible.event_date::date + 3, eligible.initial_remark, auth.uid(), eligible.branch_id, eligible.timeline_id, form.id
    FROM eligible JOIN "public"."visit_forms" form ON form.client_timeline_id = eligible.timeline_id
    WHERE NOT EXISTS (SELECT 1 FROM "public"."not_bought_followups" current WHERE current.source_timeline_id = eligible.timeline_id)
      AND ("public"."is_super_admin"() OR "public"."is_branch_staff"(eligible.branch_id))
    RETURNING id
  ) SELECT count(*)::integer INTO inserted_count FROM inserted;
  RETURN inserted_count;
END; $$;
REVOKE ALL ON FUNCTION "public"."sync_not_bought_followups"() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."sync_not_bought_followups"() TO authenticated;
