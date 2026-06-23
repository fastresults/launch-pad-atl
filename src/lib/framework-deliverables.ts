import {
  Compass,
  Eye,
  Scale,
  Palette,
  LayoutGrid,
  Target,
  DollarSign,
  FileText,
  BarChart3,
  LineChart,
  Rocket,
  Share2,
  PenTool,
  Megaphone,
  TrendingUp,
  Users,
  Package,
  Settings,
  Banknote,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const WORKSHOP_PRICE_CENTS = 9700;
export const WORKSHOP_PRICE_LABEL = "$97";

export type FrameworkDeliverable = {
  icon: LucideIcon;
  title: string;
  description?: string;
};

export type FrameworkStage = {
  number: string;
  name: string;
  intro: string;
  items: FrameworkDeliverable[];
};

export const FRAMEWORK_STAGES: FrameworkStage[] = [
  {
    number: "01",
    name: "Build your unshakeable foundation",
    intro:
      "Five deliverables. The bedrock every defensible startup is built on.",
    items: [
      { icon: Compass, title: "Your idea, sharpened into a thesis" },
      { icon: Eye, title: "A vision people want to follow" },
      { icon: Scale, title: "Legally airtight from day one" },
      { icon: Palette, title: "A brand worth premium pricing" },
      { icon: LayoutGrid, title: "Your business model, on one page" },
    ],
  },
  {
    number: "02",
    name: "Craft your winning strategy",
    intro:
      "Five deliverables. The strategic edge competitors will spend years trying to copy.",
    items: [
      { icon: Target, title: "The gap your competitors left open" },
      { icon: DollarSign, title: "Prices your customers gladly pay" },
      { icon: FileText, title: "An investor-ready business plan" },
      { icon: BarChart3, title: "Your market, sized and decoded" },
      { icon: LineChart, title: "Numbers that survive investor scrutiny" },
    ],
  },
  {
    number: "03",
    name: "Launch with professional power",
    intro:
      "Ten deliverables. Everything you need to go from plan to paying customers.",
    items: [
      { icon: Rocket, title: "A launch the market notices" },
      { icon: Share2, title: "Social channels ready to fire" },
      { icon: PenTool, title: "Website copy that actually sells" },
      { icon: Megaphone, title: "Marketing that owns your category" },
      { icon: TrendingUp, title: "A repeatable, scalable sales system" },
      { icon: Users, title: "Your customer, understood inside-out" },
      { icon: Package, title: "A product customers can't put down" },
      { icon: Settings, title: "Operations that run without you" },
      { icon: Banknote, title: "A funding plan investors respect" },
      { icon: Zap, title: "Growth tactics that compound fast" },
    ],
  },
];

// Flat alias for surfaces that just need the full list of titles.
export const FRAMEWORK_DELIVERABLES: FrameworkDeliverable[] =
  FRAMEWORK_STAGES.flatMap((s) => s.items);

export const TOTAL_DELIVERABLES = FRAMEWORK_DELIVERABLES.length;

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
