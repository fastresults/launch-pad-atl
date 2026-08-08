import { ArrowRight, ChevronDown, CalendarClock, FileText, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import type { Layout } from "@/lib/timeline-schedule";
import { formatDayShort } from "@/lib/timeline-schedule";
import type { TimelineScenario, VentureTimeline } from "@/lib/venture-timeline";
import { Head, LANE_TINT } from "@/components/timeline/timeline-bits";

export interface TimelineListProps {
  timeline: VentureTimeline;
  layout: Layout;
  scenario: TimelineScenario;
  selectedId?: string | null;
  onSelect: (id: string | null) => void;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
  onOpenAsset?: (assetKey: string) => void;
  onAsk?: (question: string) => void;
  onNudge?: (id: string, days: number) => void;
  readOnly?: boolean;
}

/**
 * The same schedule, read top to bottom. The track is for feeling the shape of
 * the plan; this is for actually reading it in order.
 */
export function TimelineList({
  timeline,
  layout,
  scenario,
  selectedId,
  onSelect,
  hoveredId,
  onHover,
  onOpenAsset,
  onAsk,
  onNudge,
  readOnly,
}: TimelineListProps) {
  const milestoneAfter = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of layout.milestones) {
      const list = map.get(m.milestone.afterStep) ?? [];
      list.push(m.milestone.label);
      map.set(m.milestone.afterStep, list);
    }
    return map;
  }, [layout.milestones]);

  const groups = useMemo(() => {
    const ordered = [...layout.steps].sort((a, b) => a.startDay - b.startDay);
    return timeline.phases
      .map((phase) => ({
        phase,
        steps: ordered.filter((s) => s.step.phase === phase.id),
      }))
      .filter((g) => g.steps.length);
  }, [timeline.phases, layout.steps]);

  const activeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedId && activeRef.current) {
      activeRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedId]);

  const weeks = Math.max(1, Math.round(layout.totalDays / 7));
  let n = 0;

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="timeline-step-list"
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <Head>Step by step</Head>
          <span className="block text-[13px] text-white/55">
            {layout.steps.length} steps · idea to first cash in {weeks} {weeks === 1 ? "week" : "weeks"}
          </span>
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-[12px] text-white/65">
          {open ? "Hide" : "Read the schedule"}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        </span>
      </button>

      <div id="timeline-step-list" hidden={!open} className="mt-4 space-y-6">

        {groups.map(({ phase, steps }) => {
          const from = Math.min(...steps.map((s) => s.startDay));
          const to = Math.max(...steps.map((s) => s.endDay));
          return (
            <div key={phase.id}>
              <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-white/10 pb-2">
                <h4 className="text-[12px] uppercase tracking-[0.18em] text-white/70">{phase.label}</h4>
                <span className="text-[11px] tabular-nums text-white/35">
                  {formatDayShort(scenario.startDate, from)} → {formatDayShort(scenario.startDate, to)}
                </span>
                {phase.blurb && <p className="w-full text-[12px] text-white/40">{phase.blurb}</p>}
              </div>

              <div className="space-y-1.5">
                {steps.map((s) => {
                  n += 1;
                  const step = s.step;
                  const open = selectedId === step.id;
                  const lane = layout.activeLanes.find((l) => l.id === s.lane);
                  const days = Math.max(1, Math.round(s.endDay - s.startDay));
                  const marks = milestoneAfter.get(step.id);
                  const deps = (step.dependsOn ?? [])
                    .map((d) => layout.byId.get(d)?.step.title)
                    .filter(Boolean) as string[];
                  return (
                    <div
                      key={step.id}
                      ref={open ? activeRef : undefined}
                      onMouseEnter={() => onHover?.(step.id)}
                      onMouseLeave={() => onHover?.(null)}
                      className={cn(
                        "rounded-xl border transition-colors",
                        open
                          ? "border-white/25 bg-white/[0.06]"
                          : hoveredId === step.id
                            ? "border-white/20 bg-white/[0.05]"
                            : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(open ? null : step.id)}
                        aria-expanded={open}
                        className="flex w-full items-start gap-3 p-3 text-left"
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 text-[11px] tabular-nums text-white/55">
                          {n}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="text-[14px] font-medium text-white">{step.title}</span>
                            {marks?.map((label) => (
                              <span
                                key={label}
                                className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-[1px] text-[10px] font-medium text-emerald-300"
                              >
                                {label}
                              </span>
                            ))}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-white/45">
                            <span className="flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ background: LANE_TINT[s.lane] ?? "white" }}
                              />
                              {lane?.name ?? s.lane}
                            </span>
                            <span className="text-white/20">·</span>
                            <span className="tabular-nums">
                              {formatDayShort(scenario.startDate, s.startDay)} →{" "}
                              {formatDayShort(scenario.startDate, s.endDay)}
                            </span>
                            <span className="text-white/20">·</span>
                            <span className="tabular-nums">{days} days</span>
                            <span className="text-white/20">·</span>
                            <span className="tabular-nums">{Math.round(step.effortHours)} hrs</span>
                          </span>
                        </span>
                        <ChevronDown
                          className={cn(
                            "mt-1 h-4 w-4 shrink-0 text-white/35 transition-transform",
                            open && "rotate-180",
                          )}
                        />
                      </button>

                      {open && (
                        <div className="space-y-3 border-t border-white/10 px-3 pb-3 pt-3 text-[13.5px] leading-relaxed text-white/75">
                          {step.why && (
                            <div>
                              <Head>Why it's here</Head>
                              <p>{step.why}</p>
                            </div>
                          )}
                          {step.doneWhen && (
                            <div>
                              <Head>Done when</Head>
                              <p>{step.doneWhen}</p>
                            </div>
                          )}
                          {!!s.blockedDays && (
                            <p className="flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/10 p-2.5 text-[12.5px] text-amber-200/90">
                              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
                              {Math.round(s.blockedDays)} days of this step fall inside time you said you're away.
                            </p>
                          )}
                          {s.endDay > s.workEndDay && (
                            <p className="text-[12.5px] text-white/45">
                              Includes a {Math.round(s.endDay - s.workEndDay)}-day wait you can't work through.
                            </p>
                          )}
                          {!!deps.length && (
                            <div>
                              <Head>Can't start until</Head>
                              <ul className="space-y-1">
                                {deps.map((d) => (
                                  <li key={d} className="flex items-start gap-2">
                                    <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-white/35" />
                                    {d}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {step.assetKey && onOpenAsset && (
                              <button
                                type="button"
                                onClick={() => onOpenAsset(step.assetKey!)}
                                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[12px] text-white hover:bg-white/15"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Open the asset
                              </button>
                            )}
                            {onAsk && (
                              <button
                                type="button"
                                onClick={() =>
                                  onAsk(`Why is "${step.title}" scheduled where it is, and how do I do it well?`)
                                }
                                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] text-white/65 hover:text-white"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                Ask the second brain
                              </button>
                            )}
                            {!readOnly && onNudge && (
                              <div className="ml-auto flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => onNudge(step.id, -7)}
                                  className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-white/65 hover:border-white/35 hover:text-white"
                                >
                                  −1 wk
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onNudge(step.id, 7)}
                                  className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-white/65 hover:border-white/35 hover:text-white"
                                >
                                  +1 wk
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
