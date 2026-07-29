## Goal

"3 seats left" stays as the scarcity line and nothing else. Every descriptive line stops asserting group size ("three founders", "one table", "table of three", "cohort of fifty") and instead conveys an intimate, small-room setting.

## Changes — `src/components/landing/LandingFramework.tsx`

1. **Hero setting line (line 135)** — replace "No auditorium, no cohort of fifty, no pitch night. Three founders at one table for a single morning." with a size-free intimacy line, e.g. "No auditorium, no pitch night, no back row. A small room, a short table, and a single quiet morning."

2. **Offer card badge (line 238)** — unchanged: "Free launch offer · 3 seats left".

3. **Offer card headline (line 241)** — drop "at the table": "3 seats left."

4. **Offer card sub-line (line 251)** — replace "One table. Three founders. Nobody watching from the back." with intimacy without a count, e.g. "A small room. Your name known. Nobody watching from the back."

5. **Offer card paragraph (line 257, the selected element)** — remove "three founders, one table"; open with the setting instead: "It's a small room and an operator working through your business with you, out loud. You leave with the written foundation for a startup you can build on immediately — brand nailed, offer priced, marketing copy and website PRD written, operations mapped."

6. **Meta strip (line 323)** — "3 seats left · small room · free".

7. **Included list (line 419)** — replace "A seat at a table of three — you, two other Atlanta founders, and Adam..." with "A seat in a small room — you, a few other Atlanta founders, and Adam working through each business out loud, with coffee".

## Changes — `src/components/landing/LandingInterestModal.tsx`

8. **Line 104** — "One table, three seats, August 20…" becomes "3 seats left · August 20 in Atlanta — free. Tell us about you…" keeping the August 10 reply note.

## Notes

Copy-only, presentation layer. The hardcoded `seats: 3` value and all other logic stay as-is.
