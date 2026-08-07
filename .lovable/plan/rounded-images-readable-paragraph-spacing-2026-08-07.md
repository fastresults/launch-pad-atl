# Rounded images + readable paragraph spacing

Two polish fixes applied to both the public share showcase and the in-app hub viewers.

## 1. Every image gets rounded edges

Today rounding lives on the *container* (`overflow-hidden rounded-xl`), but the images are `object-contain`, so the artwork sits inside a larger box and its own white edges stay square — exactly what the screenshot shows.

Fix: put the radius on the image element itself and let the frame hug it.

- `src/components/share/ShareSection.tsx`
  - Hero image: `rounded-xl` on the `<img>`, frame becomes a padded, centered wrapper so the rounded artwork reads as a card rather than a white rectangle inside a dark rectangle.
  - Gallery thumbnails: `rounded-lg` on each `<img>` in addition to the card.
  - Lightbox image: `rounded-xl`.
- `src/routes/v.$token.tsx` — venture logo in the header keeps `rounded-lg` (already correct); confirm the same treatment.
- `src/components/hub/DocumentViewer.tsx` — markdown `<img>` and the asset gallery images get `rounded-xl` on the image element.
- `src/components/hub/brand/CollateralPieceCard.tsx` and `CollateralPreviewDialog.tsx` — preview and thumbnail images get `rounded-lg` / `rounded-xl` on the `<img>` (currently `rounded` or none).
- `src/components/hub/social/AssetImage.tsx` — accept and pass through a default rounded class so every social asset preview inherits it.

## 2. More space between paragraphs

Two causes, both handled:

- **Spacing.** Prose blocks currently use only default margins. Add explicit `prose-p:mb-6 prose-p:leading-[1.8]`, plus roomier heading margins (`prose-headings:mt-10 prose-headings:mb-3`) and list spacing in `ShareSection.tsx`, matched in `DocumentViewer.tsx`'s markdown styles.
- **Missing paragraph breaks.** Generated bodies often use single newlines, which markdown collapses into one run-on block (visible in "Your one-page story"). Add a small normalizer that converts single newlines between sentence-like lines into blank lines before rendering, so each paragraph becomes its own `<p>`. Short lines that look like headings are left alone.

## Technical notes

- Normalizer lives in `src/lib/venture-share.functions.ts` (shared by share view) or a tiny `src/lib/markdown-normalize.ts` used by both `ShareSection` and `DocumentViewer` — no backend or data changes.
- Purely presentational; no edge function, schema, or payload changes.
- Verify by loading a live share token locally and screenshotting the one-page story and a gallery section.
