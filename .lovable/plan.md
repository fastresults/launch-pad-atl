# Tone pass: the Old Way vs. the New Way

Keep the 14-day / Adam-in-the-room outcome frame we just shipped. Layer a second voice on top of it: **there is an old way to launch a profitable business, and there is a new way — and the new way is quietly taking over.** Attendees aren't buying a workshop; they're crossing over to the side that already figured it out.

## The tone, in one paragraph

> The old way took a year, a co-founder, an agency, and a prayer. The new way takes a morning. Not because AI "does it for you" — that's the trap everyone else is selling — but because a real operator, working a real framework, can now compress what used to be twelve months of guessing into one focused session. This is how modern businesses get launched now. Adam is one of the few people actually teaching it.

Three notes it should always hit:
1. **Old way vs. new way** — name the contrast out loud. "The old way: 12 months, $40k, a co-founder, a maybe. The new way: one morning, one operator, one framework, one live business."
2. **Framework + operator, not raw AI** — the movement isn't "AI startups." It's *operator-led, framework-driven, AI-accelerated* launches. That distinction is the whole moat. Straight-AI founders stall in month two; framework founders ship.
3. **Movement language** — "quietly taking over," "how modern founders are launching now," "the new default," "the ones who figured it out first." Cultural inevitability, not a sales pitch. Never hype-y, never "revolutionary," never emoji.

## Voice rules (add to the existing copy rules)

- **Say:** "the old way / the new way," "the modern way to launch," "a framework, not a prompt," "an operator, not a chatbot," "this is how it's done now," "the founders who figured it out first."
- **Don't say:** "revolutionary," "game-changing," "disrupt," "unleash," "harness AI," "the future of," or anything that sounds like a 2021 SaaS landing page. No exclamation marks. No emoji. No "imagine if…"
- **Never** frame AI as the hero. Frame the *method* as the hero, with Adam as the person who teaches it and AI as the quiet accelerant under the hood.
- Keep sentences short. Two-beat cadence where possible ("Old way: a year. New way: a morning.").

## Surfaces getting the tone pass

Same files as the last pass — this is a second read-through, not new pages. Priorities:

1. **`src/components/home/HomeFramework.tsx`** — add a compact "Old way / New way" beat directly under the H1 or as the first section after the hero. Two columns or two stacked lines. This is the single highest-leverage placement.
2. **`src/routes/webinar.tsx`** — reframe the opening as "Come see how modern founders are actually launching now." Old-way/new-way beat in the intro.
3. **`src/routes/one-on-one.tsx`** — sharpen to: "The old way to hire this out cost $40k and six months. The new way is Adam, 14 days, flat fee." Keep the human-operator emphasis.
4. **`src/routes/build.tsx`** — post-launch scale page: "Old way to grow: hire an agency and hope. New way: Adam's operators, working the same framework that launched you."
5. **`src/routes/services.tsx`** — same treatment for the Tracks framing.
6. **`src/routes/schedule.tsx`** — the morning agenda gets a one-line lede: "This is what a modern launch morning looks like." Then the schedule.
7. **`src/routes/facilitator.tsx`** — Adam bio gains one line positioning him as one of the few people teaching this new method — not a coach, an operator who ships.
8. **`src/components/register/RegisterFramework.tsx`** — eyebrow or aside gets the movement line ("How modern founders launch now · Norcross, GA").
9. **`src/components/home/AccessModeDialog.tsx`** — subtitle above the three modes: "Three ways to launch the modern way."
10. **`src/components/facilitator/FacilitatorCTA.tsx`** — CTA sub-copy carries the "new default" note.
11. **`src/lib/chatbot-knowledge.ts`** + **`supabase/functions/venture-chatbot/knowledge.ts`** — add an "Old way vs. new way" section near the top of the corpus, plus two canned answers: "Why is this different from just using ChatGPT?" and "Why now?" Both should hit the framework + operator + movement notes without hype.
12. **`index.html`** — meta description reworded to carry the tone (still keeps the 14-day promise).

## Concrete beats to seed across the site

- **Hero sub-beat (home):** *Old way: a year, an agency, a co-founder, a maybe. New way: one morning with Adam. Fourteen days to your first paying customer.*
- **Section header option (home / register):** *This is how modern businesses get launched now.*
- **Anti-AI-hype line (used once per key page):** *AI alone gives you a folder of docs and no customers. A framework — run by an operator who's shipped — gives you a business.*
- **Movement line (footer of hero sections, or eyebrow):** *The way founders quietly started launching in 2026.*
- **One-on-one line:** *The old way to hire this out was $40k and six months. The new way is Adam, flat fee, live in fourteen days.*
- **Chatbot "why is this different from ChatGPT?" answer (draft):** *Straight AI hands you a stack of documents and calls it a business. It isn't one. Startup Labs is a framework — the sequence a business actually needs to be launched — run in the room by Adam, an operator who's shipped companies. AI does the formatting so Adam spends the morning pricing your offer, naming your first customer, and getting outreach going out that afternoon. That's the difference between a folder of PDFs and a business that takes money in 14 days.*

## What I won't change

- No new pages, no layout changes, no schema, no logic. Copy only.
- The 14-day promise, Adam-in-the-room framing, Plan-B language, pricing, and cohort details from the previous pass all stay exactly as they are. This pass sits on top of that one.
- The "startup" vs "business" noun rule and the "framework" vs "template" rule both remain in force.

## One question before I execute

The "old way / new way" beat lands hardest as a **compact visual moment on the home hero** — two short lines side-by-side or stacked, directly under the H1. That's a very small layout addition (a two-column div, no new component). Want me to add that on the home page, or keep this pass strictly to swapping words inside the existing blocks?
