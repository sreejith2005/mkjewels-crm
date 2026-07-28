-- Phase 7a corrective: permanent pincode lookup. Forward-only; dry-run does not apply it.
CREATE TABLE "public"."lookup_pincodes" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "pincode" varchar(12) NOT NULL,
  "city" varchar(160),
  "state" varchar(100),
  "country" varchar(100),
  "active" boolean NOT NULL DEFAULT true,
  CONSTRAINT "lookup_pincodes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lookup_pincodes_pincode_key" UNIQUE ("pincode")
);

CREATE INDEX "lookup_pincodes_active_pincode_idx" ON "public"."lookup_pincodes" ("active", "pincode");
CREATE INDEX "lookup_pincodes_city_idx" ON "public"."lookup_pincodes" ("city");

ALTER TABLE "public"."lookup_pincodes" ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."lookup_pincodes" TO authenticated;
CREATE POLICY "super_admin_all" ON "public"."lookup_pincodes" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "active_users_read_lookup_pincodes" ON "public"."lookup_pincodes" FOR SELECT TO authenticated
USING ("public"."current_user_role"() IS NOT NULL);
