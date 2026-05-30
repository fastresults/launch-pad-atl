## Problem

The "About you" block requires pasted text to enable **Extract with AI**. If a founder only uploads a resume PDF, or only pastes a LinkedIn URL, the button stays disabled and they're stuck.

## Fix — make any single input a valid path forward

Treat the three inputs as **alternative sources**, not stacked requirements. Enable "Extract with AI" as soon as **any one** of these is present:

1. An uploaded resume file (PDF/DOCX)
2. A LinkedIn URL
3. Pasted text (≥20 chars)

### Server changes (`src/lib/discovery.functions.ts`)

Update `extractFounderFromText` (rename behavior, keep export name) so `raw_text` becomes optional. The handler branches:

- **If pasted text** is present → current AI extraction flow on that text.
- **If resume file** is uploaded (and no text) → server downloads the file from the `attendee-docs` bucket via `supabaseAdmin`, extracts text:
  - PDF: lightweight text extraction using `unpdf` (Worker-compatible, pure JS — no `pdf-parse`/native deps).
  - DOCX: send raw bytes through the AI Gateway with a "extract plain text from this DOCX" prompt as a fallback, OR ask user to paste if extraction yields nothing. Start with `unpdf` for PDFs only; for DOCX, prompt the user to paste (most common resume format is PDF anyway).
  - Then run the same AI extraction on the extracted text.
- **If only LinkedIn URL** is present → we cannot scrape LinkedIn (auth-walled). Run AI extraction with a minimal prompt: "Founder provided only their LinkedIn URL: {url}. Return an empty extracted structure but save the URL." Save the URL and show an inline hint: *"LinkedIn pages can't be auto-read. Paste your headline + experience below for best results."* — but still let them continue.

All three paths persist to `attendee_founder_profile` with the correct `source` value.

### UI changes (`src/components/brief/FounderBlock.tsx`)

- **Enable button** when `rawText.length >= 20 || filePath || linkedinUrl.trim()`.
- Button label adapts:
  - text present → "Extract with AI"
  - file only → "Read my resume"
  - linkedin only → "Save & continue"
- After successful upload, auto-trigger extraction (no need for user to also paste).
- Replace the disabled-button confusion with a small helper line under the CTA: *"Any one of the above works — upload, link, or paste."*
- Keep the optional follow-up questions (right person / unfair advantage) as-is.

### Files touched

- `src/lib/discovery.functions.ts` — accept optional `raw_text`, branch by source, add PDF text extraction.
- `src/lib/discovery.server.ts` — add `extractTextFromResumeFile(path)` helper using `unpdf`.
- `src/components/brief/FounderBlock.tsx` — relax enable condition, adaptive label, auto-extract on upload, helper copy.
- `package.json` — add `unpdf`.

### Notes

- `unpdf` is Cloudflare Worker-safe (used by TanStack/Nitro examples). No native binaries.
- DOCX support deferred — if a user uploads DOCX we surface: *"Couldn't read this DOCX. Paste the text and we'll handle the rest."* Non-blocking.
- LinkedIn-only path is intentionally light: we save the URL for admin reference but don't pretend to have extracted data.
