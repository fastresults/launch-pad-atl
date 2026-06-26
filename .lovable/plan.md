## Why the page is empty

`/dashboard/deliverables` reads from the legacy `attendee_deliverables` table (0 rows). All your real generated work lives in `venture_documents` (33 rows across your venture snapshot) — produced by the Hub flow (Concept Studio → Generate document → Deep assessment). The two systems were never wired together, so this page has always been blank for Hub users.

## Fix: point Deliverables at the real source

Rewrite `src/routes/_authenticated/dashboard/deliverables.tsx` to render `venture_documents`, grouped by venture snapshot.

### What the user will see
- Header: "Your deliverables" + count (e.g. "33 documents across 1 venture").
- For each venture snapshot (newest first): venture name + one-line concept, then a grid of document cards.
- Each card: category chip (from `framework-deliverables.ts`), title, status (Draft / Ready / Failed), updated date, and buttons: **Open** (launches the existing `DocumentViewer` modal with rewrite / deep assessment / export / save-to-files already built in) and **Open venture** (links to `/dashboard/hub/$snapshotId`).
- Empty state only when the user truly has zero venture documents — with a CTA "Start a venture in the Hub" → `/dashboard/hub`.
- Filter chips: All / Ready / Draft, plus a venture selector when there's more than one snapshot.

### Technical details
- New helper in `src/lib/foundersHub.functions.ts` (or a new `deliverables.functions.ts`): `listMyVentureDocuments()` — joins `venture_documents` with `venture_snapshots` (name, concept) scoped to `auth.uid()`, ordered by `updated_at desc`.
- Reuse existing `DocumentViewer` component — it already handles rewrite, deep assessment, exports, and save-to-My-Files, so no duplication.
- Keep `listMyDeliverables` import out of this page. Leave the legacy function intact (still used by admin pipeline views) but stop surfacing the empty legacy table to founders.
- Use `framework-deliverables.ts` to resolve category label/color from `document_type_key`.

### Out of scope
- No DB migration, no backfill — `attendee_deliverables` stays as-is for the admin/review pipeline.
- No changes to Hub or generation logic.