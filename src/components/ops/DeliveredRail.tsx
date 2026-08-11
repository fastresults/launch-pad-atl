import { ExternalLink, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { deliveryStatusOf, type OpsTask, type OpsUpdate } from "@/lib/ops-runway";

/** Reverse-chronological receipt of what Adam's team has actually shipped. */
export function DeliveredRail({
  tasks, updates, onOpenTask, className,
}: {
  tasks: OpsTask[];
  updates?: OpsUpdate[];
  onOpenTask?: (taskId: string) => void;
  className?: string;
}) {
  const delivered = tasks
    .filter((t) => deliveryStatusOf(t) === "delivered" && t.owner_kind === "agency")
    .sort((a, b) => (b.delivered_at ?? b.completed_at ?? "").localeCompare(a.delivered_at ?? a.completed_at ?? ""));

  const latest = (updates ?? []).filter((u) => u.visible_to_client).slice(-4).reverse();

  if (!delivered.length && !latest.length) return null;

  return (
    <div className={cn("rounded-2xl border border-border/50 bg-card/40 p-4", className)}>
      <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <PackageCheck className="h-3.5 w-3.5" /> Work delivered
      </h4>

      {delivered.length > 0 && (
        <ul className="mt-3 space-y-2.5">
          {delivered.slice(0, 8).map((t) => (
            <li key={t.id} className="border-l-2 border-emerald-400/40 pl-2.5">
              <button
                type="button" onClick={() => onOpenTask?.(t.id)}
                className="block text-left text-xs font-medium hover:text-primary"
              >{t.title}</button>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                {t.delivered_at && <span>{new Date(t.delivered_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}
                {t.assignee_name && <span>· {t.assignee_name}</span>}
                {t.work_product_url && (
                  <a href={t.work_product_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline">
                    <ExternalLink className="h-3 w-3" />{t.work_product_label || "Open"}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {latest.length > 0 && (
        <div className="mt-4 border-t border-border/40 pt-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Latest from the team</p>
          <ul className="mt-2 space-y-2">
            {latest.map((u) => (
              <li key={u.id} className="text-[11px] text-muted-foreground">
                <span className="text-foreground/80">{u.author_name || "Adam's team"}</span> ·{" "}
                {new Date(u.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                <p className="mt-0.5 whitespace-pre-wrap">{u.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DeliveredRail;
