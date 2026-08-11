# Art-direct the Operations page

The operating runway is currently text on cards: correct, but cold. A first-time founder scanning 100+ steps has nothing to anchor on visually. This adds a deliberate, on-brand visual system — not clip art.

## Art direction

One system, three levels of visual weight, all drawn from the existing brand language (the leaf-gradient mark, gold `#d08c00` → blue `#628acf`, thin-stroke animated line art already used on the home page framework sketches).

- **Line art, not filled icons.** Same drafting language as `StageSketch` — 2px strokes, rounded caps, theme colors via `currentColor` and `var(--primary)`. Nothing skeuomorphic, no emoji, no third-party icon packs beyond lucide for controls.
- **Gradient reserved for progress and milestones only.** The gold→blue gradient marks achievement (completed rings, milestone medallions, stage banners). Everyday rows stay monochrome so completion visibly stands out.
- **Motion is subtle and one-shot.** Draw-in on mount, no looping animation while a founder is reading a list. Respect `prefers-reduced-motion`.

## What gets built

### 1. Stage banners (4 hero marks)
Each of the four stages — Prove people want it, Wire the business up, Make the first money, Build the habit — gets a wide animated line-art banner at the top of guided mode and above each checklist stage group.

```text
 Stage 1  a seed / signal rising into a rising demand curve
 Stage 2  interlocking modules snapping into a running machine
 Stage 3  an envelope becoming a paid invoice, a coin landing
 Stage 4  a repeating loop with a compounding step-up
```

New `src/components/ops/OpsStageArt.tsx`, sharing the `sm-*` keyframe classes already in `src/styles.css` (add a small `ops-*` set only where new motion is needed).

### 2. Category glyphs (9 marks)
A drawn mark per runway category — Foundation, Strategy, Operations, Finance, Governance, Brand, Marketing, Social & Content, Creative — in a `src/components/ops/OpsGlyph.tsx` registry. Used at 20px inside task rows, 32px in group headers, 56px in milestone cards. Single source of truth so the same category always reads the same everywhere (guided, checklist, timeline, share link, Heavy Lifting).

### 3. Progress and state artwork
- **Progress ring** replaces the bare percentage in the dashboard header: gradient arc, stage name in the center, count beneath.
- **Milestone medallion**: major moves in `OpsChecklist` get a gradient-ringed category glyph instead of the current flat header, so milestones physically outweigh supporting steps.
- **Status dots** get consistent drawn states (todo / in progress / waiting / blocked / done) rather than mixed lucide icons.
- **Empty and complete states**: a drawn "stage cleared" mark with a short line of copy, instead of blank space.

### 4. Timeline texture
`OpsTimeline` gets stage-tinted lanes, day markers, a "today" indicator, and category glyphs on milestone nodes so the 90 days read as a map, not a list.

### 5. One generated brand image
A single cinematic, on-brand header image for the operations page (workbench / build-in-progress mood, brand gradient grade, no stock-photo look), used as a low-opacity band behind the header only. Everything else stays vector so it scales, themes, and costs nothing to load.

## Technical notes

- New files: `src/components/ops/OpsGlyph.tsx`, `OpsStageArt.tsx`, `OpsProgressRing.tsx`, `src/lib/ops-art.ts` (category → glyph + tint mapping).
- Touched: `OpsDashboard.tsx` (header, view switch), `OpsChecklist.tsx` (group headers, milestone cards), `OpsTaskRow.tsx` (glyph + status marks), `OpsTimeline.tsx`, `GuidedStep.tsx` (stage banner), `HeavyLifting.tsx` (cluster glyphs).
- All colors via existing semantic tokens in `src/styles.css`; no hardcoded color utilities. New keyframes prefixed `ops-`.
- Presentation only — no changes to the runway catalog, edge functions, or data model. Identical artwork renders in both the founder share link and the agency hub.
