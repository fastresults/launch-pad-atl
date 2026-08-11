import { useState } from "react";
import { ArrowRight, Check, Hammer, Lock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InvestmentCompare } from "./InvestmentCompare";
import type { PlatformRequestInput } from "./PlatformRequestDialog";
import type { PlatformRequest } from "@/lib/ops-platform";
import { computeInvestment, DEFAULT_RATE, RETAINER_MONTHLY, RETAINER_MONTHS, money } from "@/lib/ops-investment";
import type { DeliveryMode, OpsTask } from "@/lib/ops-runway";

/**
 * The runway stays visible but locked until the founder decides who is doing
 * the work. There is no dismiss: the only ways out are "I'm building it" (free,
 * unlocks immediately) or committing to the retainer via the kickoff call.
 */
export function DeliveryGateOverlay({
  tasks, onSelf, onRetain, busy, readOnly, engageHref, rateCents, onRate,
  platformRequest, onPlatformRequest, className,
}: {
  tasks: OpsTask[];
  onSelf: () => void;
  onRetain: () => void;
  busy?: boolean;
  /** Viewer can't write state — the paid path routes to the public page. */
  readOnly?: boolean;
  engageHref?: string;
  rateCents?: number | null;
  onRate?: (cents: number) => void;
  platformRequest?: PlatformRequest | null;
  onPlatformRequest?: (input: PlatformRequestInput) => Promise<void>;
  className?: string;
}) {
  const [compare, setCompare] = useState(false);
  const inv = computeInvestment(tasks, rateCents || DEFAULT_RATE);

  const choose = (mode: DeliveryMode) => (mode === "self" ? onSelf() : onRetain());

  if (compare) {
    return (
      <div className={cn("space-y-4", className)}>
        <InvestmentCompare
          tasks={tasks}
          onChoose={choose}
          busy={busy}
          currentMode={null}
          rateCents={rateCents}
          onRate={onRate}
          platformRequest={platformRequest}
          onPlatformRequest={onPlatformRequest}
          engageHref={engageHref}
        />
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => setCompare(false)}>
            Back to the decision
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl rounded-3xl border border-primary/25 bg-card/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
        <Lock className="h-3.5 w-3.5" /> One decision unlocks your runway
      </div>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        Who is going to actually do this work?
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Your foundation is built and yours. There are {inv.taskCount} steps between it and a startup that
        runs — {inv.specialistCount} of them are specialist work. Pick a path and the whole runway
        reshapes around it. You can change it later.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          disabled={busy || readOnly}
          onClick={() => onSelf()}
          className="group flex flex-col rounded-2xl border border-border/60 bg-background/60 p-5 text-left transition hover:border-primary/50 disabled:opacity-60"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground">
            <Hammer className="h-4 w-4" />
          </span>
          <span className="mt-3 text-base font-semibold">I'm building it</span>
          <span className="mt-1 text-sm text-muted-foreground">
            You own all {inv.taskCount} steps, with the guide walking you through each one. Free — unlocks now.
          </span>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            Unlock my runway <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => onRetain()}
          className="group relative flex flex-col rounded-2xl border border-primary/50 bg-primary/[0.07] p-5 text-left transition hover:border-primary disabled:opacity-60"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Users className="h-4 w-4" />
          </span>
          <span className="mt-3 text-base font-semibold">Startup Labs builds it</span>
          <span className="mt-1 text-sm text-muted-foreground">
            We own the {inv.specialistCount} specialist steps. {money(RETAINER_MONTHLY)}/month ·{" "}
            {RETAINER_MONTHS}-month term.
          </span>
          <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Check className="h-3 w-3 text-primary" /> No payment today — the kickoff call comes first.
          </span>
          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            Book the kickoff call <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
        <button
          type="button"
          onClick={() => setCompare(true)}
          className="text-sm text-primary underline underline-offset-4"
        >
          Compare the two side by side
        </button>
        {engageHref && (
          <a href={engageHref} className="text-xs text-muted-foreground hover:text-foreground">
            See the full retainer terms
          </a>
        )}
      </div>
    </div>
  );
}

export default DeliveryGateOverlay;
