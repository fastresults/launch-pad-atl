// @ts-nocheck
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listApplications } from "@/lib/applications-admin.functions";
import { listInquiries } from "@/lib/inquiries-admin.functions";
import { listRegistrations } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, MessagesSquare, ClipboardList } from "lucide-react";

type Row = {
  id: string;
  kind: "Application" | "Inquiry" | "Registration";
  title: string;
  sub: string;
  at: string;
  to: string;
};

function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const ICONS = {
  Application: FileText,
  Inquiry: MessagesSquare,
  Registration: ClipboardList,
};

export function ActivityFeed() {
  const apps = useQuery({
    queryKey: ["admin", "applications", "all"],
    queryFn: () => listApplications({ data: { status: "all" } }),
    staleTime: 30_000,
  });
  const inquiries = useQuery({
    queryKey: ["admin", "inquiries", "all"],
    queryFn: () => listInquiries({ data: { status: "all" } }),
    staleTime: 30_000,
  });
  const regs = useQuery({
    queryKey: ["admin", "registrations"],
    queryFn: () => listRegistrations(),
    staleTime: 30_000,
  });

  const rows: Row[] = [
    ...(apps.data?.applications ?? []).map((a: any) => ({
      id: `app-${a.id}`,
      kind: "Application" as const,
      title: a.full_name ?? a.name ?? a.email ?? "Applicant",
      sub: a.status ?? "applied",
      at: a.created_at,
      to: `/admin/applications/${a.id}`,
    })),
    ...(inquiries.data?.inquiries ?? []).map((i: any) => ({
      id: `inq-${i.id}`,
      kind: "Inquiry" as const,
      title: i.name ?? i.email ?? "Inquiry",
      sub: i.subject ?? i.status ?? "new",
      at: i.last_activity_at ?? i.created_at,
      to: `/admin/inquiries/${i.id}`,
    })),
    ...(regs.data?.registrations ?? []).map((r: any) => ({
      id: `reg-${r.id}`,
      kind: "Registration" as const,
      title: r.name ?? r.email ?? "Registration",
      sub: r.status ?? "pending",
      at: r.created_at,
      to: "/admin/registrations",
    })),
  ]
    .filter((r) => r.at)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 12);

  const loading = apps.isLoading || inquiries.isLoading || regs.isLoading;

  return (
    <section aria-labelledby="recent-activity">
      <h2
        id="recent-activity"
        className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
      >
        Recent activity
      </h2>
      <Card className="divide-y">
        {loading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">Nothing yet.</div>
        )}
        {rows.map((row) => {
          const Icon = ICONS[row.kind];
          return (
            <Link
              key={row.id}
              to={row.to}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{row.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {row.kind} · {row.sub}
                </div>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(row.at)}</span>
            </Link>
          );
        })}
      </Card>
    </section>
  );
}
