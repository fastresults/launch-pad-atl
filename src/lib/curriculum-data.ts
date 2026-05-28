export type Task = {
  title: string;
  deliverable: string;
  tool: string;
  details: string[];
  takeaway?: string;
  takeawayGenerator?: string;
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
  duration: string;
  covers: string[];
  generators?: string[];
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
    takeHome: "A filing-ready Georgia LLC packet (Articles pre-filled, registered agent set, EIN application queued) plus signed Terms, Privacy, and Service Agreement — auto-assembled by the legal walk-through and exported as a single PDF bundle. Submit Monday and start legally taking money the same week.",
    duration: "60 min",
    covers: ["GA LLC packet", "EIN", "T&Cs / privacy", "Service agreement"],
    generators: ["Legal Checklist Generator"],
    tasks: [
      {
        title: "Choose structure & prepare the GA LLC filing",
        deliverable:
          "Filing-ready packet: name confirmed available, registered agent chosen, member info, GA SOS account created",
        tool: "GA Secretary of State filing walk-through",
        details: [
          "Pick LLC vs sole prop vs S-corp using a 5-question decision tree",
          "Confirm name availability on the GA SOS business search",
          "Decide registered agent (you, partner, or paid service)",
          "Create your GA SOS account and pre-fill the Articles of Organization",
        ],
        takeaway: "GA LLC Entity Pack — entity decision tree + filing-ready Articles of Organization",
        takeawayGenerator: "Legal Checklist Generator",
        followUp:
          "Submit the Articles of Organization and pay the filing fee from home — typically a 10-minute step once you're ready.",
      },
      {
        title: "Get your EIN & lock the business bank choice",
        deliverable:
          "EIN issued (instant) + bank choice locked + completed application checklist",
        tool: "IRS EIN portal + banking checklist",
        details: [
          "Apply for your EIN on the IRS portal — issued in the session",
          "Compare 3 business banks on fees, integrations, and ACH limits",
          "Pick your bank and complete the application checklist (docs needed)",
          "Pick a bookkeeping tool (Wave / QuickBooks) and bookmark the signup",
        ],
        takeaway: "EIN & Banking Setup — EIN application queued + business-bank shortlist + bookkeeping starter",
        takeawayGenerator: "Legal Checklist Generator",
        followUp:
          "Submit the bank application with your documents — most banks open the account in 1–7 days.",
      },
      {
        title: "Compliance & legal kit",
        deliverable:
          "Customized drafts: T&Cs, Privacy Policy, 1-page service agreement + license requirements documented",
        tool: "GA compliance checklist + contract templates",
        details: [
          "Document Gwinnett city/county business license requirements",
          "Note GA sales tax registration steps if you'll sell taxable items",
          "Customize Terms of Service and Privacy Policy from vetted templates",
          "Customize a 1-page service agreement / SOW for your first sale",
        ],
        takeaway: "Contract Pack — signed Terms of Service, Privacy Policy, and 1-page Master Service Agreement",
        takeawayGenerator: "Legal Checklist Generator",
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
    takeHome: "One named first customer with their pain priced in dollars, a 25-name prospect list the targeting engine pulled from your niche and zip, and a validated outreach script — exported as a CSV you can start messaging tonight.",
    duration: "60 min",
    covers: ["Your first customer", "Validation script", "3-competitor look", "What makes you different"],
    generators: ["Customer Research Generator", "Market Analysis Generator", "Competitive Analysis Generator"],
    tasks: [
      {
        title: "Pick your first real customer",
        deliverable:
          "A one-page profile of one specific buyer, their top 3 problems, and what each problem costs them in dollars.",
        tool: "Customer profile worksheet",
        details: [
          "Name one specific buyer (role, industry, company size, location)",
          "List their top-3 pains in their own words",
          "Attach a dollar cost to each pain (time, lost revenue, risk)",
          "Map where they already hang out — online and offline",
        ],
        takeaway: "Ideal Customer Profile (ICP) — 1-page profile: demographics, jobs-to-be-done, willingness-to-pay",
        takeawayGenerator: "Customer Research Generator",
      },
      {
        title: "Estimate the market + write a short script you'll send",
        deliverable:
          "A real-world estimate of how many buyers exist + a 25-name list + a short script you'll send them.",
        tool: "Market snapshot template + validation script",
        details: [
          "Estimate how many buyers exist, how many you can realistically reach, and how many you'll win in year one (TAM/SAM/SOM)",
          "Pull a 25-name prospect list from LinkedIn, local groups, or referrals",
          "Customize the problem-discovery script for your first customer",
          "Pick a scoring rubric: pain confirmed, willingness to pay, intow to others",
        ],
        takeaway: "Market Sizing + Validation Script — TAM/SAM/SOM snapshot + Mom-Test-style interview script + 25-name CSV",
        takeawayGenerator: "Market Analysis Generator",
        followUp:
          "Send the script to your 25 prospects and run 5 discovery calls within the next 2 weeks; score each one.",
      },
      {
        title: "Look at 3 competitors and find your edge",
        deliverable: "A simple grid comparing 3 competitors + one sentence on what makes you different.",
        tool: "Competitive grid template",
        details: [
          "Identify 3 real competitors (2 direct + 1 substitute)",
          "Score each on offer, price, channel, proof, and weakness",
          "Find the gap they all miss — your edge",
          "Write a one-line positioning statement: For X, who Y, we are Z because…",
        ],
        takeaway: "Competitive Positioning Matrix — 3-competitor grid + 1-sentence differentiation statement",
        takeawayGenerator: "Competitive Analysis Generator",
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
    takeHome: "A one-sentence offer a buyer can say yes or no to, a price the margin calculator backed into from your real costs, and the exact number of sales you need to break even — locked into a one-page offer sheet.",
    duration: "60 min",
    covers: ["Offer in one sentence", "What's in V1", "Pricing & break-even"],
    generators: ["Concept Brief Generator", "Product Development Generator", "Pricing & Packaging Generator"],
    tasks: [
      {
        title: "Write the offer in one sentence",
        deliverable: "An offer written in one clear sentence a buyer can say yes or no to.",
        tool: "Offer-builder template",
        details: [
          "Use the formula: We help [who] achieve [outcome] in [time] without [pain]",
          "Test it against your first-customer profile",
          "Strip jargon — read it aloud to a partner",
          "Lock the final sentence; it feeds your website and pitch",
        ],
        takeaway: "Concept Brief — one-sentence value proposition + startup DNA card",
        takeawayGenerator: "Concept Brief Generator",
      },
      {
        title: "Decide what your first version actually includes",
        deliverable: "A one-page 'how we deliver this' that lists every step from sale to handoff.",
        tool: "First-version scope + delivery steps",
        details: [
          "List what's IN scope for the first version — and what's explicitly OUT",
          "Map the 5–8 steps from sale to delivery",
          "Identify tools, suppliers, or contractors needed",
          "Estimate time-to-fulfill so pricing covers your hours",
        ],
        takeaway: "MVP Scope & Service Blueprint — first-version deliverable mapped from sale to handoff",
        takeawayGenerator: "Product Development Generator",
      },
      {
        title: "Set price, margin & payment terms",
        deliverable: "A pricing sheet + how many sales you need to cover your costs.",
        tool: "Pricing & margin calculator",
        details: [
          "Compute what each sale actually costs you to make",
          "Set price using value, cost-plus, and competitor anchors",
          "Calculate units/month to break even and to hit a target income",
          "Define deposit, milestones, refund policy, and accepted payment methods",
        ],
        takeaway: "Pricing & Margin Model — pricing sheet + exact break-even number + payment terms",
        takeawayGenerator: "Pricing & Packaging Generator",
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
    takeHome: "Your delivery process mapped step-by-step by the build-type generator, the free apps that run it provisioned with starter accounts, and your first customer's deliverable drafted and rehearsed — before a real customer ever sees it.",
    duration: "60 min",
    covers: ["Service / online / product", "Your free app setup", "What the customer receives"],
    generators: ["Business Model Canvas Generator", "Operations Plan Generator"],
    tasks: [
      {
        title: "Pick what kind of business you're building and map the steps",
        deliverable:
          "A one-page picture of how a sale becomes a happy customer (sale → intake → delivery → handoff) with the app you'll use at each step.",
        tool: "Build type picker + step-by-step map",
        details: [
          "Service: intake → kickoff → delivery template → recap loop",
          "Online: pick a no-code stack (Lovable, Notion, Framer, Webflow, Shopify, GHL) and name the first screen",
          "Physical product: supplier/manufacturer shortlist + sample-order checklist + packaging decision",
          "Mark every step that depends on a vendor, contractor, or sample order",
        ],
        takeaway: "Business Model Canvas — chosen build type + 9-block canvas of how your business runs",
        takeawayGenerator: "Business Model Canvas Generator",
        followUp:
          "Run the steps end-to-end with one test buyer (or sample order) in the first 2 weeks and revise the map.",
      },
      {
        title: "Set up your free apps",
        deliverable:
          "Free accounts created for the apps you'll run the business on, plus a one-page picture of how they connect (no paid plans signed today).",
        tool: "Free-app checklist",
        details: [
          "Project hub: seed a Notion / ClickUp / Trello workspace from a starter template",
          "Files & assets: create your Drive / Dropbox folder structure",
          "Comms: set up scheduling (Cal.com / Calendly free) + business email alias",
          "Build-type tool: Loom (service) / Figma (online) / supplier portal accounts (physical)",
        ],
        takeaway: "Operations Stack — free-app accounts provisioned and mapped to your canvas",
        takeawayGenerator: "Operations Plan Generator",
        followUp:
          "Upgrade to paid tiers as revenue justifies and connect any integrations that require billing.",
      },
      {
        title: "Draft what your first customer will actually receive",
        deliverable:
          "Three drafted pieces saved to your folder + a 5-point checklist you can run before you send anything to a real customer.",
        tool: "Customer-delivery templates (per build type)",
        details: [
          "Service: kickoff doc + delivery template + recap email — all three drafted",
          "Online: landing/demo screen sketched in your builder + onboarding flow outlined + first email drafted",
          "Physical: product spec sheet + unboxing/insert-card draft + first-customer thank-you note",
          "Write a 5-point quality checklist (quality, accuracy, timing, tone, follow-up)",
        ],
        takeaway: "Delivery Rehearsal — first customer's deliverable drafted and rehearsed end-to-end + 5-point quality checklist",
        takeawayGenerator: "Operations Plan Generator",
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
    summary: "Identity plus website drafts ready to publish when your domain is live.",
    oneLiner: "Brand & website",
    takeHome: "Logo, color palette, and font pairing generated by the brand-kit AI from your business name; a Home page and Offer page drafted directly inside your site builder; payments, email, and analytics queued for one-click connection the moment your domain resolves.",
    duration: "75 min",
    covers: ["Brand kit", "Website drafts", "Make Google find each page", "Payments checklist"],
    generators: ["Brand Builder Generator", "Vision & Mission Generator", "Website Copy Generator", "Operations Plan Generator"],
    tasks: [
      {
        title: "Name, domain & brand kit",
        deliverable:
          "Domain availability confirmed + cart ready + brand kit folder (logo, palette, fonts) assembled",
        tool: "Domain check + AI brand kit",
        details: [
          "Confirm name availability (.com, USPTO TESS, social handles)",
          "Pick a registrar and load the domain into your cart",
          "Generate logo + 4-color palette + 2 fonts in your brand kit",
          "Save brand assets to a shared folder (Drive / Notion)",
        ],
        takeaway: "Brand Identity + Vision/Mission — logo, palette, fonts, claimed domain + one-line vision and mission anchoring the brand",
        takeawayGenerator: "Brand Builder Generator + Vision & Mission Generator",
        followUp:
          "Complete the domain purchase and point DNS to your site builder — usually 15 minutes plus propagation.",
      },
      {
        title: "Build the website drafts (Home / Offer / About / Contact)",
        deliverable:
          "Site template selected; Home + Offer drafted in builder; About + Contact outlined; each page set up so Google can find it.",
        tool: "Site builder + on-page SEO checklist",
        details: [
          "Pick a starter template and apply your brand kit",
          "Draft Home and Offer pages with your locked messaging",
          "Outline About and Contact pages (headline + sections)",
          "Fill on-page SEO per page: title, meta, single H1, image alts",
        ],
        takeaway: "Website Copy Pack — Home, Offer, About, Contact drafted directly inside your site builder with on-page SEO",
        takeawayGenerator: "Website Copy Generator",
        followUp:
          "Connect your domain, do a final mobile pass, and click Publish — usually under an hour once DNS resolves.",
      },
      {
        title: "Payments, email & analytics — application checklists",
        deliverable:
          "Payments provider chosen + application checklist completed; GA4 property created + tracking snippet ready; business email provider chosen + setup steps documented",
        tool: "Essentials setup checklist",
        details: [
          "Pick Stripe or Square; complete the application info checklist",
          "Create your GA4 property and copy the tracking snippet",
          "Pick an email provider (Google Workspace / Zoho) and document MX steps",
          "Decide your welcome-email copy for new leads",
        ],
        takeaway: "RevOps Stack — Stripe, email-on-domain, and GA4 application checklists complete and queued",
        takeawayGenerator: "Operations Plan Generator",
        followUp:
          "Finish payments KYC, install the GA4 snippet on the published site, and verify your business email — typically 1–3 days.",
      },
    ],
  },
  {
    n: 6,
    slug: "marketing",
    title: "Marketing plan & creatives",
    shortTitle: "marketing",
    summary:
      "A 1-page marketing plan plus your full creative kit — printed flyers, business cards, social profiles, and post drafts — ready to take to a printer or scheduler.",
    oneLiner: "Plan & creatives",
    takeHome: "A printable business card and flyer rendered by the creative-kit AI, claimed handles on the three channels your customer actually uses, six on-brand post drafts queued in your scheduler, and a 60-second founder video script — your full launch kit, done.",
    duration: "60 min",
    covers: ["Messaging kit", "Print creatives", "Social kit", "30-day plan"],
    generators: ["Marketing Strategy Generator", "Social Launch Generator"],
    tasks: [
      {
        title: "Core messaging kit",
        deliverable: "Headline, 3 value props, 30-sec pitch, founder bio",
        tool: "Messaging kit template",
        details: [
          "Write a headline that names the buyer + outcome",
          "Draft 3 value props mapped to the top-3 customer pains",
          "Rehearse a 30-second verbal pitch",
          "Write a 100-word founder bio for site, social, and outreach",
        ],
        takeaway: "Messaging House — headline, 3 value props, 30-second pitch, 100-word founder bio",
        takeawayGenerator: "Marketing Strategy Generator",
      },
      {
        title: "Your print and social kit",
        deliverable:
          "Business-card draft + flyer / one-pager draft + social profiles claimed with copy & banner + 6 post drafts + 1 sixty-second video script",
        tool: "Creative kit templates (print + social)",
        details: [
          "Draft a business card (front/back) in your brand kit",
          "Draft a 1-page flyer / one-pager for events, walk-ins, and partner shelves",
          "Claim handles on Instagram, LinkedIn, and one of TikTok / YouTube / X — fill profile copy, link-in-bio, banner",
          "Draft 6 posts (hooks, proof, offer) + 1 sixty-second video script you can record this week",
        ],
        takeaway: "Launch Creative Kit — printable business card + flyer + claimed handles + 6 on-brand post drafts + 60-second video script",
        takeawayGenerator: "Social Launch Generator",
        followUp:
          "Send the print files to your printer and schedule the 6 posts in Buffer / Later / Meta Business Suite; record the video.",
      },
      {
        title: "1-page marketing plan",
        deliverable: "A 1-page plan: channels, budget, 30-day calendar, and 3 numbers to check every week.",
        tool: "Marketing plan template",
        details: [
          "Pick your top-2 acquisition channels (1 organic, 1 outbound or paid)",
          "Set a weekly time + dollar budget per channel",
          "Build a 30-day content + outreach calendar (publish dates locked)",
          "Define 3 KPIs: leads/week, reply rate, conversion to sale",
        ],
        takeaway: "30-Day GTM Plan — 2-channel calendar + budget + 3 weekly KPIs",
        takeawayGenerator: "Marketing Strategy Generator",
      },
    ],
  },
  {
    n: 7,
    slug: "launch",
    title: "Launch plan",
    shortTitle: "launch",
    summary: "Your dated 90-day plan, your launch-day checklist, and the weekly check-in that keeps you moving.",
    oneLiner: "90-day plan",
    takeHome: "A signed, dated 90-day plan (first 3 paying customers → 10 → repeatable channel) generated from your offer, customer list, and marketing kit; a launch-day checklist with outreach drafts ready to send; and an accountability partner already on next Monday's calendar.",
    duration: "45 min",
    covers: ["90-day plan", "Launch-day checklist", "Outreach drafts", "Accountability"],
    generators: ["Launch Plan Generator", "Sales Strategy Generator", "Growth Hacking Generator"],
    tasks: [
      {
        title: "Sign your 90-day plan (30 / 60 / 90)",
        deliverable: "Signed PDF: first 3 customers → 10 → repeatable channel",
        tool: "Launch plan template",
        details: [
          "Day 1–30: ship offer, close first 3 paying customers",
          "Day 31–60: refine fulfillment, reach 10 customers, collect testimonials",
          "Day 61–90: double down on the channel that worked, kill what didn't",
          "Sign and date it — print copy goes on the wall",
        ],
        takeaway: "30/60/90 Launch Roadmap — signed, dated plan: first 3 paying customers → 10 → repeatable channel",
        takeawayGenerator: "Launch Plan Generator",
      },
      {
        title: "Launch-day checklist & outreach drafts",
        deliverable:
          "25-name announcement list + 10 personalized outreach drafts + day-of timeline (drafts saved, not sent)",
        tool: "Launch checklist + outreach templates",
        details: [
          "Build a 25-name personal announcement list (friends, peers, past clients)",
          "Draft 10 personalized outreach messages (DM, email, voice note)",
          "Identify 3 partner / press / community asks for a co-launch boost",
          "Lock a day-of timeline: 8 AM post → 10 AM email → 2 PM follow-ups",
        ],
        takeaway: "Launch Sequence Playbook — launch-day checklist + 10 personalized outreach drafts ready to send",
        takeawayGenerator: "Sales Strategy Generator",
        followUp:
          "Pick your launch date, send the drafts that morning, and work the day-of timeline.",
      },
      {
        title: "Sales pipeline + accountability",
        deliverable:
          "CRM seeded + 3 weekly metrics defined + accountability partner identified + cadence agreed",
        tool: "CRM starter + accountability pairing",
        details: [
          "Seed a free CRM (HubSpot / Notion) with the announcement list",
          "Define 3 weekly metrics: pipeline added, calls booked, sales closed",
          "Pair with a cohort accountability partner",
          "Agree on a weekly 20-min check-in cadence and channel",
        ],
        takeaway: "Sales Pipeline + Growth Loop — starter CRM populated + first repeatable acquisition loop + accountability partner on the calendar",
        takeawayGenerator: "Sales Strategy Generator + Growth Hacking Generator",
        followUp:
          "Both partners put the 4 weekly check-ins on each other's calendars after the workshop.",
      },
    ],
  },
];

export const stageBySlug = (slug: string) => STAGES.find((s) => s.slug === slug);
