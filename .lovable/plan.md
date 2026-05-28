# Expand "The Art of the Possible" — bigger, bolder, 2026-ready

## What changes

**1. Double the catalog: 28 → ~60 businesses.**
Rewritten and expanded by a 20-year business-development lens for 2026, with a heavier hand on the three categories the user called out: **Online**, **Service**, and **Main Street**.

Target distribution across ~60 ideas:
- Online — ~16 (was 5)
- Main Street — ~14 (was 5)
- Service — ~14 (was 5)
- Food & Hands — ~7 (was 5)
- Side hustle → full-time — ~5 (was 4)
- Family-run — ~4 (was 3)

**2. Raise the ceiling: under $10,000 to start, real upside.**
- Headline copy changes from "*under $5,000 and a weekend*" to "*under $10,000 and a focused 90 days*."
- Disclaimer line stays — honesty matters.
- Roughly **1 in 3 cards** show monthly potential **$10k+** so a prospect can clearly see the upside without every card screaming six-figures (which would kill credibility).
- Examples of the new $10k+ tier (one or two per category):
  - *Online:* AI-receptionist / answering service for trades; fractional bookkeeping for med-spas; faceless YouTube + course funnel; AI-built micro-SaaS for property managers; done-with-you Shopify launches for makers; LinkedIn ghostwriting for execs.
  - *Service:* Junk removal with a second truck; commercial pressure washing route; mobile auto-glass replacement; epoxy garage floors; home-organization concierge for HNW households; mobile IV / wellness therapy (with a nurse partner).
  - *Main Street:* Self-pour beer/coffee kiosk in a co-working space; vending-machine route at scale (8–12 machines); micro-warehouse / 3PL for Etsy sellers; pop-up axe-throwing or golf-sim trailer; mobile car-wash franchise-style with crews.
  - *Food:* Ghost-kitchen brand on DoorDash; weekly corporate-lunch route.
  - *Side → full-time:* Real-estate drone + 3D Matterport tours; short-form video agency for med-spas; Amazon FBA wholesale.
  - *Family-run:* Two-truck handyman crew; husband-wife property-management for 20+ Airbnbs.

**3. Modern 2026 lens.**
New ideas reflect what's actually hot to start this year:
- AI as a service (inbox cleanup, receptionist, content, lead-gen) for non-tech small businesses
- Sober-curious / non-alcoholic bottle shop or pop-up
- EV-charging install referral business
- Solar-panel cleaning routes
- Tutoring / test-prep using AI tools
- Pickleball lessons + clinics
- Mobile pet grooming
- Senior-care concierge / errand running
- Faith-based event planning
- Niche newsletter + sponsorships
- Used / vintage resale on Whatnot
- Cottage-law functional baking (gluten-free, sourdough subs)
- Micro-fulfillment / 3PL for Etsy makers
- Notion + AI workflow consulting for small ops
- Sound bath / wellness pop-ups
- Mobile detailing for boats and RVs
- Faceless TikTok shop affiliate brands

**4. Randomize the order on every page load.**
Right now the cards render in the order they're declared. We'll shuffle the filtered array once per render (Fisher-Yates) using a `useMemo` keyed off the active filter, so:
- Order looks different every visit → the scrolls feel alive.
- Order is stable within a single session for a given filter → no jitter when the marquee loops or when the user re-hovers.
- The two marquee rows are filled from the same shuffled list (alternating index), so the visible diversity per row stays balanced.

**5. The two rows stay, but get more breathing room.**
With 60 ideas at ~340px wide × 2 rows, each row carries ~30 cards. The animation duration scales up proportionally (the marquee loop length stays ~the same perceived speed) — currently 60s/70s, bumping to ~110s/125s so cards remain readable as they drift.

**6. Bridge card copy updates.**
Subtle copy tweaks reflecting the bigger catalog:
- Headline stays "Pick yours."
- Subhead: "*Online, on a street corner, out of your kitchen, off your phone — or built around AI in 2026.*"
- Body: "*Real businesses real people start with under $10,000 and a focused 90 days.*"

## What stays the same

- Section position (between WalkInWalkOut and FlowStrip)
- Card structure (category chip, big gradient income stat, "Starts under $X," name, offer, "First 10 from," hover stage hint)
- Category filter chips (same 7 chips, same UX)
- Marquee mechanics: two rows, opposite directions, pause-on-hover, edge fade masks
- Mobile swipe rail
- Bridge card → "See the seven stages" + "Save your seat"
- Plain-English voice — no jargon, no buzzwords like "scalable," "leverage," "monetize"

## Files

- `src/lib/business-ideas.ts` — rewrite the list to ~60 ideas, every card with the updated `incomePotential` field. About 18 cards in the $10k+/mo tier.
- `src/routes/index.tsx` `TheArtOfThePossible` — add `useMemo` shuffle keyed off active filter; adjust subhead and body copy; bump marquee durations.

## Out of scope

- No new component, no new section, no layout changes elsewhere
- No backend, no analytics, no testimonials
- No images — icons + type continue to carry it
- Other routes (`/schedule`, `/register`) untouched

## Verification

- Reload `/` 3 times — confirm card order is visibly different each load
- Scan 10 random cards — confirm at least 3 show monthly potential of $10k+
- Read 5 cards aloud — confirm a 7th-grader can explain what the business does
- Click each category chip — confirm Online, Service, and Main Street feel meaningfully fuller than Food, Side, Family
- Confirm marquee still pauses on hover and the loop seams cleanly
- Confirm the disclaimer line still reads at a 7th-grade level

Say go and I'll ship it.