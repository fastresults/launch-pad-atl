import { useMemo, useState } from "react";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { OPS_PHASES, categoryLabel, isOverdue, progressOf, type DeliveryMode, type OpsNote, type OpsOwnerKind, type OpsStatus, type OpsTask } from "@/lib/ops-runway";
import { OpsTaskRow } from "./OpsTaskRow";
import type { DeliveryHandlers } from "./DeliveryPanel";
import { activeStage, isSnoozed, stageOf } from "@/lib/ops-guided";
import { criticalityOf } from "@/lib/ops-criticality";
import { InfoTip } from "./InfoTip";
import { CRITICALITY } from "@/lib/ops-criticality";
import { OpsStageArt } from "./OpsStageArt";
import { OpsGlyph } from "./OpsGlyph";
import { dayAgencyNote, dayLeadSummary, dedupeReasons, groupByMilestone, isMilestone, leadOf, milestoneProgress } from "@/lib/ops-significance";

type Lens = "all" | "mine" | "theirs" | "open" | "major" | "welead" | "must" | "sell" | "stuck" | "late" | "done";


export interface OpsChecklistProps extends DeliveryHandlers {
  deliveryMode?: DeliveryMode | null;
  tasks: OpsTask[];
  notes: OpsNote[];
  startedAt?: string | null;
  canEdit: boolean;
  viewerKind: OpsOwnerKind;
  busyTaskId?: string | null;
  onStatus: (id: string, s: OpsStatus) => void;
  onOwner?: (id: string, o: OpsOwnerKind) => void;
  onNote?: (id: string, body: string) => void;
  onProof?: (id: string, url: string) => void;
  onSnooze?: (id: string, days: number) => void;
  onOpenAsset?: (key: string) => void;
  assetTitle?: (key: string) => string | null;
}

const dayLabel = (day: number) =>
  day >= 31 ? "Months 2–3" : day >= 15 ? "Days 15–30" : `Day ${day}`;

/**
 * The whole runway, grouped the way a founder thinks about it: by what the
 * week is for, not by phase numbers. Collapsed except where the work is.
 */
export function OpsChecklist(props: OpsChecklistProps) {
  const { tasks, notes, canEdit, viewerKind, startedAt } = props;
  const [lens, setLens] = useState<Lens>("open");
  const [openStages, setOpenStages] = useState<number[]>(() => [activeStage(tasks)]);

  const notesFor = useMemo(() => {
    const m = new Map<string, OpsNote[]>();
    for (const n of notes) m.set(n.task_id, [...(m.get(n.task_id) ?? []), n]);
    return m;
  }, [notes]);

  const match = (t: OpsTask, l: Lens) => {
    if (l === "mine") return t.owner_kind === viewerKind && t.status !== "done";
    if (l === "theirs") return t.owner_kind !== viewerKind && t.status !== "done";
    if (l === "open") return t.status !== "done" && !isSnoozed(t);
    if (l === "major") return isMilestone(t) && t.status !== "done";
    if (l === "welead") return leadOf(t) !== "founder" && t.status !== "done";
    if (l === "must") return criticalityOf(t) === "required_to_operate" && t.status !== "done";
    if (l === "sell") return criticalityOf(t) === "required_to_sell" && t.status !== "done";
    if (l === "stuck") return t.status === "blocked";
    if (l === "late") return isOverdue(t, startedAt) && t.status !== "done";
    if (l === "done") return t.status === "done";
    return true;
  };

  const visible = tasks.filter((t) => match(t, lens));

  const LENSES: [Lens, string][] = [
    ["open", "Still to do"],
    ["major", "Major moves"],
    ["welead", "Where we lead"],
    ["must", CRITICALITY.required_to_operate.label],
    ["sell", CRITICALITY.required_to_sell.label],
    ["mine", viewerKind === "agency" ? "On Adam's team" : "On me"],
    ["theirs", viewerKind === "agency" ? "On the founder" : "On Adam's team"],
    ["stuck", "Stuck"],
    ["late", "Past due"],
    ["done", "Done"],
    ["all", "Everything"],
  ];

  const toggle = (phase: number) =>
    setOpenStages((s) => (s.includes(phase) ? s.filter((p) => p !== phase) : [...s, phase]));

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-xs text-muted-foreground">
        The big cards are the <span className="text-foreground">major moves</span> — the ones that decide whether you launch.
        Everything indented under them is a supporting errand. Steps marked
        <span className="mx-1 rounded-full border border-primary/50 bg-primary/10 px-1.5 py-px text-primary">Adam's team leads</span>
        are where our experience does the heavy lifting.
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {LENSES.map(([l, label]) => {
          const count = tasks.filter((t) => match(t, l)).length;

          return (
            <button key={l} type="button" onClick={() => setLens(l)}
              className={cn("rounded-full border px-2.5 py-1 text-xs transition",
                lens === l ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border/50 text-muted-foreground hover:bg-muted/40")}
            >{label} <span className="tabular-nums opacity-60">{count}</span></button>
          );
        })}
      </div>

      {OPS_PHASES.map((p) => {
        const all = tasks.filter((t) => t.phase === p.phase);
        const rows = visible.filter((t) => t.phase === p.phase);
        if (!all.length) return null;
        const prog = progressOf(all);
        const ms = milestoneProgress(all);
        const stage = stageOf(p.phase);
        const expanded = openStages.includes(p.phase);
        const days = Array.from(new Set(rows.map((t) => t.day))).sort((a, b) => a - b);

        return (
          <section key={p.phase} className="overflow-hidden rounded-2xl border border-border/50 bg-card/30">
            <button type="button" onClick={() => toggle(p.phase)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/20">
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", !expanded && "-rotate-90")} />
              <OpsStageArt phase={p.phase} className="hidden h-12 w-28 shrink-0 opacity-60 sm:block" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <InfoTip tip={stage.promise}>
                    <h3 className="text-sm font-semibold tracking-tight">{stage.when} — {stage.name}</h3>
                  </InfoTip>
                  {prog.pct === 100 && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{stage.promise}</p>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted/40">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${prog.pct}%` }} />
                </div>
              </div>
              <span className="shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                {ms.total > 0 && <span className="block text-foreground/80">{ms.done} of {ms.total} major moves</span>}
                {prog.done}/{prog.total} steps
              </span>
            </button>

            {expanded && (
              <div className="space-y-4 border-t border-border/40 px-3 py-3 sm:px-4">
                {days.map((d) => {
                  const dayRows = rows.filter((t) => t.day === d);
                  const lanes = Array.from(new Set(dayRows.map((t) => categoryLabel(t.category))));
                  const oneLane = lanes.length === 1 ? lanes[0] : null;
                  const agencyNote = dayAgencyNote(dayRows);
                  const leadSummary = dayLeadSummary(dayRows);
                  // One reason per sentence per day — repeats stay quiet.
                  const reasons = dedupeReasons(dayRows, tasks);

                  return (
                  <div key={d} className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      <span className="h-px w-4 bg-border/70" />
                      <span>{dayLabel(d)}</span>
                      {oneLane && <span className="normal-case tracking-normal text-foreground/70">{oneLane}</span>}
                      <span className="h-px flex-1 bg-border/40" />
                      {leadSummary && (
                        <span className="normal-case tracking-normal text-muted-foreground/80">{leadSummary}</span>
                      )}
                    </div>
                    {agencyNote && (
                      <p className="max-w-2xl pl-6 text-xs text-muted-foreground">
                        <span className="text-foreground/80">Where our experience saves you:</span> {agencyNote}.
                      </p>
                    )}
                    {groupByMilestone(dayRows).map((g, gi) => {
                      const row = (t: OpsTask, variant: "milestone" | "supporting") => (
                        <OpsTaskRow
                          key={t.id} task={t} notes={notesFor.get(t.id) ?? []}
                          canEdit={canEdit} viewerKind={viewerKind} startedAt={startedAt}
                          busy={props.busyTaskId === t.id} variant={variant}
                          hideCategory={!!oneLane} suppressReason={!reasons.has(t.id)}
                          onStatus={props.onStatus} onOwner={props.onOwner}
                          onNote={props.onNote} onProof={props.onProof} onSnooze={props.onSnooze}
                          onOpenAsset={props.onOpenAsset} assetTitle={props.assetTitle} allTasks={tasks}
                          deliveryMode={props.deliveryMode}
                          onAssign={props.onAssign} onCommittedDate={props.onCommittedDate}
                          onDeliveryStatus={props.onDeliveryStatus} onWorkProduct={props.onWorkProduct}
                          onReview={props.onReview} onHandoff={props.onHandoff}
                        />
                      );

                      return (
                        <div key={g.milestone?.id ?? `g${gi}`} className="space-y-1.5">
                          {g.milestone && row(g.milestone, "milestone")}
                          {g.supporting.length > 0 && (
                            <div className={cn("space-y-1", g.milestone && "ml-3 border-l border-border/40 pl-3 sm:ml-4 sm:pl-4")}>
                              {g.milestone && (
                                <p className="flex items-center gap-1.5 pt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                                  <OpsGlyph category={g.milestone.category} className="h-3 w-3" />
                                  Supporting steps
                                </p>
                              )}
                              {g.supporting.map((t) => row(t, "supporting"))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  );
                })}


                {!rows.length && (
                  <p className="py-3 text-center text-xs text-muted-foreground">Nothing here under this filter.</p>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default OpsChecklist;
