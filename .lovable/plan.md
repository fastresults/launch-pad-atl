
## Problem

After Block 5 of 5, the only thing that happens is a `toast.success("All done…")` and an instant redirect to `/dashboard`. A first-time founder is left thinking: *"That's it? What was the point? What do I do now?"*

There's no moment of arrival, no recap of what the brief unlocked, and no obvious next action.

## What "good" looks like for a novice

After they confirm the last checkpoint, they should land on a short, warm "You're set up — here's what's next" screen that:

1. Celebrates the milestone (they just finished the foundation the rest of the workshop is built on).
2. Tells them in plain language **what their brief now powers** (positioning, market read, deliverables, etc.).
3. Gives **one obvious primary action** — generate their first deliverable in the Founders Hub — plus a couple of secondary actions.
4. Leaves a clear back-door if they want to tweak their answers later.

This turns the dead-end into a guided handoff.

## Plan

### 1. Add a `complete` mode to the brief flow
File: `src/routes/_authenticated/dashboard/brief.tsx`

- Extend the `mode` union with `"complete"`.
- In `continueFromCheckpoint`, when `checkpointBlock.kind === "market"`, set `mode = "complete"` **instead of** navigating away and firing a toast.
- Keep the progress bar at 100% on this screen and change the eyebrow to `BRIEF COMPLETE`.

### 2. New component: `BriefCompleteScreen`
File: `src/components/brief/BriefCompleteScreen.tsx`

Sections (semantic tokens only — no hardcoded colors):

- **Hero**
  - Small celebratory eyebrow (`✓ Your founder brief is locked in`)
  - H1: *"You've given the AI the full picture."*
  - Subhead: one sentence explaining the brief now powers every deliverable.

- **"Here's what your brief just unlocked"** — 3 short cards:
  1. **Sharper positioning** — your story, your edge, the right person framing.
  2. **A market read tuned to you** — industry, customer type, geography, channels.
  3. **Deliverables that sound like you** — every doc generated from your own words.

- **One obvious next step (primary CTA)**
  - Big button: **"Generate your first deliverable →"** → routes to `/dashboard/hub` (or `/dashboard/hub/new` if that's the entry point — confirm during implementation by reading the hub route).
  - Helper line under it: *"We'll start with your Startup Snapshot — it takes about a minute."*

- **Secondary actions** (low-emphasis links/ghost buttons):
  - *See all 34 deliverables* → `/dashboard` (deliverables grid)
  - *Review or edit my brief* → re-enters the brief at the first QA block

- **Reassurance line at the bottom**
  - *"You can come back and refine any answer anytime — your brief stays live."*

### 3. Wire `Edit my brief` re-entry
- Reuse `editFromCheckpoint` style: setting `mode = "question"` and `idx = 0` is enough; the existing review/edit paths already handle the rest.

### 4. Remove the abrupt redirect
- Delete the `navigate({ to: "/dashboard" })` and `toast.success(...)` from the market branch of `continueFromCheckpoint` — the completion screen replaces both.

### 5. Don't trap returning users
- If someone navigates back to `/dashboard/brief` after they've already completed it, the existing question flow still works for editing. No change needed for v1, but worth verifying during implementation that landing on the page doesn't auto-show the complete screen — it should only appear as the result of pressing Continue on the final checkpoint.

## Out of scope (intentionally)

- No new backend fields, no `brief_completed_at` column, no analytics events — keep this a pure UX fix.
- No confetti / heavy animation — a calm, confident handoff fits the existing tone better than fireworks.
- No changes to earlier checkpoints — they already have a clear next step (the following block).

## Files touched

- `src/routes/_authenticated/dashboard/brief.tsx` — add `complete` mode, render new screen, drop the redirect.
- `src/components/brief/BriefCompleteScreen.tsx` — new component.
