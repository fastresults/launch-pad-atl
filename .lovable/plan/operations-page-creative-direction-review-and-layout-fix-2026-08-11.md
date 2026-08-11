# Operations page — creative direction review and layout fix

I captured the page as it renders right now (agency hub, CarveWorks) and reviewed it as a
creative director before proposing anything. Findings first, then the fix.

## What's actually wrong

**1. The first screen has no artwork at all.**
The delivery-mode gate is the first thing anyone sees, and it is 3,045px of pure text —
three stacked slabs with identical corner radius, identical border, identical left
alignment. The art system built last round (stage banners, category marks, progress ring)
lives *behind* the gate, so the highest-stakes screen in the product is the only one with
no visual language on it.

**2. The stage art that does exist is invisible.**
It renders at 6–8% opacity behind the dashboard header. At that value it reads as noise,
not art direction. And the header now shows a progress ring *and* a progress bar directly
under it — the same number twice.

**3. Heavy Lifting: the comparison structure breaks after row one.**
The "You carry it from here / We carry it from here" column headers appear once, above
eight rows. By the third row the reader has lost which side is which. The right side sits
in a tinted bordered box; the left side is bare text with no container — so the two halves
of a *comparison* don't read as comparable. Left text top-aligns against a taller right
box, leaving 60–90px of dead space in most rows (worst on Campaign and Funnel).

**4. The eight moves are in the wrong order.**
They're sorted by hours descending, so it opens on Campaign and puts Entity third. The
narrative order is the runway order: Entity → Books → Offer → CRM → Funnel → Site → Brand
→ Campaign. Right now the block argues from the least urgent move.

**5. The category marks are too small to anchor anything.**
36px plates next to an 18px bold title read as bullets. They need to either lead the row
properly or step back — at this size they do neither.

**6. The strongest number on the page is styled as plain text.**
"133 steps / 156 hours / 92 hours specialist" is the whole argument, sitting in three flat
boxes. 92 of 156 hours being specialist work is a proportion, and it's never shown as one.

**7. At 1386px, ~200px of gutter goes unused and nothing is sticky.**
One centered column, 3,045px tall, with the venture name, the runway/sign-off tabs and the
read-only control all scrolling away at the top.

**8. The tabs are easy to miss.**
"Operating runway / Creative sign-off" are small pills floating under the H1, detached
from both the title and the content they switch.

## The fix

### A. Give the gate a first screen
- Add a wide stage-art masthead to the gate header at real opacity (18–22%, gradient-masked
  to the right), not the current 6%.
- Rebuild the three metric tiles into one **proportion bar**: a single track showing
  specialist hours against founder hours, with the 133/156/92 figures hung off it. The
  number becomes a picture.

### B. Rebuild the Heavy Lifting rows
- Reorder to runway sequence (Entity → Books → Offer → CRM → Funnel → Site → Brand →
  Campaign) and number them 01–08 in the drafting numeral style.
- Give the left "you carry it" side its own quiet container so the two columns are visually
  peers; equalize the two columns to the same height and top-align both.
- Repeat the column labels as small inline captions inside every row (`You carry it` /
  `We carry it`) so the comparison survives past row one — kill the single detached header.
- Promote the category mark to a 56px plate on the row's left edge, outside the text
  column, so it reads as a chapter marker; add a thin connecting rule between plates so the
  eight moves read as one arc rather than eight cards.

### C. Fix the dashboard header
- Raise stage-art opacity to a visible register and give it a fixed aspect so it doesn't
  stretch.
- Remove the duplicate progress bar under the ring — the ring is the progress display.
- Move the venture title, tabs and read-only control into one sticky masthead bar that
  survives the scroll; make the tabs a proper segmented control.

### D. Use the width
- Add a right rail at ≥1280px holding the progress ring, current-stage art and the stage
  list, sticky as the main column scrolls. Below 1280px it collapses back inline exactly
  as it is today.

### E. The decision cards
- Add a restrained mark to each compare card head (founder mark vs. team mark) and match
  internal rhythm so the two cards read as one balanced choice, not one dense card and one
  airy one.

## Technical notes

Presentation only — no data, edge function or business-logic changes.

- `src/components/ops/HeavyLifting.tsx` — row order, numbering, paired columns, inline
  labels, larger plates, connector rule.
- `src/components/ops/InvestmentCompare.tsx` — masthead art, proportion bar replacing the
  three tiles, compare-card marks.
- `src/components/ops/OpsDashboard.tsx` — sticky masthead, segmented tabs, remove duplicate
  progress bar, right rail at `xl`.
- `src/components/ops/OpsStageArt.tsx` — add a wide masthead variant with a fixed aspect
  ratio.
- `src/routes/_authenticated/dashboard/hub.$snapshotId.operations.tsx` and
  `src/routes/_authenticated/dashboard/operations.tsx` — header/tab markup moves into the
  shared masthead so the hub and founder views stay identical.

Verified after the build with screenshots at 1386px and 390px.
