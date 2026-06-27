# Add URL scraping to the Startup Brief pre-fill

## The gap

`BriefPrefillDropzone` (the very first context-capture step on `/dashboard/brief`) only accepts file drops. Anything the founder *also* has on the web — their existing site, a Notion page, a LinkedIn "About", a Substack post — has no way in here. That breaks the "single source of truth, captured once, persists everywhere" promise we just hardened: a URL the founder mentions on day one can't follow them into Hub generation later.

The scraping pipeline already exists (`venture-scrape-url`, Firecrawl-backed, with a fallback fetcher and SSRF guards) and persistent founder context already exists (`attendee_documents` → `canonical-context` → snapshot `source_materials`). They just aren't wired into the brief intake.

## What changes

### 1. `src/components/brief/BriefPrefillDropzone.tsx` — add a URL input row

Under the file list, add a compact URL field:

- Single input + "Add" button, accumulates up to **3 URLs** as removable chips (same visual language as the file chips already there).
- Client-side validation: must parse as `http(s)://` URL; trim; dedupe.
- Update the header copy from *"Skip the typing. Drop your deck, one-pager, or notes."* to *"Skip the typing. Drop docs or paste links — your site, a Notion page, anything that already describes the startup."*
- Update the helper line under the dropzone to mention "+ up to 3 URLs".
- Enable the "Pre-fill my answers" button when **either** at least one valid file **or** at least one URL is present (today it only checks files).

### 2. On "Pre-fill", scrape URLs first, then run the existing flow

In `runPrefill`:

1. If URLs exist, call `supabase.functions.invoke("venture-scrape-url", { body: { urls } })` (already deployed, returns `{ results: [{ url, title, text, error }] }`).
2. For each successful scrape (`text` non-empty, no `error`):
   - Build a synthetic `.md` File in the browser:
     `new File([\`# \${title ?? url}\n\nSource: \${url}\n\n\${text}\`], \`\${hostname}.md\`, { type: "text/markdown" })`.
   - Call `uploadVentureSource({ file, kind: "brief_source", usedInBrief: true })` so the scraped page lives as a real `attendee_documents` row with `extracted_text` already populated — identical persistence path to dropped docs. This is what makes it "stick" through the whole workflow (canonical context → hub.new prefill → snapshot source_materials → all deliverable generation).
   - Add the same synthetic File to the FormData passed to `brief-prefill` so the LLM uses it for the 10 answers in the same call.
3. For each failed scrape, surface a per-URL toast (`"<url>: <error>"`) but don't block — proceed with whatever did succeed.
4. If **all** inputs (files + URLs) failed validation/scraping, show the existing "Add at least one valid file" toast, reworded to "Add at least one valid file or URL".

### 3. `supabase/functions/brief-prefill/index.ts` — no functional change needed

The function already accepts arbitrary `.md` files via the `TEXT_MIMES` / filename branch and renders them as `--- FILE: <name> ---` text blocks to Gemini. Scraped pages will appear to the model identically to dropped markdown notes, with the URL and title in the body so the model can cite them in `source_filename` / `source_snippet`.

(Optional polish, only if scope allows: prefer using the hostname in the synthetic filename — e.g. `acme-co.com.md` — so the brief review screen shows a recognizable source attribution.)

### 4. Nothing else touched

- `venture-scrape-url`: unchanged (already production-hardened with Firecrawl + fallback + SSRF checks).
- `venture-sources.ts`, canonical-context, `brief-to-snapshot.ts`: unchanged — scraped pages land in `attendee_documents` with `used_in_brief = true, snapshot_id = null` exactly like dropped files, so they're already picked up by every downstream consumer.

## Technical notes

- Scraping is best-effort: a single bad URL must not abort the pre-fill. Use `Promise.allSettled` style handling and report per-URL failures.
- Cap synthetic markdown at the same `PER_URL_CAP` (30 KB) the edge function already enforces — the function returns pre-capped text, so just pass it through.
- Persistence is the whole point: do **not** scrape inline-only. The `uploadVentureSource` call is what makes the source survive past this screen.
- No DB migrations, no new edge functions, no new env vars (Firecrawl already wired).

## Out of scope

- Crawling multi-page sites (single-page scrape only, as today's `venture-scrape-url` does).
- A separate "Add URL" surface elsewhere in the brief — `hub.new.tsx` already has its own URL ingestion; this plan only fixes the *first* capture point so the brief stage stops being doc-only.
