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
  Globe,
  Sparkles,
  Mail,
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

export type FoundationReason = { title: string; body: string };

export const FOUNDATION_FIRST_REASONS: FoundationReason[] = [
  {
    title: "A wrong-headed brand is expensive to undo.",
    body: "Logos and websites built before positioning is locked become $20K mistakes you redo a year later.",
  },
  {
    title: "A great website with no ICP doesn't convert.",
    body: "Traffic without a defined buyer is just noise — and paid traffic is expensive noise.",
  },
  {
    title: "AI amplifies whatever it's pointed at.",
    body: "Point it at a fuzzy strategy and it scales the fuzz. Point it at a sharp one and it scales you.",
  },
];

export type BuildLayerItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const BUILD_LAYER: BuildLayerItem[] = [
  {
    icon: Palette,
    title: "Brand identity",
    description:
      "A logo and visual system that earn trust in the first three seconds — before a single word is read.",
  },
  {
    icon: Globe,
    title: "A website that converts",
    description:
      "Not a brochure. A revenue surface, wired to payments and analytics, that turns visitors into customers.",
  },
  {
    icon: Share2,
    title: "Social presence",
    description:
      "Distribution you own. The channels where your buyers already scroll, primed to keep showing up.",
  },
  {
    icon: PenTool,
    title: "A content engine",
    description:
      "Ongoing posts, videos, and SEO that compound — so traffic stops costing more every month.",
  },
  {
    icon: Sparkles,
    title: "AI as your operating system",
    description:
      "The unfair advantage. AI built into how you draft, design, qualify, and ship — so two people do the work of ten.",
  },
  {
    icon: Mail,
    title: "Email, CRM, and automation",
    description:
      "The follow-up machine. Most revenue is in the second, fifth, twelfth touch — automated, on time, on brand.",
  },
  {
    icon: TrendingUp,
    title: "Sales systems",
    description:
      "A repeatable path from interested stranger to closed deal. Scripts, pipelines, and the playbook to run them.",
  },
  {
    icon: Scale,
    title: "Legal, financial, and operational scaffolding",
    description:
      "LLC, EIN, contracts, books, payroll. The boring stuff that keeps you legal and bankable as you scale.",
  },
];

// Kept as an alias for any legacy import — superseded by BUILD_LAYER.
export const OUT_OF_SCOPE = BUILD_LAYER.map((b) => b.title);

