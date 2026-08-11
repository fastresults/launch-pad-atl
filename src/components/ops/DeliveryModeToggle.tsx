import { useState } from "react";
import { Check, Hammer, Lock, Scale, Users } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { isSpecialistTask } from "@/lib/ops-investment";
import type { DeliveryMode, OpsTask } from "@/lib/ops-runway";
import { OpsStageArt } from "./OpsStageArt";

const OPTIONS: { mode: DeliveryMode; label: string; icon: typeof Hammer }[] = [
  { mode: "self", label: "I'm building it", icon: Hammer },
  { mode: "retained", label: "Startup Labs builds it", icon: Users },
];

/** What ownership would look like under a target mode, so the confirm can be honest. */
function ownerAfter(t: OpsTask, mode: DeliveryMode) {
  if (mode === "self") return "client" as const;
  if (mode === "retained") return isSpecialistTask(t) ? ("agency" as const) : t.owner_kind;
  return t.owner_kind;
}

function changeSummary(tasks: OpsTask[], mode: DeliveryMode) {
  let toAgency = 0;
  let toYou = 0;
  for (const t of tasks) {
    const next = ownerAfter(t, mode);
    if (next === t.owner_kind) continue;
    if (next === "agency") toAgency += 1;
    else toYou += 1;
  }
  return { toAgency, toYou };
}

/**
 * Global switch for who executes the runway. The per-step owner control still
 * handles one-off exceptions; this moves the whole catalog.
 *
 * `variant="band"` is the featured presentation used on the Operationalize
 * dashboard — this is the most consequential control on the page, so it reads
 * as two committed choices rather than a filter pill.
 */
export function DeliveryModeToggle({
  mode, tasks, onChange, disabled, className, variant = "pill", readOnly, onCompare,
}: {
  mode: DeliveryMode;
  tasks: OpsTask[];
  onChange: (mode: DeliveryMode) => void;
  disabled?: boolean;
  className?: string;
  variant?: "pill" | "band";
  /** Viewer can see the mode but can't change it. */
  readOnly?: boolean;
  /** Opens the side-by-side comparison; rendered inside the band when provided. */
  onCompare?: () => void;
}) {
  const [pending, setPending] = useState<DeliveryMode | null>(null);
  const summary = pending ? changeSummary(tasks, pending) : null;

  const total = tasks.length;
  const specialist = tasks.filter(isSpecialistTask).length;

  const confirm = (
    <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {pending === "retained" ? <Users className="h-4 w-4 text-primary" /> : <Hammer className="h-4 w-4 text-primary" />}
            {pending === "retained" && "Hand the specialist work to Startup Labs?"}
            {pending === "self" && "Take every step back onto your side?"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p>
                {pending === "retained" &&
                  "Adam's team picks up the specialist steps with a named owner and a committed date. You keep the approvals and the calls only you can make."}
                {pending === "self" &&
                  "Every step moves to you. Any owner names and committed dates on team-led steps get cleared."}
              </p>
              {summary && (summary.toAgency > 0 || summary.toYou > 0) ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {summary.toAgency > 0 && (
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                      <div className="text-xl font-semibold text-foreground">{summary.toAgency}</div>
                      <div className="text-xs text-muted-foreground">steps move to Startup Labs</div>
                    </div>
                  )}
                  {summary.toYou > 0 && (
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                      <div className="text-xl font-semibold text-foreground">{summary.toYou}</div>
                      <div className="text-xs text-muted-foreground">steps move back to you</div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No step changes hands right now.</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (pending) onChange(pending);
              setPending(null);
            }}
          >
            {pending === "retained" ? "Hand it to Startup Labs" : "Take it back on my side"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (variant === "band") {
    return (
      <>
        <section
          aria-label="How this gets delivered"
          className={cn(
            "relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.07] via-card/40 to-card/20 p-4 sm:p-5",
            className,
          )}
        >
          <OpsStageArt phase={2} className="pointer-events-none absolute -right-6 -top-8 h-40 w-40 opacity-[0.07]" />

          <div className="relative flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Delivery mode</p>
            <p className="text-[11px] text-muted-foreground">
              {readOnly ? "Set by Startup Labs" : "Decide once — the whole runway reshapes. Change anytime."}
            </p>
          </div>

          <div className="relative mt-3 grid gap-3 sm:grid-cols-2" role={readOnly ? undefined : "radiogroup"}>
            {OPTIONS.map(({ mode: m, label, icon: Icon }) => {
              const active = mode === m;
              const delta = changeSummary(tasks, m);
              const locked = readOnly || disabled;
              return (
                <button
                  key={m}
                  type="button"
                  role={readOnly ? undefined : "radio"}
                  aria-checked={readOnly ? undefined : active}
                  disabled={locked}
                  onClick={() => (active || locked ? undefined : setPending(m))}
                  className={cn(
                    "group relative rounded-xl border p-4 text-left transition",
                    active
                      ? "border-primary/60 bg-primary/10 ring-1 ring-primary/40"
                      : "border-border/50 bg-background/40 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background/70",
                    locked && "cursor-default opacity-70 hover:translate-y-0",
                    readOnly && !active && "hidden sm:block",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-lg border",
                      active ? "border-primary/40 bg-primary/15 text-primary" : "border-border/50 bg-muted/30 text-muted-foreground",
                    )}>
                      <Icon className="h-4 w-4" />
                    </span>
                    {active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                        {readOnly ? <Lock className="h-2.5 w-2.5" /> : <Check className="h-2.5 w-2.5" />} Active
                      </span>
                    ) : (
                      !locked && (
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground opacity-0 transition group-hover:opacity-100">
                          Switch
                        </span>
                      )
                    )}
                  </div>

                  <div className="mt-3 text-sm font-semibold tracking-tight text-foreground">{label}</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {m === "self"
                      ? `You own all ${total} steps — ${specialist} of them are specialist work.`
                      : `We own the ${specialist} specialist steps. You keep the approvals and the calls only you can make.`}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground/80">
                    {m === "retained"
                      ? "Named owner and a committed date on every team-led step."
                      : "Every step sits with you and your team."}
                  </p>

                  {!active && !locked && (delta.toAgency > 0 || delta.toYou > 0) && (
                    <p className="mt-2 text-[11px] font-medium text-primary">
                      {delta.toAgency > 0
                        ? `Switching moves ${delta.toAgency} steps to Startup Labs`
                        : `Switching moves ${delta.toYou} steps back to you`}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {onCompare && (
            <div className="relative mt-3">
              <button
                type="button"
                onClick={onCompare}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
              >
                <Scale className="h-3.5 w-3.5" /> Compare the two side by side
              </button>
            </div>
          )}
        </section>
        {confirm}
      </>
    );
  }

  return (
    <>
      <div
        role="radiogroup"
        aria-label="How this gets delivered"
        className={cn(
          "inline-flex flex-wrap items-center gap-0.5 rounded-full border border-border/50 bg-background/50 p-0.5",
          className,
        )}
      >
        {OPTIONS.map(({ mode: m, label, icon: Icon }) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            disabled={disabled}
            onClick={() => (m === mode ? undefined : setPending(m))}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] normal-case tracking-normal transition disabled:opacity-60",
              mode === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>
      {confirm}
    </>
  );
}

export default DeliveryModeToggle;
