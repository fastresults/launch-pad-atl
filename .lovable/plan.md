
## Goal

Anyone can sign up, but the dashboard stays locked until the user is recognized as an approved member. There are **two paths to approval**:

1. **Manual** — super admin approves them from the admin dashboard after reviewing their intake.
2. **Automatic** — a successful workshop registration payment unlocks the dashboard the moment it's received.

Either path puts the user in the same `approved` state and grants identical dashboard access.

## New user journey

```text
Sign up  ──►  /welcome  ──►  Submit intake  ──►  "We'll be in touch"
                  │                                    │
                  │                                    ▼
                  │                       Super admin reviews in
                  │                       /admin/members  ──► Approve ──┐
                  │                                                     │
                  └──► Registers + pays for a workshop ─────────────────┤
                                                                        ▼
                                                     member_status = approved
                                                     Approval email + dashboard unlocked
```

Admins and super admins skip the gate entirely (existing behavior preserved).

## What changes

### 1. Membership status on profiles
Add `member_status` to `public.profiles` with values `pending | approved | rejected`, default `pending`. Add `approved_at`, `approved_by` (nullable — null when auto-approved by payment), `approved_via` (`admin | payment`), `rejected_reason`. Update the `handle_new_user` trigger so brand-new users start as `pending` (the first user still becomes `super_admin` automatically).

### 2. Member intake table
New `public.member_intakes` linked to `user_id` (one row per user, unique):
- `startup_type` (short text — e.g. "online services", "main street", "tech", "other")
- `startup_name` (optional)
- `one_line_idea` (short text)
- `supporting_info` (longer text — stage, who it serves, why now, anything else)
- `status` (`submitted | contacted | converted | closed`)
- `submitted_at`, `reviewed_at`, `reviewer_id`, `admin_notes`

RLS: owner can insert/read/update their own row; admins can read/update all. (Reusing existing `inquiries` is wrong — those are anonymous contact-form rows with no `user_id` link.)

### 3. New route: `/welcome` (authenticated, pre-approval)
- Friendly hero: "Welcome, {name}. Let's see what you're building."
- If no intake row yet → render the intake form.
- After submit → success state: "Thanks. Someone from the team will reach out to arrange your workshop." Show the submitted answers read-only with an "Edit" affordance until status leaves `submitted`.
- Secondary CTA: **"Skip the wait — register for a workshop"** linking to `/register`. Paying immediately unlocks the dashboard.
- Sign out button in the header.

### 4. Dashboard gate
Update `_authenticated.tsx` (or add a child guard on `/_authenticated/dashboard`) so that, after the auth check, it also reads `member_status`:
- `approved` → render dashboard.
- anything else → `<Navigate to="/welcome" />`.
- admins/super admins bypass.

Mirror the inverse on `/welcome`: if already `approved`, redirect to `/dashboard`.

### 5. Auto-approval on paid registration (new)
Approval also happens automatically when a `workshop_registrations` row reaches a paid state. Implementation:

- **Database trigger** on `public.workshop_registrations` (AFTER INSERT OR UPDATE): when `status` transitions into `paid` or `confirmed` AND the registration's email matches an existing `auth.users.email` (or a future `user_id` column — see below), set the matching `profiles.member_status = 'approved'`, stamp `approved_at = now()`, `approved_by = null`, `approved_via = 'payment'`. Idempotent (no-op if already approved).
- **Add `user_id uuid` to `workshop_registrations`** (nullable for legacy/anonymous rows). New registrations created while signed in store the user's id; the trigger prefers `user_id` and falls back to email match for anonymous-then-signed-up cases.
- **Backfill** in the same migration: any existing user whose email matches a `paid`/`confirmed` registration is set to `approved` so current paying users aren't locked out.
- **Email**: reuse the same `member-approved` template; include a note like "unlocked via your workshop registration."

### 6. Signup & login redirects
- `signup.tsx` post-confirm redirect: admins → `/admin`, approved members → `/dashboard`, everyone else → `/welcome`.
- `login.tsx` same branching.
- After successful checkout, the existing post-payment redirect lands on `/dashboard` — if the trigger fired, the gate now passes; if not (rare race), `/welcome` re-checks status on focus.

### 7. Admin: Members queue
New route `/admin/members` (and `/admin/members/$userId` detail):
- Tabs: Pending intake / Approved / Rejected / No intake yet.
- Row shows name, email, startup type, **approval source** (`admin` / `payment` / —), submitted date.
- Detail view shows the full intake + notes box, with actions: **Approve as member**, **Reject** (with reason), **Mark contacted**.
- Approve sets `member_status = 'approved'`, `approved_via = 'admin'`, stamps `approved_by`, sets `member_intakes.status = 'converted'`, enqueues the approval email.
- Add a "Members" link to the admin sidebar/index alongside Inquiries, Applications, Registrations.

### 8. Emails (reuse the existing transactional queue)
- `member-intake-received` → confirmation to the new member.
- `member-intake-admin-notification` → to the admin inbox.
- `member-approved` → "You're in. Here's your dashboard link." (used for both admin and payment approval; copy adapts based on `approved_via`).
- `member-rejected` (optional) → polite decline with reason.

### 9. Out of scope (intentionally)
- No changes to the public landing pages or cohort seat logic.
- No changes to `founder_applications` (the free-cohort application is a separate funnel).
- No changes to the payment/checkout flow itself — only the post-payment side effect (the trigger) is new.

## Technical notes

- **Migration order** (single migration): add columns to `profiles`; add `user_id` to `workshop_registrations`; create `member_intakes` with GRANTs, RLS, `updated_at` trigger; create the auto-approval trigger on `workshop_registrations`; backfill (existing paid registrants → approved; existing admins/super_admins → approved); update `handle_new_user` to keep defaulting new rows to `pending`.
- **Gate implementation**: extend `useAuth` to expose `memberStatus` and `approvedVia` (loaded via a tiny server fn alongside roles) so route guards and the sidebar read it without a second round-trip. The existing `onAuthStateChange` invalidation already covers re-checks after payment-driven approval.
- **Server functions** (all under `src/lib/`):
  - `member-intake.functions.ts` — `getMyIntake`, `submitMyIntake`, `updateMyIntake` (auth-protected).
  - `members-admin.functions.ts` — `listMembers`, `getMemberDetail`, `approveMember`, `rejectMember`, `markMemberContacted` (admin-only).
- **Approval email dispatch**: the trigger only flips the status flag. A small server-side reconciler (called from the existing post-checkout server fn and from the admin approve action) enqueues the `member-approved` email, so the email path stays in app code and the DB trigger stays side-effect-light.
- **Admin link**: add to `admin.index.tsx` tiles and `_admin.tsx` nav.
