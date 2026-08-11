// Plain-language "how to do it" for the highest-friction runway steps.
//
// Keyed by the bare slug (the part of task_key after the dot), because slugs are
// unique across the catalog. Anything not listed falls back to `why` +
// `done_when`, which already read well on their own.

import type { OpsCriticality } from "./ops-guide-fallback.ts";

export type OpsGuide = {
  /** 3–5 numbered steps a first-time founder can literally follow. */
  how: string[];
  /** What to have in hand before starting. */
  needs?: string[];
  /** Rough time on task, in minutes. */
  minutes?: number;
  /** How badly the business needs this to actually run. Overrides the derived value. */
  criticality?: OpsCriticality;
  /** Slugs of later steps this one gates, so the founder sees the cost of skipping it. */
  unlocks?: string[];
};

export const OPS_GUIDES: Record<string, OpsGuide> = {
  // ── Week 1: prove it ────────────────────────────────────────────────
  "one-liner": {
    how: [
      "Write: 'We help [who] get [result] without [the annoying part].'",
      "Say it out loud to three people who are not in your industry.",
      "Cut every word they had to ask about.",
      "Paste the final sentence into your notes — everything else inherits it.",
    ],
    minutes: 30,
  },
  "ai-stack": {
    how: [
      "Pick one writing tool, one image tool, and one place to keep notes.",
      "Create the accounts with your business email, not a personal one.",
      "Save every login into a password manager you actually use.",
      "Stop shopping. You can change tools in 90 days, not this week.",
    ],
    needs: ["A business email address"],
    minutes: 45,
  },
  price: {
    how: [
      "Write down what a customer gets, not the hours it takes you.",
      "Find three competitor prices and place yourself deliberately above or below.",
      "Pick one headline number you can say out loud without flinching.",
      "Add a deposit amount and payment terms (for example 50% up front, net 15).",
    ],
    minutes: 60,
  },
  "offer-sheet": {
    how: [
      "One page: the promise, what's included, what's not, the price, the next step.",
      "Use the wording from your one-liner at the top.",
      "Send it to one friendly buyer and ask 'what's confusing here?'",
      "Fix the confusing part and save it as a PDF you can send in a text.",
    ],
    needs: ["Your headline price"],
    minutes: 60,
  },
  angles: {
    how: [
      "List the three reasons people say no to buying what you sell.",
      "Write one sentence that answers each objection with proof, not opinion.",
      "Choose the angle you can back up best this week and lead with it.",
    ],
    minutes: 30,
  },
  "booking-link": {
    how: [
      "Create a calendar link with 30-minute slots and a 2-hour buffer before the first one.",
      "Ask only three questions on the booking form: name, what they need, phone.",
      "Turn on email and text reminders.",
      "Book a slot yourself to see exactly what the customer sees.",
    ],
    minutes: 30,
  },
  scripts: {
    how: [
      "Write the first 20 seconds of the call word for word.",
      "List five questions you ask before you ever mention price.",
      "Write the exact sentence you use to state the price and then stop talking.",
      "Practice it once out loud before your first real call.",
    ],
    minutes: 45,
  },
  "first-25": {
    how: [
      "Open your phone contacts and pick 25 people who know your work.",
      "Write one short message — no pitch, one specific ask.",
      "Send them personally over two days, not in a blast.",
      "Log every reply so nothing falls through.",
    ],
    minutes: 90,
  },

  // ── Creative sign-off ───────────────────────────────────────────────
  "logo-signoff": {
    how: [
      "Open the Creative sign-off tab and look at the mark at real size, on a phone.",
      "Check it reads on both a light and a dark background.",
      "Approve it, or ask for changes with one specific note.",
      "Once approved, download the file pack and stop using older versions.",
    ],
    minutes: 20,
  },
  "color-type-lock": {
    how: [
      "Pick the final primary color, one accent, and two typefaces.",
      "Write the hex codes down in the style system so nobody guesses later.",
      "Check the text passes contrast on your actual background color.",
    ],
    minutes: 30,
  },
  "style-system": {
    how: [
      "Export the style system from the Brand Studio.",
      "Send it to anyone who will ever design something for you.",
      "Save the CSS file with whoever builds your website.",
    ],
    minutes: 15,
  },
  "asset-pack": {
    how: [
      "Export logo files in both print and web formats, light and dark.",
      "Add the business card, letterhead, and social covers to the same folder.",
      "Share one link to that folder — never email loose files again.",
    ],
    minutes: 30,
  },
  photography: {
    how: [
      "List the five photos you actually need: you, the work, the result, the space, the team.",
      "Shoot them on a phone near a window, or book two hours with a local photographer.",
      "Replace every placeholder image on your site with a real one.",
    ],
    minutes: 120,
  },
  "identity-sweep": {
    how: [
      "Open every place your business shows up: site, socials, invoices, email signature.",
      "Replace old logos, old colors, and old phone numbers.",
      "Screenshot each surface as proof it's consistent.",
    ],
    minutes: 60,
  },

  // ── Legal and governance ────────────────────────────────────────────
  "entity-filed": {
    how: [
      "Choose the entity type your accountant recommends (usually an LLC to start).",
      "Check your business name is available in your state's registry.",
      "File online with your Secretary of State and pay the fee.",
      "Save the stamped filing PDF — banks and QuickBooks will ask for it.",
    ],
    needs: ["Your legal business name", "A business address", "A card for the filing fee"],
    minutes: 60,
  },
  ein: {
    how: [
      "Go to the IRS EIN application (it's free — never pay a third party).",
      "Apply as the responsible party using your filed entity name.",
      "Download the CP-575 confirmation letter immediately; it's hard to get again.",
    ],
    needs: ["Filed entity paperwork", "Your SSN or ITIN"],
    minutes: 20,
  },
  agent: {
    how: [
      "Name a registered agent with a real street address in your state.",
      "If that's you, be sure someone is there during business hours.",
      "Otherwise pay a service — it's usually about $100–150 a year.",
    ],
    minutes: 20,
  },
  "operating-agreement": {
    how: [
      "Write who owns what percentage and who can sign contracts.",
      "Say what happens if a partner leaves or wants to sell.",
      "Sign it, date it, and store it with the filing paperwork.",
    ],
    minutes: 60,
  },
  "msa-drafted": {
    how: [
      "Start from the master services agreement in your asset library.",
      "Fill in scope, payment terms, and how either side ends the deal.",
      "Have a lawyer read it once — one hour now saves a year later.",
    ],
    minutes: 60,
  },
  "msa-executed": {
    how: [
      "Send the agreement for e-signature, not as an email attachment.",
      "Countersign the same day it comes back.",
      "File the signed copy where you can find it in ten seconds.",
    ],
    minutes: 20,
  },
  "tos-privacy": {
    how: [
      "Publish terms of service and a privacy policy on your website.",
      "Say plainly what data you collect and how someone can ask you to delete it.",
      "Link both from the footer of every page.",
    ],
    minutes: 45,
  },
  insurance: {
    how: [
      "Get quotes for general liability, plus professional liability if you advise clients.",
      "Match the coverage limits your customers' contracts require.",
      "Save the certificate of insurance — clients will request it.",
    ],
    minutes: 45,
  },

  // ── Money and QuickBooks Online ─────────────────────────────────────
  bank: {
    how: [
      "Book an appointment or apply online with your EIN and filing paperwork.",
      "Open a checking account in the business's legal name.",
      "Order a debit card and turn on online access.",
      "Move a small starting balance in and never mix it with personal money.",
    ],
    needs: ["EIN letter", "Filed entity paperwork", "ID"],
    minutes: 60,
  },
  "separate-spend": {
    how: [
      "Move every business subscription onto the business card.",
      "Stop using personal accounts for business spend — starting today.",
      "Record any money you personally put in as an owner contribution.",
    ],
    minutes: 45,
  },
  processor: {
    how: [
      "Turn on card and bank payments inside your invoicing tool.",
      "Verify your business details and connect the business bank account.",
      "Run one real $1 charge to yourself and refund it.",
    ],
    minutes: 45,
  },
  "qbo-company": {
    how: [
      "Start a QuickBooks Online subscription and create the company file.",
      "Enter the legal name, EIN, address, and fiscal year.",
      "Choose the accounting method your accountant told you to use (usually cash).",
    ],
    needs: ["EIN letter", "Legal business name"],
    minutes: 30,
  },
  "qbo-bank-feed": {
    how: [
      "In QuickBooks, go to Transactions and connect your business bank and card.",
      "Log in through the bank connection screen and authorize the feed.",
      "Confirm the last 30 days of transactions actually appear.",
    ],
    needs: ["Business bank login"],
    minutes: 30,
  },
  "qbo-coa": {
    how: [
      "Open the chart of accounts and delete categories you'll never use.",
      "Add the revenue categories that match your offer sheet.",
      "Add the three or four expense categories where your money really goes.",
    ],
    minutes: 45,
  },
  "qbo-bank-rules": {
    how: [
      "For each recurring charge, create a rule that categorizes it automatically.",
      "Run the rules on the existing feed and fix anything miscategorized.",
      "Aim for fewer than ten transactions a week that need your attention.",
    ],
    minutes: 45,
  },
  "qbo-items": {
    how: [
      "Create a product or service item for every line on your offer sheet.",
      "Set the default price and the income account for each one.",
      "Now invoices assemble themselves instead of being retyped.",
    ],
    minutes: 30,
  },
  "qbo-invoice": {
    how: [
      "Open invoice settings and upload your approved logo.",
      "Set your brand color, payment terms, deposit, and late fee.",
      "Send one test invoice to yourself and look at it on a phone.",
    ],
    needs: ["Approved logo files"],
    minutes: 30,
  },
  "qbo-payments": {
    how: [
      "Apply for QuickBooks Payments and complete the business verification.",
      "Turn on card and ACH on the invoice template.",
      "Pay a test invoice yourself, then refund it.",
    ],
    minutes: 45,
  },
  "qbo-sales-tax": {
    how: [
      "Answer where you have customers and where you have a physical presence.",
      "Let QuickBooks set the rates for those places.",
      "Register with the state agency if you're required to collect.",
    ],
    minutes: 60,
  },
  "qbo-users": {
    how: [
      "Invite your bookkeeper or accountant as an accountant user.",
      "Pick the day of the month you reconcile and put it on the calendar.",
    ],
    minutes: 15,
  },
  "qbo-baseline": {
    how: [
      "Match every bank feed transaction against the statement.",
      "Resolve anything left over before you close the month.",
      "Save the P&L and Balance Sheet as your starting line.",
    ],
    minutes: 90,
  },
  "book-cadence": {
    how: [
      "Put a recurring 45-minute 'books' block on the same day every week.",
      "Clear the bank feed and chase unpaid invoices in that block.",
      "Close the month within five days of month end.",
    ],
    minutes: 20,
  },

  // ── GoHighLevel and demand ──────────────────────────────────────────
  "crm-live": {
    how: [
      "Pick one CRM and put every lead in it — no spreadsheets on the side.",
      "Enter your five warmest leads today so it's not an empty box.",
      "Set a daily reminder to update it before you close the laptop.",
    ],
    minutes: 45,
  },
  "ghl-subaccount": {
    how: [
      "Create the GoHighLevel sub-account from the agency snapshot.",
      "Fill in the business profile, timezone, and business hours.",
      "Add every user who needs access and set their permissions.",
    ],
    minutes: 45,
  },
  "ghl-pipeline": {
    how: [
      "Create one pipeline with 5–7 stages, named after what the buyer did, not what you did.",
      "Write the one condition that moves a deal into each stage.",
      "Give every stage a single owner.",
    ],
    minutes: 45,
  },
  "ghl-custom-fields": {
    how: [
      "Add fields for source, segment, deal value, next step, and close date.",
      "Make them required so records don't rot.",
      "Backfill them on the deals already in the pipeline.",
    ],
    minutes: 30,
  },
  "ghl-import-first50": {
    how: [
      "Export your first-50 list to a CSV with name, email, phone, and source.",
      "Import into GoHighLevel and map every column.",
      "Tag them by how you know them before you send anything.",
    ],
    minutes: 45,
  },
  "ghl-a2p": {
    how: [
      "Submit the A2P 10DLC brand registration with your EIN and legal name.",
      "Submit the campaign with real sample messages and your opt-in wording.",
      "Buy the number once approved and send yourself a test text.",
    ],
    needs: ["EIN letter", "A live website with a privacy policy"],
    minutes: 60,
  },
  "ghl-email-domain": {
    how: [
      "Add your sending domain in GoHighLevel.",
      "Copy the DNS records into your domain registrar.",
      "Wait for SPF, DKIM, and DMARC to show as verified, then send a test.",
    ],
    needs: ["Access to your domain's DNS"],
    minutes: 45,
  },
  "ghl-funnel": {
    how: [
      "Build the funnel: landing page, form, thank-you page, delivery email.",
      "Use your approved logo, colors, and one real photo.",
      "Walk through it yourself on a phone before you send traffic.",
    ],
    minutes: 90,
  },
  "ghl-form-mapping": {
    how: [
      "Wire the form to create both a contact and an opportunity.",
      "Capture the source and UTM values onto the record.",
      "Submit a test lead and confirm it lands in the right pipeline stage.",
    ],
    minutes: 45,
  },
  "ghl-nurture-workflow": {
    how: [
      "Turn on a five-email welcome sequence with a clear trigger.",
      "Set the exit condition so buyers stop getting sold to.",
      "Read every email out loud before you enable it.",
    ],
    minutes: 90,
  },
  "ghl-attribution": {
    how: [
      "Agree one UTM naming convention and write it down.",
      "Tag every link you post with it.",
      "Check that the values show up in GoHighLevel reporting.",
    ],
    minutes: 30,
  },
  "ghl-calendar": {
    how: [
      "Connect the calendar to your real Google or Outlook availability.",
      "Set reminders at 24 hours and 1 hour.",
      "Put the booking link in your email signature and site header.",
    ],
    minutes: 30,
  },
  "ghl-missed-call": {
    how: [
      "Turn on missed-call text-back with a short, human message.",
      "Route inbound conversations to one inbox somebody actually watches.",
      "Call your own number and let it ring out to test it.",
    ],
    minutes: 20,
  },
  "ghl-stale-automation": {
    how: [
      "Create a rule that flags any opportunity untouched for seven days.",
      "Send the owner a task, not just an email.",
      "Review the flagged list every Monday.",
    ],
    minutes: 30,
  },
  "ghl-dashboard": {
    how: [
      "Build one dashboard: deals by stage, by source, and by owner.",
      "Pin it as your homepage in GoHighLevel.",
    ],
    minutes: 30,
  },
  "ghl-proposal-esign": {
    how: [
      "Build the proposal template with your pricing items.",
      "Turn on e-signature and deposit collection.",
      "Send one to yourself and sign it end to end.",
    ],
    minutes: 45,
  },
  "ghl-to-qbo": {
    how: [
      "Decide how a won deal becomes an invoice: native, Zapier, or a written manual step.",
      "Run one test deal from closed-won all the way to a paid invoice.",
      "Write the fallback down so it works when the automation breaks.",
    ],
    minutes: 60,
  },

  // ── Website and launch ──────────────────────────────────────────────
  domain: {
    how: [
      "Buy the domain in the business's name, not a personal account.",
      "Turn on auto-renew and privacy protection.",
      "Point the DNS at your site host and wait for it to propagate.",
    ],
    minutes: 30,
  },
  email: {
    how: [
      "Set up email on your own domain — no more gmail.com for business.",
      "Create the shared inbox people should actually write to.",
      "Add a signature with your name, phone, and booking link.",
    ],
    minutes: 30,
  },
  analytics: {
    how: [
      "Install analytics on every page of the site.",
      "Mark the form submission and the booking as conversions.",
      "Check that your own test visit shows up.",
    ],
    minutes: 30,
  },
  "site-live": {
    how: [
      "Publish the site on the real domain, with HTTPS on.",
      "Open it on a phone and fix whatever looks broken.",
      "Ask one person outside the business to find your price and book a call.",
    ],
    minutes: 60,
  },
  "lead-magnet": {
    how: [
      "Pick one thing a buyer would happily trade an email for — a checklist, a calculator, a sample.",
      "Make it something you already know cold, so it takes an hour, not a week.",
      "Deliver it instantly by email, not 'we'll be in touch.'",
    ],
    minutes: 90,
  },

  // ── Run it ──────────────────────────────────────────────────────────
  proposal: {
    how: [
      "Build one proposal template you fill in, never rewrite.",
      "Put the price and the next step above the fold.",
      "Give it an expiry date so it can't sit forever.",
    ],
    minutes: 45,
  },
  invoicing: {
    how: [
      "Invoice from QuickBooks the same day the work is agreed.",
      "Take the deposit before work starts, every time.",
      "Set automatic reminders at 3, 7, and 14 days past due.",
    ],
    minutes: 30,
  },
  "first-customer": {
    how: [
      "Pick the warmest person from your first-50 list.",
      "Call them — don't email.",
      "Ask for the sale plainly, then be quiet and listen.",
    ],
    minutes: 30,
  },
  "ten-proposals": {
    how: [
      "Block two hours a day for outreach until ten proposals are out.",
      "Track every one in the pipeline with a next step and a date.",
      "Follow up three times before you call it dead.",
    ],
    minutes: 120,
  },
  "weekly-rhythm": {
    how: [
      "Monday: 30 minutes reviewing the pipeline out loud.",
      "Friday: 30 minutes reviewing the five numbers.",
      "Put both on the calendar as recurring and defend them.",
    ],
    minutes: 60,
  },
  "five-numbers": {
    how: [
      "Pick your five: cash on hand, pipeline value, close rate, cost per lead, revenue booked.",
      "Put them on one page you update weekly — a spreadsheet is fine.",
      "Write the target next to each one.",
    ],
    minutes: 60,
  },
};

/** Look up the guide for a catalog task_key like "day-9.qbo-company" or "post.first-close". */
export function guideFor(taskKey: string): OpsGuide | null {
  const slug = taskKey.includes(".") ? taskKey.slice(taskKey.indexOf(".") + 1) : taskKey;
  return OPS_GUIDES[slug] ?? null;
}
