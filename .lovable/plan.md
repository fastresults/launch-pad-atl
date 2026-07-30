## Goal

Produce an extraordinary, build-ready PRD for The Athletes Prayer Foundation (TAP) website — written so it can be pasted into Lovable.dev and produce an award-caliber, multi-page nonprofit site that converts high-net-worth donors.

Source of truth: TAP's Second Brain corpus (198 chunks, ~250k chars) already in the workspace — brand messaging house, executive summary, GTM plan, legal structure brief, product roadmap, launch content kit, paid ads pack, founder notes. Everything in the PRD comes from that corpus; no invented facts.

## Deliverables

1. `public/tap-website-prd.md` — the full PRD (long-form, ~20-30 sections).
2. `/mnt/documents/tap-website-prd.pdf` — same content, styled, for sharing with the founder/board.
3. Keeps the existing `public/PRD.md` in place (short version) — the new file supersedes it and I'll note that at the top.

## PRD structure

**Part 1 — Strategy**
- Mission, 501(c)(3) positioning, the "78% identity crisis" thesis
- Two revenue engines the site must serve: program subscriptions (Pro / Student / Legacy Gift) and philanthropy (major gifts, recurring, institutional partnerships)
- Donor personas: major-gift individual, athlete-alum donor, corporate/foundation sponsor, athletic director, parent — each with objections and the proof that answers them
- Trust ladder: what a $50 donor needs vs. what a $50,000 donor needs (financial transparency, board, impact metrics, named giving)

**Part 2 — Brand and art direction (award-caliber)**
- Full token set: colors with hex, typography scale, spacing, radii, motion rules
- Art direction: chiaroscuro locker-room photography, parchment texture, gold-foil detail, generous negative space
- Motion/interaction spec: scroll-reveal, sticky give bar, parallax hero, reduced-motion fallbacks
- Explicit anti-patterns: churchy clip-art, stock handshake photos, neon sports gradients

**Part 3 — Multi-page architecture**
Sitemap with a spec for each page: Home, The Time Capsule, Programs (Pro / Academy / Legacy Gift), Our Approach + Chaplain credentials, Impact & Stories, About / Board / Financials, Ways to Give (one-time, monthly, major gift, DAF, stock, planned giving, corporate matching), Partner With Us (ADs, agents, teams), Journal, Contact, plus legal/utility pages.

Each page spec includes: purpose, primary KPI, H1 and subhead, section-by-section order, copy direction with real TAP language, imagery notes, CTA hierarchy, and internal links.

**Part 4 — Donor conversion system**
- Give flow UX: amount ladder, monthly-default toggle, cover-the-fees, impact equivalencies tied to real TAP unit costs
- Major-gift path: private "Founder's Circle" page, calendar booking, downloadable case-for-support
- Forms and routing logic by role (athlete / agent / AD / parent / donor)
- Email follow-up sequences and receipting

**Part 5 — Build spec for Lovable**
- Page-by-page component inventory, responsive rules, accessibility (WCAG 2.1 AA), performance budget
- Data model for stories, programs, gift tiers, team
- Integrations: payments/donations, CRM, calendar, analytics event list
- SEO: per-page title/description, keyword targets, schema.org NonprofitOrganization + Article + FAQPage
- Launch phases with acceptance criteria per phase
- A ready-to-paste "Lovable build prompt" appendix that condenses the PRD into a single generation brief

## Method

Generate in three passes against the corpus (strategy/brand, page specs, technical/donor system) so each part gets full depth rather than a compressed single output, then assemble, QA the PDF page by page, and report anything the corpus didn't cover so you can fill it in.
