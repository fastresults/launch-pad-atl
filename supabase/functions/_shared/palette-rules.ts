// Smarter brand palette rules — pure TS, no deps.
// Used by both the Brand Wizard UI (mirrored at src/lib/brand/palette-rules.ts)
// and the venture-brand-wizard edge function to guarantee every saved palette
// is legible and pairing-safe for downstream website + social creative
// generation.

export type PaletteRoles = {
  bg: string;
  fg: string;
  muted?: string;
  accent?: string;
  primary?: string;
  secondary?: string;
  onPrimary?: string;
  onSecondary?: string;
  onAccent?: string;
  border?: string;
  [k: string]: string | undefined;
};

export type ContrastPair = {
  label: string;
  fg: string;
  bg: string;
  ratio: number;
  required: number;
  pass: boolean;
};

export type PaletteAudit = {
  field: string;
  from: string;
  to: string;
  reason: string;
};

export type ValidatedPalette = {
  colors: PaletteRoles;
  mode: "light" | "dark";
  pairings: ContrastPair[];
  audit: PaletteAudit[];
  ok: boolean;
};

const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function normHex(input: string | undefined | null, fallback = "#000000"): string {
  if (!input || typeof input !== "string") return fallback;
  const t = input.trim();
  const m = t.match(HEX_RE);
  if (!m) return fallback;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return `#${h.toUpperCase()}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = normHex(hex).slice(1);
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function srgbChannel(v: number) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** 0..1 perceived lightness band (sRGB luminance). */
export function lightness(hex: string): number {
  return relativeLuminance(hex);
}

/** HSL saturation 0..1 — used to detect near-neutrals. */
export function saturation(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return 0;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

/** Hue 0..360. */
export function hue(hex: string): number {
  const [R, G, B] = hexToRgb(hex).map((v) => v / 255) as [number, number, number];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;
  if (d === 0) return 0;
  let h: number;
  if (max === R) h = ((G - B) / d) % 6;
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

export function isNeutral(hex: string, threshold = 0.12): boolean {
  return saturation(hex) <= threshold;
}

/** Best on-color (white or near-black) for legibility on a given background. */
export function pickOnColor(bg: string): string {
  const white = "#FFFFFF";
  const ink = "#0B0F19";
  return contrastRatio(white, bg) >= contrastRatio(ink, bg) ? white : ink;
}

const SAFE_LIGHT_BG = "#F8FAFC";
const SAFE_DARK_BG = "#0B0F19";

/**
 * Repair a palette so it's safe for downstream rendering.
 * - bg/fg never share a tone band
 * - WCAG AA gates (text 4.5:1, UI 3:1)
 * - onPrimary/onSecondary/onAccent always derived
 * - primary vs accent never visually merge
 *
 * Preserves the brand-defining hue (primary) and repairs the supporting roles.
 */
export function repairPalette(input: PaletteRoles): { colors: PaletteRoles; audit: PaletteAudit[]; mode: "light" | "dark" } {
  const audit: PaletteAudit[] = [];
  const c: PaletteRoles = { ...input };

  c.bg = normHex(c.bg, SAFE_LIGHT_BG);
  c.fg = normHex(c.fg, "#0B0F19");
  if (c.muted) c.muted = normHex(c.muted);
  if (c.accent) c.accent = normHex(c.accent);
  if (c.primary) c.primary = normHex(c.primary);
  if (c.secondary) c.secondary = normHex(c.secondary);
  if (c.border) c.border = normHex(c.border);

  const bgL = lightness(c.bg);
  const mode: "light" | "dark" = bgL >= 0.5 ? "light" : "dark";

  // Rule 3: no same-tone bg/fg.
  const fgL = lightness(c.fg);
  const sameBand =
    (bgL < 0.18 && fgL < 0.25) ||
    (bgL > 0.75 && fgL > 0.65) ||
    Math.abs(bgL - fgL) < 0.2;
  if (sameBand) {
    const newFg = mode === "light" ? "#0B0F19" : "#F8FAFC";
    if (newFg !== c.fg) {
      audit.push({ field: "fg", from: c.fg, to: newFg, reason: "bg and fg were in the same tone band — flipped text to the readable end." });
      c.fg = newFg;
    }
  }

  // Rule 2: body text vs background must clear AA 4.5:1.
  if (contrastRatio(c.fg, c.bg) < 4.5) {
    const newFg = pickOnColor(c.bg);
    if (newFg !== c.fg) {
      audit.push({ field: "fg", from: c.fg, to: newFg, reason: "Body text failed WCAG AA against background — switched to nearest legible neutral." });
      c.fg = newFg;
    }
  }

  // Rule 6: surface chroma cap — if bg is wildly saturated, mute it toward neutral.
  if (saturation(c.bg) > 0.5 && mode === "light") {
    const newBg = SAFE_LIGHT_BG;
    audit.push({ field: "bg", from: c.bg, to: newBg, reason: "Background was too saturated for body copy — desaturated to a neutral surface." });
    c.bg = newBg;
  } else if (saturation(c.bg) > 0.5 && mode === "dark") {
    const newBg = SAFE_DARK_BG;
    audit.push({ field: "bg", from: c.bg, to: newBg, reason: "Background was too saturated for body copy — desaturated to a neutral surface." });
    c.bg = newBg;
  }

  // Muted text should still hit ~3:1 on bg.
  if (c.muted && contrastRatio(c.muted, c.bg) < 3) {
    const lift = mode === "light" ? "#64748B" : "#94A3B8";
    audit.push({ field: "muted", from: c.muted, to: lift, reason: "Muted text was unreadable on the surface — lifted to a 3:1 neutral." });
    c.muted = lift;
  }

  // Derive on-colors for every brand role so generators never guess.
  for (const role of ["primary", "secondary", "accent"] as const) {
    const v = c[role];
    if (!v) continue;
    const onKey = ("on" + role[0].toUpperCase() + role.slice(1)) as keyof PaletteRoles;
    const existing = c[onKey] ? normHex(c[onKey] as string) : undefined;
    const best = pickOnColor(v);
    if (!existing || contrastRatio(existing, v) < 4.5) {
      if (existing && existing !== best) {
        audit.push({ field: String(onKey), from: existing, to: best, reason: `${onKey} failed WCAG AA against ${role} — switched to legible neutral.` });
      }
      c[onKey] = best;
    }
  }

  // Rule 4: primary vs accent must not visually merge.
  if (c.primary && c.accent) {
    const hueDiff = Math.min(Math.abs(hue(c.primary) - hue(c.accent)), 360 - Math.abs(hue(c.primary) - hue(c.accent)));
    const satDiff = Math.abs(saturation(c.primary) - saturation(c.accent));
    if (hueDiff < 25 && satDiff < 0.2) {
      // Rotate accent ~40° around the wheel while keeping its lightness/sat roughly intact.
      const rotated = rotateHue(c.accent, 40);
      audit.push({ field: "accent", from: c.accent, to: rotated, reason: "Primary and accent looked too similar — rotated accent hue for separation." });
      c.accent = rotated;
      c.onAccent = pickOnColor(rotated);
    }
  }

  // Border default for the chosen mode.
  if (!c.border) c.border = mode === "light" ? "#E2E8F0" : "#1F2937";

  return { colors: c, audit, mode };
}

function rotateHue(hex: string, degrees: number): string {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const nh = (h + degrees + 360) % 360;
  // HSL → RGB
  const c2 = (1 - Math.abs(2 * l - 1)) * s;
  const x = c2 * (1 - Math.abs(((nh / 60) % 2) - 1));
  const m = l - c2 / 2;
  let R = 0, G = 0, B = 0;
  if (nh < 60) [R, G, B] = [c2, x, 0];
  else if (nh < 120) [R, G, B] = [x, c2, 0];
  else if (nh < 180) [R, G, B] = [0, c2, x];
  else if (nh < 240) [R, G, B] = [0, x, c2];
  else if (nh < 300) [R, G, B] = [x, 0, c2];
  else [R, G, B] = [c2, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0").toUpperCase();
  return `#${to(R)}${to(G)}${to(B)}`;
}

export function validatePalette(input: PaletteRoles): ValidatedPalette {
  const { colors, audit, mode } = repairPalette(input);
  const pairings: ContrastPair[] = [];
  const add = (label: string, fg: string, bg: string, required: number) => {
    const ratio = contrastRatio(fg, bg);
    pairings.push({ label, fg, bg, ratio, required, pass: ratio >= required });
  };
  add("Body text on background", colors.fg, colors.bg, 4.5);
  if (colors.muted) add("Muted text on background", colors.muted, colors.bg, 3);
  if (colors.primary && colors.onPrimary) add("Primary button label", colors.onPrimary, colors.primary, 4.5);
  if (colors.secondary && colors.onSecondary) add("Secondary button label", colors.onSecondary, colors.secondary, 4.5);
  if (colors.accent && colors.onAccent) add("Accent label", colors.onAccent, colors.accent, 4.5);
  const ok = pairings.every((p) => p.pass);
  return { colors, mode, pairings, audit, ok };
}

/** Convenience: validate + return a complete palette option object preserving meta. */
export function sanitizePaletteOption(opt: any): any {
  if (!opt || !opt.colors) return opt;
  const v = validatePalette(opt.colors as PaletteRoles);
  return {
    ...opt,
    colors: v.colors,
    mode: v.mode,
    contrast: {
      pass: v.ok,
      pairings: v.pairings,
    },
    audit: [...(opt.audit ?? []), ...v.audit],
    source: opt.source ?? "generated",
    version: 2,
  };
}
