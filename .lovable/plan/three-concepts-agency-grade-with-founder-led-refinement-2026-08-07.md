# Three concepts, agency-grade, with founder-led refinement

## Critical assessment of the four attached marks

Looking at them as an art director would:

1. **House + leaf (mark 1)** — The outer contour is drawn with an uneven, hand-wobbled stroke: the roof pitch is asymmetric, the eave bulges, the bottom edge sags. Inside sit three unrelated objects (a rounded rectangle, a leaf, a gold swoosh) that do not touch, share a tangent, or resolve into one silhouette. The gold swoosh is pure filler. At 24px it becomes a grey blob.
2. **"PER" (mark 2)** — Contains lettering, which is explicitly banned in the current negative prompt, and the letterforms are mangled: the R has a broken leg, the E is a non-letter, the A has no counter. A tiny illegible lighthouse is jammed into the R's bowl at a different scale and stroke weight from everything around it. Two type systems in one mark.
3. **Ornate diamond (mark 3)** — Maximum decoration, zero idea. A quatrefoil frame, five random dots, a leaf, a gold blob, and an unidentifiable micro-glyph. Five competing elements against a spec that allows two or three. No focal hierarchy; the eye has nowhere to land.
4. **House + cane (mark 4)** — The closest to a real mark, and still: the stroke tapers randomly rather than deliberately, the cane crosses the house wall without a clean intersection, the gold outline is a stray highlight rather than a colour decision, and it carries a typeset lockup the brief forbade.

**The five failures they share**

- **Wobble instead of drawing.** Bézier curvature is accidental. Professional marks have controlled curvature and deliberate stroke modulation; these have neither.
- **Assembly instead of a single move.** Elements are placed near each other, not fused. No counterform, no shared tangent, no continuous contour — the exact craft moves the concepting stage already names and the renderer then ignores.
- **Decorative filler.** Every mark carries at least one gold swoosh doing no work.
- **No silhouette read.** Knock any of these to one flat colour and they collapse. That test is stated in the prompt but never enforced.
- **Type leakage.** Two of four contain lettering despite an absolute ban — evidence the negative prompt is being averaged away by a long positive prompt.

**Diagnosis against the current prompt.** The emblem sentence is right in structure but far too permissive: it asks for "clean sophisticated lines" (unmeasurable), lets the craft-spec clause become a comma-list the model averages, and buries the silhouette and no-text rules at the end where they carry least weight. Nothing in the prompt penalises assembled-but-unfused elements, nothing forbids decorative accents that carry no meaning, and the jury's rubric has no criterion for curve quality or single-move fusion — so lumpy work passes.

## What changes

### 1. Three concepts, not four

- `logo_create_run` clamps `requested_count` to 3; the concepting call asks for 3 survivors from its wide generation, and the wizard renders three slots.

### 2. Rewrite the render brief around enforceable craft rules

Keep the one-sentence emblem opening, then replace the vague clauses with hard, checkable ones:

- **Fusion rule (new, stated second):** all elements must be one continuous, connected form — sharing a contour, a tangent, or a counterform. Elements that merely sit near each other are a failed mark.
- **Element ceiling as a count, not a phrase:** "exactly N closed shapes, no more."
- **Curve quality:** deliberate, even curvature with consistent stroke weight or one deliberate modulation axis; no random tapering, no wobble, no lumpy contours.
- **No decorative accents:** every stroke must carry meaning; ban stray swooshes, sparkles, highlight arcs, filler leaves.
- **Silhouette test promoted to the top three lines:** the mark must remain legible knocked out in one flat colour at 24px.
- **No-text rule moved to the first line and repeated last** (models weight prompt head and tail most), plus lettering stays in the negative prompt.
- Palette, heading font and moodboard/reference role labelling stay exactly as they are today.

### 3. Jury enforces the same rules

Add three scores to the rubric: `fusion` (is it one connected form), `curve_quality` (deliberate vs wobbly), `silhouette_read` (survives one flat colour at 24px). Auto-fail on any lettering. Still one corrective note, one re-render.

### 4. Pick one, refine it, keep the history

- Each concept card gets a **Select** state (single selection, highlighted card).
- The selected card gets a **Refine this mark** button opening a modal: a free-text field for the founder's own direction ("thicker stroke", "drop the leaf, keep the cane"), plus optional quick chips for common asks.
- Submitting sends the note as the correction line on a fresh render of the same brief and seed family, so it stays in family rather than becoming a new concept.
- The previous render is **not** overwritten: it is pushed into a per-direction **archive queue** shown as a small thumbnail strip under the card, each thumbnail restorable as the current mark.
- **Approve & vectorize** stays, and acts on whichever version is current.

## Technical notes

- `supabase/functions/_shared/logo-render-prompt.ts` — rewrite `buildLogoRenderPrompt` per section 2; extend the negative prompt.
- `supabase/functions/_shared/logo-jury.ts` — add the three craft scores and the lettering auto-fail.
- `supabase/functions/venture-brand-assets/index.ts` — clamp count to 3; on re-render, append the current render to a `render_history` array on `brand_logo_directions` before writing the new one; accept a `refinementNote` on `logo_render_concept`.
- Migration: add `render_history jsonb not null default '[]'` and `selected boolean not null default false` to `brand_logo_directions`.
- `src/components/hub/brand-wizard/BrandWizard.tsx` — three slots, selection state, refinement modal, archive thumbnail strip.

No change to the stage sequence, the inspiration gate, or the approve-then-vectorize flow.
