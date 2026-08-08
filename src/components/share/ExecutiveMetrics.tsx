import type { ShareMetric } from "@/lib/venture-share.functions";

/**
 * "By the numbers" strip shown above the executive summary. Every tile is a
 * figure lifted from the venture's own finance assets, with the source named
 * so a reader can trace it.
 */
export function ExecutiveMetrics({
  metrics,
  accent,
  eyebrow = "By the numbers",
  footnote = "Projections drawn from this venture's own financial and pricing assets — not guarantees.",
}: {
  metrics: ShareMetric[];
  accent?: string | null;
  eyebrow?: string;
  footnote?: string | null;
}) {
  if (!metrics?.length) return null;
  const line = accent ?? "hsl(var(--primary))";

  return (
    <div className="mb-10">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="min-w-0 rounded-xl border border-border/60 bg-muted/20 p-4"
            style={{ borderTop: `2px solid ${line}` }}
          >
            <div className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
              {m.label}
            </div>
            <div className="mt-1 break-words font-serif text-[26px] leading-tight text-foreground md:text-[30px]">
              {m.value}
            </div>
            {m.note && <p className="mt-1 text-xs leading-snug text-muted-foreground">{m.note}</p>}
            {m.source && (
              <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                Source: {m.source}
              </p>
            )}
          </div>
        ))}
      </div>
      {footnote && <p className="mt-3 text-xs text-muted-foreground">{footnote}</p>}
    </div>
  );
}
