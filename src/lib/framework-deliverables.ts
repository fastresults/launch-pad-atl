import {
  Compass,
  Users,
  Tag,
  LineChart,
  Map as MapIcon,
  GitBranch,
  type LucideIcon,
} from "lucide-react";

export const WORKSHOP_PRICE_CENTS = 9700;
export const WORKSHOP_PRICE_LABEL = "$97";

export type FrameworkDeliverable = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const FRAMEWORK_DELIVERABLES: FrameworkDeliverable[] = [
  {
    icon: Compass,
    title: "Positioning statement + competitive angle",
    description:
      "A defensible one-liner for what you do, who it's for, and why it wins against the alternatives.",
  },
  {
    icon: Users,
    title: "Ideal Customer Profile (1 page)",
    description:
      "A named first customer — not a demographic — with the pain, trigger, and budget that make them buy.",
  },
  {
    icon: Tag,
    title: "Offer & pricing framework",
    description:
      "Value-based anchors, competitor scan, margin math, and the price you can defend out loud.",
  },
  {
    icon: LineChart,
    title: "Revenue model + 12-month economics",
    description:
      "Back-of-envelope P&L, break-even, and the monthly cash plan that shows when this actually works.",
  },
  {
    icon: MapIcon,
    title: "90-day go-to-market roadmap",
    description:
      "Week-by-week milestones, channels, and KPIs — the first ten moves already on your calendar.",
  },
  {
    icon: GitBranch,
    title: "Build / hire / buy decision tree",
    description:
      "What to DIY, what to outsource, and what our team can build for you — with honest cost ranges.",
  },
];

export const OUT_OF_SCOPE = [
  "LLC filing, EIN, or legal docs",
  "Logo, brand identity, or website build",
  "Copywriting, content, or creative production",
  "Long-term coaching or 1:1 consulting",
];

export type ServicePackage = {
  name: string;
  tagline: string;
  priceLabel: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
};

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    name: "Strategy Sprint",
    tagline: "Two weeks. We harden your framework into an executable plan.",
    priceLabel: "From $2,500",
    bullets: [
      "Four 1:1 sessions with Adam",
      "Investor-ready pitch deck",
      "12-month financial model",
      "Fundraising kit + outreach plan",
    ],
    ctaLabel: "Book a call",
    ctaHref: "/contact?service=strategy-sprint",
    featured: true,
  },
  {
    name: "Brand & Website Build",
    tagline: "A real brand identity and a 4-page site you can run a business from.",
    priceLabel: "From $4,500",
    bullets: [
      "Logo, palette, typography system",
      "4-page website, written and SEO-configured",
      "Stripe / payments + analytics wired",
      "Delivered live in 2 weeks",
    ],
    ctaLabel: "Start project",
    ctaHref: "/contact?service=brand-website",
  },
  {
    name: "Launch Kit",
    tagline: "We handle the legal, financial, and operational scaffolding.",
    priceLabel: "From $1,800",
    bullets: [
      "LLC formation + EIN",
      "Terms, Privacy, and Service Agreement",
      "Business bank + license checklist",
      "Bookkeeping + invoicing setup",
    ],
    ctaLabel: "Start project",
    ctaHref: "/contact?service=launch-kit",
  },
  {
    name: "Marketing Engine",
    tagline: "Content, creative, and outreach that fills your pipeline.",
    priceLabel: "From $3,200/mo",
    bullets: [
      "30-day content calendar",
      "Creative assets + video scripts",
      "Outreach sequences + CRM setup",
      "Monthly performance review",
    ],
    ctaLabel: "Book a call",
    ctaHref: "/contact?service=marketing-engine",
  },
];
