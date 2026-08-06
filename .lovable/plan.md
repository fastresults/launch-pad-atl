# Rebuild the logo pipeline as a real art-direction process

The current pipeline asks one model for four "directions" and immediately renders each one as an image. Nothing checks whether the idea is actually iconic, nothing enforces simplicity, and the render model is free to add scenes, taglines, gradients and detail. That is why the four concepts came back generic.

The fix is to make the process behave like an agency: strategy first, concept selection second, tight execution third, and a critique gate before anything reaches the founder.

## What changes

### 1. Strategy step (new, before any concepts)
Before directions are written, a strategy pass reads the venture's real assets — positioning, differentiation, ICP, brand voice guide, naming rationale, concept summary — and outputs a short brand brief: one core idea, three brand attributes, the single visual metaphor territory, and an explicit "what this brand is NOT" list. Today the director sees only a few truncated snapshot fields, so it invents startup-generic ideas.

### 2. Concept step becomes selective, not first-draft
The director generates 10 candidate concepts, then self-scores each on distinctiveness, simplicity (can it be drawn in one continuous idea?), relevance to the strategy, scalability at 16px, and memorability — and returns only the top 4, each with a different logo type. It must reject any concept that would work for a different company in the same category.

Every surviving concept must state: the one shape idea in a single sentence, why it is memorable, and the construction rules (grid, stroke weight, counterform, corner radius).

### 3. Execution prompts get much stricter
The render prompt is rewritten to describe a *mark*, not a picture:
- flat vector, 2 colors maximum, one weight, no gradient, no shadow, no 3D, no texture, no illustration detail, no scene
- geometry described explicitly (circle/grid base, stroke ratio, terminal treatment)
- wordmark set in the kit's typeface, tight tracking, correct case — or symbol-only when the concept calls for it
- silhouette test stated in the prompt: must read as a solid black shape at 16px

Reference logos stay as *principle* input only (proportion, abstraction level, weight) and are explicitly barred from being restyled.

### 4. Critique-and-retry gate (new)
After each image renders, a vision pass looks at the actual output and scores it against the brief: is it one clear idea, is it simple enough, is there stray text/artefacts, would it survive at small size? Anything that fails gets one automatic retry with the critique fed back into the prompt. Only concepts that pass reach the founder.

### 5. Founder-facing transparency
Each concept card shows its name, logo type, the one-sentence idea, and the rationale — so the founder can judge the thinking, not just the picture. A "more like this" action re-runs a single direction with the concept locked and the execution varied.

## Technical notes

- `supabase/functions/venture-brand-assets/index.ts`: split the logo path into `buildBrandStrategy` → `generateLogoConcepts` (10 → score → top 4) → `buildLogoImagePrompt` (rewritten) → `critiqueLogo` (vision) → conditional single retry.
- Strategy and concept passes pull from `venture_documents` (positioning, differentiation, brand voice, naming, ICP) via the existing `loadVentureContext`, not just the snapshot fields.
- Chat/critique passes use a current chat model with strict JSON output and the tolerant parse + fallback already added; renders stay on `google/gemini-3-pro-image`.
- Concepts are cached on the brand kit so a retry or "more like this" does not re-run strategy.
- `src/components/hub/brand-wizard/BrandWizard.tsx`: concept cards gain the idea/rationale line and the "more like this" action; copy updated to describe the strategy-first process.
- Runtime goes up (strategy + critique add two model calls per set), so the generate button gets staged progress text.

## Out of scope

Moodboard and social image generation are untouched.
