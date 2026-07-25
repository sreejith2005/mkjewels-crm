-- Fixed staff-facing potential tiers. Keep genuinely unknown historic labels intact
-- and record them for review rather than guessing or discarding data.
WITH normalized AS (
  SELECT client_id, client_potential_category AS original_value,
    regexp_replace(upper(trim(client_potential_category)), '[^A-Z0-9]+', ' ', 'g') AS normalized_value
  FROM "public"."clients"
  WHERE NULLIF(trim(client_potential_category), '') IS NOT NULL
), mapped AS (
  SELECT client_id, original_value, CASE normalized_value
    WHEN 'COLD' THEN 'Cold Lead' WHEN 'COLD LEAD' THEN 'Cold Lead' WHEN 'LOW' THEN 'Cold Lead' WHEN 'LOW LEAD' THEN 'Cold Lead'
    WHEN 'COOL' THEN 'Cool Lead' WHEN 'COOL LEAD' THEN 'Cool Lead'
    WHEN 'WARM' THEN 'Warm Lead' WHEN 'WARM LEAD' THEN 'Warm Lead'
    WHEN 'HOT' THEN 'Hot Lead' WHEN 'HOT LEAD' THEN 'Hot Lead' WHEN 'HIGH' THEN 'Hot Lead' WHEN 'HIGH LEAD' THEN 'Hot Lead'
    WHEN 'VIP' THEN 'VIP Lead' WHEN 'VIP LEAD' THEN 'VIP Lead'
    ELSE NULL
  END AS canonical_value
  FROM normalized
)
UPDATE "public"."clients" AS client
SET client_potential_category = mapped.canonical_value
FROM mapped
WHERE client.client_id = mapped.client_id
  AND mapped.canonical_value IS NOT NULL
  AND client.client_potential_category IS DISTINCT FROM mapped.canonical_value;

INSERT INTO "public"."client_edit_log" (client_id, source, field_name, old_value, new_value)
SELECT client_id, 'potential_category_standardization', 'client_potential_category_legacy_unmatched', to_jsonb(original_value),
  jsonb_build_object('legacy_value', original_value, 'note', 'Unmatched legacy potential category retained as-is; staff must select one of the five fixed tiers before changing it.')
FROM (
  SELECT client_id, client_potential_category AS original_value,
    regexp_replace(upper(trim(client_potential_category)), '[^A-Z0-9]+', ' ', 'g') AS normalized_value
  FROM "public"."clients"
  WHERE NULLIF(trim(client_potential_category), '') IS NOT NULL
) AS unmatched
WHERE unmatched.normalized_value NOT IN ('COLD', 'COLD LEAD', 'LOW', 'LOW LEAD', 'COOL', 'COOL LEAD', 'WARM', 'WARM LEAD', 'HOT', 'HOT LEAD', 'HIGH', 'HIGH LEAD', 'VIP', 'VIP LEAD')
  AND NOT EXISTS (
    SELECT 1 FROM "public"."client_edit_log" AS audit
    WHERE audit.client_id = unmatched.client_id AND audit.source = 'potential_category_standardization' AND audit.field_name = 'client_potential_category_legacy_unmatched'
  );

CREATE OR REPLACE FUNCTION "public"."validate_client_potential_category"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = '' AS $$
BEGIN
  IF NEW.client_potential_category IS NULL OR (TG_OP = 'UPDATE' AND NEW.client_potential_category IS NOT DISTINCT FROM OLD.client_potential_category) THEN
    RETURN NEW;
  END IF;
  IF NEW.client_potential_category IN ('Cold Lead', 'Cool Lead', 'Warm Lead', 'Hot Lead', 'VIP Lead') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'client potential category must be one of: Cold Lead, Cool Lead, Warm Lead, Hot Lead, VIP Lead'
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS "clients_validate_potential_category" ON "public"."clients";
CREATE TRIGGER "clients_validate_potential_category"
BEFORE INSERT OR UPDATE OF client_potential_category ON "public"."clients"
FOR EACH ROW EXECUTE FUNCTION "public"."validate_client_potential_category"();

DROP FUNCTION IF EXISTS "public"."browse_clients"(text, integer, integer);
DROP FUNCTION IF EXISTS "public"."browse_clients"(text, text, integer, integer);
CREATE OR REPLACE FUNCTION "public"."browse_clients"(search_text text DEFAULT NULL, potential_category text DEFAULT NULL, page_offset integer DEFAULT 0, result_limit integer DEFAULT 51)
RETURNS TABLE(client_id uuid, primary_name text, primary_phone text, city text, state text, total_visits integer, last_visit_date timestamptz, last_buy_status text, client_potential_category text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH input AS (
    SELECT trim(COALESCE(search_text, '')) AS value,
      right(regexp_replace(COALESCE(search_text, ''), '[^0-9]', '', 'g'), 10) AS digits,
      NULLIF(trim(potential_category), '') AS potential
  )
  SELECT c.client_id, c.primary_name::text, c.primary_phone::text, c.city::text, c.state::text, c.total_visits, c.last_visit_date, c.last_buy_status::text, c.client_potential_category::text
  FROM "public"."clients" c, input
  WHERE "public"."current_user_role"() IS NOT NULL
    AND (input.potential IS NULL OR c.client_potential_category = input.potential)
    AND (input.value = '' OR (length(input.digits) >= 3 AND EXISTS (SELECT 1 FROM "public"."client_phone_index" pi WHERE pi.client_id = c.client_id AND pi.phone LIKE '%' || input.digits || '%')) OR c.primary_name ILIKE '%' || input.value || '%' OR EXISTS (SELECT 1 FROM unnest(c.other_names) name WHERE name ILIKE '%' || input.value || '%'))
  ORDER BY c.last_visit_date DESC NULLS LAST, c.primary_name
  OFFSET GREATEST(page_offset, 0) LIMIT LEAST(GREATEST(result_limit, 1), 101);
$$;

REVOKE ALL ON FUNCTION "public"."browse_clients"(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."browse_clients"(text, text, integer, integer) TO authenticated;
