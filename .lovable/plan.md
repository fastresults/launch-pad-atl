## Why it skipped

Step 4 already has the reference-logo dropzone, but it sits *below* the "Generate 4 logo concepts" button with no gating. So the Generate button is always live and the dropzone reads as decorative/optional ("optional, up to 3"). Nothing forces the user to upload inspirations or even look at them first.

## Fix — make logo inspirations a required micro-step

Restructure Step 4 ("Moodboard & Logo") into a clear 3-stage flow inside the same step. The user cannot generate logos until they either upload 1–3 reference logos OR explicitly opt out.

### 1. Reorder the sections

New order top → bottom:
1. **Moodboard** (unchanged)
2. **Reference logos** — promoted to required gateway, no longer "optional"
3. **Logo concepts** — gated; Generate button disabled until gateway passes

### 2. Reference Logos becomes a gateway

- Headline: "Drop your 3 logo inspirations" (was "Reference logos (optional)")
- Subcopy: "Show us 1–3 logos you admire. We'll study their composition, weight, and abstraction — never copy them — to ground your concepts. This step is required so your logos don't look generic."
- Larger, more prominent dropzone (full-width dashed panel, not 80×80 chips) with clear "Drag & drop or click to upload up to 3 images" affordance.
- Thumbnails appear inline as uploaded; each with remove button.
- Below the dropzone: a small "Skip — generate without references" link that, when clicked, sets a `_logoRefSkipped: true` flag on `kit.dna` and unlocks the Generate button. This preserves user agency without making the step a wall.

### 3. Gate the Generate button

`Generate 4 logo concepts` is disabled when:
- `refs.length === 0` AND `kit.dna._logoRefSkipped !== true`

When disabled, show helper text under the button: *"Upload at least one inspiration above, or choose Skip, to unlock."*

### 4. Pull context into the prompt (already wired, verify)

`genLogos` already passes `referenceImages: refs` to `venture-brand-assets`, and that function already loads full venture context via `loadVentureContext`. Confirm both still hold; no edge-function changes needed unless verification shows otherwise.

### 5. Live preview

`LiveBrandPreview` right pane: add a small "Inspirations" row showing the uploaded reference thumbnails so the user sees their picks reflected immediately.

## Files touched

- `src/components/hub/brand-wizard/BrandWizard.tsx` — reorder sections in `StepMoodboard`, promote dropzone, add gating + Skip link, helper text.
- `src/components/hub/brand-wizard/LiveBrandPreview.tsx` — add Inspirations row when `kit.dna._logoReferences` has entries.

No DB or edge-function changes.
