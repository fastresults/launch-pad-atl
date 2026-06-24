// @ts-nocheck
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
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

      <div className="overflow-hidden rounded-2xl border border-white/10">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : snapshots.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No ventures yet.</div>
        ) : (
          snapshots.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between gap-3 border-t border-white/5 p-4 first:border-t-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.company_name || "Untitled venture"}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">{s.status}</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {s.business_concept ?? s.website_url ?? ""}
                </p>
              </div>
              <Link to={`/admin/attendees/${s.user_id}`} className="text-xs text-muted-foreground underline">
                View attendee →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
