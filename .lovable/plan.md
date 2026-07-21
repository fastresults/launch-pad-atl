## Goal
The `/private-tuesday` page should always show a rolling 8-week window of open Tuesdays without any admin action. As each Tuesday (and each time slot within today) elapses, it disappears and a new Tuesday appears at the tail.

## Current state (verified)
- `private_session_slots` is seeded through **Tuesday, Sep 8, 2026** — a fixed 8-week window from when it was first generated. Nothing extends it.
- `ensure_private_session_slots()` already exists and is idempotent (ON CONFLICT DO NOTHING) — it inserts the next 8 Tuesdays × 3 time blocks. But nothing calls it on a schedule.
- `get_upcoming_private_session_slots()` filters `session_date >= current_date`, so past *days* already drop off automatically. What it does **not** do: hide time blocks earlier today whose `end_time` has already passed (e.g. the 9:30–11:30 AM slot still shows at 2 PM on a Tuesday).

## Changes

### 1. Auto-extend the window (daily cron)
Enable `pg_cron` + `pg_net` and schedule a job that runs `ensure_private_session_slots()` once a day just after midnight America/New_York. Because the function is idempotent, it safely tops the window back up to 8 future Tuesdays every day — so as one Tuesday elapses, a new one appears at the end.

Registered via `supabase--insert` (not migration) since cron SQL contains project-specific URLs/keys.

### 2. Hide past-today time slots
Update `get_upcoming_private_session_slots()` so a slot on today's date is excluded once its `end_time` has passed (evaluated in America/New_York, since the workshop is at IGNITE in Atlanta). Future days are unaffected.

### 3. No UI changes required
The page already renders whatever the RPC returns and the "next 8 weeks" copy stays accurate because the window is always kept at 8 weeks by the cron.

## Technical notes
- Cron cadence: `5 0 * * *` (00:05 daily) — cheap, and one-per-day is enough since Tuesdays only elapse once a week.
- Timezone handling for #2: `(current_date + end_time) AT TIME ZONE 'America/New_York' > now()` guard added to the existing WHERE clause.
- No schema changes, no new tables, no client changes.
