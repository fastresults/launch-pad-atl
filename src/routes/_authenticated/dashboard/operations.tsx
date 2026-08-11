// @ts-nocheck
import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Hammer, ArrowRight, Plus, Loader2 } from "lucide-react";
import { FoundersHubGate } from "@/components/hub/FoundersHubGate";
import { Button } from "@/components/ui/button";
import { listSnapshots } from "@/lib/foundersHub.functions";
import { fetchOpsRunway } from "@/lib/ops.functions";
import { OPS_PHASES } from "@/lib/ops-runway";
import { useDocumentTitle } from "@/lib/use-document-title";

/** Sidebar entry point: pick the venture whose operating runway you want to work. */
export default function OperationsIndexPage() {
  return (
    <FoundersHubGate>
      <OperationsInner />
    </FoundersHubGate>
  );
}

function OperationsInner() {
  useDocumentTitle("Operationalize");
  const navigate = useNavigate();

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ["hub", "snapshots"],
    queryFn: listSnapshots,
  });

  const ventures = useMemo(
    () => (snapshots ?? []).filter((s: any) => s.status !== "archived"),
    [snapshots],
  );

  // One venture? Don't make them click a list of one.
  useEffect(() => {
    if (!isLoading && ventures.length === 1) {
      navigate(`/dashboard/hub/${ventures[0].id}/operations`, { replace: true });
    }
  }, [isLoading, ventures, navigate]);

  const runways = useQueries({
    queries: ventures.map((v: any) => ({
      queryKey: ["venture-ops", "hub", v.id],
      queryFn: () => fetchOpsRunway({ kind: "hub", snapshotId: v.id }),
      staleTime: 60_000,
      retry: false,
    })),
  });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Hammer className="h-5 w-5 text-primary" /> Operationalize
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The 90-day runway you and your team work from — legal, money, CRM, demand, rhythm — plus
          creative sign-off. Choose a startup to open its runway.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your startups…
        </div>
      )}

      {!isLoading && ventures.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No startups yet. Create one and its operating runway comes with it.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link to="/dashboard/hub/new">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New venture
            </Link>
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {ventures.map((v: any, i: number) => {
          const q = runways[i];
          const tasks = q?.data?.tasks ?? [];
          const total = tasks.length;
          const done = tasks.filter((t: any) => t.status === "done").length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          const open = tasks.filter((t: any) => t.status !== "done");
          const phaseN = open.length ? Math.min(...open.map((t: any) => t.phase)) : 4;
          const phase = OPS_PHASES.find((p) => p.phase === phaseN);

          return (
            <Link
              key={v.id}
              to={`/dashboard/hub/${v.id}/operations`}
              className="block rounded-2xl border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/50 hover:bg-card/70"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold tracking-tight">
                    {v.company_name || v.title || "Untitled startup"}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {q?.isLoading
                      ? "Reading the runway…"
                      : total === 0
                        ? "Runway not started yet — open to seed it."
                        : `${done} of ${total} done · ${phase ? `${phase.label} (${phase.range})` : ""}`}
                  </div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
              </div>
              {total > 0 && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
