// The audit layer that every build workshop now opens with.
//
// Foundation is deliberately absent: it is the door, and there is nothing to
// audit yet. Each build workshop names the real material it reviews, the one
// prescribed outcome the morning is aimed at, and the guarantee behind it.

export type AuditIntakeField = {
  /** Stable key stored on the intake row. */
  key: string;
  /** What the attendee is asked for, in that lane's own language. */
  label: string;
  /** Short helper under the field. */
  help: string;
  /** How it is collected. */
  kind: "url" | "text" | "longtext" | "files";
  required?: boolean;
};

export type WorkshopAudit = {
  /** The audit's product name, e.g. "Brand Authority Audit". */
  name: string;
  /** One line naming exactly what gets reviewed. */
  promise: string;
  /** The material the attendee submits. */
  intake: AuditIntakeField[];
  /** The single prescribed outcome the morning is aimed at. */
  prescribedOutcome: string;
  /** The measurable improvement the audit sets the target for. */
  improvement: string;
};

/** Same words on every workshop — one artifact, or we keep going. */
export const WORKSHOP_GUARANTEE = {
  headline: "You leave with it, or we keep working with you until you do.",
  body:
    "Your audit names one outcome for your morning. If you walk out without it, we keep working with you at no additional cost until it exists — one follow-up working session plus the group channel, redeemable within 30 days of your session.",
  short: "Leave with it, or we keep working with you until you do.",
};

export const AUDIT_STEPS = [
  {
    label: "Audit",
    body:
      "You send the real material for your lane. Forty-eight hours before the morning, you get a graded expert audit of it — every one of the ten problems below scored against your own work.",
  },
  {
    label: "The morning",
    body:
      "We work the audit top down, worst grade first, building the real thing with you in the room at the IGNITE Center.",
  },
  {
    label: "The outcome",
    body:
      "You leave with the one named artifact your audit prescribed — live, in your hands, yours to keep.",
  },
];

export const WORKSHOP_AUDITS: Record<string, WorkshopAudit> = {
  "brand-identity": {
    name: "Brand Authority Audit",
    promise:
      "We grade your logo, color, type, and the last five things you published against what your buyer decides in three seconds.",
    intake: [
      { key: "logo_files", label: "Your logo files", help: "Whatever you have — the original file, a screenshot, or a photo of the sign.", kind: "files", required: true },
      { key: "brand_colors", label: "The colors and fonts you use now", help: "Hex codes if you have them, otherwise name them.", kind: "text" },
      { key: "recent_published", label: "The last five things you published", help: "Links or files — posts, flyers, a deck, packaging, your email signature.", kind: "longtext", required: true },
      { key: "one_sentence", label: "How you describe what you do", help: "Exactly how you say it out loud, not how you wish it sounded.", kind: "text", required: true },
      { key: "competitors", label: "Three competitors buyers compare you to", help: "Names or links.", kind: "text" },
    ],
    prescribedOutcome:
      "A brand system — voice, palette, type, and usage rules — chosen in the room and applied to your three most visible surfaces before you leave.",
    improvement: "quote higher without flinching, because the brand carries the number",
  },
  "website-that-converts": {
    name: "Website Conversion Audit",
    promise:
      "We grade your live site against the single job it is supposed to do: turn a visitor into a booking.",
    intake: [
      { key: "site_url", label: "Your live site URL", help: "The address you give people.", kind: "url", required: true },
      { key: "money_page", label: "The page that's supposed to convert", help: "Where you expect the booking, the call, or the purchase to happen.", kind: "url", required: true },
      { key: "traffic_reality", label: "Traffic and bookings last month", help: "Rough numbers are fine — visitors, and how many actually contacted you.", kind: "text", required: true },
      { key: "the_action", label: "The one action you want a visitor to take", help: "Book, call, buy, or apply — pick one.", kind: "text", required: true },
      { key: "known_problems", label: "What you already know is wrong with it", help: "Slow, ugly, no price, can't edit it, whatever it is.", kind: "longtext" },
    ],
    prescribedOutcome:
      "A page whose single job is the booking — headline, proof, price, and button rewritten and live before you leave.",
    improvement: "turn the traffic you already have into calls on your calendar",
  },
  "sales-systems": {
    name: "Pipeline & Pricing Audit",
    promise:
      "We grade your price sheet, your pitch, and your last three lost deals against where the money is actually leaking.",
    intake: [
      { key: "price_sheet", label: "Your current prices", help: "The sheet, the quote template, or just type the numbers.", kind: "longtext", required: true },
      { key: "the_pitch", label: "The pitch or proposal you send", help: "Paste the last one you sent, names removed if you like.", kind: "longtext", required: true },
      { key: "lost_deals", label: "The last three deals you lost", help: "What they wanted, what you quoted, what they said.", kind: "longtext", required: true },
      { key: "lead_source", label: "Where your leads come from today", help: "Referrals, walk-ins, ads, one big client — be honest.", kind: "text", required: true },
      { key: "close_rate", label: "Roughly how many quotes turn into work", help: "Out of ten quotes, how many say yes?", kind: "text" },
    ],
    prescribedOutcome:
      "A priced offer you can say out loud, the script that carries it, and the first message sent to a real prospect before you leave.",
    improvement: "stop discounting and stop getting ghosted after the quote",
  },
  "email-crm-automation": {
    name: "Follow-Up Audit",
    promise:
      "We grade every sequence, list, and lead record you have against the follow-up you are currently not sending.",
    intake: [
      { key: "email_tool", label: "The email or CRM tool you use", help: "Or say 'none' — that's an answer too.", kind: "text", required: true },
      { key: "sequences", label: "The sequences running right now", help: "Paste them or describe them. Include the ones you set up and forgot.", kind: "longtext", required: true },
      { key: "list_size", label: "List size and last send date", help: "How many people, and when you last mailed them.", kind: "text", required: true },
      { key: "lead_handling", label: "What happens after someone inquires", help: "Walk us through it exactly as it happens today.", kind: "longtext", required: true },
      { key: "deliverability", label: "Anything landing in spam", help: "If you know, tell us. If you don't, say so.", kind: "text" },
    ],
    prescribedOutcome:
      "A follow-up sequence written, loaded, and sending from your own tool before you leave.",
    improvement: "stop losing leads that were already interested",
  },
  "social-presence": {
    name: "Channel & Presence Audit",
    promise:
      "We grade your handles and your last thirty posts against where your buyers actually are.",
    intake: [
      { key: "handles", label: "Your handles", help: "Every account you have, even the abandoned ones.", kind: "longtext", required: true },
      { key: "recent_posts", label: "What you've posted in the last 90 days", help: "Links, or tell us roughly how often and what about.", kind: "longtext", required: true },
      { key: "buyer", label: "Who you're trying to reach", help: "Be specific — age, place, what they're shopping for.", kind: "text", required: true },
      { key: "capacity", label: "Hours a week you can realistically post", help: "The honest number, not the ambitious one.", kind: "text", required: true },
      { key: "what_worked", label: "Anything that ever got traction", help: "One post, one reel, one comment thread.", kind: "text" },
    ],
    prescribedOutcome:
      "One chosen channel, a posting rhythm you can hold, and the first two weeks of posts written and scheduled before you leave.",
    improvement: "post consistently and have it reach the people who buy",
  },
  "content-engine": {
    name: "Buyer Question Audit",
    promise:
      "We grade everything you've published against the questions your buyers actually type and ask.",
    intake: [
      { key: "published", label: "What you've published", help: "Blog, videos, guides, newsletters — links or a list.", kind: "longtext", required: true },
      { key: "repeat_questions", label: "The questions buyers ask you over and over", help: "The ones you're tired of answering. Those are the gold.", kind: "longtext", required: true },
      { key: "site_url", label: "Where your content lives", help: "Your site or channel URL.", kind: "url" },
      { key: "search_reality", label: "Whether anyone finds you by search", help: "Yes, no, or you have no idea — all fine.", kind: "text", required: true },
      { key: "capacity", label: "How much you can publish per month", help: "The realistic number.", kind: "text" },
    ],
    prescribedOutcome:
      "The buyer-question list that drives your publishing, and the first piece written and published before you leave.",
    improvement: "get found by people already searching for what you sell",
  },
  "ai-operating-system": {
    name: "Founder Hours Audit",
    promise:
      "We grade your week against the repetitive work a machine should already be doing for you.",
    intake: [
      { key: "time_sinks", label: "The tasks eating the most hours each week", help: "List them with rough hours. Quotes, scheduling, invoices, DMs, whatever it is.", kind: "longtext", required: true },
      { key: "tools_paid", label: "Tools you already pay for", help: "Everything with a monthly charge, even the unused ones.", kind: "longtext", required: true },
      { key: "repeat_docs", label: "Documents you rewrite from scratch", help: "Quotes, proposals, onboarding emails, reports.", kind: "longtext", required: true },
      { key: "bottleneck", label: "What only you can do right now", help: "The thing that stops when you stop.", kind: "text", required: true },
      { key: "hours_week", label: "Hours you work in a typical week", help: "Including the Sunday ones.", kind: "text" },
    ],
    prescribedOutcome:
      "Your three biggest time sinks automated and running live in your own accounts before you leave.",
    improvement: "get back the hours you're currently spending on work a machine can do",
  },
  "legal-financial-ops": {
    name: "Entity & Books Audit",
    promise:
      "We grade your entity status, your contracts, and how your books are kept against what actually protects you.",
    intake: [
      { key: "entity_status", label: "Your entity status", help: "LLC, sole proprietor, nothing yet — and which state.", kind: "text", required: true },
      { key: "contracts", label: "The contracts you use", help: "Upload them, or say 'handshakes and texts' if that's the truth.", kind: "files", required: true },
      { key: "bookkeeping", label: "How you keep your books", help: "Tool, spreadsheet, shoebox, or your bank app.", kind: "text", required: true },
      { key: "banking", label: "Whether business and personal money are separate", help: "Yes, no, or mostly.", kind: "text", required: true },
      { key: "tax_worry", label: "What you're most worried about at tax time", help: "Say it plainly.", kind: "longtext" },
    ],
    prescribedOutcome:
      "Your entity filing prepared, your client contract signed-ready, and your books opened and reconciled to today before you leave.",
    improvement: "stop carrying personal risk for business work",
  },
};

export function getWorkshopAudit(slug: string): WorkshopAudit | undefined {
  return WORKSHOP_AUDITS[slug];
}
