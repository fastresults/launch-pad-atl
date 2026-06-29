## Goal
Give the Brand Wizard two entry tracks at Step 1:

- **Track A — "I already have a brand"** (new): user drops their logo file(s) and pastes their live website URL. We scrape the site with Firecrawl + extract colors/typography/voice from the logo and site, propose a derived palette/typography/voice for confirmation, then jump straight to Step 5 (Review) and generate the style guide.
- **Track B — "Build a brand from scratch"** (existing flow): unchanged — DNA → palette → typography → moodboard/logo → review.

## Why
Many workshop users (especially Main Street / e-commerce) already operate under a brand. Forcing them through the generative wizard discards their real identity and produces a Website PRD that doesn't match their live site. Track A makes the Brand Kit reflect what already exists so downstream deliverables (Website PRD, Social Kit) stay on-brand.

## UX

### Step 1 becomes a track picker
File: `src/components/hub/brand-wizard/BrandWizard.tsx` (and a new `Step1TrackPicker.tsx`).

Two large cards:
1. **"I already have a brand"** — "Upload your logo + paste your website. We'll extract your colors, fonts, and voice."
2. **"Help me build one"** — current DNA flow.

Selection is persisted on `venture_brand_kits.dna.track = 'existing' | 'new'` so users can resume.

### Track A wizard steps
1. **Upload & URL** (new `ExistingBrandIntake.tsx`)
   - Logo dropzone (PNG/SVG/JPG, up to 4 files: primary, mark, wordmark, alt). Uploaded to `venture-doc-images` bucket via existing signed-URL helper. Persisted on `kit.logos[]` with a `source: 'uploaded'` flag.
   - Website URL input (validated, optional but encouraged).
   - Optional "About / voice notes" textarea.
   - CTA: **Analyze my brand** → calls new edge action `extract-existing`.
2. **Review extracted brand** (new `ExtractedBrandReview.tsx`)
   - Shows derived palette (swatches + hex), typography pairing, voice bullets, and a moodboard built from the site's hero/OG image.
   - Each section has an **Edit** button that drops the user into the existing palette / typography / voice pickers pre-seeded with the extracted values (so they can override anything).
3. **Review & Lock** → reuses existing Step 5 (`VisualBrandGuide` preview + Generate Style Guide + Save to My Files).

Skip Steps 2–4 of the generative flow entirely for Track A unless the user clicks Edit on a section.

### Reset & switch tracks
Existing `resetBrandKit` already wipes the row. Add a "Switch track" link on Step 1 of either flow that calls reset after confirmation.

## Backend

### New edge action: `venture-brand-wizard` → `action: 'extract-existing'`
File: `supabase/functions/venture-brand-wizard/index.ts`.

Input: `{ snapshotId, websiteUrl?, logoPaths: string[], voiceNotes?: string }`.

Pipeline:
1. **Scrape site with Firecrawl** (already linked connector; key is `FIRECRAWL_API_KEY`). Use `formats: ['markdown','branding','screenshot','summary']` on the homepage and (best-effort) `/about`. The `branding` format returns colors, fonts, logo, OG image — that's the primary source of truth.
2. **Logo color extraction**: download each uploaded logo via signed URL, run a Deno-side quantizer (small `npm:get-image-colors` or a hand-rolled k-means on a downsampled PNG) to pull 4–6 dominant non-background colors. Reconcile with Firecrawl branding palette (prefer logo for primary/secondary, site for neutrals/accents).
3. **Typography reconciliation**: take Firecrawl branding `fonts[]` / `typography.fontFamilies`. Map to nearest Google Font (lookup table + fuzzy match); if none, fall back to the closest pairing from the existing typography generator and flag `auto_mapped: true`.
4. **Voice synthesis**: feed scraped markdown summary + voice notes to Gemini (`google/gemini-2.5-flash`, JSON) to produce 3–5 voice bullets, tone words, and do/don't pairs — same shape as the existing voice step.
5. **Moodboard**: store the site screenshot + OG image + extracted logo URLs as moodboard entries.
6. **Persist** to `venture_brand_kits`:
   - `dna = { track: 'existing', source_url, voice_notes }`
   - `palette = { name: 'Extracted from <domain>', colors: {...}, rationale, source: 'extracted' }`
   - `typography = { heading, body, source: 'extracted', auto_mapped }`
   - `voice = { bullets, tone, dos, donts, source: 'extracted' }`
   - `moodboard = [...]`, `logos = [...uploaded with primary flag]`
   - `step = 5`, `status = 'draft'` (user still has to lock via Generate Style Guide).
7. Return the full kit so the UI hydrates Step 2 (Extracted review) immediately.

### Style-guide prompt awareness
File: `supabase/functions/venture-brand-wizard/index.ts` `generateGuide()`.
- When `kit.dna.track === 'existing'`, prepend an instruction: *"This brand already exists. Treat the palette, typography, logo, and voice as ground truth — describe and codify them, do not propose replacements. Reference the source URL where relevant."*
- Skip the "personality spectrum" speculation section in favor of an "Existing brand audit" section noting what was extracted vs. inferred.

### Website PRD gate stays
The existing brand-kit gate on `website_prd` already covers both tracks (a locked kit is a locked kit regardless of origin). No change there — Track A users still must hit "Generate Style Guide" which sets `status='locked'`.

## Data
No schema migration needed:
- `venture_brand_kits.dna` (jsonb) holds `track`, `source_url`, `voice_notes`.
- `logos[]` already supports arbitrary entries; add `source: 'uploaded' | 'generated'` and `primary: boolean`.
- `palette/typography/voice` already jsonb — add a `source` discriminator.

## Files

New:
- `src/components/hub/brand-wizard/Step1TrackPicker.tsx`
- `src/components/hub/brand-wizard/ExistingBrandIntake.tsx`
- `src/components/hub/brand-wizard/ExtractedBrandReview.tsx`

Edited:
- `src/components/hub/brand-wizard/BrandWizard.tsx` — branch on `kit.dna.track`; route Track A through the 3-step path, Track B through current 5-step path.
- `src/lib/brandKit.functions.ts` — add `extractExistingBrand(snapshotId, payload)` wrapping the new edge action.
- `supabase/functions/venture-brand-wizard/index.ts` — add `extract-existing` action, Firecrawl call, logo color extraction, voice synthesis, persistence; tweak `generateGuide()` for existing-brand mode.
- `supabase/functions/_shared/venture-context.ts` — extend `brandKitBlock` to include `track` + `source_url` so downstream deliverables know the brand is real, not generated.

## Verification
1. Track A: upload PNG logo + paste a live URL → extracted palette/typography/voice appears within ~15s; user can edit any section; Generate Style Guide produces a locked kit; Website PRD unlocks and references the extracted hex/fonts verbatim.
2. Track A with no URL (logo only): still produces a palette from the logo, typography falls back with `auto_mapped` badge shown in the review step.
3. Track B: unchanged 5-step flow still works end-to-end.
4. Reset → switch tracks → re-run: prior kit fully cleared, no leakage between tracks.
5. Firecrawl 402/insufficient credits: surfaces a clear error in the intake step with a retry; logo-only fallback still works.

## Out of scope
- Auto-detecting which track to suggest from the snapshot (could be a follow-up: if `brief` mentions an existing site, default the picker to Track A).
- Reverse-engineering full component styles (buttons, radii). Step 1 — palette/typography/voice/logo only.
