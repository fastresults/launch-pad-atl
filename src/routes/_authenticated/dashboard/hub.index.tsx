// @ts-nocheck
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FoundersHubGate } from "@/components/hub/FoundersHubGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  listSnapshots,
  listDocumentTypes,
  archiveSnapshot,
  unarchiveSnapshot,
  setFavorite,
  adminDeleteSnapshot,
} from "@/lib/foundersHub.functions";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { getTrack } from "@/lib/tracks";
import { Plus, ArrowRight, Sparkles, Star, MoreHorizontal, Archive, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABEL: Record<string, string> = {
  input: "Draft",
  enriching: "Researching",
  review: "Review",
  generating: "Writing",
  complete: "Complete",
  archived: "Archived",
};

type Tab = "active" | "favorites" | "archived";

export default function HubLibraryPage() {
  return (
    <FoundersHubGate>
      <LibraryInner />
    </FoundersHubGate>
  );
}

function relativeTime(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

function LibraryInner() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("active");
  const [showComingSoon, setShowComingSoon] = useState(false);
  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ["hub", "snapshots"],
    queryFn: listSnapshots,
  });
  const { data: types = [] } = useQuery({
    queryKey: ["hub", "types"],
    queryFn: listDocumentTypes,
  });
  const totalDocs = types.length;

  const buckets = useMemo(() => {
    const active = snapshots.filter((s: any) => s.status !== "archived");
    const favorites = active.filter((s: any) => s.is_favorite);
    const archived = snapshots.filter((s: any) => s.status === "archived");
    return { active, favorites, archived };
  }, [snapshots]);

  const visible = buckets[tab];
  const hasVentures = snapshots.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Founders Hub
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your startups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Turn a single venture concept into {totalDocs || 60}+ founder-ready startup assets.
          </p>
        </div>
        {hasVentures && !isAdmin ? (
          <Button onClick={() => setShowComingSoon(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New startup
          </Button>
        ) : (
          <Button asChild>
            <Link to="/dashboard/hub/new">
              <Plus className="mr-1.5 h-4 w-4" /> New startup
            </Link>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-2">
        <TabPill active={tab === "active"} onClick={() => setTab("active")} label="Active" count={buckets.active.length} />
        <TabPill active={tab === "favorites"} onClick={() => setTab("favorites")} label="Favorites" count={buckets.favorites.length} icon={<Star className="h-3 w-3" />} />
        <TabPill active={tab === "archived"} onClick={() => setTab("archived")} label="Archived" count={buckets.archived.length} icon={<Archive className="h-3 w-3" />} />
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">Loading…</div>
      ) : visible.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((s: any) => (
            <SnapshotCard key={s.id} snapshot={s} totalDocs={totalDocs} tab={tab} isLast={snapshots.length === 1} />
          ))}
        </div>
      )}

      <AlertDialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Multiple startups coming soon</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  Running more than one venture from a single workspace is on the
                  roadmap — built for serial entrepreneurs, founders juggling
                  multiple ideas, and consultants supporting several startup
                  clients.
                </p>
                <p>
                  Additional ventures will be available as a paid upgrade. In
                  the meantime, keep sharpening the venture you already have —
                  every document, asset, and brief you generate will carry
                  forward.
                </p>
                <p className="text-xs text-muted-foreground">
                  Have questions or want early access? Reach out to support.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowComingSoon(false)}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


function TabPill({
  active,
  onClick,
  label,
  count,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-foreground text-background"
          : "border border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
      <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-background/20" : "bg-muted/40"}`}>{count}</span>
    </button>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  if (tab === "favorites") {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
        <Star className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
        <h2 className="text-lg font-semibold">No favorites yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Tap the star on any startup to keep it pinned here.
        </p>
      </div>
    );
  }
  if (tab === "archived") {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
        <Archive className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Nothing archived</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Archive a startup to clear the noise — you can always restore it. Your documents stay safe.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
      <Sparkles className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Start your first startup</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Drop in a URL or describe your concept. We'll enrich it with market research,
        let you review the brief, then generate a full set of founder-ready startup assets.
      </p>
      <Button asChild className="mt-5">
        <Link to="/dashboard/hub/new">
          <Plus className="mr-1.5 h-4 w-4" /> New startup
        </Link>
      </Button>
    </div>
  );
}

function SnapshotCard({ snapshot, totalDocs, tab, isLast }: { snapshot: any; totalDocs: number; tab: Tab; isLast?: boolean }) {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const status = STATUS_LABEL[snapshot.status] ?? snapshot.status;
  const title = snapshot.company_name || snapshot.business_concept?.slice(0, 60) || "Untitled startup";
  const isArchived = snapshot.status === "archived";
  const isFav = !!snapshot.is_favorite;

  const tone = isFav
    ? "border-status-warning/40 bg-status-warning/5"
    : isArchived
      ? "border-border bg-card/60 opacity-80"
      : snapshot.status === "complete"
        ? "border-status-success/30 bg-status-success/5"
        : snapshot.status === "enriching" || snapshot.status === "generating"
          ? "border-status-warning/30 bg-status-warning/5"
          : "border-border";

  const favMut = useMutation({
    mutationFn: (next: boolean) => setFavorite({ data: { id: snapshot.id, is_favorite: next } }),
    onSuccess: (_, next) => {
      toast.success(next ? "Favorited" : "Removed from favorites");
      qc.invalidateQueries({ queryKey: ["hub", "snapshots"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't update"),
  });

  const archiveMut = useMutation({
    mutationFn: () => archiveSnapshot({ data: { id: snapshot.id } }),
    onSuccess: () => {
      toast.success("Archived — find it in the Archived tab");
      qc.invalidateQueries({ queryKey: ["hub", "snapshots"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't archive"),
  });

  const restoreMut = useMutation({
    mutationFn: () => unarchiveSnapshot({ data: { id: snapshot.id } }),
    onSuccess: () => {
      toast.success("Restored to Active");
      qc.invalidateQueries({ queryKey: ["hub", "snapshots"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't restore"),
  });

  const deleteMut = useMutation({
    mutationFn: () => adminDeleteSnapshot({ data: { id: snapshot.id } }),
    onSuccess: () => {
      toast.success(isLast ? `Deleted "${title}" — workspace reset` : `Deleted "${title}"`);
      setConfirmDelete(false);
      setDeleteText("");
      qc.invalidateQueries({ queryKey: ["hub", "snapshots"] });
      qc.invalidateQueries({ queryKey: ["admin", "hub", "snapshots"] });
      if (isLast) {
        qc.invalidateQueries({ queryKey: ["my", "brief"] });
        qc.invalidateQueries({ queryKey: ["my", "profile"] });
        qc.invalidateQueries({ queryKey: ["my", "founder-memory"] });
        qc.invalidateQueries({ queryKey: ["attendee", "profile"] });
      }
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't delete"),
  });


  const confirmPhrase = (snapshot.company_name?.trim() || "DELETE");
  const deleteEnabled = deleteText.trim() === confirmPhrase && !deleteMut.isPending;
  const jobActive = snapshot.status === "enriching" || snapshot.status === "generating";

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className={`group relative rounded-2xl border ${tone} bg-card p-5 transition hover:border-foreground/25`}>
      {/* Card actions overlay */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1" onClick={stop}>
        {!isArchived && (
          <button
            type="button"
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
            onClick={(e) => { stop(e); favMut.mutate(!isFav); }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-status-warning"
          >
            <Star className={`h-4 w-4 ${isFav ? "fill-status-warning text-status-warning" : ""}`} />
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More actions"
              onClick={stop}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={stop}>
            {isArchived ? (
              <DropdownMenuItem onSelect={() => restoreMut.mutate()}>
                <RotateCcw className="mr-2 h-3.5 w-3.5" /> Restore to Active
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => setConfirmArchive(true)}>
                <Archive className="mr-2 h-3.5 w-3.5" /> Archive
              </DropdownMenuItem>
            )}
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setConfirmDelete(true)}
                  className="text-status-danger focus:text-status-danger"
                  title={jobActive ? "Job in progress — admin force delete" : undefined}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete venture (admin){jobActive ? " — force" : ""}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link to={`/dashboard/hub/${snapshot.id}`} className="block">
        <div className="pr-20">
          <div className="flex items-center gap-2">
            {isFav && <Star className="h-3.5 w-3.5 fill-status-warning text-status-warning" />}
            <h3 className="truncate text-base font-semibold">{title}</h3>
          </div>
          {snapshot.website_url && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{snapshot.website_url}</p>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] uppercase">{status}</Badge>
          {getTrack(snapshot.track) && (
            <Badge variant="secondary" className="text-[10px]">{getTrack(snapshot.track)!.label}</Badge>
          )}
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
          {snapshot.business_concept}
        </p>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {totalDocs ? `${snapshot.doc_count ?? 0} / ${totalDocs} assets` : `${snapshot.doc_count ?? 0} assets`}
            {snapshot.updated_at && <span className="ml-2 opacity-70">· {relativeTime(snapshot.updated_at)}</span>}
          </span>
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </div>
      </Link>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this startup?</AlertDialogTitle>
            <AlertDialogDescription>
              You can restore it from the Archived tab anytime. Your assets stay safe — nothing is deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => archiveMut.mutate()}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isAdmin && (
        <AlertDialog
          open={confirmDelete}
          onOpenChange={(o) => { setConfirmDelete(o); if (!o) setDeleteText(""); }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this venture permanently?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm">
                  <p>
                    This is an <span className="font-semibold text-status-danger">admin-only, irreversible</span> action.
                    It will permanently remove this venture and everything attached to it:
                  </p>
                  <ul className="list-inside list-disc text-xs text-muted-foreground">
                    <li>The startup record</li>
                    <li>All generated assets and revisions</li>
                    <li>All generation jobs and failure logs</li>
                    <li>Uploaded document images</li>
                  </ul>
                  {isLast && (
                    <div className="rounded-lg border border-status-warning/40 bg-status-warning/10 p-3 text-xs text-status-warning-foreground dark:text-status-warning">
                      <strong>Heads up:</strong> this is your last venture. Deleting it will also clear your Founder Brief, Profile intake, and Market answers so your next startup starts fresh.
                    </div>
                  )}
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">

                    <div><span className="text-muted-foreground">Venture:</span> <span className="font-medium">{title}</span></div>
                    <div><span className="text-muted-foreground">Owner:</span> {snapshot.user_id}</div>
                    <div><span className="text-muted-foreground">Created:</span> {snapshot.created_at ? new Date(snapshot.created_at).toLocaleString() : "—"}</div>
                  </div>
                  <div>
                    <p className="mb-1.5">
                      Type <span className="font-mono font-semibold text-foreground">{confirmPhrase}</span> to confirm.
                    </p>
                    <Input
                      autoFocus={false}
                      value={deleteText}
                      onChange={(e) => setDeleteText(e.target.value)}
                      placeholder={confirmPhrase}
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel autoFocus>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={!deleteEnabled}
                onClick={(e) => { e.preventDefault(); if (deleteEnabled) deleteMut.mutate(); }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40"
              >
                {deleteMut.isPending ? "Deleting…" : "Delete forever"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
