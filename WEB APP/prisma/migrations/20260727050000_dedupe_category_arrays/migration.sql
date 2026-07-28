-- Preserve the first selection while preventing duplicate category labels from
-- reaching the canonical timeline or derived client profile arrays.
CREATE OR REPLACE FUNCTION "public"."dedupe_category_array"(p_values text[])
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT value
      FROM (
        SELECT btrim(value) AS value, min(ordinality) AS first_position
        FROM unnest(COALESCE(p_values, ARRAY[]::text[])) WITH ORDINALITY AS input(value, ordinality)
        WHERE btrim(value) <> ''
        GROUP BY btrim(value)
      ) AS distinct_values
      ORDER BY first_position
    ),
    ARRAY[]::text[]
  );
$$;

CREATE OR REPLACE FUNCTION "public"."dedupe_category_array_columns"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_TABLE_NAME = 'client_timeline' THEN
    NEW.seen_categories := "public"."dedupe_category_array"(NEW.seen_categories);
    NEW.bought_categories := "public"."dedupe_category_array"(NEW.bought_categories);
    NEW.order_categories := "public"."dedupe_category_array"(NEW.order_categories);
  ELSE
    NEW.last_seen_categories := "public"."dedupe_category_array"(NEW.last_seen_categories);
    NEW.last_bought_categories := "public"."dedupe_category_array"(NEW.last_bought_categories);
    NEW.last_order_categories := "public"."dedupe_category_array"(NEW.last_order_categories);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "client_timeline_dedupe_category_arrays"
BEFORE INSERT OR UPDATE OF "seen_categories", "bought_categories", "order_categories"
ON "public"."client_timeline"
FOR EACH ROW EXECUTE FUNCTION "public"."dedupe_category_array_columns"();

CREATE TRIGGER "clients_dedupe_category_arrays"
BEFORE UPDATE OF "last_seen_categories", "last_bought_categories", "last_order_categories"
ON "public"."clients"
FOR EACH ROW EXECUTE FUNCTION "public"."dedupe_category_array_columns"();
