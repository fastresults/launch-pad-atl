# Creative: from foundation graphics to agency-grade

Right now the creative thread in the Operationalize runway reads like housekeeping — approve the logo, lock the colors, export the asset pack, refresh ads. It never names the actual job: the venture leaves the build with a *foundation* set of graphics (mark, palette, type, collateral, poster and cover set), and the next move is elevating that foundation into creative that looks like it came from an agency.

This plan reframes and enriches the creative track so the founder sees a clear before/after: what they have, what "agency grade" means, and who does the lifting.

## What changes

### 1. The creative track becomes an elevation arc
Today's creative steps are scattered across Day 7 (brand), Day 10 (site/assets) and post-launch. They get grouped and re-sequenced into four named stages, all under the Creative category:

```text
Foundation set  →  Art direction  →  Production  →  Standard held
(what the build   (the point of    (the real       (nothing ships
 handed you)       view + refs)     shoot/build)    off-standard)
```

- **Foundation set** — inventory what exists (mark, palette, type, collateral, posters, covers) and grade it honestly against the category. Names the gap instead of pretending there isn't one.
- **Art direction** — the creative decision layer that's missing today: a written art direction (reference set, lighting, composition, crop language, motion rules), a photography direction, and a headline/voice pass on every visual.
- **Production** — real photography or commissioned imagery replacing generated placeholders, the poster/ad system rebuilt at the higher standard, print files at bleed, and a motion/short-form cut.
- **Standard held** — the sweep and rhythm steps (identity sweep, brand audit, creative refresh) reframed as holding the elevated bar rather than tidying up.

New steps added to the catalog (each with why / done-when / needs / unlocks, owner and criticality, same shape as existing tasks):
- Grade the foundation set against three category benchmarks
- Write the art direction (references, lighting, composition, crop, motion)
- Commission or shoot the real imagery
- Elevate the poster and ad system to the art direction
- Rebuild key collateral at print standard against the art direction
- Cut the first short-form motion piece
- Final creative sign-off: everything live matches the standard

### 2. Copy reframe wherever creative is described
- Creative sign-off board intro: "Approve creative" becomes "Elevate the foundation, then sign it off" — with a one-line explanation that generated foundation graphics are the starting point, not the deliverable.
- Guided-view and checklist blurbs for creative tasks explain the elevation in plain language.
- Existing brand steps (logo sign-off, color/type lock, style system) keep their place but are described as locking the foundation *so* it can be elevated consistently.

### 3. Heavy lifting block on the decision gate
The two creative clusters on the "You do it / We do it" comparison get rewritten to the elevation frame:
- **Brand system** — You: keep the generated set and hope it holds together. We: art direction written, mark and system refined, print-grade collateral produced to it.
- **Campaign creative** — You: post what the builder made. We: shoot or commission real imagery, rebuild the poster and ad system to the art direction, and hold the standard for eight weeks.

Each keeps the role label (Creative director, Brand designer, Photographer/Art buyer, Campaign director) so the skill required is obvious.

### 4. Guides
How-to guides authored for every new creative step in the same voice as the existing ones — what it is, how it's done, what "done" looks like, and what stalls without it. Includes a short, concrete definition of agency-grade so the standard isn't subjective: real imagery, a consistent crop and light language, typographic hierarchy, and no template tells.

## Technical notes

- `supabase/functions/_shared/ops-runway.ts` — add the new creative sub-tasks to the relevant days and the post-launch list; keep `task_key`s new and additive so existing venture progress is untouched (the seeder inserts only missing keys).
- `supabase/functions/_shared/ops-guides.ts` — guide entries keyed to each new task slug.
- `src/lib/ops-significance.ts` — mark the art direction and final creative sign-off steps as milestones; keep the skill notes pointed at art direction rather than "collateral".
- `src/components/ops/HeavyLifting.tsx` — rewrite the `brand` and `campaign` cluster copy.
- `src/components/creative/CreativeSignoffBoard.tsx` — header and empty-state copy.
- No schema change; no new tables.

## Out of scope

No changes to how the Brand Studio or Content Studio generate assets — this is about the operating runway and how the elevation work is described, tracked and delivered.
