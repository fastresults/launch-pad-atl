// Web-safe fallback stacks so a brand typeface degrades on-brand.
const CATEGORY_STACKS: Record<string, string> = {
  serif: "Georgia, 'Times New Roman', serif",
  slab: "Rockwell, Georgia, serif",
  sans: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  grotesk: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  geometric: "Futura, 'Century Gothic', 'Helvetica Neue', sans-serif",
  humanist: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  mono: "'SFMono-Regular', Menlo, Consolas, monospace",
  display: "Impact, 'Haettenschweiler', 'Arial Black', sans-serif",
};

const SERIF_HINTS = /(serif|playfair|lora|merriweather|garamond|baskerv|crimson|spectral|source serif|libre|bitter|domine|tinos|cormorant|frank ruhl|zilla)/i;
const MONO_HINTS = /(mono|code|courier)/i;
const GEOMETRIC_HINTS = /(poppins|montserrat|futura|jost|questrial|urbanist|outfit|dm sans|sora|gilroy|century)/i;
const DISPLAY_HINTS = /(bebas|anton|oswald|archivo black|teko|staatliches|impact)/i;

export function fontCategory(family: string): keyof typeof CATEGORY_STACKS {
  const f = String(family || "");
  if (MONO_HINTS.test(f)) return "mono";
  if (SERIF_HINTS.test(f)) return "serif";
  if (DISPLAY_HINTS.test(f)) return "display";
  if (GEOMETRIC_HINTS.test(f)) return "geometric";
  return "sans";
}

/** Full CSS font-family value: the brand face first, then safe fallbacks. */
export function fontStack(family?: string | null): string {
  if (!family) return CATEGORY_STACKS.sans;
  return `'${family}', ${CATEGORY_STACKS[fontCategory(family)]}`;
}

/** Just the fallback tail, for spec sheets. */
export function fontFallbacks(family?: string | null): string {
  return CATEGORY_STACKS[family ? fontCategory(family) : "sans"];
}
