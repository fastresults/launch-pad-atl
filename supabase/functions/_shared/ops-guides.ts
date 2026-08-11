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


/**
 * Second authoring pass: the steps that had no guide. Same shape, same rules —
 * plain verbs, no jargon, and an honest read on how badly the business needs it.
 */
export const OPS_GUIDES_EXTRA: Record<string, OpsGuide> = {
  // ── Strategy & proof ────────────────────────────────────────────────
  wedge: {
    how: [
      "Name the one customer type you can win fastest — not the biggest market, the easiest yes.",
      "Write the single sentence that makes them feel understood.",
      "Kill every other audience from this quarter's plan. You can add them back later.",
    ],
    needs: ["What you heard from real buyers this week"],
    minutes: 60,
    criticality: "required_to_sell",
    unlocks: ["outreach", "icp", "capture-funnel"],
  },
  evidence: {
    how: [
      "Collect anything real: a screenshot of a reply, a waitlist count, a paid deposit.",
      "Write one line under each: what it proves about demand.",
      "Put the three strongest on your site and in your outreach.",
    ],
    minutes: 45,
    criticality: "required_to_sell",
  },
  "three-sources": {
    how: [
      "Pick three ways leads reach you — for example referrals, one channel, and direct outreach.",
      "Write the weekly action that feeds each one.",
      "If you can't name the action, the source isn't real yet. Replace it.",
    ],
    minutes: 45,
    criticality: "required_to_sell",
    unlocks: ["lead-sources", "funnel-read"],
  },
  "presell-live": {
    how: [
      "Publish the offer with a real price and a real way to say yes.",
      "Send it to ten people who already know you.",
      "Log every reply — yes, no, and the reason — in your CRM.",
    ],
    needs: ["Your priced offer", "A live booking or payment link"],
    minutes: 90,
    criticality: "required_to_sell",
  },
  "site-proof": {
    how: [
      "Add your strongest proof above the fold: a result, a name, or a number.",
      "Check the page on a phone before you call it done.",
      "Make sure every page has one obvious next action.",
    ],
    minutes: 60,
    criticality: "required_to_sell",
  },
  "voice-adopted": {
    how: [
      "Read your last five posts and emails against the voice guide.",
      "Fix anything that sounds like a different company.",
      "Share the guide with anyone who writes on your behalf.",
    ],
    needs: ["Your brand voice guide"],
    minutes: 45,
    criticality: "growth",
  },

  // ── Legal & governance ──────────────────────────────────────────────
  nda: {
    how: [
      "Use one mutual NDA template — don't collect variants.",
      "Have a lawyer or a reputable template service review it once.",
      "Store the signed copies in one folder named by counterparty.",
    ],
    minutes: 60,
    criticality: "required_to_operate",
    unlocks: ["contractor-agreement", "first-hire"],
  },
  "contractor-agreement": {
    how: [
      "Start from a standard independent-contractor agreement for your state.",
      "Fill in scope, rate, payment terms, and who owns the work product — that last one matters most.",
      "Send it for signature before any contractor starts, not after.",
    ],
    needs: ["Your entity name and address", "Your e-sign tool"],
    minutes: 75,
    criticality: "required_to_operate",
    unlocks: ["first-hire"],
  },
  esign: {
    how: [
      "Pick one e-sign tool and connect it to your business email.",
      "Upload your agreement and proposal as reusable templates.",
      "Send yourself a test document and sign it end to end.",
    ],
    minutes: 45,
    criticality: "required_to_operate",
    unlocks: ["first-close"],
  },
  auth: {
    how: [
      "Decide who can log into what: site, CRM, books, bank.",
      "Turn on two-factor everywhere money or customer data lives.",
      "Put every credential in the password manager — never in a text message.",
    ],
    minutes: 60,
    criticality: "required_to_operate",
  },
  "sales-tax": {
    how: [
      "Check whether your state taxes what you sell — services and products differ.",
      "Register for a sales-tax permit if you owe it, before your first invoice.",
      "Set the tax rate inside QuickBooks so invoices calculate it for you.",
    ],
    needs: ["Your EIN", "Your state revenue department login"],
    minutes: 90,
    criticality: "required_to_operate",
    unlocks: ["cash-reconcile"],
  },
  "cash-reconcile": {
    how: [
      "Open QuickBooks and match every bank transaction to a category.",
      "Chase anything unmatched the same day — that's where errors hide.",
      "Do this weekly. Monthly means a bad afternoon instead of ten minutes.",
    ],
    needs: ["Bank feed connected to QuickBooks"],
    minutes: 45,
    criticality: "required_to_operate",
  },

  // ── CRM & pipeline ──────────────────────────────────────────────────
  "crm-fields": {
    how: [
      "List the five things you actually need to know about a lead: source, offer, budget, timeline, next step.",
      "Create exactly those custom fields in GoHighLevel. Resist adding more.",
      "Make source and next step required so nothing goes dark.",
    ],
    needs: ["Your GoHighLevel sub-account"],
    minutes: 45,
    criticality: "required_to_sell",
    unlocks: ["crm-automation", "crm-reporting", "lead-score"],
  },
  "pipeline-stages": {
    how: [
      "Name stages after what the buyer did, not what you did: Enquired, Call booked, Proposal out, Won, Lost.",
      "Build them in GoHighLevel in that order.",
      "Write the one action that moves a deal out of each stage.",
    ],
    minutes: 45,
    criticality: "required_to_sell",
    unlocks: ["crm-reporting", "close-rate", "funnel-read"],
  },
  "crm-automation": {
    how: [
      "Automate three things only: new lead gets an instant reply, booked call gets a reminder, lost deal gets tagged.",
      "Build each as its own workflow so you can switch one off without breaking the rest.",
      "Run a test lead through and watch every message land.",
    ],
    needs: ["Pipeline stages built", "Your booking link"],
    minutes: 120,
    criticality: "required_to_sell",
    unlocks: ["nurture", "sequence"],
  },
  "crm-reporting": {
    how: [
      "Build one dashboard: leads this week, calls booked, proposals out, revenue won.",
      "Set it as your CRM home screen.",
      "Check it at the same time every week — Friday morning works.",
    ],
    minutes: 60,
    criticality: "required_to_sell",
    unlocks: ["funnel-read", "five-numbers"],
  },
  "forms-to-crm": {
    how: [
      "Point every form on your site at GoHighLevel — no orphan inboxes.",
      "Submit each form yourself and confirm the contact appears with the right source tag.",
      "Delete or redirect any old form that still emails you directly.",
    ],
    needs: ["Site admin access", "CRM form or webhook URL"],
    minutes: 60,
    criticality: "required_to_sell",
    unlocks: ["lead-sources", "lead-score"],
  },
  "ghl-tags-lists": {
    how: [
      "Agree on a tag naming rule — source, offer, stage — and write it down.",
      "Create the starting tags and nothing else.",
      "Tag every existing contact before you import anyone new.",
    ],
    minutes: 60,
    criticality: "required_to_sell",
    unlocks: ["segments", "nurture"],
  },
  "ghl-audience-feed": {
    how: [
      "Connect GoHighLevel to your ad accounts so audiences update themselves.",
      "Create one customer audience and one lead audience.",
      "Confirm the sync ran before you spend anything on retargeting.",
    ],
    minutes: 60,
    criticality: "growth",
    unlocks: ["retargeting"],
  },
  segments: {
    how: [
      "Build three lists: never contacted, in conversation, past customers.",
      "Write the one message each segment should get next.",
      "Save them as smart lists so they update on their own.",
    ],
    minutes: 45,
    criticality: "required_to_sell",
    unlocks: ["nurture", "sequence"],
  },
  "list-hygiene": {
    how: [
      "Remove hard bounces and anyone who asked out — immediately, every time.",
      "Merge duplicates by email address.",
      "Set a monthly reminder to do it again.",
    ],
    minutes: 45,
    criticality: "required_to_operate",
  },
  "lead-score": {
    how: [
      "Score on two things only: fit (are they your buyer) and intent (did they act).",
      "Set the rules in GoHighLevel so scoring happens without you.",
      "Agree the score at which you personally reach out.",
    ],
    minutes: 60,
    criticality: "growth",
  },
  "lead-sources": {
    how: [
      "Make sure every contact record has a source — no blanks allowed.",
      "Group sources into the three channels you actually run.",
      "Review monthly and cut the channel that produces nothing.",
    ],
    minutes: 45,
    criticality: "required_to_sell",
  },
  utm: {
    how: [
      "Agree one naming rule: source, medium, campaign, all lowercase.",
      "Build every link with the same builder so nothing drifts.",
      "Check that tagged clicks show up correctly in your CRM before you scale spend.",
    ],
    minutes: 45,
    criticality: "growth",
    unlocks: ["funnel-read", "lead-sources"],
  },

  // ── Funnel & campaign ───────────────────────────────────────────────
  "capture-funnel": {
    how: [
      "One page, one promise, one field. Ask for the email and nothing else.",
      "Deliver the thing they signed up for instantly, automatically.",
      "Send yourself through it on a phone before you drive traffic.",
    ],
    needs: ["Your lead magnet", "CRM form connected"],
    minutes: 120,
    criticality: "required_to_sell",
    unlocks: ["nurture", "ads-live", "retargeting"],
  },
  nurture: {
    how: [
      "Write five emails: welcome, the problem, your proof, the offer, the last call.",
      "Space them across two weeks.",
      "Load them into GoHighLevel and trigger from the capture form.",
    ],
    needs: ["Segments built", "Your proof and offer copy"],
    minutes: 180,
    criticality: "required_to_sell",
  },
  sequence: {
    how: [
      "Write the outreach sequence: first touch, value follow-up, direct ask, break-up.",
      "Personalise the first line of each — everything else can be templated.",
      "Cap it at four touches and then let it go.",
    ],
    minutes: 90,
    criticality: "required_to_sell",
    unlocks: ["first-close"],
  },
  "ads-live": {
    how: [
      "Start with one audience, one creative set, and a budget you'd be fine losing.",
      "Point the ad at the capture funnel, never at the home page.",
      "Give it seven days before you judge it.",
    ],
    needs: ["Capture funnel live", "Approved creative"],
    minutes: 120,
    criticality: "growth",
  },
  retargeting: {
    how: [
      "Confirm the pixel is firing on every page — check it, don't assume.",
      "Build one audience of people who visited but didn't book.",
      "Run a single reminder creative to them with a small daily budget.",
    ],
    minutes: 90,
    criticality: "growth",
  },
  "funnel-read": {
    how: [
      "Write down four numbers: visitors, leads, calls, closes.",
      "Find the biggest drop between two of them.",
      "Fix only that one this week.",
    ],
    minutes: 45,
    criticality: "growth",
  },
  "calendar-loaded": {
    how: [
      "Load the next four weeks of posts into the scheduler in one sitting.",
      "Check that every post uses approved creative.",
      "Leave two slots a week empty for whatever actually happens.",
    ],
    needs: ["Approved content calendar"],
    minutes: 90,
    criticality: "growth",
  },

  // ── Selling & delivering ────────────────────────────────────────────
  "first-close": {
    how: [
      "Send the proposal the same day you have the conversation.",
      "Follow up on day two and day five — most yeses live there.",
      "The moment they agree, send the agreement and the invoice together.",
    ],
    needs: ["Proposal template", "E-sign set up", "QuickBooks invoicing ready"],
    minutes: 120,
    criticality: "required_to_sell",
    unlocks: ["first-proof", "reviews"],
  },
  "close-rate": {
    how: [
      "Count proposals sent and deals won over the last 30 days.",
      "Divide one by the other. That's your rate — write it down.",
      "Read the two you lost and name the real reason.",
    ],
    minutes: 45,
    criticality: "growth",
  },
  "first-proof": {
    how: [
      "Ask your first customer for the specific result, in their words and with a number.",
      "Get written permission to use their name.",
      "Put it on the site and into your outreach the same week.",
    ],
    minutes: 60,
    criticality: "required_to_sell",
    unlocks: ["reviews", "referral"],
  },
  reviews: {
    how: [
      "Ask every finished customer, once, with a direct link.",
      "Ask on the day they're happiest — right after you delivered.",
      "Reply to every review, good or bad.",
    ],
    minutes: 45,
    criticality: "growth",
  },
  referral: {
    how: [
      "Decide what a referrer gets — cash, credit, or a genuine thank you.",
      "Ask your happiest customer by name, not by broadcast.",
      "Make the introduction email easy to forward.",
    ],
    minutes: 60,
    criticality: "growth",
  },
  "onboarding-kit": {
    how: [
      "Write what happens in the first 48 hours after someone pays.",
      "Turn it into one welcome email plus one kickoff checklist.",
      "Automate the send so it never depends on you remembering.",
    ],
    minutes: 90,
    criticality: "required_to_sell",
    unlocks: ["delivery-sop", "support"],
  },
  "delivery-sop": {
    how: [
      "Write the steps you actually took delivering for your first customer.",
      "Note who does each step and how long it took.",
      "Save it where the next person could follow it without asking you.",
    ],
    minutes: 90,
    criticality: "required_to_operate",
    unlocks: ["sop-survives", "first-hire"],
  },
  "sop-survives": {
    how: [
      "Have someone else run the process using only the written steps.",
      "Write down every question they had to ask you.",
      "Answer those in the document. That's the whole test.",
    ],
    minutes: 90,
    criticality: "required_to_operate",
  },
  support: {
    how: [
      "Publish one place customers get help — an inbox or a form, not four channels.",
      "Set the response time you can actually keep and say it out loud.",
      "Route it into the CRM so nothing sits unread.",
    ],
    minutes: 60,
    criticality: "required_to_operate",
  },
  recording: {
    how: [
      "Turn on call recording with consent stated at the top of every call.",
      "Save recordings against the deal in the CRM.",
      "Re-listen to one lost call a week — it's the cheapest sales training there is.",
    ],
    minutes: 30,
    criticality: "growth",
  },

  // ── Creative & brand upkeep ─────────────────────────────────────────
  "creative-refresh": {
    how: [
      "Rank live creative by results and find the bottom third.",
      "Rebuild those from the brand kit — new image, same message discipline.",
      "Log the before and after numbers so you know it worked.",
    ],
    minutes: 120,
    criticality: "growth",
  },
  "brand-audit": {
    how: [
      "List every live surface: site, socials, decks, invoices, email signature.",
      "Check each against the style system — logo, colour, type, tone.",
      "Fix what's off or write down why the exception stays.",
    ],
    needs: ["Your style system export"],
    minutes: 90,
    criticality: "growth",
  },

  // ── Compounding ─────────────────────────────────────────────────────
  "pricing-review": {
    how: [
      "Look at what you charged versus what it cost you to deliver.",
      "Raise the price on the next new customer, not the existing ones.",
      "Write the new price down and use it without apologising.",
    ],
    minutes: 60,
    criticality: "growth",
  },
  "first-hire": {
    how: [
      "Name the job by the outcome you want off your plate, not a title.",
      "Give them the written SOP on day one — if you can't, you're not ready to hire.",
      "Start on a paid trial project with a signed contractor agreement.",
    ],
    needs: ["Delivery SOP written", "Contractor agreement ready"],
    minutes: 180,
    criticality: "growth",
  },
  "quarter-plan": {
    how: [
      "Pick one number to move over the next 90 days.",
      "Name the three things you'll do to move it and the things you'll stop.",
      "Put the review date on the calendar now.",
    ],
    minutes: 90,
    criticality: "growth",
  },
};

/** Look up the guide for a catalog task_key like "day-9.qbo-company" or "post.first-close". */
export function guideFor(taskKey: string): OpsGuide | null {
  const slug = taskKey.includes(".") ? taskKey.slice(taskKey.indexOf(".") + 1) : taskKey;
  return OPS_GUIDES[slug] ?? OPS_GUIDES_EXTRA[slug] ?? null;
}
