# Goal

The "Seven stages. One working day." cards on `/` currently show one prose paragraph per stage labeled "You walk out with." The user is right — prose blurs the line between *finished in the room* and *still needs filing / hosting / configuring*. We need to separate those two things on every card, name each artifact precisely, and cut anything that isn't honestly completable in the seven hours.

## What changes

Each of the 7 stage cards gets two clearly labeled lists instead of one paragraph:

1. **DONE IN THE ROOM** — concrete artifacts finished during the workshop, named precisely.
2. **YOU FINISH AT HOME** — the exact follow-up action and a realistic time window (file, host, configure, print, send).

This same structure replaces the prose "You walk out with" block on the `/schedule` stage headers too, so the message is identical everywhere.

## Per-stage rewrite

### 1. Form
- **In the room:** Articles of Organization pre-filled in your GA SOS account · EIN application completed and submitted (number issued in-session) · Business-bank shortlist + bank application checklist filled · Terms of Service, Privacy Policy, and 1-page Service Agreement customized to your business · Local license and sales-tax requirements documented
- **At home:** Submit Articles + filing fee (10 min) · Open the bank account (1–7 days) · File local business license / sales-tax registration once entity is approved

### 2. Customer
- **In the room:** 1-page profile of your first named buyer with their top 3 problems priced in dollars · 25-name prospect list exported to CSV · Outreach script customized to that buyer · 3-competitor grid + your one-sentence positioning
- **At home:** Send the script to your 25 prospects and run 5 discovery calls within 2 weeks

### 3. Offer
- **In the room:** Your one-sentence offer locked · First-version scope mapped sale-to-handoff · Pricing sheet with real cost per sale, break-even number, and payment terms
- **At home:** Nothing — Stage 3 finishes in the room

### 4. Build
- **In the room:** Sale-to-happy-customer map with the app at each step · Free-app accounts created (project hub, files, scheduling, business email alias) · Your first customer's deliverable drafted and rehearsed end-to-end · 5-point quality checklist
- **At home:** Run the rehearsed deliverable past your first paying customer · Upgrade to paid app tiers as revenue justifies

### 5. Brand (most important to clarify)
- **In the room:** Logo, 4-color palette, and font pairing in your brand-kit folder · A complete website built in your site builder — Home, Offer, About, Contact pages designed in your brand, written in your voice, mobile-checked, on-page SEO filled (title, meta, H1, image alts) · Stripe (or Square) application filled out · GA4 property created with tracking snippet copied · Business-email provider chosen with MX setup steps documented
- **At home:** Buy the domain and point DNS (15 min + propagation) · Click Publish on the website (under an hour once DNS resolves) · Finish Stripe KYC (1–3 days) · Install the GA4 snippet on the published site · Verify business email on your domain

### 6. Marketing
- **In the room:** Headline, 3 value props, 30-second pitch, 100-word founder bio · Print-ready business card (front/back) designed in your brand · Print-ready 1-page flyer · Instagram, LinkedIn, and one of TikTok/YouTube/X — handles claimed, profile copy, link-in-bio, and banner filled in · 6 on-brand post drafts · 60-second founder video script · 30-day marketing plan (2 channels, weekly budget, calendar, 3 KPIs)
- **At home:** Send print files to your printer · Schedule the 6 posts in Buffer / Later / Meta Business Suite · Record the 60-second video

### 7. Launch
- **In the room:** Signed, dated 30/60/90 plan (first 3 paying customers → 10 → repeatable channel) · 25-name announcement list · 10 personalized outreach drafts saved · Day-of timeline locked · Starter CRM seeded · 3 weekly metrics defined · Accountability partner paired with cadence agreed
- **At home:** Pick your launch date and send the drafts that morning · Both partners put 4 weekly check-ins on each other's calendars

## Files touched

- `src/lib/curriculum-data.ts` — add two fields to `Stage`: `walkOut: string[]` (done in the room) and `afterWorkshop: string[]` (follow-up). Populate per stage above. Drop the now-redundant prose `takeHome` field everywhere, OR keep `takeHome` for fallback and stop rendering it — I'll drop it cleanly to avoid drift. Per-task `deliverable`, `takeaway`, `details`, `followUp` stay as-is (already rewritten last turn).
- `src/routes/index.tsx` — `FlowStrip` cards: replace the single "You walk out with" paragraph with two labeled stacks: "Done in the room" (checkmark bullets in `text-foreground/90`) and "You finish at home" (clock-icon bullets in `text-muted-foreground italic`). Same `Link` to `/schedule#stage-N`. Update the section subhead from "Here's exactly what's in your hands when you stand up at 4:30 PM." to "What's finished in the room — and the exact handful of things you'll file, host, or configure after."
- `src/routes/schedule.tsx` — replace the "You walk out with" block on each stage header with the same two-list pattern, reading from the new fields.

## What does NOT change

- No new components, routes, dependencies, tokens, or layout.
- Task-level rendering (the 3 essential tasks per stage with their per-task Take-home and "After the workshop" lines) is untouched — those were already rewritten last turn and they remain the most granular view on `/schedule`.
- Visual style of cards (border, padding, gradient number badge) is unchanged.
