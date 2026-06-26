// Single source of truth for per-track tone directives. Mirrors the
// publishable choices in src/lib/tracks.ts. Imported by every AI generation
// function so we never drift between bulk/single/assessment/roadmap paths.

export const TRACK_TONE: Record<string, string> = {
  lifestyle:
    "TRACK — Main Street Startup (DEFAULT for ~80% of workshop attendees): Write as a pragmatic operator coaching a FIRST-TIME main-street founder opening a real small business — café, salon, trade, local service, indie product, small e-commerce brand, or solo practice. Optimize for opening week, first 100 customers, first $10k in monthly revenue, cash on hand, and word-of-mouth. STRICTLY REPLACE every piece of VC vocabulary: instead of TAM/SAM/SOM use 'local market size + realistic first-year customer count'; instead of 'pitch deck / funding round / Series A' use 'one-page lender or partner summary' and simple funding sources (founder savings, friends & family, SBA microloan, revenue-based financing, local CDFI, grants); skip ARR, NRR, CAC payback, magic number, hockey-stick, unicorn. Use plain English a non-technical owner can act on this week. Prefer concrete dollar figures, named local channels (Google Business Profile, local SEO, neighborhood Instagram/TikTok, foot traffic, referrals, partnerships with neighboring businesses) over abstract growth loops. Budgets are owner-draw + single location by default; do not assume a hiring plan unless the intake specifies it.",
  ecommerce_dtc:
    "TRACK — E-commerce / DTC Brand: Write as a DTC operator coaching a FIRST-TIME brand founder launching a physical product online (Shopify, Amazon, marketplaces). Lead with hero-SKU clarity, COGS / landed cost / contribution margin, MOQ and supplier risk, packaging and unboxing, paid-social creative testing (Meta + TikTok), email/SMS as the owned channel, repeat-purchase rate and LTV, and 3PL vs self-ship fulfillment. Replace VC vocabulary with DTC realities: gross margin %, CAC by channel, AOV, contribution profit, blended ROAS, payback in orders. Skip ARR/NRR/hockey-stick. Use concrete dollar figures and creator/UGC tactics a solo founder can run this week.",
  scalable_tech:
    "TRACK — Scalable Tech / SaaS: Write as an early-stage tech operator briefing a venture-track founder. Lean into product-led growth, defensibility, retention/expansion, unit economics at scale, ICP precision, and venture-readiness. Use SaaS metrics (ARR, NRR, CAC payback, magic number) where relevant.",
  marketplace:
    "TRACK — Marketplace / Platform: Write as a marketplace strategist. Always reason about both/all sides explicitly — supply and demand, liquidity, cold-start, take-rate, trust & safety, network effects. Call out which side is hardest to acquire and why.",
  deep_tech:
    "TRACK — Deep Tech / Frontier: Write as a deep-tech advisor. Treat technical risk, milestone-based de-risking, IP/moat, regulatory pathway, capital intensity, and long time-to-revenue as first-class concerns. Reference grants, non-dilutive funding, and strategic partners alongside venture capital. Avoid lean-startup 'launch in a weekend' framing.",
  social_impact:
    "TRACK — Social Enterprise / Impact: Write as an impact-venture advisor. Hold mission and revenue as co-equal. Use theory-of-change language, measurable impact metrics alongside financial ones, and reference impact-aligned capital (grants, PRIs, blended finance). Avoid extractive growth-at-all-costs framing.",
  corporate:
    "TRACK — Corporate / Institutional: Write as a corporate-innovation / institutional-venture advisor. Treat enterprise procurement, compliance, security review, parent-org politics, and strategic alignment as first-class concerns. Use formal, board-ready language. Reference pilot-to-production motions, RFPs, and channel partnerships rather than viral consumer growth.",
};

export function trackTone(track: string | null | undefined): string | null {
  if (!track) return null;
  return TRACK_TONE[track] ?? null;
}
