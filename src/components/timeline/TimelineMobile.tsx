import type { Layout } from "@/lib/timeline-schedule";
import { formatDayShort } from "@/lib/timeline-schedule";
import type { TimelineScenario, VentureTimeline } from "@/lib/venture-timeline";

const LANE_TINT: Record<string, string> = {
  founder: "hsl(38 92% 58%)",
  builder: "hsl(199 89% 60%)",
  marketer: "hsl(280 70% 68%)",
};

/**
 * Phones get the same schedule as a vertical, scroll-snapped story. Pinching a
 * Gantt chart on a 390px screen is not an experience worth shipping.
 */
export function TimelineMobile({
  timeline,
  layout,
  scenario,
  onSelect,
}: {
  timeline: VentureTimeline;
  layout: Layout;
  scenario: TimelineScenario;
  onSelect: (id: string) => void;
}) {
  const milestoneAfter = new Map<string, string[]>();
  for (const m of layout.milestones) {
    const list = milestoneAfter.get(m.milestone.afterStep) ?? [];
    list.push(m.milestone.label);
    milestoneAfter.set(m.milestone.afterStep, list);
  }

  let lastPhase = "";
  return (
    <div className="relative space-y-3 pl-6">
      <div className="absolute bottom-2 left-[7px] top-2 w-px bg-white/12" />
      {layout.steps.map((s) => {
        const phase = timeline.phases.find((p) => p.id === s.step.phase);
        const showPhase = phase && phase.label !== lastPhase;
        if (showPhase) lastPhase = phase!.label;
        const marks = milestoneAfter.get(s.step.id);
        const lane = layout.activeLanes.find((l) => l.id === s.lane);
        return (
          <div key={s.step.id}>
            {showPhase && (
              <p className="mb-2 mt-5 text-[11px] uppercase tracking-[0.18em] text-white/40">{phase!.label}</p>
            )}
            <button
              type="button"
              onClick={() => onSelect(s.step.id)}
              className="relative w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left active:bg-white/[0.07]"
            >
              <span
                className="absolute -left-[23px] top-5 h-2.5 w-2.5 rounded-full"
                style={{ background: LANE_TINT[s.lane] ?? "white" }}
              />
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[14px] font-medium text-white">{s.step.title}</span>
                <span className="shrink-0 text-[11px] tabular-nums text-white/45">
                  {formatDayShort(scenario.startDate, s.startDay)}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-white/50">
                {lane?.name ?? s.lane} · {Math.max(1, Math.round(s.endDay - s.startDay))} days
                {s.step.doneWhen ? ` · ${s.step.doneWhen}` : ""}
              </p>
            </button>
            {marks?.map((label) => (
              <div key={label} className="relative mt-2">
                <span className="absolute -left-[25px] top-1 h-3 w-3 rotate-45 bg-emerald-400" />
                <p className="text-[12px] font-medium text-emerald-300">{label}</p>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
