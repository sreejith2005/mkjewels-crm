-- Client Database/Profile legacy parity.  Keep the existing queue-first walk-in
-- transaction, but allow a deliberate existing-client launch to attach the
-- queue record to the selected client rather than relying on phone inference.
DROP FUNCTION IF EXISTS "public"."create_entry_queue"(text, text, uuid, text);

CREATE OR REPLACE FUNCTION "public"."create_entry_queue"(
  p_client_name text,
  p_mobile text,
  p_branch_id uuid DEFAULT NULL,
  p_assigned_crm_name text DEFAULT NULL,
  p_client_id uuid DEFAULT NULL
) RETURNS TABLE(id uuid, token text, client_id uuid, client_type text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
#variable_conflict use_column
DECLARE
  actor_role "public"."user_role";
  own_branch uuid;
  target_branch uuid;
  phone_digits text;
  generated_token text;
  found_client uuid;
  canonical_name text;
BEGIN
  actor_role := "public"."current_user_role"();
  own_branch := "public"."current_user_branch_id"();
  IF actor_role IS NULL THEN
    RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  target_branch := CASE WHEN actor_role = 'super_admin' THEN p_branch_id ELSE own_branch END;
  IF target_branch IS NULL
    OR (actor_role <> 'super_admin' AND NOT "public"."is_branch_staff"(target_branch))
    OR NOT EXISTS (SELECT 1 FROM "public"."branches" WHERE branches.id = target_branch AND active)
  THEN
    RAISE EXCEPTION 'an active branch you may write to is required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_client_id IS NOT NULL THEN
    -- This SELECT is intentionally SECURITY INVOKER, so existing global active
    -- staff read policy remains the authorization boundary.
    SELECT client_id, primary_name, primary_phone
      INTO found_client, canonical_name, phone_digits
    FROM "public"."clients"
    WHERE client_id = p_client_id;
    IF found_client IS NULL THEN
      RAISE EXCEPTION 'selected client is not available' USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSE
    phone_digits := right(regexp_replace(COALESCE(p_mobile, ''), '[^0-9]', '', 'g'), 10);
    canonical_name := trim(COALESCE(p_client_name, ''));
    IF length(canonical_name) = 0 OR length(phone_digits) <> 10 THEN
      RAISE EXCEPTION 'client name and a 10-digit phone are required' USING ERRCODE = 'check_violation';
    END IF;
    SELECT phone_index.client_id INTO found_client
    FROM "public"."client_phone_index" AS phone_index
    WHERE phone_index.phone = phone_digits;
  END IF;

  IF p_assigned_crm_name IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM "public"."crm_allocation" allocation
    LEFT JOIN "public"."crm_daily_availability" availability
      ON availability.branch_id = allocation.branch_id
      AND availability.crm_name = allocation.crm_name
      AND availability.date = CURRENT_DATE
    WHERE allocation.branch_id = target_branch
      AND allocation.crm_name = trim(p_assigned_crm_name)
      AND allocation.active
      AND COALESCE(availability.is_available, true)
  ) THEN
    RAISE EXCEPTION 'assigned CRM is not available for this branch today' USING ERRCODE = 'check_violation';
  END IF;

  LOOP
    generated_token := upper(to_char(CURRENT_DATE, 'MMDD') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));
    BEGIN
      INSERT INTO "public"."entry_queue" (token, client_name, mobile, branch_id, assigned_crm_name, status, client_id)
      VALUES (generated_token, canonical_name, phone_digits, target_branch, NULLIF(trim(p_assigned_crm_name), ''), 'pending', found_client)
      RETURNING entry_queue.id INTO id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
    END;
  END LOOP;

  RETURN QUERY SELECT id, generated_token, found_client,
    CASE WHEN found_client IS NULL THEN 'new' ELSE 'existing' END;
END;
$$;

DROP FUNCTION IF EXISTS "public"."browse_clients"(text, text, integer, integer);
CREATE OR REPLACE FUNCTION "public"."browse_clients"(
  search_text text,
  page_offset integer,
  result_limit integer
) RETURNS TABLE(
  client_id uuid,
  primary_name text,
  primary_phone text,
  city text,
  state text,
  total_visits integer,
  last_visit_date timestamptz,
  last_buy_status text
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH input AS (
    SELECT trim(COALESCE(search_text, '')) AS value,
      right(regexp_replace(COALESCE(search_text, ''), '[^0-9]', '', 'g'), 10) AS last10
  )
  SELECT c.client_id, c.primary_name::text, c.primary_phone::text, c.city::text,
    c.state::text, c.total_visits, c.last_visit_date, c.last_buy_status::text
  FROM "public"."clients" c, input
  WHERE "public"."current_user_role"() IS NOT NULL
    AND (
      input.value = ''
      OR c.primary_name ILIKE '%' || input.value || '%'
      OR EXISTS (SELECT 1 FROM unnest(c.other_names) name WHERE name ILIKE '%' || input.value || '%')
      OR (length(input.last10) = 10 AND EXISTS (
        SELECT 1 FROM "public"."client_phone_index" phone_index
        WHERE phone_index.client_id = c.client_id AND phone_index.phone = input.last10
      ))
    )
  ORDER BY c.last_visit_date DESC NULLS LAST, c.primary_name
  OFFSET GREATEST(page_offset, 0)
  LIMIT LEAST(GREATEST(result_limit, 1), 200);
$$;

REVOKE ALL ON FUNCTION "public"."create_entry_queue"(text, text, uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."create_entry_queue"(text, text, uuid, text, uuid) TO authenticated;
REVOKE ALL ON FUNCTION "public"."browse_clients"(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."browse_clients"(text, integer, integer) TO authenticated;

-- Keep the former potential filter callable for existing integrations only; the
-- Client Database no longer uses it, so it cannot change legacy defaults.
CREATE OR REPLACE FUNCTION "public"."browse_clients"(
  search_text text,
  potential_category text,
  page_offset integer,
  result_limit integer
) RETURNS TABLE(
  client_id uuid,
  primary_name text,
  primary_phone text,
  city text,
  state text,
  total_visits integer,
  last_visit_date timestamptz,
  last_buy_status text,
  client_potential_category text
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH input AS (
    SELECT trim(COALESCE(search_text, '')) AS value,
      right(regexp_replace(COALESCE(search_text, ''), '[^0-9]', '', 'g'), 10) AS last10,
      NULLIF(trim(potential_category), '') AS potential
  )
  SELECT client.client_id, client.primary_name::text, client.primary_phone::text,
    client.city::text, client.state::text, client.total_visits,
    client.last_visit_date, client.last_buy_status::text,
    client.client_potential_category::text
  FROM "public"."clients" client, input
  WHERE "public"."current_user_role"() IS NOT NULL
    AND (input.potential IS NULL OR client.client_potential_category = input.potential)
    AND (
      input.value = ''
      OR client.primary_name ILIKE '%' || input.value || '%'
      OR EXISTS (SELECT 1 FROM unnest(client.other_names) name WHERE name ILIKE '%' || input.value || '%')
      OR (length(input.last10) = 10 AND EXISTS (
        SELECT 1 FROM "public"."client_phone_index" phone_index
        WHERE phone_index.client_id = client.client_id AND phone_index.phone = input.last10
      ))
    )
  ORDER BY client.last_visit_date DESC NULLS LAST, client.primary_name
  OFFSET GREATEST(page_offset, 0)
  LIMIT LEAST(GREATEST(result_limit, 1), 200);
$$;
REVOKE ALL ON FUNCTION "public"."browse_clients"(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."browse_clients"(text, text, integer, integer) TO authenticated;
