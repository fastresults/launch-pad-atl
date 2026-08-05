// The product layer behind the workshop-aware homepage.
//
// The catalog (workshop-catalog.ts) carries hero copy — the question, the ghost
// examples, the AI lens. This file carries the *sales* copy: what it costs to
// keep not having this, the artifact shown as a real object, the morning, the
// objections that actually kill the sale in this domain, and the two formats.
//
// Structure only lives here once. Agenda, fit columns, and artifacts are pulled
// from BUILD_WORKSHOPS so the /build/:slug page and the homepage can never drift.

import { BUILD_WORKSHOPS, type AgendaBlock } from "@/lib/build-workshops";
import { getCatalogWorkshop, FOUNDATION_SLUG, type CatalogWorkshop } from "@/lib/workshop-catalog";

/** A mock of the real thing the founder leaves with. */
export type ArtifactPreview = {
  /** Small label above the mock, e.g. "Live page" or "Sales script". */
  kind: string;
  /** The mock's own title line. */
  title: string;
  /** Body lines rendered as the document's contents. */
  lines: string[];
  /** Footer stamp, e.g. "Finished 11:24am · yours to keep". */
  stamp: string;
};

export type Objection = { q: string; a: string };

export type WorkshopIncluded = {
  label: string;
  heading: string;
  summary: string;
  items: { title: string; detail: string }[];
  footnote: string;
};

export type WorkshopFormat = {
  name: string;
  priceLabel: string;
  /** One line naming what this format really is. */
  summary: string;
  points: string[];
  ctaLabel: string;
};

export type WorkshopProduct = CatalogWorkshop & {
  /** The eyebrow over section 1. */
  costEyebrow: string;
  /** What it costs to keep not having this — the number, then the story. */
  costStat: string;
  costStatCaption: string;
  costBody: string;
  /** The artifacts, named like files. */
  artifacts: string[];
  artifactPreview: ArtifactPreview;
  /** The morning, hour by hour. */
  morning: AgendaBlock[];
  forYou: string[];
  notForYou: string[];
  objections: Objection[];
  /** The line that closes the page. */
  decisionHeadline: string;
  decisionBody: string;
};

type ProductMeta = {
  costEyebrow: string;
  costStat: string;
  costStatCaption: string;
  costBody: string;
  artifactPreview: ArtifactPreview;
  objections: Objection[];
  decisionHeadline: string;
  decisionBody: string;
};

const PRODUCT_META: Record<string, ProductMeta> = {
  /* ─────────── FOUNDATION ─────────── */
  foundation: {
    costEyebrow: "The cost of circling",
    costStat: "14 months",
    costStatCaption: "average time between “I have an idea” and the first dollar",
    costBody:
      "Nothing is wrong with your idea. What's wrong is that it has never left your head — no name you'd say out loud, no price, no page, no message sent to a stranger who could pay you. Every week it stays in there, it gets heavier and less likely. One morning ends that.",
    artifactPreview: {
      kind: "Your live page",
      title: "northsidegutterco.com",
      lines: [
        "Gutter cleaning for Sandy Springs homeowners — booked online, done in a day.",
        "$189 flat · single-story home · next-day slots",
        "[ Book your slot ]",
        "— first message sent 11:18am to 12 neighbors on Nextdoor",
      ],
      stamp: "Written with you in the room · live before lunch",
    },
    objections: [
      {
        q: "I don't have the idea nailed down yet.",
        a: "That is the morning. You arrive with a direction and a hunch; you leave with a named startup pointed at one specific buyer. Founders who arrive certain usually leave having changed something anyway.",
      },
      {
        q: "Can't I get all of this from AI for free?",
        a: "You can get words for free. What you can't get is someone across the table who won't let you leave with a price you're afraid to say, or a page that never goes live. The AI writes fast. The room makes you ship.",
      },
      {
        q: "What if I can't build the rest myself?",
        a: "Then you have eight more mornings, or you hand it to our team. Either way, you own what gets written that day — the name, the offer, the page, the first message. Nothing is locked behind us.",
      },
    ],
    decisionHeadline: "By lunch, your startup exists outside your head.",
    decisionBody:
      "A name, a price you can say out loud, a live page, and a first message sent to someone real. One seat, one morning at the IGNITE Center.",
  },

  /* ─────────── BRAND ─────────── */
  "brand-identity": {
    costEyebrow: "The cost of looking cheap",
    costStat: "3 seconds",
    costStatCaption: "how long a buyer takes to price you before reading a word",
    costBody:
      "You are not losing deals on price. You are losing them in the first three seconds, when a buyer decides which shelf you belong on — and then negotiates you toward it. A weak brand doesn't look bad. It looks inexpensive, and you pay for it on every invoice.",
    artifactPreview: {
      kind: "Voice guide",
      title: "How we sound — one page, no exceptions",
      lines: [
        "Archetype: the Steady Hand. Calm, specific, never hyped.",
        "We say: “here's what it costs.” We never say: “unlock,” “elevate,” “journey.”",
        "Sentences stay under 18 words. Numbers beat adjectives.",
        "Palette: deep slate / warm bone / signal amber. Type: Sohne + Tiempos.",
      ],
      stamp: "Signed off in the room · hand it to any designer or AI prompt",
    },
    objections: [
      {
        q: "I already have a logo.",
        a: "Good — bring it. A logo is one asset; a brand is the rules that make the next hundred assets agree with each other. Most mornings end with the logo kept and everything around it finally made consistent.",
      },
      {
        q: "Isn't brand a luxury before revenue?",
        a: "It is the cheapest pricing lever you have. Nothing else you can do in a morning raises what a stranger assumes you charge.",
      },
      {
        q: "I'm not a designer. Can I actually use this?",
        a: "That's the point of writing the rules down. You leave with instructions specific enough that a freelancer, a template, or an AI prompt produces something that looks like you.",
      },
    ],
    decisionHeadline: "Leave with the brand — and the right to charge more.",
    decisionBody:
      "Voice, archetype, palette, type, and usage rules tight enough to hand to a designer this week. Finished before lunch.",
  },

  /* ─────────── WEBSITE ─────────── */
  "website-that-converts": {
    costEyebrow: "The cost of a page that only describes you",
    costStat: "8 seconds",
    costStatCaption: "how long a first-time visitor gives your homepage",
    costBody:
      "Most founder sites are a museum: here's who we are, here's our story, here's a contact form nobody fills out. A site that sells does one job, says it above the fold, and asks for one action. Everything else on the page is costing you the visitors you already paid to get there.",
    artifactPreview: {
      kind: "Homepage wireframe",
      title: "One page. One job: book the walkthrough.",
      lines: [
        "H1 — Kitchen remodels in Marietta, quoted in 48 hours.",
        "Proof strip — 61 remodels · licensed · photos of the last 6",
        "Offer — Free walkthrough + fixed written quote. No sales visit.",
        "[ Book my walkthrough ] — repeated 3x, nothing else clickable",
      ],
      stamp: "Wireframed with you · ready to build or hand off Monday",
    },
    objections: [
      {
        q: "I need a developer, not a workshop.",
        a: "You need the decisions before the developer — the job of the page, the words, the order. Handing a developer a finished wireframe and real copy is the difference between a two-week build and a three-month one.",
      },
      {
        q: "My site is fine, it just gets no traffic.",
        a: "Then the traffic you do get is being wasted, and every channel you add later multiplies against a page that doesn't convert. Fix the page first; it's the cheaper half.",
      },
      {
        q: "Can I use my Squarespace/Wix template?",
        a: "Yes. We build the page's job, structure, and words. They drop into whatever platform you already pay for.",
      },
    ],
    decisionHeadline: "Leave with the page your customers actually buy from.",
    decisionBody:
      "One job, one structure, real words, and the wireframe to build against. No agency, no three-month redesign.",
  },

  /* ─────────── SALES ─────────── */
  "sales-systems": {
    costEyebrow: "The cost of talking to everyone",
    costStat: "1 in 9",
    costStatCaption: "how many founder sales calls end in a decision either way",
    costBody:
      "You are not bad at selling. You are having the wrong conversations, with people who were never going to buy, and calling it a pipeline. A sharp buyer definition and a script that disqualifies in the first 90 seconds gives you back your week and closes the deals that were always available.",
    artifactPreview: {
      kind: "Sales script",
      title: "Discovery call — 25 minutes, one next step",
      lines: [
        "0–2 min — “What made you take this call today?” Then stop talking.",
        "2–8 min — Qualify: units, timeline, who signs. Any miss = end warmly.",
        "8–18 min — Their problem in their words, priced back to them.",
        "18–25 min — One next step with a date, or a clean no. Never “I'll follow up.”",
      ],
      stamp: "Written for your #1 conversation · rehearsed in the room",
    },
    objections: [
      {
        q: "I hate feeling salesy.",
        a: "So do buyers. Most of what feels salesy is the founder talking through a call they should have ended in minute four. Qualifying hard is the least pushy thing you can do.",
      },
      {
        q: "My business is referral-based.",
        a: "Referrals are a channel, not a system. The script still decides whether a warm intro turns into a signed deal or a polite disappearance.",
      },
      {
        q: "I don't have enough leads to need this.",
        a: "Then the ones you get matter more, not less. And half the morning is spent deciding exactly who to go find.",
      },
    ],
    decisionHeadline: "Leave knowing who to call, what to say, and when to walk.",
    decisionBody:
      "An ICP scorecard, a rehearsed script for your #1 conversation, pipeline stages with exit criteria, and handlers for your eight real objections.",
  },

  /* ─────────── EMAIL & CRM ─────────── */
  "email-crm-automation": {
    costEyebrow: "The cost of the leads you already paid for",
    costStat: "80%",
    costStatCaption: "of quotes that go quiet and are never followed up again",
    costBody:
      "Somebody asked you for a price, you sent it, and nothing happened — and that was the end of it. Not because they said no, but because nobody said anything again. Follow-up is the cheapest revenue in your startup and the only one you're currently throwing away.",
    artifactPreview: {
      kind: "Lifecycle map",
      title: "From quote sent to signed — your welcome sequence, written",
      lines: [
        "Day 0 — Quote + the one question that surfaces the real objection",
        "Day 2 — Proof: the closest job we've done, with the number",
        "Day 6 — “Still worth doing?” — a permission-to-close-the-file email",
        "Day 21+ — Quarterly re-engagement, automatic, forever",
      ],
      stamp: "Drafted with you in the room · yours to load and send",
    },
    objections: [
      {
        q: "I don't want to spam people.",
        a: "Neither do we. Every email in the sequence either answers a real question or lets them out cleanly. Sequences that give people an easy exit outperform the ones that don't.",
      },
      {
        q: "I already have a CRM I don't use.",
        a: "Bring it. Most mornings end with the CRM you already pay for finally set up around how you actually sell, instead of a new one you'll also abandon.",
      },
      {
        q: "Can't I just write these when I need them?",
        a: "You won't. That's the whole problem — follow-up loses to whatever is on fire that day. Writing them once and automating the send is the fix.",
      },
    ],
    decisionHeadline: "Leave knowing exactly what gets sent, when, and by what trigger.",
    decisionBody:
      "Your CRM chosen and opened, your pipeline stages defined, your welcome sequence drafted, and the automation map written with the build steps beside it.",
  },

  /* ─────────── SOCIAL ─────────── */
  "social-presence": {
    costEyebrow: "The cost of posting into the void",
    costStat: "2 channels",
    costStatCaption: "the most any founder can run well — most attempt five",
    costBody:
      "Posting everywhere occasionally reads exactly like posting nowhere. The founders who get customers from social picked the two rooms their buyers already sit in, showed up on a schedule, and said something only they could say. That's a decision and a queue, not a talent.",
    artifactPreview: {
      kind: "30-day queue",
      title: "Two channels. Thirty posts. Already written.",
      lines: [
        "Channels: Instagram (local proof) + Facebook groups (Gwinnett)",
        "Mon — before/after with the price on it",
        "Wed — the question customers ask most, answered in 40 seconds",
        "Fri — the one thing we refuse to do, and why",
      ],
      stamp: "First week drafted and slotted · the rest of the month outlined",
    },
    objections: [
      {
        q: "I'm not comfortable on camera.",
        a: "Half the queue never shows your face. The formats that work for local and B2B buyers are proof, answers, and specifics — not personality.",
      },
      {
        q: "Social has never brought me a customer.",
        a: "Because it was random. A channel chosen on purpose and a queue that doesn't stop for a busy week is a different activity with the same name.",
      },
      {
        q: "Who has time to post every day?",
        a: "Nobody. That's why you leave with thirty posts already scheduled and a repeatable way to refill in one sitting a month.",
      },
    ],
    decisionHeadline: "Leave with 30 days already scheduled.",
    decisionBody:
      "Two channels chosen with a reason, profiles rewritten, and a month of posts queued before you walk out.",
  },

  /* ─────────── CONTENT ─────────── */
  "content-engine": {
    costEyebrow: "The cost of writing what nobody searched for",
    costStat: "0 searches",
    costStatCaption: "monthly volume for most founder blog posts",
    costBody:
      "The content that works isn't clever. It answers, in public, the exact question a buyer types the week before they spend money — how much, how fast, is it safe, what goes wrong. Write those and you get found by people already reaching for a card.",
    artifactPreview: {
      kind: "Keyword map",
      title: "Four questions your buyers type before they pay",
      lines: [
        "“kitchen remodel cost marietta” — 320/mo · we can rank in 6 months",
        "“how long does a remodel take” — 190/mo · publish first, easiest win",
        "“permit needed for kitchen remodel ga” — 90/mo · nobody local answers it",
        "Pillar → supporting posts mapped, first draft written in the room",
      ],
      stamp: "Mapped to real volume · your first draft written in the room",
    },
    objections: [
      {
        q: "SEO takes a year. I need customers now.",
        a: "True, and that's why this isn't the first workshop. It's the one that makes the next year cheaper. If you need customers this month, do Sales first.",
      },
      {
        q: "I'm not a writer.",
        a: "You're the only one who knows the answers. The morning turns what you already say on the phone into drafts, with AI doing the typing and you doing the truth.",
      },
      {
        q: "Won't AI content get penalized?",
        a: "Generic content gets ignored. Specific answers with your prices, your photos, and your local details do not — and that's what gets built here.",
      },
    ],
    decisionHeadline: "Leave with the questions mapped and the first drafts written.",
    decisionBody:
      "Content pillars tied to your offer, a keyword map you can realistically rank for, and three posts drafted before you go.",
  },

  /* ─────────── AI OPS ─────────── */
  "ai-operating-system": {
    costEyebrow: "The cost of doing it all by hand",
    costStat: "9 hours",
    costStatCaption: "a typical founder week spent on work software should be doing",
    costBody:
      "Quotes typed from scratch. The same five questions answered again. Invoices chased on a Sunday night. None of it grows anything — it just refuses to stop. Taking the biggest one off your plate is a week that finally has room for the work only you can do.",
    artifactPreview: {
      kind: "Automation",
      title: "Quote request → priced draft in 4 minutes",
      lines: [
        "Trigger — form submission or inbound email",
        "Step 1 — pull job type, square footage, zip; flag anything missing",
        "Step 2 — draft the quote from your pricing rules, in your voice",
        "Step 3 — land in your inbox for one look, then send",
      ],
      stamp: "One workflow configured on your account · the rest specified",
    },
    objections: [
      {
        q: "I'm not technical.",
        a: "Nothing here is code. It's the tools you already have, connected step by step with you at the keyboard, so you can change them later.",
      },
      {
        q: "I don't trust AI with customer-facing work.",
        a: "Correct instinct. Every workflow we build keeps you as the last click on anything a customer sees. The automation removes the typing, not the judgment.",
      },
      {
        q: "Won't this be obsolete in six months?",
        a: "The tools will change; the audit won't. You leave knowing which of your tasks are worth automating and what they actually cost — that survives every model release.",
      },
    ],
    decisionHeadline: "Leave with one workflow working and the next four specified.",
    decisionBody:
      "An honest audit of your stack, your highest-value workflow configured on your own account, the next four specified and prompted, and the monthly cost written down.",
  },

  /* ─────────── LEGAL & MONEY ─────────── */
  "legal-financial-ops": {
    costEyebrow: "The cost of the thing you've been avoiding",
    costStat: "8 months",
    costStatCaption: "how long the average founder puts off the entity and the books",
    costBody:
      "It isn't laziness. It's that nobody will tell you plainly which entity, which contract, which account — so it sits, and every month it sits, the cleanup gets more expensive and the personal exposure gets more real. One morning and it's handled, in writing.",
    artifactPreview: {
      kind: "Setup record",
      title: "Entity, contracts, books — settled and in writing",
      lines: [
        "Entity: GA LLC, single-member, S-corp election revisited at $80k profit",
        "Contracts: MSA + SOW + 1099 contractor agreement, all signed-ready",
        "Money: business checking + card, owner draw schedule, 25% tax reserve",
        "Books: chart of accounts drafted, receipt intake chosen, close rhythm scheduled",
      ],
      stamp: "Prepared with you in the room · the filings stay yours to submit",
    },
    objections: [
      {
        q: "Isn't this what a lawyer and a CPA are for?",
        a: "For the edge cases, yes — and you'll leave knowing which of yours are edge cases. Most founders are stuck on the standard 90%, which is exactly what gets decided and prepared that morning. We build the operating setup — we're not your attorney or CPA.",
      },
      {
        q: "I'm too small to need an entity.",
        a: "The moment a customer pays you, the exposure is real and personal. It is never cheaper to set up than before there's anything to lose.",
      },
      {
        q: "My books are a mess. Is it too late?",
        a: "No. Bring the shoebox. Half the room is founders drafting a real chart of accounts for the first time and setting the rhythm that keeps it current.",
      },
    ],
    decisionHeadline: "Leave with the avoided thing done.",
    decisionBody:
      "Your entity path compared against your real numbers, the contract checklist assembled, your accounts and books set to open, and the questions to confirm with your CPA written down.",
  },
};

function formatsFor(w: CatalogWorkshop): { live: WorkshopFormat; included: WorkshopIncluded } {
  return {
    live: {
      name: "The live morning",
      priceLabel: w.priceLabel,
      summary: "In the room at the IGNITE Center. You leave with it finished.",
      points: [
        "8:45\u201311:30, one Thursday morning in Atlanta",
        "Built with you at the table \u2014 not demonstrated at you",
        "Small room, so your work is the work on screen",
        "The artifact is done before you leave. No homework.",
      ],
      ctaLabel: w.status === "open" ? "Reserve your seat" : "Get the date first",
    },
    included: WORKSHOP_INCLUDED,
  };
}

/** Every seat carries the same two things home. Authored once. */
export const WORKSHOP_INCLUDED: WorkshopIncluded = {
  label: "Included with your seat",
  heading: "You do not leave with a folder. You leave with a login.",
  summary: "Everything built that morning keeps living somewhere you can get to it.",
  items: [
    {
      title: "Your dashboard",
      detail:
        "Every asset, decision, and prompt from your morning, saved under your login. Come back in six months, it is still there.",
    },
    {
      title: "The recap course",
      detail:
        "The same build walked back through on video, block by block, so you can redo any step alone.",
    },
  ],
  footnote: "No extra cost. It comes with the seat.",
};

/** The full product record for the homepage stack. */
export function getWorkshopProduct(slug: string | null | undefined): WorkshopProduct {
  const w = getCatalogWorkshop(slug);
  const meta = PRODUCT_META[w.slug] ?? PRODUCT_META[FOUNDATION_SLUG];
  const build = BUILD_WORKSHOPS.find((b) => b.slug === w.slug);

  return {
    ...w,
    ...meta,
    artifacts: w.walkOuts,
    morning: build?.agenda ?? FOUNDATION_MORNING,
    forYou: build?.forYou ?? FOUNDATION_FIT.forYou,
    notForYou: build?.notForYou ?? FOUNDATION_FIT.notForYou,
  };
}

export function getWorkshopFormats(w: CatalogWorkshop) {
  return formatsFor(w);
}

/* Foundation has no BUILD_WORKSHOPS entry — it is the door, authored here. */

const FOUNDATION_MORNING: AgendaBlock[] = [
  {
    time: "8:45 – 9:20",
    title: "Name it, and point it at one buyer",
    detail:
      "Input: the idea as you carry it today. Working session: strip it to one buyer with one problem, then name it. Output: a startup name and a one-sentence position you can say to a stranger.",
  },
  {
    time: "9:20 – 10:15",
    title: "Price the offer out loud",
    detail:
      "Input: what you'd do for the first customer. Working session: scope it, price it, and say the number across the table until it stops sounding like a question. Output: one priced offer, written.",
  },
  {
    time: "10:30 – 11:10",
    title: "Write the page and put it live",
    detail:
      "Input: your position and price. Working session: write the headline, the proof, and the one action — then publish. Output: a live page with a real link.",
  },
  {
    time: "11:10 – 11:30",
    title: "Send the first message",
    detail:
      "Input: a list of people who could actually buy. Working session: write the first outreach message and send it before you stand up. Output: a real conversation in motion.",
  },
];

const FOUNDATION_FIT = {
  forYou: [
    "You have an idea and nothing real yet — no name, no price, no page",
    "You're building around a W-2 and need this to move on the weekends",
    "You want to leave with the thing built, not with notes about building it",
  ],
  notForYou: [
    "You want funding advice or a pitch deck for investors",
    "You want someone to hand you a business you don't have to run",
    "You'd rather keep researching than say a price out loud",
  ],
};
