-- Phase 7b: durable idempotency ledger for the one-time historical import.
-- This is intentionally separate from Phases 0-6 and records only import keys,
-- never application-runtime activity.
CREATE TABLE "public"."legacy_import_keys" (
  "source_key" text NOT NULL,
  "target_table" text NOT NULL,
  "target_id" text,
  "imported_at" timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "legacy_import_keys_pkey" PRIMARY KEY ("source_key")
);

CREATE INDEX "legacy_import_keys_target_table_idx"
  ON "public"."legacy_import_keys" ("target_table", "imported_at" DESC);
