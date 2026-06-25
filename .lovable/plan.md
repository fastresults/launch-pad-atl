## Problem

When the user clicks "Use 9 & continue" in the prefill review dialog, the save fails with:

> Could not find the table 'public.member_briefs' in the schema cache

`src/lib/brief.functions.ts` queries a non-existent table `member_briefs`. The real table is `attendee_business_brief` (per migrations and `types.ts`). Two other latent bugs in the same file also break the brief wizard:

- `brief.tsx` calls `updateBriefField({ data: { field, value } })` but the function signature expects `{ key, value }`.
- `brief.tsx` reads `data.brief[f.key]` but `getMyBrief()` returns the row directly (no `.brief` wrapper).
- `brief.tsx` calls `summarizeBriefBlock({ data: { block: 1|2|3 } })` but the function takes `{ block, content }` and the route ignores its return.

## Fix

### 1. `src/lib/brief.functions.ts`
- Replace `member_briefs` with `attendee_business_brief` in `getMyBrief`, `updateBriefField`, and `adminGetBrief`.
- Keep `updateBriefField({ key, value })` signature (matches `BriefPrefillReview`).

### 2. `src/routes/_authenticated/dashboard/brief.tsx`
- Change `data?.brief` → `data` (row is returned directly).
- Change `updateBriefField({ data: { field: key, value } })` → `updateBriefField({ key: key as BriefKey, value: values[key] ?? "" })`.
- Keep `summarizeBriefBlock` calls compatible with current stub signature (pass `{ block: String(id), content: "" }`); it currently returns an empty summary and is non-blocking.

## Verification
- Reload `/dashboard/brief`, drop a doc, accept suggestions → no schema error, answers persist.
- Normal wizard Next → saves and advances without error.
- Dashboard `getMyBrief` query continues to populate.

No DB migration needed — the correct table already exists with proper RLS/grants.