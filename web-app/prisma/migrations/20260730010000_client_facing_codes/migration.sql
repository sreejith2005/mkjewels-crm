-- UUIDs remain immutable database keys; staff use these short, unique codes.
CREATE SEQUENCE "public"."client_code_sequence" START WITH 102726;

ALTER TABLE "public"."clients" ADD COLUMN "client_code" text;

UPDATE "public"."clients"
SET "client_code" = 'MKC-' || nextval('"public"."client_code_sequence"')::text
WHERE "client_code" IS NULL;

ALTER TABLE "public"."clients"
  ALTER COLUMN "client_code" SET NOT NULL,
  ADD CONSTRAINT "clients_client_code_key" UNIQUE ("client_code"),
  ADD CONSTRAINT "clients_client_code_format_check" CHECK ("client_code" ~ '^MKC-[0-9]+$');

ALTER SEQUENCE "public"."client_code_sequence" OWNED BY "public"."clients"."client_code";

CREATE OR REPLACE FUNCTION "public"."assign_client_code"()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NULLIF(btrim(NEW."client_code"), '') IS NULL THEN
    NEW."client_code" := 'MKC-' || nextval('"public"."client_code_sequence"')::text;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "clients_assign_client_code"
  BEFORE INSERT ON "public"."clients"
  FOR EACH ROW EXECUTE FUNCTION "public"."assign_client_code"();

DROP FUNCTION IF EXISTS "public"."browse_clients"(text, integer, integer);
DROP FUNCTION IF EXISTS "public"."browse_clients"(text, text, integer, integer);
DROP FUNCTION IF EXISTS "public"."lookup_client_by_phone"(text);
CREATE OR REPLACE FUNCTION "public"."browse_clients"(
  search_text text, potential_category text, page_offset integer, result_limit integer
) RETURNS TABLE(
  client_id uuid, client_code text, primary_name text, primary_phone text,
  city text, state text, total_visits integer, last_visit_date timestamptz,
  last_buy_status text, client_potential_category text
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH input AS (
    SELECT trim(COALESCE(search_text, '')) AS value,
      right(regexp_replace(COALESCE(search_text, ''), '[^0-9]', '', 'g'), 10) AS last10,
      NULLIF(trim(potential_category), '') AS potential
  )
  SELECT client.client_id, client.client_code::text, client.primary_name::text,
    client.primary_phone::text, client.city::text, client.state::text,
    client.total_visits, client.last_visit_date, client.last_buy_status::text,
    client.client_potential_category::text
  FROM "public"."clients" client, input
  WHERE "public"."current_user_role"() IS NOT NULL
    AND (input.potential IS NULL OR client.client_potential_category = input.potential)
    AND (input.value = '' OR client.client_code ILIKE '%' || input.value || '%'
      OR client.primary_name ILIKE '%' || input.value || '%'
      OR EXISTS (SELECT 1 FROM unnest(client.other_names) name WHERE name ILIKE '%' || input.value || '%')
      OR (length(input.last10) = 10 AND EXISTS (
        SELECT 1 FROM "public"."client_phone_index" phone_index
        WHERE phone_index.client_id = client.client_id AND phone_index.phone = input.last10
      )))
  ORDER BY client.last_visit_date DESC NULLS LAST, client.primary_name
  OFFSET GREATEST(page_offset, 0)
  LIMIT LEAST(GREATEST(result_limit, 1), 200);
$$;

CREATE OR REPLACE FUNCTION "public"."browse_clients"(
  search_text text, page_offset integer, result_limit integer
) RETURNS TABLE(
  client_id uuid, client_code text, primary_name text, primary_phone text,
  city text, state text, total_visits integer, last_visit_date timestamptz,
  last_buy_status text
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT client_id, client_code, primary_name, primary_phone, city, state,
    total_visits, last_visit_date, last_buy_status
  FROM "public"."browse_clients"(search_text, NULL, page_offset, result_limit);
$$;

CREATE OR REPLACE FUNCTION "public"."lookup_client_by_phone"(p_phone text)
RETURNS TABLE(
  client_id uuid, client_code text, primary_name text, primary_phone text,
  gender text, dob date, community text, address text, pincode text,
  country text, state text, city text
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH input AS (
    SELECT right(regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g'), 10) AS phone
  )
  SELECT c.client_id, c.client_code::text, c.primary_name::text,
    c.primary_phone::text, c.gender::text, c.dob, c.community::text,
    c.address::text, c.pincode::text, c.country::text, c.state::text, c.city::text
  FROM "public"."client_phone_index" phone_index
  JOIN "public"."clients" c ON c.client_id = phone_index.client_id
  JOIN input ON input.phone = phone_index.phone
  WHERE length(input.phone) = 10
    AND "public"."current_user_role"() IS NOT NULL
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION "public"."browse_clients"(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."browse_clients"(text, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."lookup_client_by_phone"(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."browse_clients"(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."browse_clients"(text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."lookup_client_by_phone"(text) TO authenticated;
