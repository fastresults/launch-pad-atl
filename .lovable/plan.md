## Restore `WalkInWalkOut`, only swap the 4:30 PM list

I overreached last turn. The original two-column "8 AM walk-in vs 4:30 PM walk-out" section should never have been deleted. Roll it back and change one thing only: the contents of the right-hand `walkOut` array.

## Changes to `src/routes/index.tsx`

1. **HomePage render order** — restore `<WalkInWalkOut />` before `<TheArtOfThePossible />` and remove `<WhatYouLeaveWith />`:

   ```text
   Hero → NotACourseBanner → WalkInWalkOut → TheArtOfThePossible → FlowStrip → AIToolkit → ValueByTheNumbers → …
   ```

2. **Delete the `WhatYouLeaveWith` component and its `LEAVE_STAGES` constant** added last turn. They are no longer rendered.

3. **Re-add the `WalkInWalkOut` component** exactly as it was, with the original:
   - section heading "The transformation"
   - "What changes between 8:00 AM and 4:30 PM" headline
   - left card (8:00 AM, `walkIn` list, X icons)
   - right card (4:30 PM, gradient wash, Check icons)

   Only the `walkOut` array contents change. Everything else (markup, classes, icons, headings) is identical to the pre-edit version.

4. **New `walkOut` list** — replaces the old 9 bullets with all 17 deliverables, grouped by stage, plain-English, no pricing:

   - Your Georgia LLC paperwork, filled in with your business name
   - Your EIN tax number, in your inbox before lunch
   - Your Terms, Privacy Policy, and customer agreement, written for your business
   - A short list of business banks plus the steps to open your local license and sales-tax account
   - A one-page picture of your first customer, what their problem costs them, and 25 real names to reach out to
   - The outreach message to send them, written for you, plus a quick look at 3 competitors and what makes you different
   - Your offer in one sentence, your step-by-step scope of work, and a price built from your real costs
   - A map of how a sale becomes a happy customer and the free apps you'll use at each step, set up in your name
   - Your first customer's deliverable drafted and a 5-point checklist you run before anything goes out the door
   - Your logo, four brand colors, and a font pair, made from your business name
   - A four-page website (Home, Offer, About, Contact) written in your voice and ready to publish
   - Payments (Stripe or Square), business email, and Google Analytics all set up and queued for one click
   - Your headline, three reasons to buy, a 30-second pitch, and a 100-word founder bio
   - A printable business card and a one-page flyer, designed in your brand
   - Six social posts, a 60-second video script, and a 30-day plan with three numbers to watch each week
   - Your signed 30/60/90 plan, your announcement list, and ten personal outreach messages already written
   - Your launch-day timeline, a starter CRM seeded with your list, three weekly numbers, and an accountability partner with check-ins on the calendar

5. **`walkIn` list** — unchanged from the original (5 bullets about the idea, notebook, questions, no first customer, no plan).

## Out of scope

- No edits to `FlowStrip`, `ValueByTheNumbers`, `AIToolkit`, `/schedule`, curriculum data, or value-grid data.
- No new components, sections, page-order changes beyond restoring the original.
- No pricing, dollar figures, or value pills anywhere.
- No visual/layout changes to the two-card structure.