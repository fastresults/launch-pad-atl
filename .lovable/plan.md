# Always-visible AI Estimate button in Budget & Pro Forma intake

## Why it's missing today

The button already exists in `src/components/hub/IntakeGatewayDialog.tsx` (the green/primary "Estimate for me" CTA), but it's gated by:

```ts
{snapshotId && emptyCount > 0 && ( ... button ... )}
```

For the Budget & Pro Forma schema, every numeric field ships with a `default` value (25000, 4000, 99, 30%, 2000, 25000, "January", etc.). Those defaults seed `values` on open, so `isFilled()` returns true for almost every field and `emptyCount` collapses to ~1 (just "Primary revenue model"). When the user is on a venture where defaults look "filled", the banner + button disappear entirely — which is exactly what the screenshot shows.

This also means even when shown, the estimator skips any field that already has a default, so it can never produce a true context-grounded set of numbers for this dialog.

## Fix

Scope: `src/components/hub/IntakeGatewayDialog.tsx` only (UI/presentation). No edge function or schema changes.

1. **Always render the AI estimate panel** when `snapshotId` is present and the schema has at least one field. Drop the `emptyCount > 0` gate.
2. **Two-mode estimate**:
   - Default click → "Estimate empty fields" (current behavior — fills only blanks).
   - Secondary action → "Re-estimate all fields" which sends `current_values: {}` to `venture-estimate-intake` so the model returns values for every field, then overwrites the form (with a confirm toast). This is what the user is asking for: top-to-bottom estimate based on venture context.
3. **Copy update** in the panel so it reads naturally whether fields are empty or pre-defaulted:
   - Headline: "Let AI fill this from your venture context"
   - Sub: "We'll use everything we know — uploads, brief, concept, financials — to suggest realistic numbers. Edit anything before generating."
4. **AI-estimate badge** already exists per field; reuse it for both modes so the user sees which values came from the model vs. their own edits.
5. **Guard**: if `snapshotId` is missing, show a muted helper line ("Save the venture to enable AI estimates") instead of hiding the panel silently.

## Technical notes

- `handleEstimate(mode: "empty" | "all")` — when `"all"`, pass `current_values: {}` in the invoke body and replace values for every returned key regardless of `isFilled`.
- Keep the existing "Nothing to estimate" toast only for the "empty" path.
- No changes needed to `venture-estimate-intake/index.ts` — it already returns estimates for any field id present in the digest's `emptyIds`. By sending empty `current_values`, every field becomes eligible.
- No design-token or color changes; reuse existing `primary/5` panel styling.

## Out of scope

- Schema edits (defaults stay; they're useful as placeholders).
- Other intake dialogs — same component already serves them, so the fix applies globally.
