import { BUILD_LAYER } from "@/lib/framework-deliverables";
import type { LucideIcon } from "lucide-react";
import {
  Palette,
  Globe,
  Share2,
  PenTool,
  Sparkles,
  Mail,
  TrendingUp,
  Scale,
  Rocket,
  Megaphone,
  Settings,
} from "lucide-react";

export type AgencyService = {
  slug: string;
  capability: string; // must match BUILD_LAYER[].title exactly
  icon: LucideIcon;
  oneLiner: string;
  deliverables: string[];
  priceLabel: string;
  timelineLabel: string;
  workshopHref: string;
  ctaHref: string;
};

// Order matches BUILD_LAYER 1:1.
export const AGENCY_SERVICES: AgencyService[] = [
  {
    slug: "brand-identity",
    capability: "Brand identity",
    icon: Palette,
    oneLiner: "A premium brand system, shipped in 14 days — not a logo, a language.",
    deliverables: [
      "Logo system + usage rules",
      "Voice, archetype, and visual guidelines",
      "Asset pack (favicon, social, deck, signature)",
    ],
    priceLabel: "From $2,900",
    timelineLabel: "2 weeks",
    workshopHref: "/build/brand-identity",
    ctaHref: "/contact?service=brand-identity",
  },
  {
    slug: "website-that-converts",
    capability: "A website that converts",
    icon: Globe,
    oneLiner: "A revenue surface — not a brochure — wired to payments and analytics on day one.",
    deliverables: [
      "Site design, build, and on-page copy",
      "Stripe, GA4, and CRM events wired live",
      "Pre-launch QA + post-launch CRO sprint",
    ],
    priceLabel: "From $4,800",
    timelineLabel: "2–3 weeks",
    workshopHref: "/build/website-that-converts",
    ctaHref: "/contact?service=website-that-converts",
  },
  {
    slug: "social-presence",
    capability: "Social presence",
    icon: Share2,
    oneLiner: "Two channels, owned. Profiles rebuilt to convert, a calendar shipped, cadence held.",
    deliverables: [
      "Channel selection + profile rebuild",
      "30-day content calendar with assets",
      "Posting + engagement stack you can run weekly",
    ],
    priceLabel: "From $1,800 setup + $1,200/mo",
    timelineLabel: "Live in 2 weeks",
    workshopHref: "/build/social-presence",
    ctaHref: "/contact?service=social-presence",
  },
  {
    slug: "content-engine",
    capability: "A content engine",
    icon: PenTool,
    oneLiner: "Pillars, SEO map, and eight anchor pieces a month — repurposed across every channel.",
    deliverables: [
      "Editorial system + 90-day calendar",
      "8 anchor pieces / month (blog, video, or both)",
      "Repurposing flow into social, email, SEO",
    ],
    priceLabel: "From $2,400/mo",
    timelineLabel: "Ongoing",
    workshopHref: "/build/content-engine",
    ctaHref: "/contact?service=content-engine",
  },
  {
    slug: "email-crm-automation",
    capability: "Email, CRM, and automation",
    icon: Mail,
    oneLiner: "The follow-up machine. CRM live, sequences written, deliverability fixed — for good.",
    deliverables: [
      "CRM picked, set up, and your data imported",
      "3 production sequences (welcome, nurture, win-back)",
      "Lifecycle automation + SPF/DKIM/DMARC dialed",
    ],
    priceLabel: "From $3,200",
    timelineLabel: "3 weeks",
    workshopHref: "/build/email-crm-automation",
    ctaHref: "/contact?service=email-crm-automation",
  },
  {
    slug: "sales-systems",
    capability: "Sales systems",
    icon: TrendingUp,
    oneLiner: "A repeatable motion: ICP, script, pipeline, and the weekly rhythm that holds it together.",
    deliverables: [
      "ICP scorecard + discovery script",
      "Pipeline built in your CRM with exit criteria",
      "30-day enablement so your team runs it solo",
    ],
    priceLabel: "From $3,800",
    timelineLabel: "30 days",
    workshopHref: "/build/sales-systems",
    ctaHref: "/contact?service=sales-systems",
  },
  {
    slug: "legal-financial-ops",
    capability: "Legal, financial, and operational scaffolding",
    icon: Scale,
    oneLiner: "LLC, EIN, contracts, books, payroll — done, not promised.",
    deliverables: [
      "Entity formation + EIN + bank-ready paperwork",
      "Contract suite (MSA, NDA, contractor, IP)",
      "Bookkeeping + invoicing + insurance checklist",
    ],
    priceLabel: "From $1,200",
    timelineLabel: "10 business days",
    workshopHref: "/build/legal-financial-ops",
    ctaHref: "/contact?service=legal-financial-ops",
  },
];

// Sanity: make sure capability names mirror BUILD_LAYER ordering and labels.
// (Runs once at module load in dev — silent in prod.)
if (import.meta.env?.DEV) {
  const lhs = AGENCY_SERVICES.map((s) => s.capability).join("|");
  const rhs = BUILD_LAYER.map((b) => b.title).join("|");
  if (lhs !== rhs) {
    // eslint-disable-next-line no-console
    console.warn("[agency-services] capability order drift vs BUILD_LAYER", { lhs, rhs });
  }
}

export type AgencyTrack = {
  slug: "launch" | "growth" | "operate";
  name: string;
  icon: LucideIcon;
  tagline: string;
  outcome: string;
  includedSlugs: string[];
  priceLabel: string;
  timelineLabel: string;
  featured?: boolean;
  ctaHref: string;
};

export const AGENCY_TRACKS: AgencyTrack[] = [
  {
    slug: "launch",
    name: "Launch Track",
    icon: Rocket,
    tagline: "From an idea to a business you can take money for.",
    outcome:
      "Brand, website, and the legal scaffolding to invoice on day one. Most founders' first three months — compressed into four weeks.",
    includedSlugs: ["brand-identity", "website-that-converts", "legal-financial-ops"],
    priceLabel: "Bespoke — priced after a 20-min discovery call",
    timelineLabel: "Sprint engagement",
    ctaHref: "/contact?track=launch",
  },
  {
    slug: "growth",
    name: "Growth Track",
    icon: Megaphone,
    tagline: "Automate how customers find you — and turn attention into profit.",
    outcome:
      "Distribution you own, content that compounds, and an automated follow-up machine that extracts the revenue first-touch sales always leaves behind.",

    includedSlugs: ["social-presence", "content-engine", "email-crm-automation"],
    priceLabel: "Bespoke — priced after a 20-min discovery call",
    timelineLabel: "Monthly retainer",
    featured: true,
    ctaHref: "/contact?track=growth",
  },
  {
    slug: "operate",
    name: "Operate Track",
    icon: Settings,
    tagline: "Streamline the work, automate the busywork, keep more of every dollar.",
    outcome:
      "The busywork automated and the follow-up handled, so two people do the work of ten. A sales motion that runs without you — and a leaner cost base that turns the same revenue into more profit.",

    includedSlugs: ["email-crm-automation", "sales-systems"],
    priceLabel: "Bespoke — priced after a 20-min discovery call",
    timelineLabel: "30-day sprint",
    ctaHref: "/contact?track=operate",
  },
];

export function getAgencyService(slug: string): AgencyService | undefined {
  return AGENCY_SERVICES.find((s) => s.slug === slug);
}
