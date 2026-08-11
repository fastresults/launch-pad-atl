import { Clock, HelpCircle, ListChecks, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { categoryLabel, type OpsTask } from "@/lib/ops-runway";
import { estimateLabel } from "@/lib/ops-guided";
import { CRITICALITY, categoryTip, criticalityOf, criticalityTip, unlockedBy } from "@/lib/ops-criticality";

/**
 * The "why this matters" panel. Every step has one — no exceptions — so a
 * first-time founder always has something to click when they don't understand
 * what they're being asked to do or why it can't wait.
 */
export function StepExplainer({
  task,
  allTasks,
  trigger,
}: {
  task: OpsTask;
  allTasks: OpsTask[];
  trigger?: React.ReactNode;
}) {
  const crit = CRITICALITY[criticalityOf(task)];
  const est = estimateLabel(task.minutes);
  const unlocks = unlockedBy(task, allTasks);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <HelpCircle className="h-3.5 w-3.5" /> Why this matters
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className={cn("rounded-full border px-2 py-0.5 font-medium", crit.badge)}>
              {crit.label}
            </span>
            <span className="text-muted-foreground">{categoryLabel(task.category)}</span>
            {est && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" /> {est}
              </span>
            )}
          </div>
          <DialogTitle className="mt-2 text-left text-lg leading-snug">{task.title}</DialogTitle>
          <DialogDescription className="text-left">{task.why}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <section>
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> How critical is it
            </h4>
            <p className="mt-1.5 text-muted-foreground">{criticalityTip(task, allTasks)}</p>
            <p className="mt-2 text-muted-foreground">{categoryTip(task)}</p>
          </section>

          {(task.needs?.length ?? 0) > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                What goes into it
              </h4>
              <ul className="mt-1.5 space-y-1">
                {task.needs!.map((n) => (
                  <li key={n} className="flex gap-2 text-muted-foreground">
                    <span className="text-foreground/50">·</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(task.how?.length ?? 0) > 0 && (
            <section>
              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <ListChecks className="h-3.5 w-3.5" /> How to do it
              </h4>
              <ol className="mt-1.5 space-y-2">
                {task.how!.map((h, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold tabular-nums text-primary">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{h}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="rounded-xl border border-border/50 px-3 py-2.5">
            <p className="text-xs font-medium">You'll know it's done when</p>
            <p className="mt-1 text-muted-foreground">{task.done_when}</p>
          </section>

          {unlocks.length > 0 && (
            <section>
              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> Skip it and these stall
              </h4>
              <ul className="mt-1.5 space-y-1">
                {unlocks.map((u) => (
                  <li key={u.id} className="flex gap-2 text-muted-foreground">
                    <span className="text-foreground/50">·</span>
                    <span>{u.title}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-xs text-muted-foreground">
            Still unsure? Flag it as stuck on the step and Adam's team picks it up with your note attached.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default StepExplainer;
