/**
 * Ten named pains per build workshop — the things a founder in that lane
 * actually feels, each paired with the thing the morning hands them instead.
 *
 * The page's cost section still shows the three sharpest pains from
 * PRODUCT_META. These ten drive the hero rotation and the "Now fixing" caption,
 * and each one carries the prompt its hero image was generated from so the set
 * stays reproducible.
 */
export type WorkshopPain = {
  /** Stable id — also the image filename stem. */
  id: string;
  /** The caption subject, written as the founder would say it. */
  pain: string;
  /** What they leave with instead. */
  fix: string;
  /**
   * The first-person question this pain's photo should put in the visitor's
   * mouth. Typed in the hero chat box while its image is on screen, so the
   * picture, the caption and the question are always the same pain. Optional
   * only while a workshop's premium image pass is still pending.
   */
  question?: string;
  /** The cinematic prompt behind this pain's hero image. */
  imagePrompt: string;
};


const SCENE_STYLE =
  "Cinematic editorial photograph, midnight-navy color grade, deep shadows, single warm practical light source, shallow depth of field, 50mm lens, natural film grain, realistic skin texture, no text, no logos, no readable UI copy, unposed and documentary in feel. Generated on the premium image tier at 1920x1080";

/** Wraps a subject in the shared hero look so every set matches. */
export function scenePrompt(subject: string): string {
  return `${subject}. ${SCENE_STYLE}.`;
}

export const WORKSHOP_PAINS: Record<string, WorkshopPain[]> = {
  /* ─────────── BRAND IDENTITY ─────────── */
  "brand-identity": [
    {
      id: "cheap-first-impression",
      pain: "A first impression that reads cheap",
      fix: "a brand that earns the higher number in three seconds",
      question: "People decide I'm the cheap option before I speak.",
      imagePrompt: scenePrompt(
        "A founder holding two printed business cards side by side under a desk lamp, one visibly cheaper than the other, deciding",
      ),
    },
    {
      id: "cant-raise-prices",
      pain: "Quoting low because the brand can't carry more",
      fix: "the visual authority to quote thirty percent higher without flinching",
      question: "I lower my price every time I send a quote.",
      imagePrompt: scenePrompt(
        "A founder's hand hovering over a printed quote sheet, pen hesitating above the price line, late evening kitchen table",
      ),
    },
    {
      id: "logo-picked-too-fast",
      pain: "A logo picked in an afternoon you already regret",
      fix: "three logo directions with the buyer reasoning behind each",
      question: "I picked my logo in an afternoon and I regret it.",
      imagePrompt: scenePrompt(
        "Crumpled logo printouts scattered across a dim studio desk, one survivor pinned to a corkboard",
      ),
    },
    {
      id: "everything-looks-different",
      pain: "Every asset looking like a different company made it",
      fix: "one written system a freelancer or an AI prompt can follow",
      question: "Everything I make looks like a different company.",
      imagePrompt: scenePrompt(
        "A wall of mismatched printed marketing pieces taped up in a dark studio, a founder standing back looking at the inconsistency",
      ),
    },
    {
      id: "no-words-for-it",
      pain: "Not being able to say what you stand for out loud",
      fix: "one sentence you can say to a stranger and be understood",
      question: "I can't explain what I do in one sentence.",
      imagePrompt: scenePrompt(
        "A founder mid-sentence at a coffee shop table across from one listener, hands open, searching for the right words",
      ),
    },
    {
      id: "invisible-next-to-competitors",
      pain: "Sitting on the shelf next to competitors and disappearing",
      fix: "a position that makes the comparison stop",
      question: "Next to my competitors I just disappear.",
      imagePrompt: scenePrompt(
        "A single product standing among identical unbranded competitors on a dim retail shelf, one warm spotlight",
      ),
    },
    {
      id: "ai-slop-assets",
      pain: "AI output that drifts a little further off-brand every week",
      fix: "a voice guide your prompts inherit automatically",
      question: "Everything AI makes me is almost right, never right.",
      imagePrompt: scenePrompt(
        "A designer at a large monitor at night reviewing a grid of near-identical generated image variations, all subtly wrong",
      ),
    },
    {
      id: "designer-keeps-asking",
      pain: "Answering the same designer question for the fifth time",
      fix: "usage rules tight enough to hand off and walk away",
      question: "My designer asks me the same question every week.",
      imagePrompt: scenePrompt(
        "A phone face-up on a desk showing an unanswered message thread beside an open laptop, late night, warm lamp",
      ),
    },
    {
      id: "rebrand-bill-coming",
      pain: "The rebrand invoice waiting for you in month thirteen",
      fix: "the system built right the first time",
      question: "Am I going to have to pay to redo all of this?",
      imagePrompt: scenePrompt(
        "An invoice envelope unopened on a cluttered desk beside a laptop, warm lamp, early morning",
      ),
    },
    {
      id: "no-color-typography",
      pain: "Picking colors and type by whatever felt nice that day",
      fix: "a palette and type system with rules behind every choice",
      question: "I picked my colors because they looked nice that day.",
      imagePrompt: scenePrompt(
        "Printed color swatch strips and type specimens fanned across a dark table, hands sorting them into two piles",
      ),
    },

  ],

  /* ─────────── WEBSITE THAT CONVERTS ─────────── */
  "website-that-converts": [
    {
      id: "nobody-books",
      pain: "A site nobody books from",
      fix: "a page built around one action, and that action working",
      question: "My site is up and nobody ever books.",
      imagePrompt: scenePrompt(
        "A founder alone at a desk late at night, head in one hand, staring at a laptop, cold coffee beside them, empty dark room",
      ),
    },
    {
      id: "traffic-no-leads",
      pain: "Traffic that arrives and leaves",
      fix: "a first screen that answers the only question a visitor has",
      question: "People show up, look once, and leave.",
      imagePrompt: scenePrompt(
        "A rain-streaked storefront window at night seen from inside the empty shop, blurred pedestrians walking past without stopping",
      ),
    },
    {
      id: "phone-broken",
      pain: "A site that falls apart on a phone",
      fix: "the mobile version built first, in the room",
      question: "On a phone my site is a mess.",
      imagePrompt: scenePrompt(
        "A hand gripping a phone inside a dim parked car at night, screen glow on the fingers, rain on the glass",
      ),
    },
    {
      id: "slow-load",
      pain: "Pages that load slowly enough to lose the click",
      fix: "a page that opens before they change their mind",
      question: "My pages load so slow people give up.",
      imagePrompt: scenePrompt(
        "A thumb hovering over a phone screen mid-load in a dim living room, impatient posture, warm lamp behind",
      ),
    },
    {
      id: "no-headline",
      pain: "A headline that says nothing a buyer cares about",
      fix: "one written and tested against a real stranger",
      question: "I've rewritten my headline twenty times.",
      imagePrompt: scenePrompt(
        "Dozens of scratched-out sticky notes stuck around the bezel of a dark monitor, one lone note at the center, warm lamp raking across",
      ),
    },
    {
      id: "agency-quote",
      pain: "A twelve-thousand-dollar quote for a five-page site",
      fix: "the site built with you before lunch",
      question: "The quote I got for a simple site was insane.",
      imagePrompt: scenePrompt(
        "A thick printed proposal on a wooden desk with one figure circled hard in blue pen, a hand resting flat on the page, low warm light",
      ),
    },
    {
      id: "half-finished",
      pain: "A half-finished site that's been almost-done for six months",
      fix: "one live page with your name on it, published today",
      question: "My site has been almost done for six months.",
      imagePrompt: scenePrompt(
        "A closed dusty laptop on an abandoned desk in a half-finished home office, painter's tape and unhung shelves, hard morning light through blinds",
      ),
    },
    {
      id: "no-proof",
      pain: "No proof on the page that anyone has ever paid you",
      fix: "a proof section built from what you already have",
      question: "Nothing on my page proves anyone has paid me.",
      imagePrompt: scenePrompt(
        "A founder sitting on a dim kitchen floor at night scrolling back through old messages on a phone, face lit by the screen",
      ),
    },
    {
      id: "cant-edit",
      pain: "Needing a developer to change one word",
      fix: "the keys, and the confidence to edit it yourself",
      question: "I need to pay someone to change one word.",
      imagePrompt: scenePrompt(
        "A founder leaning back from an open laptop with both hands lifted off the keyboard, stuck, blank glowing screen, evening home office",
      ),
    },
    {
      id: "no-follow-up",
      pain: "Form submissions that go somewhere and die",
      fix: "the form wired to your inbox and a reply that goes out",
      question: "Someone fills out my form and then nothing happens.",
      imagePrompt: scenePrompt(
        "A phone lying face-up on a nightstand in a pitch-dark bedroom, screen just lit with a single notification",
      ),
    },

  ],

  /* ─────────── SALES SYSTEMS ─────────── */
  "sales-systems": [
    {
      id: "wing-the-call",
      pain: "Winging every sales call",
      fix: "one call script you run the same way every time",
      question: "I wing every sales call and it shows.",
      imagePrompt: scenePrompt(
        "A founder pacing a dim office at night on a phone call, free hand mid-gesture, no notes anywhere",
      ),
    },
    {
      id: "cant-say-price",
      pain: "Flinching when it's time to say the number",
      fix: "a price you can say out loud without apologizing",
      question: "I freeze when it's time to say my price.",
      imagePrompt: scenePrompt(
        "Two people at a small cafe table in low warm light, the founder caught mid-sentence with a hand half-raised, hesitating",
      ),
    },
    {
      id: "ghosted",
      pain: "Getting ghosted after the proposal",
      fix: "a follow-up sequence that runs whether you feel like it or not",
      question: "They go quiet the second I send the proposal.",
      imagePrompt: scenePrompt(
        "A founder's face lit only by a laptop screen late at night in an empty room, waiting, flat with disappointment",
      ),
    },
    {
      id: "discounting",
      pain: "Discounting to close and resenting the work",
      fix: "an offer priced so you don't have to",
      question: "I keep discounting just to get a yes.",
      imagePrompt: scenePrompt(
        "Close on a hand striking a pen through a figure on a printed quote and writing a smaller one below, desk lamp at night",
      ),
    },
    {
      id: "no-pipeline",
      pain: "No idea who's actually close to buying",
      fix: "a one-page pipeline you can read in ten seconds",
      question: "I have no idea who's actually close to buying.",
      imagePrompt: scenePrompt(
        "Index cards spread in a loose grid across a dark table, two hands mid-sort trying to order them, warm lamp",
      ),
    },
    {
      id: "unqualified",
      pain: "Hour-long calls with people who were never going to buy",
      fix: "three qualifying questions asked before the call is booked",
      question: "I waste hours on people who never buy.",
      imagePrompt: scenePrompt(
        "A founder slumped back in a chair in a dim office during a long video call, wall clock behind, late afternoon light dying",
      ),
    },
    {
      id: "no-proposal",
      pain: "Writing every proposal from scratch at midnight",
      fix: "one proposal you fill in and send in ten minutes",
      question: "I'm writing proposals from scratch at midnight.",
      imagePrompt: scenePrompt(
        "A founder typing at a kitchen table at midnight, the house dark behind them, one lamp, papers scattered",
      ),
    },
    {
      id: "objections",
      pain: "Freezing on the same three objections every time",
      fix: "written answers you've already said out loud in the room",
      question: "The same three objections stop me every time.",
      imagePrompt: scenePrompt(
        "Two people across a table mid-negotiation, one leaning back with arms crossed and skeptical, warm low light",
      ),
    },
    {
      id: "referrals-random",
      pain: "Referrals that only happen by luck",
      fix: "one ask, scripted, that you send after every win",
      question: "Referrals only happen to me by accident.",
      imagePrompt: scenePrompt(
        "Two people shaking hands in a doorway at dusk, both backlit by warm interior light, silhouetted",
      ),
    },
    {
      id: "no-close",
      pain: "Ending calls with 'let me send you some info'",
      fix: "a close that asks for the decision",
      question: "I end every call saying I'll send more info.",
      imagePrompt: scenePrompt(
        "A phone just set down face-down on a desk after a call, a hand still resting on it, dim office in the evening",
      ),
    },

  ],

  /* ─────────── EMAIL & CRM AUTOMATION ─────────── */
  "email-crm-automation": [
    {
      id: "leads-in-inbox",
      pain: "Leads living in your inbox until they die there",
      fix: "every lead landing in one system automatically",
      imagePrompt: scenePrompt(
        "An overloaded laptop inbox glowing in a dark room, founder's silhouette leaning back, hands behind head",
      ),
    },
    {
      id: "manual-follow-up",
      pain: "Following up by memory, on a good week",
      fix: "a sequence that follows up whether you remember or not",
      imagePrompt: scenePrompt(
        "A sticky note reading nothing legible, curling off a monitor edge, dust and warm lamp light",
      ),
    },
    {
      id: "no-list",
      pain: "No list — just contacts scattered across three apps",
      fix: "one clean list you actually own",
      imagePrompt: scenePrompt(
        "Three phones and a laptop open on a desk, each showing a different app, hands pinching the bridge of a nose",
      ),
    },
    {
      id: "never-email",
      pain: "Going four months without emailing anyone",
      fix: "a monthly email you can write in twenty minutes",
      imagePrompt: scenePrompt(
        "A dusty calendar on a wall with months untouched, warm slant of window light across it",
      ),
    },
    {
      id: "spam-folder",
      pain: "Emails landing in spam and never knowing",
      fix: "your sending domain set up right, verified in the room",
      imagePrompt: scenePrompt(
        "A phone screen glow in a dark room showing an empty message list, hand holding it loosely",
      ),
    },
    {
      id: "no-welcome",
      pain: "New signups hearing nothing for a week",
      fix: "a welcome sequence that starts the second they join",
      imagePrompt: scenePrompt(
        "An empty doorway with the porch light on at dusk, nobody there to greet",
      ),
    },
    {
      id: "cold-leads",
      pain: "Old leads going cold because nobody touched them",
      fix: "a re-engagement email that wakes the list up",
      imagePrompt: scenePrompt(
        "A stack of aging business cards bound with a rubber band on a dim desk, one being pulled free",
      ),
    },
    {
      id: "no-tracking",
      pain: "Not knowing which email actually got the reply",
      fix: "one dashboard that tells you what worked",
      imagePrompt: scenePrompt(
        "A founder squinting at a laptop with a printed spreadsheet beside it, both unhelpful, warm lamp",
      ),
    },
    {
      id: "duplicate-data",
      pain: "The same customer entered three different ways",
      fix: "one record per human, enforced",
      imagePrompt: scenePrompt(
        "Overlapping printed contact sheets on a dark table with the same name circled three times",
      ),
    },
    {
      id: "no-handoff",
      pain: "Nothing happening after someone fills in the form",
      fix: "the form wired straight through to a reply and a task",
      imagePrompt: scenePrompt(
        "A single unread notification lighting a phone face-up on an empty desk, night",
      ),
    },
  ],

  /* ─────────── SOCIAL PRESENCE ─────────── */
  "social-presence": [
    {
      id: "posting-into-void",
      pain: "Posting into a void",
      fix: "a profile and a first post built to be found",
      imagePrompt: scenePrompt(
        "A founder holding a phone up in a dim room, face lit by the screen, empty engagement, late evening",
      ),
    },
    {
      id: "no-idea-what-to-post",
      pain: "Sitting down to post and having nothing to say",
      fix: "a bank of posts written before you leave",
      imagePrompt: scenePrompt(
        "A phone lying face up with a blank compose screen glow, hand resting beside it on a dark table",
      ),
    },
    {
      id: "profile-doesnt-sell",
      pain: "A profile that doesn't say what you sell",
      fix: "a bio and link that turn a visit into a booking",
      imagePrompt: scenePrompt(
        "A phone held in one hand at a cafe, thumb hovering over a profile screen, warm afternoon window light",
      ),
    },
    {
      id: "inconsistent",
      pain: "Three posts in a week, then nothing for two months",
      fix: "a rhythm you can hold on your worst week",
      imagePrompt: scenePrompt(
        "A wall calendar with a few marked days and long empty stretches, warm side light",
      ),
    },
    {
      id: "looks-amateur",
      pain: "Photos and captions that look homemade",
      fix: "a template set that makes every post look intentional",
      imagePrompt: scenePrompt(
        "A phone on a tripod pointed at an unlit product on a cluttered kitchen counter, no styling",
      ),
    },
    {
      id: "wrong-platform",
      pain: "Working hard on the platform your buyer isn't on",
      fix: "one platform chosen on evidence, the rest dropped",
      imagePrompt: scenePrompt(
        "A phone home screen glow with many app icons, thumb hovering undecided, dim room",
      ),
    },
    {
      id: "no-dms",
      pain: "Comments and DMs that go unanswered for days",
      fix: "a reply routine that takes ten minutes a day",
      imagePrompt: scenePrompt(
        "An unread message badge glowing on a phone left on a nightstand, dark bedroom",
      ),
    },
    {
      id: "no-video",
      pain: "Freezing every time the camera turns on",
      fix: "your first video recorded in the room, with help",
      imagePrompt: scenePrompt(
        "A founder facing a phone camera on a tripod in a dim room, mid-hesitation, warm key light",
      ),
    },
    {
      id: "no-conversion",
      pain: "Followers who never turn into a single customer",
      fix: "a post pattern that ends with an actual ask",
      imagePrompt: scenePrompt(
        "A crowded street at night seen through a shop window, nobody coming in, warm interior glow",
      ),
    },
    {
      id: "burnout",
      pain: "Dreading the whole thing enough to quit",
      fix: "a system small enough that you keep doing it",
      imagePrompt: scenePrompt(
        "A phone placed face-down on a table beside a cold coffee, hands withdrawn, dim morning light",
      ),
    },
  ],

  /* ─────────── CONTENT ENGINE ─────────── */
  "content-engine": [
    {
      id: "blank-page",
      pain: "The blank page, every single time",
      fix: "a written pipeline you pull from instead of starting cold",
      imagePrompt: scenePrompt(
        "A cursor blinking on an empty document, face lit by the screen in a dark room",
      ),
    },
    {
      id: "no-time",
      pain: "Content being the first thing dropped when the week gets hard",
      fix: "a batch that covers a month, made in one morning",
      imagePrompt: scenePrompt(
        "A cluttered desk at the end of a long day, laptop closed halfway, warm lamp, jacket over the chair",
      ),
    },
    {
      id: "nobody-reads",
      pain: "Publishing things nobody reads",
      fix: "topics chosen from what your buyer is already searching",
      imagePrompt: scenePrompt(
        "A printed article on a desk with untouched margins, dust in a shaft of warm light",
      ),
    },
    {
      id: "ai-sludge",
      pain: "AI drafts that sound like everyone else's",
      fix: "prompts loaded with your voice, so the output sounds like you",
      imagePrompt: scenePrompt(
        "A monitor showing a wall of uniform paragraphs at night, a hand scrolling past without reading",
      ),
    },
    {
      id: "no-repurpose",
      pain: "One piece of work producing exactly one post",
      fix: "one idea cut into a week of assets",
      imagePrompt: scenePrompt(
        "A single sheet of paper being cut into strips with scissors on a dark table, warm lamp",
      ),
    },
    {
      id: "no-hook",
      pain: "Good work that nobody clicks",
      fix: "hooks written and tested against real attention",
      imagePrompt: scenePrompt(
        "A hand scrolling a phone quickly in a dim room, motion blur on the screen",
      ),
    },
    {
      id: "inconsistent-voice",
      pain: "Sounding like a different person in every piece",
      fix: "one voice guide every draft is checked against",
      imagePrompt: scenePrompt(
        "Printed pages with different handwriting styles laid side by side under warm light",
      ),
    },
    {
      id: "no-distribution",
      pain: "Hitting publish and calling that distribution",
      fix: "a checklist that puts each piece in five places",
      imagePrompt: scenePrompt(
        "A single envelope on an empty desk beside a laptop, night, warm lamp",
      ),
    },
    {
      id: "no-measurement",
      pain: "No idea which piece actually brought a customer",
      fix: "one number you check monthly, and what to do about it",
      imagePrompt: scenePrompt(
        "A printed chart face-down on a desk, laptop closed, warm low light",
      ),
    },
    {
      id: "starting-over",
      pain: "Restarting the whole content thing every quarter",
      fix: "a system that survives your busy season",
      imagePrompt: scenePrompt(
        "A stack of half-filled notebooks on a shelf in warm dim light, one being pulled out",
      ),
    },
  ],

  /* ─────────── AI OPERATING SYSTEM ─────────── */
  "ai-operating-system": [
    {
      id: "everything-manual",
      pain: "Doing by hand what should have been automatic a year ago",
      fix: "your three worst repeat tasks running without you",
      imagePrompt: scenePrompt(
        "Hands copying numbers from a paper form into a laptop late at night, warm lamp, stack of forms waiting",
      ),
    },
    {
      id: "ai-toy",
      pain: "Using AI like a toy instead of a coworker",
      fix: "prompts wired into the work you actually repeat",
      imagePrompt: scenePrompt(
        "A laptop open to a chat interface glow in a dim room, hand idle on the trackpad",
      ),
    },
    {
      id: "too-many-tools",
      pain: "Paying for six tools that don't talk to each other",
      fix: "one stack, connected, with the rest cancelled",
      imagePrompt: scenePrompt(
        "A tangle of charging cables and devices on a dark desk, one hand trying to separate them",
      ),
    },
    {
      id: "no-sop",
      pain: "Every process living only in your head",
      fix: "written steps a new hire or an agent can run",
      imagePrompt: scenePrompt(
        "A founder alone in a workshop at night, everything half-organized around them, warm single light",
      ),
    },
    {
      id: "cant-delegate",
      pain: "Being the only person who can do any of it",
      fix: "the first task handed off and verified before you leave",
      imagePrompt: scenePrompt(
        "One person working alone in a large dim office space, empty desks around them, warm desk lamp",
      ),
    },
    {
      id: "bad-output",
      pain: "AI output you have to rewrite anyway",
      fix: "prompts with your context loaded so the first draft is usable",
      imagePrompt: scenePrompt(
        "A printed draft covered in red pen corrections on a dark desk, warm lamp",
      ),
    },
    {
      id: "data-scattered",
      pain: "Your business knowledge scattered across notes and screenshots",
      fix: "one place your AI reads from every time",
      imagePrompt: scenePrompt(
        "Papers, sticky notes, and phone screenshots spread across a dim table, hands sorting",
      ),
    },
    {
      id: "no-time-saved",
      pain: "Automating things that didn't cost you time anyway",
      fix: "the tasks ranked by hours before anything gets built",
      imagePrompt: scenePrompt(
        "A stopwatch and a handwritten list on a dark desk, warm lamp, pen mid-mark",
      ),
    },
    {
      id: "security-worry",
      pain: "Not knowing what you're safe to put into an AI tool",
      fix: "clear rules on what goes in and what never does",
      imagePrompt: scenePrompt(
        "A locked filing cabinet drawer half open beside a laptop in a dim office, warm light",
      ),
    },
    {
      id: "no-follow-through",
      pain: "Automations that break and nobody notices",
      fix: "a weekly check that takes five minutes",
      imagePrompt: scenePrompt(
        "A dark server closet with one indicator light out, warm hallway light spilling in",
      ),
    },
  ],

  /* ─────────── LEGAL & FINANCIAL OPS ─────────── */
  "legal-financial-ops": [
    {
      id: "no-entity",
      pain: "Running real money through your personal name",
      fix: "the entity chosen and filed, with you watching",
      imagePrompt: scenePrompt(
        "A personal checkbook and a business invoice side by side on a kitchen table, warm evening lamp",
      ),
    },
    {
      id: "no-contract",
      pain: "Working off a text message and a handshake",
      fix: "a contract suite you can send and sign this week",
      imagePrompt: scenePrompt(
        "Two people shaking hands across a table with no paperwork between them, warm dim light",
      ),
    },
    {
      id: "mixed-money",
      pain: "Business and personal money in the same account",
      fix: "a business account open and the split done",
      imagePrompt: scenePrompt(
        "A single debit card on a dark table beside two receipt piles, warm lamp",
      ),
    },
    {
      id: "no-books",
      pain: "A shoebox where the bookkeeping should be",
      fix: "books started, categorized, and current",
      imagePrompt: scenePrompt(
        "A box overflowing with crumpled receipts on a dim desk beside a closed laptop",
      ),
    },
    {
      id: "tax-surprise",
      pain: "Finding out what you owe in April",
      fix: "a set-aside rule and an account that holds it",
      imagePrompt: scenePrompt(
        "An unopened official envelope on a kitchen counter in early morning light",
      ),
    },
    {
      id: "no-insurance",
      pain: "One bad day away from losing everything personal",
      fix: "the coverage identified and the quotes in hand",
      imagePrompt: scenePrompt(
        "A house key and a set of work keys on a dark table under warm lamp light",
      ),
    },
    {
      id: "getting-paid-late",
      pain: "Chasing invoices for sixty days",
      fix: "payment terms and a chase sequence that runs itself",
      imagePrompt: scenePrompt(
        "A phone showing a call log of unanswered outgoing calls, dim office, warm light",
      ),
    },
    {
      id: "no-pricing-math",
      pain: "Prices set on feel, with no idea of the margin",
      fix: "the real unit math done on your actual numbers",
      imagePrompt: scenePrompt(
        "Handwritten arithmetic on a legal pad beside a calculator, warm desk lamp, late night",
      ),
    },
    {
      id: "licenses",
      pain: "Not knowing which license or permit you're missing",
      fix: "your specific list, checked against your county",
      imagePrompt: scenePrompt(
        "A clipboard of unfilled official forms on a dim counter, warm overhead light",
      ),
    },
    {
      id: "no-visibility",
      pain: "Guessing whether the month was actually profitable",
      fix: "one number you can check on your phone",
      imagePrompt: scenePrompt(
        "A phone face-up showing a dim screen beside a closed ledger on a dark desk",
      ),
    },
  ],
};

export function getWorkshopPains(slug: string): WorkshopPain[] {
  return WORKSHOP_PAINS[slug] ?? [];
}
