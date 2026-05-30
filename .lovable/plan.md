
# Persuasion pass: free Selection cohort copy

Scope: `src/components/home/HomeSelection.tsx` and `src/components/register/RegisterSelection.tsx`. Copy + light structural additions only. No backend, no schema, no routing changes.

## Core narrative shift

Today the page reads like an announcement. The rewrite frames it as **a rare, earned seat** — six chosen from dozens — and gives every non-winner a tangible reward for applying. The new throughline:

> Dozens will apply. Six will build. Everyone who steps into the arena gets something back.

Three persuasion levers added throughout:
1. **Scarcity made real** — name the funnel out loud ("6 of dozens", "1-in-X odds shouldn't stop a founder").
2. **Loss reversal — the Finalist Offer** — applicants not selected get a meaningful discount on the next paid cohort, *after* they've watched the six launch in public. Applying becomes a no-lose move.
3. **Specific, sensory outcomes** — replace generic "build a business" lines with what the room sounds, looks, and feels like at 4:30 PM.

## HomeSelection.tsx — section-by-section rewrite

### Hero
- New eyebrow: `Atlanta · Inaugural Cohort · 6 seats · 0 cost`
- New H1: **"Six founders. One Thursday. A business that opens by Monday."**
- New subhead emphasizing stakes + the bet StartupLabs is making on Atlanta, with a one-line tease of the Finalist Offer: *"Apply by July 8. Six will be chosen. Every other applicant gets a Founder's Discount on the next cohort — after they watch the six launch in public."*
- CTA pair unchanged; second CTA label → "See what the six walk out with"

### New section: "Why applying is the move" (replaces / precedes WhyDoingThis)
Three-up grid:
- **If you're chosen** — free seat, $X in deliverables, a launched business by 4:30 PM
- **If you're not** — Founder's Discount on the next paid cohort + a front-row seat to watch the six launch (case studies, post-mortems, 90-day numbers)
- **Either way** — you forced yourself to write your idea down on paper, which is more than 99% of people who say "someday" ever do

This is the new persuasion engine. Copy will be tight, founder-voice, no hype words.

### WhyDoingThis — sharpened
Reframe from "we want proof of work" to **"we're betting on Atlanta first."** Add the line: *"We expect dozens of applications for six seats. That's the point — we want to choose from a deep bench, and we want every founder who applied to get value from the process."*

### WhatYouWalkOut — make it visceral
Keep the 7 deliverables but rewrite each as an outcome you can touch:
- "An LLC filed in your name, with the EIN in your inbox" (covering the formation deliverable while being honest about state-fee hard costs in fine print, as today)
- "A pricing page a stranger could buy from tonight"
- "A homepage live at yourdomain.com before you leave the building"
- etc.
Add a one-line value stack under the grid: *"If you bought these piecemeal from a brand studio, a dev shop, and a fractional CMO, you'd be north of $25,000 and six weeks. You'll have them by dinner."*

### WhoWereLookingFor — sharpen criteria
Same 4 cards, tighter language. Add a 5th card or a one-liner above the grid: *"We're reading every application personally. Be specific — vague applications don't make the six."*

### New section: "The Finalist Offer" (full section, between Timeline and Facilitator)
Headline: **"Not chosen? You still leave with something."**
Body:
- Every applicant not selected for the six gets a **named Founder's Discount** on the next Atlanta cohort (specific % — to confirm with the user; I'll use a placeholder of **40% off** and call it out as TBD in the diff).
- The discount activates *after* the July 23 workshop, so finalists can watch the six launch in public — read the case studies, see the websites go live, see the 90-day numbers — and then decide whether to come build their own.
- Small print: discount is single-use, transferable to one founder you recommend, valid for the next two scheduled Atlanta cohorts.

This section earns its own visual treatment (bordered card, accent gradient) because it's the unlock that makes applying rational for everyone.

### Timeline — add one row
Insert after "Selections announced": **"Founder's Discount sent to all other applicants — July 15"**. Makes the promise concrete and dated.

### BottomCTA — rewrite
Headline: **"Six seats. Dozens will apply. Yours starts with one form."**
Sub: *"Twelve minutes to apply. Decision by July 15. Either a free seat on July 23 — or a Founder's Discount and a front-row seat to the launches. There is no version of this where applying costs you."*

## RegisterSelection.tsx — copy pass

### Hero
- New eyebrow: `Atlanta · Inaugural Cohort · Application`
- New H1: **"Apply for one of the six."**
- New subhead: short, no fluff — *"Dozens will apply. Six will be chosen by July 15. Every other applicant gets a Founder's Discount on the next cohort, sent the same day. Twelve minutes, no fee, no follow-up sales call."*

### New trust strip above the form (4 bullets, replaces or augments current meta row)
- 6 seats · 0 cost · 0 strings
- Decision by July 15 — every applicant hears back
- Not chosen? Founder's Discount, same day
- One founder reads every application (Adam)

### Form intro paragraph (new, above the first field)
One sentence framing why specificity wins: *"We're choosing six from dozens — write like you're talking to one person who's rooting for you. Half-sentences and buzzwords don't make the cut."*

### Field hint polish
Tighten the `about_you`, `about_startup`, and `why_now` hints to push for specificity (e.g., for `why_now`: *"What changes in your life if you walk out July 23 with a launched business? Be concrete — money, time, freedom, a person you want to prove something to."*).

### SuccessCard rewrite
Reinforce the Finalist Offer here too — applicants finish the form already knowing the floor is "Founder's Discount", not "rejection email":
- New H2: **"You're in the running."**
- Body: *"We've got it. Between now and July 15, Adam is reading every application personally. On July 15 you'll get one of two emails — a seat for July 23, or a Founder's Discount on the next Atlanta cohort. Either way, you'll hear from us."*
- "While you wait" list: keep, but add: *"Watch your inbox on July 15 — the Founder's Discount is single-use and time-bound."*

## What I need to confirm before writing the diff

1. **Founder's Discount %** — I'll draft with **40% off the next Atlanta cohort** as a placeholder. Tell me if it should be a different number (or a flat $ amount) and I'll swap it.
2. **Validity window** — "next two scheduled cohorts" is a guess. Tell me the real window.
3. **Comparable-value number** — I'll use **$25,000+** as the piecemeal-equivalent value of the deliverables. Adjust if you want a different anchor.

If you approve as-is I'll use the placeholders above and flag them in the diff so you can swap in one place.

## Out of scope

- No changes to `applications.functions.ts`, schema, or the admin toggle.
- No new images or assets.
- No changes to the "Original" (paid) variants of Home or Register.
- No new components — all changes live inside the two files above.
