-- Remote lead capture is intentionally separate from the queue-first walk-in flow.
CREATE TYPE "public"."lead_field_type" AS ENUM ('text', 'number', 'dropdown', 'date', 'geo', 'file');
CREATE TYPE "public"."lead_source_channel" AS ENUM ('open', 'contacted', 'converted', 'lost');
CREATE TYPE "public"."lead_created_via" AS ENUM ('crm_desktop', 'mobile_post_call');

CREATE TABLE "public"."lead_form_fields" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "field_key" text NOT NULL UNIQUE,
  "label" text NOT NULL,
  "field_type" "public"."lead_field_type" NOT NULL,
  "is_mandatory" boolean NOT NULL DEFAULT false,
  "is_hidden" boolean NOT NULL DEFAULT false,
  "display_order" integer NOT NULL,
  "is_runo_synced" boolean NOT NULL DEFAULT false,
  "runo_field_name" text,
  "parent_field_key" text REFERENCES "public"."lead_form_fields"("field_key") ON UPDATE RESTRICT ON DELETE RESTRICT,
  -- Points to an existing lookup table for options that must stay shared with walk-ins.
  "option_source" text,
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_form_fields_key_format" CHECK ("field_key" ~ '^[a-z][a-z0-9_]*$'),
  CONSTRAINT "lead_form_fields_runo_mapping" CHECK ((NOT "is_runo_synced") OR "runo_field_name" IS NOT NULL)
);

CREATE TABLE "public"."lead_form_field_options" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "field_id" uuid NOT NULL REFERENCES "public"."lead_form_fields"("id") ON DELETE CASCADE,
  "option_value" text NOT NULL,
  "display_order" integer NOT NULL,
  "triggers_field_key" text REFERENCES "public"."lead_form_fields"("field_key") ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT "lead_form_field_options_unique" UNIQUE ("field_id", "option_value")
);

CREATE TABLE "public"."leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "phone_number" varchar(30) NOT NULL UNIQUE,
  "name" varchar(160),
  "source_channel" "public"."lead_source_channel" NOT NULL DEFAULT 'open',
  "field_values" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_via" "public"."lead_created_via" NOT NULL DEFAULT 'crm_desktop',
  "created_by" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE RESTRICT,
  "branch_id" uuid REFERENCES "public"."branches"("id") ON DELETE SET NULL,
  "runo_pushed" boolean NOT NULL DEFAULT false,
  "runo_push_error" text,
  "runo_customer_id" text,
  "converted_to_client_id" uuid REFERENCES "public"."clients"("client_id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "leads_phone_normalized" CHECK ("phone_number" ~ '^[0-9]{10}$')
);

CREATE TABLE "public"."lead_stage_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lead_id" uuid NOT NULL REFERENCES "public"."leads"("id") ON DELETE CASCADE,
  "old_stage" "public"."lead_source_channel",
  "new_stage" "public"."lead_source_channel" NOT NULL,
  "changed_by" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE RESTRICT,
  "changed_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" text
);

CREATE INDEX "leads_branch_created_at_idx" ON "public"."leads"("branch_id", "created_at" DESC);
CREATE INDEX "leads_created_by_created_at_idx" ON "public"."leads"("created_by", "created_at" DESC);
CREATE INDEX "lead_stage_history_lead_changed_at_idx" ON "public"."lead_stage_history"("lead_id", "changed_at" DESC);

CREATE OR REPLACE FUNCTION "public"."set_lead_updated_at"() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW."updated_at" := CURRENT_TIMESTAMP; RETURN NEW; END;
$$;
CREATE TRIGGER "lead_form_fields_updated_at" BEFORE UPDATE ON "public"."lead_form_fields" FOR EACH ROW EXECUTE FUNCTION "public"."set_lead_updated_at"();
CREATE TRIGGER "leads_updated_at" BEFORE UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."set_lead_updated_at"();

ALTER TABLE "public"."lead_form_fields" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."lead_form_field_options" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."lead_stage_history" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "active_staff_read_lead_fields" ON "public"."lead_form_fields" FOR SELECT TO authenticated USING ("public"."current_user_role"() IS NOT NULL);
CREATE POLICY "super_admin_manage_lead_fields" ON "public"."lead_form_fields" FOR ALL TO authenticated USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "active_staff_read_lead_field_options" ON "public"."lead_form_field_options" FOR SELECT TO authenticated USING ("public"."current_user_role"() IS NOT NULL);
CREATE POLICY "super_admin_manage_lead_field_options" ON "public"."lead_form_field_options" FOR ALL TO authenticated USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "active_staff_read_leads" ON "public"."leads" FOR SELECT TO authenticated USING ("public"."current_user_role"() IS NOT NULL);
CREATE POLICY "active_staff_create_own_leads" ON "public"."leads" FOR INSERT TO authenticated WITH CHECK ("public"."current_user_role"() IS NOT NULL AND "created_by" = "auth"."uid"());
CREATE POLICY "creator_or_admin_update_leads" ON "public"."leads" FOR UPDATE TO authenticated USING ("created_by" = "auth"."uid"() OR "public"."is_super_admin"()) WITH CHECK ("created_by" = "auth"."uid"() OR "public"."is_super_admin"());
CREATE POLICY "super_admin_delete_leads" ON "public"."leads" FOR DELETE TO authenticated USING ("public"."is_super_admin"());
CREATE POLICY "active_staff_read_lead_stage_history" ON "public"."lead_stage_history" FOR SELECT TO authenticated USING ("public"."current_user_role"() IS NOT NULL);
CREATE POLICY "active_staff_create_own_lead_history" ON "public"."lead_stage_history" FOR INSERT TO authenticated WITH CHECK ("public"."current_user_role"() IS NOT NULL AND "changed_by" = "auth"."uid"());

-- Stable, Runo-sensitive configuration. option_source avoids duplicating shared lookup values.
INSERT INTO "public"."lead_form_fields" ("field_key","label","field_type","is_mandatory","display_order","is_runo_synced","runo_field_name","option_source") VALUES
('mobile_no','Mobile no','text',true,10,true,'mobile_no',NULL), ('name','Name','text',false,20,true,'name',NULL),
('address','Address','text',false,30,true,'address',NULL), ('country','Country','text',false,40,true,'country',NULL), ('pincode','Pincode','number',false,50,true,'pincode',NULL), ('state','State','text',false,60,true,'state',NULL), ('city','City','text',false,70,true,'city',NULL), ('alternate_name','Alternate name','text',false,80,true,'alternate_name',NULL),
('status','Status','dropdown',true,90,true,'status',NULL), ('source_of_lead','Source of lead','dropdown',true,100,true,'source_of_lead',NULL), ('type_of_calling','Type of calling','dropdown',true,110,true,'type_of_calling',NULL), ('name_of_exhibition','Name of exhibition','text',true,120,true,'name_of_exhibition',NULL), ('exhibition_name','Exhibition name','text',true,130,true,'exhibition_name',NULL), ('invitation_offer_name','Invitation offer name','text',true,140,true,'invitation_offer_name',NULL),
('gender','Gender','dropdown',true,150,true,'gender',NULL), ('date_of_birth','Date of birth','date',false,160,true,'date_of_birth',NULL), ('anniversary_date','Anniversary date','date',true,170,true,'anniversary_date',NULL), ('community_caste','Community / caste','dropdown',false,180,true,'community_caste','lookup_communities'), ('full_address','Full address','text',false,190,false,NULL,NULL), ('google_reviews','Google reviews','dropdown',false,200,false,NULL,NULL), ('testimonial','Testimonial','dropdown',false,210,false,NULL,NULL), ('instagram_followers','Instagram followers','dropdown',false,220,false,NULL,NULL), ('beverages','Beverages','dropdown',false,230,true,'beverages','lookup_beverages'), ('sugar_option','Sugar option','dropdown',false,240,true,'sugar_option','lookup_sugar_options'), ('snack_option','Snack option','dropdown',false,250,true,'snack_option','lookup_snacks'), ('gift_option','Gift option','dropdown',false,260,true,'gift_option','lookup_gifts')
ON CONFLICT ("field_key") DO NOTHING;

INSERT INTO "public"."lead_form_field_options" ("field_id","option_value","display_order","triggers_field_key")
SELECT f.id, v.value, v.sort, v.trigger FROM "public"."lead_form_fields" f JOIN (VALUES
('status','LEAD',1,'source_of_lead'),('status','CALLING',2,'type_of_calling'),('status','EXHIBITION',3,'name_of_exhibition'),
('source_of_lead','INSTAGRAM',1,NULL),('source_of_lead','WHATSAPP',2,NULL),('source_of_lead','INCOMING CALL',3,NULL),('source_of_lead','PERSONAL WHATSAPP',4,NULL),('source_of_lead','EXHIBITION',5,'name_of_exhibition'),
('type_of_calling','EXHIBITION CALLING',1,'exhibition_name'),('type_of_calling','INVITATION CALLING',2,'invitation_offer_name'),('type_of_calling','PERSONAL CALLING INVITATION',3,NULL),
('gender','Male',1,NULL),('gender','Female',2,NULL),('google_reviews','Yes',1,NULL),('google_reviews','No',2,NULL),('testimonial','Yes',1,NULL),('instagram_followers','Yes',1,NULL),('instagram_followers','No',2,NULL)
) AS v(key,value,sort,trigger) ON f.field_key=v.key
ON CONFLICT ("field_id","option_value") DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."lead_form_fields", "public"."lead_form_field_options", "public"."leads", "public"."lead_stage_history" TO authenticated;
