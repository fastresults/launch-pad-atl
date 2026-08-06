# Logo concepts that could actually be posted on Dribbble

The three marks in the screenshot are blocky rounded rectangles and a clipped "A". That is not a prompt accident — it is what the current pipeline is built to produce. Verified in `supabase/functions/venture-brand-assets/index.ts`:

- The drawing prompt hands the model a **construction contract** ("module 25, stroke_weight 100, radii [0,50]") and then `applyConstruction` snaps every coordinate to that grid. Curves get quantised into chunky steps; rounded rects survive intact. Hence: squares with 50-unit corners.
- The example JSON the model copies is a rectilinear `M 200 200 L 800 200 …` path. Models imitate the example far more than the prose telling them arcs exist.
- Concepting never sees the moodboard images or the palette in any visual form — the brand kit stores `moodboard` and `palette`, but only text tokens reach the concept pass.
- Nothing in the pipeline asks *who this business serves and what human moment it lives in*. It jumps from strategy adjectives straight to geometry.
- The critique gate scores technical properties (stroke variance, off-grid, ink density). Nothing ever asks "is this good enough to be posted publicly by a designer?" — so amateur-but-tidy output passes.

## What we change

### 1. Start from the human, not the grid
A new first pass writes a short **human truth**: who this is for, the moment the business exists to fix, what the founder wants a customer to feel in the first two seconds, and the single object/gesture/space that moment lives in. Concepting must trace each mark back to that truth in one line. No truth line, no direction.

### 2. Concepting sees the actual brand world
Feed the concept pass the **moodboard images** (as vision input) and the **live palette/type tokens** from `venture_brand_kits`, plus the strongest venture assets. Directions must state which moodboard tile they inherit their form language from and which palette token leads. Four directions must be genuinely different families — not four versions of one shape.

### 3. Delete the blocky-maker
- Remove hard grid snapping of coordinates. Keep only what actually protects quality: one stroke weight, two inks max, optical centring, and a consistent radius family.
- Replace the rectilinear example JSON with a **curve-first** example (arcs and Béziers), and require every mark to be built from real circular/Bézier geometry unless the direction is explicitly rectilinear by intent.
- Ban the default failure modes by name: rounded-square clusters, plus/cross grids, "letter in a box", clip-art node diagrams, and evenly-spaced dots-and-connectors.
- Require one deliberate craft move per mark: a counterform, a continuous stroke path, a shared tangent, a ligature, or a true negative-space read.

### 4. An award jury, not a linter
The vision critique gets rewritten as a **Dribbble jury**: it looks at the rendered mark and answers, honestly, whether a working identity designer would publish this. It scores craft, idea, and distinctiveness, and it explicitly calls out "reads as auto-generated" as a fail. Only jury-passing marks are presented; failures get one targeted redraw with the jury note, inside the existing attempt limits.

### 5. Present it like a case study
Each surviving direction shows the mark, the human truth line it came from, the one-line idea, and the palette applied — so the founder judges concepts, not squares.

## Technical notes

- `supabase/functions/venture-brand-assets/index.ts`: new `logo_develop_truth` step in the run ledger (or folded into the existing brief stage to avoid another round-trip), rewritten concept + draw prompts, moodboard images passed as `image_url` parts to the concept call, jury prompt replacing the current critique prompt.
- `supabase/functions/_shared/logo-geometry.ts`: `applyConstruction` stops snapping coordinates; keeps stroke normalisation, radius family, bounds and optical centring. Lint keeps structural checks and drops the off-grid penalty.
- No schema change — the truth line and jury verdict ride in the existing `brand_logo_runs` / `brand_logo_directions` columns.
- Atomicity is unchanged: one expensive AI step per invocation, existing leases, watchdog and attempt caps stay exactly as they are, so this does not reintroduce timeouts.
- `BrandWizard.tsx` gains the truth line + idea caption under each concept card.

## Order of work

1. Human-truth pass + moodboard/palette into concepting.
2. Kill grid snapping, curve-first drawing prompt and anti-cliché bans.
3. Dribbble jury replacing the technical critique, with one redraw.
4. Concept card presentation.
