
## Problem

Today the "Paste a link" tab treats every URL the same. The scraped text is fed to `venture-synthesize-concept`, which happily pulls the company name, founder name, email, phone, website, city, and region out of it and auto-fills the form. If a founder pastes a link they only meant as inspiration (e.g. "I want a coffee shop like Blue Bottle"), the intake ends up half-populated with Blue Bottle's identity — and the founder has to notice and undo it.

## Recommendation

Let the founder tag each URL with an intent, and honor that intent both in the UI and in the model prompt.

### 1. UI change — intent chip on every URL

In the "Paste a link" section of `hub.new.tsx`, add a small two-way toggle next to the URL input (and on each already-added URL chip):

```text
This link is:  ( • My own site / doc )  ( ○ A pattern to learn from )
```

- **My own site / doc** (default when path === "own", or when hostname matches a `websiteUrl` the founder typed) — current behavior. Fully mined for identity + content.
- **A pattern to learn from** — the site is used for *structure, model, positioning language, category cues* only. Identity fields (`company_name`, `founder_*`, `website_url`, `city`, `region`, `country`) are never populated from it.

A helper line under the toggle: *"Pattern links help us understand the kind of startup you want. We won't copy their name, address, or contact info — you'll enter yours below."*

Also add a persistent banner above the concept preview whenever any pattern URL exists:

> One or more links are marked **pattern only**. Fill in your own startup name, location, and contact fields below — we won't take them from those sites.

### 2. Data model — tag URLs before they hit synthesis

Extend `ScrapedUrl` and the payload sent to `venture-synthesize-concept`:

```ts
type UrlIntent = "own" | "pattern";
// per-URL: { url, title, text, intent: "own" | "pattern" }
```

`readyUrls` becomes two lists when calling the edge function:

```ts
supabase.functions.invoke("venture-synthesize-concept", {
  body: {
    sources: [...],
    urls: readyUrls
      .filter(u => u.intent === "own")
      .map(u => ({ url, title, text })),
    patternUrls: readyUrls
      .filter(u => u.intent === "pattern")
      .map(u => ({ url, title, text })),
    conceptDraft,
    industryValues,
  },
});
```

Also persist the intent onto the venture source row (add a small `metadata.intent` field on `uploadVentureSource` for URL-kind rows) so the source chip in "Your source memory" shows a "Pattern" badge on subsequent visits and downstream generators can respect it.

### 3. Edge function change — pattern-aware prompt

In `supabase/functions/venture-synthesize-concept/index.ts`:

- Accept a new `patternUrls` array alongside `urls`.
- Render it in a separate labeled block:

  ```text
  PATTERN REFERENCES (use ONLY for shape/model/positioning — DO NOT copy identity):
  ### Blue Bottle Coffee (https://bluebottlecoffee.com)
  <text>
  ```

- Add explicit rules to the system prompt:

  > When PATTERN REFERENCES are present, treat them as inspiration only. NEVER populate `company_name`, `founder_name`, `founder_email`, `founder_phone`, `website_url`, `city`, `region`, or `country` from a pattern reference. Use them to infer `industry`, `sub_industry`, `market_scope`, `track`, and the *style* of the concept paragraph — but the concept must be written as the founder's own new startup (use "we" / a placeholder like "our shop" if no name is given), not a description of the reference brand.

- Keep the existing behavior for `urls` (founder's own site) and `sources` (uploaded docs) unchanged.

### 4. Guardrails on the client after synthesis

Even with a good prompt, defense-in-depth in `draftFromFiles`:

- If **only pattern URLs** are present (no own-site URL, no uploaded doc containing the founder's name), skip `setIf` for the six identity fields regardless of what the model returns.
- Show a toast: *"Filled industry, market, and concept from your pattern link — add your startup name, location, and contact below."*

### 5. Smart default for intent

Auto-preselect `pattern` when:
- The URL's hostname matches a well-known brand list (optional, low priority), OR
- The founder has already typed a `websiteUrl` in Step 2 and the pasted URL's hostname is different.

Otherwise default to `own`. Founder can always flip it.

## Files to change

- `src/routes/_authenticated/dashboard/hub.new.tsx` — add intent to `ScrapedUrl`, toggle UI on the Link tab + URL chip, banner, split payload, post-synthesis guard, "Pattern" badge on memory chips.
- `src/lib/venture-sources.ts` — pass an optional `intent` into the metadata written by `uploadVentureSource` for URL-kind rows.
- `supabase/functions/venture-synthesize-concept/index.ts` — accept `patternUrls`, render as its own labeled block, extend `SYSTEM_PROMPT` with the "no identity from pattern references" rule.

## Out of scope

- Changing how uploaded files (PDF/DOCX/etc.) are treated — those stay "own" by definition.
- Downstream generators (`venture-generate-*`) — they read from the snapshot fields the founder confirms, so once Step 3 is right they don't need to know about the pattern tag. A follow-up could pass the pattern label through into brand/website generation for richer style transfer.
