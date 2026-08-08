// Pure scheduler: (timeline, scenario) → laid-out bars.
//
// No React, no dates-library, no side effects, so it can be unit-tested and run
// on every slider drag without a model call. Day 0 is the scenario start date;
// everything downstream is expressed in fractional calendar days.

import {
  clamp,
  type LaneId,
  type TimelineLane,
  type TimelineMilestone,
  type TimelineScenario,
  type TimelineStep,
  type VentureTimeline,
} from "@/lib/venture-timeline";

export interface LaidOutStep {
  step: TimelineStep;
  /** Lane the work actually lands in once disabled seats are re-assigned. */
  lane: LaneId;
  startDay: number;
  /** End of the work itself. */
  workEndDay: number;
  /** End including any unavoidable calendar wait (filing approval etc). */
  endDay: number;
  /** Calendar days lost to blackouts inside this bar. */
  blockedDays: number;
  accelerated: boolean;
}

export interface LaidOutMilestone {
  milestone: TimelineMilestone;
  day: number;
}

export interface Layout {
  steps: LaidOutStep[];
  byId: Map<string, LaidOutStep>;
  milestones: LaidOutMilestone[];
  /** Last day any work finishes. */
  totalDays: number;
  /** Lanes that carry work, in render order. */
  activeLanes: TimelineLane[];
}

/** Money buys speed only where a contractor could genuinely take the work. */
const BUDGET_MULTIPLIER = [1, 0.85, 0.7, 0.55];

/** A "week" of availability is spread over 7 calendar days, not 5. */
function hoursPerDay(lane: TimelineLane) {
  return Math.max(0.25, lane.hoursPerWeek / 7);
}

/**
 * Walk forward from `from`, consuming `days` of *available* calendar time and
 * skipping anything inside a blackout. Returns the landing day and how much
 * calendar time the blackouts cost.
 */
function advance(from: number, days: number, blackouts: { startDay: number; endDay: number }[]) {
  if (days <= 0) return { end: skipBlackout(from, blackouts), blocked: 0 };
  let cursor = skipBlackout(from, blackouts);
  let remaining = days;
  let blocked = 0;
  // Blackouts are few (max 8), so a simple ordered walk is plenty.
  const sorted = [...blackouts].sort((a, b) => a.startDay - b.startDay);
  for (const b of sorted) {
    if (b.endDay <= cursor) continue;
    if (b.startDay >= cursor + remaining) break;
    const usable = Math.max(0, b.startDay - cursor);
    remaining -= usable;
    const gap = b.endDay - Math.max(cursor, b.startDay);
    blocked += gap;
    cursor = b.endDay;
  }
  return { end: cursor + remaining, blocked };
}

function skipBlackout(day: number, blackouts: { startDay: number; endDay: number }[]) {
  let d = day;
  let moved = true;
  let guard = 0;
  while (moved && guard++ < 20) {
    moved = false;
    for (const b of blackouts) {
      if (d >= b.startDay && d < b.endDay) {
        d = b.endDay;
        moved = true;
      }
    }
  }
  return d;
}

/** Kahn ordering; the timeline is already cycle-free by the time it gets here. */
function topoOrder(steps: TimelineStep[]): TimelineStep[] {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const indeg = new Map<string, number>();
  for (const s of steps) indeg.set(s.id, (s.dependsOn ?? []).filter((d) => byId.has(d)).length);
  const queue = steps.filter((s) => (indeg.get(s.id) ?? 0) === 0);
  const out: TimelineStep[] = [];
  while (queue.length) {
    const s = queue.shift()!;
    out.push(s);
    for (const t of steps) {
      if (!(t.dependsOn ?? []).includes(s.id)) continue;
      const n = (indeg.get(t.id) ?? 0) - 1;
      indeg.set(t.id, n);
      if (n === 0) queue.push(t);
    }
  }
  // Anything left behind (shouldn't happen) is appended so no step disappears.
  for (const s of steps) if (!out.includes(s)) out.push(s);
  return out;
}

export function scheduleTimeline(timeline: VentureTimeline, scenario: TimelineScenario): Layout {
  const enabled = scenario.lanes.filter((l) => l.enabled);
  const lanes = enabled.length ? enabled : [{ ...scenario.lanes[0], enabled: true }];
  const laneById = new Map(lanes.map((l) => [l.id, l]));
  // When a seat is empty the work does not vanish — the founder absorbs it.
  const fallbackLane = laneById.get("founder") ?? lanes[0];

  const laneFree = new Map<LaneId, number>(lanes.map((l) => [l.id, 0]));
  const finish = new Map<string, number>();
  const out: LaidOutStep[] = [];
  const blackouts = scenario.blackouts ?? [];
  const nudges = scenario.nudges ?? {};

  for (const step of topoOrder(timeline.steps)) {
    const lane = laneById.get(step.lane) ?? fallbackLane;
    const accelerated = !!step.moneyCanAccelerate && scenario.budgetLevel > 0;
    const effort = step.effortHours * (accelerated ? BUDGET_MULTIPLIER[scenario.budgetLevel] : 1);
    const durationDays = Math.max(0.5, effort / hoursPerDay(lane));

    const depsDone = (step.dependsOn ?? []).reduce((max, d) => Math.max(max, finish.get(d) ?? 0), 0);
    const laneReady = laneFree.get(lane.id) ?? 0;
    const nudge = clamp(Number(nudges[step.id]) || 0, 0, 365);
    const start = Math.max(depsDone, laneReady) + nudge;

    const { end: workEnd, blocked } = advance(start, durationDays, blackouts);
    const endDay = workEnd + (step.waitDays ?? 0);

    laneFree.set(lane.id, workEnd);
    finish.set(step.id, endDay);
    out.push({
      step,
      lane: lane.id,
      startDay: skipBlackout(start, blackouts),
      workEndDay: workEnd,
      endDay,
      blockedDays: blocked,
      accelerated,
    });
  }

  const byId = new Map(out.map((s) => [s.step.id, s]));
  const milestones: LaidOutMilestone[] = (timeline.milestones ?? [])
    .map((m) => ({ milestone: m, day: finish.get(m.afterStep) ?? 0 }))
    .filter((m) => m.day > 0)
    .sort((a, b) => a.day - b.day);

  const totalDays = Math.max(30, ...out.map((s) => s.endDay));

  return {
    steps: out.sort((a, b) => a.startDay - b.startDay),
    byId,
    milestones,
    totalDays,
    activeLanes: lanes,
  };
}

/** Day number → real calendar date, given the scenario's start. */
export function dayToDate(startDate: string, day: number): Date {
  const d = new Date(`${startDate}T00:00:00`);
  d.setDate(d.getDate() + Math.round(day));
  return d;
}

export function formatDay(startDate: string, day: number): string {
  return dayToDate(startDate, day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDayShort(startDate: string, day: number): string {
  return dayToDate(startDate, day).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Total person-hours the scenario is asking for, weekly. */
export function weeklyCapacity(scenario: TimelineScenario) {
  return scenario.lanes.filter((l) => l.enabled).reduce((n, l) => n + l.hoursPerWeek, 0);
}
