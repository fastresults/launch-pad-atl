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

export type CanvasPlan = {
  surface: string;     // background hex
  ink: string;         // text / primary mark on surface, AA-guaranteed
  accent: string;      // supporting role (≥3:1 vs surface, distinct from ink)
  signature: string;          // the raw brand role hex (reference)
  displaySignature: string;   // the hex actually rendered/checked — boosted if signature is too dark/desaturated to be visible
  signatureRole: string;
  signatureMinCoveragePct: number;
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

// If the chosen signature hex is too dark or too desaturated to read on screen
// as a brand splash, derive a displayable tint that preserves the hue but
// raises lightness and saturation into a visible band.
function deriveDisplaySignature(hex: string): string {
  const L = lightness(hex);   // 0..1 perceived
  const S = saturation(hex);  // 0..1
  if (L >= 0.18 && S >= 0.35) return hex;
  const h = hue(hex);
  // Target a punchy, visible mid-tone of the same hue family.
  const targetL = 0.50;
  const targetS = Math.max(S, 0.65);
  return hslToHex(h, targetS, targetL);
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

function signatureCoverageFor(direction: ArtDirectionId, assetKind: string): number {
  if (assetKind === "thumbnail" || assetKind === "video_poster" || assetKind === "vertical_pin") {
    return 30;
  }
  if (direction === "editorial") return 18;
  if (direction === "photographic") return 22; // duotone wash target
  if (direction === "geometric") return 28;
  if (direction === "illustrative") return 22;
  return 20;
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

  // Accent = a brand role distinct from surface AND ink, with ≥3:1 vs surface.
  const accentPool = ["accent", "secondary", "primary", "muted"]
    .map((k) => roles[k])
    .filter(Boolean) as string[];
  let accent = accentPool.find(
    (c) =>
      c.toUpperCase() !== surface.toUpperCase() &&
      c.toUpperCase() !== ink.toUpperCase() &&
      contrastRatio(c, surface) >= 3,
  ) || ink;

  // Signature = the unmistakable brand hue that MUST be visible.
  const sig = pickSignature(roles, surface, ink);
  const signatureMinCoveragePct = signatureCoverageFor(args.direction, args.asset.kind);

  // Surface dangerous combos so the prompt can ban them by name.
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
