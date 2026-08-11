import { useState } from "react";
import { CheckCircle2, Circle, Clock, Loader2, Link2, MessageSquare, AlertTriangle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  OPS_CATEGORY_DOT, STATUS_CLASS, dueForDay, isOverdue,
  type OpsNote, type OpsOwnerKind, type OpsStatus, type OpsTask,
} from "@/lib/ops-runway";
import { OWNER_LABEL, estimateLabel, isSnoozed } from "@/lib/ops-guided";
import { CRITICALITY, categoryTip, criticalityOf, criticalityTip, minutesTip, ownerTip, statusTip, TIPS } from "@/lib/ops-criticality";
import { InfoTip } from "./InfoTip";
import { StepExplainer } from "./StepExplainer";
import { LEAD_META, agencySkillNote, isMilestone, leadOf, milestoneNote } from "@/lib/ops-significance";


/** Plain-language status names. No underscores, no project-management dialect. */
export const PLAIN_STATUS: Record<OpsStatus, string> = {
  todo: "Not started",
  in_progress: "Working on it",
  waiting_client: "Waiting on the founder",
  blocked: "Stuck",
  done: "Done",
};

export interface TaskRowProps {
  task: OpsTask;
  notes: OpsNote[];
  canEdit: boolean;
  viewerKind: OpsOwnerKind;
  startedAt?: string | null;
  busy: boolean;
  onStatus: (id: string, s: OpsStatus) => void;
  onOwner?: (id: string, o: OpsOwnerKind) => void;
  onNote?: (id: string, body: string) => void;
  onProof?: (id: string, url: string) => void;
  onSnooze?: (id: string, days: number) => void;
  onOpenAsset?: (key: string) => void;
  assetTitle?: (key: string) => string | null;
  /** Full task list, so the explainer can name what this step unlocks. */
  allTasks?: OpsTask[];
  /** "milestone" renders the big-move treatment; "supporting" the quiet one. */
  variant?: "milestone" | "supporting" | "auto";
}


/** One step in the checklist: a real checkbox, plain words, detail on demand. */
export function OpsTaskRow(props: TaskRowProps) {
  const { task, notes, canEdit, viewerKind, startedAt, busy } = props;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const overdue = isOverdue(task, startedAt);
  const due = task.due_at ? new Date(task.due_at) : dueForDay(startedAt, task.day);
  const snoozed = isSnoozed(task);
  const done = task.status === "done";
  const est = estimateLabel(task.minutes);
  const crit = CRITICALITY[criticalityOf(task)];
  const major = props.variant === "milestone" || (props.variant !== "supporting" && isMilestone(task));
  const lead = leadOf(task);
  const leadMeta = LEAD_META[lead];

  const links = (task.asset_keys ?? [])
    .map((k) => ({ key: k, label: props.assetTitle?.(k) ?? null }))
    .filter((l) => !!l.label);

  return (
    <div className={cn(
      "rounded-xl border transition-colors",
      major
        ? "border-border/70 bg-card/70 px-3.5 py-3 shadow-sm ring-1 ring-primary/10 sm:px-4"
        : "border-border/40 bg-card/25 px-3 py-2",
      done && "opacity-60",
      snoozed && "opacity-60",
      overdue && !done && "border-destructive/40",
    )}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => canEdit && props.onStatus(task.id, done ? "todo" : "done")}
          disabled={!canEdit || busy}
          aria-label={done ? "Mark as not done" : "Mark as done"}
          className={cn(
            "mt-0.5 shrink-0 rounded-full border p-1 transition",
            done ? "border-emerald-400/50 text-emerald-400" : "border-border/60 text-muted-foreground",
            canEdit ? "hover:bg-muted/40" : "cursor-default",
          )}
        >
          {busy
            ? <Loader2 className={cn("animate-spin", major ? "h-4.5 w-4.5" : "h-3.5 w-3.5")} />
            : done ? <CheckCircle2 className={cn(major ? "h-4.5 w-4.5" : "h-3.5 w-3.5")} />
            : task.status === "blocked" ? <AlertTriangle className={cn("text-destructive", major ? "h-4.5 w-4.5" : "h-3.5 w-3.5")} />
            : <Circle className={cn(major ? "h-4.5 w-4.5" : "h-3.5 w-3.5")} />}
        </button>

        <div className="min-w-0 flex-1">
          {major && (
            <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              <span>Major move</span>
              <span className={cn("rounded-full border px-1.5 py-px text-[10px] font-medium normal-case tracking-normal", leadMeta.badge)}>
                {leadMeta.label}
              </span>
            </div>
          )}
          <button type="button" onClick={() => setOpen((o) => !o)} className="block w-full text-left">
            <span className={cn(
              major ? "text-[15px] font-semibold tracking-tight" : "text-[13px] font-medium text-foreground/90",
              done && "line-through",
            )}>{task.title}</span>
          </button>
          {major && (
            <p className="mt-1 text-xs text-muted-foreground">
              {milestoneNote(task, props.allTasks ?? [task])}
              {lead !== "founder" && <> <span className="text-foreground/80">Where our experience saves you:</span> {agencySkillNote(task)}.</>}
            </p>
          )}



          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <InfoTip tip={categoryTip(task)}>
              <span className="inline-flex items-center gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", OPS_CATEGORY_DOT[task.category] ?? "bg-muted")} />
                {task.category}
              </span>
            </InfoTip>
            <InfoTip tip={criticalityTip(task, props.allTasks ?? [task])} className={cn("rounded-full border px-1.5 py-px", crit.badge)}>
              <span>{crit.short}</span>
            </InfoTip>
            <InfoTip tip={ownerTip(task, task.owner_kind === viewerKind)}>
              <span>{OWNER_LABEL(task.owner_kind, viewerKind)}</span>
            </InfoTip>
            {!done && task.status !== "todo" && (
              <InfoTip tip={statusTip(task, PLAIN_STATUS[task.status])} className={cn("rounded-full border px-1.5 py-px", STATUS_CLASS[task.status])}>
                <span>{PLAIN_STATUS[task.status]}</span>
              </InfoTip>
            )}
            {snoozed && <InfoTip tip={`"${task.title}" is put off for now. ${TIPS.snoozed}`}><span>Put off for now</span></InfoTip>}
            {est && <InfoTip tip={minutesTip(task, est)}><span>{est}</span></InfoTip>}
            {due && !done && (
              <span className={cn("inline-flex items-center gap-1", overdue && "text-destructive")}>
                <Clock className="h-3 w-3" />
                {due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            )}
            {notes.length > 0 && (
              <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" />{notes.length}</span>
            )}
          </div>

          {open && (
            <div className="mt-3 space-y-3 border-t border-border/40 pt-3 text-sm">
              <p className="text-muted-foreground">{task.why}</p>
              <StepExplainer task={task} allTasks={props.allTasks ?? [task]} />

              {(task.how?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-medium">How to do it</p>
                  <ol className="mt-1.5 space-y-1.5">
                    {task.how!.map((h, i) => (
                      <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                        <span className="tabular-nums text-foreground/70">{i + 1}.</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {(task.needs?.length ?? 0) > 0 && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Have ready: </span>
                  {task.needs!.join(" · ")}
                </p>
              )}

              <p className="text-xs">
                <span className="font-medium text-foreground">You'll know it's done when: </span>
                <span className="text-muted-foreground">{task.done_when}</span>
              </p>

              {canEdit && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button size="sm" variant={done ? "secondary" : "default"}
                    onClick={() => props.onStatus(task.id, done ? "todo" : "done")}>
                    {done ? "Mark as not done" : "Mark it done"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => props.onStatus(task.id, "in_progress")}>Working on it</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => props.onStatus(task.id, "waiting_client")}>Waiting on the founder</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => props.onStatus(task.id, "blocked")}>I'm stuck</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => props.onStatus(task.id, "todo")}>Back to not started</DropdownMenuItem>
                      {props.onSnooze && (
                        <DropdownMenuItem onClick={() => props.onSnooze?.(task.id, 3)}>Not now — remind me in 3 days</DropdownMenuItem>
                      )}
                      {props.onOwner && (
                        <DropdownMenuItem
                          onClick={() => props.onOwner?.(task.id, task.owner_kind === "agency" ? "client" : "agency")}
                        >
                          Hand to {task.owner_kind === "agency" ? "the founder" : "Adam's team"}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {links.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {links.map((l) => (
                    <button
                      key={l.key} type="button" onClick={() => props.onOpenAsset?.(l.key)}
                      className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted/40"
                    ><Link2 className="h-3 w-3" />{l.label}</button>
                  ))}
                </div>
              )}

              {task.proof_url && (
                <a href={task.proof_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary underline-offset-2 hover:underline">
                  <Link2 className="h-3 w-3" /> Proof on file
                </a>
              )}

              {canEdit && props.onProof && (
                <input
                  type="url"
                  placeholder="Add a link as proof — a receipt, a screenshot, a dashboard"
                  defaultValue={task.proof_url ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (task.proof_url ?? "")) props.onProof?.(task.id, v);
                  }}
                  className="w-full rounded-lg border border-border/50 bg-background/60 px-2.5 py-1.5 text-xs outline-none focus:border-primary/50"
                />
              )}

              {notes.length > 0 && (
                <ul className="space-y-1.5">
                  {notes.map((n) => (
                    <li key={n.id} className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-xs">
                      <span className="font-medium">{n.author_name || (n.author_kind === "agency" ? "Adam's team" : "Founder")}</span>
                      <span className="text-muted-foreground"> · {new Date(n.created_at).toLocaleDateString()}</span>
                      <p className="mt-0.5 whitespace-pre-wrap text-muted-foreground">{n.body}</p>
                    </li>
                  ))}
                </ul>
              )}

              {canEdit && props.onNote && (
                <div className="flex gap-2">
                  <input
                    value={draft} onChange={(e) => setDraft(e.target.value)}
                    placeholder="Leave a note for whoever picks this up…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && draft.trim()) { props.onNote?.(task.id, draft.trim()); setDraft(""); }
                    }}
                    className="flex-1 rounded-lg border border-border/50 bg-background/60 px-2.5 py-1.5 text-xs outline-none focus:border-primary/50"
                  />
                  <Button size="sm" variant="secondary" disabled={!draft.trim()}
                    onClick={() => { props.onNote?.(task.id, draft.trim()); setDraft(""); }}>Post</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OpsTaskRow;
