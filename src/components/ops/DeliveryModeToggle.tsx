import { useState } from "react";
import { Hammer, Split, Users } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { isSpecialistTask } from "@/lib/ops-investment";
import type { DeliveryMode, OpsTask } from "@/lib/ops-runway";

const OPTIONS: { mode: DeliveryMode; label: string; icon: typeof Hammer }[] = [
  { mode: "self", label: "I'm building it", icon: Hammer },
  { mode: "mixed", label: "Split", icon: Split },
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
 */
export function DeliveryModeToggle({
  mode, tasks, onChange, disabled, className,
}: {
  mode: DeliveryMode;
  tasks: OpsTask[];
  onChange: (mode: DeliveryMode) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [pending, setPending] = useState<DeliveryMode | null>(null);
  const summary = pending ? changeSummary(tasks, pending) : null;

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

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending === "retained" && "Hand the specialist work to Startup Labs?"}
              {pending === "self" && "Take every step back onto your side?"}
              {pending === "mixed" && "Split it step by step?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  {pending === "retained" &&
                    "Adam's team picks up the specialist steps with a named owner and a committed date. You keep the approvals and the calls only you can make."}
                  {pending === "self" &&
                    "Every step moves to you. Any owner names and committed dates on team-led steps get cleared."}
                  {pending === "mixed" &&
                    "Ownership stays exactly as it is now — you reassign one step at a time from each row."}
                </p>
                {summary && (summary.toAgency > 0 || summary.toYou > 0) && (
                  <p className="text-muted-foreground">
                    {summary.toAgency > 0 && <>{summary.toAgency} steps move to Startup Labs. </>}
                    {summary.toYou > 0 && <>{summary.toYou} steps move back to you.</>}
                  </p>
                )}
                {summary && summary.toAgency === 0 && summary.toYou === 0 && (
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
              Switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default DeliveryModeToggle;
