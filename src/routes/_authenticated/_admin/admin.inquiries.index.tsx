import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listInquiries, type InquiryStatus } from "@/lib/inquiries-admin.functions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_admin/admin/inquiries/")({
  component: InquiriesListPage,
  head: () => ({ meta: [{ title: "Inquiries — Admin" }] }),
});

const FILTERS: { value: InquiryStatus | "all"; label: string }[] = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "replied", label: "Replied" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
];

const TONE: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  in_progress: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  replied: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  closed: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

function InquiriesListPage() {
  const fn = useServerFn(listInquiries);
  const [status, setStatus] = useState<InquiryStatus | "all">("new");
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["admin", "inquiries", status, search],
    queryFn: () => fn({ data: { status, search } }),
    refetchInterval: 30_000,
  });

  const rows = q.data?.inquiries ?? [];
  const counts = q.data?.counts ?? { new: 0, in_progress: 0, replied: 0, closed: 0 };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Inquiries"
        description="Messages from the public contact form. Reply by email, then mark in progress or resolved."
      />

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const count = f.value === "all" ? undefined : counts[f.value as string] ?? 0;
          const active = status === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-white/10 text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              {count !== undefined && count > 0 && (
                <span className="ml-1.5 opacity-70">{count}</span>
              )}
            </button>
          );
        })}
        <div className="ml-auto w-full sm:w-64">
          <Input
            placeholder="Search name, email, subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10">
        {q.isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No inquiries here.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">From</th>
                <th className="px-4 py-2.5 font-medium">Subject</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-white/5 hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <Link
                      to="/admin/inquiries/$id"
                      params={{ id: r.id }}
                      className="block"
                    >
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link to="/admin/inquiries/$id" params={{ id: r.id }}>
                      <div className="truncate font-medium">{r.subject}</div>
                      <div className="line-clamp-1 text-xs text-muted-foreground">
                        {r.message}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] capitalize", TONE[r.status])}
                    >
                      {r.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(r.last_activity_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
