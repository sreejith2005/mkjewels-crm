-- A client may legitimately use the same number as their primary and billing
-- number.  The legacy walk-in form updates that profile on every visit, so the
-- index rebuild must retain one key for that client rather than inserting it
-- twice.  A number already owned by a different client still raises the unique
-- constraint violation and remains protected from accidental merging.
CREATE OR REPLACE FUNCTION "public"."sync_client_phone_index"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  phone_value text;
  normalized_phone text;
BEGIN
  DELETE FROM "public"."client_phone_index"
  WHERE client_id = NEW.client_id;

  FOREACH phone_value IN ARRAY array_cat(
    ARRAY[NEW.primary_phone, NEW.secondary_phone, NEW.billing_phone],
    COALESCE(NEW.other_known_phones, ARRAY[]::text[])
  ) LOOP
    normalized_phone := right(regexp_replace(COALESCE(phone_value, ''), '[^0-9]', '', 'g'), 10);
    IF length(normalized_phone) = 10
       AND NOT EXISTS (
         SELECT 1
         FROM "public"."client_phone_index"
         WHERE phone = normalized_phone
           AND client_id = NEW.client_id
       ) THEN
      INSERT INTO "public"."client_phone_index" (phone, client_id)
      VALUES (normalized_phone, NEW.client_id);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;
