-- Navigation and client-database parity. Forward-only change to the Phase 1 search contract.
DROP FUNCTION "public"."search_clients"(text, integer);
CREATE OR REPLACE FUNCTION "public"."search_clients"(search_text text, result_limit integer DEFAULT 8)
RETURNS TABLE(client_id uuid, primary_name text, primary_phone text, last_visit_date timestamptz, last_branch_name text, matched_phone text, total_visits integer, last_buy_status text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH input AS (SELECT trim(search_text) AS value, regexp_replace(search_text, '[^0-9]', '', 'g') AS digits)
  SELECT c.client_id, c.primary_name::text, c.primary_phone::text, c.last_visit_date, b.name::text, p.phone::text, c.total_visits, c.last_buy_status::text
  FROM "public"."clients" c LEFT JOIN "public"."branches" b ON b.id = c.last_branch_id
  LEFT JOIN LATERAL (SELECT pi.phone FROM "public"."client_phone_index" pi, input WHERE pi.client_id = c.client_id AND input.digits <> '' AND pi.phone LIKE '%' || right(input.digits, 10) || '%' ORDER BY (pi.phone = right(input.digits, 10)) DESC LIMIT 1) p ON true, input
  WHERE "public"."current_user_role"() IS NOT NULL AND ((length(input.digits) >= 3 AND p.phone IS NOT NULL) OR (length(input.value) >= 3 AND (c.primary_name ILIKE '%' || input.value || '%' OR EXISTS (SELECT 1 FROM unnest(c.other_names) name WHERE name ILIKE '%' || input.value || '%'))))
  ORDER BY (p.phone = right(input.digits, 10)) DESC NULLS LAST, c.last_visit_date DESC NULLS LAST, c.primary_name LIMIT LEAST(GREATEST(result_limit, 1), 20);
$$;

CREATE OR REPLACE FUNCTION "public"."browse_clients"(search_text text DEFAULT NULL, page_offset integer DEFAULT 0, result_limit integer DEFAULT 51)
RETURNS TABLE(client_id uuid, primary_name text, primary_phone text, city text, state text, total_visits integer, last_visit_date timestamptz, last_buy_status text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH input AS (SELECT trim(COALESCE(search_text, '')) AS value, right(regexp_replace(COALESCE(search_text, ''), '[^0-9]', '', 'g'), 10) AS digits)
  SELECT c.client_id, c.primary_name::text, c.primary_phone::text, c.city::text, c.state::text, c.total_visits, c.last_visit_date, c.last_buy_status::text
  FROM "public"."clients" c, input
  WHERE "public"."current_user_role"() IS NOT NULL AND (input.value = '' OR (length(input.digits) >= 3 AND EXISTS (SELECT 1 FROM "public"."client_phone_index" pi WHERE pi.client_id = c.client_id AND pi.phone LIKE '%' || input.digits || '%')) OR c.primary_name ILIKE '%' || input.value || '%' OR EXISTS (SELECT 1 FROM unnest(c.other_names) name WHERE name ILIKE '%' || input.value || '%'))
  ORDER BY c.last_visit_date DESC NULLS LAST, c.primary_name OFFSET GREATEST(page_offset, 0) LIMIT LEAST(GREATEST(result_limit, 1), 101);
$$;

REVOKE ALL ON FUNCTION "public"."browse_clients"(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."browse_clients"(text, integer, integer) TO authenticated;
