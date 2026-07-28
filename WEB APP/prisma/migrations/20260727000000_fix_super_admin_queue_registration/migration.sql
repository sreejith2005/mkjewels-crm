-- Super admins select a target branch from the queue UI. They are authorized to
-- write any active branch, whereas is_branch_staff intentionally applies only
-- to branch_manager and salesperson roles.
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
  IF target_branch IS NULL
    OR (actor_role <> 'super_admin' AND NOT "public"."is_branch_staff"(target_branch))
    OR NOT EXISTS (SELECT 1 FROM "public"."branches" WHERE id = target_branch AND active)
  THEN RAISE EXCEPTION 'an active branch you may write to is required' USING ERRCODE = 'insufficient_privilege'; END IF;
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
