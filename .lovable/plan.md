# The Art of the Possible

A new homepage section that shows prospects — in their own language — the real businesses they could leave this workshop building. Not a static list. A living wall of ideas that makes someone lean forward and say "wait, I could do that one."

## Where it lives

Right after `<WalkInWalkOut />` and before `<WhatYouLeaveWith />`. The flow becomes:

1. Hero — the promise
2. WalkInWalkOut — the transformation
3. **NEW: TheArtOfThePossible — what you could actually build**
4. WhatYouLeaveWith — the take-home kit
5. ValueByTheNumbers — the proof
6. Facilitator + the rest

Why here: the user has just seen "what you walk out with" in the abstract. Now we make it concrete — *here are 30+ real businesses people just like you have started.* Then we move into the deliverables that get you there.

## The concept: "Pick yours."

A single section, three layers stacked, that work together:

### Layer 1 — The headline

> **Pick yours.**
> Online, on a street corner, out of your kitchen, off your phone. Real businesses real people start with under $5,000 and a weekend.

Subhead under that, plain language:
> Scroll through. Tap one. That could be you on Monday.

### Layer 2 — The category rail (sticky on scroll, horizontally scrollable on mobile)

Six pill-style filter chips that re-sort the wall below. Default is "All." Chips:

- All
- Online (laptop businesses)
- Main Street (shops & storefronts)
- Service (you go to them)
- Food & Hands (you make it)
- Side hustle to full-time
- Family-run

Selecting a chip animates the cards: the matching ones rise, the others fade and reshuffle. (CSS transitions only — no library needed.)

### Layer 3 — The marquee wall

The centerpiece. Two horizontal rows of business cards that auto-scroll in opposite directions — top row drifts left, bottom row drifts right — slow enough to read, pausing on hover so a prospect can stop and look. Each card is the same compact size so the rhythm feels like a moving billboard.

Each card shows:

- A category tag (Online / Main Street / Service / Food & Hands / etc.)
- The business name in plain English (e.g., "Mobile car detailing")
- A one-line offer ("Wash, wax, vacuum at the customer's driveway. $75 a visit.")
- A startup-cost band ("Under $1,500 to start")
- A "first 10 customers from" line ("Neighbors, apartment complexes, Facebook groups")
- A small visual icon (Lucide) keyed to the category — not a stock photo
- On hover: card lifts, gradient border glows, a thin line appears: *"Stage 2 builds your offer. Stage 6 gets you your first 10."* — connecting the dream back to the workshop

Roughly 24–30 cards total, hand-written. Examples across the spectrum:

**Online**
- Done-for-you AI inbox cleanup for small businesses
- Etsy shop: custom Cricut signs for nurseries
- Faceless YouTube channel — Atlanta history shorts
- Notion templates for small contractors
- Bookkeeping for barbershops (remote)

**Main Street**
- Mobile car detailing
- Pop-up nail bar at salons
- Pressure washing for restaurants (after-hours)
- Vending machine route — laundromats & gyms
- Hair braiding studio out of a spare bedroom (with permits)

**Service**
- Senior tech help — home visits, $60/hour
- Pet sitting & dog walking with insurance
- Notary + loan signing agent (mobile)
- Lawn care, two yards a day, route-based
- Junk hauling with a pickup truck

**Food & Hands**
- Sunday meal prep for working moms (5 meals, $90)
- Caribbean lunch plates at office parks
- Cottage-law baked goods — wedding cookie favors
- BBQ catering for office Fridays
- Cold-pressed juice subscription, weekly drop-off

**Side hustle → full-time**
- Real estate photography for Atlanta agents
- Resume + LinkedIn rewrites for career switchers
- Wedding officiant + ceremony coach
- Short-form video editing for local realtors

**Family-run**
- Saturday-morning car wash with your teenagers
- Family handyman crew — one truck, one trade at a time
- Husband-and-wife cleaning service for Airbnbs

### Layer 4 — The bridge to the workshop

Below the wall, one calm sentence on its own line:

> Every business above can be built using the same seven stages — in one day, in this room.

Then a small, soft CTA:
> **See the seven stages →** (anchor-links to FlowStrip)
> **Save your seat — only 24 spots →** (links to /register)

## Why this works for the target audience

- **Plain English everywhere.** "Mobile car detailing," not "field-service business model."
- **A dollar number on every card.** Removes the #1 fear: "I can't afford to start."
- **A first-customer line on every card.** Removes the #2 fear: "I don't know who would buy."
- **Stage callouts on hover.** Quietly proves the workshop is what gets them there — no hard sell.
- **Family-run and side-hustle categories.** Speaks directly to people who can't quit their job Monday.
- **Movement.** A static list of 30 ideas reads as a wall of text. A moving marquee reads as a city of opportunity.

## Visual direction (matches existing site)

- Same dark theme, same `bg-card` / `border-white/10` cards as the rest of the page
- Category tag uses the existing `text-gradient-brand` treatment
- Hover state uses the existing `bg-hero-gradient` glow
- Marquee rows use pure CSS `@keyframes` animation, pausing on `:hover`
- On mobile (< 768px), marquee becomes a single horizontal-scroll rail with snap points — the user swipes; no auto-scroll, so it doesn't fight their thumb

## Technical sketch

- New component `TheArtOfThePossible` in `src/routes/index.tsx`
- New data file `src/lib/business-ideas.ts` exporting a typed array:
  ```ts
  type BusinessIdea = {
    name: string;
    category: "online" | "main-street" | "service" | "food" | "side" | "family";
    offer: string;
    startupCost: string;
    firstCustomers: string;
    stageHint: string; // e.g. "Stage 2 builds your offer."
  };
  ```
- Filter state with `useState`; cards animate with CSS transitions on `opacity` / `transform`
- Marquee: two flex rows duplicating their content for seamless scroll
- Lucide icons per category (Laptop, Store, Wrench, ChefHat, Sun, Users)
- Add `<TheArtOfThePossible />` to `HomePage` between `WalkInWalkOut` and `WhatYouLeaveWith`

## Out of scope

- No new images / no AI image generation — icons + type do the work
- No carousel library — pure CSS marquee
- No changes to curriculum, schedule, register, pricing, or facilitator copy
- No backend; all data is static in `business-ideas.ts`

## Verification after build

- Load `/` at 1384px and at mobile width; confirm the marquee animates smoothly, pauses on hover, and that mobile becomes a swipeable rail (not auto-scrolling)
- Click each category chip and confirm cards re-sort with a smooth transition
- Read 5 random cards aloud — confirm a 7th-grader could explain what the business does and how much it costs to start
- Confirm the "See the seven stages" link scrolls to `FlowStrip` and "Save your seat" routes to `/register`

If you want me to build it, say go — or tell me which categories or specific business ideas to add, remove, or rewrite first.