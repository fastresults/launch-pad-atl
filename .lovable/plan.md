## Goal
Let founders click any palette swatch (surface / ink / signature / accent) in the preview + regenerate modals to override that color before (re)generating a social asset. The override flows through to the AI prompt, deterministic logo compositor, and signature compositor so the rendered image actually uses the picked color.

## UX

**Regenerate modal (`RegenerateAssetDialog.tsx`)**
- Palette strip becomes 4 interactive swatch buttons labeled Surface / Ink / Signature / Accent.
- Click a swatch → small popover with:
  - Native color picker (`<input type="color">`)
  - Hex input (validated `#RRGGBB`)
  - "Reset to brand" link (reverts to original brand-kit value)
- Live contrast readout under the strip (reuses `palette-rules` AA check). If the new pairing fails AA, show an inline warning; do not block submit.
- Any edited swatch shows a small "edited" dot + hex label so the user knows it's overridden.
- Submit passes a `paletteOverride` object alongside existing `feedback / directionOverride / signatureIntensity / signaturePlacement`.

**Asset preview modal (`AssetPreviewDialog.tsx`)**
- Same clickable swatches. Editing here just stages overrides that get handed to the Regenerate action (opens Regenerate dialog pre-filled). Pure viewers still see read-only swatches if `onRegenerate` isn't provided.

**Kit tiles + Style step (`SocialAutopilot.tsx`)**
- No inline picker on tiles (keeps grid clean). The new picker lives in the modals users already open to generate/regenerate.
- For first-time Generate on empty tiles: extend the small "Generate" action to open the Regenerate modal in "generate" mode (already the same code path) so palette can be tweaked before the first render too.

## Data flow

1. `RegenerateAssetDialog.onSubmit` gains optional `paletteOverride?: { surface?; ink?; signature?; accent? }`.
2. `SocialAutopilot` handlers (`handleRegenerateSubmit`, per-tile generate) forward it to:
   - `generateSocialCover({ ..., paletteOverride })` → `src/lib/social-cover.functions.ts`
   - `generateStylePreview({ ..., paletteOverride })` → `src/lib/style-preview.functions.ts`
3. Edge functions `venture-social-cover` and `venture-style-preview`:
   - Merge overrides into the resolved `CanvasPlan` before calling `buildDirectorPrompt`, `logo-compositor`, and `signature-compositor`.
   - Recompute `displaySignature` (perceptual boost) from the overridden signature.
   - Persist the effective plan to `canvas_plan` so the preview dialog reflects what was actually used.
4. No schema change — `canvas_plan` JSONB already stores per-asset palette.

## Guardrails
- Validate hex server-side; ignore malformed values and fall back to brand kit.
- Keep brand-kit values untouched (overrides are per-asset, per-generation).
- Contrast warning only — user can still ship an intentionally low-contrast look.
- Signature compositor already reads `plan.signature`; no logic change beyond honoring the override.

## Files touched
- `src/components/hub/social/RegenerateAssetDialog.tsx` — clickable swatches, popover picker, contrast readout, extended `onSubmit` payload.
- `src/components/hub/social/AssetPreviewDialog.tsx` — clickable swatches that stage overrides into Regenerate.
- `src/components/hub/SocialAutopilot.tsx` — thread `paletteOverride` through generate/regenerate handlers for both kit assets and style previews.
- `src/lib/social-cover.functions.ts`, `src/lib/style-preview.functions.ts` — add `paletteOverride` to request types.
- `supabase/functions/venture-social-cover/index.ts`, `supabase/functions/venture-style-preview/index.ts` — accept overrides, validate hex, merge into `CanvasPlan`, persist effective plan.
- (Optional) small `HexColorField` helper under `src/components/hub/social/` for the popover.
