import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { OPS_PHASES, progressOf, type OpsTask } from "@/lib/ops-runway";
import { activeStage, stageOf } from "@/lib/ops-guided";
import { milestoneProgress } from "@/lib/ops-significance";

/**
 * A read-only arc of the whole 90 days. Not a tool — a map, so a first-time
 * founder can see where they are and that it ends.
 */
export function OpsTimeline({ tasks, onJump }: { tasks: OpsTask[]; onJump?: (phase: number) => void }) {
  const current = activeStage(tasks);

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Four stages, ninety days. You only ever work the stage you're in — everything after it stays quiet until it's time.
      </p>

      <ol className="relative space-y-3 border-l border-border/50 pl-6">
        {OPS_PHASES.map((p) => {
          const all = tasks.filter((t) => t.phase === p.phase);
          const prog = progressOf(all);
          const ms = milestoneProgress(all);
          const stage = stageOf(p.phase);
          const done = prog.pct === 100 && prog.total > 0;
          const active = p.phase === current && !done;

          return (
            <li key={p.phase} className="relative">
              <span className={cn(
                "absolute -left-[31px] top-3 flex h-5 w-5 items-center justify-center rounded-full border bg-background",
                done ? "border-emerald-400/60 text-emerald-400"
                  : active ? "border-primary text-primary" : "border-border/60 text-muted-foreground",
              )}>
                {done ? <CheckCircle2 className="h-3.5 w-3.5" />
                  : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Circle className="h-3 w-3" />}
              </span>

              <button
                type="button"
                onClick={() => onJump?.(p.phase)}
                className={cn(
                  "w-full rounded-2xl border px-4 py-3 text-left transition-colors",
                  active ? "border-primary/50 bg-primary/5" : "border-border/50 bg-card/30 hover:bg-muted/20",
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold tracking-tight">
                    {stage.when} — {stage.name}
                    {active && <span className="ml-2 text-[11px] font-normal uppercase tracking-wide text-primary">You are here</span>}
                  </h3>
                  <span className="text-right text-[11px] tabular-nums text-muted-foreground">
                    {ms.total > 0 && <span className="block text-foreground/80">{ms.done} of {ms.total} major moves</span>}
                    {prog.done}/{prog.total} steps
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{stage.promise}</p>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted/40">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${prog.pct}%` }} />
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default OpsTimeline;
