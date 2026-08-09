# Brand context is missing from asset generation — root cause and fix

## What's actually wrong (verified in code)

Two concrete defects, both in the shared generation path:

1. **Brand context is injected for only two assets.**
   `supabase/functions/_shared/venture-context.ts` defines
   `BRAND_KIT_REQUIRED_TYPES = { website_prd, presell_landing_prd }`. Both
   `venture-generate-document` and `venture-bulk-generate` load the brand kit
   *only* when the asset is one of those two. Every other asset — pitch deck,
   messaging matrix, social calendar, ads, sales scripts, PRDs, one-pagers —
   is generated with **zero** palette, typography, voice, mood or CTA context.

2. **Even when it is injected, the block is incomplete.**
   `loadBrandKit` selects `status, locked_at, palette, typography, voice, logos,
   guide_markdown, dna` — it never selects `moodboard` (or `art_direction`).
   `brandKitBlock` then emits logo, colors, fonts, raw `voice` JSON and a guide
   excerpt. It never emits the **mood board**, the **brand DNA traits /
   positioning**, or the approved **CTAs** — even though the app already models
   all three (`src/lib/brand-board.ts` → `moodboard`, `dna.traits`,
   `voice.dos/donts/principles`, `ctas`).

Net effect: new users get assets that don't reflect their brand at all, and
locked-kit users get assets missing mood, DNA and CTA language.

## The fix

### 1. Brand context becomes global, not per-type
- Load the brand kit **once per generation run** for every asset type in both
  `venture-generate-document` and `venture-bulk-generate`.
- If no usable kit exists, run `deriveBrandKitFromAssets` (already built) to
  produce the provisional `"auto"` kit — once per snapshot, then reused.
- Keep the *hard gate* behaviour only for `BRAND_KIT_REQUIRED_TYPES`: those two
  still block when derivation fails. Every other asset proceeds with whatever
  brand context exists (locked → auto → nothing) and never blocks.

### 2. Complete the brand block
- Add `moodboard` and `art_direction` to the `loadBrandKit` select and to
  `BrandKitRow`.
- Extend `brandKitBlock` with named, prompt-friendly sections:
  - **Brand DNA** — positioning/promise, traits, tone words.
  - **Mood board** — image URLs plus captions, framed as the visual reference
    for any imagery, photography direction, or descriptive language.
  - **Voice** — summary, principles, explicit Do / Don't lists (rendered as
    bullets, not raw JSON).
  - **Approved CTAs** — the exact call-to-action strings; instruct the model to
    use these verbatim rather than inventing new ones.
- Reuse the same field-mapping rules that `src/lib/brand-board.ts` already
  applies so hub, shared link and generated assets can't drift.

### 3. Make sure the kit exists for new users
- `deriveBrandKitFromAssets` currently infers palette/typography/voice. Extend
  its schema to also emit `dna.traits`, `dna.positioning` and `voice.ctas` so a
  derived kit carries the same shape a locked kit does.
- Derivation is attempted at the start of any generation run when no usable kit
  exists, so a brand-new venture that never opened the Brand Wizard still gets
  coherent brand context on its very first asset.

### 4. Image/collateral functions read the full kit
`venture-content-ad`, `venture-collateral`, `venture-social-cover` and
`venture-style-preview` each hand-roll their own `venture_brand_kits` select.
Route them through `loadBrandKit` so they pick up mood board and art direction
automatically instead of a partial column list.

## Files touched

- `supabase/functions/_shared/venture-context.ts` — `BrandKitRow`,
  `loadBrandKit` select, `brandKitBlock` sections.
- `supabase/functions/_shared/brand-derive.ts` — richer derived-kit schema.
- `supabase/functions/venture-generate-document/index.ts` — always load kit.
- `supabase/functions/venture-bulk-generate/index.ts` — always load kit.
- `supabase/functions/venture-content-ad/index.ts`,
  `venture-collateral/index.ts`, `venture-social-cover/index.ts`,
  `venture-style-preview/index.ts` — use shared loader.

No database migration and no UI change required.

## Verification

- Generate a non-PRD asset (e.g. messaging matrix) on a venture with a locked
  kit and confirm the prompt payload contains the mood, voice and CTA sections.
- Generate the same asset on a venture with **no** kit and confirm an `"auto"`
  kit is derived and applied instead of silently generating brand-free copy.
