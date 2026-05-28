export type BusinessCategory =
  | "online"
  | "main-street"
  | "service"
  | "food"
  | "side"
  | "family";

export type BusinessIdea = {
  name: string;
  category: BusinessCategory;
  offer: string;
  startupCost: string;
  incomePotential: string;
  firstCustomers: string;
  stageHint: string;
};

export const BUSINESS_CATEGORIES: { id: BusinessCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "online", label: "Online" },
  { id: "main-street", label: "Main Street" },
  { id: "service", label: "Service" },
  { id: "food", label: "Food & Hands" },
  { id: "side", label: "Side hustle → full-time" },
  { id: "family", label: "Family-run" },
];

export const BUSINESS_IDEAS: BusinessIdea[] = [
  // Online
  {
    name: "AI inbox cleanup for small businesses",
    category: "online",
    offer: "Done-for-you email triage and templates. $300/month per client.",
    startupCost: "Starts under $200",
    incomePotential: "$2k–$6k / mo",
    firstCustomers: "Local realtors, contractors, LinkedIn DMs",
    stageHint: "Stage 2 builds your offer.",
  },
  {
    name: "Etsy shop: custom Cricut nursery signs",
    category: "online",
    offer: "Personalized name signs for baby showers. $35–$85 each.",
    startupCost: "Starts under $600",
    incomePotential: "$1.5k–$5k / mo",
    firstCustomers: "Etsy traffic, Instagram, baby-shower hashtags",
    stageHint: "Stage 5 builds your brand & shop.",
  },
  {
    name: "Faceless YouTube — Atlanta history shorts",
    category: "online",
    offer: "60-second videos, ad revenue + sponsors after 1,000 subs.",
    startupCost: "Starts under $100",
    incomePotential: "$500–$4k / mo",
    firstCustomers: "TikTok cross-posts, Atlanta Reddit, history groups",
    stageHint: "Stage 6 writes your first 6 scripts.",
  },
  {
    name: "Notion templates for small contractors",
    category: "online",
    offer: "Job tracker + estimate template pack. $49 one-time.",
    startupCost: "Starts under $100",
    incomePotential: "$1k–$4k / mo",
    firstCustomers: "Contractor Facebook groups, Gumroad, LinkedIn",
    stageHint: "Stage 2 picks who you sell to.",
  },
  {
    name: "Remote bookkeeping for barbershops",
    category: "online",
    offer: "Monthly books + tax-ready reports. $250/month per shop.",
    startupCost: "Starts under $500",
    incomePotential: "$3k–$8k / mo",
    firstCustomers: "5 shops in your zip code, walk in, leave a card",
    stageHint: "Stage 7 gets your first 5 clients.",
  },

  // Main Street
  {
    name: "Mobile car detailing",
    category: "main-street",
    offer: "Wash, wax, vacuum at the customer's driveway. $75 a visit.",
    startupCost: "Starts under $1,500",
    incomePotential: "$3k–$7k / mo",
    firstCustomers: "Neighbors, apartment complexes, Facebook groups",
    stageHint: "Stage 4 builds your service flow.",
  },
  {
    name: "Pop-up nail bar inside salons",
    category: "main-street",
    offer: "Rent a chair Thursday–Saturday. $40 sets, $25 fills.",
    startupCost: "Starts under $1,000",
    incomePotential: "$2.5k–$6k / mo",
    firstCustomers: "Salon walk-ins, IG before/after posts",
    stageHint: "Stage 1 gets your license and LLC right.",
  },
  {
    name: "Pressure washing for restaurants",
    category: "main-street",
    offer: "After-hours sidewalk + grease pad cleans. $250 per stop.",
    startupCost: "Starts under $2,500",
    incomePotential: "$4k–$10k / mo",
    firstCustomers: "Walk in at 3pm with a card and a before/after photo",
    stageHint: "Stage 7 maps your first route.",
  },
  {
    name: "Vending machine route",
    category: "main-street",
    offer: "Snacks at laundromats & gyms. $400–$900/month per machine.",
    startupCost: "Starts under $3,500 (1 machine)",
    incomePotential: "$400–$900 / mo per machine",
    firstCustomers: "Laundromat owners — ask to split the revenue",
    stageHint: "Stage 2 builds your pitch to location owners.",
  },
  {
    name: "Hair braiding studio in a spare bedroom",
    category: "main-street",
    offer: "Box braids, knotless, locs by appointment. $150–$400.",
    startupCost: "Starts under $800",
    incomePotential: "$2k–$6k / mo",
    firstCustomers: "Instagram portfolio, friends-of-friends, referrals",
    stageHint: "Stage 1 gets your permits and cottage rules right.",
  },

  // Service
  {
    name: "Senior tech help — home visits",
    category: "service",
    offer: "1 hour with a patient guide. Phones, TVs, Wi-Fi. $60/hour.",
    startupCost: "Starts under $200",
    incomePotential: "$1.5k–$4k / mo",
    firstCustomers: "Church bulletins, senior centers, NextDoor",
    stageHint: "Stage 2 writes your offer in plain English.",
  },
  {
    name: "Pet sitting & dog walking",
    category: "service",
    offer: "30-min walks + weekend sit-ins. $25 walk, $75 overnight.",
    startupCost: "Starts under $400",
    incomePotential: "$1.5k–$5k / mo",
    firstCustomers: "Rover, NextDoor, vet office bulletin boards",
    stageHint: "Stage 5 gets your booking page live.",
  },
  {
    name: "Mobile notary + loan signing agent",
    category: "service",
    offer: "On-site signings. $75–$200 per appointment.",
    startupCost: "Starts under $700",
    incomePotential: "$2k–$6k / mo",
    firstCustomers: "Title companies, real estate offices, Snapdocs",
    stageHint: "Stage 1 walks you through the credentials.",
  },
  {
    name: "Route-based lawn care",
    category: "service",
    offer: "Two yards a day, same street. $50–$80 per cut.",
    startupCost: "Starts under $2,000",
    incomePotential: "$3k–$8k / mo (in season)",
    firstCustomers: "Door hangers on one street, then the next",
    stageHint: "Stage 7 builds your 90-day route plan.",
  },
  {
    name: "Junk hauling with a pickup truck",
    category: "service",
    offer: "Garage cleanouts, estate cleanups. $150–$600 per job.",
    startupCost: "Starts under $1,500",
    incomePotential: "$3k–$9k / mo",
    firstCustomers: "Thumbtack, Facebook Marketplace, realtors",
    stageHint: "Stage 6 builds your ad creatives.",
  },

  // Food & Hands
  {
    name: "Sunday meal prep for working moms",
    category: "food",
    offer: "5 dinners, dropped off Sunday. $90/week per family.",
    startupCost: "Starts under $500 (cottage law)",
    incomePotential: "$2k–$5k / mo",
    firstCustomers: "10 moms in your subdivision, then their friends",
    stageHint: "Stage 4 builds your weekly delivery flow.",
  },
  {
    name: "Caribbean lunch plates at office parks",
    category: "food",
    offer: "Pre-order Friday lunches. $14 a plate, 30 plates a day.",
    startupCost: "Starts under $1,200",
    incomePotential: "$1.5k–$4k / mo (1 day a week)",
    firstCustomers: "One office park, one email blast, one Friday",
    stageHint: "Stage 2 builds the menu and pricing.",
  },
  {
    name: "Cottage-law wedding cookie favors",
    category: "food",
    offer: "Custom decorated cookies. $4–$8 per cookie, 50+ orders.",
    startupCost: "Starts under $400",
    incomePotential: "$1k–$4k / mo (seasonal)",
    firstCustomers: "Wedding planners, IG, The Knot",
    stageHint: "Stage 5 builds your portfolio site.",
  },
  {
    name: "Office BBQ catering for Fridays",
    category: "food",
    offer: "Drop-off lunches for teams of 10–40. $18 per person.",
    startupCost: "Starts under $2,000",
    incomePotential: "$3k–$8k / mo",
    firstCustomers: "Office managers in 2 buildings near you",
    stageHint: "Stage 6 writes your outreach emails.",
  },
  {
    name: "Cold-pressed juice subscription",
    category: "food",
    offer: "Weekly 6-pack drop-off. $42/week per subscriber.",
    startupCost: "Starts under $2,500",
    incomePotential: "$2k–$6k / mo",
    firstCustomers: "Yoga studios, gyms, IG fitness accounts",
    stageHint: "Stage 5 builds your subscription page.",
  },

  // Side hustle → full-time
  {
    name: "Real estate photography for agents",
    category: "side",
    offer: "Listing photo + video package. $250–$500 per home.",
    startupCost: "Starts under $1,500 (used DSLR + drone)",
    incomePotential: "$2.5k–$8k / mo",
    firstCustomers: "3 agents at one brokerage. Word travels fast.",
    stageHint: "Stage 6 builds your sample reel.",
  },
  {
    name: "Resume + LinkedIn rewrites",
    category: "side",
    offer: "Career-switcher package. $350 per client.",
    startupCost: "Starts under $100",
    incomePotential: "$1.5k–$5k / mo",
    firstCustomers: "LinkedIn posts, alumni groups, career-change Reddit",
    stageHint: "Stage 2 writes your one-sentence offer.",
  },
  {
    name: "Wedding officiant + ceremony coach",
    category: "side",
    offer: "Custom ceremony + rehearsal. $400–$900 per wedding.",
    startupCost: "Starts under $200",
    incomePotential: "$1.5k–$5k / mo (seasonal)",
    firstCustomers: "Wedding planners, Zola, The Knot",
    stageHint: "Stage 5 builds your booking site.",
  },
  {
    name: "Short-form video editing for realtors",
    category: "side",
    offer: "8 reels/month, captions + music. $600/month retainer.",
    startupCost: "Starts under $300 (CapCut + a fast laptop)",
    incomePotential: "$2k–$6k / mo",
    firstCustomers: "DM 50 realtors in your city with a free sample edit",
    stageHint: "Stage 7 gets your first 3 retainers.",
  },

  // Family-run
  {
    name: "Saturday car wash with your teenagers",
    category: "family",
    offer: "$25 hand wash, $40 with interior. 12 cars a Saturday.",
    startupCost: "Starts under $300",
    incomePotential: "$800–$2k / mo (1 day a week)",
    firstCustomers: "Driveway sign, church parking lot permission",
    stageHint: "Stage 4 builds the weekly workflow.",
  },
  {
    name: "Family handyman crew",
    category: "family",
    offer: "One truck, one trade at a time. $85/hour, 2-hour minimum.",
    startupCost: "Starts under $1,500",
    incomePotential: "$3k–$9k / mo",
    firstCustomers: "Thumbtack + 25 doors in one subdivision",
    stageHint: "Stage 7 plans your first 90 days.",
  },
  {
    name: "Husband-and-wife Airbnb cleaning",
    category: "family",
    offer: "Turnovers between guests. $90–$140 per clean.",
    startupCost: "Starts under $400",
    incomePotential: "$2.5k–$7k / mo",
    firstCustomers: "Message 20 Airbnb hosts in your city directly",
    stageHint: "Stage 2 builds the pitch to hosts.",
  },
];
