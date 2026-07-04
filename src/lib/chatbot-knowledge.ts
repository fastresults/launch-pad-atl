// Static knowledge corpus for the site-wide "Ask Startup Labs" concierge chatbot.
// Kept as a single string so it can be shipped verbatim to the edge function
// and grounded on by the model. Update this file when marketing copy changes.

import {
  FRAMEWORK_STAGES,
  BUILD_LAYER,
  FOUNDATION_FIRST_REASONS,
  TOTAL_DELIVERABLES,
  WORKSHOP_PRICE_LABEL,
} from "@/lib/framework-deliverables";
import { AGENCY_TRACKS, AGENCY_SERVICES, getAgencyService } from "@/lib/agency-services";

function stagesBlock(): string {
  return FRAMEWORK_STAGES.map((s) => {
    const items = s.items
      .map((i) => `  - ${i.title}: ${i.tooltip}`)
      .join("\n");
    return `### ${s.number} · ${s.name}${s.bonus ? " (Bonus)" : ""}\n${s.intro}\n${items}`;
  }).join("\n\n");
}

function buildLayerBlock(): string {
  return BUILD_LAYER.map(
    (b) => `- **${b.title}** — ${b.subtitle} ${b.description}`,
  ).join("\n");
}

function foundationBlock(): string {
  return FOUNDATION_FIRST_REASONS.map((r) => `- ${r.title} ${r.body}`).join("\n");
}

function tracksBlock(): string {
  return AGENCY_TRACKS.map((t) => {
    const included = t.includedSlugs
      .map((slug) => getAgencyService(slug)?.capability ?? slug)
      .map((c) => `  - ${c}`)
      .join("\n");
    return `### ${t.name}${t.featured ? " (most popular)" : ""}
- Tagline: ${t.tagline}
- Outcome: ${t.outcome}
- Includes:
${included}
- Pricing: ${t.priceLabel}
- Timeline: ${t.timelineLabel}
- CTA: ${t.ctaHref}`;
  }).join("\n\n");
}

function servicesBlock(): string {
  return AGENCY_SERVICES.map((s) => {
    const deliv = s.deliverables.map((d) => `  - ${d}`).join("\n");
    return `### ${s.capability}
- One-liner: ${s.oneLiner}
- Deliverables:
${deliv}
- Pricing: ${s.priceLabel}
- Timeline: ${s.timelineLabel}
- Half-day workshop route: ${s.workshopHref}
- Done-for-you contact: ${s.ctaHref}`;
  }).join("\n\n");
}


export const CONCIERGE_KNOWLEDGE = `# Startup Labs — Concierge Knowledge Base

## What Startup Labs is
Startup Labs is Atlanta's founder-first startup workshop. In one morning (8:45–11:30 AM),
founders walk in with an idea and walk out with a complete strategic foundation for their
startup — ${TOTAL_DELIVERABLES} tangible **startup assets** across eight categories, plus a signed
90-day plan. Facilitated live by Adam Anderson, serial entrepreneur (OPEN Interactive;
work shipped for Citigroup, Mayo Clinic, 3M, Disney).

Positioning: Atlanta's #1 startup accelerator for Main Street **and online** founders —
cafés, salons, trades, local services, indie brands on one side; DTC and e-commerce brands,
creators, digital services, agencies and small SaaS on the other. Marketplace and deep tech
supported too.

## Price & offer
- **${WORKSHOP_PRICE_LABEL}** — Strategic Foundation Workshop, all ${TOTAL_DELIVERABLES} startup assets, kept forever.
- Coffee and light refreshments included.
- Full support during and after the workshop, available if you want it.
- 7-day refund: if you don't get value, email within 7 days for a no-friction refund.

## Event logistics
- Date: Thursday, July 23, 2026
- Time: 8:45 AM – 11:30 AM
- Location: Norcross, GA (metro Atlanta)
- Seats: 20 per cohort, one cohort at a time.

## The 34 startup assets you leave with
Every asset is generated live from your idea, market, and numbers — then refined with you in the room.

${stagesBlock()}

## Why foundation first (before you spend on brand, site, ads)
${foundationBlock()}

## Legal Setup (Georgia) — inside your dashboard
Under Foundation you'll find a step-by-step **Legal Setup** walkthrough for forming
your business in Georgia:
1. Choose entity (LLC recommended for most).
2. Check + reserve name on the GA Corporations Division (ecorp.sos.ga.gov).
3. Pick a Registered Agent (self, cofounder, or a paid service).
4. File Articles of Organization with the GA Secretary of State ($100 online).
5. Get your Federal EIN (FEIN) from the IRS (free, ~10 minutes online).
6. Generate your Georgia-specific Operating Agreement.
7. Post-formation: annual $50 registration each April 1, business bank account,
   local city/county licenses.
This is guidance, not legal advice — complex situations should see a Georgia attorney.

## The modern build layer — what comes next (optional, after the workshop)
Eight additional capabilities. Each is a separate half-day workshop (from ${WORKSHOP_PRICE_LABEL}) OR
our team can build it done-for-you.
${buildLayerBlock()}

## Done-for-you Tracks (/services)
The workshop gives you the strategic foundation. The **Tracks** on /services are how our team
builds it — brand, site, systems — done-for-you. You do NOT have to attend the workshop first;
Tracks stand alone. Three named Tracks, each a curated bundle of the individual services below:

${tracksBlock()}

## Individual done-for-you services (/services)
Every capability in the build layer is also available on its own — pick just what you need.
Each has a starting price; Tracks are bespoke and scoped in a 20-min discovery call.

${servicesBlock()}


## Two equal default tracks — pick the one that fits
- **Main Street Startup** — cafés, salons, fitness studios, trades, local services, indie products, solo professional practices.
- **Online / DTC / Digital** — DTC and e-commerce brands (Shopify, Amazon, marketplaces), creators and info products, digital services and agencies, small SaaS and subscription products.
- **Also supported** — marketplaces, deep tech, and social-impact startups (specialized tracks; ask if this fits you).

## The Founder Playbook (post-workshop)
After the workshop, every founder gets access to a dashboard with:
- **Brand Wizard** — two paths: bring your existing logo/site (we ingest via Firecrawl) or generate a new brand kit (logo, palette, type).
- **Social Studio** — agency-grade channel kits (Instagram, TikTok, LinkedIn, Facebook) with previewable assets. Gated behind Brand Wizard.
- **Content Studio** — 1:1 social advertisements generated from your 90-Day Content Calendar, organized week-by-week in an accordion.
- **Concept Studio / Epiphany Engine** — refine and rewrite deliverables with feedback (typed or voice).
- **Founder Playbook + Roadmap** — a prominent summary of everything the workshop derived, with priorities and next moves.
- **Budget & Pro Forma** — with a short intake gateway to collect the numbers we need before generating.
- **Rewrite with feedback** — every generated deliverable can be regenerated with a feedback dialog (mic + text).

## Deep dives
Every startup asset ships with an on-demand **Deep Dive** — a partner-grade extended analysis (assumptions, pressure-tests, risks, 30/60/90 actions) attached beneath the asset summary. No footnotes, no citations.


## Common questions (canned answers)
- **What do I leave with?** All ${TOTAL_DELIVERABLES} startup assets, editable and yours forever, plus a 90-day plan you can run Monday.
- **Do I need a business idea already?** Yes — bring the idea and the intention. We handle the strategy, math, and copy.
- **What if I already have a logo/website?** Great — Brand Wizard has a track that ingests existing assets so nothing gets thrown away.
- **Is this good for a Plan B / side hustle?** Yes. Most founders come from a full-time job and want a plan they can act on evenings and weekends.
- **Is this good for a licensed trade (electrician, plumber, salon)?** Yes — the Main Street Startup track is built for exactly this.
- **Is this good for an online store, DTC brand, creator, or digital service?** Yes — the Online / DTC / Digital track covers Shopify/Amazon brands, creators and info products, digital services and agencies, and small SaaS.
- **Refunds?** 7-day no-friction refund by email.
- **Is Adam actually in the room?** Yes. He sits at your table for the session — not a moderator, not a TA.
- **Do you take equity?** No. It's a flat ${WORKSHOP_PRICE_LABEL} workshop fee.
- **Is there follow-up support?** Yes — full support available during and after; also 30 days of group-channel access on any half-day build workshop.
- **Can your team build the brand/site/ads for me later?** Yes — see /services. Every workshop capability has a done-for-you equivalent.
- **What's the Launch Track?** Our done-for-you sprint that gets a new founder from idea to invoicing: brand identity, a website that converts, and legal/financial/operational scaffolding. Bespoke, priced after a 20-min discovery call. See /services.
- **What's the Growth Track?** The customer-acquisition engine: social presence, content engine, and email/CRM/automation. Monthly retainer, bespoke — our most popular Track. See /services.
- **What's the Operate Track?** Leverage for a small team: AI as your operating system + sales systems. 30-day sprint, bespoke. See /services.
- **How much does the done-for-you build cost?** Tracks are bespoke and priced after a 20-min discovery call at /contact?intent=discovery. Individual services have starting prices listed on /services (e.g. brand identity from $2,900, website from $4,800).
- **Do I have to attend the workshop before hiring your team?** No. Tracks and individual services stand alone. The workshop is recommended if you don't yet have strategic clarity; if you do, go straight to /services.
- **How do I register?** Go to /register and reserve one of the 20 seats. Cohorts fill.
- **What if I miss this cohort?** Join the waitlist; a new cohort opens next.
- **What if I need help right now?** Email through /contact and we'll route you personally.

## Tone & guardrails
- Speak plainly, founder-to-founder — confident, no fluff, no jargon, no emojis.
- Never invent pricing, dates, guarantees, outcomes, or funding promises.
- Never give legal, tax, medical, or financial advice — point them to /contact or a qualified pro.
- If a question is off-topic (weather, sports, unrelated companies), redirect politely to what Startup Labs can help with.
- If a question isn't covered here, say so and offer to route them via /contact.
- Keep answers under ~180 words unless the user asks for depth. Prefer short paragraphs or tight bullets.
- Refer to the things founders leave with as "startup assets," never "deliverables."
- Refer to the thing they're building as "your startup," never "your business."
- Refer to the workshop structure as a "framework," never a "template."
`;

