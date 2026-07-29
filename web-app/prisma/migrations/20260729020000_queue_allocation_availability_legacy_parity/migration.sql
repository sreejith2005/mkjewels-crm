-- Legacy queue/allocation parity. This is forward-only: normalize roster
-- comparisons, reset branch availability after roster mutation, and assign
-- registrations round-robin from the business-date available roster.

CREATE OR REPLACE FUNCTION "public"."normalize_crm_roster_value"(value text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT upper(regexp_replace(btrim(COALESCE(value, '')), '[[:space:]]+', ' ', 'g'))
$$;

-- Existing data is normalized before enforcing legacy-equivalent comparison.
UPDATE "public"."crm_allocation"
SET "crm_name" = "public"."normalize_crm_roster_value"("crm_name")
WHERE "crm_name" IS DISTINCT FROM "public"."normalize_crm_roster_value"("crm_name");

CREATE UNIQUE INDEX IF NOT EXISTS "crm_allocation_branch_normalized_name_key"
  ON "public"."crm_allocation" ("branch_id", "public"."normalize_crm_roster_value"("crm_name"));

CREATE TABLE IF NOT EXISTS "public"."crm_queue_round_robin" (
  "branch_id" uuid PRIMARY KEY REFERENCES "public"."branches"("id") ON DELETE CASCADE,
  "last_index" integer NOT NULL DEFAULT -1,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "public"."crm_queue_round_robin" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION "public"."assign_next_available_crm"(p_branch_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  crm_list text[];
  previous_index integer;
  next_index integer;
  actor_role "public"."user_role";
BEGIN
  actor_role := "public"."current_user_role"();
  IF actor_role IS NULL
    OR (actor_role <> 'super_admin' AND NOT "public"."is_branch_staff"(p_branch_id))
  THEN
    RAISE EXCEPTION 'an active branch you may write to is required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT array_agg(allocation.crm_name ORDER BY allocation.created_at, allocation.id)
  INTO crm_list
  FROM "public"."crm_allocation" allocation
  LEFT JOIN "public"."crm_daily_availability" availability
    ON availability.branch_id = allocation.branch_id
    AND "public"."normalize_crm_roster_value"(availability.crm_name) = "public"."normalize_crm_roster_value"(allocation.crm_name)
    AND availability.date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date
  WHERE allocation.branch_id = p_branch_id
    AND allocation.active
    AND COALESCE(availability.is_available, true);

  IF COALESCE(array_length(crm_list, 1), 0) = 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO "public"."crm_queue_round_robin" (branch_id, last_index)
  VALUES (p_branch_id, -1)
  ON CONFLICT (branch_id) DO NOTHING;
  SELECT last_index INTO previous_index
  FROM "public"."crm_queue_round_robin" WHERE branch_id = p_branch_id FOR UPDATE;
  next_index := (previous_index + 1) % array_length(crm_list, 1);
  UPDATE "public"."crm_queue_round_robin"
  SET last_index = next_index, updated_at = CURRENT_TIMESTAMP
  WHERE branch_id = p_branch_id;
  RETURN crm_list[next_index + 1];
END;
$$;

CREATE OR REPLACE FUNCTION "public"."manage_crm_roster"(
  p_operation text,
  p_roster_id uuid DEFAULT NULL,
  p_branch_id uuid DEFAULT NULL,
  p_crm_name text DEFAULT NULL,
  p_target_branch_id uuid DEFAULT NULL
) RETURNS TABLE(id uuid, branch_id uuid, crm_name text, active boolean, message text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  action text := upper(btrim(COALESCE(p_operation, '')));
  source_row "public"."crm_allocation"%ROWTYPE;
  target_branch uuid := COALESCE(p_target_branch_id, p_branch_id);
  normalized_name text := "public"."normalize_crm_roster_value"(p_crm_name);
  existing_id uuid;
  source_branch uuid;
  actor_role "public"."user_role";
BEGIN
  actor_role := "public"."current_user_role"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF action NOT IN ('ADD', 'UPDATE', 'DELETE') THEN RAISE EXCEPTION 'invalid roster action' USING ERRCODE = 'check_violation'; END IF;
  IF action <> 'DELETE' AND normalized_name = '' THEN RAISE EXCEPTION 'CRM NAME IS REQUIRED.' USING ERRCODE = 'check_violation'; END IF;

  IF action = 'ADD' THEN
    IF p_branch_id IS NULL OR NOT EXISTS (SELECT 1 FROM "public"."branches" branch WHERE branch.id = p_branch_id AND branch.active) THEN RAISE EXCEPTION 'BRANCH NAME IS REQUIRED.' USING ERRCODE = 'check_violation'; END IF;
    IF actor_role <> 'super_admin' AND NOT "public"."is_branch_manager"(p_branch_id) THEN RAISE EXCEPTION 'branch manager access is required' USING ERRCODE = 'insufficient_privilege'; END IF;
    INSERT INTO "public"."crm_allocation" (branch_id, crm_name, active) VALUES (p_branch_id, normalized_name, true)
    RETURNING * INTO source_row;
    DELETE FROM "public"."crm_daily_availability" availability WHERE availability.branch_id = p_branch_id;
    RETURN QUERY SELECT source_row.id, source_row.branch_id, source_row.crm_name::text, source_row.active, 'CRM / Branch added successfully.'::text;
    RETURN;
  END IF;

  SELECT * INTO source_row FROM "public"."crm_allocation" allocation WHERE allocation.id = p_roster_id;
  IF source_row.id IS NULL THEN RAISE EXCEPTION 'CRM NAME NOT FOUND IN THIS BRANCH.' USING ERRCODE = 'check_violation'; END IF;
  source_branch := source_row.branch_id;
  IF actor_role <> 'super_admin' AND NOT "public"."is_branch_manager"(source_row.branch_id) THEN RAISE EXCEPTION 'branch manager access is required' USING ERRCODE = 'insufficient_privilege'; END IF;

  IF action = 'DELETE' THEN
    DELETE FROM "public"."crm_allocation" allocation WHERE allocation.id = source_row.id;
    DELETE FROM "public"."crm_daily_availability" availability WHERE availability.branch_id = source_row.branch_id;
    RETURN QUERY SELECT source_row.id, source_row.branch_id, source_row.crm_name::text, false, 'CRM deleted successfully.'::text;
    RETURN;
  END IF;

  IF target_branch IS NULL OR NOT EXISTS (SELECT 1 FROM "public"."branches" branch WHERE branch.id = target_branch AND branch.active) THEN RAISE EXCEPTION 'NEW BRANCH NAME IS REQUIRED.' USING ERRCODE = 'check_violation'; END IF;
  IF actor_role <> 'super_admin' AND NOT "public"."is_branch_manager"(target_branch) THEN RAISE EXCEPTION 'branch manager access is required' USING ERRCODE = 'insufficient_privilege'; END IF;
  SELECT allocation.id INTO existing_id FROM "public"."crm_allocation" allocation
  WHERE allocation.branch_id = target_branch AND "public"."normalize_crm_roster_value"(allocation.crm_name) = normalized_name AND allocation.id <> source_row.id;
  IF existing_id IS NOT NULL THEN
    DELETE FROM "public"."crm_allocation" allocation WHERE allocation.id = source_row.id;
  ELSE
    UPDATE "public"."crm_allocation" allocation SET branch_id = target_branch, crm_name = normalized_name WHERE allocation.id = source_row.id RETURNING * INTO source_row;
  END IF;
  DELETE FROM "public"."crm_daily_availability" availability WHERE availability.branch_id IN (source_branch, target_branch);
  RETURN QUERY SELECT COALESCE(existing_id, source_row.id), target_branch, normalized_name, true, 'CRM / Branch updated successfully.'::text;
END;
$$;

DROP FUNCTION IF EXISTS "public"."create_entry_queue"(text, text, uuid, text, uuid);
CREATE OR REPLACE FUNCTION "public"."create_entry_queue"(
  p_client_name text, p_mobile text, p_branch_id uuid DEFAULT NULL,
  p_assigned_crm_name text DEFAULT NULL, p_client_id uuid DEFAULT NULL
) RETURNS TABLE(id uuid, token text, client_id uuid, client_type text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
#variable_conflict use_column
DECLARE
  actor_role "public"."user_role"; own_branch uuid; target_branch uuid; phone_digits text;
  generated_token text; found_client uuid; canonical_name text; assigned_crm text;
BEGIN
  actor_role := "public"."current_user_role"(); own_branch := "public"."current_user_branch_id"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  target_branch := CASE WHEN actor_role = 'super_admin' THEN p_branch_id ELSE own_branch END;
  IF target_branch IS NULL OR (actor_role <> 'super_admin' AND NOT "public"."is_branch_staff"(target_branch)) OR NOT EXISTS (SELECT 1 FROM "public"."branches" WHERE branches.id = target_branch AND active) THEN RAISE EXCEPTION 'an active branch you may write to is required' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF p_client_id IS NOT NULL THEN
    SELECT clients.client_id, clients.primary_name, clients.primary_phone INTO found_client, canonical_name, phone_digits FROM "public"."clients" WHERE clients.client_id = p_client_id;
    IF found_client IS NULL THEN RAISE EXCEPTION 'selected client is not available' USING ERRCODE = 'insufficient_privilege'; END IF;
  ELSE
    phone_digits := right(regexp_replace(COALESCE(p_mobile, ''), '[^0-9]', '', 'g'), 10); canonical_name := trim(COALESCE(p_client_name, ''));
    IF length(canonical_name) = 0 OR length(phone_digits) <> 10 THEN RAISE EXCEPTION 'client name and a 10-digit phone are required' USING ERRCODE = 'check_violation'; END IF;
    SELECT phone_index.client_id INTO found_client FROM "public"."client_phone_index" phone_index WHERE phone_index.phone = phone_digits;
  END IF;
  assigned_crm := NULLIF("public"."normalize_crm_roster_value"(p_assigned_crm_name), '');
  IF assigned_crm IS NULL THEN assigned_crm := "public"."assign_next_available_crm"(target_branch); END IF;
  IF assigned_crm IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "public"."crm_allocation" allocation LEFT JOIN "public"."crm_daily_availability" availability
      ON availability.branch_id = allocation.branch_id AND "public"."normalize_crm_roster_value"(availability.crm_name) = "public"."normalize_crm_roster_value"(allocation.crm_name)
      AND availability.date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date
    WHERE allocation.branch_id = target_branch AND "public"."normalize_crm_roster_value"(allocation.crm_name) = assigned_crm AND allocation.active AND COALESCE(availability.is_available, true)
  ) THEN RAISE EXCEPTION 'assigned CRM is not available for this branch today' USING ERRCODE = 'check_violation'; END IF;
  LOOP
    generated_token := upper(to_char(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata', 'MMDD') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));
    BEGIN INSERT INTO "public"."entry_queue" (token, client_name, mobile, branch_id, assigned_crm_name, status, client_id)
      VALUES (generated_token, canonical_name, phone_digits, target_branch, assigned_crm, 'pending', found_client) RETURNING entry_queue.id INTO id; EXIT;
    EXCEPTION WHEN unique_violation THEN END;
  END LOOP;
  RETURN QUERY SELECT id, generated_token, found_client, CASE WHEN found_client IS NULL THEN 'new' ELSE 'existing' END;
END;
$$;

REVOKE ALL ON FUNCTION "public"."normalize_crm_roster_value"(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."assign_next_available_crm"(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."manage_crm_roster"(text, uuid, uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."create_entry_queue"(text, text, uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."normalize_crm_roster_value"(text) TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."assign_next_available_crm"(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."manage_crm_roster"(text, uuid, uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."create_entry_queue"(text, text, uuid, text, uuid) TO authenticated;
