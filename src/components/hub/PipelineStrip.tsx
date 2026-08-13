import { Check, Loader2, Lock, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type StageState = "done" | "running" | "waiting" | "idle";

export type PipelineStage = {
  label: string;
  detail?: string;
  state: StageState;
};

const ICONS: Record<StageState, typeof Check> = {
  done: Check,
  running: Loader2,
  waiting: Lock,
  idle: Minus,
};

/**
 * The whole build, in one line. Generation is a ladder — assets, then the
 * brand, then the website brief, then collateral and artwork — and it runs
 * itself. Showing the ladder means a founder can see which rung is moving
 * instead of watching one bar and guessing.
 */
export function PipelineStrip({ stages }: { stages: PipelineStage[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/60 p-2">
      {stages.map((stage, i) => {
        const Icon = ICONS[stage.state];
        return (
          <li key={stage.label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs",
                stage.state === "done" && "bg-primary/10 text-foreground",
                stage.state === "running" && "bg-primary/15 text-foreground",
                stage.state === "waiting" && "text-muted-foreground",
                stage.state === "idle" && "text-muted-foreground",
              )}
            >
              <Icon
                className={cn("h-3.5 w-3.5", stage.state === "running" && "animate-spin")}
                aria-hidden
              />
              <span className="font-medium">{stage.label}</span>
              {stage.detail && <span className="text-muted-foreground">{stage.detail}</span>}
            </div>
            {i < stages.length - 1 && (
              <span aria-hidden className="h-px w-4 bg-border sm:w-6" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
