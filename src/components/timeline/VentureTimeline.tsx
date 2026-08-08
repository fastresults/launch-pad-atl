import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  defaultScenario,
  fallbackTimeline,
  normalizeScenario,
  normalizeTimeline,
  type TimelineScenario,
  type VentureTimeline,
} from "@/lib/venture-timeline";
import { scheduleTimeline } from "@/lib/timeline-schedule";
import { projectRevenue, revenueFromMetrics } from "@/lib/timeline-revenue";
import { TimelineCanvas } from "@/components/timeline/TimelineCanvas";
import { TimelineMobile } from "@/components/timeline/TimelineMobile";
import { ScenarioBar } from "@/components/timeline/ScenarioBar";
import { ScenarioVerdict } from "@/components/timeline/ScenarioVerdict";
import { TimelineStepPanel } from "@/components/timeline/TimelineStepPanel";

export interface VentureTimelineProps {
  /** Raw jsonb from the venture, or null to render the deterministic fallback. */
  timeline?: unknown;
  scenario?: unknown;
  /** Figures already extracted for the executive summary — feeds the revenue ribbon. */
  metrics?: { label: string; value: string; source?: string | null }[] | null;
  /** Owner surfaces can save; the public showcase plays read-only. */
  onSaveScenario?: (s: TimelineScenario) => void;
  onOpenAsset?: (assetKey: string) => void;
  onAsk?: (question: string) => void;
  readOnly?: boolean;
  /** Controlled selection, so a share link can deep-link straight to one step. */
  selectedStepId?: string | null;
  onSelectStep?: (id: string | null) => void;
  /** A reader's what-if, decoded from the URL, applied on top of the saved plan. */
  scenarioOverride?: TimelineScenario | null;
  onScenarioChange?: (s: TimelineScenario, dirty: boolean) => void;
  /** Copy for the reset control — the showcase returns to the founder's plan. */
  resetLabel?: string;
  className?: string;
  headerRight?: React.ReactNode;
}

/**
 * The venture's launch cadence: idea → cash flowing, as one horizontal track
 * the founder can pan, zoom, and argue with.
 */
export function VentureTimeline({
  timeline: rawTimeline,
  scenario: rawScenario,
  metrics,
  onSaveScenario,
  onOpenAsset,
  onAsk,
  readOnly,
  selectedStepId,
  onSelectStep,
  scenarioOverride,
  onScenarioChange,
  resetLabel,
  className,
  headerRight,
}: VentureTimelineProps) {
  const isMobile = useIsMobile();
  const timeline: VentureTimeline = useMemo(
    () => normalizeTimeline(rawTimeline) ?? fallbackTimeline(),
    [rawTimeline],
  );
  const generated = !!normalizeTimeline(rawTimeline);

  const saved = useMemo(() => normalizeScenario(rawScenario), [rawScenario]);
  const [scenario, setScenarioState] = useState<TimelineScenario>(scenarioOverride ?? saved);
  const [localSelected, setLocalSelected] = useState<string | null>(null);
  const [compare, setCompare] = useState(true);

  const controlledSelection = selectedStepId !== undefined;
  const selected = controlledSelection ? selectedStepId ?? null : localSelected;
  const setSelected = (next: string | null) => {
    if (!controlledSelection) setLocalSelected(next);
    onSelectStep?.(next);
  };

  const setScenario = (next: TimelineScenario | ((s: TimelineScenario) => TimelineScenario)) => {
    setScenarioState((prev) => {
      const value = typeof next === "function" ? (next as (s: TimelineScenario) => TimelineScenario)(prev) : next;
      onScenarioChange?.(value, JSON.stringify(value) !== JSON.stringify(saved));
      return value;
    });
  };

  // A new venture (or a freshly saved scenario) resets the sliders.
  const savedKey = JSON.stringify(saved);
  const lastSaved = useRef(savedKey);
  useEffect(() => {
    if (lastSaved.current === savedKey) return;
    lastSaved.current = savedKey;
    setScenarioState(saved);
  }, [savedKey, saved]);

  // A what-if arriving from the URL wins over the saved plan, once.
  const overrideKey = scenarioOverride ? JSON.stringify(scenarioOverride) : null;
  const lastOverride = useRef<string | null>(overrideKey);
  useEffect(() => {
    if (lastOverride.current === overrideKey) return;
    lastOverride.current = overrideKey;
    if (overrideKey) setScenarioState(JSON.parse(overrideKey) as TimelineScenario);
  }, [overrideKey]);



  const baselineScenario = useMemo(
    () => ({ ...defaultScenario(), startDate: scenario.startDate }),
    [scenario.startDate],
  );

  const layout = useMemo(() => scheduleTimeline(timeline, scenario), [timeline, scenario]);
  const baseline = useMemo(
    () => scheduleTimeline(timeline, baselineScenario),
    [timeline, baselineScenario],
  );

  const fallbackRevenue = useMemo(() => revenueFromMetrics(metrics), [metrics]);
  const revenue = useMemo(
    () => projectRevenue(timeline, layout, scenario, fallbackRevenue),
    [timeline, layout, scenario, fallbackRevenue],
  );

  const dirty = JSON.stringify(scenario) !== savedKey;
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const laid = selected ? layout.byId.get(selected) : null;

  return (
    <section className={cn("theme-dark-scope rounded-3xl bg-[#0b0c10] p-4 text-white md:p-6", className)}>
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Launch cadence</p>
          <h2 className="mt-1 font-serif text-[24px] leading-tight tracking-tight md:text-[30px]">
            From the idea to cash flowing
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] text-white/50">
            {generated
              ? "Sequenced from this venture's own assets. Change what's true about your life and watch the dates move."
              : "A default cadence until this venture's own is generated. The levers still work."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isMobile && (
            <button
              type="button"
              onClick={() => setCompare((c) => !c)}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] transition-colors",
                compare
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/15 text-white/55 hover:text-white",
              )}
              title="Show the full-time plan behind your scenario"
            >
              Compare
            </button>
          )}
          {headerRight}
        </div>
      </header>

      <ScenarioBar
        scenario={scenario}
        onChange={setScenario}
        onReset={() => setScenario(saved)}
        resetLabel={resetLabel}
        dirty={dirty}
        readOnly={readOnly}
      />

      <div className="mt-4">
        <ScenarioVerdict layout={layout} baseline={baseline} scenario={scenario} revenue={revenue} />
      </div>

      <div className={cn("mt-4 grid gap-4", laid && !isMobile ? "lg:grid-cols-[1fr_340px]" : "grid-cols-1")}>
        <div className="min-w-0">
          {isMobile ? (
            <TimelineMobile
              timeline={timeline}
              layout={layout}
              scenario={scenario}
              onSelect={setSelected}
            />
          ) : (
            <TimelineCanvas
              timeline={timeline}
              layout={layout}
              ghost={compare && dirty ? baseline : null}
              scenario={scenario}
              revenue={revenue}
              selectedId={selected}
              onSelect={(id) => setSelected(selected === id ? null : id)}

              onNudge={
                readOnly
                  ? undefined
                  : (id, days) =>
                      setScenario((s) => ({
                        ...s,
                        nudges: {
                          ...(s.nudges ?? {}),
                          [id]: Math.max(0, (s.nudges?.[id] ?? 0) + days),
                        },
                      }))
              }
              reducedMotion={reducedMotion}
            />
          )}
          {!isMobile && (
            <p className="mt-2 text-[11px] text-white/35">
              Drag to pan · scroll to zoom · drag a bar to push it later · Home to fit
            </p>
          )}
        </div>

        {laid && (
          <TimelineStepPanel
            laid={laid}
            layout={layout}
            scenario={scenario}
            onClose={() => setSelected(null)}
            onOpenAsset={onOpenAsset}
            onAsk={onAsk}
            onNudge={
              readOnly
                ? undefined
                : (id, days) =>
                    setScenario((s) => ({
                      ...s,
                      nudges: { ...(s.nudges ?? {}), [id]: Math.max(0, (s.nudges?.[id] ?? 0) + days) },
                    }))
            }
          />
        )}
      </div>

      {onSaveScenario && dirty && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3">
          <Sparkle className="h-4 w-4 text-primary" />
          <p className="text-[13px] text-white/80">
            This scenario is yours — save it and everyone you share the venture with sees the same picture.
          </p>
          <button
            type="button"
            onClick={() => onSaveScenario(scenario)}
            className="ml-auto rounded-full bg-primary px-4 py-1.5 text-[13px] font-medium text-primary-foreground"
          >
            Save scenario
          </button>
        </div>
      )}
    </section>
  );
}
