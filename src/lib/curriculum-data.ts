export type Task = {
  title: string;
  deliverable: string;
  tool: string;
  details: string[];
  followUp?: string;
};

export type Stage = {
  n: number;
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  oneLiner: string;
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
    duration: "60 min",
    covers: ["GA LLC packet", "EIN", "T&Cs / privacy", "Service agreement"],
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
    duration: "60 min",
    covers: ["Beachhead persona", "Validation script", "Competitive analysis", "Positioning gap"],
    tasks: [
      {
        title: "Pick one beachhead customer",
        deliverable: "One-page customer profile with top-3 pains and $ figures",
        tool: "Customer profile worksheet",
        details: [
          "Name one specific buyer (role, industry, company size, location)",
          "List their top-3 pains in their own words",
          "Attach a dollar cost to each pain (time, lost revenue, risk)",
          "Map where they already hang out — online and offline",
        ],
      },
      {
        title: "Market size + validation script",
        deliverable:
          "TAM/SAM estimate + 25-name prospect list + personalized validation script ready to send",
        tool: "Market snapshot template + validation script",
        details: [
          "Estimate TAM, SAM, and your realistic SOM in 12 months",
          "Pull a 25-name prospect list from LinkedIn, local groups, or referrals",
          "Customize the problem-discovery script for your beachhead",
          "Pick a scoring rubric: pain confirmed, willingness to pay, intro to others",
        ],
        followUp:
          "Send the script to your 25 prospects and run 5 discovery calls within the next 2 weeks; score each one.",
      },
      {
        title: "Competitive analysis & positioning",
        deliverable: "3-competitor grid + your positioning gap",
        tool: "Competitive grid template",
        details: [
          "Identify 3 real competitors (2 direct + 1 substitute)",
          "Score each on offer, price, channel, proof, and weakness",
          "Find the gap they all miss — your wedge",
          "Write a one-line positioning statement: For X, who Y, we are Z because…",
        ],
      },
    ],
  },
  {
    n: 3,
    slug: "offer",
    title: "Offer & product",
    shortTitle: "offer",
    summary: "What you actually sell, how it's delivered, and the price tag.",
    oneLiner: "Offer & pricing",
    duration: "50 min",
    covers: ["Offer sentence", "V1 scope + SOP", "Pricing & break-even"],
    tasks: [
      {
        title: "Write the offer in one sentence",
        deliverable: "Signed-off offer sentence",
        tool: "Offer-builder template",
        details: [
          "Use the formula: We help [who] achieve [outcome] in [time] without [pain]",
          "Test it against your beachhead customer profile",
          "Strip jargon — read it aloud to a partner",
          "Lock the final sentence; it feeds your website and pitch",
        ],
      },
      {
        title: "Define the V1 deliverable & fulfillment SOP",
        deliverable: "V1 scope + 1-page standard operating procedure",
        tool: "MVP scope canvas + fulfillment SOP",
        details: [
          "List what's IN scope for V1 — and what's explicitly OUT",
          "Map the 5–8 steps from sale to delivery",
          "Identify tools, suppliers, or contractors needed",
          "Estimate time-to-fulfill so pricing covers your hours",
        ],
      },
      {
        title: "Set price, margin & payment terms",
        deliverable: "Pricing sheet + break-even units",
        tool: "Pricing & margin calculator",
        details: [
          "Compute COGS or delivery cost per unit",
          "Set price using value, cost-plus, and competitor anchors",
          "Calculate units/month to break even and to hit a target income",
          "Define deposit, milestones, refund policy, and accepted payment methods",
        ],
      },
    ],
  },
  {
    n: 4,
    slug: "build",
    title: "Build the operational MVP",
    shortTitle: "build",
    summary:
      "Stand up how you actually deliver. Pick your archetype, assemble the toolkit, and draft the V1 artifact your first customer receives.",
    oneLiner: "Operational V1",
    duration: "60 min",
    covers: ["Archetype + V1 workflow", "Tool stack", "Delivery artifact drafts"],
    tasks: [
      {
        title: "Pick your build archetype & lock the V1 workflow",
        deliverable:
          "Archetype selected (Service / Digital / Physical) + 1-page V1 workflow diagram (sale → intake → delivery → handoff) with named tools at each step",
        tool: "Build archetype picker + workflow canvas",
        details: [
          "Service: intake → kickoff → delivery template → recap loop",
          "Digital: pick a no-code/template stack (Lovable, Notion, Framer, Webflow, Shopify, GHL) and name the first screen",
          "Physical: supplier/manufacturer shortlist + sample-order checklist + packaging decision",
          "Mark every step that depends on a vendor, contractor, or sample order",
        ],
        followUp:
          "Run the workflow end-to-end with one test buyer (or sample order) in the first 2 weeks and revise the diagram.",
      },
      {
        title: "Assemble the operational toolkit",
        deliverable:
          "Tool stack chosen + free-tier accounts created + 1-page integration map (no paid plans signed in-session)",
        tool: "Ops stack checklist",
        details: [
          "Project / ops hub: seed a Notion / ClickUp / Trello workspace from a V1 template",
          "Files & assets: create your Drive / Dropbox folder structure",
          "Comms: set up scheduling (Cal.com / Calendly free) + business email alias",
          "Archetype tool: Loom (service) / Figma (digital) / supplier portal accounts (physical)",
        ],
        followUp:
          "Upgrade to paid tiers as revenue justifies and connect any integrations that require billing.",
      },
      {
        title: "Draft your V1 customer-delivery artifact",
        deliverable:
          "Three drafted artifacts saved to your workspace + 5-point QA checklist you can run before delivering to a real customer",
        tool: "Delivery artifact templates (per archetype)",
        details: [
          "Service: kickoff doc + delivery template + recap email — all three drafted",
          "Digital: landing/demo screen wireframed in your builder + onboarding flow outlined + first email drafted",
          "Physical: product spec sheet + unboxing/insert-card draft + first-customer thank-you note",
          "Write a 5-point QA checklist (quality, accuracy, timing, tone, follow-up)",
        ],
        followUp:
          "Run the artifacts past your first paying customer and iterate after their feedback.",
      },
    ],
  },
  {
    n: 5,
    slug: "brand",
    title: "Brand & website",
    shortTitle: "brand",
    summary: "Identity plus website drafts ready to publish when your domain is live.",
    oneLiner: "Identity & website",
    duration: "60 min",
    covers: ["Brand kit", "Website drafts", "On-page SEO", "Payments checklist"],
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
        followUp:
          "Complete the domain purchase and point DNS to your site builder — usually 15 minutes plus propagation.",
      },
      {
        title: "Build the website drafts (Home / Offer / About / Contact)",
        deliverable:
          "Site template selected; Home + Offer drafted in builder; About + Contact outlined; on-page SEO checklist filled per page",
        tool: "Site builder + on-page SEO checklist",
        details: [
          "Pick a starter template and apply your brand kit",
          "Draft Home and Offer pages with your locked messaging",
          "Outline About and Contact pages (headline + sections)",
          "Fill on-page SEO per page: title, meta, single H1, image alts",
        ],
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
        followUp:
          "Finish payments KYC, install the GA4 snippet on the published site, and verify your business email — typically 1–3 days.",
      },
    ],
  },
  {
    n: 6,
    slug: "marketing",
    title: "Marketing plan & materials",
    shortTitle: "marketing",
    summary: "Messaging, social presence drafted, and a 1-page marketing plan to run the next 30 days.",
    oneLiner: "Plan & assets",
    duration: "45 min",
    covers: ["Messaging kit", "Social profiles", "Content drafts", "1-page marketing plan"],
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
      },
      {
        title: "Social media kit & content drafts",
        deliverable:
          "Handles claimed (instant) + profile copy + banner asset + 6 posts and 1 video script drafted",
        tool: "Social setup checklist + content templates",
        details: [
          "Claim handles on Instagram, LinkedIn, and one of TikTok / YouTube / X",
          "Fill profile copy, link-in-bio, and a banner asset",
          "Draft 6 posts (mix of hooks, proof, offer) for the next 2 weeks",
          "Draft 1 short-form video script you can record this week",
        ],
        followUp:
          "Schedule the 6 posts in Buffer / Later / Meta Business Suite and record the video.",
      },
      {
        title: "1-page marketing plan",
        deliverable: "Plan covering channels, budget, 30-day calendar, and 3 KPIs",
        tool: "Marketing plan template",
        details: [
          "Pick your top-2 acquisition channels (1 organic, 1 outbound or paid)",
          "Set a weekly time + dollar budget per channel",
          "Build a 30-day content + outreach calendar (publish dates locked)",
          "Define 3 KPIs: leads/week, reply rate, conversion to sale",
        ],
      },
    ],
  },
  {
    n: 7,
    slug: "launch",
    title: "Launch plan",
    shortTitle: "launch",
    summary: "The dated 30/60/90, the launch-day checklist, and your accountability rhythm.",
    oneLiner: "30 / 60 / 90 plan",
    duration: "40 min",
    covers: ["30/60/90 plan", "Launch-day checklist", "Outreach drafts", "Accountability"],
    tasks: [
      {
        title: "Sign the 30 / 60 / 90 plan",
        deliverable: "Signed PDF: first 3 customers → 10 → repeatable channel",
        tool: "Launch plan template",
        details: [
          "Day 1–30: ship offer, close first 3 paying customers",
          "Day 31–60: refine fulfillment, reach 10 customers, collect testimonials",
          "Day 61–90: double down on the channel that worked, kill what didn't",
          "Sign and date it — print copy goes on the wall",
        ],
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
        followUp:
          "Both partners put the 4 weekly check-ins on each other's calendars after the workshop.",
      },
    ],
  },
];

export const stageBySlug = (slug: string) => STAGES.find((s) => s.slug === slug);
