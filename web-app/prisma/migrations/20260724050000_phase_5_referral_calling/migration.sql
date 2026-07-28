-- Phase 5: branch-owned referral calling pipeline. This migration is forward-only.
ALTER TABLE "public"."referrals"
  ADD COLUMN "branch_id" uuid,
  ADD COLUMN "source_timeline_id" uuid,
  ADD COLUMN "source_visit_form_id" uuid;

ALTER TABLE "public"."referral_calling"
  ADD COLUMN "call_response" varchar(40);

ALTER TABLE "public"."referrals"
  ADD CONSTRAINT "referrals_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE RESTRICT,
  ADD CONSTRAINT "referrals_source_timeline_id_fkey" FOREIGN KEY ("source_timeline_id") REFERENCES "public"."client_timeline"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "referrals_source_visit_form_id_fkey" FOREIGN KEY ("source_visit_form_id") REFERENCES "public"."visit_forms"("id") ON DELETE SET NULL;

CREATE TABLE "public"."referral_calling_history" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "referral_calling_id" uuid NOT NULL,
  "status" varchar(80) NOT NULL,
  "previous_status" varchar(80),
  "call_response" varchar(40),
  "remark" text,
  "updated_by" uuid,
  "created_at" timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "referral_calling_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "referral_calling_history_referral_calling_id_fkey" FOREIGN KEY ("referral_calling_id") REFERENCES "public"."referral_calling"("id") ON DELETE CASCADE,
  CONSTRAINT "referral_calling_history_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL
);
CREATE INDEX "referrals_branch_id_created_at_idx" ON "public"."referrals" ("branch_id", "created_at" DESC);
CREATE INDEX "referrals_source_timeline_id_idx" ON "public"."referrals" ("source_timeline_id");
CREATE INDEX "referrals_source_visit_form_id_idx" ON "public"."referrals" ("source_visit_form_id");
CREATE INDEX "referral_calling_history_calling_created_at_idx" ON "public"."referral_calling_history" ("referral_calling_id", "created_at" DESC);
CREATE INDEX "referral_calling_history_updated_by_idx" ON "public"."referral_calling_history" ("updated_by");

ALTER TABLE "public"."referral_calling_history" ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON "public"."referral_calling_history" TO authenticated;
CREATE POLICY "super_admin_all" ON "public"."referral_calling_history" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "active_staff_read_referral_calling_history" ON "public"."referral_calling_history"
FOR SELECT TO authenticated USING ("public"."current_user_role"() IS NOT NULL);
CREATE POLICY "branch_staff_insert_referral_calling_history" ON "public"."referral_calling_history"
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM "public"."referral_calling" calling
          JOIN "public"."referrals" referral ON referral.id = calling.referral_id
          WHERE calling.id = "referral_calling_history"."referral_calling_id"
            AND "public"."is_branch_staff"(referral.branch_id))
);

DROP POLICY IF EXISTS "branch_staff_write_own_referrals" ON "public"."referrals";
DROP POLICY IF EXISTS "branch_staff_write_own_referral_calling" ON "public"."referral_calling";
CREATE POLICY "branch_staff_insert_origin_referrals" ON "public"."referrals"
FOR INSERT TO authenticated WITH CHECK ("public"."is_branch_staff"("branch_id"));
CREATE POLICY "branch_staff_update_origin_referrals" ON "public"."referrals"
FOR UPDATE TO authenticated USING ("public"."is_branch_staff"("branch_id")) WITH CHECK ("public"."is_branch_staff"("branch_id"));
CREATE POLICY "branch_staff_delete_origin_referrals" ON "public"."referrals"
FOR DELETE TO authenticated USING ("public"."is_branch_staff"("branch_id"));
CREATE POLICY "branch_staff_insert_origin_referral_calling" ON "public"."referral_calling"
FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM "public"."referrals" referral WHERE referral.id = "referral_calling"."referral_id" AND "public"."is_branch_staff"(referral.branch_id)));
CREATE POLICY "branch_staff_update_origin_referral_calling" ON "public"."referral_calling"
FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM "public"."referrals" referral WHERE referral.id = "referral_calling"."referral_id" AND "public"."is_branch_staff"(referral.branch_id))) WITH CHECK (EXISTS (SELECT 1 FROM "public"."referrals" referral WHERE referral.id = "referral_calling"."referral_id" AND "public"."is_branch_staff"(referral.branch_id)));
CREATE POLICY "branch_staff_delete_origin_referral_calling" ON "public"."referral_calling"
FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM "public"."referrals" referral WHERE referral.id = "referral_calling"."referral_id" AND "public"."is_branch_staff"(referral.branch_id)));

CREATE OR REPLACE FUNCTION "public"."next_business_day"(p_date date)
RETURNS date LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT p_date + CASE extract(isodow FROM p_date)::integer WHEN 5 THEN 3 WHEN 6 THEN 2 ELSE 1 END
$$;

CREATE OR REPLACE FUNCTION "public"."create_referral_calling_if_open"(p_referral_id uuid, p_name text, p_number text, p_next_date date)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "public"."referral_calling" calling
    JOIN "public"."referrals" referral ON referral.id = calling.referral_id
    WHERE lower(btrim(referral.referral_name)) = lower(btrim(p_name))
      AND referral.referral_number = p_number
      AND calling.status NOT IN ('closed', 'converted')
  ) THEN RETURN; END IF;
  INSERT INTO "public"."referral_calling" ("referral_id", "status", "next_followup_date")
  VALUES (p_referral_id, 'pending', p_next_date);
END; $$;

CREATE OR REPLACE FUNCTION "public"."create_referral_from_visit_form"()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE source_visit record; normalized_phone text; new_referral_id uuid;
BEGIN
  IF NEW."referrals_asked" IS DISTINCT FROM true OR length(btrim(COALESCE(NEW."reference_name", ''))) = 0 THEN RETURN NEW; END IF;
  normalized_phone := right(regexp_replace(COALESCE(NEW."reference_phone", ''), '[^0-9]', '', 'g'), 10);
  IF length(normalized_phone) <> 10 THEN RETURN NEW; END IF;
  SELECT timeline."client_id", timeline."branch_id", timeline."id" AS timeline_id, timeline."event_date", timeline."salesperson_id", timeline."crm_name"
  INTO source_visit FROM "public"."client_timeline" timeline WHERE timeline.id = NEW."client_timeline_id";
  IF source_visit."client_id" IS NULL THEN RETURN NEW; END IF;
  INSERT INTO "public"."referrals" ("crm_name", "salesperson_id", "given_by_client_id", "referral_name", "referral_number", "branch_id", "source_timeline_id", "source_visit_form_id")
  VALUES (source_visit."crm_name", source_visit."salesperson_id", source_visit."client_id", btrim(NEW."reference_name"), normalized_phone, source_visit."branch_id", source_visit."timeline_id", NEW."id")
  RETURNING id INTO new_referral_id;
  PERFORM "public"."create_referral_calling_if_open"(new_referral_id, NEW."reference_name", normalized_phone, "public"."next_business_day"(source_visit."event_date"::date));
  RETURN NEW;
END; $$;
CREATE TRIGGER "visit_forms_create_referral"
AFTER INSERT ON "public"."visit_forms" FOR EACH ROW EXECUTE FUNCTION "public"."create_referral_from_visit_form"();

CREATE OR REPLACE FUNCTION "public"."record_referral_calling_update"()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW."status" IS NOT DISTINCT FROM OLD."status" AND NEW."call_response" IS NOT DISTINCT FROM OLD."call_response" AND NEW."remark" IS NOT DISTINCT FROM OLD."remark" AND NEW."next_followup_date" IS NOT DISTINCT FROM OLD."next_followup_date" THEN RETURN NEW; END IF;
  INSERT INTO "public"."referral_calling_history" ("referral_calling_id", "status", "previous_status", "call_response", "remark", "updated_by")
  VALUES (NEW."id", NEW."status", OLD."status", NEW."call_response", NEW."remark", "auth"."uid"());
  RETURN NEW;
END; $$;
CREATE TRIGGER "referral_calling_record_update"
AFTER UPDATE OF "status", "call_response", "remark", "next_followup_date" ON "public"."referral_calling"
FOR EACH ROW EXECUTE FUNCTION "public"."record_referral_calling_update"();

CREATE OR REPLACE FUNCTION "public"."create_manual_referral"(p_client_id uuid, p_referral_name text, p_referral_number text, p_crm_name text DEFAULT NULL, p_branch_id uuid DEFAULT NULL)
RETURNS "public"."referrals" LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor_role "public"."user_role"; own_branch uuid; target_branch uuid; normalized_phone text; created_referral "public"."referrals";
BEGIN
  actor_role := "public"."current_user_role"(); own_branch := "public"."current_user_branch_id"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  target_branch := CASE WHEN actor_role = 'super_admin' THEN p_branch_id ELSE own_branch END;
  normalized_phone := right(regexp_replace(COALESCE(p_referral_number, ''), '[^0-9]', '', 'g'), 10);
  IF p_client_id IS NULL OR length(btrim(COALESCE(p_referral_name, ''))) = 0 OR length(normalized_phone) <> 10 THEN RAISE EXCEPTION 'referring client, referral name, and a 10-digit referral number are required' USING ERRCODE = 'check_violation'; END IF;
  IF target_branch IS NULL OR NOT "public"."is_branch_staff"(target_branch) THEN RAISE EXCEPTION 'an own branch is required' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF NOT EXISTS (SELECT 1 FROM "public"."clients" WHERE client_id = p_client_id) THEN RAISE EXCEPTION 'referring client not found' USING ERRCODE = 'no_data_found'; END IF;
  INSERT INTO "public"."referrals" ("crm_name", "salesperson_id", "given_by_client_id", "referral_name", "referral_number", "branch_id")
  VALUES (NULLIF(btrim(p_crm_name), ''), "auth"."uid"(), p_client_id, btrim(p_referral_name), normalized_phone, target_branch)
  RETURNING * INTO created_referral;
  PERFORM "public"."create_referral_calling_if_open"(created_referral.id, created_referral.referral_name, normalized_phone, "public"."next_business_day"(CURRENT_DATE));
  RETURN created_referral;
END; $$;

CREATE OR REPLACE FUNCTION "public"."update_referral_calling"(p_referral_calling_id uuid, p_call_response text, p_remark text DEFAULT NULL, p_next_followup_date date DEFAULT NULL)
RETURNS "public"."referral_calling" LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor_role "public"."user_role"; target "public"."referral_calling"; target_branch uuid; target_status varchar(80);
BEGIN
  actor_role := "public"."current_user_role"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  SELECT calling.* INTO target FROM "public"."referral_calling" calling WHERE calling.id = p_referral_calling_id FOR UPDATE;
  SELECT referral.branch_id INTO target_branch FROM "public"."referrals" referral WHERE referral.id = target.referral_id;
  IF target.id IS NULL THEN RAISE EXCEPTION 'referral call not found' USING ERRCODE = 'no_data_found'; END IF;
  IF NOT "public"."is_super_admin"() AND NOT "public"."is_branch_staff"(target_branch) THEN RAISE EXCEPTION 'you may only update referrals from your own branch' USING ERRCODE = 'insufficient_privilege'; END IF;
  p_call_response := lower(btrim(COALESCE(p_call_response, '')));
  IF p_call_response NOT IN ('interested', 'not_interested', 'no_response', 'converted', 'reschedule') THEN RAISE EXCEPTION 'invalid call response' USING ERRCODE = 'check_violation'; END IF;
  IF p_call_response = 'reschedule' AND p_next_followup_date IS NULL THEN RAISE EXCEPTION 'a reschedule date is required' USING ERRCODE = 'check_violation'; END IF;
  target_status := CASE p_call_response WHEN 'not_interested' THEN 'closed' WHEN 'converted' THEN 'converted' ELSE 'pending' END;
  UPDATE "public"."referral_calling" SET "status" = target_status, "call_response" = p_call_response, "remark" = NULLIF(btrim(p_remark), ''), "next_followup_date" = CASE WHEN p_call_response = 'reschedule' THEN p_next_followup_date ELSE "next_followup_date" END WHERE id = p_referral_calling_id RETURNING * INTO target;
  RETURN target;
END; $$;

REVOKE ALL ON FUNCTION "public"."create_manual_referral"(uuid, text, text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."update_referral_calling"(uuid, text, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."create_manual_referral"(uuid, text, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."update_referral_calling"(uuid, text, text, date) TO authenticated;
