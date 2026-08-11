import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { OpsDashboard } from "@/components/ops/OpsDashboard";
import CreativeSignoffBoard from "@/components/creative/CreativeSignoffBoard";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/lib/use-document-title";
import {
  addOpsNote, fetchOpsRunway, setClientEditing, setOpsOwner, setOpsProof, setOpsStatus,
  type OpsAuth,
} from "@/lib/ops.functions";
import type { OpsOwnerKind, OpsStatus } from "@/lib/ops-runway";

/** Agency-side operating runway: the same dashboard the founder sees on their link. */
export default function HubOperationsPage() {
  const { snapshotId = "" } = useParams();
  const auth: OpsAuth = { kind: "hub", snapshotId };
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const tab: "runway" | "signoff" = params.get("tab") === "signoff" ? "signoff" : "runway";
  const setTab = (t: "runway" | "signoff") => {
    const next = new URLSearchParams(params);
    if (t === "signoff") next.set("tab", "signoff"); else next.delete("tab");
    setParams(next, { replace: true });
  };
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  useDocumentTitle("Operating runway");

  const venture = useQuery({
    queryKey: ["hub-ops-venture", snapshotId],
    queryFn: async () => {
      const { data } = await supabase
        .from("venture_snapshots").select("id, company_name").eq("id", snapshotId).maybeSingle();
      return data;
    },
    enabled: !!snapshotId,
  });

  const q = useQuery({
    queryKey: ["venture-ops", "hub", snapshotId],
    queryFn: () => fetchOpsRunway(auth),
    enabled: !!snapshotId,
    retry: false,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["venture-ops", "hub", snapshotId] });

  const run = async (taskId: string, fn: () => Promise<unknown>) => {
    setBusyTaskId(taskId);
    try {
      await fn();
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That didn't save.");
    } finally {
      setBusyTaskId(null);
    }
  };

  const toggleClientEditing = useMutation({
    mutationFn: (on: boolean) => setClientEditing(auth, on),
    onSuccess: () => { void refresh(); toast.success("Client access updated."); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
            <Link to={`/dashboard/hub/${snapshotId}`}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to the venture
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            {venture.data?.company_name ?? "Venture"} · Operating runway
          </h1>
        </div>
        {q.data?.state && (
          <Button
            variant="outline" size="sm"
            disabled={toggleClientEditing.isPending}
            onClick={() => toggleClientEditing.mutate(!(q.data.state?.client_can_edit ?? true))}
          >
            {q.data.state.client_can_edit ? "Make client read-only" : "Let the client edit"}
          </Button>
        )}
      </div>

      {q.isLoading && (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading the runway…
        </div>
      )}

      {q.isError && (
        <p className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-muted-foreground">
          {(q.error as Error)?.message ?? "Could not load this runway."}
        </p>
      )}

      <div className="flex gap-2">
        {(["runway", "signoff"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              tab === t
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "runway" ? "Operating runway" : "Creative sign-off"}
          </button>
        ))}
      </div>

      {tab === "signoff" && <CreativeSignoffBoard auth={auth} />}

      {tab === "runway" && q.data && (
        <OpsDashboard
          tasks={q.data.tasks}
          notes={q.data.notes}
          startedAt={q.data.state?.runway_started_at}
          canEdit
          viewerKind="agency"
          busyTaskId={busyTaskId}
          onStatus={(id, s: OpsStatus) => void run(id, () => setOpsStatus(auth, id, s))}
          onOwner={(id, o: OpsOwnerKind) => void run(id, () => setOpsOwner(auth, id, o))}
          onNote={(id, body) => void run(id, () => addOpsNote(auth, id, body))}
          onProof={(id, url) => void run(id, () => setOpsProof(auth, id, url))}
        />
      )}
    </div>
  );
}
