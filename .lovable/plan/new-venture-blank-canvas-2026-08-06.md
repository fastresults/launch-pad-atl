# New venture = blank canvas

## The problem

Starting a new venture reuses the founder's *previous* venture content:

- The intake form prefills company name, business concept, differentiation, industry, sub-industry and market scope from founder-level records (`attendee_profiles`, `attendee_business_brief`, `attendee_market_profile`) via the canonical-context hook. Those records hold whatever the founder described the first time, so venture #2 opens already describing venture #1.
- Step 1 auto-selects every readable file in the founder's unassigned library (brief captures, old scraped URLs, bio) the moment the page loads. Even though those files are no longer another venture's memory, the founder sees a pre-loaded corpus they never chose for this build — and the AI drafts from it.

Net effect: the founder is editing a copy of the old venture instead of describing the new one.

## What changes

### 1. Venture-specific fields start empty

Split canonical prefill into two buckets:

- **Founder identity — keep prefilling.** Name, email, phone, country. These belong to the person, not the venture, and re-typing them is pure friction.
- **Venture content — never prefill on a new venture.** Company name, website, business concept, differentiation, industry, sub-industry, market scope, city/region, track all start blank (market scope and country keep their neutral defaults).

The one exception: an explicit hand-off. When the founder arrives from a flow that deliberately passes content (the "start a venture from my Startup Brief" entry point, which passes `prefill` through router state), that content is honored and the card is labeled so they know where it came from, with a one-click "Clear and start fresh".

### 2. Existing memory is offered, not applied

Step 1 keeps listing the founder's reusable library, but for anyone who already has at least one venture:

- Nothing is auto-selected. Chips render in the "add" state.
- A single line above them reads: "You have N saved sources. Pick any that apply to this venture — nothing is used until you select it."
- A "Select all" affordance keeps it one click for founders who do want everything.

First-time founders (zero ventures) keep today's auto-attach, since there is no prior build to bleed in and the empty state is worse for them.

### 3. Honest empty state

With nothing prefilled, Step 1 opens on the real ask: drop a source, paste a link, or type what you're building. The AI-draft button stays disabled until there is a selected source or a typed concept, which is already the Step 1 gate.

### 4. Reset stays

The existing "reset Step 1" control keeps working and remains the escape hatch if anything does get populated.

## Technical notes

- `src/routes/_authenticated/dashboard/hub.new.tsx`: narrow the `canonicalCtx` effect to identity fields only; drop `company_name`, `business_concept`, `differentiation`, `industry`, `market_scope` from it. Remove the `ctx`-based fallbacks in the per-field reset map (`businessConcept`, `industry`) so a field reset also clears to empty. Initial `useState` values keep reading `prefill` (explicit hand-off) but no longer inherit context.
- Load the founder's existing venture count once (a `head`/`count` query against `venture_snapshots`) to decide auto-attach vs. opt-in; default to opt-in while the count is loading so nothing flashes in pre-selected.
- Gate the auto-select loop in the `listVentureSources({ orphansOnly: true })` effect on that flag; add a "Select all" handler next to the chip row.
- `fromBrief` only turns on for a real router-state hand-off, not because context happened to have an industry.
- No database or edge-function changes. `getCanonicalFounderContext` keeps its current behavior — other surfaces (profile, brief, review) still want the full merge.
