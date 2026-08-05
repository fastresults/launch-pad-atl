# Keep chat modal promises inside what one morning can deliver

The "What you walk out with" lists on the workshop pages were already audited down to what a 2h45 morning can honestly produce. The hero chat modal was not part of that pass. It has three places where the promise can drift past what we deliver: the AI-written diagnostic, the fixed invitation copy, and the waitlist card.

## What changes

**1. The AI-written read (all eight build lanes)**

The model currently writes three "artifacts you'd walk out holding" freely from the workshop's artifact list. It is not told the morning's real limits, so it can phrase things as finished, launched, live, or integrated.

Add explicit constraints to the diagnostic instructions so every generated artifact:
- names a decision, draft, or configured single item — never a finished, launched, integrated, or fully built system
- never claims work that depends on their accounts, vendors, licenses, or approvals
- never promises volume (no "16 emails", "a full library", "all pages")
- must be drawn only from that workshop's audited artifact list, phrased for their answer, not invented

Same tightening for the Foundation viability read's "first moves" so they stay honest starting steps.

**2. The build-lane invitation card in the modal**

- Keep "We build this with you in one morning" but pair it with the scope reality: it's one focused area, drafted and decided with you in the room.
- Add the same one-line honesty note the workshop pages use, so the modal and the page agree.

**3. The Foundation invitation card in the modal**

The three bullets (live page, priced offer, first message sent) match the audited Foundation list, so they stay. Add the qualifier that the page is published with your own domain/host where access allows, matching the page-level wording rather than promising more.

**4. Standing footer note**

Replace the current "Built with you in the room — not slides, not notes." with a line that both reassures and bounds: built with you in the room, in one morning — decisions and real first versions, not a finished agency deliverable.

## Technical notes

- `supabase/functions/atlanta-viability/index.ts` — extend the `DIAGNOSTIC` rules block and the per-workshop `focus` string with the scope constraints above; extend the Foundation `SYSTEM` prompt's first-moves guidance. Redeploy the function.
- `src/components/home/IdeaSnapshotModal.tsx` — copy edits only, in the two invitation cards (Foundation and build-lane) and the walk-out footer note.
- No schema, routing, or component-structure changes. `.lovable/walkout-audit.md` gets a short appended section recording the modal pass.
