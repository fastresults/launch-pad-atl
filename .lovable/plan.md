## Goal
Make every creative asset on Social Studio (Step 4 style previews and Step 5 build-kit tiles) openable in a full-size preview modal — click any tile to see the artwork large with metadata and actions.

## What changes

### 1. New shared component: `AssetPreviewDialog`
`src/components/hub/social/AssetPreviewDialog.tsx`
- Built on shadcn `Dialog` (large: `max-w-5xl`, asset centered on a neutral checkerboard so transparent PNGs read correctly).
- Props: `open`, `onOpenChange`, `asset: { url, title, subtitle?, width?, height?, platform?, assetKind?, canvasPlan?, qaStatus?, qaNotes?, modelUsed?, lastFeedback?, updatedAt? }`, optional `onRegenerate?()`, `onDownload?()`, `nextAsset?()/prevAsset?()` for keyboard arrow navigation.
- Body: large image (object-contain, capped at 80vh), side rail with title, dimensions, platform, model used, last feedback, QA badge (pass/fail with contrast ratio from `qaNotes`), CanvasPlan swatch strip (surface/ink/accent) when present.
- Footer: Download (signed URL), Copy URL, Open in new tab, Regenerate (opens existing `RegenerateAssetDialog`).
- Keyboard: Esc to close, ←/→ to move between assets in the same gallery.

### 2. Step 4 – Style preview tiles
In `SocialAutopilot.tsx` `Step4Style`:
- Wrap each direction tile in a button that opens `AssetPreviewDialog` for that direction's preview image (the AI thumbnail from `venture_style_previews`).
- Add a small "Preview" overlay icon (Eye) next to the existing Regenerate overlay, so click-through is discoverable without hijacking the tile-select click. Selection stays on tile body click; Preview/Regenerate are corner buttons that `stopPropagation`.
- Arrow-key nav cycles through the 4 directions.

### 3. Step 5 – Build kit tiles
In `Step5BuildKit`:
- Each generated asset card (avatar / cover / pinned post, per platform) becomes clickable → opens `AssetPreviewDialog` with that asset.
- The existing Regenerate / Keep controls stay; add an Eye "Preview" icon next to them.
- Arrow-key nav cycles through all assets currently rendered in the kit grid.

### 4. Wiring
- Reuse signed URLs already returned by `listSocialAssets` / `listStylePreviews` — no new edge function or schema work.
- Reuse `RegenerateAssetDialog` for the Regenerate action from inside the preview.
- No DB changes.

## Files touched
- `src/components/hub/social/AssetPreviewDialog.tsx` (new)
- `src/components/hub/social/SocialAutopilot.tsx` (Step4Style + Step5BuildKit: add preview triggers and dialog state)

## Out of scope
- Editing/cropping inside the modal.
- Persisting view history.
- Other hub surfaces (Brand Wizard, Documents) — this request is scoped to Social Studio per the screenshot.
