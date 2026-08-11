# Drop "Split" — two delivery modes only

The runway is either yours or Startup Labs'. The hybrid option muddies the decision and creates a third state nobody maintains, so it comes out of the product.

## What changes

- The header toggle becomes two segments: **I'm building it** / **Startup Labs builds it**.
- The gate loses the "Or decide step by step — some ours, some yours" link under the self-build card. Two cards, two buttons, one decision.
- Any venture already sitting in the hybrid state gets treated as self-build in the UI, so the toggle always shows a real position instead of an empty one.
- Per-step reassignment is unaffected — a single step can still be handed the other way from its row; that's an exception, not a mode.

## Technical details

- `src/components/ops/DeliveryModeToggle.tsx`: remove the `mixed` option and its confirm copy.
- `src/components/ops/InvestmentCompare.tsx`: remove the `onChoose("mixed")` link.
- `src/components/ops/OpsDashboard.tsx`: drop the `mixed` label; normalize an incoming `mixed` value to `self` for display and toggle state.
- `src/lib/ops-runway.ts`: narrow `DeliveryMode` to `"self" | "retained"`; fix the `=== "mixed"` checks in `OpsTaskRow.tsx` and `GuidedStep.tsx` (engaged becomes simply retained).
- Edge function `venture-ops` keeps accepting `mixed` for backward compatibility with rows already stored that way, but nothing in the UI can set it again. No migration or data rewrite.
