// @ts-nocheck
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight } from "lucide-react";
import { adminListSnapshots } from "@/lib/foundersHub.functions";
import { useAuth } from "@/hooks/use-auth";

function VentureRow({ s, mine }: { s: any; mine: boolean }) {
  return (
    <div className="flex flex-col gap-2 border-t border-border p-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/dashboard/hub/${s.id}`} className="font-medium hover:underline">
            {s.company_name || "Untitled venture"}
          </Link>
          <Badge variant="outline" className="text-[10px] uppercase">{s.status}</Badge>
          {mine && <Badge className="text-[10px] uppercase">Mine</Badge>}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {s.business_concept ?? s.website_url ?? ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Link
          to={`/dashboard/hub/${s.id}`}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted/40"
        >
          Open venture <ArrowRight className="h-3 w-3" />
        </Link>
        {!mine && (
          <Link to={`/admin/attendees/${s.user_id}`} className="text-xs text-muted-foreground underline">
            View attendee →
          </Link>
        )}
      </div>
    </div>
  );
}

export default function AdminHubPage() {
  const { user } = useAuth();
  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ["admin", "hub", "snapshots"],
    queryFn: adminListSnapshots,
  });

  const mine = snapshots.filter((s: any) => s.user_id === user?.id);
  const others = snapshots.filter((s: any) => s.user_id !== user?.id);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Founders Hub"
        description="Your own ventures plus every venture across approved registrants. Grant Founders Hub access from the Members page."
      />

      <div className="flex flex-wrap gap-2">
        <Link
          to="/admin/hub/new"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium hover:bg-muted/40"
        >
          <Plus className="h-3.5 w-3.5" /> New venture (admin only)
        </Link>
        <Link
          to="/dashboard/hub"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium hover:bg-muted/40"
        >
          My ventures workspace <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">Loading…</div>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground">My ventures</h2>
            <div className="overflow-hidden rounded-2xl border border-border">
              {mine.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  You don't own a venture yet — create one above.
                </div>
              ) : (
                mine.map((s: any) => <VentureRow key={s.id} s={s} mine />)
              )}
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground">All other ventures</h2>
            <div className="overflow-hidden rounded-2xl border border-border">
              {others.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No other ventures yet.</div>
              ) : (
                others.map((s: any) => <VentureRow key={s.id} s={s} mine={false} />)
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

