# Replace "Fill test concept" with real-website reverse-engineer

Swap the static `SAMPLE_CONCEPTS` array for a routine that picks a real startup website, scrapes it, and reverse-engineers the company name, URL, and Business concept from actual page content. No more invented brands.

## Flow

1. User clicks **🧪 Fill test concept** on `/dashboard/hub/new`.
2. Client picks a random URL from a curated seed list of ~15 real startup homepages (Linear, Vercel, Resend, Cal.com, Posthog, Retool, Supabase, Cursor, Perplexity, Granola, Attio, Beehiiv, Mercury, Ramp, Notion — homepages only, no auth-walled pages).
3. Client calls a new edge function `dev-reverse-engineer-concept` with `{ url }`.
4. Edge function:
   - Validates URL is on the allowed seed list (prevents abuse / accidental SSRF).
   - Scrapes the homepage via **Firecrawl** (`/v2/scrape`, `formats: ["markdown"]`, `onlyMainContent: true`). Firecrawl connector is required — if `FIRECRAWL_API_KEY` is missing, return a clear 400 telling the user to link the Firecrawl connector.
   - Trims markdown to ~12k chars.
   - Calls **Lovable AI** (`google/gemini-3-flash-preview`) with a tight system prompt asking it to return JSON `{ company: string, url: string, concept: string, diff: string }`, where:
     - `company` = the actual brand on the page
     - `url` = the canonical URL passed in
     - `concept` = 3–5 sentence first-person-plural Business concept paragraph (what they do, who it's for, why it matters) grounded only in the scraped content
     - `diff` = 1–2 sentence differentiation blurb (used when path is "competitor")
   - Returns the JSON.
5. Client populates `companyName`, `websiteUrl` (when path ≠ "manual"), `businessConcept`, and `diff` (when path === "competitor"). Toast: "Filled from {company}".
6. Loading state on the button (spinner + "Scraping…") while the call is in flight. Error toast on failure.

## Files

- **New** `supabase/functions/dev-reverse-engineer-concept/index.ts` — CORS, JWT-verified user, Zod-validated `{ url }`, allowlist check, Firecrawl scrape, Lovable AI structured output via `Output.object`, returns `{ company, url, concept, diff }`.
- **Edit** `src/routes/_authenticated/dashboard/hub.new.tsx` — delete `SAMPLE_CONCEPTS`, add `SEED_URLS` constant, replace button `onClick` with async handler that invokes the function, add `filling` state + spinner.

## Out of scope

- No persistent storage of scraped content, no caching layer (each click re-scrapes — fine for a dev-only button).
- No UI to paste an arbitrary URL (allowlist only, for safety).
- No changes to dropzone, voice recorder, submit flow, schema, or pricing.
- Button stays clearly marked dev-only (🧪 emoji + ghost styling) and easy to rip out later.

## Prereqs

- Firecrawl connector must be linked. If it isn't, I'll trigger the connect modal before deploying the function so the scrape works on first click.
