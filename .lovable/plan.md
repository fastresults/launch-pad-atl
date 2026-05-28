## Goal
Remove every "on paper" / "real business on paper" phrasing from the site copy. Replace with "formation-ready" language ("business formed and filing-ready", "filing-ready formation packet", etc.) that conveys a real, file-ready LLC — not a paper exercise.

## Scope
Copy-only edits. No layout, components, tokens, or data shape changes.

## Edits

**`src/routes/index.tsx`**
- Line 26 (head description): "…seven stages, one real business by dinner." → "…seven stages, one filing-ready business by dinner."
- Line 77 (hero sub): "you'll have a real business on paper, a simple way to deliver it," → "you'll have a business formed and filing-ready, a simple way to deliver it,"
- Line 246 (Form stage deliverable): "Your business, legally on paper." → "Your business, formed and filing-ready."
- Line 355 (proof bullet): "A real business on paper — name, structure, EIN in hand, Georgia LLC packet ready to file" → "A formation-ready business — name, structure, EIN in hand, Georgia LLC packet ready to file"
- Line 525 (stat label): "real business formed" → "filing-ready business" (keeps "1" stat intact)

**`src/routes/schedule.tsx`**
- Line 52: "you have a real business and a signed," → "you have a filing-ready business and a signed,"

## Verification
`rg -i "on paper|real business" src/` returns no matches. Reload `/` and `/schedule` and spot-check hero, Form stage card, proof list, stat strip, and schedule closing paragraph.
