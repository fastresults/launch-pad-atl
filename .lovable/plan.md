## Diagnosis

Two separate defects, both in the Content Studio ad pipeline (`venture-content-ad` + `_shared/content-ad-director.ts` + `_shared/cover-art-director.ts`).

**1. "Same stock photo every time"**
Images are already AI-generated (`google/gemini-3-pro-image` — Nano Banana Pro family, not stock), but the **Scene Directive** in `cover-art-director.ts → resolveSceneDirective()` is fully deterministic per venture: same track + industry → same `depict / subjects / setting / mood` string on every post. So every ad across all 90 days of the calendar gets the same brief ("diverse cohort of founders in a bright modern accelerator…"), and Gemini honors it — producing visually near-identical output. The `variationSeed` we pass is just a nonce; the *brief itself* never changes.

**2. "Titles truncated — letters not sized to fit"**
Headlines are rendered by the image model. We only enforce a **character cap** (60/70/80 by aspect) and tell the model "max two lines, tight tracking, ranged left". Gemini picks its own font size and often chooses a size that overflows the reserved band → letterforms clipped at the edges. There is no server-side type rendering, so we have no real control over fit.

## Plan

### A. Scene variety per post (fix "same image")

Rework `resolveSceneDirective` so the scene brief varies per post while staying on-brand:

1. **Scene library, not a single scene.** For each track/industry bucket, define 6–10 distinct scene variants (e.g. for the startup track: whiteboard session, 1:1 mentor over coffee, laptop close-up on cafe table, cohort demo-day stage, sticky-note wall macro, founder portrait at desk, hands sketching on paper, over-the-shoulder screen, evening standup, product mock on monitor). Each variant has its own `depict / subjects / setting / mood / camera`.
2. **Deterministic pick per post.** Hash `(post_id + aspect + variationSeed)` → index into the variant list. Same post regenerated with a new seed rotates to a different scene; different posts in the same week land on different scenes.
3. **Post-signal steering.** When the calendar row provides `pillar` / `format` / `asset_notes`, bias the variant pick (e.g. pillar=`education` → favor whiteboard/desk variants; format=`portrait` → favor human-subject variants; `asset_notes` keywords take priority over the bucket default).
4. **Composition rotation.** Add a `composition` field per variant (rule-of-thirds left, centered portrait, macro detail, wide environmental, over-shoulder, flat-lay) and feed it into the prompt alongside the scene, so even within one variant the framing changes.
5. **Direction rotation default.** In `ContentStudio.tsx`, when the user hits "Generate Week 1 now" without picking a direction per post, rotate `direction` across `editorial / photographic / geometric / illustrative` per post index so the week reads as a set rather than four copies.

### B. Auto-fit headlines (fix "truncated titles")

Stop asking the image model to typeset the headline. Render headlines server-side with real typography that measures the text and picks a size that fits.

1. **New helper `_shared/headline-compositor.ts`** using `ImageScript` (already Deno-compatible) + a bundled variable font (Inter or a similar geometric sans; ships in `supabase/functions/_shared/fonts/`).
2. **Fit algorithm.** Given `canvas W×H`, reserved band (top 14 / 20 / 24% per aspect, matching `HEADLINE LANDING AREA`), and headline string:
   - Wrap into up to N lines (N = 2 for square/portrait, 3 for 9:16).
   - Binary-search font size from `max = band.height / lines` down to a floor (e.g. 32px) until the widest line fits `band.width − 2×inset` AND total block ≤ `band.height`.
   - If it still doesn't fit at floor size, wrap to +1 line; if still no fit, apply the word-safe truncator we already have as a last resort (rare).
3. **Compositing.** Paint the fitted headline as `plan.ink` on the finished image inside the reserved band, ranged left, tight tracking. Runs after `compositeSignatureSplash` and before `compositeLogo` so the logo band still sits on top cleanly.
4. **Prompt change.** Update `assetSystem` / `primaryTextObjective` in `cover-art-director.ts`: when `headlineOverride.mode === "custom"` and content-ad flow, tell the model **"zero glyphs anywhere on the canvas — a headline will be composited server-side into the top band"** and reserve the band as unmarked negative space (same treatment as the logo landing area). This eliminates the model's guesswork entirely.
5. **Suppress-headline mode** unchanged.

### C. Small cleanups

- Confirm current model `google/gemini-3-pro-image` stays default (it *is* Nano Banana Pro–class). If the user prefers `google/gemini-3.1-flash-image` (Nano Banana 2, faster/cheaper, similar quality), swap `MODEL_MULTIMODAL` in `venture-content-ad/index.ts`.
- Drop the character caps in `content-ad-director.ts` down (the compositor handles fit) and keep truncation only as a safety net.

## Files touched

- `supabase/functions/_shared/cover-art-director.ts` — scene library + composition rotation, headline-band directive when text is composited server-side.
- `supabase/functions/_shared/content-ad-director.ts` — post-signal steering, relax character cap.
- `supabase/functions/_shared/headline-compositor.ts` — **new**, auto-fit typography using ImageScript + bundled font.
- `supabase/functions/_shared/fonts/*.ttf` — **new**, one variable font file.
- `supabase/functions/venture-content-ad/index.ts` — call the new headline compositor between signature and logo steps.
- `src/components/hub/ContentStudio.tsx` — rotate `direction` across posts on "Generate Week 1 now".

## Open questions

1. Keep `google/gemini-3-pro-image` (higher quality, slower) or switch to `google/gemini-3.1-flash-image` (Nano Banana 2, faster/cheaper)?
2. Font preference for the composited headlines — match brand's `typography.heading.family` where possible (Google Fonts fetch at cold start, cached), or ship one house font (Inter) and always use it?
