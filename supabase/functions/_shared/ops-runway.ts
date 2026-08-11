// Canonical 90-day operating runway.
//
// Phases 1–2 are the 14-Day Launch Cadence, day for day, so the dashboard tells
// the same story the showcase already tells. Each cadence day contributes one
// anchor task (the day's objective + doneWhen verbatim) plus the administrative
// sub-tasks that actually stand the business up. Phases 3–4 carry it past
// launch into running the thing.
//
// task_key is a stable slug — never renamed. Seeding upserts on
// (snapshot_id, task_key) so the catalog can grow without losing progress.

export type OpsCategory =
  | "Foundation" | "Strategy" | "Operations" | "Finance"
  | "Governance" | "Brand" | "Marketing" | "Social & Content" | "Creative";


export type OpsOwnerKind = "client" | "agency";

export type OpsCatalogTask = {
  phase: 1 | 2 | 3 | 4;
  /** Cadence day (1–14) or the first day of the post-launch window (15 / 31). */
  day: number;
  task_key: string;
  title: string;
  why: string;
  done_when: string;
  category: OpsCategory;
  asset_keys: string[];
  owner_kind: OpsOwnerKind;
};

type Day = {
  day: number;
  theme: string;
  objective: string;
  doneWhen: string;
  assetKeys: string[];
  category: OpsCategory;
  /** [slug, title, why, doneWhen, owner, category?] — category defaults to the day's. */
  subs: [string, string, string, string, OpsOwnerKind, OpsCategory?][];

};

const DAYS: Day[] = [
  {
    day: 1, theme: "Lock the concept",
    objective: "Nail the one-line story of what you're building and pick your AI toolkit.",
    doneWhen: "A stranger can repeat what you do — and you've committed to your AI stack.",
    assetKeys: ["executive_summary", "vision_mission", "problem_solution", "ai_tool_stack_recommendation"],
    category: "Foundation",
    subs: [
      ["one-liner", "Say it in one sentence", "Every later asset inherits this sentence.", "Three people repeat it back correctly without prompting.", "client"],
      ["ai-stack", "Commit to the AI stack", "Tool churn is the #1 week-one time sink.", "Accounts created and logins stored in the password manager.", "client"],
    ],
  },
  {
    day: 2, theme: "Sharpen the offer",
    objective: "Turn the concept into a priced, packaged, buyable offer — with your prompt library ready.",
    doneWhen: "You have a headline price, a one-page offer sheet, and 25 tuned prompts.",
    assetKeys: ["value_proposition", "pricing_offer_sheet", "ai_prompt_library"],
    category: "Foundation",
    subs: [
      ["price", "Set the headline price", "You cannot sell, invoice, or forecast without a number.", "A single published price (or price band) you'd quote on a call today.", "client"],
      ["offer-sheet", "Publish the one-page offer sheet", "It becomes the proposal, the site section, and the DM.", "A shareable one-pager with scope, price, and what's excluded.", "agency"],
    ],
  },
  {
    day: 3, theme: "Name your buyers, load the CRM",
    objective: "Get specific about who buys and land the First-50 into a real CRM.",
    doneWhen: "50 named prospects in a live pipeline with an angle each.",
    assetKeys: ["customer_personas", "first_50_warm_list", "crm_pipeline_starter"],
    category: "Strategy",
    subs: [
      ["crm-live", "Stand up the CRM", "A list in a spreadsheet is not a pipeline.", "CRM account live with stages created and the First-50 imported.", "agency"],
      ["crm-fields", "Configure the CRM fields", "Data you don't capture on day one can't be reported on in month three.", "Source, segment, deal value, next step, and close date are required fields on every record.", "agency"],
      ["lead-sources", "Define and tag the lead sources", "Untagged leads make channel spend unreadable.", "Every record carries a source tag from a fixed, written list of channels.", "agency"],
      ["segments", "Build the working lists", "One giant list gets one generic message.", "Contacts segmented into ICP tier, warm vs. cold, industry, and geography.", "client"],
      ["lead-score", "Write the qualified-lead rule", "Without a definition, everything looks like a lead.", "One paragraph defining a qualified lead, applied as a CRM filter or score.", "client"],
      ["angles", "Write one angle per prospect", "Generic outreach is why week-three founders quit.", "Every one of the 50 rows has a reason-to-reach-out.", "client"],
    ],

  },
  {
    day: 4, theme: "Validate demand",
    objective: "Run a 48-hour pre-sell so real money votes before you build.",
    doneWhen: "At least one paid deposit or five written commitments.",
    assetKeys: ["pre_sell_offer_test", "landing_page_waitlist_test", "presell_landing_prd"],
    category: "Strategy",
    subs: [
      ["presell-live", "Put the pre-sell in front of people", "Demand evidence beats another week of planning.", "The pre-sell page or offer message is live and sent to at least 25 people.", "client"],
      ["evidence", "Log the evidence", "Deposits and written yeses are the only signal that counts.", "Paid deposit received, or five written commitments captured in the CRM.", "client"],
    ],
  },
  {
    day: 5, theme: "Pick your wedge",
    objective: "Decide the one wedge only you can own in this market.",
    doneWhen: "Positioning statement written and defended against 3 alts.",
    assetKeys: ["competitive_positioning", "market_analysis"],
    category: "Strategy",
    subs: [
      ["wedge", "Defend the positioning", "A wedge you can't defend collapses on the first sales call.", "Positioning statement written and argued against three alternatives.", "client"],
    ],
  },
  {
    day: 6, theme: "Turn on the sales machine",
    objective: "Sequence the moves, open your calendar, and record every call.",
    doneWhen: "GTM + outbound scripts + booking link + recording stack ready.",
    assetKeys: ["go_to_market_plan", "sales_playbook", "outbound_dm_email_scripts", "booking_calendar_setup", "sales_call_recording_stack"],
    category: "Operations",
    subs: [
      ["booking-link", "Publish the booking link", "Every message you send needs one place to land.", "Booking link live, calendar synced, confirmation email tested.", "agency"],
      ["scripts", "Load the outbound scripts", "Improvised outreach doesn't survive volume.", "Email + DM scripts saved in the CRM as reusable templates.", "agency"],
      ["recording", "Turn on call recording", "Your first ten calls are your best research asset.", "Recorder joins a test call and the transcript lands somewhere findable.", "client"],
    ],
  },
  {
    day: 7, theme: "Message + brand voice",
    objective: "Lock the words and tone so every surface sounds like one voice.",
    doneWhen: "Messaging house and voice guide finished and shareable.",
    assetKeys: ["brand_messaging", "brand_messaging_house", "brand_voice_tone_guide", "brand_strategy_framework"],
    category: "Brand",
    subs: [
      ["voice-adopted", "Put the voice to work", "A voice guide nobody applies is decoration.", "Site copy, outbound scripts, and social captions all pass the voice guide.", "agency"],
      ["logo-signoff", "Approve the final logo lockup", "Everything printed and published inherits this decision — changing it later is expensive.", "Primary, stacked, and one-color marks signed off with clear-space rules written down.", "client", "Creative"],
      ["color-type-lock", "Lock the color and type system", "Near-miss colors and substitute fonts are what make a brand look homemade.", "Hex, CMYK/Pantone equivalents, and the licensed or web-embedded fonts are fixed and documented.", "agency", "Creative"],
      ["style-system", "Publish the style system to the team", "Anyone touching a surface needs the rules without asking.", "The venture style guide is exported and shared with everyone who makes anything.", "agency", "Creative"],
    ],

  },
  {
    day: 8, theme: "Legal + entity",
    objective: "Get the paperwork that makes you bankable and insurable.",
    doneWhen: "Entity chosen, ToS/Privacy/Refund pack live, insurance quoted.",
    assetKeys: ["legal_structure_brief", "terms_privacy_refund_pack", "insurance_starter"],
    category: "Governance",
    subs: [
      ["entity-filed", "File the entity", "Nothing downstream — bank, EIN, contracts — happens without it.", "Filing submitted and the state confirmation number is saved here.", "client"],
      ["ein", "Get the EIN", "The bank and payroll both ask for it first.", "EIN letter issued and stored with the formation docs.", "client"],
      ["agent", "Appoint the registered agent", "Missed service of process is an avoidable disaster.", "Registered agent confirmed in writing for the filing state.", "client"],
      ["operating-agreement", "Execute the operating agreement", "Partners without one negotiate during the fight instead of before it.", "Signed by every member, dated, stored.", "agency"],
      ["msa-drafted", "Draft the MSA + SOW template", "You need one contract you can reuse on every deal.", "MSA and SOW template drafted and reviewed.", "agency"],
      ["msa-executed", "Get the MSA returned executed", "Sent is not signed. Only returned counts.", "At least one counter-signed MSA on file.", "client"],
      ["nda", "Publish the NDA template", "Partners and contractors will ask before you're ready.", "Mutual NDA template ready to send in one click.", "agency"],
      ["contractor-agreement", "Publish the contractor agreement", "IP you don't assign isn't yours.", "Contractor agreement with IP assignment ready to send.", "agency"],
      ["tos-privacy", "Put ToS + Privacy live", "Processors and app stores check for them.", "Both pages live at real URLs on your domain.", "agency"],
      ["insurance", "Bind general liability", "Most first contracts require a certificate of insurance.", "Policy bound and the COI is downloadable.", "client"],
    ],
  },
  {
    day: 9, theme: "Money infrastructure",
    objective: "Wire checkout, bank, and books so revenue can actually land.",
    doneWhen: "One live Stripe link + business bank + books tool connected.",
    assetKeys: ["payments_checkout_setup", "business_bank_books_starter"],
    category: "Finance",
    subs: [
      ["bank", "Open the business bank + card", "Commingled money destroys the books and the liability shield.", "Account open, debit card received, online banking active.", "client"],
      ["separate-spend", "Separate personal spend", "Every mixed transaction costs you at tax time.", "All business spend runs on the business card only.", "client"],
      ["processor", "Take a real test charge", "Untested checkout fails on the first real customer.", "A live payment processed end to end and refunded.", "agency"],
      ["coa", "Set the chart of accounts", "Categories decided later never get backfilled.", "Books tool set up with your revenue and expense categories.", "agency"],
      ["bank-feed", "Connect the bank feed", "Manual entry is the reason books go stale in week three.", "Transactions syncing automatically into the books tool.", "agency"],
      ["sales-tax", "Decide the sales-tax posture", "Nexus surprises are expensive and retroactive.", "Written answer on where you collect, and registration filed if required.", "client"],
      ["book-cadence", "Name the bookkeeping cadence", "Unowned books are no books.", "Weekly reconcile day, monthly close date, and the named owner.", "client"],
    ],
  },
  {
    day: 10, theme: "Domain, email, tracking",
    objective: "Own your address bar, land in inboxes, and know what's converting.",
    doneWhen: "Domain live, email marketing sending, GA4 + pixels firing events.",
    assetKeys: ["domain_email_dns_checklist", "analytics_pixel_setup", "email_marketing_setup"],
    category: "Marketing",
    subs: [
      ["domain", "Point the domain", "Everything else hangs off the address bar.", "Domain resolves over HTTPS with DNS records recorded here.", "agency"],
      ["email", "Set up business email", "Gmail-address outreach halves your reply rate.", "you@yourdomain sends and receives.", "agency"],
      ["auth", "Authenticate the sending domain", "Without SPF/DKIM your launch email is spam.", "SPF, DKIM, and DMARC pass on a test send.", "agency"],
      ["analytics", "Fire real events", "You can't improve a funnel you can't see.", "GA4 and pixels record a real form submit and a real purchase event.", "agency"],
      ["utm", "Set the UTM and attribution convention", "Links without a convention report nothing you can act on.", "A written naming scheme every campaign link follows, visible in analytics and the CRM.", "agency"],
      ["lead-magnet", "Build the lead magnet", "Cold traffic won't buy, but it will trade an email address.", "The asset exists, is gated behind a form, and is delivered automatically.", "client"],
      ["capture-funnel", "Publish the capture funnel", "A form with nowhere to go is a dead end.", "Landing page, form, thank-you page, and delivery email all tested end to end.", "agency"],
      ["forms-to-crm", "Wire the forms into the CRM", "Leads that land in an inbox get lost.", "A test submission creates a CRM record with its source tag attached.", "agency"],
      ["nurture", "Turn on the welcome sequence", "Most subscribers never hear from you twice — that's the whole leak.", "Five nurture emails written and sending automatically to new subscribers.", "agency"],
      ["retargeting", "Stand up the retargeting audience", "The people who already looked are the cheapest to reach again.", "Site and list audiences built in the ad platform and populating.", "agency"],

    ],
  },
  {
    day: 11, theme: "Ship the site + brand pack",
    objective: "Hand a full PRD + AI-generated visual pack to your site builder.",
    doneWhen: "Public site live at your domain with logo, favicon, and OG image.",
    assetKeys: ["website_prd", "visual_identity_brief", "logo_brand_asset_pack"],
    category: "Marketing",
    subs: [
      ["site-live", "Ship the site", "The site is where every message you send lands.", "Live at your domain with logo, favicon, OG image, and one clear call to action.", "agency"],
      ["site-proof", "Put proof on the page", "Nobody buys from a page with no evidence.", "At least one testimonial, result, or named client on the homepage.", "client"],
      ["asset-pack", "Export the print and digital asset pack", "The wrong file at the printer costs a week and a reprint.", "SVG, PNG, favicon, OG image, plus business card and letterhead print files at bleed — all in one folder.", "agency", "Creative"],
      ["photography", "Choose the real imagery", "Stock and placeholders read as 'nobody works here'.", "Real photography or commissioned imagery replaces every placeholder on live surfaces.", "client", "Creative"],
      ["identity-sweep", "Apply the identity everywhere", "Brand drift starts on the surfaces nobody audits.", "Site, email signature, invoice, proposal, and every social profile match the style system.", "agency", "Creative"],

    ],
  },
  {
    day: 12, theme: "Ops, CRM, and proposals",
    objective: "Prove you can deliver order #1 — with the paperwork and follow-through around it.",
    doneWhen: "Fulfillment SOP + support channel + proposal-to-invoice path all live.",
    assetKeys: ["fulfillment_sop", "customer_support_starter", "operating_plan", "ai_support_bot_setup", "automation_recipes_starter"],
    category: "Operations",
    subs: [
      ["pipeline-stages", "Define the pipeline stages", "Deals stall in stages nobody owns.", "Stages named, entry criteria written, one owner per stage.", "agency"],
      ["crm-automation", "Turn on task and reminder automation", "Deals die from silence, not objections.", "No deal can sit untouched past the number of days you set — the CRM chases you.", "agency"],
      ["crm-reporting", "Build the pipeline reporting view", "If you can't see it by source, you'll spend blind.", "One saved view showing pipeline by stage, by source, and by owner.", "agency"],

      ["proposal", "Build the proposal template", "Bespoke proposals per deal is how founders lose a week.", "Proposal template generated from the priced offer, ready to send.", "agency"],
      ["esign", "Connect e-signature", "Chasing PDFs adds days to every close.", "A test proposal signed electronically end to end.", "agency"],
      ["invoicing", "Turn on invoicing terms", "Unclear terms are why founders get paid late.", "Invoice template live with deposit, net terms, and a late fee.", "client"],
      ["onboarding-kit", "Assemble the onboarding kit", "The gap after 'yes' is where trust leaks.", "Welcome email, kickoff agenda, and asset request list ready to send.", "agency"],
      ["delivery-sop", "Write the delivery SOP", "You can't hand off what only lives in your head.", "Step-by-step SOP another person could follow to deliver order #1.", "agency"],
      ["support", "Open the support channel", "Silence after purchase kills referrals.", "Support inbox live with a published response-time promise.", "client"],
    ],
  },
  {
    day: 13, theme: "Demand engine + weekly rhythm",
    objective: "Load the launch cannon and install the cadence that keeps you honest.",
    doneWhen: "Launch kit staged, content queued, outbound quota running.",
    assetKeys: ["launch_content_kit", "content_calendar_90day", "social_media_audit_setup", "founder_operating_cadence"],
    category: "Social & Content",
    subs: [
      ["three-sources", "Commit to three lead sources", "One source is a single point of failure.", "Three named sources, each with a weekly numeric quota.", "client"],
      ["first-25", "Send the first 25 messages", "The list is worthless until it's contacted.", "25 personalized messages actually sent and logged in the CRM.", "client"],
      ["sequence", "Schedule the 5-touch follow-up", "Most replies come after touch three.", "A five-step sequence running automatically for new prospects.", "agency"],
      ["calendar-loaded", "Queue the content calendar", "Posting when inspired means not posting.", "30 posts scheduled from the brand kit.", "agency"],
    ],
  },
  {
    day: 14, theme: "Launch day + proof + growth loops",
    objective: "Go live with ads, reviews, and a referral program pointing at first cash.",
    doneWhen: "Ads live, reviews captured, referral link shared, first paying customer logged.",
    assetKeys: ["paid_ads_starter_pack", "reviews_testimonials_kit", "financial_model", "ad_creative_pack", "referral_affiliate_starter"],
    category: "Finance",
    subs: [
      ["ads-live", "Turn the ads on", "Paid is the fastest read on whether the message lands.", "At least one campaign spending against a tracked conversion.", "agency"],
      ["reviews", "Capture the first reviews", "Proof compounds; ask while it's fresh.", "Two reviews or testimonials published somewhere public.", "client"],
      ["referral", "Send the referral offer", "Your happiest customer is your cheapest channel.", "Referral link or offer sent to everyone who's said yes.", "client"],
      ["first-customer", "Log the first paying customer", "The whole runway points here.", "Payment received, customer recorded in the CRM.", "client"],
    ],
  },
];

/** Post-launch: [slug, title, why, doneWhen, category, owner, day] */
const POST_LAUNCH: [string, string, string, string, OpsCategory, OpsOwnerKind, 15 | 31][] = [
  ["ten-proposals", "Get ten proposals out", "Volume is the only cure for an unproven close rate.", "Ten proposals sent from the template and tracked in the pipeline.", "Strategy", "client", 15],
  ["close-rate", "Track the close rate", "You can't fix what you don't measure.", "Sent / won / lost recorded for every proposal, with a reason on each loss.", "Strategy", "client", 15],
  ["cash-reconcile", "Reconcile cash to invoices", "Invoiced is not collected.", "Every invoice matched to a deposit; overdue ones chased.", "Finance", "agency", 15],
  ["first-close", "Complete the first monthly close", "The first close is where the books' real gaps show.", "Month closed in the books tool and a P&L reviewed.", "Finance", "agency", 15],
  ["first-proof", "Capture the first case study", "One documented result outsells a page of claims.", "Before, what you did, and the number — published.", "Marketing", "agency", 15],
  ["sop-survives", "Run the delivery SOP on a real client", "A SOP untested by a real client is a guess.", "Order delivered following the SOP; the SOP updated with what broke.", "Operations", "client", 15],
  ["weekly-rhythm", "Install the weekly operating rhythm", "Rhythm is what separates a business from a burst of effort.", "Monday pipeline review and Friday five-numbers review both held twice.", "Operations", "client", 31],
  ["five-numbers", "Stand up the numbers dashboard", "Five numbers beat fifty dashboards.", "CAC, close rate, cash on hand, pipeline value, and MRR-or-backlog in one place.", "Finance", "agency", 31],
  ["pricing-review", "Revisit pricing against win-loss", "Your launch price was a hypothesis.", "Price adjusted or explicitly confirmed using real win-loss data.", "Foundation", "client", 31],
  ["first-hire", "Scope the first hire or contractor", "The bottleneck at day 60 is always you.", "Role scoped with a 30-day scorecard and a budget.", "Operations", "client", 31],
  ["quarter-plan", "Write the next quarter's plan", "Ninety days without a target drifts.", "One page: the target number, the three bets, and what you'll stop doing.", "Strategy", "client", 31],
  ["funnel-read", "Read the funnel end to end", "Averages hide the one step that's leaking.", "Visitors, leads, calls, proposals, and closes counted for the month, with the worst step named.", "Marketing", "agency", 15],
  ["list-hygiene", "Install the list-hygiene rhythm", "A dirty list quietly kills your sending reputation.", "Monthly pass on bounces, unsubscribes, and a re-engagement send to the cold segment.", "Marketing", "agency", 31],
  ["creative-refresh", "Refresh the creative against results", "Ad and post fatigue is measurable — and fixable.", "Lowest-performing creative replaced using the brand kit, with before/after numbers.", "Creative", "agency", 31],
  ["brand-audit", "Audit brand consistency across surfaces", "Six weeks of shipping is how brands drift.", "Every live surface checked against the style system; the exceptions fixed or documented.", "Creative", "agency", 31],

];

export function buildOpsCatalog(): OpsCatalogTask[] {
  const out: OpsCatalogTask[] = [];
  for (const d of DAYS) {
    const phase: 1 | 2 = d.day <= 7 ? 1 : 2;
    out.push({
      phase, day: d.day,
      task_key: `day-${d.day}.anchor`,
      title: `${d.theme}`,
      why: d.objective,
      done_when: d.doneWhen,
      category: d.category,
      asset_keys: d.assetKeys,
      owner_kind: "client",
    });
    for (const [slug, title, why, doneWhen, owner] of d.subs) {
      out.push({
        phase, day: d.day,
        task_key: `day-${d.day}.${slug}`,
        title, why, done_when: doneWhen,
        category: d.category,
        asset_keys: d.assetKeys,
        owner_kind: owner,
      });
    }
  }
  for (const [slug, title, why, doneWhen, category, owner, day] of POST_LAUNCH) {
    out.push({
      phase: day === 15 ? 3 : 4,
      day,
      task_key: `post.${slug}`,
      title, why, done_when: doneWhen, category,
      asset_keys: [],
      owner_kind: owner,
    });
  }
  return out;
}

export const OPS_PHASES = [
  { phase: 1 as const, label: "Prove it", range: "Days 1–7", blurb: "Concept, offer, buyers, demand, wedge, sales machine, voice." },
  { phase: 2 as const, label: "Wire it", range: "Days 8–14", blurb: "Legal, money, domain, site, ops, content, launch." },
  { phase: 3 as const, label: "Run it", range: "Days 15–30", blurb: "First proposals, first cash, first close, first proof." },
  { phase: 4 as const, label: "Compound", range: "Days 31–90", blurb: "Rhythm, numbers, pricing, first hire, next quarter." },
];
