export const CALL_OUTCOMES = [
  "YES (CLIENT NEED FOLLOW-UP)",
  "NO (CALL NOT CONNECTED)",
  "NO (CLIENT ASKED FOR APPOINTMENT)",
  "RINGING / NOT ANSWERED",
  "SWITCHED OFF",
  "BUSY / DECLINED",
  "ALREADY PURCHASED FROM MK JEWELS",
  "ALREADY PURCHASED FROM ANOTHER JEWELLER",
  "NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)",
] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];
const NOT_PICKED = new Set<CallOutcome>([
  "NO (CALL NOT CONNECTED)", "RINGING / NOT ANSWERED", "SWITCHED OFF", "BUSY / DECLINED",
]);
const DONE = new Set(["ALREADY PURCHASED FROM MK JEWELS", "ALREADY PURCHASED FROM ANOTHER JEWELLER", "NO REQUIREMENT AT THE MOMENT (FOLLOW UP AFTER A FEW MONTHS)", "CONVERTED TO CLIENT", "CLOSED", "CONVERTED"]);
export function callOutcomeBucket(outcome: string | null) { return outcome && NOT_PICKED.has(outcome as CallOutcome) ? "CALL NOT PICKED" : outcome; }
export function isDoneFollowup(status: string) { return DONE.has(status.trim().toUpperCase()); }
export function queueTabMatches(record: { status: string; next_followup_date: string | null; followup_count: number }, tab: string, today: string, converted = false) {
  const done = isDoneFollowup(record.status);
  const status = record.status.trim().toUpperCase();
  if (tab === "converted") return converted || record.status === "CONVERTED TO CLIENT";
  if (tab === "done") return done;
  if (tab === "pending") return !done;
  if (tab === "inprocess") return !done && status !== "HISTORICAL" && (record.followup_count > 0 || status !== "PENDING");
  return !done && record.next_followup_date !== null && record.next_followup_date <= today;
}
