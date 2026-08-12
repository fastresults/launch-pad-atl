# One-page IGNITE Flyer — Free Startup Build Session

## Goal
Create a print-ready US Letter (8.5 × 11 in) leave-behind flyer for the IGNITE Center entrance that promotes a free 1-hour startup build session with Startup Labs. Tone = award-winning conversion copywriter for event promos: warm, direct, founder-pain-first, artifact-focused.

## Copy direction

**Offer:** 1-hour free startup build session, in person at IGNITE, for IGNITE members/fellow founders.

**CTA destination:** `offer.startuplabs.online`

**Copy hierarchy:**
1. Hook — name the founder pain (idea stuck, not launched, Plan B on pause).
2. What it is — one hour, one-on-one, actually build something real.
3. What they walk out with — a concrete artifact or next step (not a plan/document).
4. Social proof / urgency — limited slots, free, for IGNITE founders only.
5. CTA — scan or visit `offer.startuplabs.online` to book.

**Draft copy (to refine in implementation):**
- Kicker: `Free · 1 hour · IGNITE members only`
- Headline: `Your startup idea is closer than you think.`
- Subhead: `Spend one hour with the Startup Labs team at IGNITE. We'll build the first real piece of your startup together — a priced offer, a live page, or your first outreach message. You bring the idea; we bring the process.`
- Bullets: `No pitch · No homework · Nothing to prepare`
- CTA: `Book your free session` → `offer.startuplabs.online`
- Footer: `Limited slots each week · first come, first served`

## Design approach

**Format:** US Letter vertical, 8.5 × 11 in, 300 DPI, print-ready.

**Brand system:** Use existing Startup Labs brand: dark hero surface, serif display type, gold/primary accent, clean sans-serif body. Pull the logo from `public/startuplabs-logo.svg` / `src/assets/startuplabs-logo.svg`.

**Layout:**
- Top: Startup Labs logo + kicker pill.
- Middle: Large headline + subhead on a dark gradient background.
- Visual accent: small editorial/coffee-scene photo or brand pattern to keep it human and warm.
- Bottom third: CTA card with URL, QR code, and booking details.
- Footer: micro-copy and constraints (free, limited, IGNITE-only).

**Outputs:**
- High-resolution PDF (print-ready, CMYK-friendly colors if possible, or RGB with note to print).
- PNG preview for quick sharing.
- Optional: source file (HTML/CSS or SVG) if user wants to edit later.

## Technical plan

1. Generate the flyer as a single artifact using Python/reportlab or HTML+CSS+Puppetter, with brand assets embedded.
2. Use a QR code library to generate a scannable code for `offer.startuplabs.online`.
3. Verify the output visually: no clipping, safe margins, readable type, QR code scannable.
4. Save final PDF/PNG to `/mnt/documents` so it is downloadable.

## Open question

`offer.startuplabs.online` is not currently a project route. If the user wants this URL to be a real landing/booking page (not just printed on the flyer), we should build a simple conversion page as a follow-up. For this flyer, the URL will be treated as the printed CTA only.
