// Workflow manifest for the 20-document, 5-pillar workshop framework.
// The DB (deliverable_types) is the source of truth for prompts/deps; this file
// is the UI-facing manifest: pillar grouping, labels, time budgets, and intake
// field templates that progressively collect context for downstream documents.

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
  stageN: number; // 1..5 pillar number
  stageLabel: string;
  estMinutes: number;
  intake?: IntakeField[];
};

export const STAGES = [
  { n: 0, key: "brief", label: "Startup Brief", description: "Tell us about the startup you want to build. Everything downstream uses this." },
  { n: 1, key: "foundation", label: "Foundation", description: "Who you are and where you play." },
  { n: 2, key: "strategy", label: "Strategy", description: "How you win and grow." },
  { n: 3, key: "operations", label: "Operations", description: "What you build and who builds it." },
  { n: 4, key: "finance", label: "Finance", description: "The numbers that matter." },
  { n: 5, key: "governance", label: "Governance", description: "Risk, oversight, and readiness." },
] as const;

export const WORKFLOW: WorkflowDeliverable[] = [
  // Pillar 1 — Foundation
  { key: "concept_brief", label: "Concept Brief", short: "Idea, who it's for, why now", stageN: 1, stageLabel: "Foundation", estMinutes: 2,
    intake: [
      { key: "one_line_pitch", label: "In one sentence, what is the startup?", placeholder: "We help…", voice: true, multiline: true },
      { key: "target_customer", label: "Who is the customer?", voice: true, multiline: true },
    ]},
  { key: "executive_summary", label: "Executive Summary", short: "What investors read first", stageN: 1, stageLabel: "Foundation", estMinutes: 3 },
  { key: "value_proposition", label: "Value Proposition", short: "Positioning statement", stageN: 1, stageLabel: "Foundation", estMinutes: 4 },
  { key: "market_sizing", label: "Market Sizing", short: "TAM / SAM / SOM", stageN: 1, stageLabel: "Foundation", estMinutes: 5,
    intake: [
      { key: "geography", label: "Where do you sell? (city, state, country, global)", voice: true },
    ]},
  { key: "competitive_landscape", label: "Competitive Landscape", short: "3 competitors + your edge", stageN: 1, stageLabel: "Foundation", estMinutes: 6,
    intake: [
      { key: "known_competitors", label: "Competitors you already know (names, URLs)", multiline: true, voice: true },
    ]},

  // Pillar 2 — Strategy
  { key: "business_plan", label: "Business Plan", short: "Bank-ready narrative", stageN: 2, stageLabel: "Strategy", estMinutes: 10 },
  { key: "go_to_market", label: "Go-to-Market", short: "Channels + first 90 days", stageN: 2, stageLabel: "Strategy", estMinutes: 7 },
  { key: "pricing_strategy", label: "Pricing Strategy", short: "Packaging + unit economics", stageN: 2, stageLabel: "Strategy", estMinutes: 5,
    intake: [
      { key: "price_range", label: "Rough price you'd charge", placeholder: "$500–$1,500", voice: true },
    ]},
  { key: "customer_acquisition", label: "Customer Acquisition", short: "CAC + first-30-day plan", stageN: 2, stageLabel: "Strategy", estMinutes: 6 },
  { key: "partnership_strategy", label: "Partnership Strategy", short: "Channel + distribution partners", stageN: 2, stageLabel: "Strategy", estMinutes: 4 },

  // Pillar 3 — Operations
  { key: "product_roadmap", label: "Product Roadmap", short: "MVP → year-one phases", stageN: 3, stageLabel: "Operations", estMinutes: 5 },
  { key: "team_structure", label: "Team Structure", short: "Org chart + first hires", stageN: 3, stageLabel: "Operations", estMinutes: 4 },
  { key: "operations_plan", label: "Operations Plan", short: "Workflow + SOPs", stageN: 3, stageLabel: "Operations", estMinutes: 6,
    intake: [
      { key: "people_or_supplies_needed", label: "What people or supplies do you need to deliver?", multiline: true, voice: true },
    ]},
  { key: "technology_stack", label: "Technology Stack", short: "Tools that run the business", stageN: 3, stageLabel: "Operations", estMinutes: 5,
    intake: [
      { key: "tools_already_in_use", label: "Tools you already use (or want to use)", multiline: true, voice: true },
    ]},

  // Pillar 4 — Finance
  { key: "financial_model", label: "Financial Model", short: "12-month P&L + cash flow", stageN: 4, stageLabel: "Finance", estMinutes: 8,
    intake: [
      { key: "starting_cash", label: "Cash on hand to start (USD)", placeholder: "5000", voice: true },
      { key: "monthly_personal_burn", label: "What do you personally need to live on each month?", placeholder: "3500", voice: true },
    ]},
  { key: "funding_strategy", label: "Funding Strategy", short: "Bootstrap, grants, debt, equity", stageN: 4, stageLabel: "Finance", estMinutes: 5,
    intake: [
      { key: "raise_amount", label: "How much are you raising (USD)?", placeholder: "50000", voice: true },
      { key: "use_of_funds", label: "What will you spend it on?", multiline: true, voice: true },
    ]},
  { key: "investor_memo", label: "Investor Memo", short: "Forwardable memo", stageN: 4, stageLabel: "Finance", estMinutes: 7 },
  { key: "exit_strategy", label: "Exit Strategy", short: "Acquisition, secondary, hold", stageN: 4, stageLabel: "Finance", estMinutes: 4 },

  // Pillar 5 — Governance
  { key: "risk_assessment", label: "Risk Assessment", short: "Top risks + mitigations", stageN: 5, stageLabel: "Governance", estMinutes: 5 },
  { key: "board_presentation", label: "Board Presentation", short: "First board / advisor deck", stageN: 5, stageLabel: "Governance", estMinutes: 6 },
];

export const WORKFLOW_BY_KEY = new Map(WORKFLOW.map((w) => [w.key, w]));

export function stageOf(key: string): number | undefined {
  return WORKFLOW_BY_KEY.get(key)?.stageN;
}

export const BRIEF_FIELDS: IntakeField[] = [
  { key: "one_line_pitch", label: "In one sentence, what is the startup?", placeholder: "We help busy parents…", voice: true, multiline: true },
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

export type BriefKey = (typeof BRIEF_FIELDS)[number]["key"];
