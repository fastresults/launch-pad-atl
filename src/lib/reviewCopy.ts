// Plain-English copy + section structure for the Review wizard (Step 3).
// Each field has a one-line helper and an optional example to remove novice anxiety.

export type ReviewField = {
  key: string;
  label: string;
  helper: string;
  example?: string;
  multiline?: boolean;
  optional?: boolean;
};

export type ReviewSection = {
  key: "foundation" | "market" | "operations" | "vision";
  fields: ReviewField[];
};

// Source-of-truth section→field map (mirrors what's persisted in extracted_data).
export const REVIEW_SECTIONS: ReviewSection[] = [
  {
    key: "foundation",
    fields: [
      {
        key: "company_name",
        label: "Company name",
        helper: "What are you calling this? A working name is fine — you can change it later.",
      },
      {
        key: "concept",
        label: "Your concept",
        helper: "In one short paragraph, what would you tell a stranger at a coffee shop?",
        example: "We run small-group cycling classes for busy professionals in midtown.",
        multiline: true,
      },
      {
        key: "problem",
        label: "The problem you solve",
        helper: "What's broken in your customer's day that you fix?",
        example: "Big-box gyms feel anonymous and crowded; people skip workouts because of it.",
        multiline: true,
      },
    ],
  },
  {
    key: "market",
    fields: [
      {
        key: "target_customers",
        label: "Target customers",
        helper: "Who specifically pays you? Be embarrassingly specific — not 'everyone'.",
        example: "Working professionals, 28–45, within a 2-mile radius of the studio.",
        multiline: true,
      },
      {
        key: "value_proposition",
        label: "Value proposition",
        helper: "Finish this sentence: We help ___ do ___ without ___.",
        example: "We help busy pros stay in shape without the chaos of a big-box gym.",
        multiline: true,
      },
      {
        key: "differentiators",
        label: "What makes you different",
        helper: "What would a happy customer say when their friend asks 'why them?'",
        example: "Small classes (12 max), same instructor every week, in-and-out in 45 minutes.",
        multiline: true,
      },
      {
        key: "market_size",
        label: "Market size (rough is fine)",
        helper: "A rough number beats blank. 'About 5,000 households in our zip code' works.",
      },
    ],
  },
  {
    key: "operations",
    fields: [
      {
        key: "revenue_model",
        label: "How you make money",
        helper: "Subscription, per-class, retainer, one-time? Keep it simple.",
        example: "Monthly membership with unlimited classes, plus drop-in passes.",
        multiline: true,
      },
      {
        key: "pricing",
        label: "Pricing",
        helper: "Ballpark numbers. You can refine later.",
        example: "$149/mo unlimited, $25 drop-in.",
      },
      {
        key: "key_processes",
        label: "Key processes",
        helper: "How does the work actually get done day to day? (Optional for first draft.)",
        multiline: true,
        optional: true,
      },
      {
        key: "team",
        label: "Team",
        helper: "Who's involved? Solo founder is a perfectly fine answer. (Optional for first draft.)",
        multiline: true,
        optional: true,
      },
    ],
  },
  {
    key: "vision",
    fields: [
      {
        key: "short_term_goals",
        label: "Short-term goals (next 12 months)",
        helper: "What does success look like a year from now?",
        example: "200 active members, break even on a single studio location.",
        multiline: true,
      },
      {
        key: "long_term_goals",
        label: "Long-term goals (3–5 years)",
        helper: "Where do you want this to be? Be ambitious but honest.",
        multiline: true,
      },
      {
        key: "mission",
        label: "Mission",
        helper: "Why do you exist? One sentence.",
      },
      {
        key: "vision",
        label: "Vision",
        helper: "What does the world look like if you win? One sentence.",
      },
    ],
  },
];

export const SUB_STEPS = [
  { n: 1, key: "setup", label: "Setup", title: "Confirm your setup", subtitle: "Make sure we've got you and your market right." },
  { n: 2, key: "story", label: "Story", title: "Your story", subtitle: "What you're building, and the problem behind it." },
  { n: 3, key: "market", label: "Market", title: "Your market", subtitle: "Who you serve and why they'll pick you." },
  { n: 4, key: "model", label: "Model", title: "Your model", subtitle: "How you'll make money — and where you're headed." },
  { n: 5, key: "lock", label: "Lock", title: "Lock your concept", subtitle: "Use the two AI studios below to refine, then lock." },
] as const;

export type SubStepKey = (typeof SUB_STEPS)[number]["key"];

export function getSection(key: ReviewSection["key"]): ReviewSection {
  return REVIEW_SECTIONS.find((s) => s.key === key)!;
}

export function isFieldFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
