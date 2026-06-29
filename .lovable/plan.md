## Goal
When a generated avatar/cover in Social Studio (Step 5 Build kit) feels off-brand, give the user a clear **Regenerate** path with optional written feedback ("less purple", "more editorial", "remove the dark square", etc.) plus a one-tap style override — instead of the current tiny silent "Redo" that just re-rolls the same prompt.

## UX changes (`SocialAutopilot.tsx`, Step 5 card)

1. Replace the per-asset ghost "Redo/Retry" with a prominent **Regenerate** button (icon + label) on every tile, visible whenever the tile has an image or an error.
2. Clicking Regenerate opens a new `RegenerateAssetDialog` showing:
   - Thumbnail of the current asset + brand palette swatches + current style chip.
   - Free-text "What's off?" field (placeholder: "e.g. background too dark, logo too small, less purple, more editorial feel").
   - Quick-pick chips that prepend canned guidance: *Lighter background*, *Stronger logo presence*, *More whitespace*, *Higher contrast*, *Less saturated*, *Different composition*.
   - Optional **Override style for this asset** dropdown (Editorial / Photographic / Geometric / Illustrative) so users can try a different look on one tile without changing the global pick.
   - Buttons: Cancel · Regenerate.
3. Add a header-level **Regenerate all** button next to the direction badge that opens the same dialog scoped to "all not-locked assets" with the same feedback fields.
4. Add a small ⭐ **Keep** toggle per tile; kept tiles are excluded from "Regenerate all" so the user can lock the good ones.

## Wiring

- Extend `generateOneKitTask(snapshotId, task, opts?)` in `src/lib/social-autopilot.functions.ts` to accept `{ feedback?: string; directionOverride?: ArtDirectionId }` and forward both to the `venture-social-cover` invoke body as `feedback` and `direction`.
- `venture-social-cover/index.ts`: read `body.feedback` (string, ≤500 chars, trimmed) and pass it through to `buildCoverArtPrompt` / `buildAvatarPrompt` as an additional `userFeedback` argument; concatenate into the existing `retryNote` slot so the director prompt includes a "User feedback to honor on this regeneration: …" block above the existing constraints. Direction override already flows via the existing `direction` field.
- `cover-art-director.ts`: accept and render `userFeedback` near the top of the prompt with a "Treat this as binding art-direction notes" preface; keep WCAG/contrast rules above it so feedback can't override safety rails.
- Persist the last feedback on the asset row for transparency: add `last_feedback text` and `last_regenerated_at timestamptz` columns to `venture_social_assets` (migration). Show the last feedback as a muted tooltip on the tile if present.

## Out of scope
No changes to Step 4 Style picker, brand wizard, or the QA/contrast retry loop. The Geometric thumbnail shown in the screenshot is just the static style preview — regenerate applies to real generated assets in Step 5.

## Technical notes
- Keep `verify_jwt = false` posture unchanged; `venture-social-cover` already validates the user.
- Migration adds two nullable columns; existing RLS grants cover them.
- Dialog reuses shadcn `Dialog`, `Textarea`, `Badge`, `Select`.
