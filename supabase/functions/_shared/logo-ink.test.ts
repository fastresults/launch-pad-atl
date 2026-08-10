import { describe, expect, it } from "vitest";
import { inkPasses, logoCandidates, svgInkHex } from "./logo-ink.ts";

const LIGHT_SURFACE = "#FFFFFF";
const DARK_SURFACE = "#0B0B12";

const logos = [
  { primary: true, variant: "primary", path: "brand/tap-logo-light.svg" },
  { primary: false, variant: "reversed", path: "brand/tap-logo-dark.svg" },
  { primary: false, variant: "icon", path: "brand/tap-symbol.svg" },
];

describe("logo candidate ordering", () => {
  it("prefers the uploaded reversed sibling on a dark ground", () => {
    expect(logoCandidates(logos, DARK_SURFACE)[0].path).toBe("brand/tap-logo-dark.svg");
  });

  it("prefers the primary mark on paper", () => {
    expect(logoCandidates(logos, LIGHT_SURFACE)[0].path).toBe("brand/tap-logo-light.svg");
  });

  it("includes generated variant slots alongside siblings", () => {
    const paths = logoCandidates(
      [{ primary: true, path: "a.svg", variants: { knockout: { path: "k.svg" } } }],
      DARK_SURFACE,
    ).map((c) => c.path);
    expect(paths).toEqual(["k.svg", "a.svg"]);
  });
});

describe("ink measurement", () => {
  it("reads paints declared in a style block", () => {
    const svg =
      `<svg viewBox="0 0 100 100"><style>.a{fill:#123456}</style><path class="a" d="M0 0h10v10H0z"/></svg>`;
    expect(svgInkHex(svg)).toBe("#123456");
  });

  it("ignores a full-bleed background rect", () => {
    const svg =
      `<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#0b0b12"/>` +
      `<path fill="#ffffff" d="M0 0h10v10H0z"/></svg>`;
    expect(svgInkHex(svg)).toBe("#ffffff");
  });

  it("passes a white mark on dark and fails a navy one", () => {
    expect(inkPasses("#FFFFFF", DARK_SURFACE)).toBe(true);
    expect(inkPasses("#1B2A45", DARK_SURFACE)).toBe(false);
  });
});
