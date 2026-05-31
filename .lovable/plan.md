## Revise "BringYourCard" copy on free-cohort homepage

### Goal
Update the BringYourCard section on the free-cohort homepage (`HomeSelection.tsx`) to sound more respectful of founders' privacy and autonomy, and raise the incidental-expenses cap from $100 to $200.

### What changes

**1. Incidental cap constant**
- Change `INCIDENTALS_CAP` from `100` to `200` on line 25.

**2. Body copy rewrite (line 210–219)**
- Remove the "We just stand beside you while you click 'buy'" phrasing entirely — it feels intrusive.
- Replace it with copy that emphasizes: these are **your** direct expenses, not ours; you control when and what to spend; your privacy and ownership are respected. Keep the same warm, award-winning tone, the same structure (covered vs. not covered), and the same length.
- Ensure the inline `${INCIDENTALS_CAP}` reference renders the new $200 value.

**3. Chip label**
- The "Up to ~$100 total" chip on line 223 auto-updates with the constant change.

### What does NOT change
- Section placement, styling, card layout, chips, icons, or any other homepage sections.
- No backend, no data model, no other routes.

### Files touched
- `src/components/home/HomeSelection.tsx`