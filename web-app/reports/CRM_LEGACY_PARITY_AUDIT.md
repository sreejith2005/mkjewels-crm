# CRM Legacy Parity Audit

**Audit date:** 2026-07-29
**Mode:** Read-only analysis. No application code, database schema, migrations, workbook, deployment, commit, or push was changed.
**Source of truth:** `CRM CODE.GS`, `CRM INDEX.HTML`, `FORM CODE.GS`, and `FROM INDEX.HTML`. Legacy line numbers below are one-based.

## Evidence read

- All four requested legacy source files were read in full: `CRM CODE.GS` (5,509 lines), `CRM INDEX.HTML` (5,295), `FORM CODE.GS` (2,525), and `FROM INDEX.HTML` (3,525).
- Current application source was read in `app/`, `components/`, `lib/`, `prisma/schema.prisma`, `prisma/migrations/`, and `tests/`. No pre-existing `LEGACY_PARITY_AUDIT.md` was present in this checkout.
- Workbooks were opened/read-only. `01 CLIENT DATABASE.xlsx` contains `CLIENT DATABASE MASTER` (1,513 used rows, 66 columns), `CLIENT TIMELINE` (7,817 used rows, 17 columns), `CLIENT PROFILE EDIT LOG` (41,829 used rows, 7 columns), and `DASHBOARD CACHE` (13 used rows). `01 WALKIN DATA.xlsx` exposes `FORM DATA`, `CLIENT ENTRY LOG`, `WALKIN DATASET`, `REFERRALS`, `CLIENT DATABASE MASTER`, and `pincode` (plus report/helper sheets). Its field headers substantiate the legacy form and queue relationships; it was not saved or modified.
- Existing dirty worktree items were preserved: `components/walk-in-form.tsx` is modified and `db.$disconnect())` is untracked.

## Legacy navigation and visibility

`getCrmAppBootstrap()` returns exactly five menu items: **DASHBOARD**, **CLIENT WALKIN FORM**, **NOT BOUGHT FOLLOW UP**, **REFERRALS CALLING**, and **CLIENT DATABASE** (`CRM CODE.GS:2367-2387`). `CRM INDEX.HTML` changes the active section and loads dashboard/follow-up/referral/client data on selection (`3141-3178`). The legacy implementation has no application role model or role-dependent menu visibility; role scope in the Next/Supabase CRM is therefore a required security adaptation, not a legacy visual contract.

| Legacy section / flow | Legacy source evidence | Current equivalent | Classification | Risk / dependency |
|---|---|---|---|---|
| Dashboard | Screen and literal labels at `CRM INDEX.HTML:2475-2612`; server response `getDashboardData` at `CRM CODE.GS:2441-2452` | `app/(crm)/dashboard/page.tsx`, `components/dashboard-filter.tsx`, `lib/dashboard.ts` | **DIFFERENT** | Date/time semantics and KPI reconciliation are business-visible. |
| Client Walk-in Form | Screen at `CRM INDEX.HTML:2618-2779`; Form service endpoints and submit path in `FORM CODE.GS:1113-1247` | `/queue` -> `/visits/new?queue=…`, `components/walk-in-form.tsx` | **PARTIAL (out of current implementation scope)** | Preserve known working queue-first/phone/proof behavior; only direct comparison-established defects may change it. |
| Branch/CRM allocation, daily availability, queue registration | Allocation functions `CRM CODE.GS:1656-1979`; queue register/assignment/read functions `1992-2348` | `/allocation`, `/queue`, `components/allocation-manager.tsx`, `components/entry-queue.tsx` | **PARTIAL** | Must retain RLS and use canonical queue RPCs; current list scope differs. |
| Not Bought Follow Up | Screen/tab labels `CRM INDEX.HTML:2792-2846`; auto-sync, filtering and save/history `CRM CODE.GS:4041-4668` | `/followups`, `components/followup-queue.tsx`, `lib/followup-logic.ts`, migration `20260727060000_not_bought_followup_legacy_parity` | **PARTIAL** | Today/history/counter semantics must stay literal; source-form gaps remain visible. |
| Referrals Calling | Screen/tab labels `CRM INDEX.HTML:2849-2918`; import/sync/filter/save/history `CRM CODE.GS:5009-5507` | `/referrals`, `components/referral-entry.tsx`, `components/referral-queue.tsx`, migration `20260727070000_referral_calling_legacy_parity` | **PARTIAL** | Historical import rows lack dates/conversion links; no guessed backfill. |
| Client Database, Profile, Timeline, Edit Log | Screen at `CRM INDEX.HTML:2920-2983`; search `CRM CODE.GS:2626-2685`; profile/timeline/edit `2691-2883` | `/clients`, `/clients/[clientId]`, `components/client-database.tsx`, `components/client-profile.tsx` | **PARTIAL** | Current direct walk-in links violate the queue-required route guard. |
| System/admin helpers and reporting cache | `getSystemHealth` `CRM CODE.GS:2960-2981`; cache rebuild `2455-2485`; manual/reset/debug helpers `3091-3268` | No staff-facing settings/system-health page; dashboard computes live data | **MISSING / intentional architecture divergence** | Any exposure needs a separate restricted admin design; do not expose source IDs/errors to sales staff. |
| Exports / broadcast reporting | No user-facing export action is implemented in the four legacy source files. Workbook has `ATTRIBUTE WISE WHATSAPP BROADCA…` evidence only. | No equivalent | **NO LEGACY SCREEN CONTRACT FOUND** | Do not infer an export workflow from a workbook sheet alone. |

## Detailed parity ledger

### 1. Dashboard — DIFFERENT (recommended first phase)

| Contract | Exact legacy evidence | Current behavior | Finding |
|---|---|---|---|
| Filter vocabulary | `ALL`, `MONTH`, `WEEK`, `DATE_TO_DATE`; labels **ALL DATA**, **THIS MONTH**, **THIS WEEK**, **DATE TO DATE** (`CRM INDEX.HTML:2495-2514`) | `today`, `yesterday`, `week`, `month`, `custom` (`components/dashboard-filter.tsx:6-10`) | Current public contract is different. |
| Default | UI state starts with `mode: 'MONTH'` (`CRM INDEX.HTML:2999-3003`) | Unrecognised/absent preset becomes `today` (`lib/dashboard.ts:10-17`) | Different default. |
| Week | Legacy starts on Monday and ends today (`CRM CODE.GS:3053-3059`) | Current uses a rolling six-days-before-today range (`lib/dashboard.ts:14`) | Different date set. |
| Date-to-date | Dates are normalized, missing values default to today, endpoints are swapped if reversed, then inclusive (`CRM CODE.GS:3037-3050`, `3067-3084`) | Custom only accepts ordered ISO dates; invalid/reversed values fall back to today (`lib/dashboard.ts:16-17`) | Different resilience and date rule. |
| Time zone | `CRM_CONFIG.TIMEZONE` formats all date filters (`CRM CODE.GS:3014-3023`) | `Date.toISOString()` determines day keys (`lib/dashboard.ts:3`) | Must move range calculation to Asia/Kolkata. |
| KPIs | Nine literal counters: total walk-ins, not bought, bought, order place, repair place, order pick up, repair pickup, upsale, product return (`CRM INDEX.HTML:2521-2530`; status groups `CRM CODE.GS:1183-1193`, counts `2487-2525`) | Same nine core cards are present (`app/(crm)/dashboard/page.tsx:9`; `lib/dashboard.ts:45-54`) | **MATCH subject to status mapping test**. |
| Trend/status/summary | Daily total/bought/no trend (`CRM CODE.GS:2591-2619`); status chart; recent visits restricted to today/yesterday (`2528-2560`); branch and CRM counts (`2563-2589`) | Current has trend/status/breakdowns, but `recentVisits` is simply the latest 25 within selected range (`lib/dashboard.ts:56-83`) and adds operational-queue cards | Recent-visit rule is different; additive queue cards are not legacy parity. |
| Refresh/sync | Buttons are **RUN INCREMENTAL SYNC** and **REFRESH DASHBOARD** (`CRM INDEX.HTML:2484-2487`) | No comparable dashboard controls; runtime data is live | Requires a deliberate decision: replace with legacy-labeled safe actions, or document intentional live-data divergence. |

### 2. Client Database, Profile and History — PARTIAL

| Contract | Exact legacy evidence | Current equivalent / finding |
|---|---|---|
| Search fields | Legacy searches primary name, other names, and last-10 matches across primary, secondary, billing and other-known phones (`CRM CODE.GS:2626-2685`); UI literal placeholder lists those phone sources (`CRM INDEX.HTML:2938-2946`) | `/clients` uses `browse_clients`; UI says “Search name or any phone number” (`components/client-database.tsx:58-71`). Verify RPC inclusion of other names/all phone arrays before declaring MATCH. |
| List ordering/limit | Legacy results sort by latest visit and cap at 200 (`CRM CODE.GS:2641-2659`); initial quick list does the same (`2905-2935`) | Current paginates with an extra potential-category filter. This is additive and changes the default presentation: **DIFFERENT** until deliberately retained. |
| Result columns | Legacy has Client ID, Name, Phone, City, State, Total Visits, Last Visit, Last Status, Action (`CRM INDEX.HTML:2961-2977`) | Current includes all except adds Potential; otherwise **MATCH** (`components/client-database.tsx:67-72`). |
| Profile | Legacy returns personal data, preferences, rollups, statuses and next visit date (`CRM CODE.GS:2691-2752`), timeline ordered newest-first with `canEdit`/walk-in edit URL (`2760-2797`), and field-level audit on profile update (`2803-2883`) | Current profile has editable grouped fields, timeline and audit tabs (`components/client-profile.tsx:135-492`; page loader `app/(crm)/clients/[clientId]/page.tsx:6-45`): **PARTIAL** pending field-by-field matrix and timeline action check. |
| Walk-in action path | Legacy **ADD WALKIN ENTRY** invokes the legacy form launch (`CRM INDEX.HTML:2930-2933`; `CRM CODE.GS:2942-2948`) | Current list and profile link to `/visits/new?client=…` (`components/client-database.tsx:71`, `components/client-profile.tsx:237`), while the route requires `queue` and redirects to `/queue` when absent (`app/(crm)/visits/new/page.tsx:6-10`). This is a concrete broken action path and conflicts with the established queue-first flow. |

### 3. Allocation, availability and queue — PARTIAL

- Legacy normalizes branch/CRM values to uppercase, de-duplicates them, supports add/update/delete, and resets a branch’s daily availability after roster mutation (`CRM CODE.GS:1656-1856`). Current roster/availability controls are separate and use branch-scoped Supabase writes (`components/allocation-manager.tsx:10-16`). Keep RLS, but test the legacy reset effect and literal roster mutation feedback before classifying as MATCH.
- Legacy availability is date-keyed and only unavailable entries are persisted; it drives the CRM names made available to the registration queue (`CRM CODE.GS:1904-1979`). Current uses the same absence-means-available representation (`components/allocation-manager.tsx:16`; `/queue` and `/visits/new` query it), a **MATCH in data shape**.
- Legacy queue is loaded by CRM and branch, includes rows assigned to that CRM, and exposes an action URL (`CRM CODE.GS:2129-2348`; `CRM INDEX.HTML:2725-2778`). Current `/queue` selects one branch and fetches that branch’s rows created since its UTC day boundary (`app/(crm)/queue/page.tsx:5-10`); it does not expose the legacy CRM queue filter. **DIFFERENT** in queue visibility/date semantics.

### 4. Not Bought Follow Up — PARTIAL, mostly implemented

- Legacy eligibility is non-purchase **NO**, plus repair/order where approach is YES and products were seen (`CRM CODE.GS:4379-4387`, and `3948-3966`). It auto-syncs before listing; current offers an explicit sync action, so trigger timing is **DIFFERENT** and must be chosen intentionally.
- Literal tabs are **TODAY FOLLOW UP**, **ALL PENDING FOLLOW UP**, **INPROCESS FOLLOW UP**, **ALL DONE** (`CRM INDEX.HTML:2809-2813`). Legacy Today means open rows with blank, today, or overdue due date and sorts oldest overdue first (`CRM CODE.GS:4424-4455`). The existing current parity implementation and tests must be kept as the regression baseline.
- Legacy history count is exact `(CLIENT ID, REFERENCE NUMBER)` then client-wide fallback; save increments the parent counter and writes immutable history (`CRM CODE.GS:4494-4507`, `4548-4629`). Current migration/test coverage exists, but page-level source-link gaps must remain visible instead of fabricated.

### 5. Referrals Calling — PARTIAL, mostly implemented

- Legacy tabs are **TODAY FOLLOW UP**, **ALL PENDING**, **INPROCESS**, **ALL DONE**, **CONVERTED TO CLIENT** (`CRM INDEX.HTML:2865-2870`), with CRM and text/phone search (`CRM CODE.GS:5389-5429`). Legacy Today means open blank-or-today due dates, not overdue (`5412-5422`).
- Sync combines Walkin referrals and old FMS, deduplicates by referral key, and detects conversion through all client phone fields (`CRM CODE.GS:5102-5335`). Follow-up requires status, and for open status both next date and remark; it increments the parent counter and appends history (`5432-5507`).
- Current `referral-queue.tsx`, `referral-entry.tsx`, and migration `20260727070000_referral_calling_legacy_parity` are the implementation counterpart. Imported historical rows with null due dates/conversion IDs are a data-quality gap, not permission to backfill by guesswork.

### 6. Admin, settings, reports and exports — MISSING / gated

Legacy server helpers expose system-health data (source IDs, sheet counts, sync checkpoint) and reset/rebuild/debug runners (`CRM CODE.GS:2455-2485`, `2955-3008`, `3091-3268`). There is no corresponding visible legacy screen in `CRM INDEX.HTML`, and the current app has no settings route. Do not surface raw source/database diagnostics to staff. A future super-admin-only operational page needs separate approval, a narrow safe action list, and no service-role client path.

## Workbook cross-checks and data dependencies

- Legacy client master columns support the profile/timeline/audit contract: identity/phones, location, preferences, rollups, last-visit fields, potential/status fields, and profile metadata. The timeline and edit-log sheet headers align with the Apps Script APIs.
- `WALKIN DATASET` supplies the visit fields used by queues: CRM client ID, visit/client type/source, branch/CRM, phones, status, repair/order approach, categories, engagement/proof fields, next-visit date, potential, product requirement, communication preference, and reference number. `CLIENT ENTRY LOG` provides token, client, mobile, branch, assigned CRM, status, form timestamp, client ID and remark. `REFERRALS` provides timestamp, CRM, salesperson, given-by name, referral name, and referral number.
- No historical client/referral relationship should be inferred from names alone. Unknown values must remain visible/auditable; repair requires an approved data decision.

## Recommended implementation order (approval-gated)

1. **Dashboard filter and summary parity (small, high-value, no migration expected).** Restore the exact legacy filter vocabulary/defaults, Asia/Kolkata calendar computation, Monday week, inclusive/swapped date-to-date behavior, and legacy recent-visit rule. Keep existing nine-card status tests and add boundary tests.
2. **Client Database/profile action and contract parity.** Repair the invalid direct `/visits/new?client=` links by routing through the established queue-first registration flow; then test legacy search/order/limit, profile fields, timeline edit eligibility, and audit presentation. No new walk-in form.
3. **Queue/allocation/availability parity.** Reconcile branch/CRM filtering, India-time day boundary, round-robin/availability behavior, and roster mutation/reset semantics under RLS. Add migration only if database behavior—not presentation—is proven missing.

Not Bought and Referrals are already backed by dedicated legacy-parity migrations and should be treated as regression-protection work after the above, unless a manual test identifies a reproducible mismatch.

## Approval needed before editing

Please approve **Phase 1: Dashboard filter and summary parity** and confirm one policy choice: should legacy-labelled **RUN INCREMENTAL SYNC** / **REFRESH DASHBOARD** controls be restored as safe, role-restricted actions, or should the live-query dashboard intentionally omit them? No database write or migration is proposed for the baseline dashboard phase; if the answer changes that scope, I will return a migration/RLS plan first.
