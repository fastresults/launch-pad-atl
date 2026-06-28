# Fix "Rebuild enriched brief from library" — actually enrich

## What's broken today

`SourceRecoveryPanel.rebuild` in `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` (lines 517-542) only:

1. Reads the venture library (`listVentureSources`)
2. Appends their text into `venture_snapshots.source_materials.documents`
3. Toasts "Rebuilding…" and calls `onSaved()`

It **never** triggers an AI pass. That's why the form fields stay as the same one-line answers the user is seeing in the screenshots ("Transactional workshop fees, à la carte…", "$197 for the core workshop…", etc.). The button is a no-op on content quality.

Separately, even when `Re-extract from my sources` is clicked, `venture-deep-research`'s synthesis prompt asks for short string values per field — so output stays shallow even with rich source material.

## Plan

### 1. Make Rebuild trigger real enrichment (frontend)

`src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — `SourceRecoveryPanel.rebuild`:

- After `appendSnapshotSources(...)`, call `retryEnrichment({ data: { id: snapshot.id } })` so `status='enriching'` is set and `venture-deep-research` runs against the freshly-attached library.
- Change the toast to "Re-enriching brief from your full library — this takes ~30–60s."
- The parent `ReviewStep` already flips to the enrichment progress UI when `status==='enriching'` (line 129), so the user gets live progress automatically.
- Also fire `window.dispatchEvent(new CustomEvent("venture-sources:changed"))` and `qc.invalidateQueries({ queryKey: ["hub","snapshot",snapshot.id] })` after the call so the UI updates instantly.

### 2. Upgrade the synthesis to "enrich", not just "extract"

`supabase/functions/venture-deep-research/index.ts` — `SYNTH_SYSTEM` + user prompt:

- Add an explicit **enrichment contract** to the system prompt:
  - Each field must be 2–4 sentences (or 3–6 bullets where the field benefits from it — differentiators, target_customers segments, key_processes), grounded in cited snippets from the library.
  - Pull concrete proof points: named segments, numbers, geographies, channels, pricing tiers, competitor names, and quotes pulled verbatim from `source_materials.documents` / `urls`.
  - Never collapse to a single comma list when the library supports detail.
  - Preserve any **user-edited** value that is already longer than the AI draft (pass current `extracted_data` as "DO NOT shorten these confirmed answers; only deepen or add"). This protects the manually-curated text in the screenshots.
- Switch model for this call to `google/gemini-3.1-pro-preview` when combined library text > 5,000 chars; keep `gemini-3-flash-preview` otherwise. (Pro handles the longer-context grounding the user expects.)
- Raise per-section length caps in the response schema (e.g. `target_customers`, `value_proposition`, `differentiators`, `monetization`, `pricing`, `key_processes`, `team`) and add `evidence` arrays per field so we can later show provenance.

### 3. Field-by-field enrichment writeback

In `venture-deep-research`'s writeback (around line 500):

- Deep-merge new `extracted_data` over existing instead of replacing — for every field, keep the longer of (existing, new) unless `new` adds net-new substance; this prevents wiping the user's good answers.
- Mark `enrichment_progress.last_enriched_at` and `enriched_field_count` so the Review screen can show a "Just enriched 9 fields" banner.

### 4. UX polish on the Review screen

`hub.$snapshotId.tsx` Review header (around line 354-365):

- Group `Re-extract from my sources` and `Rebuild enriched brief from library` into one primary action labeled **"Re-enrich from full library"** (the current two-button split confuses scope). Keep a small "View sources" affordance to open the library panel.
- After enrichment completes, surface a toast: "Enriched N fields with M new evidence snippets."

## Technical notes

- Files touched: `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`, `supabase/functions/venture-deep-research/index.ts`. No schema changes.
- `retryEnrichment` already exists and already invokes `venture-deep-research` — we're just chaining it after the source-merge.
- Model swap stays inside Lovable AI Gateway allowlist (`google/gemini-3.1-pro-preview` already in use elsewhere).
- Existing `enrichment_progress` polling (3s interval, line 102) covers the long-running call without extra work.

## Out of scope

- Per-field "regenerate just this" buttons (separate ask).
- Citations UI for the new `evidence` arrays — schema lands now, UI lands when you ask for it.
