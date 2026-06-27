## Goal

Replace the cold red error banner on `/dashboard/brief` with a warm, useful empty state for founders who have zero ventures (or whose workspace prep fails), and stop the workspace reset from being a blocking error.

## Why this is happening

`brief.tsx` runs `reset_founder_workspace` automatically whenever a user lands with zero ventures. When that RPC returns an error (here: `malformed array literal: "attendee_business_brief"` — a stray array column write somewhere downstream), the page replaces the entire UI with a destructive red panel. That is the screen in the screenshot. Even when the RPC succeeds, a zero-venture user still lands on a question form with no context about why everything is blank.

## What to build

### 1. New `BriefEmptyState` component (`src/components/brief/BriefEmptyState.tsx`)

Friendly, on-brand panel shown whenever `ventureCount === 0`, regardless of whether the silent reset succeeded:

- Warm headline: "Let's start your first startup."
- One-paragraph explainer: their workspace is fresh, the brief is the 10-question kickoff, takes ~10 minutes, can be pre-filled from an uploaded doc.
- Two primary CTAs:
  - "Create a venture" → `/dashboard/hub/new`
  - "Start the brief from scratch" → dismisses the empty state and drops them into question 1
- Secondary CTA: "Upload a doc to pre-fill" → opens the existing `BriefPrefillDropzone` dialog.
- Small footer line: "Returning founder? Your old answers were cleared because no ventures remain." (only shown when the silent reset actually cleared rows).

### 2. Make workspace prep non-blocking in `brief.tsx`

- Keep the venture-count query and the `reset_founder_workspace` call, but treat reset failure as a soft warning, not a fatal screen.
- Remove the full-page red error branch (lines 272–281). Replace with:
  - If `ventureCount === 0` → render `<BriefEmptyState />` (with an inline amber note if `workspaceCheckError` is set: "We couldn't fully clear old answers — you can still start fresh.").
  - If `ventureCount > 0` and `workspaceCheckError` is set → render the normal brief UI with a small dismissible amber banner at the top instead of replacing the page.
- Keep the "Preparing a fresh workspace…" loading card, but soften copy to "Getting your workspace ready…" and cap visible spinner state so it never appears stuck (already gated by `workspaceResetting`).

### 3. Fix the underlying RPC error (root cause of the red banner)

Investigate the `malformed array literal: "attendee_business_brief"` message:

- Audit `reset_founder_workspace` and any trigger on `attendee_business_brief`, `attendee_founder_profile`, etc., for a column typed `text[]` that is being assigned the literal string `"attendee_business_brief"` (likely an audit/log trigger appending a table name to a `text[]` cleared-list column without `ARRAY[...]` syntax).
- Patch the offending statement to use `ARRAY['attendee_business_brief']` or `string_to_array(...)`. Ship as a migration.

This is the durable fix; steps 1–2 ensure the UI degrades gracefully even if a similar error appears in the future.

### 4. Mirror the empty state on `/dashboard/hub` (light touch)

`hub.index.tsx` already handles zero ventures, but confirm its empty state copy matches the new BriefEmptyState voice so users see a consistent "you have no ventures yet" experience across both routes. No behavior change beyond copy alignment.

## Out of scope

- No changes to the actual 10-question flow, profile sync, or deck/document generation.
- No schema changes to `attendee_*` tables beyond what's needed to fix the array-literal bug.

## Files touched

- `src/routes/_authenticated/dashboard/brief.tsx` — remove fatal error branch, render empty state, soften loading copy.
- `src/components/brief/BriefEmptyState.tsx` — new component.
- `src/routes/_authenticated/dashboard/hub.index.tsx` — copy alignment only.
- One migration to fix the `text[]` assignment causing `malformed array literal`.
