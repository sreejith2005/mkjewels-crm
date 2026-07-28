-- Align the live CRM queues with the legacy calling vocabulary. Forward-only.
ALTER TABLE "public"."referrals"
  ADD COLUMN "relationship" varchar(120),
  ADD COLUMN "best_time_to_call" varchar(120);

ALTER TABLE "public"."referral_calling"
  ADD COLUMN "converted_client_id" uuid;
DROP TRIGGER IF EXISTS "not_bought_followups_record_update" ON "public"."not_bought_followups";
DROP TRIGGER IF EXISTS "referral_calling_record_update" ON "public"."referral_calling";
ALTER TABLE "public"."not_bought_history" ALTER COLUMN "call_response" TYPE text;
ALTER TABLE "public"."referral_calling" ALTER COLUMN "call_response" TYPE text;
ALTER TABLE "public"."referral_calling_history" ALTER COLUMN "call_response" TYPE text;

ALTER TABLE "public"."referral_calling"
  ADD CONSTRAINT "referral_calling_converted_client_id_fkey"
  FOREIGN KEY ("converted_client_id") REFERENCES "public"."clients"("client_id") ON DELETE SET NULL;
CREATE INDEX "referral_calling_converted_client_id_idx" ON "public"."referral_calling" ("converted_client_id");

CREATE OR REPLACE FUNCTION "public"."legacy_call_outcome_status"(p_outcome text)
RETURNS varchar LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
BEGIN
  CASE upper(btrim(COALESCE(p_outcome, '')))
    WHEN 'YES (CLIENT NEED FOLLOW-UP)' THEN RETURN 'INTERESTED - NEED FOLLOW UP';
    WHEN 'NO (CLIENT ASKED FOR APPOINTMENT)' THEN RETURN 'VISIT PLANNED';
    WHEN 'NO (CALL NOT CONNECTED)' THEN RETURN 'CALL NOT PICKED';
    WHEN 'RINGING / NOT ANSWERED' THEN RETURN 'CALL NOT PICKED';
    WHEN 'SWITCHED OFF' THEN RETURN 'CALL NOT PICKED';
    WHEN 'BUSY / DECLINED' THEN RETURN 'CALL NOT PICKED';
    WHEN 'ALREADY PURCHASED FROM MK JEWELS' THEN RETURN 'ALREADY PURCHASED FROM MK JEWELS';
    WHEN 'ALREADY PURCHASED FROM ANOTHER JEWELLER' THEN RETURN 'ALREADY PURCHASED FROM ANOTHER JEWELLER';
    WHEN 'NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)' THEN RETURN 'NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)';
    WHEN 'INTERESTED' THEN RETURN 'pending';
    WHEN 'NO_RESPONSE' THEN RETURN 'pending';
    WHEN 'CONVERTED' THEN RETURN 'converted';
    WHEN 'NOT_INTERESTED' THEN RETURN 'closed';
    WHEN 'RESCHEDULE' THEN RETURN 'pending';
    ELSE RAISE EXCEPTION 'invalid legacy call outcome' USING ERRCODE = 'check_violation';
  END CASE;
END; $$;

CREATE OR REPLACE FUNCTION "public"."legacy_status_is_done"(p_status text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT upper(btrim(COALESCE(p_status, ''))) IN (
    'ALREADY PURCHASED FROM MK JEWELS',
    'ALREADY PURCHASED FROM ANOTHER JEWELLER',
    'NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)',
    'CONVERTED TO CLIENT'
  )
$$;

CREATE OR REPLACE FUNCTION "public"."update_not_bought_followup"(
  p_followup_id uuid, p_call_response text, p_remark text DEFAULT NULL, p_next_followup_date date DEFAULT NULL
) RETURNS "public"."not_bought_followups"
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor_role "public"."user_role"; target "public"."not_bought_followups"; target_status varchar(80); next_date date;
BEGIN
  actor_role := "public"."current_user_role"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  SELECT * INTO target FROM "public"."not_bought_followups" WHERE "id" = p_followup_id FOR UPDATE;
  IF target."id" IS NULL THEN RAISE EXCEPTION 'follow-up not found' USING ERRCODE = 'no_data_found'; END IF;
  IF NOT "public"."is_super_admin"() AND NOT "public"."is_branch_staff"(target."branch_id") THEN RAISE EXCEPTION 'you may only update follow-ups from your own branch' USING ERRCODE = 'insufficient_privilege'; END IF;
  target_status := "public"."legacy_call_outcome_status"(p_call_response);
  next_date := CASE WHEN "public"."legacy_status_is_done"(target_status) THEN NULL ELSE COALESCE(p_next_followup_date, CURRENT_DATE + 3) END;
  UPDATE "public"."not_bought_followups"
  SET "status" = target_status, "call_response" = CASE WHEN lower(btrim(p_call_response)) IN ('interested','no_response','converted','not_interested','reschedule') THEN lower(btrim(p_call_response)) ELSE upper(btrim(p_call_response)) END, "remark" = NULLIF(btrim(p_remark), ''), "next_followup_date" = next_date
  WHERE "id" = p_followup_id RETURNING * INTO target;
  RETURN target;
END; $$;

CREATE OR REPLACE FUNCTION "public"."update_referral_calling"(
  p_referral_calling_id uuid, p_call_response text, p_remark text DEFAULT NULL, p_next_followup_date date DEFAULT NULL
) RETURNS "public"."referral_calling"
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor_role "public"."user_role"; target "public"."referral_calling"; target_branch uuid; target_status varchar(80); next_date date;
BEGIN
  actor_role := "public"."current_user_role"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  SELECT calling.* INTO target FROM "public"."referral_calling" calling WHERE calling.id = p_referral_calling_id FOR UPDATE;
  IF target.id IS NULL THEN RAISE EXCEPTION 'referral call not found' USING ERRCODE = 'no_data_found'; END IF;
  SELECT referral.branch_id INTO target_branch FROM "public"."referrals" referral WHERE referral.id = target.referral_id;
  IF NOT "public"."is_super_admin"() AND NOT "public"."is_branch_staff"(target_branch) THEN RAISE EXCEPTION 'you may only update referrals from your own branch' USING ERRCODE = 'insufficient_privilege'; END IF;
  target_status := "public"."legacy_call_outcome_status"(p_call_response);
  next_date := CASE WHEN "public"."legacy_status_is_done"(target_status) THEN NULL ELSE COALESCE(p_next_followup_date, CURRENT_DATE + 3) END;
  UPDATE "public"."referral_calling"
  SET "status" = target_status, "call_response" = CASE WHEN lower(btrim(p_call_response)) IN ('interested','no_response','converted','not_interested','reschedule') THEN lower(btrim(p_call_response)) ELSE upper(btrim(p_call_response)) END, "remark" = NULLIF(btrim(p_remark), ''), "next_followup_date" = next_date
  WHERE id = p_referral_calling_id RETURNING * INTO target;
  RETURN target;
END; $$;

CREATE OR REPLACE FUNCTION "public"."convert_referral_to_client"(p_referral_calling_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor_role "public"."user_role"; calling "public"."referral_calling"; referral "public"."referrals"; target_client_id uuid; target_branch uuid; normalized_phone text;
BEGIN
  actor_role := "public"."current_user_role"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  SELECT * INTO calling FROM "public"."referral_calling" WHERE id = p_referral_calling_id FOR UPDATE;
  IF calling.id IS NULL THEN RAISE EXCEPTION 'referral call not found' USING ERRCODE = 'no_data_found'; END IF;
  SELECT * INTO referral FROM "public"."referrals" WHERE id = calling.referral_id;
  target_branch := referral.branch_id;
  IF NOT "public"."is_super_admin"() AND NOT "public"."is_branch_staff"(target_branch) THEN RAISE EXCEPTION 'you may only convert referrals from your own branch' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF calling.converted_client_id IS NOT NULL THEN RETURN calling.converted_client_id; END IF;
  normalized_phone := right(regexp_replace(referral.referral_number, '[^0-9]', '', 'g'), 10);
  SELECT client_id INTO target_client_id FROM "public"."client_phone_index" WHERE phone = normalized_phone;
  IF target_client_id IS NULL THEN
    INSERT INTO "public"."clients" (primary_name, primary_phone, last_branch_id)
    VALUES (btrim(referral.referral_name), normalized_phone, target_branch) RETURNING client_id INTO target_client_id;
  END IF;
  UPDATE "public"."referral_calling" SET converted_client_id = target_client_id, status = 'CONVERTED TO CLIENT', next_followup_date = NULL WHERE id = calling.id;
  RETURN target_client_id;
END; $$;

REVOKE ALL ON FUNCTION "public"."convert_referral_to_client"(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."convert_referral_to_client"(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION "public"."create_manual_referral"(p_client_id uuid, p_referral_name text, p_referral_number text, p_crm_name text, p_branch_id uuid, p_relationship text, p_best_time_to_call text)
RETURNS "public"."referrals" LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor_role "public"."user_role"; own_branch uuid; target_branch uuid; normalized_phone text; created_referral "public"."referrals";
BEGIN
  actor_role := "public"."current_user_role"(); own_branch := "public"."current_user_branch_id"(); target_branch := CASE WHEN actor_role = 'super_admin' THEN p_branch_id ELSE own_branch END;
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  normalized_phone := right(regexp_replace(COALESCE(p_referral_number, ''), '[^0-9]', '', 'g'), 10);
  IF p_client_id IS NULL OR length(btrim(COALESCE(p_referral_name, ''))) = 0 OR length(normalized_phone) <> 10 THEN RAISE EXCEPTION 'referring client, referral name, and a 10-digit referral number are required' USING ERRCODE = 'check_violation'; END IF;
  IF target_branch IS NULL OR NOT "public"."is_branch_staff"(target_branch) THEN RAISE EXCEPTION 'an own branch is required' USING ERRCODE = 'insufficient_privilege'; END IF;
  INSERT INTO "public"."referrals" ("crm_name","salesperson_id","given_by_client_id","referral_name","referral_number","branch_id","relationship","best_time_to_call") VALUES (NULLIF(btrim(p_crm_name),''),"auth"."uid"(),p_client_id,btrim(p_referral_name),normalized_phone,target_branch,NULLIF(btrim(p_relationship),''),NULLIF(btrim(p_best_time_to_call),'')) RETURNING * INTO created_referral;
  PERFORM "public"."create_referral_calling_if_open"(created_referral.id,created_referral.referral_name,normalized_phone,"public"."next_business_day"(CURRENT_DATE)); RETURN created_referral;
END; $$;
GRANT EXECUTE ON FUNCTION "public"."create_manual_referral"(uuid,text,text,text,uuid,text,text) TO authenticated;

CREATE TRIGGER "not_bought_followups_record_update"
AFTER UPDATE OF "status", "call_response", "remark", "next_followup_date" ON "public"."not_bought_followups"
FOR EACH ROW EXECUTE FUNCTION "public"."record_not_bought_followup_update"();
CREATE TRIGGER "referral_calling_record_update"
AFTER UPDATE OF "status", "call_response", "remark", "next_followup_date" ON "public"."referral_calling"
FOR EACH ROW EXECUTE FUNCTION "public"."record_referral_calling_update"();
