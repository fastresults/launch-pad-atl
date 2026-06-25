# Draft full venture form from uploaded documents

Today, when a user drops a PDF/TXT/MD into `/dashboard/hub/new` and clicks **Draft from N file(s)**, the `venture-synthesize-concept` Edge Function only returns a `concept` string. We populate the *Business concept* textarea and ignore everything else, even though the doc almost always contains company name, founder info, location, industry, differentiation, etc.

This plan upgrades that flow so an uploaded document like *SampleFoodBusinessPlanOklahomaState.pdf* fills out the entire form (the same fields **Fill test concept** seeds), with confidence-aware merging so we never overwrite something the user already typed.

## 1. Edge Function — `venture-synthesize-concept`

- Keep the existing input shape (`{ sources: [{ filename, text }] }`).
- Switch the prompt to ask the model for a **structured JSON object** covering every field on the form, plus a short concept paragraph. Use Gemini structured output (`response_format: json_object`) on `google/gemini-3-flash-preview`.
- Schema returned:
  ```ts
  {
    concept: string,                  // 3–5 sentences, second-person, grounded
    company_name?: string,
    differentiation_statement?: string,
    founder_name?: string,
    founder_email?: string,
    founder_phone?: string,
    city?: string,
    region?: string,                  // US state or province
    country?: string,                 // default "United States" when US address detected
    market_scope?: "local" | "regional" | "national" | "international",
    industry?: string,                // must match one of our INDUSTRIES keys
    sub_industry?: string,
    track?: "main_street" | "lifestyle" | "scalable" | "social",
    website_url?: string,
  }
  ```
- System prompt rules: only emit a field when the document clearly supports it; omit anything uncertain; never invent founder emails; map free-form industry text to the closest value in our `INDUSTRIES` list (passed in the prompt); infer `track` from cues (single-location food/retail → `main_street`, agency/freelance → `lifestyle`, VC-style scalable tech → `scalable`, nonprofit/mission → `social`); cap concept at ~120 words.
- Keep response backwards compatible: still return `concept`, just add the other keys.

## 2. Client — `src/routes/_authenticated/dashboard/hub.new.tsx`

Rewrite `draftFromFiles()`:

- Call the same Edge Function, read the full object.
- Merge into form state with a "don't clobber user input" rule:
  - For each field, only set it from the draft when the current value is empty/default (default check applies to `country`, `market_scope`, `track`).
  - Always replace `businessConcept` — but keep the existing `confirm()` guard when the user has already typed something there.
- Validate `industry` against `INDUSTRIES` keys before applying; drop if unknown.
- Validate `track` against `TRACK_KEYS`; drop if unknown.
- Update toast: `"Drafted N fields from your file — review and edit"` with the count of fields actually applied.
- Rename the button label semantics in the existing component (still reads `Draft from N file(s)`) — no UI change needed, just behavior.
- Update the dropzone helper copy under the icon from *"Drop your pitch deck, one-pager, or notes"* to *"Drop your pitch deck, plan, one-pager, or notes — we'll fill the whole form"* so users know it does more than seed the concept.

## 3. Edge cases / safety

- Large PDFs: existing client-side `extractFileText` already pulls text via `pdfjs`; no change.
- Multiple files: concatenate their text with file-name headers (already done) and let the model produce a single merged object.
- Model failure / empty object: fall back to current behavior (apply only `concept` if present) and surface a clear error otherwise.
- No schema/database changes. No new tables, secrets, or buckets.

## Out of scope

- Touching the separate `/dashboard/brief` dropzone (different flow, already handled by `brief-prefill`).
- Auto-creating the snapshot — user still clicks **Create venture** after reviewing.
