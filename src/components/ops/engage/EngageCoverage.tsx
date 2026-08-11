import { categoryLabel, type OpsTask } from "@/lib/ops-runway";
import { isSpecialistTask } from "@/lib/ops-investment";
import { OpsGlyph } from "@/components/ops/OpsGlyph";

/**
 * The honest coverage picture: how many of this venture's own steps the
 * retainer absorbs, grouped the way the runway groups them.
 */
export function EngageCoverage({ tasks }: { tasks: OpsTask[] }) {
  const specialist = tasks.filter(isSpecialistTask);
  const byCategory = new Map<string, number>();
  for (const t of specialist) byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + 1);
  const rows = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const yours = tasks.length - specialist.length;

  return (
    <section className="rounded-2xl border border-border/50 bg-card/40 p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
        What we take off your plate
      </p>
      <h2 className="mt-1 font-serif text-xl text-foreground">
        {specialist.length} of your {tasks.length} steps move to the team
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Counted from your own runway — not a generic package. The remaining {yours} are approvals,
        decisions and conversations only you can have.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {rows.map(([category, count]) => (
          <div
            key={category}
            className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 py-2.5"
          >
            <OpsGlyph category={category} className="h-8 w-8 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{categoryLabel(category)}</div>
              <div className="text-xs text-muted-foreground">
                {count} specialist {count === 1 ? "step" : "steps"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
