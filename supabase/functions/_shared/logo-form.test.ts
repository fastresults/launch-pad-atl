import { describe, expect, it } from "vitest";
import { measureSvg, reconcileSlot, slotFor, formToneOf, classifyArtwork, countShapes, inkTone } from "./logo-form.ts";
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

  it("never second-guesses a symbol or wordmark slot on geometry alone", () => {
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

const enc = (s: string) => new TextEncoder().encode(s);
const shapes = (n: number, fill: string) =>
  Array.from({ length: n }, () => `<path fill="${fill}" d="M0 0h1v1z"/>`).join("");

describe("classifying the real Friendship House files", () => {
  it("counts ink and reads tone", () => {
    expect(countShapes(shapes(21, "#0055a4"))).toBe(21);
    expect(inkTone(`<svg>${shapes(3, "#fdfeff")}</svg>`)?.tone).toBe("inverse");
    expect(inkTone(`<svg>${shapes(3, "#0055a4")}</svg>`)?.tone).toBe("colour");
  });

  it("files a near-square colour lockup as stacked, not a symbol", () => {
    const svg = `<svg viewBox="0 0 678.95 731.62">${shapes(21, "#0055a4")}</svg>`;
    const c = classifyArtwork(enc(svg), "image/svg+xml", { form: "horizontal", tone: "colour" });
    expect(c.form).toBe("stacked");
    expect(c.tone).toBe("colour");
    expect(reconcileSlot("primary", c).variant).toBe("stacked");
  });

  it("reads a light-ink lockup as inverse however it is named", () => {
    const svg = `<svg viewBox="0 0 2384.47 408.85">${shapes(21, "#e2e2e2")}</svg>`;
    const c = classifyArtwork(enc(svg), "image/svg+xml", { form: "horizontal", tone: "colour" });
    expect(c.form).toBe("horizontal");
    expect(c.tone).toBe("inverse");
    expect(reconcileSlot("primary", c).variant).toBe("reversed");
  });

  it("keeps a three-shape near-square file a symbol", () => {
    const svg = `<svg viewBox="0 0 434.01 408.85">${shapes(3, "#fdfeff")}</svg>`;
    const c = classifyArtwork(enc(svg), "image/svg+xml", { form: "stacked", tone: "colour" });
    expect(c.form).toBe("symbol");
    expect(c.tone).toBe("inverse");
    expect(reconcileSlot("stacked", c).variant).toBe("icon_reversed");
  });

  it("marks a raster classification as inferred", () => {
    const png = new Uint8Array(32);
    png[0] = 0x89; png[1] = 0x50;
    new DataView(png.buffer).setUint32(16, 800);
    new DataView(png.buffer).setUint32(20, 200);
    const c = classifyArtwork(png, "image/png", { form: "horizontal", tone: "colour" });
    expect(c.inferred).toBe(true);
    expect(c.confidence).toBe(0.5);
    expect(c.form).toBe("horizontal");
  });
});
