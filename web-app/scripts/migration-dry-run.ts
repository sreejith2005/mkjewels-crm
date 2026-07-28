/*
 * Phase 7a planner. This module deliberately imports no database client and has
 * no network code. Phase 7b will consume the same plan() result inside one DB
 * transaction; only its explicit writer will be allowed to persist the plan.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";

type Row = Record<string, unknown>;
type Issue = { row: number; reason: string };
type SheetReport = { source: string; sheet: string; rowsRead: number; mapsCleanly: number; skipped: Issue[]; flagged: Issue[] };
type SourceSheet = { source: string; sheet: string; rows: Array<{ row: number; values: Row }> };
type SourceRow = { row: number; values: Row };

const REQUIRED_SHEETS = [
  ["master", "CLIENT DATABASE MASTER"], ["timeline", "CLIENT TIMELINE"], ["editLog", "CLIENT PROFILE EDIT LOG"],
  ["broadcast", "ATTRIBUTE WISE WHATSAPP"], ["walkin", "WALKIN DATASET"], ["entryQueue", "CLIENT ENTRY LOG"],
  ["referrals", "REFERRALS"], ["april", "APRIL NO NOT CONVERTED"], ["aprilCopy", "Copy of APRIL NO CONVERTED"],
  ["pincode", "pincode"], ["formData", "FORM DATA"],
] as const;

function text(value: unknown) { return String(value ?? "").trim(); }
function value(row: Row, ...keys: string[]) { return keys.map((key) => row[key]).find((candidate) => text(candidate) !== ""); }
function normalisePhone(value: unknown) {
  const digits = text(value).replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}
function dateValue(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const raw = text(value); if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}
function key(phone: string, date: string, reference: string) { return `${phone}|${date}|${reference.trim().toLowerCase()}`; }
function splitValues(value: unknown) {
  return text(value).split(/[;,|\n]+/).map((part) => part.trim()).filter(Boolean);
}
function details(item: SourceRow, fields: string[]) {
  return { row: item.row, ...Object.fromEntries(fields.map((field) => [field, text(item.values[field])])) };
}

async function loadWorkbook(filePath: string, source: string) {
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.readFile(filePath);
  return REQUIRED_SHEETS.filter(([kind]) => (source === "client" ? ["master", "timeline", "editLog", "broadcast"].includes(kind) : !["master", "timeline", "editLog", "broadcast"].includes(kind)))
    .map(([kind, expected]) => {
      const worksheet = workbook.worksheets.find((candidate) => candidate.name.toLowerCase() === expected.toLowerCase() || candidate.name.toLowerCase().startsWith(expected.toLowerCase()));
      if (!worksheet) throw new Error(`Required sheet '${expected}' was not found in ${path.basename(filePath)}.`);
      const headers: string[] = [];
      for (let column = 1; column <= worksheet.columnCount; column++) headers.push(worksheet.getRow(1).getCell(column).text);
      const rows: Array<{ row: number; values: Row }> = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const values = Object.fromEntries(headers.map((header, index) => [header, row.getCell(index + 1).text]));
        const hasSourceCell = headers.some((_, index) => row.getCell(index + 1).value !== null && row.getCell(index + 1).value !== undefined);
        if (hasSourceCell) rows.push({ row: rowNumber, values });
      });
      return [kind, { source: path.basename(filePath), sheet: worksheet.name, rows }] as const;
    });
}

export function planMigration(sheets: Record<string, SourceSheet>) {
  const reports: Record<string, SheetReport> = {};
  const makeReport = (kind: string): SheetReport => (reports[kind] = { source: sheets[kind].source, sheet: sheets[kind].sheet, rowsRead: sheets[kind].rows.length, mapsCleanly: 0, skipped: [], flagged: [] });
  const masterReport = makeReport("master");
  const masterByPhone = new Map<string, SourceRow>();
  const legacyClientIdToPhone = new Map<string, string>();
  const legacyClientIdConflicts = new Set<string>();
  for (const item of sheets.master.rows) {
    const phone = normalisePhone(value(item.values, "PHONE KEY", "PRIMARY PHONE"));
    const clientId = text(item.values["CLIENT ID"]);
    if (!clientId || !phone) { masterReport.skipped.push({ row: item.row, reason: !clientId ? "missing CLIENT ID" : "malformed or missing PHONE KEY/PRIMARY PHONE" }); continue; }
    if (masterByPhone.has(phone)) { masterReport.flagged.push({ row: item.row, reason: `duplicate canonical PHONE KEY ${phone}` }); continue; }
    masterByPhone.set(phone, item); legacyClientIdToPhone.set(clientId, phone); masterReport.mapsCleanly++;
  }

  const walkinReport = makeReport("walkin");
  const walkinByPhone = new Map<string, SourceRow[]>();
  const enrichableFields = ["GENDER", "BILLING PHONE", "COUNTRY", "STATE", "CITY", "CITY (OTHER)", "PINCODE", "ADDRESS", "COMMUNITY", "COMMUNITY (OTHER)", "DOB", "ANNIVERSARY"];
  let timelineFromWalkins = 0; let visitForms = 0;
  for (const item of sheets.walkin.rows) {
    const phone = normalisePhone(value(item.values, "CLIENT PHONE"));
    const name = text(value(item.values, "CLIENT NAME"));
    const date = dateValue(value(item.values, "CLIENT VISIT DATE", "TIMESTAMP"));
    if (!phone || !name) { walkinReport.skipped.push({ row: item.row, reason: !phone ? "malformed or missing CLIENT PHONE" : "missing CLIENT NAME" }); continue; }
    if (!date) walkinReport.flagged.push({ row: item.row, reason: "unparseable CLIENT VISIT DATE; profile may merge but visit cannot be created" });
    else { timelineFromWalkins++; visitForms++; }
    walkinByPhone.set(phone, [...(walkinByPhone.get(phone) ?? []), item]);
    const legacyId = text(value(item.values, "CRM CLIENT ID", "CLIENT ID"));
    if (legacyId) {
      const existing = legacyClientIdToPhone.get(legacyId);
      if (existing && existing !== phone) legacyClientIdConflicts.add(legacyId);
      else legacyClientIdToPhone.set(legacyId, phone);
    }
    walkinReport.mapsCleanly++;
  }
  const ambiguousWalkinPhones: Array<{ phone: string; rows: number[]; names: string[]; master: Record<string, string | number> | null; walkins: Array<Record<string, string | number>> }> = [];
  for (const [phone, items] of walkinByPhone) {
    const names = [...new Set(items.map((item) => text(value(item.values, "CLIENT NAME")).toLowerCase()).filter(Boolean))];
    if (names.length >= 3) {
      ambiguousWalkinPhones.push({
        phone, rows: items.map((item) => item.row), names,
        master: masterByPhone.has(phone) ? details(masterByPhone.get(phone)!, ["CLIENT ID", "PRIMARY NAME", "OTHER NAMES", "PRIMARY PHONE", "BILLING PHONE", "CITY", "STATE", "ADDRESS"]) : null,
        walkins: items.map((item) => details(item, ["CRM CLIENT ID", "CLIENT NAME", "CLIENT PHONE", "BILLING PHONE", "CLIENT VISIT DATE", "BRANCH", "CITY", "STATE", "ADDRESS", "GENDER"])),
      });
      for (const item of items) walkinReport.flagged.push({ row: item.row, reason: `ambiguous phone identity: ${names.length} different client names` });
    }
  }
  // This is the full client universe that Phase 7b will materialise.  Every
  // legacy ID seen in a valid walk-in now resolves before secondary sheets run.
  const fullClientByPhone = new Map<string, { source: "master" | "walkin"; row: number; values: Row }>();
  for (const [phone, item] of masterByPhone) fullClientByPhone.set(phone, { source: "master", ...item });
  for (const [phone, items] of walkinByPhone) if (!fullClientByPhone.has(phone)) fullClientByPhone.set(phone, { source: "walkin", ...items[0] });
  const resolveLegacyClientId = (legacyId: string) => legacyClientIdConflicts.has(legacyId) ? null : legacyClientIdToPhone.get(legacyId) ?? null;
  let unchanged = 0, enriched = 0, newClients = 0;
  for (const [phone, items] of walkinByPhone) {
    const master = masterByPhone.get(phone);
    if (!master) { newClients++; continue; }
    const canEnrich = items.some((item) => enrichableFields.some((field) => text(master.values[field.replace(" (", " ").replace(")", "")]) === "" && text(item.values[field]) !== ""));
    if (canEnrich) enriched++; else unchanged++;
  }

  const timelineReport = makeReport("timeline");
  const timelineKeys = new Map<string, SourceRow[]>(); let timelineCreates = 0;
  for (const item of sheets.timeline.rows) {
    const legacyId = text(item.values["CLIENT ID"]); const phone = resolveLegacyClientId(legacyId);
    const date = dateValue(item.values["EVENT DATE"]); const branch = text(item.values["BRANCH"]);
    if (!phone || !date || !branch) { timelineReport.skipped.push({ row: item.row, reason: !phone ? legacyClientIdConflicts.has(legacyId) ? "CLIENT ID resolves to conflicting walk-in phones" : "CLIENT ID does not resolve in the full merged client universe" : !date ? "unparseable EVENT DATE" : "missing BRANCH" }); continue; }
    timelineCreates++; timelineReport.mapsCleanly++;
    const reference = text(item.values["REFERENCE NUMBER"]); if (reference) timelineKeys.set(key(phone, date, reference), [...(timelineKeys.get(key(phone, date, reference)) ?? []), item]);
  }

  const editReport = makeReport("editLog"); let editCreates = 0;
  for (const item of sheets.editLog.rows) {
    const clientId = text(item.values["CLIENT ID"]); const timestamp = dateValue(item.values["TIMESTAMP"]); const field = text(item.values["FIELD NAME"]);
    if (!resolveLegacyClientId(clientId) || !timestamp || !field) { editReport.skipped.push({ row: item.row, reason: !resolveLegacyClientId(clientId) ? legacyClientIdConflicts.has(clientId) ? "CLIENT ID resolves to conflicting walk-in phones" : "CLIENT ID does not resolve in the full merged client universe" : !timestamp ? "unparseable TIMESTAMP" : "missing FIELD NAME" }); continue; }
    editCreates++; editReport.mapsCleanly++;
  }

  const potentialDuplicates: Array<{ phone: string; walkin: SourceRow; timeline: SourceRow }> = [];
  for (const [phone, items] of walkinByPhone) for (const item of items) {
    const date = dateValue(value(item.values, "CLIENT VISIT DATE", "TIMESTAMP")); const reference = text(item.values["REFERENCE NUMBER"]);
    if (!date || !reference) continue; const matches = timelineKeys.get(key(phone, date, reference)); if (matches) for (const timeline of matches) potentialDuplicates.push({ phone, walkin: item, timeline });
  }

  const broadcastReport = makeReport("broadcast"); const campaigns = new Set<string>(); const campaignTags = new Set<string>();
  for (const item of sheets.broadcast.rows) {
    const phone = normalisePhone(value(item.values, "UNIQUE PHONE KEY", "WHATSAPP PHONE", "PHONE KEY"));
    const labels = [...new Set([...Array.from({ length: 15 }, (_, i) => text(item.values[`BROADCAST SEGMENT ${i + 1}`])), ...Array.from({ length: 15 }, (_, i) => text(item.values[`CAMPAIGN USE ${i + 1}`]))].filter(Boolean))];
    if (!phone || labels.length === 0) { broadcastReport.skipped.push({ row: item.row, reason: !phone ? "malformed or missing WhatsApp phone" : "no campaign/segment label" }); continue; }
    for (const label of labels) { campaigns.add(label); campaignTags.add(`${phone}|${label.toLowerCase()}`); } broadcastReport.mapsCleanly++;
  }

  const entryReport = makeReport("entryQueue"); let entryCreates = 0;
  for (const item of sheets.entryQueue.rows) {
    const token = text(item.values["TOKEN"]); const phone = normalisePhone(item.values["MOBILE"]); const name = text(item.values["CLIENT NAME"]); const branch = text(item.values["BRANCH"]);
    if (!token || !phone || !name || !branch) { entryReport.skipped.push({ row: item.row, reason: !token ? "missing TOKEN" : !phone ? "malformed MOBILE" : !name ? "missing CLIENT NAME" : "missing BRANCH" }); continue; }
    entryCreates++; entryReport.mapsCleanly++;
  }

  const referralReport = makeReport("referrals"); let referralCreates = 0, referralCallingCreates = 0;
  for (const item of sheets.referrals.rows) {
    const referralPhone = normalisePhone(item.values["REFERRAL NUMBER"]); const giver = text(item.values["REFERENCE GIVEN BY CLIENT NAME"]); const referralName = text(item.values["REFERRAL NAME"]);
    if (!referralPhone || !giver || !referralName) { referralReport.skipped.push({ row: item.row, reason: !referralPhone ? "malformed REFERRAL NUMBER" : !giver ? "missing referring client name" : "missing REFERRAL NAME" }); continue; }
    referralCreates++; referralCallingCreates++; referralReport.mapsCleanly++;
  }

  const aprilReport = makeReport("april"); const aprilCopyReport = makeReport("aprilCopy"); let followups = 0, followupHistory = 0; const aprilTagPhones = new Set<string>();
  for (const [report, source] of [[aprilReport, sheets.april], [aprilCopyReport, sheets.aprilCopy]] as const) for (const item of source.rows) {
    const phone = normalisePhone(value(item.values, "PHONE NUMBER")); const name = text(item.values["CLIENT NAME"]); const status = text(value(item.values, "STATUS", "APRIL STATUS", "REVISIT STATUS"));
    if (!phone || !name || !status || !fullClientByPhone.has(phone)) { report.skipped.push({ row: item.row, reason: !phone ? "malformed PHONE NUMBER" : !name ? "missing CLIENT NAME" : !status ? "missing status" : "phone does not resolve in the full merged client universe" }); continue; }
    report.mapsCleanly++; followups++; followupHistory++; aprilTagPhones.add(phone);
  }
  campaigns.add("April Not Bought Outreach"); for (const phone of aprilTagPhones) campaignTags.add(`${phone}|april not bought outreach`);

  const pincodeReport = makeReport("pincode"); const formReport = makeReport("formData");
  const lookup = { cities: new Set<string>(), productCategories: new Set<string>(), beverages: new Set<string>(), snacks: new Set<string>(), gifts: new Set<string>(), communities: new Set<string>(), notBoughtReasons: new Set<string>(), pincodes: new Set<string>() };
  for (const item of sheets.pincode.rows) { const city = text(item.values["CITY"]); const pincode = text(item.values["PINCODE"]); if (!pincode) { pincodeReport.skipped.push({ row: item.row, reason: "missing PINCODE" }); continue; } if (city) lookup.cities.add(city); lookup.pincodes.add(pincode); pincodeReport.mapsCleanly++; }
  for (const item of sheets.formData.rows) { const fields: Array<[keyof typeof lookup, string]> = [["productCategories", "PRODUCT CATEGORIES"], ["beverages", "BEVERAGES"], ["snacks", "SNACK OPTION"], ["gifts", "GIFT OPTION"], ["communities", "CASTE"], ["notBoughtReasons", "REASON FOR NOT BOUGHT"]]; let found = false; for (const [target, field] of fields) for (const label of splitValues(item.values[field])) { lookup[target].add(label); found = true; } if (!found) formReport.skipped.push({ row: item.row, reason: "no supported lookup values" }); else formReport.mapsCleanly++; }

  const targetCounts = {
    clients: masterReport.mapsCleanly + newClients, client_phone_index: masterReport.mapsCleanly + newClients,
    client_timeline: timelineCreates + timelineFromWalkins, visit_forms: visitForms, client_edit_log: editCreates,
    entry_queue: entryCreates, referrals: referralCreates, referral_calling: referralCallingCreates,
    not_bought_followups: followups, not_bought_history: followupHistory, campaigns: campaigns.size,
    client_campaign_tags: campaignTags.size, lookup_cities: lookup.cities.size, lookup_product_categories: lookup.productCategories.size,
    lookup_beverages: lookup.beverages.size, lookup_snacks: lookup.snacks.size, lookup_gifts: lookup.gifts.size,
    lookup_communities: lookup.communities.size, lookup_not_bought_reasons: lookup.notBoughtReasons.size, lookup_pincodes: lookup.pincodes.size,
  };
  const walkinRowsByNumber = new Map(sheets.walkin.rows.map((item) => [item.row, item]));
  const flaggedWalkins = Object.entries(Object.groupBy(walkinReport.flagged, (issue) => issue.reason)).map(([reason, issues]) => ({
    reason, count: issues!.length,
    samples: issues!.slice(0, 15).map((issue) => details(walkinRowsByNumber.get(issue.row)!, ["CRM CLIENT ID", "CLIENT NAME", "CLIENT PHONE", "BILLING PHONE", "CLIENT VISIT DATE", "BRANCH", "CRM NAME", "SALESPERSON", "CITY", "STATE", "ADDRESS"])),
  }));
  const duplicateReview = potentialDuplicates.map(({ phone, walkin, timeline }) => ({
    phone,
    walkin: details(walkin, ["CRM CLIENT ID", "CLIENT VISIT DATE", "CLIENT NAME", "CLIENT PHONE", "BRANCH", "CRM NAME", "REFERENCE NUMBER", "CLIENT TYPE"]),
    timeline: details(timeline, ["CLIENT ID", "EVENT DATE", "BRANCH", "CRM NAME", "REFERENCE NUMBER", "BUY STATUS", "REMARK"]),
  }));
  return { generatedAt: new Date().toISOString(), mode: "dry-run", databaseWrites: false, sourceSheets: reports, clientMergePreview: { canonicalMasterClients: masterReport.mapsCleanly, unchangedWithWalkins: unchanged, enrichedFromWalkins: enriched, newClientsFromWalkins: newClients, conflictingWalkinPhones: ambiguousWalkinPhones }, reconciliation: { potentialTimelineWalkinDuplicates: potentialDuplicates }, humanReview: { conflictingPhoneIdentities: ambiguousWalkinPhones, flaggedWalkins, potentialTimelineWalkinDuplicates: duplicateReview }, targetCounts, fullClientUniverse: { clients: fullClientByPhone.size, legacyIds: legacyClientIdToPhone.size, conflictingLegacyIds: [...legacyClientIdConflicts] }, blockers: [] };
}

function markdown(report: ReturnType<typeof planMigration>) {
  const lines = ["# Phase 7a migration dry-run", "", `Generated: ${report.generatedAt}`, "", "**Database writes:** none. This script has no database client or network access.", "", "## Source sheets"];
  for (const [kind, sheet] of Object.entries(report.sourceSheets)) {
    lines.push(`- ${kind}: ${sheet.rowsRead} read, ${sheet.mapsCleanly} clean, ${sheet.skipped.length} skipped, ${sheet.flagged.length} flagged.`);
    const reasons = [...new Set([...sheet.skipped, ...sheet.flagged].map((issue) => issue.reason))].slice(0, 5);
    for (const reason of reasons) lines.push(`  - ${reason}`);
  }
  lines.push("", "## Client merge preview", `- Canonical master clients: ${report.clientMergePreview.canonicalMasterClients}`, `- Unchanged by walk-in enrichment: ${report.clientMergePreview.unchangedWithWalkins}`, `- Gaining missing values from walk-ins: ${report.clientMergePreview.enrichedFromWalkins}`, `- New clients from walk-ins: ${report.clientMergePreview.newClientsFromWalkins}`, `- Conflicting walk-in phone identities: ${report.clientMergePreview.conflictingWalkinPhones.length}`, "", "## Reconciliation", `- Potential timeline/walk-in duplicates (phone + date + reference): ${report.reconciliation.potentialTimelineWalkinDuplicates.length}`, `- Conflicting walk-in identities requiring review: ${report.clientMergePreview.conflictingWalkinPhones.length}`, "", "## Planned target rows (before any human duplicate-resolution decision)");
  for (const [table, count] of Object.entries(report.targetCounts)) lines.push(`- ${table}: ${count}`);
  if (report.blockers.length) lines.push("", "## Decisions needed", ...report.blockers.map((item) => `- ${item}`));
  return `${lines.join("\n")}\n`;
}

function cell(value: unknown) { return text(value).replaceAll("|", "\\|").replaceAll("\n", " "); }
function table(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return "_None._\n";
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return `| ${columns.join(" | ")} |\n| ${columns.map(() => "---").join(" | ")} |\n${rows.map((row) => `| ${columns.map((column) => cell(row[column])).join(" | ")} |`).join("\n")}\n`;
}

function humanReviewMarkdown(report: ReturnType<typeof planMigration>) {
  const review = report.humanReview;
  const lines = ["# Phase 7a — needs human review", "", `Generated: ${report.generatedAt}`, "", "This is a dry-run review artifact. No decision in this document changes the import plan or writes to a database.", "", "## 1. Conflicting phone identities", ""];
  for (const conflict of review.conflictingPhoneIdentities) {
    lines.push(`### ${conflict.phone}`, "", `Name variants: ${conflict.names.join("; ")}`, "", "Authoritative master row:", "", table(conflict.master ? [conflict.master] : []), "Walk-in source rows:", "", table(conflict.walkins));
  }
  lines.push("## 2. Flagged walk-in rows", "");
  for (const group of review.flaggedWalkins) lines.push(`### ${group.reason} (${group.count})`, "", "Representative rows (first 15):", "", table(group.samples));
  lines.push("## 3. Potential timeline / walk-in duplicates", "", `Showing ${Math.min(50, review.potentialTimelineWalkinDuplicates.length)} of ${review.potentialTimelineWalkinDuplicates.length}. Match key: normalized phone + date + reference number.`, "");
  for (const duplicate of review.potentialTimelineWalkinDuplicates.slice(0, 50)) lines.push(`### ${duplicate.phone}`, "", "Walk-in:", "", table([duplicate.walkin]), "Timeline:", "", table([duplicate.timeline]));
  return `${lines.join("\n")}\n`;
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const [clientSheets, walkinSheets] = await Promise.all([loadWorkbook(path.join(root, "01 CLIENT DATABASE.xlsx"), "client"), loadWorkbook(path.join(root, "01 WALKIN DATA.xlsx"), "walkin")]);
  const sheets = Object.fromEntries([...clientSheets, ...walkinSheets]);
  const report = planMigration(sheets); const output = path.join(root, "migration-reports"); await fs.mkdir(output, { recursive: true });
  await fs.writeFile(path.join(output, "migration-dry-run-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.join(output, "migration-dry-run-summary.md"), markdown(report));
  await fs.writeFile(path.join(output, "needs-human-review.md"), humanReviewMarkdown(report));
  console.log(markdown(report)); console.log(`Reports written to ${output}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) void main();
