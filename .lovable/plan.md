
## The problem

The site reads like a consulting deck, not a sales page for first-time founders. The ICP here is someone with an idea who's never started a business — they don't speak "productized engagements," "deliverables," "executable plan," "operational scaffolding," or "decision frameworks." Every time we use that language, we make them feel small and we cost ourselves a $97 seat.

A 20-year conversion copywriter would do three things on this site:

1. **Cut the jargon.** Replace abstract nouns with concrete verbs and outcomes.
2. **Talk to one person.** Drop "founders" plural; speak to "you."
3. **Sell the result, not the artifact.** Nobody buys a "framework." They buy clarity, confidence, and a plan they can actually start Monday.

## What I'd change (and why)

Below is the audit. Left = what's there. Right = the rewrite direction. Final wording locked in during the edit pass.

### `src/routes/services.tsx` — hero copy (line 22)

> **Now:** "Productized engagements for founders who have the strategic foundation and need execution. Pick a package, or scope a custom engagement. Every project is run by the same team behind the $97 workshop."

> **Rewrite:** "You've got the plan. Now you need it built. Pick a package below, or tell us what you need — same team that runs the $97 workshop, doing the work for you."

Kills: "productized engagements," "scope a custom engagement," third-person "founders."

### `src/routes/services.tsx` — bottom CTA (line 79)

> **Now:** "…we'll credit the workshop fee toward any engagement above $1,000."

> **Rewrite:** "…we'll knock the $97 off any project over $1,000."

### `src/lib/framework-deliverables.ts` — package taglines

| Package | Now | Rewrite direction |
|---|---|---|
| Strategy Sprint | "Two weeks. We harden your framework into an executable plan." | "Two weeks with Adam. You walk out with a pitch deck, a financial model, and a list of investors to call." |
| Brand & Website Build | "A real brand identity and a site you can run a business from." | (Already clean — leave.) |
| Launch Kit | "We handle the legal, financial, and operational scaffolding." | "LLC, EIN, bank account, contracts, books. The boring stuff that keeps you legal — done for you." |
| Marketing Engine | "Content, creative, and outreach that fills your pipeline." | "Posts, videos, and outreach that actually bring customers in — every month, on autopilot." |

### `src/lib/framework-deliverables.ts` — deliverable descriptions (lines 20–57)

These are the six cards on the home page. They're the heart of the pitch and they're written like a McKinsey one-pager. Rewrite each to lead with the **outcome the founder feels**, not the artifact name.

| Card | Direction |
|---|---|
| Positioning statement | "One sentence that tells anyone — your mom, an investor, a customer — exactly what you do and why they should care." |
| Ideal Customer Profile | "The name, face, and wallet of your first customer. Not a 'segment.' A person you can go find on Monday." |
| Offer & pricing framework | "What you charge, why it's worth it, and the words to say when someone asks 'why so much?'" |
| Revenue model + 12-month economics | "The numbers on one page: what it costs, what you make, and the month you stop losing money." |
| 90-day go-to-market roadmap | "Your first 90 days, week by week. The next move is always on the calendar." |
| Build / hire / buy decision tree | "What to do yourself, what to pay for, and what to skip. No more guessing." |

Also retitle the cards to drop parentheticals like "(1 page)" — the headline should sell, the body should explain.

### `src/components/home/HomeFramework.tsx` — supporting copy

- Line 59 hero subhead: "Six strategic deliverables that normally cost $5,000+ from a consultant…" → "Six things a consultant would charge you $5,000 for. You get them in a morning, for $97."
- Line 63: "Coffee and light refreshments provided. When you're ready to build the brand, website, legal, or marketing — our team is here. Separate engagement, your call." → "Coffee's on us. If you want help building the brand, the site, or the legal side after — we do that too. No pressure, no pitch in the room."
- Line 114 Framework section: "Six interlocking deliverables that turn a good idea into a defensible business…" → "Six things that turn 'I have an idea' into 'I have a business.' Built for your idea — not a template. Consultants charge $5,000+. You pay $97."
- Line 257 ServicesTeaser heading: "Done-for-you consulting + creative." → "When you're ready, we'll build it for you."
- Line 350 BottomCTA body: keep the spirit, swap "working strategic foundation" → "a real plan you can start using Monday."

### `src/routes/schedule.tsx`

- Line 60 stat ribbon: "6 deliverables · in hand by 11:30" → "6 things done · before lunch"
- Line 246 footer CTA: "Complete strategic foundation and a signed 90-day plan…" → "Your full plan and a signed 90-day playbook in your hands by 11:30 AM."

### Words to ban site-wide

These don't belong in front of a first-time founder:

- productized, engagement, scope (as a verb)
- deliverable(s) — say "the thing" or name it
- framework — only when it actually is one; never as filler
- defensible — say "hard to copy" or skip it
- harden, scaffolding, operational, executable
- "Done-for-you" — fine in admin docs, weak as a headline

## Out of scope for this pass

- Facilitator page bio copy (separate voice, mostly already concrete)
- Dashboard / authenticated UI (internal tool, different audience)
- Admin / curriculum task labels (internal product copy)
- Visual design, layout, prices, deliverable count

## Technical notes

- All edits land in 4 files: `src/routes/services.tsx`, `src/routes/schedule.tsx`, `src/components/home/HomeFramework.tsx`, `src/lib/framework-deliverables.ts`.
- No schema changes, no migrations, no new components — pure copy.
- Card titles in `FRAMEWORK_DELIVERABLES` are referenced by string in `inScope` on the home page; will sanity-check after the rename so nothing reads weirdly.

## Approve to proceed, or tell me where to dial it up or down

A couple of quick calls worth making before I write the final lines:

1. **Voice register** — punchy and casual ("You've got the plan. Now you need it built.") vs. confident but more buttoned-up ("You have the plan. Now you need execution."). I'm leaning punchy for a $97 first-time-founder ICP. Say the word if you want it tighter.
2. **"Founders" vs. "you"** — I'd switch most plural "founders" to second-person "you." Flag if you want "founders" kept anywhere for SEO/positioning reasons.
