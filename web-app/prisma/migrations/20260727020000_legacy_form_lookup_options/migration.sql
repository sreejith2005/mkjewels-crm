-- Canonical legacy FORM DATA options. Forward-only and safe to re-run.
CREATE TABLE "public"."lookup_relations" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(), "label" varchar(160) NOT NULL,
  "active" boolean NOT NULL DEFAULT true, CONSTRAINT "lookup_relations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lookup_relations_label_key" UNIQUE ("label")
);
CREATE TABLE "public"."lookup_sugar_options" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(), "label" varchar(160) NOT NULL,
  "active" boolean NOT NULL DEFAULT true, CONSTRAINT "lookup_sugar_options_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lookup_sugar_options_label_key" UNIQUE ("label")
);
CREATE TABLE "public"."lookup_source_of_leads" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(), "label" varchar(160) NOT NULL,
  "active" boolean NOT NULL DEFAULT true, CONSTRAINT "lookup_source_of_leads_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lookup_source_of_leads_label_key" UNIQUE ("label")
);
CREATE INDEX "lookup_relations_active_label_idx" ON "public"."lookup_relations" ("active", "label");
CREATE INDEX "lookup_sugar_options_active_label_idx" ON "public"."lookup_sugar_options" ("active", "label");
CREATE INDEX "lookup_source_of_leads_active_label_idx" ON "public"."lookup_source_of_leads" ("active", "label");

ALTER TABLE "public"."lookup_relations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."lookup_sugar_options" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."lookup_source_of_leads" ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON "public"."lookup_relations", "public"."lookup_sugar_options", "public"."lookup_source_of_leads" TO authenticated;
GRANT ALL ON "public"."lookup_relations", "public"."lookup_sugar_options", "public"."lookup_source_of_leads" TO service_role;
CREATE POLICY "active_staff_read_lookup_relations" ON "public"."lookup_relations" FOR SELECT TO authenticated USING ("public"."current_user_role"() IS NOT NULL);
CREATE POLICY "active_staff_read_lookup_sugar_options" ON "public"."lookup_sugar_options" FOR SELECT TO authenticated USING ("public"."current_user_role"() IS NOT NULL);
CREATE POLICY "active_staff_read_lookup_source_of_leads" ON "public"."lookup_source_of_leads" FOR SELECT TO authenticated USING ("public"."current_user_role"() IS NOT NULL);
CREATE POLICY "super_admin_manage_lookup_relations" ON "public"."lookup_relations" FOR ALL TO authenticated USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_manage_lookup_sugar_options" ON "public"."lookup_sugar_options" FOR ALL TO authenticated USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());
CREATE POLICY "super_admin_manage_lookup_source_of_leads" ON "public"."lookup_source_of_leads" FOR ALL TO authenticated USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());

INSERT INTO "public"."lookup_relations" ("label") SELECT unnest(ARRAY['Friend','Husband','Wife','Father','Mother','Son','Daughter','Brother','Sister','Uncle','Aunt','Cousin','Neighbour','Colleague','Business Partner','Other','NA']) ON CONFLICT ("label") DO UPDATE SET "active" = true;
INSERT INTO "public"."lookup_sugar_options" ("label") SELECT unnest(ARRAY['No Sugar','Low Sugar','Normal Sugar','Extra Sugar','Other:']) ON CONFLICT ("label") DO UPDATE SET "active" = true;
INSERT INTO "public"."lookup_source_of_leads" ("label") SELECT unnest(ARRAY['Walk-in','Exhibition','Reference','Newspaper Advertisement','Instagram','WhatsApp','From Calling','Poll Banners','ChatGPT','Pinterest','Google Search','Existing Client','Ahmedabad Store','Bandra Store','Zaveri Bazar Store','Andheri Store']) ON CONFLICT ("label") DO UPDATE SET "active" = true;
INSERT INTO "public"."lookup_not_bought_reasons" ("label") SELECT unnest(ARRAY['Client Will Come With Family','Pricing Issue','Want to See More Designs','Want Ready Piece','Time to Think','Want to See Other Stores','Making Charges Concern','Budget Constraint','Specific Design Requirement','Purchase Planned at Another Branch','Price Enquiry Only','Product Not Available','Store Visit for Price Calculation','Other:','NA']) ON CONFLICT ("label") DO UPDATE SET "active" = true;
INSERT INTO "public"."lookup_beverages" ("label") SELECT unnest(ARRAY['Tea','Black Tea','Masala Tea','Green Tea','Lemon Tea','Coffee','Black Coffee','Cold Coffee','Apple Juice','Pineapple Juice','Orange Juice','Mosumbi Juice','Coconut Water','Coco Cola','Sprite','NA','Other:']) ON CONFLICT ("label") DO UPDATE SET "active" = true;
INSERT INTO "public"."lookup_snacks" ("label") SELECT unnest(ARRAY['Sev Puri','Sandwich','Vegetable','Grilled','Aloo Toast','Bhel Puri','Jain','French Fries','Burger','Pizza','Other:','NA']) ON CONFLICT ("label") DO UPDATE SET "active" = true;
INSERT INTO "public"."lookup_gifts" ("label") SELECT unnest(ARRAY['Diya','Umbrella','Black Pouch','Trolley Bag','Car Perfume','NA','Other:']) ON CONFLICT ("label") DO UPDATE SET "active" = true;
INSERT INTO "public"."lookup_communities" ("label") SELECT unnest(ARRAY['Agarwal','Bania','Bengali','Bhohra','Brahmin','Buddhist','Christian','Goan Christian','Gujarati','Hindu','Jain','Jat','Jewish','Kannada','Kayastha','Khoja','Malayali','Mangalorean Christian','Marathi','Marwadi','Memon','Muslim','Oswal','Parsi','Pathan','Punjabi','Rajput','Rajasthani','Sikh','Sindhi','South Indian','Tamil','Telugu','Tribal/Adivasi','Other:']) ON CONFLICT ("label") DO UPDATE SET "active" = true;
INSERT INTO "public"."lookup_product_categories" ("label") SELECT unnest(ARRAY['Bangle Gold','Bracelet Gold','Chain Gold','Diamond Bangles','Diamond Bracelet','Diamond Chains','Diamond Earring','Diamond Mangalsutra','Diamond Necklace Earring','Diamond Necklace Set','Diamond Nosepin','Diamond Pendant','Diamond Pendant Set','Diamond Pendant Set Earring','Diamond Ring','Diamond Tanmaniya','Earrings Gold','Mangalsutra Gold','Necklace Set Gold','Pendant Gold','Pendant Set Earring Gold','Pendant Set Gold','Rings Gold','Set Earring Gold','Set Gold','Silver Ring','Tanmanya Gold','Watch Gold','Gold Coin']) ON CONFLICT ("label") DO UPDATE SET "active" = true;

WITH roster(name, branch_name) AS (VALUES
 ('Shruti Vora','Bandra'),('Sravani Maharana','Bandra'),('Tehreem Ansari','Bandra'),('Mitu Patel','Bandra'),('Shruti Gaikwad','Bandra'),('Avishka Satpute','Bandra'),('Prapti Jadhav','Bandra'),('Anjali Mishra','Zaveri Bazar'),('Archana Chavan','Bandra'),('Ashwani Wadhwani','Bandra'),('Bhavna Shinde','Bandra'),('Bharat Soni','Bandra'),('Bhoomi Bhagat','Andheri'),('Deepa Bhosale','Bandra'),('Manisha Vengurlekar','Bandra'),('Neha Jaiswal','Bandra'),('Pooja Shigwan','Andheri'),('Pratiksha Gohil','Zaveri Bazar'),('Riya Mahto','Bandra'),('Uma Sehgal','Bandra'),('Vikas Gautam','Andheri'),('Shraddha Chandlekar','Bandra'),('Rajesh Pangariya','Bandra')
)
INSERT INTO "public"."crm_allocation" ("branch_id", "crm_name", "active")
SELECT b.id, r.name, true FROM roster r JOIN "public"."branches" b ON lower(b.name) = lower(r.branch_name)
ON CONFLICT ("branch_id", "crm_name") DO UPDATE SET "active" = true;
