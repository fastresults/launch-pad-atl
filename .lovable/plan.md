## What's actually true (confirmed)

By the end of the morning, the founder leaves with:

- **Brand** — name, positioning, voice, the one-page story, why customers pick you. **Not** a logo, palette, or type system.
- **Product** — one offer, priced, with the reason it costs that.
- **Marketing** — the actual copy and structure of the page, plus the First-50 named prospect list and the exact outreach scripts. **The site is built after. No message is sent in the room.**
- **Operations** — how money comes in, what happens after the yes, the weekly rhythm, and the working assets a banker or first hire reads in 60 seconds.

The site currently claims **"page live at your domain," "first message sent from your inbox," "before you leave," "two weeks to first revenue"** across the home hero, landing hero, both chatbot corpora, and several routes. Those are overclaims. This sweep replaces every one of them.

## The honest hook (this is the upgrade, not a downgrade)

The precision *is* the pitch. Every other program sends you home with notes. This one sends you home with the finished words.

**Hero line (verbatim, home + landing):**
> You leave with the four foundations written, not outlined: your brand, your priced offer, your page copy, and the way the business runs.

**Supporting line:**
> Not a summary of what to write. The actual words — ready to build on the same week.

## The four pillars (verbatim, identical on all surfaces)

- **Brand** — Your name, your positioning, and the way you sound. Locked in the room, in the words you'll use everywhere.
- **Product** — One offer, priced, with the reason someone pays that number written in plain English.
- **Marketing** — The real copy and structure for your page, plus fifty named prospects and the exact message to send each one.
- **Operations** — How money comes in, what happens after the yes, and the working assets a banker or first hire reads in 60 seconds.

## Files and the exact replacements

**`src/components/home/HomeFramework.tsx`**
- Hero deck: replace "page live, offer priced, first message sent" with the hero line + supporting line above.
- Atlanta claim callout: keep the callout, change its proof tail to "— brand, offer, page copy, and operations, all written before lunch."
- Lead-in above the deliverables grid: `Four foundations get written with you this morning. Not outlined. Written.` followed by the four pillar lines verbatim.
- Contrast eyebrow: `Accelerators work on your pitch. Incubators work on your idea. We work on the four things a business stands on — and you leave holding all four in writing.`

**`src/components/landing/LandingFramework.tsx`** — same hero line, same four pillars, verbatim. Free / 3-seat framing, August 20, reserve-by August 10 all unchanged.

**`src/lib/chatbot-knowledge.ts`** and **`supabase/functions/venture-chatbot/knowledge.ts`** (must move in lockstep)
1. Every "we actually build your startup" (~6) → "we write the four foundations your startup runs on — brand, product, marketing, operations — with you, in the room."
2. New "The four foundations" section above the FAQ, with the four pillar lines verbatim.
3. FAQ "What actually gets built in the room?" replaced with:
   > Four foundations, written with you. Brand: your name, positioning, and voice. Product: one offer, priced, with the reason it costs that. Marketing: the real copy and structure for your page, plus fifty named prospects and the exact message for each. Operations: how money comes in, what happens after the yes, and the assets behind it. The site goes up and the messages go out in the days after — with everything already written.
4. Delete "first outreach sent from your inbox," "page live at your domain," and "before you leave" from every outcome claim.
5. "Fourteen days to first revenue" → "Everything you need for first revenue inside fourteen days" (target, not guarantee).
6. Tone rules, appended:
   > Never claim anything is published, sent, or live at the end of the morning. What exists is written: brand, priced offer, page copy, prospect list, outreach scripts, operating assets. Never say plan, blueprint, framework, playbook, roadmap, spec, or documents for the offer.

**Overclaim sweep across the rest of the site** — `src/routes/index.tsx`, `build.tsx`, `webinar.tsx`, `register.tsx`, `RegisterFramework.tsx`, `AccessModeDialog.tsx`, `LandingAccessModeDialog.tsx`: same three phrases removed and replaced with the pillar language. `/one-on-one` and `/services` keep their done-for-you claims — those genuinely do ship a built site.

## Out of scope

Pricing, dates, layout, components, chat UI, edge function logic, and the done-for-you service claims.

## Verification

Grep all touched files for `page live`, `live page at your domain`, `first message sent`, `first outreach sent`, `before you leave`, `build your startup`, `blueprint`, `roadmap` — expect zero outside `/one-on-one` and `/services`. Confirm the four pillars appear identically in home, landing, and both corpora. Build, then open the concierge on the landing page and ask "what do I walk out with?" to confirm the honest answer comes back.
