# Brand Kit → Social Studio: Color Consistency Hardening

The current pipeline passes the locked palette as a list of hex codes and trusts the image model to pick a contrast-safe combination per asset. The model frequently fails this (e.g., dark ink on dark violet) because: (1) no specific bg/ink pair is pre-decided per asset, (2) the palette swatch tile the prompt references is never actually attached, and (3) there is no post-generation QA to catch failures.

This plan makes color a decision the *system* makes, not the model.

## 1. Pre-compute a "Canvas Plan" per asset (server)

In `cover-art-director.ts`, before assembling the prompt, derive a concrete `CanvasPlan` from the locked palette using `palette-rules.ts`:

- `surface` — the chosen background hex (one specific role)
- `ink` — the on-color guaranteed ≥ 4.5:1 against `surface` (uses `pickOnColor` / `contrastRatio`)
- `accent` — one supporting role chosen for ≥ 3:1 against `surface` and visually distinct from `ink`
- `headlineColor` — `ink` (or `onPrimary` if surface is `primary`)
- `forbiddenCombos` — explicit "never put X on Y" list of any palette pair that fails AA

Selection rules per asset kind:
- **Avatar**: surface = whichever palette role gives the *highest* contrast with the logo's dominant ink (computed by sampling the logo bytes). Today it just "prefers bg" — replace with computed max-contrast pick.
- **Banner / cover / thumbnail**: rotate surface across `bg`, `primary`, `secondary` per direction (Editorial → bg; Geometric → primary; Photographic → bg w/ duotone toward primary; Illustrative → bg). Always re-derive `ink` from `pickOnColor(surface)` so we *guarantee* legibility.

The prompt then says: "Background MUST be exactly `#XXXXXX`. Any rendered text MUST be exactly `#YYYYYY`. The only accent permitted is `#ZZZZZZ`. Do NOT use [forbidden list]." — no more "pick two roles."

## 2. Actually attach the palette + type tiles (server)

`cover-art-director.ts` currently references "Image #2: palette swatch tile" and "Image #3: typography specimen" but `venture-social-cover/index.ts` only sends the logo. Build and pass them:

- `buildPaletteTile(plan)` → render a 1024×256 PNG showing surface / ink / accent swatches with hex labels, server-side via a tiny canvas helper (Deno `ImageData` or a hand-rolled PNG encoder; we already do similar for brand-guide swatches — reuse the approach from `brand-guide-docx`'s swatch helper, ported to edge).
- `buildTypeTile(kit)` → optional, lower priority; skip if it adds latency.

Pass `[logo, paletteTile]` to `callMultimodal`. The model "sees" the exact pixels it's allowed to use.

## 3. Post-generation contrast QA + one retry (server)

After the image returns, in `venture-social-cover/index.ts`:

- Decode the PNG, downsample to 64×64, cluster dominant colors.
- Verify: top-2 colors include surface ± tolerance; if rendered text region (top 1/3 for thumbnails, lower 1/3 for posters) contains a color < 3:1 contrast against the dominant background, mark **FAIL**.
- On FAIL, retry **once** with an even stricter prompt addendum ("Previous attempt placed near-black ink on dark violet — this is a hard fail. Use `#XXXXXX` text on `#YYYYYY` surface ONLY.") If still fails, fall back to text-only with the same canvas plan.

Persist the QA verdict on `venture_social_assets` (`qa_status`, `qa_notes`) so the UI can badge a card and let the user one-tap regenerate.

## 4. Surface canvas plan in the UI (client)

In `SocialAutopilot.tsx` Step 5 task rows:

- Show a small swatch strip (surface / ink / accent) under each generating asset so the user can see *which* brand colors the kit committed to.
- If `qa_status === "fail"`, badge the thumbnail with "Contrast issue — regenerate" and wire the existing Redo button.
- Mirror the same swatch strip on the Brand Wizard's "Pick a look" step so users see the exact color pairing the social system will use, closing the visual loop.

## 5. Tighten direction briefs (server)

In `cover-art-director.ts`:
- Remove "AT MOST two palette roles + the background" (ambiguous). Replace with "Use exactly: surface = `#…`, ink = `#…`, accent = `#…`. Nothing else."
- Add to `BANNED`: "Dark text on dark surfaces, light text on light surfaces, any pair below 4.5:1 contrast."

## Technical Details

Files touched:
- `supabase/functions/_shared/cover-art-director.ts` — add `buildCanvasPlan(kit, asset, direction, logoBytes?)`, rewrite prompts to use hard hex values.
- `supabase/functions/_shared/palette-tile.ts` (new) — PNG encoder for swatch tile.
- `supabase/functions/_shared/image-qa.ts` (new) — dominant-color + contrast check.
- `supabase/functions/venture-social-cover/index.ts` — attach palette tile, run QA, retry once, persist verdict.
- Migration: add `qa_status text`, `qa_notes jsonb`, `canvas_plan jsonb` to `venture_social_assets`.
- `src/components/hub/social/SocialAutopilot.tsx` — swatch strip + QA badge.
- `src/components/hub/BrandWizard.tsx` — mirror swatch strip on Style step.

Out of scope: rebuilding the Brand Wizard's palette generation (it's already contrast-validated via `palette-rules.ts`); changing platform specs.
