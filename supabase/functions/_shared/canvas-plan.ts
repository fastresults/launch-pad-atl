// Pre-computes the EXACT colors an image generator is allowed to use for a
// social asset, derived from the locked brand kit. Removes "model picks two
// palette roles" ambiguity and guarantees the brand's signature hue shows up.

import {
  contrastRatio,
  hue,
  lightness,
  pickOnColor,
  saturation,
} from "./palette-rules.ts";
import type { AssetSpec, ArtDirectionId } from "./social-platform-specs.ts";

export type SignatureIntensity = "subtle" | "balanced" | "bold";
export type SignaturePlacement =
  | "auto"
  | "anchor_block"
  | "sidebar_stripe"
  | "duotone_wash"
  | "focal_shape"
  | "corner_mark"
  | "framed_border";

export type SignatureConfig = {
  intensity?: SignatureIntensity;
  placement?: SignaturePlacement;
  // Optional hard override (0-100). If set, wins over intensity/direction defaults.
  minCoveragePct?: number;
};

export type CanvasPlan = {
  surface: string;     // background hex
  ink: string;         // text / primary mark on surface, AA-guaranteed
  accent: string;      // supporting role (≥3:1 vs surface, distinct from ink)
  signature: string;          // the raw brand role hex (reference)
  displaySignature: string;   // the hex actually rendered/checked — boosted if signature is too dark/desaturated to be visible
  signatureRole: string;
  signatureMinCoveragePct: number;
  signatureIntensity: SignatureIntensity;
  signaturePlacement: SignaturePlacement;
  signaturePlacementBrief: string; // palette-agnostic placement instruction for the model
  surfaceRole: string;
  forbiddenPairs: Array<{ fg: string; bg: string; ratio: number }>;
};

// HSL helpers (local — palette-rules exports only hue/saturation/lightness getters)
function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0").toUpperCase();
  return `#${to(r)}${to(g)}${to(b)}`;
}

// The brand's own hex is the truth. We only intervene when a color is so dark
// it would read as black at thumbnail size — and even then we lift LIGHTNESS
// only, preserving hue and saturation, so a muted slate green never becomes a
// neon teal. Desaturated brand colors are a deliberate brand choice, not a bug.
export function deriveDisplaySignature(hex: string): string {
  const L = lightness(hex);   // 0..1 perceived
  if (L >= 0.16) return hex;
  const h = hue(hex);
  const S = saturation(hex);
  // Minimal lift: same hue, same saturation, just out of the near-black band.
  return hslToHex(h, S, 0.28);
}


export type PaletteOverride = {
  surface?: string;
  ink?: string;
  accent?: string;
  signature?: string;
};

function normalizeHex(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  const m = t.match(/^#?([0-9a-fA-F]{6})$/);
  return m ? `#${m[1].toUpperCase()}` : null;
}

/**
 * Merge a user-provided palette override into a CanvasPlan. Invalid hexes are
 * ignored (falls back to the plan's brand-kit value). Signature overrides also
 * recompute displaySignature so the AI reference and QA both track the new hue.
 */
export function applyPaletteOverride(plan: CanvasPlan, override?: PaletteOverride | null): CanvasPlan {
  if (!override) return plan;
  const surface = normalizeHex(override.surface);
  const ink = normalizeHex(override.ink);
  const accent = normalizeHex(override.accent);
  const signature = normalizeHex(override.signature);
  if (!surface && !ink && !accent && !signature) return plan;
  const nextSignature = signature ?? plan.signature;
  return {
    ...plan,
    surface: surface ?? plan.surface,
    ink: ink ?? plan.ink,
    accent: accent ?? plan.accent,
    signature: nextSignature,
    displaySignature: signature ? deriveDisplaySignature(nextSignature) : plan.displaySignature,
  };
}

function rolesFromKit(kit: any): Record<string, string> {
  const c = kit?.palette?.colors ?? {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(c)) {
    if (typeof v === "string" && /^#?[0-9a-fA-F]{6}$/.test(v.replace("#", ""))) {
      out[k] = v.startsWith("#") ? v.toUpperCase() : `#${v.toUpperCase()}`;
    }
  }
  return out;
}

function pickSurfaceForDirection(
  roles: Record<string, string>,
  direction: ArtDirectionId,
  assetKind: string,
): { color: string; role: string } {
  const bg = roles.bg || roles.background || "#FFFFFF";
  const primary = roles.primary || roles.accent || "#111111";

  let role: string;
  let color: string;
  if (assetKind === "thumbnail" || assetKind === "video_poster" || assetKind === "vertical_pin") {
    role = "primary";
    color = primary;
  } else if (direction === "geometric") {
    role = "primary";
    color = primary;
  } else {
    role = "bg";
    color = bg;
  }
  return { color, role };
}

function signatureCoverageFor(
  direction: ArtDirectionId,
  assetKind: string,
  intensity: SignatureIntensity,
): number {
  let base: number;
  if (assetKind === "thumbnail" || assetKind === "video_poster" || assetKind === "vertical_pin") {
    base = 30;
  } else if (direction === "editorial") base = 18;
  else if (direction === "photographic") base = 22;
  else if (direction === "geometric") base = 28;
  else if (direction === "illustrative") base = 22;
  else base = 20;
  const factor = intensity === "subtle" ? 0.55 : intensity === "bold" ? 1.45 : 1;
  return Math.max(8, Math.min(Math.round(base * factor), 60));
}

function resolvePlacement(
  requested: SignaturePlacement,
  direction: ArtDirectionId,
  assetKind: string,
): SignaturePlacement {
  if (requested !== "auto") return requested;
  if (assetKind === "thumbnail" || assetKind === "video_poster" || assetKind === "vertical_pin") {
    return "focal_shape";
  }
  if (direction === "photographic") return "duotone_wash";
  if (direction === "editorial") return "sidebar_stripe";
  if (direction === "geometric") return "focal_shape";
  if (direction === "illustrative") return "focal_shape";
  return "anchor_block";
}

function placementBrief(p: SignaturePlacement, intensity: SignatureIntensity): string {
  const tone =
    intensity === "subtle"
      ? "Keep it confident but restrained — a single deliberate moment, not poster-paint."
      : intensity === "bold"
      ? "Push it loud — the brand hue is the HERO element, the first thing the eye lands on."
      : "Treat it as the anchoring brand moment — unmistakable at thumbnail size, never decorative trim.";
  switch (p) {
    case "anchor_block":
      return `Render the brand signature color as one large flat anchor block (rectangle or arc) occupying a major quadrant of the canvas. ${tone}`;
    case "sidebar_stripe":
      return `Render the brand signature color as a full-bleed sidebar or folio stripe along one edge (top, bottom, or vertical edge). ${tone}`;
    case "duotone_wash":
      return `Apply the brand signature color as a confident duotone or gradient wash over the focal subject / background. Midtones must read clearly as the signature hue, never as neutral gray. ${tone}`;
    case "focal_shape":
      return `Render the brand signature color as the FILL of the dominant focal shape (circle, arc, illustrated form, or headline mark) — not as an outline. ${tone}`;
    case "corner_mark":
      return `Render the brand signature color as a deliberate corner / folio mark — a solid quarter-circle, tab, or corner block. Not a hairline. ${tone}`;
    case "framed_border":
      return `Render the brand signature color as a confident framed border or inner frame around the composition (≥4% of canvas width on each side). ${tone}`;
    default:
      return tone;
  }
}

function pickSignature(
  roles: Record<string, string>,
  surface: string,
  ink: string,
): { hex: string; role: string } {
  // Prefer the most "brand-defining" hue: primary, then secondary, then accent.
  const ordered: Array<[string, string | undefined]> = [
    ["primary", roles.primary],
    ["secondary", roles.secondary],
    ["accent", roles.accent],
  ];
  const surfU = surface.toUpperCase();
  const inkU = ink.toUpperCase();

  // First pass: strongly saturated, distinct from surface & ink.
  for (const [name, hex] of ordered) {
    if (!hex) continue;
    const H = hex.toUpperCase();
    if (H === surfU || H === inkU) continue;
    if (saturation(hex) >= 0.25) return { hex, role: name };
  }
  // Second pass: any candidate distinct from surface & ink.
  for (const [name, hex] of ordered) {
    if (!hex) continue;
    const H = hex.toUpperCase();
    if (H === surfU || H === inkU) continue;
    return { hex, role: name };
  }
  // Last resort: pick any non-surface, non-ink saturated role from the kit.
  for (const [name, hex] of Object.entries(roles)) {
    const H = hex.toUpperCase();
    if (H === surfU || H === inkU) continue;
    if (saturation(hex) >= 0.2) return { hex, role: name };
  }
  // Nothing brandy — fall back to accent equivalent.
  return { hex: roles.accent || roles.primary || ink, role: "fallback" };
}

export function buildCanvasPlan(args: {
  kit: any;
  asset: AssetSpec;
  direction: ArtDirectionId;
  signature?: SignatureConfig;
}): CanvasPlan {
  const roles = rolesFromKit(args.kit);
  const { color: surface, role: surfaceRole } = pickSurfaceForDirection(
    roles,
    args.direction,
    args.asset.kind,
  );

  const candidates = [
    roles.onPrimary, roles.onSecondary, roles.onAccent,
    roles.fg, roles.bg,
    "#FFFFFF", "#0B0F19",
  ].filter(Boolean) as string[];
  let ink = pickOnColor(surface);
  for (const c of candidates) {
    if (contrastRatio(c, surface) >= 4.5) { ink = c; break; }
  }

  const accentPool = ["accent", "secondary", "primary", "muted"]
    .map((k) => roles[k])
    .filter(Boolean) as string[];
  let accent = accentPool.find(
    (c) =>
      c.toUpperCase() !== surface.toUpperCase() &&
      c.toUpperCase() !== ink.toUpperCase() &&
      contrastRatio(c, surface) >= 3,
  ) || ink;

  const sig = pickSignature(roles, surface, ink);
  const intensity: SignatureIntensity = args.signature?.intensity ?? "balanced";
  const placement: SignaturePlacement = resolvePlacement(
    args.signature?.placement ?? "auto",
    args.direction,
    args.asset.kind,
  );
  const signatureMinCoveragePct =
    typeof args.signature?.minCoveragePct === "number"
      ? Math.max(0, Math.min(100, Math.round(args.signature.minCoveragePct)))
      : signatureCoverageFor(args.direction, args.asset.kind, intensity);
  const signaturePlacementBrief = placementBrief(placement, intensity);

  const allRoles = Object.entries(roles);
  const forbiddenPairs: CanvasPlan["forbiddenPairs"] = [];
  for (const [, fg] of allRoles) {
    for (const [, bg] of allRoles) {
      if (fg.toUpperCase() === bg.toUpperCase()) continue;
      const r = contrastRatio(fg, bg);
      if (r < 3) forbiddenPairs.push({ fg, bg, ratio: Number(r.toFixed(2)) });
    }
  }

  return {
    surface,
    ink,
    accent,
    signature: sig.hex,
    displaySignature: deriveDisplaySignature(sig.hex),
    signatureRole: sig.role,
    signatureMinCoveragePct,
    signatureIntensity: intensity,
    signaturePlacement: placement,
    signaturePlacementBrief,
    surfaceRole,
    forbiddenPairs,
  };
}

export function pickAvatarSurface(
  kit: any,
  logoDominantInk: string | null,
): { surface: string; ink: string } {
  const roles = rolesFromKit(kit);
  const pool = [roles.bg, roles.primary, roles.secondary, roles.accent, "#FFFFFF", "#0B0F19"]
    .filter(Boolean) as string[];
  const ink = logoDominantInk || "#000000";
  let best = pool[0] || "#FFFFFF";
  let bestR = contrastRatio(best, ink);
  for (const c of pool) {
    const r = contrastRatio(c, ink);
    if (r > bestR) { best = c; bestR = r; }
  }
  return { surface: best, ink };
}
