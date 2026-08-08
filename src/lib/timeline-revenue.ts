// Revenue ribbon: what the timeline means in money.
//
// Everything here is derived from figures the venture already stated in its own
// finance assets (via the generated revenue model, or parsed out of the
// executive metrics as a fallback). Nothing is benchmarked or invented.

import type { Layout } from "@/lib/timeline-schedule";
import type { TimelineRevenueModel, TimelineScenario, VentureTimeline } from "@/lib/venture-timeline";

export interface RevenuePoint {
  day: number;
  monthly: number;
}

export interface RevenueProjection {
  points: RevenuePoint[];
  peak: number;
  firstCashDay: number | null;
  breakevenDay: number | null;
  /** Day the projection crosses the founder's quit-my-job number. */
  freedomDay: number | null;
  monthlyTarget: number | null;
  monthlyCost: number | null;
  currency: string;
  source: string | null;
}

/** Pull a monthly revenue figure out of the executive metric strip, if present. */
export function revenueFromMetrics(
  metrics: { label: string; value: string; source?: string | null }[] | null | undefined,
): Partial<TimelineRevenueModel> {
  const out: Partial<TimelineRevenueModel> = {};
  for (const m of metrics ?? []) {
    const label = (m.label ?? "").toLowerCase();
    const amount = parseMoney(m.value);
    if (amount == null) continue;
    const perMonth = /\/\s*mo|per month|monthly/i.test(m.value) || /month/.test(label);
    if (!out.monthlyTargetUsd && perMonth && /revenue|sales|income|mrr|cash/.test(label)) {
      out.monthlyTargetUsd = amount;
      out.source = m.source ?? null;
    }
    if (!out.monthlyCostUsd && /cost|burn|expense|overhead/.test(label) && perMonth) {
      out.monthlyCostUsd = amount;
    }
  }
  return out;
}

export function parseMoney(raw: string): number | null {
  if (!raw) return null;
  const m = String(raw).replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*([km])?/i);
  if (!m) return null;
  let n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const suffix = (m[2] ?? "").toLowerCase();
  if (suffix === "k") n *= 1_000;
  if (suffix === "m") n *= 1_000_000;
  return n > 0 ? n : null;
}

/**
 * Ramp model: nothing until the first-cash milestone, then a smooth climb to
 * the venture's own steady-state monthly figure over `rampMonths`.
 */
export function projectRevenue(
  timeline: VentureTimeline,
  layout: Layout,
  scenario: TimelineScenario,
  fallback?: Partial<TimelineRevenueModel>,
): RevenueProjection | null {
  const model: TimelineRevenueModel = {
    rampMonths: 6,
    ...(fallback ?? {}),
    ...(timeline.revenue ?? {}),
  };
  const target = model.monthlyTargetUsd ?? fallback?.monthlyTargetUsd ?? null;
  const cost = model.monthlyCostUsd ?? fallback?.monthlyCostUsd ?? null;

  const cashMilestone =
    layout.milestones.find((m) => m.milestone.id === model.firstCashMilestone) ??
    layout.milestones.find((m) => m.milestone.kind === "cash") ??
    layout.milestones.find((m) => m.milestone.kind === "launch");
  const firstCashDay = cashMilestone?.day ?? null;

  if (!target || firstCashDay == null) {
    return firstCashDay == null
      ? null
      : {
          points: [],
          peak: 0,
          firstCashDay,
          breakevenDay: null,
          freedomDay: null,
          monthlyTarget: null,
          monthlyCost: cost,
          currency: model.currency ?? "USD",
          source: model.source ?? null,
        };
  }

  const ramp = Math.max(1, model.rampMonths ?? 6) * 30;
  const horizon = Math.max(layout.totalDays, firstCashDay + ramp + 60);
  const points: RevenuePoint[] = [];
  for (let day = 0; day <= horizon; day += 5) {
    points.push({ day, monthly: revenueAt(day, firstCashDay, ramp, target) });
  }

  const crossing = (threshold: number | null) => {
    if (!threshold) return null;
    for (let day = firstCashDay; day <= horizon; day += 1) {
      if (revenueAt(day, firstCashDay, ramp, target) >= threshold) return day;
    }
    return null;
  };

  return {
    points,
    peak: target,
    firstCashDay,
    breakevenDay: crossing(cost),
    freedomDay: crossing(scenario.freedomLineMonthly),
    monthlyTarget: target,
    monthlyCost: cost,
    currency: model.currency ?? "USD",
    source: model.source ?? null,
  };
}

function revenueAt(day: number, firstCashDay: number, rampDays: number, target: number) {
  if (day < firstCashDay) return 0;
  const t = Math.min(1, (day - firstCashDay) / rampDays);
  // Ease-out so the early months are honest about being slow.
  return target * (1 - Math.pow(1 - t, 2));
}

export function money(n: number, currency = "USD") {
  const symbol = currency === "USD" ? "$" : "";
  if (n >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${symbol}${Math.round(n / 1000)}k`;
  return `${symbol}${Math.round(n).toLocaleString()}`;
}
