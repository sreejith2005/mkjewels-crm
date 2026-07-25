-- Legacy Google Apps Script walk-in bridge. All writes still run through
-- submit_walkin_visit so the app and legacy form share one merge/write path.
CREATE TABLE "public"."legacy_walkin_ingest_attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "request_id" uuid NOT NULL UNIQUE,
  "source_ip" varchar(64),
  "payload" jsonb NOT NULL,
  "payload_hash" varchar(64),
  "outcome" varchar(40) NOT NULL,
  "result" jsonb NOT NULL,
  "created_at" timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "legacy_walkin_ingest_attempts_created_at_idx"
  ON "public"."legacy_walkin_ingest_attempts" ("created_at" DESC);
CREATE INDEX "legacy_walkin_ingest_attempts_outcome_created_at_idx"
  ON "public"."legacy_walkin_ingest_attempts" ("outcome", "created_at" DESC);

CREATE TABLE "public"."legacy_walkin_ingest_rate_limits" (
  "bucket_start" timestamptz(0) NOT NULL,
  "key_name" varchar(80) NOT NULL,
  "request_count" integer NOT NULL DEFAULT 0,
  PRIMARY KEY ("bucket_start", "key_name")
);

CREATE OR REPLACE FUNCTION "public"."consume_legacy_walkin_ingest_rate_limit"(p_key_name text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  bucket timestamptz(0) := date_trunc('minute', CURRENT_TIMESTAMP);
  count_after integer;
BEGIN
  IF length(trim(COALESCE(p_key_name, ''))) = 0 OR length(p_key_name) > 80 THEN
    RAISE EXCEPTION 'invalid rate-limit key' USING ERRCODE = 'check_violation';
  END IF;
  INSERT INTO "public"."legacy_walkin_ingest_rate_limits" (bucket_start, key_name, request_count)
  VALUES (bucket, trim(p_key_name), 1)
  ON CONFLICT (bucket_start, key_name)
  DO UPDATE SET request_count = "legacy_walkin_ingest_rate_limits".request_count + 1
  RETURNING request_count INTO count_after;
  RETURN count_after <= 30;
END; $$;

CREATE OR REPLACE FUNCTION "public"."submit_legacy_walkin_visit"(p_payload jsonb)
RETURNS TABLE(client_id uuid, timeline_id uuid, reference_number text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  target_branch uuid;
  ingest_actor uuid;
  actor_email text;
  queue_token text;
  queue_id uuid;
BEGIN
  target_branch := NULLIF(p_payload->>'branch_id', '')::uuid;
  IF target_branch IS NULL OR NOT EXISTS (
    SELECT 1 FROM "public"."branches" WHERE id = target_branch AND active
  ) THEN
    RAISE EXCEPTION 'an active branch is required' USING ERRCODE = 'check_violation';
  END IF;

  actor_email := 'legacy-ingest+' || target_branch::text || '@internal.invalid';
  SELECT id INTO ingest_actor FROM "public"."users" WHERE email = actor_email;
  IF ingest_actor IS NULL THEN
    INSERT INTO "public"."users" (id, name, email, role, branch_id, active)
    VALUES (gen_random_uuid(), 'Legacy Apps Script Ingestion', actor_email, 'salesperson', target_branch, true)
    RETURNING id INTO ingest_actor;
  END IF;

  queue_token := NULLIF(p_payload->>'entry_queue_id', '');
  IF queue_token IS NOT NULL THEN
    SELECT id INTO queue_id
    FROM "public"."entry_queue"
    WHERE token = queue_token AND branch_id = target_branch;
    IF queue_id IS NULL THEN
      RAISE EXCEPTION 'legacy entry token does not belong to this branch' USING ERRCODE = 'check_violation';
    END IF;
    p_payload := jsonb_set(p_payload, '{entry_queue_id}', to_jsonb(queue_id::text));
  END IF;

  PERFORM set_config('request.jwt.claim.sub', ingest_actor::text, true);
  PERFORM set_config('app.audit_source', 'legacy_apps_script_ingest', true);
  RETURN QUERY SELECT * FROM "public"."submit_walkin_visit"(p_payload);
END; $$;

ALTER TABLE "public"."legacy_walkin_ingest_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."legacy_walkin_ingest_rate_limits" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_read_legacy_walkin_ingest_attempts"
  ON "public"."legacy_walkin_ingest_attempts" FOR SELECT TO authenticated
  USING ("public"."is_super_admin"());

REVOKE ALL ON FUNCTION "public"."consume_legacy_walkin_ingest_rate_limit"(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."submit_legacy_walkin_visit"(jsonb) FROM PUBLIC;
