import { Fragment } from "react";
import { CalendarDays, RotateCcw, Users, Wallet } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BUDGET_LABELS,
  SCENARIO_PRESETS,
  type TimelineScenario,
} from "@/lib/venture-timeline";

/**
 * The levers. Chosen for the people this product is actually for: someone still
 * in a job, a couple building together, a trades operator with a busy season.
 */
export function ScenarioBar({
  scenario,
  onChange,
  onReset,
  resetLabel,
  dirty,
  readOnly,
}: {
  scenario: TimelineScenario;
  onChange: (next: TimelineScenario) => void;
  onReset: () => void;
  /** Public showcases return to the founder's plan, not to a blank default. */
  resetLabel?: string;
  dirty: boolean;
  readOnly?: boolean;
}) {

  const set = (patch: Partial<TimelineScenario>) => onChange({ ...scenario, ...patch });
  const setLane = (id: string, patch: Partial<TimelineScenario["lanes"][number]>) =>
    set({ lanes: scenario.lanes.map((l) => (l.id === id ? { ...l, ...patch } : l)) });

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] uppercase tracking-[0.18em] text-white/45">What if</span>
        {SCENARIO_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.blurb}
            onClick={() => onChange(p.apply(scenario))}
            className={cn(
              "rounded-full border px-3 py-1 text-[12px] transition-colors",
              scenario.label === p.label
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-white/15 text-white/65 hover:border-white/30 hover:text-white",
            )}
          >
            {p.label}
          </button>
        ))}
        {dirty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="ml-auto h-7 gap-1.5 text-[12px] text-white/60 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {resetLabel ?? "Reset"}

          </Button>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        {/* team + hours */}
        <div>
          <Label icon={<Users className="h-3.5 w-3.5" />}>Who's building this, and for how long each week</Label>
          <div className="mt-3 space-y-3">
            {scenario.lanes.map((lane) => (
              <div key={lane.id} className="flex items-center gap-3">
                <Switch
                  checked={lane.enabled}
                  disabled={readOnly}
                  onCheckedChange={(v) => setLane(lane.id, { enabled: v })}
                  aria-label={`Include ${lane.name}`}
                />
                <Input
                  value={lane.name}
                  disabled={readOnly}
                  onChange={(e) => setLane(lane.id, { name: e.target.value.slice(0, 24) })}
                  className="h-8 w-28 shrink-0 border-white/15 bg-white/5 text-[13px] text-white"
                  aria-label={`Name for the ${lane.role} seat`}
                />
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Slider
                    value={[lane.hoursPerWeek]}
                    min={2}
                    max={60}
                    step={1}
                    disabled={readOnly || !lane.enabled}
                    onValueChange={([v]) => setLane(lane.id, { hoursPerWeek: v })}
                    className={cn("flex-1", !lane.enabled && "opacity-35")}
                    aria-label={`${lane.name} hours per week`}
                  />
                  <span
                    className={cn(
                      "w-16 shrink-0 text-right text-[12px] tabular-nums",
                      lane.enabled ? "text-white/80" : "text-white/30",
                    )}
                  >
                    {lane.enabled ? `${lane.hoursPerWeek} hrs` : "not on it"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* start, budget, freedom line */}
        <div className="space-y-4">
          <div>
            <Label icon={<CalendarDays className="h-3.5 w-3.5" />}>Start date</Label>
            <Input
              type="date"
              value={scenario.startDate}
              disabled={readOnly}
              onChange={(e) => set({ startDate: e.target.value })}
              className="mt-2 h-8 w-full border-white/15 bg-white/5 text-[13px] text-white"
            />
          </div>

          <div>
            <Label icon={<Wallet className="h-3.5 w-3.5" />}>
              Budget — {BUDGET_LABELS[scenario.budgetLevel]}
            </Label>
            <Slider
              value={[scenario.budgetLevel]}
              min={0}
              max={3}
              step={1}
              disabled={readOnly}
              onValueChange={([v]) => set({ budgetLevel: v as 0 | 1 | 2 | 3 })}
              className="mt-3"
              aria-label="Budget level"
            />
            <p className="mt-1.5 text-[11px] leading-snug text-white/40">
              Money buys speed on the build. It cannot buy customer conversations or a filing queue.
            </p>
          </div>

          <div>
            <Label>Income I need to quit my job</Label>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-white/50">$</span>
              <Input
                inputMode="numeric"
                placeholder="4,000"
                value={scenario.freedomLineMonthly ? String(scenario.freedomLineMonthly) : ""}
                disabled={readOnly}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[^\d]/g, ""));
                  set({ freedomLineMonthly: n > 0 ? n : null });
                }}
                className="h-8 w-32 border-white/15 bg-white/5 text-[13px] text-white"
              />
              <span className="text-[12px] text-white/45">per month</span>
            </div>
          </div>
        </div>
      </div>

      {!!scenario.blackouts.length && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
          <span className="text-[11px] uppercase tracking-[0.16em] text-white/40">Away</span>
          {scenario.blackouts.map((b, i) => (
            <Fragment key={`${b.label}-${i}`}>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => set({ blackouts: scenario.blackouts.filter((_, n) => n !== i) })}
                className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-white/65 hover:border-white/35 hover:text-white"
                title="Remove"
              >
                {b.label} · day {b.startDay}–{b.endDay} ×
              </button>
            </Fragment>
          ))}
        </div>
      )}
      {!readOnly && (
        <button
          type="button"
          onClick={() =>
            set({
              blackouts: [
                ...scenario.blackouts,
                { startDay: 30, endDay: 44, label: `Away ${scenario.blackouts.length + 1}` },
              ],
            })
          }
          className="mt-3 text-[12px] text-white/45 underline-offset-4 hover:text-white hover:underline"
        >
          + Add two weeks I can't work
        </button>
      )}
    </div>
  );
}

function Label({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-white/45">
      {icon}
      {children}
    </div>
  );
}
