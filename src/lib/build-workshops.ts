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

export type AgendaBlock = { time: string; title: string; detail: string };
export type FAQ = { q: string; a: string };

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
  agencyService: {
    name: string;
    tagline: string;
    priceLabel: string;
    href: string;
  };
  faq: FAQ[];
};

/** Map agency retail price (in cents) to the matching workshop price tier. */
export function workshopPriceForRetailCents(retailCents: number): {
  cents: number;
  label: string;
} {
  if (retailCents < 200_000) return { cents: 19_700, label: "$197" };
  if (retailCents < 300_000) return { cents: 29_700, label: "$297" };
  return { cents: 39_700, label: "$397" };
}

function makeCommonFaq(priceLabel: string): FAQ[] {
  return [
    {
      q: `What's actually included for ${priceLabel}?`,
      a: "The strategy, the exact tool stack we use, and the step-by-step process to ship it yourself — delivered in a live half-day workshop. Plus every template and worksheet, a recording you keep forever, and 30 days of follow-up access in our group channel as you implement.",
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
      a: `Yes. The workshop is built to let you ship it yourself — strategy, templates, tool stack, the whole playbook. If you'd rather hand it to us, the ${priceLabel} credits toward any engagement over $1,000.`,
    },
  ];
}

export const BUILD_WORKSHOPS: BuildWorkshop[] = [
  {
    slug: "brand-identity",
    priceCents: 29700,
    priceLabel: "$297",
    icon: Palette,
    title: "Brand Identity Workshop",
    capability: "Brand identity",
    oneLiner: "Walk in with a name. Walk out with a brand people pay a premium for.",
    subhead:
      "Logos are easy. A brand that earns trust in the first three seconds — before a single word is read — is a system. We build the system with you in one morning.",
    pains: [
      {
        title: "A wrong-headed brand is a $20K mistake on a 12-month delay.",
        body: "Founders pick a logo, slap it on a deck, and find out a year in that the brand contradicts what they actually sell. Then they pay to redo every asset.",
      },
      {
        title: "Premium pricing requires premium perception.",
        body: "If your brand looks like a freelancer made it on Fiverr, you'll get freelancer-tier prices. The market reads visual fluency as competence — fair or not.",
      },
      {
        title: "AI generators don't replace a brand system.",
        body: "They give you outputs. A brand system is the rules that make every future output consistent. Without it, every new asset looks like it's from a different company.",
      },
    ],
    walkOuts: [
      "Signed brand brief — what you stand for, who you stand against, how you sound",
      "Brand archetype + voice guide your team and any AI can follow",
      "Logo direction (3 concepts) with the rationale behind each",
      "Color palette and typography system with usage rules",
      "Mood board + visual reference library for designers to inherit",
      "First-90-day brand rollout plan across your most visible surfaces",
    ],
    agenda: [
      {
        time: "8:45 – 9:15",
        title: "Positioning lock",
        detail:
          "Before pixels: nail the one sentence your brand is allowed to mean. Without this, every design decision is a coin flip.",
      },
      {
        time: "9:15 – 10:15",
        title: "Voice, archetype, and verbal identity",
        detail:
          "Pick the archetype your buyer is already shopping for. Build a voice guide so your copy, emails, and AI prompts all sound like one company.",
      },
      {
        time: "10:30 – 11:15",
        title: "Visual system — logo, color, type",
        detail:
          "Three logo directions. A color and typography system with usage rules. Live critique against your real competitors.",
      },
      {
        time: "11:15 – 11:30",
        title: "Rollout decision",
        detail:
          "Map your top 10 visible surfaces. Decide what gets the new system first, what waits, and what gets retired.",
      },
    ],
    forYou: [
      "You've validated the idea and are about to invest in a website, deck, or product packaging",
      "Your current brand was made fast and now feels like a ceiling on pricing",
      "You're tired of every new asset looking like it came from a different company",
    ],
    notForYou: [
      "You haven't decided what you're selling or who it's for",
      "You want a $300 logo and call it a day",
      "You're hoping to debate font weights for six hours",
    ],
    agencyService: {
      name: "Brand & Website Build",
      tagline: "Logo, identity system, and a real website — delivered live in 2 weeks.",
      priceLabel: "From $2,900",
      href: "/contact?service=brand-website",
    },
    faq: makeCommonFaq("$297"),
  },
  {
    slug: "website-that-converts",
    priceCents: 39700,
    priceLabel: "$397",
    icon: Globe,
    title: "Website That Converts Workshop",
    capability: "A website that converts",
    oneLiner: "Stop building a brochure. Build a revenue surface.",
    subhead:
      "Most founder websites are digital pamphlets. Yours will be a conversion engine — wired to payments, analytics, and a clear next action on every page.",
    pains: [
      {
        title: "Pretty sites don't pay rent. Converting sites do.",
        body: "A site that looks great but converts at 0.4% is a $30K liability. A plain site that converts at 4% prints money. The difference is structure, not aesthetics.",
      },
      {
        title: "No ICP, no conversion.",
        body: "If your homepage doesn't make your ideal buyer feel seen in the first five seconds, paid traffic to it is expensive noise.",
      },
      {
        title: "Every undefined conversion event is a leak.",
        body: "Most founders can't tell you what counts as a 'win' on their site. The analytics show traffic but no story. You can't optimize what you can't see.",
      },
    ],
    walkOuts: [
      "Sitemap and page-by-page purpose map (every page earns its keep)",
      "Wireframe for your homepage and #1 conversion page",
      "Page-by-page copy outline with hero, proof, offer, and CTA",
      "Conversion event plan wired to GA4 + your CRM",
      "Tech stack decision (no-code vs custom) with cost projections",
      "Pre-launch QA checklist so the site ships without embarrassing leaks",
    ],
    agenda: [
      {
        time: "8:45 – 9:15",
        title: "The one-job rule",
        detail:
          "Decide the single action your site exists to drive. Everything else is in service of that.",
      },
      {
        time: "9:15 – 10:15",
        title: "Sitemap + wireframe your top two pages",
        detail:
          "Live wireframing of homepage and #1 conversion page using the proof-stack framework. No design polish — structure first.",
      },
      {
        time: "10:30 – 11:15",
        title: "Copy that sells, not describes",
        detail:
          "Write the hero, the offer, and the close for both pages using buyer-language we pull from your real customers (or competitor reviews if you're pre-launch).",
      },
      {
        time: "11:15 – 11:30",
        title: "Wire the conversion plumbing",
        detail:
          "Map events, integrations, and the stack. Decide build vs buy with real numbers.",
      },
    ],
    forYou: [
      "You're about to commission a site and don't want $15K of regret",
      "Your current site looks fine but converts like a brick",
      "You're spending on ads to a homepage you can't defend",
    ],
    notForYou: [
      "You want a portfolio site for vibes",
      "You haven't picked the offer you're selling",
      "You believe more sections will fix conversion",
    ],
    agencyService: {
      name: "Brand & Website Build",
      tagline: "Site, copy, payments, and analytics — shipped live in 2 weeks.",
      priceLabel: "From $2,900",
      href: "/contact?service=brand-website",
    },
    faq: makeCommonFaq("$397"),
  },
  {
    slug: "social-presence",
    priceCents: 19700,
    priceLabel: "$197",
    icon: Share2,
    title: "Social Presence Workshop",
    capability: "Social presence",
    oneLiner: "Pick the two channels your buyers actually live on. Own them.",
    subhead:
      "Stop posting everywhere and being invisible. We'll choose two channels with surgical fit, rebuild your profiles to convert, and ship a 30-day calendar live in the room.",
    pains: [
      {
        title: "Posting on six platforms means dominating zero.",
        body: "Distribution compounds when you concentrate. Spreading thin guarantees you'll quit in 90 days with nothing to show for it.",
      },
      {
        title: "Your profile is a landing page in disguise.",
        body: "If your bio doesn't make a stranger want to click in 1.5 seconds, the algorithm penalizes you and you blame 'reach.'",
      },
      {
        title: "No cadence, no compounding.",
        body: "Algorithmic platforms reward reliable shipping. Random posting is the same as silence.",
      },
    ],
    walkOuts: [
      "Channel-fit scorecard — the two channels you commit to (and the four you stop)",
      "Profile rewrites for the chosen channels (bio, links, banners)",
      "30-day content calendar built live, by topic and format",
      "Hook bank of 30+ proven openers for your niche",
      "Posting cadence + the lightest tool stack to maintain it",
      "Engagement playbook — what to comment, where, and to whom",
    ],
    agenda: [
      {
        time: "8:45 – 9:15",
        title: "Channel fit, not channel hype",
        detail:
          "Score every major channel against your buyer, offer, and bandwidth. Commit to two. Walk away from the rest.",
      },
      {
        time: "9:15 – 10:00",
        title: "Rebuild your profile to convert",
        detail:
          "Bio formula, link strategy, banner, and pinned content. Critiqued live.",
      },
      {
        time: "10:15 – 11:15",
        title: "30-day calendar, built in the room",
        detail:
          "Pillars, formats, hooks. Real posts drafted, not 'ideas.'",
      },
      {
        time: "11:15 – 11:30",
        title: "Cadence and stack",
        detail: "Schedule, scheduling tool, and the minimum-effort weekly rhythm you'll actually keep.",
      },
    ],
    forYou: [
      "You're tired of posting into the void",
      "You want a calendar instead of daily anxiety about what to post",
      "You're ready to be visible to the right 1,000 people, not invisible to a million",
    ],
    notForYou: [
      "You want to chase viral hits",
      "You haven't decided what you sell",
      "You expect followers without shipping",
    ],
    agencyService: {
      name: "Marketing Engine",
      tagline: "Posts, videos, and outreach delivered monthly — on autopilot.",
      priceLabel: "From $2,100/mo",
      href: "/contact?service=marketing-engine",
    },
    faq: makeCommonFaq("$197"),
  },
  {
    slug: "content-engine",
    priceCents: 29700,
    priceLabel: "$297",
    icon: PenTool,
    title: "Content Engine Workshop",
    capability: "A content engine",
    oneLiner: "Build the compounding asset that makes paid traffic optional.",
    subhead:
      "Content done right is the only marketing line item that gets cheaper every month. We'll architect the engine — pillars, SEO, production flow, and repurposing — so it ships without grinding you to dust.",
    pains: [
      {
        title: "Random posts compound to nothing.",
        body: "Without pillars and an SEO map, you produce a year of content and rank for zero things you sell.",
      },
      {
        title: "Founders are the bottleneck.",
        body: "If 'content' lives in your head and your calendar, it dies the first week things get busy. Engines outlive moods.",
      },
      {
        title: "One asset, one use, is rookie math.",
        body: "A real engine produces one anchor and ten derivatives — across blog, social, email, and video — from the same source.",
      },
    ],
    walkOuts: [
      "3–5 pillar topics tied to your offer and buyer intent",
      "SEO keyword map — what you can realistically rank for in 6 months",
      "Content production system (capture, draft, edit, ship)",
      "Repurposing flow — one anchor piece into 10 derivative assets",
      "90-day editorial calendar, ready to execute",
      "Measurement plan — the 3 metrics that prove it's working",
    ],
    agenda: [
      {
        time: "8:45 – 9:15",
        title: "Pillars and offer alignment",
        detail:
          "Pick the pillars that lead to a buying decision, not the ones that just get clicks.",
      },
      {
        time: "9:15 – 10:15",
        title: "Keyword map + topical authority plan",
        detail:
          "Find the keywords you can win. Cluster them into a publishing roadmap.",
      },
      {
        time: "10:30 – 11:15",
        title: "Production system + repurposing flow",
        detail:
          "Design the assembly line. Decide who does what, when, and with which tools.",
      },
      {
        time: "11:15 – 11:30",
        title: "90 days, mapped",
        detail: "Lock the first 90 days of titles, formats, and ship dates.",
      },
    ],
    forYou: [
      "You're paying for ads and want to lower the cost of being known",
      "You've published sporadically and have nothing to show for it",
      "You want a system your team can run without you",
    ],
    notForYou: [
      "You want overnight traffic",
      "You're unwilling to publish for 6 months before SEO compounds",
      "You think AI can produce content with zero editing",
    ],
    agencyService: {
      name: "Marketing Engine",
      tagline: "We run your content engine — pillars, SEO, video, distribution.",
      priceLabel: "From $2,100/mo",
      href: "/contact?service=marketing-engine",
    },
    faq: makeCommonFaq("$297"),
  },
  {
    slug: "ai-operating-system",
    priceCents: 39700,
    priceLabel: "$397",
    icon: Sparkles,
    title: "AI as Your Operating System Workshop",
    capability: "AI as your operating system",
    oneLiner: "Two people doing the work of ten. That's the bar in 2026.",
    subhead:
      "AI isn't a feature — it's an operating system. We'll audit your workflows, automate five of them live, and hand you a prompt library and governance plan so the leverage compounds.",
    pains: [
      {
        title: "AI amplifies whatever it's pointed at.",
        body: "Point it at a fuzzy strategy and you scale the fuzz. Point it at sharp inputs and it scales you. Most founders are doing the former and calling it 'using AI.'",
      },
      {
        title: "Tools without workflows are toys.",
        body: "Buying ChatGPT seats doesn't transform a company. Mapping which decisions and outputs AI owns, end-to-end, does.",
      },
      {
        title: "No governance, no scale.",
        body: "Without prompt standards, model choices, and quality gates, AI output is inconsistent — and inconsistency at scale is a brand problem.",
      },
    ],
    walkOuts: [
      "AI stack audit — what to keep, kill, and add (with cost math)",
      "5 of your real workflows automated live in the room",
      "Prompt library tuned to your brand voice and offer",
      "Governance doc — model choice, quality gates, what AI never touches",
      "ROI model — hours saved per week, per workflow",
      "30-day rollout plan to onboard your team without revolt",
    ],
    agenda: [
      {
        time: "8:45 – 9:15",
        title: "Workflow audit",
        detail: "Map your top 15 workflows. Score them for AI leverage. Pick 5 to attack today.",
      },
      {
        time: "9:15 – 10:30",
        title: "Automate 5 workflows live",
        detail:
          "Working tools, real outputs, your data. Not slideware.",
      },
      {
        time: "10:45 – 11:15",
        title: "Prompt library + governance",
        detail:
          "Build the prompt vault. Set the quality gates. Decide what AI is never allowed to do alone.",
      },
      {
        time: "11:15 – 11:30",
        title: "Rollout plan",
        detail: "Sequence, owner, training, and the metric that proves it worked.",
      },
    ],
    forYou: [
      "You're a small team trying to operate like a big one",
      "You've bought AI tools that nobody actually uses",
      "You're ready to compete on speed, not headcount",
    ],
    notForYou: [
      "You want a generic 'intro to ChatGPT' session",
      "You expect AI to run your business with no humans in the loop",
      "You haven't picked the offer yet — automate strategy first, then workflows",
    ],
    agencyService: {
      name: "AI Ops Sprint",
      tagline: "We embed for 30 days and rewire 10 workflows around AI — with documentation.",
      priceLabel: "From $4,500",
      href: "/contact?service=ai-ops-sprint",
    },
    faq: makeCommonFaq("$397"),
  },
  {
    slug: "email-crm-automation",
    priceCents: 39700,
    priceLabel: "$397",
    icon: Mail,
    title: "Email, CRM & Automation Workshop",
    capability: "Email, CRM, and automation",
    oneLiner: "Most revenue lives in the second, fifth, and twelfth touch. Build the machine that delivers them.",
    subhead:
      "First-touch sales is for amateurs. Pros build the follow-up engine — segmented, automated, and on brand — that turns one-time interest into compounding revenue.",
    pains: [
      {
        title: "No CRM = no memory.",
        body: "Every conversation starts from zero. You forget who said what, when, and what to do next. The deal dies in your inbox.",
      },
      {
        title: "No lifecycle, no LTV.",
        body: "Customers leave because no one talked to them after the sale. Email lifecycle is the cheapest LTV lift you'll ever buy.",
      },
      {
        title: "Manual follow-up is a tax on your future self.",
        body: "Every hour you spend writing a follow-up email is an hour you don't spend selling. Automate the obvious so you can do the irreplaceable.",
      },
    ],
    walkOuts: [
      "CRM choice and setup blueprint (Hubspot, Attio, Folk — picked for you)",
      "Lifecycle map — every touch from cold lead to repeat buyer",
      "3 sequences written live (welcome, nurture, win-back)",
      "Segmentation plan that earns higher open and reply rates",
      "Automation blueprint — what triggers what, in which tool",
      "Deliverability checklist so your sequences hit the inbox",
    ],
    agenda: [
      {
        time: "8:45 – 9:15",
        title: "Pick the CRM and stop debating",
        detail:
          "We'll match the right CRM to your stage, team, and offer — and end the analysis paralysis.",
      },
      {
        time: "9:15 – 10:15",
        title: "Map the lifecycle",
        detail:
          "Stranger → lead → buyer → repeat → advocate. Every stage gets a touch, a trigger, and an owner.",
      },
      {
        time: "10:30 – 11:15",
        title: "Write 3 sequences live",
        detail:
          "Welcome, nurture, win-back. Drafts done in the room, with subject lines you can ship.",
      },
      {
        time: "11:15 – 11:30",
        title: "Automation + deliverability",
        detail: "Wire the triggers. Set up SPF/DKIM. Avoid the spam folder.",
      },
    ],
    forYou: [
      "You're losing deals in the inbox you can't see",
      "You have a list but no sequences running against it",
      "You want to stop manually writing follow-ups at 11 PM",
    ],
    notForYou: [
      "You have no offer and no audience yet",
      "You believe email is dead",
      "You want spam-cannon outreach without a list strategy",
    ],
    agencyService: {
      name: "Marketing Engine",
      tagline: "We set up the CRM, write the sequences, and run them monthly.",
      priceLabel: "From $2,100/mo",
      href: "/contact?service=marketing-engine",
    },
    faq: makeCommonFaq("$397"),
  },
  {
    slug: "sales-systems",
    priceCents: 39700,
    priceLabel: "$397",
    icon: TrendingUp,
    title: "Sales Systems Workshop",
    capability: "Sales systems",
    oneLiner: "A repeatable path from interested stranger to closed deal — written down, not vibed.",
    subhead:
      "Founders close on hustle. Companies close on system. We'll build your ICP, script, pipeline, and weekly sales rhythm so the next deal doesn't depend on how you feel that day.",
    pains: [
      {
        title: "No ICP = expensive conversations.",
        body: "Without a sharp ICP, you take every call. Most go nowhere. Each one steals time from a deal that would have closed.",
      },
      {
        title: "No script, no consistency.",
        body: "Every founder thinks they 'wing it well.' Recording your calls says otherwise. A script is permission to stop reinventing the same conversation.",
      },
      {
        title: "Pipelines in your head are pipelines that leak.",
        body: "If your forecast lives in your gut, it isn't a forecast. Investors and operators ask for pipeline math. Build the math.",
      },
    ],
    walkOuts: [
      "ICP scorecard — qualify in 90 seconds, disqualify faster",
      "Sales script for your top conversation (discovery or demo)",
      "Pipeline stages with exit criteria for each",
      "Objection bank — your 8 most common, with handlers that close",
      "Weekly sales rhythm — pipeline review, forecasting, accountability",
      "Tool stack recommendation — CRM, dialer, scheduler",
    ],
    agenda: [
      {
        time: "8:45 – 9:15",
        title: "Define the ICP that buys fastest",
        detail:
          "Stop selling to anyone with a pulse. Score and rank your buyer types by speed-to-close and LTV.",
      },
      {
        time: "9:15 – 10:15",
        title: "Build the discovery script",
        detail:
          "Questions that diagnose, not interrogate. A script you can run in 25 minutes that ends with a clear next step.",
      },
      {
        time: "10:30 – 11:15",
        title: "Pipeline, stages, and objection bank",
        detail:
          "Set up the pipeline in your CRM. Define exit criteria. Pre-write the top 8 objections so they never catch you off guard.",
      },
      {
        time: "11:15 – 11:30",
        title: "Weekly rhythm",
        detail: "The 30-minute pipeline review that prevents 90% of forecast misses.",
      },
    ],
    forYou: [
      "You're selling but can't explain why deals close (or don't)",
      "You want a forecast you can show investors",
      "You're hiring a first salesperson and need a repeatable motion",
    ],
    notForYou: [
      "You haven't talked to a paying customer yet",
      "You believe sales is purely art, never science",
      "You want a magic close line",
    ],
    agencyService: {
      name: "Sales System Sprint",
      tagline: "We build the script, pipeline, and 30-day handoff so your team runs it without you.",
      priceLabel: "From $3,800",
      href: "/contact?service=sales-system-sprint",
    },
    faq: makeCommonFaq("$397"),
  },
  {
    slug: "legal-financial-ops",
    priceCents: 19700,
    priceLabel: "$197",
    icon: Scale,
    title: "Legal, Financial & Operational Scaffolding Workshop",
    capability: "Legal, financial, and operational scaffolding",
    oneLiner: "The boring stuff that keeps you legal, bankable, and impossible to embarrass.",
    subhead:
      "Entity, contracts, books, payroll, insurance. Founders skip it until a customer, a bank, or an investor asks — and then it's a five-figure scramble. We'll set the scaffolding in one morning.",
    pains: [
      {
        title: "Wrong entity = wrong tax bill.",
        body: "LLC vs S-corp vs C-corp is a six-figure decision in disguise. Picking wrong now costs you for every year you operate.",
      },
      {
        title: "No contracts = no leverage.",
        body: "Handshake deals die in disputes. A 4-page services agreement saves a 4-month lawsuit.",
      },
      {
        title: "Messy books = no funding, no exit.",
        body: "When a bank, investor, or buyer asks for financials, you have 5 business days. Without clean books, the conversation ends there.",
      },
    ],
    walkOuts: [
      "Entity decision — LLC / S-corp / C-corp with rationale",
      "Contract checklist — services, NDAs, IP assignment, contractor agreements",
      "Bookkeeping setup plan — tool, chart of accounts, monthly close rhythm",
      "Payroll + contractor readiness — when to switch and how",
      "Insurance + compliance checklist for your industry",
      "Operations calendar — the 12 things you must do every month, on time",
    ],
    agenda: [
      {
        time: "8:45 – 9:15",
        title: "Entity decision — done in one session",
        detail:
          "We'll walk you through the LLC/S-corp/C-corp choice using your real numbers and 3-year plan.",
      },
      {
        time: "9:15 – 10:15",
        title: "Contracts that actually protect you",
        detail:
          "The 5 contracts every business needs. Templates you can adapt, with the clauses founders skip and regret.",
      },
      {
        time: "10:30 – 11:15",
        title: "Books, payroll, and insurance",
        detail:
          "Pick the bookkeeping stack. Decide payroll cadence. Identify the 2 insurance lines you can't operate without.",
      },
      {
        time: "11:15 – 11:30",
        title: "Operations calendar",
        detail: "The 12 monthly tasks that keep you out of trouble — automated where possible.",
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
    agencyService: {
      name: "Launch Kit",
      tagline: "LLC, EIN, contracts, bookkeeping, bank account — done for you.",
      priceLabel: "From $1,200",
      href: "/contact?service=launch-kit",
    },
    faq: makeCommonFaq("$197"),
  },
];

export function getBuildWorkshop(slug: string): BuildWorkshop | undefined {
  return BUILD_WORKSHOPS.find((w) => w.slug === slug);
}
