-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('super_admin', 'branch_manager', 'salesperson');

-- CreateEnum
CREATE TYPE "buy_status" AS ENUM (
    'ORDER_PLACED',
    'ORDER_PICKUP',
    'REPAIR_PLACED',
    'REPAIR_PICKUP',
    'PRODUCT_RETURN',
    'PRODUCT_EXCHANGE',
    'STORE_VISIT',
    'PRICE_CALCULATION',
    'YES',
    'NO',
    'YES_AND_ORDER_PLACED',
    'ORDER_PLACED_AND_BUYING_NEW_PRODUCT',
    'ORDER_PLACED_AND_MAKING_NEW_ORDER',
    'ORDER_PICKUP_AND_BUYING_NEW_PRODUCT',
    'ORDER_PICKUP_AND_MAKING_NEW_ORDER',
    'REPAIR_PLACED_AND_BUYING_NEW_PRODUCT',
    'REPAIR_PLACED_AND_MAKING_NEW_ORDER',
    'REPAIR_PICKUP_AND_BUYING_NEW_PRODUCT',
    'REPAIR_PICKUP_AND_MAKING_NEW_ORDER'
);

-- CreateEnum
CREATE TYPE "event_type" AS ENUM (
    'UPSALE_VISIT',
    'READY_PRODUCT_PURCHASE',
    'ORDER_PLACED_VISIT',
    'ORDER_PICKUP_VISIT',
    'REPAIR_PLACED_VISIT',
    'REPAIR_PICKUP_VISIT',
    'PRODUCT_RETURN_VISIT',
    'PRODUCT_EXCHANGE_VISIT',
    'NON_PURCHASE_VISIT',
    'STORE_VISIT',
    'PRICE_CALCULATION_VISIT',
    'VISIT'
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "phone" VARCHAR(30),
    "email" VARCHAR(320) NOT NULL,
    "role" "user_role" NOT NULL,
    "branch_id" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "client_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "primary_name" VARCHAR(160) NOT NULL,
    "other_names" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primary_phone" VARCHAR(30) NOT NULL,
    "secondary_phone" VARCHAR(30),
    "billing_phone" VARCHAR(30),
    "other_known_phones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gender" VARCHAR(40),
    "country" VARCHAR(100),
    "state" VARCHAR(100),
    "city" VARCHAR(120),
    "city_other" VARCHAR(120),
    "pincode" VARCHAR(12),
    "address" TEXT,
    "community" VARCHAR(120),
    "community_other" VARCHAR(120),
    "dob" DATE,
    "anniversary" DATE,
    "beverage" VARCHAR(100),
    "sugar" VARCHAR(60),
    "snack" VARCHAR(100),
    "gift_history" JSONB,
    "total_visits" INTEGER NOT NULL DEFAULT 0,
    "total_purchase_visits" INTEGER NOT NULL DEFAULT 0,
    "total_non_purchase_visits" INTEGER NOT NULL DEFAULT 0,
    "total_repair_visits" INTEGER NOT NULL DEFAULT 0,
    "total_order_visits" INTEGER NOT NULL DEFAULT 0,
    "first_visit_date" TIMESTAMPTZ(6),
    "last_visit_date" TIMESTAMPTZ(6),
    "last_buy_status" "buy_status",
    "last_branch_id" UUID,
    "last_crm_name" VARCHAR(160),
    "last_salesperson_id" UUID,
    "last_remark" TEXT,
    "last_product_requirement" TEXT,
    "last_seen_categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_bought_categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_order_categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "client_potential_category" VARCHAR(120),
    "high_potential_reason" TEXT,
    "instagram_status" VARCHAR(80),
    "google_review_status" VARCHAR(80),
    "testimonial_status" VARCHAR(80),
    "referral_status" VARCHAR(80),
    "next_visit_date" DATE,
    "profile_updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profile_updated_by" UUID,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("client_id")
);

-- CreateTable
CREATE TABLE "client_phone_index" (
    "phone" VARCHAR(30) NOT NULL,
    "client_id" UUID NOT NULL,

    CONSTRAINT "client_phone_index_pkey" PRIMARY KEY ("phone")
);

-- CreateTable
CREATE TABLE "client_timeline" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client_id" UUID NOT NULL,
    "event_date" TIMESTAMPTZ(6) NOT NULL,
    "event_type" "event_type" NOT NULL DEFAULT 'VISIT',
    "buy_status" "buy_status",
    "branch_id" UUID NOT NULL,
    "crm_name" VARCHAR(160),
    "salesperson_id" UUID,
    "seen_categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bought_categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "order_categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "product_requirement" TEXT,
    "remark" TEXT,
    "reference_number" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_edit_log" (
    "id" BIGSERIAL NOT NULL,
    "client_id" UUID NOT NULL,
    "edited_by" UUID,
    "source" VARCHAR(100) NOT NULL DEFAULT 'database_trigger',
    "field_name" VARCHAR(120) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_edit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_forms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client_timeline_id" UUID NOT NULL,
    "companions" JSONB NOT NULL DEFAULT '[]',
    "category_details" JSONB NOT NULL DEFAULT '{}',
    "occupation" VARCHAR(120),
    "occupation_other" VARCHAR(160),
    "bridal_or_non_bridal" VARCHAR(40),
    "wedding_month" SMALLINT,
    "wedding_year" SMALLINT,
    "communication_preference" VARCHAR(80),
    "instagram_asked" BOOLEAN,
    "instagram_no_reason" TEXT,
    "instagram_proof_url" TEXT,
    "google_review_asked" BOOLEAN,
    "google_review_no_reason" TEXT,
    "google_review_proof_url" TEXT,
    "testimonial_asked" BOOLEAN,
    "testimonial_no_reason" TEXT,
    "testimonial_proof_url" TEXT,
    "thank_you_note_asked" BOOLEAN,
    "thank_you_note_no_reason" TEXT,
    "thank_you_note_proof_url" TEXT,
    "referrals_asked" BOOLEAN,
    "referrals_no_reason" TEXT,
    "referrals_proof_url" TEXT,
    "additional_fields" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client_id" UUID NOT NULL,
    "client_timeline_id" UUID,
    "uploaded_by" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_queue" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "token" VARCHAR(40) NOT NULL,
    "client_name" VARCHAR(160) NOT NULL,
    "mobile" VARCHAR(30) NOT NULL,
    "branch_id" UUID NOT NULL,
    "assigned_crm_name" VARCHAR(160),
    "status" VARCHAR(60) NOT NULL DEFAULT 'waiting',
    "full_form_timestamp" TIMESTAMPTZ(6),
    "client_id" UUID,
    "remark" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entry_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_allocation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "crm_name" VARCHAR(160) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_daily_availability" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "crm_name" VARCHAR(160) NOT NULL,
    "date" DATE NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_daily_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "not_bought_followups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client_id" UUID NOT NULL,
    "reference_number" VARCHAR(100),
    "status" VARCHAR(80) NOT NULL,
    "next_followup_date" DATE,
    "call_response" TEXT,
    "remark" TEXT,
    "entered_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "not_bought_followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "not_bought_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "followup_id" UUID NOT NULL,
    "status" VARCHAR(80) NOT NULL,
    "remark" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "not_bought_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "crm_name" VARCHAR(160),
    "salesperson_id" UUID NOT NULL,
    "given_by_client_id" UUID NOT NULL,
    "referral_name" VARCHAR(160) NOT NULL,
    "referral_number" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_calling" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referral_id" UUID NOT NULL,
    "status" VARCHAR(80) NOT NULL,
    "remark" TEXT,
    "next_followup_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_calling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_cities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "label" VARCHAR(160) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lookup_cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_communities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "label" VARCHAR(160) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lookup_communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_product_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "label" VARCHAR(160) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lookup_product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_beverages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "label" VARCHAR(160) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lookup_beverages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_snacks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "label" VARCHAR(160) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lookup_snacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_gifts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "label" VARCHAR(160) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lookup_gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_not_bought_reasons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "label" VARCHAR(160) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lookup_not_bought_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_name_key" ON "branches"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_branch_id_idx" ON "users"("branch_id");

-- CreateIndex
CREATE INDEX "users_role_active_idx" ON "users"("role", "active");

-- CreateIndex
CREATE INDEX "clients_primary_phone_idx" ON "clients"("primary_phone");

-- CreateIndex
CREATE INDEX "clients_last_branch_id_last_visit_date_idx" ON "clients"("last_branch_id", "last_visit_date");

-- CreateIndex
CREATE INDEX "clients_last_salesperson_id_idx" ON "clients"("last_salesperson_id");

-- CreateIndex
CREATE INDEX "clients_profile_updated_by_idx" ON "clients"("profile_updated_by");

-- CreateIndex
CREATE INDEX "clients_next_visit_date_idx" ON "clients"("next_visit_date");

-- CreateIndex
CREATE INDEX "client_phone_index_client_id_idx" ON "client_phone_index"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_timeline_id_client_id_key" ON "client_timeline"("id", "client_id");

-- CreateIndex
CREATE INDEX "client_timeline_client_id_event_date_idx" ON "client_timeline"("client_id", "event_date" DESC);

-- CreateIndex
CREATE INDEX "client_timeline_branch_id_event_date_idx" ON "client_timeline"("branch_id", "event_date" DESC);

-- CreateIndex
CREATE INDEX "client_timeline_salesperson_id_event_date_idx" ON "client_timeline"("salesperson_id", "event_date" DESC);

-- CreateIndex
CREATE INDEX "client_timeline_reference_number_idx" ON "client_timeline"("reference_number");

-- CreateIndex
CREATE INDEX "client_edit_log_client_id_created_at_idx" ON "client_edit_log"("client_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "client_edit_log_edited_by_idx" ON "client_edit_log"("edited_by");

-- CreateIndex
CREATE UNIQUE INDEX "visit_forms_client_timeline_id_key" ON "visit_forms"("client_timeline_id");

-- CreateIndex
CREATE INDEX "visit_forms_occupation_idx" ON "visit_forms"("occupation");

-- CreateIndex
CREATE INDEX "visit_forms_bridal_or_non_bridal_wedding_year_wedding_month_idx" ON "visit_forms"("bridal_or_non_bridal", "wedding_year", "wedding_month");

-- CreateIndex
CREATE UNIQUE INDEX "documents_storage_path_key" ON "documents"("storage_path");

-- CreateIndex
CREATE INDEX "documents_client_id_created_at_idx" ON "documents"("client_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "documents_client_timeline_id_idx" ON "documents"("client_timeline_id");

-- CreateIndex
CREATE INDEX "documents_uploaded_by_idx" ON "documents"("uploaded_by");

-- CreateIndex
CREATE UNIQUE INDEX "entry_queue_token_key" ON "entry_queue"("token");

-- CreateIndex
CREATE INDEX "entry_queue_branch_id_status_created_at_idx" ON "entry_queue"("branch_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "entry_queue_client_id_idx" ON "entry_queue"("client_id");

-- CreateIndex
CREATE INDEX "crm_allocation_branch_id_active_idx" ON "crm_allocation"("branch_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "crm_allocation_branch_id_crm_name_key" ON "crm_allocation"("branch_id", "crm_name");

-- CreateIndex
CREATE INDEX "crm_daily_availability_branch_id_date_is_available_idx" ON "crm_daily_availability"("branch_id", "date", "is_available");

-- CreateIndex
CREATE UNIQUE INDEX "crm_daily_availability_branch_id_crm_name_date_key" ON "crm_daily_availability"("branch_id", "crm_name", "date");

-- CreateIndex
CREATE INDEX "not_bought_followups_client_id_created_at_idx" ON "not_bought_followups"("client_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "not_bought_followups_status_next_followup_date_idx" ON "not_bought_followups"("status", "next_followup_date");

-- CreateIndex
CREATE INDEX "not_bought_followups_entered_by_idx" ON "not_bought_followups"("entered_by");

-- CreateIndex
CREATE INDEX "not_bought_followups_reference_number_idx" ON "not_bought_followups"("reference_number");

-- CreateIndex
CREATE INDEX "not_bought_history_followup_id_created_at_idx" ON "not_bought_history"("followup_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "referrals_salesperson_id_created_at_idx" ON "referrals"("salesperson_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "referrals_given_by_client_id_idx" ON "referrals"("given_by_client_id");

-- CreateIndex
CREATE INDEX "referrals_referral_number_idx" ON "referrals"("referral_number");

-- CreateIndex
CREATE INDEX "referral_calling_referral_id_created_at_idx" ON "referral_calling"("referral_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "referral_calling_status_next_followup_date_idx" ON "referral_calling"("status", "next_followup_date");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_cities_label_key" ON "lookup_cities"("label");

-- CreateIndex
CREATE INDEX "lookup_cities_active_label_idx" ON "lookup_cities"("active", "label");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_communities_label_key" ON "lookup_communities"("label");

-- CreateIndex
CREATE INDEX "lookup_communities_active_label_idx" ON "lookup_communities"("active", "label");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_product_categories_label_key" ON "lookup_product_categories"("label");

-- CreateIndex
CREATE INDEX "lookup_product_categories_active_label_idx" ON "lookup_product_categories"("active", "label");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_beverages_label_key" ON "lookup_beverages"("label");

-- CreateIndex
CREATE INDEX "lookup_beverages_active_label_idx" ON "lookup_beverages"("active", "label");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_snacks_label_key" ON "lookup_snacks"("label");

-- CreateIndex
CREATE INDEX "lookup_snacks_active_label_idx" ON "lookup_snacks"("active", "label");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_gifts_label_key" ON "lookup_gifts"("label");

-- CreateIndex
CREATE INDEX "lookup_gifts_active_label_idx" ON "lookup_gifts"("active", "label");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_not_bought_reasons_label_key" ON "lookup_not_bought_reasons"("label");

-- CreateIndex
CREATE INDEX "lookup_not_bought_reasons_active_label_idx" ON "lookup_not_bought_reasons"("active", "label");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_last_branch_id_fkey" FOREIGN KEY ("last_branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_last_salesperson_id_fkey" FOREIGN KEY ("last_salesperson_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_profile_updated_by_fkey" FOREIGN KEY ("profile_updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_phone_index" ADD CONSTRAINT "client_phone_index_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_timeline" ADD CONSTRAINT "client_timeline_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_timeline" ADD CONSTRAINT "client_timeline_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_timeline" ADD CONSTRAINT "client_timeline_salesperson_id_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_edit_log" ADD CONSTRAINT "client_edit_log_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_edit_log" ADD CONSTRAINT "client_edit_log_edited_by_fkey" FOREIGN KEY ("edited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_forms" ADD CONSTRAINT "visit_forms_client_timeline_id_fkey" FOREIGN KEY ("client_timeline_id") REFERENCES "client_timeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_client_timeline_id_client_id_fkey" FOREIGN KEY ("client_timeline_id", "client_id") REFERENCES "client_timeline"("id", "client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_queue" ADD CONSTRAINT "entry_queue_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_queue" ADD CONSTRAINT "entry_queue_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_allocation" ADD CONSTRAINT "crm_allocation_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_daily_availability" ADD CONSTRAINT "crm_daily_availability_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "not_bought_followups" ADD CONSTRAINT "not_bought_followups_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "not_bought_followups" ADD CONSTRAINT "not_bought_followups_entered_by_fkey" FOREIGN KEY ("entered_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "not_bought_history" ADD CONSTRAINT "not_bought_history_followup_id_fkey" FOREIGN KEY ("followup_id") REFERENCES "not_bought_followups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_salesperson_id_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_given_by_client_id_fkey" FOREIGN KEY ("given_by_client_id") REFERENCES "clients"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_calling" ADD CONSTRAINT "referral_calling_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Domain checks that Prisma cannot express.
ALTER TABLE "users"
ADD CONSTRAINT "users_role_branch_check"
CHECK (
    ("role" = 'super_admin' AND "branch_id" IS NULL)
    OR ("role" <> 'super_admin' AND "branch_id" IS NOT NULL)
);

ALTER TABLE "visit_forms"
ADD CONSTRAINT "visit_forms_companions_check"
CHECK (
    jsonb_typeof("companions") = 'array'
    AND jsonb_array_length("companions") <= 10
),
ADD CONSTRAINT "visit_forms_category_details_check"
CHECK (jsonb_typeof("category_details") = 'object'),
ADD CONSTRAINT "visit_forms_additional_fields_check"
CHECK (jsonb_typeof("additional_fields") = 'object'),
ADD CONSTRAINT "visit_forms_wedding_month_check"
CHECK ("wedding_month" IS NULL OR "wedding_month" BETWEEN 1 AND 12),
ADD CONSTRAINT "visit_forms_wedding_year_check"
CHECK ("wedding_year" IS NULL OR "wedding_year" BETWEEN 2000 AND 2200);

ALTER TABLE "documents"
ADD CONSTRAINT "documents_file_name_check"
CHECK (
    length("file_name") > 0
    AND position('/' IN "file_name") = 0
),
ADD CONSTRAINT "documents_storage_path_check"
CHECK (
    array_length(string_to_array("storage_path", '/'), 1) = 3
    AND split_part("storage_path", '/', 1) = "client_id"::text
    AND split_part("storage_path", '/', 2) = COALESCE(
        "client_timeline_id"::text,
        'general'
    )
    AND split_part("storage_path", '/', 3)
        ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}_.+$'
    AND substring(split_part("storage_path", '/', 3) FROM 38) = "file_name"
);

-- Normalize all phone-index values to their last ten digits before the PK check.
CREATE OR REPLACE FUNCTION "public"."normalize_client_phone_index"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    digits text;
BEGIN
    digits := regexp_replace(NEW.phone, '[^0-9]', '', 'g');

    IF length(digits) < 10 THEN
        RAISE EXCEPTION 'phone must contain at least 10 digits'
            USING ERRCODE = 'check_violation';
    END IF;

    NEW.phone := right(digits, 10);
    RETURN NEW;
END;
$$;

CREATE TRIGGER "client_phone_index_normalize"
BEFORE INSERT OR UPDATE OF "phone" ON "public"."client_phone_index"
FOR EACH ROW
EXECUTE FUNCTION "public"."normalize_client_phone_index"();

ALTER TABLE "client_phone_index"
ADD CONSTRAINT "client_phone_index_normalized_phone_check"
CHECK ("phone" ~ '^[0-9]{10}$');

-- Write one field-level audit row for every changed clients column.
CREATE OR REPLACE FUNCTION "public"."audit_client_changes"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    changed_field text;
    actor_id uuid;
    audit_source text;
BEGIN
    actor_id := COALESCE(
        "auth"."uid"(),
        NEW.profile_updated_by
    );
    audit_source := COALESCE(
        NULLIF(current_setting('app.audit_source', true), ''),
        'database_trigger'
    );

    FOR changed_field IN
        SELECT new_fields.key
        FROM jsonb_each(to_jsonb(NEW)) AS new_fields
        WHERE (to_jsonb(OLD) -> new_fields.key)
            IS DISTINCT FROM
            (to_jsonb(NEW) -> new_fields.key)
    LOOP
        INSERT INTO "public"."client_edit_log" (
            "client_id",
            "edited_by",
            "source",
            "field_name",
            "old_value",
            "new_value"
        )
        VALUES (
            NEW.client_id,
            actor_id,
            audit_source,
            changed_field,
            to_jsonb(OLD) -> changed_field,
            to_jsonb(NEW) -> changed_field
        );
    END LOOP;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "clients_field_level_audit"
AFTER UPDATE ON "public"."clients"
FOR EACH ROW
EXECUTE FUNCTION "public"."audit_client_changes"();

-- Derive event_type before persistence and recalculate rollups after persistence.
-- The mapping order is intentional: combined up-sale statuses resolve to
-- UPSALE_VISIT while still counting in their order/repair rollup buckets.
CREATE OR REPLACE FUNCTION "public"."recalculate_client_rollups"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    latest_event "public"."client_timeline"%ROWTYPE;
BEGIN
    IF TG_WHEN = 'BEFORE' THEN
        NEW.event_type := CASE
            WHEN NEW.buy_status IN (
                'ORDER_PLACED_AND_BUYING_NEW_PRODUCT',
                'ORDER_PLACED_AND_MAKING_NEW_ORDER',
                'ORDER_PICKUP_AND_MAKING_NEW_ORDER',
                'ORDER_PICKUP_AND_BUYING_NEW_PRODUCT',
                'REPAIR_PICKUP_AND_BUYING_NEW_PRODUCT',
                'REPAIR_PICKUP_AND_MAKING_NEW_ORDER',
                'REPAIR_PLACED_AND_BUYING_NEW_PRODUCT',
                'REPAIR_PLACED_AND_MAKING_NEW_ORDER'
            ) THEN 'UPSALE_VISIT'::"public"."event_type"
            WHEN NEW.buy_status IN (
                'YES',
                'YES_AND_ORDER_PLACED'
            ) THEN 'READY_PRODUCT_PURCHASE'::"public"."event_type"
            WHEN NEW.buy_status = 'ORDER_PLACED'
                THEN 'ORDER_PLACED_VISIT'::"public"."event_type"
            WHEN NEW.buy_status = 'ORDER_PICKUP'
                THEN 'ORDER_PICKUP_VISIT'::"public"."event_type"
            WHEN NEW.buy_status = 'REPAIR_PLACED'
                THEN 'REPAIR_PLACED_VISIT'::"public"."event_type"
            WHEN NEW.buy_status = 'REPAIR_PICKUP'
                THEN 'REPAIR_PICKUP_VISIT'::"public"."event_type"
            WHEN NEW.buy_status = 'PRODUCT_RETURN'
                THEN 'PRODUCT_RETURN_VISIT'::"public"."event_type"
            WHEN NEW.buy_status = 'PRODUCT_EXCHANGE'
                THEN 'PRODUCT_EXCHANGE_VISIT'::"public"."event_type"
            WHEN NEW.buy_status = 'NO'
                THEN 'NON_PURCHASE_VISIT'::"public"."event_type"
            WHEN NEW.buy_status = 'STORE_VISIT'
                THEN 'STORE_VISIT'::"public"."event_type"
            WHEN NEW.buy_status = 'PRICE_CALCULATION'
                THEN 'PRICE_CALCULATION_VISIT'::"public"."event_type"
            ELSE 'VISIT'::"public"."event_type"
        END;

        RETURN NEW;
    END IF;

    SELECT timeline.*
    INTO latest_event
    FROM "public"."client_timeline" AS timeline
    WHERE timeline.client_id = NEW.client_id
    ORDER BY timeline.event_date DESC, timeline.created_at DESC, timeline.id DESC
    LIMIT 1;

    UPDATE "public"."clients" AS client
    SET
        total_visits = aggregates.total_visits,
        total_purchase_visits = aggregates.total_purchase_visits,
        total_non_purchase_visits = aggregates.total_non_purchase_visits,
        total_repair_visits = aggregates.total_repair_visits,
        total_order_visits = aggregates.total_order_visits,
        first_visit_date = aggregates.first_visit_date,
        last_visit_date = aggregates.last_visit_date,
        last_buy_status = latest_event.buy_status,
        last_branch_id = latest_event.branch_id,
        last_crm_name = latest_event.crm_name,
        last_salesperson_id = latest_event.salesperson_id,
        last_remark = latest_event.remark,
        last_product_requirement = latest_event.product_requirement,
        last_seen_categories = latest_event.seen_categories,
        last_bought_categories = latest_event.bought_categories,
        last_order_categories = latest_event.order_categories,
        profile_updated_at = now()
    FROM (
        SELECT
            count(*)::integer AS total_visits,
            count(*) FILTER (
                WHERE t.buy_status IN (
                    'YES',
                    'YES_AND_ORDER_PLACED'
                )
            )::integer AS total_purchase_visits,
            count(*) FILTER (
                WHERE t.buy_status IN (
                    'NO',
                    'PRODUCT_RETURN',
                    'STORE_VISIT',
                    'PRICE_CALCULATION'
                )
            )::integer AS total_non_purchase_visits,
            count(*) FILTER (
                WHERE t.buy_status::text LIKE 'REPAIR_PLACED%'
                   OR t.buy_status::text LIKE 'REPAIR_PICKUP%'
            )::integer AS total_repair_visits,
            count(*) FILTER (
                WHERE t.buy_status::text LIKE 'ORDER_PLACED%'
                   OR t.buy_status::text LIKE 'ORDER_PICKUP%'
            )::integer AS total_order_visits,
            min(t.event_date) AS first_visit_date,
            max(t.event_date) AS last_visit_date
        FROM "public"."client_timeline" AS t
        WHERE t.client_id = NEW.client_id
    ) AS aggregates
    WHERE client.client_id = NEW.client_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "client_timeline_derive_event_type"
BEFORE INSERT OR UPDATE OF "buy_status" ON "public"."client_timeline"
FOR EACH ROW
EXECUTE FUNCTION "public"."recalculate_client_rollups"();

CREATE TRIGGER "client_timeline_recalculate_rollups"
AFTER INSERT ON "public"."client_timeline"
FOR EACH ROW
EXECUTE FUNCTION "public"."recalculate_client_rollups"();

CREATE TRIGGER "client_timeline_recalculate_rollups_after_update"
AFTER UPDATE OF
    "event_date",
    "buy_status",
    "branch_id",
    "crm_name",
    "salesperson_id",
    "seen_categories",
    "bought_categories",
    "order_categories",
    "product_requirement",
    "remark"
ON "public"."client_timeline"
FOR EACH ROW
EXECUTE FUNCTION "public"."recalculate_client_rollups"();

-- Security-definer helpers prevent recursive users-table RLS evaluation.
CREATE OR REPLACE FUNCTION "public"."current_user_role"()
RETURNS "public"."user_role"
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT profile.role
    FROM "public"."users" AS profile
    WHERE profile.id = "auth"."uid"()
      AND profile.active = true
$$;

CREATE OR REPLACE FUNCTION "public"."current_user_branch_id"()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT profile.branch_id
    FROM "public"."users" AS profile
    WHERE profile.id = "auth"."uid"()
      AND profile.active = true
$$;

CREATE OR REPLACE FUNCTION "public"."is_super_admin"()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COALESCE("public"."current_user_role"() = 'super_admin', false)
$$;

CREATE OR REPLACE FUNCTION "public"."is_branch_staff"(row_branch_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COALESCE(
        "public"."current_user_role"() IN ('branch_manager', 'salesperson')
        AND "public"."current_user_branch_id"() = row_branch_id,
        false
    )
$$;

CREATE OR REPLACE FUNCTION "public"."is_branch_manager"(row_branch_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COALESCE(
        "public"."current_user_role"() = 'branch_manager'
        AND "public"."current_user_branch_id"() = row_branch_id,
        false
    )
$$;

CREATE OR REPLACE FUNCTION "public"."is_user_in_current_branch"(row_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COALESCE(
        EXISTS (
            SELECT 1
            FROM "public"."users" AS profile
            WHERE profile.id = row_user_id
              AND profile.active = true
              AND profile.branch_id = "public"."current_user_branch_id"()
        ),
        false
    )
$$;

CREATE OR REPLACE FUNCTION "public"."get_my_profile"()
RETURNS TABLE (
    "name" text,
    "role" "public"."user_role",
    "branch_name" text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT profile.name::text, profile.role, branch.name::text
    FROM "public"."users" AS profile
    LEFT JOIN "public"."branches" AS branch ON branch.id = profile.branch_id
    WHERE profile.id = "auth"."uid"()
      AND profile.active = true
$$;

REVOKE ALL ON FUNCTION "public"."current_user_role"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."current_user_branch_id"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."is_super_admin"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."is_branch_staff"(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."is_branch_manager"(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."is_user_in_current_branch"(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."get_my_profile"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."current_user_role"() TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."current_user_branch_id"() TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."is_super_admin"() TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."is_branch_staff"(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."is_branch_manager"(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."is_user_in_current_branch"(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."get_my_profile"() TO authenticated;

-- Enable RLS on every application table.
ALTER TABLE "branches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_phone_index" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_timeline" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_edit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "visit_forms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "entry_queue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_allocation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_daily_availability" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "not_bought_followups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "not_bought_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "referrals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "referral_calling" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lookup_cities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lookup_communities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lookup_product_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lookup_beverages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lookup_snacks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lookup_gifts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lookup_not_bought_reasons" ENABLE ROW LEVEL SECURITY;

-- Super admins can perform every operation on every application table.
CREATE POLICY "super_admin_all" ON "branches" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "users" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "clients" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "client_phone_index" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "client_timeline" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "client_edit_log" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "visit_forms" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "documents" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "entry_queue" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "crm_allocation" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "crm_daily_availability" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "not_bought_followups" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "not_bought_history" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "referrals" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "referral_calling" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "lookup_cities" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "lookup_communities" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "lookup_product_categories" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "lookup_beverages" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "lookup_snacks" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "lookup_gifts" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_all" ON "lookup_not_bought_reasons" FOR ALL TO authenticated
USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());

-- Branch managers can administer their branch and its users.
CREATE POLICY "branch_manager_own_branch" ON "branches" FOR ALL TO authenticated
USING ("public"."is_branch_manager"("id"))
WITH CHECK ("public"."is_branch_manager"("id"));

CREATE POLICY "branch_manager_own_users" ON "users" FOR ALL TO authenticated
USING ("public"."is_branch_manager"("branch_id"))
WITH CHECK ("public"."is_branch_manager"("branch_id"));

-- Allocation and availability remain writable only within the staff user's branch.
CREATE POLICY "branch_staff_own_allocations" ON "crm_allocation" FOR ALL TO authenticated
USING ("public"."is_branch_staff"("branch_id"))
WITH CHECK ("public"."is_branch_staff"("branch_id"));

CREATE POLICY "branch_staff_own_availability" ON "crm_daily_availability" FOR ALL TO authenticated
USING ("public"."is_branch_staff"("branch_id"))
WITH CHECK ("public"."is_branch_staff"("branch_id"));

-- Clients and their complete history are globally readable by all active CRM staff.
-- last_branch_id remains informational and is never used as an ownership boundary.
CREATE POLICY "active_staff_read_clients" ON "clients"
FOR SELECT TO authenticated
USING ("public"."current_user_role"() IS NOT NULL);

CREATE POLICY "active_staff_insert_clients" ON "clients"
FOR INSERT TO authenticated
WITH CHECK ("public"."current_user_role"() IS NOT NULL);

CREATE POLICY "active_staff_update_clients" ON "clients"
FOR UPDATE TO authenticated
USING ("public"."current_user_role"() IS NOT NULL)
WITH CHECK ("public"."current_user_role"() IS NOT NULL);

CREATE POLICY "active_staff_read_phone_index" ON "client_phone_index"
FOR SELECT TO authenticated
USING ("public"."current_user_role"() IS NOT NULL);

CREATE POLICY "active_staff_insert_phone_index" ON "client_phone_index"
FOR INSERT TO authenticated
WITH CHECK ("public"."current_user_role"() IS NOT NULL);

CREATE POLICY "active_staff_update_phone_index" ON "client_phone_index"
FOR UPDATE TO authenticated
USING ("public"."current_user_role"() IS NOT NULL)
WITH CHECK ("public"."current_user_role"() IS NOT NULL);

CREATE POLICY "active_staff_read_timeline" ON "client_timeline"
FOR SELECT TO authenticated
USING ("public"."current_user_role"() IS NOT NULL);

CREATE POLICY "branch_staff_insert_own_timeline" ON "client_timeline"
FOR INSERT TO authenticated
WITH CHECK ("public"."is_branch_staff"("branch_id"));

CREATE POLICY "branch_staff_update_own_timeline" ON "client_timeline"
FOR UPDATE TO authenticated
USING ("public"."is_branch_staff"("branch_id"))
WITH CHECK ("public"."is_branch_staff"("branch_id"));

CREATE POLICY "branch_staff_delete_own_timeline" ON "client_timeline"
FOR DELETE TO authenticated
USING ("public"."is_branch_staff"("branch_id"));

CREATE POLICY "active_staff_read_visit_forms" ON "visit_forms"
FOR SELECT TO authenticated
USING ("public"."current_user_role"() IS NOT NULL);

CREATE POLICY "branch_staff_insert_own_visit_forms" ON "visit_forms"
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "public"."client_timeline" AS timeline
        WHERE timeline.id = "visit_forms".client_timeline_id
          AND "public"."is_branch_staff"(timeline.branch_id)
    )
);

CREATE POLICY "branch_staff_update_own_visit_forms" ON "visit_forms"
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM "public"."client_timeline" AS timeline
        WHERE timeline.id = "visit_forms".client_timeline_id
          AND "public"."is_branch_staff"(timeline.branch_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "public"."client_timeline" AS timeline
        WHERE timeline.id = "visit_forms".client_timeline_id
          AND "public"."is_branch_staff"(timeline.branch_id)
    )
);

CREATE POLICY "branch_staff_delete_own_visit_forms" ON "visit_forms"
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM "public"."client_timeline" AS timeline
        WHERE timeline.id = "visit_forms".client_timeline_id
          AND "public"."is_branch_staff"(timeline.branch_id)
    )
);

CREATE POLICY "branch_staff_entry_queue" ON "entry_queue" FOR ALL TO authenticated
USING ("public"."is_branch_staff"("branch_id"))
WITH CHECK ("public"."is_branch_staff"("branch_id"));

CREATE POLICY "active_staff_read_followups" ON "not_bought_followups"
FOR SELECT TO authenticated
USING ("public"."current_user_role"() IS NOT NULL);

CREATE POLICY "branch_staff_write_own_followups" ON "not_bought_followups"
FOR ALL TO authenticated
USING ("public"."is_user_in_current_branch"("entered_by"))
WITH CHECK ("public"."is_user_in_current_branch"("entered_by"));

CREATE POLICY "active_staff_read_followup_history" ON "not_bought_history"
FOR SELECT TO authenticated
USING ("public"."current_user_role"() IS NOT NULL);

CREATE POLICY "branch_staff_write_own_followup_history" ON "not_bought_history"
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM "public"."not_bought_followups" AS followup
        WHERE followup.id = "not_bought_history".followup_id
          AND "public"."is_user_in_current_branch"(followup.entered_by)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "public"."not_bought_followups" AS followup
        WHERE followup.id = "not_bought_history".followup_id
          AND "public"."is_user_in_current_branch"(followup.entered_by)
    )
);

CREATE POLICY "active_staff_read_referrals" ON "referrals"
FOR SELECT TO authenticated
USING ("public"."current_user_role"() IS NOT NULL);

CREATE POLICY "branch_staff_write_own_referrals" ON "referrals"
FOR ALL TO authenticated
USING ("public"."is_user_in_current_branch"("salesperson_id"))
WITH CHECK ("public"."is_user_in_current_branch"("salesperson_id"));

CREATE POLICY "active_staff_read_referral_calling" ON "referral_calling"
FOR SELECT TO authenticated
USING ("public"."current_user_role"() IS NOT NULL);

CREATE POLICY "branch_staff_write_own_referral_calling" ON "referral_calling"
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM "public"."referrals" AS referral
        WHERE referral.id = "referral_calling".referral_id
          AND "public"."is_user_in_current_branch"(referral.salesperson_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM "public"."referrals" AS referral
        WHERE referral.id = "referral_calling".referral_id
          AND "public"."is_user_in_current_branch"(referral.salesperson_id)
    )
);

-- Audit rows remain trigger-owned but are globally readable with client history.
CREATE POLICY "active_staff_read_client_edit_log" ON "client_edit_log"
FOR SELECT TO authenticated
USING ("public"."current_user_role"() IS NOT NULL);

CREATE POLICY "active_staff_read_documents" ON "documents"
FOR SELECT TO authenticated
USING ("public"."current_user_role"() IS NOT NULL);

CREATE POLICY "active_staff_insert_documents" ON "documents"
FOR INSERT TO authenticated
WITH CHECK (
    "public"."current_user_role"() IS NOT NULL
    AND "uploaded_by" = "auth"."uid"()
);

CREATE POLICY "uploader_update_documents" ON "documents"
FOR UPDATE TO authenticated
USING ("uploaded_by" = "auth"."uid"())
WITH CHECK ("uploaded_by" = "auth"."uid"());

CREATE POLICY "uploader_delete_documents" ON "documents"
FOR DELETE TO authenticated
USING ("uploaded_by" = "auth"."uid"());

-- Global lookups are readable by all active CRM users; only super admins mutate them.
CREATE POLICY "active_users_read_lookup_cities" ON "lookup_cities"
FOR SELECT TO authenticated USING ("public"."current_user_role"() IS NOT NULL);
CREATE POLICY "active_users_read_lookup_communities" ON "lookup_communities"
FOR SELECT TO authenticated USING ("public"."current_user_role"() IS NOT NULL);
CREATE POLICY "active_users_read_lookup_product_categories" ON "lookup_product_categories"
FOR SELECT TO authenticated USING ("public"."current_user_role"() IS NOT NULL);
CREATE POLICY "active_users_read_lookup_beverages" ON "lookup_beverages"
FOR SELECT TO authenticated USING ("public"."current_user_role"() IS NOT NULL);
CREATE POLICY "active_users_read_lookup_snacks" ON "lookup_snacks"
FOR SELECT TO authenticated USING ("public"."current_user_role"() IS NOT NULL);
CREATE POLICY "active_users_read_lookup_gifts" ON "lookup_gifts"
FOR SELECT TO authenticated USING ("public"."current_user_role"() IS NOT NULL);
CREATE POLICY "active_users_read_lookup_not_bought_reasons" ON "lookup_not_bought_reasons"
FOR SELECT TO authenticated USING ("public"."current_user_role"() IS NOT NULL);

-- Supabase API roles need table privileges in addition to RLS policies.
GRANT USAGE ON SCHEMA "public" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "public" TO authenticated;

-- Private Supabase Storage bucket and object policies.
INSERT INTO "storage"."buckets" ("id", "name", "public")
VALUES ('crm-documents', 'crm-documents', false)
ON CONFLICT ("id") DO UPDATE
SET "name" = EXCLUDED."name", "public" = false;

CREATE POLICY "crm_documents_active_staff_read"
ON "storage"."objects"
FOR SELECT TO authenticated
USING (
    "bucket_id" = 'crm-documents'
    AND "public"."current_user_role"() IS NOT NULL
);

CREATE POLICY "crm_documents_active_staff_upload"
ON "storage"."objects"
FOR INSERT TO authenticated
WITH CHECK (
    "bucket_id" = 'crm-documents'
    AND "public"."current_user_role"() IS NOT NULL
    AND "owner_id" = "auth"."uid"()::text
    AND "name" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|general)/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}_.+$'
);

CREATE POLICY "crm_documents_uploader_or_admin_delete"
ON "storage"."objects"
FOR DELETE TO authenticated
USING (
    "bucket_id" = 'crm-documents'
    AND (
        "owner_id" = "auth"."uid"()::text
        OR "public"."is_super_admin"()
    )
);
