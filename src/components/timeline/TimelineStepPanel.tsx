import { ArrowRight, CalendarClock, FileText, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LaidOutStep, Layout } from "@/lib/timeline-schedule";
import { formatDay } from "@/lib/timeline-schedule";
import type { TimelineScenario } from "@/lib/venture-timeline";

/** Detail for one bar: why it exists, when it's done, and what powers it. */
export function TimelineStepPanel({
  laid,
  layout,
  scenario,
  onClose,
  onOpenAsset,
  onAsk,
  onNudge,
}: {
  laid: LaidOutStep;
  layout: Layout;
  scenario: TimelineScenario;
  onClose: () => void;
  onOpenAsset?: (assetKey: string) => void;
  onAsk?: (question: string) => void;
  onNudge?: (id: string, days: number) => void;
}) {
  const { step } = laid;
  const lane = layout.activeLanes.find((l) => l.id === laid.lane);
  const deps = (step.dependsOn ?? []).map((d) => layout.byId.get(d)?.step.title).filter(Boolean);
  const unlocks = layout.steps
    .filter((s) => (s.step.dependsOn ?? []).includes(step.id))
    .map((s) => s.step.title);
  const days = Math.max(1, Math.round(laid.endDay - laid.startDay));

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-primary">{lane?.name ?? laid.lane}</p>
          <h3 className="mt-1 font-serif text-[21px] leading-tight text-white">{step.title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close step details"
          className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Fact label="Starts" value={formatDay(scenario.startDate, laid.startDay)} />
        <Fact label="Done by" value={formatDay(scenario.startDate, laid.endDay)} />
        <Fact label="Takes" value={`${days} ${days === 1 ? "day" : "days"}`} />
        <Fact
          label="Effort"
          value={`${Math.round(step.effortHours)} hrs${laid.accelerated ? " (money helping)" : ""}`}
        />
      </div>

      <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 text-[14px] leading-relaxed text-white/75">
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
        {!!laid.blockedDays && (
          <p className="flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-[13px] text-amber-200/90">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
            {Math.round(laid.blockedDays)} days of this bar fall inside time you said you're away.
          </p>
        )}
        {laid.endDay > laid.workEndDay && (
          <p className="text-[13px] text-white/50">
            Includes a {Math.round(laid.endDay - laid.workEndDay)}-day wait you can't work through.
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
        {!!unlocks.length && (
          <div>
            <Head>Unlocks</Head>
            <p className="text-white/60">{unlocks.join(" · ")}</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
        {step.assetKey && onOpenAsset && (
          <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => onOpenAsset(step.assetKey!)}>
            <FileText className="h-3.5 w-3.5" />
            Open the asset
          </Button>
        )}
        {onAsk && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-white/70 hover:text-white"
            onClick={() => onAsk(`Why is "${step.title}" scheduled where it is, and how do I do it well?`)}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Ask the second brain
          </Button>
        )}
        {onNudge && (
          <div className="ml-auto flex items-center gap-1">
            <NudgeBtn onClick={() => onNudge(step.id, -7)}>−1 wk</NudgeBtn>
            <NudgeBtn onClick={() => onNudge(step.id, 7)}>+1 wk</NudgeBtn>
          </div>
        )}
      </div>
    </aside>
  );
}

function NudgeBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-white/65 hover:border-white/35 hover:text-white"
    >
      {children}
    </button>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-white/40">{label}</div>
      <div className="mt-0.5 text-[13px] text-white/85">{value}</div>
    </div>
  );
}

function Head({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-white/40">{children}</p>;
}
