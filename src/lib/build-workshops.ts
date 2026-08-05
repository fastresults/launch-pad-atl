import {
  Palette,
  Globe,
  Share2,
  PenTool,
  Sparkles,
  Mail,
  TrendingUp,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { WORKSHOP_PRICE_LABEL } from "@/lib/framework-deliverables";
import { AGENCY_SERVICES } from "@/lib/agency-services";

export type AgendaBlock = { time: string; title: string; detail: string };
export type FAQ = { q: string; a: string };

/** A two-clause headline rendered as `{lead} <gradient>{emphasis}</gradient>` */
export type SplitHeadline = { lead: string; emphasis: string };

/** Frame copy for every section on the /build/[slug] page. Workshop-specific. */
export type WorkshopSections = {
  painEyebrow: string;
  painHeadline: string;
  walkOutHeadline: SplitHeadline;
  agendaHeadline: SplitHeadline;
  fitHeadline: SplitHeadline;
  fitLede: string;
  decisionHeadline: SplitHeadline;
  decisionBody: string;
  otherWorkshopsHeadline: string;
  faqHeadline: string;
};

export type BuildWorkshop = {
  slug: string;
  icon: LucideIcon;
  title: string; // The product name, e.g. "Brand Identity Workshop"
  capability: string; // The build-layer capability name, e.g. "Brand identity"
  priceCents: number; // 19700 | 29700 | 39700
  priceLabel: string; // "$197" | "$297" | "$397"
  oneLiner: string;
  subhead: string;
  pains: { title: string; body: string }[];
  walkOuts: string[];
  agenda: AgendaBlock[];
  forYou: string[];
  notForYou: string[];
  /** Workshop-specific tagline for the "Have us build it instead" upsell.
   *  Name, price, and CTA href are resolved from AGENCY_SERVICES by slug. */
  agencyServiceTagline: string;
  /** Per-workshop section frame copy (eyebrows, headlines, decision body). */
  sections: WorkshopSections;
  faq: FAQ[];
};

/** Map agency retail price (in cents) to the matching workshop price tier. */
export function workshopPriceForRetailCents(retailCents: number): {
  cents: number;
  label: string;
} {
  void retailCents;
  return { cents: 19_700, label: "$197" };
}

function makeCommonFaq(priceLabel: string): FAQ[] {
  return [
    {
      q: `What's actually included for ${priceLabel}?`,
      a: "The strategy, the exact tool stack we use, and the step-by-step process to ship it yourself — delivered in a live half-day workshop. Plus every framework and worksheet, a recording you keep forever, and 30 days of follow-up access in our group channel as you implement.",
    },
    {
      q: "Do I need to attend the Strategic Foundation Workshop first?",
      a: `Strongly recommended, not required. The ${WORKSHOP_PRICE_LABEL} Foundation Workshop locks your positioning, ICP, and offer. Without that, anything you build on top is a guess. If you already have those nailed, jump straight in.`,
    },
    {
      q: "What if I don't get value out of it?",
      a: `Email us within 7 days and we refund the ${priceLabel}. No forms, no friction. We've never had to debate it.`,
    },
    {
      q: "Can your team just build this for me instead?",
      a: `Yes. The workshop is built to let you ship it yourself — strategy, frameworks, tool stack, the whole playbook. If you'd rather hand it to us, the ${priceLabel} credits toward any engagement over $1,000.`,
    },
  ];
}

export const BUILD_WORKSHOPS: BuildWorkshop[] = [
  /* ─────────── 1. BRAND IDENTITY ─────────── */
  {
    slug: "brand-identity",
    priceCents: 19700,
    priceLabel: "$197",
    icon: Palette,
    title: "Build your brand",
    capability: "Brand identity",
    oneLiner: "Your brand in a day. No agency required.",
    subhead:
      "Most founders treat brand like a logo decision and pay for it every time they try to raise prices. In one morning we build the brand system — voice, archetype, palette, type, asset rules — that earns trust in three seconds and lets you quote 30% higher without flinching.",
    pains: [
      {
        title: "A weak brand caps your pricing at freelancer rates — forever.",
        body: "Buyers decide premium-vs-cheap in the first three seconds, before they read a word. If the visual fluency isn't there, you'll lose the price negotiation before it starts and never know why.",
      },
      {
        title: "The $20K rebrand you'll pay for in month 13.",
        body: "Founders pick a logo too fast, slap it on a deck, and discover a year in that the brand contradicts the actual offer. Then it's a full asset rebuild — site, deck, packaging, social — at agency rates.",
      },
      {
        title: "AI makes every asset look like it's from a different company.",
        body: "Without a written brand system, every Midjourney render and Canva slide drifts. The market reads inconsistency as amateurism, and your CAC quietly climbs as trust leaks out.",
      },
    ],
    walkOuts: [
      "Signed brand brief — who you stand for, who you stand against, the one sentence you're allowed to mean",
      "Brand archetype + voice guide your team (and any AI prompt) can follow without you in the room",
      "One chosen logo direction, with the buyer-psychology reasoning that killed the alternatives",
      "Color palette and typography system with usage rules tight enough to hand to a freelancer",
      "Visual reference set chosen in the room — the exact look a designer can build from",
      "90-day rollout map across your 10 most visible surfaces (site, deck, signature, social, packaging)",
    ],
    agenda: [
      {
        time: "8:45 – 9:15",
        title: "Lock the one sentence the brand is allowed to mean",
        detail:
          "Input: your current positioning, top 3 competitors, last 5 sales calls. Working session: forced-choice exercise to compress the brand promise into one sentence. Output: the strategic sentence every design and copy decision will be tested against.",
      },
      {
        time: "9:15 – 10:15",
        title: "Build the archetype and voice guide",
        detail:
          "Input: 12 archetype options scored against your buyer. Working session: choose the archetype your market is already shopping for, then write the voice rules (tone, taboo words, sentence length, examples). Output: a voice guide your team and your AI prompts both inherit.",
      },
      {
        time: "10:30 – 11:15",
        title: "Design the visual system — live",
        detail:
          "Input: 3 logo directions, 4 palette pairs, 2 typography systems. Working session: live critique against your real competitors using a 60-second-trust test. Output: a chosen direction with palette, type, and usage rules you can hand to a designer this week.",
      },
      {
        time: "11:15 – 11:30",
        title: "Map the 90-day rollout",
        detail:
          "Input: your top 10 visible surfaces. Working session: triage what gets the new system first, what waits, what gets retired. Output: a dated rollout plan with owners and dependencies.",
      },
    ],
    forYou: [
      "You're about to spend money on a website, deck, or packaging and want the brand right first",
      "Your current brand was made too fast and now feels like a ceiling on what you can charge",
      "You're tired of every new asset looking like it came from a different company",
    ],
    notForYou: [
      "You haven't decided what you sell or who you sell it to",
      "You want a $300 logo on Fiverr and a fast exit",
      "You're hoping to debate font weights for six hours",
    ],
    agencyServiceTagline: "Logo system, voice, and full asset pack — shipped live in 2 weeks.",
    sections: {
      painEyebrow: "The cost of looking cheap",
      painHeadline: "A $40 logo costs you $40K in deals you'll never know you lost.",
      walkOutHeadline: {
        lead: "A brand system tight enough to charge for.",
        emphasis: "Not a logo. Not a mood board.",
      },
      agendaHeadline: {
        lead: "One morning. One brand built.",
        emphasis: "Voice, archetype, system — by lunch.",
      },
      fitHeadline: {
        lead: "Built for founders ready to charge more.",
        emphasis: "Not for hobbyists shopping fonts.",
      },
      fitLede:
        "Read both columns honestly. The wrong workshop costs you a morning. The wrong brand costs you a year of pricing power.",
      decisionHeadline: {
        lead: "Leave with the brand —",
        emphasis: "and the right to raise prices.",
      },
      decisionBody:
        "By 11:30 you'll have the voice, palette, type, and asset rules a designer can execute against. You'll also know whether to roll it out yourself, hire a freelancer, or hand it to our team — and either way, you stop bleeding deals to a weak first impression.",
      otherWorkshopsHeadline: "The other layers your brand will need to carry.",
      faqHeadline: "Brand questions, answered honestly.",
    },
    faq: makeCommonFaq("$197"),
  },

  /* ─────────── 2. WEBSITE THAT CONVERTS ─────────── */
  {
    slug: "website-that-converts",
    priceCents: 19700,
    priceLabel: "$197",
    icon: Globe,
    title: "Convert your website",
    capability: "A website that converts",
    oneLiner: "Build the site your customers actually buy from.",
    subhead:
      "Most founder sites convert at under 1% and the owner can't tell you which page is broken. In one morning we wire your site for revenue: one clear job per page, the proof stack that closes, payment and analytics events live, and the copy that does the selling.",
    pains: [
      {
        title: "A pretty site at 0.4% conversion is a $30K liability.",
        body: "Doubling your conversion rate is worth more than doubling your traffic — and costs nothing to ship. Founders pay for design polish and ignore the structural decisions that actually move the rate.",
      },
      {
        title: "If your homepage doesn't make the ICP feel seen in 5 seconds, paid traffic is a tax.",
        body: "Generic 'we help businesses grow' headlines bleed money on every ad click. The fix is buyer-language pulled from real calls and reviews — not a copywriter guessing in a vacuum.",
      },
      {
        title: "Untracked events = invisible leaks.",
        body: "Most founders can't name their site's #1 conversion event, let alone watch it. You can't optimize what GA4 isn't capturing — and 'looks like traffic is up' is not a strategy.",
      },
    ],
    walkOuts: [
      "Sitemap with a single job written on every page (every page earns its slot)",
      "Wireframes for your homepage and #1 conversion page using the proof-stack pattern",
      "Page-by-page copy outline: hero, proof, offer, objection, CTA — written in your buyer's words",
      "Your primary conversion event configured in GA4 — you watch the first one fire — with the rest of the event plan written",
      "Stack decision in writing — the right platform for your team, with a 12-month cost projection",
      "Pre-launch QA checklist (30 items) so you ship without an embarrassing leak on day one",
    ],
    agenda: [
      {
        time: "8:45 – 9:15",
        title: "Pick the one job the site exists to do",
        detail:
          "Input: your current funnel, last 90 days of revenue sources. Working session: force-rank candidate conversion events, choose the single one. Output: the one number every page on the site is now responsible for moving.",
      },
      {
        time: "9:15 – 10:15",
        title: "Wireframe the homepage and #1 conversion page",
        detail:
          "Input: the proof-stack framework, your real testimonials and metrics. Working session: live wireframing in Figma — no design polish, structure first. Output: two pages laid out section-by-section, ready for copy.",
      },
      {
        time: "10:30 – 11:15",
        title: "Write copy that sells — not describes",
        detail:
          "Input: language from your last 5 sales calls (or top competitor reviews if pre-launch). Working session: draft hero, offer, and close together. Output: a complete copy outline you can hand to a writer or paste into your CMS.",
      },
      {
        time: "11:15 – 11:30",
        title: "Wire events and ship the QA list",
        detail:
          "Input: your GA4 / CRM logins. Working session: fire your first real conversion event in the room. Output: tagging plan, pre-launch QA checklist, and the stack decision in writing.",
      },
    ],
    forYou: [
      "You're paying for traffic that isn't converting and the analytics can't tell you why",
      "Your site looks fine but you can't point to the line that closes the buyer",
      "You're about to redesign and refuse to redo it again in a year",
    ],
    notForYou: [
      "You want a portfolio site for vibes",
      "You haven't picked the offer you're selling",
      "You believe adding more sections will fix conversion",
    ],
    agencyServiceTagline: "Site, copy, payments, and analytics — shipped live in 2–3 weeks.",
    sections: {
      painEyebrow: "The cost of a brochure site",
      painHeadline: "Every 0.4% you don't fix is a paid-ad budget set on fire.",
      walkOutHeadline: {
        lead: "Wireframes, copy, events, and a stack decision.",
        emphasis: "Not Figma porn.",
      },
      agendaHeadline: {
        lead: "One morning. Two pages wired for revenue.",
        emphasis: "First event fires before lunch.",
      },
      fitHeadline: {
        lead: "Built for founders selling something.",
        emphasis: "Not for portfolio polishers.",
      },
      fitLede:
        "If your site exists to look good, skip this. If your site exists to make money, sit down.",
      decisionHeadline: {
        lead: "Leave with a site that works —",
        emphasis: "and proof in the analytics.",
      },
      decisionBody:
        "By 11:30 you'll have a sitemap, two wireframed pages, a copy outline in your buyer's words, and your primary conversion event firing into GA4. You'll also leave with the stack decision in writing — the right platform for your team (or hand it to ours) — with the 12-month cost math on the table.",
      otherWorkshopsHeadline: "The other systems your site will drive traffic into.",
      faqHeadline: "Site questions, answered without the agency hedge.",
    },
    faq: makeCommonFaq("$197"),
  },

  /* ─────────── 3. SOCIAL PRESENCE ─────────── */
  {
    slug: "social-presence",
    priceCents: 19700,
    priceLabel: "$197",
    icon: Share2,
    title: "Own your social presence",
    capability: "Social presence",
    oneLiner: "30 days of content before you leave the room.",
    subhead:
      "Posting to six platforms is the fastest way to dominate zero of them. In one morning we score every channel against your buyer, commit to two, rebuild your profiles to convert, and ship a 30-day calendar — real posts drafted, not 'ideas.'",
    pains: [
      {
        title: "Spread thin, quit in 90 days, blame the algorithm.",
        body: "Distribution compounds when you concentrate it. Every channel you 'maintain a presence on' is a tax on the two that could actually grow.",
      },
      {
        title: "Your bio is a landing page in disguise — and yours is leaking.",
        body: "If a stranger can't decide to click in 1.5 seconds, the platform shows your posts to fewer people next time. Then you call it 'reach,' not what it is: a profile problem.",
      },
      {
        title: "No cadence is the same as silence.",
        body: "Algorithms reward predictable shipping. Random posting trains the platform to deprioritize you — and trains your audience that you're not serious.",
      },
    ],
    walkOuts: [
      "Channel-fit scorecard — the two channels you commit to and the four you publicly stop",
      "Profile rewrites for both channels: bio, link, banner, pinned post (drafted live)",
      "Your first week of posts written and scheduled, with the rest of the 30 days slotted by pillar, format, and ship date",
      "Hook bank built on your pillars — 15 openers written for your niche, ready to remix",
      "Weekly cadence and the lightest tool stack to actually hold it (Buffer or Notion + your phone)",
      "Engagement playbook — what to comment, on whose posts, on what schedule, to be visible to buyers",
    ],
    agenda: [
      {
        time: "8:45 – 9:15",
        title: "Score every channel and commit to two",
        detail:
          "Input: 8 major channels scored against your buyer, offer, and bandwidth. Working session: rank them; commit to two; declare the four you're stopping. Output: a one-page channel decision you'll defend for the next 12 months.",
      },
      {
        time: "9:15 – 10:00",
        title: "Rewrite the profiles to convert",
        detail:
          "Input: the bio formula and link strategy. Working session: rewrite bio, banner, link block, and pinned post live, with critique. Output: profiles ready to copy-paste into both platforms.",
      },
      {
        time: "10:15 – 11:15",
        title: "Build the 30-day calendar — in the room",
        detail:
          "Input: 3–4 content pillars, 5 proven post formats, your hook bank. Working session: draft 20 posts against pillar + format + hook. Output: a real calendar you can schedule on Monday, not an idea list.",
      },
      {
        time: "11:15 – 11:30",
        title: "Lock cadence and the weekly rhythm",
        detail:
          "Input: your real weekly bandwidth. Working session: pick the scheduling tool, set the post days, set the engagement window. Output: a 45-minute weekly routine you'll actually keep.",
      },
    ],
    forYou: [
      "You're posting and getting nothing back, and you're about to quit",
      "You want a calendar instead of the daily 'what do I post' anxiety",
      "You're ready to be visible to the right 1,000 people, not invisible to a million",
    ],
    notForYou: [
      "You're chasing viral hits",
      "You haven't decided what you sell",
      "You expect followers without shipping",
    ],
    agencyServiceTagline:
      "Two channels rebuilt to convert, a 30-day calendar shipped, the cadence held — every month.",
    sections: {
      painEyebrow: "The cost of being everywhere",
      painHeadline: "Six channels at 200 followers each is invisibility with extra steps.",
      walkOutHeadline: {
        lead: "Two profiles, 20 posts, one cadence.",
        emphasis: "Not a vibes board.",
      },
      agendaHeadline: {
        lead: "One morning. Two channels owned.",
        emphasis: "30-day calendar shipped, not sketched.",
      },
      fitHeadline: {
        lead: "Built for founders ready to commit.",
        emphasis: "Not for chasers of every new platform.",
      },
      fitLede:
        "Concentration beats coverage. If you're not willing to publicly stop four channels by Monday, this workshop isn't for you.",
      decisionHeadline: {
        lead: "Leave with a calendar —",
        emphasis: "and the discipline to hold it.",
      },
      decisionBody:
        "By 11:30 you'll have rewritten both profiles, written and scheduled your first week of posts, slotted the rest of the month against pillars and hooks, and locked the 45-minute weekly routine that holds the engine. You'll also know whether to run it yourself, hire a part-time editor, or hand it to our team.",
      otherWorkshopsHeadline: "The other surfaces your audience will land on.",
      faqHeadline: "Social questions, answered without the guru spin.",
    },
    faq: makeCommonFaq("$197"),
  },

  /* ─────────── 4. CONTENT ENGINE ─────────── */
  {
    slug: "content-engine",
    priceCents: 19700,
    priceLabel: "$197",
    icon: PenTool,
    title: "Engineer your content",
    capability: "A content engine",
    oneLiner: "Rank, publish, repeat. Your content machine is live.",
    subhead:
      "Paid traffic gets more expensive every quarter. Content compounds. In one morning we architect the engine — pillars, SEO map, production flow, and the repurposing system that turns one anchor piece into ten — so it ships without grinding you to dust.",
    pains: [
      {
        title: "A year of random posts, and you rank for nothing you sell.",
        body: "Without pillars tied to buyer intent and a keyword map you can actually win, you produce volume and earn zero pipeline. Volume without strategy is the most expensive way to lose.",
      },
      {
        title: "If the engine lives in your head, it dies the first busy week.",
        body: "Founder-as-engine is a 90-day ceiling. The fix is an assembly line — capture, draft, edit, ship, repurpose — with owners and deadlines that survive a launch crunch.",
      },
      {
        title: "One asset, one use, is rookie math.",
        body: "A real engine turns one anchor piece into 10 derivatives across blog, social, email, and video. Skip the repurposing flow and you're paying full price for a tenth of the reach.",
      },
    ],
    walkOuts: [
      "3–5 content pillars tied to your offer and to buyer-intent keywords",
      "SEO keyword map — the terms we confirm in the room that you can realistically rank for in 6 months",
      "Production system documented: capture → draft → edit → publish, with owners and SLAs",
      "One anchor piece repurposed live into its derivative assets, with the flow documented for every piece after",
      "90-day editorial calendar locked: titles, formats, ship dates, owner per asset",
      "Measurement plan — the 3 metrics that prove the engine is working (and the 12 to ignore)",
    ],
    agenda: [
      {
        time: "8:45 – 9:15",
        title: "Pick pillars that lead to a buying decision",
        detail:
          "Input: your offer, ICP, top 3 competitor content libraries. Working session: rank candidate pillars by buyer-intent, not click potential. Output: 3–5 pillars locked, with a sentence each on why they sell.",
      },
      {
        time: "9:15 – 10:15",
        title: "Build the keyword map and topical authority plan",
        detail:
          "Input: live keyword research against your pillars. Working session: cluster terms into a publishing roadmap, score by realistic win-ability. Output: a 6-month topical authority plan, prioritized.",
      },
      {
        time: "10:30 – 11:15",
        title: "Design the production system + repurposing flow",
        detail:
          "Input: your team (or just you), your tool stack. Working session: map the assembly line — who captures, who drafts, who edits, who ships. Output: a documented workflow and the repurposing framework (1 → 10).",
      },
      {
        time: "11:15 – 11:30",
        title: "Lock the first 90 days",
        detail:
          "Input: the editorial calendar framework. Working session: assign titles, formats, and ship dates to the next 90 days. Output: a calendar you can execute against on Monday.",
      },
    ],
    forYou: [
      "You're paying for ads and want to lower the cost of being known",
      "You've published sporadically for a year and have nothing to show for it",
      "You want a system your team can run without you on a content kick",
    ],
    notForYou: [
      "You want overnight traffic",
      "You won't commit to publishing for 6 months while SEO compounds",
      "You think AI can produce shippable content with zero editing",
    ],
    agencyServiceTagline:
      "Pillars, SEO map, and 8 anchor pieces a month — repurposed across every channel.",
    sections: {
      painEyebrow: "The cost of winging this",
      painHeadline: "A year of random posts and you rank for nothing your buyer actually searches.",
      walkOutHeadline: {
        lead: "Pillars, keywords, production flow, repurposing.",
        emphasis: "Not a Notion framework.",
      },
      agendaHeadline: {
        lead: "One morning. The whole engine.",
        emphasis: "Pillars to publishing calendar — locked.",
      },
      fitHeadline: {
        lead: "Built for founders who'll publish for 6 months.",
        emphasis: "Not for traffic tourists.",
      },
      fitLede:
        "Content rewards patience and punishes dabbling. If you won't commit to publishing through a slow quarter, save your $197.",
      decisionHeadline: {
        lead: "Leave with the engine —",
        emphasis: "and a 90-day calendar already loaded.",
      },
      decisionBody:
        "By 11:30 you'll have your pillars, a keyword map you can actually win in 6 months, a documented production flow (capture → draft → edit → ship), a 1-to-10 repurposing framework, and a 90-day editorial calendar with owners assigned. You'll also know whether to operate it solo, hire an editor, or hand the whole flywheel to our team.",
      otherWorkshopsHeadline: "The other channels your content will pour into.",
      faqHeadline: "Content questions, answered without the SEO theater.",
    },
    faq: makeCommonFaq("$197"),
  },

  /* ─────────── 5. AI AS YOUR OPERATING SYSTEM ─────────── */
  {
    slug: "ai-operating-system",
    priceCents: 19700,
    priceLabel: "$197",
    icon: Sparkles,
    title: "Run on AI",
    capability: "AI as your operating system",
    oneLiner: "Automate 5 real workflows. Today.",
    subhead:
      "Buying ChatGPT seats isn't AI strategy. In one morning we audit your real workflows, automate five of them live in the room, and hand you the prompt library, model choices, and governance plan so the leverage compounds across your team — not just on your laptop.",
    pains: [
      {
        title: "AI amplifies whatever it's pointed at. Most teams are scaling fuzz.",
        body: "Vague strategy + AI = vague output, faster. Sharp inputs + AI = a 10-person company. The difference isn't the model — it's the inputs no one is investing in.",
      },
      {
        title: "Tools without workflows are toys.",
        body: "Seats don't transform companies. Mapping which decisions and outputs AI owns end-to-end does. Most 'AI rollouts' are seat counts with no workflow attached.",
      },
      {
        title: "No governance, no scale.",
        body: "Without prompt standards, model choices, and quality gates, output drifts the moment more than one person uses it. Inconsistency at scale is a brand problem and a legal one.",
      },
    ],
    walkOuts: [
      "AI stack audit — what to keep, kill, and add, with monthly cost math",
      "Your highest-value workflow built and running on your real data — the next four specified and prompted",
      "Prompt library tuned to your brand voice — your core prompts written, organized, and reusable",
      "Governance doc: model choice per task, quality gates, what AI is never allowed to do alone",
      "ROI model — hours and dollars saved per week, per workflow, with the formula",
      "30-day rollout plan to onboard the team without revolt (training, ownership, KPI)",
    ],
    agenda: [
      {
        time: "8:45 – 9:15",
        title: "Audit and score your top 15 workflows",
        detail:
          "Input: a list of your team's recurring work. Working session: score each by AI leverage, risk, and frequency. Output: the 5 workflows we're attacking before lunch.",
      },
      {
        time: "9:15 – 10:30",
        title: "Automate 5 workflows — live, with your data",
        detail:
          "Input: real tools (Claude/GPT, n8n or Zapier, your CRM). Working session: build, test, and iterate each automation in the room. Output: 5 working flows you can deploy to the team this week.",
      },
      {
        time: "10:45 – 11:15",
        title: "Build the prompt library + governance",
        detail:
          "Input: voice guide, brand rules, risk tolerance. Working session: write and organize your core prompt set, set quality gates, decide what AI never touches alone. Output: a prompt vault and a one-page governance doc.",
      },
      {
        time: "11:15 – 11:30",
        title: "Sequence the 30-day rollout",
        detail:
          "Input: your team and current routines. Working session: pick owner, training cadence, and the one KPI that proves it worked. Output: a dated rollout plan with accountability.",
      },
    ],
    forYou: [
      "You're a small team trying to operate like a big one — and you're hitting the headcount wall",
      "You've bought AI tools nobody actually uses",
      "You're ready to compete on speed, not headcount",
    ],
    notForYou: [
      "You want a generic 'intro to ChatGPT' session",
      "You expect AI to run the business with no humans in the loop",
      "You haven't picked the offer yet — automate the strategy first, then workflows",
    ],
    agencyServiceTagline:
      "30 days, 10 of your workflows rewired around AI — built, tested, and handed off with the prompt library.",
    sections: {
      painEyebrow: "The cost of seats without systems",
      painHeadline: "AI without workflows isn't transformation — it's a $400/month subscription.",
      walkOutHeadline: {
        lead: "Five live automations, a prompt library, governance.",
        emphasis: "Not a demo reel.",
      },
      agendaHeadline: {
        lead: "One morning. Five workflows automated.",
        emphasis: "With your tools, your data — in the room.",
      },
      fitHeadline: {
        lead: "Built for teams hitting the headcount wall.",
        emphasis: "Not for ChatGPT 101 attendees.",
      },
      fitLede:
        "If you came for tips and prompts, save the morning. If you came to actually take ten hours a week off your team, sit down.",
      decisionHeadline: {
        lead: "Leave with leverage —",
        emphasis: "measured in hours per week.",
      },
      decisionBody:
        "By 11:30 you'll have your highest-value automation running on your real data, the next four specified, a prompt library tuned to your brand, a one-page governance doc (what AI does, what it never does alone), and an ROI model showing hours and dollars saved per week. You'll also know whether to roll it out internally or have our team wire the next 10 workflows.",
      otherWorkshopsHeadline: "The other workflows AI will quietly absorb.",
      faqHeadline: "AI questions, answered without the hype-cycle math.",
    },
    faq: makeCommonFaq("$197"),
  },

  /* ─────────── 6. EMAIL, CRM & AUTOMATION ─────────── */
  {
    slug: "email-crm-automation",
    priceCents: 19700,
    priceLabel: "$197",
    icon: Mail,
    title: "Automate your revenue",
    capability: "Email, CRM, and automation",
    oneLiner: "Your CRM live. Your first sequence sending.",
    subhead:
      "First-touch sales is for amateurs. Pros build the follow-up engine. In one morning we pick your CRM, map the lifecycle, write three sequences live, and fix the deliverability settings most founders don't know are quietly killing their open rates.",
    pains: [
      {
        title: "No CRM = no memory = no deal.",
        body: "Every conversation starts from zero. You forget who said what and what you owe them next. The deal doesn't die in a meeting — it dies in your inbox at 11pm.",
      },
      {
        title: "No lifecycle, no LTV.",
        body: "Customers churn because no one talked to them after the sale. Lifecycle email is the cheapest LTV lift you'll ever buy — and the one most founders never set up.",
      },
      {
        title: "Manual follow-up is a tax on your future self.",
        body: "Every hour writing a 'just circling back' email is an hour you don't spend selling. Automate the obvious so you can do the irreplaceable.",
      },
    ],
    walkOuts: [
      "CRM chosen and stood up with your pipeline built — Hubspot, Attio, or Folk — picked for your stage and team, not by hype",
      "Lifecycle map — every touch from cold lead to repeat buyer, with trigger and owner",
      "Your welcome sequence written and loaded live — nurture and win-back mapped and templated to finish this week",
      "Segmentation plan that earns higher open and reply rates without sounding spammy",
      "Automation blueprint — what fires what, in which tool, and how to debug it",
      "Deliverability records prepared — SPF, DKIM, and DMARC values ready to paste into your DNS — with the warmup plan and sender rules",
    ],
    agenda: [
      {
        time: "8:45 – 9:15",
        title: "Pick the CRM and stop debating",
        detail:
          "Input: your stage, team size, offer, current tools. Working session: score Hubspot vs Attio vs Folk against your reality. Output: a decision, with the setup tasks listed.",
      },
      {
        time: "9:15 – 10:15",
        title: "Map the lifecycle end-to-end",
        detail:
          "Input: your funnel and buyer journey. Working session: stranger → lead → buyer → repeat → advocate, with the trigger and owner at each stage. Output: a lifecycle diagram you can wire into the CRM this week.",
      },
      {
        time: "10:30 – 11:15",
        title: "Write 3 sequences — live",
        detail:
          "Input: subject-line patterns that beat 40% open rates in 2026. Working session: draft welcome, nurture, and win-back together. Output: your welcome sequence ready to send, the other two templated, and the rationale documented for future edits.",
      },
      {
        time: "11:15 – 11:30",
        title: "Wire automation and lock deliverability",
        detail:
          "Input: your domain DNS access. Working session: generate your SPF/DKIM/DMARC records, plan the warmup, document the trigger logic. Output: a deliverability scorecard and the exact records to paste into DNS.",
      },
    ],
    forYou: [
      "You're losing deals in an inbox you can't see",
      "You have a list and zero sequences running against it",
      "You're done manually writing follow-ups at 11pm",
    ],
    notForYou: [
      "You have no offer and no audience yet",
      "You believe email is dead",
      "You want spam-cannon outreach without a list strategy",
    ],
    agencyServiceTagline:
      "CRM picked and live, 3 production sequences shipped, deliverability fixed — in 3 weeks.",
    sections: {
      painEyebrow: "The cost of forgetting your pipeline",
      painHeadline: "80% of your revenue lives in touches 2 through 12 — and you've never sent them.",
      walkOutHeadline: {
        lead: "CRM live, lifecycle mapped, first sequence sending.",
        emphasis: "Not a Mailchimp tutorial.",
      },
      agendaHeadline: {
        lead: "One morning. The follow-up machine, built.",
        emphasis: "Three sequences drafted, deliverability locked.",
      },
      fitHeadline: {
        lead: "Built for founders losing deals in the inbox.",
        emphasis: "Not for spam-cannon operators.",
      },
      fitLede:
        "If you have a list and zero sequences against it, this is the highest-leverage morning you'll spend this quarter. If you don't have a list yet, build the offer first.",
      decisionHeadline: {
        lead: "Leave with the machine —",
        emphasis: "running on autopilot by Friday.",
      },
      decisionBody:
        "By 11:30 you'll have your CRM picked, a lifecycle map (stranger → repeat buyer), your welcome sequence written and loaded, the other two templated, the segmentation plan, and your SPF/DKIM/DMARC records ready to paste. You'll also know whether to wire it yourself, hire an ops contractor, or hand it to our team.",
      otherWorkshopsHeadline: "The other systems your sequences will feed.",
      faqHeadline: "Email questions, answered without the deliverability theater.",
    },
    faq: makeCommonFaq("$197"),
  },

  /* ─────────── 7. SALES SYSTEMS ─────────── */
  {
    slug: "sales-systems",
    priceCents: 19700,
    priceLabel: "$197",
    icon: TrendingUp,
    title: "Close more sales",
    capability: "Sales systems",
    oneLiner: "Walk out with a sales script that qualifies and closes.",
    subhead:
      "Founders close on hustle. Companies close on system. In one morning we build your ICP scorecard, your discovery script, your pipeline stages with exit criteria, and the weekly rhythm that makes your forecast something investors can read — not something you guess.",
    pains: [
      {
        title: "No ICP = expensive conversations with people who'll never buy.",
        body: "Without a sharp ICP, every call gets your time. Most go nowhere. Each one steals an hour from a deal that would have closed.",
      },
      {
        title: "Recording your calls says you don't 'wing it well.'",
        body: "Every founder believes they freestyle gracefully. The transcripts disagree. A written script is permission to stop reinventing the same conversation 40 times.",
      },
      {
        title: "Pipelines in your head are pipelines that leak.",
        body: "If your forecast lives in your gut, it isn't a forecast. The first investor or board meeting that asks for pipeline math will end the conversation if you can't show it.",
      },
    ],
    walkOuts: [
      "ICP scorecard — qualify a lead in 90 seconds, disqualify in 30",
      "Sales script for your #1 conversation (discovery or demo) — 25 minutes, with a clear next step",
      "Pipeline stages with exit criteria for each (what has to be true to advance)",
      "Objection bank — your 8 most common objections, with handlers written and rehearsed out loud in the room",
      "Weekly sales rhythm — pipeline review, forecast call, accountability, in 30 minutes",
      "Tool stack recommendation — CRM, dialer, scheduler — with cost math and switching cost",
    ],
    agenda: [
      {
        time: "8:45 – 9:15",
        title: "Define the ICP that buys fastest",
        detail:
          "Input: your last 20 deals (won and lost). Working session: score buyer types by speed-to-close, LTV, and effort. Output: an ICP scorecard you can run any inbound through in 90 seconds.",
      },
      {
        time: "9:15 – 10:15",
        title: "Build the discovery script",
        detail:
          "Input: the 12 questions that diagnose, not interrogate. Working session: draft your script live, role-play it twice, cut everything that doesn't earn its slot. Output: a 25-minute discovery you can run on Monday.",
      },
      {
        time: "10:30 – 11:15",
        title: "Set pipeline stages and pre-write the top 8 objections",
        detail:
          "Input: your CRM and current stages (or lack of them). Working session: define stages with exit criteria, pre-write handlers for your 8 most common objections. Output: a pipeline you can forecast against.",
      },
      {
        time: "11:15 – 11:30",
        title: "Lock the weekly rhythm",
        detail:
          "Input: your real calendar. Working session: set the day, time, and 30-minute agenda for your pipeline review. Output: the recurring meeting that prevents 90% of forecast misses.",
      },
    ],
    forYou: [
      "You're selling and can't explain why deals close (or don't)",
      "You need a forecast you can show investors or a board",
      "You're hiring your first salesperson and need a motion they can run",
    ],
    notForYou: [
      "You haven't talked to a paying customer yet",
      "You believe sales is purely art, never science",
      "You want a magic close line",
    ],
    agencyServiceTagline:
      "ICP, script, pipeline in your CRM, and a 30-day handoff so your team runs it without you.",
    sections: {
      painEyebrow: "The cost of closing on vibes",
      painHeadline: "Every deal closed on mood is a deal you can't repeat, hire, or forecast.",
      walkOutHeadline: {
        lead: "ICP scorecard, script, pipeline, objection bank.",
        emphasis: "Not a motivational pep talk.",
      },
      agendaHeadline: {
        lead: "One morning. The sales motion, written down.",
        emphasis: "Stages, exit criteria, weekly rhythm — locked.",
      },
      fitHeadline: {
        lead: "Built for founders who'll record their calls.",
        emphasis: "Not for natural-born-closers.",
      },
      fitLede:
        "If you believe sales is pure art, this morning will offend you. If you want a forecast you can defend in a board meeting, sit down.",
      decisionHeadline: {
        lead: "Leave with a motion —",
        emphasis: "your next hire can actually run.",
      },
      decisionBody:
        "By 11:30 you'll have an ICP scorecard, a 25-minute discovery script, pipeline stages with exit criteria, the 8-objection handler bank, and the 30-minute weekly rhythm that prevents 90% of forecast misses. You'll also know whether to run it solo, train your first AE, or hand the whole motion to our team.",
      otherWorkshopsHeadline: "The other systems that feed your pipeline.",
      faqHeadline: "Sales questions, answered without the closer's bravado.",
    },
    faq: makeCommonFaq("$197"),
  },

  /* ─────────── 8. LEGAL, FINANCIAL & OPS ─────────── */
  {
    slug: "legal-financial-ops",
    priceCents: 19700,
    priceLabel: "$197",
    icon: Scale,
    title: "Scaffold your startup",
    capability: "Legal, financial, and operational scaffolding",
    oneLiner: "Entity. Contracts. Books. Settled.",
    subhead:
      "Founders skip the scaffolding until a customer, a bank, or an investor asks — and then it's a five-figure scramble and a deal you almost lost. In one morning we settle the entity question, lock the contract suite, set up the books, and hand you the operations calendar that keeps you out of trouble.",
    pains: [
      {
        title: "Wrong entity is a six-figure tax mistake on a 5-year delay.",
        body: "LLC vs S-corp vs C-corp isn't paperwork — it's the structural decision that determines your tax bill, your funding options, and your exit. Picking wrong now costs you every year you operate.",
      },
      {
        title: "No contracts = no leverage when the dispute starts.",
        body: "Handshake deals look fine until they're not. A 4-page services agreement saves a 4-month lawsuit and a relationship you didn't need to lose.",
      },
      {
        title: "Messy books = no funding, no loan, no exit.",
        body: "When a bank, investor, or acquirer asks for financials, you have 5 business days. Without a clean monthly close, the conversation ends in the request email.",
      },
    ],
    walkOuts: [
      "Entity comparison in writing — LLC, S-corp, C-corp against your real numbers — with the questions to confirm with your CPA",
      "Contract suite checklist: MSA, NDA, IP assignment, contractor agreement, terms of service",
      "Bookkeeping setup plan: tool (QuickBooks or Xero), chart of accounts, monthly close rhythm",
      "Payroll + contractor readiness — when to switch from 1099 to W-2 and the trigger criteria",
      "Insurance + compliance shortlist for your industry (GL, E&O, cyber, workers' comp) — what to quote and who to call",
      "12-month operations calendar — every filing, renewal, and tax deadline, with owner",
    ],
    agenda: [
      {
        time: "8:45 – 9:15",
        title: "Settle the entity question — comparison done in one session",
        detail:
          "Input: your real numbers, state, partners, and 3-year revenue plan. Working session: run the LLC/S-corp/C-corp decision tree with your numbers. Output: a written entity comparison with the math behind it, and the short list to confirm with your CPA.",
      },
      {
        time: "9:15 – 10:15",
        title: "Lock the contracts that actually protect you",
        detail:
          "Input: 5 contract frameworks every business needs. Working session: walk through clause-by-clause, mark the ones to adapt, flag the ones founders skip and regret. Output: a contract suite checklist with your specific edits noted.",
      },
      {
        time: "10:30 – 11:15",
        title: "Set up books, payroll, and insurance",
        detail:
          "Input: your bank account, current tools, team structure. Working session: pick the bookkeeping stack, decide payroll cadence, identify the 2 insurance lines you can't operate without. Output: a setup plan with vendors and costs.",
      },
      {
        time: "11:15 – 11:30",
        title: "Build the 12-month operations calendar",
        detail:
          "Input: your state's filing schedule, your fiscal year. Working session: map every recurring deadline (taxes, renewals, filings, insurance). Output: a dated calendar with owners — automated reminders where possible.",
      },
    ],
    forYou: [
      "You've been operating on a Stripe account and good intentions",
      "You're hiring your first employee or contractor",
      "You're raising money or applying for a bank loan in the next 12 months",
    ],
    notForYou: [
      "You want legal advice for a lawsuit in progress (call a lawyer)",
      "You're not ready to commit to a business entity yet",
      "You're hoping to skip taxes",
    ],
    agencyServiceTagline:
      "LLC, EIN, contracts, books, invoicing, insurance checklist — done in 10 business days.",
    sections: {
      painEyebrow: "The cost of an un-bankable business",
      painHeadline:
        "Skip this and the bank, the investor, and the acquirer all say the same word: no.",
      walkOutHeadline: {
        lead: "Entity, contracts, books, calendar.",
        emphasis: "Not a stack of PDFs to read later.",
      },
      agendaHeadline: {
        lead: "One morning. The scaffolding decided.",
        emphasis: "Entity, contracts, books, ops calendar.",
      },
      fitHeadline: {
        lead: "Built for founders ready to be bankable.",
        emphasis: "Not for procrastinators of paperwork.",
      },
      fitLede:
        "The boring stuff is boring until a customer, bank, or investor asks. Then it's a five-figure scramble. This morning is the cheap version.",
      decisionHeadline: {
        lead: "Leave with the scaffolding —",
        emphasis: "and a 12-month calendar that protects it.",
      },
      decisionBody:
        "By 11:30 you'll have your entity comparison in writing (with the math), a contract suite checklist, the bookkeeping stack and monthly close rhythm, an insurance shortlist for your industry, and a 12-month operations calendar with every filing assigned. You'll also know whether to set it up yourself, hire a fractional ops lead, or hand it to our team in 10 business days. We build the operating setup — we're not your attorney or CPA.",
      otherWorkshopsHeadline: "The other systems your scaffolding will support.",
      faqHeadline: "Legal and ops questions, answered without the lawyer hedge.",
    },
    faq: makeCommonFaq("$197"),
  },
];

export function getBuildWorkshop(slug: string): BuildWorkshop | undefined {
  return BUILD_WORKSHOPS.find((w) => w.slug === slug);
}

/**
 * Resolve the "Have us build it" offer for a workshop by reading the
 * matching AGENCY_SERVICES entry. Single source of truth for service
 * name, retail price, and CTA href.
 */
export function getWorkshopAgencyOffer(slug: string):
  | {
      name: string;
      tagline: string;
      priceLabel: string;
      href: string;
    }
  | undefined {
  const w = getBuildWorkshop(slug);
  if (!w) return undefined;
  const svc = AGENCY_SERVICES.find((s) => s.slug === slug);
  if (!svc) return undefined;
  return {
    name: `Done-for-you: ${svc.capability}`,
    tagline: w.agencyServiceTagline,
    priceLabel: svc.priceLabel,
    href: svc.ctaHref,
  };
}

// Dev-mode drift guard: every workshop has a matching agency service,
// the workshop tier matches what workshopPriceForRetailCents() would pick
// from the retail price label, AND no two workshops ship identical frame
// copy (painHeadline or decisionBody).
if (import.meta.env?.DEV) {
  const seenPain = new Map<string, string>();
  const seenDecision = new Map<string, string>();
  for (const w of BUILD_WORKSHOPS) {
    const svc = AGENCY_SERVICES.find((s) => s.slug === w.slug);
    if (!svc) {
      // eslint-disable-next-line no-console
      console.warn(`[build-workshops] no AGENCY_SERVICES entry for slug "${w.slug}"`);
    } else {
      const m = svc.priceLabel.match(/\$([\d,]+)/);
      if (m) {
        const retailCents = Number(m[1].replace(/,/g, "")) * 100;
        const expected = workshopPriceForRetailCents(retailCents);
        if (expected.cents !== w.priceCents) {
          // eslint-disable-next-line no-console
          console.warn(
            `[build-workshops] tier drift for "${w.slug}": retail ${svc.priceLabel} → expected ${expected.label}, got ${w.priceLabel}`,
          );
        }
      }
    }

    const prevPain = seenPain.get(w.sections.painHeadline);
    if (prevPain) {
      // eslint-disable-next-line no-console
      console.warn(
        `[build-workshops] duplicate painHeadline: "${w.slug}" matches "${prevPain}"`,
      );
    } else {
      seenPain.set(w.sections.painHeadline, w.slug);
    }

    const prevDecision = seenDecision.get(w.sections.decisionBody);
    if (prevDecision) {
      // eslint-disable-next-line no-console
      console.warn(
        `[build-workshops] duplicate decisionBody: "${w.slug}" matches "${prevDecision}"`,
      );
    } else {
      seenDecision.set(w.sections.decisionBody, w.slug);
    }
  }
}
