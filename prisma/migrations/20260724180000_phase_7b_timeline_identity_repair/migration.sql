-- Phase 7b repair: a legacy reference number is not a unique visit identity.
-- Historical import idempotency is recorded in legacy_import_keys using the
-- source, normalized phone, visit date, and reference-number identity.
ALTER TABLE "public"."client_timeline"
  DROP CONSTRAINT IF EXISTS "client_timeline_reference_number_key";

CREATE INDEX IF NOT EXISTS "client_timeline_reference_number_idx"
  ON "public"."client_timeline" ("reference_number");
