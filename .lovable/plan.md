
# Rebuild /services to amplify the home page Build Layer

The home page already introduces the 8 capabilities ("Modern Build Layer") and routes founders into the $97 workshops. The /services page is the *other* door on that same moment: when the founder has decided they don't want to do it themselves. Today /services is a thin grid of four legacy packages with no through-line to the 8 capabilities. We rebuild it so it mirrors the build layer card-for-card, capability-for-capability, and makes the agency engagement feel like the natural next step from the workshop.

## Strategic framing

Every section answers a single buyer question — in order:

1. *"You're talking to whom?"* — Hero re-anchors the 8 capabilities, repositioning the page as the done-for-you path.
2. *"What does done-for-you mean for each capability?"* — A capability-by-capability service grid that mirrors the build layer 1:1, each card naming the artifact you'd otherwise build yourself in the workshop.
3. *"How do you actually work?"* — A 4-step engagement process (Diagnose → Scope → Build → Hand off) so the founder knows what they're buying.
4. *"What's it cost and how do I bundle?"* — Three productized tracks (Launch, Growth, Operate) priced as bundles of capabilities, so the founder sees the smart combinations instead of à-la-carte math.
5. *"Why you?"* — Proof block: 30 years, named brands, the credit-back-the-$97 promise.
6. *"Where do I start?"* — Dual final CTA: book a call (high intent) or start with the workshop (warm).

The 4 legacy `SERVICE_PACKAGES` get retired from the page (still exported for any other consumer) in favor of this new structure.

## Page structure (top to bottom)

```text
1. Hero — re-anchor + dual CTA
2. Capability ↔ Service grid (8 cards, mirrors home build layer)
3. Three productized tracks (Launch / Growth / Operate)
4. How we engage — 4-step process
5. Proof + facilitator strip
6. Workshop ↔ Service relationship (the $97 credit promise)
7. FAQ (6 objections)
8. Final CTA band
```

## Section detail

### 1. Hero
- Eyebrow: "Done-for-you · The 8 capabilities, built by our team"
- H1: *"You shouldn't have to learn eight jobs to start one business."*
- Sub: *"You attended the workshop, or you've already decided you'd rather buy the result than build it. Either way — here's what our team ships, capability by capability, on a fixed scope and a fixed clock."*
- Dual CTA: **Book a discovery call** (primary, gradient) · **Start with the $97 workshop** (secondary)
- Quick trust row: "Used by founders shipping to Citigroup · Mayo Clinic · 3M · Disney" or similar pulled from existing facilitator bio.

### 2. Capability ↔ Service grid (the amplification)
Eight cards in a 2×4 grid, **same icons, same titles, same order** as the home page build layer. Each card carries:
- Icon + capability name (matches home)
- **One-line agency promise** (what we ship, not what the workshop teaches)
- 3 deliverables we hand over
- Starting price (e.g. "From $2,900")
- Timeline chip (e.g. "2 weeks")
- Footer link: **"Learn the strategy first — $97 workshop →"** linking to `/build/<slug>`

Example pairs (matches the 8 BUILD_LAYER items):

| Capability | Agency one-liner | Deliverables | Starts |
|---|---|---|---|
| Brand identity | "A premium brand system, shipped in 14 days." | Logo system · Voice + visual guidelines · Asset pack | $2,900 |
| A website that converts | "A revenue surface — not a brochure — wired to payments and analytics." | Site design + build · Copy · Stripe + GA4 + CRM | $4,800 |
| Social presence | "Two channels, owned. Profiles rebuilt, calendar shipped, cadence held." | Profile redesign · 30-day calendar · Cadence stack | $1,800 setup + $1,200/mo |
| A content engine | "Pillars, SEO map, and 8 anchor pieces a month — repurposed everywhere." | Editorial system · 8 anchors/mo · Repurposing flow | $2,400/mo |
| AI as your operating system | "Ten workflows rewired around AI, documented, owned by your team." | Workflow audit · 10 automations · Prompt library + governance | $4,500 |
| Email, CRM & automation | "The follow-up machine. CRM live, sequences written, deliverability fixed." | CRM setup · 3 sequences · Lifecycle automation | $3,200 |
| Sales systems | "A repeatable motion: ICP, script, pipeline, weekly rhythm." | ICP + script · Pipeline build · 30-day enablement | $3,800 |
| Legal, financial & ops | "LLC, EIN, contracts, books, payroll — done, not promised." | Entity + EIN · Contract suite · Bookkeeping setup | $1,200 |

(Final copy + prices written in implementation; numbers above are the working anchor.)

### 3. Three productized tracks
Founders don't buy 8 things at once. Bundle the capabilities into three pre-packaged engagements with anchor pricing — this is where the conversion lift happens vs. à-la-carte cards.

- **Launch Track** — Brand + Website + Legal/Ops. *"From an idea to a business you can take money for."* From $7,500 · 4–6 weeks.
- **Growth Track** *(featured)* — Social + Content + Email/CRM. *"The customer-acquisition engine, running monthly."* From $4,500/mo · ongoing.
- **Operate Track** — AI as OS + Sales systems. *"Two people doing the work of ten. Pipeline you can forecast."* From $8,000 · 30-day sprint.

Each track card lists the included capabilities (with the same icons used above so the eye connects them), the price, the timeline, the outcome, and a **Book a scoping call** CTA.

### 4. How we engage — 4-step process
Single horizontal strip with 4 numbered steps, each one sentence:
1. **Diagnose** — 30-minute call. We tell you what to buy and what to skip.
2. **Scope** — Fixed price, fixed deliverables, fixed clock. No "T&M" surprises.
3. **Build** — Weekly demos, shared workspace, your team copied on everything.
4. **Hand off** — Documented systems, recorded loom walkthroughs, 30-day support window.

### 5. Proof + facilitator strip
Reuse Adam's photo + the existing facilitator copy from the home page (compact). Add 3–5 logos or "shipped work for" line. One short founder testimonial slot (placeholder until real one lands).

### 6. The workshop ↔ service relationship
A single band that names the math:
- *"Attend the $97 workshop. Decide in the room whether to DIY or hand it to us. If you hire us for any engagement over $1,000, the $97 is credited back. Either way, you leave with the strategy."*
- Two CTAs side by side: **See all 8 workshops** (`/build`) · **Book a discovery call** (`/contact`).

### 7. FAQ (6 items)
- Do I have to take the workshop first? *(No, but it pays for itself.)*
- Can I bundle just two capabilities? *(Yes — that's what a discovery call sets.)*
- Who owns the work? *(You do. Always. Source files, accounts, everything.)*
- How fast do you start? *(Within 7 days of signed scope.)*
- What if I already have a brand / site / CRM? *(We audit, then either tune yours or rebuild — your call after diagnose.)*
- Do you take equity / revenue share? *(No. Fixed fees, clean books.)*

### 8. Final CTA band (gradient)
- H2: *"Strategy is the foundation. Execution is what makes it real."*
- Sub: One sentence restating the dual offer.
- Primary CTA: **Book a discovery call** → `/contact`
- Secondary: **Start with the $97 workshop** → `/build`

## Copywriting voice

- 20-year conversion copywriter rules: one promise per section, concrete artifacts over adjectives, dual CTA on every major band, price anchored next to scope every time.
- Mirror exact language from home where it earns trust (capability names verbatim, the "Foundation first. Build when ready." thesis, the $97 credit-back promise).
- No hype words. Verbs and outputs only.
- Every agency card states what is *shipped*, not what is *discussed*.

## Data model

New file: `src/lib/agency-services.ts`

```ts
export type AgencyService = {
  slug: string;          // matches build workshop slug
  capability: string;    // matches BUILD_LAYER.title exactly
  icon: LucideIcon;
  oneLiner: string;
  deliverables: string[]; // 3 items
  priceLabel: string;
  timelineLabel: string;
  workshopHref: string;   // /build/<slug>
  ctaHref: string;        // /contact?service=<slug>
};

export type AgencyTrack = {
  slug: "launch" | "growth" | "operate";
  name: string;
  tagline: string;
  outcome: string;
  includedSlugs: string[]; // references AgencyService slugs
  priceLabel: string;
  timelineLabel: string;
  featured?: boolean;
  ctaHref: string;
};

export const AGENCY_SERVICES: AgencyService[]; // 8 entries, ordered to match BUILD_LAYER
export const AGENCY_TRACKS: AgencyTrack[];     // 3 entries
```

Icons and `capability` strings are pulled from / kept in sync with `BUILD_LAYER` in `framework-deliverables.ts` so the home and services pages can never drift.

## Files to create / modify

**New:**
- `src/lib/agency-services.ts` — the 8 services + 3 tracks data.

**Modify:**
- `src/routes/services.tsx` — full rewrite to the structure above. Drop the `SERVICE_PACKAGES` rendering; render the capability grid + tracks + process + proof + workshop band + FAQ + final CTA.

**Untouched but referenced:**
- `src/components/home/HomeFramework.tsx` — no changes; services page mirrors its order, icons, and labels via shared data.
- `src/lib/framework-deliverables.ts` — `SERVICE_PACKAGES` export stays (in case used elsewhere) but is no longer rendered on /services.

## Not in scope (this pass)

- Real customer testimonials and logos (use restrained placeholder lines pulled from existing facilitator copy).
- Pricing experimentation / A/B variants.
- Stripe checkout for tracks (CTA still routes to `/contact` discovery call).
- A new "case studies" page.
