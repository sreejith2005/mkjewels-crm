-- Normalize every managed lookup label to the legacy uppercase convention.
-- The application stores these selections as text (rather than lookup foreign keys),
-- so references must be rewritten before duplicate catalog rows are removed.

CREATE OR REPLACE FUNCTION "public"."normalize_lookup_label"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW."label" := upper(btrim(NEW."label"));
  RETURN NEW;
END;
$$;

CREATE TEMP TABLE "lookup_label_canonicalization" (
  "lookup_table" text NOT NULL,
  "old_label" text NOT NULL,
  "canonical_label" text NOT NULL,
  "keep_id" uuid NOT NULL,
  PRIMARY KEY ("lookup_table", "old_label")
) ON COMMIT DROP;

-- Keep an existing uppercase row where possible; otherwise keep the oldest row.
INSERT INTO "lookup_label_canonicalization" ("lookup_table", "old_label", "canonical_label", "keep_id")
SELECT source.lookup_table, source.label, source.canonical_label, canonical.keep_id
FROM (
  SELECT 'lookup_communities'::text AS lookup_table, id, label, upper(btrim(label)) AS canonical_label FROM "public"."lookup_communities"
  UNION ALL SELECT 'lookup_relations', id, label, upper(btrim(label)) FROM "public"."lookup_relations"
  UNION ALL SELECT 'lookup_sugar_options', id, label, upper(btrim(label)) FROM "public"."lookup_sugar_options"
  UNION ALL SELECT 'lookup_source_of_leads', id, label, upper(btrim(label)) FROM "public"."lookup_source_of_leads"
  UNION ALL SELECT 'lookup_not_bought_reasons', id, label, upper(btrim(label)) FROM "public"."lookup_not_bought_reasons"
  UNION ALL SELECT 'lookup_beverages', id, label, upper(btrim(label)) FROM "public"."lookup_beverages"
  UNION ALL SELECT 'lookup_snacks', id, label, upper(btrim(label)) FROM "public"."lookup_snacks"
  UNION ALL SELECT 'lookup_gifts', id, label, upper(btrim(label)) FROM "public"."lookup_gifts"
  UNION ALL SELECT 'lookup_product_categories', id, label, upper(btrim(label)) FROM "public"."lookup_product_categories"
) AS source
JOIN LATERAL (
  SELECT candidate.id AS keep_id
  FROM (
    SELECT id, label
    FROM (
      SELECT 'lookup_communities'::text AS lookup_table, id, label, upper(btrim(label)) AS canonical_label FROM "public"."lookup_communities"
      UNION ALL SELECT 'lookup_relations', id, label, upper(btrim(label)) FROM "public"."lookup_relations"
      UNION ALL SELECT 'lookup_sugar_options', id, label, upper(btrim(label)) FROM "public"."lookup_sugar_options"
      UNION ALL SELECT 'lookup_source_of_leads', id, label, upper(btrim(label)) FROM "public"."lookup_source_of_leads"
      UNION ALL SELECT 'lookup_not_bought_reasons', id, label, upper(btrim(label)) FROM "public"."lookup_not_bought_reasons"
      UNION ALL SELECT 'lookup_beverages', id, label, upper(btrim(label)) FROM "public"."lookup_beverages"
      UNION ALL SELECT 'lookup_snacks', id, label, upper(btrim(label)) FROM "public"."lookup_snacks"
      UNION ALL SELECT 'lookup_gifts', id, label, upper(btrim(label)) FROM "public"."lookup_gifts"
      UNION ALL SELECT 'lookup_product_categories', id, label, upper(btrim(label)) FROM "public"."lookup_product_categories"
    ) AS all_lookups
    WHERE all_lookups.lookup_table = source.lookup_table
      AND all_lookups.canonical_label = source.canonical_label
  ) AS candidate
  ORDER BY (candidate.label = source.canonical_label) DESC, candidate.id
  LIMIT 1
) AS canonical ON true;

-- Repoint every persisted label reference before the duplicate catalog rows go away.
UPDATE "public"."clients" AS c
SET "community" = m."canonical_label"
FROM "lookup_label_canonicalization" AS m
WHERE m."lookup_table" = 'lookup_communities'
  AND lower(btrim(c."community")) = lower(btrim(m."old_label"));

UPDATE "public"."clients" AS c
SET "beverage" = m."canonical_label"
FROM "lookup_label_canonicalization" AS m
WHERE m."lookup_table" = 'lookup_beverages'
  AND lower(btrim(c."beverage")) = lower(btrim(m."old_label"));

UPDATE "public"."clients" AS c
SET "sugar" = m."canonical_label"
FROM "lookup_label_canonicalization" AS m
WHERE m."lookup_table" = 'lookup_sugar_options'
  AND lower(btrim(c."sugar")) = lower(btrim(m."old_label"));

UPDATE "public"."clients" AS c
SET "snack" = m."canonical_label"
FROM "lookup_label_canonicalization" AS m
WHERE m."lookup_table" = 'lookup_snacks'
  AND lower(btrim(c."snack")) = lower(btrim(m."old_label"));

UPDATE "public"."visit_forms" AS vf
SET "source_of_lead" = m."canonical_label"
FROM "lookup_label_canonicalization" AS m
WHERE m."lookup_table" = 'lookup_source_of_leads'
  AND lower(btrim(vf."source_of_lead")) = lower(btrim(m."old_label"));

UPDATE "public"."visit_forms" AS vf
SET "not_bought_reasons" = ARRAY(
  SELECT COALESCE(m."canonical_label", reason)
  FROM unnest(vf."not_bought_reasons") AS reason
  LEFT JOIN "lookup_label_canonicalization" AS m
    ON m."lookup_table" = 'lookup_not_bought_reasons'
   AND lower(btrim(reason)) = lower(btrim(m."old_label"))
)
WHERE EXISTS (
  SELECT 1
  FROM unnest(vf."not_bought_reasons") AS reason
  JOIN "lookup_label_canonicalization" AS m
    ON m."lookup_table" = 'lookup_not_bought_reasons'
   AND lower(btrim(reason)) = lower(btrim(m."old_label"))
);

UPDATE "public"."referrals" AS r
SET "relationship" = m."canonical_label"
FROM "lookup_label_canonicalization" AS m
WHERE m."lookup_table" = 'lookup_relations'
  AND lower(btrim(r."relationship")) = lower(btrim(m."old_label"));

-- Category, gift, and companion selections are stored in JSON/text arrays. Preserve
-- their structure while replacing only strings that match the relevant lookup labels.
UPDATE "public"."clients" AS c
SET "last_seen_categories" = ARRAY(SELECT COALESCE(m."canonical_label", value) FROM unnest(c."last_seen_categories") AS value LEFT JOIN "lookup_label_canonicalization" AS m ON m."lookup_table" = 'lookup_product_categories' AND lower(btrim(value)) = lower(btrim(m."old_label"))),
    "last_bought_categories" = ARRAY(SELECT COALESCE(m."canonical_label", value) FROM unnest(c."last_bought_categories") AS value LEFT JOIN "lookup_label_canonicalization" AS m ON m."lookup_table" = 'lookup_product_categories' AND lower(btrim(value)) = lower(btrim(m."old_label"))),
    "last_order_categories" = ARRAY(SELECT COALESCE(m."canonical_label", value) FROM unnest(c."last_order_categories") AS value LEFT JOIN "lookup_label_canonicalization" AS m ON m."lookup_table" = 'lookup_product_categories' AND lower(btrim(value)) = lower(btrim(m."old_label")))
WHERE EXISTS (SELECT 1 FROM unnest(c."last_seen_categories" || c."last_bought_categories" || c."last_order_categories") AS value JOIN "lookup_label_canonicalization" AS m ON m."lookup_table" = 'lookup_product_categories' AND lower(btrim(value)) = lower(btrim(m."old_label")));

UPDATE "public"."client_timeline" AS ct
SET "seen_categories" = ARRAY(SELECT COALESCE(m."canonical_label", value) FROM unnest(ct."seen_categories") AS value LEFT JOIN "lookup_label_canonicalization" AS m ON m."lookup_table" = 'lookup_product_categories' AND lower(btrim(value)) = lower(btrim(m."old_label"))),
    "bought_categories" = ARRAY(SELECT COALESCE(m."canonical_label", value) FROM unnest(ct."bought_categories") AS value LEFT JOIN "lookup_label_canonicalization" AS m ON m."lookup_table" = 'lookup_product_categories' AND lower(btrim(value)) = lower(btrim(m."old_label"))),
    "order_categories" = ARRAY(SELECT COALESCE(m."canonical_label", value) FROM unnest(ct."order_categories") AS value LEFT JOIN "lookup_label_canonicalization" AS m ON m."lookup_table" = 'lookup_product_categories' AND lower(btrim(value)) = lower(btrim(m."old_label")))
WHERE EXISTS (SELECT 1 FROM unnest(ct."seen_categories" || ct."bought_categories" || ct."order_categories") AS value JOIN "lookup_label_canonicalization" AS m ON m."lookup_table" = 'lookup_product_categories' AND lower(btrim(value)) = lower(btrim(m."old_label")));

-- Remove duplicate rows first, then rename the retained row. The original exact-label
-- unique constraint remains in place and the new normalized unique indexes prevent a recurrence.
DO $$
DECLARE lookup_table text;
BEGIN
  FOREACH lookup_table IN ARRAY ARRAY['lookup_communities','lookup_relations','lookup_sugar_options','lookup_source_of_leads','lookup_not_bought_reasons','lookup_beverages','lookup_snacks','lookup_gifts','lookup_product_categories']
  LOOP
    EXECUTE format('DELETE FROM public.%I AS target USING lookup_label_canonicalization AS m WHERE m.lookup_table = %L AND target.id <> m.keep_id AND lower(btrim(target.label)) = lower(btrim(m.old_label))', lookup_table, lookup_table);
    EXECUTE format('UPDATE public.%I AS target SET label = m.canonical_label FROM lookup_label_canonicalization AS m WHERE m.lookup_table = %L AND target.id = m.keep_id AND target.label IS DISTINCT FROM m.canonical_label', lookup_table, lookup_table);
    EXECUTE format('CREATE UNIQUE INDEX %I ON public.%I (upper(btrim(label)))', lookup_table || '_label_normalized_key', lookup_table);
    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE OF label ON public.%I FOR EACH ROW EXECUTE FUNCTION public.normalize_lookup_label()', lookup_table || '_normalize_label', lookup_table);
  END LOOP;
END;
$$;
