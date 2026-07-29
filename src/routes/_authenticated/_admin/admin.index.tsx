// @ts-nocheck
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card } from "@/components/ui/card";
import { getAdminStats } from "@/lib/admin.functions";
import { TriageCards } from "@/components/admin/dashboard/TriageCards";
import { NextEventCard } from "@/components/admin/dashboard/NextEventCard";
import { QuickActions } from "@/components/admin/dashboard/QuickActions";
import { ActivityFeed } from "@/components/admin/dashboard/ActivityFeed";

export default function AdminDashboard() {
  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => getAdminStats(),
    staleTime: 30_000,
  });

  const metrics = [
    { label: "Registrations", value: stats.data?.registrations, to: "/admin/registrations" },
    { label: "Confirmed seats", value: stats.data?.confirmed, to: "/admin/registrations" },
    { label: "People with accounts", value: stats.data?.users, to: "/admin/members" },
    { label: "Open inquiries", value: stats.data?.openInquiries, to: "/admin/inquiries" },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        description="Everything waiting on you, the next event on the calendar, and where to go next."
      />

      <TriageCards />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <Link key={m.label} to={m.to} className="group">
            <Card className="h-full p-4 transition-colors group-hover:border-primary/50 group-hover:bg-accent/40">
              <div className="text-2xl font-semibold tabular-nums">
                {stats.isLoading ? "—" : (m.value ?? 0)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{m.label}</div>
            </Card>
          </Link>
        ))}
      </div>

      <NextEventCard />

      <QuickActions />

      <ActivityFeed />

      <p className="text-xs text-muted-foreground">
        Full applicant and member tables live on{" "}
        <Link to="/admin/applications" className="text-primary hover:underline">
          Applications
        </Link>{" "}
        and{" "}
        <Link to="/admin/members" className="text-primary hover:underline">
          Members
        </Link>
        .
      </p>
    </div>
  );
}
