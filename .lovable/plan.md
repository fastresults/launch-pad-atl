# Make uploaded sources actually populate the Review fields

## What's broken

On `hub.new`, users drop documents and add URLs. We extract their text in the browser, and the **Process document** button calls `venture-synthesize-concept` which fills the visible form on that page (company name, concept, differentiation, founder, location, industry).

But when **Create & enrich** runs:

1. `createSnapshot` only persists those scalar fields — the raw doc text and scraped URL bodies are thrown away.
2. The snapshot row is then enriched by `venture-extract-concept` (and `venture-deep-research`), which **only** sees `business_concept`, `company_name`, `differentiation_statement`, and a re-scrape of `website_url`.
3. So the AI fills `extracted_data.{foundation,market,operations,vision}` based on a 3-sentence blurb. Anything it can't infer comes back as `"[needs founder input]"`, which is what shows up empty/placeholder in the Review wizard (Story → Market → Model sub-steps).

Verified against snapshot `a430693d…`: `extracted_data.operations.pricing`, `operations.team`, `vision.short_term_goals`, `vision.long_term_goals` are all literal `"[needs founder input]"` strings — even though the user uploaded multiple docs that almost certainly contained that detail.

## Fix

Carry the source material from `hub.new` all the way into the extraction prompt.

### 1. Schema — store sources on the snapshot

Add one column to `venture_snapshots`:

- `source_materials jsonb` — `{ documents: [{ filename, text, charCount }], urls: [{ url, title, text, charCount }], conceptDraft: string }`

(`scraped_content` stays as-is for back-compat; `source_materials` is the new richer field.)

### 2. `createSnapshot` (`src/lib/foundersHub.functions.ts`)

Accept and persist `source_materials` from the client. Cap each text at ~40 KB and the array totals at ~150 KB to keep the row sane.

### 3. `hub.new.tsx` → `create.mutationFn`

Pass the already-extracted `readyFiles` and `readyUrls` plus the manual `businessConcept` draft into `createSnapshot` as `source_materials`. No new uploads, no new scrapes — we already have the text in memory from the Process step.

### 4. `venture-extract-concept/index.ts`

- Load `source_materials` from the row.
- Build the user prompt with: business concept, differentiation, scraped website (existing), **plus** each uploaded document (filename + text) and each scraped URL (url + title + text), clearly delimited.
- Tighten the system prompt: "When source material is provided, prefer extracting verbatim facts (pricing, team, goals, processes) from it over inference. Only infer when sources are silent. Never emit placeholder strings like '[needs founder input]'; leave the field empty if truly unknown."
- Truncate per-source to ~12 KB and total user prompt to ~60 KB before sending to the gateway.

### 5. `venture-deep-research/index.ts`

Same treatment — pass `source_materials` excerpts into its research brief so the deeper passes (market size, competitors) build on the founder's own docs rather than ignoring them.

### 6. Backfill (this snapshot specifically)

For `a430693d-71cb-4407-bdf5-2d4eef62c2b1`: after the code lands, add a **Re-extract from sources** button on the `EnrichingStep` / Review header (or just reuse `retryEnrichment`) so Michael can re-run the extraction once. The next time he creates a venture, the pipeline picks the docs up automatically.

## Out of scope

- Re-uploading files to storage from `hub.new` — we already have their text client-side; saving the raw binaries can come later if needed.
- Changing the Review wizard UI itself; once `extracted_data` is real, the existing fields display correctly.

## Files touched

- `supabase/migrations/<new>.sql` — add `source_materials jsonb` column.
- `src/lib/foundersHub.functions.ts` — accept + persist `source_materials` in `createSnapshot`.
- `src/routes/_authenticated/dashboard/hub.new.tsx` — include `readyFiles`/`readyUrls`/draft in the create payload.
- `supabase/functions/venture-extract-concept/index.ts` — read column, fold into prompt, ban placeholder output.
- `supabase/functions/venture-deep-research/index.ts` — same context injection.
- `src/routes/_authenticated/dashboard/hub.$snapshotId.tsx` — small "Re-extract from my sources" affordance in the Review header for snapshots that already exist.
