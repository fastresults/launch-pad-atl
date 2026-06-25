## Goal

Break the chicken-and-egg: once a document is uploaded, a single **Process document** action populates every field on the page (everything except Track), then the **Create & enrich** button unlocks automatically.

## Changes

### 1. Rename + reframe the upload action — `src/routes/_authenticated/dashboard/hub.new.tsx`

- Rename the "Draft from N file(s)" button to **"Process document"** (with a `Sparkles`/`Wand2` icon).
- Promote it from a small ghost button beside the concept textarea to a **primary CTA inside the dropzone card**, shown as soon as at least one file is `ready`.
- While processing, show "Processing your document…" with a progress hint ("Reading → Extracting → Filling fields").

### 2. Make extraction fill *everything except Track* — same file + `supabase/functions/venture-synthesize-concept/index.ts`

Today `draftFromFiles` already calls `venture-synthesize-concept` and maps results, but it intentionally **skips fields the user has already typed**. After Process, we instead:

- Map the full structured payload into: company name (or website URL), business concept, differentiation, founder name / email / phone, city, region, country, market scope, industry, sub-industry.
- For any field the model couldn't infer, fall back to safe defaults so the form is always submittable:
  - `country` → "United States"
  - `marketScope` → "local"
  - `founderName` / `founderEmail` → pulled from the signed-in user's profile/auth metadata
  - `city` / `region` → left blank only if neither doc nor profile has them (highlighted, see step 4)
- Keep Track untouched — user picks it.

### 3. Scanned-PDF fallback — `venture-synthesize-concept`

If the client-extracted text is shorter than ~50 useful characters (scanned PDF, image-only deck), the edge function falls back to Gemini vision OCR on the original file bytes before synthesising. Prevents the silent "nothing happened" case that's currently leaving fields empty.

### 4. Surface what's still needed — `hub.new.tsx`

- After processing, show a small **"Filled from your document"** summary card listing which fields were populated and which (if any) still need a human touch.
- Replace the silent `disabled` on **Create & enrich** with a tooltip listing the exact missing fields (e.g., "Pick a Track" / "Add city").
- Auto-scroll + pulse-highlight any still-missing field.

### 5. Order of operations on the page

```text
Upload doc  →  [Process document]  →  fields auto-fill  →  Pick Track  →  [Create & enrich]
```

The legacy ghost "Draft from N files" button next to the concept textarea is removed to eliminate the duplicate path.

## Out of scope

- No backend/data-model changes beyond the edge function update.
- Track inference is intentionally left to the user (per request).
- "🧪 Fill test concept" dev helper stays as-is.