## Goal

Replace the current generic "Your facilitator" block on the homepage with a credibility-focused section that explicitly ties the facilitator (Adam Anderson) to each of the 7 workshop stages/deliverables — so prospects see that the person guiding them has actually shipped that exact thing at scale.

## Scope

Single file: `src/routes/index.tsx` (copy + structure only). No new routes, no backend, no images uploaded yet.

## Changes

### 1. Set facilitator identity
- Replace the `FACILITATOR_NAME` placeholder with **Adam Anderson**.
- Add a short positioning line under the name:
  *"Co-Founder, OPEN Interactive • 18+ years shipping for Fortune 500s, sovereign governments, and early-stage ventures."*

### 2. New section: "Your facilitator has actually done this"
Sits directly under the existing facilitator intro, above the bottom CTA band. Two parts:

**a. Credibility headline + 3 proof chips** (drawn from the resume, not invented):
- Fortune 500 delivery — Citigroup, Mayo Clinic, 3M, Disney
- National GovTech — eGov Portal, Inland Revenue, child-services case system for St. Kitts & Nevis
- Summit & brand production — Caribbean Investment Summit (CIS18 → CIS26) across 5 jurisdictions

**b. Stage-by-stage proof grid (7 cards)** — each card pairs a workshop deliverable with a concrete thing Adam has shipped:

| Stage | Deliverable you leave with | Why Adam can coach it |
|---|---|---|
| 1. Form | Legal entity + operating shell | Co-founded OPEN Interactive (US, 2009) and the St. Kitts & Nevis entity (2014); structured the region's largest public-private tech partnership. |
| 2. Customer & offer | Validated offer + pricing | 18 years productizing services for Fortune 500 buyers and government ministries. |
| 3. Market & positioning | Sovereign-grade narrative & positioning doc | Led sovereign branding and national narrative for St. Kitts & Nevis CBI; advised Expo 2020 Dubai pavilion. |
| 4. Build (operational MVP) | V1 delivery workflow + toolkit | Engineered national eGov Portal, IRS tax portal, CPS case system, and AI-powered SaaS platforms. |
| 5. Brand | Brand kit + website ready to publish | Directed Mayo Clinic Mall of America and 3M HIS Experience Centers; produced the St. Kitts-Nevis Citizen publication. |
| 6. Marketing plan & creatives (print + social) | Business card, flyer, social profiles, 6 posts, 1 video script | Ran PR, media production, and crisis communications including COVID-19 PSAs for the SKN Ministry of Health. |
| 7. Launch | Signed 30/60/90 plan + next 10 moves on the calendar | Executive Producer for 5 Caribbean Investment Summits — run-of-show, delegate ops, sponsor architecture. |

Copy each row as a compact card (stage number badge, deliverable title, one-line proof). Mobile: stack. Desktop: 2-up grid (7th card spans or sits alone in last row — pick whichever reads cleaner).

### 3. Closing credibility line
Single line above the bottom CTA band:

*"You're not getting a coach with a deck. You're getting an operator who has built the entity, shipped the platform, branded the nation, and run the summit — sitting at your table for the day."*

## Out of scope
- No headshot (none provided). Leave a tasteful initials/monogram block; user can drop in a photo later.
- No bio page, no LinkedIn link, no testimonials.
- No changes to curriculum, schedule, or register page.
- No new deliverables or scope changes — only mapping existing ones to proof.

## Verification
Read the rendered homepage in preview after the edit; confirm: name updated everywhere, 7 cards present in correct stage order, copy matches the resume (no invented clients), no layout break at 1384px or mobile.
