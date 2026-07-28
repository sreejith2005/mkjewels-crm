-- Persist the referrals captured in a walk-in form's additional_fields payload.
-- This replaces the Phase 5 trigger forward-only, so the referral and its
-- calling row participate in the same transaction as submit_walkin_visit.
CREATE OR REPLACE FUNCTION "public"."create_referral_from_visit_form"()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  source_visit record;
  referral_item jsonb;
  v_referral_name text;
  v_normalized_phone text;
  new_referral_id uuid;
BEGIN
  SELECT timeline."client_id", timeline."branch_id", timeline."id" AS timeline_id,
         timeline."event_date", timeline."salesperson_id", timeline."crm_name"
  INTO source_visit
  FROM "public"."client_timeline" AS timeline
  WHERE timeline."id" = NEW."client_timeline_id";

  IF source_visit."client_id" IS NULL THEN
    RAISE EXCEPTION 'walk-in referral source visit is missing' USING ERRCODE = 'foreign_key_violation';
  END IF;

  -- Preserve the established single-referral capture path.
  IF NEW."referrals_asked" IS TRUE
     AND length(btrim(COALESCE(NEW."reference_name", ''))) > 0 THEN
    v_referral_name := btrim(NEW."reference_name");
    v_normalized_phone := right(regexp_replace(COALESCE(NEW."reference_phone", ''), '[^0-9]', '', 'g'), 10);
    IF length(v_normalized_phone) = 10 THEN
      INSERT INTO "public"."referrals" (
        "crm_name", "salesperson_id", "given_by_client_id", "referral_name", "referral_number",
        "branch_id", "source_timeline_id", "source_visit_form_id"
      )
      SELECT source_visit."crm_name", source_visit."salesperson_id", source_visit."client_id", v_referral_name, v_normalized_phone,
             source_visit."branch_id", source_visit."timeline_id", NEW."id"
      WHERE NOT EXISTS (
        SELECT 1 FROM "public"."referrals" AS existing
        WHERE existing."source_visit_form_id" = NEW."id"
          AND lower(btrim(existing."referral_name")) = lower(v_referral_name)
          AND existing."referral_number" = v_normalized_phone
      )
      RETURNING "id" INTO new_referral_id;
      IF new_referral_id IS NOT NULL THEN
        PERFORM "public"."create_referral_calling_if_open"(
          new_referral_id, v_referral_name, v_normalized_phone,
          "public"."next_business_day"(source_visit."event_date"::date)
        );
      END IF;
    END IF;
  END IF;

  IF NEW."additional_fields" ? 'referrals'
     AND jsonb_typeof(NEW."additional_fields"->'referrals') <> 'array' THEN
    RAISE EXCEPTION 'walk-in referrals must be an array' USING ERRCODE = 'check_violation';
  END IF;

  FOR referral_item IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(NEW."additional_fields"->'referrals', '[]'::jsonb))
  LOOP
    IF jsonb_typeof(referral_item) <> 'object' THEN
      RAISE EXCEPTION 'each walk-in referral must include a name and 10-digit phone' USING ERRCODE = 'check_violation';
    END IF;
    v_referral_name := btrim(COALESCE(referral_item->>'name', ''));
    v_normalized_phone := right(regexp_replace(COALESCE(referral_item->>'mobile', ''), '[^0-9]', '', 'g'), 10);
    IF length(v_referral_name) = 0 OR length(v_normalized_phone) <> 10 THEN
      RAISE EXCEPTION 'each walk-in referral requires a name and 10-digit phone' USING ERRCODE = 'check_violation';
    END IF;

    new_referral_id := NULL;
    INSERT INTO "public"."referrals" (
      "crm_name", "salesperson_id", "given_by_client_id", "referral_name", "referral_number",
      "branch_id", "source_timeline_id", "source_visit_form_id"
    )
    SELECT source_visit."crm_name", source_visit."salesperson_id", source_visit."client_id", v_referral_name, v_normalized_phone,
           source_visit."branch_id", source_visit."timeline_id", NEW."id"
    WHERE NOT EXISTS (
      SELECT 1 FROM "public"."referrals" AS existing
      WHERE existing."source_visit_form_id" = NEW."id"
        AND lower(btrim(existing."referral_name")) = lower(v_referral_name)
        AND existing."referral_number" = v_normalized_phone
    )
    RETURNING "id" INTO new_referral_id;

    IF new_referral_id IS NOT NULL THEN
      PERFORM "public"."create_referral_calling_if_open"(
        new_referral_id, v_referral_name, v_normalized_phone,
        "public"."next_business_day"(source_visit."event_date"::date)
      );
    END IF;
  END LOOP;

  RETURN NEW;
END; $$;
