import { describe, expect, it } from "vitest";
import { logoSetFrom } from "./LogoSetPanel";

describe("logo slot rendering", () => {
  it("does not alias a symbol into an empty horizontal slot", () => {
    const symbol = {
      source: "upload",
      variant: "icon",
      form: "symbol",
      tone: "colour",
      primary: true,
      path: "brand/symbol.svg",
      url: "https://example.test/symbol.svg",
    };

    const set = logoSetFrom([symbol]);

    expect(set.icon).toBe(symbol);
    expect(set.primary).toBeUndefined();
    expect(Object.keys(set)).toEqual(["icon"]);
  });

  it("keeps symbol, horizontal, and stacked entries in their exact slots", () => {
    const logos = [
      { source: "upload", variant: "icon", path: "symbol.svg", url: "symbol" },
      { source: "upload", variant: "primary", path: "horizontal.svg", url: "horizontal" },
      { source: "upload", variant: "stacked", path: "stacked.svg", url: "stacked" },
    ];

    const set = logoSetFrom(logos);

    expect(set.icon.path).toBe("symbol.svg");
    expect(set.primary.path).toBe("horizontal.svg");
    expect(set.stacked.path).toBe("stacked.svg");
  });
});