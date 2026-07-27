-- The queue already lets a super_admin choose any active branch.  Keep the
-- submission RPC aligned with that authorization without changing branch staff
-- access or rewriting the already-applied Phase 2 migration.
DO $$
DECLARE definition text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO definition
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'submit_walkin_visit'
    AND pg_get_function_identity_arguments(p.oid) = 'p_payload jsonb';

  IF definition IS NULL THEN
    RAISE EXCEPTION 'submit_walkin_visit(jsonb) is missing';
  END IF;

  definition := replace(
    definition,
    'IF target_branch IS NULL OR NOT "public"."is_branch_staff"(target_branch) THEN RAISE EXCEPTION ''you may only submit visits for your own branch'' USING ERRCODE = ''insufficient_privilege''; END IF;',
    'IF target_branch IS NULL OR (actor_role <> ''super_admin'' AND NOT "public"."is_branch_staff"(target_branch)) THEN RAISE EXCEPTION ''you may only submit visits for your own branch'' USING ERRCODE = ''insufficient_privilege''; END IF;'
  );

  EXECUTE definition;
END $$;
