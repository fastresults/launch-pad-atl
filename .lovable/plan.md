# Select a mark, then push the brand into the website PRD

Three additions to the Logo step of the Brand Wizard: upload your own mark, select any mark as the one, and regenerate the website PRD with the full brand baked in — copyable and downloadable without leaving the modal.

## 1. Upload your own logo

A small "Use my own logo" dropzone sits under the concept grid (PNG / JPG / SVG, one file). On drop the file is uploaded to storage, stored on the brand kit as a logo entry marked `source: "upload"`, and immediately set as **Selected**. It is distinct from the three inspiration references, which stay inspiration-only.

## 2. Selecting a mark actually commits it

Today "select" only flags the row in the run. It will now also write the choice into the Live Brand:

- The chosen asset becomes the brand kit's **primary logo** (`primary: true`), all others are demoted.
- Selection is exclusive across both generated concepts and an uploaded logo — picking one clears the other.
- Selected card shows a clear "Selected" state; every other card shows "Select this mark".
- The Live Brand Preview's "Primary logo" slot updates on the spot, and the choice persists (it is saved to the venture's brand kit, not just local state).

## 3. Regenerate website PRD, in the modal

Once a mark is selected, a featured button appears in the logo panel: **Regenerate website PRD with this brand**. It reruns the website PRD generator, which already treats a usable brand kit as ground truth — palette, typography, voice, style-guide excerpt and now the selected logo's URL, so a builder pasting the PRD gets the real mark.

After it finishes, the PRD renders in a panel inside the wizard with:
- **Copy** — full markdown to clipboard.
- **Download** — `<venture>-website-prd.md`.
- Timestamp of the last regeneration, so it is obvious whether the PRD is newer than the brand choice.

If the brand kit is not yet locked, the button explains that first rather than failing silently.

## Technical notes

- `supabase/functions/venture-brand-assets/index.ts`
  - `logo_select_direction`: after flipping `selected` on `brand_logo_directions`, rewrite `venture_brand_kits.logos` so the chosen direction's asset is `primary: true` (refreshing its signed URL to a 7-day link), demote the rest, and drop any prior uploaded primary.
  - New kind `logo_upload_own`: accepts a data URL + filename, uploads to `user-media` at `brand/<snapshotId>/logo-upload-<ts>.<ext>`, signs it, appends `{ kind: "upload", source: "upload", primary: true, url, path }` to `kit.logos`, clears `selected` on all directions in the run.
- `src/components/hub/brand-wizard/BrandWizard.tsx`: upload dropzone, "Select this mark" per card wired to the existing select mutation plus `brandKit` query invalidation, and the PRD panel (regenerate via `generateDocument({ snapshotId, documentType: "website_prd" })`, then read the row back with `listSnapshotDocuments` for copy/download).
- `src/components/hub/brand-wizard/LiveBrandPreview.tsx`: already renders `logos.find(l => l.primary)` — no change needed beyond the data now being written.
- No schema migration required: `brand_logo_directions.selected` and `venture_brand_kits.logos` already exist.
