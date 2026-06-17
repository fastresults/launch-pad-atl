// Vibe + color mood registry for Creative Studio (must match keys in
// supabase/functions/brand-creative/prompts.ts).

export type Vibe = {
  value: string;
  label: string;
  description: string;
  swatch: string[]; // 3 hex colors for the chip preview
};

export const VIBES: Vibe[] = [
  {
    value: "bold_editorial",
    label: "Bold & Editorial",
    description: "Magazine-cover energy, high contrast, confident type.",
    swatch: ["#0F0F10", "#E63946", "#F1FAEE"],
  },
  {
    value: "soft_minimal",
    label: "Soft Minimal",
    description: "Calm whitespace, refined geometry, Apple-like restraint.",
    swatch: ["#F5F1EC", "#C8C2BA", "#1E1E1E"],
  },
  {
    value: "tech_futurist",
    label: "Tech Futurist",
    description: "Subtle gradients, line art, one electric accent.",
    swatch: ["#0B0F1A", "#00E5FF", "#7C4DFF"],
  },
  {
    value: "warm_founder",
    label: "Warm Founder Story",
    description: "Golden-hour, paper grain, approachable and human.",
    swatch: ["#F4E1C1", "#C97B4D", "#3F2E1F"],
  },
  {
    value: "playful_startup",
    label: "Playful Startup",
    description: "Geometric shapes, friendly color blocks, optimistic.",
    swatch: ["#FFD166", "#06D6A0", "#EF476F"],
  },
  {
    value: "premium_corporate",
    label: "Premium Corporate",
    description: "Deep neutrals, metallic accents, conservative confidence.",
    swatch: ["#11182B", "#9C8A5F", "#E9E6E1"],
  },
];

export type ColorMood = {
  value: string;
  label: string;
  swatch: string[];
};

export const COLOR_MOODS: ColorMood[] = [
  { value: "ocean", label: "Ocean", swatch: ["#0A2540", "#1B7A8C", "#A8DADC"] },
  { value: "sunset", label: "Sunset", swatch: ["#FF6B35", "#F7B267", "#FFC8DD"] },
  { value: "forest", label: "Forest", swatch: ["#1B4332", "#52796F", "#CAD2C5"] },
  { value: "monochrome", label: "Monochrome", swatch: ["#0A0A0A", "#737373", "#FAFAFA"] },
  { value: "electric", label: "Electric", swatch: ["#7209B7", "#F72585", "#4CC9F0"] },
];

export type AssetType = "avatar" | "cover" | "launch_post" | "portrait";

export type AssetTypeDef = {
  value: AssetType;
  label: string;
  description: string;
  width: number;
  height: number;
  recommendedFor: string[]; // platform labels
  emoji: string;
};

export const ASSET_TYPES: AssetTypeDef[] = [
  {
    value: "avatar",
    label: "Profile mark / avatar",
    description: "Square logo used on every platform's profile picture.",
    width: 1024,
    height: 1024,
    recommendedFor: ["All 14 platforms"],
    emoji: "🟦",
  },
  {
    value: "cover",
    label: "Cover / banner",
    description: "Wide hero image for X, LinkedIn, Facebook, YouTube, etc.",
    width: 1500,
    height: 500,
    recommendedFor: ["X", "LinkedIn", "Facebook", "YouTube", "Discord"],
    emoji: "🟥",
  },
  {
    value: "launch_post",
    label: "Launch / announcement post",
    description: "First-post creative — 1:1 by default.",
    width: 1080,
    height: 1080,
    recommendedFor: ["Instagram", "X", "LinkedIn", "Facebook", "Threads"],
    emoji: "🟧",
  },
  {
    value: "portrait",
    label: "Founder portrait",
    description: "Stylized headshot for About pages and press kits.",
    width: 1024,
    height: 1024,
    recommendedFor: ["LinkedIn", "Website", "Press kit"],
    emoji: "🟪",
  },
];

export const ASSET_TYPES_BY_VALUE: Record<AssetType, AssetTypeDef> = Object.fromEntries(
  ASSET_TYPES.map((a) => [a.value, a]),
) as Record<AssetType, AssetTypeDef>;
