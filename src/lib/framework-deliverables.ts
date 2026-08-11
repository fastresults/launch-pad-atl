import {
  FileText,
  Eye,
  AlertCircle,
  Sparkles,
  BarChart3,
  Users,
  Crosshair,
  Rocket,
  MessageSquare,
  Map,
  Settings,
  Handshake,
  Megaphone,
  LineChart,
  Calculator,
  Banknote,
  ClipboardList,
  Presentation,
  Scale,
  ShieldAlert,
  Landmark,
  Compass,
  MessageCircle,
  Palette,
  Mic,
  BookOpen,
  Globe,
  Share2,
  Layers,
  CalendarDays,
  PartyPopper,
  Heart,
  Star,
  Target,
  PenTool,
  TrendingUp,
  Zap,
  Mail,
  CalendarClock,
  ListChecks,
  Beaker,
  Package,
  LifeBuoy,
  CreditCard,
  Building2,
  Tag,
  FileCheck,
  Umbrella,
  FileSignature,
  AtSign,
  Activity,
  MousePointerClick,
  MessageSquareQuote,
  Send,
  type LucideIcon,
} from "lucide-react";



export const WORKSHOP_PRICE_CENTS = 29700;
export const WORKSHOP_PRICE_LABEL = "$297";

// Product copy source-of-truth. Use these constants for user-facing strings
// so the app never drifts on asset counts or sprint naming again.
export const TOTAL_ASSETS_LABEL = "60+";
export const SPRINT_LABEL = "14-Day Sprint";
export const SPRINT_METHOD_LABEL = "14-Day Pivot Method";

export type FrameworkDeliverable = {
  icon: LucideIcon;
  title: string;
  description?: string;
  tooltip: string;
};

export type FrameworkStage = {
  number: string;
  name: string;
  intro: string;
  items: FrameworkDeliverable[];
  bonus?: boolean;
  benefit?: string;
};

// Mirrors the live `venture_document_types` table (active = true, ordered by
// sort_order) so the homepage and the founder dashboard show an identical
// framework. Deliverable titles match the DB `name` column verbatim.
export const FRAMEWORK_STAGES: FrameworkStage[] = [
  {
    number: "01",
    name: "Foundation",
    intro: "The bedrock every defensible startup is built on.",
    benefit: "Leave with the one-page story of your startup — vision, problem, and value prop tight enough that customers buy, partners lean in, and hires say yes.",
    items: [
      { icon: FileText, title: "Your one-page story", tooltip: "A one-page snapshot of your startup — what you do, who it's for, how you make money, and why now. Hand it to a banker, partner, or future hire and they'll understand the business in 60 seconds flat." },
      { icon: Eye, title: "What you stand for", tooltip: "The north-star statement that keeps every decision pointed the same direction. You'll stop chasing every shiny idea, say no faster, and rally future teammates and customers around a story they actually want to be part of." },
      { icon: AlertCircle, title: "The problem you solve", tooltip: "A crisp account of the painful problem you solve and exactly how your offer removes it. You'll talk about your business in plain language that makes customers nod, buy faster, and tell their friends without you scripting it." },
      { icon: Sparkles, title: "Why customers pick you", tooltip: "The single sentence that explains why a customer should pick you over every alternative — including doing nothing. Drop it on your website, in your pitch, on your business card, and watch conversion and referrals climb immediately." },
      { icon: CalendarClock, title: "Your day-by-day launch plan", tooltip: "The dated, day-by-day sprint that sequences every other asset into fourteen blocks — owner, output, and 'done' for each. You'll stop wondering what to do tomorrow morning and start every day of the launch knowing exactly which move ships revenue." },
      { icon: Sparkles, title: "Your operating tool stack, picked for you", tooltip: "Your named tool stack — the exact tools for your site, CRM, calendar, email, books, analytics, support, ads, and reviews. You'll stop wasting the first week comparing SaaS and start Day 2 already knowing which links to open." },
      { icon: MessageSquare, title: "25 ready-to-use AI prompts", tooltip: "Twenty-five copy-paste prompts tuned to your venture — cold email, ad hook, weekly recap, competitor scan, invoice draft, refund reply. You'll stop writing prompts from scratch and start reusing what actually works, every week." },
      { icon: Activity, title: "Your weekly rhythm", tooltip: "Your weekly rhythm — Monday plan, daily 10-min AI standup, Friday retro, and a KPI dashboard with metrics named and their sources. You'll stop drifting after the sprint ends and start running the business on the numbers." },
    ],
  },
  {
    number: "02",
    name: "Strategy",
    intro: "How you win — and how you compound the lead.",
    benefit: "Walk out knowing exactly who you sell to, how you beat the alternatives, and the ninety-day plan that turns the strategy into first paying customers.",
    items: [
      { icon: BarChart3, title: "How big the opportunity is", tooltip: "A grounded read of how big the opportunity really is in your city, category, and price band. You'll stop guessing if demand is real and start sizing spend, hiring, and pricing decisions with actual numbers behind you." },
      { icon: Users, title: "Who you're selling to", tooltip: "Vivid profiles of the two or three people most likely to buy — their pain, budget, vocabulary, and buying triggers. Marketing stops being random; every ad, email, and conversation lands with someone you can picture by name." },
      { icon: Crosshair, title: "How you beat the alternatives", tooltip: "An honest map of who else is in the ring and the wedge only you can own. You'll stop competing on price, win the comparison conversation, and give customers a reason to choose you that competitors can't copy." },
      { icon: Rocket, title: "Your first 90 days", tooltip: "The exact sequence of channels, offers, and moves that get you from zero to your first paying customers. No more wondering what to do Monday — you walk out with the first ninety days mapped step by step." },
      { icon: MessageSquare, title: "How you sound everywhere", tooltip: "The core message, tone, and proof points that make your brand feel like one voice everywhere. Your site, social, sales calls, and packaging finally line up — and customers start describing you the way you want to be described." },
      { icon: ListChecks, title: "Your first 50 people to call", tooltip: "Fifty named prospects you can actually reach — with contact, angle, and the specific ask for each. You'll walk out of day two with a pipeline instead of a persona, and your first customer conversations start the same afternoon." },
      { icon: Beaker, title: "A 48-hour demand test", tooltip: "A forty-eight-hour validation offer — deposit, LOI, or paid pilot — that proves real demand before the full site ships. You'll spend the rest of the sprint building for buyers you've already met, not customers you hope show up." },
      { icon: Users, title: "A place to track every deal", tooltip: "A ready-to-import CRM setup (Attio, Folk, or HubSpot Free) with stages, custom fields, saved views, and your First-50 pre-loaded. You'll stop tracking deals in a spreadsheet and start Day 3 with a real pipeline you can actually work." },
    ],
  },
  {
    number: "03",
    name: "Operations",
    intro: "What you build, sell, and ship — week after week.",
    benefit: "The roadmap, weekly workflow, and sales playbook that let you deliver reliably — and hand pieces to a teammate without the business breaking.",
    items: [
      { icon: Map, title: "What you'll launch, in what order", tooltip: "A clear sequence of what you'll launch, in what order, over the next twelve months. You'll stop building features no one asked for, ship the things that drive revenue first, and have a calendar customers can trust." },
      { icon: Settings, title: "How the week actually runs", tooltip: "The week-by-week workflow that turns your offer into something you can deliver reliably. You'll stop reinventing every order, free up hours each week, and have something a future hire can actually be trained to run." },
      { icon: Handshake, title: "What to say to close the sale", tooltip: "A repeatable script — discovery questions, objections, asks, closes — that moves a stranger to a signed deal. Close more conversations, stop discounting under pressure, and bring on help knowing the system will close without you." },
      { icon: Megaphone, title: "Where your customers come from", tooltip: "Your channels, monthly spend, content cadence, and the metrics that tell you what's working. Marketing stops being a guessing game; you spend dollars where they return dollars and quietly turn off everything that doesn't." },
      { icon: Package, title: "How you deliver order #1", tooltip: "The step-by-step of how order number one through ten actually gets delivered — with time and cost per unit. You'll ship the first sale without scrambling, know your true margin, and hand fulfillment to a teammate without the business breaking." },
      { icon: LifeBuoy, title: "How you answer customers fast", tooltip: "A shared support inbox, response SLA, canned replies, and refund and return rules — ready before day fifteen problems arrive. You'll answer the first customer question inside an hour and never lose a buyer to silence." },
      { icon: CalendarDays, title: "A real link to book a call", tooltip: "Cal.com or Calendly event types tuned to your sales motion — discovery, working session, onboarding — with routing, reminders, and confirmation copy. You'll stop trading emails to book a call and start Day 6 with a real link to send." },
      { icon: Mic, title: "Every call captured and summarized", tooltip: "Fathom, Grain, or Fireflies wired up with an AI summary template, tagging convention, and a call-to-content pipeline. You'll stop forgetting what the customer said and start turning every conversation into product and marketing fuel." },
      { icon: LifeBuoy, title: "An AI helper for easy questions", tooltip: "A Chatbase or Intercom Fin bot trained on your own docs, with guardrails and escalation to your support inbox. You'll deflect the easy 60% of tickets on Day 12 and only see the questions that actually need a human." },
      { icon: Zap, title: "5 things you'll stop doing by hand", tooltip: "Five n8n, Zapier, or Make workflows tuned to your stack — lead → CRM + Slack, sale → welcome + review ask, weekly KPI digest, form → booking, review → wall-of-love. You'll stop doing repetitive work by Week 2." },
      { icon: Package, title: "Your top 5–10 suppliers, vetted", tooltip: "For physical-product startups only — a 5-10 supplier shortlist with MOQ, unit cost, lead time, pros/cons, and a first-outreach message you can paste today. You'll stop cold-messaging Alibaba and start with vendors already scored against your product." },
      { icon: Calculator, title: "What each unit really costs you", tooltip: "For physical-product startups only — bill of materials, unit cost stack, freight/duty/landed-cost math, and break-even units at your current price. You'll know your true margin before the first PO ships instead of after the first bad quarter." },
    ],
  },
  {
    number: "04",
    name: "Finance",
    intro: "The numbers investors, banks, and you can trust.",
    benefit: "A twelve-month P&L, unit economics, and funding plan you can defend to a banker or investor — and use yourself to price, spend, and hire with confidence.",
    items: [
      { icon: LineChart, title: "Your 12-month money picture", tooltip: "A twelve-month P&L and cash flow you can defend to a banker, partner, or yourself. You'll see exactly when cash gets tight, what a slow month does, and the few levers that actually change the trajectory." },
      { icon: Calculator, title: "What one customer is really worth", tooltip: "The math on what one customer truly costs to win and what they pay back over time. You'll price with confidence, kill unprofitable offers, and finally know whether spending more on marketing makes you more money or less." },
      { icon: Banknote, title: "How you'll pay for growth", tooltip: "A clear-eyed plan for how you'll fund the business — bootstrap, savings, grants, a loan, friends and family, or investors. You'll stop chasing the wrong kind of money and pursue the cheapest capital that actually fits." },
      { icon: ClipboardList, title: "What you'll spend, month by month", tooltip: "A line-by-line budget and forecast tied to real assumptions about your market and pricing. You'll walk into a bank, an SBA meeting, or a landlord conversation with the asset they expect — and be taken seriously immediately." },
      { icon: Presentation, title: "Your story on 10 slides", tooltip: "A tight slide-by-slide outline of the story that gets a partner, investor, or first big customer to lean in. You'll stop rebuilding decks from scratch and have a narrative spine you reuse for every important conversation." },
      { icon: CreditCard, title: "A live way to take money", tooltip: "A live Stripe account, tax and payout wired, receipts branded, and one working checkout link tied to your offer. You'll actually collect money on day fourteen instead of promising invoices you can't send." },
      { icon: Building2, title: "A business bank, books, and a debit card", tooltip: "Business bank account opened, debit card in hand, books tool connected, and a clean chart of accounts seeded to your model. You'll separate personal and business from dollar one and never dread tax season again." },
      { icon: Tag, title: "Your prices, in writing", tooltip: "Your packaged tiers, terms, what's included, and what's not — the artifact your checkout link points at and your sales conversations close against. You'll stop negotiating from scratch and start protecting your margin on every deal." },
    ],
  },
  {
    number: "05",
    name: "Governance",
    intro: "The legal and risk scaffolding that keeps you bankable.",
    benefit: "Entity, risk, and advisory scaffolding in place — so you're bankable, insurable, and no longer one bad surprise away from personal exposure.",
    items: [
      { icon: Scale, title: "How to set the business up right", tooltip: "A plain-English recommendation on entity, ownership, and the contracts you actually need on day one. You'll set up the business correctly the first time, protect your personal assets, and avoid the legal cleanup bills founders pay later." },
      { icon: ShieldAlert, title: "What could go wrong — and the fix", tooltip: "An honest list of what could derail the business — and the specific moves that defuse each one. You'll sleep better, get insurance priced right, and stop being blindsided by the predictable problems every small business hits." },
      { icon: Landmark, title: "The advisors in your corner", tooltip: "A lightweight structure for advisors, mentors, or partners who hold you accountable and open doors. You'll get smarter outside counsel in the room, make faster decisions, and look credible to banks, investors, and serious customers." },
      { icon: FileCheck, title: "The customer-facing legal set", tooltip: "The customer-facing legal set every checkout, app store, and enterprise buyer expects — terms of service, privacy policy, and refund policy tuned to your offer. You'll pass Stripe review, procurement, and app review the first time." },
      { icon: Umbrella, title: "The insurance customers ask about", tooltip: "A general-liability and errors-and-omissions quote path with the exact coverage your buyers, landlords, and venues ask about. You'll answer the first COI request the same day and stop losing enterprise deals to a missing certificate." },
      { icon: FileSignature, title: "Contracts for your first hire", tooltip: "Master services agreement, statement of work, W-9, and IP assignment — ready to send to your first contractor before they touch anything. You'll hire fast, protect the work you're paying for, and file cleanly at year-end." },
    ],
  },
  {
    number: "06",
    name: "Brand",
    bonus: true,
    intro: "An identity worth premium pricing — system, not stickers.",
    benefit: "A brand system — strategy, messaging, visual brief, voice, guidelines — that earns premium pricing and stops you rebuilding your identity every six months.",
    items: [
      { icon: Compass, title: "What your brand stands for", tooltip: "The strategic foundation under your brand — purpose, promise, audience, positioning. Every logo, color, and word downstream has a reason behind it, and you stop redoing your brand every time something feels off." },
      { icon: MessageCircle, title: "The words your brand uses", tooltip: "Your headline, supporting messages, and proof — organized so every page, post, and pitch pulls from the same well. You'll write faster, sound consistent everywhere, and stop staring at a blinking cursor wondering what to say." },
      { icon: Palette, title: "The look you hand to a designer", tooltip: "A clear brief for the logo, colors, type, and visual feel — ready to hand to a designer. You'll skip months of revisions, get an identity you actually love, and look credible from day one." },
      { icon: Mic, title: "How your brand sounds", tooltip: "How your brand sounds — word choice, rhythm, what to avoid — so anyone writing for you sounds like you. Founders and contractors all produce on-brand copy without you rewriting every sentence yourself." },
      { icon: BookOpen, title: "Your brand rules, all in one place", tooltip: "One asset that holds your logo rules, colors, type, voice, and examples in one place. Hand it to any vendor, freelancer, or new hire and they'll produce on-brand work without forty rounds of feedback from you." },
      { icon: Palette, title: "Your logo, favicon, and images", tooltip: "AI-generation prompts for logo, favicon, OG image, avatar, and email banner — with the exact sizes and formats. You'll walk into Day 11 with everything you need to ship a site that looks like a real brand, not an AI demo." },
    ],
  },
  {
    number: "07",
    name: "Marketing",
    bonus: true,
    intro: "The AI-builder PRD that helps ship your site fast.",
    benefit: "A complete website PRD ready to hand to an AI builder — so the site can be built quickly instead of drifting for months.",
    items: [
      { icon: Globe, title: "The build brief for your website", tooltip: "A complete product requirements asset — pages, copy, sections, calls to action — written so an AI builder can build your site fast. You'll skip the blank-page guessing and hand a builder the exact structure it needs." },
      { icon: AtSign, title: "Domain, business email, and setup", tooltip: "Domain purchased, business email live, SPF, DKIM, and DMARC set — and a support alias routed to the right person. Your outreach lands in inboxes instead of spam, and you look like a real company from your very first email." },
      { icon: Activity, title: "A way to see what's working", tooltip: "GA4, the ad pixels your channels need, conversion events, and a UTM convention wired before you spend a dollar. You'll know what actually converted, cut ad spend that doesn't pay back, and double down on the channels that do." },
      { icon: MousePointerClick, title: "The Day-4 page PRD", tooltip: "A one-page offer-test PRD — sections, copy, form, and calls to action — so your validation page can be built quickly after the workshop. You'll have the hook and structure ready before you spend time or money driving traffic." },
      { icon: Globe, title: "The build brief for your pre-sell page", tooltip: "A scoped one-page PRD — sections, copy, form spec, confirmation emails, analytics, brand tokens — written so Lovable, v0, or Bolt scaffolds your Day-4 pre-sell page in one shot. You'll ship the validation page in an afternoon instead of a weekend." },
      { icon: Mail, title: "Business email that reaches the inbox", tooltip: "Resend, Loops, or Beehiiv wired to your domain with SPF/DKIM/DMARC, a 5-email welcome sequence, first broadcast, and a deliverability warm-up plan. You'll stop landing in spam and start owning the audience that keeps buying." },
    ],
  },
  {
    number: "08",
    name: "Social & Content",
    bonus: true,
    intro: "The distribution engine that earns attention on repeat.",
    benefit: "Ninety days of content, a launch kit, and a paid-ads starter pack — a distribution engine that earns attention on repeat instead of costing more each month.",
    items: [
      { icon: Share2, title: "Your social accounts, cleaned up", tooltip: "A clean review of your current accounts plus the right handles, bios, and links across the platforms your customers actually use. You'll show up looking professional everywhere — and stop losing customers to a stale profile." },
      { icon: Layers, title: "What you'll post about", tooltip: "Three to five content themes that consistently attract your buyer and reinforce your positioning. You'll stop posting random updates, build a recognizable voice, and have a topic to write about every single time you sit down." },
      { icon: CalendarDays, title: "90 days of posts, planned", tooltip: "Ninety days of post ideas, hooks, and formats mapped out so you never stare at a blank calendar again. Show up consistently, build an audience that actually converts, and free hours every week from on-the-fly content decisions." },
      { icon: PartyPopper, title: "Everything you need for launch week", tooltip: "A ready-to-publish set of announcement posts, captions, emails, and graphics for your opening week. You'll launch loud instead of quietly, give friends and family something easy to share, and turn day one into real traction." },
      { icon: Heart, title: "How to reply, DM, and thank people", tooltip: "The simple rules and templates for replies, DMs, reviews, and customer moments that turn followers into fans. You'll spend less time agonizing over what to say and build the kind of word-of-mouth that no ad budget can buy." },
      { icon: Star, title: "A note to send to partners", tooltip: "A short brief you can send to local influencers, complementary brands, or community partners. You'll unlock collaborations that put you in front of warm audiences for free — instead of paying for cold ads to strangers who don't know you." },
      { icon: Target, title: "Your first paid ad campaign, ready", tooltip: "A starter set of ad targets, hooks, and budgets tuned to your offer and your buyer. You'll launch your first paid campaign without burning rent money, learn fast what converts, and scale only what actually pays back." },
      { icon: MessageSquareQuote, title: "How you collect reviews on day 1", tooltip: "Request templates, direct links to Google, Yelp, or G2, a video-ask script, and a wall-of-love page ready to embed. You'll turn every happy first customer into public proof — and stop losing week-two buyers who need to see someone went before them." },
      { icon: Send, title: "What to send to your first 50", tooltip: "Cold and warm outreach scripts tied directly to your First-50 list — opener, follow-up, and the specific ask. You'll actually work the pipeline instead of hoping content does it for you, and book the first sales calls in week one." },
      { icon: Target, title: "12 ads ready to run", tooltip: "Twelve ready-to-run ad units — 4 static image prompts, 4 short-form video scripts, 4 headline+body pairs — mapped to Meta, Google, TikTok, and LinkedIn. You'll launch Day 14 with creative that's tuned to your offer, not a generic template." },
      { icon: Share2, title: "How happy customers bring you more", tooltip: "Rewardful, Tolt, or a manual program with terms, invite email, tracking convention, and a first-10-advocates list. You'll turn every happy customer into your cheapest channel — and stop paying full CAC on Day 15." },
    ],
  },
];


// Flat alias for surfaces that just need the full list of titles.
export const FRAMEWORK_DELIVERABLES: FrameworkDeliverable[] =
  FRAMEWORK_STAGES.flatMap((s) => s.items);

export const TOTAL_DELIVERABLES = FRAMEWORK_DELIVERABLES.length;


export type FoundationReason = { title: string; body: string };

export const FOUNDATION_FIRST_REASONS: FoundationReason[] = [
  {
    title: "A wrong-headed brand is expensive to undo.",
    body: "Logos and websites built before positioning is locked become $20K mistakes you redo a year later.",
  },
  {
    title: "A great website with no ICP doesn't convert.",
    body: "Traffic without a defined buyer is just noise — and paid traffic is expensive noise.",
  },
  {
    title: "AI amplifies whatever it's pointed at.",
    body: "Point it at a fuzzy strategy and it scales the fuzz. Point it at a sharp one and it scales you.",
  },
];

export type BuildLayerItem = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  capability: string;
};

export const BUILD_LAYER: BuildLayerItem[] = [
  {
    icon: Palette,
    title: "Build your brand",
    subtitle: "Your brand in a day. No agency required.",
    description:
      "Logo, palette, type system, and guidelines — finished before you leave. No retainer, no six-week wait, no committee.",
    capability: "Brand identity",
  },
  {
    icon: Globe,
    title: "Convert your website",
    subtitle: "Build the site your customers actually buy from.",
    description:
      "Not a brochure. A revenue surface wired to payments and analytics, written for the buyer you're actually trying to win.",
    capability: "A website that converts",
  },
  {
    icon: Share2,
    title: "Own your social presence",
    subtitle: "30 days of content before you leave the room.",
    description:
      "A month of on-brand posts, captions, and hooks — drafted, scheduled, and ready to publish the morning after the workshop.",
    capability: "Social presence",
  },
  {
    icon: PenTool,
    title: "Engineer your content",
    subtitle: "Rank, publish, repeat. Your content machine is live.",
    description:
      "An SEO-aware content engine with pillars, topics, and the next 90 days mapped — so traffic compounds instead of costing more every month.",
    capability: "A content engine",
  },
  {
    icon: Sparkles,
    title: "Run on AI",
    subtitle: "Automate 5 real workflows. Today.",
    description:
      "Five AI workflows wired into your actual operation — drafting, qualifying, follow-up, reporting, support — so two people do the work of ten.",
    capability: "AI as your operating system",
  },
  {
    icon: Mail,
    title: "Automate your revenue",
    subtitle: "16 emails written. Your sales machine is running.",
    description:
      "A 16-email nurture and follow-up sequence loaded and ready. Most revenue lives in the second, fifth, and twelfth touch — automated, on time, on brand.",
    capability: "Email, CRM, and automation",
  },
  {
    icon: TrendingUp,
    title: "Close more sales",
    subtitle: "Walk out with a sales script that qualifies and closes.",
    description:
      "A repeatable script and pipeline that moves a stranger to a signed deal — with the objections, the asks, and the close already written.",
    capability: "Sales systems",
  },
  {
    icon: Scale,
    title: "Scaffold your business",
    subtitle: "Entity. Contracts. Books. Done.",
    description:
      "LLC, EIN, operating agreement, client contracts, and a clean books setup — the boring scaffolding that keeps you legal, bankable, and ready to scale.",
    capability: "Legal, financial, and operational scaffolding",
  },
];

// Kept as an alias for any legacy import — superseded by BUILD_LAYER.
export const OUT_OF_SCOPE = BUILD_LAYER.map((b) => b.title);


