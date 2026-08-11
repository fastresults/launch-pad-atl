import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Clock, Loader2, Link2, MessageSquare, AlertTriangle, Hammer, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  OPS_PHASES, OPS_CATEGORY_DOT, STATUS_CLASS, STATUS_LABEL, STATUS_ORDER,
  currentRunwayDay, dueForDay, isOverdue, nextFive, progressOf,
  type OpsNote, type OpsOwnerKind, type OpsStatus, type OpsTask,
} from "@/lib/ops-runway";

type Filter = "all" | "mine" | "agency" | "blocked" | "overdue" | "open" | "creative" | "growth";

export interface OpsDashboardProps {
  tasks: OpsTask[];
  notes: OpsNote[];
  startedAt?: string | null;
  canEdit: boolean;
  viewerKind: OpsOwnerKind;
  busyTaskId?: string | null;
  onStatus: (taskId: string, status: OpsStatus) => void;
  onOwner?: (taskId: string, owner: OpsOwnerKind) => void;
  onNote?: (taskId: string, body: string) => void;
  onProof?: (taskId: string, url: string) => void;
  /** Jump the reading pane to a showcase asset, when one exists for this key. */
  onOpenAsset?: (assetKey: string) => void;
  assetTitle?: (assetKey: string) => string | null;
  onConsult?: () => void;
  className?: string;
}

const statusIcon = (s: OpsStatus) =>
  s === "done" ? CheckCircle2 : s === "blocked" ? AlertTriangle : s === "in_progress" ? Loader2 : Circle;

function Bar({ pct, className }: { pct: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted/40", className)}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function TaskRow(props: {
  task: OpsTask; notes: OpsNote[]; canEdit: boolean; viewerKind: OpsOwnerKind;
  startedAt?: string | null; busy: boolean;
  onStatus: OpsDashboardProps["onStatus"]; onOwner?: OpsDashboardProps["onOwner"];
  onNote?: OpsDashboardProps["onNote"]; onProof?: OpsDashboardProps["onProof"];
  onOpenAsset?: OpsDashboardProps["onOpenAsset"]; assetTitle?: OpsDashboardProps["assetTitle"];
}) {
  const { task, notes, canEdit, startedAt, busy } = props;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const Icon = statusIcon(task.status);
  const overdue = isOverdue(task, startedAt);
  const due = task.due_at ? new Date(task.due_at) : dueForDay(startedAt, task.day);

  const cycle = () => {
    if (!canEdit) return;
    const i = STATUS_ORDER.indexOf(task.status);
    props.onStatus(task.id, STATUS_ORDER[(i + 1) % STATUS_ORDER.length]);
  };

  const links = (task.asset_keys ?? [])
    .map((k) => ({ key: k, label: props.assetTitle?.(k) ?? null }))
    .filter((l) => !!l.label);

  return (
    <div className={cn(
      "rounded-xl border border-border/50 bg-card/40 px-3 py-2.5 transition-colors",
      task.status === "done" && "opacity-70",
      overdue && "border-destructive/40",
    )}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={cycle}
          disabled={!canEdit || busy}
          aria-label={`Status: ${STATUS_LABEL[task.status]}. Click to advance.`}
          className={cn("mt-0.5 shrink-0 rounded-full border p-1 transition", STATUS_CLASS[task.status],
            canEdit ? "hover:bg-muted/40" : "cursor-default")}
        >
          {busy
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Icon className={cn("h-3.5 w-3.5", task.status === "in_progress" && "animate-none")} />}
        </button>

        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => setOpen((o) => !o)} className="block w-full text-left">
            <span className={cn("text-sm font-medium", task.status === "done" && "line-through")}>
              {task.title}
            </span>
            <span className="ml-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              Day {task.day}
            </span>
          </button>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", OPS_CATEGORY_DOT[task.category] ?? "bg-muted")} />
              {task.category}
            </span>
            <span className={cn("rounded-full border px-1.5 py-px", STATUS_CLASS[task.status])}>
              {STATUS_LABEL[task.status]}
            </span>
            <span>{task.owner_kind === "agency" ? "Agency" : "Founder"}{task.owner_name ? ` · ${task.owner_name}` : ""}</span>
            {due && (
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
              <p className="text-xs">
                <span className="font-medium text-foreground">Done means: </span>
                <span className="text-muted-foreground">{task.done_when}</span>
              </p>

              {canEdit && (
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_ORDER.map((s) => (
                    <button
                      key={s} type="button" onClick={() => props.onStatus(task.id, s)}
                      className={cn("rounded-full border px-2 py-0.5 text-[11px] transition",
                        s === task.status ? STATUS_CLASS[s] : "border-border/50 text-muted-foreground hover:bg-muted/40")}
                    >{STATUS_LABEL[s]}</button>
                  ))}
                  {props.onOwner && (
                    <button
                      type="button"
                      onClick={() => props.onOwner?.(task.id, task.owner_kind === "agency" ? "client" : "agency")}
                      className="rounded-full border border-border/50 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted/40"
                    >Hand to {task.owner_kind === "agency" ? "founder" : "agency"}</button>
                  )}
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
                  type="url" placeholder="Link the proof (filing receipt, signed MSA, dashboard)…"
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
                      <span className="font-medium">{n.author_name || (n.author_kind === "agency" ? "Agency" : "Founder")}</span>
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
                    placeholder="Add a note…"
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

/**
 * The operating runway both the founder (share link) and the agency (hub)
 * work out of. Identical UI in both places — only the permissions differ.
 */
export function OpsDashboard(props: OpsDashboardProps) {
  const { tasks, notes, startedAt, canEdit, viewerKind } = props;
  const [filter, setFilter] = useState<Filter>("all");
  const [phase, setPhase] = useState<number | "all">("all");

  const notesFor = useMemo(() => {
    const map = new Map<string, OpsNote[]>();
    for (const n of notes) map.set(n.task_id, [...(map.get(n.task_id) ?? []), n]);
    return map;
  }, [notes]);

  const overall = progressOf(tasks);
  const day = currentRunwayDay(startedAt);
  const blocked = tasks.filter((t) => t.status === "blocked").length;
  const waiting = tasks.filter((t) => t.status === "waiting_client").length;
  const overdueCount = tasks.filter((t) => isOverdue(t, startedAt)).length;

  const visible = tasks.filter((t) => {
    if (phase !== "all" && t.phase !== phase) return false;
    if (filter === "mine") return t.owner_kind === viewerKind;
    if (filter === "agency") return t.owner_kind === "agency";
    if (filter === "blocked") return t.status === "blocked";
    if (filter === "overdue") return isOverdue(t, startedAt);
    if (filter === "open") return t.status !== "done";
    if (filter === "creative") return t.category === "Creative" || t.category === "Brand";
    if (filter === "growth") return t.category === "Marketing" || t.category === "Strategy" || t.category === "Social & Content";
    return true;
  });

  const byPhase = OPS_PHASES.map((p) => ({
    ...p,
    all: tasks.filter((t) => t.phase === p.phase),
    rows: visible.filter((t) => t.phase === p.phase),
  }));

  const FILTERS: [Filter, string][] = [
    ["all", "All"], ["open", "Open"], ["mine", viewerKind === "agency" ? "Agency" : "Mine"],
    ["creative", "Creative"], ["growth", "Sales & funnel"],
    ["blocked", "Blocked"], ["overdue", "Overdue"],
  ];


  return (
    <div className={cn("space-y-6", props.className)}>
      <header className="rounded-2xl border border-border/50 bg-card/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Operating runway</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              The foundation is built. This is the work that turns it into a running business —
              the same 14-day cadence, carried through the first 90 days.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold tabular-nums">{overall.pct}%</div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {overall.done}/{overall.total} complete{day ? ` · day ${day}` : ""}
            </div>
          </div>
        </div>

        <Bar pct={overall.pct} className="mt-4" />

        <div className="mt-3 flex flex-wrap gap-4 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span>{blocked} blocked</span>
          <span>{waiting} waiting on client</span>
          <span className={cn(overdueCount > 0 && "text-destructive")}>{overdueCount} overdue</span>
          {!canEdit && <span>Read-only view</span>}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map(([f, label]) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={cn("rounded-full border px-2.5 py-1 text-xs transition",
              filter === f ? "border-primary/60 bg-primary/10 text-foreground" : "border-border/50 text-muted-foreground hover:bg-muted/40")}
          >{label}</button>
        ))}
        <span className="mx-1 h-4 w-px bg-border/60" />
        <button type="button" onClick={() => setPhase("all")}
          className={cn("rounded-full border px-2.5 py-1 text-xs transition",
            phase === "all" ? "border-primary/60 bg-primary/10 text-foreground" : "border-border/50 text-muted-foreground hover:bg-muted/40")}
        >All phases</button>
        {OPS_PHASES.map((p) => (
          <button key={p.phase} type="button" onClick={() => setPhase(p.phase)}
            className={cn("rounded-full border px-2.5 py-1 text-xs transition",
              phase === p.phase ? "border-primary/60 bg-primary/10 text-foreground" : "border-border/50 text-muted-foreground hover:bg-muted/40")}
          >{p.label}</button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-6">
          {byPhase.map((p) => {
            if (!p.rows.length) return null;
            const prog = progressOf(p.all);
            const days = Array.from(new Set(p.rows.map((t) => t.day))).sort((a, b) => a - b);
            return (
              <section key={p.phase} className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight">
                      Phase {p.phase} · {p.label}
                      <span className="ml-2 text-[11px] font-normal uppercase tracking-wide text-muted-foreground">{p.range}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">{p.blurb}</p>
                  </div>
                  <span className="text-[11px] tabular-nums text-muted-foreground">{prog.done}/{prog.total}</span>
                </div>
                <Bar pct={prog.pct} />
                {days.map((d) => (
                  <div key={d} className="space-y-1.5">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {p.phase >= 3 ? (d === 15 ? "Days 15–30" : "Days 31–90") : `Day ${d}`}
                    </div>
                    {p.rows.filter((t) => t.day === d).map((t) => (
                      <TaskRow
                        key={t.id} task={t} notes={notesFor.get(t.id) ?? []}
                        canEdit={canEdit} viewerKind={viewerKind} startedAt={startedAt}
                        busy={props.busyTaskId === t.id}
                        onStatus={props.onStatus} onOwner={props.onOwner}
                        onNote={props.onNote} onProof={props.onProof}
                        onOpenAsset={props.onOpenAsset} assetTitle={props.assetTitle}
                      />
                    ))}
                  </div>
                ))}
              </section>
            );
          })}
          {!visible.length && (
            <p className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-muted-foreground">
              Nothing matches this filter.
            </p>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-border/50 bg-card/40 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next five actions</h4>
            <ol className="mt-3 space-y-2.5">
              {nextFive(tasks).map((t, i) => (
                <li key={t.id} className="flex gap-2 text-xs">
                  <span className="tabular-nums text-muted-foreground">{i + 1}.</span>
                  <span>
                    <span className="font-medium">{t.title}</span>
                    <span className="block text-muted-foreground">Day {t.day} · {t.owner_kind === "agency" ? "Agency" : "Founder"}</span>
                  </span>
                </li>
              ))}
              {!nextFive(tasks).length && <li className="text-xs text-muted-foreground">Everything open is blocked or done.</li>}
            </ol>
          </div>

          {props.onConsult && (
            <div className="rounded-2xl border border-border/50 bg-card/40 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Want it done with you?</h4>
              <p className="mt-2 text-xs text-muted-foreground">
                Adam's team can run this runway as your backfield in motion.
              </p>
              <Button size="sm" className="mt-3 w-full" onClick={props.onConsult}>
                <Hammer className="mr-1.5 h-3.5 w-3.5" /> Request a consultation
              </Button>
              <a href="tel:19292347355"
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground">
                <Phone className="h-3 w-3" /> 929-234-7355
              </a>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default OpsDashboard;
