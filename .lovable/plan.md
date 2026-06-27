# Why your resume didn't parse

The network log tells the whole story. The `founder-extract` edge function returned:

```json
{"extracted":{"headline":"%PDF-1.3","roles":[],"skills":[],"industries":[]}}
```

`%PDF-1.3` is literally the first 8 bytes of a PDF file. That means the function read the PDF as raw bytes and never actually extracted the text — so the AI saw binary garbage, gave up, and the only "text" it could latch onto was the PDF file header.

## Root cause

`supabase/functions/founder-extract/index.ts` has a `downloadResumeText` helper that does this:

```ts
const buf = new Uint8Array(await data.arrayBuffer());
const decoder = new TextDecoder("utf-8", { fatal: false });
const txt = decoder.decode(buf);  // ← decoding PDF binary as UTF-8
return txt.replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, " ")...
```

PDFs are not UTF-8 text. They're a compressed binary container. UTF-8 decoding strips out everything readable and leaves only the file-format header (`%PDF-1.3`), which is exactly what we saw in the response.

The irony: we already have a working PDF extractor — `venture-source-extract` uses Gemini's file-attachment mode for PDFs and `mammoth` for DOCX. `founder-extract` was built before that and never got upgraded.

## The fix

Replace `downloadResumeText` in `founder-extract` with the same extraction logic used by `venture-source-extract`:

1. **PDF** → send to Gemini as a file attachment (`type: "file"` with base64 data URL) and ask it to extract verbatim text. Handles both text-based and scanned PDFs (Gemini OCRs scanned pages automatically).
2. **DOCX** → `mammoth.extractRawText`.
3. **TXT / MD / RTF** → decode as UTF-8 (RTF gets a control-word strip).
4. **PNG / JPG / WebP** → Gemini OCR via `image_url`.

Then the existing AI call that builds the founder profile will see real resume text instead of `%PDF-1.3`, and `headline`, `roles`, `skills`, `industries`, `wins` will populate correctly.

Bonus: we'll also write the extracted resume text into `attendee_founder_profile.raw_text` so the canonical context (snapshot-brain / loadVentureContext) picks it up downstream — right now even if extraction worked, the raw text was only used transiently and discarded.

## Files to change

- `supabase/functions/founder-extract/index.ts`
  - Replace `downloadResumeText` with a proper multi-format extractor (lift the helpers from `venture-source-extract/index.ts`: `bytesToDataUrl`, `geminiTranscribe`, mammoth import, RTF/TXT branches).
  - On successful extraction, include the extracted text in the upsert payload as `raw_text` (only when `raw_text` wasn't already supplied by the user) so canonical context can use it.
  - Keep the existing 18 KB truncation when feeding the extraction model.

No frontend changes. No schema changes. No new env vars (`LOVABLE_API_KEY` is already in scope).

## Verification

After deploy, upload the same resume again from Tell-us-about-you. Expected:
- `founder-extract` returns an `extracted` object with a real `headline` (e.g. "Founder & CEO, OPEN Interactive") and populated `roles`, `skills`, `industries`, `wins`.
- `attendee_founder_profile.raw_text` contains the resume text.
- The "Tell us about you" panel renders the extracted bullets instead of staying blank.
