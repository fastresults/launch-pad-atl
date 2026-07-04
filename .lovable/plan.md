# Rename user-facing "documents" → "assets"

## Goal
Enforce the global copy rule: never say "document(s)" in user-facing UI — say "asset(s)" (or a more specific word like "guide", "runbook", "deck" when it fits). Code identifiers, DB columns, table names, edge-function names, URL paths, and file-format words (e.g. Word `.docx`, "document.xml") stay unchanged. Also persist the rule to project memory so future sessions honor it automatically.

## Audit summary

Grepped `src/**` for `document`. The user-facing strings that violate the rule (copy only — variable/type/route/DB names ignored) are:

**`src/routes/_authenticated/dashboard/hub.$snapshotId.tsx`**
- L87 STEPS label `"Write documents"` → `"Write assets"`
- L129 link label `Continue to documents →` (workflow step CTA) → `Continue to assets →`
- L372 tooltip `Re-run extraction using the documents and URLs you uploaded` → `…the assets and URLs you uploaded`
- L466 button `Continue to documents →` → `Continue to assets →`
- L886 toast `"Document ready"` → `"Asset ready"`
- L1043 hero `"We're writing your documents…"` → `"We're writing your assets…"`
- L1053 hero `All ${total} documents are written. Open any one below…` → `All ${total} assets are ready. Open any one below…`
- L1056 button `View first document` → `View first asset`
- L1071 hero sub `write your ${total} documents in guided sections…` → `…${total} assets…`
- L1151 `{failures.length} document{…}s need another try` → `asset{…}s`
- L1223 helper `read each document as it finishes` → `read each asset as it finishes`
- L1236 stale banner `{staleCount} document{…} were written before your latest concept update. Rewrite to bring them in line.` → `asset{…}` + `Rewrite them to match.`
- L1243 comment stays; **L1246 section heading `"Your documents"` → `"Your assets"`**
- L1247 helper `hit Generate on any single document` → `…any single asset`
- L1403 fallback `earlier documents` → `earlier assets`
- L1459 title `Finish earlier documents first` → `Finish earlier assets first`

**Other UI surfaces**
- `src/components/hub/RewriteFeedbackDialog.tsx` L136 fallback title `"document"` → `"asset"`
- `src/components/hub/IntakeGatewayDialog.tsx` L325 fallback title `"Document"` → `"Asset"`; L328 helper `this document reflects your real numbers` → `this asset reflects…`
- `src/components/workshop-slides/slides/finance.tsx` L39 prompt `documents they expect` → `assets they expect`
- `src/components/workshop-slides/slides/marketing.tsx` L36 prompt `brief a website in one document a builder could ship from` → `brief a website in one asset a builder could ship from`
- `src/lib/framework-deliverables.ts` tooltips L143, L175, L186 — replace copy uses of "document" with "asset" (keep "product requirements document (PRD)" intact where the acronym is the point; rephrase to `product requirements asset — pages, copy, sections, CTAs — written so an AI builder can ship your site in a weekend`)
- `src/lib/curriculum-data.ts` L82, L126, L141, L200, L244, L259 — replace `working documents` → `working assets`, `the document your bank … expects` → `the asset your bank … expects`, keep the phrase `state's formation document` (that's a legal artifact name — leave as-is)
- `src/lib/build-workshops.ts` L414, L436, L479, L636, L642 — `documented workflow/production system/rationale documented` are process-verb uses ("documented" = written down). **Leave as-is**; the rule targets the noun "document(s)" meaning a produced artifact.
- `src/lib/workshop-productization.ts` L280, L432 — takeaways referencing "the document they expect" / "one document any vendor…" → `the asset they expect` / `one asset any vendor…`
- `src/lib/agency-services.ts` L95 `documented, and owned by your team` — verb use, leave.
- `src/routes/services.tsx` L161 `Documented systems` — verb use, leave.

## Explicitly out of scope (do NOT touch)

- DB tables and columns: `venture_documents`, `attendee_documents`, `venture_document_types`, `document_type`, `documentId`.
- Route paths (`/dashboard/documents`), lazy import name `DashboardDocuments`, and the `documents` route file itself.
- Edge function name `venture-generate-document`.
- Component/type identifiers: `DocumentViewer`, `RichMarkdown` `Variant = "document"`, `MediaType = "document"`, mutation vars named `documentType`.
- MIME types and DOCX internals: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `word/document.xml`, `.docx` handling copy inside `FilePreviewDialog`.
- Native web API usage: `document.title`, `document.getElementById`, etc.
- Alt text describing an actual physical document object in a photograph (e.g. `"bound document with a ribbon bookmark"` in a still-life image prompt) — that's describing a real object, not our product.
- Process-verb uses: "documented workflow", "documented systems", "rationale documented" — these mean "written down", not "an artifact we produce".

## Memory update

Add a Core rule to `mem://index.md`:
> User-facing copy says "asset(s)", never "document(s)". Applies to UI strings, toasts, headings, buttons, helper text, tooltips, and marketing copy. DB tables/columns, route paths, edge functions, component names, MIME types, native web APIs, and process-verb uses of "documented" are exempt.

No new memory file needed — the rule is short and universal.

## Verification

1. After edits, run `rg -n "[Dd]ocument" src/ -g '*.tsx' -g '*.ts'` and confirm every remaining hit falls into the "out of scope" list.
2. Open `/dashboard/hub/:id` and confirm the section heading reads "Your assets", the hero says "We're writing your assets…", the stale banner references assets, and toasts say "Asset ready".
3. Typecheck passes (`tsgo`).

## Not changing

- No component structure, no logic, no data model, no routes.
- Copy-only edits.
