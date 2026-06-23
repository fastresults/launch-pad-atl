
## The problem with what's there now

The current "Honest Scope" section does one thing: lists what's in and what's not. It treats the "not" column as a disclaimer — small font, almost an apology. That's the wrong frame for a first-time founder.

In 2026, no startup wins on the strategic foundation alone. They win when the foundation is wrapped in a modern customer-acquisition stack: a website that converts, a social presence that compounds, content that keeps earning attention, AI woven into the operating model, and the sales/CRM machinery that turns interest into revenue. **The foundation is what makes all that machinery pay off.** Without it, every dollar spent on the build layer evaporates.

That's the story this section should tell. Right now it doesn't.

## What I'd build

Replace the current `InOutScope` block with a three-act educational section that teaches the prospect *why* the workshop matters, *what* they leave the room with, and *what comes next* — framed as a real roadmap, not a disclaimer.

### Section structure

**Eyebrow:** `THE HONEST ROADMAP`

**Headline:**
> The plan is the starting line. **The business is what you build on top of it.**

**Lede (2 sentences):**
> Every founder we've watched fail had the same problem: they skipped the foundation, then spent $50K on a website, brand, and ads that couldn't tell a coherent story. The workshop gives you the story. After that, the modern build layer — site, social, content, AI, sales — is what turns the story into revenue.

### Act 1 — Why foundation first

Three short proof points, each one line:

- **A wrong-headed brand is expensive to undo.** Logos and websites built before positioning is locked become $20K mistakes.
- **A great website with no ICP doesn't convert.** Traffic without a defined buyer is just noise.
- **AI amplifies whatever it's pointed at.** Point it at a fuzzy strategy and it scales the fuzz.

### Act 2 — What $97 gets you (the foundation)

The existing checklist, tightened:

- All 20 strategy deliverables — foundation, strategy, and launch
- Built live with Adam, for your idea — not a template
- Yours to keep forever, with a signed 90-day plan
- Working time with Adam in a small room
- Coffee and light refreshments throughout

### Act 3 — The modern build layer (what comes after)

This is the meaty rewrite. Replace the four-item "Not in the workshop" list with **eight build-layer capabilities** — each with a 1-sentence "why it matters in 2026" line. This educates the prospect that there's a real journey beyond the workshop, and quietly seeds why they'll want our services (or someone's).

| Capability | One-line why |
|---|---|
| **Brand identity** | A logo and visual system that earn trust in the first three seconds — before a single word is read. |
| **A website that converts** | Not a brochure. A revenue surface, wired to payments and analytics, that turns visitors into customers. |
| **Social presence** | Distribution you own. The channels where your buyers already scroll, primed to keep showing up. |
| **A content engine** | Ongoing posts, videos, and SEO that compound — so traffic stops costing more every month. |
| **AI as your operating system** | The unfair advantage. AI built into how you draft, design, qualify, and ship — so two people do the work of ten. |
| **Email, CRM, and automation** | The follow-up machine. Most revenue is in the second, fifth, twelfth touch — automated, on time, on brand. |
| **Sales systems** | A repeatable path from interested stranger to closed deal. Scripts, pipelines, and the playbook to run them. |
| **Legal, financial, and operational scaffolding** | LLC, EIN, contracts, books, payroll. The boring stuff that keeps you legal and bankable as you scale. |

**Closing line under the build-layer grid:**
> DIY any of it. Hire anyone. Or hand it to our team. Either way, the workshop is what makes every dollar you spend on the build layer pull its weight. **Foundation first. Build when ready.** That's not a slogan — it's the cheapest path to a real business.

CTA row underneath: `See our services →` (primary, to /services) · `Reserve a seat — $97 →` (secondary, to /register).

## Where this lands in the code

1. **`src/lib/framework-deliverables.ts`**
   - Remove `OUT_OF_SCOPE`.
   - Add `FOUNDATION_FIRST_REASONS: { title; body }[]` — the 3 Act 1 proof points.
   - Add `BUILD_LAYER: { icon: LucideIcon; title; description }[]` — the 8 capabilities above. Icons: Palette, Globe, Share2, PenTool, Sparkles, Mail, TrendingUp, Scale.

2. **`src/components/home/HomeFramework.tsx`**
   - Rewrite the entire `InOutScope` function — rename to `HonestRoadmap`. Header in `HomeFramework` swaps the call.
   - Three stacked sub-sections inside one shell: Act 1 (3-up proof points), Act 2 (the included checklist, in a primary-bordered card), Act 3 (4×2 grid of build-layer cards with icon, title, one-line "why").
   - Closing line + dual CTA row at the bottom.
   - Drop the `X` icon entirely from this section — the build layer is positive framing, not exclusion.

3. **No other files touched.** Footer, services, schedule, register stay as-is.

## Tone targets

- Educational, never preachy. Each line earns its place.
- Speak to a founder who is smart but new — no insider jargon ("CAC," "stack," "funnel," "operationalize").
- Confident but specific. "Two people do the work of ten" beats "AI improves productivity."
- The build-layer language should make a thoughtful prospect think *"I hadn't thought through all of that — and they have."* That's the conversion moment.

## Out of scope

- Pricing or schedule changes.
- Touching the 20-deliverable section above it — that work is already done and the new section builds on it cleanly.
- Adding a new `/roadmap` page. Everything lives inside the existing home section.
- Imagery or video — text + icon is enough at this resolution.

## One call before I write the final lines

**Should the closing CTA push toward `/services` (warm hand-off, gets the click on the build layer) or `/register` (book the workshop first)?** I'd actually do **both** — primary on services, secondary on register — because anyone reading this section already understands the workshop. The win is moving them toward thinking about who builds the rest. Flag if you'd rather invert that hierarchy.
