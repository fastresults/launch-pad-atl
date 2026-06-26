
# Stage Presentations — "Why this stage matters"

Build one in-app, fullscreen-presentable slide deck per framework stage (8 total). Each deck is founder-facing, self-serve, and focused on **why the stage matters** — the stakes, the cost of skipping it, and what good looks like at the end.

Ship **Foundation** end-to-end first. Review. Then Strategy → Operations → Finance → Governance → Brand → Marketing → Social & Content.

---

## 1. Architecture

A single, reusable slide system — not 8 hand-rolled routes.

```text
src/routes/_authenticated/dashboard/
  workshop.$stage.tsx          ← dynamic route: /dashboard/workshop/foundation, /strategy, …

src/components/workshop-slides/
  ScaledSlide.tsx              ← 1920x1080 fixed canvas, transform: scale to fit
  SlideLayout.tsx              ← shared chrome (stage kicker, page counter, footer)
  SlideDeck.tsx                ← keyboard nav (←/→/Space/Esc), URL-driven slide index
  PresentToolbar.tsx           ← fullscreen, grid, dark-mode, exit
  GridOverview.tsx             ← thumbnail grid (press G)
  slides/                      ← per-slide React components, grouped by stage
    foundation/
      01-cover.tsx
      02-the-stakes.tsx
      03-what-breaks-without-it.tsx
      04-what-good-looks-like.tsx
      05-the-four-deliverables.tsx
      06-executive-summary.tsx
      07-vision-and-mission.tsx
      08-problem-solution.tsx
      09-value-proposition.tsx
      10-recap-and-next.tsx
      index.ts                 ← exports ordered array
  registry.ts                  ← maps stage slug → { title, slides[], next stage }
```

URL pattern: `/dashboard/workshop/foundation?slide=3` (slide index in URL, per Slides app guidance). `F` enters fullscreen, `G` toggles grid, ←/→ navigate, `Esc` exits.

---

## 2. Foundation deck — slide outline (10 slides)

Voice: speaks directly to the founder. No instructor required. Tone matches existing copy (modern, founder-flavored, "your startup" not "your business").

1. **Cover** — "Foundation. The bedrock every defensible startup is built on." Stage 01 of 08 kicker.
2. **The stakes** — Why Foundation exists. One bold statement: *"Everything downstream — your brand, your site, your pitch, your pricing — inherits whatever you decide here."*
3. **What breaks without it** — 3 stat-style cards drawn from `FOUNDATION_FIRST_REASONS` in `framework-deliverables.ts` (wrong brand is expensive to undo / website with no ICP doesn't convert / AI amplifies fuzz).
4. **What good looks like** — A founder who can answer 4 questions in plain language: who you serve, what you solve, why now, why you.
5. **The four deliverables you'll leave with** — Grid of the 4 Foundation items from `FRAMEWORK_STAGES[0]`.
6. **Executive Summary** — what it is, why it matters, one-line "good looks like" — pulled from the existing `tooltip` field.
7. **Vision & Mission** — same template.
8. **Problem / Solution Brief** — same template.
9. **Value Proposition** — same template.
10. **Recap + what's next** — "Foundation locks the truth. Next: Strategy — how you win and compound the lead." CTA button: *Open Strategy deck →*.

Each deliverable slide reuses one `<DeliverableSlide />` component fed from `FRAMEWORK_STAGES`, so the other 7 stages get their deliverable slides nearly for free.

---

## 3. Visual direction

Match the existing dashboard aesthetic — semantic tokens only, no hardcoded colors. Dark cover + recap slides, light content slides ("sandwich"). One visual motif carried through: a numbered stage kicker (`01 · FOUNDATION`) top-left on every slide, page counter bottom-right.

Typography per the Slides app guidance:
- Titles: `.slide-title` (88px)
- Subtitles: `.slide-subtitle` (52px)
- Body: `.slide-body` (32px)
- Kicker: `.slide-kicker` (22px tracked uppercase)

Lucide icons from the existing deliverable definitions (already in `framework-deliverables.ts`) for each deliverable slide.

---

## 4. Entry points

- New card on `/dashboard/day` titled **"Workshop decks"** — 8 stage tiles, each linking to its deck. Foundation enabled, others show "Coming soon" until built.
- Direct deep links: `/dashboard/workshop/foundation`, etc.

---

## 5. Build order

1. **This pass — Foundation only:**
   - Build the slide system (ScaledSlide, SlideLayout, SlideDeck, PresentToolbar, GridOverview, registry, route).
   - Build all 10 Foundation slides + the reusable `<DeliverableSlide />`.
   - Add the Workshop decks card to `/dashboard/day` with the other 7 stages disabled.
2. **You review Foundation** in present mode.
3. **Next passes (one per stage):** Strategy → Operations → Finance → Governance → Brand → Marketing → Social & Content. Each is just authoring new slide files + flipping its tile on; no infra changes.

---

## 6. Out of scope (this plan)

- No PPTX/PDF export. (Browser print → PDF still works via the `?print` pattern if needed later.)
- No instructor speaker-notes panel (you chose self-serve to founders).
- No AI generation of slide copy — slides are hand-authored from the existing deliverable copy in `framework-deliverables.ts` so wording stays on-brand and stable.
- No edits to the 8 stages' titles, descriptions, or order — those stay sourced from `FRAMEWORK_STAGES`.
