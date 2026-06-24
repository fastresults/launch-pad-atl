// @ts-nocheck
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FoundersHubGate } from "@/components/hub/FoundersHubGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listSnapshots, listDocumentTypes } from "@/lib/foundersHub.functions";
import { Plus, ArrowRight, Sparkles } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  input: "Draft",
  enriching: "Enriching",
  review: "Review",
  generating: "Generating",
  complete: "Complete",
  archived: "Archived",
};

export default function HubLibraryPage() {
  return (
    <FoundersHubGate>
      <LibraryInner />
    </FoundersHubGate>
  );
}

function LibraryInner() {
  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ["hub", "snapshots"],
    queryFn: listSnapshots,
  });
  const { data: types = [] } = useQuery({
    queryKey: ["hub", "types"],
    queryFn: listDocumentTypes,
  });
  const totalDocs = types.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Founders Hub
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your ventures</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Turn a single business concept into {totalDocs || 20} investor-ready documents.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/hub/new">
            <Plus className="mr-1.5 h-4 w-4" /> New venture
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-card p-8 text-sm text-muted-foreground">
          Loading…
        </div>
      ) : snapshots.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {snapshots.map((s) => (
            <SnapshotCard key={s.id} snapshot={s} totalDocs={totalDocs} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-card/40 p-10 text-center">
      <Sparkles className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Start your first venture</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Drop in a URL or describe your concept. We'll enrich it with market research,
        let you review the brief, then generate a full set of investor-ready documents.
      </p>
      <Button asChild className="mt-5">
        <Link to="/dashboard/hub/new">
          <Plus className="mr-1.5 h-4 w-4" /> New venture
        </Link>
      </Button>
    </div>
  );
}

function SnapshotCard({ snapshot, totalDocs }: { snapshot: any; totalDocs: number }) {
  const status = STATUS_LABEL[snapshot.status] ?? snapshot.status;
  const title = snapshot.company_name || snapshot.business_concept?.slice(0, 60) || "Untitled venture";
  const tone =
    snapshot.status === "complete"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : snapshot.status === "enriching" || snapshot.status === "generating"
        ? "border-amber-500/30 bg-amber-500/5"
        : "border-white/10";

  return (
    <Link
      to={`/dashboard/hub/${snapshot.id}`}
      className={`group block rounded-2xl border ${tone} bg-card p-5 transition hover:border-white/30`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{title}</h3>
          {snapshot.website_url && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{snapshot.website_url}</p>
          )}
        </div>
        <Badge variant="outline" className="text-[10px] uppercase">{status}</Badge>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
        {snapshot.business_concept}
      </p>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>0 / {totalDocs || 20} documents</span>
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
