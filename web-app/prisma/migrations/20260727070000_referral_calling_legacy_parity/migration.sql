-- Forward-only legacy Referrals Calling parity: original fields, conversion reconciliation, and explicit sync.
ALTER TABLE "public"."referrals" ADD COLUMN "assigned_doer" varchar(160);
ALTER TABLE "public"."referral_calling" ADD COLUMN "action_point" text;
ALTER TABLE "public"."referral_calling_history" ADD COLUMN "entered_by" varchar(160);

CREATE INDEX "referrals_assigned_doer_idx" ON "public"."referrals" ("assigned_doer") WHERE "assigned_doer" IS NOT NULL;

CREATE OR REPLACE FUNCTION "public"."record_referral_calling_update"()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW."status" IS NOT DISTINCT FROM OLD."status" AND NEW."call_response" IS NOT DISTINCT FROM OLD."call_response" AND NEW."remark" IS NOT DISTINCT FROM OLD."remark" AND NEW."next_followup_date" IS NOT DISTINCT FROM OLD."next_followup_date" THEN RETURN NEW; END IF;
  NEW."followup_count" := OLD."followup_count" + 1;
  INSERT INTO "public"."referral_calling_history" ("referral_calling_id", "status", "previous_status", "call_response", "remark", "updated_by", "entered_by")
  VALUES (NEW."id", NEW."status", OLD."status", NEW."call_response", NEW."remark", "auth"."uid"(), NULLIF(current_setting('app.referral_entered_by', true), ''));
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION "public"."reconcile_referral_calling_conversions"()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor_role "public"."user_role"; updated_count integer;
BEGIN
  actor_role := "public"."current_user_role"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  WITH matches AS (
    SELECT calling.id, phones.client_id
    FROM "public"."referral_calling" calling
    JOIN "public"."referrals" referral ON referral.id = calling.referral_id
    JOIN "public"."client_phone_index" phones ON phones.phone = right(regexp_replace(referral.referral_number, '[^0-9]', '', 'g'), 10)
    WHERE calling.converted_client_id IS NULL
      AND ("public"."is_super_admin"() OR "public"."is_branch_staff"(referral.branch_id))
  ), updated AS (
    UPDATE "public"."referral_calling" calling
    SET converted_client_id = matches.client_id, status = 'CONVERTED TO CLIENT', next_followup_date = NULL
    FROM matches WHERE calling.id = matches.id
    RETURNING calling.id
  ) SELECT count(*)::integer INTO updated_count FROM updated;
  RETURN updated_count;
END; $$;

CREATE OR REPLACE FUNCTION "public"."save_referral_followup"(
  p_referral_calling_id uuid,
  p_followup_status text,
  p_call_response text,
  p_next_followup_date date DEFAULT NULL,
  p_remark text DEFAULT NULL,
  p_entered_by text DEFAULT NULL
) RETURNS "public"."referral_calling"
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor_role "public"."user_role"; target "public"."referral_calling"; target_branch uuid; normalized_status text; converted_id uuid;
BEGIN
  actor_role := "public"."current_user_role"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  SELECT calling.* INTO target FROM "public"."referral_calling" calling WHERE calling.id = p_referral_calling_id FOR UPDATE;
  IF target.id IS NULL THEN RAISE EXCEPTION 'referral call not found' USING ERRCODE = 'no_data_found'; END IF;
  SELECT referral.branch_id INTO target_branch FROM "public"."referrals" referral WHERE referral.id = target.referral_id;
  IF NOT "public"."is_super_admin"() AND NOT "public"."is_branch_staff"(target_branch) THEN RAISE EXCEPTION 'you may only update referrals from your own branch' USING ERRCODE = 'insufficient_privilege'; END IF;
  normalized_status := upper(btrim(COALESCE(p_followup_status, '')));
  IF normalized_status NOT IN ('PENDING', 'IN PROCESS', 'FOLLOW UP DONE', 'CONVERTED TO CLIENT') THEN RAISE EXCEPTION 'invalid follow-up status' USING ERRCODE = 'check_violation'; END IF;
  IF upper(btrim(COALESCE(p_call_response, ''))) NOT IN ('CONNECTED', 'CALL NOT PICKED', 'NOT ANSWERED', 'WRONG NUMBER', 'WHATSAPP SENT') THEN RAISE EXCEPTION 'invalid call response' USING ERRCODE = 'check_violation'; END IF;
  IF normalized_status NOT IN ('FOLLOW UP DONE', 'CONVERTED TO CLIENT') AND NULLIF(btrim(COALESCE(p_remark, '')), '') IS NULL THEN RAISE EXCEPTION 'follow-up remark is required unless done' USING ERRCODE = 'check_violation'; END IF;
  IF normalized_status = 'CONVERTED TO CLIENT' THEN
    SELECT phones.client_id INTO converted_id FROM "public"."referrals" referral JOIN "public"."client_phone_index" phones ON phones.phone = right(regexp_replace(referral.referral_number, '[^0-9]', '', 'g'), 10) WHERE referral.id = target.referral_id;
    IF converted_id IS NULL THEN RAISE EXCEPTION 'no existing client matches this referral number; use Convert to Client to create one' USING ERRCODE = 'check_violation'; END IF;
  END IF;
  PERFORM set_config('app.referral_entered_by', NULLIF(btrim(COALESCE(p_entered_by, '')), ''), true);
  UPDATE "public"."referral_calling"
  SET status = normalized_status, call_response = upper(btrim(p_call_response)), remark = NULLIF(btrim(p_remark), ''),
      next_followup_date = CASE WHEN normalized_status IN ('FOLLOW UP DONE', 'CONVERTED TO CLIENT') THEN NULL ELSE p_next_followup_date END,
      converted_client_id = CASE WHEN normalized_status = 'CONVERTED TO CLIENT' THEN converted_id ELSE converted_client_id END
  WHERE id = p_referral_calling_id RETURNING * INTO target;
  RETURN target;
END; $$;

REVOKE ALL ON FUNCTION "public"."reconcile_referral_calling_conversions"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."save_referral_followup"(uuid, text, text, date, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."reconcile_referral_calling_conversions"() TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."save_referral_followup"(uuid, text, text, date, text, text) TO authenticated;
