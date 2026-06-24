
# Founder context + market scope + industry, plus a downloadable Website PRD

Two related additions:

1. **Capture richer founder + market context up front** so every downstream document (and the deep-research pass) is grounded in *where* and *who* the business is for, not just *what*.
2. **Add a Website PRD** — a 21st document type that compiles the brief into a copy-pasteable prompt for AI website builders (Lovable, v0, Bolt, etc.), plus markdown copy blocks.

## 1. Founder + market intake

Add a second "Founder & market" step on `hub.new.tsx` between the path picker and the concept block. Fields:

| Field | Why | Notes |
|---|---|---|
| Founder full name | Used in pitch deck, executive summary, legal brief | required |
| Founder email | Contact block in PRD, pitch, About page | required |
| Founder phone | Optional, surfaces in legal/governance docs | optional |
| City / town | Drives "local market" research queries | required |
| State / region | Disambiguates city, regulation context | required |
| Country | Default `US`; needed for currency, regulation, market size | required |
| Market scope | `local` / `regional` / `national` / `international` — drives competitor + market research scope | required, radio |
| Industry | Searchable lookup against a curated NAICS-style list (~250 entries) with free-text fallback for novices | required, combobox |
| Sub-industry / niche | Free text, autopopulated suggestions from the chosen industry | optional |

**Industry lookup**: ship a static `src/lib/industries.ts` with a flattened NAICS 2-digit + common modern categories ("SaaS", "DTC ecommerce", "AI tooling", "Local services", etc.). Searchable `Command` combobox (shadcn pattern already in the project). Novices type "coffee shop" → matches "Food & beverage › Cafés". Free-text allowed as a fallback so we never block.

**Persistence**: extend `venture_snapshots` with columns:

```text
founder_name, founder_email, founder_phone,
city, region, country,
market_scope ('local'|'regional'|'national'|'international'),
industry, sub_industry
```

All optional at the DB layer; the form enforces "required" for the inputs marked above.

## 2. Deep research uses the new context

`venture-deep-research` currently builds search queries from concept keywords only. With the new context it generates much more targeted queries:

- Local mode → `"<industry> in <city>, <region>"`, `"best <industry> <city>"`, scrape Google Maps-ish results via Firecrawl search, and prefer competitors with addresses in the same metro.
- Regional/national/international → existing flow, but Perplexity prompt is anchored: *"Analyze the <industry> market in <country>. Focus on segments operating at <scope> scale…"*.
- Industry passed into both competitor discovery and market analysis so we stop pulling generic "alternatives" results when the founder is opening a bakery.

Implementation: a new helper `buildQueries(snapshot)` that branches on `market_scope` and `industry`. Same artifact pipeline, better inputs.

## 3. Website PRD as document #21

Add a new `venture_document_types` row:

```text
type:           website_prd
name:           Website PRD (AI-builder prompt)
category:       Marketing
sort_order:     14   (between Marketing Plan and Financial Model)
dependencies:   [value_proposition, brand_messaging, customer_personas, go_to_market_plan]
estimated_minutes: 3
```

The generator (`venture-generate-document` + `venture-bulk-generate`) already injects `extracted_data` + `research_brief` + upstream docs. For this doc the system prompt is specialized to output a PRD-prompt structure rather than a free-form essay:

```text
# {Company} — Website PRD

## 1. Paste-ready prompt for an AI website builder
A single fenced ``` block containing a self-contained prompt — company,
audience, market scope, industry, value prop, pages, sections, tone,
CTA, brand voice. Roughly 400-600 words. Reads as instructions.

## 2. Sitemap
- Home, About, Services/Product, Pricing, Contact, Blog (as relevant)

## 3. Page-by-page copy blocks
For each page: H1, sub-headline, 3 sections with H2 + 2-3 sentence body,
single primary CTA. Markdown only, no fluff.

## 4. SEO bundle
Title (<60c), meta description (<160c), 8-12 target keywords tuned to
the local market when scope = local, og-image prompt.

## 5. Tech checklist
Forms needed, analytics, integrations (Stripe? Calendly? booking?),
legal pages, accessibility notes.
```

Founder gets it via the existing document viewer; the **Copy** and **Download .md** buttons already work, so a one-click download as `website-prd.md` is free. We'll add a third button **"Copy prompt only"** that extracts the fenced section #1 so they can paste straight into Lovable/v0/Bolt.

## 4. Review step shows the new fields

The review step currently shows four `extracted_data` sections. We'll add a top "Founder & market" card with the new structured fields, editable, saved back to `venture_snapshots` (not `extracted_data`, since these are first-class columns now).

## Files changed

```text
supabase migration         → add 10 columns to venture_snapshots
supabase migration         → insert website_prd row into venture_document_types
supabase/functions/venture-deep-research/index.ts
                           → buildQueries(snapshot) using city/region/scope/industry
                           → Perplexity prompt includes geo + industry
supabase/functions/venture-bulk-generate/index.ts
                           → specialized system prompt branch when documentType === 'website_prd'
                           → inject founder/location/market fields into every prompt
src/lib/industries.ts      → curated industry list (new)
src/components/hub/IndustryCombobox.tsx
                           → Command-based searchable picker (new)
src/routes/_authenticated/dashboard/hub.new.tsx
                           → new "Founder & market" form section above the path picker
src/lib/foundersHub.functions.ts
                           → createSnapshot signature extended; new updateFounderContext()
src/routes/_authenticated/dashboard/hub.$snapshotId.tsx
                           → editable founder/market card in ReviewStep
                           → document viewer: "Copy prompt only" button when type === 'website_prd'
```

## Open choices for you

1. **Required vs optional at submit** — should founder name, city, region, country, market scope, and industry all be hard-required to create a venture, or required-but-can-defer-until-review? Hard-required gives best research quality; deferred is friendlier for someone exploring an idea.
2. **Industry list scope** — ~150 entries curated for solo founders / SMBs (cleaner, faster), or full NAICS 2-digit + 3-digit ~1,100 entries (more precise, more noise)?
3. **Website PRD inclusion in bulk run** — generate it as part of "Generate all 21", or keep it as a one-click "Generate website PRD" button on its own (so non-website ventures don't pay for it)?
4. **Phone number** — collect it, or skip until the founder explicitly asks for legal/governance docs that need it?
