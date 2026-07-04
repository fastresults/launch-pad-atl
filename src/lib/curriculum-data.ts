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
  bonus?: boolean;
};

// Mirrors FRAMEWORK_STAGES (src/lib/framework-deliverables.ts) so the on-site
// /schedule agenda uses the same 5 pillars + 3 bonus tracks the founder sees on
// their dashboard after registering. Titles, ordering, and numbering match the
// framework verbatim. In-room copy describes what's produced live; followUp
// describes what continues on the dashboard.
export const STAGES: Stage[] = [
  {
    n: 1,
    slug: "foundation",
    title: "Foundation",
    shortTitle: "foundation",
    oneLiner: "The bedrock every defensible startup is built on.",
    summary:
      "The one-page story of your startup. Vision, problem, and value prop tight enough that customers buy, partners lean in, and hires say yes.",
    takeHome:
      "Your Executive Summary, Vision & Mission, Problem/Solution Brief, and Value Proposition — the four Foundation deliverables — drafted, sharpened in-room, and ready to paste into your website, pitch, and first sales conversation.",
    walkOut: [
      "Executive Summary — a one-page snapshot of what you do, who it's for, how you make money, and why now",
      "Vision & Mission — the north-star statement your team, customers, and future hires can rally behind",
      "Problem / Solution Brief — the painful problem you solve and exactly how your offer removes it, in plain language",
      "Value Proposition — the single sentence that explains why a customer picks you over every alternative",
    ],
    afterWorkshop: [
      "Paste your Value Prop onto your homepage hero within 48 hours",
      "Test the Executive Summary on 3 people who fit your buyer profile — refine based on where they get confused",
    ],
    duration: "25 min",
    covers: ["Executive Summary", "Vision & Mission", "Problem/Solution", "Value Prop"],
    tasks: [
      {
        title: "Draft the Foundation four",
        deliverable:
          "Executive Summary, Vision & Mission, Problem/Solution Brief, and Value Proposition — all four saved to your dashboard's Foundation stage.",
        tool: "Foundation drafting worksheet + AI-assisted sharpener",
        details: [
          "Write the one-sentence value prop first using the [Who] + [Problem] + [Outcome] + [Unfair advantage] frame",
          "Draft vision (10-year picture) and mission (what you do every day) side by side",
          "Name the problem in the customer's own words, not yours",
          "Compose the Executive Summary last — it's a distillation of the other three",
        ],
        takeaway:
          "Your Foundation pillar complete — the 60-second story of your startup, sharp enough to open every conversation.",
        followUp:
          "Foundation deliverables land on your dashboard immediately. Revise them anytime — every downstream stage inherits this language.",
      },
    ],
  },
  {
    n: 2,
    slug: "strategy",
    title: "Strategy",
    shortTitle: "strategy",
    oneLiner: "How you win — and how you compound the lead.",
    summary:
      "Who you sell to, how you beat the alternatives, and the 90-day plan that turns strategy into first paying customers.",
    takeHome:
      "Your Market Analysis, Customer Personas, Competitive Positioning, Go-to-Market Plan, and Brand & Messaging — the five Strategy deliverables — sized to your city, category, and price band with real numbers behind them.",
    walkOut: [
      "Market Analysis — a grounded read of how big the opportunity is in your city, category, and price band",
      "Customer Personas — two or three vivid buyer profiles with pain, budget, vocabulary, and buying triggers",
      "Competitive Positioning — an honest map of the alternatives and the wedge only you can own",
      "Go-to-Market Plan — the exact sequence of channels, offers, and moves for your first 90 days",
      "Brand & Messaging — core message, tone, and proof points that make you sound like one voice everywhere",
    ],
    afterWorkshop: [
      "Run your Go-to-Market plan's Week 1 action inside 7 days",
      "Send one outreach message using your persona vocabulary and log the response",
    ],
    duration: "25 min",
    covers: ["Market Analysis", "Personas", "Positioning", "GTM", "Brand & Messaging"],
    tasks: [
      {
        title: "Size the market and lock the buyer",
        deliverable:
          "Market Analysis + Customer Personas + Competitive Positioning saved to Strategy.",
        tool: "Market sizing calculator + persona canvas + competitive matrix",
        details: [
          "Estimate TAM/SAM/SOM using local data, not top-down guesses",
          "Build 2–3 personas from real conversations or research, not archetypes",
          "Map 3–5 alternatives (including 'do nothing') and where you win",
        ],
        takeaway: "Market sized, buyer named, wedge identified.",
        followUp: "Refine personas on your dashboard as you talk to real customers.",
      },
      {
        title: "Plan the first 90 days and lock the voice",
        deliverable: "Go-to-Market Plan + Brand & Messaging saved to Strategy.",
        tool: "90-day GTM sequencer + messaging house",
        details: [
          "Pick 2 channels max for the first 90 days — pick channels your persona actually uses",
          "Draft your core message, 3 supporting messages, and 3 proof points",
          "Write your first outreach script and post using the messaging house",
        ],
        takeaway: "You know what to do Monday, and you sound like one brand doing it.",
        followUp:
          "GTM and messaging feed the Operations Marketing Plan and, if you unlock Bonus, the Social & Content calendar.",
      },
    ],
  },
  {
    n: 3,
    slug: "operations",
    title: "Operations",
    shortTitle: "operations",
    oneLiner: "What you build, sell, and ship — week after week.",
    summary:
      "The roadmap, weekly workflow, sales playbook, and marketing plan that let you deliver reliably and hand pieces to a teammate.",
    takeHome:
      "Your Product Roadmap, Operating Plan, Sales Playbook, and Marketing Plan — the four Operations deliverables — set up so the business can run without you reinventing every order.",
    walkOut: [
      "Product Roadmap — a 12-month sequence of what you launch and in what order",
      "Operating Plan — the week-by-week workflow that turns your offer into something you can deliver reliably",
      "Sales Playbook — discovery questions, objections, asks, closes — a repeatable script that moves stranger → signed deal",
      "Marketing Plan — channels, monthly spend, content cadence, and the metrics that tell you what's working",
    ],
    afterWorkshop: [
      "Run one week of your Operating Plan and log where it broke",
      "Use your Sales Playbook on 3 conversations and refine the objection responses",
    ],
    duration: "25 min",
    covers: ["Roadmap", "Operating Plan", "Sales Playbook", "Marketing Plan"],
    tasks: [
      {
        title: "Roadmap and weekly ops",
        deliverable: "Product Roadmap + Operating Plan saved to Operations.",
        tool: "12-month roadmap + weekly workflow builder",
        details: [
          "Sequence what you ship in the next 12 months — revenue-driving items first",
          "Map your delivery workflow week by week: intake → produce → deliver → invoice → follow-up",
          "Identify the 2–3 steps a future hire could take off your plate",
        ],
        takeaway: "You know what to build, and how the business runs on repeat.",
        followUp: "Roadmap and workflow live on your dashboard; edit as you learn.",
      },
      {
        title: "Sales and marketing systems",
        deliverable: "Sales Playbook + Marketing Plan saved to Operations.",
        tool: "Discovery/objection script + channel-spend planner",
        details: [
          "Write your 5 discovery questions, top 3 objections, and close language",
          "Set monthly spend by channel and the one metric per channel you'll watch",
          "Draft your content cadence — how often, what format, who owns it",
        ],
        takeaway: "You have a script that closes and a plan that spends on what works.",
        followUp:
          "Marketing Plan feeds directly into your Social & Content bonus track if you unlock it.",
      },
    ],
  },
  {
    n: 4,
    slug: "finance",
    title: "Finance",
    shortTitle: "finance",
    oneLiner: "The numbers investors, banks, and you can trust.",
    summary:
      "A 12-month P&L, unit economics, funding plan, budget, and pitch outline you can defend to a banker or investor — and use yourself to price, spend, and hire with confidence.",
    takeHome:
      "Your Financial Model, Unit Economics, Funding Strategy, Budget & Pro Forma, and Pitch Deck Outline — the five Finance deliverables — tied to real assumptions and ready to hand to a bank, SBA officer, or investor.",
    walkOut: [
      "Financial Model — 12-month P&L and cash flow with your real cost and revenue assumptions",
      "Unit Economics — the math on what one customer costs to win and pays back over time",
      "Funding Strategy — the cheapest capital that actually fits (bootstrap, savings, grants, loans, F&F, investors)",
      "Budget & Pro Forma — a line-by-line forecast in the format a bank, landlord, or SBA officer expects",
      "Pitch Deck Outline — the slide-by-slide narrative for partners, investors, and first big customers",
    ],
    afterWorkshop: [
      "Pressure-test your financial model with a bookkeeper or SCORE mentor within 2 weeks",
      "Pursue the top capital source from your Funding Strategy this month",
    ],
    duration: "25 min",
    covers: ["Financial Model", "Unit Economics", "Funding", "Pro Forma", "Pitch Deck"],
    tasks: [
      {
        title: "Model the business and the unit",
        deliverable: "Financial Model + Unit Economics saved to Finance.",
        tool: "12-month P&L template + CAC/LTV worksheet",
        details: [
          "Build the P&L month-by-month with real prices, real costs, real cadence",
          "Calculate CAC and LTV for your first channel",
          "Identify the 3 levers that actually move the trajectory",
        ],
        takeaway: "You know when cash gets tight and which levers to pull.",
        followUp: "Update monthly on your dashboard — actuals vs. plan.",
      },
      {
        title: "Fund it and pitch it",
        deliverable: "Funding Strategy + Budget & Pro Forma + Pitch Deck Outline saved to Finance.",
        tool: "Capital-source decision tree + bank-ready pro forma + 10-slide outline",
        details: [
          "Pick your funding path from the decision tree — cheapest capital that fits",
          "Draft the line-by-line pro forma in the format banks accept",
          "Sketch the 10-slide narrative: problem, solution, market, offer, traction, model, GTM, team, ask, use of funds",
        ],
        takeaway: "You walk into any money conversation with the document they expect.",
        followUp: "Deck outline generates a full deck template on your dashboard.",
      },
    ],
  },
  {
    n: 5,
    slug: "governance",
    title: "Governance",
    shortTitle: "governance",
    oneLiner: "The legal and risk scaffolding that keeps you bankable.",
    summary:
      "Entity, risk, and advisory scaffolding in place — so you're bankable, insurable, and no longer one bad surprise away from personal exposure.",
    takeHome:
      "Your Legal Structure Brief, Risk Register, and Board & Governance Plan — the three Governance deliverables — plus the concrete formation packet, EIN, operating agreement, and legal kit you file this week.",
    walkOut: [
      "Legal Structure Brief — plain-English recommendation on entity (LLC / S-Corp / Sole Prop), ownership, and day-one contracts",
      "State formation packet pre-filled in your Secretary of State account (all 50 states supported)",
      "EIN application completed and submitted — number issued in the session",
      "Operating Agreement drafted for your members and ownership split",
      "Terms of Service, Privacy Policy, and 1-page Service Agreement customized to your business",
      "Risk Register — the specific moves that defuse the top risks to your business",
      "Board & Governance Plan — lightweight structure for advisors, mentors, or partners who open doors",
    ],
    afterWorkshop: [
      "Submit your state's formation document + filing fee from home (about 10 min — skip if Sole Prop)",
      "Open the business bank account (1–7 days after you apply)",
      "File local business license and sales-tax registration once the entity is approved",
      "Line up your first advisor conversation from your Board & Governance Plan",
    ],
    duration: "25 min",
    covers: ["Legal Structure", "Formation packet", "EIN", "Risk Register", "Advisors"],
    tasks: [
      {
        title: "Choose structure & prepare your state formation packet",
        deliverable:
          "Legal Structure Brief + state formation packet: structure chosen (LLC, S-Corp, or Sole Proprietor), name confirmed, registered agent selected, formation document pre-filled.",
        tool: "Secretary of State filing walk-through — all 50 states, LLC / S-Corp / Sole Prop",
        details: [
          "Pick LLC vs Sole Prop vs S-Corp election using a 5-question decision tree tuned to your revenue and salary plans",
          "Confirm name availability on your state's SOS business search",
          "Decide registered agent (you, partner, or paid service)",
          "Create your state SOS account and pre-fill your state's formation document",
        ],
        takeaway:
          "Structure locked, formation document pre-filled, registered agent set, ready to submit.",
        followUp:
          "Submit your state's formation document from home — typically a 10-minute step (skip if Sole Prop).",
      },
      {
        title: "EIN, bank, and legal kit",
        deliverable:
          "EIN issued, bank shortlist locked, Operating Agreement drafted, Terms/Privacy/Service Agreement customized.",
        tool: "IRS EIN portal + banking checklist + contract frameworks",
        details: [
          "Apply for the EIN live in-session and save the confirmation letter",
          "Pick your business bank from the shortlist and complete the application checklist",
          "Customize Terms of Service and Privacy Policy from vetted frameworks",
          "Customize a 1-page Service Agreement / SOW for your first sale",
        ],
        takeaway: "You can legally sign contracts and take money this week.",
        followUp:
          "Open the bank account once your entity is approved (1–7 days after filing).",
      },
      {
        title: "Risk register and governance",
        deliverable: "Risk Register + Board & Governance Plan saved to Governance.",
        tool: "Risk-inventory worksheet + advisor mapping canvas",
        details: [
          "List the top 8 risks (financial, legal, operational, market) and score them",
          "Name a specific mitigation for each of the top 3",
          "Identify 2–3 advisors or mentors and how you'll engage them",
        ],
        takeaway: "You've seen the predictable problems coming and have the room to help solve them.",
        followUp: "Board & Governance Plan generates outreach templates on your dashboard.",
      },
    ],
  },
  {
    n: 6,
    slug: "brand",
    title: "Brand",
    shortTitle: "brand",
    bonus: true,
    oneLiner: "An identity worth premium pricing — system, not stickers.",
    summary:
      "A brand system — strategy, messaging, visual brief, voice, guidelines — that earns premium pricing and stops you rebuilding your identity every six months.",
    takeHome:
      "Preview of the Brand bonus track: Brand Strategy Framework, Messaging House, Visual Identity Brief, Voice & Tone Guide, and Brand Guidelines Book. Full build continues on your dashboard.",
    walkOut: [
      "Brand track queued to your dashboard with today's Foundation + Strategy inputs pre-loaded",
      "Kickoff on your Brand Strategy Framework — purpose, promise, audience, positioning",
      "First pass at your Visual Identity Brief for a designer or AI tool",
    ],
    afterWorkshop: [
      "Complete Brand Strategy Framework and Messaging House on your dashboard this week",
      "Hand your Visual Identity Brief to a designer or AI generator; loop the output back to your dashboard",
    ],
    duration: "Bonus — continues on dashboard",
    covers: ["Brand Strategy", "Messaging House", "Visual Identity", "Voice", "Guidelines"],
    tasks: [
      {
        title: "Bonus preview: Brand system",
        deliverable:
          "Brand bonus track unlocked with 5 deliverables queued: Strategy Framework, Messaging House, Visual Identity Brief, Voice & Tone Guide, Guidelines Book.",
        tool: "Dashboard bonus track — AI-assisted drafting",
        details: [
          "See how today's Foundation and Strategy work seeds your brand system",
          "Preview your Brand Strategy Framework generated from your Vision, Personas, and Positioning",
          "Get the Visual Identity Brief template to hand to a designer or generator",
        ],
        takeaway: "Brand track unlocked and pre-seeded with your Foundation + Strategy inputs.",
        followUp:
          "Complete all 5 Brand deliverables on your dashboard — most founders finish in 2–3 sessions over the following week.",
      },
    ],
  },
  {
    n: 7,
    slug: "marketing",
    title: "Marketing",
    shortTitle: "marketing",
    bonus: true,
    oneLiner: "The AI-builder prompt that ships your site in a weekend.",
    summary:
      "A complete website PRD ready to hand to an AI builder — launch a revenue-ready site in a weekend instead of paying $20K and waiting three months.",
    takeHome:
      "Preview of the Marketing bonus track: your full Website PRD (AI-builder prompt), pre-loaded with today's Foundation, Strategy, and Brand inputs.",
    walkOut: [
      "Marketing bonus track queued to your dashboard",
      "Website PRD skeleton generated from your Value Prop, Personas, GTM, and Brand messaging",
      "Recommended AI builder + hosting stack ready to execute",
    ],
    afterWorkshop: [
      "Feed your Website PRD into an AI builder this weekend and ship v1",
      "Wire payments, email, and analytics from the recommended stack",
    ],
    duration: "Bonus — continues on dashboard",
    covers: ["Website PRD", "AI-builder prompt"],
    tasks: [
      {
        title: "Bonus preview: Website PRD",
        deliverable:
          "Website PRD queued on your dashboard, pre-populated with today's Foundation, Strategy, and Brand outputs.",
        tool: "Dashboard bonus track — Website PRD generator",
        details: [
          "See the pages, sections, copy blocks, and CTAs your PRD will include",
          "Review the recommended AI builder + hosting stack for your budget",
          "Understand the weekend build path from PRD to launched site",
        ],
        takeaway: "Website PRD ready to hand to an AI builder.",
        followUp:
          "Finalize the PRD on your dashboard, then ship v1 in a weekend using the recommended stack.",
      },
    ],
  },
  {
    n: 8,
    slug: "social-content",
    title: "Social & Content",
    shortTitle: "social",
    bonus: true,
    oneLiner: "The distribution engine that earns attention on repeat.",
    summary:
      "90 days of content, a launch kit, and a paid-ads starter pack — a distribution engine that earns attention on repeat instead of costing more each month.",
    takeHome:
      "Preview of the Social & Content bonus track: Audit & Setup, Content Pillars, 90-Day Calendar, Launch Kit, Community Playbook, Partnership Brief, and Paid Ads Starter Pack.",
    walkOut: [
      "Social & Content bonus track queued to your dashboard",
      "Content Pillars drafted from your Positioning and Personas",
      "First 2 weeks of your 90-Day Content Calendar generated",
    ],
    afterWorkshop: [
      "Complete Audit & Setup and finish your 90-day calendar on your dashboard this week",
      "Launch your first paid-ads test from the Starter Pack once your site is live",
    ],
    duration: "Bonus — continues on dashboard",
    covers: ["Social Setup", "Content Pillars", "90-Day Calendar", "Launch Kit", "Paid Ads"],
    tasks: [
      {
        title: "Bonus preview: Distribution engine",
        deliverable:
          "Social & Content bonus track unlocked with 7 deliverables queued and Content Pillars + first 2 weeks of calendar pre-drafted.",
        tool: "Dashboard bonus track — AI-assisted content system",
        details: [
          "Review your Content Pillars generated from Positioning and Personas",
          "Preview the first two weeks of your 90-day content calendar",
          "Get the Launch Content Kit templates for your opening week",
        ],
        takeaway: "Distribution engine unlocked and pre-seeded.",
        followUp:
          "Finish the full 90-day calendar and the remaining 6 deliverables on your dashboard.",
      },
    ],
  },
];
