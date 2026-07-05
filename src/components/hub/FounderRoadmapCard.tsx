// @ts-nocheck
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Sparkles, AlertCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { edgeErrorMessage } from "@/lib/edge-errors";
import { FounderRoadmapDialog } from "./FounderRoadmapDialog";

interface Props { snapshot: any; documentCount?: number; }

export function FounderRoadmapCard({ snapshot, documentCount }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const status = snapshot?.roadmap_status ?? (snapshot?.roadmap_content ? "complete" : null);
  const isGenerating = status === "generating";
  const isComplete = status === "complete" && !!snapshot?.roadmap_content;
  const isFailed = status === "failed";

  // Poll while generating
  useEffect(() => {
    if (!isGenerating) return;
    const t = setInterval(() => qc.invalidateQueries({ queryKey: ["hub", "snapshot", snapshot.id] }), 4000);
    return () => clearInterval(t);
  }, [isGenerating, qc, snapshot?.id]);

  const generate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("venture-generate-roadmap", {
        body: { snapshotId: snapshot.id },
      });
      if (error) throw new Error(error.message);
      if (data && data.ok === false) throw new Error(data.error ?? "Roadmap generation failed");
      return data;
    },
    onMutate: async () => {
      // Optimistic generating flag so the UI flips immediately
      await supabase.from("venture_snapshots").update({ roadmap_status: "generating" }).eq("id", snapshot.id);
      qc.invalidateQueries({ queryKey: ["hub", "snapshot", snapshot.id] });
    },
    onSuccess: () => {
      toast.success("Your Founder Roadmap is ready");
      qc.invalidateQueries({ queryKey: ["hub", "snapshot", snapshot.id] });
      setOpen(true);
    },
    onError: (e: any) => toast.error(edgeErrorMessage(e, "Couldn't generate roadmap")),
  });

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 shadow-sm">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" /> The big picture
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Your Founder Roadmap</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              A narrative founder playbook synthesized from your entire 14-Day Sprint — written to share with
              co-founders and investors. Cover, verdict, the <span className="font-medium text-foreground">first 45 days</span>,
              your <span className="font-medium text-foreground">first year</span>, money, and how to talk about it.
            </p>
            {isComplete && (
              <div className="mt-2 text-[11px] text-muted-foreground">
                Generated {snapshot.roadmap_generated_at ? new Date(snapshot.roadmap_generated_at).toLocaleString() : ""}
                {snapshot.roadmap_word_count ? ` · ${snapshot.roadmap_word_count.toLocaleString()} words` : ""}
                {typeof snapshot.roadmap_quality_score === "number" ? ` · Quality ${snapshot.roadmap_quality_score}/100` : ""}
              </div>
            )}
            {isFailed && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-status-warning">
                <AlertCircle className="h-3.5 w-3.5" /> Generation failed. Try again.
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isComplete ? (
              <>
                <Button size="lg" onClick={() => setOpen(true)}>
                  <BookOpen className="mr-1.5 h-4 w-4" /> Open Founder Roadmap
                </Button>
                <Button size="sm" variant="ghost" onClick={() => generate.mutate()} disabled={generate.isPending || isGenerating}>
                  {generate.isPending || isGenerating ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-1 h-3.5 w-3.5" />
                  )}
                  Regenerate
                </Button>
              </>
            ) : (
              <Button size="lg" onClick={() => generate.mutate()} disabled={generate.isPending || isGenerating}>
                {generate.isPending || isGenerating ? (
                  <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Synthesizing every document…</>
                ) : (
                  <><Sparkles className="mr-1.5 h-4 w-4" /> Generate my Founder Roadmap</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <FounderRoadmapDialog
        open={open}
        onOpenChange={setOpen}
        companyName={snapshot?.company_name}
        content={snapshot?.roadmap_content ?? ""}
        generatedAt={snapshot?.roadmap_generated_at}
        wordCount={snapshot?.roadmap_word_count}
        qualityScore={snapshot?.roadmap_quality_score}
        documentCount={documentCount}
      />
    </>
  );
}
