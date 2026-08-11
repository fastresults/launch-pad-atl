// Terms for handing the operating runway to Startup Labs. The money and the
// term live in ops-investment (the comparison uses the same numbers); this file
// holds the copy and the route helper so the engagement page, the delivery band
// and the comparison all say exactly the same thing.
import {
  RETAINER_DAYS, RETAINER_MONTHLY, RETAINER_MONTHS, RETAINER_TOTAL,
} from "@/lib/ops-investment";

export { RETAINER_DAYS, RETAINER_MONTHLY, RETAINER_MONTHS, RETAINER_TOTAL };

export const money = (cents: number) =>
  `$${Math.round(cents / 100).toLocaleString("en-US")}`;

/** Public page where a founder can see the price and start. */
export const engagePath = (token: string) => `/v/${token}/engage`;

export const ENGAGE_COPY = {
  eyebrow: "Startup Labs builds it",
  title: "Hand the build to the team that made your foundation",
  lede:
    "Your foundation is done and it's yours. This is the next phase only: filing, accounts, systems, creative and the first sales — run by Adam's team on a named owner and a committed date, week after week.",
  priceNote: `${money(RETAINER_MONTHLY)} per month · ${RETAINER_MONTHS}-month term · ${money(RETAINER_TOTAL)} total`,
  termNote: `A ${RETAINER_DAYS}-day build window. Cancel with 30 days' notice — you keep everything delivered.`,
  primaryCta: "Book the kickoff call",
  secondaryCta: "Talk it through first",
} as const;

/** What the retainer covers, in the founder's language. */
export const ENGAGE_INCLUDES: { title: string; detail: string }[] = [
  {
    title: "A named owner on every specialist step",
    detail: "Not a queue. One person accountable, with the date they've committed to.",
  },
  {
    title: "Filing, accounts and books, done properly",
    detail: "Entity, EIN, banking, QuickBooks and a chart of accounts that an accountant will accept.",
  },
  {
    title: "The selling system wired up",
    detail: "CRM, pipeline stages, follow-up and the messages that go out — built and tested, not described.",
  },
  {
    title: "Your foundation elevated into market-ready creative",
    detail: "Original art-directed imagery and campaign creative built on the brand system you already own.",
  },
  {
    title: "Weekly work product you can see",
    detail: "Every deliverable posted to your runway for approval. Nothing invisible, nothing 'in progress' forever.",
  },
  {
    title: "One line to the team",
    detail: "Direct access to Adam and the operators doing the work — no account manager in the middle.",
  },
];

export const ENGAGE_NOT_INCLUDED =
  "Third-party costs (state filing fees, software subscriptions, ad spend) are billed at cost and always approved by you first. Platform builds — marketplaces, matching, booking — are quoted separately.";

export const ENGAGE_STEPS: { label: string; detail: string }[] = [
  { label: "Kickoff call", detail: "45 minutes. We walk your runway and agree the first 30 days." },
  { label: "Owners and dates", detail: "Every specialist step gets a name and a committed date in your runway." },
  { label: "Week one delivery", detail: "Work product starts landing in your runway for approval within five business days." },
];

export interface EngagementRequestInput {
  name: string;
  email: string;
  phone?: string;
  startPref?: string;
  notes?: string;
}
