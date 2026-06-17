// Server-side prompt templates for Creative Studio.
// User never sees raw prompt text — they pick vibe + color mood + subject and we assemble it.

export type AssetType = "avatar" | "cover" | "launch_post" | "portrait";

export const VIBE_FRAGMENTS: Record<string, string> = {
  bold_editorial:
    "bold editorial design, strong typography influence, high contrast, magazine-cover composition, confident and modern",
  soft_minimal:
    "soft minimal aesthetic, generous whitespace, calm muted palette, refined geometry, Apple-like restraint",
  tech_futurist:
    "tech futurist vibe, subtle gradients, glow accents, fine line art, near-monochrome with one electric accent color",
  warm_founder:
    "warm founder-story feel, golden-hour light, organic textures, paper grain, hand-crafted approachable",
  playful_startup:
    "playful startup energy, geometric shapes, friendly color blocks, lively but not childish, optimistic",
  premium_corporate:
    "premium corporate polish, deep neutral tones, subtle metallic accents, conservative confidence, trustworthy",
};

export const COLOR_MOOD_FRAGMENTS: Record<string, string> = {
  ocean: "deep navy and teal palette with cool highlights",
  sunset: "warm orange, coral, and dusty pink palette",
  forest: "deep green and earth-tone palette, natural and grounded",
  monochrome: "black, white, and grayscale with a single restrained accent",
  electric: "bold purple, magenta, and electric blue with neon highlights",
};

type BuildArgs = {
  assetType: AssetType;
  vibe: string;
  colorMood: string;
  subject: string;
  brandName?: string;
  width: number;
  height: number;
};

export function buildPrompt({
  assetType,
  vibe,
  colorMood,
  subject,
  brandName,
  width,
  height,
}: BuildArgs): string {
  const vibeText = VIBE_FRAGMENTS[vibe] ?? "modern, clean, brand-ready";
  const colorText = COLOR_MOOD_FRAGMENTS[colorMood] ?? "balanced brand palette";
  const brandLine = brandName ? `Brand: ${brandName}. ` : "";
  const aspect = `${width}x${height}`;

  switch (assetType) {
    case "avatar":
      return [
        `${brandLine}Design a square social media profile mark / avatar at ${aspect}.`,
        `Subject: ${subject}.`,
        `Style: ${vibeText}. Color mood: ${colorText}.`,
        "Centered, legible at very small sizes (down to 32x32), no text unless it's a single monogram letter, no watermarks, no border, transparent or solid background. Render as a clean vector-style mark.",
      ].join(" ");

    case "cover":
      return [
        `${brandLine}Design a wide social media cover / banner at ${aspect} (${width}:${height} aspect).`,
        `Subject: ${subject}.`,
        `Style: ${vibeText}. Color mood: ${colorText}.`,
        "Composition leaves the center-left clear so a profile avatar can overlay it. No text, no watermarks, no logos, no readable letterforms. Cinematic, on-brand, suitable for a professional startup.",
      ].join(" ");

    case "launch_post":
      return [
        `${brandLine}Design a launch announcement social post at ${aspect}.`,
        `Subject: ${subject}.`,
        `Style: ${vibeText}. Color mood: ${colorText}.`,
        "Eye-catching first-frame composition, leaves room for a short headline overlay (do not render the text), strong focal point, share-worthy. No watermarks.",
      ].join(" ");

    case "portrait":
      return [
        `Stylized founder portrait at ${aspect}.`,
        `Subject: ${subject}.`,
        `Style: ${vibeText}. Color mood: ${colorText}.`,
        "Professional headshot framing, shoulders up, neutral on-brand backdrop, soft directional lighting, sharp focus on eyes, suitable for an 'About' page and press kit. No text, no watermarks.",
      ].join(" ");
  }
}

// Map our width/height to gpt-image-2 supported sizes.
// Supported: 1024x1024, 1024x1536, 1536x1024.
export function nearestGptImageSize(width: number, height: number): string {
  const ratio = width / height;
  if (ratio > 1.2) return "1536x1024"; // landscape
  if (ratio < 0.8) return "1024x1536"; // portrait
  return "1024x1024"; // square
}
