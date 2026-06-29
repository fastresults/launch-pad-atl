// Pre-computes the EXACT colors an image generator is allowed to use for a
// social asset, derived from the locked brand kit. Removes "model picks two
// palette roles" ambiguity that caused dark-ink-on-dark-violet failures.

import {
  contrastRatio,
  pickOnColor,
  lightness,
  saturation,
} from "./palette-rules.ts";
import type { AssetSpec, ArtDirectionId } from "./social-platform-specs.ts";

export type CanvasPlan = {
  surface: string;     // background hex
  ink: string;         // text / primary mark on surface, AA-guaranteed
  accent: string;      // supporting role (≥3:1 vs surface, distinct from ink)
  surfaceRole: string; // which palette role surface came from
  forbiddenPairs: Array<{ fg: string; bg: string; ratio: number }>;
};

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
  const secondary = roles.secondary || primary;

  // Direction-driven default surface choice
  let role: string;
  let color: string;
  if (assetKind === "thumbnail" || assetKind === "video_poster" || assetKind === "vertical_pin") {
    // High-impact formats: bold colored surface
    role = "primary";
    color = primary;
  } else if (direction === "geometric") {
    role = "primary";
    color = primary;
  } else if (direction === "photographic") {
    // Photographic = brand-tinted but base is neutral; treat surface as bg
    role = "bg";
    color = bg;
  } else if (direction === "editorial" || direction === "illustrative") {
    role = "bg";
    color = bg;
  } else {
    role = "bg";
    color = bg;
  }
  return { color, role };
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

  // Ink = on-color guaranteed ≥ 4.5:1 against surface.
  // Prefer an in-palette neutral that passes, else fall back to white/near-black.
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

  // Surface the dangerous combos so the prompt can ban them by name.
  const allRoles = Object.entries(roles);
  const forbiddenPairs: CanvasPlan["forbiddenPairs"] = [];
  for (const [, fg] of allRoles) {
    for (const [, bg] of allRoles) {
      if (fg.toUpperCase() === bg.toUpperCase()) continue;
      const r = contrastRatio(fg, bg);
      if (r < 3) forbiddenPairs.push({ fg, bg, ratio: Number(r.toFixed(2)) });
    }
  }

  return { surface, ink, accent, surfaceRole, forbiddenPairs };
}

// Choose the best avatar surface against the actual logo bytes' dominant ink.
// Returns the role name + hex picked from the palette.
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
