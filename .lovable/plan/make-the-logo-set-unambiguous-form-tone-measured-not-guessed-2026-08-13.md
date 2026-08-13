# Make the logo set unambiguous: form × tone, measured not guessed

## What's actually wrong (verified against the code and this venture's stored kit)

Your kit for the current venture holds three uploads, all tagged only by slot name:
`primary`, `reversed`, `icon`. Nothing stacked was ever recorded, even though a stacked
file was uploaded — and nothing in the system measures what the artwork *is*.

Four concrete defects:

1. **Slots are named by usage, not by form.** `primary` / `reversed` mix two different
   ideas: the *shape of the lockup* (symbol, horizontal, stacked) and the *tone* it's
   drawn for (colour vs inverse). A founder uploading "the stacked one" has to guess
   whether that's Primary, Stacked, or Wordmark.
2. **Multi-file "Upload set" reassigns files silently.** `guessSlot()` in
   `LogoSetPanel.tsx` reads filenames; on a collision it drops the file into "the next
   free slot" — an arbitrary slot, with no notice. That is the most likely path for a
   stacked upload landing somewhere else.
3. **Nothing validates geometry.** A tall stacked lockup dropped on Primary is then
   treated everywhere as the horizontal lockup, so the aspect-aware chooser
   (`variantOrder`, threshold 2.2) makes the wrong call with perfect confidence.
4. **Two colliding namespaces.** Uploads carry a top-level `variant`; the Logo Studio
   writes a `variants: { mark, horizontal, stacked, mono, knockout }` object. In
   `logo-ink.ts`, `norm()` maps upload-`primary` → `mark` — but studio-`mark` is the
   *symbol alone* while upload-`primary` is usually the *full horizontal lockup*. They
   end up in the same rank bucket, so the system genuinely cannot tell a symbol from a
   lockup.

## The fix: one vocabulary — form × tone

Every mark is described by two independent facts:

```text
form:  symbol | horizontal | stacked | wordmark
tone:  colour | inverse            (inverse = for dark grounds)
```

That's the whole model. "Primary" stops being a form; it becomes a flag on whichever
entry is the default. Six upload tiles become a 4×2 grid that reads at a glance:

```text
              colour        inverse
symbol        [ ]           [ ]
horizontal    [ ]           [ ]
stacked       [ ]           [ ]
wordmark      [ ]           [ ]
```

## Work

**1. Measure the artwork on upload (server, `venture-brand-assets`).**
Parse the uploaded SVG/raster viewBox to get its true aspect ratio and store
`form`, `tone`, `aspect`, `width`, `height` on the logo entry. Classify by measurement:
aspect ≥ 2.2 → horizontal, 0.75–2.2 → stacked, ≈1 with no wordmark glyph count → symbol.
If the measured form disagrees with the slot the founder chose, **save it to the measured
slot and tell them** in the success toast ("That's a stacked lockup — filed under
Stacked"). No silent reassignment, no wrong-slot storage.

**2. Migrate existing entries.** Backfill `form`/`tone` for stored uploads and for the
Logo Studio `variants` object (`mark`→symbol/colour, `horizontal`→horizontal/colour,
`stacked`→stacked/colour, `knockout`→symbol/inverse, `mono`→symbol/colour). Keep the old
`variant` strings written for backwards compatibility so nothing in flight breaks.

**3. Rank on form and tone, not slot names (`_shared/logo-ink.ts`).**
Rewrite `variantOrder`/`logoCandidates` to score candidates as
`formFit(boxAspect) + toneFit(surface)`, using the stored measurement when present and
falling back to today's name-based order when it isn't. This removes the symbol-vs-
horizontal collision outright.

**4. Rebuild the panel around the grid (`LogoSetPanel.tsx`).**
- Render the 4×2 form × tone grid with real labels and a one-line "what this is for".
- Each tile shows the measured aspect and a "colour / inverse" chip, so a file in the
  wrong place is visible immediately.
- Multi-file upload becomes a **review step**: files are classified by measurement (not
  filename), shown in a small assignment list, and the founder can move any of them
  before anything is saved. No arbitrary "next free slot".
- Keep the three big preview tiles (light / dark / brand) unchanged above the grid.

**5. Consumers pass their box.** Confirm the compositors already forward `boxAspect`
(`collateral-svg.ts`, `logo-compositor.ts`, `brand-logo-bitmap.ts`, `brand-logo`) and
extend `brand-logo` to accept `form=` alongside the existing `lockup=` parameter.

## Verification

- Upload the stacked Friendship House file to the wrong tile on purpose and confirm it is
  filed as Stacked with a message saying so.
- Query the kit and confirm each entry carries `form`, `tone`, and `aspect`.
- Regenerate one business card (narrow mark box) and one social cover (wide) and confirm
  the stacked lockup is picked for the first and the horizontal for the second.

## Technical notes

Files: `supabase/functions/venture-brand-assets/index.ts` (upload classify + backfill),
`supabase/functions/_shared/logo-ink.ts` (form/tone scoring), `brand-logo/index.ts`,
`src/components/hub/brand/LogoSetPanel.tsx`. One data migration over
`venture_brand_kits.logos`. Edge functions redeployed after the change.
