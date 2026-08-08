import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { VentureTimeline } from "@/components/timeline/VentureTimeline";
import { TimelineBoundary } from "@/components/timeline/TimelineBoundary";
import type { TimelineScenario } from "@/lib/venture-timeline";

interface Props {
  snapshotId: string;
  /** Passed straight through from the hub so the card doesn't refetch the venture. */
  timeline: unknown;
  scenario: unknown;
  metrics?: { label: string; value: string; source?: string | null }[] | null;
  onOpenAsset?: (assetKey: string) => void;
  onAsk?: (question: string) => void;
}

/**
 * The launch cadence, mounted in the Founders Hub. Owns generation, scenario
 * persistence, and nothing about how the timeline draws itself.
 */
export function TimelineHubCard({
  snapshotId,
  timeline,
  scenario,
  metrics,
  onOpenAsset,
  onAsk,
}: Props) {
  const qc = useQueryClient();
  const [local, setLocal] = useState<unknown>(null);
  const current = local ?? timeline;

  const generate = useMutation({
    mutationFn: async (force: boolean) => {
      const { data, error } = await supabase.functions.invoke("venture-timeline", {
        body: { snapshotId, force },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as any;
    },
    onSuccess: (data) => {
      setLocal(data?.timeline ?? null);
      toast.success("Your launch cadence is ready");
      qc.invalidateQueries({ queryKey: ["hub", "snapshot", snapshotId] });
    },
    onError: (e: any) =>
      toast.error(e?.message ?? "Couldn't sequence this venture. Try again in a moment."),
  });

  const saveScenario = useMutation({
    mutationFn: async (s: TimelineScenario) => {
      const { error } = await supabase
        .from("venture_snapshots")
        .update({ venture_timeline_scenario: s as any })
        .eq("id", snapshotId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Scenario saved");
      qc.invalidateQueries({ queryKey: ["hub", "snapshot", snapshotId] });
    },
    onError: () => toast.error("Couldn't save that scenario."),
  });

  return (
    <TimelineBoundary resetKey={snapshotId}>
      <VentureTimeline
        timeline={current}
        scenario={scenario}
        metrics={metrics}
        onSaveScenario={(s) => saveScenario.mutate(s)}
        onOpenAsset={onOpenAsset}
        onAsk={onAsk}
        headerRight={
          <Button
            size="sm"
            variant={current ? "outline" : "default"}
            disabled={generate.isPending}
            onClick={() => generate.mutate(!!current)}
          >
            {generate.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : current ? (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            {current ? "Rebuild from my assets" : "Build my cadence"}
          </Button>
        }
      />
    </TimelineBoundary>
  );
}
