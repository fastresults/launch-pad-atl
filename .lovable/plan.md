# Legal Setup — Add discreet "handled outside workshop" note

Add a subtle, friendly disclaimer to the Legal Setup card explaining that several steps must be completed by the founder outside the workshop, while the checklist here keeps them on track.

## Change

**File:** `src/components/foundation/LegalSetupCard.tsx` (the card rendered on `/dashboard/workflow` and inside the Foundation group on the Hub snapshot).

Under the existing description paragraph ("Step-by-step walkthrough: entity choice…"), add a small muted line:

> *A few of these steps happen outside the workshop — filings, ID numbers, signatures. This checklist keeps everything in one place so nothing slips.*

Styling:
- `text-xs text-muted-foreground italic mt-2`
- Prefixed with a small `Info` icon (lucide, `h-3.5 w-3.5`, inline)
- No badge, no callout box — just a quiet line that reads as a friendly note

## Out of scope
- No changes to the 7-step stepper, copy inside steps, or Edge Functions.
- No layout/progress-bar changes.
