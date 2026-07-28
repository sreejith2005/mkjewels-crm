# MK Jewels In-House CRM — Master Plan v1

Status: FINALIZED STACK, ready for execution
Owner: Sreejith | Orchestrator: Claude | Builder: Codex (in `sreejith-crm/web app`)

---

## 1. Why the old system failed (and what that means for this build)

Real data checked from the uploaded sheets: ~538 clients, ~2,400 timeline events, ~9,500 edit-log rows, ~1,500 walk-in records. This is a **small** dataset. The lag was never a data-volume problem — it was Google Sheets/Apps Script hitting its execution-time and concurrent-write ceiling. That means:

- We don't need "big data" infrastructure.
- We need a system that handles **concurrent writes correctly** (50 salespeople hitting save at once), keeps a **full audit trail** (like the existing edit log, but reliable), and never silently corrupts or drops a record.
- Reliability and correctness > raw scale, for this project.

---

## 2. Final Stack Decision

| Layer | Choice | Why |
|---|---|---|
| Frontend + Backend | **Next.js (App Router, TypeScript)** | One codebase, one deploy, easiest for a solo dev + coding agent to maintain. Converts cleanly to PWA later, and the same React components carry over if we wrap it as a mobile app (React Native / Capacitor) in v2. |
| Database | **PostgreSQL via Supabase** | Relational data with real referential integrity (clients ↔ visits ↔ timeline ↔ audit log) — this is exactly what Sheets couldn't give us. Supabase bundles Postgres + Auth + Row-Level Security + Realtime + File Storage in one managed service, hosted in the Mumbai (ap-south-1) region for low latency. This avoids building auth, file storage, and realtime sync by hand. |
| ORM | **Prisma** | Typed schema, reliable migrations, most heavily-documented ORM — this matters because Codex will be generating a lot of this code and needs a well-trodden path to avoid subtle bugs. |
| Auth & Access Control | **Supabase Auth + Postgres Row-Level Security (RLS)** | Roles: `super_admin` (sees/edits everything, all branches), `branch_manager` (optional, branch-scoped admin), `salesperson` (branch-scoped, can create/edit clients and visits, cannot touch other branches or admin settings). RLS enforces this at the database level, not just in app code — so a bug in the UI can't leak cross-branch data. |
| Realtime | **Supabase Realtime** | Powers "someone else is editing this client" indicators and live dashboard updates. Also the foundation we'll reuse later for two-way Runo sync. |
| File Storage | **Supabase Storage** | Replaces Google Drive uploads (documents, ID proofs, screenshots). |
| Forms | **React Hook Form + Zod** | The walk-in form has 100+ fields with conditional branching (mirrors the Runo Status → Source of Lead → nested field logic). RHF + Zod handles conditional validation cleanly and performantly. |
| Data fetching / caching | **TanStack Query (React Query)** | Client-side caching + optimistic updates now; this is also the natural layer to swap in an offline queue later (v2) without rewriting the app. |
| Hosting | **Vercel** (frontend/API) + **Supabase** (DB/Auth/Storage/Realtime) | Zero-ops, autoscaling, preview deployments per change — good fit for an agent-driven iterative build where we'll deploy constantly. |
| Error monitoring | **Sentry** | The old system failed silently for a long time before anyone noticed. This time we get alerted immediately. |
| Testing | **Vitest** (unit) + **Playwright** (e2e) | Safety net for agent-generated code — every core flow (client lookup, visit save, dedup merge) gets a test. |
| CI | **GitHub Actions** | Runs tests + type-checks on every push before it can reach production. |

**Explicitly deferred to v2/v3** (per your calls): offline-first/PWA sync, WhatsApp Business API send integration, native mobile app, Runo two-way sync. The schema below is designed so none of these require a rewrite when we get there.

---

## 3. Data Model (translated from your Sheets into proper relational tables)

This preserves every concept from your existing system but makes it correct and queryable instead of formula-and-script-held-together:

- **`branches`** — id, name, address, active. (5 today, designed to scale to any number.)
- **`users`** — id, name, phone, email, role (`super_admin` / `branch_manager` / `salesperson`), branch_id (null for super_admin), active.
- **`clients`** — the master profile. All the fields from `CLIENT DATABASE MASTER` (primary/other names, primary/secondary/billing/other phones, gender, location fields, community, DOB, anniversary, beverage/sugar/snack, gift history) **plus** rollup fields (total visits, total purchase/non-purchase/repair/order visits, last visit date, last buy status, last branch/CRM/salesperson, potential category, Instagram/Google review/testimonial/referral status, next visit date). Rollups are maintained by a **Postgres trigger** on visit insert — not by a nightly script — so they're never stale.
- **`client_phone_index`** — normalized (last-10-digit) phone numbers mapped to client_id, with a unique constraint. This is the dedup/merge key, replacing the manual `derivePhoneKey_` logic with a DB-enforced rule.
- **`client_timeline`** — one row per visit/event: date, type, buy status, branch, CRM name, salesperson, categories seen/bought/ordered, remark, reference number.
- **`client_edit_log`** — full field-level audit trail, populated automatically via a Postgres trigger (old value / new value / who / when / source) — not by manually logging in app code, so it can't be forgotten.
- **`visit_forms`** — the full detailed walk-in intake (companions, product categories, ask-flags for Instagram/Google review/testimonial/referral, occupation, bridal status, etc.), one row per visit, linked to `client_timeline`.
- **`entry_queue`** — the token-based front-desk intake flow (client walks in → front desk logs name/mobile/branch → assigned salesperson completes the full form).
- **`crm_allocation`** — which salesperson/CRM name is available at which branch, per day (replaces the "Branch CRM Allocation" + "Daily Availability" logic).
- **`not_bought_followups`** + **`not_bought_history`** — the follow-up pipeline for clients who visited but didn't purchase.
- **`referrals`** + **`referral_calling`** — the referral pipeline.
- **Lookup tables** — cities/pincodes, communities, product categories, beverages/snacks/gifts, not-bought reasons. In the old system these were hardcoded in Apps Script; here they're admin-editable rows in the DB, so adding a new snack option doesn't require a code change.

---

## 4. Build Sequence (all features in scope for v1, sequenced so each phase is independently testable)

| Phase | Deliverable |
|---|---|
| 0 | Repo scaffold, Supabase project, Prisma schema for all tables above, auth + RLS, branches/users seeded |
| 1 | Core client CRM: phone-number lookup → instant full profile + history (the flagship "type in phone, see everything" flow), manual client create/edit, audit log visible on profile |
| 2 | Visit intake: entry-queue token flow + full conditional walk-in form + auto-creates timeline event + auto-updates client rollups |
| 3 | Branch/CRM allocation + daily availability admin screens |
| 4 | Not Bought Followup pipeline |
| 5 | Referral Calling pipeline |
| 6 | Dashboard & reporting (replaces the "Dashboard Cache" sheet with real Postgres materialized views + charts) |
| 7 | **Data migration**: import the real 538 clients / 2.4K timeline / 9.5K edit-log / 1.5K walk-in rows from your two Sheets into the new schema, applying the phone-key dedup/merge logic during import |
| 8 | Hardening: test coverage on core flows, Sentry wired in, load test to 50 concurrent writers, staging vs. production split |

We build and verify phases in order, but nothing here is a "someday" — all of it is in v1 scope as you specified.

---

## 5. How we'll work together from here

For each step, I'll write a fully-specified Codex prompt (context, exact task, constraints, and — critically — an instruction for Codex to end its own run with a structured summary of what it did, what decisions it made, and what it needs confirmed). You paste that prompt into Codex in `sreejith-crm/web app`, then bring me Codex's output/summary. I review it, and write the next prompt. Repeat through all 8 phases.

**Next message: Phase 0, Prompt 1 — repo scaffold + Supabase project + full Prisma schema.**