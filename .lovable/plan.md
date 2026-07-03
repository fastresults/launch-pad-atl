
# Position the 1:1 as the market's best-value "Plan B" activator

## The angle

Most founders don't need another course — they need a **second stream of income that's actually built and live**. That's the "Plan B profit generator" hook. And at $2,799 for a full done-for-you startup (brand, site, social, systems, plan), this is priced against $8k–$25k agency builds. Say that plainly — award-winning conversion copy names the alternative and shows the gap.

Voice: Adam's. Short sentences. Concrete comparisons. No hype adjectives; specific numbers instead.

## Copy changes (all in `src/routes/one-on-one.tsx`)

### 1. Eyebrow pill (top of hero)
From: *"Done-for-you · with Adam & team"*
To: **"Your Plan B profit generator · built for you"**

### 2. H1
From: *"Skip the build. Get the business."*
To: **"Activate your Plan B."**
Gradient tail: **"We build the business. You keep the profit."**

### 3. Hero sub-paragraph — rewrite
> Your paycheck is Plan A. Your Plan B is the startup you keep meaning to launch. Adam and his creative team build it *for* you — brand, website, social channels, positioning, and systems — so your second income stream is live in weeks, not "someday."

Keep the IGNITE / Google Meet chips underneath.

### 4. New "Best value on the market" band (insert between hero and "What we build for you")
A short, high-contrast comparison strip. This is the conversion moment.

- Eyebrow: **"Best value on the market"**
- Headline: **"A $12,000 agency build. For $2,799."**
- Three tight comparison tiles:
  - **Agency build** — *$8k–$25k · 8–12 weeks · you manage the vendors*
  - **DIY (course + freelancers)** — *$3k–$6k · 3–6 months · you're the project manager*
  - **Done-for-you with Adam** *(highlighted)* — *$2,799 · 2–3 weeks · Adam and team ship it*
- Sub-line under the strip: *"Same deliverables. A fraction of the price. And we're the ones on the hook to ship."*

(Numbers are directional/anchor pricing common in the market — we don't quote a specific competitor.)

### 5. "What we build for you" — add a value line
Keep the 7 deliverable cards. Add one line under the section heading:
> *"Priced out separately with an agency, this stack lands north of $12,000. You're getting all of it for $2,799 because we've templatized the parts that should be templatized and reserved the human hours for the parts that matter."*

### 6. Contrast section — reframe headline
From: *"Same framework. Different amount of you."*
To: **"Three ways in. One is done for you."**
Keep the three tiles.

### 7. "Best fit if…" — sharpen for Plan B buyer
Replace current four with:
- *"You have a job you like — and a Plan B you keep putting off"*
- *"You'd rather pay to skip 3 months of setup than 'learn to build a brand'"*
- *"You want a real second income stream, not another Notion doc"*
- *"You want Adam personally leading the work — not a junior at an agency"*

### 8. Price / CTA card — rewrite
- Eyebrow: **"Best-value done-for-you build · limited seats each month"**
- Under the $2,799: keep *"everything included"* and add a strike-through anchor: ~~*Comparable agency build: $12,000+*~~
- Body copy:
  > A full startup build, delivered by Adam and his creative team. Priced to be the clear best value on the market — because the point is to get your Plan B *live and earning*, not to make you save up for another year.
- Primary CTA: **"Activate my Plan B"** (was "Book your build with Adam")
- Trust line: *"Limited builds per month so Adam stays hands-on. Availability is confirmed after a short intake."*

### 9. Startup ideas scroller heading — tighten to the Plan B frame
- Eyebrow: **"Pick your Plan B"**
- Heading: **"Any of these — or the specific business you're bringing"**
- Sub: *"Adam and team can build any of the startups founders are launching right now, or the specific one you have in mind. Either way, same end-to-end build."*

### 10. FAQ — add one, keep the rest
Add as first FAQ:
- **Q: Why is this so much less than an agency?**
- A: Because we've built this exact stack dozens of times. Agencies quote every project like it's brand-new; we've templatized what should be templatized (setup, structure, deploys) and spend the human hours on the parts that actually differentiate your startup — your positioning, brand, and offer.

### 11. Meta / SEO (same file, `useEffect`)
- `document.title`: **"Plan B, Built For You — $2,799 Done-For-You Startup with Adam"**
- Meta description: *"Activate your Plan B profit generator. Adam and his creative team build your startup end-to-end — brand, website, social, systems — for $2,799. The best-value done-for-you build on the market."*

## Out of scope
- No changes to workshop / webinar pages or the AccessModeDialog copy in this pass.
- No checkout wiring — CTAs continue to route to `/contact?topic=one-on-one`.
- No new imagery.

## Open question
The comparison strip uses market-anchor numbers ($8k–$25k agency, $3k–$6k DIY). Want me to keep those directional ranges, or do you have specific competitor prices you'd rather anchor against?
