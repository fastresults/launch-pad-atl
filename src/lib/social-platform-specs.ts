// Client mirror of supabase/functions/_shared/social-platform-specs.ts
// Keep in sync if you change one.

export type AssetKind =
  | "avatar" | "banner" | "header" | "channel_art"
  | "pinned_post" | "story_cover" | "video_poster"
  | "vertical_pin" | "thumbnail";

export type AssetSpec = {
  kind: AssetKind;
  label: string;
  width: number;
  height: number;
};

export type PlatformSpec = {
  platform: string;
  label: string;
  assets: AssetSpec[];
};

export const PLATFORM_SPECS: Record<string, PlatformSpec> = {
  Instagram: { platform: "Instagram", label: "Instagram", assets: [
    { kind: "avatar", label: "Profile avatar", width: 1080, height: 1080 },
    { kind: "pinned_post", label: "Pinned post tile", width: 1080, height: 1080 },
    { kind: "story_cover", label: "Story cover", width: 1080, height: 1920 },
  ]},
  TikTok: { platform: "TikTok", label: "TikTok", assets: [
    { kind: "avatar", label: "Profile avatar", width: 1080, height: 1080 },
    { kind: "video_poster", label: "Video cover poster", width: 1080, height: 1920 },
  ]},
  LinkedIn: { platform: "LinkedIn", label: "LinkedIn", assets: [
    { kind: "avatar", label: "Profile avatar", width: 400, height: 400 },
    { kind: "banner", label: "Company banner", width: 1128, height: 191 },
    { kind: "header", label: "Founder banner", width: 1584, height: 396 },
    { kind: "pinned_post", label: "Square pinned post", width: 1200, height: 1200 },
  ]},
  X: { platform: "X", label: "X", assets: [
    { kind: "header", label: "Header", width: 1500, height: 500 },
    { kind: "avatar", label: "Profile avatar", width: 400, height: 400 },
    { kind: "pinned_post", label: "Pinned post card", width: 1200, height: 675 },
  ]},
  YouTube: { platform: "YouTube", label: "YouTube", assets: [
    { kind: "avatar", label: "Profile avatar", width: 800, height: 800 },
    { kind: "channel_art", label: "Channel art", width: 2560, height: 1440 },
    { kind: "thumbnail", label: "Video thumbnail", width: 1280, height: 720 },
  ]},
  Facebook: { platform: "Facebook", label: "Facebook", assets: [
    { kind: "avatar", label: "Profile avatar", width: 1080, height: 1080 },
    { kind: "banner", label: "Page cover", width: 1640, height: 624 },
    { kind: "pinned_post", label: "Square post", width: 1200, height: 1200 },
  ]},
  Pinterest: { platform: "Pinterest", label: "Pinterest", assets: [
    { kind: "avatar", label: "Profile avatar", width: 1080, height: 1080 },
    { kind: "banner", label: "Profile cover", width: 800, height: 450 },
    { kind: "vertical_pin", label: "Vertical pin", width: 1000, height: 1500 },
  ]},
  Threads: { platform: "Threads", label: "Threads", assets: [
    { kind: "avatar", label: "Profile avatar", width: 1080, height: 1080 },
    { kind: "pinned_post", label: "Intro card", width: 1080, height: 1080 },
  ]},
  Reddit: { platform: "Reddit", label: "Reddit", assets: [
    { kind: "banner", label: "Banner", width: 1920, height: 384 },
    { kind: "avatar", label: "Avatar", width: 256, height: 256 },
  ]},
};

export const ART_DIRECTIONS = [
  { id: "editorial", label: "Editorial", blurb: "Type-led, magazine-grade." },
  { id: "photographic", label: "Photographic", blurb: "Cinematic, brand tint." },
  { id: "geometric", label: "Geometric", blurb: "Bold flat shapes." },
  { id: "illustrative", label: "Illustrative", blurb: "Flat custom illustration." },
] as const;

export type ArtDirectionId = typeof ART_DIRECTIONS[number]["id"];
