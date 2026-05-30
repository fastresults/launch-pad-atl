## Goal

Reconcile the copy across the free-cohort home page so nothing references the market-cost / DIY-hour columns we just hid in `ValueGrid`. Read top-to-bottom (hero → footer) and tighten transitions so the page reads as one consistent argument.

## Scope

Copy-only edits in `src/components/home/HomeSelection.tsx`. No structural or component changes. No edits to `RegisterSelection` (the paid/registration page still shows costs and keeps its current copy).

## Inconsistencies to fix

1. **`WhatYouWalkOut` subtitle (line 209)** — currently `"Conservative market rates and DIY hours, deliverable by deliverable. No fluff."` This directly names the columns we removed. Replace with a line that frames the table as the full deliverable list (what they'll walk out holding) rather than a cost/hours comparison.

2. **`WhatYouWalkOut` closing paragraph (lines 214–218)** — keeps the `$10,000 / six weeks` framing, which is still true and reinforces the hero's "roughly $10,000 of brand, web, and launch work." Light rewrite so it transitions from the table ("here's the list") to value ("here's what it'd cost you alone") without sounding like the table itself showed prices.

3. **Hero → WhyApplyingIsTheMove → WhatYouWalkOut transition** — check that the value claim ($10K) is introduced once in the hero/why-apply, then paid off (not re-pitched) at the table. Tighten the "If you're chosen" card body so the dollar figure isn't repeated three times in three sections.

4. **Eyebrow / H2 of `WhatYouWalkOut`** — keep ("Not a course. Not coaching. A built startup.") — it still works without the cost columns. No change.

5. **Final pass top-to-bottom** for any other stray references to "market rates," "DIY hours," "what it would cost," or a "table" framing that no longer fits. (Spot-checked: none in `WhyDoingThis`, `WhoWereLookingFor`, `Timeline`, `FinalistOffer`, `Facilitator`, `BottomCTA`. Only the two lines in §1 and §2 above need editing.)

## Proposed new copy (for approval)

- **New subtitle under "Not a course. Not coaching. A built startup."**
  > "Every deliverable, stage by stage — the full build you carry out the door at 4:30."

- **New closing paragraph below `<ValueGrid />`:**
  > "Hire this out piecemeal — brand studio, dev shop, fractional CMO — and you're six weeks and north of $10,000 in before anyone takes a payment. We'll have it in your hands by dinner."

- **Tighten "If you're chosen" card body in `WhyApplyingIsTheMove`** (keep the $10K anchor here since it's the first promise on the page, but trim redundancy with the new closing paragraph):
  > "A free seat on July 23 — roughly $10,000 of brand, web, and launch work built with you in one day, and a signed 90-day plan in your hand before you leave."

## Out of scope

- The `Hero`, `WhyDoingThis`, `Timeline`, `FinalistOffer`, `Facilitator`, and `BottomCTA` sections — they don't reference the removed columns and already transition cleanly. Leaving them alone unless you flag something.
- Registration page copy (still shows costs, still consistent).
