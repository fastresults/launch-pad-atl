import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAttendees } from "@/lib/pipeline.functions";

export const Route = createFileRoute("/_authenticated/_admin/admin/attendees")({
  component: AttendeesPage,
  head: () => ({ meta: [{ title: "Attendees — Admin" }] }),
});

function AttendeesPage() {
  const fn = useServerFn(listAttendees);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "attendees"], queryFn: () => fn() });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Attendees"
        description="Active founders in a cohort. Open one to view their profile, workflow progress, deliverables, and media."
      />

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Intake</th>
              <th className="px-4 py-3">Pending review</th>
              <th className="px-4 py-3">Published</th>
            </tr>
          </thead>
          <tbody>
            {(data?.attendees ?? []).map((a) => (
              <tr key={a.user_id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <Link to="/admin/attendees/$userId" params={{ userId: a.user_id }} className="hover:underline">
                    {a.display_name ?? "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.attendee?.business_name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {a.attendee?.intake_completed_at ? "Complete" : "—"}
                </td>
                <td className="px-4 py-3">{a.counts.pending}</td>
                <td className="px-4 py-3">{a.counts.published}</td>
              </tr>
            ))}
            {data && data.attendees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No attendees yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
