import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyWorkflow, runMyDeliverable, runMyRemaining, getMyRecentRuns } from "@/lib/userPipeline.functions";
import { STAGES } from "@/lib/workflow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Lock, Loader2, Play } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/workflow")({
  component: WorkflowPage,
  head: () => ({ meta: [{ title: "Workflow" }] }),
});

function WorkflowPage() {
  const qc = useQueryClient();
  const wfFn = useServerFn(getMyWorkflow);
  const runFn = useServerFn(runMyDeliverable);
  const runAllFn = useServerFn(runMyRemaining);
  const recentFn = useServerFn(getMyRecentRuns);

  const { data } = useQuery({ queryKey: ["my", "workflow"], queryFn: () => wfFn(), refetchInterval: 5000 });
  const { data: recent } = useQuery({ queryKey: ["my", "recent-runs"], queryFn: () => recentFn(), refetchInterval: 3000 });

  const runOne = useMutation({
    mutationFn: (key: string) => runFn({ data: { key, runUpstream: true } }),
    onSuccess: () => { toast.success("Generation complete"); qc.invalidateQueries({ queryKey: ["my"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Run failed"),
  });

  const runAll = useMutation({
    mutationFn: () => runAllFn(),
    onSuccess: (r) => { toast.success(`Generated ${r.total - r.failed} / ${r.total}`); qc.invalidateQueries({ queryKey: ["my"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Bulk run failed"),
  });

  const briefScore = data?.brief?.completeness_score ?? 0;
  const briefReady = briefScore >= 6;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your workflow</h1>
          <p className="mt-1 text-sm text-muted-foreground">25 deliverables, organized in 7 stages. AI generates each one from your brief and prior outputs.</p>
        </div>
        <Button onClick={() => runAll.mutate()} disabled={!briefReady || runAll.isPending}>
          {runAll.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running…</> : <><Play className="mr-2 h-4 w-4" />Run remaining</>}
        </Button>
      </div>

      {!briefReady && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm">
          <Link to="/dashboard/brief" className="font-medium underline">Finish your Startup Brief</Link>
          {" "}first ({briefScore} / 10 fields done). AI needs it to generate good deliverables.
        </div>
      )}

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
                const Icon = d.generated ? CheckCircle2 : d.ready ? Circle : Lock;
                const tone = d.generated ? "text-green-500" : d.ready ? "text-foreground" : "text-muted-foreground";
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
                        disabled={!briefReady || runOne.isPending || !d.user_can_trigger}
                        onClick={() => runOne.mutate(d.key)}
                      >
                        {runOne.isPending && runOne.variables === d.key ? (
                          <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Running…</>
                        ) : d.generated ? "Regenerate" : "Generate"}
                      </Button>
                      {d.generated && (
                        <Button asChild size="sm" variant="ghost">
                          <Link to="/dashboard/workflow/$key" params={{ key: d.key }}>View</Link>
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

      {recent && recent.steps.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">Recent activity</h2>
          <ul className="space-y-1 rounded-xl border border-white/10 bg-card p-4 text-xs">
            {recent.steps.slice(0, 12).map((s, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="truncate">{s.deliverable_key}</span>
                <span className={s.status === "completed" ? "text-green-500" : s.status === "failed" ? "text-red-500" : "text-muted-foreground"}>
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
