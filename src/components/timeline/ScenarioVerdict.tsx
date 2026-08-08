import type { Layout } from "@/lib/timeline-schedule";
import { formatDay, weeklyCapacity } from "@/lib/timeline-schedule";
import type { RevenueProjection } from "@/lib/timeline-revenue";
import { money } from "@/lib/timeline-revenue";
import type { TimelineScenario } from "@/lib/venture-timeline";

/**
 * The sentence the founder actually came for. Reads like a person, not a
 * dashboard, and only ever states figures the schedule and their own assets
 * support.
 */
export function ScenarioVerdict({
  layout,
  baseline,
  scenario,
  revenue,
}: {
  layout: Layout;
  baseline?: Layout | null;
  scenario: TimelineScenario;
  revenue?: RevenueProjection | null;
}) {
  const people = scenario.lanes.filter((l) => l.enabled);
  const hours = weeklyCapacity(scenario);
  const launch =
    layout.milestones.find((m) => m.milestone.kind === "launch") ??
    layout.milestones.find((m) => m.milestone.kind === "cash");

  const sentence: string[] = [];
  sentence.push(
    `At ${hours} hrs a week across ${people.length} ${people.length === 1 ? "person" : "people"}`,
  );
  if (launch) sentence.push(`you open on ${formatDay(scenario.startDate, launch.day)}`);
  else sentence.push(`the build runs about ${Math.round(layout.totalDays / 7)} weeks`);

  if (revenue?.freedomDay != null && scenario.freedomLineMonthly) {
    sentence.push(
      `and clear ${money(scenario.freedomLineMonthly, revenue.currency)}/mo by ${formatDay(
        scenario.startDate,
        revenue.freedomDay,
      )}`,
    );
  } else if (scenario.freedomLineMonthly && revenue?.monthlyTarget) {
    sentence.push(
      `— but this venture's own projection tops out at ${money(
        revenue.monthlyTarget,
        revenue.currency,
      )}/mo, short of your ${money(scenario.freedomLineMonthly, revenue.currency)} line`,
    );
  } else if (revenue?.breakevenDay != null) {
    sentence.push(`and reach breakeven around ${formatDay(scenario.startDate, revenue.breakevenDay)}`);
  }

  const delta = baseline ? Math.round((layout.totalDays - baseline.totalDays) / 7) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-primary/15 via-white/[0.04] to-transparent p-4 md:p-5">
      <p className="font-serif text-[19px] leading-snug text-white md:text-[22px]">
        {sentence.join(" ")}.
      </p>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-white/55">
        <span>{Math.round(layout.totalDays)} days end to end</span>
        <span>{layout.steps.length} steps</span>
        {revenue?.firstCashDay != null && (
          <span>First money in {formatDay(scenario.startDate, revenue.firstCashDay)}</span>
        )}
        {!!delta && (
          <span className={delta > 0 ? "text-amber-300/80" : "text-emerald-300/80"}>
            {delta > 0 ? `${delta} weeks slower` : `${Math.abs(delta)} weeks faster`} than the full-time plan
          </span>
        )}
      </div>
    </div>
  );
}
