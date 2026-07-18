## Goal

Carry the Pass 1 voice — plain, warm, Plan-B friendly, 6th–8th grade reading level — into the four remaining primary marketing routes so the tone is consistent from home through conversion. Copy only. No layout, price, date, schema, or route changes.

## Voice rules (inherited from Pass 1)

- **Banned in body copy**: method, framework, operator, cohort, channel, outreach, DTC, SaaS, GTM, pivot (as a noun), ICP, funnel, accelerator, engine, stack, PRD.
- **Lead words**: plan, morning, day, help, together, side income, your business, your shop, your store, walk out, first customer, first "yes".
- **"Startup" stays** as the category word (project memory). Refer to what the reader is building as "your business" / "your side income" / "your shop".
- **"The 14-Day Pivot Method"** may appear once per page, low in the fold, as a product name — never as a verb or as the hook.
- **Adam** referenced as "Adam" or "our team". No "the operator."

## Route-by-route rewrite

### 1. `/build` — `src/routes/build.tsx`
- **Eyebrow**: drop "The 14-Day Pivot Method · 8 Working Sessions" → "Eight Saturday mornings · $197 each."
- **H1**: keep "Your foundation. Live by lunch." (already on-voice.)
- **Sub**: replace the "Old way / New way … extending The 14-Day Pivot Method" paragraph with a plain-English version — one morning, one piece of your business built with you, walk out with it done. Name the eight pieces in reader words (brand, website, content, sales script, follow-ups) instead of jargon.
- **Card chip**: "Workshop · $197" stays.
- **CTA band ("Want it all done for you instead?")**: rewrite to "Rather we just build it?" with warm sub-copy — no "playbook", no "tool stack", no "engines."

### 2. `/build/$slug` — `src/routes/build.$slug.tsx`
- Rewrite the shared hero blurb, "what you'll walk out with" intro, and closing CTA to match. Keep per-workshop `walkOuts` bullet content (data lives in `src/lib/build-workshops.ts`) but soften any jargon in the surrounding prose. Note: bullet text itself is data — if it reads jargony we flag it, but changing it is a separate content pass on `build-workshops.ts` and out of scope unless you say otherwise.

### 3. `/services` — `src/routes/services.tsx`
- Hero, sub-hero, service-tier descriptions, and closing CTA rewritten to the same warm register.
- Keep "Scale with the same Process that launched you." (user-approved).
- Swap agency-speak ("engagement", "deliverables", "stack") for "what we build for you", "what you get", "the tools we set up."

### 4. `/schedule` — `src/routes/schedule.tsx`
- Page intro + any section headings rewritten so a nurse reading on her phone gets it in one pass.
- **Do not edit** `src/lib/schedule-data.ts` session titles/descriptions in this pass — they're shared with the dashboard and confirmation email. If they need softening we do it as a follow-up so we can eyeball every surface that renders them.

### 5. `/contact` — `src/routes/contact.tsx`
- H1: keep "Get in touch" with gradient (already good).
- Sub: rewrite "Questions, concerns, or just curious how the program works?" → warmer, e.g. "Not sure which option fits, or just want to talk it through? Send a note — Adam or someone on our team writes back within one business day."
- Success state copy softened to match.
- `useDocumentTitle` description: drop "done-with-you build" phrasing → plainer.

## What doesn't change

- No component structure, props, routes, prices, dates, form fields, or schema.
- No changes to `build-workshops.ts`, `schedule-data.ts`, `curriculum-data.ts`, chatbot knowledge, emails, or SEO JSON-LD in this pass.
- Brand-name policy unchanged.

## Order of operations (once approved)

1. `/build` + CTA band
2. `/build/$slug` shared prose
3. `/services`
4. `/schedule` intro
5. `/contact` + doc title

Single build turn, parallel file edits, then a quick preview check on each route.

## Voice check — before / after samples

- Before (`/build` sub): *"Old way: hire a $10k/month agency… extending The 14-Day Pivot Method after your launch."*
- After: **"One Saturday morning. One piece of your business — your brand, your website, your sales script — built with you and done before lunch. $197 a session. No retainer, no waiting on an agency."**

- Before (`/contact` sub): *"Questions, concerns, or just curious how the program works? Drop us a note — a real person will reply within 1 business day."*
- After: **"Not sure which option fits, or just want to talk it through first? Send a note — Adam or someone on our team writes back within one business day."**

Say **proceed** and I'll sweep all four routes in one build turn.