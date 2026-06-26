# Refresh "Your workshop morning" copy

## Why
`src/routes/_authenticated/dashboard/day.tsx` still describes the workshop as **"five pillars / 20 founder-ready assets"**, pulled from `WORKFLOW` in `src/lib/workflow.ts` (20 deliverables, 5 pillars). The real framework — already live on the homepage and admin — is **8 categories / 35 deliverables** defined in `src/lib/framework-deliverables.ts` (`FRAMEWORK_STAGES`), including the bonus Brand, Marketing, and Social & Content tracks. The tone also reads a bit generic and operational; it should sound like a founder coach talking to you about your startup.

## Scope
Frontend-only edit to `src/routes/_authenticated/dashboard/day.tsx`. No data, route, or component-API changes. Tone follows project memory: say "your startup" (not "your business"), say "categories" (not "templates"). Internal identifiers stay as-is.

## Copy & structural changes

### 1. Header
- Keep H1 "Your workshop morning".
- Subhead → "One focused morning with a founder coach. You walk out clear on what you're building, who it's for, how it makes money, and what to ship first — with **35 founder-ready deliverables across 8 categories** waiting for you in your dashboard."

### 2. "What you walk out able to do" hero
- Headline unchanged.
- Body → tighter, warmer: emphasizes that the morning produces clear answers + a Monday-morning action plan, and that the **35 deliverables across 8 categories** (Foundation, Strategy, Operations, Finance, Governance, plus bonus Brand, Marketing, Social & Content) are built for you and live in your dashboard for refinement after.

### 3. "Two ways to build it"
- Section eyebrow stays.
- Lede → "Same 8 categories, same 35 founder-ready deliverables. Pick the path that fits where you are right now."
- Card A (Guided) body → minor polish; mention "we move through the categories together".
- Card B (Fast venture) heading → "Drop in a link or a paragraph, get all 35 back".
- Card B body → "Paste your site or describe your startup. We enrich it, generate every deliverable in order, and hand it back so you can walk in Saturday with something to react to — not a blank page."

### 4. Pillars / categories grid (current "What you'll be able to do after this")
- Replace the data source from `STAGES` + `WORKFLOW` with `FRAMEWORK_STAGES` from `src/lib/framework-deliverables.ts` so the grid renders all 8 real categories (5 core + 3 bonus) with their real deliverable lists and the "Bonus" pill where `bonus === true`.
- Section heading → "The 8 categories we build for your startup".
- Lede → "Five core categories every startup needs, plus three bonus tracks for brand, marketing, and social. We move through them in order so each answer feeds the next — by the end, your story, your numbers, and your launch moves all line up."
- Per-card: show category number + name, the intro paragraph from `FRAMEWORK_STAGES`, a "Bonus" chip when applicable, and the list of deliverables (icon + title, no time estimate since `FrameworkDeliverable` doesn't carry minutes). Drop the `Xm` minute totals from this section.
- Sub-label above the list → "Deliverables you'll walk out with".

### 5. "How the morning goes" (schedule)
- Keep `SCHEDULE_BLOCKS`. Update the "Pillar N" chip label to "Category N" for consistency. Section heading unchanged.

### 6. "Bring four things"
- Lightly warm the tone but keep the four items intact:
  - "Your laptop and charger — you drive the thinking, your coach keeps you moving."
  - "A government-issued ID, so the legal setup for your startup is ready to file when you are."
  - "A rough idea we can sharpen into a real offer — sticky-note energy is welcome."
  - "The one question you most want answered before you walk out."
- Footnote unchanged in meaning, lightly tightened.

### 7. Footer CTAs
- Primary button label → "See all 35 deliverables we build together".
- Secondary "Browse your ventures" unchanged.

## Technical notes
- File: `src/routes/_authenticated/dashboard/day.tsx`.
- Add `import { FRAMEWORK_STAGES } from "@/lib/framework-deliverables"`.
- Replace the `PILLARS` derivation and the categories grid `<section>` to map over `FRAMEWORK_STAGES`. Use each stage's `items[].icon` + `items[].title`.
- Remove the now-unused `TOTAL_DOC_MIN` and (if no longer used) the `STAGES`/`WORKFLOW` imports — leave them only if still referenced elsewhere on the page.
- All numeric references (35 deliverables, 8 categories) come from `FRAMEWORK_STAGES` so future edits stay in sync: e.g. `const TOTAL_DELIVERABLES = FRAMEWORK_STAGES.reduce((n, s) => n + s.items.length, 0);` and `FRAMEWORK_STAGES.length`.
- No styling system changes; keep existing tokens and card classes.

## Out of scope
- No edits to `WORKFLOW` / pillar data, schedule blocks, brief flow, or any other route.
- No backend, schema, or i18n changes.
