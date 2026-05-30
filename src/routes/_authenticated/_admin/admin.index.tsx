import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminStats, listRegistrations } from "@/lib/admin.functions";
import { listApplications } from "@/lib/applications-admin.functions";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/_admin/admin/")({
  component: AdminDashboard,
  head: () => ({ meta: [{ title: "Admin dashboard" }] }),
});

function AdminDashboard() {
  const statsFn = useServerFn(getAdminStats);
  const regFn = useServerFn(listRegistrations);
  const appsFn = useServerFn(listApplications);

  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: () => statsFn() });
  const regs = useQuery({
    queryKey: ["admin", "registrations"],
    queryFn: () => regFn(),
  });
  const apps = useQuery({
    queryKey: ["admin", "applications", "applied"],
    queryFn: () => appsFn({ data: { status: "applied" } }),
  });

  const applicationsPending =
    (apps.data?.counts.applied ?? 0) + (apps.data?.counts.reviewing ?? 0);
  const applicationsTotal = apps.data?.counts
    ? Object.values(apps.data.counts).reduce((a, b) => a + b, 0)
    : 0;
  const confirmedRegistrations = stats.data?.confirmed ?? 0;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Applicants asking to be considered and confirmed registrations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Applications to review" value={applicationsPending} />
        <StatCard label="Applications total" value={applicationsTotal} />
        <StatCard label="Registrations confirmed" value={confirmedRegistrations} />
        <StatCard label="Accounts" value={stats.data?.users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="New applications"
          empty="No applications yet."
          href="/admin/applications"
        >
          {(apps.data?.applications ?? []).slice(0, 8).map((a) => (
            <Link
              key={a.id}
              to="/admin/applications/$id"
              params={{ id: a.id }}
              className="flex items-center justify-between border-t border-white/5 px-4 py-3 first:border-t-0 hover:bg-white/5"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{a.name}</div>
                <div className="truncate text-xs text-muted-foreground">{a.email}</div>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {a.industry}
              </Badge>
            </Link>
          ))}
        </Panel>

        <Panel
          title="Confirmed registrations"
          empty="No registrations yet."
          href="/admin/registrations"
        >
          {(regs.data?.registrations ?? [])
            .filter((r) => r.status === "confirmed" || r.status === "pending")
            .slice(0, 8)
            .map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between border-t border-white/5 px-4 py-3 first:border-t-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{r.email}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {r.status}
                </Badge>
              </div>
            ))}
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  href,
  children,
  empty,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
  empty: string;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        <Link to={href} className="text-xs text-muted-foreground hover:text-foreground">
          View all →
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        {hasChildren ? (
          children
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">{empty}</div>
        )}
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
