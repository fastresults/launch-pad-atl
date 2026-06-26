## Problem

The "Today" dashboard card and the brief intro show **"You're 0 of 10 done"** even when the user already has all 10 answers saved. Then clicking **Start** drops them into question 1 with pre-filled text — confusing, and there's no way to reset.

Root cause: the card reads `brief.completeness_score` from the DB, which is initialized to `0` and never updated when individual fields are saved. The wizard itself counts answers correctly (`answeredCount` in `brief.tsx`), but the dashboard card and the welcome screen don't.

Note: the brief is **one record per user**, not per venture. So a "different venture" still shares the same 10 answers — the reset flow needs to make that explicit.

## Plan

### 1. Compute answered count from real field values (frontend, no migration)

In both `src/routes/_authenticated/dashboard/index.tsx` and `src/routes/_authenticated/dashboard/workflow.tsx` (and the admin attendee view), replace:

```ts
const briefScore = brief.data?.brief?.completeness_score ?? 0;
```

with a helper that counts non-empty `BRIEF_FIELDS` keys on `brief.data.brief`. Add `src/lib/brief-progress.ts` exporting `countAnsweredBriefFields(brief)` so all surfaces share one source of truth.

### 2. Surface "complete" state on the dashboard card

In `dashboard/index.tsx` `BeforeMode` and `NoCohortMode`, when `briefScore === briefTotal`:
- Eyebrow: `BRIEF COMPLETE`
- Title: `Your startup brief is locked in.`
- Body: `All 10 answers saved. Your facilitator's AI will read from this on workshop day.`
- Primary CTA: `Review my answers` → `/dashboard/brief?review=1`
- Secondary (ghost) CTA: `Start over` → opens a confirm dialog (see step 3)

Replace the current `NextActionCard` branch with a small new `BriefStatusCard` component in `src/components/dashboard/BriefStatusCard.tsx` that handles the three states (empty / partial / complete). The existing `BriefCompleteCard` is workshop-day-specific copy, so keep it and add this new card for the pre-work surface.

### 3. Reset / Start over flow

- Add `resetMyBrief()` to `src/lib/brief.functions.ts` that clears all `BRIEF_FIELDS` keys back to empty string for the current user (`UPDATE brief SET ...=''` via the existing typed update). No DB migration needed.
- `BriefStatusCard` triggers an `AlertDialog` ("This clears all 10 answers and sends you back to question 1. Your generated deliverables stay untouched. Continue?"). On confirm: call `resetMyBrief()`, invalidate the `["my","brief"]` query, navigate to `/dashboard/brief`.
- Also add a small `Start over` link inside `dashboard/brief.tsx` review mode header so users who land there directly can reset without backing out.

### 4. Fix the brief wizard welcome copy

In `dashboard/brief.tsx`, when `answeredCount === total` and the user lands fresh, default `mode` to `"review"` (already does via `firstEmpty === -1`), but the welcome card in the dashboard previously sent them to question 1. With step 2's CTA pointing at `?review=1`, this is consistent.

## Out of scope

- No per-venture brief — that would be a much larger schema change. If the user wants per-venture briefs later, we'd add a `venture_id` to the `brief` table and a venture-picker on the dashboard; flag for a follow-up.
- We are not backfilling or maintaining `completeness_score` in the DB; the computed-from-fields approach makes it unnecessary and avoids drift.

## Files touched

- `src/lib/brief-progress.ts` (new)
- `src/lib/brief.functions.ts` (+ `resetMyBrief`)
- `src/components/dashboard/BriefStatusCard.tsx` (new)
- `src/routes/_authenticated/dashboard/index.tsx`
- `src/routes/_authenticated/dashboard/workflow.tsx`
- `src/routes/_authenticated/dashboard/brief.tsx` (reset link in review header)
- `src/routes/_authenticated/_admin/admin.attendees.$userId.workflow.tsx` (use shared counter)
