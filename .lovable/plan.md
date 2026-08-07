# Rebuild the logo render brief around brand + inspiration

The four marks you got back are generic because of three real gaps in the render stage — all confirmed in the code:

1. **Typography is never sent to the renderer.** The render brief receives palette, mood text and personality only. The locked heading/body fonts are dropped.
2. **The moodboard is sent as a sentence, not as pictures.** Concepting sees the moodboard tiles as vision references; the render stage does not — it only gets `kit.dna.mood` as text.
3. **The prompt reads like a checklist, not a brief.** It is 10+ labelled blocks ("THE BUSINESS:", "HOW IT MUST BE BUILT:", "THE CONCEPT:"). Image models flatten that into a mood average. Your example works because it is one flowing sentence-stack describing a specific emblem, its symbol, its palette and its vibe.

## What changes

### 1. New brief format, patterned on your example

Rewrite `buildLogoRenderPrompt` so the first thing the model reads is a single composed emblem sentence in your structure:

```text
A centered, balanced graphic vector emblem featuring {integrated symbol drawn from the
business's own symbol vocabulary}. The design must have {construction + stroke + terminals
read from the founder's three inspiration marks} and include a stylized element representing
{the differentiator the copy actually claims}. Use a {palette described in words} palette of
{exact hex list}. The vibe must be {register + personality tokens}. The logo must have high
scalability and readability, and sit comfortably beside {heading font} type.
```

Only after that sentence come the short constraint lines: banned category clichés, ink count, flat-fill rule, negative prompt. Constraints stay; they stop leading.

### 2. Feed the render stage everything the brand already has

- Pass `kit.typography.heading.family` / `body.family` into the render brief so the mark is drawn to sit next to the real type (weight, contrast, serif vs geometric).
- Pass live signed moodboard tile URLs into the render call as vision references, alongside the three inspiration logos — the same `moodboardImageUrls()` helper concepting already uses.
- Order the vision references explicitly in the prompt: inspiration marks = how it is built; moodboard tiles = what world it lives in.
- Use exact palette hexes from the locked kit (not `Object.values` order-luck) — primary leads, one accent maximum.

### 3. Make the craft spec binding at render, not just at concepting

The craft spec block currently arrives mid-prompt as prose. Fold its hard numbers into the emblem sentence itself (element ceiling, ink count, symmetry, abstraction level) so the model cannot average them away, and keep the "inherit structure, never subject matter" rule as a one-line guard.

### 4. Jury checks brand fit, not just craft

Add two criteria to the jury rubric: *palette fidelity* (does it use the locked hexes) and *moodboard fit* (does it belong in the founder's visual world). A fail on either produces the same single corrective note and one re-render, as today.

## Files

- `supabase/functions/_shared/logo-render-prompt.ts` — rewrite `buildLogoRenderPrompt`; extend `BrandContext` with `headingFont`, `bodyFont`, `moodboardTileCount`.
- `supabase/functions/venture-brand-assets/index.ts` — in the `logo_render_concept` branch: pass typography, resolve moodboard tile URLs, append them to `refImages`, pass ordered reference labelling.
- `supabase/functions/_shared/logo-jury.ts` — add the two brand-fit scores.

No schema changes, no UI changes, no change to the stage sequence or the approve-then-vectorize flow.
