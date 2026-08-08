import { describe, expect, it } from "vitest";
import {
  decodeScenario,
  defaultScenario,
  encodeScenario,
  SCENARIO_PRESETS,
} from "@/lib/venture-timeline";

describe("scenario URL codec", () => {
  it("round-trips the default scenario", () => {
    const s = defaultScenario();
    const back = decodeScenario(encodeScenario(s));
    expect(back).toEqual(s);
  });

  it("round-trips a preset with nudges and a freedom line", () => {
    const s = SCENARIO_PRESETS[0].apply({
      ...defaultScenario(),
      freedomLineMonthly: 6500,
      nudges: { "step-a": 4 },
      blackouts: [{ startDay: 10, endDay: 20, label: "Busy season" }],
    });
    const back = decodeScenario(encodeScenario(s));
    expect(back?.lanes).toEqual(s.lanes);
    expect(back?.freedomLineMonthly).toBe(6500);
    expect(back?.nudges).toEqual({ "step-a": 4 });
    expect(back?.blackouts).toEqual(s.blackouts);
    expect(back?.label).toBe(s.label);
  });

  it("returns null for junk", () => {
    expect(decodeScenario("not-base64!!")).toBeNull();
    expect(decodeScenario(null)).toBeNull();
  });
});
