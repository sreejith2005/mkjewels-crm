-- Phase 4: traceable, branch-owned not-bought follow-ups.
-- This is intentionally forward-only; Phases 0-3 migrations remain immutable.
ALTER TABLE "public"."not_bought_followups"
  ADD COLUMN "branch_id" uuid,
  ADD COLUMN "source_timeline_id" uuid,
  ADD COLUMN "source_visit_form_id" uuid;

ALTER TABLE "public"."not_bought_history"
  ADD COLUMN "previous_status" varchar(80),
  ADD COLUMN "call_response" varchar(40),
  ADD COLUMN "updated_by" uuid;

ALTER TABLE "public"."not_bought_followups"
  ADD CONSTRAINT "not_bought_followups_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "not_bought_followups_source_timeline_id_fkey" FOREIGN KEY ("source_timeline_id") REFERENCES "public"."client_timeline"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "not_bought_followups_source_visit_form_id_fkey" FOREIGN KEY ("source_visit_form_id") REFERENCES "public"."visit_forms"("id") ON DELETE SET NULL;
ALTER TABLE "public"."not_bought_history"
  ADD CONSTRAINT "not_bought_history_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;

CREATE INDEX "not_bought_followups_branch_status_date_idx" ON "public"."not_bought_followups" ("branch_id", "status", "next_followup_date");
CREATE INDEX "not_bought_followups_source_timeline_id_idx" ON "public"."not_bought_followups" ("source_timeline_id");
CREATE INDEX "not_bought_followups_source_visit_form_id_idx" ON "public"."not_bought_followups" ("source_visit_form_id");
CREATE INDEX "not_bought_history_updated_by_idx" ON "public"."not_bought_history" ("updated_by");

-- The original policies used entered_by, which is not the ownership boundary.
DROP POLICY IF EXISTS "branch_staff_write_own_followups" ON "public"."not_bought_followups";
DROP POLICY IF EXISTS "branch_staff_write_own_followup_history" ON "public"."not_bought_history";

CREATE POLICY "branch_staff_insert_origin_followups" ON "public"."not_bought_followups"
FOR INSERT TO authenticated WITH CHECK ("public"."is_branch_staff"("branch_id"));
CREATE POLICY "branch_staff_update_origin_followups" ON "public"."not_bought_followups"
FOR UPDATE TO authenticated
USING ("public"."is_branch_staff"("branch_id"))
WITH CHECK ("public"."is_branch_staff"("branch_id"));
CREATE POLICY "branch_staff_delete_origin_followups" ON "public"."not_bought_followups"
FOR DELETE TO authenticated USING ("public"."is_branch_staff"("branch_id"));
CREATE POLICY "branch_staff_insert_origin_followup_history" ON "public"."not_bought_history"
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM "public"."not_bought_followups" AS followup
          WHERE followup."id" = "not_bought_history"."followup_id"
            AND "public"."is_branch_staff"(followup."branch_id"))
);

CREATE OR REPLACE FUNCTION "public"."create_not_bought_followup_from_visit_form"()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE source_visit record;
BEGIN
  IF NEW."did_buy" IS DISTINCT FROM false THEN RETURN NEW; END IF;
  SELECT timeline."client_id", timeline."branch_id", timeline."id" AS timeline_id,
         timeline."event_date", timeline."reference_number", timeline."salesperson_id"
  INTO source_visit
  FROM "public"."client_timeline" AS timeline WHERE timeline."id" = NEW."client_timeline_id";
  IF source_visit."client_id" IS NULL THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM "public"."not_bought_followups" AS existing
             WHERE existing."client_id" = source_visit."client_id"
               AND existing."status" NOT IN ('closed', 'converted')) THEN RETURN NEW; END IF;
  INSERT INTO "public"."not_bought_followups" (
    "client_id", "reference_number", "status", "next_followup_date", "remark", "entered_by",
    "branch_id", "source_timeline_id", "source_visit_form_id"
  ) VALUES (
    source_visit."client_id", source_visit."reference_number", 'pending',
    source_visit."event_date"::date + 3,
    NULLIF(concat_ws('; ', array_to_string(NEW."not_bought_reasons", ', '), NEW."not_bought_other"), ''),
    source_visit."salesperson_id", source_visit."branch_id", source_visit."timeline_id", NEW."id"
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER "visit_forms_create_not_bought_followup"
AFTER INSERT ON "public"."visit_forms"
FOR EACH ROW EXECUTE FUNCTION "public"."create_not_bought_followup_from_visit_form"();

CREATE OR REPLACE FUNCTION "public"."record_not_bought_followup_update"()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW."status" IS NOT DISTINCT FROM OLD."status"
     AND NEW."call_response" IS NOT DISTINCT FROM OLD."call_response"
     AND NEW."remark" IS NOT DISTINCT FROM OLD."remark"
     AND NEW."next_followup_date" IS NOT DISTINCT FROM OLD."next_followup_date" THEN RETURN NEW; END IF;
  INSERT INTO "public"."not_bought_history" ("followup_id", "status", "previous_status", "remark", "call_response", "updated_by")
  VALUES (NEW."id", NEW."status", OLD."status", NEW."remark", NEW."call_response", "auth"."uid"());
  RETURN NEW;
END; $$;

CREATE TRIGGER "not_bought_followups_record_update"
AFTER UPDATE OF "status", "call_response", "remark", "next_followup_date" ON "public"."not_bought_followups"
FOR EACH ROW EXECUTE FUNCTION "public"."record_not_bought_followup_update"();

CREATE OR REPLACE FUNCTION "public"."update_not_bought_followup"(
  p_followup_id uuid, p_call_response text, p_remark text DEFAULT NULL, p_next_followup_date date DEFAULT NULL
) RETURNS "public"."not_bought_followups"
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor_role "public"."user_role"; target "public"."not_bought_followups"; target_status varchar(80);
BEGIN
  actor_role := "public"."current_user_role"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  SELECT * INTO target FROM "public"."not_bought_followups" WHERE "id" = p_followup_id FOR UPDATE;
  IF target."id" IS NULL THEN RAISE EXCEPTION 'follow-up not found' USING ERRCODE = 'no_data_found'; END IF;
  IF NOT "public"."is_super_admin"() AND NOT "public"."is_branch_staff"(target."branch_id") THEN RAISE EXCEPTION 'you may only update follow-ups from your own branch' USING ERRCODE = 'insufficient_privilege'; END IF;
  p_call_response := lower(trim(COALESCE(p_call_response, '')));
  IF p_call_response NOT IN ('interested', 'not_interested', 'no_response', 'converted', 'reschedule') THEN RAISE EXCEPTION 'invalid call response' USING ERRCODE = 'check_violation'; END IF;
  IF p_call_response = 'reschedule' AND p_next_followup_date IS NULL THEN RAISE EXCEPTION 'a reschedule date is required' USING ERRCODE = 'check_violation'; END IF;
  target_status := CASE p_call_response WHEN 'not_interested' THEN 'closed' WHEN 'converted' THEN 'converted' ELSE 'pending' END;
  UPDATE "public"."not_bought_followups"
  SET "status" = target_status, "call_response" = p_call_response,
      "remark" = NULLIF(trim(p_remark), ''),
      "next_followup_date" = CASE WHEN p_call_response = 'reschedule' THEN p_next_followup_date ELSE "next_followup_date" END
  WHERE "id" = p_followup_id RETURNING * INTO target;
  RETURN target;
END; $$;

REVOKE ALL ON FUNCTION "public"."update_not_bought_followup"(uuid, text, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."update_not_bought_followup"(uuid, text, text, date) TO authenticated;
