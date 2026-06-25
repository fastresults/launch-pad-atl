## Problem

In `EpiphanyPanel` (`src/components/hub/ConceptStudio.tsx`) every card's Fold/Save/Details/Dismiss button is wired to `disabled={run.isPending}`. Because `run` is a single shared `useMutation`, pressing **Fold into concept** on card #1 disables and grays out the buttons on card #2 (and the saved-for-later rows) too, making it look like everything is processing.

The same shared-mutation pattern exists in the Saved-for-later list (`fold` and `dismiss` buttons).

## Fix

Scope the pending state to the specific card + action that's actually running by reading `run.variables` (the mutation already receives `{ action, payload: { card | id } }`).

File: `src/components/hub/ConceptStudio.tsx` — inside `EpiphanyPanel`.

1. Derive a small helper at the top of the render:
   ```ts
   const v = run.variables as { action?: string; payload?: any } | undefined;
   const activeCardTitle = v?.payload?.card?.title ?? null; // top3 cards have no id, so match by title
   const activeSavedId = v?.payload?.id ?? null;
   const isBusy = (action: string, key: string | null) =>
     run.isPending && v?.action === action && key !== null && (v.payload?.card?.title === key || v.payload?.id === key);
   ```
2. In the top3 card map, replace the three `disabled={run.isPending}` props:
   - Fold button → `disabled={isBusy("fold_enhancement", card.title)}` and show `Loader2` + "Folding…" only while that specific card is folding.
   - Save button → `disabled={isBusy("save_enhancement", card.title)}`.
   - Details toggle stays enabled (never blocked by network).
3. In the Saved-for-later list, replace `disabled={run.isPending}` on Fold and Dismiss with `isBusy("fold_enhancement", s.id)` and `isBusy("dismiss_enhancement", s.id)` respectively.
4. Keep the top-level **Find my epiphany** button using `run.isPending && v?.action === "epiphany"` as it does today.
5. No layout/copy changes beyond swapping the disabled prop and the in-button label/spinner for the active card.

## Out of scope

- No changes to mutation logic, endpoints, or payload shape.
- No optimistic UI or background-queue rework.
- No styling/color changes — only the disabled-state scoping and a per-card spinner label.
