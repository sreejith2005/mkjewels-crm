# MK Jewels In-House CRM

Phase 0 foundation for the MK Jewels CRM. This directory contains a Next.js
App Router application, the complete Prisma data model, Supabase Auth helpers,
Postgres triggers, and Row-Level Security policies.

The legacy spreadsheet and Apps Script exports in this directory are retained
as migration references. The application does not read from or write to them.

## Requirements

- Node.js 20.9 or newer
- A Supabase project in Mumbai (`ap-south-1`)
- Email/password authentication enabled in Supabase

## Create the Supabase project

1. Sign in to Supabase and select **New project**.
2. Choose the MK Jewels organization (or create one).
3. Set a project name such as `mk-jewels-crm-production`.
4. Generate and securely store a strong database password.
5. Select the **South Asia (Mumbai)** region. The region code must be
   `ap-south-1`. The region cannot be changed after project creation.
6. Wait for the project to become healthy.
7. Open **Project Settings > API**. Copy the Project URL and the publishable
   key (the legacy `anon` key also works).
8. Open **Project Settings > Database > Connection string**. Copy both the
   transaction-pooler connection and the direct/session connection.

Do not copy the `service_role` key into this application. It bypasses RLS and
is not needed for login or normal CRM access.

## Configure local environment variables

From `web-app`:

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: Project URL from Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: publishable or legacy anon key.
- `DATABASE_URL`: transaction-pooler URL on port `6543`, used by trusted
  server-side Prisma work.
- `DIRECT_URL`: direct/session URL on port `5432`, used by Prisma migrations.

Percent-encode special characters in the database password when it appears in
a URL. Never commit `.env.local`.

## Apply the database foundation

```powershell
npm.cmd install
npm.cmd run db:validate
npm.cmd run db:generate
npm.cmd run db:deploy
```

The migration creates all Phase 0 tables, indexes, foreign keys, validation
checks, triggers, RLS helper functions, grants, and policies.

The migration deliberately does not invent branch names or user accounts.
Bootstrap real records idempotently:

1. In Supabase, open **Authentication > Providers > Email** and confirm the
   Email provider is enabled.
2. Open **Authentication > Users > Add user** and create the first admin.
   Mark the email as confirmed if this is an internal account.
3. Copy that Auth user's UUID. The UUID must also be the `public.users.id`;
   this is how `auth.uid()` maps to the CRM profile.
4. Put the real branches and users into `SEED_BRANCHES_JSON` and
   `SEED_USERS_JSON` in `.env.local`, following `.env.example`.
5. For each non-super-admin user, set `branchName` to an exact name from
   `SEED_BRANCHES_JSON`. A super admin must not have `branchName`.
6. Run:

```powershell
npm.cmd run db:seed
```

Create every person in Supabase Auth first, then add their matching Auth UUID
to `SEED_USERS_JSON`. The seed is safe to run repeatedly.

## Supabase dashboard finishing steps

1. Under **Authentication > URL Configuration**, set the Site URL to
   `http://localhost:3000` for local work. Add the eventual Vercel production
   URL and preview URL pattern as redirect URLs before deployment.
2. Under **Database > Publications**, add `clients`, `client_timeline`, and
   `entry_queue` to `supabase_realtime`. These are the Phase 0 tables that later
   live CRM indicators will subscribe to.
3. Under **Storage**, confirm the migration created the private
   `crm-documents` bucket. Do not make it public.
4. Keep public sign-up disabled for this in-house app. Create or invite staff
   accounts through an administrator-controlled process.

## Run locally

```powershell
npm.cmd run dev
```

Open `http://localhost:3000`. Unauthenticated users are sent to `/login`.
After login, the home page calls `get_my_profile()` and shows only the user's
name, role, and branch label.

## Verify

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd audit
```

The database tests use embedded PGlite/Postgres and execute the actual Prisma
migration SQL. No remote Supabase project is required for these tests.

## Access-control design

- `super_admin` has full access to every application table.
- Every active CRM user can read every client, timeline event, visit form,
  audit entry, follow-up, referral, calling record, and document, regardless
  of branch.
- Every active CRM user can create and update the shared client profile.
  `clients.last_branch_id` is informational and never grants or removes access.
- A salesperson or branch manager may insert a timeline event or visit form
  only for their own branch. A super admin may insert for any branch.
- Allocation and daily availability rows remain branch-scoped for
  salespeople and branch managers; super admins can access all branches.
- Salespeople still cannot query `users` or `branches` directly.
- Global lookup tables are readable by any active CRM user but writable only
  by a super admin.
- `client_edit_log` is writable by the database trigger, not by branch staff.
- A document metadata row and its private Storage object are globally
  readable by active staff. Only the uploader or a super admin may delete it.

Normal application reads and writes should use an authenticated Supabase
client so Postgres receives the user's JWT and enforces RLS. `DATABASE_URL`
credentials are privileged infrastructure credentials; Prisma direct database
access must be limited to migrations and explicitly authorized trusted server
jobs.

## Trigger behavior

- `client_phone_index_normalize` strips non-digits and keeps the last ten
  digits before the primary-key uniqueness check.
- `clients_field_level_audit` creates one `client_edit_log` row per changed
  column, with JSONB old/new values.
- `client_timeline_derive_event_type` derives the canonical event type from
  `buy_status` before the event is stored.
- `client_timeline_recalculate_rollups` recomputes visit totals, first/last
  dates, and latest visit details after inserts and relevant updates.

## Document paths

Document metadata is stored in `documents`; bytes are stored in the private
`crm-documents` bucket. Every object path must use:

```text
{client_id}/{timeline_id-or-general}/{uuid}_{original_filename}
```

The database rejects metadata paths that do not match the client, optional
timeline, UUID prefix, and original `file_name`.

The audit actor can be null only for system-level updates where neither an
authenticated user nor `profile_updated_by` is available. This preserves
automated changes without inventing a user identity.
