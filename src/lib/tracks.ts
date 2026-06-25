// Single source of truth for startup "tracks" — used by the create flow,
// snapshot detail, and AI prompts (deep research + document generation).

export type TrackKey =
  | "lifestyle"
  | "small_business"
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
    label: "Lifestyle / Main Street",
    oneLiner: "Revenue over scale — local services & solo founders",
    description:
      "Businesses built around the founder's life, skill, or community. Local services, restaurants, salons, gyms, freelancers, solo consultants.",
    tonePrompt:
      "Write as a pragmatic operator coaching a sole founder running a lifestyle / main-street business. Optimize for cash flow, simplicity, low overhead, and local credibility. Avoid VC jargon, TAM/SAM/SOM framing, hockey-stick growth language, and 'unicorn' aspirations. Use concrete, plain-English tactics a non-technical owner can execute this week.",
  },
  {
    key: "small_business",
    label: "Small Business / Traditional",
    oneLiner: "Profit & longevity — shops, agencies, trades",
    description:
      "Established business models run for profit and longevity. Retail shops, agencies, regional franchises, trades, professional services. Scalable within limits — not venture-track.",
    tonePrompt:
      "Write as a seasoned small-business advisor. Emphasize unit economics, margin, repeat customers, operational discipline, and steady regional growth. Avoid venture-capital framing; prefer SBA / bank-financing realities, owner-operator workflows, and proven playbooks over experimental ones.",
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
