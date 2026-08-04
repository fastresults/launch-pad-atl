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


const SCENE_BASE =
  "Cinematic editorial photograph, midnight-navy color grade, deep shadows, single warm practical light source, shallow depth of field, 50mm lens, natural film grain, realistic skin texture, unposed and documentary in feel";

const NO_SCREEN_CONTENT = "no text, no logos, no readable UI copy";

/**
 * Screen-forward scenes need the screen to read as *something* — a feed, an
 * inbox, a half-loaded page — without the model inventing garbled words.
 */
const SCREEN_CONTENT =
  "on-screen content is recognizable by shape only — tiles, rows, blocks, charts, placeholders — with all text rendered as soft illegible blur, no logos, no brand marks, never legible words";

const SCENE_TAIL = "Generated on the premium image tier at 1920x1080";

/** Wraps a subject in the shared hero look so every set matches. */
export function scenePrompt(
  subject: string,
  opts: { screens?: boolean } = {},
): string {
  const rule = opts.screens ? SCREEN_CONTENT : NO_SCREEN_CONTENT;
  return `${subject}. ${SCENE_BASE}, ${rule}. ${SCENE_TAIL}.`;
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
      question: "My leads sit in my inbox until they go cold.",
      imagePrompt: scenePrompt(
        "A founder's silhouette leaning back with hands behind their head in a dark room, one laptop glowing on the desk in front of them",
      ),
    },
    {
      id: "manual-follow-up",
      pain: "Following up by memory, on a good week",
      fix: "a sequence that follows up whether you remember or not",
      question: "I only follow up when I happen to remember.",
      imagePrompt: scenePrompt(
        "A single curling sticky note peeling off the edge of a dark monitor, dust in the warm lamp light",
      ),
    },
    {
      id: "no-list",
      pain: "No list — just contacts scattered across three apps",
      fix: "one clean list you actually own",
      question: "My contacts are scattered across three apps.",
      imagePrompt: scenePrompt(
        "Three phones and an open laptop on a dim desk, each faintly glowing, a founder behind them pinching the bridge of their nose",
      ),
    },
    {
      id: "never-email",
      pain: "Going four months without emailing anyone",
      fix: "a monthly email you can write in twenty minutes",
      question: "I haven't emailed my list in months.",
      imagePrompt: scenePrompt(
        "A dusty wall calendar with untouched blank pages, a warm slant of window light raking across it",
      ),
    },
    {
      id: "spam-folder",
      pain: "Emails landing in spam and never knowing",
      fix: "your sending domain set up right, verified in the room",
      question: "I think my emails are landing in spam.",
      imagePrompt: scenePrompt(
        "A hand loosely holding a phone in a dark room, the blank screen glow lighting the fingers, nothing arriving",
      ),
    },
    {
      id: "no-welcome",
      pain: "New signups hearing nothing for a week",
      fix: "a welcome sequence that starts the second they join",
      question: "People sign up and then hear nothing from me.",
      imagePrompt: scenePrompt(
        "An empty front doorway at dusk with the porch light just switched on, nobody there, quiet street beyond",
      ),
    },
    {
      id: "cold-leads",
      pain: "Old leads going cold because nobody touched them",
      fix: "a re-engagement email that wakes the list up",
      question: "I have a pile of old leads I never touched.",
      imagePrompt: scenePrompt(
        "A thick stack of aging business cards bound with a rubber band on a dim desk, one being pulled free by a hand",
      ),
    },
    {
      id: "no-tracking",
      pain: "Not knowing which email actually got the reply",
      fix: "one dashboard that tells you what worked",
      question: "I have no idea which email actually worked.",
      imagePrompt: scenePrompt(
        "A founder squinting at a laptop while holding up a printed spreadsheet beside it, neither one helping, warm lamp",
      ),
    },
    {
      id: "duplicate-data",
      pain: "The same customer entered three different ways",
      fix: "one record per human, enforced",
      question: "The same customer is in my system three times.",
      imagePrompt: scenePrompt(
        "Overlapping printed name-and-address lists fanned across a dark table, the same line circled three times in red pen",
      ),
    },
    {
      id: "no-handoff",
      pain: "Nothing happening after someone fills in the form",
      fix: "the form wired straight through to a reply and a task",
      question: "Someone fills out my form and nothing happens.",
      imagePrompt: scenePrompt(
        "A phone face-up on an otherwise empty desk at night, one notification lighting the surface around it",
      ),
    },

  ],

  /* ─────────── SOCIAL PRESENCE ─────────── */
  "social-presence": [
    {
      id: "posting-into-void",
      pain: "Posting into a void",
      fix: "a profile and a first post built to be found",
      question: "I post and nobody ever sees it.",
      imagePrompt: scenePrompt(
        "A founder holding a phone up in a dim room late in the evening, face lit only by the screen, expression flat and unrewarded",
      ),
    },
    {
      id: "no-idea-what-to-post",
      pain: "Sitting down to post and having nothing to say",
      fix: "a bank of posts written before you leave",
      question: "I sit down to post and have nothing to say.",
      imagePrompt: scenePrompt(
        "A phone lying face-up on a dark table with a blank glowing screen, a hand resting motionless beside it",
      ),
    },
    {
      id: "profile-doesnt-sell",
      pain: "A profile that doesn't say what you sell",
      fix: "a bio and link that turn a visit into a booking",
      question: "My profile doesn't say what I actually sell.",
      imagePrompt: scenePrompt(
        "A hand holding a phone at a cafe table, thumb hovering above the screen, warm afternoon window light, dark interior behind",
      ),
    },
    {
      id: "inconsistent",
      pain: "Three posts in a week, then nothing for two months",
      fix: "a rhythm you can hold on your worst week",
      question: "I post for a week then disappear for two months.",
      imagePrompt: scenePrompt(
        "A wall calendar with a cluster of pen marks in one week and long empty stretches after it, warm raking side light",
      ),
    },
    {
      id: "looks-amateur",
      pain: "Photos and captions that look homemade",
      fix: "a template set that makes every post look intentional",
      question: "Everything I post looks homemade.",
      imagePrompt: scenePrompt(
        "A phone clamped to a small tripod aimed at an unlit product on a cluttered kitchen counter, no styling",
      ),
    },
    {
      id: "wrong-platform",
      pain: "Working hard on the platform your buyer isn't on",
      fix: "one platform chosen on evidence, the rest dropped",
      question: "I don't know which platform my buyer is even on.",
      imagePrompt: scenePrompt(
        "A thumb hovering undecided above a phone screen full of blank app tiles in a dim room",
      ),
    },
    {
      id: "no-dms",
      pain: "Comments and DMs that go unanswered for days",
      fix: "a reply routine that takes ten minutes a day",
      question: "My DMs sit unanswered for days.",
      imagePrompt: scenePrompt(
        "A phone left face-up on a nightstand in a dark bedroom, screen glowing with an unread badge, nobody reaching for it",
      ),
    },
    {
      id: "no-video",
      pain: "Freezing every time the camera turns on",
      fix: "your first video recorded in the room, with help",
      question: "I freeze the second the camera turns on.",
      imagePrompt: scenePrompt(
        "A founder in front of a phone on a tripod in a dim room, caught mid-hesitation before speaking, warm key light on one side",
      ),
    },
    {
      id: "no-conversion",
      pain: "Followers who never turn into a single customer",
      fix: "a post pattern that ends with an actual ask",
      question: "I have followers but not one customer.",
      imagePrompt: scenePrompt(
        "Seen from inside a small shop at night, a busy street of passersby beyond the window and nobody coming in",
      ),
    },
    {
      id: "burnout",
      pain: "Dreading the whole thing enough to quit",
      fix: "a system small enough that you keep doing it",
      question: "I dread posting enough that I want to quit.",
      imagePrompt: scenePrompt(
        "A phone placed face-down on a table beside a cold half-finished coffee, hands withdrawn, dim grey morning light",
      ),
    },

  ],

  /* ─────────── CONTENT ENGINE ─────────── */
  "content-engine": [
    {
      id: "blank-page",
      pain: "The blank page, every single time",
      fix: "a written pipeline you pull from instead of starting cold",
      question: "I stare at a blank page every single time.",
      imagePrompt: scenePrompt(
        "A founder in a dark room in front of a laptop showing a completely empty document, face lit by the screen, stalled",
      ),
    },
    {
      id: "no-time",
      pain: "Content being the first thing dropped when the week gets hard",
      fix: "a batch that covers a month, made in one morning",
      question: "Content is the first thing I drop when I get busy.",
      imagePrompt: scenePrompt(
        "A cluttered desk at the end of a long day, laptop closed halfway, a jacket slung over the empty chair, warm lamp",
      ),
    },
    {
      id: "nobody-reads",
      pain: "Publishing things nobody reads",
      fix: "topics chosen from what your buyer is already searching",
      question: "I publish things and nobody reads them.",
      imagePrompt: scenePrompt(
        "A printed article lying untouched on a dim desk with clean unmarked margins, dust in a shaft of warm light",
      ),
    },
    {
      id: "ai-sludge",
      pain: "AI drafts that sound like everyone else's",
      fix: "prompts loaded with your voice, so the output sounds like you",
      question: "My AI drafts sound like everyone else's.",
      imagePrompt: scenePrompt(
        "A monitor at night showing a wall of identical uniform paragraph blocks, a hand scrolling past without reading",
      ),
    },
    {
      id: "no-repurpose",
      pain: "One piece of work producing exactly one post",
      fix: "one idea cut into a week of assets",
      question: "All that work turns into one single post.",
      imagePrompt: scenePrompt(
        "A single sheet of paper being cut into narrow strips with scissors on a dark table, strips fanned out, warm lamp",
      ),
    },
    {
      id: "no-hook",
      pain: "Good work that nobody clicks",
      fix: "hooks written and tested against real attention",
      question: "My best work is the thing nobody clicks.",
      imagePrompt: scenePrompt(
        "A thumb flicking rapidly up a phone screen in a dim room, the screen smeared into motion blur",
      ),
    },
    {
      id: "inconsistent-voice",
      pain: "Sounding like a different person in every piece",
      fix: "one voice guide every draft is checked against",
      question: "I sound like a different person in every piece.",
      imagePrompt: scenePrompt(
        "Several printed pages laid side by side on a dark table, each in a visibly different handwriting, warm lamp light",
      ),
    },
    {
      id: "no-distribution",
      pain: "Hitting publish and calling that distribution",
      fix: "a checklist that puts each piece in five places",
      question: "I hit publish and that's my whole distribution.",
      imagePrompt: scenePrompt(
        "A single sealed envelope on an otherwise empty desk beside a closed laptop at night, warm lamp",
      ),
    },
    {
      id: "no-measurement",
      pain: "No idea which piece actually brought a customer",
      fix: "one number you check monthly, and what to do about it",
      question: "I can't tell which piece brought me a customer.",
      imagePrompt: scenePrompt(
        "A printed chart turned face-down on a desk beside a closed laptop, warm low light, nobody looking at it",
      ),
    },
    {
      id: "starting-over",
      pain: "Restarting the whole content thing every quarter",
      fix: "a system that survives your busy season",
      question: "I restart this whole thing every few months.",
      imagePrompt: scenePrompt(
        "A stack of half-filled notebooks on a shelf in warm dim light, one being pulled out, the rest abandoned",
      ),
    },

  ],

  /* ─────────── AI OPERATING SYSTEM ─────────── */
  "ai-operating-system": [
    {
      id: "everything-manual",
      pain: "Doing by hand what should have been automatic a year ago",
      fix: "your three worst repeat tasks running without you",
      question: "I'm still doing all of this by hand.",
      imagePrompt: scenePrompt(
        "Hands copying figures from a paper form into a laptop late at night, a tall stack of forms waiting beside them, warm lamp",
      ),
    },
    {
      id: "ai-toy",
      pain: "Using AI like a toy instead of a coworker",
      fix: "prompts wired into the work you actually repeat",
      question: "I use AI like a toy, not like help.",
      imagePrompt: scenePrompt(
        "An open laptop glowing in a dim room with a hand resting idle on the trackpad, nothing being typed",
      ),
    },
    {
      id: "too-many-tools",
      pain: "Paying for six tools that don't talk to each other",
      fix: "one stack, connected, with the rest cancelled",
      question: "I pay for six tools that don't talk to each other.",
      imagePrompt: scenePrompt(
        "A tangle of charging cables and small devices on a dark desk, one hand pulling a single cable free, warm lamp",
      ),
    },
    {
      id: "no-sop",
      pain: "Every process living only in your head",
      fix: "written steps a new hire or an agent can run",
      question: "Every process lives only in my head.",
      imagePrompt: scenePrompt(
        "A founder alone in a small workshop at night, half-organized shelves around them, one warm work light overhead",
      ),
    },
    {
      id: "cant-delegate",
      pain: "Being the only person who can do any of it",
      fix: "the first task handed off and verified before you leave",
      question: "I'm the only person who can do any of it.",
      imagePrompt: scenePrompt(
        "One person at a single lit desk in a large dim open-plan office at night, rows of empty desks around them",
      ),
    },
    {
      id: "bad-output",
      pain: "AI output you have to rewrite anyway",
      fix: "prompts with your context loaded so the first draft is usable",
      question: "I rewrite everything the AI gives me anyway.",
      imagePrompt: scenePrompt(
        "A printed draft covered edge to edge in red pen corrections on a dark desk, warm lamp",
      ),
    },
    {
      id: "data-scattered",
      pain: "Your business knowledge scattered across notes and screenshots",
      fix: "one place your AI reads from every time",
      question: "Everything I know is scattered across notes and screenshots.",
      imagePrompt: scenePrompt(
        "Papers, sticky notes and printed screenshots spread messily across a dim table, two hands mid-sort",
      ),
    },
    {
      id: "no-time-saved",
      pain: "Automating things that didn't cost you time anyway",
      fix: "the tasks ranked by hours before anything gets built",
      question: "I automate things that never cost me time.",
      imagePrompt: scenePrompt(
        "An analog stopwatch resting on a handwritten list on a dark desk, a pen mid-mark beside it, warm lamp",
      ),
    },
    {
      id: "security-worry",
      pain: "Not knowing what you're safe to put into an AI tool",
      fix: "clear rules on what goes in and what never does",
      question: "I don't know what's safe to put into an AI tool.",
      imagePrompt: scenePrompt(
        "A locked metal filing cabinet drawer half open beside a glowing laptop in a dim office, warm light",
      ),
    },
    {
      id: "no-follow-through",
      pain: "Automations that break and nobody notices",
      fix: "a weekly check that takes five minutes",
      question: "My automations break and I never notice.",
      imagePrompt: scenePrompt(
        "A dark server closet with rows of indicator lights, one light out in the row, warm hallway light spilling in",
      ),
    },

  ],

  /* ─────────── LEGAL & FINANCIAL OPS ─────────── */
  "legal-financial-ops": [
    {
      id: "no-entity",
      pain: "Running real money through your personal name",
      fix: "the entity chosen and filed, with you watching",
      question: "I'm running real money through my own name.",
      imagePrompt: scenePrompt(
        "A personal checkbook and a printed business invoice side by side on a kitchen table under a warm evening lamp",
      ),
    },
    {
      id: "no-contract",
      pain: "Working off a text message and a handshake",
      fix: "a contract suite you can send and sign this week",
      question: "I'm working off a handshake and a text message.",
      imagePrompt: scenePrompt(
        "Two people shaking hands across a bare table with no paperwork between them, warm dim light",
      ),
    },
    {
      id: "mixed-money",
      pain: "Business and personal money in the same account",
      fix: "a business account open and the split done",
      question: "My business and personal money are the same account.",
      imagePrompt: scenePrompt(
        "A single plain debit card on a dark table between two separate piles of paper receipts, warm lamp",
      ),
    },
    {
      id: "no-books",
      pain: "A shoebox where the bookkeeping should be",
      fix: "books started, categorized, and current",
      question: "My bookkeeping is a box full of receipts.",
      imagePrompt: scenePrompt(
        "A shoebox overflowing with crumpled receipts on a dim desk beside a closed laptop, warm lamp",
      ),
    },
    {
      id: "tax-surprise",
      pain: "Finding out what you owe in April",
      fix: "a set-aside rule and an account that holds it",
      question: "I find out what I owe in taxes way too late.",
      imagePrompt: scenePrompt(
        "A single unopened official envelope on a kitchen counter in pale early morning light",
      ),
    },
    {
      id: "no-insurance",
      pain: "One bad day away from losing everything personal",
      fix: "the coverage identified and the quotes in hand",
      question: "One bad day could take everything I own.",
      imagePrompt: scenePrompt(
        "A house key and a heavy ring of work keys lying together on a dark table under warm lamp light",
      ),
    },
    {
      id: "getting-paid-late",
      pain: "Chasing invoices for sixty days",
      fix: "payment terms and a chase sequence that runs itself",
      question: "I'm chasing invoices for months.",
      imagePrompt: scenePrompt(
        "A hand holding a phone in a dim office showing a long list of outgoing call entries, warm light",
      ),
    },
    {
      id: "no-pricing-math",
      pain: "Prices set on feel, with no idea of the margin",
      fix: "the real unit math done on your actual numbers",
      question: "I priced on feel and don't know my margin.",
      imagePrompt: scenePrompt(
        "Handwritten arithmetic covering a yellow legal pad beside a calculator late at night, a hand holding the pen",
      ),
    },
    {
      id: "licenses",
      pain: "Not knowing which license or permit you're missing",
      fix: "your specific list, checked against your county",
      question: "I don't know which permits I'm missing.",
      imagePrompt: scenePrompt(
        "A clipboard of blank unfilled official forms on a dim counter under a warm overhead light, a pen beside it",
      ),
    },
    {
      id: "no-visibility",
      pain: "Guessing whether the month was actually profitable",
      fix: "one number you can check on your phone",
      question: "I'm guessing whether this month made money.",
      imagePrompt: scenePrompt(
        "A phone face-up with a dim blank screen beside a closed hardbound ledger on a dark desk at night",
      ),
    },

  ],
};

export function getWorkshopPains(slug: string): WorkshopPain[] {
  return WORKSHOP_PAINS[slug] ?? [];
}
