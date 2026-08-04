// The 9-workshop catalog that powers the hero gateway.
//
// One array, one source of truth: the Foundation workshop (open now) plus the
// eight build workshops from BUILD_WORKSHOPS, each carrying the hero copy that
// re-tunes the prompt when it is selected. Adding workshop ten is data-only.

import { Compass, type LucideIcon } from "lucide-react";
import { BUILD_WORKSHOPS } from "@/lib/build-workshops";
import { WORKSHOP_PRICE_LABEL } from "@/lib/framework-deliverables";
import { getUpcomingSessions } from "@/lib/build-workshop-schedule";

export type WorkshopStatus = "open" | "upcoming";

export type CatalogWorkshop = {
  slug: string;
  icon: LucideIcon;
  /** Short chip label, e.g. "Foundation" */
  chipLabel: string;
  title: string;
  oneLiner: string;
  priceLabel: string;
  status: WorkshopStatus;
  /** Month the workshop opens, e.g. "Sep 2026". Shown on upcoming chips. */
  opensLabel: string;
  /** Where an open workshop sends the visitor. */
  href: string;
  /** The hero question this workshop asks. */
  heroQuestion: string;
  /** Ghost-typed examples under the question. */
  promptExamples: string[];
  /** Accessible label for the hero input. */
  inputLabel: string;
  /** Micro-copy under the prompt field. */
  promptCaption: string;
  /** What the AI snapshot should read for. Sent to the edge function. */
  lens: string;
  /** What actually gets built that morning. */
  walkOuts: string[];
  /** The pain this workshop answers. */
  painHeadline: string;
  painBody: string;
};

export const FOUNDATION_SLUG = "foundation";

/** Foundation is authored by hand — it is the door, not a build layer. */
const FOUNDATION: CatalogWorkshop = {
  slug: FOUNDATION_SLUG,
  icon: Compass,
  chipLabel: "Foundation",
  title: "Foundation Workshop",
  oneLiner: "Start here. One morning, and your startup exists in the real world.",
  priceLabel: WORKSHOP_PRICE_LABEL,
  status: "open",
  opensLabel: "Open now",
  href: "/register",
  heroQuestion: "What would you like to start?",
  promptExamples: [],
  inputLabel: "Tell us what you want to start",
  promptCaption: "We build it. You own it.",
  lens: "starting a new startup in metro Atlanta",
  walkOuts: [
    "Your startup named, positioned, and pointed at one specific buyer",
    "A priced offer you can say out loud without flinching",
    "Your live page — real words, real price, real link",
    "The first message sent to a real prospective customer",
  ],
  painHeadline: "You have the idea. What you don't have is the first real thing.",
  painBody:
    "Most founders spend months circling — reading, planning, waiting to feel ready. One morning at the IGNITE Center and the circling stops: your startup has a name, a price, a page, and a first customer conversation in motion.",
};

/** Per-workshop hero copy and rollout month, keyed by BUILD_WORKSHOPS slug. */
const BUILD_META: Record<
  string,
  Pick<
    CatalogWorkshop,
    "chipLabel" | "opensLabel" | "heroQuestion" | "promptExamples" | "inputLabel" | "promptCaption" | "lens"
  >
> = {
  "brand-identity": {
    chipLabel: "Brand",
    opensLabel: "Sep 2026",
    heroQuestion: "Be impossible to ignore.",
    promptExamples: [
      "Trusted with my house keys",
      "Neighborhood bakery, not a chain",
      "Serious enough for $40k work",
    ],
    inputLabel: "Tell us how you want to be seen",
    promptCaption: "We build the brand. You own it.",
    lens: "brand positioning and identity",
  },
  "website-that-converts": {
    chipLabel: "Website",
    opensLabel: "Oct 2026",
    heroQuestion: "Make your site sell.",
    promptExamples: [
      "Book a quote without calling me",
      "Buy the $89 starter box",
      "Schedule a walkthrough this week",
    ],
    inputLabel: "Tell us the one job your site has",
    promptCaption: "We build the page. You own it.",
    lens: "website conversion — the single job the page must do",
  },
  "sales-systems": {
    chipLabel: "Sales",
    opensLabel: "Nov 2026",
    heroQuestion: "Name your dream client.",
    promptExamples: [
      "Property managers with 20+ units",
      "Gwinnett families who hate cleaning",
      "Law firms needing a real bookkeeper",
    ],
    inputLabel: "Name your dream client",
    promptCaption: "We build the pipeline. You own it.",
    lens: "client acquisition — who to sell to and how to reach them",
  },
  "email-crm-automation": {
    chipLabel: "Email & CRM",
    opensLabel: "Dec 2026",
    heroQuestion: "Who stopped replying?",
    promptExamples: [
      "People who ask a price, then vanish",
      "Past customers I never follow up with",
      "Everyone who signs up and never buys",
    ],
    inputLabel: "Tell us who you keep losing",
    promptCaption: "We build the follow-up. You own it.",
    lens: "follow-up, email, and CRM automation",
  },
  "social-presence": {
    chipLabel: "Social",
    opensLabel: "Jan 2027",
    heroQuestion: "Where are your buyers?",
    promptExamples: [
      "Instagram, but I post twice a year",
      "Facebook groups in my county",
      "LinkedIn — my buyers run operations",
    ],
    inputLabel: "Tell us where your buyers already are",
    promptCaption: "We build the presence. You own it.",
    lens: "social presence and channel choice",
  },
  "content-engine": {
    chipLabel: "Content",
    opensLabel: "Feb 2027",
    heroQuestion: "What do buyers ask?",
    promptExamples: [
      "What does a kitchen remodel cost?",
      "Is this safe for my dog?",
      "How fast can you get here?",
    ],
    inputLabel: "Tell us what buyers ask first",
    promptCaption: "We build the engine. You own it.",
    lens: "content strategy built around real buying questions",
  },
  "ai-operating-system": {
    chipLabel: "AI ops",
    opensLabel: "Mar 2027",
    heroQuestion: "What's eating your week?",
    promptExamples: [
      "Writing every quote from scratch",
      "Chasing invoices on Sunday nights",
      "Answering the same five questions",
    ],
    inputLabel: "Tell us what's eating your week",
    promptCaption: "We build the automation. You own it.",
    lens: "AI automation of repetitive founder work",
  },
  "legal-financial-ops": {
    chipLabel: "Legal & money",
    opensLabel: "Apr 2027",
    heroQuestion: "What are you avoiding?",
    promptExamples: [
      "I still haven't formed the LLC",
      "No contract — just texts and handshakes",
      "My books are a shoebox and an app",
    ],
    inputLabel: "Tell us what you've been avoiding",
    promptCaption: "We set it up. You own it.",
    lens: "entity setup, contracts, and bookkeeping basics",
  },
};

/** Display order: Foundation first, then the rollout calendar. */
const BUILD_ORDER = [
  "brand-identity",
  "website-that-converts",
  "sales-systems",
  "email-crm-automation",
  "social-presence",
  "content-engine",
  "ai-operating-system",
  "legal-financial-ops",
];

const BUILD_ENTRIES: CatalogWorkshop[] = BUILD_ORDER.flatMap((slug) => {
  const w = BUILD_WORKSHOPS.find((b) => b.slug === slug);
  const meta = BUILD_META[slug];
  if (!w || !meta) return [];
  return [
    {
      slug: w.slug,
      icon: w.icon,
      chipLabel: meta.chipLabel,
      title: w.title,
      oneLiner: w.oneLiner,
      priceLabel: w.priceLabel,
      status: "upcoming" as WorkshopStatus,
      opensLabel: meta.opensLabel,
      href: `/build/${w.slug}`,
      heroQuestion: meta.heroQuestion,
      promptExamples: meta.promptExamples,
      inputLabel: meta.inputLabel,
      promptCaption: meta.promptCaption,
      lens: meta.lens,
      walkOuts: w.walkOuts,
      painHeadline: w.pains[0]?.title ?? w.subhead,
      painBody: w.pains[0]?.body ?? w.oneLiner,
    },
  ];
});

export const WORKSHOP_CATALOG: CatalogWorkshop[] = [FOUNDATION, ...BUILD_ENTRIES];

export function getCatalogWorkshop(slug: string | null | undefined): CatalogWorkshop {
  return WORKSHOP_CATALOG.find((w) => w.slug === slug) ?? FOUNDATION;
}

/** Next scheduled date label for a workshop, when one exists. */
export function nextDateLabel(slug: string): string | null {
  if (slug === FOUNDATION_SLUG) return "Thu, Aug 20, 2026";
  const [next] = getUpcomingSessions(slug, new Date(), 1);
  return next ? next.dateLabel : null;
}
