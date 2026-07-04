// Canonical 14-day launch plan mapping. Each day pins to a small set of
// deliverable keys already produced by the hub, so the visual planner can
// hotlink into the exact assets the founder ships that day.
//
// Keys must match `venture_document_types.type` verbatim. If a mapped key is
// not present in the venture's active types the day tile silently skips it.

export type LaunchDay = {
  day: number;
  week: 1 | 2;
  theme: string;
  objective: string;
  doneWhen: string;
  assetKeys: string[];
  category:
    | "Foundation"
    | "Strategy"
    | "Operations"
    | "Finance"
    | "Governance"
    | "Brand"
    | "Marketing"
    | "Social & Content";
};

export const LAUNCH_14DAY_PLAN: LaunchDay[] = [
  {
    day: 1,
    week: 1,
    theme: "Lock the concept",
    objective: "Nail the one-line story of what you're building and why now.",
    doneWhen: "A stranger can repeat what you do in one sentence.",
    assetKeys: ["executive_summary", "vision_mission", "problem_solution"],
    category: "Foundation",
  },
  {
    day: 2,
    week: 1,
    theme: "Sharpen the offer",
    objective: "Turn the concept into a priced, packaged, buyable offer.",
    doneWhen: "You have a headline price and a one-page offer sheet.",
    assetKeys: ["value_proposition", "pricing_offer_sheet"],
    category: "Foundation",
  },
  {
    day: 3,
    week: 1,
    theme: "Name your buyers",
    objective: "Get specific about who buys — and build the first list.",
    doneWhen: "50 named prospects with a channel and an angle each.",
    assetKeys: ["customer_personas", "first_50_warm_list"],
    category: "Strategy",
  },
  {
    day: 4,
    week: 1,
    theme: "Validate demand",
    objective: "Run a 48-hour pre-sell so real money votes before you build.",
    doneWhen: "At least one paid deposit or five written commitments.",
    assetKeys: ["pre_sell_offer_test", "landing_page_waitlist_test"],
    category: "Strategy",
  },
  {
    day: 5,
    week: 1,
    theme: "Pick your wedge",
    objective: "Decide the one wedge only you can own in this market.",
    doneWhen: "Positioning statement written and defended against 3 alts.",
    assetKeys: ["competitive_positioning", "market_analysis"],
    category: "Strategy",
  },
  {
    day: 6,
    week: 1,
    theme: "Plan the sales motion",
    objective: "Sequence the moves that turn a stranger into a signed deal.",
    doneWhen: "90-day GTM plan and a repeatable outbound script are live.",
    assetKeys: ["go_to_market_plan", "sales_playbook", "outbound_dm_email_scripts"],
    category: "Operations",
  },
  {
    day: 7,
    week: 1,
    theme: "Message + brand voice",
    objective: "Lock the words and tone so every surface sounds like one voice.",
    doneWhen: "Messaging house and voice guide finished and shareable.",
    assetKeys: ["brand_messaging", "brand_messaging_house", "brand_voice_tone_guide", "brand_strategy_framework"],
    category: "Brand",
  },
  {
    day: 8,
    week: 2,
    theme: "Legal + entity",
    objective: "Get the paperwork that makes you bankable and insurable.",
    doneWhen: "Entity chosen, ToS/Privacy/Refund pack live, insurance quoted.",
    assetKeys: ["legal_structure_brief", "terms_privacy_refund_pack", "insurance_starter"],
    category: "Governance",
  },
  {
    day: 9,
    week: 2,
    theme: "Money infrastructure",
    objective: "Wire the checkout, bank, and books so revenue can actually land.",
    doneWhen: "One live Stripe link + business bank + books tool connected.",
    assetKeys: ["payments_checkout_setup", "business_bank_books_starter"],
    category: "Finance",
  },
  {
    day: 10,
    week: 2,
    theme: "Domain, email, tracking",
    objective: "Own your address bar and know what's converting.",
    doneWhen: "Domain live, email deliverable, GA4 + pixels firing events.",
    assetKeys: ["domain_email_dns_checklist", "analytics_pixel_setup"],
    category: "Marketing",
  },
  {
    day: 11,
    week: 2,
    theme: "Ship the site",
    objective: "Hand a full PRD to an AI builder and get a real site up.",
    doneWhen: "Public site live at your domain with a working CTA.",
    assetKeys: ["website_prd", "visual_identity_brief"],
    category: "Marketing",
  },
  {
    day: 12,
    week: 2,
    theme: "Ops + support ready",
    objective: "Prove you can deliver order #1 without dropping the ball.",
    doneWhen: "Fulfillment SOP + support inbox + canned replies ready.",
    assetKeys: ["fulfillment_sop", "customer_support_starter", "operating_plan"],
    category: "Operations",
  },
  {
    day: 13,
    week: 2,
    theme: "Content + launch kit",
    objective: "Load the cannon: announcement posts, calendar, socials.",
    doneWhen: "Week-one launch kit staged and 30 posts queued.",
    assetKeys: ["launch_content_kit", "content_calendar_90day", "social_media_audit_setup"],
    category: "Social & Content",
  },
  {
    day: 14,
    week: 2,
    theme: "Launch day + proof loop",
    objective: "Go live, run paid + review capture, book the first cash in.",
    doneWhen: "Ads live, review-capture running, first paying customer logged.",
    assetKeys: ["paid_ads_starter_pack", "reviews_testimonials_kit", "financial_model"],
    category: "Finance",
  },
];

// Semantic dot color per category, mapped to existing tokens so the planner
// stays theme-safe in light + dark.
export const CATEGORY_DOT: Record<LaunchDay["category"], string> = {
  Foundation: "bg-primary",
  Strategy: "bg-indigo-400",
  Operations: "bg-teal-400",
  Finance: "bg-amber-400",
  Governance: "bg-slate-400",
  Brand: "bg-fuchsia-400",
  Marketing: "bg-sky-400",
  "Social & Content": "bg-rose-400",
};
