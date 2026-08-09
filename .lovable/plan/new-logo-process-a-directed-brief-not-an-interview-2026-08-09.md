# New logo process: a directed brief, not an interview

The current Logo Studio runs a long question-by-question interview and renders a
single raster "rough" at each step, then traces it. Three things cap the quality:
the founder never gets to *describe* what they want in their own words or show a
reference, the brand guide and Second Brain content are only lightly sampled, and
one image model does both the thinking and the drawing with no art direction
between them.

The replacement is a short, high-signal intake followed by a real art-direction
pipeline: read the brand → write a creative direction → produce three distinct
marks → judge them → refine the chosen one → vectorize and build the lockups.

## 1. How the founder describes the logo

One screen, four inputs, none of them required — everything has an AI-proposed
default the founder can accept or overwrite.

- **In your words.** A free-text box: "Describe the logo you're imagining." Voice
  input supported (the app already has `VoiceField`). This is the highest-weight
  input in the whole pipeline.
- **Inspiration uploads.** Drag in up to 5 images (logos you like, photos, a
  colour scene, a sketch on a napkin). For each one the founder picks *why* it's
  there: shape language / colour / typography / overall feeling. This matters —
  today references get restyled instead of read for principle.
- **Direction dials.** Six quick choices with visual examples, pre-selected from
  the brand guide: mark type (symbol / wordmark / lettermark / combination),
  abstraction (literal ↔ abstract), weight (light ↔ heavy), geometry (geometric ↔
  organic), warmth (cool/technical ↔ warm/human), and era (classic ↔ contemporary).
- **Never do this.** A short "avoid" list, prefilled from the brand voice
  document's not-list (e.g. "no globes, no swooshes, no gradients, no lightbulb").

Everything else the old interview asked for is inferred, not asked.

## 2. What the AI reads first

Before it proposes anything, a **brand read** assembles one dossier from, in
priority order:

1. The brand guide the venture already has — palette with colour roles, heading
   and body typeface, voice attributes, tone words, dos/don'ts, CTAs.
2. Second Brain content — positioning, differentiation, ICP, value proposition,
   naming rationale, offer design, and the brief's own concept summary.
3. The founder's description, uploads and dials from step 1.

Output of the read is a **creative direction**: one core idea, three brand
attributes, one visual metaphor territory, the human/subject presence the mark
must carry, colour roles (dominant / secondary / one accent), and the explicit
not-list. The founder sees this direction in plain language and can edit it
before anything is drawn — this is the approval gate, not the picture.

## 3. Three marks, one set law

From the approved direction, the pipeline generates three concepts that differ in
*idea*, not in decoration. All three are rendered under one shared set law
produced once per run: one container rule, one stroke weight, one detail budget,
one colour role assignment. So the three read as one studio's work.

Each concept card shows the mark plus its one-sentence idea and its second read
(the extra true thing the form carries), so the founder judges thinking, not just
the picture.

Hard execution rules baked into the render prompt: flat vector look, two colours
max, one stroke weight, no gradient/shadow/3D/texture/scene/tagline, no interior
stroke thinner than 1/12 of the mark width, must survive being filled solid black
and read at 24px.

## 4. Automatic jury before the founder sees anything

Each rendered mark is scored by a vision pass against the direction and the set
law: single clear idea, simplicity, brand fit, small-size survival, no stray
text or artefacts, set coherence. Anything failing gets one automatic redraw with
the critique fed back. Only passing marks surface.

## 5. Refine, then deliver

The founder picks one and can refine it in free text ("make the counterform
bigger", "drop the third element") — each refine is one redraw of that mark, with
the previous versions kept in a strip so nothing is lost. On approve, the mark the
founder is looking at is traced to vector (no redraw between approval and
delivery), recoloured to the brand palette roles, and published as: primary mark,
horizontal lockup, stacked lockup, monochrome and knockout variants, with clear
space and minimum size rules — written straight into the brand kit.

## Technical notes

- Replace `_shared/logo-interview.ts` (the step-by-step question engine) with
  `_shared/logo-direction.ts`: brand dossier assembly + creative direction
  generation + set law.
- `venture-logo-studio/index.ts` actions become: `direction` (read + propose),
  `revise_direction`, `concepts` (render 3 under the set law), `refine`,
  `approve` (trace), `commit` (lockups). Each action stays one synchronous
  request; no queue or worker, matching today's stall-free design.
- Reference uploads go to the existing `user-media` bucket and are passed to the
  render as `image_url` parts with an explicit "read for principle only, do not
  restyle" instruction; `_shared/logo-reference-read.ts` is extended to record the
  founder's stated reason per image.
- Keep and reuse: `logo-trace.ts`, `logo-lockup.ts`, `logo-geometry.ts`,
  `logo-raster.ts`, `logo-type.ts`, `logo-compositor.ts`.
- `logo-jury.ts` gains the set-coherence, second-read and small-size criteria.
- `logo-render-prompt.ts` rewritten around colour roles and the countable detail
  cap instead of adjectival prose.
- UI: `src/components/hub/logo-studio/LogoStudio.tsx` is rebuilt as four panes —
  Describe, Direction, Concepts, Refine & Deliver — replacing the interview
  transcript. `BrandWizard.tsx` links into it unchanged.
- No schema change: the existing brand kit and logo run tables already hold
  direction text, concepts, review score and assets.

## Out of scope

Moodboard, social imagery and collateral templates are untouched; they consume
the brand kit's logo output as they do today.
