// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { forceRunMyRemaining, getMyWorkflow, runMyDeliverable, runMyRemaining, getMyRecentRuns } from "@/lib/userPipeline.functions";
import { countAnsweredBriefFields } from "@/lib/brief-progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Lock, Loader2, Play, Sparkles, Presentation } from "lucide-react";
import { toast } from "sonner";
import { STAGE_DECKS, slugify } from "@/components/workshop-slides/registry";

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

  const [bulk, setBulk] = useState<{ startCount: number; target: number } | null>(null);

  const runAll = useMutation({
    mutationFn: () => runMyRemaining(),
    onSuccess: () => {
      toast.success("Queued — your co-founder is on it");
      qc.invalidateQueries({ queryKey: ["my"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Bulk run failed"),
  });

  const forceRun = useMutation({
    mutationFn: () => forceRunMyRemaining(),
    onSuccess: (r: any) => {
      const made = r?.done ?? r?.attempted ?? 0;
      toast.success(made > 0 ? `Force run restarted — ${made} deliverables advanced` : "Force run restarted generation");
      qc.invalidateQueries({ queryKey: ["my"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Force run failed"),
  });

  const briefScore = countAnsweredBriefFields(data?.brief);
  const briefReady = briefScore >= 6;

  const items: WorkflowItem[] = (data?.items ?? []).filter((i: WorkflowItem) => i.stage_n >= 1);
  const totalDeliverables = items.length;
  const triggerable = items.filter((i) => i.user_can_trigger !== false);
  const generatedCount = triggerable.filter((i) => i.generated).length;
  const remainingCount = triggerable.length - generatedCount;

  // Track bulk-run progress: lock in a snapshot when the user clicks Run remaining,
  // then watch generatedCount climb toward the target.
  const justStarted = useRef(false);
  useEffect(() => {
    if (runAll.isSuccess && !justStarted.current && triggerable.length > 0) {
      justStarted.current = true;
      setBulk({ startCount: generatedCount, target: triggerable.length });
    }
  }, [runAll.isSuccess, triggerable.length, generatedCount]);

  // Clear once everything is done or no active queued/running runs remain.
  const activeRuns = (recent ?? []).filter((r: any) => r.status === "queued" || r.status === "running").length;
  useEffect(() => {
    if (!bulk) return;
    if (generatedCount >= bulk.target || (runAll.isIdle && activeRuns === 0 && !runAll.isPending && generatedCount > bulk.startCount)) {
      const t = setTimeout(() => { setBulk(null); justStarted.current = false; }, 1500);
      return () => clearTimeout(t);
    }
  }, [bulk, generatedCount, activeRuns, runAll.isIdle, runAll.isPending]);

  // One-time auto-kick: after the big unlock, automatically start generating
  // any deliverables that were previously gated as "Coming soon".
  useEffect(() => {
    if (!briefReady || runAll.isPending || forceRun.isPending || bulk) return;
    if (remainingCount === 0) return;
    try {
      const KEY = "workflow.autokick.v1";
      if (typeof window === "undefined") return;
      if (window.localStorage.getItem(KEY)) return;
      window.localStorage.setItem(KEY, String(Date.now()));
      runAll.mutate();
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefReady, remainingCount]);


  const bulkDone = bulk ? generatedCount - bulk.startCount : 0;
  const bulkTotal = bulk ? bulk.target - bulk.startCount : 0;
  const bulkPct = bulk && bulkTotal > 0 ? Math.min(100, Math.round((bulkDone / bulkTotal) * 100)) : 0;

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

  // Compute deck unlock state: a stage's deck unlocks only after every prior
  // (non-bonus) stage has all its triggerable items generated.
  const deckState = new Map<number, { slug: string; available: boolean; unlocked: boolean; prevLabel?: string }>();
  {
    let allPriorGenerated = true;
    let prevLabel: string | undefined;
    for (const [n, group] of stages) {
      const slug = slugify(group.label);
      const deck = STAGE_DECKS.find((d) => d.slug === slug);
      const available = !!deck?.available;
      deckState.set(n, { slug, available, unlocked: allPriorGenerated, prevLabel });
      if (!group.bonus) {
        const stageTriggerable = group.items.filter((i) => i.user_can_trigger !== false);
        const stageDone = stageTriggerable.length > 0 && stageTriggerable.every((i) => i.generated);
        allPriorGenerated = allPriorGenerated && stageDone;
        prevLabel = group.label;
      }
    }
  }
  const now = Date.now();
  const staleRuns = (recent ?? []).filter((r: any) => {
    const createdAt = r.created_at ? new Date(r.created_at).getTime() : 0;
    const startedAt = r.started_at ? new Date(r.started_at).getTime() : 0;
    return (r.status === "queued" && createdAt > 0 && now - createdAt > 2 * 60 * 1000)
      || (r.status === "running" && startedAt > 0 && now - startedAt > 15 * 60 * 1000);
  });
  const hasStuckRuns = staleRuns.length > 0;
  const bulkActive = !!bulk || runAll.isPending || forceRun.isPending || activeRuns > 0;
  const currentlyRunning = (recent ?? []).find((r: any) => r.status === "running") as any;

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
        <div className="flex flex-wrap gap-2">
          {hasStuckRuns && remainingCount > 0 && (
            <Button
              onClick={() => forceRun.mutate()}
              disabled={!briefReady || forceRun.isPending}
              aria-label="Force restart stuck generation"
              title="Restart only the generation work that appears stuck"
              variant="secondary"
            >
              {forceRun.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Force running…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" />Force run remaining</>
              )}
            </Button>
          )}
          <Button
            onClick={() => runAll.mutate()}
            disabled={!briefReady || bulkActive || remainingCount === 0}
            aria-label="Generate every deliverable that's still missing"
            title="Generate every deliverable that's still missing"
          >
            {bulkActive ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>
            ) : remainingCount === 0 ? (
              <><CheckCircle2 className="mr-2 h-4 w-4" />All {triggerable.length} ready</>
            ) : (
              <><Play className="mr-2 h-4 w-4" />Run remaining ({remainingCount})</>
            )}
          </Button>

        </div>
      </div>

      {bulkActive && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {bulk
                ? `Building your kit — ${bulkDone} of ${bulkTotal} new deliverables ready`
                : "Queuing your remaining deliverables…"}
            </div>
            <div className="text-xs text-muted-foreground">
              {generatedCount} / {triggerable.length} total
            </div>
          </div>
          <Progress value={bulk ? bulkPct : 8} className="mt-3 h-2" />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {hasStuckRuns
                ? "Generation looks stuck — use Force run remaining to restart only unfinished work."
                : currentlyRunning?.options?.key
                ? `Working on: ${currentlyRunning.options.key}`
                : activeRuns > 0
                ? `${activeRuns} run${activeRuns === 1 ? "" : "s"} in flight`
                : "Warming up your co-founder…"}
            </span>
            <span>This page updates live — you can keep working elsewhere.</span>
          </div>
        </div>
      )}

      {!briefReady && (
        <div className="rounded-2xl border border-status-warning/30 bg-status-warning/5 p-4 text-sm">
          <Link to="/dashboard/brief" className="font-medium underline">Finish your Startup Brief</Link>
          {" "}first ({briefScore} / 10 answered) — your coach needs it before AI can generate deliverables that actually sound like your startup.
        </div>
      )}

      {stages.map(([n, group]) => {
        const deck = deckState.get(n);
        return (
        <section key={n} className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
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
              <p className="mt-1 text-xs text-muted-foreground">
                Facilitator: walk the room through this deck before generating.
              </p>
            </div>
            {deck && (
              deck.unlocked && deck.available ? (
                <Button asChild size="sm" variant="outline">
                  <Link to={`/workshop/${deck.slug}`}>
                    <Presentation className="mr-1 h-4 w-4" />
                    Open facilitator deck
                  </Link>
                </Button>
              ) : !deck.available ? (
                <Button size="sm" variant="outline" disabled title="Deck coming soon">
                  <Lock className="mr-1 h-4 w-4" />
                  Deck coming soon
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  title={`Deck unlocks when ${deck.prevLabel ?? "the previous category"} is complete`}
                >
                  <Lock className="mr-1 h-4 w-4" />
                  Unlocks after {deck.prevLabel ?? "previous category"}
                </Button>
              )
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {group.items.map((d) => {
              const Icon = d.generated ? CheckCircle2 : d.deps_met ? Circle : Lock;
              const tone = d.generated
                ? "text-status-success"
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
                        {!d.generated && !d.deps_met && <Badge variant="outline" className="text-xs">Waiting on upstream</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant={d.generated ? "outline" : "default"}
                      disabled={!briefReady || runOne.isPending}
                      onClick={() => runOne.mutate(d.key)}
                      title={!d.deps_met ? "We'll run upstream deliverables first, then this one." : undefined}
                    >
                      {runOne.isPending && runOne.variables === d.key ? (
                        <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Running…</>
                      ) : d.generated ? "Regenerate" : "Generate"}
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
