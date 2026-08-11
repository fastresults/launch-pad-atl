import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { OpsDashboard } from "@/components/ops/OpsDashboard";
import {
  addOpsNote, fetchOpsRunway, setOpsOwner, setOpsProof, setOpsStatus, type OpsAuth,
} from "@/lib/ops.functions";
import type { OpsOwnerKind, OpsStatus } from "@/lib/ops-runway";
import type { SharePayload } from "@/lib/venture-share.functions";

/**
 * The Operationalize view inside the public showcase. Same dashboard the agency
 * uses in the hub, reading and writing the same rows through the share token.
 */
export function ShareOpsRunway({
  token, password, payload, onOpenAsset, onConsult,
}: {
  token: string;
  password?: string;
  payload: SharePayload;
  onOpenAsset: (key: string) => void;
  onConsult: () => void;
}) {
  const auth: OpsAuth = { kind: "share", token, password };
  const qc = useQueryClient();
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["venture-ops", token],
    queryFn: () => fetchOpsRunway(auth),
    retry: false,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["venture-ops", token] });

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

  /** Showcase assets the runway can deep-link into, by document key. */
  const titleByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of payload.sections) for (const i of s.items) map.set(i.key.split(":").pop() ?? i.key, i.title);
    return map;
  }, [payload]);

  const keyToItem = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of payload.sections) for (const i of s.items) map.set(i.key.split(":").pop() ?? i.key, i.key);
    return map;
  }, [payload]);

  if (q.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your operating runway…
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <p className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-muted-foreground">
        {(q.error as Error)?.message ?? "The operating runway is unavailable right now."}
      </p>
    );
  }

  const data = q.data;
  return (
    <OpsDashboard
      tasks={data.tasks}
      notes={data.notes}
      startedAt={data.state?.runway_started_at}
      canEdit={data.canEdit}
      viewerKind="client"
      busyTaskId={busyTaskId}
      onStatus={(id, s: OpsStatus) => void run(id, () => setOpsStatus(auth, id, s))}
      onOwner={(id, o: OpsOwnerKind) => void run(id, () => setOpsOwner(auth, id, o))}
      onNote={(id, body) => void run(id, () => addOpsNote(auth, id, body))}
      onProof={(id, url) => void run(id, () => setOpsProof(auth, id, url))}
      assetTitle={(k) => titleByKey.get(k) ?? null}
      onOpenAsset={(k) => {
        const item = keyToItem.get(k);
        if (item) onOpenAsset(item);
      }}
      onConsult={onConsult}
    />
  );
}

export default ShareOpsRunway;
