import {
  Compass,
  Target,
  Settings2,
  LineChart,
  ShieldCheck,
  Palette,
  Megaphone,
  Share2,
  Layers,
  type LucideIcon,
} from "lucide-react";

export type StageMeta = {
  label: string;
  tagline: string;
  icon: LucideIcon;
  /** Token name (without hsl()/var wrapper) used for accent bar, chip bg, progress fill */
  accentVar: string;
  /** Tailwind text color class matching the accent */
  accentText: string;
};

const FALLBACK: StageMeta = {
  label: "Section",
  tagline: "Move your startup forward.",
  icon: Layers,
  accentVar: "--primary",
  accentText: "text-primary",
};

export const STAGE_META: Record<string, StageMeta> = {
  Foundation: {
    label: "Foundation",
    tagline: "Prove the idea is worth building.",
    icon: Compass,
    accentVar: "--primary",
    accentText: "text-primary",
  },
  Strategy: {
    label: "Strategy",
    tagline: "Define how you'll win the market.",
    icon: Target,
    accentVar: "--brand-magenta",
    accentText: "text-primary",
  },
  Brand: {
    label: "Brand",
    tagline: "Craft a voice and identity worth trusting.",
    icon: Palette,
    accentVar: "--brand-violet",
    accentText: "text-primary",
  },
  Marketing: {
    label: "Marketing",
    tagline: "Turn attention into signups.",
    icon: Megaphone,
    accentVar: "--brand-orange",
    accentText: "text-primary",
  },
  "Social & Content": {
    label: "Social & Content",
    tagline: "Compound reach with content that ships weekly.",
    icon: Share2,
    accentVar: "--status-tip",
    accentText: "text-primary",
  },
  Operations: {
    label: "Operations",
    tagline: "Wire the tech stack that runs the business.",
    icon: Settings2,
    accentVar: "--status-info",
    accentText: "text-primary",
  },
  Finance: {
    label: "Finance",
    tagline: "Model the money and price with confidence.",
    icon: LineChart,
    accentVar: "--status-success",
    accentText: "text-status-success",
  },
  Governance: {
    label: "Governance",
    tagline: "Stay legal, protected, and audit-ready.",
    icon: ShieldCheck,
    accentVar: "--status-warning",
    accentText: "text-primary",
  },
};

export function getStageMeta(cat: string): StageMeta {
  return STAGE_META[cat] ?? { ...FALLBACK, label: cat };
}
