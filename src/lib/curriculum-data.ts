export type Task = {
  title: string;
  deliverable: string;
  tool: string;
  details: string[];
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
    summary: "The legal foundation. Leave with a real entity you can sell from.",
    oneLiner: "Legal foundation",
    duration: "60 min",
    covers: ["GA LLC filing", "EIN & banking", "T&Cs / privacy", "Service agreement"],
    tasks: [
      {
        title: "Choose structure & register the entity",
        deliverable: "Articles of Organization submitted (GA LLC)",
        tool: "GA Secretary of State filing walk-through",
        details: [
          "Pick LLC vs sole prop vs S-corp using a 5-question decision tree",
          "Reserve and file your business name with the GA SOS",
          "Designate a registered agent (you, partner, or paid service)",
          "Submit Articles of Organization and pay the filing fee",
        ],
      },
      {
        title: "Get your EIN & open a business bank account",
        deliverable: "EIN issued + bank application started",
        tool: "IRS EIN portal + banking checklist",
        details: [
          "Apply for your EIN on the IRS portal (10 minutes, free)",
          "Compare 3 business banks on fees, integrations, and ACH limits",
          "Start an online application with documents ready (EIN, ID, Articles)",
          "Connect bookkeeping (Wave / QuickBooks) on day one",
        ],
      },
      {
        title: "Compliance & legal kit",
        deliverable: "Licenses + T&Cs, privacy policy, and a 1-page service agreement",
        tool: "GA compliance checklist + contract templates",
        details: [
          "Confirm city/county business license requirements for Gwinnett",
          "Register for GA sales tax if you'll sell taxable goods or services",
          "Generate Terms of Service and Privacy Policy from a vetted template",
          "Customize a 1-page service agreement / SOW for your first sale",
        ],
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
    covers: ["Beachhead persona", "Demand test", "Competitive analysis", "Positioning gap"],
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
        title: "Market size + 5-call demand test",
        deliverable: "TAM/SAM estimate + 5 logged validation calls",
        tool: "Market snapshot template + validation script",
        details: [
          "Estimate TAM, SAM, and your realistic SOM in 12 months",
          "Pull a 25-name prospect list from LinkedIn, local groups, or referrals",
          "Run 5 problem-discovery calls using the provided script",
          "Score each call: pain confirmed, willingness to pay, intro to others",
        ],
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
    duration: "60 min",
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
    slug: "brand",
    title: "Brand & website",
    shortTitle: "brand",
    summary: "Identity plus the digital storefront customers will judge you on.",
    oneLiner: "Identity & website",
    duration: "75 min",
    covers: ["Brand kit", "Multi-page website", "On-page SEO", "Payments & analytics"],
    tasks: [
      {
        title: "Name, domain & brand kit",
        deliverable: "Live domain + brand kit folder (logo, colors, type)",
        tool: "Domain check + AI brand kit",
        details: [
          "Confirm name availability (.com, USPTO TESS, social handles)",
          "Purchase domain and connect to your site builder",
          "Generate logo + 4-color palette + 2 fonts in your brand kit",
          "Save brand assets to a shared folder (Drive / Notion)",
        ],
      },
      {
        title: "Build the website (Home / Offer / About / Contact)",
        deliverable: "Published site with 4 pages, mobile-checked, lead form live",
        tool: "Site builder + on-page SEO checklist",
        details: [
          "Ship 4 pages: Home, Offer/Services, About, Contact",
          "Pass mobile review — tap targets, type size, navigation",
          "Set on-page SEO: unique title + meta + single H1 + image alts per page",
          "Add a lead form that routes to your inbox and CRM",
        ],
      },
      {
        title: "Wire email, payments & analytics",
        deliverable: "Test lead + test $1 transaction + tracked event",
        tool: "Essentials setup checklist",
        details: [
          "Connect a business email (you@yourdomain) and email signature",
          "Enable Stripe / Square — run a $1 test charge end-to-end",
          "Install GA4 or Plausible; fire a 'lead' and 'purchase' event",
          "Set up a 1-step welcome email for new leads",
        ],
      },
    ],
  },
  {
    n: 5,
    slug: "marketing",
    title: "Marketing plan & materials",
    shortTitle: "marketing",
    summary: "Messaging, social presence, and a 1-page marketing plan that runs the next 30 days.",
    oneLiner: "Plan & assets",
    duration: "60 min",
    covers: ["Messaging kit", "Social media setup", "1-page marketing plan", "Content calendar"],
    tasks: [
      {
        title: "Core messaging kit",
        deliverable: "Headline, 3 value props, 30-sec pitch, founder bio",
        tool: "Messaging kit template",
        details: [
          "Write a headline that names the buyer + outcome",
          "Draft 3 value props mapped to the top-3 customer pains",
          "Record (or rehearse) a 30-second verbal pitch",
          "Write a 100-word founder bio for site, social, and outreach",
        ],
      },
      {
        title: "Social media kit & cadence",
        deliverable: "Claimed handles + profiles + 2-week content cadence",
        tool: "Social setup checklist + content templates",
        details: [
          "Claim handles on Instagram, LinkedIn, and one of TikTok / YouTube / X",
          "Fill profile copy, banner, link-in-bio, and pinned post",
          "Plan a 2-week cadence: 3 posts/week across pick-2 platforms",
          "Draft 1 short-form video script and 6 post hooks",
        ],
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
    n: 6,
    slug: "launch",
    title: "Launch plan",
    shortTitle: "launch",
    summary: "The dated 30/60/90, the launch-day checklist, and your accountability rhythm.",
    oneLiner: "30 / 60 / 90 plan",
    duration: "45 min",
    covers: ["30/60/90 plan", "Launch-day checklist", "Announcement list", "Sales pipeline"],
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
        title: "Launch-day checklist & announcement list",
        deliverable: "25-name announcement list + 10 outreach drafts + day-of timeline",
        tool: "Launch checklist + outreach templates",
        details: [
          "Build a 25-name personal announcement list (friends, peers, past clients)",
          "Draft 10 personalized outreach messages (DM, email, voice note)",
          "Identify 3 partners / press / community asks for a co-launch boost",
          "Lock a day-of timeline: 8 AM post → 10 AM email → 2 PM follow-ups",
        ],
      },
      {
        title: "Sales pipeline + accountability",
        deliverable: "CRM seeded, 3 weekly metrics defined, 4 check-ins booked",
        tool: "CRM starter + accountability pairing",
        details: [
          "Seed a free CRM (HubSpot / Notion) with the announcement list",
          "Define 3 weekly metrics: pipeline added, calls booked, sales closed",
          "Pair with a cohort accountability partner",
          "Book 4 weekly 20-min check-ins on the calendar before you leave",
        ],
      },
    ],
  },
];

export const stageBySlug = (slug: string) => STAGES.find((s) => s.slug === slug);
