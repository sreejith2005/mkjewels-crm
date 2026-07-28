-- Preserve the legacy master-row FOLLOW UP COUNT independently of history rows.
ALTER TABLE "public"."not_bought_followups" ADD COLUMN "followup_count" integer NOT NULL DEFAULT 0;
ALTER TABLE "public"."referral_calling" ADD COLUMN "followup_count" integer NOT NULL DEFAULT 0;
UPDATE "public"."not_bought_followups" AS f SET "followup_count" = counts.count FROM (SELECT followup_id, count(*)::integer AS count FROM "public"."not_bought_history" GROUP BY followup_id) AS counts WHERE counts.followup_id = f.id;
UPDATE "public"."referral_calling" AS c SET "followup_count" = counts.count FROM (SELECT referral_calling_id, count(*)::integer AS count FROM "public"."referral_calling_history" GROUP BY referral_calling_id) AS counts WHERE counts.referral_calling_id = c.id;

CREATE OR REPLACE FUNCTION "public"."record_not_bought_followup_update"()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW."status" IS NOT DISTINCT FROM OLD."status" AND NEW."call_response" IS NOT DISTINCT FROM OLD."call_response" AND NEW."remark" IS NOT DISTINCT FROM OLD."remark" AND NEW."next_followup_date" IS NOT DISTINCT FROM OLD."next_followup_date" THEN RETURN NEW; END IF;
  NEW."followup_count" := OLD."followup_count" + 1;
  INSERT INTO "public"."not_bought_history" ("followup_id","status","previous_status","remark","call_response","updated_by") VALUES (NEW."id",NEW."status",OLD."status",NEW."remark",NEW."call_response","auth"."uid"());
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION "public"."record_referral_calling_update"()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW."status" IS NOT DISTINCT FROM OLD."status" AND NEW."call_response" IS NOT DISTINCT FROM OLD."call_response" AND NEW."remark" IS NOT DISTINCT FROM OLD."remark" AND NEW."next_followup_date" IS NOT DISTINCT FROM OLD."next_followup_date" THEN RETURN NEW; END IF;
  NEW."followup_count" := OLD."followup_count" + 1;
  INSERT INTO "public"."referral_calling_history" ("referral_calling_id","status","previous_status","call_response","remark","updated_by") VALUES (NEW."id",NEW."status",OLD."status",NEW."call_response",NEW."remark","auth"."uid"());
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS "not_bought_followups_record_update" ON "public"."not_bought_followups";
CREATE TRIGGER "not_bought_followups_record_update" BEFORE UPDATE OF "status","call_response","remark","next_followup_date" ON "public"."not_bought_followups" FOR EACH ROW EXECUTE FUNCTION "public"."record_not_bought_followup_update"();
DROP TRIGGER IF EXISTS "referral_calling_record_update" ON "public"."referral_calling";
CREATE TRIGGER "referral_calling_record_update" BEFORE UPDATE OF "status","call_response","remark","next_followup_date" ON "public"."referral_calling" FOR EACH ROW EXECUTE FUNCTION "public"."record_referral_calling_update"();
