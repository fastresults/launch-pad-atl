// Hostile-brand contract tests.
//
// The collateral run for a bright-cyan brand was blocked on every kind with
// "a logo specimen was drawn in #21c0ff on #F5F5F5". The renderer chose the ink
// and the quality gate judged it, and the two disagreed. These fixtures pin the
// rule that settles it: whatever ink a template asks for, `resolveInk` returns a
// form of it that clears the gate on that ground.

import { describe, expect, it } from "vitest";
import { LOGO_MIN_CONTRAST, resolveBrandInks, resolveInk } from "./logo-ink.ts";
import { contrastRatio } from "./color-spaces.ts";

/** The floor the collateral quality gate applies to a specimen. */
const QC_FLOOR = 2.4;

const PAPER = "#F5F5F5";
const CHARCOAL = "#161719";

const HOSTILE_BRANDS: Array<{ name: string; roles: Record<string, string> }> = [
  { name: "saturated cyan (the reported failure)", roles: { primary: "#21c0ff", accent: "#00e5ff", fg: "#101014", bg: PAPER } },
  { name: "near-white", roles: { primary: "#FAFAF7", accent: "#F2F0E9", fg: "#111111", bg: "#FFFFFF" } },
  { name: "near-black", roles: { primary: "#0A0A0A", accent: "#141414", fg: "#000000", bg: "#0B0B12" } },
  { name: "high-key yellow", roles: { primary: "#FFE500", accent: "#FFF176", fg: "#1A1A00", bg: PAPER } },
  { name: "mid grey neutral", roles: { primary: "#808080", accent: "#8A8A8A", fg: "#666666", bg: "#7A7A7A" } },
  { name: "eight-role palette", roles: {
    primary: "#21c0ff", secondary: "#7C4DFF", accent: "#00E676", muted: "#B0BEC5",
    fg: "#0E1116", bg: PAPER, surface: "#E7E9EC", highlight: "#FFD54F",
  } },
];

const GROUNDS = [PAPER, "#FFFFFF", CHARCOAL, "#0B0B12", "#21c0ff", "#FFE500"];

describe("resolveInk clears the quality gate on hostile brands", () => {
  for (const brand of HOSTILE_BRANDS) {
    for (const ground of GROUNDS) {
      it(`${brand.name} on ${ground}`, () => {
        for (const [role, hex] of Object.entries(brand.roles)) {
          const ink = resolveInk(hex, ground);
          expect(
            contrastRatio(ink, ground),
            `${role} ${hex} resolved to ${ink} on ${ground}`,
          ).toBeGreaterThanOrEqual(QC_FLOOR);
        }
      });
    }
  }
});

describe("resolveInk behaviour", () => {
  it("leaves an ink that already passes untouched", () => {
    expect(resolveInk("#101014", PAPER)).toBe("#101014");
  });

  it("keeps the brand hue rather than collapsing to flat black", () => {
    const ink = resolveInk("#21c0ff", PAPER);
    expect(ink.toLowerCase()).not.toBe("#000000");
    expect(contrastRatio(ink, PAPER)).toBeGreaterThanOrEqual(LOGO_MIN_CONTRAST);
    // still recognisably blue: the blue channel stays the strongest
    const b = parseInt(ink.slice(5, 7), 16);
    const r = parseInt(ink.slice(1, 3), 16);
    expect(b).toBeGreaterThan(r);
  });

  it("falls back to neutral ink for a hue with no legible lightness", () => {
    const ink = resolveInk(null, CHARCOAL);
    expect(contrastRatio(ink, CHARCOAL)).toBeGreaterThanOrEqual(LOGO_MIN_CONTRAST);
  });
});

describe("resolveBrandInks", () => {
  it("resolves every role against every ground at lock time", () => {
    const table = resolveBrandInks(
      { primary: "#21c0ff", accent: "#00E676", fg: "#0E1116" },
      { paper: PAPER, charcoal: CHARCOAL, primary: "#21c0ff", accent: null },
    );
    expect(Object.keys(table).sort()).toEqual(["charcoal", "paper", "primary"]);
    for (const [ground, roles] of Object.entries(table)) {
      const surface = ground === "paper" ? PAPER : ground === "charcoal" ? CHARCOAL : "#21c0ff";
      for (const ink of Object.values(roles)) {
        expect(contrastRatio(ink, surface)).toBeGreaterThanOrEqual(QC_FLOOR);
      }
    }
  });
});
