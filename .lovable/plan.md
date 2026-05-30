## What I found in the logs/DB

- Doug's application (`fastresults@gmail.com`, submitted 2026-05-30 15:54 UTC) **did save successfully** to `workshop_registrations` with `status='applied'`, `tier_interest='selection'`. So the form worked.
- **No email was ever sent — to anyone.** The project has zero email infrastructure: no `email_send_log`, no templates, no send route. `submitFounderApplication` only writes to the DB and returns.
- The admin domain `notify.pathways.agency` is already verified and ready to send.
- There's an `/admin/registrations` page that lists every row in `workshop_registrations` (paid signups + applicants mixed together), but no dedicated view for **applicants** (selection-cohort submissions awaiting review).

So three things to fix: (1) wire up email sending, (2) notify the admin (and confirm to the applicant) on every new application, (3) give applicants their own page in the admin dashboard.

## Plan

### 1. Stand up Lovable email infrastructure
- Run the one-time email infra setup (creates the queue, send route, suppression handling, `email_send_log`, etc.) against the already-verified `notify.pathways.agency` domain.
- Scaffold the transactional-email pieces (send server route, unsubscribe page, registry).

### 2. Two transactional templates
- **`new-applicant-admin`** — sent to the super-admin inbox. Subject: "New Selection application — {name}". Body: founder name, email, phone, industry, stage, referral source, the full About You / About Startup / Why Now text, plus a deep link to `/admin/applicants/{id}` for one-click review.
- **`applicant-confirmation`** — sent to the founder. Subject: "We received your application — Startup Labs ATL Selection". Body: short, on-brand confirmation that we'll review and reply within ~5 business days, what to expect next, and the July 23 cohort date.

Both styled to match existing site brand tokens. Unsubscribe footer is system-appended (we will not add one).

### 3. Trigger both emails from `submitFounderApplication`
- After the successful insert, enqueue both emails server-side via the send-transactional-email route, using `idempotencyKey = "applicant-confirm-{id}"` and `"applicant-admin-{id}"` so retries are safe.
- Admin recipient is resolved at send time by querying `profiles` joined to `user_roles` where `role='super_admin'` (today: `fastresults@gmail.com`). If multiple super-admins exist, send one email each. This avoids hard-coding an address.
- Email failures are logged but **do not fail the submission** — the row is already saved, the user already got the success screen. Errors surface in `email_send_log` for the dashboard.

### 4. New "Applicants" page in the admin dashboard
- New route: `src/routes/_authenticated/_admin/admin.applicants.tsx` at `/admin/applicants`.
- Lists rows where `tier_interest = 'selection'`, newest first, with columns: Date, Name, Email/Phone, Industry, Stage, Status badge, Actions.
- Row click opens a detail drawer/page showing the full About You / About Startup / Why Now / LinkedIn / referral source.
- Status actions: **Select**, **Waitlist**, **Decline** (writes `selected | waitlisted | declined` — these are already valid after yesterday's constraint migration).
- Add an "Applicants" item to `ADMIN_NAV` under Operations (above Registrations) with an `Inbox`/`UserPlus` icon and a `newApplicants` badge count (rows with `status='applied'`). Extend `getAdminBadges` to return that count.
- Keep `/admin/registrations` as-is for the broader paid-signup view; the new page is the focused review queue.

### 5. Verification
- After deploy: re-submit a test application, then check (a) admin inbox, (b) applicant inbox, (c) `email_send_log` shows both rows as `sent`, (d) the new applicant appears in `/admin/applicants` with badge count incremented.
- Backfill: send the admin notification once for Doug's existing row so it isn't lost.

### Technical notes
- All email sending goes through the single scaffolded `send-transactional-email` route — no per-trigger custom routes.
- Admin-lookup query uses `supabaseAdmin` (service role) inside the server fn, since the applicant submitter is anonymous.
- No DB schema changes required — `workshop_registrations` already has every field needed, and `applied/selected/waitlisted/declined` are already allowed by the status check constraint.
