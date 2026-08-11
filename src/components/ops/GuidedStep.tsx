import { useState } from "react";
import {
  CheckCircle2, ChevronRight, Clock, HelpCircle, Link2, Loader2, Phone, Hammer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DeliveryMode, OpsNote, OpsOwnerKind, OpsStatus, OpsTask } from "@/lib/ops-runway";
import { OWNER_LABEL, estimateLabel, guidedQueue, stageOf, stepPosition } from "@/lib/ops-guided";
import { CRITICALITY, criticalityOf, criticalityTip, minutesTip, ownerTip, TIPS } from "@/lib/ops-criticality";
import { InfoTip } from "./InfoTip";
import { StepExplainer } from "./StepExplainer";
import { DeliveryPanel, type DeliveryHandlers } from "./DeliveryPanel";
import { OpsGlyph } from "./OpsGlyph";
import { OpsStageArt, OpsClearedMark } from "./OpsStageArt";
import { LEAD_META, agencySkillNote, isMilestone, leadOf, milestoneNote } from "@/lib/ops-significance";

export interface GuidedStepProps extends DeliveryHandlers {
  deliveryMode?: DeliveryMode | null;
  tasks: OpsTask[];
  notes: OpsNote[];
  canEdit: boolean;
  viewerKind: OpsOwnerKind;
  busyTaskId?: string | null;
  onStatus: (id: string, s: OpsStatus) => void;
  onNote?: (id: string, body: string) => void;
  onSnooze?: (id: string, days: number) => void;
  onOpenAsset?: (key: string) => void;
  assetTitle?: (key: string) => string | null;
  onConsult?: () => void;
  onSeeAll: () => void;
}

/**
 * One thing at a time. The whole point of guided mode: a novice never has to
 * decide what to work on, only whether they did it.
 */
export function GuidedStep(props: GuidedStepProps) {
  const { tasks, canEdit, viewerKind } = props;
  const [stuckOpen, setStuckOpen] = useState(false);
  const [stuckNote, setStuckNote] = useState("");
  const [peek, setPeek] = useState(false);
  const engaged = props.deliveryMode === "retained";

  const queue = guidedQueue(tasks, viewerKind);
  const task = queue[0];

  if (!task) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/40 p-8 text-center">
        <OpsClearedMark className="mx-auto h-20 w-20" />
        <h3 className="mt-3 text-lg font-semibold tracking-tight">Everything on the list is handled</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Nothing is waiting on you right now. Anything you put off will come back when it's due.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={props.onSeeAll}>See the full checklist</Button>
      </div>
    );
  }

  const stage = stageOf(task.phase);
  const pos = stepPosition(tasks, task);
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const est = estimateLabel(task.minutes);
  const crit = CRITICALITY[criticalityOf(task)];
  const busy = props.busyTaskId === task.id;
  const theirs = task.owner_kind !== viewerKind;
  const next3 = queue.slice(1, 4);

  const links = (task.asset_keys ?? [])
    .map((k) => ({ key: k, label: props.assetTitle?.(k) ?? null }))
    .filter((l) => !!l.label);

  const submitStuck = () => {
    if (stuckNote.trim()) props.onNote?.(task.id, stuckNote.trim());
    props.onStatus(task.id, "blocked");
    setStuckNote("");
    setStuckOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-5 sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-2 right-0 hidden w-2/5 opacity-[0.08] sm:block"
          style={{ maskImage: "linear-gradient(to left, black, transparent)", WebkitMaskImage: "linear-gradient(to left, black, transparent)" }}
        >
          <OpsStageArt phase={task.phase} />
        </div>

        <div className="relative flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span className="text-primary">{stage.when} · {stage.name}</span>
          <span>Step {pos.index} of {pos.total}</span>
          {est && (
            <InfoTip tip={minutesTip(task, est!)}>
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{est}</span>
            </InfoTip>
          )}
          <InfoTip tip={ownerTip(task, !theirs)}>
            <span>{theirs ? `${OWNER_LABEL(task.owner_kind, viewerKind)} has this` : "This one's yours"}</span>
          </InfoTip>
          {isMilestone(task) && (
            <span className="rounded-full border border-primary/50 bg-primary/10 px-2 py-0.5 text-primary">Major move</span>
          )}
          <span className={cn("rounded-full border px-2 py-0.5 normal-case tracking-normal", LEAD_META[leadOf(task)].badge)}>
            {LEAD_META[leadOf(task)].label}
          </span>
          <InfoTip tip={criticalityTip(task, tasks)} className={cn("rounded-full border px-2 py-0.5 normal-case tracking-normal", crit.badge)}>
            <span>{crit.label}</span>
          </InfoTip>
        </div>

        <div className="relative mt-3 flex items-start gap-3">
          <OpsGlyph category={task.category} plate plateClassName="h-12 w-12" className="h-6 w-6" />
          <div className="min-w-0">
            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{task.title}</h3>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{task.category}</p>
          </div>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{task.why}</p>
        {isMilestone(task) && (
          <p className="mt-2 max-w-2xl rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            {milestoneNote(task, tasks)}
            {leadOf(task) !== "founder" && (
              <> <span className="font-medium text-foreground">Where our experience saves you:</span> {agencySkillNote(task)}.</>
            )}
          </p>
        )}

        <div className="mt-3">
          <StepExplainer task={task} allTasks={tasks} />
        </div>

        {(task.needs?.length ?? 0) > 0 && (
          <p className="mt-4 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Have ready: </span>{task.needs!.join(" · ")}
          </p>
        )}

        {(task.how?.length ?? 0) > 0 && (
          <ol className="mt-5 space-y-3">
            {task.how!.map((h, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold tabular-nums text-primary">
                  {i + 1}
                </span>
                <span className="text-foreground/90">{h}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-5 rounded-xl border border-border/50 px-3 py-2.5">
          <p className="text-xs font-medium">You'll know it's done when</p>
          <p className="mt-1 text-sm text-muted-foreground">{task.done_when}</p>
        </div>

        {engaged && task.owner_kind === "agency" && (
          <DeliveryPanel
            className="mt-4" task={task} viewerKind={viewerKind} busy={busy}
            onAssign={props.onAssign} onCommittedDate={props.onCommittedDate}
            onDeliveryStatus={props.onDeliveryStatus} onWorkProduct={props.onWorkProduct}
            onReview={props.onReview}
          />
        )}


        {links.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {links.map((l) => (
              <button key={l.key} type="button" onClick={() => props.onOpenAsset?.(l.key)}
                className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              ><Link2 className="h-3 w-3" />{l.label}</button>
            ))}
          </div>
        )}

        {canEdit && (
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button size="lg" className="sm:flex-1" disabled={busy}
              onClick={() => props.onStatus(task.id, "done")}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Mark it done
            </Button>
            <Button size="lg" variant="outline" className="sm:flex-1" disabled={busy}
              onClick={() => setStuckOpen((o) => !o)}>
              <HelpCircle className="mr-2 h-4 w-4" /> I'm stuck
            </Button>
            {props.onSnooze && (
              <Button size="lg" variant="ghost" className="sm:w-auto" disabled={busy}
                onClick={() => props.onSnooze?.(task.id, 3)}>
                Not now
              </Button>
            )}
          </div>
        )}

        {stuckOpen && (
          <div className="mt-4 space-y-3 rounded-xl border border-border/50 bg-background/50 p-3">
            <p className="text-xs text-muted-foreground">
              Tell us what's in the way. It gets logged on this step so whoever picks it up has the context.
            </p>
            <textarea
              value={stuckNote} onChange={(e) => setStuckNote(e.target.value)}
              rows={3}
              placeholder="What's blocking you?"
              className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={submitStuck}>Flag it as stuck</Button>
              {props.onConsult && (
                <Button size="sm" variant="secondary" onClick={props.onConsult}>
                  <Hammer className="mr-1.5 h-3.5 w-3.5" /> Ask Adam's team
                </Button>
              )}
              <a href="tel:19292347355"
                className="inline-flex items-center gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground">
                <Phone className="h-3 w-3" /> 929-234-7355
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/30 px-4 py-3">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <InfoTip tip={TIPS.progress}><span>{doneCount} of {tasks.length} steps done</span></InfoTip>
          <span className="tabular-nums">{pct}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setPeek((p) => !p)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            {peek ? "Hide what's coming" : "Show me the next 3"}
            <ChevronRight className={cn("h-3 w-3 transition-transform", peek && "rotate-90")} />
          </button>
          <button type="button" onClick={props.onSeeAll} className="text-xs text-muted-foreground hover:text-foreground">
            See the full checklist
          </button>
        </div>
        {peek && (
          <ol className="mt-3 space-y-1.5">
            {next3.map((t, i) => (
              <li key={t.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="tabular-nums">{i + 2}.</span>
                <OpsGlyph category={t.category} className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{t.title} <span className="opacity-70">· {OWNER_LABEL(t.owner_kind, viewerKind)}</span></span>
              </li>
            ))}
            {!next3.length && <li className="text-xs text-muted-foreground">This is the last one.</li>}
          </ol>
        )}
      </div>
    </div>
  );
}

export default GuidedStep;
