## Goal

Introduce **"The Anderson Method"** as a proper-noun brand alternative used strategically alongside **"done-with-you method"** in high-impact placements — headlines, hero subheads, and section titles — while keeping **"The 14-Day Launch Method"** as the offer name.

## The three phrases and their jobs

| Phrase | Job | Where it lives |
|---|---|---|
| **The 14-Day Launch Method** | Offer name — what you buy | Eyebrows, meta titles, agenda headers, buttons, pricing |
| **The Anderson Method** | Brand / authority handle — who's behind it | Hero headlines, section titles, quote pull-outs, one-liner reframes |
| **the done-with-you method** | Category descriptor — how it works vs. alternatives | Positioning tagline, subheads explaining the model, body copy |

Rule of thumb: **Anderson Method** answers "*whose*", **done-with-you method** answers "*what kind*", **14-Day Launch Method** answers "*what you get*." Never stack all three in one sentence.

## Where to swap in "The Anderson Method"

**Home (`src/components/home/HomeFramework.tsx`)**
- Line 100 body paragraph — reframe one sentence: "The 14-Day Launch Method is **The Anderson Method** in one focused morning — the done-with-you playbook quietly replacing accelerators, courses, and raw AI…" (keeps both phrases, each doing distinct work)
- Line 180 section title "Inside The 14-Day Launch Method" → keep (offer-name context)
- Add one authority pull-quote or eyebrow above the founder-story section: **"The Anderson Method"** as a standalone label

**Webinar (`src/routes/webinar.tsx`)**
- Line 40 hero subhead: swap the first sentence to lead with authority — "**The Anderson Method**, run live over video in a small cohort with the founder who built it." Keep the done-with-you tagline one paragraph down or in the meta.

**One-on-one (`src/routes/one-on-one.tsx`)**
- Line 86 hero H1 second clause currently reads "run for you by Adam and his team." Reframe as: "**The Anderson Method,** run for you by Adam's team." Keep done-with-you in meta description (line 70).

**Services (`src/routes/services.tsx`)**
- Line 45 H1: "Scale with **The Anderson Method** that launched you." (replaces "the same done-with-you method that launched you" in the *headline only*) — keep done-with-you in the body paragraph on line 48 so both phrases appear on the page.

**Build (`src/routes/build.tsx`)**
- Add an eyebrow or a short pull-line: "**The Anderson Method**, one morning at a time." Body paragraph on line 24 keeps "done-with-you."

**Schedule (`src/routes/schedule.tsx`)**
- Body paragraph on line 58 keeps done-with-you (it's explaining the model). No headline change needed.

**Chatbot knowledge (`src/lib/chatbot-knowledge.ts`)**
- Add a short "Brand vocabulary" block near the top of tone/guardrails:
  - Offer name: *The 14-Day Launch Method*
  - Brand/authority handle: *The Anderson Method* — use in headline-style openers, authority moments, and when contrasting Adam vs. software/agencies
  - Category descriptor: *the done-with-you method replacing accelerators, courses, and raw AI* — use in the positioning line at least once per conversation
- Update the "Always name the offer" guardrail so the assistant knows both phrases are approved and when to reach for each.

## What does NOT change

- Meta titles and URL slugs stay 14-Day Launch Method.
- Buttons, pricing labels, agenda headers, cohort/registration copy, and the funnel report stay as-is.
- The positioning tagline (*done-with-you method replacing accelerators, courses, and raw AI*) is preserved verbatim wherever it currently lives — it just isn't the only phrase carrying the hero anymore.
- Noun uses of "operator" (Adam, session lenses) are untouched.
- No visual, layout, or component structure changes.

## Verification

1. Each key page (home, webinar, one-on-one, services, build) contains **all three** phrases at least once — offer name, Anderson Method, done-with-you method — each in the role above.
2. No sentence stacks all three.
3. Meta descriptions still contain the full positioning tagline for SEO.
4. Chatbot guardrails updated.

## Out of scope

- Renaming the offer, changing pricing, restructuring pages.
- Editing the funnel report or PDF.
- Adding new hero images or components.
