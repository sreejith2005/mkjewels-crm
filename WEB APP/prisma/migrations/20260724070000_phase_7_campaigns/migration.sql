-- Phase 7: permanent campaign tagging. Forward-only; not applied by the 7a dry run.
CREATE TABLE "public"."campaigns" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" varchar(200) NOT NULL,
  "description" text,
  "created_at" timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" uuid,
  CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "campaigns_name_key" UNIQUE ("name"),
  CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL
);

CREATE TABLE "public"."client_campaign_tags" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "client_id" uuid NOT NULL,
  "campaign_id" uuid NOT NULL,
  "tagged_at" timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tagged_by" uuid,
  "note" text,
  CONSTRAINT "client_campaign_tags_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "client_campaign_tags_client_campaign_key" UNIQUE ("client_id", "campaign_id"),
  CONSTRAINT "client_campaign_tags_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("client_id") ON DELETE CASCADE,
  CONSTRAINT "client_campaign_tags_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE,
  CONSTRAINT "client_campaign_tags_tagged_by_fkey" FOREIGN KEY ("tagged_by") REFERENCES "public"."users"("id") ON DELETE SET NULL
);

CREATE INDEX "campaigns_created_at_idx" ON "public"."campaigns" ("created_at" DESC);
CREATE INDEX "campaigns_created_by_idx" ON "public"."campaigns" ("created_by");
CREATE INDEX "client_campaign_tags_campaign_tagged_at_idx" ON "public"."client_campaign_tags" ("campaign_id", "tagged_at" DESC);
CREATE INDEX "client_campaign_tags_tagged_by_idx" ON "public"."client_campaign_tags" ("tagged_by");

ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."client_campaign_tags" ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."campaigns", "public"."client_campaign_tags" TO authenticated;

CREATE POLICY "super_admin_all" ON "public"."campaigns" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "active_staff_read_campaigns" ON "public"."campaigns" FOR SELECT TO authenticated
USING ("public"."current_user_role"() IS NOT NULL);
CREATE POLICY "super_admin_all" ON "public"."client_campaign_tags" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "active_staff_read_campaign_tags" ON "public"."client_campaign_tags" FOR SELECT TO authenticated
USING ("public"."current_user_role"() IS NOT NULL);
CREATE POLICY "active_staff_apply_campaign_tags" ON "public"."client_campaign_tags" FOR INSERT TO authenticated
WITH CHECK ("public"."current_user_role"() IS NOT NULL AND "tagged_by" = "auth"."uid"());
CREATE POLICY "tagger_update_own_campaign_tags" ON "public"."client_campaign_tags" FOR UPDATE TO authenticated
USING ("tagged_by" = "auth"."uid"()) WITH CHECK ("tagged_by" = "auth"."uid"());
CREATE POLICY "tagger_delete_own_campaign_tags" ON "public"."client_campaign_tags" FOR DELETE TO authenticated
USING ("tagged_by" = "auth"."uid"());
