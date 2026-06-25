## Goal
Give founders a faster on-ramp to the Startup Brief: drop in one or more existing documents (deck, one-pager, business plan, notes, recording), and the AI pre-fills all 10 brief questions. The user then just **reviews and edits** each answer instead of writing from scratch.

## Where it lives
On `/dashboard/brief`, above the existing wizard. Shown as a dismissible banner **only when the brief is mostly empty** (≥ 7 of the 10 QA fields are blank). Once the user has typed real answers it gets out of the way — they can still re-open it from a small "Have existing docs? Pre-fill from them" link at the bottom of the question card.

## User flow
1. Banner card: **"Skip the typing. Drop your deck, one-pager, or notes — we'll fill in the answers."** with a drop zone + "Choose files" button.
2. Accepted files: **PDF, DOCX, PPTX, TXT, MD, RTF, PNG/JPG (screenshots of slides), MP3/M4A/WAV/WEBM (voice memos)**. Up to **5 files**, **20 MB each** (Lovable upload cap), reject anything else with a clear inline message.
3. Files upload → progress strip per file (Queued → Extracting → Reading → Done / Failed). Failures are surfaced inline; other files keep going.
4. When extraction finishes, server calls the AI with the combined text and returns a draft for the **10 QA fields**. Frontend opens a **"Review what we found" sheet** listing all 10 questions side-by-side:
    - Per question: the AI's suggested answer in an editable textarea, a small **source-snippet quote** ("from deck-v3.pdf, p.4") so the user trusts it, and a per-row **Use / Skip** toggle.
    - Top actions: **Use all & continue**, **Use selected only**, **Discard**.
5. Accepting writes each chosen answer through the existing `updateBriefField` server function (same path the wizard already uses) and drops the user on the wizard at **question 1** with the answers already populated, so they can step through and refine. The standard block checkpoints still run.
6. The two non-QA blocks (Founder, Market) are **not** prefilled — they're separate intake; mention that in the success toast so the user knows there's more to do.

## Technical design

### New Edge Function: `supabase/functions/brief-prefill/index.ts`
- Auth: requires the user's Supabase JWT (same pattern as `venture-extract-concept`, `venture-transcribe`).
- Body: `multipart/form-data` with up to 5 `files[]`. Server-side guards: count ≤ 5, each ≤ 20 MB, MIME allow-list above.
- Extraction (per file, server-side, all in the same function to keep one round trip):
    - PDF → `pdf-parse` (npm:) text extraction.
    - DOCX → `mammoth` (npm:) `extractRawText`.
    - PPTX → unzip + read `ppt/slides/*.xml` text nodes (lightweight, no native lib).
    - TXT/MD/RTF → decode as UTF-8 (strip RTF control words for `.rtf`).
    - Images (PNG/JPG) → Lovable AI Gateway `google/gemini-2.5-flash` vision with `image_url` content block, prompt: "transcribe all visible text and describe diagrams in plain language."
    - Audio → Lovable AI Gateway `/v1/audio/transcriptions` with `openai/gpt-4o-mini-transcribe` (the same provider already wired in `venture-transcribe`).
- Concatenate everything into a `sources` array of `{ filename, page?, text }`.
- One AI call to **Gemini** (`google/gemini-3-flash-preview`) with AI SDK `Output.object`. Schema = the 10 BRIEF_FIELDS, each `{ answer: string, source_filename: string, source_snippet: string, confidence: "high" | "medium" | "low" }`. Prompt instructs: "Answer each in the founder's voice, ≤ 2 sentences (or the natural length the field calls for); if the docs don't say, return an empty string and confidence 'low'. Never invent facts." Allow empty strings — never fabricate.
- Response: `{ suggestions: Record<BriefFieldKey, { answer, source_filename, source_snippet, confidence }>, sourceFiles: string[], warnings: string[] }`.
- Errors: surface 400 (bad file), 413 (too big), 402/429/500 verbatim to the client with a readable message.

### Server client wrapper
Add `prefillBriefFromDocs(files: File[])` to `src/lib/brief.functions.ts`. Returns the suggestions object. (Multipart POST; reuse the auth helper used by `voice.functions.ts`.)

### New UI components
- `src/components/brief/BriefPrefillDropzone.tsx` — banner + native drag/drop using HTML5 `dragenter/over/leave/drop` (no new dependency); shows file pills with per-file status. On success calls `onSuggestions(suggestions)`.
- `src/components/brief/BriefPrefillReview.tsx` — `Sheet`/`Dialog` listing the 10 questions with editable textareas, source-snippet caption, per-row Use/Skip checkbox, header actions (Use all, Use selected, Discard). On confirm, iterates and calls `updateBriefField` once per accepted field, then closes.

### Wizard integration (`src/routes/_authenticated/dashboard/brief.tsx`)
- When `mode === "question"` and `answeredCount < 4`, render `<BriefPrefillDropzone />` above the question card.
- After `<VoiceField />`, render a small text link **"Have existing docs? Pre-fill from them →"** that opens the dropzone in a dialog regardless of `answeredCount`.
- Suggestion-accept path writes values into local state immediately (so the wizard reflects them), then awaits `refetch()`; on success show `toast.success("We filled in {n} answers — review them and tweak as needed.")`.

## Out of scope
- No new database tables. We don't persist the raw uploads; extracted text + suggestions live only in the request/response. If we want history later, that's a follow-up.
- No changes to the Founder or Market blocks. They stay typed-only for now; surface that in the success toast.
- No changes to the existing voice mic flow.

## Verification
Playwright at 1280×1800 against `/dashboard/brief`:
1. Drop a small PDF (sample one-pager) into the zone — confirm the per-file pill goes Queued → Extracting → Done, the review sheet opens with 10 editable rows and source snippets, "Use all & continue" fills the wizard, and the progress bar advances.
2. Drop an unsupported file (`.zip`) — confirm an inline error and no upload attempt.
3. Drop a 25 MB file — confirm the size guard rejects it inline.
4. Open the review sheet, deselect a row, accept — confirm only the selected fields populate; the deselected field stays empty in the wizard.
