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
  tasks: Task[];
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
      "Your Georgia LLC filing packet, EIN application, and signed legal kit (Terms, Privacy, Service Agreement) — all customized to your business and ready to submit, plus a funding model with 12-month runway, a business plan with pro formas, an investor-ready pitch deck, and a fundraising kit ready to send. File Monday, start taking money the same week.",
    walkOut: [
      "Articles of Organization pre-filled in your GA Secretary of State account",
      "EIN application completed and submitted — number issued in the session",
      "Business-bank shortlist + bank application checklist filled for your business",
      "Terms of Service, Privacy Policy, and 1-page Service Agreement customized to your business",
      "Local license + sales-tax requirements documented for your county",
      "Funding model & 12-month runway: real costs, margins, break-even, and cash picture by month",
      "Business plan with pro formas: short narrative plan + 12-month P&L, cash flow, and break-even pro forma a bank or investor will accept",
      "Investor-ready pitch deck: 10 slides in your brand (problem, solution, market, offer, traction, model, GTM, team, ask, use of funds)",
      "Fundraising kit: 1-page raise summary, funder outreach list with email template, and your path picked across grants, microloans, SBA, and friends-and-family",
    ],

    afterWorkshop: [
      "Submit the Articles + filing fee from home (about 10 minutes)",
      "Open the business bank account (1–7 days after you apply)",
      "File local business license and sales-tax registration once the entity is approved",
    ],
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
      {
        title: "Funding model, business plan with pro formas, pitch deck & fundraising kit",
        deliverable:
          "Your funding model with 12-month runway, a business plan with pro formas (12-month P&L, cash flow, and break-even), a 10-slide investor-ready pitch deck in your brand, and a fundraising kit — 1-page raise summary, funder outreach list with email template, and your path picked across grants, microloans, SBA, and friends-and-family.",
        tool: "Funding model + business plan + pitch deck + raise kit templates",
        details: [
          "Build the funding model: startup costs, monthly burn, break-even, and a 12-month cash picture",
          "Build a 12-month P&L, cash flow, and break-even pro forma alongside a short narrative business plan",
          "Pick the funding path: grants, microloans, SBA, revenue-based, line of credit, friends & family, or equity",
          "Draft the 10-slide pitch deck in your brand: problem, solution, market, offer, traction, model, GTM, team, ask, use of funds",
          "Write the 1-page raise summary and customize the funder outreach email template so it's ready to send",
        ],
        takeaway:
          "Your funding model, business plan with pro formas, investor-ready pitch deck, and fundraising kit — ready to send.",
        followUp:
          "Build out the funder list and send the outreach in the first 2 weeks; book intro calls with anyone who replies.",

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
      "A sourced 1-page research brief on your idea (market size, trend, regulation, suppliers, real customer quotes), one named first customer with their problems priced in dollars, a starter prospect list you begin in-session, a validated outreach script, a competitive research pack, and a one-sentence competitive advantage brief — your defensible 'secret sauce' pulled from the research.",
    walkOut: [
      "1-page idea-research brief: market size, trend, regulation, supplier/competitor scan, and sourced customer quotes",
      "1-page profile of your first named buyer with their top 3 problems priced in dollars",
      "Starter prospect list begun in-session with the source template and CSV export ready",
      "Outreach script customized to that specific buyer",
      "Competitive research pack: 3 competitors compared on offer, price, and positioning, with sourced customer quotes and a one-page 'what makes you different' summary",
      "Competitive advantage brief: your defensible 'secret sauce' written in one sentence, sourced from the research + competitor scan",
    ],

    afterWorkshop: [
      "Fill out the prospect list and run discovery calls within the next 2 weeks",
    ],
    duration: "60 min",
    covers: ["Your first customer", "Validation script", "3-competitor look", "What makes you different"],
    tasks: [
      {
        title: "Research the idea from every angle",
        deliverable:
          "A one-page research brief on your idea: market size, trend direction, regulation/permits, supplier/competitor scan, pricing benchmarks, and real customer quotes pulled from forums or reviews — with source links.",
        tool: "Idea-research brief template",
        details: [
          "Write 5 research questions that would kill or confirm the idea",
          "Pull market-size and trend data from public sources (IBISWorld snippets, BLS, Statista free)",
          "Scan regulation, permits, and licensing for the business type in your county",
          "Pull real customer quotes from Reddit, Facebook groups, or product reviews — log every URL",
        ],
        takeaway:
          "Your idea-research brief — sourced, dated, and decision-ready.",
      },
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
          "A real-world estimate of how many buyers exist for your business, a starter prospect list you begin in-session, and a short outreach script customized to your first customer.",
        tool: "Market snapshot template + validation script",
        details: [
          "Estimate how many buyers exist, how many you can realistically reach, and how many you'll win in year one",
          "Start your prospect list from LinkedIn, local groups, or referrals using the source template",
          "Customize the problem-discovery script for your first customer",
          "Pick a scoring rubric: pain confirmed, willingness to pay, intro to others",
        ],
        takeaway:
          "Your market snapshot + starter prospect list + outreach script — customized to your business.",
        followUp:
          "Fill out the prospect list and run discovery calls in the next 2 weeks; score each one.",
      },
      {
        title: "Competitive research pack + competitive advantage brief",
        deliverable:
          "A competitive research pack: 3 competitors compared on offer, price, channel, proof, and weakness, with sourced customer quotes and a one-page 'what makes you different' summary — plus a one-sentence competitive advantage brief (your defensible 'secret sauce') you can put on the website and in pitches.",
        tool: "Competitive research template + advantage brief",
        details: [
          "Identify 3 real competitors (2 direct + 1 substitute)",
          "Score each on offer, price, channel, proof, and weakness",
          "Pull sourced customer quotes that show where each competitor falls short",
          "Distill the research + competitor weaknesses into one defensible advantage and write it as a one-sentence positioning line",
          "Write a one-line positioning statement: For X, who Y, we are Z because…",
        ],
        takeaway:
          "Your competitive research pack plus a competitive advantage brief — your 'secret sauce' written in one sentence you can defend.",
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
      "Your offer written in one sentence a buyer can say yes or no to, your price set from a 3-competitor scan, value to the customer, and your real costs, the exact number of sales you need to break even, and a signed go / pivot / kill viability score — on a one-page offer sheet.",
    walkOut: [
      "Your one-sentence offer locked",
      "First-version scope mapped step-by-step from sale to handoff",
      "Competitor + value-based pricing: 3-competitor price scan, value & cost-plus anchors, real cost per sale, break-even number, and payment terms",
      "Signed viability scorecard with a go / pivot / kill decision, scored on 6 dimensions with evidence",
    ],
    afterWorkshop: [],
    duration: "60 min",
    covers: ["Offer in one sentence", "What's in V1", "Competitor + value-based pricing"],

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
        title: "Set price using competitor + value benchmarks",
        deliverable:
          "Your pricing sheet built from a 3-competitor price scan and the value to your customer, with real cost per sale, margin, break-even, and payment terms.",
        tool: "Competitor + value-based pricing calculator",
        details: [
          "Scan 3 named competitors and capture their public prices and what's included",
          "Set price using value, cost-plus, and competitor anchors",
          "Compute what each sale actually costs you to make",
          "Calculate units/month to break even and to hit a target income",
          "Define deposit, milestones, refund policy, and accepted payment methods",
        ],
        takeaway:
          "Your pricing sheet — anchored to competitors and customer value — plus exact break-even number and payment terms.",
      },

      {
        title: "Score the idea — go / pivot / kill",
        deliverable:
          "A signed one-page viability scorecard rating your business on demand evidence, willingness to pay, unit economics, founder fit, regulatory load, and time to first dollar — each 0–5 with the evidence written next to it.",
        tool: "Viability scorecard",
        details: [
          "Score each of the 6 dimensions 0–5 against the research, customer profile, and pricing",
          "Write one sentence of evidence per score — no number stands alone",
          "Total the score: ≥22 go, 15–21 pivot the weakest dimension, <15 kill",
          "Write your one-sentence recommendation and sign it",
        ],
        takeaway:
          "Your signed viability scorecard with a go / pivot / kill decision and the evidence behind it.",
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
      "Your delivery process mapped step-by-step, the free apps that run it set up with your accounts, your first customer's deliverable drafted and rehearsed, 3 written SOPs (sales intake, fulfillment, onboarding) loaded into your project hub, and a sourcing & staffing plan for the raw goods, services, and talent you'll need — before a real customer ever sees it.",
    walkOut: [
      "Sale-to-happy-customer map with the app you'll use at each step",
      "Free-app accounts created in your name: project hub, files, scheduling, business email alias",
      "Your first customer's deliverable drafted and rehearsed end-to-end",
      "5-point quality checklist for anything that goes to a real customer",
      "Operations & workflow: 3 runnable SOPs (intake, fulfillment, onboarding) in your project hub plus a one-page weekly operating rhythm",
      "Sourcing & staffing plan: named suppliers, contractors, or hires for raw goods, services, and talent — with a first-call list",
    ],

    afterWorkshop: [
      "Run the rehearsed deliverable past your first paying customer and iterate",
      "Upgrade to paid app tiers as revenue justifies",
    ],
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
      {
        title: "Operations & workflow + sourcing & staffing plan",
        deliverable:
          "3 written SOPs specific to your business (sales intake, fulfillment, customer onboarding) loaded into your project hub as runnable templates, a one-page weekly operating rhythm, and a sourcing & staffing plan naming the suppliers, contractors, or first hires you'll need for raw goods, services, and talent.",
        tool: "SOP templates + weekly operating rhythm + sourcing & staffing plan",
        details: [
          "Pick the 3 highest-leverage workflows: sales intake, fulfillment, customer onboarding",
          "Write each as a numbered SOP: trigger → inputs → steps → owner → tools → definition of done",
          "Add a 'what breaks this' section listing the top 3 failure modes and the recovery step",
          "Draft a one-page weekly operating rhythm: standing blocks, review cadence, and the 3 numbers you check every Friday",
          "Load all 3 SOPs into Notion / ClickUp / Trello as runnable templates anyone on the team can follow",
          "Identify named sources for raw goods, services, and talent — suppliers, contractors, and any first hires — and capture them as a first-call list",
        ],
        takeaway:
          "Your operations & workflow plus a sourcing & staffing plan — SOPs, weekly rhythm, and a first-call list for goods, services, and talent.",
        followUp:
          "Run each SOP once with a real or rehearsed customer in the first 2 weeks; revise the steps that broke.",

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
    walkOut: [
      "Logo, 4-color palette, and font pairing saved to your brand-kit folder",
      "A complete website built in your site builder — Home, Offer, About, Contact pages designed in your brand, written in your voice, mobile-checked",
      "On-page SEO filled per page (title, meta, single H1, image alts)",
      "Stripe (or Square) application filled out for your business",
      "GA4 property created with your tracking snippet copied",
      "Business-email provider chosen with MX setup steps documented",
    ],
    afterWorkshop: [
      "Buy your domain and point DNS to your site builder (15 minutes + propagation)",
      "Click Publish on the website (under an hour once DNS resolves)",
      "Finish Stripe KYC (1–3 days)",
      "Install the GA4 tracking snippet on the published site",
      "Verify business email on your domain",
    ],
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
    title: "Marketing & creatives",
    shortTitle: "marketing",
    summary:
      "Your printable business card and flyer, your social channels branded, and a 30-day plan to put it all in motion.",
    oneLiner: "Plan & creatives",
    takeHome:
      "A printable business card and flyer designed in your brand, your social channels claimed and branded (profile copy, banner, link-in-bio), six on-brand posts and a 60-second founder video script — your full launch kit, ready to print and configure.",
    walkOut: [
      "Headline, 3 value props, 30-second pitch, and 100-word founder bio",
      "Print-ready business card (front/back) designed in your brand",
      "Print-ready 1-page flyer designed in your brand",
      "Instagram, LinkedIn, and one of TikTok/YouTube/X — handles claimed, profile copy, link-in-bio, and banner filled in",
      "6 on-brand post drafts + 60-second founder video script",
      "Marketing & communications: audience, channels, messaging pillars, 30-day content calendar, weekly budget, and 3 weekly KPIs",
    ],
    afterWorkshop: [
      "Send the print files to your printer",
      "Schedule the 6 posts in Buffer / Later / Meta Business Suite",
      "Record the 60-second founder video",
    ],
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
        title: "Marketing & communications",
        deliverable:
          "Your marketing & communications: audience, channels, messaging pillars, 30-day content calendar, weekly budget, and 3 numbers to check every week.",
        tool: "Marketing & communications template",
        details: [
          "Lock the audience and the 3 messaging pillars you'll repeat across every channel",
          "Pick your top-2 acquisition channels (1 organic, 1 outbound or paid)",
          "Set a weekly time + dollar budget per channel",
          "Build a 30-day content + outreach calendar (publish dates locked)",
          "Define 3 KPIs: leads/week, reply rate, conversion to sale",
        ],
        takeaway:
          "Your marketing & communications — audience, channels, messaging pillars, 30-day calendar, weekly budget, 3 weekly KPIs.",
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
      "Your signed, dated 90-day plan with a go-to-market feeding it (first 3 paying customers → 10 → repeatable channel), your launch-day checklist with personal outreach drafts ready to send, and an accountability partner on next Monday's calendar.",
    walkOut: [
      "Go-to-market: target segment, offer, pricing, channel mix, week-by-week tactics, and KPIs that prove it's working",
      "Signed, dated 30/60/90 plan: first 3 paying customers → 10 → repeatable channel",
      "Personal announcement list started in-session",
      "Personal outreach drafts saved (DM, email, voice note)",
      "Day-of launch timeline locked",
      "Starter CRM seeded with your announcement list",
      "3 weekly metrics defined + accountability partner paired with cadence agreed",
    ],
    afterWorkshop: [
      "Pick your launch date and send the drafts that morning",
      "Both partners put the 4 weekly check-ins on each other's calendars",
    ],
    duration: "45 min",
    covers: ["90-day plan", "Launch-day checklist", "Outreach drafts", "Accountability"],
    tasks: [
      {
        title: "Sign your 90-day plan (30 / 60 / 90)",
        deliverable:
          "Your signed, dated 90-day plan for your business: first 3 customers → 10 → repeatable channel.",
        tool: "Launch plan template",
        details: [
          "Lock the go-to-market: target segment, offer, pricing, channel mix, and week-by-week tactics feeding the 30/60/90",
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
          "Your personal announcement list started in-session, personal outreach drafts written from templates you've customized, and a day-of timeline (drafts saved, not sent).",
        tool: "Launch checklist + outreach templates",
        details: [
          "Start your personal announcement list (friends, peers, past clients) using the source template",
          "Customize personal outreach drafts (DM, email, voice note) from the templates",
          "Identify 3 partner / press / community asks for a co-launch boost",
          "Lock a day-of timeline: 8 AM post → 10 AM email → 2 PM follow-ups",
        ],
        takeaway:
          "Your launch-day checklist + personal outreach drafts — ready to send.",
        followUp:
          "Fill out the list, pick your launch date, send the drafts that morning, and work the day-of timeline.",
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
