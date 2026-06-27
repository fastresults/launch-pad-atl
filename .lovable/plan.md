# Plan: Auto-Estimate button on Intake Gateway (Budget & Pro Forma + all intake forms)

## Problem
When a deliverable like **Budget & Pro Forma** opens its intake pop-up, novice founders see a long list of numeric inputs (revenue, burn, headcount, capex, etc.) and stall. They need a one-click way to let the AI propose reasonable defaults grounded in everything we already know about their venture.

## Solution
Add a prominent **"Estimate for me"** button at the top of the `IntakeGatewayDialog`. One click → AI reads the full canonical venture context (brief, profile, prior documents, source materials) and fills every empty field with its best estimate. Each filled field gets a small "AI estimate — edit me" badge so the user knows it's a guess they should validate.

## UX

```text
┌─ Budget & Pro Forma — quick inputs ─────────────┐
│ Answer a few questions...                       │
│                                                 │
│ ╔═════════════════════════════════════════════╗ │
│ ║  ✨ Not sure? Let AI estimate from your     ║ │
│ ║     venture context.                        ║ │
│ ║                       [ Estimate for me ]   ║ │
│ ╚═════════════════════════════════════════════╝ │
│                                                 │
│  Monthly burn *           [AI estimate · edit]  │
│  $ 12,500                                       │
│                                                 │
│  Headcount Y1 *           [AI estimate · edit]  │
│  3                                               │
│  ...                                             │
│                            [Cancel] [Generate]   │
└─────────────────────────────────────────────────┘
```

- Banner sits above the field list, only when at least one field is empty.
- Button shows spinner + "Estimating…" while running.
- Only **empty** fields are overwritten (never clobber what the user typed or what was already prefilled from canonical context).
- Each AI-filled field gets an amber `AI estimate` chip next to the label (distinct from the green "prefilled" chip) so users see what to review.
- Toast on success: "Filled N fields. Review and edit before generating."
- On failure (no context, AI error): toast with friendly message, button re-enables.

## Technical Implementation

### 1. New Edge Function `venture-estimate-intake`
- Input: `{ snapshot_id, deliverable_type, schema, current_values }`
- Loads canonical venture context via existing `_shared/venture-context.ts` (same source feeding deep assessment / roadmap).
- Builds a compact prompt: schema (field id, label, type, help text, units) + venture context summary + instruction to return strict JSON `{ field_id: value }` for empty fields only, using realistic, conservative estimates and flagging assumptions.
- Model: `google/gemini-3-flash-preview` (fast, cheap, JSON-friendly) via `aiFetch`.
- Returns `{ estimates: Record<string, any>, notes?: string }`.
- Standard auth + RLS check that user owns the snapshot.

### 2. `IntakeGatewayDialog.tsx` changes
- Add `snapshot_id` prop (the dialog is already invoked from hub pages that know it).
- Add `estimating` state, `aiEstimateFields` Set<string> for chip rendering.
- `handleEstimate()`: invoke edge function with current `values` and `target.schema`; merge only into empty fields; record ids in `aiEstimateFields`; show toast.
- Render banner + button above the field map (hide when no empty fields remain).
- Render amber chip on labels where `aiEstimateFields.has(f.id)`.
- For `rows`-type fields, if AI returns an array, replace empty rows array with it.

### 3. Caller updates
- `ConceptStudio.tsx`, `hub.$snapshotId.tsx`, `workflow.$key.tsx` — anywhere `<IntakeGatewayDialog>` mounts, pass the current `snapshot_id`.

## Out of scope
- No schema changes, no new tables.
- No changes to existing prefill-from-canonical-context logic — estimate is a separate, explicit user action.
- Doesn't change the downstream generation flow; it just fills the form.

Approve and I'll build it.
