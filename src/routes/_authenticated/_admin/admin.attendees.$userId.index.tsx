import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAttendeeDetail, triggerPipeline } from "@/lib/pipeline.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/_admin/admin/attendees/$userId/")({
  component: AttendeeDetail,
  head: () => ({ meta: [{ title: "Attendee — Admin" }] }),
});

function AttendeeDetail() {
  const { userId } = Route.useParams();
  const qc = useQueryClient();
  const { isSuperAdmin } = useAuth();
  const detailFn = useServerFn(getAttendeeDetail);
  const triggerFn = useServerFn(triggerPipeline);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "attendee", userId],
    queryFn: () => detailFn({ data: { userId } }),
  });

  const trigger = useMutation({
    mutationFn: () => triggerFn({ data: { userId } }),
    onSuccess: (r) => {
      toast.success(`Pipeline ran: ${r.totalSteps - r.failed}/${r.totalSteps} succeeded`);
      qc.invalidateQueries({ queryKey: ["admin", "attendee", userId] });
      qc.invalidateQueries({ queryKey: ["admin", "review"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!data) return null;

  const a = data.attendee as {
    business_name?: string | null;
    industry?: string | null;
    stage?: string | null;
    intake_completed_at?: string | null;
  } | null;

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <Link to="/admin/attendees" className="text-xs text-muted-foreground hover:text-foreground">
            ← Attendees
          </Link>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {data.profile?.display_name ?? data.profile?.email ?? "Attendee"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{data.profile?.email}</p>
        </div>
        {isSuperAdmin && (
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/admin/attendees/$userId/workflow" params={{ userId }}>Workflow</Link>
            </Button>
            <Button onClick={() => trigger.mutate()} disabled={trigger.isPending}>
              {trigger.isPending ? "Running pipeline…" : "Run full AI pipeline"}
            </Button>
          </div>
        )}

      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Business" value={a?.business_name ?? "—"} />
        <Stat label="Industry" value={a?.industry ?? "—"} />
        <Stat label="Stage" value={a?.stage ?? "—"} />
        <Stat label="Intake" value={a?.intake_completed_at ? "Complete" : "Pending"} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">Documents</h2>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-4 py-3">File</th><th className="px-4 py-3">Kind</th></tr>
            </thead>
            <tbody>
              {data.documents.map((d) => (
                <tr key={d.id} className="border-t border-white/5">
                  <td className="px-4 py-3">{d.original_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.kind}</td>
                </tr>
              ))}
              {data.documents.length === 0 && (
                <tr><td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">No documents</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">Deliverables</h2>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Deliverable</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3">Publish</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.deliverables.map((d) => {
                const t = d.deliverable_types as { label?: string } | null;
                return (
                  <tr key={d.id} className="border-t border-white/5">
                    <td className="px-4 py-3">{t?.label ?? d.deliverable_key}</td>
                    <td className="px-4 py-3"><Pill v={d.review_status} /></td>
                    <td className="px-4 py-3"><Pill v={d.publish_status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{d.content_source}</td>
                    <td className="px-4 py-3 text-right">
                      {isSuperAdmin && (
                        <Link
                          to="/admin/attendees/$userId/deliverables/$key"
                          params={{ userId, key: d.deliverable_key }}
                          className="text-primary hover:underline"
                        >
                          Open →
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
              {data.deliverables.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No deliverables yet. Run the pipeline to generate them.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">Recent pipeline runs</h2>
        <ul className="space-y-2 text-sm">
          {data.runs.map((r) => (
            <li key={r.id} className="rounded-lg border border-white/10 bg-card px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs">{r.id.slice(0, 8)}</span>
                <Pill v={r.status} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleString()}
                {r.error ? ` · ${r.error}` : ""}
              </div>
            </li>
          ))}
          {data.runs.length === 0 && <li className="text-xs text-muted-foreground">No runs yet.</li>}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-medium">{value}</div>
    </div>
  );
}

function Pill({ v }: { v: string }) {
  return <span className="rounded-full bg-white/5 px-2 py-1 text-xs">{v}</span>;
}
