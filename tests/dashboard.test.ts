import { describe, expect, it } from "vitest";
import { buildDashboardData, dashboardRange, endExclusive, startInclusive } from "@/lib/dashboard";

const visit = (overrides: Record<string, unknown>) => ({ id: crypto.randomUUID(), event_date: "2026-07-24T10:00:00.000Z", event_type: "VISIT", buy_status: null, branch_id: "branch-a", crm_name: "Anu", remark: null, reference_number: null, client_id: "client-a", branch: { name: "MG Road" }, client: { primary_name: "Client" }, salesperson: null, ...overrides });

describe("Phase 6 dashboard reporting", () => {
  it("matches every stat-card event-type group from hand-verified timeline rows", () => {
    const rows = ["VISIT", "NON_PURCHASE_VISIT", "READY_PRODUCT_PURCHASE", "ORDER_PLACED_VISIT", "REPAIR_PLACED_VISIT", "ORDER_PICKUP_VISIT", "REPAIR_PICKUP_VISIT", "UPSALE_VISIT", "PRODUCT_RETURN_VISIT"].map((event_type) => visit({ event_type }));
    expect(buildDashboardData(rows, [], [], "2026-07-24").totals).toEqual({ walkIns: 9, notBought: 1, bought: 1, orderPlaced: 1, repairPlaced: 1, orderPickup: 1, repairPickup: 1, upsale: 1, productReturn: 1 });
  });

  it("aggregates and sorts branch and CRM breakdowns with ready-product buy rate", () => {
    const rows = [visit({ branch: { name: "MG Road" }, crm_name: "Anu", event_type: "READY_PRODUCT_PURCHASE" }), visit({ branch: { name: "MG Road" }, crm_name: "Anu" }), visit({ branch: { name: "Airport" }, crm_name: "Bala" }), visit({ branch: { name: "Airport" }, crm_name: "Bala" }), visit({ branch: { name: "Airport" }, crm_name: "Bala", event_type: "READY_PRODUCT_PURCHASE" })];
    const data = buildDashboardData(rows, [], [], "2026-07-24");
    expect(data.branchBreakdown).toEqual([{ name: "Airport", visits: 3, bought: 1, buyRate: 1 / 3 }, { name: "MG Road", visits: 2, bought: 1, buyRate: 0.5 }]);
    expect(data.crmBreakdown[0]).toMatchObject({ name: "Bala", visits: 3, bought: 1 });
  });

  it("uses the existing queue overdue predicate for both operational queues", () => {
    const data = buildDashboardData([], [{ status: "pending", next_followup_date: "2026-07-23", created_at: "2026-07-24T10:00:00Z" }, { status: "converted", next_followup_date: "2026-07-20", created_at: "2026-07-24T10:00:00Z" }], [{ status: "pending", next_followup_date: "2026-07-24", created_at: "2026-07-24T10:00:00Z" }, { status: "pending", next_followup_date: "2026-07-22", created_at: "2026-07-24T10:00:00Z" }], "2026-07-24");
    expect(data.operations).toEqual({ pendingFollowups: 1, overdueFollowups: 1, pendingReferrals: 2, overdueReferrals: 1 });
  });

  it("creates inclusive date boundaries using an exclusive next-day query bound", () => {
    const range = dashboardRange({ preset: "custom", start: "2026-07-01", end: "2026-07-31" }, new Date("2026-07-24T10:00:00Z"));
    expect(startInclusive(range)).toBe("2026-07-01T00:00:00.000Z"); expect(endExclusive(range)).toBe("2026-08-01T00:00:00.000Z");
  });
});
