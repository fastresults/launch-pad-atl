import { describe, expect, it } from "vitest";
import { contrastRatio, inkOn, isDarkSurface, relLuminance } from "./color-spaces.ts";

describe("shared colour quality rules", () => {
  it("uses WCAG luminance and contrast", () => {
    expect(relLuminance("#000000")).toBe(0);
    expect(relLuminance("#FFFFFF")).toBeCloseTo(1, 5);
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 2);
  });

  it("chooses legible ink for light and dark surfaces", () => {
    expect(isDarkSurface("#101820")).toBe(true);
    expect(isDarkSurface("#F7F7F7")).toBe(false);
    expect(inkOn("#101820")).toBe("#FFFFFF");
    expect(inkOn("#F7F7F7")).toBe("#111111");
  });
});