// Single source of truth for startup "tracks" — used by the create flow,
// snapshot detail, and AI prompts (deep research + document generation).

export type TrackKey =
  | "lifestyle"
  | "ecommerce_dtc"
  | "scalable_tech"
  | "marketplace"
  | "deep_tech"
  | "social_impact"
  | "corporate";

export interface Track {
  key: TrackKey;
  label: string;
  oneLiner: string;
  description: string;
  /** Injected into AI system prompts to shape voice + framing. */
  tonePrompt: string;
}

export const TRACKS: Track[] = [
  {
    key: "lifestyle",
    label: "Main Street Startup",
    oneLiner: "First-time founders starting a real local or indie business",
    description:
      "The default track for most workshop attendees. First-time founders launching a café, salon, fitness studio, trade, local service, indie product, small e-commerce brand, or solo professional practice. Focus is opening week, first 100 customers, first $10k in revenue — not raising venture capital.",
    tonePrompt:
      "Write as a pragmatic operator coaching a first-time main-street founder opening a real small business — café, salon, trade, local service, indie product, small e-commerce brand, or solo practice. Optimize for opening week, first 100 customers, first $10k in monthly revenue, cash on hand, and word-of-mouth. Replace VC vocabulary entirely: instead of TAM/SAM/SOM, talk local market size and realistic first-year customer count; instead of 'pitch deck' or 'funding round', talk one-page lender/partner summary and simple funding sources (founder savings, friends & family, SBA microloan, revenue-based, local CDFI, grants). Skip ARR, CAC payback, hockey-stick, unicorn language. Use plain English a non-technical owner can act on this week. Use concrete dollar figures, real channels (local SEO, Google Business Profile, neighborhood Instagram, foot traffic, referrals, partnerships with neighboring businesses), and tactics they can execute without a team.",
  },
  {
    key: "ecommerce_dtc",
    label: "E-commerce / DTC Brand",
    oneLiner: "Physical product, launching online-first",
    description:
      "First-time founders launching a direct-to-consumer brand — apparel, beauty, food/beverage, home goods, accessories — sold via their own Shopify, Amazon, or marketplaces. Focus is product-market fit on a single hero SKU, first 1,000 customers, paid + organic content engine, and repeat-purchase economics.",
    tonePrompt:
      "Write as a DTC operator coaching a first-time brand founder. Lead with hero-SKU clarity, COGS / landed cost / contribution margin, MOQ and supplier risk, packaging and unboxing, paid-social creative testing (Meta + TikTok), Shopify funnel basics, email/SMS as the owned channel, repeat-purchase rate and LTV, and fulfillment (3PL vs self-ship). Replace VC vocabulary with DTC realities — talk gross margin %, CAC by channel, AOV, contribution profit, blended ROAS, and payback in orders. Skip ARR/NRR/hockey-stick framing. Use concrete dollar figures and creator/UGC tactics a solo founder can execute this week.",
  },
  {
    key: "scalable_tech",
    label: "Scalable Tech / SaaS",
    oneLiner: "Exponential growth, low marginal cost — VC target",
    description:
      "Software-first businesses designed for exponential growth with minimal marginal cost. SaaS platforms, mobile apps, AI tools, marketplaces, subscription products. Primary target of venture capital.",
    tonePrompt:
      "Write as an early-stage tech operator briefing a venture-track founder. Lean into product-led growth, defensibility, retention/expansion, unit economics at scale, ICP precision, and venture-readiness. Use SaaS metrics (ARR, NRR, CAC payback, magic number) where relevant.",
  },
  {
    key: "marketplace",
    label: "Marketplace / Platform",
    oneLiner: "Multi-sided, network-effects driven",
    description:
      "Two-sided or multi-sided businesses that connect buyers and sellers, creators and consumers, or service providers and clients. Value grows with network effects. Gig economy, e-commerce platforms, aggregators.",
    tonePrompt:
      "Write as a marketplace strategist. Always reason about both (or all) sides explicitly — supply and demand, liquidity, cold-start, take-rate, trust & safety, and network effects. Avoid single-sided SaaS framing. Call out which side is hardest to acquire and why.",
  },
  {
    key: "deep_tech",
    label: "Deep Tech / Frontier",
    oneLiner: "High R&D, breakthrough-dependent",
    description:
      "High R&D, long runway, breakthrough-dependent. Biotech, quantum, robotics, space tech, advanced materials, AI infrastructure. Often spun out of universities or research labs.",
    tonePrompt:
      "Write as a deep-tech / frontier-tech advisor. Treat technical risk, milestone-based de-risking, IP/moat, regulatory pathway, capital intensity, and long time-to-revenue as first-class concerns. Avoid lean-startup 'launch in a weekend' framing. Reference grants, non-dilutive funding, and strategic partners alongside venture capital.",
  },
  {
    key: "social_impact",
    label: "Social Enterprise / Impact",
    oneLiner: "Mission built into the business model",
    description:
      "Mission-driven ventures where social, environmental, or civic impact is built into the business model. Nonprofits, B-corps, cooperatives, hybrid structures. Revenue sustains the mission.",
    tonePrompt:
      "Write as an impact-venture advisor. Hold mission and revenue as co-equal — never subordinate impact to growth or vice versa. Use theory-of-change language, measurable impact metrics alongside financial ones, and reference impact-aligned capital (grants, PRIs, blended finance) where relevant. Avoid extractive growth-at-all-costs framing.",
  },
  {
    key: "corporate",
    label: "Corporate / Institutional",
    oneLiner: "Spinouts, intrapreneurial, gov-tech",
    description:
      "Startups that originate from within or in service of larger organizations. Corporate spinouts, intrapreneurial ventures, government-tech firms, acqui-hire targets. Backed by institutional capital or strategic parents.",
    tonePrompt:
      "Write as a corporate-innovation / institutional-venture advisor. Treat enterprise procurement, compliance, security review, parent-org politics, and strategic alignment as first-class concerns. Use formal, board-ready language. Reference pilot-to-production motions, RFPs, and channel partnerships rather than viral consumer growth.",
  },
];

export const TRACK_BY_KEY: Record<TrackKey, Track> = TRACKS.reduce(
  (acc, t) => ({ ...acc, [t.key]: t }),
  {} as Record<TrackKey, Track>,
);

export function getTrack(key: string | null | undefined): Track | null {
  if (!key) return null;
  return (TRACK_BY_KEY as Record<string, Track>)[key] ?? null;
}

// ===== Test-fill seeds — used by the dev "🧪 Fill test concept" button =====
// Each seed is a real, public homepage we can scrape, paired with the
// realistic defaults a founder on that track would type into the form.

export type SeedEntry = {
  url: string;
  industry: string;
  sub_industry?: string;
  market_scope: "local" | "regional" | "national" | "international";
  city?: string;
  region?: string;
  country?: string;
};

export const TRACK_SEEDS: Record<TrackKey, SeedEntry[]> = {
  lifestyle: [
    { url: "https://bellinabakery.com", industry: "Food & Beverage", sub_industry: "Independent neighborhood bakery", market_scope: "local", city: "Atlanta", region: "Georgia", country: "United States" },
    { url: "https://bluebottlecoffee.com", industry: "Food & Beverage", sub_industry: "Independent coffee shop", market_scope: "local", city: "Atlanta", region: "Georgia", country: "United States" },
    { url: "https://www.drybar.com", industry: "Personal Care", sub_industry: "Neighborhood blowout salon", market_scope: "local", city: "Atlanta", region: "Georgia", country: "United States" },
    { url: "https://www.detailgarage.com", industry: "Home & Auto Services", sub_industry: "Mobile auto detailing", market_scope: "local", city: "Atlanta", region: "Georgia", country: "United States" },
    { url: "https://www.glossier.com", industry: "Beauty / Indie Brand", sub_industry: "Indie skincare e-commerce", market_scope: "national", city: "Atlanta", region: "Georgia", country: "United States" },
    { url: "https://www.f45training.com", industry: "Health & Fitness", sub_industry: "Neighborhood fitness studio", market_scope: "local", city: "Atlanta", region: "Georgia", country: "United States" },
  ],
  small_business: [
    { url: "https://www.acehardware.com", industry: "Retail", sub_industry: "Independent hardware store", market_scope: "national", city: "Oak Brook", region: "Illinois", country: "United States" },
    { url: "https://www.servpro.com", industry: "Home Services", sub_industry: "Restoration franchise", market_scope: "regional", city: "Gallatin", region: "Tennessee", country: "United States" },
    { url: "https://www.hrblock.com", industry: "Professional Services", sub_industry: "Tax preparation", market_scope: "national", city: "Kansas City", region: "Missouri", country: "United States" },
    { url: "https://www.midas.com", industry: "Automotive Services", sub_industry: "Auto repair franchise", market_scope: "regional", city: "Palm Beach Gardens", region: "Florida", country: "United States" },
  ],
  scalable_tech: [
    { url: "https://linear.app", industry: "Software / SaaS", sub_industry: "Project management", market_scope: "international", city: "San Francisco", region: "California", country: "United States" },
    { url: "https://vercel.com", industry: "Software / SaaS", sub_industry: "Developer infrastructure", market_scope: "international", city: "San Francisco", region: "California", country: "United States" },
    { url: "https://resend.com", industry: "Software / SaaS", sub_industry: "Transactional email API", market_scope: "international", city: "San Francisco", region: "California", country: "United States" },
    { url: "https://cal.com", industry: "Software / SaaS", sub_industry: "Scheduling", market_scope: "international", city: "San Francisco", region: "California", country: "United States" },
    { url: "https://posthog.com", industry: "Software / SaaS", sub_industry: "Product analytics", market_scope: "international", city: "San Francisco", region: "California", country: "United States" },
    { url: "https://supabase.com", industry: "Software / SaaS", sub_industry: "Backend-as-a-service", market_scope: "international", city: "San Francisco", region: "California", country: "United States" },
    { url: "https://cursor.com", industry: "Software / SaaS", sub_industry: "AI code editor", market_scope: "international", city: "San Francisco", region: "California", country: "United States" },
    { url: "https://www.notion.com", industry: "Software / SaaS", sub_industry: "Collaborative workspace", market_scope: "international", city: "San Francisco", region: "California", country: "United States" },
    { url: "https://attio.com", industry: "Software / SaaS", sub_industry: "CRM", market_scope: "international", city: "London", region: "England", country: "United Kingdom" },
  ],
  marketplace: [
    { url: "https://www.etsy.com", industry: "E-commerce", sub_industry: "Handmade goods marketplace", market_scope: "international", city: "Brooklyn", region: "New York", country: "United States" },
    { url: "https://www.airbnb.com", industry: "Travel & Hospitality", sub_industry: "Short-term rental marketplace", market_scope: "international", city: "San Francisco", region: "California", country: "United States" },
    { url: "https://www.upwork.com", industry: "Marketplace / Gig", sub_industry: "Freelance services", market_scope: "international", city: "San Francisco", region: "California", country: "United States" },
    { url: "https://www.faire.com", industry: "Marketplace / Wholesale", sub_industry: "B2B retail wholesale", market_scope: "international", city: "San Francisco", region: "California", country: "United States" },
  ],
  deep_tech: [
    { url: "https://boomsupersonic.com", industry: "Aerospace", sub_industry: "Supersonic aviation", market_scope: "international", city: "Denver", region: "Colorado", country: "United States" },
    { url: "https://www.ginkgobioworks.com", industry: "Biotech", sub_industry: "Synthetic biology platform", market_scope: "international", city: "Boston", region: "Massachusetts", country: "United States" },
    { url: "https://www.anthropic.com", industry: "AI / ML", sub_industry: "Foundation models", market_scope: "international", city: "San Francisco", region: "California", country: "United States" },
    { url: "https://cfs.energy", industry: "Energy", sub_industry: "Fusion energy", market_scope: "international", city: "Devens", region: "Massachusetts", country: "United States" },
  ],
  social_impact: [
    { url: "https://www.warbyparker.com", industry: "Retail / Eyewear", sub_industry: "Buy-a-pair-give-a-pair", market_scope: "international", city: "New York", region: "New York", country: "United States" },
    { url: "https://www.toms.com", industry: "Retail / Footwear", sub_industry: "One-for-one giving", market_scope: "international", city: "Los Angeles", region: "California", country: "United States" },
    { url: "https://www.kiva.org", industry: "Nonprofit / Fintech", sub_industry: "Microloan platform", market_scope: "international", city: "San Francisco", region: "California", country: "United States" },
    { url: "https://www.charitywater.org", industry: "Nonprofit", sub_industry: "Clean water", market_scope: "international", city: "New York", region: "New York", country: "United States" },
  ],
  corporate: [
    { url: "https://www.palantir.com", industry: "Enterprise Software", sub_industry: "Government & defense analytics", market_scope: "international", city: "Denver", region: "Colorado", country: "United States" },
    { url: "https://www.anduril.com", industry: "Defense Tech", sub_industry: "Autonomous defense systems", market_scope: "international", city: "Costa Mesa", region: "California", country: "United States" },
    { url: "https://www.boozallen.com", industry: "Consulting", sub_industry: "Government consulting", market_scope: "national", city: "McLean", region: "Virginia", country: "United States" },
    { url: "https://www.govtech.com", industry: "GovTech / Media", sub_industry: "Public-sector technology", market_scope: "national", city: "Folsom", region: "California", country: "United States" },
  ],
};

export function pickSeedForTrack(key: TrackKey): SeedEntry {
  const list = TRACK_SEEDS[key];
  return list[Math.floor(Math.random() * list.length)];
}

export const ALL_SEED_URLS: string[] = Object.values(TRACK_SEEDS).flatMap((arr) =>
  arr.map((s) => s.url),
);

