/**
 * Productization data for the 7 post-Foundation workshop stages.
 *
 * Each stage ships three things founders can see, touch, and use Monday morning:
 *  1. Signature in-room build (25-min live exercise)
 *  2. AI-generated ship-ready artifact (produced by workshop staff in-session
 *     via Lovable AI Gateway, released to the founder's dashboard before they
 *     leave the room)
 *  3. Founder-owned take-home kit (files + Monday-move checklist)
 *
 * Keyed by the deck slug (matches src/components/workshop-slides/registry.ts).
 * Foundation is intentionally omitted — its 4 written artifacts are already
 * drafted live and do not need a generator overlay.
 */

export type StageArtifactFile = {
  name: string;
  format: string; // "PDF · 8 pages", "XLSX · formulas", etc.
  note: string;
};

export type SignatureBuild = {
  title: string;
  duration: string; // "25 min live"
  inputs: string[]; // things the founder gives the room
  mechanic: string; // what the room does on screen
};

export type LiveWorksheet = {
  headline: string;
  steps: string[]; // 3-5 on-screen steps
};

export type ShipReadyArtifact = {
  title: string;
  format: string; // "Multi-file kit · PDF + DOCX + XLSX"
  aiModel: string;
  contains: string[];
  released: string; // "Dropped into your dashboard before you leave the room"
};

export type TakeHomeKit = {
  headline: string;
  files: StageArtifactFile[];
  mondayMove: string;
};

export type DeliverableDetail = {
  buildMechanic: string;
  inputs: string[];
  takeaway: string;
};

export type StageProductization = {
  slug: string;
  /** One-line description of the mentoring lens this session applies to the founder's work. */
  perspective?: string;
  signatureBuild: SignatureBuild;
  liveWorksheet: LiveWorksheet;
  shipReadyArtifact: ShipReadyArtifact;
  takeHomeKit: TakeHomeKit;
  /** Parallel to FRAMEWORK_STAGES[n].items — one entry per deliverable. */
  deliverableDetails: DeliverableDetail[];
};

const AI_DEFAULT = "Lovable AI · google/gemini-3-flash-preview";

export const STAGE_PRODUCTIZATION: Record<string, StageProductization> = {
  strategy: {
    slug: "strategy",
    perspective:
      "This session applies an operator's lens — how a seasoned founder sizes a real local market, names the actual buyer, and picks a wedge that competitors can't casually copy — to the drafts you bring in.",
    signatureBuild: {
      title: "Sized market + Named buyer + 90-day GTM sequencer",
      duration: "25 min live",
      inputs: [
        "Your city, category, and price band",
        "One customer interview transcript (paste in)",
        "The 3 alternatives your buyer considers",
      ],
      mechanic:
        "TAM/SAM/SOM calculator sizes your local opportunity live. Persona canvas fills from the interview. Competitive matrix scores each alternative. Wedge one-liner drafted on screen.",
    },
    liveWorksheet: {
      headline: "What runs on screen while you work",
      steps: [
        "Enter ZIP + category + price band → sized market with sources",
        "Paste interview → 2 personas with pain, budget, vocabulary, buying triggers",
        "Score 3 alternatives → wedge statement written on the fly",
        "Sequence 90-day GTM week by week: channel, offer, one metric",
      ],
    },
    shipReadyArtifact: {
      title: "Strategy Brief PDF + 5-message outreach pack",
      format: "PDF · 8–10 pages + DOCX message pack",
      aiModel: AI_DEFAULT,
      contains: [
        "Sized market with cited sources",
        "2 customer personas with real quotes",
        "3-alternative competitive matrix + wedge statement",
        "90-day GTM sequence (week-by-week with channel, offer, metric)",
        "First 30 days: 5 outreach messages (cold email, LinkedIn DM, warm intro ask, referral request, follow-up)",
      ],
      released: "Sharpened live with staff review and saved to your dashboard — a working draft you continue to refine, not a finished product.",
    },
    takeHomeKit: {
      headline: "In your dashboard by 11:30 AM",
      files: [
        { name: "Strategy Brief", format: "PDF · 8–10 pages", note: "Hand to a partner or lender" },
        { name: "Persona Cards", format: "PDF · 2 cards", note: "Print for the wall" },
        { name: "5 Outreach Messages", format: "DOCX", note: "Copy-paste, personalize, send Monday" },
        { name: "90-Day GTM Sequencer", format: "PDF · 1 page", note: "Your weekly moves" },
      ],
      mondayMove: "Send outreach message #1 to 10 people who fit your persona. Log responses in the Sequencer.",
    },
    deliverableDetails: [
      {
        buildMechanic: "TAM/SAM/SOM sizer using local ZIP + category + price band; sources cited inline.",
        inputs: ["Foundation · Value Proposition", "Your city + category"],
        takeaway: "You know the size of the prize and can defend the number.",
      },
      {
        buildMechanic: "Persona canvas auto-fills from a pasted customer interview transcript.",
        inputs: ["Foundation · Problem/Solution", "One real customer conversation"],
        takeaway: "You can name your buyer, quote them, and predict what triggers a purchase.",
      },
      {
        buildMechanic: "Competitive matrix scores 3 alternatives (including 'do nothing') across 5 criteria; wedge statement drafted from the gaps.",
        inputs: ["Foundation · Value Proposition", "3 alternatives your buyer considers"],
        takeaway: "You have a wedge competitors cannot copy in a week.",
      },
      {
        buildMechanic: "90-day sequencer: pick 2 channels, sequence weekly moves, name the one metric per channel.",
        inputs: ["Personas", "Positioning", "Your realistic weekly hours"],
        takeaway: "You know exactly what to do Monday, and every Monday for 12 weeks.",
      },
      {
        buildMechanic: "Messaging house generated from Value Prop + Personas; 5 outreach messages written in your voice.",
        inputs: ["Foundation · Value Proposition", "Personas"],
        takeaway: "Your website, sales calls, and DMs all sound like one brand.",
      },
    ],
  },

  operations: {
    slug: "operations",
    perspective:
      "This session applies a chief-of-staff lens — how someone who has run the back office of a small business pressure-tests your weekly workflow, sales conversations, and channel spend so the business can run without you touching every step.",
    signatureBuild: {
      title: "Weekly Ops Loop + Sales Playbook + Channel spend planner",
      duration: "25 min live",
      inputs: [
        "Your offer and delivery cadence",
        "The 3 objections you hear most",
        "Your realistic monthly marketing budget",
      ],
      mechanic:
        "Kanban builder maps intake → produce → deliver → invoice → follow-up with owner + tool per step. Sales script writes discovery, objections, close. Channel planner sets monthly spend and one metric per channel.",
    },
    liveWorksheet: {
      headline: "What runs on screen while you work",
      steps: [
        "Drag your weekly workflow into 5 columns; assign owner + tool per step",
        "Sequence a 12-month product roadmap, revenue-weighted",
        "Draft 5 discovery questions + 3 objection rebuttals + your close language",
        "Set monthly channel spend + one metric per channel",
      ],
    },
    shipReadyArtifact: {
      title: "Operations Playbook PDF + Weekly Ops SOP",
      format: "PDF · ~15 pages + Google Doc SOP template",
      aiModel: AI_DEFAULT,
      contains: [
        "12-month product roadmap with revenue weighting",
        "Weekly workflow SOP (intake → invoice → follow-up)",
        "Sales Playbook — 5 discovery Qs, top 3 objections with exact rebuttal language, close scripts, follow-up cadence",
        "Marketing Plan — channel mix, monthly spend, content cadence, one metric per channel",
        "Delegation Map — the 3 steps a first hire could own",
      ],
      released: "Sharpened live with staff review and saved to your dashboard — a working draft you continue to refine, not a finished product.",
    },
    takeHomeKit: {
      headline: "In your dashboard by 11:30 AM",
      files: [
        { name: "Operations Playbook", format: "PDF · ~15 pages", note: "The whole business on paper" },
        { name: "Weekly Ops SOP", format: "Google Doc + Notion template", note: "Checkboxes, ready to run" },
        { name: "Sales Playbook", format: "PDF · 1 page", note: "Keep next to the phone" },
        { name: "First-Hire SOP", format: "PDF · 1 page printable", note: "Onboard a helper in 30 min" },
      ],
      mondayMove: "Run one week of the Ops SOP end-to-end. Log where it breaks; refine Friday.",
    },
    deliverableDetails: [
      {
        buildMechanic: "12-month roadmap sequencer prioritizing revenue-driving items first.",
        inputs: ["Foundation · Value Proposition", "Strategy · GTM Plan"],
        takeaway: "You know what you ship next month, next quarter, and why.",
      },
      {
        buildMechanic: "Kanban builder maps weekly workflow with owner + tool per step.",
        inputs: ["Your offer", "Your current delivery cadence"],
        takeaway: "The business runs on paper — not just in your head.",
      },
      {
        buildMechanic: "Sales script generator: 5 discovery Qs, top 3 objections with rebuttal language, close scripts.",
        inputs: ["Strategy · Personas", "Your top 3 objections"],
        takeaway: "You have a script that closes — and one a teammate could run.",
      },
      {
        buildMechanic: "Channel spend planner: monthly budget by channel + one metric per channel + content cadence.",
        inputs: ["Strategy · GTM Plan", "Your realistic monthly marketing budget"],
        takeaway: "You spend where it earns and quietly turn off what doesn't.",
      },
    ],
  },

  finance: {
    slug: "finance",
    perspective:
      "This session applies a CFO-and-investor lens — how someone who has read hundreds of models reviews your assumptions, unit economics, and funding path, and points out where your story doesn't yet hold up.",
    signatureBuild: {
      title: "12-Month Pro Forma + Unit Economics + Funding decision tree",
      duration: "25 min live",
      inputs: [
        "Your pricing, cost, and monthly sales cadence",
        "Your customer acquisition cost inputs (channel + spend)",
        "Your capital appetite (bootstrap / SBA / equity)",
      ],
      mechanic:
        "P&L generator builds 12 months of revenue, COGS, opex, cash, and runway from your inputs. CAC/LTV calculator runs live. Funding decision tree picks the cheapest capital that fits.",
    },
    liveWorksheet: {
      headline: "What runs on screen while you work",
      steps: [
        "Enter pricing + cost + cadence → 12-month P&L and cash forecast with formulas",
        "Enter channel spend + close rate → CAC and LTV calculated live",
        "Answer 6 questions → funding decision tree returns your cheapest capital path",
        "10-slide pitch outline auto-populated from Foundation + market size + P&L",
      ],
    },
    shipReadyArtifact: {
      title: "Finance Packet — Pro Forma XLSX + Funding Memo PDF + Pitch Deck v1",
      format: "XLSX + PDF + PPTX/Google Slides",
      aiModel: `${AI_DEFAULT} · pitch deck upgraded to a stronger model`,
      contains: [
        "12-Month Pro Forma XLSX with real formulas (revenue, COGS, opex, cash, runway) prefilled from your inputs",
        "Funding Strategy Memo picking the cheapest capital path with next-step contacts",
        "Pitch Deck v1 (10 slides) auto-populated with your Foundation story, market size, model, and ask",
      ],
      released: "Sharpened live with staff review and saved to your dashboard — a working draft you continue to refine, not a finished product.",
    },
    takeHomeKit: {
      headline: "In your dashboard by 11:30 AM",
      files: [
        { name: "12-Month Pro Forma", format: "XLSX · live formulas", note: "Hand to a banker or SBA officer" },
        { name: "Funding Strategy Memo", format: "PDF · 4–6 pages", note: "Your cheapest path to capital" },
        { name: "Pitch Deck v1", format: "PPTX + Google Slides", note: "First real investor conversation" },
        { name: "Unit Economics Worksheet", format: "XLSX", note: "CAC/LTV you can tune monthly" },
      ],
      mondayMove: "Book one banker or SBA meeting this week using the Pro Forma and Memo.",
    },
    deliverableDetails: [
      {
        buildMechanic: "12-month P&L generator builds revenue, COGS, opex, cash, runway with real formulas from your inputs.",
        inputs: ["Your pricing", "Your monthly cost structure", "Realistic sales cadence"],
        takeaway: "You know when cash gets tight and which levers move the trajectory.",
      },
      {
        buildMechanic: "CAC/LTV calculator with your first channel's spend and close rate.",
        inputs: ["Strategy · GTM Plan", "First channel's spend + close rate"],
        takeaway: "You price with confidence and kill unprofitable offers.",
      },
      {
        buildMechanic: "6-question decision tree picks bootstrap / SBA / grants / F&F / equity + next-step contacts.",
        inputs: ["12-Month P&L", "Your capital appetite"],
        takeaway: "You pursue the cheapest capital that actually fits.",
      },
      {
        buildMechanic: "Line-by-line pro forma rendered in the format banks and landlords expect.",
        inputs: ["12-Month P&L", "Your market analysis"],
        takeaway: "You walk into any money conversation with the asset they expect.",
      },
      {
        buildMechanic: "10-slide narrative auto-populated from Foundation + Strategy + Financial Model.",
        inputs: ["Foundation · Executive Summary", "Strategy · Market Analysis", "12-Month P&L"],
        takeaway: "You stop rebuilding decks from scratch — a real v1 exists.",
      },
    ],
  },

  governance: {
    slug: "governance",
    perspective:
      "This session applies a small-business counsel lens — someone who has helped founders pick the right structure, spot the predictable risks, and open advisor conversations that actually open doors.",
    signatureBuild: {
      title: "Entity decision tree + SOS filing + EIN live + Legal Kit",
      duration: "25 min live",
      inputs: [
        "Your revenue and salary plans (5 questions)",
        "Members, ownership split, registered agent choice",
        "Your top-8 risks (financial, legal, operational, market)",
      ],
      mechanic:
        "5-question decision tree picks LLC / S-Corp / Sole Prop. State SOS account created, formation doc pre-filled, EIN submitted live. Risk Register scored (likelihood × impact). Legal Kit generated.",
    },
    liveWorksheet: {
      headline: "What runs on screen while you work",
      steps: [
        "Answer 5 questions → LLC / S-Corp / Sole Prop chosen",
        "Confirm name on SOS business search → registered agent set → formation doc pre-filled",
        "Apply for EIN live → confirmation letter saved",
        "Score top 8 risks → top 3 mitigations drafted",
      ],
    },
    shipReadyArtifact: {
      title: "Legal Kit — Operating Agreement + T&Cs + Service Agreement + Risk Register + Advisor Outreach",
      format: "DOCX × 4 + PDF · legally reviewed frameworks",
      aiModel: `${AI_DEFAULT} · legal templates staff-reviewed before release`,
      contains: [
        "Operating Agreement DOCX customized to your members and ownership split",
        "Terms of Service + Privacy Policy tailored to your offer and state",
        "1-page Service Agreement / SOW for your first sale",
        "Risk Register PDF with top 3 mitigations drafted",
        "Advisor Outreach Pack — 3 personalized emails to prospective advisors in your industry",
      ],
      released: "Sharpened live with staff review and saved to your dashboard — a working draft you continue to refine, not a finished product. EIN confirmation arrives from IRS separately.",
    },
    takeHomeKit: {
      headline: "In your dashboard by 11:30 AM",
      files: [
        { name: "EIN Confirmation Letter", format: "PDF", note: "IRS-issued in session" },
        { name: "Pre-filled Formation Doc", format: "State-specific PDF", note: "Submit from home in ~10 min" },
        { name: "Operating Agreement", format: "DOCX", note: "Customized to your members" },
        { name: "T&Cs + Privacy Policy", format: "DOCX × 2", note: "Paste into your site after the session" },
        { name: "1-page Service Agreement / SOW", format: "DOCX", note: "Sign your first client Monday" },
        { name: "Risk Register + Advisor Outreach", format: "PDF + DOCX × 3", note: "Send one advisor email this week" },
      ],
      mondayMove: "Submit your state's formation doc + filing fee (10 min). Open the business bank account when the entity is approved.",
    },
    deliverableDetails: [
      {
        buildMechanic: "5-question entity decision tree tuned to your revenue and salary plans; plain-English recommendation.",
        inputs: ["Foundation · Executive Summary", "Finance · Funding Strategy"],
        takeaway: "Structure locked. You set the business up correctly the first time.",
      },
      {
        buildMechanic: "Likelihood × impact scoring on 8 risks; top 3 get named mitigations drafted in-room.",
        inputs: ["Foundation", "Strategy", "Operations", "Finance"],
        takeaway: "You've seen the predictable problems coming and defused the top three.",
      },
      {
        buildMechanic: "Advisor mapping canvas + 3 personalized outreach emails sourced from your industry.",
        inputs: ["Foundation · Vision & Mission", "Your industry"],
        takeaway: "You've got real names to email and the drafts ready to send.",
      },
    ],
  },

  brand: {
    slug: "brand",
    perspective:
      "This session applies a brand-lead lens — how a strategist who has shaped dozens of brands stress-tests your positioning, messaging, and visual direction so the brand system feels intentional rather than accidental.",
    signatureBuild: {
      title: "Brand Strategy Framework + Messaging House + Visual direction",
      duration: "25 min live",
      inputs: [
        "Foundation + Strategy outputs (auto-loaded)",
        "3 brands you admire and why",
        "Words that feel right / wrong for your voice",
      ],
      mechanic:
        "Brand Strategy Framework (Purpose · Promise · Audience · Positioning) filled live. Messaging House built from your Value Prop. Visual direction chosen from 3 AI-generated moodboards. Logo concepts and palette generated in-session.",
    },
    liveWorksheet: {
      headline: "What runs on screen while you work",
      steps: [
        "Purpose · Promise · Audience · Positioning drafted on a single canvas",
        "Messaging House: headline + 3 supporting messages + 3 proof points",
        "Pick 1 of 3 AI-generated moodboards → direction locked",
        "Logo concepts and color palette generated in-room",
      ],
    },
    shipReadyArtifact: {
      title: "Brand Starter Kit — Strategy + Messaging + Visual Brief + Logo + Palette",
      format: "PDF × 3 + DOCX + PNG/SVG logo set + palette",
      aiModel: `${AI_DEFAULT} + AI image generation for logos and moodboards`,
      contains: [
        "Brand Strategy Framework PDF",
        "Messaging House PDF (headline + 3 supporting + 3 proof points)",
        "Visual Identity Brief DOCX ready to hand to a designer OR paste into an AI branding tool",
        "3 AI-generated logo concepts (PNG + SVG)",
        "Color palette + type pairing (hex codes + Google Fonts links)",
        "Voice & Tone one-pager with do/don't examples",
      ],
      released: "Sharpened live with staff review and saved to your dashboard — a working draft you continue to refine, not a finished product. Full Guidelines Book continues on your dashboard.",
    },
    takeHomeKit: {
      headline: "In your dashboard by 11:30 AM",
      files: [
        { name: "Brand Strategy Framework", format: "PDF", note: "The strategic foundation" },
        { name: "Messaging House", format: "PDF", note: "Every writer pulls from this well" },
        { name: "Visual Identity Brief", format: "DOCX", note: "Hand to a designer" },
        { name: "Logo Concepts", format: "PNG + SVG · 3 options", note: "Pick one, iterate" },
        { name: "Palette + Type Pairing", format: "PDF + Google Fonts links", note: "Use immediately" },
        { name: "Voice & Tone One-pager", format: "PDF", note: "Anyone writing for you sounds like you" },
      ],
      mondayMove: "Pick your favorite logo concept, drop palette + fonts into your existing site or social profiles.",
    },
    deliverableDetails: [
      {
        buildMechanic: "Purpose · Promise · Audience · Positioning canvas filled live from Foundation + Strategy inputs.",
        inputs: ["Foundation · Vision & Mission", "Strategy · Positioning"],
        takeaway: "Every logo, color, and word downstream now has a reason behind it.",
      },
      {
        buildMechanic: "Headline + 3 supporting messages + 3 proof points assembled from Value Prop and Personas.",
        inputs: ["Foundation · Value Proposition", "Strategy · Personas"],
        takeaway: "You stop staring at a blinking cursor wondering what to say.",
      },
      {
        buildMechanic: "Visual Identity Brief DOCX generated for a designer; 3 moodboards generated live.",
        inputs: ["Brand Strategy Framework", "3 brands you admire"],
        takeaway: "You skip months of revisions on an identity you actually love.",
      },
      {
        buildMechanic: "Voice & Tone one-pager with word choice, rhythm, and do/don't examples.",
        inputs: ["Messaging House", "Words that feel right / wrong for you"],
        takeaway: "Founders and contractors all produce on-brand copy.",
      },
      {
        buildMechanic: "Continues on dashboard — Brand Guidelines Book assembles from every prior artifact.",
        inputs: ["Everything above"],
        takeaway: "One asset any vendor or new hire can use to stay on brand.",
      },
    ],
  },

  marketing: {
    slug: "marketing",
    perspective:
      "This session applies a product-and-web lens — how a seasoned PM/marketer reviews your site plan, sequences pages and CTAs, and directs you toward a build you can actually ship fast.",
    signatureBuild: {
      title: "Website PRD + AI-builder Prompt Pack + Copy Deck",
      duration: "25 min live",
      inputs: [
        "Foundation + Strategy + Brand outputs (auto-loaded)",
        "Sitemap choice (3 templates matched to your business model)",
        "CTAs + integrations (payments, email, analytics)",
      ],
      mechanic:
        "PRD assembles pages, sections, copy blocks, and CTAs from prior outputs. Copy Deck writes every H1/H2/body in your brand voice. AI-builder prompt pack generated for Lovable, Bolt, and v0. Attendees who bring a laptop start the build in-room.",
    },
    liveWorksheet: {
      headline: "What runs on screen while you work",
      steps: [
        "Pick your sitemap from 3 templates matched to your business model",
        "Select CTAs and integrations (payments, email, analytics)",
        "PRD auto-assembles — pages, sections, image briefs, CTAs",
        "Copy Deck writes every H1/H2/body in your brand voice",
        "AI-builder prompt pack generated → paste into Lovable / Bolt / v0",
      ],
    },
    shipReadyArtifact: {
      title: "Website Package — PRD + AI-builder Prompts + Copy Deck + Fast Build Checklist",
      format: "PDF · full PRD + DOCX copy deck + TXT prompt pack",
      aiModel: AI_DEFAULT,
      contains: [
        "Website PRD — full pages, sections, copy blocks, CTAs, image briefs",
        "AI-builder Prompt Pack — 3 ready-to-paste prompts optimized for Lovable, Bolt, and v0",
        "Copy Deck DOCX — every page's H1/H2/body written in your brand voice",
        "Fast Build Checklist (plan → scaffold → live)",
      ],
      released: "Sharpened live with staff review and saved to your dashboard — a working draft you continue to refine, not a finished product. Attendees with a laptop leave with v0 scaffolded.",
    },
    takeHomeKit: {
      headline: "In your dashboard by 11:30 AM",
      files: [
        { name: "Website PRD", format: "PDF · full spec", note: "The blueprint" },
        { name: "AI-Builder Prompts", format: "TXT × 3 (Lovable, Bolt, v0)", note: "Copy-paste to scaffold" },
        { name: "Copy Deck", format: "DOCX · every page written", note: "H1/H2/body in your voice" },
        { name: "Fast Build Checklist", format: "PDF · 1 page", note: "Plan → scaffold → live" },
      ],
      mondayMove: "Next move: paste the prompt into Lovable, wire payments/email/analytics from the checklist, ship v1.",
    },
    deliverableDetails: [
      {
        buildMechanic: "PRD generator assembles pages, sections, copy blocks, CTAs, and image briefs from prior stage outputs. AI-builder prompt pack + Copy Deck bundled.",
        inputs: [
          "Foundation · Value Proposition",
          "Strategy · Personas + GTM",
          "Brand · Messaging House + Visual Brief",
        ],
        takeaway: "You skip the $20K agency quote and launch a real revenue-ready site fast.",
      },
    ],
  },

  "social-and-content": {
    slug: "social-and-content",
    perspective:
      "This session applies a distribution-lead lens — how a content strategist reviews your pillars, calendar, and launch plan and redirects you toward posts that earn attention on repeat, not just fill a queue.",
    signatureBuild: {
      title: "Content Pillars + First 14 posts + Launch Week Kit",
      duration: "25 min live",
      inputs: [
        "Strategy Personas + Positioning (auto-loaded)",
        "Brand Messaging House + Voice (auto-loaded)",
        "Your launch date and top 2 platforms",
      ],
      mechanic:
        "Content Pillars (3–5 themes) generated from Positioning + Personas. 90-day calendar CSV auto-drafted. First 14 posts fully written (LinkedIn + IG variants). Launch Week kit assembled. Paid Ads Starter generated. 5 launch graphics generated.",
    },
    liveWorksheet: {
      headline: "What runs on screen while you work",
      steps: [
        "Pillars generated → 3–5 themes locked",
        "90-day calendar CSV drafted (post ideas, hooks, formats, visuals)",
        "First 14 posts written in LinkedIn + Instagram variants",
        "Launch Week kit assembled (announcement, 5 captions, 3 emails, share-with-friends)",
        "5 launch graphics generated (LinkedIn / IG / Twitter sizes)",
      ],
    },
    shipReadyArtifact: {
      title: "Distribution Kit — Pillars + 90-day Calendar + First 14 Posts + Launch Week + Paid Ads Starter",
      format: "PDF + CSV + DOCX + PNG × 5",
      aiModel: `${AI_DEFAULT} + AI image generation for launch graphics`,
      contains: [
        "Content Pillars PDF (3–5 themes)",
        "90-Day Content Calendar CSV (importable to Buffer/Later/Notion) — 90 post ideas with hooks + formats + visual notes",
        "First 14 Posts fully written (LinkedIn + Instagram variants)",
        "Launch Week Kit — announcement post, 5 captions, 3 email templates, share-with-friends message",
        "Paid Ads Starter — 3 target segments, 5 ad hooks, budget guardrails",
        "5 AI-generated launch graphics sized for LinkedIn/IG/Twitter",
      ],
      released: "Sharpened live with staff review and saved to your dashboard — a working draft you continue to refine, not a finished product. First 14 posts can be scheduled in-room if you connect your account.",
    },
    takeHomeKit: {
      headline: "In your dashboard by 11:30 AM",
      files: [
        { name: "Content Pillars", format: "PDF", note: "Your 3–5 themes" },
        { name: "90-Day Calendar", format: "CSV · Buffer/Later/Notion import", note: "90 posts with hooks" },
        { name: "First 14 Posts", format: "DOCX · LinkedIn + IG variants", note: "Publish this week" },
        { name: "Launch Week Kit", format: "DOCX + email templates", note: "Announcement + captions + emails" },
        { name: "Paid Ads Starter", format: "PDF", note: "3 targets, 5 hooks, guardrails" },
        { name: "Launch Graphics", format: "PNG × 5", note: "Sized for LinkedIn/IG/Twitter" },
      ],
      mondayMove: "Schedule the first 14 posts. Send your announcement email Tuesday morning.",
    },
    deliverableDetails: [
      {
        buildMechanic: "Audit script + platform setup checklist tuned to the 2 platforms your personas actually use.",
        inputs: ["Strategy · Personas", "Brand · Messaging House"],
        takeaway: "You show up looking professional everywhere your buyer looks.",
      },
      {
        buildMechanic: "Pillar generator from Positioning + Personas → 3–5 recognizable themes.",
        inputs: ["Strategy · Positioning + Personas"],
        takeaway: "You stop posting random updates and build a recognizable voice.",
      },
      {
        buildMechanic: "90 post ideas with hooks + formats + visual notes; CSV importable to Buffer/Later/Notion.",
        inputs: ["Content Pillars", "Brand · Voice & Tone"],
        takeaway: "You never stare at a blank calendar again.",
      },
      {
        buildMechanic: "Announcement post, 5 captions, 3 email templates, share-with-friends message + 5 launch graphics.",
        inputs: ["Foundation · Value Proposition", "Brand Starter Kit"],
        takeaway: "You launch loud instead of quietly; day one becomes real traction.",
      },
      {
        buildMechanic: "Reply, DM, and review templates + rules that turn followers into fans.",
        inputs: ["Brand · Voice & Tone", "Operations · Sales Playbook"],
        takeaway: "You build word-of-mouth no ad budget can buy.",
      },
      {
        buildMechanic: "Partner brief template + list of local influencer + partner archetypes for your category.",
        inputs: ["Strategy · Personas", "Brand Starter Kit"],
        takeaway: "You unlock collaborations that put you in front of warm audiences for free.",
      },
      {
        buildMechanic: "3 targets + 5 ad hooks + budget guardrails tuned to your offer and buyer.",
        inputs: ["Strategy · Personas + GTM", "Finance · Unit Economics"],
        takeaway: "You launch paid without burning rent money and scale only what pays back.",
      },
    ],
  },
};

export function getStageProductization(slug: string): StageProductization | undefined {
  return STAGE_PRODUCTIZATION[slug];
}
