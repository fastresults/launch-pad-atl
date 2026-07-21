## Update Private Tuesday sessions: 90 min blocks, 10 min breaks, 9:30 AM – 5:30 PM

### New daily schedule (4 blocks fit cleanly)
Each session is 1h 30m with a 10-minute break between:

1. 9:30 AM – 11:00 AM
2. 11:10 AM – 12:40 PM
3. 12:50 PM – 2:20 PM
4. 2:30 PM – 4:00 PM

A 5th block (4:10–5:40) would run 10 minutes past the 5:30 PM cutoff, so 4 blocks is the max that respects the window and the break rule. If you want a 5th, we'd need to drop one break or trim the window — flag which and I'll adjust.

### Changes

**Database** (`supabase--migration`)
- Rewrite `ensure_private_session_slots()` to seed the four new start times (09:30, 11:10, 12:50, 14:30) with 90-minute duration.
- Delete future unbooked slots that don't match the new times (keeps any already-booked slots intact so we don't strand a customer; I'll list any conflicts before deleting).
- Re-run the function to backfill the rolling 8-week window.
- Daily cron already calls this function — no cron changes needed.

**Copy sweep**
- `src/routes/private-tuesday.tsx` — subhead: "Four 90-minute blocks, 9:30 AM–4:00 PM" (or similar), plus any "two-hour" phrasing.
- `src/lib/chatbot-knowledge.ts` — update session length, times, and break note.
- `src/components/home/HomeFramework.tsx` secondary CTA — verify wording (currently just says "Private Tuesday at IGNITE — $397", likely fine; adjust only if it mentions duration).
- `src/routes/services.tsx`, `/one-on-one`, `AccessModeDialog`, and any other file referencing "2-hour" / "two-hour" / old times — rg sweep and update.

### Verification
- `rg` for `2-hour|two-hour|9:30|11:30|1:30|3:30|12:00|2:30` to confirm no stale references remain.
- Query `private_session_slots` to confirm only the four new start times exist for future Tuesdays.
- Load `/private-tuesday` and confirm each Tuesday shows the four new blocks.
