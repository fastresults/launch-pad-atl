import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listApplications, type ApplicationStatus } from "@/lib/applications-admin.functions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_admin/admin/applications/")({
  component: ApplicationsListPage,
  head: () => ({ meta: [{ title: "Applications — Admin" }] }),
});

const STATUS_OPTIONS: { value: ApplicationStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "applied", label: "Applied" },
  { value: "reviewing", label: "Reviewing" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "selected", label: "Selected" },
  { value: "waitlisted", label: "Waitlist" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

const STATUS_TONE: Record<ApplicationStatus, string> = {
  applied: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  reviewing: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  shortlisted: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  selected: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  waitlisted: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  withdrawn: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

function ApplicationsListPage() {
  const [status, setStatus] = useState<ApplicationStatus | "all">("applied");
  const [search, setSearch] = useState("");
  const listFn = useServerFn(listApplications);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "applications", status, search],
    queryFn: () =>
      listFn({
        data: {
          status: status === "all" ? undefined : status,
          search: search.trim() || undefined,
        },
      }),
  });

  const counts = data?.counts;
  const totalAll = useMemo(
    () => (counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0),
    [counts],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Founders asking to be considered for the selection cohort. Review, take notes, and
            promote selected applicants into a registration.
          </p>
        </div>
        <Input
          placeholder="Search name, email, industry…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-64"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => {
          const n =
            opt.value === "all"
              ? totalAll
              : counts
                ? counts[opt.value]
                : 0;
          const active = status === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10",
              )}
            >
              {opt.label} <span className="ml-1 opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Applied</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Industry · Stage</th>
              <th className="px-4 py-3">About startup</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {data?.applications.map((a) => (
              <tr
                key={a.id}
                className="border-t border-white/5 align-top hover:bg-white/5"
              >
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 font-medium">
                  <Link
                    to="/admin/applications/$id"
                    params={{ id: a.id }}
                    className="hover:underline"
                  >
                    {a.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {a.industry} · {a.stage}
                </td>
                <td className="px-4 py-3 text-muted-foreground line-clamp-2 max-w-md">
                  {a.about_startup}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={cn("border", STATUS_TONE[a.status as ApplicationStatus])}
                  >
                    {a.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {data && data.applications.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No applications match this filter yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
