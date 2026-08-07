# Logo Studio — Workflow Rebuild

The current pipeline produces slop because three things are wrong at the root, not at the edges:

1. It never *reads the business*. The strategy pass sees a truncated blob of brand docs and produces abstract "human truth" poetry, so the model draws a mood, not a business.
2. The founder's inspiration logos are optional, are only described in words, and never reach the render call. The renderer has no visual target.
3. What you finally see is not the rendered concept — it's a re-drawn SVG the model reconstructs from a text dossier. That redraw stage is where the green blob, the generic seal, and the broken "AI" ligature come from.

So the workflow is rebuilt in order: **references first → business reading → concepts → reference-conditioned render → jury → (vector only after you pick)**.

## New pipeline

```text
0  INSPIRATION GATE     3 logos required (upload or pick from a curated set)
1  REFERENCE READ       vision pass  -> craft spec (structure only, never subject)
2  BUSINESS READ        copy assets  -> business profile (category, customer, register)
3  CONCEPTING           8 ideas -> jury keeps 4, each must satisfy 1 + 2
4  RENDER               reference-conditioned image render, 4 marks in parallel
5  JURY                 vision critique vs. references; auto re-render weak marks
6  PRESENT              you see the actual rendered marks (raster), nothing redrawn
7  VECTORIZE            only for the one mark you approve
```

### 0. Inspiration gate (new, blocking)

"Generate 4 logo directions" is disabled until 3 reference logos are present. The
existing skip-references path is removed — it is the main cause of aimless output.
Uploads are stored per venture and reused for every subsequent run.

### 1. Reference read (new stage)

A vision pass over the 3 uploads produces a **craft spec** — hard numeric/structural
constraints, never subject matter:

- construction type (geometric / organic / typographic / emblem)
- abstraction level (1–5), visual complexity (element count)
- stroke weight ratio, corner treatment, terminal style
- counterform behaviour, symmetry, colour count
- what all three have in common — the single shared quality to inherit

The craft spec becomes a hard constraint on every later stage and on the jury rubric.

### 2. Business read (new stage, replaces the current strategy pass)

A dedicated pass over the venture's produced copy (positioning, offer, ICP, tone,
website PRD, 14-day plan) returns a structured **business profile**:

- category and sector archetype (trade services, clinical, food, SaaS, education…)
- who the customer is and what they are buying
- register (premium / practical / warm / clinical)
- an approved **symbol vocabulary** grounded in the actual work of the business
- a **category cliché blacklist** generated for that specific sector

No more untruncated-context guessing: the copy is summarised into this profile and
the profile — not the raw blob — is what every downstream stage consumes.

### 3. Concepting

Eight one-line ideas are generated against the profile + craft spec, then scored and
cut to four. A concept is rejected outright if it uses a blacklisted cliché, needs
more than one drawing move, or violates the craft spec's complexity ceiling.

### 4. Render (reference-conditioned)

Each concept is rendered with the 3 inspiration logos **and** the live moodboard tiles
attached as image references, plus the locked palette. Higgsfield stays the primary
renderer where its endpoint accepts image conditioning; when it cannot take references,
the run uses the reference-capable image model so the visual target is never lost.
The renderer is chosen per-run and reported in the UI, as today.

### 5. Jury

A vision pass scores each render against a rubric derived from the craft spec
(structure match, single idea, silhouette read at 24px, cliché check, palette
compliance). Anything below the bar is re-rendered once with a targeted correction
note. Only marks that pass reach you.

### 6/7. Present, then vectorize

You review the **actual rendered marks**. The automatic SVG redraw is removed from the
concept path entirely. Vectorization runs once, on the single mark you approve, as a
trace-and-clean of that exact image — so what you approve is what you get.

## Technical notes

- New shared modules: `logo-reference-read.ts` (craft spec), `logo-business-read.ts`
  (business profile), `logo-jury.ts` (rubric + scoring). `logo-render-prompt.ts` is
  rewritten to compose profile + craft spec + concept.
- `logo-geometry.ts`, `logo-compositor.ts` and the `develop_vector` / `draw_vector` /
  `review_vector` / `revise_vector` stages leave the concept path; vector work moves to
  a new `vectorize_selected` action triggered by approval.
- `brand_logo_runs` gains `craft_spec` and `business_profile` jsonb; the
  `brand_logo_directions.current_stage` check constraint is replaced with the new stage
  set (`reference_read`, `business_read`, `concepting`, `render_concept`, `jury`,
  `ready`, `vectorizing`, `complete`).
- `BrandWizard.tsx`: the reference uploader becomes a required gate with a 3-slot
  strip; stage labels follow the new pipeline; the existing clear-queue and render-
  engine status controls stay.
- Existing runs/directions are cleared on migration — the old rows can't map onto the
  new stage machine.

## What stays

Higgsfield as renderer, the credit/health banner, the clear-queue escape hatch, the
palette and moodboard as locked inputs, and the per-direction retry ledger.
