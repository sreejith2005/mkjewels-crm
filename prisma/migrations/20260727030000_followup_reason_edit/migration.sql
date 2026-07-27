-- Forward-only: allow the origin-branch owner to correct the source visit's not-bought reason.
CREATE OR REPLACE FUNCTION "public"."update_not_bought_reason"(p_followup_id uuid, p_reasons text[], p_other text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE target "public"."not_bought_followups";
BEGIN
  SELECT * INTO target FROM "public"."not_bought_followups" WHERE "id" = p_followup_id FOR UPDATE;
  IF target."id" IS NULL THEN RAISE EXCEPTION 'follow-up not found' USING ERRCODE = 'no_data_found'; END IF;
  IF NOT "public"."is_super_admin"() AND NOT "public"."is_branch_staff"(target."branch_id") THEN RAISE EXCEPTION 'you may only update follow-ups from your own branch' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF target."source_visit_form_id" IS NULL THEN RAISE EXCEPTION 'follow-up has no source visit form' USING ERRCODE = 'check_violation'; END IF;
  UPDATE "public"."visit_forms" SET "not_bought_reasons" = COALESCE(p_reasons, ARRAY[]::text[]), "not_bought_other" = NULLIF(btrim(p_other), '') WHERE "id" = target."source_visit_form_id";
END; $$;
REVOKE ALL ON FUNCTION "public"."update_not_bought_reason"(uuid, text[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."update_not_bought_reason"(uuid, text[], text) TO authenticated;
