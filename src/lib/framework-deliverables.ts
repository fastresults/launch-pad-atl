import {
  FileText,
  Eye,
  AlertCircle,
  Sparkles,
  BarChart3,
  Users,
  Crosshair,
  Rocket,
  MessageSquare,
  Map,
  Settings,
  Handshake,
  Megaphone,
  LineChart,
  Calculator,
  Banknote,
  ClipboardList,
  Presentation,
  Scale,
  ShieldAlert,
  Landmark,
  Compass,
  MessageCircle,
  Palette,
  Mic,
  BookOpen,
  Globe,
  Share2,
  Layers,
  CalendarDays,
  PartyPopper,
  Heart,
  Star,
  Target,
  PenTool,
  TrendingUp,
  Zap,
  Mail,
  type LucideIcon,
} from "lucide-react";


export const WORKSHOP_PRICE_CENTS = 19700;
export const WORKSHOP_PRICE_LABEL = "$197";

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
  bonus?: boolean;
};

// Mirrors the live `venture_document_types` table (active = true, ordered by
// sort_order) so the homepage and the founder dashboard show an identical
// framework. Deliverable titles match the DB `name` column verbatim.
export const FRAMEWORK_STAGES: FrameworkStage[] = [
  {
    number: "01",
    name: "Foundation",
    intro: "The bedrock every defensible startup is built on.",
    items: [
      { icon: FileText, title: "Executive Summary" },
      { icon: Eye, title: "Vision & Mission" },
      { icon: AlertCircle, title: "Problem / Solution Brief" },
      { icon: Sparkles, title: "Value Proposition" },
    ],
  },
  {
    number: "02",
    name: "Strategy",
    intro: "How you win — and how you compound the lead.",
    items: [
      { icon: BarChart3, title: "Market Analysis" },
      { icon: Users, title: "Customer Personas" },
      { icon: Crosshair, title: "Competitive Positioning" },
      { icon: Rocket, title: "Go-to-Market Plan" },
      { icon: MessageSquare, title: "Brand & Messaging" },
    ],
  },
  {
    number: "03",
    name: "Operations",
    intro: "What you build, sell, and ship — week after week.",
    items: [
      { icon: Map, title: "Product Roadmap" },
      { icon: Settings, title: "Operating Plan" },
      { icon: Handshake, title: "Sales Playbook" },
      { icon: Megaphone, title: "Marketing Plan" },
    ],
  },
  {
    number: "04",
    name: "Finance",
    intro: "The numbers investors, banks, and you can trust.",
    items: [
      { icon: LineChart, title: "Financial Model" },
      { icon: Calculator, title: "Unit Economics" },
      { icon: Banknote, title: "Funding Strategy" },
      { icon: ClipboardList, title: "Budget & Pro Forma" },
      { icon: Presentation, title: "Pitch Deck Outline" },
    ],
  },
  {
    number: "05",
    name: "Governance",
    intro: "The legal and risk scaffolding that keeps you bankable.",
    items: [
      { icon: Scale, title: "Legal Structure Brief" },
      { icon: ShieldAlert, title: "Risk Register" },
      { icon: Landmark, title: "Board & Governance Plan" },
    ],
  },
  {
    number: "06",
    name: "Brand",
    bonus: true,
    intro: "An identity worth premium pricing — system, not stickers.",
    items: [
      { icon: Compass, title: "Brand Strategy Framework" },
      { icon: MessageCircle, title: "Brand Messaging House" },
      { icon: Palette, title: "Visual Identity Brief" },
      { icon: Mic, title: "Brand Voice & Tone Guide" },
      { icon: BookOpen, title: "Brand Guidelines Book" },
    ],
  },
  {
    number: "07",
    name: "Marketing",
    bonus: true,
    intro: "The AI-builder prompt that ships your site in a weekend.",
    items: [
      { icon: Globe, title: "Website PRD (AI-builder prompt)" },
    ],
  },
  {
    number: "08",
    name: "Social & Content",
    bonus: true,
    intro: "The distribution engine that earns attention on repeat.",
    items: [
      { icon: Share2, title: "Social Media Audit & Setup" },
      { icon: Layers, title: "Content Strategy & Pillars" },
      { icon: CalendarDays, title: "90-Day Content Calendar" },
      { icon: PartyPopper, title: "Launch Content Kit" },
      { icon: Heart, title: "Community Engagement Playbook" },
      { icon: Star, title: "Influencer & Partnership Brief" },
      { icon: Target, title: "Paid Ads Starter Pack" },
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
    title: "Your brand in a day. No agency required.",
    description:
      "Logo, palette, type system, and guidelines — finished before you leave. No retainer, no six-week wait, no committee.",
  },
  {
    icon: Globe,
    title: "Build the site your customers actually buy from.",
    description:
      "Not a brochure. A revenue surface wired to payments and analytics, written for the buyer you're actually trying to win.",
  },
  {
    icon: Share2,
    title: "30 days of content before you leave the room.",
    description:
      "A month of on-brand posts, captions, and hooks — drafted, scheduled, and ready to publish the morning after the workshop.",
  },
  {
    icon: PenTool,
    title: "Rank, publish, repeat. Your content machine is live.",
    description:
      "An SEO-aware content engine with pillars, topics, and the next 90 days mapped — so traffic compounds instead of costing more every month.",
  },
  {
    icon: Sparkles,
    title: "Automate 5 real workflows. Today.",
    description:
      "Five AI workflows wired into your actual operation — drafting, qualifying, follow-up, reporting, support — so two people do the work of ten.",
  },
  {
    icon: Mail,
    title: "16 emails written. Your sales machine is running.",
    description:
      "A 16-email nurture and follow-up sequence loaded and ready. Most revenue lives in the second, fifth, and twelfth touch — automated, on time, on brand.",
  },
  {
    icon: TrendingUp,
    title: "Walk out with a sales script that qualifies and closes.",
    description:
      "A repeatable script and pipeline that moves a stranger to a signed deal — with the objections, the asks, and the close already written.",
  },
  {
    icon: Scale,
    title: "Entity. Contracts. Books. Done.",
    description:
      "LLC, EIN, operating agreement, client contracts, and a clean books setup — the boring scaffolding that keeps you legal, bankable, and ready to scale.",
  },
];


// Kept as an alias for any legacy import — superseded by BUILD_LAYER.
export const OUT_OF_SCOPE = BUILD_LAYER.map((b) => b.title);

