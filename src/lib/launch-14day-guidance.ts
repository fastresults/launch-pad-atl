// Per-day facilitator guidance used by the Day Sprint Deck. Keep the tone
// tight and specific — this is what the founder reads over their morning
// coffee before starting the day.

export type DayGuidance = {
  why: string;
  suggestedSchedule: string;
  pitfalls: string[];
};

export const DAY_GUIDANCE: Record<number, DayGuidance> = {
  1: {
    why: "Today decides how everyone downstream — customers, investors, teammates, AI copilots — will hear your story. A fuzzy concept costs you refunds, redos, and ad spend for the next 13 days.",
    suggestedSchedule: "Morning: draft your one-page story and what you stand for. Midday: rewrite the one-liner until a stranger can repeat it. Afternoon: lock the tool stack and create the accounts.",
    pitfalls: [
      "Writing for investors instead of buyers — buyers pay first.",
      "Skipping the tool setup because it feels tangential; you'll pay for that on Day 6.",
      "Trying to be everything to everyone — pick one buyer, one job.",
    ],
  },
  2: {
    why: "A concept without a price is a hobby. Today makes it buyable, so tomorrow's demand test is real money vs. real money.",
    suggestedSchedule: "Morning: draft the one sentence for why customers pick you. Midday: set headline price + 3 tiers. Afternoon: tune 25 prompts against your real workflow.",
    pitfalls: [
      "Under-pricing because you're scared — you can always discount, you can't always raise.",
      "Endless option-adding — three tiers, one recommended.",
      "Messaging that reads pretty but doesn't sell — test every line on a real prospect.",
    ],
  },
  3: {
    why: "Personas without names are astrology. Fifty named humans in a CRM is the difference between guessing and selling.",
    suggestedSchedule: "Morning: define 2 sharp personas. Midday: build the First-50 list with real names, companies, angles. Afternoon: land them into a CRM pipeline with stages.",
    pitfalls: [
      "Persona theater — TAM slides instead of five people you could DM tonight.",
      "Skipping the 'angle' column — generic outreach converts at zero.",
      "Using a spreadsheet forever; move to a real CRM today, even the free tier.",
    ],
  },
  4: {
    why: "The market votes with money before it votes with opinions. A 48-hour pre-sell tells you whether to build or pivot — before you sink two weeks.",
    suggestedSchedule: "Morning: draft the pre-sell offer + guarantee. Midday: generate the build brief for your pre-sell page and paste it into Lovable/v0/Bolt to scaffold the page. Afternoon: personally message every First-50 contact.",
    pitfalls: [
      "Asking for interest instead of a deposit — 'interested' means no.",
      "Hiding behind a landing page — DM 50 humans yourself.",
      "Reading rejection as failure; it's the map.",
    ],
  },
  5: {
    why: "You will not out-market a bigger competitor. You can out-wedge them. Today you commit to the one narrow thing only you can own.",
    suggestedSchedule: "Morning: run a competitive scan and pick 3 real alternatives. Midday: write one positioning sentence. Afternoon: pressure-test it against each alt.",
    pitfalls: [
      "Positioning against 'no one else does this' — usually means no one wants it.",
      "Trying to own 3 wedges — you'll own zero.",
      "Vague adjectives (best, smarter, easier) — swap for specific verbs.",
    ],
  },
  6: {
    why: "By tonight you should have a repeatable machine: a script, a link, a recording. This is the day your growth stops depending on inspiration.",
    suggestedSchedule: "Morning: GTM plan + sales playbook. Midday: booking link + recording stack live. Afternoon: send outbound to the First-50. Physical products: score suppliers and open outreach.",
    pitfalls: [
      "Perfecting scripts before sending — v1 outbound today beats v3 next week.",
      "Not turning on call recording — you'll lose the exact objection language you need.",
      "Physical: shortlisting suppliers you haven't emailed. Send inquiries today.",
    ],
  },
  7: {
    why: "By Day 8 you'll paste this voice into legal, checkout, email, and site copy. If it's not locked today, every downstream surface sounds like a different company.",
    suggestedSchedule: "Morning: brand strategy + messaging house. Midday: voice & tone guide with do/don't examples. Afternoon: rewrite Day 2 offer sheet in the new voice.",
    pitfalls: [
      "Corporate-safe voice — safe is invisible.",
      "Skipping the 'don't say' list — that's what actually protects the voice.",
      "Not showing the guide to one real customer — they'll spot fake tone in ten seconds.",
    ],
  },
  8: {
    why: "You can't take money you can't legally receive. Today's paperwork unlocks banking, checkout, contracts, and sleep.",
    suggestedSchedule: "Morning: choose entity + file (or start the filing). Midday: ToS/Privacy/Refund pack live on the site. Afternoon: quote insurance for your risk profile.",
    pitfalls: [
      "Copy-pasting a generic ToS that doesn't match your actual product.",
      "Skipping insurance because you're 'small' — first claim is when you learn otherwise.",
      "Choosing entity based on Twitter takes instead of your CPA + state.",
    ],
  },
  9: {
    why: "A live checkout link is the single most important artifact you own. Today revenue can finally land in a real account with real books behind it.",
    suggestedSchedule: "Morning: Stripe (or Paddle) live payment link. Midday: business bank + accounting tool connected. Afternoon: send yourself a $1 test transaction end-to-end.",
    pitfalls: [
      "Testing with your personal card only — do a real customer flow.",
      "Skipping books until 'later' — 'later' is April 14th.",
      "Turning on subscriptions before you've sold a one-off — walk, then run.",
    ],
  },
  10: {
    why: "By tonight you own your address bar, land in inboxes, and can prove which channel converts. Without this, tomorrow's site launch is invisible.",
    suggestedSchedule: "Morning: domain + DNS + email deliverability. Midday: GA4 + pixels + conversion events. Afternoon: connect email marketing tool and warm the sending domain.",
    pitfalls: [
      "Forgetting SPF/DKIM — you'll land in spam and blame the copy.",
      "Firing every pixel and no events — track outcomes, not pageviews.",
      "Buying a clever domain that customers can't spell out loud.",
    ],
  },
  11: {
    why: "The site is your storefront, your resume, your sales rep — running 24/7. Today you hand your builder a real PRD, not a Pinterest board.",
    suggestedSchedule: "Morning: website PRD with sections, copy blocks, and CTAs. Midday: visual identity brief. Afternoon: generate logo + favicon + OG image pack and push live.",
    pitfalls: [
      "Designing the About page before the Buy page.",
      "Skipping the OG image — every share looks broken without it.",
      "Endless font/color rounds — pick, ship, iterate after real traffic.",
    ],
  },
  12: {
    why: "Order #1 will hit soon. Today you prove you can actually deliver it — with a support bot handling the easy stuff and automations handling the repeatable stuff.",
    suggestedSchedule: "Morning: fulfillment SOP + support starter. Midday: AI support bot on the site. Afternoon: 5 automations live. Physical: BOM + landed cost + break-even locked.",
    pitfalls: [
      "Automating a broken process — write the SOP first, automate second.",
      "Support bot that answers everything vaguely — narrow scope beats wide.",
      "Physical: forgetting landed cost (duties, freight, returns) — margin dies here.",
    ],
  },
  13: {
    why: "Launches with no follow-through fizzle by Wednesday. Today loads 30 posts, a launch kit, and a Monday rhythm that keeps you shipping when the dopamine drops.",
    suggestedSchedule: "Morning: launch content kit (announcement, teasers, thread). Midday: 90-day content calendar queued. Afternoon: install founder operating cadence and pick your Monday plan.",
    pitfalls: [
      "One heroic launch post and nothing scheduled behind it.",
      "Ignoring your audit — you're posting into the wrong channel.",
      "Cadence too heavy — pick one weekly ritual you'll actually keep.",
    ],
  },
  14: {
    why: "Launch day. You've been rehearsing for 13 days. Today ads run, reviews get captured, referral links get shared — and the first paying customer gets logged.",
    suggestedSchedule: "Morning: paid ads + creative pack live. Midday: DM Day 4 pre-sell buyers for reviews and referrals. Afternoon: check the financial model against reality; celebrate first cash.",
    pitfalls: [
      "Launching quietly to no one — tell the First-50 twice.",
      "Skipping reviews on day one — you'll never have this much attention again.",
      "Not logging the first sale in your CRM + books — set the reflex now.",
    ],
  },
};

export function guidanceFor(day: number): DayGuidance {
  return (
    DAY_GUIDANCE[day] ?? {
      why: "This day matters because everything downstream inherits what you decide here.",
      suggestedSchedule:
        "Morning: read the Introduction and Education assets. Midday: configure the Tracking assets. Afternoon: ship the Action assets — smallest working version first.",
      pitfalls: [
        "Chasing perfect instead of shipping v1.",
        "Skipping the boring setup — it's what makes the rest compound.",
        "Working alone all day — get one piece of real feedback before you close the laptop.",
      ],
    }
  );
}

export const HOW_TO_COMPLETE: Record<string, string> = {
  Introduction:
    "Read the generated asset end-to-end. Rewrite anything that doesn't sound like you. Save the final line as the version you'll repeat out loud this week.",
  Education:
    "Skim once for the whole. Re-read the section that maps to what you'll do next. Copy the 3 highest-leverage moves into your notes.",
  Tracking:
    "Set it up in the tool it lives in. Enter your first real row today. Add a check to your weekly cadence.",
  Action:
    "Block a focused session. Follow the checklist inside the asset. Ship the smallest working version — not the perfect one.",
};
