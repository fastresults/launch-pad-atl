# Fix: "Generate remaining" silently does nothing

## What actually happened

The run did not crash. It ran and finished in two seconds having written nothing, which reads as a failure.

Verified against the live venture (Anderson Elderly Residences Inc.):

- Job `be5a2f7e…` at 22:04 UTC: status `completed`, 100%, no error, no gateway calls. Edge function logs show only a boot — no errors.
- 62 assets are `complete`, zero pending/failed rows.
- 65 asset types are active. Three have never been written: `supplier_shortlist`, `bom_and_landed_cost`, `budget_pro_forma`.

Why the bulk run skips all three:

1. `supplier_shortlist` and `bom_and_landed_cost` are sourcing-only. This venture is classified `is_physical_product: false`, so the server filters them out — correct, but the founder still sees them.
2. `budget_pro_forma` has an `intake_schema` (starting cash, owner draw, pricing, hires, recurring costs...). The bulk generator drops **every** intake-gated asset unless the founder already saved answers. So the one genuinely missing asset is never attempted, never marked blocked, and never explained. The job just reports `completed`.

So the button counts assets the engine has quietly agreed never to write.

## The fix

Remaining assets should be inferred from the 62 already written, not dropped.

**1. Derive intake answers instead of skipping.**
A new shared step reads the completed assets that already contain the numbers (pricing/offer, unit economics, financial model, hiring plan, tool stack, launch plan) and asks the model to fill the asset's `intake_schema` with concrete, defensible values — every field answered, no TBD, plus a one-line basis for each. Those derived answers are saved on the document as `intake_answers` with `intake_source: "derived"`, then the asset generates normally. This mirrors how brand auto-derivation already unblocks the PRD assets.

**2. Label it honestly.**
Derived assets open with an "Assumptions used" note listing each inferred input and where it came from, and the hub card shows an amber "Assumptions used — review inputs" badge with a link to edit the intake and regenerate. Nothing is presented as founder-confirmed when it isn't.

**3. Stop counting what will never run.**
Sourcing-only assets on a non-physical venture are recorded as `not_applicable` rather than sitting as ghosts. They stay visible under "Physical products only" but leave the remaining counter and the "Generate remaining N" label.

**4. Never finish a run with an unexplained no-op.**
If a run attempts zero assets, it finishes as `completed_with_blockers` with a plain reason ("Nothing left to write — 2 assets don't apply to a service business") and the UI surfaces that instead of appearing to fail. The counter the button shows is computed from the exact same eligibility rules the server uses, so the two can't disagree again.

## Technical detail

- `supabase/functions/_shared/intake-derive.ts` (new): `deriveIntakeAnswers(supabase, ctx, type)` — pulls the relevant completed docs, calls `openai/gpt-5.6-sol` with the type's `intake_schema` as a strict JSON schema, validates required fields, writes `intake_answers` + `intake_source` onto the `venture_documents` row. Returns `null` on failure so the asset falls through to a real `blocked_reason` rather than a silent skip.
- `venture-bulk-generate/index.ts`: replace the blanket `!t.intake_schema` filter with "keep it; derive answers on demand". Mark sourcing-only types `not_applicable` for non-physical ventures. Add the zero-attempt guard to the terminal status write.
- `venture-generate-document/index.ts`: same derivation path when an intake-gated asset is triggered from a sprint day or a retry sweep, so all three entry points behave identically.
- Migration: allow `not_applicable` in the document status set; add `intake_source text` to `venture_documents`.
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`: exclude `not_applicable` from `requiredTypes`/`remaining`, render the "Assumptions used" badge, and show the job's no-op reason.

## Verification

Re-run "Generate remaining" on this venture and confirm `budget_pro_forma` is written with derived inputs, the two sourcing assets settle as not-applicable, and the counter reaches its real total instead of parking at three.
