import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAttendeeDetail,
  listDeliverableRevisions,
  publishDeliverable,
  regenerateDeliverable,
  reviewDeliverable,
  revertDeliverableToAi,
  unpublishDeliverable,
  updateDeliverableContent,
} from "@/lib/pipeline.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/admin/attendees/$userId/deliverables/$key")({
  component: DeliverableEditor,
  head: () => ({ meta: [{ title: "Edit deliverable — Admin" }] }),
});

function DeliverableEditor() {
  const { userId, key } = Route.useParams();
  const qc = useQueryClient();
  const detailFn = useServerFn(getAttendeeDetail);
  const updateFn = useServerFn(updateDeliverableContent);
  const revertFn = useServerFn(revertDeliverableToAi);
  const regenFn = useServerFn(regenerateDeliverable);
  const reviewFn = useServerFn(reviewDeliverable);
  const publishFn = useServerFn(publishDeliverable);
  const unpublishFn = useServerFn(unpublishDeliverable);
  const revisionsFn = useServerFn(listDeliverableRevisions);

  const { data } = useQuery({
    queryKey: ["admin", "attendee", userId],
    queryFn: () => detailFn({ data: { userId } }),
  });
  const { data: revs } = useQuery({
    queryKey: ["admin", "deliverable", userId, key, "revisions"],
    queryFn: () => revisionsFn({ data: { userId, key } }),
  });

  const row = data?.deliverables.find((d) => d.deliverable_key === key);
  const type = row?.deliverable_types as { label?: string; description?: string | null } | null;

  const [json, setJson] = useState("");
  const [notes, setNotes] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  useEffect(() => {
    if (row) setJson(JSON.stringify(row.content_current ?? {}, null, 2));
  }, [row?.id]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "attendee", userId] });
    qc.invalidateQueries({ queryKey: ["admin", "review"] });
    qc.invalidateQueries({ queryKey: ["admin", "deliverable", userId, key, "revisions"] });
  };

  const save = useMutation({
    mutationFn: () => {
      let parsed: unknown;
      try { parsed = JSON.parse(json); } catch { throw new Error("Invalid JSON"); }
      return updateFn({ data: { userId, key, content: parsed } });
    },
    onSuccess: () => { toast.success("Saved"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const regen = useMutation({
    mutationFn: () => regenFn({ data: { userId, key } }),
    onSuccess: () => { toast.success("Regenerated"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const revert = useMutation({
    mutationFn: () => revertFn({ data: { userId, key } }),
    onSuccess: () => { toast.success("Reverted to AI version"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const review = useMutation({
    mutationFn: (decision: "approve" | "request_changes" | "reject") =>
      reviewFn({ data: { userId, key, decision, notes } }),
    onSuccess: () => { toast.success("Review saved"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const publish = useMutation({
    mutationFn: (when: "now" | { scheduledAt: string }) =>
      publishFn({ data: { userId, key, when } }),
    onSuccess: () => { toast.success("Publishing updated"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const unpublish = useMutation({
    mutationFn: () => unpublishFn({ data: { userId, key } }),
    onSuccess: () => { toast.success("Unpublished"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!row) {
    return (
      <div className="text-sm text-muted-foreground">
        <Link to="/admin/attendees/$userId" params={{ userId }} className="hover:underline">← Back</Link>
        <div className="mt-4">Deliverable not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to="/admin/attendees/$userId" params={{ userId }} className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to attendee
        </Link>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{type?.label ?? key}</h1>
        {type?.description && <p className="mt-1 text-sm text-muted-foreground">{type.description}</p>}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Pill v={`review: ${row.review_status}`} />
          <Pill v={`publish: ${row.publish_status}`} />
          <Pill v={`source: ${row.content_source}`} />
        </div>
      </div>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Content (JSON)</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => regen.mutate()} disabled={regen.isPending}>
              {regen.isPending ? "Regenerating…" : "Regenerate"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => revert.mutate()} disabled={revert.isPending}>
              Revert to AI
            </Button>
            <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>Save edits</Button>
          </div>
        </div>
        <Textarea value={json} onChange={(e) => setJson(e.target.value)} rows={20} className="font-mono text-xs" />
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-card p-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Review</h2>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reviewer notes (optional)" rows={3} />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => review.mutate("approve")} disabled={review.isPending}>Approve</Button>
          <Button variant="outline" onClick={() => review.mutate("request_changes")} disabled={review.isPending}>Request changes</Button>
          <Button variant="ghost" onClick={() => review.mutate("reject")} disabled={review.isPending}>Reject</Button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-card p-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Publish</h2>
        <p className="text-xs text-muted-foreground">Approved deliverables can be published immediately or scheduled.</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => publish.mutate("now")} disabled={publish.isPending || row.review_status !== "approved"}>
            Publish now
          </Button>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="max-w-xs"
          />
          <Button
            variant="outline"
            onClick={() => {
              if (!scheduledAt) return toast.error("Pick a date/time");
              publish.mutate({ scheduledAt: new Date(scheduledAt).toISOString() });
            }}
            disabled={publish.isPending || row.review_status !== "approved"}
          >
            Schedule
          </Button>
          <Button variant="ghost" onClick={() => unpublish.mutate()} disabled={unpublish.isPending}>
            Unpublish
          </Button>
        </div>
        {row.publish_status === "scheduled" && row.publish_at && (
          <div className="text-xs text-muted-foreground">
            Scheduled for {new Date(row.publish_at).toLocaleString()}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">History</h2>
        <ul className="space-y-2 text-sm">
          {(revs?.revisions ?? []).map((r) => (
            <li key={r.id} className="rounded-lg border border-white/10 bg-card px-4 py-2 text-xs">
              <div className="flex items-center justify-between">
                <span>{r.action} · <span className="text-muted-foreground">{r.source}</span></span>
                <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
              </div>
              {r.notes && <div className="mt-1 text-muted-foreground">{r.notes}</div>}
            </li>
          ))}
          {(!revs || revs.revisions.length === 0) && <li className="text-xs text-muted-foreground">No history yet.</li>}
        </ul>
      </section>
    </div>
  );
}

function Pill({ v }: { v: string }) {
  return <span className="rounded-full bg-white/5 px-2 py-1 text-xs">{v}</span>;
}
