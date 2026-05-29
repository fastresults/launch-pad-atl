## Goal

In the "What changes between 8:00 AM and 4:30 PM" section, replace the flat 21-bullet `walkOut` list with the 3-phase grouped content from the selected element (Phase 1 Foundation, Phase 2 Offer & build, Phase 3 Brand/marketing/launch).

## Changes — `src/routes/index.tsx`

**1. Inside the transformation section (lines ~427–500):**
- Delete the `walkOut` string array (lines 427–449).
- Replace the `<ul>` that maps `walkOut` (lines 486–495) with a vertical stack of the 3 phases from `WALKOUT_PHASES`, rendered inside the 4:30 PM card:
  - For each phase: small "Phase N" eyebrow, phase title, one-line intro, then the item list (name in bold + desc underneath, gradient bullet dot — same visual language already used in the AIToolkit card).
  - Spacing tuned for a single-column card (phases stack with a divider/space between them; items use the existing dot + name/desc pattern).
- Keep the card chrome, gradient backdrop, "4:30 PM" eyebrow, and "What you walk out with" headline exactly as-is.
- Keep the left "8:00 AM / What you walk in with" card untouched.
- Grid ratio stays `md:grid-cols-[1fr_1.4fr]` — the right card will simply be taller.

**2. Remove the now-duplicate `AIToolkit` section:**
- The selected element IS the `AIToolkit` section (lines 909–955). Once its content lives inside the 4:30 PM card, rendering it again below would duplicate every bullet on the page.
- Delete the `AIToolkit` function and its `<AIToolkit />` usage in the page composition. Keep the `WALKOUT_PHASES` constant + types — they're now the data source for the 4:30 PM card.

## Out of scope

- No changes to `walkIn`, the 8:00 AM card, `curriculum-data.ts`, `/schedule`, or any styling tokens.
- No copy edits to the phase items themselves — they render exactly as written in `WALKOUT_PHASES` today.
- No new headings, no reordering of other page sections.

## Open question

The current phase copy still contains a few of the quantified promises we softened last round ("25-name prospect list + outreach script", "10 personalized outreach drafts" in Phase 3). Should I also soften those to match the cleanup we did to the flat list, or leave the selected copy verbatim? Default if you don't answer: **leave verbatim** (you asked to replace with the selected content as-is).
