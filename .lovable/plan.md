## Why current renders feel off-brand

`buildCanvasPlan` locks each asset to exactly three hex values — `surface`, `ink`, `accent` — and `cover-art-director.ts` tells the model "ONLY these three hex colors. Nothing else. No tints."

For most directions (`editorial`, `illustrative`, `photographic`) the surface defaults to `bg` (usually white/off-white), the ink resolves to a dark neutral, and `accent` is chosen as the first palette role that's distinct from both with ≥3:1 contrast. The brand's signature hue (the purple) often ends up:

- Demoted to `accent` and then used "sparingly" by the model (a thin rule, a tiny mark) instead of as a recognizable brand splash, OR
- Skipped entirely when `primary` doesn't pass the 3:1 surface test, leaving the composition reading as black-on-white with no brand color at all.

Result: technically on-palette, visually generic.

## Fix — introduce an explicit "signature" brand color with required presence

### 1. Extend `CanvasPlan` (`supabase/functions/_shared/canvas-plan.ts`)

Add a fourth, mandatory role:

```ts
export type CanvasPlan = {
  surface: string;
  ink: string;
  accent: string;
  signature: string;        // NEW — the unmistakable brand hue (usually `primary`)
  signatureRole: string;    // which palette role it came from
  signatureMinCoveragePct: number; // 15 for hero/banner, 25 for thumbnail/poster, 8 for editorial
  surfaceRole: string;
  forbiddenPairs: Array<{ fg: string; bg: string; ratio: number }>;
};
```

Selection logic for `signature`:
1. Prefer `roles.primary`; fall back to `roles.secondary`, then `roles.accent`.
2. If `signature === surface` (e.g. geometric direction already put primary on surface), pick the next most saturated non-neutral role so we always have a contrasting brand pop.
3. Never equal `ink`. Contrast against `surface` is allowed to be <3:1 because signature is used as shape fill, not text — but we record the pair in `forbiddenPairs` so the model won't set text on it.

Coverage targets by asset kind/direction:
- `thumbnail`, `video_poster`, `vertical_pin`: 25–40% (bold poster energy).
- `banner`, `header`, `channel_art`, `pinned_post`, `story_cover`: 15–25%.
- `editorial` direction on any kind: 8–15% (still required, but restrained — a single confident block/rule/mark).
- `photographic`: signature appears as duotone grade target, not as a flat shape.
- `avatar`: unchanged — logo preservation rules win.

### 2. Update `cover-art-director.ts` prompt

Replace the "ONLY these three hex colors" block with a four-color contract that *requires* signature presence:

- Rename header to "Canvas palette (NON-NEGOTIABLE — exactly these four hex values, used as specified)".
- Add a `Signature` line: `Signature (the brand hue — MUST be visibly present): {signature}  ← cover ≥{signatureMinCoveragePct}% of the composition as a confident shape, block, rule stack, or duotone wash. Not as a hairline. Not as a 1px stroke.`
- Per-direction signature usage guidance:
  - editorial → one solid signature block or full-bleed sidebar/folio stripe.
  - geometric → primary geometric shape filled with signature.
  - illustrative → at least one major shape uses signature as fill.
  - photographic → duotone grade targets the signature hue (replace the existing "graded toward brand primary" line to read "graded toward `{signature}`").
- Update BANNED list:
  - Remove the absolute "no other colors / no tints" line; replace with: "Only these four hexes. Signature MAY appear at lower opacity (≥70%) to integrate with photography; surface, ink, accent must remain exact."
  - Add: "Composition with no visible signature color = failure. Composition where signature is reduced to a hairline or <{signatureMinCoveragePct}% coverage = failure."
- Update the closing line: "Background MUST be exactly {surface}. Text/marks MUST be exactly {ink}. The signature color {signature} MUST cover ≥{signatureMinCoveragePct}% of the canvas. The only permitted secondary accent is {accent}."

### 3. Update `image-qa.ts` to gate on signature presence

Currently QA checks contrast pairings. Add a lightweight color-histogram check on the returned PNG: count pixels within ΔE ≤ 12 of `plan.signature`. If `coveragePct < signatureMinCoveragePct * 0.6` (60% tolerance), mark the asset as `signature_missing` and return a retry note ("Signature color {signature} was nearly absent — increase coverage to ≥{signatureMinCoveragePct}% as a confident shape, not a hairline.") so the existing regenerate-with-retryNote path in `venture-social-cover` automatically takes another pass.

### 4. Avatar path unchanged

`pickAvatarSurface` keeps prioritizing maximum logo contrast. We do not force signature onto avatars because logo legibility wins.

## Files touched

- `supabase/functions/_shared/canvas-plan.ts` — add `signature`, `signatureRole`, `signatureMinCoveragePct`, selection + coverage logic.
- `supabase/functions/_shared/cover-art-director.ts` — new four-color contract in `buildCoverArtPrompt`, per-direction signature usage, updated BANNED + closing line.
- `supabase/functions/_shared/image-qa.ts` — add signature-coverage check + retry note.
- `supabase/functions/venture-social-cover/index.ts` — wire the new QA failure into the existing retry loop (no new round-trip if first pass already passes).
- `supabase/functions/venture-style-preview/index.ts` — same canvas plan upgrade so Step 4 style tiles also show the purple splash, keeping previews honest.

## Out of scope

- No UI changes in `SocialAutopilot.tsx`; the fix is entirely in the generation contract.
- No palette rule changes in `palette-rules.ts` — WCAG gates stay as-is.
- Brand Wizard output unchanged; we're just using `primary` more assertively downstream.
