import { describe, expect, it } from "vitest";
import { planMigration } from "../scripts/migration-dry-run";

const sheet = (rows: Record<string, unknown>[]) => ({ source: "fixture.xlsx", sheet: "fixture", rows: rows.map((values, index) => ({ row: index + 2, values })) });

describe("Phase 7 migration planner", () => {
  it("plans merges without a database dependency and flags three-name phone conflicts", () => {
    const empty = sheet([]);
    const plan = planMigration({ master: sheet([{ "CLIENT ID": "master-1", "PHONE KEY": "9999999999", "PRIMARY NAME": "Known" }]), timeline: empty, editLog: empty, broadcast: empty, walkin: sheet([
      { "CLIENT PHONE": "99999 99999", "CLIENT NAME": "Known", "CLIENT VISIT DATE": "2026-01-01" },
      { "CLIENT PHONE": "88888 88888", "CLIENT NAME": "A", "CLIENT VISIT DATE": "2026-01-01" },
      { "CLIENT PHONE": "88888 88888", "CLIENT NAME": "B", "CLIENT VISIT DATE": "2026-01-02" },
      { "CLIENT PHONE": "88888 88888", "CLIENT NAME": "C", "CLIENT VISIT DATE": "2026-01-03" },
    ]), entryQueue: empty, referrals: empty, april: empty, aprilCopy: empty, pincode: empty, formData: empty });
    expect(plan.databaseWrites).toBe(false);
    expect(plan.clientMergePreview.newClientsFromWalkins).toBe(1);
    expect(plan.clientMergePreview.conflictingWalkinPhones).toHaveLength(1);
  });

  it("resolves secondary-sheet legacy IDs after valid walk-ins expand the client universe", () => {
    const empty = sheet([]);
    const plan = planMigration({ master: sheet([{ "CLIENT ID": "master-1", "PHONE KEY": "9999999999", "PRIMARY NAME": "Known" }]), walkin: sheet([
      { "CRM CLIENT ID": "walkin-client-2", "CLIENT PHONE": "88888 88888", "CLIENT NAME": "New", "CLIENT VISIT DATE": "2026-01-01" },
    ]), timeline: sheet([{ "CLIENT ID": "walkin-client-2", "EVENT DATE": "2026-01-01", BRANCH: "Branch A" }]), editLog: sheet([{ "CLIENT ID": "walkin-client-2", TIMESTAMP: "2026-01-01", "FIELD NAME": "CITY" }]), broadcast: empty, entryQueue: empty, referrals: empty, april: empty, aprilCopy: empty, pincode: empty, formData: empty });
    expect(plan.sourceSheets.timeline.mapsCleanly).toBe(1);
    expect(plan.sourceSheets.editLog.mapsCleanly).toBe(1);
    expect(plan.fullClientUniverse.clients).toBe(2);
  });
});
