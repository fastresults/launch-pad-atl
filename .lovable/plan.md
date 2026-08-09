# Why the website PRD lost your company name and your logo

## What I verified in your venture's data

- The venture snapshot's company name is **UCG Production & Syndication Agency**.
- The brand kit has one logo, flagged `primary: true`, with the permanent URL
  `.../functions/v1/brand-logo/6948d0ec-...`.
- The generated `website_prd` (16:00 today, 17,149 chars):
  - does **not** contain the string "UCG Production" anywhere — it calls the company
    **"The Metric Network"**, a name that appears in **no** snapshot field, no brain
    material, no brain memory, and no other asset. The model invented it.
  - contains the permanent logo URL **once**, buried inside the paste-ready master
    prompt, and contains **zero** `<img ...>` tags — so nothing in the PRD actually
    renders or places the mark.

So the brand kit *was* injected; the model simply wasn't bound to it.

## The three causes

1. **The company name is a soft bullet, not a rule.** It appears once as
   `- Company: ...` in the venture preamble, while the PRD template literally says
   `# {Company} — Website PRD`. With a 120k-char prompt, the model treats that as a
   fill-in-the-blank and confabulates a nicer-sounding agency name. Nothing checks the
   output afterwards.

2. **The logo rule is written for the wrong section.** The PRD system prompt tells the
   model to reuse the logo URL "where it applies", but never requires a literal
   `<img src="...">` in the brand-tokens section or the header spec. The stricter rule
   that does demand it (`website_prd.systemExtra` in `_shared/prompt-profiles.ts`,
   which requires the token table plus a literal `<img>` tag) is only used by
   `dashboard-pipeline-run` — `venture-generate-document`, the function the Brand
   Wizard calls, never loads prompt profiles at all.

3. **Two conflicting palettes are in the same prompt.** The preamble dumps the
   snapshot's `brand_tokens` (dark: `#0A0B10 / #00E676`) while the brand kit block
   supplies the real kit (light: `#F8F8F8 / #1A4E83`). The model has to pick; it also
   learns the brand facts are negotiable. The kit header also reads "PROVISIONAL"
   because your kit status is `auto`, which further softens it.

## The fix

### 1. Bind the identity, don't suggest it
- Promote company name to a hard identity block at the very top of the prompt, above
  everything: legal/trading name, founder, one-liner, and the instruction that this
  exact string is the only name that may appear — inventing or "improving" a brand
  name is a failure.
- Replace the `{Company}` placeholder in the PRD template with the real name before
  the prompt is sent, so there is no blank to fill.

### 2. Require the logo as markup, not as a link
- Apply `profileFor(documentType).systemExtra` inside `venture-generate-document`
  (it is currently only wired into the pipeline function), so the PRD's brand-tokens
  requirements — full hex token table, font import line, literal `<img src="...">`
  logo tag — apply to every PRD generated from the Brand Wizard and the hub.
- Add the same requirement to the header spec and the master-prompt appendix, so the
  mark shows up where a builder will actually place it.

### 3. One palette, one truth
- When a usable brand kit exists, stop emitting the snapshot's `brand_tokens` in the
  preamble — the kit block is the single source. Only fall back to `brand_tokens`
  when there is no kit.
- Keep the "provisional" wording for `auto` kits, but still mark palette, fonts and
  logo as must-use-verbatim.

### 4. Catch it instead of shipping it
- After generation, run a cheap validation on `website_prd` / `presell_landing_prd`:
  the output must contain the exact company name and the permanent logo URL. If it
  doesn't, retry once with a corrective instruction naming the omission, then record
  the failure rather than silently saving a PRD with a hallucinated brand.

## Files touched

- `supabase/functions/venture-generate-document/index.ts` — identity block, profile
  `systemExtra` wiring, `{Company}` substitution, post-generation validation + retry.
- `supabase/functions/_shared/venture-context.ts` — hard identity header; suppress
  `brand_tokens` when a kit is present.
- `supabase/functions/_shared/deliverable-prompts.ts` — logo `<img>` requirement in
  the header and brand-token sections.
- `supabase/functions/venture-bulk-generate/index.ts` — same identity/profile wiring
  so bulk runs behave identically.

No database migration and no UI change.

## Verification

Regenerate the website PRD for this venture and confirm the saved content contains
"UCG Production & Syndication Agency" and at least one `<img src=".../brand-logo/...">`
tag, with no invented brand name anywhere.
