
# Productize the 8 Modern Build Layer Workshops

Turn each card in the "Modern Build Layer" section into a real product: a $97 half-day workshop that teaches the strategy + gives a starter kit, with a clear path to the done-for-you agency engagement. Each workshop gets its own conversion-optimized landing page. The Build Layer grid on the homepage becomes the entry point.

## What we're building

**8 workshop products** (one per capability):
1. Brand Identity Workshop
2. Website That Converts Workshop
3. Social Presence Workshop
4. Content Engine Workshop
5. AI as Your Operating System Workshop
6. Email, CRM & Automation Workshop
7. Sales Systems Workshop
8. Legal, Financial & Operational Scaffolding Workshop

Each priced at **$97**, positioned as: *"Learn the strategy in a half-day. Walk out with the plan, the templates, and a clear decision on whether to build it yourself or have our team do it."*

## Page architecture

```text
/build/                          → index of all 8 workshops (grid)
/build/brand-identity            → individual workshop landing page
/build/website-that-converts
/build/social-presence
/build/content-engine
/build/ai-operating-system
/build/email-crm-automation
/build/sales-systems
/build/legal-financial-ops
```

Each card in the existing "Modern Build Layer" section on the homepage becomes a link to its `/build/<slug>` page.

## Individual workshop page structure

Every workshop page follows the same award-winning conversion template (consistent = trust + faster to ship + easy to A/B):

1. **Hero** — Capability name, one-line promise, $97 price chip, primary CTA "Reserve your seat — $97", secondary "Have us build it for you".
2. **The pain** — 3 bullets. What it costs founders to wing this (real numbers, real consequences).
3. **What you'll walk out with** — 5–7 concrete deliverables (templates, frameworks, a finished artifact, e.g. "your brand brief signed off" or "your 30-day content calendar built live").
4. **The agenda** — Half-day, broken into 3–4 modules with time blocks.
5. **Who it's for / who it's not for** — Two columns. Ruthless qualification.
6. **The decision moment** — Frame: leave knowing whether to DIY, hire elsewhere, or let our agency build it. No pressure, clear math.
7. **Then: the done-for-you path** — The matching agency service, scoped + priced. The $97 credits toward any project over $1,000.
8. **Workshop logistics** — Format (live online cohort), dates, group size cap, what's included (recording, templates, 30-day Slack access).
9. **FAQ** — 5–6 objection-handlers (refund, recording, AI tools used, prerequisites, comparison to free YouTube content, do I need the foundation workshop first).
10. **Final CTA band** — Price, scarcity (seats remaining or next cohort date), dual CTA.

## Workshop content map (per product)

| Workshop | Walk-out deliverables | Matching agency service |
|---|---|---|
| Brand Identity | Brand brief, archetype, voice doc, logo direction, color/type system spec | Brand & Website Build |
| Website That Converts | Sitemap, wireframe, page-by-page copy outline, conversion event plan, stack decision | Brand & Website Build |
| Social Presence | Channel-fit scorecard, profile rewrites, 30-day post calendar, hook bank, posting cadence | Marketing Engine |
| Content Engine | Pillar topics, SEO keyword map, content production system, repurposing flow, editorial calendar | Marketing Engine |
| AI as Operating System | AI stack audit, 5 workflows automated live, prompt library, governance doc, ROI model | New: AI Ops Sprint |
| Email, CRM & Automation | CRM choice, lifecycle map, 3 sequences written, segmentation plan, automation blueprint | Marketing Engine |
| Sales Systems | ICP scorecard, sales script, pipeline stages, objection bank, weekly sales rhythm | New: Sales System Sprint |
| Legal, Financial & Ops | Entity decision, contract checklist, books setup plan, payroll readiness, ops calendar | Launch Kit |

## Homepage change

The existing 8-card "Modern Build Layer" grid stays visually identical, but each card becomes a clickable `Link` to its `/build/<slug>` page, with a subtle hover state and "Workshop · $97" chip added to each card. Section heading copy stays.

A new sub-CTA under the grid: **"See all 8 workshops →"** linking to `/build`.

## Index page `/build`

- Hero: "Eight workshops. One business that actually runs."
- Sub: "Strategy is the foundation. These eight capabilities are the building. Each one is a half-day, $97 workshop — taught by the people who'd otherwise charge you $5K+ to build it for you."
- Grid: all 8 workshops as rich cards (icon, name, one-line outcome, "What you walk out with: X · Y · Z", $97 chip, "Learn more →").
- Bottom band: "Want it all done for you instead? → /services"

## Data model

Add to `src/lib/framework-deliverables.ts` (or new `src/lib/build-workshops.ts` to keep it clean):

```ts
export type BuildWorkshop = {
  slug: string;
  icon: LucideIcon;
  title: string;        // "Brand identity"
  hero: string;         // one-line promise
  pains: string[];      // 3
  walkOuts: string[];   // 5-7
  agenda: { time: string; title: string; detail: string }[];
  forYou: string[];
  notForYou: string[];
  agencyService: { name: string; priceLabel: string; href: string };
  faq: { q: string; a: string }[];
};

export const BUILD_WORKSHOPS: BuildWorkshop[] = [ /* 8 entries */ ];
```

The existing `BUILD_LAYER` array gets enriched with `slug` so the homepage cards link correctly, or is derived from `BUILD_WORKSHOPS`.

## Files to create / modify

**New:**
- `src/lib/build-workshops.ts` — content for all 8 workshops
- `src/routes/build.tsx` — index page
- `src/routes/build.$slug.tsx` — dynamic workshop page (single template, reads from `BUILD_WORKSHOPS`)
- `src/components/build/WorkshopHero.tsx`
- `src/components/build/WorkshopAgenda.tsx`
- `src/components/build/WorkshopFit.tsx` (for-you / not-for-you)
- `src/components/build/WorkshopFAQ.tsx`
- `src/components/build/WorkshopCTA.tsx`

**Modify:**
- `src/components/home/HomeFramework.tsx` — make the 8 Build Layer cards link to `/build/<slug>`, add "$97 workshop" chip, add "See all 8 workshops" sub-CTA.
- `src/lib/framework-deliverables.ts` — extend `BUILD_LAYER` entries with `slug`, or replace consumption sites with `BUILD_WORKSHOPS`.
- `src/components/site/Header.tsx` (if it has nav links) — add "Workshops" entry pointing to `/build`.
- Router registration wherever routes are wired up (check `src/routes/index.tsx`).

## Copywriting voice

20-year conversion copywriter rules applied throughout:
- Specificity over adjectives ("walk out with a signed brand brief" not "deepen your brand thinking")
- Cost-of-inaction framing in every "pain" block
- One promise per page, repeated 3x in different words
- Dual CTA everywhere: low-commitment ($97 workshop) + high-intent (book the build)
- Price anchoring: $97 next to the $2,900 build price, every time
- No hype words ("revolutionary", "game-changing", "unlock"). Concrete verbs only.

## Not in scope (this pass)

- Actual booking/payment flow for workshop registration (uses existing `/register` flow or `?workshop=<slug>` query param on existing register page — confirm in build).
- Cohort scheduling backend.
- Email automation for workshop attendees.
- Two new agency services ("AI Ops Sprint", "Sales System Sprint") — surface them on workshop pages, but adding them to `/services` as full cards is a follow-up.
