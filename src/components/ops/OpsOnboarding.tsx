import { useState } from "react";
import { ArrowRight, CheckCircle2, Compass, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PANELS = [
  {
    icon: Compass,
    title: "You've got the foundation. Now you run it.",
    body: "Everything built for your startup — the offer, the brand, the site, the campaign — is done. What's left is the doing: filing, banking, sending, selling. This is that list, in order.",
  },
  {
    icon: ListChecks,
    title: "One step at a time, never a wall of tasks.",
    body: "We show you a single next step with plain instructions, what to have ready, and how long it takes. Mark it done and the next one appears. If you get stuck, say so and it goes to Adam's team.",
  },
  {
    icon: CheckCircle2,
    title: "Ninety days, four stages.",
    body: "Week 1 proves people want it. Week 2 wires the business up. Weeks 3–4 make the first money. Months 2–3 turn it into a habit. You can always switch to the full checklist or the timeline.",
  },
];

/** First-run walkthrough. Shown once per venture, then never again. */
export function OpsOnboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const panel = PANELS[i];
  const Icon = panel.icon;
  const last = i === PANELS.length - 1;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight">{panel.title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{panel.body}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={() => (last ? onDone() : setI(i + 1))}>
              {last ? "Show me my first step" : "Next"} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
            <button type="button" onClick={onDone} className="text-xs text-muted-foreground hover:text-foreground">
              Skip this
            </button>
            <div className="ml-auto flex gap-1.5">
              {PANELS.map((_, n) => (
                <span key={n} className={cn("h-1.5 w-1.5 rounded-full", n === i ? "bg-primary" : "bg-border")} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OpsOnboarding;
