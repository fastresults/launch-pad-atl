import { useState } from "react";
import { CalendarClock, CheckCircle2, ExternalLink, Loader2, RotateCcw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DELIVERY_STATUS_CLASS, DELIVERY_STATUS_LABEL, DELIVERY_STATUS_ORDER,
  deliveryStatusOf, type DeliveryStatus, type OpsOwnerKind, type OpsTask,
} from "@/lib/ops-runway";

export interface DeliveryHandlers {
  onAssign?: (taskId: string, name: string | null) => void;
  onCommittedDate?: (taskId: string, iso: string | null) => void;
  onDeliveryStatus?: (taskId: string, status: DeliveryStatus) => void;
  onWorkProduct?: (taskId: string, url: string | null, label?: string | null) => void;
  onReview?: (taskId: string, review: "approved" | "changes_requested", note?: string) => void;
  onHandoff?: (taskId: string) => void;
}

/**
 * The managed-delivery block on a step: who's on it, when it's committed, what
 * stage it's at, and the finished work product. The agency edits it; the
 * founder reads it and approves.
 */
export function DeliveryPanel({
  task, viewerKind, busy, compact, className, ...h
}: DeliveryHandlers & {
  task: OpsTask;
  viewerKind: OpsOwnerKind;
  busy?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const agencyView = viewerKind === "agency";
  const status = deliveryStatusOf(task);
  const [note, setNote] = useState("");
  const [changes, setChanges] = useState(false);
  const committed = task.committed_at ? new Date(task.committed_at) : null;
  const review = task.client_review_state ?? "none";

  return (
    <div className={cn(
      "rounded-xl border border-primary/25 bg-primary/[0.03]",
      compact ? "px-3 py-2.5" : "px-3.5 py-3",
      className,
    )}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px]">
        <span className={cn("rounded-full border px-2 py-0.5", DELIVERY_STATUS_CLASS[status])}>
          {DELIVERY_STATUS_LABEL[status]}
        </span>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <User className="h-3 w-3" />
          {task.assignee_name || (agencyView ? "Unassigned" : "Adam's team")}
        </span>
        <span className={cn("inline-flex items-center gap-1 text-muted-foreground",
          committed && committed.getTime() < Date.now() && status !== "delivered" && "text-destructive")}>
          <CalendarClock className="h-3 w-3" />
          {committed
            ? committed.toLocaleDateString(undefined, { month: "short", day: "numeric" })
            : "No date committed"}
        </span>
        {task.delivered_at && (
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Delivered {new Date(task.delivered_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
        {review === "pending" && <span className="text-violet-300">Waiting on your approval</span>}
        {review === "approved" && <span className="text-emerald-300">You approved this</span>}
        {review === "changes_requested" && <span className="text-amber-300">Changes requested</span>}
        {busy && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>

      {task.work_product_url && (
        <a
          href={task.work_product_url} target="_blank" rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary underline-offset-2 hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {task.work_product_label || "Open the finished work"}
        </a>
      )}

      {agencyView && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {DELIVERY_STATUS_ORDER.map((s) => (
              <button
                key={s} type="button" disabled={busy}
                onClick={() => h.onDeliveryStatus?.(task.id, s)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] transition",
                  s === status ? DELIVERY_STATUS_CLASS[s] + " bg-muted/40" : "border-border/50 text-muted-foreground hover:text-foreground",
                )}
              >{DELIVERY_STATUS_LABEL[s]}</button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              placeholder="Who's on it"
              defaultValue={task.assignee_name ?? ""}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== (task.assignee_name ?? "")) h.onAssign?.(task.id, v || null);
              }}
              className="rounded-lg border border-border/50 bg-background/60 px-2.5 py-1.5 text-xs outline-none focus:border-primary/50"
            />
            <input
              type="date"
              defaultValue={committed ? committed.toISOString().slice(0, 10) : ""}
              onChange={(e) => h.onCommittedDate?.(task.id, e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="rounded-lg border border-border/50 bg-background/60 px-2.5 py-1.5 text-xs outline-none focus:border-primary/50"
            />
            <input
              type="url"
              placeholder="Link to the finished work product"
              defaultValue={task.work_product_url ?? ""}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== (task.work_product_url ?? "")) h.onWorkProduct?.(task.id, v || null, task.work_product_label);
              }}
              className="rounded-lg border border-border/50 bg-background/60 px-2.5 py-1.5 text-xs outline-none focus:border-primary/50"
            />
            <input
              placeholder="What is it called"
              defaultValue={task.work_product_label ?? ""}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== (task.work_product_label ?? "")) h.onWorkProduct?.(task.id, task.work_product_url, v || null);
              }}
              className="rounded-lg border border-border/50 bg-background/60 px-2.5 py-1.5 text-xs outline-none focus:border-primary/50"
            />
          </div>
        </div>
      )}

      {!agencyView && review === "pending" && (
        <div className="mt-3 space-y-2">
          {changes ? (
            <div className="flex gap-2">
              <input
                value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="What needs to change?"
                className="flex-1 rounded-lg border border-border/50 bg-background/60 px-2.5 py-1.5 text-xs outline-none focus:border-primary/50"
              />
              <Button size="sm" variant="secondary" disabled={!note.trim() || busy}
                onClick={() => { h.onReview?.(task.id, "changes_requested", note.trim()); setNote(""); setChanges(false); }}>
                Send
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" disabled={busy} onClick={() => h.onReview?.(task.id, "approved")}>
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setChanges(true)}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Ask for changes
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DeliveryPanel;
