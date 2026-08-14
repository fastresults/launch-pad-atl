import { describe, expect, it } from "vitest";
import { logoBox, markBand, resolveSpec } from "./collateral-specs.ts";

const card = resolveSpec("business-card-front");

describe("optical mark sizing", () => {
  it("leaves a wide horizontal lockup on its written band", () => {
    const [lo, hi] = markBand(card, 3.4, true);
    expect(lo).toBeCloseTo(card.lockupBand[0], 5);
    expect(hi).toBeCloseTo(card.lockupBand[1], 5);
  });

  it("gives a stacked lockup more height for equal optical area", () => {
    const [, wide] = markBand(card, 3.4, true);
    const [, stacked] = markBand(card, 0.95, true);
    expect(stacked).toBeGreaterThan(wide);
    expect(stacked / wide).toBeLessThanOrEqual(1.5);
  });

  it("never boosts a symbol beyond its own band", () => {
    const [lo, hi] = markBand(card, 1, false);
    expect([lo, hi]).toEqual(card.logoBand);
  });

  it("keeps the boosted box inside the slot width", () => {
    const box = logoBox(card, 0.95, true, 300, 0.85, true);
    expect(box.w).toBeLessThanOrEqual(300);
    expect(box.h).toBeGreaterThan(logoBox(card, 3.4, true, 300, 0.85, true).h);
  });
});
