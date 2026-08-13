import { describe, expect, it } from "vitest";
import { measureSvg, reconcileSlot, slotFor, formToneOf } from "./logo-form.ts";
import { logoCandidates } from "./logo-ink.ts";

const LIGHT = "#FFFFFF";
const DARK = "#0B0B12";

describe("artwork measurement", () => {
  it("reads the viewBox", () => {
    expect(measureSvg(`<svg viewBox="0 0 800 200"></svg>`)?.aspect).toBeCloseTo(4);
  });

  it("falls back to width/height", () => {
    expect(measureSvg(`<svg width="120" height="240"></svg>`)?.aspect).toBeCloseTo(0.5);
  });
});

describe("slot reconciliation", () => {
  it("files a tall file dropped on Horizontal under Stacked", () => {
    const out = reconcileSlot("primary", { width: 400, height: 500, aspect: 0.8 });
    expect(out.variant).toBe("stacked");
    expect(out.moved).toBe(true);
  });

  it("keeps a genuinely wide file on Horizontal", () => {
    const out = reconcileSlot("primary", { width: 1000, height: 200, aspect: 5 });
    expect(out.variant).toBe("primary");
    expect(out.moved).toBe(false);
  });

  it("never second-guesses a symbol or wordmark slot", () => {
    expect(reconcileSlot("icon", { width: 900, height: 100, aspect: 9 }).variant).toBe("icon");
    expect(reconcileSlot("wordmark_reversed", { width: 100, height: 900, aspect: 0.11 }).variant).toBe(
      "wordmark_reversed",
    );
  });

  it("maps form x tone both ways", () => {
    expect(slotFor("stacked", "inverse")).toBe("stacked_reversed");
    expect(formToneOf("icon_reversed")).toEqual({ form: "symbol", tone: "inverse" });
  });
});

describe("candidate ranking on form and tone", () => {
  const logos = [
    { variant: "primary", form: "horizontal", tone: "colour", path: "h-light.svg", primary: true },
    { variant: "reversed", form: "horizontal", tone: "inverse", path: "h-dark.svg" },
    { variant: "stacked", form: "stacked", tone: "colour", path: "s-light.svg" },
    { variant: "stacked_reversed", form: "stacked", tone: "inverse", path: "s-dark.svg" },
    { variant: "icon", form: "symbol", tone: "colour", path: "sym.svg" },
  ];

  it("picks the stacked colour lockup for a square box on paper", () => {
    expect(logoCandidates(logos, LIGHT, 1)[0].path).toBe("s-light.svg");
  });

  it("picks the horizontal inverse lockup for a wide box on dark", () => {
    expect(logoCandidates(logos, DARK, 4)[0].path).toBe("h-dark.svg");
  });

  it("never mistakes the studio symbol for a horizontal lockup", () => {
    const studio = [{ primary: true, path: "sym.svg", variants: { horizontal: { path: "wide.svg" } } }];
    expect(logoCandidates(studio, LIGHT, 5)[0].path).toBe("wide.svg");
    expect(logoCandidates(studio, LIGHT, 1)[0].path).toBe("sym.svg");
  });
});
