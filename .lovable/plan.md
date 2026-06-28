# Make the Website PRD's "Paste-Ready Builder Prompt" actually award-winning — and impossible to miss

## What's broken today
1. **Buried.** The master builder prompt lives at the bottom of the PRD as "Section 8". The reader has to scroll through 8 sections of strategy/IA/SEO to find the thing they actually paste into Lovable/v0/Bolt/Cursor.
2. **Weak.** The current spec only asks for "900-1,300 words" and a list of routes + a "definition of done" checklist. There is no design system, no image-generation instructions, no motion spec, no component library, no per-page hero art prompts. That's why the resulting builder runs feel generic, not "20-year award-winning, image-rich".
3. **Invisible.** Even though the "Copy prompt only" button now extracts the right block, nothing in the UI tells the founder *what* that block is, *how long* it is, or *where it lives in the document*.

## Plan

### A. Rewrite Section 8 into a true award-grade builder prompt
File: `supabase/functions/_shared/deliverable-prompts.ts` (the `website_prd` entry).

Replace Section 8 with a much richer spec. The Section 8 fenced block must be **1,800–2,400 words**, self-contained, and include — in this order, inside the single ``` block:

1. **Role + outcome** ("You are a senior product designer + frontend engineer building a multi-page marketing site for {Company}…"). State the award-winning bar explicitly: Awwwards / SOTD / CSSDA quality, motion-rich, accessible, Lighthouse ≥ 95.
2. **Brand tokens block** — hex colors, font families w/ fallbacks, radius, shadow scale, spacing scale, mood adjectives. Pulled inline so the builder doesn't need to re-derive them.
3. **Design system** — light + dark, semantic tokens only, Tailwind + shadcn/ui, no hardcoded colors, focus rings, AA contrast, typographic scale (display / h1-h6 / body / caption with line-heights).
4. **Component inventory** — header, mega-nav, announcement bar, hero variants (split, full-bleed, video bg, parallax), feature grid, bento grid, stat counter, testimonial carousel, case-study card, pricing table, FAQ accordion, CTA band, footer with newsletter, cookie banner, 404. Each with a 1-line behavior spec.
5. **Motion spec** — page transitions, scroll-driven reveals, hover micro-interactions, easing curves, reduced-motion fallback.
6. **Imagery spec** — for EVERY route, an inline image prompt block: hero image, 2–4 supporting images, OG image. Each prompt is 40–80 words, references brand_tokens mood + colors, and specifies aspect ratio + style ("editorial photography", "isometric illustration", "abstract gradient mesh", etc.). Tell the builder which image-gen tool to call and where to store the file (e.g. `src/assets/`).
7. **Per-route verbatim copy directive** — restate that Section 4 copy is used WORD-FOR-WORD, with the route list inlined again so the prompt is self-contained.
8. **SEO contract** — title/meta/JSON-LD per route, robots.txt, sitemap.xml, canonical strategy (inlined from Section 5).
9. **Accessibility + performance contract** — WCAG 2.2 AA, Core Web Vitals targets, image format rules, font-loading rules.
10. **Analytics + integrations** — every event name, where it fires, the email-capture / CRM / booking destinations.
11. **Definition of Done** — ≥15 items: every route shipped, header/footer on every page, brand tokens applied, all hero + supporting images generated, motion reduced-motion-safe, JSON-LD validates, sitemap + robots present, Lighthouse ≥ 95 on Perf/A11y/Best-Practices/SEO, forms validated, 404 styled, dark mode parity, no `Lorem ipsum`, no `TBD`.

Also raise the overall PRD target from "2,500–3,500 words" to "3,500–5,000 words" so Sections 1–7 stay rich enough to feed Section 8.

### B. Surface the builder prompt at the top of the document viewer (UI)
File: `src/components/hub/DocumentViewer.tsx`.

When `doc.document_type === "website_prd"`:
- Above the rendered markdown, render a **"Paste-Ready Builder Prompt"** hero panel:
  - Headline + 1-line description ("Paste into Lovable, v0, Bolt or Cursor to scaffold the full multi-page site, with images.")
  - Word count + reading-time pill (computed from the extracted block).
  - Primary button: **"Copy builder prompt"** (reuses the fixed `onCopyPrdPrompt` handler).
  - Secondary button: **"Open in new tab"** → opens a clean `<pre>` view of just the prompt (`URL.createObjectURL` of a text blob).
  - Collapsed-by-default `<details>` with a syntax-highlighted preview of the first ~40 lines so the founder sees it's real.
- Keep the existing "Copy prompt only" header button as a quick-access shortcut.

### C. Stale-doc guard
If Section 8 cannot be located (older PRDs generated before this change), show an amber inline banner in the hero panel: *"This PRD was generated before the builder-prompt upgrade. Regenerate to get the award-grade prompt."* with a "Regenerate" link wired to the existing regenerate flow.

## Out of scope
- No schema migrations. The new prompt content is encoded in the function spec; existing `venture_documents` rows can be regenerated to pick it up.
- No changes to other deliverable prompts.
- No new AI model — same `google/gemini-3-flash-preview` default; Gemini 1.5 Pro override still honored.
