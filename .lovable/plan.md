# Goal

Two changes, no new architecture:

1. **Stop referencing the back-end AI system** anywhere the attendee can see. No "Generator" chips, no "Powered by", no "productized AI generator" language. The attendee should experience this as a guided workshop where they leave with finished artifacts — not as a tour of an AI tool stack.
2. **Rewrite every deliverable** so it (a) sounds tangible and bespoke to their business, (b) is honestly completable during the session, and (c) clearly separates "done in the room" from "configure / file / host afterward."

Particular fixes the user called out:
- "Website Copy Pack" reads like copy only. It must read as **a complete, bespoke website built for their business, ready to host**.
- The marketing kit must read as **business cards + social channel branding ready to print / configure**, not just drafts.

---

## 1. Remove all front-of-house references to the AI back-end

### `src/lib/curriculum-data.ts`
- Drop the `generators?: string[]` field from `Stage` (and remove all `generators: [...]` arrays from the 7 stages).
- Drop the `takeawayGenerator?: string` field from `Task` (and remove all 21 `takeawayGenerator:` lines).
- Keep `takeaway` — but rename it conceptually to the **artifact they walk out with**, not a framework name attribution.

### `src/routes/schedule.tsx`
- Delete the "Powered by [Generator chip]" row in each stage card header (around line 166–173).
- In the take-home strip (around line 223–234), remove the `{t.takeawayGenerator}` chip. Keep the `TAKE-HOME` eyebrow and the artifact sentence.

### `src/routes/index.tsx`
- Replace the `AIToolkit` section (the "Your AI toolkit · Twenty AI generators" block, ~lines 884–end) with a section that reframes the same idea **from the attendee's POV**: "What you walk out with" — a 3-phase recap (Foundation / Strategy / Launch) listing **tangible artifacts** (LLC packet, bespoke website, printable business cards, 90-day plan, etc.), not generators. Same visual structure (3 phase cards) so the layout/feel is preserved.
- Remove the line "Every deliverable in the workshop is the output of a productized AI generator."
- Remove any "AI-powered" phrasing that hints at a tool stack the user is being handed. AI may be mentioned once as **"we use AI to accelerate, so you finish in a day"** — never as a catalog of generators.

---

## 2. Rewrite deliverables: tangible, bespoke, workshop-completable

Rules applied to every task:
- **Deliverable line** = the concrete artifact, named for *their* business, finished in the room.
- **Take-home line** = same artifact, restated as what they leave with.
- **Follow-up line** = only the post-workshop action (file, host, configure, print, send). Add a follow-up where one is honestly needed; remove where the artifact is fully done in the room.
- Strip framework jargon ("Geoffrey Moore," "Mom-Test-style," "9-block canvas," "StoryBrand," "RevOps Stack," "Service Blueprint") from attendee-facing copy. Move that flavor into the bullets if useful — but the headline artifact reads in plain English.

### Stage-level take-homes (rewrites)

- **Form** — "Your Georgia LLC filing packet, EIN application, and signed legal kit (Terms, Privacy, Service Agreement) — all customized to your business and ready to submit. File Monday, start taking money the same week."
- **Customer** — "One named first customer, their problems priced in dollars, a 25-name prospect list pulled for your niche and zip, and a validated outreach script — ready to send tonight."
- **Offer** — "Your offer in one sentence a buyer can say yes or no to, your price backed into from real costs, and the exact number of sales you need to break even — on a one-page offer sheet."
- **Build** — "Your delivery process mapped step-by-step, the free apps that run it set up with your accounts, and your first customer's deliverable drafted and rehearsed."
- **Brand** — "Your logo, color palette, font pairing, **and a complete website tailored to your business — Home, Offer, About, Contact pages built and ready to host the moment your domain resolves.** Payments, business email, and analytics queued for one-click connection."
- **Marketing** — "Your **printable business card and flyer designed in your brand**, your social channels claimed and branded (profile copy, banner, link-in-bio), six on-brand posts and a 60-second founder video script — your full launch kit, ready to print and configure."
- **Launch** — "Your signed, dated 90-day plan (first 3 paying customers → 10 → repeatable channel), your launch-day checklist with personalized outreach drafts, and an accountability partner on next Monday's calendar."

### Task-level rewrites (21 tasks)

For each task: rewrite `deliverable` to be a tangible bespoke artifact, rewrite `takeaway` to match, and only keep `followUp` when there's a real out-of-room action.

The most important rewrites:

- **Brand → "Build the website drafts" → renamed "Build your website"**
  - deliverable: "A complete website built for your business — Home, Offer, About, Contact pages designed in your brand kit, written with your locked messaging, mobile-ready, and configured for SEO. Ready to host."
  - takeaway: "Your bespoke website — 4 pages built, branded, written, and SEO-configured in your site builder. Hosting-ready."
  - followUp: "Connect your domain and click Publish — usually under an hour once DNS resolves."

- **Marketing → "Your print and social kit"**
  - deliverable: "Printable business card and flyer designed in your brand; Instagram, LinkedIn, and one of TikTok/YouTube/X claimed with your profile copy, link-in-bio, and banner; 6 on-brand post drafts; 60-second founder video script."
  - takeaway: "Your launch creative kit — business card and flyer ready to print, social channels branded and ready to configure, 6 posts and a video script ready to publish."
  - followUp: "Send print files to your printer, schedule the 6 posts in Buffer/Later/Meta Business Suite, and record the video."

- **Brand → "Payments, email & analytics"**
  - deliverable: "Stripe (or Square) application filled out for your business; GA4 property created with your tracking snippet ready; business email on your domain set up step-by-step; welcome-email copy drafted."
  - takeaway: "Your payments, business email, and analytics — accounts created and configured to your business, queued for final activation."
  - followUp: "Finish payments KYC, install the GA4 snippet on your published site, and verify business email — typically 1–3 days."

- **Customer → "Pick your first real customer"**
  - takeaway: "Your first customer profile — one specific buyer named, their top problems priced in dollars, and where to find them."
- **Customer → "Estimate the market + write a script"**
  - takeaway: "Your market snapshot + 25-name prospect list + outreach script customized to your business."
- **Customer → "3 competitors"**
  - takeaway: "Your competitor grid + one-sentence positioning that names what makes you different."

- **Offer → 3 tasks** — takeaways become: "Your one-sentence offer", "Your first-version scope mapped sale-to-handoff", "Your pricing sheet + break-even number + payment terms."

- **Build → 3 tasks** — takeaways become: "Your business mapped sale-to-happy-customer with the apps at each step", "Your free-app accounts set up and connected", "Your first customer's deliverable drafted and rehearsed with a 5-point quality checklist."

- **Form → 3 tasks** — takeaways become: "Your GA LLC filing packet — Articles pre-filled, registered agent set, ready to submit", "Your EIN application + business-bank choice + bookkeeping tool — ready to apply", "Your signed Terms of Service, Privacy Policy, and 1-page Service Agreement customized to your business."

- **Marketing → "Core messaging kit"** — takeaway: "Your headline, 3 value props, 30-second pitch, and founder bio."
- **Marketing → "1-page marketing plan"** — takeaway: "Your 30-day marketing plan: 2 channels, weekly budget, content calendar, 3 weekly KPIs."

- **Launch → 3 tasks** — takeaways become: "Your signed 90-day plan", "Your launch-day checklist + 10 personalized outreach drafts ready to send", "Your starter CRM populated, weekly metrics defined, accountability partner booked on the calendar."

### Honesty check on each task
Before locking copy, verify each `deliverable` is something a participant can actually finish in the stated minutes with a guide. If not, soften "finished" → "drafted and ready to configure" and add a `followUp`. No deliverable should imply work that requires waiting on a third party (bank approval, domain DNS, printer turnaround) — those move to `followUp`.

---

## Files touched

- `src/lib/curriculum-data.ts` — remove generator fields, rewrite 7 stage `takeHome` strings and 21 task `deliverable` + `takeaway` (+ adjust `followUp`) per above.
- `src/routes/schedule.tsx` — delete "Powered by" row and the generator chip inside the take-home strip.
- `src/routes/index.tsx` — replace `AIToolkit` section with a "What you walk out with" recap; remove generator catalog and "productized AI generator" line.

No changes to layout, design tokens, components, navigation, or anchors.
