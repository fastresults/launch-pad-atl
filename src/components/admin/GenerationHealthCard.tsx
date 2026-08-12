// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

/**
 * Generation health, read straight off the forensic event log.
 *
 * Before this, a broken asset type only surfaced when a founder said their hub
 * was stuck. This shows failure rate, p95 duration and the gateway error class
 * per asset type over the last 7 days, worst first.
 */

type Row = {
  document_type: string;
  outcome: string;
  duration_ms: number | null;
  error_class: string | null;
  created_at: string;
};

function p95(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
}

function seconds(ms: number | null) {
  return ms == null ? "—" : `${(ms / 1000).toFixed(1)}s`;
}

export function GenerationHealthCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "generation-health"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("venture_generation_events")
        .select("document_type, outcome, duration_ms, error_class, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const rows = (() => {
    const byType = new Map<string, Row[]>();
    for (const r of data ?? []) {
      if (!byType.has(r.document_type)) byType.set(r.document_type, []);
      byType.get(r.document_type)!.push(r);
    }
    return [...byType.entries()]
      .map(([type, events]) => {
        const terminal = events.filter((e) => ["complete", "failed", "blocked"].includes(e.outcome));
        const bad = terminal.filter((e) => e.outcome !== "complete");
        const durations = events
          .filter((e) => e.outcome === "complete" && typeof e.duration_ms === "number")
          .map((e) => e.duration_ms as number);
        const classes = new Map<string, number>();
        for (const e of bad) {
          if (!e.error_class) continue;
          classes.set(e.error_class, (classes.get(e.error_class) ?? 0) + 1);
        }
        const topClass = [...classes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        return {
          type,
          attempts: events.length,
          failures: bad.length,
          rate: terminal.length ? bad.length / terminal.length : 0,
          p95: p95(durations),
          topClass,
        };
      })
      .sort((a, b) => b.rate - a.rate || b.failures - a.failures);
  })();

  return (
    <section className="space-y-2">
      <h2 className="text-xs uppercase tracking-wide text-muted-foreground">Generation health (7 days)</h2>
      <div className="overflow-hidden rounded-2xl border border-border">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No generation activity recorded in the last 7 days.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="p-3 font-medium">Asset</th>
                <th className="p-3 font-medium">Attempts</th>
                <th className="p-3 font-medium">Failure rate</th>
                <th className="p-3 font-medium">p95</th>
                <th className="p-3 font-medium">Top error</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.type} className="border-t border-border first:border-t-0">
                  <td className="p-3 font-medium">{r.type}</td>
                  <td className="p-3 tabular-nums text-muted-foreground">{r.attempts}</td>
                  <td className="p-3">
                    <Badge variant={r.rate > 0.2 ? "destructive" : r.rate > 0 ? "secondary" : "outline"}>
                      {Math.round(r.rate * 100)}%
                    </Badge>
                  </td>
                  <td className="p-3 tabular-nums text-muted-foreground">{seconds(r.p95)}</td>
                  <td className="p-3 text-xs text-muted-foreground">{r.topClass ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
