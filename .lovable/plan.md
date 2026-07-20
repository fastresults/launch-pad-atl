## Fix: Stop overpromising in the "$297 gets you" list

The current list promises two things the workshop does **not** actually deliver in the room:
- "Your business bank + Stripe hooked up so revenue can actually land" — we don't open bank accounts or provision Stripe for attendees.
- "The first outreach message sent from the room — to a real prospect, from your real inbox" — we can coach the message, but we can't guarantee an attendee sends from their inbox live.

What the workshop actually ships to the dashboard (per `curriculum-data.ts` / `workshop-productization.ts`): Foundation (positioning, ICP, wedge), a Strategy Brief with personas and a 90-day GTM sequencer, brand v0, and a live landing page with a priced offer.

### Edit — `src/components/home/HomeFramework.tsx`, `HonestRoadmap` list (lines 301–308)

Replace the six-item list with an honest version tied to real dashboard artifacts:

```
"A live landing page at your domain — real URL, up before lunch, not a mockup"
"A priced offer on the page — ready to accept your first customer"
"Your Foundation on the dashboard — positioning, ICP, and wedge, sharpened with staff"
"A 90-day go-to-market plan — personas + outreach sequence you can send this week"
"Brand v0 — name, mark, and voice you can actually use Monday morning"
"A seat next to Adam and 19 other founders — coffee, snacks, and a room building alongside you"
```

### Also tighten the 3-promise magazine footnote (lines 186–206)

Line 203 currently says "Your first outreach sent from the room." Soften to a promise we control:

```
"Your first outreach written in the room. Message, list, and send button — ready before you leave."
```

Lines 191 and 197 (live page + priced offer) stay — those are real deliverables.

### Out of scope

No changes to `/build`, `/services`, chatbot knowledge, or other pages in this pass — this is a targeted honesty fix on the home hero's included-list. If you want me to sweep the same overpromises across the site after, say the word.
