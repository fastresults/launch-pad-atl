# Fortune-100 Brand Collateral: Art Direction Overhaul

## What's wrong today

Every collateral piece is drawn by one hardcoded SVG function per kind (`_shared/collateral-svg.ts`). That means:

- **No art direction.** Every brand — a law firm, a bakery, a robotics startup — gets the identical business card: solid primary front, left rule on the back. There is one look, and it isn't chosen for the brand.
- **Text is guessed, not measured.** `wrapText` estimates glyph width at `size * 0.52`, so lines break in the wrong place and long names, titles and taglines overrun their boxes.
- **Layout is magic numbers.** Positions are hand-typed pixel constants (`M + 560`, `rowsY + 470`). Nothing is on a shared grid, so optical alignment across pieces drifts.
- **No material.** Flat fills only — no paper tone, no ink density, no debossed mark, no photography, no texture, no realistic mock-up. It reads as a wireframe, not a brand asset.
- **Filler copy is generic.** "Point headline", "Section title", "Body copy sits here" — a Fortune 100 deck template is filled with the brand's real proof.

## The recommendation

Introduce a **Brand Art Direction layer** that is decided once per venture, saved, and then obeyed by every deterministic compositor. AI does the *directing*; code does the *drafting*. This is the same split that already works for the editorial poster system.

### 1. Art Direction Record (new, saved to the venture)

An AI creative-director pass reads the brand kit (logo geometry, palette, type, voice, category, audience) and returns a locked spec:

- **Archetype** — one of five house styles: `swiss-editorial`, `luxury-serif`, `modern-corporate`, `warm-craft`, `technical-precision`. Each has its own grid, rule weights, radius, tracking and rhythm.
- **Grid** — column count, gutter, baseline unit, margin ratio. All pieces derive positions from this, not constants.
- **Type scale** — a real modular scale (ratio + steps) with per-role assignments and tracking rules.
- **Ink strategy** — which surfaces are inverted, where the mark is knocked out, accent usage budget (e.g. accent touches ≤ 10% of a page).
- **Material** — paper tone, edge treatment, rule/hairline weight, optional emboss/foil suggestion for the mark.
- **Motifs** — one or two repeatable graphic devices derived from the logo's geometry (a rule cap, a corner notch, a dot grid) used sparingly across the set for family resemblance.

Stored on the venture so the whole kit, and future regenerations, stay consistent.

### 2. Real text metrics

Replace the estimated wrap with true advance-width measurement from the loaded TTF (the font bytes are already fetched for the rasteriser). Every text block gets: measure → wrap → fit-to-box → optional tracking/size step-down. No more overrun or bad breaks. Same fix pattern already used for poster headlines.

### 3. Grid-driven compositors

Rewrite each template to lay out against the Art Direction grid rather than pixel constants: business card, letterhead, envelope, notecard, signature, invoice, proposal, presentation, guidelines. Same page list, radically better craft — proper optical margins, aligned baselines, consistent rule weights, correct clear-space around the mark, deliberate negative space.

### 4. Material and realism

- Subtle paper tone + micro-noise on light surfaces; ink-density variance on solids.
- Mark placement gets real clear-space math from the logo's own bounding box.
- Add a **mock-up render** per piece (card on a surface with soft shadow, letterhead at an angle, deck on a screen) as the thumbnail, with the flat print-ready SVG/PNG still downloadable. This is what makes the library *look* like agency output at a glance.

### 5. Real content, not lorem

A short AI copy pass fills templates with the venture's actual positioning: deck section titles and proof points, proposal scope lines, guidelines voice do/don't drawn from the brand voice, notecard line. Filler disappears.

### 6. Review gate

A vision QA pass scores each rendered page on contrast, crowding, alignment, mark clear-space and hierarchy; anything below the bar is re-rendered once with the specific defect corrected — mirroring the poster QA gate already in place.

### 7. Text audit + user verification (run before anything renders)

No amount of art direction saves a card with a missing phone number or a placeholder website. Today contact details are silently pulled from the founder profile (`profile.phone`, `city, state`, etc.) and whatever is blank just disappears from the layout — so the piece renders "successfully" while being unusable.

**Audit pass.** Before generating, the function assembles the full text inventory the kit needs and grades each field: present / missing / suspect (e.g. a placeholder domain, an unformatted phone, a personal gmail on a business card, ALL-CAPS or lowercase company name, a tagline over the character budget).

Fields audited:

| Field | Used by |
| --- | --- |
| Legal / display company name | every piece |
| Tagline (≤ 60 chars) | card, letterhead, notecard, deck cover, guidelines |
| Person name | card, signature, letterhead, proposal |
| Job title | card, signature |
| Email (business domain preferred) | card, letterhead, envelope, signature, invoice, proposal |
| Phone (E.164 + display format) | card, letterhead, signature, invoice |
| Website / domain | every piece |
| Street address, city, state, ZIP | card back, letterhead footer, envelope return, invoice |
| Social handles (optional) | card back, signature |
| Legal entity line + EIN (optional) | invoice, proposal |
| Payment terms / remit-to | invoice |
| Brand voice sentence | guidelines |

**Verification screen.** A "Confirm your details" step in Brand Studio shows every field in one form, pre-filled from the venture and founder profile, with the audit flags inline ("no phone — the card will render without one", "website looks like a placeholder"). The user edits and confirms once; answers are saved to the venture so the whole kit and every future regeneration use the same verified set. Normalisation happens on save: phone formatting, URL stripped to display form (`acme.com`), address cased and abbreviated to postal standard, name title-cased.

**Gate.** Generation is blocked until the required fields for the selected pieces are confirmed — with a clear list of what's missing and which pieces need it. Optional fields can be explicitly skipped, and layouts adapt (a card without an address gets a rebalanced back, not a hole). Once confirmed, a "Details verified" chip with an edit link sits at the top of the collateral library, and changing any field marks affected pieces stale so the user knows to regenerate.


## Technical notes

New files:
- `supabase/functions/_shared/brand-art-direction.ts` — the AI director prompt, the archetype definitions, grid/scale math, and the saved record type.
- `supabase/functions/_shared/text-metrics.ts` — TTF advance-width measurement, wrap, and fit-to-box.
- `supabase/functions/_shared/collateral-mockup.ts` — surface/shadow mock-up compositor for thumbnails.
- `src/lib/brand/collateral-fields.ts` — the field inventory, per-piece requirements, validators and normalisers (shared shape with the edge function).
- `src/components/hub/brand/CollateralDetailsDialog.tsx` — the "Confirm your details" verification form.

Changed:
- `_shared/collateral-svg.ts` — templates take `(ctx, ad, css)` and lay out on the grid; `wrapText`/`paragraph` swap to measured text; layouts adapt when an optional field is skipped.
- `venture-collateral/index.ts` — run the field audit and block on missing required fields; resolve-or-create the art direction record; run the copy pass; store mock-up + flat variants; run the QA gate.
- Migration: add art direction JSON and a verified-contact-details JSON (with a verified-at stamp) to the venture brand row; add mockup path column to `venture_brand_collateral`.
- `BrandCollateral.tsx` / `CollateralPreviewDialog.tsx` — "Details verified" chip with edit link, stale badges when details change, mock-up thumbnails, and "Re-direct" (new art direction) separate from "Regenerate" (same direction, fresh render).

## Order of work

1. Field inventory, validators, verification dialog, and the generation gate.
2. Art direction record + archetypes + text metrics.
3. Rewrite the four highest-visibility pieces on the grid: business card, letterhead, presentation, guidelines.
4. Remaining pieces: envelope, notecard, signature, invoice, proposal.
5. Material pass + mock-up thumbnails.
6. Real-copy pass + QA gate + UI controls.
