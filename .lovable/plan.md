
## The problem

The founder has finished all 10 brief questions (`completeness_score = 10`, `completed_at` set), but the app keeps pushing them back into the questionnaire:

1. **Dashboard "Today" → no-cohort mode** (`src/routes/_authenticated/dashboard.index.tsx`, `NoCohortMode`, lines 355–370) hardcodes the card *"Answer 10 quick questions about your startup"* even when the score is already 10/10. There is no completed-state branch.
2. **`/dashboard/brief` re-entry** (`src/routes/_authenticated/dashboard.brief.tsx`, lines 37–44) uses `findIndex(f => !init[f.key])`. When every field is filled, `firstEmpty === -1` and `setIdx` is skipped, so the wizard silently lands on **Q1** again. To the user this looks identical to starting over — the "endless cycle".
3. **Dashboard "Today" → before-workshop mode** already has a `briefDone` branch ("You're all set"), but it's a thin card with no acknowledgment of what was captured and no review affordance other than a button. It also doesn't appear in the no-cohort path.

## What to build

A single completed-brief experience that replaces the questionnaire prompt across every dashboard mode, plus a real "review my answers" view inside the brief route.

### 1. New component: `BriefCompleteCard`

`src/components/brief/BriefCompleteCard.tsx`. Reused by both dashboard modes.

- Eyebrow: "Your startup brief"
- Title: "You've told us everything we need."
- Subtitle: pulls `one_line_pitch` from the brief and shows it back in quotes so the founder sees their own words ("So we know your startup as: *…*").
- Block list: 3 rows — "Your story", "Your customer & edge", "Your model & vision" — each with a green check and a one-line recap from the stored `attendee_founder_memory` summary (fallback: count of questions in the block).
- Two buttons: **Review my answers** (`/dashboard/brief?review=1`) and a contextual secondary CTA picked by caller (e.g. "What to bring →" before the workshop, or "Browse the 25 deliverables →" when no cohort yet).

### 2. Fix `NoCohortMode`

Branch on `briefScore >= briefTotal`:
- **Complete:** render `<BriefCompleteCard secondary={…}/>` and a short "We'll email you as soon as your workshop date is set" line. No more "answer 10 questions".
- **In progress:** keep the existing card, but soften copy to "Pick up where you left off — you're {n} of 10 done."

### 3. Fix `BeforeMode` completed branch

Replace the current thin "You're all set" card with `<BriefCompleteCard secondary={{ to: "/dashboard/day", label: "What to bring →" }}/>`. Keeps the workshop countdown card above it untouched.

### 4. Fix `/dashboard/brief` re-entry (the real loop)

In `BriefWizard` (`dashboard.brief.tsx`):
- Detect "all complete" (`answeredCount === total` on initial load, or `?review=1` in the URL) and set a new `mode: "review"`.
- Review mode renders a `<BriefReview/>` panel: each of the 10 questions with the saved answer, an inline **Edit** button per question that jumps to that `idx` in normal question mode, and a footer button "Back to dashboard". No auto-jump to Q1.
- When the user edits one answer and saves the last empty field again, return them to review mode, not Q1.
- Keep checkpoint summaries between blocks for the *first* completion pass; skip them in review mode.

### 5. Copy tightening

Per project memory: keep "your startup" everywhere user-facing. Replace any lingering "business" wording in the new card/review.

## Out of scope

- No DB / RLS / migration changes.
- No edits to `updateBriefField`, `getMyBrief`, `summarizeBriefBlock`, or `attendee_founder_memory`.
- No changes to the workflow / deliverables routes or workshop-mode logic.
- Voice recording, save-on-blur, and the existing checkpoint UI stay as-is.

## Files touched

- `src/routes/_authenticated/dashboard.index.tsx` — `NoCohortMode` + `BeforeMode` completed branches.
- `src/routes/_authenticated/dashboard.brief.tsx` — add `review` mode, gate auto-advance, honor `?review=1`.
- `src/components/brief/BriefCompleteCard.tsx` *(new)*.
- `src/components/brief/BriefReview.tsx` *(new)*.

## Result

A founder who has finished the brief sees: "You've told us everything we need" with their pitch echoed back, a 3-block recap, and one clear next step — never the "Answer 10 quick questions" prompt again. Re-opening `/dashboard/brief` shows a review/edit screen, not Q1.
