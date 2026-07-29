-- Forward-only correction of the Not Bought eligibility and save contracts.
-- Existing historical rows are deliberately not inferred or backfilled: only a
-- visit form with its real timeline source can create a reconciled follow-up.

CREATE OR REPLACE FUNCTION "public"."not_bought_followup_status_is_done"(p_status text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT upper(btrim(COALESCE(p_status, ''))) IN (
    'ALREADY PURCHASED FROM MK JEWELS',
    'ALREADY PURCHASED FROM ANOTHER JEWELLER',
    'NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)',
    'CALL NOT PICKED',
    'FOLLOW UP DONE',
    'CLOSED',
    'CONVERTED',
    'CONVERTED TO CLIENT'
  )
$$;

CREATE OR REPLACE FUNCTION "public"."create_not_bought_followup_from_visit_form"()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  source_visit record;
  legacy_status text;
  has_seen_product boolean;
  initial_remark text;
BEGIN
  SELECT timeline."client_id", timeline."branch_id", timeline."id" AS timeline_id,
         timeline."event_date", timeline."reference_number", timeline."salesperson_id",
         timeline."buy_status"::text AS buy_status, timeline."seen_categories",
         client."next_visit_date"
  INTO source_visit
  FROM "public"."client_timeline" AS timeline
  JOIN "public"."clients" AS client ON client."client_id" = timeline."client_id"
  WHERE timeline."id" = NEW."client_timeline_id";
  IF source_visit."client_id" IS NULL THEN RETURN NEW; END IF;

  -- New forms retain the literal legacy selection in additional_fields. Older
  -- source-linked forms have no such value, so their persisted timeline status
  -- is the only evidence used.
  legacy_status := upper(btrim(COALESCE(NULLIF(NEW."additional_fields"->>'visit_status', ''), source_visit."buy_status")));
  has_seen_product := EXISTS (
    SELECT 1 FROM unnest(COALESCE(source_visit."seen_categories", ARRAY[]::text[])) AS item(value)
    WHERE upper(btrim(item.value)) NOT IN ('', 'NA', 'N/A', '-', 'NONE')
  ) OR EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(COALESCE(NEW."category_details"->'seen_tags', '[]'::jsonb)) AS item(value)
    WHERE upper(btrim(item.value)) NOT IN ('', 'NA', 'N/A', '-', 'NONE')
  );

  IF legacy_status <> 'NO'
     AND NOT (
       legacy_status IN ('REPAIR_PICKUP', 'REPAIR_PLACED', 'ORDER_PICKUP', 'ORDER_PLACED')
       AND upper(btrim(COALESCE(NEW."repair_or_order_approach", ''))) = 'YES'
       AND has_seen_product
     ) THEN
    RETURN NEW;
  END IF;

  -- Literal legacy behaviour is one open parent row per client. The source
  -- links identify its actual visit; they are never manufactured for imports.
  IF EXISTS (
    SELECT 1 FROM "public"."not_bought_followups" AS existing
    WHERE existing."client_id" = source_visit."client_id"
      AND NOT "public"."not_bought_followup_status_is_done"(existing."status")
  ) THEN RETURN NEW; END IF;

  initial_remark := NULLIF(concat_ws('; ', array_to_string(NEW."not_bought_reasons", ', '), NEW."not_bought_other"), '');
  INSERT INTO "public"."not_bought_followups" (
    "client_id", "reference_number", "status", "next_followup_date", "remark", "entered_by",
    "branch_id", "source_timeline_id", "source_visit_form_id"
  ) VALUES (
    source_visit."client_id", source_visit."reference_number", 'PENDING',
    COALESCE(source_visit."next_visit_date", (source_visit."event_date" AT TIME ZONE 'Asia/Kolkata')::date),
    initial_remark, source_visit."salesperson_id", source_visit."branch_id", source_visit."timeline_id", NEW."id"
  );
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION "public"."save_not_bought_followup"(
  p_followup_id uuid,
  p_followup_status text,
  p_call_response text,
  p_next_followup_date date DEFAULT NULL,
  p_remark text DEFAULT NULL
) RETURNS "public"."not_bought_followups"
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor_role "public"."user_role"; target "public"."not_bought_followups"; normalized_status text;
BEGIN
  actor_role := "public"."current_user_role"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  SELECT * INTO target FROM "public"."not_bought_followups" WHERE id = p_followup_id FOR UPDATE;
  IF target.id IS NULL THEN RAISE EXCEPTION 'follow-up not found' USING ERRCODE = 'no_data_found'; END IF;
  IF NOT "public"."is_super_admin"() AND NOT "public"."is_branch_staff"(target.branch_id) THEN RAISE EXCEPTION 'you may only update follow-ups from your own branch' USING ERRCODE = 'insufficient_privilege'; END IF;
  normalized_status := upper(btrim(COALESCE(p_followup_status, '')));
  IF normalized_status NOT IN (
    'PENDING', 'CLIENT ASKED TO CALL LATER', 'INTERESTED - NEED FOLLOW UP',
    'NEGOTIATION / PRICE DISCUSSION', 'VISIT PLANNED', 'WHATSAPP SENT', 'NOT DECIDED YET',
    'ALREADY PURCHASED FROM MK JEWELS', 'ALREADY PURCHASED FROM ANOTHER JEWELLER',
    'NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)', 'CALL NOT PICKED',
    -- Safe compatibility for records written by the previous canonical RPC.
    'IN PROCESS', 'FOLLOW UP DONE'
  ) THEN RAISE EXCEPTION 'invalid follow-up status' USING ERRCODE = 'check_violation'; END IF;
  IF upper(btrim(COALESCE(p_call_response, ''))) NOT IN ('CONNECTED', 'NOT PICKED', 'SWITCHED OFF', 'WHATSAPP ONLY', 'WRONG NUMBER') THEN RAISE EXCEPTION 'invalid call response' USING ERRCODE = 'check_violation'; END IF;
  IF NOT "public"."not_bought_followup_status_is_done"(normalized_status)
     AND NULLIF(btrim(COALESCE(p_remark, '')), '') IS NULL THEN
    RAISE EXCEPTION 'follow-up remark is required unless done' USING ERRCODE = 'check_violation';
  END IF;
  UPDATE "public"."not_bought_followups"
  SET status = normalized_status,
      call_response = upper(btrim(p_call_response)),
      remark = CASE WHEN "public"."not_bought_followup_status_is_done"(normalized_status) THEN NULL ELSE NULLIF(btrim(p_remark), '') END,
      next_followup_date = CASE WHEN "public"."not_bought_followup_status_is_done"(normalized_status) THEN NULL ELSE p_next_followup_date END
  WHERE id = p_followup_id RETURNING * INTO target;
  RETURN target;
END; $$;

CREATE OR REPLACE FUNCTION "public"."sync_not_bought_followups"()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor_role "public"."user_role"; eligible record; inserted_count integer := 0;
BEGIN
  actor_role := "public"."current_user_role"();
  IF actor_role IS NULL THEN RAISE EXCEPTION 'active CRM profile required' USING ERRCODE = 'insufficient_privilege'; END IF;
  FOR eligible IN
    SELECT timeline.id AS timeline_id, timeline.client_id, timeline.reference_number, timeline.branch_id,
      timeline.event_date, timeline.salesperson_id, client.next_visit_date, form.id AS visit_form_id,
      NULLIF(concat_ws('; ', array_to_string(form.not_bought_reasons, ', '), form.not_bought_other), '') AS initial_remark
    FROM "public"."visit_forms" AS form
    JOIN "public"."client_timeline" AS timeline ON timeline.id = form.client_timeline_id
    JOIN "public"."clients" AS client ON client.client_id = timeline.client_id
    WHERE upper(btrim(COALESCE(NULLIF(form.additional_fields->>'visit_status', ''), timeline.buy_status::text))) = 'NO'
       OR (
         upper(btrim(COALESCE(NULLIF(form.additional_fields->>'visit_status', ''), timeline.buy_status::text))) IN ('REPAIR_PICKUP', 'REPAIR_PLACED', 'ORDER_PICKUP', 'ORDER_PLACED')
         AND upper(btrim(COALESCE(form.repair_or_order_approach, ''))) = 'YES'
         AND (
           EXISTS (SELECT 1 FROM unnest(COALESCE(timeline.seen_categories, ARRAY[]::text[])) AS item(value) WHERE upper(btrim(item.value)) NOT IN ('', 'NA', 'N/A', '-', 'NONE'))
           OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(form.category_details->'seen_tags', '[]'::jsonb)) AS item(value) WHERE upper(btrim(item.value)) NOT IN ('', 'NA', 'N/A', '-', 'NONE'))
         )
       )
  LOOP
    IF NOT ("public"."is_super_admin"() OR "public"."is_branch_staff"(eligible.branch_id)) THEN CONTINUE; END IF;
    IF EXISTS (SELECT 1 FROM "public"."not_bought_followups" AS current WHERE current.source_timeline_id = eligible.timeline_id)
       OR EXISTS (
         SELECT 1 FROM "public"."not_bought_followups" AS current
         WHERE current.client_id = eligible.client_id
           AND NOT "public"."not_bought_followup_status_is_done"(current.status)
       ) THEN CONTINUE; END IF;
    INSERT INTO "public"."not_bought_followups" (client_id, reference_number, status, next_followup_date, remark, entered_by, branch_id, source_timeline_id, source_visit_form_id)
    VALUES (eligible.client_id, eligible.reference_number, 'PENDING',
      COALESCE(eligible.next_visit_date, (eligible.event_date AT TIME ZONE 'Asia/Kolkata')::date),
      eligible.initial_remark, eligible.salesperson_id, eligible.branch_id, eligible.timeline_id, eligible.visit_form_id);
    inserted_count := inserted_count + 1;
  END LOOP;
  RETURN inserted_count;
END; $$;

-- The legacy sync records system-originated close/merge events in history but
-- does not treat either as a CRM follow-up outcome. Keep that distinction in
-- the existing immutable audit trigger, without opening a second write path.
CREATE OR REPLACE FUNCTION "public"."record_not_bought_followup_update"()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE system_event text := current_setting('app.not_bought_system_event', true);
BEGIN
  IF NEW."status" IS NOT DISTINCT FROM OLD."status"
     AND NEW."call_response" IS NOT DISTINCT FROM OLD."call_response"
     AND NEW."remark" IS NOT DISTINCT FROM OLD."remark"
     AND NEW."next_followup_date" IS NOT DISTINCT FROM OLD."next_followup_date" THEN
    RETURN NEW;
  END IF;
  IF system_event IN ('merge', 'auto_close') THEN
    INSERT INTO "public"."not_bought_history" ("followup_id","status","previous_status","remark","call_response","updated_by")
    VALUES (
      NEW."id", NEW."status", OLD."status",
      NULLIF(current_setting('app.not_bought_system_remark', true), ''),
      CASE WHEN system_event = 'merge' THEN 'CLIENT REVISITED - STILL NOT BOUGHT' ELSE 'AUTO CLOSED - CLIENT PURCHASED IN LATER VISIT' END,
      "auth"."uid"()
    );
    RETURN NEW;
  END IF;
  NEW."followup_count" := OLD."followup_count" + 1;
  INSERT INTO "public"."not_bought_history" ("followup_id","status","previous_status","remark","call_response","updated_by")
  VALUES (NEW."id",NEW."status",OLD."status",NEW."remark",NEW."call_response","auth"."uid"());
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION "public"."create_not_bought_followup_from_visit_form"()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE source_visit record; legacy_status text; has_seen_product boolean; initial_remark text; active_followup "public"."not_bought_followups"; system_remark text;
BEGIN
  SELECT timeline."client_id", timeline."branch_id", timeline."id" AS timeline_id, timeline."event_date", timeline."reference_number", timeline."salesperson_id", timeline."buy_status"::text AS buy_status, timeline."seen_categories", timeline."bought_categories", timeline."order_categories", timeline."remark" AS timeline_remark, client."next_visit_date"
  INTO source_visit
  FROM "public"."client_timeline" AS timeline JOIN "public"."clients" AS client ON client."client_id" = timeline."client_id"
  WHERE timeline."id" = NEW."client_timeline_id";
  IF source_visit."client_id" IS NULL THEN RETURN NEW; END IF;
  legacy_status := upper(btrim(COALESCE(NULLIF(NEW."additional_fields"->>'visit_status', ''), source_visit."buy_status")));
  has_seen_product := EXISTS (SELECT 1 FROM unnest(COALESCE(source_visit."seen_categories", ARRAY[]::text[])) AS item(value) WHERE upper(btrim(item.value)) NOT IN ('', 'NA', 'N/A', '-', 'NONE'))
    OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(NEW."category_details"->'seen_tags', '[]'::jsonb)) AS item(value) WHERE upper(btrim(item.value)) NOT IN ('', 'NA', 'N/A', '-', 'NONE'));

  SELECT * INTO active_followup FROM "public"."not_bought_followups"
  WHERE "client_id" = source_visit."client_id" AND NOT "public"."not_bought_followup_status_is_done"("status")
  ORDER BY "created_at" FOR UPDATE LIMIT 1;

  -- CRM_CODE.GS:3917-3925, 4101-4135: ready-product purchases and
  -- product exchanges close the one active follow-up; repair/order do not.
  IF legacy_status IN ('YES', 'YES_AND_ORDER_PLACED', 'YES AND ORDER_PLACED', 'PRODUCT_EXCHANGE') THEN
    IF active_followup."id" IS NOT NULL THEN
      system_remark := concat_ws(' | ', 'AUTO CLOSED: CLIENT PURCHASED IN LATER WALK-IN VISIT.', 'PURCHASE REFERENCE: ' || COALESCE(source_visit."reference_number", ''), 'PURCHASE VISIT DATE: ' || (source_visit."event_date" AT TIME ZONE 'Asia/Kolkata')::date::text, 'BUY STATUS: ' || legacy_status, 'BOUGHT: ' || COALESCE(array_to_string(source_visit."bought_categories", ', '), ''), 'ORDER: ' || COALESCE(array_to_string(source_visit."order_categories", ', '), ''), 'REMARK: ' || COALESCE(source_visit."timeline_remark", ''));
      PERFORM set_config('app.not_bought_system_event', 'auto_close', true); PERFORM set_config('app.not_bought_system_remark', system_remark, true);
      UPDATE "public"."not_bought_followups" SET "status" = 'ALREADY PURCHASED FROM MK JEWELS', "call_response" = 'AUTO CLOSED - CLIENT PURCHASED IN LATER VISIT', "remark" = system_remark, "next_followup_date" = NULL WHERE "id" = active_followup."id";
      PERFORM set_config('app.not_bought_system_event', '', true); PERFORM set_config('app.not_bought_system_remark', '', true);
    END IF;
    RETURN NEW;
  END IF;

  IF legacy_status <> 'NO' AND NOT (legacy_status IN ('REPAIR_PICKUP', 'REPAIR_PLACED', 'ORDER_PICKUP', 'ORDER_PLACED') AND upper(btrim(COALESCE(NEW."repair_or_order_approach", ''))) = 'YES' AND has_seen_product) THEN RETURN NEW; END IF;
  initial_remark := NULLIF(concat_ws('; ', array_to_string(NEW."not_bought_reasons", ', '), NEW."not_bought_other"), '');
  IF active_followup."id" IS NOT NULL THEN
    -- CRM_CODE.GS:4171-4226: preserve the original owner/source link, move
    -- the due date forward from the later visit, and append system history.
    system_remark := concat_ws(' | ', 'CLIENT VISITED AGAIN AND STILL NOT BOUGHT.', 'REFERENCE: ' || COALESCE(source_visit."reference_number", ''), 'CLIENT VISIT DATE: ' || (source_visit."event_date" AT TIME ZONE 'Asia/Kolkata')::date::text, 'SEEN: ' || COALESCE(array_to_string(source_visit."seen_categories", ', '), ''), 'PRODUCT REQUIREMENT: ' || COALESCE((SELECT "product_requirement" FROM "public"."client_timeline" WHERE "id" = source_visit."timeline_id"), ''), 'REASON: ' || COALESCE(initial_remark, ''), 'ORIGINAL REMARK: ' || COALESCE(source_visit."timeline_remark", ''));
    PERFORM set_config('app.not_bought_system_event', 'merge', true); PERFORM set_config('app.not_bought_system_remark', system_remark, true);
    UPDATE "public"."not_bought_followups" SET "next_followup_date" = COALESCE(source_visit."next_visit_date", "next_followup_date", (source_visit."event_date" AT TIME ZONE 'Asia/Kolkata')::date) WHERE "id" = active_followup."id";
    PERFORM set_config('app.not_bought_system_event', '', true); PERFORM set_config('app.not_bought_system_remark', '', true);
    RETURN NEW;
  END IF;
  INSERT INTO "public"."not_bought_followups" ("client_id","reference_number","status","next_followup_date","remark","entered_by","branch_id","source_timeline_id","source_visit_form_id")
  VALUES (source_visit."client_id",source_visit."reference_number",'PENDING',COALESCE(source_visit."next_visit_date",(source_visit."event_date" AT TIME ZONE 'Asia/Kolkata')::date),initial_remark,source_visit."salesperson_id",source_visit."branch_id",source_visit."timeline_id",NEW."id");
  RETURN NEW;
END; $$;

-- The audit trail is append-only, including for super-admins. New history is
-- written only by the existing parent-update trigger in the same transaction.
CREATE OR REPLACE FUNCTION "public"."prevent_not_bought_history_mutation"()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'not-bought follow-up history is immutable' USING ERRCODE = 'insufficient_privilege';
END; $$;
DROP TRIGGER IF EXISTS "not_bought_history_immutable" ON "public"."not_bought_history";
CREATE TRIGGER "not_bought_history_immutable"
BEFORE UPDATE OR DELETE ON "public"."not_bought_history"
FOR EACH ROW EXECUTE FUNCTION "public"."prevent_not_bought_history_mutation"();
