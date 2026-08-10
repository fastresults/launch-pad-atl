// Canonical platform asset specs for the Social Studio cover art generator.
// Sizes are normalized to gpt-image-2 supported aspects (1024-family) but the
// "target" w/h is what we describe to the model + persist as the asset spec.

export type AssetKind =
  | "avatar"
  | "banner"
  | "header"
  | "channel_art"
  | "pinned_post"
  | "story_cover"
  | "video_poster"
  | "vertical_pin"
  | "thumbnail";

export type AssetSpec = {
  kind: AssetKind;
  label: string;
  width: number;
  height: number;
  // Pixel description we give the model
  guidance: string;
  // gpt-image-2 supported size string (square or near-aspect)
  modelSize: "1024x1024" | "1024x1536" | "1536x1024";
};

export type PlatformSpec = {
  platform: string;
  label: string;
  assets: AssetSpec[];
};

const SQ = (w: number, h: number) =>
  w === h ? "1024x1024" : w > h ? "1536x1024" : "1024x1536";

export const PLATFORM_SPECS: Record<string, PlatformSpec> = {
  Instagram: {
    platform: "Instagram",
    label: "Instagram",
    assets: [
      { kind: "avatar", label: "Profile avatar", width: 1080, height: 1080, guidance: "perfectly circular safe area centered", modelSize: "1024x1024" },
      { kind: "pinned_post", label: "Pinned post tile", width: 1080, height: 1080, guidance: "square post, focal subject in center", modelSize: "1024x1024" },
      { kind: "story_cover", label: "Story cover", width: 1080, height: 1920, guidance: "9:16 vertical, top/bottom safe zones reserved", modelSize: "1024x1536" },
    ],
  },
  TikTok: {
    platform: "TikTok",
    label: "TikTok",
    assets: [
      { kind: "avatar", label: "Profile avatar", width: 1080, height: 1080, guidance: "circular crop center", modelSize: "1024x1024" },
      { kind: "video_poster", label: "Video cover poster", width: 1080, height: 1920, guidance: "9:16 portrait poster, bold focal subject upper third", modelSize: "1024x1536" },
    ],
  },
  LinkedIn: {
    platform: "LinkedIn",
    label: "LinkedIn",
    assets: [
      { kind: "banner", label: "Company banner", width: 1128, height: 191, guidance: "ultra-wide letterbox, content left-aligned, right third clean", modelSize: "1536x1024" },
      { kind: "header", label: "Founder banner", width: 1584, height: 396, guidance: "ultra-wide letterbox, avoid lower-left where profile photo overlays", modelSize: "1536x1024" },
      { kind: "pinned_post", label: "Square pinned post", width: 1200, height: 1200, guidance: "square, type-led, generous whitespace", modelSize: "1024x1024" },
    ],
  },
  X: {
    platform: "X",
    label: "X",
    assets: [
      { kind: "header", label: "Header", width: 1500, height: 500, guidance: "3:1 letterbox, focal content centered, lower-left clear of avatar overlap", modelSize: "1536x1024" },
      { kind: "avatar", label: "Profile avatar", width: 400, height: 400, guidance: "circular crop center", modelSize: "1024x1024" },
      { kind: "pinned_post", label: "Pinned post card", width: 1200, height: 675, guidance: "16:9 card, headline-led", modelSize: "1536x1024" },
    ],
  },
  YouTube: {
    platform: "YouTube",
    label: "YouTube",
    assets: [
      { kind: "channel_art", label: "Channel art", width: 2560, height: 1440, guidance: "all critical content INSIDE centered 1546x423 safe area; outer regions can bleed", modelSize: "1536x1024" },
      { kind: "thumbnail", label: "Video thumbnail", width: 1280, height: 720, guidance: "16:9, one face/subject + bold 3-5 word headline, high contrast", modelSize: "1536x1024" },
    ],
  },
  Facebook: {
    platform: "Facebook",
    label: "Facebook",
    assets: [
      { kind: "banner", label: "Page cover", width: 1640, height: 624, guidance: "wide cover; keep critical content within centered safe rectangle", modelSize: "1536x1024" },
      { kind: "pinned_post", label: "Square post", width: 1200, height: 1200, guidance: "square post", modelSize: "1024x1024" },
    ],
  },
  Pinterest: {
    platform: "Pinterest",
    label: "Pinterest",
    assets: [
      { kind: "avatar", label: "Profile avatar", width: 1080, height: 1080, guidance: "circular crop center", modelSize: "1024x1024" },
      { kind: "banner", label: "Profile cover", width: 800, height: 450, guidance: "16:9 wide cover", modelSize: "1536x1024" },
      { kind: "vertical_pin", label: "Vertical pin", width: 1000, height: 1500, guidance: "2:3 vertical, headline upper third, image lower two-thirds", modelSize: "1024x1536" },
    ],

  },
  Threads: {
    platform: "Threads",
    label: "Threads",
    assets: [
      { kind: "avatar", label: "Profile avatar", width: 1080, height: 1080, guidance: "circular crop", modelSize: "1024x1024" },
      { kind: "pinned_post", label: "Intro card", width: 1080, height: 1080, guidance: "square intro card, type-forward", modelSize: "1024x1024" },
    ],
  },
  Reddit: {
    platform: "Reddit",
    label: "Reddit",
    assets: [
      { kind: "banner", label: "Banner", width: 1920, height: 384, guidance: "ultra-wide letterbox, content centered", modelSize: "1536x1024" },
      { kind: "avatar", label: "Avatar", width: 256, height: 256, guidance: "circular crop, single bold mark", modelSize: "1024x1024" },
    ],
  },
};

export function getPlatform(name: string): PlatformSpec | null {
  const key = Object.keys(PLATFORM_SPECS).find(
    (k) => k.toLowerCase() === name.toLowerCase(),
  );
  return key ? PLATFORM_SPECS[key] : null;
}

export const ART_DIRECTIONS = [
  {
    id: "editorial",
    label: "Editorial",
    blurb: "Type-led, magazine-grade, generous whitespace.",
  },
  {
    id: "photographic",
    label: "Photographic",
    blurb: "Cinematic subject, soft brand-tint overlay.",
  },
  {
    id: "geometric",
    label: "Geometric",
    blurb: "Bold shapes from brand palette, Bauhaus discipline.",
  },
  {
    id: "illustrative",
    label: "Illustrative",
    blurb: "Flat custom illustration in brand colors.",
  },
] as const;

export type ArtDirectionId = typeof ART_DIRECTIONS[number]["id"];
