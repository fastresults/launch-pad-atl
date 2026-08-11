# Foundation credit on the delivery-choice gate

The dashboard header now opens by crediting the foundation. The gate a founder hits first still opens with "Who is going to actually do this work?" and a step count, which lands the burden before the reassurance. Same framing goes above the choice.

## What changes

Single file: `src/components/ops/InvestmentCompare.tsx`, masthead block only (lines ~41–60).

1. **Eyebrow** changes from "Before you start" to "Phase 2 of 2 · Foundation complete."
2. **A credit line above the headline**, before the decision is posed:
   "Your offer and pricing, brand system, site direction and copy, campaign arc and operating assets are built and yours. Nothing ahead recreates them."
3. **Foundation chips** — the same muted check-chip row used in the dashboard header (offer and pricing, brand system, site direction and copy, campaign arc, operating assets), rendered under that line.
4. **Headline and sub-copy stay**, with the sub-copy reworded so the step count reads as putting the foundation to work rather than remaining work: "There are {n} steps between the foundation you have and a startup that runs — {m} of them are specialist work…"

To avoid drift between the two surfaces, the chip labels move to a shared exported constant (`FOUNDATION_DELIVERED`) in `src/lib/ops-runway.ts`, and `OpsDashboard.tsx` imports it instead of its local copy.

## Technical detail

Presentation only. `InvestmentCompare.tsx` (masthead block), `OpsDashboard.tsx` (swap local const for the shared import), `src/lib/ops-runway.ts` (export the constant). No task data, delivery-mode logic, or backend changes. Both the agency hub and the shared link render these same components, so parity is automatic.
