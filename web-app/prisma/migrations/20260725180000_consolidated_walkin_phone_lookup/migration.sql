-- Consolidated walk-in workflow: authenticated, exact phone profile lookup.
-- SECURITY INVOKER deliberately preserves the active staff RLS boundary.
CREATE OR REPLACE FUNCTION "public"."lookup_client_by_phone"(p_phone text)
RETURNS TABLE(
  client_id uuid,
  primary_name text,
  primary_phone text,
  gender text,
  dob date,
  community text,
  address text,
  pincode text,
  country text,
  state text,
  city text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH input AS (
    SELECT right(regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g'), 10) AS phone
  )
  SELECT
    c.client_id,
    c.primary_name::text,
    c.primary_phone::text,
    c.gender::text,
    c.dob,
    c.community::text,
    c.address::text,
    c.pincode::text,
    c.country::text,
    c.state::text,
    c.city::text
  FROM "public"."client_phone_index" phone_index
  JOIN "public"."clients" c ON c.client_id = phone_index.client_id
  JOIN input ON input.phone = phone_index.phone
  WHERE length(input.phone) = 10
    AND "public"."current_user_role"() IS NOT NULL
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION "public"."lookup_client_by_phone"(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."lookup_client_by_phone"(text) TO authenticated;
