// @ts-nocheck
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyWorkflow, runMyDeliverable, runMyRemaining, getMyRecentRuns } from "@/lib/userPipeline.functions";
import { countAnsweredBriefFields } from "@/lib/brief-progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Lock, Loader2, Play, Sparkles } from "lucide-react";
import { toast } from "sonner";

type WorkflowItem = {
  key: string;
  label: string;
  description?: string;
  stage_n: number;
  stage_label: string;
  bonus?: boolean;
  user_can_trigger?: boolean;
  generated: boolean;
  deps_met: boolean;
};

export default function WorkflowPage() {
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ["my", "workflow"], queryFn: () => getMyWorkflow(), refetchInterval: 5000 });
  const { data: recent } = useQuery({ queryKey: ["my", "recent-runs"], queryFn: () => getMyRecentRuns(), refetchInterval: 3000 });

  const runOne = useMutation({
    mutationFn: (key: string) => runMyDeliverable({ data: { key, runUpstream: true } }),
    onSuccess: () => { toast.success("Generation complete"); qc.invalidateQueries({ queryKey: ["my"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Run failed"),
  });

  const runAll = useMutation({
    mutationFn: () => runMyRemaining(),
    onSuccess: () => { toast.success("Queued — generating your remaining deliverables"); qc.invalidateQueries({ queryKey: ["my"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Bulk run failed"),
  });

  const briefScore = countAnsweredBriefFields(data?.brief);
  const briefReady = briefScore >= 6;

  const items: WorkflowItem[] = (data?.items ?? []).filter((i: WorkflowItem) => i.stage_n >= 1);
  const totalDeliverables = items.length;

  // Group items by stage, preserving DB sort order
  const byStage = new Map<number, { label: string; bonus: boolean; items: WorkflowItem[] }>();
  for (const it of items) {
    const g = byStage.get(it.stage_n);
    if (g) {
      g.items.push(it);
      if (it.bonus) g.bonus = true;
    } else {
      byStage.set(it.stage_n, { label: it.stage_label, bonus: !!it.bonus, items: [it] });
    }
  }
  const stages = Array.from(byStage.entries()).sort((a, b) => a[0] - b[0]);
  const totalCategories = stages.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your workflow</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalDeliverables > 0
              ? `${totalDeliverables} founder-ready deliverables across ${totalCategories} categories — including bonus Brand, Marketing, and Social & Content tracks. Each one is generated from your Startup Brief and the deliverables that came before it, so the whole package stays in sync with your startup.`
              : "Your full deliverables package, generated from your Startup Brief and built in order so each piece feeds the next."}
          </p>
        </div>
        <Button
          onClick={() => runAll.mutate()}
          disabled={!briefReady || runAll.isPending}
          aria-label="Generate every deliverable that's still missing"
          title="Generate every deliverable that's still missing"
        >
          {runAll.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running…</> : <><Play className="mr-2 h-4 w-4" />Run remaining</>}
        </Button>
      </div>

      {!briefReady && (
        <div className="rounded-2xl border border-status-warning/30 bg-status-warning/5 p-4 text-sm">
          <Link to="/dashboard/brief" className="font-medium underline">Finish your Startup Brief</Link>
          {" "}first ({briefScore} / 10 answered) — your coach needs it before AI can generate deliverables that actually sound like your startup.
        </div>
      )}

      {stages.map(([n, group]) => (
        <section key={n} className="space-y-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Category {n}</div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{group.label}</h2>
              {group.bonus && (
                <Badge variant="secondary" className="gap-1 text-[10px] uppercase tracking-wide">
                  <Sparkles className="h-3 w-3" /> Bonus
                </Badge>
              )}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {group.items.map((d) => {
              const comingSoon = d.user_can_trigger === false && !d.generated;
              const Icon = d.generated ? CheckCircle2 : comingSoon ? Lock : d.deps_met ? Circle : Lock;
              const tone = d.generated
                ? "text-status-success"
                : comingSoon
                ? "text-muted-foreground"
                : d.deps_met
                ? "text-foreground"
                : "text-muted-foreground";
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
                        {comingSoon && <Badge variant="outline" className="text-xs">Coming soon</Badge>}
                        {!comingSoon && !d.deps_met && <Badge variant="outline" className="text-xs">Waiting on upstream</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant={d.generated ? "outline" : "default"}
                      disabled={!briefReady || runOne.isPending || comingSoon}
                      onClick={() => runOne.mutate(d.key)}
                      title={comingSoon ? "Prompt for this deliverable is on its way" : undefined}
                    >
                      {runOne.isPending && runOne.variables === d.key ? (
                        <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Running…</>
                      ) : d.generated ? "Regenerate" : comingSoon ? "Coming soon" : "Generate"}
                    </Button>
                    {d.generated && (
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/dashboard/workflow/${d.key}`}>View</Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {recent && recent.steps && recent.steps.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">Recent activity</h2>
          <ul className="space-y-1 rounded-xl border border-white/10 bg-card p-4 text-xs">
            {recent.steps.slice(0, 12).map((s: any, i: number) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="truncate">{s.deliverable_key}</span>
                <span className={s.status === "completed" ? "text-status-success" : s.status === "failed" ? "text-status-danger" : "text-muted-foreground"}>
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
