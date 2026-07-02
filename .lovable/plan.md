# Add "Plan next week" to Content Studio Step 4

## Why
Your parsed calendar only contains Week 1 posts (3 total), so the "Add & generate Week N" cards I added earlier have nothing to render. We need an on-demand way to append Week 2, Week 3, … posts to the calendar, then flow them through the existing ad-generation UI.

## Backend — new edge function `venture-plan-next-week`

Input: `{ snapshotId: string, week: number }` (the *new* week number to plan).

Behavior:
1. Auth check (same pattern as `venture-parse-content-calendar` — verify user owns snapshot).
2. Load context: brand snapshot summary + all existing rows from `venture_content_calendar_posts` for this snapshot (so tone/pillars/platforms stay consistent).
3. Call Lovable AI gateway (`google/gemini-2.5-flash`) with a strict JSON-schema prompt asking for 3 posts (Instagram / Facebook / LinkedIn — mirroring the Week 1 mix) with fields: `platform, pillar, format, hook, body, cta, hashtags[], asset_notes, best_time, day`.
4. Insert rows into `venture_content_calendar_posts` with deterministic IDs `cc_ai_${sha1(snapshotId|week|platform|hook).slice(0,16)}`, `week = <requested>`, `user_id = auth uid`.
5. Return `{ count, posts }`.

Register in `supabase/config.toml` (verify_jwt = true).

## Client — `src/lib/content-autopilot.functions.ts`

Add:
```
export async function planNextWeek(snapshotId: string, week: number) {
  return invoke<{ count: number; posts: ContentPost[] }>("venture-plan-next-week", { snapshotId, week });
}
```

## UI — `src/components/hub/ContentStudio.tsx` (Step 4 only)

Compute `nextWeek = (max(allWeeks) ?? 0) + 1`. Always render a dashed "Plan Week {nextWeek}" card at the bottom of the week list, styled like the pending-week card but with a different action:

- Header: `Week {nextWeek}` badge + muted text "Not planned yet".
- Body copy: "Ask the AI to draft 3 posts for Week {nextWeek} matching your existing calendar tone and platforms."
- Button: **Plan Week {nextWeek}** (Sparkles icon). Shows spinner while running.
- On click:
  1. `await planNextWeek(snapshotId, nextWeek)` — toast on error.
  2. `qc.invalidateQueries({ queryKey: ["content-posts", snapshotId] })` so posts refetch.
  3. Toast "Week {nextWeek} drafted — 3 posts added".
  - After refetch the week becomes a pending week, and the existing "Add & generate Week N" card + Step 4 flow does the rest.

Also mirror the same "Plan Week N+1" card into Step 5 alongside the existing pending-week cards, so users who already advanced can extend without going back.

No changes to Step 1/2/3, no schema changes, no changes to ad-generation code.

## Files touched
- New: `supabase/functions/venture-plan-next-week/index.ts`
- Edited: `supabase/config.toml` (register function)
- Edited: `src/lib/content-autopilot.functions.ts` (add `planNextWeek`)
- Edited: `src/components/hub/ContentStudio.tsx` (Step 4 + Step 5 render "Plan Week N+1" card)
