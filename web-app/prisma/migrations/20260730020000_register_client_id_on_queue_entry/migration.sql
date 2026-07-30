-- Registration is the client-creation point. The full visit form enriches this
-- same record rather than creating a second client when it is submitted.
ALTER TABLE "public"."entry_queue"
  ADD COLUMN "client_is_new" boolean NOT NULL DEFAULT false;

DROP FUNCTION IF EXISTS "public"."create_entry_queue"(text, text, uuid, text, uuid);
CREATE OR REPLACE FUNCTION "public"."create_entry_queue"(
  p_client_name text, p_mobile text, p_branch_id uuid DEFAULT NULL,
  p_assigned_crm_name text DEFAULT NULL, p_client_id uuid DEFAULT NULL
) RETURNS TABLE(id uuid, token text, client_id uuid, client_code text, client_type text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
#variable_conflict use_column
DECLARE
  actor_role "public"."user_role"; own_branch uuid; target_branch uuid; phone_digits text;
  generated_token text; found_client uuid; found_client_code text; canonical_name text;
  assigned_crm text; created_client boolean := false;
BEGIN
  actor_role := "public"."current_user_role"(); own_branch := "public"."current_user_branch_id"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  target_branch := CASE WHEN actor_role = 'super_admin' THEN p_branch_id ELSE own_branch END;
  IF target_branch IS NULL OR (actor_role <> 'super_admin' AND NOT "public"."is_branch_staff"(target_branch)) OR NOT EXISTS (SELECT 1 FROM "public"."branches" WHERE branches.id = target_branch AND active) THEN RAISE EXCEPTION 'an active branch you may write to is required' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF p_client_id IS NOT NULL THEN
    SELECT clients.client_id, clients.client_code, clients.primary_name, clients.primary_phone INTO found_client, found_client_code, canonical_name, phone_digits FROM "public"."clients" WHERE clients.client_id = p_client_id;
    IF found_client IS NULL THEN RAISE EXCEPTION 'selected client is not available' USING ERRCODE = 'insufficient_privilege'; END IF;
  ELSE
    phone_digits := right(regexp_replace(COALESCE(p_mobile, ''), '[^0-9]', '', 'g'), 10); canonical_name := trim(COALESCE(p_client_name, ''));
    IF length(canonical_name) = 0 OR length(phone_digits) <> 10 THEN RAISE EXCEPTION 'client name and a 10-digit phone are required' USING ERRCODE = 'check_violation'; END IF;
    SELECT phone_index.client_id, clients.client_code INTO found_client, found_client_code FROM "public"."client_phone_index" phone_index JOIN "public"."clients" clients ON clients.client_id = phone_index.client_id WHERE phone_index.phone = phone_digits;
    IF found_client IS NULL THEN
      BEGIN
        INSERT INTO "public"."clients" (primary_name, primary_phone, last_branch_id)
        VALUES (canonical_name, phone_digits, target_branch)
        RETURNING clients.client_id, clients.client_code INTO found_client, found_client_code;
        created_client := true;
      EXCEPTION WHEN unique_violation THEN
        SELECT phone_index.client_id, clients.client_code INTO found_client, found_client_code FROM "public"."client_phone_index" phone_index JOIN "public"."clients" clients ON clients.client_id = phone_index.client_id WHERE phone_index.phone = phone_digits;
        IF found_client IS NULL THEN RAISE; END IF;
      END;
    END IF;
  END IF;
  assigned_crm := NULLIF("public"."normalize_crm_roster_value"(p_assigned_crm_name), '');
  IF assigned_crm IS NULL THEN assigned_crm := "public"."assign_next_available_crm"(target_branch); END IF;
  IF assigned_crm IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "public"."crm_allocation" allocation LEFT JOIN "public"."crm_daily_availability" availability ON availability.branch_id = allocation.branch_id AND "public"."normalize_crm_roster_value"(availability.crm_name) = "public"."normalize_crm_roster_value"(allocation.crm_name) AND availability.date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date WHERE allocation.branch_id = target_branch AND "public"."normalize_crm_roster_value"(allocation.crm_name) = assigned_crm AND allocation.active AND COALESCE(availability.is_available, true)) THEN RAISE EXCEPTION 'assigned CRM is not available for this branch today' USING ERRCODE = 'check_violation'; END IF;
  LOOP
    generated_token := upper(to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata', 'MMDD') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));
    BEGIN INSERT INTO "public"."entry_queue" (token, client_name, mobile, branch_id, assigned_crm_name, status, client_id, client_is_new)
      VALUES (generated_token, canonical_name, phone_digits, target_branch, assigned_crm, 'pending', found_client, created_client) RETURNING entry_queue.id INTO id; EXIT;
    EXCEPTION WHEN unique_violation THEN END;
  END LOOP;
  RETURN QUERY SELECT id, generated_token, found_client, found_client_code, CASE WHEN created_client THEN 'new' ELSE 'existing' END;
END;
$$;

REVOKE ALL ON FUNCTION "public"."create_entry_queue"(text, text, uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."create_entry_queue"(text, text, uuid, text, uuid) TO authenticated;
