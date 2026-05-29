import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminStats, listRegistrations } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/_admin/admin/")({
  component: AdminDashboard,
  head: () => ({ meta: [{ title: "Admin dashboard" }] }),
});

function AdminDashboard() {
  const statsFn = useServerFn(getAdminStats);
  const listFn = useServerFn(listRegistrations);

  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: () => statsFn() });
  const recent = useQuery({ queryKey: ["admin", "registrations"], queryFn: () => listFn() });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Workshop registrations and account overview.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total registrations" value={stats.data?.total} />
        <StatCard label="Pending" value={stats.data?.pending} />
        <StatCard label="Confirmed" value={stats.data?.confirmed} />
        <StatCard label="Accounts" value={stats.data?.users} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Recent registrations
        </h2>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Idea</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(recent.data?.registrations ?? []).slice(0, 8).map((r) => (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.email}</td>
                  <td className="px-4 py-3 text-muted-foreground line-clamp-1 max-w-md">
                    {r.business_idea}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-white/5 px-2 py-1 text-xs">{r.status}</span>
                  </td>
                </tr>
              ))}
              {recent.data && recent.data.registrations.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No registrations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value ?? "—"}</div>
    </div>
  );
}
