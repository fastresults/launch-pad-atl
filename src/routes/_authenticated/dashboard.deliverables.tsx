import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyDeliverables } from "@/lib/attendee.functions";

export const Route = createFileRoute("/_authenticated/dashboard/deliverables")({
  component: DeliverablesPage,
});

type Section = { heading: string; body_markdown: string };
type Content = {
  title?: string;
  summary?: string;
  sections?: Section[];
  action_items?: string[];
};

function DeliverablesPage() {
  const listFn = useServerFn(listMyDeliverables);
  const { data, isLoading } = useQuery({ queryKey: ["my", "deliverables"], queryFn: () => listFn() });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Your deliverables</h1>
        <p className="mt-1 text-sm text-muted-foreground">Published materials prepared by your facilitator.</p>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {data && data.deliverables.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-card p-10 text-center text-sm text-muted-foreground">
          No deliverables published yet. Check back after intake is complete.
        </div>
      )}

      <div className="space-y-6">
        {(data?.deliverables ?? []).map((d) => {
          const c = (d.content_current ?? {}) as Content;
          const type = d.deliverable_types as { label?: string; description?: string | null; stage_label?: string | null } | null;
          return (
            <article key={d.id} className="rounded-2xl border border-white/10 bg-card p-6">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {type?.stage_label ?? "Deliverable"}
              </div>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">{c.title ?? type?.label ?? d.deliverable_key}</h2>
              {c.summary && <p className="mt-2 text-sm text-muted-foreground">{c.summary}</p>}
              <div className="mt-5 space-y-5">
                {(c.sections ?? []).map((s, i) => (
                  <section key={i}>
                    <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{s.heading}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{s.body_markdown}</p>
                  </section>
                ))}
              </div>
              {c.action_items && c.action_items.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Action items</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {c.action_items.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
