// @ts-nocheck
import { Link } from 'react-router-dom';
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useQuery } from "@tanstack/react-query";
import { } from 'react-router-dom';
import { listReviewQueue } from "@/lib/pipeline.functions";


export default function ReviewPage() {
  
  const { data, isLoading } = useQuery({ queryKey: ["admin", "review"], queryFn: () => listReviewQueue() });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Review queue"
        description="Signups with incomplete intake or missing materials. Manually unlock a founder's dashboard when an exception is needed."
      />

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
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
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">{p?.display_name ?? p?.email ?? r.user_id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{t?.label ?? r.deliverable_key}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t?.stage_label ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.updated_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/attendees/${r.user_id}/deliverables/${r.deliverable_key}`}
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
