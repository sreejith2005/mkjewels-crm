-- Literal legacy Referrals Calling parity. This migration is intentionally forward-only.
-- Historical imported referrals without source links are retained untouched.
ALTER TABLE "public"."referral_calling_history"
  ADD COLUMN "followup_date" date,
  ADD COLUMN "next_followup_date" date,
  ADD COLUMN "source" varchar(80),
  ADD COLUMN "request_key" uuid;

CREATE UNIQUE INDEX "referral_calling_one_row_per_referral_key"
  ON "public"."referral_calling" ("referral_id");
CREATE UNIQUE INDEX "referral_calling_history_request_key"
  ON "public"."referral_calling_history" ("referral_calling_id", "request_key")
  WHERE "request_key" IS NOT NULL;

CREATE OR REPLACE FUNCTION "public"."record_referral_calling_update"()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW."status" IS NOT DISTINCT FROM OLD."status"
     AND NEW."call_response" IS NOT DISTINCT FROM OLD."call_response"
     AND NEW."remark" IS NOT DISTINCT FROM OLD."remark"
     AND NEW."next_followup_date" IS NOT DISTINCT FROM OLD."next_followup_date" THEN
    RETURN NEW;
  END IF;
  NEW."followup_count" := OLD."followup_count" + 1;
  INSERT INTO "public"."referral_calling_history" (
    "referral_calling_id", "status", "previous_status", "call_response", "remark", "updated_by", "entered_by",
    "followup_date", "next_followup_date", "source", "request_key"
  ) VALUES (
    NEW."id", NEW."status", OLD."status", NEW."call_response", NEW."remark", "auth"."uid"(),
    NULLIF(current_setting('app.referral_entered_by', true), ''),
    (timezone('Asia/Kolkata', now()))::date, NEW."next_followup_date", 'CRM FOLLOW UP FORM',
    NULLIF(current_setting('app.referral_request_key', true), '')::uuid
  );
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION "public"."create_referral_calling_if_open"(p_referral_id uuid, p_name text, p_number text, p_next_date date)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "public"."referral_calling" calling
    JOIN "public"."referrals" referral ON referral.id = calling.referral_id
    JOIN "public"."clients" referral_giver ON referral_giver.client_id = referral.given_by_client_id
    WHERE lower(btrim(referral.referral_name)) = lower(btrim(p_name))
      AND right(regexp_replace(referral.referral_number, '[^0-9]', '', 'g'), 10) = right(regexp_replace(p_number, '[^0-9]', '', 'g'), 10)
      AND left(regexp_replace(upper(btrim(referral_giver.primary_name)), '[^A-Z0-9]', '', 'g'), 20) = (
        SELECT left(regexp_replace(upper(btrim(source_giver.primary_name)), '[^A-Z0-9]', '', 'g'), 20)
        FROM "public"."referrals" source_referral
        JOIN "public"."clients" source_giver ON source_giver.client_id = source_referral.given_by_client_id
        WHERE source_referral.id = p_referral_id
      )
      AND calling.status NOT IN ('CONVERTED TO CLIENT','ALREADY PURCHASED FROM MK JEWELS','NOT INTERESTED','NO REQUIREMENT AT THE MOMENT','WRONG NUMBER','DO NOT CALL')
  ) THEN RETURN; END IF;
  INSERT INTO "public"."referral_calling" ("referral_id", "status", "next_followup_date", "action_point")
  VALUES (p_referral_id, 'PENDING', p_next_date,
    'Referral Follow Up: Call using referral giver name for trust, confirm jewellery requirement, note occasion/budget, and set next follow-up date.')
  ON CONFLICT ("referral_id") DO NOTHING;
END; $$;

CREATE OR REPLACE FUNCTION "public"."save_referral_followup"(
  p_referral_calling_id uuid,
  p_followup_status text,
  p_call_response text,
  p_next_followup_date date DEFAULT NULL,
  p_remark text DEFAULT NULL,
  p_entered_by text DEFAULT NULL,
  p_request_key uuid DEFAULT NULL
) RETURNS "public"."referral_calling"
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor_role "public"."user_role"; target "public"."referral_calling"; target_branch uuid;
  normalized_status text; normalized_response text; actor_name text;
BEGIN
  actor_role := "public"."current_user_role"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  SELECT calling.* INTO target FROM "public"."referral_calling" calling WHERE calling.id = p_referral_calling_id FOR UPDATE;
  IF target.id IS NULL THEN RAISE EXCEPTION 'referral call not found' USING ERRCODE = 'no_data_found'; END IF;
  SELECT referral.branch_id INTO target_branch FROM "public"."referrals" referral WHERE referral.id = target.referral_id;
  IF NOT "public"."is_super_admin"() AND NOT "public"."is_branch_staff"(target_branch) THEN RAISE EXCEPTION 'you may only update referrals from your own branch' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF p_request_key IS NOT NULL AND EXISTS (SELECT 1 FROM "public"."referral_calling_history" WHERE referral_calling_id = target.id AND request_key = p_request_key) THEN RETURN target; END IF;
  normalized_status := upper(btrim(COALESCE(p_followup_status, '')));
  normalized_response := upper(btrim(COALESCE(p_call_response, '')));
  IF normalized_status NOT IN ('PENDING','FOLLOW REQUIRED','CALL NOT PICKED','NOT ANSWERED','CALL CONNECTED','YES INTERESTED','INTERESTED - NEED FOLLOW UP','VISIT PLANNED','WHATSAPP SENT','CONVERTED TO CLIENT','ALREADY PURCHASED FROM MK JEWELS','NOT INTERESTED','NO REQUIREMENT AT THE MOMENT','WRONG NUMBER','DO NOT CALL') THEN RAISE EXCEPTION 'invalid follow-up status' USING ERRCODE = 'check_violation'; END IF;
  IF normalized_response NOT IN ('CONNECTED','CALL NOT PICKED','NOT ANSWERED','WRONG NUMBER','WHATSAPP SENT') THEN RAISE EXCEPTION 'invalid call response' USING ERRCODE = 'check_violation'; END IF;
  IF normalized_status NOT IN ('CONVERTED TO CLIENT','ALREADY PURCHASED FROM MK JEWELS','NOT INTERESTED','NO REQUIREMENT AT THE MOMENT','WRONG NUMBER','DO NOT CALL') AND p_next_followup_date IS NULL THEN RAISE EXCEPTION 'next follow-up date is required' USING ERRCODE = 'check_violation'; END IF;
  IF normalized_status NOT IN ('CONVERTED TO CLIENT','ALREADY PURCHASED FROM MK JEWELS','NOT INTERESTED','NO REQUIREMENT AT THE MOMENT','WRONG NUMBER','DO NOT CALL') AND NULLIF(btrim(COALESCE(p_remark, '')), '') IS NULL THEN RAISE EXCEPTION 'follow-up remark is required' USING ERRCODE = 'check_violation'; END IF;
  SELECT name INTO actor_name FROM "public"."users" WHERE id = "auth"."uid"();
  PERFORM set_config('app.referral_entered_by', COALESCE(actor_name, 'CRM'), true);
  PERFORM set_config('app.referral_request_key', COALESCE(p_request_key::text, ''), true);
  UPDATE "public"."referral_calling" SET status = normalized_status, call_response = normalized_response,
    remark = NULLIF(btrim(p_remark), ''), next_followup_date = CASE WHEN normalized_status IN ('CONVERTED TO CLIENT','ALREADY PURCHASED FROM MK JEWELS','NOT INTERESTED','NO REQUIREMENT AT THE MOMENT','WRONG NUMBER','DO NOT CALL') THEN NULL ELSE p_next_followup_date END
  WHERE id = target.id RETURNING * INTO target;
  RETURN target;
END; $$;

REVOKE ALL ON FUNCTION "public"."save_referral_followup"(uuid, text, text, date, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."save_referral_followup"(uuid, text, text, date, text, text, uuid) TO authenticated;
