export type DashboardRange = { start: string; end: string; preset: "today" | "yesterday" | "week" | "month" | "custom" };

const isoDay = (value: Date) => value.toISOString().slice(0, 10);
const addDays = (day: string, amount: number) => {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return isoDay(date);
};

export function dashboardRange(input: { preset?: string; start?: string; end?: string }, now = new Date()): DashboardRange {
  const today = isoDay(now);
  const preset = input.preset === "yesterday" || input.preset === "week" || input.preset === "month" || input.preset === "custom" ? input.preset : "today";
  if (preset === "yesterday") return { preset, start: addDays(today, -1), end: addDays(today, -1) };
  if (preset === "week") return { preset, start: addDays(today, -6), end: today };
  if (preset === "month") return { preset, start: today.slice(0, 8) + "01", end: today };
  if (preset === "custom" && /^\d{4}-\d{2}-\d{2}$/.test(input.start ?? "") && /^\d{4}-\d{2}-\d{2}$/.test(input.end ?? "") && input.start! <= input.end!) return { preset, start: input.start!, end: input.end! };
  return { preset: "today", start: today, end: today };
}

export const endExclusive = (range: DashboardRange) => `${addDays(range.end, 1)}T00:00:00.000Z`;
export const startInclusive = (range: DashboardRange) => `${range.start}T00:00:00.000Z`;

type Visit = { id: string; event_date: string; event_type: string; buy_status: string | null; branch_id: string; crm_name: string | null; remark: string | null; reference_number: string | null; client_id: string; branch?: { name: string } | null; client?: { primary_name: string } | null; salesperson?: { name: string } | null };
type Followup = { status: string; next_followup_date: string | null; created_at: string };
type ReferralCalling = Followup;
export type Breakdown = { name: string; visits: number; bought: number; buyRate: number };
export type StatusDistributionItem = { label: string; value: number; color: string };

const SALES_EVENT_TYPES = ["READY_PRODUCT_PURCHASE", "ORDER_PLACED_VISIT", "REPAIR_PLACED_VISIT", "ORDER_PICKUP_VISIT", "REPAIR_PICKUP_VISIT", "UPSALE_VISIT", "PRODUCT_RETURN_VISIT"];
const openAndOverdue = (item: Followup, today: string) => Boolean(item.next_followup_date && item.next_followup_date < today && !["closed", "converted"].includes(item.status));

function breakdown(visits: Visit[], name: (visit: Visit) => string): Breakdown[] {
  const groups = new Map<string, { visits: number; bought: number }>();
  for (const visit of visits) {
    const key = name(visit);
    const group = groups.get(key) ?? { visits: 0, bought: 0 };
    group.visits += 1;
    if (visit.event_type === "READY_PRODUCT_PURCHASE") group.bought += 1;
    groups.set(key, group);
  }
  return [...groups].map(([name, group]) => ({ name, ...group, buyRate: group.visits ? group.bought / group.visits : 0 })).sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name));
}

export function buildDashboardData(visits: Visit[], followups: Followup[], referrals: ReferralCalling[], today: string) {
  const totals = {
    walkIns: visits.length,
    notBought: visits.filter((visit) => visit.event_type === "NON_PURCHASE_VISIT").length,
    bought: visits.filter((visit) => visit.event_type === "READY_PRODUCT_PURCHASE").length,
    orderPlaced: visits.filter((visit) => visit.event_type === "ORDER_PLACED_VISIT").length,
    repairPlaced: visits.filter((visit) => visit.event_type === "REPAIR_PLACED_VISIT").length,
    orderPickup: visits.filter((visit) => visit.event_type === "ORDER_PICKUP_VISIT").length,
    repairPickup: visits.filter((visit) => visit.event_type === "REPAIR_PICKUP_VISIT").length,
    upsale: visits.filter((visit) => visit.event_type === "UPSALE_VISIT").length,
    productReturn: visits.filter((visit) => visit.event_type === "PRODUCT_RETURN_VISIT").length,
  };
  const trend = new Map<string, { day: string; total: number; bought: number; notBought: number }>();
  for (const visit of visits) {
    const day = visit.event_date.slice(0, 10); const point = trend.get(day) ?? { day, total: 0, bought: 0, notBought: 0 };
    point.total += 1; if (visit.event_type === "READY_PRODUCT_PURCHASE") point.bought += 1; if (visit.event_type === "NON_PURCHASE_VISIT") point.notBought += 1; trend.set(day, point);
  }
  return {
    totals,
    statusDistribution: [
      { label: "Not bought", value: totals.notBought, color: "#a73f35" },
      { label: "Bought", value: totals.bought, color: "#217047" },
      { label: "Order placed", value: totals.orderPlaced, color: "#b98934" },
      { label: "Repair placed", value: totals.repairPlaced, color: "#6b5ca5" },
      { label: "Order pickup", value: totals.orderPickup, color: "#287a88" },
      { label: "Repair pickup", value: totals.repairPickup, color: "#9a5f2d" },
      { label: "Upsale", value: totals.upsale, color: "#c14f7a" },
      { label: "Product return", value: totals.productReturn, color: "#6b7280" },
      { label: "Other visits", value: Math.max(0, totals.walkIns - totals.notBought - totals.bought - totals.orderPlaced - totals.repairPlaced - totals.orderPickup - totals.repairPickup - totals.upsale - totals.productReturn), color: "#9a9488" },
    ] satisfies StatusDistributionItem[],
    operations: {
      pendingFollowups: followups.filter((item) => !["closed", "converted"].includes(item.status)).length,
      overdueFollowups: followups.filter((item) => openAndOverdue(item, today)).length,
      pendingReferrals: referrals.filter((item) => !["closed", "converted"].includes(item.status)).length,
      overdueReferrals: referrals.filter((item) => openAndOverdue(item, today)).length,
    },
    branchBreakdown: breakdown(visits, (visit) => visit.branch?.name ?? "Unknown branch"),
    crmBreakdown: breakdown(visits, (visit) => visit.crm_name ?? visit.salesperson?.name ?? "Unassigned"),
    recentVisits: [...visits].sort((a, b) => b.event_date.localeCompare(a.event_date)).slice(0, 25),
    trend: [...trend.values()].sort((a, b) => a.day.localeCompare(b.day)),
    hasSalesActivity: visits.some((visit) => SALES_EVENT_TYPES.includes(visit.event_type)),
  };
}
