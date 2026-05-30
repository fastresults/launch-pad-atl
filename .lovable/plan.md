# Auto-read LinkedIn URLs (Proxycurl)

Wire up Proxycurl so that pasting a public LinkedIn profile URL auto-fills the founder profile — no upload, no copy/paste required.

## How it works

1. User pastes a LinkedIn URL in the Founder block.
2. Clicking **"Read my LinkedIn"** calls a new server function.
3. The server function hits Proxycurl's Person Profile endpoint with the URL.
4. The returned JSON (headline, summary, experiences, education, skills, accomplishments) is normalized into our existing `attendee_founder_profile.extracted` shape.
5. The same downstream summarizer runs, producing the founder-memory recap exactly like the resume/text path.
6. URL + raw JSON are also stored on `attendee_founder_profile` for traceability.

## Files

- **New:** `src/lib/linkedin.server.ts` — `fetchLinkedInProfile(url)` calls Proxycurl, returns normalized profile.
- **Edit:** `src/lib/discovery.functions.ts` — `extractFounderFromText`: when only `linkedin_url` is present, route to Proxycurl path; map result into `extracted` and persist. Keep resume/text branches untouched.
- **Edit:** `src/components/brief/FounderBlock.tsx` — change LinkedIn-only CTA label to "Read my LinkedIn", show loading state, render the same success summary as resume extraction. Light URL validation (must match `linkedin.com/in/...`).
- **No migration needed** — `attendee_founder_profile` already has `linkedin_url`, `extracted`, `raw_text`, `source` columns.

## Proxycurl integration details

- Endpoint: `GET https://nubela.co/proxycurl/api/v2/linkedin?url=<linkedin_url>&use_cache=if-present&fallback_to_cache=on-error`
- Auth: `Authorization: Bearer $PROXYCURL_API_KEY`
- Handle: 404 (profile not found / private), 401 (bad key), 402 (out of credits), 429 (rate limit) — surface a friendly error to the UI without crashing.
- Normalize fields:
  - `headline` → `extracted.headline`
  - `summary` → `extracted.bio`
  - `experiences[]` → `extracted.roles[]` (company, title, dates, description)
  - `education[]` → `extracted.education[]`
  - `skills[]` → `extracted.skills[]`
  - `accomplishment_*` → `extracted.wins[]`
- Store raw response on `attendee_founder_profile.raw_text` as JSON string for debugging/re-summarization.

## Secret

- Add `PROXYCURL_API_KEY` via `add_secret`. User gets it from https://nubela.co/proxycurl (sign up, top up credits — pricing is ~$0.01/lookup on pay-as-you-go).

## What we are NOT doing

- No LinkedIn OAuth (different scope; would only give name + headline).
- No scraping or browser automation (LinkedIn blocks it; ToS risk).
- No DOCX parsing (still deferred from previous plan).

## Sequence after approval

1. Request the `PROXYCURL_API_KEY` secret.
2. Once provided, ship the three file changes above.
3. Smoke-test with one real LinkedIn URL via the UI.