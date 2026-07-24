-- Phase 2: atomic front-desk queue and walk-in visit capture.
ALTER TABLE "public"."client_timeline"
  ADD CONSTRAINT "client_timeline_reference_number_key" UNIQUE ("reference_number");

ALTER TABLE "public"."visit_forms"
  ADD COLUMN "source_of_lead" varchar(120),
  ADD COLUMN "source_of_lead_other" varchar(160),
  ADD COLUMN "reference_name" varchar(160),
  ADD COLUMN "reference_phone" varchar(30),
  ADD COLUMN "client_type" varchar(20),
  ADD COLUMN "did_buy" boolean,
  ADD COLUMN "not_bought_reasons" text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN "not_bought_other" text,
  ADD COLUMN "repair_or_order_approach" text,
  ADD COLUMN "marketing_message_sent" text,
  ADD COLUMN "feedback_form_asked" boolean,
  ADD COLUMN "feedback_form_no_reason" text,
  ADD COLUMN "feedback_form_proof_url" text,
  ADD CONSTRAINT "visit_forms_client_type_check" CHECK ("client_type" IS NULL OR "client_type" IN ('new', 'existing'));
CREATE INDEX "visit_forms_client_type_idx" ON "public"."visit_forms" ("client_type");
CREATE INDEX "visit_forms_did_buy_idx" ON "public"."visit_forms" ("did_buy");

-- The Phase 1 phone-index trigger replaces a client's keys during a profile update.
-- It needs this policy for its trigger-owned DELETE to be visible to an active staff member.
CREATE POLICY "active_staff_delete_phone_index" ON "public"."client_phone_index"
FOR DELETE TO authenticated
USING ("public"."current_user_role"() IS NOT NULL);

CREATE OR REPLACE FUNCTION "public"."create_entry_queue"(
  p_client_name text, p_mobile text, p_branch_id uuid DEFAULT NULL, p_assigned_crm_name text DEFAULT NULL
) RETURNS TABLE(token text, client_id uuid, client_type text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
#variable_conflict use_column
DECLARE
  actor_role "public"."user_role";
  own_branch uuid;
  target_branch uuid;
  phone_digits text;
  generated_token text;
  found_client uuid;
BEGIN
  actor_role := "public"."current_user_role"(); own_branch := "public"."current_user_branch_id"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  phone_digits := right(regexp_replace(COALESCE(p_mobile, ''), '[^0-9]', '', 'g'), 10);
  IF length(trim(COALESCE(p_client_name, ''))) = 0 OR length(phone_digits) <> 10 THEN RAISE EXCEPTION 'client name and a 10-digit phone are required' USING ERRCODE = 'check_violation'; END IF;
  target_branch := CASE WHEN actor_role = 'super_admin' THEN p_branch_id ELSE own_branch END;
  IF target_branch IS NULL OR NOT "public"."is_branch_staff"(target_branch) OR NOT EXISTS (SELECT 1 FROM "public"."branches" WHERE id = target_branch AND active) THEN RAISE EXCEPTION 'an active branch you may write to is required' USING ERRCODE = 'insufficient_privilege'; END IF;
  SELECT phone_index.client_id INTO found_client FROM "public"."client_phone_index" AS phone_index WHERE phone_index.phone = phone_digits;
  IF p_assigned_crm_name IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "public"."crm_allocation" a LEFT JOIN "public"."crm_daily_availability" d ON d.branch_id = a.branch_id AND d.crm_name = a.crm_name AND d.date = CURRENT_DATE
    WHERE a.branch_id = target_branch AND a.crm_name = trim(p_assigned_crm_name) AND a.active AND COALESCE(d.is_available, true)
  ) THEN RAISE EXCEPTION 'assigned CRM is not available for this branch today' USING ERRCODE = 'check_violation'; END IF;
  LOOP
    generated_token := upper(to_char(CURRENT_DATE, 'MMDD') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));
    BEGIN
      INSERT INTO "public"."entry_queue" (token, client_name, mobile, branch_id, assigned_crm_name, status, client_id)
      VALUES (generated_token, trim(p_client_name), phone_digits, target_branch, NULLIF(trim(p_assigned_crm_name), ''), 'pending', found_client);
      EXIT;
    EXCEPTION WHEN unique_violation THEN END;
  END LOOP;
  RETURN QUERY SELECT generated_token, found_client, CASE WHEN found_client IS NULL THEN 'new' ELSE 'existing' END;
END; $$;

CREATE OR REPLACE FUNCTION "public"."submit_walkin_visit"(p_payload jsonb)
RETURNS TABLE(client_id uuid, timeline_id uuid, reference_number text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
#variable_conflict use_column
DECLARE
  actor_role "public"."user_role"; own_branch uuid; target_branch uuid; target_client uuid; new_client boolean;
  phone_digits text; queue_id uuid; visit_id uuid; ref text; seq integer; event_at timestamptz;
  purchase_status "public"."buy_status"; profile jsonb; details jsonb; proof jsonb; doc jsonb;
BEGIN
  actor_role := "public"."current_user_role"(); own_branch := "public"."current_user_branch_id"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  target_branch := NULLIF(p_payload->>'branch_id', '')::uuid;
  IF target_branch IS NULL OR NOT "public"."is_branch_staff"(target_branch) THEN RAISE EXCEPTION 'you may only submit visits for your own branch' USING ERRCODE = 'insufficient_privilege'; END IF;
  phone_digits := right(regexp_replace(COALESCE(p_payload->>'primary_phone', ''), '[^0-9]', '', 'g'), 10);
  IF length(phone_digits) <> 10 OR length(trim(COALESCE(p_payload->>'primary_name', ''))) = 0 THEN RAISE EXCEPTION 'client name and a 10-digit phone are required' USING ERRCODE = 'check_violation'; END IF;
  target_client := NULLIF(p_payload->>'client_id', '')::uuid;
  IF target_client IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "public"."clients" AS existing_client WHERE existing_client.client_id = target_client) THEN target_client := NULL; END IF;
  IF target_client IS NULL THEN SELECT phone_index.client_id INTO target_client FROM "public"."client_phone_index" AS phone_index WHERE phone_index.phone = phone_digits; END IF;
  new_client := target_client IS NULL;
  IF new_client THEN
    INSERT INTO "public"."clients" (client_id, primary_name, primary_phone, gender, country, state, city, city_other, pincode, address, community, community_other, dob, anniversary, beverage, sugar, snack, last_branch_id)
    VALUES (COALESCE(NULLIF(p_payload->>'proposed_client_id', '')::uuid, gen_random_uuid()), trim(p_payload->>'primary_name'), phone_digits, NULLIF(trim(p_payload->>'gender'), ''), NULLIF(trim(p_payload->>'country'), ''), NULLIF(trim(p_payload->>'state'), ''), NULLIF(trim(p_payload->>'city'), ''), NULLIF(trim(p_payload->>'city_other'), ''), NULLIF(trim(p_payload->>'pincode'), ''), NULLIF(trim(p_payload->>'address'), ''), NULLIF(trim(p_payload->>'community'), ''), NULLIF(trim(p_payload->>'community_other'), ''), NULLIF(p_payload->>'dob', '')::date, NULLIF(p_payload->>'anniversary', '')::date, NULLIF(trim(p_payload->>'beverage'), ''), NULLIF(trim(p_payload->>'sugar'), ''), NULLIF(trim(p_payload->>'snack'), ''), target_branch) RETURNING client_id INTO target_client;
  ELSE
    UPDATE "public"."clients" SET primary_name = trim(p_payload->>'primary_name'), billing_phone = NULLIF(trim(p_payload->>'billing_phone'), ''), gender = NULLIF(trim(p_payload->>'gender'), ''), country = NULLIF(trim(p_payload->>'country'), ''), state = NULLIF(trim(p_payload->>'state'), ''), city = NULLIF(trim(p_payload->>'city'), ''), city_other = NULLIF(trim(p_payload->>'city_other'), ''), pincode = NULLIF(trim(p_payload->>'pincode'), ''), address = NULLIF(trim(p_payload->>'address'), ''), community = NULLIF(trim(p_payload->>'community'), ''), community_other = NULLIF(trim(p_payload->>'community_other'), ''), dob = NULLIF(p_payload->>'dob', '')::date, anniversary = NULLIF(p_payload->>'anniversary', '')::date, beverage = NULLIF(trim(p_payload->>'beverage'), ''), sugar = NULLIF(trim(p_payload->>'sugar'), ''), snack = NULLIF(trim(p_payload->>'snack'), ''), next_visit_date = NULLIF(p_payload->>'next_visit_date', '')::date, client_potential_category = NULLIF(trim(p_payload->>'client_potential_category'), ''), high_potential_reason = NULLIF(trim(p_payload->>'high_potential_reason'), ''), last_remark = NULLIF(trim(p_payload->>'remark'), ''), last_product_requirement = NULLIF(trim(p_payload->>'product_requirement'), ''), last_seen_categories = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'seen_categories', '[]'::jsonb))), ARRAY[]::text[]), last_bought_categories = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'bought_categories', '[]'::jsonb))), ARRAY[]::text[]), last_order_categories = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'order_categories', '[]'::jsonb))), ARRAY[]::text[]) WHERE client_id = target_client;
  END IF;
  IF new_client THEN UPDATE "public"."clients" SET next_visit_date = NULLIF(p_payload->>'next_visit_date', '')::date, client_potential_category = NULLIF(trim(p_payload->>'client_potential_category'), ''), high_potential_reason = NULLIF(trim(p_payload->>'high_potential_reason'), ''), last_remark = NULLIF(trim(p_payload->>'remark'), ''), last_product_requirement = NULLIF(trim(p_payload->>'product_requirement'), ''), last_seen_categories = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'seen_categories', '[]'::jsonb))), ARRAY[]::text[]), last_bought_categories = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'bought_categories', '[]'::jsonb))), ARRAY[]::text[]), last_order_categories = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'order_categories', '[]'::jsonb))), ARRAY[]::text[]) WHERE client_id = target_client; END IF;
  event_at := COALESCE(NULLIF(p_payload->>'event_date', '')::timestamptz, CURRENT_TIMESTAMP);
  purchase_status := CASE WHEN COALESCE((p_payload->>'did_buy')::boolean, false) THEN 'YES'::"public"."buy_status" ELSE 'NO'::"public"."buy_status" END;
  SELECT count(*) + 1 INTO seq FROM "public"."client_timeline" WHERE branch_id = target_branch AND event_date::date = event_at::date;
  ref := upper(COALESCE((SELECT substr(name, 1, 3) FROM "public"."branches" WHERE id = target_branch), 'MJK')) || '-' || to_char(event_at, 'YYMMDD') || '-' || lpad(seq::text, 4, '0');
  LOOP BEGIN
    INSERT INTO "public"."client_timeline" (id,client_id,event_date,buy_status,branch_id,crm_name,salesperson_id,seen_categories,bought_categories,order_categories,product_requirement,remark,reference_number)
    VALUES (COALESCE(NULLIF(p_payload->>'proposed_timeline_id', '')::uuid, gen_random_uuid()),target_client,event_at,purchase_status,target_branch,NULLIF(trim(p_payload->>'crm_name'), ''),"auth"."uid"(),COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'seen_categories','[]'::jsonb))),ARRAY[]::text[]),COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'bought_categories','[]'::jsonb))),ARRAY[]::text[]),COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'order_categories','[]'::jsonb))),ARRAY[]::text[]),NULLIF(trim(p_payload->>'product_requirement'), ''),NULLIF(trim(p_payload->>'remark'), ''),ref) RETURNING id INTO visit_id;
    EXIT; EXCEPTION WHEN unique_violation THEN seq := seq + 1; ref := upper(COALESCE((SELECT substr(name, 1, 3) FROM "public"."branches" WHERE id = target_branch), 'MJK')) || '-' || to_char(event_at, 'YYMMDD') || '-' || lpad(seq::text, 4, '0'); END; END LOOP;
  details := COALESCE(p_payload->'category_details', '{}'::jsonb);
  INSERT INTO "public"."visit_forms" (client_timeline_id,companions,category_details,occupation,occupation_other,bridal_or_non_bridal,wedding_month,wedding_year,communication_preference,source_of_lead,source_of_lead_other,reference_name,reference_phone,client_type,did_buy,not_bought_reasons,not_bought_other,repair_or_order_approach,marketing_message_sent,instagram_asked,instagram_no_reason,google_review_asked,google_review_no_reason,testimonial_asked,testimonial_no_reason,feedback_form_asked,feedback_form_no_reason,thank_you_note_asked,thank_you_note_no_reason,referrals_asked,referrals_no_reason,additional_fields)
  VALUES (visit_id,COALESCE(p_payload->'companions','[]'::jsonb),details,NULLIF(trim(p_payload->>'occupation'), ''),NULLIF(trim(p_payload->>'occupation_other'), ''),NULLIF(trim(p_payload->>'bridal_or_non_bridal'), ''),NULLIF(p_payload->>'wedding_month','')::smallint,NULLIF(p_payload->>'wedding_year','')::smallint,NULLIF(trim(p_payload->>'communication_preference'), ''),NULLIF(trim(p_payload->>'source_of_lead'), ''),NULLIF(trim(p_payload->>'source_of_lead_other'), ''),NULLIF(trim(p_payload->>'reference_name'), ''),NULLIF(trim(p_payload->>'reference_phone'), ''),CASE WHEN new_client THEN 'new' ELSE 'existing' END,COALESCE((p_payload->>'did_buy')::boolean,false),COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'not_bought_reasons','[]'::jsonb))),ARRAY[]::text[]),NULLIF(trim(p_payload->>'not_bought_other'), ''),NULLIF(trim(p_payload->>'repair_or_order_approach'), ''),NULLIF(trim(p_payload->>'marketing_message_sent'), ''),(p_payload->'engagement'->'instagram'->>'asked')::boolean,NULLIF(p_payload->'engagement'->'instagram'->>'no_reason',''),(p_payload->'engagement'->'google_review'->>'asked')::boolean,NULLIF(p_payload->'engagement'->'google_review'->>'no_reason',''),(p_payload->'engagement'->'testimonial'->>'asked')::boolean,NULLIF(p_payload->'engagement'->'testimonial'->>'no_reason',''),(p_payload->'engagement'->'feedback_form'->>'asked')::boolean,NULLIF(p_payload->'engagement'->'feedback_form'->>'no_reason',''),(p_payload->'engagement'->'thank_you_note'->>'asked')::boolean,NULLIF(p_payload->'engagement'->'thank_you_note'->>'no_reason',''),(p_payload->'engagement'->'referrals'->>'asked')::boolean,NULLIF(p_payload->'engagement'->'referrals'->>'no_reason',''),COALESCE(p_payload->'additional_fields','{}'::jsonb));
  FOR doc IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'documents','[]'::jsonb)) LOOP
    INSERT INTO "public"."documents" (client_id,client_timeline_id,uploaded_by,file_name,storage_path,mime_type) VALUES (target_client,visit_id,"auth"."uid"(),doc->>'file_name',doc->>'storage_path',doc->>'mime_type');
  END LOOP;
  queue_id := NULLIF(p_payload->>'entry_queue_id','')::uuid;
  IF queue_id IS NOT NULL THEN UPDATE "public"."entry_queue" SET status = 'complete', full_form_timestamp = CURRENT_TIMESTAMP, client_id = target_client WHERE id = queue_id AND branch_id = target_branch; IF NOT FOUND THEN RAISE EXCEPTION 'queue token does not belong to this branch' USING ERRCODE = 'insufficient_privilege'; END IF; END IF;
  RETURN QUERY SELECT target_client, visit_id, ref;
END; $$;

REVOKE ALL ON FUNCTION "public"."create_entry_queue"(text,text,uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."submit_walkin_visit"(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."create_entry_queue"(text,text,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."submit_walkin_visit"(jsonb) TO authenticated;
