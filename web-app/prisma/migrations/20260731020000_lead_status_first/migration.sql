-- The first Lead question is its remote contact category, before the optional profile details.
UPDATE "public"."lead_form_fields"
SET "display_order" = CASE "field_key"
  WHEN 'status' THEN 25
  WHEN 'source_of_lead' THEN 26
  WHEN 'type_of_calling' THEN 27
  WHEN 'name_of_exhibition' THEN 28
  WHEN 'exhibition_name' THEN 29
  WHEN 'invitation_offer_name' THEN 30
  ELSE "display_order"
END
WHERE "field_key" IN ('status','source_of_lead','type_of_calling','name_of_exhibition','exhibition_name','invitation_offer_name');
