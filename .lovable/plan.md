## Why the same scene keeps coming back

Every content ad routes through `resolveSceneDirective()` in `supabase/functions/_shared/cover-art-director.ts`. Two things collapse the output to the same photo:

1. **The startup library is a room full of office clichés.** `LIBRARY_STARTUP` has 10 variants, but 8 of them are indoor knowledge-worker scenes (whiteboard + post-its, laptop + notebook, cofounders at a table, spreadsheet over-the-shoulder, accelerator loft, etc.). No metaphor, no outdoors, no product-forward, no cinematic abstraction, no macro object-only shots, no typographic/graphic frames.
2. **Tag scoring concentrates picks.** Any post whose pillar/format/notes contains "workshop", "cohort", "team", "sprint", or "planning" scores highest on the same 1–2 variants (rows 197, 201, 203). The hash-rotor only rotates *within the tied top pool*, so a week of workshop-flavored posts keeps landing on "facilitator at whiteboard with sticky notes" or "hand pressing a post-it."

Fix: broaden the creative range AND weaken the tag-lock so rotation actually rotates.

## Plan

### 1. Rebuild `LIBRARY_STARTUP` as a 20+ variant creative range
Replace the current 10-entry office-heavy set with a mix across five buckets. Aim for ~4 per bucket so no bucket monopolizes the pool.

- **Human moment (not at a laptop):** founder on a rooftop at dusk holding a printed pitch; founder walking a city crosswalk with a portfolio; founder shaking hands with a customer in the wild; solo silhouette against a floor-to-ceiling window at night.
- **Metaphor / conceptual:** a single lit doorway at the end of a dark hallway; a paper airplane arcing across a graph-paper wall; a chess piece mid-move on a marble board; a compass on weathered wood; a runway edge with runway lights vanishing into fog; a bridge under construction over open water.
- **Object-forward macro (no people):** a fountain pen crossing out a line on printed strategy; a stack of business cards fanned across a linen surface; a single espresso cup on a contract; a vintage brass key on a blueprint; boarding pass and passport on a walnut desk.
- **Environmental / outdoor:** aerial of a coastal highway at sunrise; a lone tree on a hill under storm light; a neon-lit alley with a single figure walking away; a mountain ridgeline with morning fog.
- **Editorial / graphic:** a single bold color-field with one small central object (e.g. a pin, a spark, a paper boat); a torn-paper reveal with a texture beneath; a duotone portrait cropped tight on the eyes; a long-exposure light trail across an empty street.

Every entry gets varied `camera` + `composition` picks and NO more than one item per bucket may carry the `workshop`, `cohort`, or `team` tag.

### 2. Diversify the other libraries the same way (lighter touch)
`LIBRARY_MAIN_STREET`, `LIBRARY_FOOD`, `LIBRARY_FITNESS`, `LIBRARY_HEALTH`, `LIBRARY_MOBILITY` — add 3–4 metaphor/object/environmental entries each so a week's posts read as an editorial set rather than "same shop, same angle."

### 3. Make rotation actually rotate
In `resolveSceneDirective()`:
- Cap tag-boost so no single variant becomes uniquely top-scored. Change scoring from "+2 per matching tag" to a small bonus (e.g. +1, max +2) so the tied-top `pool` stays wide.
- After computing `pool`, if `pool.length < 4`, widen it to the top-N (N = min(6, lib.length)) so the rotor always has real choice.
- Mix the venture `snapshotId` into the rotor seed alongside `discriminator` so two ventures with the same post index don't converge on the same variant.
- Track recently-used variant indices per snapshot in a lightweight in-memory `Map<string, number[]>` (last 4) and skip them when possible — pure best-effort, resets on cold start, no DB.

### 4. Strengthen the anti-cliché guardrail in the prompt
In `sceneDirectiveBlock()`, extend the closing line:
> IMPORTANT: this scene is UNIQUE to this post — do NOT default to a generic "team around a laptop", "cofounders at a whiteboard", "hand pressing a post-it", or "founder pointing at sticky notes." If the Scene Directive above is not one of those, do not add them.

### 5. No schema, no client, no other function changes
All edits are confined to `supabase/functions/_shared/cover-art-director.ts`. Redeploy `venture-content-ad` and `venture-social-cover` after editing (they both import it).

## Technical details

- File: `supabase/functions/_shared/cover-art-director.ts`
- Functions touched: `LIBRARY_STARTUP` (rewrite), `LIBRARY_*` (extend), `resolveSceneDirective()` (scoring + rotor + recent-used memory), `sceneDirectiveBlock()` (extended avoid line).
- Type `SceneVariant` unchanged.
- Redeploy: `venture-content-ad`, `venture-social-cover`.
- No DB migration, no client change, no new secrets.

## Out of scope
- Changing image model or gateway.
- Headline compositor, logo compositor, palette/QA logic.
- UI in `ContentStudio.tsx`.
