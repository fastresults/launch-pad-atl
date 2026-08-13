# Accommodate the real Friendship House logo files

Five files were supplied. I measured each one, and three of them would land in the wrong
place under today's classifier:

| File | Box | Ink | What it actually is | Where it lands today |
| --- | --- | --- | --- | --- |
| `tfh-color-horizontal.svg` | 5.83:1 | bleu + rouge | Horizontal · Colour | correct |
| `tfh-color-stacked.svg` | 0.93:1 | bleu + rouge | Stacked · Colour | **Symbol · Colour** (too tall for the stacked band) |
| `tfh-bw-horizontal.svg` | 5.83:1 | near-white | Horizontal · **Inverse** | Horizontal · Colour ("bw" isn't a tone hint) |
| `tfh-bw-stacked.svg` | 0.93:1 | near-white | Stacked · **Inverse** | **Symbol · Colour** (both axes wrong) |
| `tfh-symbol.svg` | 1.06:1 | near-white | Symbol · **Inverse** | Symbol · Colour |

Two root causes, both fixable by measuring instead of guessing.

## 1. Form: count the ink, don't only measure the box

A stacked lockup and a bare symbol can share a near-square box — geometry alone cannot
separate them, which is why the 1.15 threshold misfiles this stacked mark. But the two are
trivially separable by ink: the symbol file has 3 drawn shapes; every lockup file has 21
(3 for the mark, 18 for the letters).

New rule, applied in both the browser panel and the upload function:

```text
shapes < 8            -> symbol            (no wordmark present)
shapes >= 8, a >= 2.2 -> horizontal
shapes >= 8, a <  2.2 -> stacked
mark-less artwork     -> wordmark
```

Aspect only splits horizontal from stacked once a wordmark is known to be present, so a
0.93:1 stacked lockup is no longer mistaken for a symbol. For rasters, where shapes can't be
counted, the current aspect bands stay as the fallback and the tile says the form was
inferred so the founder can correct it.

## 2. Tone: read the fills, don't read the filename

Tone is decided today by filename keywords (`reversed`, `dark`, `white`). "bw" matches none
of them, so three inverse files are filed as colour and would be painted white-on-white.

Tone becomes a measurement: parse the fill colours in the SVG, take the mean luminance of
the ink, and call anything above ~0.75 an inverse mark (drawn light, for dark grounds).
Filename hints stay, but only break ties when the fills are inconclusive (mid-tone or
raster). The three light files are then correctly inverse.

## 3. Honest gaps instead of silent fallbacks

This set has no colour symbol and no wordmark. Rather than quietly serving the inverse
symbol on a light card, the grid marks those two cells "Not supplied", and any placement
that wants them falls back explicitly (colour symbol -> colour stacked; wordmark ->
horizontal) with the substitution recorded on the logo verdict header.

Offered, not automatic: a one-click "Derive colour symbol" that recolours the inverse
symbol's near-white fills to bleu `#0055A4` and rouge `#EF4135` following the existing art
direction, shown as a preview to accept or reject.

## 4. File this set

Once the classifier is fixed, install all five into the Friendship House kit in their
measured slots, then regenerate one business card (tall mark box) and one social cover
(wide) to confirm the stacked lockup is chosen for the first and the horizontal for the
second, each in the tone matching its ground.

## Technical notes

- `supabase/functions/_shared/logo-form.ts`: add `countShapes()` and `inkTone()`; rewrite
  `formFromAspect` into `classifyArtwork(bytes, contentType, hint)` returning form, tone,
  aspect and a confidence flag. `reconcileSlot` gains a tone correction alongside the
  existing form correction, and keeps reporting what it moved.
- `supabase/functions/venture-brand-assets/index.ts`: use the new classifier on upload;
  store `form`, `tone`, `aspect`, `shapes`, `inferred` on each entry.
- `supabase/functions/_shared/logo-ink.ts`: when the requested form/tone cell is empty, use
  the declared fallback order above and set the substitution in the response header.
- `src/components/hub/brand/LogoSetPanel.tsx`: mirror the classifier for the client-side
  multi-file review list; render "Not supplied" cells and the derive-colour-symbol action.
- Redeploy `venture-brand-assets`, `brand-logo`, `venture-collateral`,
  `venture-social-cover`, `venture-content-ad`, `venture-style-preview`.
