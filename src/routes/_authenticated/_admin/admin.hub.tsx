// @ts-nocheck
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { adminListSnapshots } from "@/lib/foundersHub.functions";

export default function AdminHubPage() {
  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ["admin", "hub", "snapshots"],
    queryFn: adminListSnapshots,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Founders Hub"
        description="All ventures across approved registrants. Grant Founders Hub access from the Members page."
      />

      <Link
        to="/admin/hub/new"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-card px-4 py-2 text-xs font-medium hover:bg-white/5"
      >
        <Plus className="h-3.5 w-3.5" /> New venture (admin only)
      </Link>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : snapshots.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No ventures yet.</div>
        ) : (
          snapshots.map((s: any) => (
            <div key={s.id} className="flex flex-col gap-2 border-t border-white/5 p-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{s.company_name || "Untitled venture"}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">{s.status}</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {s.business_concept ?? s.website_url ?? ""}
                </p>
              </div>
              <Link to={`/admin/attendees/${s.user_id}`} className="shrink-0 text-xs text-muted-foreground underline">
                View attendee →
              </Link>
            </div>

          ))
        )}
      </div>
    </div>
  );
}
