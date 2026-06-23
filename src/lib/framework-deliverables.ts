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
  description?: string;
};

export const FRAMEWORK_DELIVERABLES: FrameworkDeliverable[] = [
  { icon: Compass, title: "Your one-line pitch" },
  { icon: Users, title: "Your first customer" },
  { icon: Tag, title: "Your price, defended" },
  { icon: LineChart, title: "Your numbers, mapped" },
  { icon: MapIcon, title: "Your 90-day plan" },
  { icon: GitBranch, title: "Build, hire, skip" },
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
    tagline:
      "Two weeks with Adam. You walk out with a pitch deck, a financial model, and a list of investors to call.",
    priceLabel: "From $1,600",
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
    tagline: "A real brand identity and a site you can run a business from.",
    priceLabel: "From $2,900",
    bullets: [
      "Logo, palette, typography system",
      "Website, written and SEO-configured",
      "Stripe / payments + analytics wired",
      "Delivered live in 2 weeks",
    ],
    ctaLabel: "Start project",
    ctaHref: "/contact?service=brand-website",
  },
  {
    name: "Launch Kit",
    tagline:
      "LLC, EIN, bank account, contracts, books. The boring stuff that keeps you legal — done for you.",
    priceLabel: "From $1,200",
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
    tagline:
      "Posts, videos, and outreach that actually bring customers in — every month, on autopilot.",
    priceLabel: "From $2,100/mo",
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

