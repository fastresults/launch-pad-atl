
## What I found (root cause)

For snapshot `e09c2094…` the row in `venture_brand_kits` has `logos: []` and `dna._logoReferences: null`. The social-cover generator's `fetchPrimaryLogo()` in `supabase/functions/venture-social-cover/index.ts` (L89–110) returns `{ dataUrl: null, bytes: null }` whenever:

- `kit.logos` is empty, **or**
- the primary entry has no `path`/`storage_path`, **or**
- the file is `> 4 MB`, **or**
- the mime is `image/svg+xml` (SVGs are explicitly rejected — `imagescript` can't decode them).

When that happens the generator still runs the Gemini prompt (which only *asks* for a reserved logo zone) and skips the deterministic `compositeLogo()` step at L494. That's why the QA-passed image the user is looking at has a clean negative-space block on the left but no brand mark inside it.

Two separate upload paths in the Brand Wizard also confuse this:

1. `ExistingBrandIntake` → `extract-existing` → **persists to `kit.logos`** ✅ (composite works)
2. Wizard "logo directions" step → uploaded files are stored as **`kit.dna._logoReferences`** (inspiration only, never composited) ❌
3. If the user pasted an SVG anywhere, it's silently dropped by the fetch step.

So "the user input a logo" is almost certainly path #2 or an SVG upload — neither ever reaches the compositor.

## Plan

### 1. Backend — stop failing silently
`supabase/functions/venture-social-cover/index.ts`

- In `fetchPrimaryLogo`, log the exact reason for skipping (`no_logos`, `no_path`, `too_large`, `svg_unsupported`, `download_failed`) instead of returning bare nulls.
- Return that reason to the caller and stamp it on the asset's `qa_notes` (e.g. `logo_skipped: "svg_unsupported"`) alongside the existing `logo_composited: false` flag at L507.
- No behavior change to the image itself — only observability.

### 2. Backend — accept SVG logos
Rasterize SVG to PNG once before the pipeline runs (use `resvg-js` via `esm.sh` in the edge runtime, same pattern as `palette-tile.ts`'s pngjs import), then feed the PNG bytes through the existing compositor. Falls back to the current skip-and-log if rasterization fails.

### 3. Frontend — surface the missing-logo state on the asset detail
`src/components/hub/` (the drawer shown in the screenshot — the file that renders "Palette / Model / Headline on image / Logo size on image").

- Read the new `qa_notes.logo_skipped` / `qa.logo_composited` fields already returned by `listSocialAssets`.
- When `logo_composited === false`, render an inline amber warning row directly under **"Logo size on image"**:
  > "No primary brand logo on this kit — image was generated without your mark. **Add a logo →** (links to Brand Studio › Logo)."
- When `logo_skipped === "svg_unsupported"` (until step 2 ships), show the same warning with copy: "SVG logos aren't supported yet — upload a PNG or JPG."

### 4. Frontend — gate the Generate button
`src/components/hub/` social-cover generate action.

- Before calling `generateSocialCover`, check `kit.logos?.length`. If zero, show a confirm dialog: "You haven't added a primary brand logo. Generate anyway (image will ship without your mark), or add a logo first?" with two buttons: **Add logo** (routes to Brand Studio) / **Generate anyway**.
- Preserves the current path for users who intentionally want logo-less art.

### 5. Frontend — clarify the wizard upload
`src/components/hub/brand-wizard/BrandWizard.tsx` around L680–762 (the "logo directions" step).

- Rename the helper text from "Show us 1–3 logos you admire" to "**Inspiration only** — these guide AI logo *generation*. To use your own existing logo on social covers, upload it in the Existing Brand step or Brand Studio › Logo."
- Adds no new persistence — just kills the ambiguity that lets users think their reference logos will be composited.

## Files touched

- `supabase/functions/venture-social-cover/index.ts` (logging + qa_notes)
- `supabase/functions/venture-social-cover/index.ts` + new `supabase/functions/_shared/svg-rasterize.ts` (SVG support)
- Social cover drawer component in `src/components/hub/` (warning row + generate gate)
- `src/components/hub/brand-wizard/BrandWizard.tsx` (helper copy)

## Out of scope

- No changes to `compositeLogo`, `canvas-plan`, prompt assembly, or the Gemini call itself.
- No schema migration — `qa_notes` is already a jsonb column.
- No retroactive re-generation of past assets.
