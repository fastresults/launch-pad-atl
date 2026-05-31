# Reversible approval + Paused account screen

## Today

`/admin/members` only has Approve / Reject / Mark contacted, with no clean way to take approval back. The `_authenticated` gate (`src/routes/_authenticated.tsx`) sends any non-approved member to `/welcome`, which is written for brand-new applicants — wrong tone for someone whose access was revoked.

We need (1) reversible approval in the admin UI and (2) a distinct "your account is paused" experience for previously-approved members, separate from the new-applicant welcome flow.

## Plan

### 1. New `paused` member status

Add `'paused'` to the allowed values of `profiles.member_status` (currently `pending | approved | rejected`). Migration: drop+recreate the check constraint (or expand the enum if one exists) to include `paused`. No other column changes — `approved_at`, `approved_by`, `approved_via` stay populated as the audit trail of the prior approval.

Update `MemberRow` typing and the `assertAdmin`-gated server fns to know about `paused`.

### 2. New server fn: `pauseMember` (replaces "revoke" wording)

In `src/lib/members-admin.functions.ts`. POST, admin-gated. Input `{ userId: uuid, reason?: string ≤1000 }`.

- `profiles`: set `member_status = 'paused'`, store `reason` in `rejected_reason` (re-used as the pause/decline note column), keep `approved_at/by/via` intact.
- `member_intakes`: leave as `converted`. Pausing isn't a re-review.
- Return `{ ok: true }`. No email.

### 3. New server fn: `restoreMemberToPending`

For rejected members only. Sets `member_status='pending'`, clears `rejected_reason`, resets `member_intakes.status='submitted'`. Used from the Rejected tab.

### 4. Admin UI changes (`admin.members.tsx`)

Make actions tab-aware and add a fifth tab:

- Tabs: **Pending • Approved • Paused • Rejected • No intake** (counts update accordingly).
- **Pending / No intake**: Approve, Mark contacted, Reject. (Unchanged.)
- **Approved**: show `approved_at` + `approved_via` badge inline; primary action **Pause access** (destructive). Confirm with `window.confirm("Pause {name}'s access? They will see the paused-account screen until you reinstate them.")`. Optional reason via `window.prompt`.
- **Paused**: show **Reinstate** (primary, calls `approveMember` — re-sets to approved + `approved_via='admin'`) and **Reject** (secondary).
- **Rejected**: **Move to pending** and **Approve**. Hide Reject.

Toasts: "Access paused" / "Member reinstated" / "Moved back to pending". Invalidate `["admin","members"]` after each.

### 5. New route `/paused` for the gated screen

Create `src/routes/_authenticated/paused.tsx`. Renders a polished, on-brand screen with the StartupLabs logo (theme-aware, per the recent logo fix), heading **"Your account is paused"**, and short award-winning copy:

> Access to your founder dashboard has been temporarily paused by the StartupLabs team. Your work is safe — nothing has been deleted. If this feels like a mistake or you'd like to discuss reinstatement, send us a note below and we'll get back to you within one business day.

Below that, an **Inquiry form** (name pre-filled from profile, email pre-filled and read-only, subject pre-filled with "Account paused — request review", message textarea). Submitting calls a new thin server fn `submitPausedAccountInquiry` that inserts into the existing `inquiries` table (admin already has `/admin/inquiries`) with `subject` prefixed `[Paused account]` and the user's `user_id` referenced in `message` for traceability. Sign-out button in the corner.

### 6. Update the auth gate

In `src/routes/_authenticated.tsx`:

- If `member_status === 'paused'` → redirect to `/paused` (allow `/paused` itself).
- If `member_status === 'pending' | 'rejected'` → existing `/welcome` redirect (unchanged).
- Approved → through.

`/welcome` keeps its current new-applicant copy; the paused screen is its own thing.

## Files

- new migration: expand `member_status` allowed values to include `'paused'`
- edit: `src/lib/members-admin.functions.ts` (add `pauseMember`, `restoreMemberToPending`, update status enums)
- new: `src/lib/paused-inquiry.functions.ts` (`submitPausedAccountInquiry`)
- edit: `src/routes/_authenticated/_admin/admin.members.tsx` (tab-aware actions + Paused tab)
- new: `src/routes/_authenticated/paused.tsx`
- edit: `src/routes/_authenticated.tsx` (paused → `/paused` redirect)

No new tables, RLS unchanged (server fns use `supabaseAdmin`; inquiries insert is already open to authenticated users via existing policy).
