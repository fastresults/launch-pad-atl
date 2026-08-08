import { describe, expect, it } from "vitest";
import { defaultScenario, fallbackTimeline, normalizeTimeline } from "@/lib/venture-timeline";
import { scheduleTimeline } from "@/lib/timeline-schedule";

const timeline = fallbackTimeline();

describe("scheduleTimeline", () => {
  it("respects dependencies", () => {
    const layout = scheduleTimeline(timeline, defaultScenario());
    for (const laid of layout.steps) {
      for (const dep of laid.step.dependsOn ?? []) {
        const d = layout.byId.get(dep)!;
        expect(laid.startDay).toBeGreaterThanOrEqual(d.endDay - 0.001);
      }
    }
  });

  it("never overlaps two steps in the same lane", () => {
    const layout = scheduleTimeline(timeline, defaultScenario());
    for (const lane of layout.activeLanes) {
      const bars = layout.steps.filter((s) => s.lane === lane.id).sort((a, b) => a.startDay - b.startDay);
      for (let i = 1; i < bars.length; i++) {
        expect(bars[i].startDay).toBeGreaterThanOrEqual(bars[i - 1].workEndDay - 0.001);
      }
    }
  });

  it("takes much longer at 10 hours a week solo", () => {
    const full = scheduleTimeline(timeline, defaultScenario());
    const solo = scheduleTimeline(timeline, {
      ...defaultScenario(),
      lanes: defaultScenario().lanes.map((l) => ({ ...l, enabled: l.id === "founder", hoursPerWeek: 10 })),
    });
    expect(solo.totalDays).toBeGreaterThan(full.totalDays * 2);
  });

  it("pushes work around blackouts", () => {
    const base = defaultScenario();
    const withBreak = scheduleTimeline(timeline, {
      ...base,
      blackouts: [{ startDay: 5, endDay: 25, label: "Busy season" }],
    });
    expect(withBreak.totalDays).toBeGreaterThan(scheduleTimeline(timeline, base).totalDays);
  });

  it("only accelerates steps money can buy", () => {
    const funded = scheduleTimeline(timeline, { ...defaultScenario(), budgetLevel: 3 });
    const convos = funded.byId.get("convos")!;
    const page = funded.byId.get("page")!;
    expect(convos.accelerated).toBe(false);
    expect(page.accelerated).toBe(true);
  });

  it("breaks cycles rather than hanging", () => {
    const cyclic = normalizeTimeline({
      steps: [
        { id: "a", title: "A", lane: "founder", phase: "idea", effortHours: 4, dependsOn: ["b"] },
        { id: "b", title: "B", lane: "founder", phase: "idea", effortHours: 4, dependsOn: ["a"] },
      ],
      milestones: [],
    })!;
    const layout = scheduleTimeline(cyclic, defaultScenario());
    expect(layout.steps).toHaveLength(2);
  });
});
