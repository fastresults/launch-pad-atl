// Workflow manifest for the 25-deliverable agentic pipeline.
// The DB (deliverable_types) is the source of truth for prompts/deps; this file
// is the UI-facing manifest: stage grouping, labels, and intake field templates
// that progressively collect context for downstream deliverables.

export type IntakeField = {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  voice?: boolean;
};

export type WorkflowDeliverable = {
  key: string;
  label: string;
  short: string;
  stageN: number;
  stageLabel: string;
  // Optional pre-run questions. AI also pre-fills from upstream context.
  intake?: IntakeField[];
};

export const STAGES = [
  { n: 0, key: "brief", label: "Business Brief", description: "Tell us about the business you want to build. Everything downstream uses this." },
  { n: 1, key: "form", label: "Form", description: "Form the legal entity, EIN, contracts, and money plan." },
  { n: 2, key: "customer", label: "Customer", description: "Define the ideal customer, competitors, and your edge." },
  { n: 3, key: "offer", label: "Offer", description: "Lock down what you sell and what it costs." },
  { n: 4, key: "build", label: "Build", description: "Set up delivery: workflow, first deliverable, SOPs, sourcing." },
  { n: 5, key: "brand", label: "Brand", description: "Identity, website, payments, business email." },
  { n: 6, key: "marketing", label: "Marketing", description: "Messaging, collateral, social plan." },
  { n: 7, key: "launch", label: "Launch", description: "Go-to-market plan, day-of, KPIs." },
] as const;

// Per-deliverable intake — small, focused, each unlocks downstream stages.
export const WORKFLOW: WorkflowDeliverable[] = [
  // Stage 1 — Form
  { key: "llc_filing_packet", label: "GA LLC Filing Packet", short: "Articles + registered agent", stageN: 1, stageLabel: "Form",
    intake: [
      { key: "preferred_llc_name", label: "Preferred LLC name", placeholder: "e.g. Northbound Ventures LLC", voice: true },
      { key: "backup_llc_names", label: "Two backup names (in case the first is taken)", placeholder: "Name 2, Name 3", voice: true },
      { key: "members", label: "Owners / members", placeholder: "Full legal names + ownership %", multiline: true, voice: true },
    ]},
  { key: "ein_letter", label: "EIN Issued", short: "IRS EIN cover letter + SS-4 prep", stageN: 1, stageLabel: "Form" },
  { key: "legal_docs", label: "ToS, Privacy & Service Agreement", short: "Customized to your offer", stageN: 1, stageLabel: "Form" },
  { key: "compliance_checklist", label: "Bank + License + Sales-Tax Checklist", short: "City + state checklist", stageN: 1, stageLabel: "Form" },
  { key: "funding_runway", label: "Funding model & 12-month runway", short: "Costs, margin, break-even", stageN: 1, stageLabel: "Form",
    intake: [
      { key: "starting_cash", label: "Cash on hand to start (USD)", placeholder: "5000", voice: true },
      { key: "monthly_personal_burn", label: "What do you personally need to live on each month?", placeholder: "3500", voice: true },
      { key: "expected_first_year_revenue", label: "Honest guess: first 12 months revenue", placeholder: "30000", voice: true },
      { key: "biggest_cost_items", label: "Biggest expected costs", placeholder: "rent, contractors, software…", multiline: true, voice: true },
    ]},
  { key: "business_plan", label: "Business plan with pro formas", short: "Bank-ready narrative + P&L", stageN: 1, stageLabel: "Form" },
  { key: "pitch_deck", label: "Investor-ready pitch deck", short: "10 slides in your brand", stageN: 1, stageLabel: "Form" },
  { key: "fundraising_kit", label: "Fundraising kit", short: "Raise summary + outreach", stageN: 1, stageLabel: "Form",
    intake: [
      { key: "raise_amount", label: "How much are you raising (USD)?", placeholder: "50000", voice: true },
      { key: "use_of_funds", label: "What will you spend it on?", placeholder: "inventory, marketing, hire…", multiline: true, voice: true },
    ]},

  // Stage 2 — Customer
  { key: "icp_prospect_list", label: "ICP + 25-name prospect list", short: "Ideal customer + named leads", stageN: 2, stageLabel: "Customer",
    intake: [
      { key: "customer_type", label: "Who buys from you (B2B or B2C)?", placeholder: "B2B coffee shop owners in Atlanta", voice: true },
      { key: "where_they_hang_out", label: "Where do they hang out (in-person + online)?", multiline: true, voice: true },
      { key: "trigger_event", label: "What just happened in their life that makes them need you?", multiline: true, voice: true },
    ]},
  { key: "competitor_research", label: "Competitive research pack", short: "3 competitors deep-dive", stageN: 2, stageLabel: "Customer",
    intake: [
      { key: "known_competitors", label: "Competitors you already know about (names, URLs)", multiline: true, voice: true },
    ]},
  { key: "competitive_advantage", label: "Competitive advantage brief", short: "Your defensible edge", stageN: 2, stageLabel: "Customer" },
  { key: "outreach_positioning", label: "Outreach script + competitor grid", short: "Cold email + comparison", stageN: 2, stageLabel: "Customer" },

  // Stage 3 — Offer
  { key: "offer_pricing", label: "Offer + scope + pricing", short: "One-sentence offer + price sheet", stageN: 3, stageLabel: "Offer",
    intake: [
      { key: "first_offer", label: "What's the one thing you're selling first?", multiline: true, voice: true },
      { key: "price_range", label: "Rough price you'd charge", placeholder: "$500–$1,500", voice: true },
    ]},

  // Stage 4 — Build
  { key: "workflow_tooling", label: "Sale-to-delivery workflow + tooling", short: "End-to-end workflow", stageN: 4, stageLabel: "Build",
    intake: [
      { key: "tools_already_in_use", label: "Tools you already use (or want to use)", multiline: true, voice: true },
    ]},
  { key: "first_deliverable_qa", label: "First customer deliverable + QA checklist", short: "Drafted deliverable + QA", stageN: 4, stageLabel: "Build" },
  { key: "operations_sops", label: "Operations & workflow SOPs", short: "3 SOPs + weekly rhythm", stageN: 4, stageLabel: "Build" },
  { key: "sourcing_staffing", label: "Sourcing & staffing plan", short: "Named candidates + first-call list", stageN: 4, stageLabel: "Build",
    intake: [
      { key: "people_or_supplies_needed", label: "What people or supplies do you need to deliver?", multiline: true, voice: true },
    ]},

  // Stage 5 — Brand
  { key: "brand_kit", label: "Logo + palette + fonts", short: "Brand identity sheet", stageN: 5, stageLabel: "Brand",
    intake: [
      { key: "brand_feel", label: "How should your brand feel? (3 words)", placeholder: "warm, modern, expert", voice: true },
      { key: "brands_you_admire", label: "Brands you admire and why", multiline: true, voice: true },
    ]},
  { key: "website_4pg", label: "Complete 4-page website", short: "Branded + written + SEO", stageN: 5, stageLabel: "Brand" },
  { key: "payments_email_ga", label: "Stripe/Square + GA4 + business email", short: "Money + analytics + email", stageN: 5, stageLabel: "Brand" },

  // Stage 6 — Marketing
  { key: "messaging_pitch", label: "Headline + value props + 30-sec pitch", short: "Your story in one minute", stageN: 6, stageLabel: "Marketing" },
  { key: "print_collateral", label: "Business card + flyer", short: "Print-ready PDFs", stageN: 6, stageLabel: "Marketing" },
  { key: "social_30day", label: "Social + 30-day plan + video script", short: "6 posts + 60s video", stageN: 6, stageLabel: "Marketing" },

  // Stage 7 — Launch
  { key: "launch_plan", label: "30/60/90 launch plan + outreach drafts", short: "Week-by-week plan", stageN: 7, stageLabel: "Launch" },
  { key: "day_of_kpis", label: "Day-of timeline + CRM + KPIs", short: "Launch day plan", stageN: 7, stageLabel: "Launch" },
];

export const WORKFLOW_BY_KEY = new Map(WORKFLOW.map((w) => [w.key, w]));

export function stageOf(key: string): number | undefined {
  return WORKFLOW_BY_KEY.get(key)?.stageN;
}

export const BRIEF_FIELDS: IntakeField[] = [
  { key: "one_line_pitch", label: "In one sentence, what is the business?", placeholder: "We help busy parents…", voice: true, multiline: true },
  { key: "origin_story", label: "Why are YOU starting this? (origin story)", voice: true, multiline: true },
  { key: "problem_statement", label: "What real problem are you solving?", voice: true, multiline: true },
  { key: "target_customer", label: "Who is the customer? Describe them vividly.", voice: true, multiline: true },
  { key: "unique_insight", label: "What do you know that competitors don't?", voice: true, multiline: true },
  { key: "offer_description", label: "What's the first thing you'd sell?", voice: true, multiline: true },
  { key: "pricing_idea", label: "What's it worth — and what would you charge?", voice: true, multiline: true },
  { key: "business_model", label: "How does money flow? (one-time, subscription, retainer, …)", voice: true, multiline: true },
  { key: "inspiration_brands", label: "Brands you admire — and why?", voice: true, multiline: true },
  { key: "twelve_month_vision", label: "If 12 months from now this is working, what does it look like?", voice: true, multiline: true },
];
