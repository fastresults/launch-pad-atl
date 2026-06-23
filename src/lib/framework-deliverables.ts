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
    title: "A one-line answer to 'what do you do?'",
    description:
      "One sentence that tells anyone — your mom, an investor, a customer — exactly what you do and why they should care.",
  },
  {
    icon: Users,
    title: "Your first customer, by name",
    description:
      "The face and wallet of the person who buys first. Not a 'segment.' Someone you can go find on Monday.",
  },
  {
    icon: Tag,
    title: "What to charge — and how to say it",
    description:
      "Your price, why it's worth it, and the words to use when someone asks 'why so much?'",
  },
  {
    icon: LineChart,
    title: "The numbers on one page",
    description:
      "What it costs, what you make, and the month you stop losing money. No spreadsheet PhD required.",
  },
  {
    icon: MapIcon,
    title: "Your first 90 days, week by week",
    description:
      "The next move is always on the calendar. You'll know what to do Monday morning, and the Monday after that.",
  },
  {
    icon: GitBranch,
    title: "What to do yourself, what to pay for",
    description:
      "DIY this. Outsource that. Skip the other thing. No more guessing — and honest cost ranges where it counts.",
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

