
# Site-Wide Copy Rewrite — For Real People, Not Founders

## The problem (verified from the current pages)

Homepage hero, `/build`, `/webinar`, `/one-on-one`, `/services`, `/facilitator`, `/contact` all read like they were written for someone who already speaks startup:

- **Jargon stack**: "The 14-Day Pivot Method," "done-with-you method," "the operator behind the method," "first channel open," "outreach going out that afternoon," "eight working sessions extending the method after your launch."
- **Insider framing**: "accelerators, courses, and raw AI," "DTC and e-commerce brands, creators, digital services, agencies and small SaaS," "Marketplace and deep tech supported too."
- **Verbose, method-first**: every section leads with the *name of the thing* instead of what the reader gets.
- **Missing the human**: no "you," no dream, no reassurance, no price you can actually feel.

Our real ICP — a nurse, a teacher, a warehouse lead, a barista, a laid-off marketer — bounces before paragraph two.

## The new voice (one-page brief we'll write against)

- **Reader**: 25–45. W-2. Wants a Plan B, a side income, or to finally open the shop / storefront / online thing they've been talking about for two years. Not a "founder." Not technical.
- **Tone**: warm, plainspoken, confident, a little bit "come on in, the coffee's on." Think a great neighbor who happens to have done this ten times.
- **Reading level**: 6th–8th grade. Short sentences. Contractions. No em-dash pileups.
- **Words we drop**: *method, framework, operator, cohort, channel, outreach, DTC, SaaS, GTM, pivot* (as a noun), *ICP, funnel, accelerator*.
- **Words we lean on**: *plan, day, morning, help, together, real, side income, first customer, your shop, your storefront, your idea*.
- **Rule**: every headline names an outcome or a feeling, not the product.
- **Rule**: price shows up early, in dollars, next to what you get.

## Before → After (voice samples so you can green-light the direction)

**Home hero eyebrow**
- Before: *The 14-Day Pivot Method · Wed, Aug 19, 2026 · Norcross, GA*
- After: *One Saturday morning in Atlanta · Aug 19 · Coffee on us*

**Home hero H1**
- Before: *The 14-Day Pivot Method. First paying customer in two weeks.*
- After: *Start your thing. Get your first paying customer in two weeks.*

**Home hero sub**
- Before: *One focused morning of The 14-Day Pivot Method — the done-with-you system quietly replacing accelerators, courses, and raw AI…*
- After: *Come spend one morning with us. We'll help you build the real thing — your side hustle, your shop, your online store — and walk out with a plan you can actually run. Not a course. Not homework. We do it with you, in the room, for $197.*

**/build hero**
- Before: *Your foundation. Live by lunch.*
- After: *One morning. One piece of your business. Done before lunch.*

**/webinar hero**
- Before: *The 14-Day Pivot Method, live on Zoom. First paying customer in two weeks.*
- After: *Can't make it to Atlanta? Do the whole thing with us over Zoom.*

**/one-on-one hero**
- Before: *Scale with Anderson's Process…*
- After: *Rather have us build it with you, one-on-one? Let's talk.*

**/services hero**
- Before: *Scale with the same Process that launched you.*
- After: *Want us to just build it? Same team. Same playbook. Handed to you finished.*

## Scope — every user-facing string across these files

1. `src/components/home/HomeFramework.tsx` — hero, old-way/new-way, "built with the method" section, "why foundation first," "what comes after," facilitator card, meta strip, all CTAs.
2. `src/routes/build.tsx` — hero, workshop card intro copy, "want it all done for you" band.
3. `src/lib/build-workshops.ts` — each workshop `title`, `oneLiner`, `walkOuts` (kept structurally identical, rewritten in plain voice).
4. `src/routes/build.$slug.tsx` — any per-workshop hero/agenda copy that's page-owned.
5. `src/routes/webinar.tsx` — hero, `HIGHLIGHTS` array, logistics card, cross-links.
6. `src/routes/one-on-one.tsx` — hero, pillars, pricing framing, CTAs.
7. `src/routes/services.tsx` — hero, service tiles, comparison copy, CTAs.
8. `src/routes/facilitator.tsx` + `src/components/facilitator/*.tsx` — hero, story, pillars, timeline, audience, CTA.
9. `src/routes/contact.tsx` — hero + helper text + success state.
10. `src/routes/schedule.tsx` — page intro + session card copy.
11. `src/components/home/AccessModeDialog.tsx` — three-mode chooser (workshop / webinar / one-on-one) labels + descriptions.
12. `src/components/site/Header.tsx` + `Footer.tsx` — nav labels, footer taglines, tiny helper text.
13. `index.html` + all `useDocumentTitle` calls — meta titles and descriptions rewritten in the same voice (still SEO-clean).
14. `src/lib/chatbot-knowledge.ts` + `supabase/functions/venture-chatbot/knowledge.ts` — the chatbot answers the same way we write, or the voice breaks the moment they ask a question.

**Out of scope**: layout, colors, components, animations, data models, prices, dates, product structure. Zero visual or functional changes — copy only.

## Brand-name policy after this pass

We keep the name **The 14-Day Pivot Method** because it's earned. But we treat it like a product's real name — mentioned **once per page, low in the fold, as the thing behind what we do** — not as the headline. Same rule for "Anderson's Process" (dropped from all H1s; allowed once in the "who's behind this" moment on `/facilitator` and in footer fine print).

## How I'll work (phased, so you can veto after each pass)

1. **Pass 1 — Home + AccessModeDialog + Header/Footer nav** (the front door). You review the live preview. If the voice is right, we continue.
2. **Pass 2 — /build + workshops data + /build/$slug**.
3. **Pass 3 — /webinar + /one-on-one + /services**.
4. **Pass 4 — /facilitator (all sub-components) + /contact + /schedule**.
5. **Pass 5 — meta titles/descriptions across every `useDocumentTitle` + `index.html`, and the chatbot knowledge files**.

At the end of each pass I re-run the banned-copy grep (`method`, `operator-led`, `channel`, `outreach`, `cohort`, `DTC`, `SaaS`) so we don't slide back.

## What I need from you before I start

Only one thing: confirm the voice samples above land. If yes, I'll start with Pass 1. If any of the six samples feel off, tell me which and how (too casual? too flat? still too "founder"?) and I'll re-cast the voice before touching a file.
