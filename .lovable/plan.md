# Applications: capture, triage, confirm — end to end

## Mission

Right now, when someone fills out the free-cohort selection form, three things are broken:

1. **They get no acknowledgement.** No email tells them we received it or what happens next.
2. **The admin has no place to see them.** The form writes into `workshop_registrations`, but the admin "Registrations" page mixes them in with paid registrants — and there's no way to read the full application, leave notes, or move someone from "applied" to "selected."
3. **The conceptual model is wrong.** "Registrants" are people who are *attending*. "Applicants" are people *asking to be considered*. They need to be separate, both in the database and in the admin UI.

The admin needs a complete management workflow: see the queue, open any application to read every field in full, take notes over multiple sessions, change status through the funnel, and when someone is selected, promote them into the actual registration list — without losing the application history.

## Plan

### 1. New `founder_applications` table (separate from registrations)

Create `public.founder_applications`:
- **Identity**: `name`, `email`, `phone`, `linkedin_url`
- **Application body** (discrete fields, not the concatenated `business_idea` blob): `about_you`, `about_startup`, `why_now`
- **Context**: `industry`, `stage` (idea/early/existing), `referral_source`, `can_attend`, `cohort_id`
- **Triage state**: `status` `CHECK` constraint with values `applied | reviewing | shortlisted | selected | waitlisted | rejected | withdrawn` (default `applied`)
- **Promotion link**: `converted_registration_id uuid null` — set when a selected applicant becomes a paid registrant, so we can navigate from the application to the registration and back
- **Audit**: `reviewed_by uuid`, `reviewed_at timestamptz`, `status_changed_at timestamptz`, `created_at`, `updated_at`

RLS: anon + authenticated may `INSERT` (public form); only admins/super_admins may `SELECT/UPDATE/DELETE` (via `is_admin(auth.uid())`). Full GRANTs for anon/authenticated/service_role per the public-schema rule. Trigger to keep `updated_at` and bump `status_changed_at` when `status` changes.

Backfill the 2 existing `status='applied'` rows from `workshop_registrations` (both Doug's test submissions) by parsing the concatenated `business_idea` blob back into the three fields, then delete them from `workshop_registrations`.

### 2. New `application_notes` table (admin notes — append-only thread)

The user explicitly asked for the ability to make notes. A single `admin_notes` text column is fragile (one admin can overwrite another, no timeline). Instead:

`public.application_notes`:
- `application_id uuid` (FK semantics enforced by query)
- `author_id uuid` (the admin)
- `body text`
- `created_at timestamptz`

RLS: admins only for all operations. Renders as a chronological thread on the application detail page, like comments.

### 3. Application detail page (the missing review surface)

New route: `src/routes/_authenticated/_admin/admin.applications.$id.tsx`

Two-column layout:
- **Left (main column)**: Header with name + email + status pill + applied-date + cohort. Then full unabridged content of every field — "About you," "About the startup," "Why now," industry, stage, referral source, LinkedIn (clickable), phone, can-attend confirmation. Nothing truncated. Copy-to-clipboard on email/phone.
- **Right (sidebar, sticky)**:
  - **Status workflow**: a vertical stepper `applied → reviewing → shortlisted → selected` with side actions for `waitlist` / `reject` / `withdraw`. Click a step to advance; confirmation modal on terminal actions (select / reject) so a misclick is recoverable. Each change logs an automatic system note ("Status: applied → reviewing by Doug · 2026-05-30").
  - **Promote to registration**: button enabled only when status is `selected`. Creates a row in `workshop_registrations` with `tier_interest='selection'`, `status='confirmed'`, `cohort_id`, `assigned_tier='selection'`, and stores the new registration id in `converted_registration_id`. Idempotent — if already converted, button becomes a link to the registration row.
  - **Notes thread**: textarea + Add button → posts to `application_notes`. Thread renders newest-first with author name and timestamp. Notes are never edited or deleted (audit integrity); the admin can post a follow-up correction if needed.
- **Top bar**: back arrow to the list, "Open in Gmail" mailto link with a pre-drafted reply, keyboard `j`/`k` to move to next/prev application in the current list.

### 4. Applications list page (the queue)

New route: `src/routes/_authenticated/_admin/admin.applications.tsx`

- Top: count chips per status (Applied 12 · Reviewing 3 · Shortlisted 5 · Selected 2 · Waitlist 1 · Rejected 4). Clicking a chip filters.
- Search box (matches name/email/industry).
- Compact table: date · name · email · industry · stage · status pill · one-line excerpt of `about_startup`. Whole row is clickable → detail page.
- Empty state: friendly "No applications match this filter yet."
- Default sort: oldest-applied first within `applied` status (so the queue is fair); newest-first for other statuses.

### 5. Sidebar + dashboard + server functions

- Add **Applications** to `AdminSidebar.tsx` *above* Registrations, with a live count badge of `applied + reviewing` (the actionable queue).
- Add **Applications** to `AdminCommandMenu.tsx`.
- Rewrite the admin dashboard `admin.index.tsx`:
  - Stat cards: **Applications to review** (`applied + reviewing`) · **Applications total** · **Registrations confirmed** · **Accounts**
  - Two stacked recent-activity sections: **"New applications"** (latest 8, links to detail page) and **"Confirmed registrations"** (latest 8)
- New server fns in a dedicated `src/lib/applications-admin.functions.ts`:
  - `listApplications({ status?, search? })`
  - `getApplication({ id })` — returns application + notes thread + linked registration if any
  - `updateApplicationStatus({ id, status })` — writes status, sets `reviewed_by`/`reviewed_at`, inserts a system note
  - `addApplicationNote({ applicationId, body })`
  - `promoteApplicationToRegistration({ id })` — idempotent, creates the registration row and links it
  - All `.middleware([requireSupabaseAuth])` + assertAdmin

### 6. Form server fn rewrite (`submitFounderApplication`)

Insert into `founder_applications` with discrete fields. On success, enqueue the confirmation email (step 7) with idempotency key `application-confirm-<id>`. Email failure is logged but never blocks the submit response.

### 7. Email infrastructure + `application-received` template

Project currently has no email domain or queue. Sequenced setup after plan approval:
1. Prompt the user to set up an email subdomain (e.g. `notify.startuplabs.online`) via the email-domain setup dialog. They add NS records; verification runs asynchronously.
2. Set up shared email infrastructure (queue, tables, cron).
3. Scaffold app emails.
4. Add one React Email template `application-received.tsx` (registered in `registry.ts`).

**Email copy** (white body, brand colors from `src/styles.css`):
- **Subject**: `We got your Launch Pad ATL application, {firstName}`
- **Preview**: `You're on our list — here's what happens next.`
- **Body**:
  - "Thanks, **{firstName}** — your application for the **July 23, 2026 Atlanta selection cohort** is in."
  - **What happens next** (numbered):
    1. We read every application personally — usually within 5 business days.
    2. If we see a strong fit, you'll get an email with a 15-minute scheduling link for a founder call.
    3. After the call we confirm your seat. Tuition, materials, and lunch are all covered — your seat costs you nothing.
  - **While you wait**: one line — "If you forgot something or want to add context, just reply to this email."
  - Sign-off from the program team.
- No CTA button (this is acknowledgement, not conversion). System auto-appends the unsubscribe footer.

Sends are queued, so they'll dispatch automatically once DNS verifies — submissions that come in before verification still get emailed once the domain goes active.

## Technical notes

- Two new tables follow the 4-step migration shape: CREATE TABLE → GRANTs → ENABLE RLS → POLICIES. Status uses a `CHECK` constraint (not `CREATE TYPE`) so it's reversible.
- Backfill is a one-shot inside the same migration; only 2 rows, both test data.
- Promotion to registration is wrapped in a SECURITY DEFINER function `promote_application(_app_id uuid)` so the insert into `workshop_registrations` + the update of `converted_registration_id` are atomic.
- System-generated status-change notes are inserted in the same server-fn handler as `updateApplicationStatus`, with `author_id = context.userId` and a body like `Status changed: applied → reviewing`.
- All admin reads of `founder_applications` go through `requireSupabaseAuth` + `assertAdmin` server fns (RLS is the backstop, not the gate).
- `workshop_registrations` is untouched structurally; the public form just stops writing to it. Existing paid-tier flow (`createRegistration`) is unaffected.

## Order of operations after approval

1. Run the migration (creates both tables, backfills, drops the 2 test rows from `workshop_registrations`).
2. Add server fns + Applications list page + Applications detail page + sidebar/command-menu/dashboard updates.
3. Rewrite `submitFounderApplication` to write to the new table.
4. Email domain setup dialog → email infra → app-emails scaffold → `application-received` template → wire the send into `submitFounderApplication`.
