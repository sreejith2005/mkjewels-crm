-- Proof files are uploaded before the visit RPC using proposed_client_id in
-- their storage path. The legacy-style transaction must create a new client
-- with that same ID, otherwise documents_storage_path_check correctly rejects
-- the proof metadata even though the Storage upload succeeded.
DO $$
DECLARE
  definition text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'submit_walkin_visit'
    AND pg_get_function_identity_arguments(p.oid) = 'p_payload jsonb';

  IF definition IS NULL THEN
    RAISE EXCEPTION 'submit_walkin_visit(jsonb) is missing';
  END IF;

  IF position('proposed_client_id' IN definition) = 0 THEN
    definition := replace(
      definition,
      'INSERT INTO "public"."clients" (primary_name, primary_phone,',
      'INSERT INTO "public"."clients" (client_id, primary_name, primary_phone,'
    );
    definition := replace(
      definition,
      'VALUES (trim(p_payload->>''primary_name''), phone_digits,',
      'VALUES (COALESCE(NULLIF(p_payload->>''proposed_client_id'', '''')::uuid, gen_random_uuid()), trim(p_payload->>''primary_name''), phone_digits,'
    );

    IF position('proposed_client_id' IN definition) = 0 THEN
      RAISE EXCEPTION 'could not align submit_walkin_visit with proposed_client_id';
    END IF;

    EXECUTE definition;
  END IF;
END $$;
