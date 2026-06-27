## Goal

When a user deletes their final venture (zero `venture_snapshots` remain), automatically wipe every founder/brief field that was populated from earlier venture work, so screens like `/dashboard/brief` and `/dashboard/profile` open fresh — no leftover answers from the prior startup.

## Scope of "fields to reset"

Per-user tables that currently survive venture deletion and cause pre-population:

- `attendee_business_brief` — the 10 brief answers + completeness_score
- `attendee_founder_profile` — right_person_reason, unfair_advantage, etc.
- `attendee_founder_memory` — synthesized founder context
- `attendee_market_profile`
- `attendee_goals`
- `attendee_stage_intake`
- `attendee_filing_info`
- `attendee_profiles` — only venture-derived fields (industry, stage, business idea summary). Identity fields (full_name, email, avatar, contact info) are preserved.

`venture_documents`, `venture_generation_jobs`, `attendee_documents` already cascade off `venture_snapshots`, so they need no extra work.

## Approach

1. **New SECURITY DEFINER RPC `reset_founder_workspace(_user_id uuid)`**
   - Caller must be the owner (`auth.uid() = _user_id`) or an admin.
   - Verifies `SELECT count(*) FROM venture_snapshots WHERE user_id = _user_id = 0` before wiping (guard against accidental calls while a venture still exists).
   - Deletes rows from the per-user tables above; for `attendee_profiles`, performs an UPDATE that nulls only venture-derived columns.
   - Returns the list of tables cleared (for the toast).

2. **Wire it into deletion paths in `src/lib/foundersHub.functions.ts`**
   - `deleteSnapshot` (user path) and `adminForceDeleteSnapshot` (admin path): after a successful delete, query remaining snapshot count for that user; if zero, invoke `reset_founder_workspace`.
   - Emit a `venture-sources:changed` event and invalidate the relevant React Query keys (`["my","brief"]`, `["my","profile"]`, `["my","founder-memory"]`, hub list) so the UI re-reads empty data immediately.

3. **Confirmation UX in the Hub delete dialog**
   - When the snapshot being deleted is the user's last one, the existing confirm dialog gains a second line: "This is your last venture. Deleting it will also clear your Founder Brief, Profile intake, and Market answers so your next venture starts fresh." (Plain language, no scary jargon.)
   - Admin force-delete shows the equivalent warning.

4. **Defensive client-side fallback**
   - On mount of `/dashboard/brief` and `/dashboard/profile`, if `venture_snapshots` count is 0 AND brief/profile rows still contain data, surface a one-time "Reset leftover answers" banner that calls the same RPC. Covers users whose prior deletions happened before this change shipped.

## Out of scope

- Manual "Reset profile" button on the Profile page (already exists) — unchanged.
- Cohort registration, role, and member-status data — preserved.
- Any deck/asset cleanup beyond what cascades today.

## Technical notes

- All writes go through the new RPC so RLS and the "zero ventures" guard live in one place.
- Migration adds the function + GRANT EXECUTE TO authenticated, service_role.
- No schema changes to existing tables.
