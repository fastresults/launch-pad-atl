## Problem
Today's `website_prd` deliverable (in `supabase/functions/_shared/deliverable-prompts.ts`) produces a single, compact PRD: one paste-ready prompt, a sitemap, light page copy (H1 + sub + 3 H2s with 2–3 sentences), an SEO bundle, and a tech checklist. When founders paste it into Lovable / v0 / Bolt, the result is a thin one-pager. We want a true multi-page site brief with enough depth that the AI builder produces a real marketing site on the first paste.

## Goal
Upgrade ONLY the `website_prd` prompt so the output is:
1. A complete multi-page information architecture (8–12 pages, not just sections of a one-pager).
2. Fully-written page copy for every page (not stubs).
3. A richer paste-ready master prompt that tells the builder to scaffold all routes, components, and global elements.
4. Per-page SEO, schema.org JSON-LD, and OG metadata.
5. Conversion + trust assets (CTAs, social proof slots, FAQs, lead capture, legal).
6. Accessibility, performance, and analytics requirements.

No UI, schema, edge-function plumbing, or other deliverable types change. Same model tier, same export pipeline, same DocumentViewer.

## New Output Structure (replaces current sections 1–5)

```text
# {Company} — Website PRD

## 1. Site Strategy
   - Primary audience, JTBD, top 3 conversion goals, success metrics
   - Brand voice recap (pulled from upstream brand_tokens / messaging house)
   - Global components: header, mega-nav, footer, cookie banner, announcement bar

## 2. Information Architecture (multi-page)
   Required routes (adapt names to track, but ship ALL of these):
   - / (Home)
   - /about
   - /products  OR  /services  (index)
   - /products/[slug]  OR  /services/[slug]  — 2–4 example detail pages fully written
   - /pricing
   - /case-studies (index) + 1 fully-written case study
   - /blog (index) + 1 fully-written launch post
   - /faq
   - /contact
   - /legal/privacy, /legal/terms (short, generated)
   Sitemap shown as a tree.

## 3. Global Elements (fully specified)
   - Header nav items + CTA
   - Footer columns, newsletter capture, social links
   - 404 page copy
   - Cookie / consent banner copy

## 4. Page-by-Page Specs  (for EVERY route above)
   For each page:
   - Purpose + primary CTA + secondary CTA
   - Section list in order (Hero, Logo bar, Feature grid, Proof, Pricing, FAQ, CTA band, etc.)
   - Full copy per section: H1/H2, sub-headline, body paragraph(s), bullets, CTA labels
   - Image / illustration prompts (1–3 per page) reusing brand_tokens
   - Form fields when applicable (Contact, Newsletter, Lead magnet)
   - Internal links to other routes

## 5. SEO & Metadata (per page table)
   Columns: Route | <title> (<60ch) | meta description (<160ch) | primary keyword | secondary keywords | OG image prompt | JSON-LD schema type (Organization, Product, Service, Article, FAQPage, BreadcrumbList, LocalBusiness when local)
   Plus: robots.txt, sitemap.xml structure, canonical strategy.

## 6. Conversion & Trust
   - Lead capture strategy (where, what fields, what happens next)
   - Social proof slots (testimonials, logos, stats) with placeholder content the founder can swap
   - 6–10 FAQ Q&A pairs
   - Trust badges / certifications / guarantees

## 7. Tech & Quality Bar
   - Framework hint (React + Vite + Tailwind + shadcn unless track suggests otherwise)
   - Accessibility: WCAG 2.2 AA, focus states, alt text, semantic landmarks
   - Performance: image sizes, lazy loading, Core Web Vitals targets
   - Analytics events list (page_view, cta_click_{name}, form_submit_{name})
   - Integrations: email capture provider, analytics, CRM webhook

## 8. Paste-Ready Master Prompt  (single fenced ``` block, 900–1300 words)
   Self-contained brief for an AI website builder. Must explicitly:
   - Name every route to scaffold
   - Reference global header/footer/nav
   - Embed brand_tokens (colors, fonts, radius, mood) inline
   - Tell the builder to use the per-page copy from section 4 verbatim
   - Include the SEO + JSON-LD requirements from section 5
   - Include accessibility + performance + analytics requirements
   - End with a "Definition of done" checklist

## 9. Build Checklist
   Ordered checklist a founder can tick as the builder produces each route.
```

## Prompt Changes
- Edit only the `website_prd` entry in `SPECIALIZED_PROMPTS` (`supabase/functions/_shared/deliverable-prompts.ts`).
- Keep the existing `${QF}` footer (no citations, QUALITY_SCORE).
- Add explicit length guidance: target ~2,500–3,500 words total markdown; the paste-ready prompt itself 900–1,300 words.
- Reinforce: "Do not stub. Every page in section 4 must have complete copy. No 'TBD' or '[insert]'."
- Reuse upstream context already injected by `venture-generate-document` (brand_tokens, messaging house, value prop, competitive landscape, track) — call those out by name so the model pulls them through.

## Model Tier
Bump `website_prd` to the `pro` tier in `modelForTier` routing inside `venture-generate-document` (and `venture-bulk-generate` if it routes per-type) so the longer, structured output is reliable. If routing is centralized via `modelForTier`, add `website_prd` to the pro list; otherwise leave model selection unchanged and rely on the prompt.

## Out of Scope
- No changes to `DocumentViewer`, export formats, deep assessment, image generation, or other deliverable prompts.
- No new edge functions, DB columns, or UI.
- No changes to how the doc is surfaced in the hub.

## Verification
1. Generate / Regenerate the Website PRD on an existing venture.
2. Confirm the markdown contains sections 1–9, a sitemap tree, ≥8 fully-written page specs, a per-page SEO table with JSON-LD types, and one ~1,000-word fenced master prompt block.
3. Copy the master prompt into Lovable in a scratch project and confirm it scaffolds a multi-page site (not a one-pager).
4. Confirm DOCX / PDF / Markdown exports still render cleanly (no broken tables, no footnote markers).
