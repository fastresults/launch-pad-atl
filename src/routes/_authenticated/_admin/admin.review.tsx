import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listReviewQueue } from "@/lib/pipeline.functions";

export const Route = createFileRoute("/_authenticated/_admin/admin/review")({
  component: ReviewPage,
  head: () => ({ meta: [{ title: "Review queue — Admin" }] }),
});

function ReviewPage() {
  const fn = useServerFn(listReviewQueue);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "review"], queryFn: () => fn() });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Review queue"
        description="Signups with incomplete intake or missing materials. Manually unlock a founder's dashboard when an exception is needed."
      />

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Attendee</th>
              <th className="px-4 py-3">Deliverable</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(data?.queue ?? []).map((r) => {
              const t = r.deliverable_types as { label?: string; stage_label?: string | null } | null;
              const p = (r as { profile?: { email?: string; display_name?: string } | null }).profile;
              return (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="px-4 py-3">{p?.display_name ?? p?.email ?? r.user_id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{t?.label ?? r.deliverable_key}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t?.stage_label ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.updated_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/admin/attendees/$userId/deliverables/$key"
                      params={{ userId: r.user_id, key: r.deliverable_key }}
                      className="text-primary hover:underline"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {data && data.queue.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nothing pending. Good work.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
