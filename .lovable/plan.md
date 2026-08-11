# Toggle: DIY vs. Assigned to Startup Labs

Right now the only way to change how the runway gets delivered is to reopen the full comparison gate. Add a direct toggle so a founder (or the agency) can flip between doing it themselves and handing it to Startup Labs without leaving the runway.

## What gets added

**1. Mode toggle in the Operationalize header**

A three-way segmented control sitting where the current "compare again" text link is:

```text
[ I'm building it ] [ Split ] [ Startup Labs builds it ]     compare the two →
```

- The active mode is highlighted; clicking another segment switches modes.
- Because switching rewrites who owns every task, a short confirm step appears first: what will change (how many steps move to Startup Labs / back to you) and Cancel / Switch.
- "compare the two" still opens the full comparison gate for anyone who wants the numbers again.
- Read-only viewers (client on a read-only share link) see the current mode as a static badge, no toggle.

**2. Per-step override stays where it is**

The existing per-task owner control keeps working, so a single step can still be flipped to the other side without changing the global mode. The header toggle is the global switch; the row control is the exception.

## Technical details

- `src/components/ops/OpsDashboard.tsx`: replace the single `MODE_LABEL` button with a `DeliveryModeToggle`, rendered when `props.onDeliveryMode` exists and `canEdit` is true; otherwise render the current label as a plain badge. Keep the `setGateOpen(true)` link alongside it.
- New `src/components/ops/DeliveryModeToggle.tsx`: segmented control over `"self" | "mixed" | "retained"` plus an AlertDialog confirm that counts, from the current `tasks`, how many steps change `owner_kind` under the target mode (using the existing mapping in `src/lib/ops-significance.ts`).
- No schema or edge-function change: the toggle calls the same `onDeliveryMode` prop, which already routes to the `set_delivery_mode` action and reassigns ownership.
- Wired identically on both surfaces — the agency hub route and `ShareOpsRunway.tsx` — since both already pass `onDeliveryMode`.
