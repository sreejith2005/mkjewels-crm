import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const migrationPath = fileURLToPath(
  new URL(
    "../prisma/migrations/20260723000000_phase_0_foundation/migration.sql",
    import.meta.url,
  ),
);
const phaseOneMigrationPath = fileURLToPath(
  new URL(
    "../prisma/migrations/20260724000000_phase_1_client_crm/migration.sql",
    import.meta.url,
  ),
);
const phaseTwoMigrationPath = fileURLToPath(
  new URL("../prisma/migrations/20260724010000_phase_2_visit_intake/migration.sql", import.meta.url),
);
const phaseTwoDocumentsMigrationPath = fileURLToPath(
  new URL("../prisma/migrations/20260724020000_phase_2_documents_support/migration.sql", import.meta.url),
);
const phaseThreeMigrationPath = fileURLToPath(
  new URL("../prisma/migrations/20260724030000_phase_3_allocation_access/migration.sql", import.meta.url),
);

let database: PGlite;

beforeAll(async () => {
  database = new PGlite();
  await database.exec(`
    CREATE SCHEMA auth;
    CREATE SCHEMA storage;
    CREATE ROLE authenticated NOLOGIN;

    CREATE OR REPLACE FUNCTION auth.uid()
    RETURNS uuid
    LANGUAGE sql
    STABLE
    AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;

    CREATE TABLE storage.buckets (
      id text PRIMARY KEY,
      name text NOT NULL,
      public boolean NOT NULL DEFAULT false
    );

    CREATE TABLE storage.objects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      bucket_id text NOT NULL,
      name text NOT NULL,
      owner_id text
    );

    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    GRANT USAGE ON SCHEMA storage TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
  `);

  const migration = await readFile(migrationPath, "utf8");
  await database.exec(migration);
  await database.exec(await readFile(phaseOneMigrationPath, "utf8"));
  await database.exec(await readFile(phaseTwoMigrationPath, "utf8"));
  await database.exec(await readFile(phaseTwoDocumentsMigrationPath, "utf8"));
  await database.exec(await readFile(phaseThreeMigrationPath, "utf8"));
});

afterAll(async () => {
  await database.close();
});

describe("Phase 0 database guarantees", () => {
  it("normalizes phone keys and prevents duplicate client phone entries", async () => {
    const branchId = "10000000-0000-4000-8000-000000000001";
    const clientA = "20000000-0000-4000-8000-000000000001";
    const clientB = "20000000-0000-4000-8000-000000000002";

    await database.query(
      `INSERT INTO branches (id, name) VALUES ($1, 'Phone Test Branch')`,
      [branchId],
    );
    await database.query(
      `INSERT INTO clients (client_id, primary_name, primary_phone, last_branch_id)
       VALUES ($1, 'Client A', '9876543210', $3),
              ($2, 'Client B', '9876543211', $3)`,
      [clientA, clientB, branchId],
    );

    await expect(
      database.query(
        `INSERT INTO client_phone_index (phone, client_id) VALUES ($1, $2)`,
        ["9876543210", clientB],
      ),
    ).rejects.toThrow(/unique|duplicate/i);

    const result = await database.query<{ phone: string }>(
      `SELECT phone FROM client_phone_index WHERE client_id = $1`,
      [clientA],
    );
    expect(result.rows[0]?.phone).toBe("9876543210");
  });

  it("recalculates total_visits after each new timeline event", async () => {
    const branchId = "10000000-0000-4000-8000-000000000002";
    const clientId = "20000000-0000-4000-8000-000000000003";

    await database.query(
      `INSERT INTO branches (id, name) VALUES ($1, 'Rollup Test Branch')`,
      [branchId],
    );
    await database.query(
      `INSERT INTO clients (client_id, primary_name, primary_phone, last_branch_id)
       VALUES ($1, 'Rollup Client', '9000000001', $2)`,
      [clientId, branchId],
    );
    await database.query(
      `INSERT INTO client_timeline (
        client_id, event_date, buy_status, branch_id
      ) VALUES
        ($1, '2026-07-22T10:00:00Z', 'NO', $2),
        ($1, '2026-07-23T10:00:00Z', 'YES', $2)`,
      [clientId, branchId],
    );

    const result = await database.query<{
      total_visits: number;
      total_purchase_visits: number;
      total_non_purchase_visits: number;
    }>(
      `SELECT total_visits, total_purchase_visits, total_non_purchase_visits
       FROM clients WHERE client_id = $1`,
      [clientId],
    );

    expect(result.rows[0]).toMatchObject({
      total_visits: 2,
      total_purchase_visits: 1,
      total_non_purchase_visits: 1,
    });
  });

  it("allows cross-branch history reads but rejects a false visit branch", async () => {
    const branchA = "10000000-0000-4000-8000-000000000003";
    const branchB = "10000000-0000-4000-8000-000000000004";
    const salespersonId = "30000000-0000-4000-8000-000000000001";
    const ownClientId = "20000000-0000-4000-8000-000000000004";
    const otherClientId = "20000000-0000-4000-8000-000000000005";

    await database.query(
      `INSERT INTO branches (id, name)
       VALUES ($1, 'RLS Branch A'), ($2, 'RLS Branch B')`,
      [branchA, branchB],
    );
    await database.query(
      `INSERT INTO users (id, name, email, role, branch_id)
       VALUES ($1, 'Salesperson', 'salesperson@example.com', 'salesperson', $2)`,
      [salespersonId, branchA],
    );
    await database.query(
      `INSERT INTO clients (
        client_id, primary_name, primary_phone, last_branch_id
      ) VALUES
        ($1, 'Own Branch Client', '9000000002', $3),
        ($2, 'Other Branch Client', '9000000003', $4)`,
      [ownClientId, otherClientId, branchA, branchB],
    );
    await database.query(
      `INSERT INTO client_timeline (
        client_id, event_date, buy_status, branch_id
      ) VALUES ($1, '2026-07-23T11:00:00Z', 'STORE_VISIT', $2)`,
      [otherClientId, branchB],
    );

    await database.exec("SET ROLE authenticated");
    await database.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [
      salespersonId,
    ]);

    try {
      const clientsResult = await database.query<{ client_id: string }>(
        `SELECT client_id
         FROM clients
         WHERE client_id IN ($1, $2)
         ORDER BY client_id`,
        [ownClientId, otherClientId],
      );
      expect(clientsResult.rows.map((row) => row.client_id)).toEqual([
        ownClientId,
        otherClientId,
      ]);

      const timelineResult = await database.query<{ client_id: string }>(
        `SELECT client_id FROM client_timeline WHERE client_id = $1`,
        [otherClientId],
      );
      expect(timelineResult.rows).toHaveLength(1);

      await expect(
        database.query(
          `INSERT INTO client_timeline (
            client_id, event_date, buy_status, branch_id, salesperson_id
          ) VALUES ($1, '2026-07-23T12:00:00Z', 'YES', $2, $3)`,
          [otherClientId, branchB, salespersonId],
        ),
      ).rejects.toThrow(/row-level security|policy/i);

      await expect(
        database.query(
          `INSERT INTO client_timeline (
            client_id, event_date, buy_status, branch_id, salesperson_id
          ) VALUES ($1, '2026-07-23T12:30:00Z', 'YES', $2, $3)`,
          [otherClientId, branchA, salespersonId],
        ),
      ).resolves.toBeDefined();
    } finally {
      await database.exec("RESET ROLE");
    }
  });

  it("derives canonical event types from representative buy statuses", async () => {
    const branchId = "10000000-0000-4000-8000-000000000005";
    const clientId = "20000000-0000-4000-8000-000000000006";

    await database.query(
      `INSERT INTO branches (id, name) VALUES ($1, 'Event Mapping Branch')`,
      [branchId],
    );
    await database.query(
      `INSERT INTO clients (client_id, primary_name, primary_phone)
       VALUES ($1, 'Event Mapping Client', '9000000004')`,
      [clientId],
    );
    await database.query(
      `INSERT INTO client_timeline (
        client_id, event_date, buy_status, branch_id, reference_number
      ) VALUES
        ($1, '2026-07-23T09:00:00Z', 'ORDER_PLACED_AND_BUYING_NEW_PRODUCT', $2, 'MAP-1'),
        ($1, '2026-07-23T09:01:00Z', 'YES', $2, 'MAP-2'),
        ($1, '2026-07-23T09:02:00Z', 'ORDER_PICKUP', $2, 'MAP-3'),
        ($1, '2026-07-23T09:03:00Z', 'REPAIR_PLACED', $2, 'MAP-4'),
        ($1, '2026-07-23T09:04:00Z', 'PRODUCT_RETURN', $2, 'MAP-5'),
        ($1, '2026-07-23T09:05:00Z', 'NO', $2, 'MAP-6'),
        ($1, '2026-07-23T09:06:00Z', NULL, $2, 'MAP-7')`,
      [clientId, branchId],
    );

    const result = await database.query<{
      reference_number: string;
      event_type: string;
    }>(
      `SELECT reference_number, event_type::text
       FROM client_timeline
       WHERE client_id = $1
       ORDER BY reference_number`,
      [clientId],
    );

    expect(result.rows).toEqual([
      { reference_number: "MAP-1", event_type: "UPSALE_VISIT" },
      { reference_number: "MAP-2", event_type: "READY_PRODUCT_PURCHASE" },
      { reference_number: "MAP-3", event_type: "ORDER_PICKUP_VISIT" },
      { reference_number: "MAP-4", event_type: "REPAIR_PLACED_VISIT" },
      { reference_number: "MAP-5", event_type: "PRODUCT_RETURN_VISIT" },
      { reference_number: "MAP-6", event_type: "NON_PURCHASE_VISIT" },
      { reference_number: "MAP-7", event_type: "VISIT" },
    ]);

    const rollups = await database.query<{
      total_visits: number;
      total_purchase_visits: number;
      total_non_purchase_visits: number;
      total_repair_visits: number;
      total_order_visits: number;
    }>(
      `SELECT
         total_visits,
         total_purchase_visits,
         total_non_purchase_visits,
         total_repair_visits,
         total_order_visits
       FROM clients
       WHERE client_id = $1`,
      [clientId],
    );
    expect(rollups.rows[0]).toMatchObject({
      total_visits: 7,
      total_purchase_visits: 1,
      total_non_purchase_visits: 2,
      total_repair_visits: 1,
      total_order_visits: 2,
    });
  });

  it("shares documents globally but restricts deletion to the uploader", async () => {
    const branchA = "10000000-0000-4000-8000-000000000006";
    const branchB = "10000000-0000-4000-8000-000000000007";
    const uploaderId = "30000000-0000-4000-8000-000000000002";
    const otherUserId = "30000000-0000-4000-8000-000000000003";
    const clientId = "20000000-0000-4000-8000-000000000007";
    const documentId = "40000000-0000-4000-8000-000000000001";
    const objectId = "50000000-0000-4000-8000-000000000001";
    const fileUuid = "60000000-0000-4000-8000-000000000001";
    const storagePath = `${clientId}/general/${fileUuid}_id-proof.pdf`;

    await database.query(
      `INSERT INTO branches (id, name)
       VALUES ($1, 'Document Branch A'), ($2, 'Document Branch B')`,
      [branchA, branchB],
    );
    await database.query(
      `INSERT INTO users (id, name, email, role, branch_id)
       VALUES
         ($1, 'Uploader', 'uploader@example.com', 'salesperson', $3),
         ($2, 'Other Staff', 'other-staff@example.com', 'salesperson', $4)`,
      [uploaderId, otherUserId, branchA, branchB],
    );
    await database.query(
      `INSERT INTO clients (client_id, primary_name, primary_phone)
       VALUES ($1, 'Document Client', '9000000005')`,
      [clientId],
    );
    await database.query(
      `INSERT INTO documents (
        id, client_id, uploaded_by, file_name, storage_path, mime_type
      ) VALUES ($1, $2, $3, 'id-proof.pdf', $4, 'application/pdf')`,
      [documentId, clientId, uploaderId, storagePath],
    );
    await database.query(
      `INSERT INTO storage.objects (id, bucket_id, name, owner_id)
       VALUES ($1, 'crm-documents', $2, $3)`,
      [objectId, storagePath, uploaderId],
    );

    await database.exec("SET ROLE authenticated");
    await database.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [
      otherUserId,
    ]);

    try {
      const visibleDocument = await database.query<{ id: string }>(
        `SELECT id FROM documents WHERE id = $1`,
        [documentId],
      );
      const visibleObject = await database.query<{ id: string }>(
        `SELECT id FROM storage.objects WHERE id = $1`,
        [objectId],
      );
      expect(visibleDocument.rows).toHaveLength(1);
      expect(visibleObject.rows).toHaveLength(1);

      const deniedMetadataDelete = await database.query<{ id: string }>(
        `DELETE FROM documents WHERE id = $1 RETURNING id`,
        [documentId],
      );
      const deniedObjectDelete = await database.query<{ id: string }>(
        `DELETE FROM storage.objects WHERE id = $1 RETURNING id`,
        [objectId],
      );
      expect(deniedMetadataDelete.rows).toHaveLength(0);
      expect(deniedObjectDelete.rows).toHaveLength(0);
    } finally {
      await database.exec("RESET ROLE");
    }

    await database.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [
      uploaderId,
    ]);
    await database.exec("SET ROLE authenticated");

    try {
      const metadataDelete = await database.query<{ id: string }>(
        `DELETE FROM documents WHERE id = $1 RETURNING id`,
        [documentId],
      );
      const objectDelete = await database.query<{ id: string }>(
        `DELETE FROM storage.objects WHERE id = $1 RETURNING id`,
        [objectId],
      );
      expect(metadataDelete.rows).toHaveLength(1);
      expect(objectDelete.rows).toHaveLength(1);
    } finally {
      await database.exec("RESET ROLE");
    }
  });
});

describe("Phase 1 client CRM database guarantees", () => {
  it("keeps a salesperson's created client on their own branch and rejects duplicate phones", async () => {
    const branch = "10000000-0000-4000-8000-000000000101";
    const salesperson = "30000000-0000-4000-8000-000000000101";
    await database.query(`INSERT INTO branches (id, name) VALUES ($1, 'Phase 1 branch')`, [branch]);
    await database.query(`INSERT INTO users (id, name, email, role, branch_id) VALUES ($1, 'Phase 1 salesperson', 'phase1@example.com', 'salesperson', $2)`, [salesperson, branch]);
    await database.exec("SET ROLE authenticated");
    await database.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [salesperson]);
    try {
      const created = await database.query<{ create_client_with_phone: string }>(`SELECT create_client_with_phone($1, $2, NULL, NULL)`, ["New Client", "+91 90123-45678"]);
      const clientId = created.rows[0]?.create_client_with_phone;
      expect(clientId).toBeTruthy();
      const client = await database.query<{ last_branch_id: string; primary_phone: string }>(`SELECT last_branch_id, primary_phone FROM clients WHERE client_id = $1`, [clientId]);
      expect(client.rows[0]).toEqual({ last_branch_id: branch, primary_phone: "9012345678" });
      await expect(database.query(`SELECT client_id FROM search_clients($1, 8)`, ["9012345678"])).resolves.toMatchObject({ rows: [{ client_id: clientId }] });
      await expect(database.query(`SELECT client_id FROM search_clients($1, 8)`, ["3456"])).resolves.toMatchObject({ rows: [{ client_id: clientId }] });
      await expect(database.query(`SELECT create_client_with_phone($1, $2, NULL, NULL)`, ["Duplicate", "9012345678"])).rejects.toThrow(/unique|duplicate/i);
    } finally { await database.exec("RESET ROLE"); }
  });

  it("writes exactly one field-level audit row under the authenticated actor", async () => {
    const branch = "10000000-0000-4000-8000-000000000102";
    const salesperson = "30000000-0000-4000-8000-000000000102";
    const clientId = "20000000-0000-4000-8000-000000000102";
    await database.query(`INSERT INTO branches (id, name) VALUES ($1, 'Audit branch')`, [branch]);
    await database.query(`INSERT INTO users (id, name, email, role, branch_id) VALUES ($1, 'Audit salesperson', 'audit@example.com', 'salesperson', $2)`, [salesperson, branch]);
    await database.query(`INSERT INTO clients (client_id, primary_name, primary_phone, last_branch_id) VALUES ($1, 'Before', '9000000102', $2)`, [clientId, branch]);
    await database.exec("SET ROLE authenticated");
    await database.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [salesperson]);
    try {
      await database.query(`UPDATE clients SET primary_name = $1 WHERE client_id = $2`, ["After", clientId]);
      const rows = await database.query<{ field_name: string; old_value: string; new_value: string; edited_by: string }>(`SELECT field_name, old_value::text, new_value::text, edited_by::text FROM client_edit_log WHERE client_id = $1`, [clientId]);
      expect(rows.rows).toEqual([{ field_name: "primary_name", old_value: '"Before"', new_value: '"After"', edited_by: salesperson }]);
    } finally { await database.exec("RESET ROLE"); }
  });
});

describe("Phase 2 visit intake guarantees", () => {
  it("creates a new client, phone index, timeline, and visit form atomically", async () => {
    const branch = "10000000-0000-4000-8000-000000000201";
    const user = "30000000-0000-4000-8000-000000000201";
    await database.query(`INSERT INTO branches (id,name) VALUES ($1,'Phase Two Branch')`, [branch]);
    await database.query(`INSERT INTO users (id,name,email,role,branch_id) VALUES ($1,'Visit User','visit@example.com','salesperson',$2)`, [user, branch]);
    await database.exec("SET ROLE authenticated");
    await database.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [user]);
    try {
      const newClientId = "20000000-0000-4000-8000-000000000201";
      const timelineId = "40000000-0000-4000-8000-000000000201";
      const documentPath = `${newClientId}/${timelineId}/50000000-0000-4000-8000-000000000201_proof.jpg`;
      const result = await database.query<{ client_id: string; timeline_id: string; reference_number: string }>(`SELECT * FROM submit_walkin_visit($1::jsonb)`, [JSON.stringify({ proposed_client_id: newClientId, proposed_timeline_id: timelineId, branch_id: branch, primary_name: "Walk In", primary_phone: "+91 90123 45999", did_buy: true, seen_categories: ["Ring"], documents: [{ storage_path: documentPath, file_name: "proof.jpg", mime_type: "image/jpeg" }] })]);
      expect(result.rows[0]?.reference_number).toMatch(/^PHA-\d{6}-\d{4}$/);
      await expect(database.query(`SELECT phone FROM client_phone_index WHERE client_id = $1`, [result.rows[0]!.client_id])).resolves.toMatchObject({ rows: [{ phone: "9012345999" }] });
      await expect(database.query(`SELECT client_timeline_id FROM visit_forms WHERE client_timeline_id = $1`, [result.rows[0]!.timeline_id])).resolves.toMatchObject({ rows: [{ client_timeline_id: result.rows[0]!.timeline_id }] });
      await expect(database.query(`SELECT client_id, client_timeline_id, storage_path FROM documents WHERE storage_path = $1`, [documentPath])).resolves.toMatchObject({ rows: [{ client_id: newClientId, client_timeline_id: timelineId, storage_path: documentPath }] });
    } finally { await database.exec("RESET ROLE"); }
  });

  it("updates an existing client without duplication and leaves Phase 4 followups empty", async () => {
    const branch = "10000000-0000-4000-8000-000000000202"; const user = "30000000-0000-4000-8000-000000000202"; const client = "20000000-0000-4000-8000-000000000202";
    await database.query(`INSERT INTO branches (id,name) VALUES ($1,'Existing Branch')`, [branch]); await database.query(`INSERT INTO users (id,name,email,role,branch_id) VALUES ($1,'Existing User','existing@example.com','salesperson',$2)`, [user, branch]); await database.query(`INSERT INTO clients (client_id,primary_name,primary_phone) VALUES ($1,'Existing','9000000202')`, [client]);
    await database.exec("SET ROLE authenticated"); await database.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [user]);
    try {
      await database.query(`SELECT * FROM submit_walkin_visit($1::jsonb)`, [JSON.stringify({ client_id: client, branch_id: branch, primary_name: "Existing Updated", primary_phone: "9000000202", did_buy: false, not_bought_reasons: ["Price"], next_visit_date: "2026-08-01", client_potential_category: "High" })]);
      await expect(database.query(`SELECT primary_name, client_potential_category, next_visit_date::text FROM clients WHERE client_id = $1`, [client])).resolves.toMatchObject({ rows: [{ primary_name: "Existing Updated", client_potential_category: "High", next_visit_date: "2026-08-01" }] });
      await expect(database.query(`SELECT * FROM not_bought_followups WHERE client_id = $1`, [client])).resolves.toMatchObject({ rows: [] });
    } finally { await database.exec("RESET ROLE"); }
  });

  it("marks a queue entry complete and rejects a false branch", async () => {
    const branch = "10000000-0000-4000-8000-000000000203"; const other = "10000000-0000-4000-8000-000000000204"; const user = "30000000-0000-4000-8000-000000000203";
    await database.query(`INSERT INTO branches (id,name) VALUES ($1,'Queue Branch'),($2,'Other Queue Branch')`, [branch, other]); await database.query(`INSERT INTO users (id,name,email,role,branch_id) VALUES ($1,'Queue User','queue@example.com','salesperson',$2)`, [user, branch]); await database.exec("SET ROLE authenticated"); await database.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [user]);
    try {
      const queue = await database.query<{ token: string }>(`SELECT * FROM create_entry_queue($1,$2,$3,$4)`, ["Queued", "9000000203", branch, null]); const entry = await database.query<{ id: string }>(`SELECT id FROM entry_queue WHERE token = $1`, [queue.rows[0]!.token]);
      await database.query(`SELECT * FROM submit_walkin_visit($1::jsonb)`, [JSON.stringify({ entry_queue_id: entry.rows[0]!.id, branch_id: branch, primary_name: "Queued", primary_phone: "9000000203", did_buy: true })]);
      await expect(database.query(`SELECT status FROM entry_queue WHERE id = $1`, [entry.rows[0]!.id])).resolves.toMatchObject({ rows: [{ status: "complete" }] });
      await expect(database.query(`SELECT * FROM submit_walkin_visit($1::jsonb)`, [JSON.stringify({ branch_id: other, primary_name: "Forbidden", primary_phone: "9000000204", did_buy: true })])).rejects.toThrow(/own branch|privilege/i);
    } finally { await database.exec("RESET ROLE"); }
  });
});

describe("Phase 3 roster and availability guarantees", () => {
  it("makes the roster read-only for salespeople, branch-writable for managers, and global for super admins", async () => {
    const branchA = "10000000-0000-4000-8000-000000000301"; const branchB = "10000000-0000-4000-8000-000000000302";
    const salesperson = "30000000-0000-4000-8000-000000000301"; const manager = "30000000-0000-4000-8000-000000000302"; const admin = "30000000-0000-4000-8000-000000000303";
    await database.query(`INSERT INTO branches (id,name) VALUES ($1,'Roster A'),($2,'Roster B')`, [branchA, branchB]);
    await database.query(`INSERT INTO users (id,name,email,role,branch_id) VALUES ($1,'Sales','sales301@example.com','salesperson',$4),($2,'Manager','manager302@example.com','branch_manager',$4),($3,'Admin','admin303@example.com','super_admin',NULL)`, [salesperson, manager, admin, branchA]);
    await database.query(`INSERT INTO crm_allocation (branch_id,crm_name) VALUES ($1,'Anu')`, [branchA]);
    await database.exec("SET ROLE authenticated");
    try {
      await database.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [salesperson]);
      await expect(database.query(`SELECT crm_name FROM crm_allocation WHERE branch_id = $1`, [branchA])).resolves.toMatchObject({ rows: [{ crm_name: "Anu" }] });
      await expect(database.query(`INSERT INTO crm_allocation (branch_id,crm_name) VALUES ($1,'Blocked')`, [branchA])).rejects.toThrow(/row-level security|policy/i);
      await database.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [manager]);
      await expect(database.query(`INSERT INTO crm_daily_availability (branch_id,crm_name,date,is_available) VALUES ($1,'Anu','2026-07-24',false)`, [branchA])).resolves.toBeDefined();
      await expect(database.query(`INSERT INTO crm_allocation (branch_id,crm_name) VALUES ($1,'Wrong branch')`, [branchB])).rejects.toThrow(/row-level security|policy/i);
      await database.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [admin]);
      await expect(database.query(`INSERT INTO crm_allocation (branch_id,crm_name) VALUES ($1,'Admin can add')`, [branchB])).resolves.toBeDefined();
    } finally { await database.exec("RESET ROLE"); }
  });

  it("excludes an explicitly unavailable CRM from today's assigned-CRM dropdown but not another date", async () => {
    const branch = "10000000-0000-4000-8000-000000000303"; const user = "30000000-0000-4000-8000-000000000304"; const client = "20000000-0000-4000-8000-000000000303";
    await database.query(`INSERT INTO branches (id,name) VALUES ($1,'Availability Branch')`, [branch]); await database.query(`INSERT INTO users (id,name,email,role,branch_id) VALUES ($1,'Availability Manager','availability@example.com','branch_manager',$2)`, [user, branch]); await database.query(`INSERT INTO clients (client_id,primary_name,primary_phone) VALUES ($1,'Historical Client','9000000303')`, [client]); await database.query(`INSERT INTO crm_allocation (branch_id,crm_name) VALUES ($1,'Available CRM'),($1,'Unavailable CRM')`, [branch]);
    await database.exec("SET ROLE authenticated"); await database.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [user]);
    try {
      await database.query(`INSERT INTO crm_daily_availability (branch_id,crm_name,date,is_available) VALUES ($1,'Unavailable CRM','2026-07-24',false)`, [branch]);
      const today = await database.query<{ crm_name: string }>(`SELECT a.crm_name FROM crm_allocation a LEFT JOIN crm_daily_availability d ON d.branch_id=a.branch_id AND d.crm_name=a.crm_name AND d.date='2026-07-24' WHERE a.branch_id=$1 AND a.active AND COALESCE(d.is_available,true) ORDER BY a.crm_name`, [branch]);
      const otherDay = await database.query<{ crm_name: string }>(`SELECT a.crm_name FROM crm_allocation a LEFT JOIN crm_daily_availability d ON d.branch_id=a.branch_id AND d.crm_name=a.crm_name AND d.date='2026-07-25' WHERE a.branch_id=$1 AND a.active AND COALESCE(d.is_available,true) ORDER BY a.crm_name`, [branch]);
      expect(today.rows.map((row) => row.crm_name)).toEqual(["Available CRM"]); expect(otherDay.rows.map((row) => row.crm_name)).toEqual(["Available CRM", "Unavailable CRM"]);
    } finally { await database.exec("RESET ROLE"); }
  });

  it("retains historical timeline and visit-form records after a CRM roster entry is deactivated", async () => {
    const branch = "10000000-0000-4000-8000-000000000304"; const user = "30000000-0000-4000-8000-000000000305"; const client = "20000000-0000-4000-8000-000000000304"; const timeline = "40000000-0000-4000-8000-000000000304";
    await database.query(`INSERT INTO branches (id,name) VALUES ($1,'History Branch')`, [branch]); await database.query(`INSERT INTO users (id,name,email,role,branch_id) VALUES ($1,'History Manager','history@example.com','branch_manager',$2)`, [user, branch]); await database.query(`INSERT INTO clients (client_id,primary_name,primary_phone) VALUES ($1,'Historical Client','9000000304')`, [client]); await database.query(`INSERT INTO crm_allocation (branch_id,crm_name) VALUES ($1,'Historical CRM')`, [branch]); await database.query(`INSERT INTO client_timeline (id,client_id,event_date,buy_status,branch_id,crm_name) VALUES ($1,$2,'2026-07-23T10:00:00Z','YES',$3,'Historical CRM')`, [timeline, client, branch]); await database.query(`INSERT INTO visit_forms (client_timeline_id) VALUES ($1)`, [timeline]);
    await database.exec("SET ROLE authenticated"); await database.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [user]);
    try {
      await database.query(`UPDATE crm_allocation SET active=false WHERE branch_id=$1 AND crm_name='Historical CRM'`, [branch]);
      await expect(database.query(`SELECT t.crm_name, v.client_timeline_id FROM client_timeline t JOIN visit_forms v ON v.client_timeline_id=t.id WHERE t.id=$1`, [timeline])).resolves.toMatchObject({ rows: [{ crm_name: "Historical CRM", client_timeline_id: timeline }] });
    } finally { await database.exec("RESET ROLE"); }
  });
});
