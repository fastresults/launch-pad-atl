## Goal

Cut the "Not a course" body paragraph in `NotACourseBanner` (src/routes/index.tsx, line 72) by ~50% while preserving its ethos: not-a-course, built-in-the-room, real deliverables, honest about the few signature-only finish items.

## Current copy (98 words)

> Not a course. Not a coaching call. Not a 12-week cohort that ends in a PDF. In one focused day — seven hours, one room, one founder — you build the actual business: name, brand, website, offer, pricing, legal drafts, and a launch plan. You leave with real work in hand and a short, plain-English checklist for the few items only your signature can finish — LLC filing, bank account, license, and publishing the site. You arrive with a spark. You leave with a company that's built, not a notebook full of someday.

## Proposed copy (49 words, -50%)

> Not a course. Not a coaching call. Not a PDF. In one focused day, you build the actual business — name, brand, website, offer, pricing, legal drafts, and launch plan — plus a short checklist for the few items only your signature can finish. You arrive with a spark. You leave with a company.

### What's preserved
- The triple "Not a…" rejection of course/coaching/cohort formats
- The full deliverables list (name, brand, website, offer, pricing, legal, plan)
- Honest framing of the signature-only finish items (no overpromise)
- The closing "spark → company" turn

### What's trimmed
- "seven hours, one room, one founder" (already covered by the chips on the right)
- Explicit enumeration of finish items (LLC, bank, license, publish) — kept as a generic "few items only your signature can finish"
- "notebook full of someday" tail — tightened to "You leave with a company."

## Change

- src/routes/index.tsx line 72: replace the `<p>` body text only. No class, layout, or surrounding markup changes.