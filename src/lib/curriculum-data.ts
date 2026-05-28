export type Task = {
  title: string;
  deliverable: string;
  tool: string;
  details: string[];
  takeaway?: string;
  followUp?: string;
};

export type Stage = {
  n: number;
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  oneLiner: string;
  takeHome: string;
  walkOut: string[];
  afterWorkshop: string[];
  duration: string;
  covers: string[];
  tasks: [Task, Task, Task];
};

export const STAGES: Stage[] = [
  {
    n: 1,
    slug: "form",
    title: "Form the business",
    shortTitle: "form",
    summary: "The legal foundation. Leave with a filing-ready packet and the legal kit you need to sell.",
    oneLiner: "Legal foundation",
    takeHome:
      "Your Georgia LLC filing packet, EIN application, and signed legal kit (Terms, Privacy, Service Agreement) — all customized to your business and ready to submit. File Monday, start taking money the same week.",
    duration: "60 min",
    covers: ["GA LLC packet", "EIN", "T&Cs / privacy", "Service agreement"],
    tasks: [
      {
        title: "Choose structure & prepare the GA LLC filing",
        deliverable:
          "Your filing packet for your business: name confirmed available, registered agent chosen, member info entered, GA SOS account created, Articles of Organization pre-filled.",
        tool: "GA Secretary of State filing walk-through",
        details: [
          "Pick LLC vs sole prop vs S-corp using a 5-question decision tree",
          "Confirm name availability on the GA SOS business search",
          "Decide registered agent (you, partner, or paid service)",
          "Create your GA SOS account and pre-fill the Articles of Organization",
        ],
        takeaway:
          "Your GA LLC filing packet — Articles pre-filled, registered agent set, ready to submit.",
        followUp:
          "Submit the Articles of Organization and pay the filing fee from home — typically a 10-minute step once you're ready.",
      },
      {
        title: "Get your EIN & lock the business bank choice",
        deliverable:
          "Your EIN issued in the session, your business-bank choice locked, and your bank application checklist completed for your business.",
        tool: "IRS EIN portal + banking checklist",
        details: [
          "Apply for your EIN on the IRS portal — issued in the session",
          "Compare 3 business banks on fees, integrations, and ACH limits",
          "Pick your bank and complete the application checklist (docs needed)",
          "Pick a bookkeeping tool (Wave / QuickBooks) and bookmark the signup",
        ],
        takeaway:
          "Your EIN + chosen business bank + bookkeeping tool — ready to apply.",
        followUp:
          "Submit the bank application with your documents — most banks open the account in 1–7 days.",
      },
      {
        title: "Compliance & legal kit",
        deliverable:
          "Your Terms of Service, Privacy Policy, and 1-page Service Agreement customized to your business; local license and sales-tax requirements documented for you.",
        tool: "GA compliance checklist + contract templates",
        details: [
          "Document Gwinnett city/county business license requirements",
          "Note GA sales tax registration steps if you'll sell taxable items",
          "Customize Terms of Service and Privacy Policy from vetted templates",
          "Customize a 1-page service agreement / SOW for your first sale",
        ],
        takeaway:
          "Your signed Terms of Service, Privacy Policy, and 1-page Service Agreement — customized to your business.",
        followUp:
          "File the local business license and (if applicable) sales-tax registration once your entity is approved.",
      },
    ],
  },
  {
    n: 2,
    slug: "customer",
    title: "Customer & market",
    shortTitle: "customer",
    summary: "Who you serve, what they'll pay for, and how you beat the competition.",
    oneLiner: "Demand & proof",
    takeHome:
      "One named first customer with their problems priced in dollars, a 25-name prospect list pulled for your niche and zip, and a validated outreach script — exported as a CSV you can start messaging tonight.",
    duration: "60 min",
    covers: ["Your first customer", "Validation script", "3-competitor look", "What makes you different"],
    tasks: [
      {
        title: "Pick your first real customer",
        deliverable:
          "A one-page profile of one specific buyer for your business, their top 3 problems, and what each problem costs them in dollars.",
        tool: "Customer profile worksheet",
        details: [
          "Name one specific buyer (role, industry, company size, location)",
          "List their top-3 pains in their own words",
          "Attach a dollar cost to each pain (time, lost revenue, risk)",
          "Map where they already hang out — online and offline",
        ],
        takeaway:
          "Your first customer profile — one specific buyer named, their top problems priced in dollars, and where to find them.",
      },
      {
        title: "Estimate the market + write a short script you'll send",
        deliverable:
          "A real-world estimate of how many buyers exist for your business, a 25-name prospect list pulled for you, and a short outreach script customized to your first customer.",
        tool: "Market snapshot template + validation script",
        details: [
          "Estimate how many buyers exist, how many you can realistically reach, and how many you'll win in year one",
          "Pull a 25-name prospect list from LinkedIn, local groups, or referrals",
          "Customize the problem-discovery script for your first customer",
          "Pick a scoring rubric: pain confirmed, willingness to pay, intro to others",
        ],
        takeaway:
          "Your market snapshot + 25-name prospect list + outreach script — customized to your business.",
        followUp:
          "Send the script to your 25 prospects and run 5 discovery calls within the next 2 weeks; score each one.",
      },
      {
        title: "Look at 3 competitors and find your edge",
        deliverable:
          "A grid comparing 3 real competitors against your business + one sentence on what makes you different.",
        tool: "Competitive grid template",
        details: [
          "Identify 3 real competitors (2 direct + 1 substitute)",
          "Score each on offer, price, channel, proof, and weakness",
          "Find the gap they all miss — your edge",
          "Write a one-line positioning statement: For X, who Y, we are Z because…",
        ],
        takeaway:
          "Your 3-competitor grid + one-sentence positioning that names what makes you different.",
      },
    ],
  },
  {
    n: 3,
    slug: "offer",
    title: "Offer & product",
    shortTitle: "offer",
    summary: "What you actually sell, how it's delivered, and the price tag.",
    oneLiner: "What you sell & what it costs",
    takeHome:
      "Your offer written in one sentence a buyer can say yes or no to, your price backed into from your real costs, and the exact number of sales you need to break even — on a one-page offer sheet.",
    duration: "60 min",
    covers: ["Offer in one sentence", "What's in V1", "Pricing & break-even"],
    tasks: [
      {
        title: "Write the offer in one sentence",
        deliverable:
          "Your offer written in one clear sentence a buyer can say yes or no to.",
        tool: "Offer-builder template",
        details: [
          "Use the formula: We help [who] achieve [outcome] in [time] without [pain]",
          "Test it against your first-customer profile",
          "Strip jargon — read it aloud to a partner",
          "Lock the final sentence; it feeds your website and pitch",
        ],
        takeaway:
          "Your one-sentence offer — the line you'll use on your website, in pitches, and in DMs.",
      },
      {
        title: "Decide what your first version actually includes",
        deliverable:
          "A one-page map of how your business delivers — every step from sale to handoff, with what's in and what's out.",
        tool: "First-version scope + delivery steps",
        details: [
          "List what's IN scope for the first version — and what's explicitly OUT",
          "Map the 5–8 steps from sale to delivery",
          "Identify tools, suppliers, or contractors needed",
          "Estimate time-to-fulfill so pricing covers your hours",
        ],
        takeaway:
          "Your first-version scope — mapped step-by-step from sale to handoff.",
      },
      {
        title: "Set price, margin & payment terms",
        deliverable:
          "Your pricing sheet, your real cost per sale, and the exact number of sales you need to cover your costs.",
        tool: "Pricing & margin calculator",
        details: [
          "Compute what each sale actually costs you to make",
          "Set price using value, cost-plus, and competitor anchors",
          "Calculate units/month to break even and to hit a target income",
          "Define deposit, milestones, refund policy, and accepted payment methods",
        ],
        takeaway:
          "Your pricing sheet + exact break-even number + payment terms.",
      },
    ],
  },
  {
    n: 4,
    slug: "build",
    title: "Build the first working version",
    shortTitle: "build",
    summary:
      "Set up how you'll actually deliver. Pick what kind of business you're building, set up your free apps, and draft what your first customer will get.",
    oneLiner: "Your first working version",
    takeHome:
      "Your delivery process mapped step-by-step, the free apps that run it set up with your accounts, and your first customer's deliverable drafted and rehearsed — before a real customer ever sees it.",
    duration: "60 min",
    covers: ["Service / online / product", "Your free app setup", "What the customer receives"],
    tasks: [
      {
        title: "Pick what kind of business you're building and map the steps",
        deliverable:
          "A one-page picture of how a sale becomes a happy customer for your business (sale → intake → delivery → handoff) with the app you'll use at each step.",
        tool: "Build type picker + step-by-step map",
        details: [
          "Service: intake → kickoff → delivery template → recap loop",
          "Online: pick a no-code stack (Lovable, Notion, Framer, Webflow, Shopify, GHL) and name the first screen",
          "Physical product: supplier/manufacturer shortlist + sample-order checklist + packaging decision",
          "Mark every step that depends on a vendor, contractor, or sample order",
        ],
        takeaway:
          "Your business mapped sale-to-happy-customer, with the app you'll use at each step.",
        followUp:
          "Run the steps end-to-end with one test buyer (or sample order) in the first 2 weeks and revise the map.",
      },
      {
        title: "Set up your free apps",
        deliverable:
          "Free accounts created for the apps you'll run your business on, plus a one-page picture of how they connect (no paid plans signed today).",
        tool: "Free-app checklist",
        details: [
          "Project hub: seed a Notion / ClickUp / Trello workspace from a starter template",
          "Files & assets: create your Drive / Dropbox folder structure",
          "Comms: set up scheduling (Cal.com / Calendly free) + business email alias",
          "Build-type tool: Loom (service) / Figma (online) / supplier portal accounts (physical)",
        ],
        takeaway:
          "Your free-app accounts — set up, connected, and mapped to how your business runs.",
        followUp:
          "Upgrade to paid tiers as revenue justifies and connect any integrations that require billing.",
      },
      {
        title: "Draft what your first customer will actually receive",
        deliverable:
          "Three pieces of your first customer's deliverable drafted and saved to your folder, plus a 5-point quality checklist you'll run before you send anything to a real customer.",
        tool: "Customer-delivery templates (per build type)",
        details: [
          "Service: kickoff doc + delivery template + recap email — all three drafted",
          "Online: landing/demo screen sketched in your builder + onboarding flow outlined + first email drafted",
          "Physical: product spec sheet + unboxing/insert-card draft + first-customer thank-you note",
          "Write a 5-point quality checklist (quality, accuracy, timing, tone, follow-up)",
        ],
        takeaway:
          "Your first customer's deliverable — drafted and rehearsed end-to-end with a 5-point quality checklist.",
        followUp:
          "Run the drafts past your first paying customer and iterate after their feedback.",
      },
    ],
  },
  {
    n: 5,
    slug: "brand",
    title: "Brand & website",
    shortTitle: "brand",
    summary:
      "Your logo, palette, fonts, and a complete website tailored to your business — built and ready to host.",
    oneLiner: "Brand & website",
    takeHome:
      "Your logo, color palette, and font pairing generated from your business name; a complete website tailored to your business — Home, Offer, About, and Contact pages built in your site builder and ready to host the moment your domain resolves; payments, business email, and analytics queued for one-click activation.",
    duration: "75 min",
    covers: ["Brand kit", "Bespoke website", "SEO per page", "Payments / email / analytics"],
    tasks: [
      {
        title: "Name, domain & brand kit",
        deliverable:
          "Domain availability confirmed for your business + cart ready + your brand kit folder assembled (logo, palette, fonts) and saved.",
        tool: "Domain check + brand kit",
        details: [
          "Confirm name availability (.com, USPTO TESS, social handles)",
          "Pick a registrar and load the domain into your cart",
          "Generate logo + 4-color palette + 2 fonts in your brand kit",
          "Save brand assets to a shared folder (Drive / Notion)",
        ],
        takeaway:
          "Your brand identity — logo, color palette, font pairing, and a one-line vision and mission anchoring it.",
        followUp:
          "Complete the domain purchase and point DNS to your site builder — usually 15 minutes plus propagation.",
      },
      {
        title: "Build your website",
        deliverable:
          "A complete website built for your business — Home, Offer, About, and Contact pages designed in your brand kit, written with your locked messaging, mobile-ready, and configured for SEO. Ready to host.",
        tool: "Site builder + on-page SEO checklist",
        details: [
          "Pick a starter template and apply your brand kit",
          "Build Home and Offer pages with your locked messaging",
          "Build About and Contact pages (headline + sections + form)",
          "Fill on-page SEO per page: title, meta, single H1, image alts",
        ],
        takeaway:
          "Your bespoke website — 4 pages built, branded, written, and SEO-configured in your site builder. Hosting-ready.",
        followUp:
          "Connect your domain, do a final mobile pass, and click Publish — usually under an hour once DNS resolves.",
      },
      {
        title: "Payments, business email & analytics",
        deliverable:
          "Stripe (or Square) application filled out for your business; GA4 property created with your tracking snippet ready; business email on your domain set up step-by-step; welcome-email copy drafted.",
        tool: "Essentials setup checklist",
        details: [
          "Pick Stripe or Square; complete the application info checklist",
          "Create your GA4 property and copy the tracking snippet",
          "Pick an email provider (Google Workspace / Zoho) and document MX steps",
          "Decide your welcome-email copy for new leads",
        ],
        takeaway:
          "Your payments, business email, and analytics — accounts created and configured to your business, queued for final activation.",
        followUp:
          "Finish payments KYC, install the GA4 snippet on your published site, and verify business email — typically 1–3 days.",
      },
    ],
  },
  {
    n: 6,
    slug: "marketing",
    title: "Marketing plan & creatives",
    shortTitle: "marketing",
    summary:
      "Your printable business card and flyer, your social channels branded, and a 30-day plan to put it all in motion.",
    oneLiner: "Plan & creatives",
    takeHome:
      "A printable business card and flyer designed in your brand, your social channels claimed and branded (profile copy, banner, link-in-bio), six on-brand posts and a 60-second founder video script — your full launch kit, ready to print and configure.",
    duration: "60 min",
    covers: ["Messaging kit", "Print creatives", "Social channels branded", "30-day plan"],
    tasks: [
      {
        title: "Core messaging kit",
        deliverable:
          "Your headline, 3 value props, 30-second pitch, and 100-word founder bio — written for your business.",
        tool: "Messaging kit template",
        details: [
          "Write a headline that names the buyer + outcome",
          "Draft 3 value props mapped to the top-3 customer pains",
          "Rehearse a 30-second verbal pitch",
          "Write a 100-word founder bio for site, social, and outreach",
        ],
        takeaway:
          "Your headline, 3 value props, 30-second pitch, and founder bio.",
      },
      {
        title: "Your print and social kit",
        deliverable:
          "Printable business card and flyer designed in your brand; Instagram, LinkedIn, and one of TikTok/YouTube/X claimed with your profile copy, link-in-bio, and banner; 6 on-brand post drafts; 60-second founder video script.",
        tool: "Creative kit templates (print + social)",
        details: [
          "Design a business card (front/back) in your brand kit — print-ready",
          "Design a 1-page flyer / one-pager for events, walk-ins, and partner shelves",
          "Claim handles on Instagram, LinkedIn, and one of TikTok / YouTube / X — fill profile copy, link-in-bio, banner",
          "Draft 6 posts (hooks, proof, offer) + 1 sixty-second video script you can record this week",
        ],
        takeaway:
          "Your launch creative kit — business card and flyer ready to print, social channels branded and ready to configure, 6 posts and a video script ready to publish.",
        followUp:
          "Send the print files to your printer and schedule the 6 posts in Buffer / Later / Meta Business Suite; record the video.",
      },
      {
        title: "1-page marketing plan",
        deliverable:
          "Your 1-page marketing plan: channels, budget, 30-day calendar, and 3 numbers to check every week.",
        tool: "Marketing plan template",
        details: [
          "Pick your top-2 acquisition channels (1 organic, 1 outbound or paid)",
          "Set a weekly time + dollar budget per channel",
          "Build a 30-day content + outreach calendar (publish dates locked)",
          "Define 3 KPIs: leads/week, reply rate, conversion to sale",
        ],
        takeaway:
          "Your 30-day marketing plan — 2 channels, weekly budget, content calendar, 3 weekly KPIs.",
      },
    ],
  },
  {
    n: 7,
    slug: "launch",
    title: "Launch plan",
    shortTitle: "launch",
    summary:
      "Your dated 90-day plan, your launch-day checklist, and the weekly check-in that keeps you moving.",
    oneLiner: "90-day plan",
    takeHome:
      "Your signed, dated 90-day plan (first 3 paying customers → 10 → repeatable channel), your launch-day checklist with personalized outreach drafts ready to send, and an accountability partner on next Monday's calendar.",
    duration: "45 min",
    covers: ["90-day plan", "Launch-day checklist", "Outreach drafts", "Accountability"],
    tasks: [
      {
        title: "Sign your 90-day plan (30 / 60 / 90)",
        deliverable:
          "Your signed, dated 90-day plan for your business: first 3 customers → 10 → repeatable channel.",
        tool: "Launch plan template",
        details: [
          "Day 1–30: ship offer, close first 3 paying customers",
          "Day 31–60: refine fulfillment, reach 10 customers, collect testimonials",
          "Day 61–90: double down on the channel that worked, kill what didn't",
          "Sign and date it — print copy goes on the wall",
        ],
        takeaway:
          "Your signed 90-day plan — first 3 paying customers → 10 → repeatable channel.",
      },
      {
        title: "Launch-day checklist & outreach drafts",
        deliverable:
          "Your 25-name announcement list + 10 personalized outreach drafts written for your contacts + day-of timeline (drafts saved, not sent).",
        tool: "Launch checklist + outreach templates",
        details: [
          "Build a 25-name personal announcement list (friends, peers, past clients)",
          "Draft 10 personalized outreach messages (DM, email, voice note)",
          "Identify 3 partner / press / community asks for a co-launch boost",
          "Lock a day-of timeline: 8 AM post → 10 AM email → 2 PM follow-ups",
        ],
        takeaway:
          "Your launch-day checklist + 10 personalized outreach drafts — ready to send.",
        followUp:
          "Pick your launch date, send the drafts that morning, and work the day-of timeline.",
      },
      {
        title: "Sales pipeline + accountability",
        deliverable:
          "Your starter CRM seeded with your announcement list + 3 weekly metrics defined + accountability partner identified + cadence agreed.",
        tool: "CRM starter + accountability pairing",
        details: [
          "Seed a free CRM (HubSpot / Notion) with the announcement list",
          "Define 3 weekly metrics: pipeline added, calls booked, sales closed",
          "Pair with a cohort accountability partner",
          "Agree on a weekly 20-min check-in cadence and channel",
        ],
        takeaway:
          "Your starter CRM populated, weekly metrics defined, and an accountability partner booked on the calendar.",
        followUp:
          "Both partners put the 4 weekly check-ins on each other's calendars after the workshop.",
      },
    ],
  },
];

export const stageBySlug = (slug: string) => STAGES.find((s) => s.slug === slug);
