## The problem

The 60+ deliverable titles on the homepage framework (and echoed in the workshop slides, chatbot, curriculum, and dashboard) read like an MBA syllabus: "Executive Summary," "Value Proposition," "Founder Operating Cadence," "BOM & Landed-Cost Model," "Contractor & 1099 Kit," "Pre-Sell Offer & Waitlist Test," "Go-to-Market Plan." For a Main Street, first-time, or trades operator this is intimidating — it signals "you don't belong in this room yet." We're inviting people to sit down over coffee; the labels should feel like that too.

## The principle (before the list)

- **Say the thing, not the category.** "One-page story of your startup" instead of "Executive Summary."
- **Verbs and outcomes over nouns and disciplines.** "Know your numbers" instead of "Financial Model."
- **Kitchen-table English.** No "cadence," "framework," "SOP," "BOM," "TAM," "positioning," "pro forma," "MSA," "PRD," "SPF/DKIM."
- **Under 5 words when possible.** Long enough to be clear, short enough to feel welcoming.
- **Tooltips keep the specifics.** The friendly label is the front door; the detailed tooltip already there does the technical explaining.
- **Section names stay** (Foundation, Strategy, Operations, Finance, Governance, Brand, Marketing, Social & Content) — they're already plain and act as a spine.

## Proposed relabels (label → new label)

**01 Foundation**
- Executive Summary → **Your one-page story**
- Vision & Mission → **What you stand for**
- Problem / Solution Brief → **The problem you solve**
- Value Proposition → **Why customers pick you**
- 14-Day Launch Plan → **Your day-by-day launch plan**
- AI Tool Stack Recommendation → **Your AI toolkit, picked for you**
- AI Prompt Library → **25 ready-to-use AI prompts**
- Founder Operating Cadence → **Your weekly rhythm**

**02 Strategy**
- Market Analysis → **How big the opportunity is**
- Customer Personas → **Who you're selling to**
- Competitive Positioning → **How you beat the alternatives**
- Go-to-Market Plan → **Your first 90 days**
- Brand & Messaging → **How you sound everywhere**
- First-50 Warm List → **Your first 50 people to call**
- Pre-Sell Offer & Waitlist Test → **A 48-hour demand test**
- CRM Pipeline Starter → **A place to track every deal**

**03 Operations**
- Product Roadmap → **What you'll launch, in what order**
- Operating Plan → **How the week actually runs**
- Sales Playbook → **What to say to close the sale**
- Marketing Plan → **Where your customers come from**
- Fulfillment SOP → **How you deliver order #1**
- Customer Support Starter → **How you answer customers fast**
- Booking & Calendar Setup → **A real link to book a call**
- Sales Call Recording Stack → **Every call captured and summarized**
- AI Support Bot Setup → **An AI helper for easy questions**
- Automation Recipes Starter → **5 things you'll stop doing by hand**
- Supplier Shortlist → **Your top 5–10 suppliers, vetted** *(physical products)*
- BOM & Landed-Cost Model → **What each unit really costs you** *(physical products)*

**04 Finance**
- Financial Model → **Your 12-month money picture**
- Unit Economics → **What one customer is really worth**
- Funding Strategy → **How you'll pay for growth**
- Budget & Pro Forma → **What you'll spend, month by month**
- Pitch Deck Outline → **Your story on 10 slides**
- Payments & Checkout Setup → **A live way to take money**
- Business Bank & Bookkeeping Starter → **A business bank, books, and a debit card**
- Pricing Page & Offer Sheet → **Your prices, in writing**

**05 Governance**
- Legal Structure Brief → **How to set the business up right**
- Risk Register → **What could go wrong — and the fix**
- Board & Governance Plan → **The advisors in your corner**
- Terms, Privacy & Refund Pack → **The customer-facing legal set**
- Insurance Starter → **The insurance customers ask about**
- Contractor & 1099 Kit → **Contracts for your first hire**

**06 Brand** *(bonus)*
- Brand Strategy Framework → **What your brand stands for**
- Brand Messaging House → **The words your brand uses**
- Visual Identity Brief → **The look you hand to a designer**
- Brand Voice & Tone Guide → **How your brand sounds**
- Brand Guidelines Book → **Your brand rules, all in one place**
- Logo & Brand Asset Pack → **Your logo, favicon, and images**

**07 Marketing** *(bonus)*
- Website PRD (AI-builder prompt) → **The build brief for your website**
- Domain, Email & DNS Checklist → **Domain, business email, and setup**
- Analytics & Pixel Setup → **A way to see what's working**
- Landing Page & Waitlist Test → **A live page by day 4**
- Pre-Sell Landing PRD (AI-builder prompt) → **The build brief for your pre-sell page**
- Email Marketing Setup → **Business email that reaches the inbox**

**08 Social & Content** *(bonus)*
- Social Media Audit & Setup → **Your social accounts, cleaned up**
- Content Strategy & Pillars → **What you'll post about**
- 90-Day Content Calendar → **90 days of posts, planned**
- Launch Content Kit → **Everything you need for launch week**
- Community Engagement Playbook → **How to reply, DM, and thank people**
- Influencer & Partnership Brief → **A note to send to partners**
- Paid Ads Starter Pack → **Your first paid ad campaign, ready**
- Reviews & Testimonials Capture Kit → **How you collect reviews on day 1**
- Outbound DM & Email Scripts → **What to send to your first 50**
- Ad Creative Pack → **12 ads ready to run**
- Referral & Affiliate Starter → **How happy customers bring you more**

## Where these labels have to change together

`framework-deliverables.ts` is the source of truth, but the same strings are hardcoded in a handful of places. All must be updated in the same pass so nothing drifts:

1. **`src/lib/framework-deliverables.ts`** — the `title` field on every item in `FRAMEWORK_STAGES` (the file the homepage, `/build`, `/register`, and the dashboard framework panel all read).
2. **`src/lib/curriculum-data.ts`** — literal titles inside the curriculum copy blocks (Foundation lesson especially references "Executive Summary," "Vision & Mission," "Problem/Solution," "Value Prop" by name; same for later stages). Rewrite in place so lesson copy matches the new labels.
3. **`src/lib/workshop-productization.ts`** — the `inputs: [...]` arrays that reference deliverable names verbatim (e.g. `"Foundation · Executive Summary"`). Update to the new labels.
4. **`src/lib/launch-14day-guidance.ts`** — the sample day plan mentions "Executive Summary" and "Vision & Mission" by name. Rewrite to the new phrasing.
5. **`src/lib/chatbot-knowledge.ts`** — the knowledge base is generated from `FRAMEWORK_STAGES` so it auto-updates, but scan for any hard-coded old labels and re-tune the concierge's answers to use the new plain names.
6. **`public/adam-funnel-v1.md`** and the two funnel report source files under `.lovable/` — sweep for the old labels; they're used as marketing collateral and should stay consistent.
7. **DB (`venture_document_types` table)** — a migration renames the `name` column values to match the new labels so the dashboard reads the same friendly names. The `slug`/internal keys stay as-is (per project memory: user copy changes, internal identifiers don't).

## Out of scope

- Tooltips (already good — they carry the technical detail).
- Section names (already plain).
- Category badges like "Bonus" / physical-products qualifiers.
- Marketing plan structure, hero copy, pricing, and the coffee cup layout — no other changes to the page.

## Verification

- Load `/` and confirm every card in the framework grid reads in kitchen-table English.
- Load `/build` and the founder dashboard framework panel — confirm the same names appear there.
- Open the chatbot and ask "what do I get?" — confirm it now uses the plain names.
- Grep for the old titles (`Executive Summary`, `Value Proposition`, `Founder Operating Cadence`, `BOM`, `1099 Kit`, `Pre-Sell Offer & Waitlist Test`, `Go-to-Market`, `Pro Forma`, `PRD`, `SOP`) across `src/`, `public/`, `.lovable/` — expect zero hits outside intentional internal identifiers.
