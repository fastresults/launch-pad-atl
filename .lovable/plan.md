## Goal

Do an empathy-driven copy pass across the public-facing surfaces so a first-time founder with a 7th–12th grade reading level instantly understands what they're getting. Cut jargon, MBA-speak, and consultant words. Keep the work concrete and human.

**AND** rebalance the homepage so the participant's tangible value (what they walk in with, what they walk out with) carries at least as much visual and copy weight as the facilitator section.

## Voice rules (apply everywhere)

- Plain English. Short sentences. Active voice.
- Replace consultant/insider words with what they literally mean.
- Never say what something IS without saying what it DOES for the founder.
- Talk like a friend who's done it before, not a deck.
- Keep the resume-grounded credibility — but soften the jargon there too.

## Word swaps (global find-and-replace, with judgment)

| Replace | With |
|---|---|
| operational delivery workflow | step-by-step way you'll deliver to your first customer |
| operational MVP / operational V1 | first working version of your business |
| V1 workflow / V1 artifact | the simple version your first customer sees |
| build archetype | what kind of business you're building (service, online, or physical product) |
| operational toolkit / tool stack | the free apps you'll run your business on |
| beachhead customer | your first real customer — one specific person who'll buy |
| TAM / SAM / SOM | how many people could buy, how many you can reach, how many you'll win in year one |
| positioning / positioning gap / wedge | what makes you different in one sentence |
| sovereign-grade narrative & positioning doc | a one-page story of who you help and why you're different |
| productizing services | turning services into clear, repeatable packages |
| KPIs | the 3 numbers you check every week |
| break-even units | how many you have to sell to cover your costs |
| fulfillment SOP | the step-by-step "how we deliver this" page |
| COGS | what each sale actually costs you to make |
| handoff | the moment you hand the finished work to the customer |
| GovTech / sovereign / enterprise (about Adam) | for governments, for big companies (Fortune 500), and for first-time founders |
| artifact / deliverable (public copy) | something you can hold, send, or sign |
| receipts, not résumé lines | proof he's actually done this — not just talked about it |

Insider terms stay inside curriculum `details[]` where founders need to recognize the real word (EIN, LLC, DNS, Stripe, GA4, etc.) — those are tools they'll actually search for.

---

## Files & specific rewrites

### `src/routes/index.tsx`

**Hero subhead (~67–71):**
> "Seven focused hours in Norcross, GA. By 4:30 PM you'll have a real business on paper, a simple way to deliver it, a website ready to publish, your full marketing kit, and a 90-day plan with your next ten moves already on the calendar."

**Facilitator block (~187–203):**
- Bio: "Adam has spent 18+ years building real things for real customers — websites and apps for big companies like Citigroup, Mayo Clinic, 3M, and Disney; full digital systems for a Caribbean country's government; and a five-year run producing one of the region's biggest business summits. He's sat in your seat. He knows what it takes to go from idea to a business that actually opens its doors."
- Chips: "Built for Fortune 500 companies" · "Built systems for a whole country" · "Produced 5 major business summits"

**Proof section header (~276):** "Proof, not promises."

**Proof section subhead (~278–286):**
> "Every stage of your day matches something Adam has actually built and shipped. You'll be coached on the real moves — by someone who's made them."

**PROOF_ROWS (~219–268):** rewrite as in the table below.
- 1 Form — "Your business, legally on paper." / "Started two of his own companies (Florida 2009, Caribbean 2014). Knows the paperwork inside out."
- 2 Customer & offer — "An offer real people will pay for." / "18 years selling work to Fortune 500 buyers and government teams. Knows what makes a buyer say yes."
- 3 Market & positioning — "A clear story of who you help and why you're different." / "Wrote the national story for a Caribbean country's investor program. Advised on its pavilion at Expo 2020 Dubai."
- 4 Build the MVP — "A simple, working way to deliver to your first customer." / "Built a whole country's government websites, tax portal, and case-management system from scratch."
- 5 Brand — "A brand kit and a website ready to publish." / "Designed Mayo Clinic and 3M brand experiences seen by thousands of visitors. Published a national magazine."
- 6 Marketing plan & creatives — "Your business card, flyer, social profiles, 6 posts, and a video script — ready to print and post." / "Ran PR, ads, and crisis messaging — including COVID-19 public-service campaigns for a national Ministry of Health."
- 7 Launch — "A signed 90-day plan with your next 10 moves already on the calendar." / "Ran five major investor summits start-to-finish. Knows how to take a plan from paper to launch day."

**Closing line (~309–316):**
> "You're not getting a coach with a slideshow. You're getting someone who's built the business, shipped the website, designed the brand, and run the launch — sitting at your table, helping you do the same."

---

## NEW: Participant Value Rebalance (biggest addition)

Right now the facilitator section has a hero card, bio, chips, AND a 7-card proof grid. The deliverables section is one flat 7-item bullet list. The page reads like it's selling Adam, not selling the founder's outcome. Fix it.

### A. New section right after the Hero, before FlowStrip — `<WalkInWalkOut />`

A high-contrast, two-column block. Same visual weight as the facilitator proof grid. Drives the whole value proposition before the user scrolls anywhere else.

**Header:** "What changes between 8:00 AM and 4:30 PM"

**Left column — "What you walk in with":**
- An idea you've been turning over for months (or years)
- A notebook full of "someday" notes
- Questions about LLCs, EINs, websites, pricing, and where to even start
- No clear first customer
- No structure, no kit, no plan you can actually follow Monday morning

**Right column — "What you walk out with":**
- A real business on paper — name, structure, EIN in hand, Georgia LLC packet ready to file
- A one-page profile of your first paying customer, in their words, with the dollar cost of their problem
- An offer written in one sentence that a buyer can say yes or no to
- The step-by-step way you'll deliver to that first customer next week
- A brand kit folder (logo, colors, fonts) and a website drafted page by page in your builder
- Your full marketing kit — business card, flyer, social profiles, 6 posts, and a 60-second video script
- A 25-name list of people to tell first, plus 10 personal messages already written for you to send
- A signed, dated 90-day plan with your first 3 customers → 10 → repeatable channel mapped out
- An accountability partner and a weekly check-in already on the calendar

Visual treatment: two cards side-by-side on desktop, stacked on mobile. Left card muted/grayscale (the "before"), right card brand-gradient accents (the "after"). Right column is intentionally 2-3× longer than the left.

### B. Rewrite the existing `<Deliverables />` (~323–355) into `<WhatYouLeaveWith />` — richer, grouped, scannable

Instead of one flat list of 7 bullets, group the 9 takeaways into 4 themed buckets with icons. Each bucket gets a header, a one-line "what this means for you" subhead, and 2–3 concrete items.

**Bucket 1 — "The Business" (icon: file/folder)**
- Subhead: "Filed, registered, legal — not a wish list."
- Items:
  - Georgia LLC packet ready to file + EIN in hand
  - Terms of service, privacy policy, and a 1-page service agreement drafted to your business
  - Business bank application checklist completed

**Bucket 2 — "The Customer & The Offer" (icon: user/target)**
- Subhead: "Someone real, ready to buy something specific."
- Items:
  - One-page profile of your first paying customer with the dollar cost of their problem
  - Your offer written in one clear sentence
  - Pricing sheet + how many sales it takes to cover your costs

**Bucket 3 — "The Brand & The Website" (icon: globe/sparkle)**
- Subhead: "A business people can find, recognize, and trust."
- Items:
  - Domain in your cart + brand kit folder (logo, colors, fonts)
  - Home and Offer pages drafted in your website builder, About and Contact outlined
  - Payments, business email, and analytics setup checklists ready to finish at home

**Bucket 4 — "The Launch Plan" (icon: rocket/calendar)**
- Subhead: "Monday morning, you know exactly what to do."
- Items:
  - Your full marketing kit (card, flyer, social profiles, 6 posts, 60-second video script)
  - 25-name announcement list + 10 personal outreach messages already written
  - Signed, dated 90-day plan with 3 weekly numbers and an accountability partner locked in

**Section header:** "What you take home"
**Subhead:** "Not slides. Not theory. **A complete starter kit you can hold, send, and sign.**"
**Footer line under the buckets:** "Print this list. Cross items off Monday. By Friday, you have a business."

### C. New visual strip — `<ValueByTheNumbers />`

Single-line band of 4 stat tiles between `<WhatYouLeaveWith />` and `<FacilitatorSection />`. Pure proof-by-volume.

- **1** real business formed
- **9** concrete take-home pieces
- **25** prospects on your launch list
- **90** days mapped, signed, and dated

Treat these as large numerals with one-line labels, brand-gradient accents. They give the participant-value story the same visual punch as Adam's resume.

### D. Section ordering (final homepage)

1. Hero
2. **WalkInWalkOut** ← NEW
3. FlowStrip (7 stages strip — keep as today, light copy tidy)
4. **WhatYouLeaveWith** (rewritten, bucketed)
5. **ValueByTheNumbers** ← NEW
6. FacilitatorSection
7. FacilitatorProof
8. VenueCard
9. BottomCTA

Result: 3 strong participant-value sections sit BEFORE the 2 facilitator sections. Page sells the outcome first, the operator second.

---

### `src/lib/curriculum-data.ts`

Public-facing fields only — `summary`, `oneLiner`, `covers`, task `title`, task `deliverable`. Internal `details[]` keep real tool names.

- **Stage 2 covers:** "Your first customer", "Validation script", "3-competitor look", "What makes you different"
- **Stage 2 task 1 title:** "Pick your first real customer"; **deliverable:** "A one-page profile of one specific buyer, their top 3 problems, and what each problem costs them."
- **Stage 2 task 2 deliverable:** "A real-world estimate of how many buyers exist + a 25-name list + a short script you'll send them."
- **Stage 2 task 3 title:** "Look at 3 competitors and find your edge"; **deliverable:** "A simple grid comparing 3 competitors + one sentence on what makes you different."
- **Stage 3 oneLiner:** "What you sell & what it costs"; **covers:** "Offer in one sentence", "What's in V1", "Pricing & break-even"
- **Stage 3 task 2 title:** "Decide what your first version actually includes"; **deliverable:** "A one-page 'how we deliver this' that lists every step from sale to handoff."
- **Stage 4 title** stays "Build the operational MVP" internally; **oneLiner:** "Your first working version"; **summary:** "Set up how you'll actually deliver. Pick what kind of business you're building, set up your free apps, and draft what your first customer will get."
- **Stage 4 covers:** "Service / online / product", "Your free app setup", "What the customer receives"
- **Stage 4 task titles & deliverables** rewritten to plain English (per swap table above)
- **Stage 5 oneLiner:** "Brand & website"; replace "on-page SEO" in deliverable headers with "Make Google find each page"; keep the real term in `details[]`
- **Stage 6 task 2 title:** "Your print and social kit"; "short-form video script" → "60-second video script"
- **Stage 7 title:** "Launch plan" stays; **summary:** "Your dated 90-day plan, your launch-day checklist, and the weekly check-in that keeps you moving."
- Replace public-facing "KPIs / 3 KPIs" with "3 numbers to check every week"; keep one mention of "KPI" in `details[]`

### `src/routes/schedule.tsx`

- Most stage labels pull from `curriculum-data.ts` — propagates automatically.
- Audit inline copy for "operational delivery workflow", "V1 artifact", "stack" → plain-English versions.

### `src/routes/register.tsx`

- Audit form / confirmation copy for "deliverables", "MVP", "workflow" — swap to plain versions.

---

## What I'm NOT changing

- Curriculum structure or 7-stage flow
- Schedule times, capacity, venue, price, date
- `details[]` entries with real tool names a founder will Google (LLC, EIN, DNS, Stripe, GA4, Notion, etc.)
- Components, routes, styles tokens, or images
- Adam's credentials — only the words around them

## Verification

After implementation: load `/`, `/schedule`, `/register` at 1384px and mobile, scroll the homepage top-to-bottom and count visual weight — participant-value sections should clearly outweigh facilitator sections. Read every paragraph aloud and confirm a 7th-grader could explain what they'd leave with.
