## What went wrong

You changed the headline to "Adam Rocks!" and hit Regenerate, but the returned image still paints the auto‑derived tagline ("An AI‑native, strategy‑first workshop that transforms founder fo…"). The client sent the override correctly; the failure is in the prompt the model sees.

Two concrete bugs and one prompt‑robustness gap:

### Bug 1 — duplicate `assetSystem` in `cover-art-director.ts`
`supabase/functions/_shared/cover-art-director.ts` declares `function assetSystem(...)` **twice** (lines 114–125 and 127–178). The first is a stale 3‑arg version that only handles the avatar case; the second is the real 5‑arg version that carries `suppressHeadline` and `isCustomHeadline` (the flags that inject the "verbatim, exact wording" instruction). Depending on how Deno hoists the redeclaration this either throws at module load or silently drops the verbatim clause. Either way it is wrong and must be removed.

### Bug 2 — the old tagline is still in the prompt as context
`ventureBlock()` always emits `- One-liner: <brain.identity.one_liner>`, and that one‑liner is exactly the "An AI‑native, strategy‑first workshop…" string. Even when `HEADLINE (verbatim): "Adam Rocks!"` is present in the asset system block, the model sees the long, professional copy elsewhere in the prompt and prefers to render it on the poster. This is the primary reason your custom text got overridden.

### Bug 3 — the verbatim rule is buried
The verbatim instruction only appears inside the per‑asset system block, mid‑prompt. Gemini‑3‑pro‑image responds much more reliably when the exact string it must render is stated once at the very top as the primary objective, and once more in a hard negative ("do NOT render any other tagline").

## Plan

1. **Delete the dead first `assetSystem` declaration** in `supabase/functions/_shared/cover-art-director.ts` (lines 114–125). Keep only the 5‑arg version that receives `suppressHeadline` and `isCustomHeadline`.

2. **Sanitize `ventureBlock` when a custom or "none" headline override is active.** Pass `headlineOverride` into `ventureBlock(ctx, headlineOverride)` and, when the override is `custom` or `none`, drop the `One-liner` line entirely (and any other field that duplicates the auto‑headline text). The model must not be shown competing copy.

3. **Add a top‑of‑prompt PRIMARY TEXT OBJECTIVE block in `buildCoverArtPrompt`** when `isCustomHeadline` is true:
   - `PRIMARY TEXT OBJECTIVE: the only lettering on the canvas is the exact string "Adam Rocks!" (verbatim, no substitutions, no rewrites, no punctuation changes, no additional words).`
   - `FORBIDDEN TEXT: do NOT render "<autoHeadline(ctx)>" or any paraphrase of it anywhere on the canvas.`
   Mirror the same two lines when the override is `none` (objective = zero glyphs, forbidden = the auto tagline).

4. **Make the "verbatim" rule survive retries.** `image-qa.ts` retry path currently reuses the same prompt; confirm `headlineOverride` is threaded through the retry call in `venture-social-cover/index.ts` so the second attempt still gets the verbatim instruction.

5. **Refresh the preview sidebar after regenerate** so "Headline on image" shows "Adam Rocks!" instead of the "Auto‑derived from your venture" placeholder. `venture-social-cover` already writes `last_headline`; verify the `["social-cover", snapshotId]` query invalidation actually re‑reads the row into the `AssetPreviewDialog` after a single‑asset regenerate (the current screenshot suggests it didn't).

6. **Log the resolved headline server‑side.** Add a one‑line `console.log("[social-cover] headline:", { mode, text, suppress })` at the top of the render call in both `venture-social-cover` and `venture-style-preview` so the next time this misfires we can confirm from edge logs whether the override reached the prompt.

## Files touched

- `supabase/functions/_shared/cover-art-director.ts` — remove duplicate `assetSystem`; add `PRIMARY TEXT OBJECTIVE` / `FORBIDDEN TEXT` block; take `headlineOverride` in `ventureBlock` and strip the one‑liner when overridden.
- `supabase/functions/venture-social-cover/index.ts` — add headline log line; verify retry path forwards `headlineOverride`.
- `supabase/functions/venture-style-preview/index.ts` — same log line; same retry check.
- `src/components/hub/social/SocialAutopilot.tsx` / `AssetPreviewDialog.tsx` — verify the sidebar re‑reads `last_headline` after regenerate; add a small fallback that displays the just‑submitted headline optimistically until the query returns.

## What stays the same

Client submit path, palette override handling, brand‑signature intensity/placement, delete flow, and the modal scroll fix from the previous turn all remain untouched.
