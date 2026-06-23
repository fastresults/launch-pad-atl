
## What I'll change

Collapse the six deliverable cards on the home page into a tight three-word list. Each item gets a punchy three-word label, no descriptions, no icons fighting for attention. The goal: a founder can scan it in two seconds and know what they're walking out with.

## The three-word labels

| # | Current title | New 3-word label |
|---|---|---|
| 1 | A one-line answer to 'what do you do?' | **Your one-line pitch** |
| 2 | Your first customer, by name | **Your first customer** |
| 3 | What to charge — and how to say it | **Your price, defended** |
| 4 | The numbers on one page | **Your numbers, mapped** |
| 5 | Your first 90 days, week by week | **Your 90-day plan** |
| 6 | What to do yourself, what to pay for | **Build, hire, skip** |

## Where this lands

- `src/lib/framework-deliverables.ts` — replace the six `FRAMEWORK_DELIVERABLES` entries. Drop the `description` field (or blank it) since we're going list-only.
- `src/components/home/HomeFramework.tsx` — the `Framework` section becomes a clean list: icon + 3-word label, in a simple grid. No description paragraph per card.
- Section intro paragraph stays as-is (already plain-language).

## Out of scope

- Schedule page timeline (different surface, different audience expectation)
- Services page
- Any pricing or layout shifts beyond what the new card density requires

## Calls to make before I ship

1. **The labels above — yes or swap any?** Easiest place to push back. If "Build, hire, skip" feels too cute, I'd go "DIY or pay" instead. If "Your price, defended" feels off, "What to charge" works.
2. **Drop the descriptions entirely, or keep a one-line caption under each?** My recommendation: drop them. The whole point of "three words" is the scannability — a caption undercuts it.
