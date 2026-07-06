# Venture Dashboard — Guided Onboarding for Novice Users

## Problem

On `/dashboard/hub/:snapshotId` (the GenerateStep) a first-time founder lands on a wall of powerful tooling with no orientation:

1. A **Hero next-action card** (generate all / next category)
2. The **14-Day Launch Method** planner (Anderson's method)
3. The **AI Stack** panel
4. The **Your assets** accordion stack (six category sections)

Each block launches into functionality without answering: *what is this, why do I need it, how do I use it?* Novices bounce or click randomly.

## Goal

Add lightweight, dismissible orientation so a first-time user immediately understands the purpose and flow of each core section — without adding noise for repeat users.

## Plan

### 1. Page-level welcome strip (top of GenerateStep, above the hero)

A one-time, dismissible banner shown until the user closes it or generates their first asset:

- Headline: **"This is your venture workspace"**
- Sub: One sentence: *"Four things live here — your next action, a 14-day sprint plan, your AI toolkit, and 60+ founder-ready assets. Read the intro on each card, then start with the blue button."*
- Dismiss "✕", persisted in `localStorage` under `hub:welcome:<snapshotId>:dismissed`.
- Auto-hide once `completeCount > 0` (they've clearly moved past intro).

### 2. Section intro headers ("What is this? Why does it matter?")

For each of the 4 major sections, add a compact intro block **directly above** the existing component. Each has:

- A **section eyebrow** (small uppercase label + numeric order: "01 · Next action", "02 · 14-Day Launch Method", "03 · AI Toolkit", "04 · Your asset library")
- A **1-line "What it is"**
- A **1-line "Why it matters"**
- An **`i` Info popover** ("How to use this") with 2–3 short bullets

Copy (draft, in `src/lib/hub-dashboard-copy.ts`, single source of truth):

| Section | What it is | Why it matters | How to use it (popover) |
|---|---|---|---|
| Next action | The single most important thing to generate right now. | Removes decision paralysis — one click and the machine writes the next batch. | Click the blue button. Watch the progress bar. Read each asset as it lands. |
| 14-Day Launch Method | Andersons proven 14-day sprint that turns a concept into a live business. | Every asset in your kit maps to a specific day — so you know *when* to read it, not just *what* it is. | Click any day to see that day's assets, why it matters, and what to ship by end of day. |
| AI Toolkit | A personalized stack of AI tools chosen for your industry and workflow. | Your 14-day plan assumes you have the right tools installed — this gets you set up in an afternoon. | Generate the stack, then click each tool to install and paste API keys. |
| Your asset library | All 60+ founder-ready assets grouped into six tracks (Foundation → Growth). | Sections unlock in order so you build in the right sequence — no writing ads before you have a brand. | Use "Generate this section" to batch a whole track, or hit Generate on any single asset. Expand/collapse as you go. |

### 3. First-run coach marks (optional, low priority)

If time permits, a 3-step tooltip tour ("Start here → then this → then this") triggered by a **"Show me around"** button in the welcome strip. Uses existing `Popover` primitive — no new dependency. Skipped if user dismissed the welcome strip.

### 4. Repeat-user affordance

Once dismissed, expose a small **"?" chip** in the page header ("New here? Show the tour") so users can re-open the intros. Persists dismissed state per-venture so orientation shows again on a *new* venture.

## Files to change

- **New:** `src/lib/hub-dashboard-copy.ts` — the four intro copy blocks (single source of truth, matches the existing pattern in `src/lib/launch-14day-guidance.ts`).
- **New:** `src/components/hub/SectionIntro.tsx` — reusable eyebrow + what/why + info popover component.
- **New:** `src/components/hub/DashboardWelcomeStrip.tsx` — dismissible welcome banner with localStorage persistence.
- **Edit:** `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — inside `GenerateStep` (around lines 1130–1300):
  - Insert `<DashboardWelcomeStrip />` above the hero card.
  - Wrap the hero, `LaunchPlanner14Day`, `AIStackPanel`, and the "Your assets" header each in a `<SectionIntro>`.
- **Edit (small):** `LaunchPlanner14Day.tsx` header — remove the redundant "14-Day Launch Method" chip if `SectionIntro` now provides it, to avoid double-titling. Same for `AIStackPanel`.

## Out of scope

- No changes to generation logic, edge functions, or data models.
- No changes to Review / Enriching steps — orientation is only for the post-review "workspace" view where the user reported the confusion.
- No new dependencies.

## Verification

- Load the current venture as a fresh user (clear `localStorage`) → welcome strip + all four `SectionIntro` blocks visible.
- Dismiss welcome → banner gone, section intros remain (they're not dismissible — they're structural).
- Info popover on each section opens with the "how to use" bullets.
- Repeat visit to same venture → welcome stays dismissed; new venture → welcome shows again.
