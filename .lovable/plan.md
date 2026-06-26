# Add URL Scrape as a Context Source

Today the "Your business concept" block accepts two inputs: a **file dropzone** (PDF/TXT/MD) and a **text/voice field**. We'll add a third co-equal input: a **URL** the user can paste so we scrape it and fold the content into the same synthesis pipeline that fills the rest of the form.

A user may use any one, two, or all three. The synthesizer should merge whatever's available.

## UX changes (`hub.new.tsx`)

Reframe the context block into three labeled affordances stacked vertically, each optional:

```text
Give us context — any of these work
─────────────────────────────────────
[ 1 ] Drop documents     (existing dropzone)
[ 2 ] Paste a URL        (NEW — input + "Fetch" button)
[ 3 ] Type or dictate    (existing Business concept field + mic)
```

NEW URL row:
- Single `<Input type="url">` with placeholder `https://yourcompany.com or a relevant article` + a "Fetch" button.
- After fetch: show a compact chip like the file chips (favicon, page title, char count, ✕ to remove). Support up to 3 URLs.
- Inline validation (must be http/https). Errors mirror file error styling.
- Disabled state while scraping; spinner on the button.

"Process document" CTA is renamed to **"Use my context to fill the form"** and becomes enabled when *any* of: ≥1 ready file, ≥1 scraped URL, or ≥20 chars in the concept field. (Today it requires files only.)

## Backend changes

### New edge function: `venture-scrape-url`
- Input: `{ urls: string[] }` (≤3, validated).
- Uses **Firecrawl connector** (`/v2/scrape`) with `formats: ['markdown']`, `onlyMainContent: true`, modest `waitFor`. Falls back to a server-side `fetch` + simple HTML→text strip if Firecrawl isn't connected, so the feature degrades rather than breaks.
- Returns `[{ url, title, text, charCount, error? }]`, each text capped at ~30k chars (matches `PER_FILE_CAP` in synth).
- CORS + auth headers like sibling functions.
- Requires Firecrawl connector to be linked (we'll prompt connection if missing).

### Update `venture-synthesize-concept`
- Accept an additional `urls: [{ url, title, text }]` array alongside `sources` (files). Concat them into the same prompt under a clearly labeled "WEB SOURCES" section, keeping the existing per-source and total caps.
- No schema change to the JSON output; same fields fill the form.
- If `website_url` isn't set by the model and the user provided exactly one URL, default the form's website to that URL.

### Client wiring (`hub.new.tsx`)
- Add `scrapedUrls` state mirroring `files` state shape.
- New `addUrl(url)` → invokes `venture-scrape-url`, pushes chip with `reading → ready/error`.
- `draftFromFiles()` renamed `draftFromContext()`; sends both `sources` and `urls` to synth.
- Reset/remove handlers for URL chips.

## Edge cases / safety
- Reject `localhost`, private IPs, and non-http(s) schemes server-side.
- Cap total bytes ingested across files+URLs at `TOTAL_CAP` (90k) — truncate URL text first since it's noisier.
- If Firecrawl returns 402 (credits), surface a clear toast: connection needs top-up.
- Rate-limit: max 3 URL scrapes per submission; reuse cached scrape result if same URL re-added in session.

## Files touched
- `src/routes/_authenticated/dashboard/hub.new.tsx` — UI + state for URL input, rename CTA, enable logic.
- `supabase/functions/venture-scrape-url/index.ts` — NEW.
- `supabase/functions/venture-synthesize-concept/index.ts` — accept + merge `urls`.
- `supabase/config.toml` — register new function (verify_jwt = true).

## Out of scope
- Crawling multiple pages of a site (single-page scrape only).
- Saving URLs to the venture record — they're context only, same as files today.
