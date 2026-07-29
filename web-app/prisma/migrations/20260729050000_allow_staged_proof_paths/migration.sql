-- Proof files are uploaded before submit, while the authoritative client is
-- resolved inside submit_walkin_visit.  The former check required Storage's
-- temporary first path segment to equal that resolved client and rejected a
-- valid file for an existing phone match.  Keep the security-relevant
-- guarantees: a UUID-shaped staging segment, the actual submitted timeline,
-- and the exact UUID-prefixed filename.  The documents foreign keys enforce
-- the authoritative client/timeline relationship.
ALTER TABLE "public"."documents"
DROP CONSTRAINT "documents_storage_path_check";

ALTER TABLE "public"."documents"
ADD CONSTRAINT "documents_storage_path_check"
CHECK (
  array_length(string_to_array("storage_path", '/'), 1) = 3
  AND split_part("storage_path", '/', 1)
    ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND split_part("storage_path", '/', 2) = COALESCE(
    "client_timeline_id"::text,
    'general'
  )
  AND split_part("storage_path", '/', 3)
    ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}_.+$'
  AND substring(split_part("storage_path", '/', 3) FROM 38) = "file_name"
);
