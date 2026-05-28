# Stretch to 7 hours, sharpen the copy, introduce the facilitator

Three things change: the workshop becomes a **7-hour working day** so each of the 7 stages gets the time it deserves; the homepage is **rewritten with conversion-grade copy** in a seasoned startup voice; and an **experienced facilitator** is introduced as a trust anchor.

## 1. Rebalance to a 7-hour flow

Working time grows from 360 → 420 min so every stage has breathing room. Day still ends at 4:30 PM ET; we start 30 min earlier and trim the lunch slot slightly.

| # | Stage | Was | Now |
|---|---|---|---|
| 1 | Form the business | 50 | 60 |
| 2 | Customer & market | 55 | 60 |
| 3 | Offer & product | 50 | 60 |
| 4 | Build (operational MVP) | 60 | 60 |
| 5 | Brand & website | 60 | 75 |
| 6 | Marketing plan & materials | 45 | 60 |
| 7 | Launch plan | 40 | 45 |
| **Working** | | **360** | **420** |
| Check-in | 30 | 30 |
| Lunch | 45 | 30 |
| Coffee reset | 15 | 15 |
| **Total day** | 8:30 → 4:30 | **8:00 → 4:30** |

New schedule rhythm: 8:00 check-in · 8:30 Stage 1 · 9:30 Stage 2 · 10:30 Stage 3 · 11:30 lunch · 12:00 Stage 4 · 1:00 Stage 5 · 2:15 coffee · 2:30 Stage 6 · 3:30 Stage 7 (45 min) · 4:30 close.

Files: `src/lib/curriculum-data.ts` (update `duration`), `src/lib/schedule-data.ts` (rebalance times + `EVENT.timeLabel` → "8:00 AM – 4:30 PM ET"), `src/routes/index.tsx` ("See the 6-hour flow" → "See the 7-hour flow"; "Seven stages. One day." stays).

## 2. Clarify "marketing materials" everywhere

Stage 6 is renamed and rewritten so attendees know it covers **all printed creatives and social**, not just a plan document.

- **Stage title:** "Marketing plan & creatives" (was "Marketing plan & materials").
- **Summary:** "A 1-page marketing plan plus your full creative kit — printed flyers, business cards, social profiles, and post drafts — ready to take to a printer or scheduler."
- **Covers chips:** "Messaging kit · Print creatives · Social kit · 30-day plan".
- **Task 6.2 ("Social media kit & content drafts") expands** to a combined **"Print & social creatives"** task with deliverables: business-card draft, flyer / one-pager draft, social profile copy + banner asset, 6 post drafts, 1 short-form video script. `followUp` keeps the "send to a printer / schedule the posts" hand-off.

Files: `src/lib/curriculum-data.ts` (stage 6 title, summary, covers, task 6.2 deliverable + details + followUp), `src/routes/index.tsx` deliverables bullet rewrite.

## 3. Conversion-grade copy rewrite (homepage)

Voice: 20-year startup copywriter. Direct, confident, specific. Outcome-led headlines, concrete proof, zero fluff, zero hedging. Every paragraph earns the next scroll.

### Hero
- **Eyebrow:** "One day. One founder. One real business."
- **H1:** "Walk in with an idea. Walk out a business owner."
- **Sub:** "Seven focused hours in Norcross, GA. By 4:30 PM you'll have a formed business, an operational workflow, a website ready to publish, a complete creative kit, and a signed 30/60/90 plan with the next 10 moves already on the calendar."
- **Primary CTA:** "Claim one of 20 seats →"
- **Secondary:** "See the 7-hour flow"
- **Meta chips:** date · Norcross, GA · 20 seats · *new:* "Led by a 30-year startup operator"

### New "Your facilitator" section (between Flow and Deliverables)
- Eyebrow: "Who's in the room with you"
- Headline: "Three decades of starting, scaling, and shipping — at your table for the day."
- Body: 30 years building startups across services, software, and physical products. Founded, scaled, and exited companies. Coached hundreds of first-time founders through the exact moves you'll make today. You're not getting a slide deck — you're getting a working session with someone who has done this many times.
- Three proof chips: "30+ years operating" · "Hundreds of founders coached" · "Service, digital, and physical builds"

(Facilitator name/photo intentionally left as a placeholder — see Open Question.)

### Flow strip — rewrite the heading
- Eyebrow: "The day, hour by hour"
- Headline: "Seven stages. One working day. A business that exists by dinner."

### Deliverables rewrite — outcome-first, 7 bullets
Replace the current 6 with these 7, each in the voice of a closed loop:
1. A beachhead customer profile with named pains and dollar costs — the page that ends "I think they'll buy" forever.
2. A filing-ready GA LLC packet, EIN in hand, and a legal kit drafted to your business.
3. An operational V1 workflow — the exact way you'll deliver to your first paying customer next week.
4. A domain in your cart, a brand kit folder, and a website drafted page-by-page in your builder.
5. A complete creative kit — business card, flyer, social profiles, 6 posts, and a video script — ready for the printer and the scheduler.
6. A 25-name announcement list with 10 personalized outreach messages already written.
7. A signed, dated 30/60/90 plan with three weekly metrics and an accountability partner locked in.

Headline above the list: "What you carry out the door."
Sub: "Not slides. Not theory. Artifacts a customer can touch, a printer can run, and a calendar can hold."

### Venue card — tighter copy
- Eyebrow stays "Where it happens"
- Add a short trust line under the address: "Small cohort by design — 20 founders, one operator, no audience."

### Bottom CTA band (new, just above footer)
- Headline: "Twenty seats. One date. One door from idea to business."
- Sub: "If you've been waiting for the right week to start, this is the day you stop waiting."
- CTA: "Reserve your seat for July 23 →"

Files: `src/routes/index.tsx` (Hero, FlowStrip, new `FacilitatorSection`, Deliverables, VenueCard tweak, new `BottomCTA`), `head()` meta — title + description + og:* rewritten to match new hero.

## 4. Register page — light alignment

Carry the new voice into the register intro: replace any "6-hour" mention with "7-hour" and use a single confident line ("Reserve one of 20 seats for the working day that gets your business stood up.") if the page currently hedges. No structural change.

Files: `src/routes/register.tsx` (copy-only pass — verified during implementation).

## 5. Schedule page — alignment only

Already renders from `STAGES` + `SCHEDULE`; only needs the rebalanced times to flow through. Verify the page header copy mentions "7 hours" not "6 hours" if hard-coded, and verify the `EVENT.timeLabel` updates display correctly.

Files: `src/routes/schedule.tsx` (search for "6-hour" / "6 hours" / hard-coded times — replace if present).

## Conservative-promise audit (re-checked for the expanded time)

The extra 60 min goes to **deeper drafting and per-attendee coaching**, not to new external commitments. No new "we'll send / publish / submit" promises. Every new minute lives inside the seat. Marketing-creatives task explicitly says "draft" and "ready for printer/scheduler" — printer runs and post scheduling stay in `followUp`.

## Out of scope (intentionally)

- No new pages (facilitator gets a homepage section, not a dedicated bio route — can add later).
- No facilitator headshot / generated portrait yet — placeholder block with name TBD.
- No testimonial section yet — we don't have real quotes to use; adding fake ones would undercut the rest of the copy.
- No price/refund/FAQ section — separate ask if you want it.

## Open question

1. **Facilitator identity.** Should I (a) use a generic "Your facilitator — 30 years operating experience" block with a stylized silhouette placeholder, (b) leave a clearly-marked `FACILITATOR_NAME` constant for you to fill in, or (c) wait for you to send name + bio + headshot before I build the section? Default if you don't answer: option (b) — ship the section with a `FACILITATOR_NAME` placeholder so the layout is locked and you drop the name in later.

Approve and I'll implement.
