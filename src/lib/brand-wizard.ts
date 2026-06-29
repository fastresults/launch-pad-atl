// Google Fonts loader — injects a link tag on demand for live previews.
const loaded = new Set<string>();

export function loadGoogleFont(family: string, weights: number[] = [400, 700]) {
  if (!family || typeof document === "undefined") return;
  const key = `${family}:${weights.join(",")}`;
  if (loaded.has(key)) return;
  loaded.add(key);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  const fam = family.replace(/\s+/g, "+");
  link.href = `https://fonts.googleapis.com/css2?family=${fam}:wght@${weights.join(";")}&display=swap`;
  document.head.appendChild(link);
}

// WCAG relative luminance & contrast.
function lum(hex: string) {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return 0;
  const [r, g, b] = m.map((h) => {
    const v = parseInt(h, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastRatio(a: string, b: string) {
  const la = lum(a);
  const lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
export function aaBadge(ratio: number) {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA-Large";
  return "Fail";
}

export const PERSONALITY_AXES = [
  { key: "modern", left: "Classic", right: "Modern" },
  { key: "playful", left: "Serious", right: "Playful" },
  { key: "bold", left: "Subtle", right: "Bold" },
  { key: "premium", left: "Accessible", right: "Premium" },
] as const;
