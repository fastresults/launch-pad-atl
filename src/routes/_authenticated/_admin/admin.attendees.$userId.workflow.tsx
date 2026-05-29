import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminGetUserWorkflow, adminRunForUser } from "@/lib/userPipeline.functions";
import { STAGES } from "@/lib/workflow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Lock, Loader2, Play } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/admin/attendees/$userId/workflow")({
  component: AdminAttendeeWorkflow,
  head: () => ({ meta: [{ title: "Attendee workflow — Admin" }] }),
});

function AdminAttendeeWorkflow() {
  const { userId } = Route.useParams();
  const qc = useQueryClient();
  const wfFn = useServerFn(adminGetUserWorkflow);
  const runFn = useServerFn(adminRunForUser);

  const { data } = useQuery({
    queryKey: ["admin", "workflow", userId],
    queryFn: () => wfFn({ data: { userId } }),
    refetchInterval: 5000,
  });

  const runOne = useMutation({
    mutationFn: (key: string) => runFn({ data: { userId, key, runUpstream: true } }),
    onSuccess: () => { toast.success("Generation complete"); qc.invalidateQueries({ queryKey: ["admin", "workflow", userId] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Run failed"),
  });

  const runAll = useMutation({
    mutationFn: () => runFn({ data: { userId, bulk: true } }),
    onSuccess: (r) => { toast.success(`Generated ${r.total - r.failed} / ${r.total}`); qc.invalidateQueries({ queryKey: ["admin", "workflow", userId] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Bulk run failed"),
  });

  const briefScore = data?.brief?.completeness_score ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/admin/attendees/$userId" params={{ userId }} className="text-xs text-muted-foreground hover:text-foreground">
            ← Attendee
          </Link>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Workflow</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Brief {briefScore} / 10 · Filing {data?.filingPresent ? "on file" : "pending"} · Run any deliverable on behalf of this attendee.
          </p>
        </div>
        <Button onClick={() => runAll.mutate()} disabled={runAll.isPending}>
          {runAll.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running…</> : <><Play className="mr-2 h-4 w-4" />Run remaining</>}
        </Button>
      </div>

      {STAGES.filter((s) => s.n >= 1).map((stage) => {
        const items = (data?.items ?? []).filter((i) => i.stage_n === stage.n);
        if (!items.length) return null;
        return (
          <section key={stage.n} className="space-y-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Stage {stage.n}</div>
              <h2 className="text-xl font-semibold">{stage.label}</h2>
              <p className="text-sm text-muted-foreground">{stage.description}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((d) => {
                const Icon = d.generated ? CheckCircle2 : d.deps_met ? Circle : Lock;
                const tone = d.generated ? "text-green-500" : d.deps_met ? "text-foreground" : "text-muted-foreground";
                return (
                  <div key={d.key} className="rounded-xl border border-white/10 bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${tone}`} />
                          <h3 className="truncate text-sm font-medium">{d.label}</h3>
                        </div>
                        {d.description && <p className="mt-1 text-xs text-muted-foreground">{d.description}</p>}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {d.generated && <Badge variant="secondary" className="text-xs">Generated</Badge>}
                          {!d.deps_met && <Badge variant="outline" className="text-xs">Waiting on upstream</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant={d.generated ? "outline" : "default"}
                        disabled={runOne.isPending}
                        onClick={() => runOne.mutate(d.key)}
                      >
                        {runOne.isPending && runOne.variables === d.key ? (
                          <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Running…</>
                        ) : d.generated ? "Regenerate" : "Generate"}
                      </Button>
                      {d.generated && (
                        <Button asChild size="sm" variant="ghost">
                          <Link
                            to="/admin/attendees/$userId/deliverables/$key"
                            params={{ userId, key: d.key }}
                          >
                            View
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
