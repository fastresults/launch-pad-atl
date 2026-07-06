// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Sparkles, AlertCircle, BookOpen, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { edgeErrorMessage } from "@/lib/edge-errors";
import { FounderRoadmapDialog } from "./FounderRoadmapDialog";
import { TRACK_META, TRACK_ORDER, trackFor, type AssetTrack } from "@/lib/asset-tracks";

interface Props {
  snapshot: any;
  documentCount?: number;
  docs?: any[]; // completed venture_documents (needs document_type + updated_at)
}

export function FounderRoadmapCard({ snapshot, documentCount, docs = [] }: Props) {
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

  const coverage = snapshot?.roadmap_coverage as
    | { per_track?: Record<AssetTrack, { total: number; used: number }>; used_count?: number; total_assets?: number; skipped_labels?: string[] }
    | undefined
    | null;

  // Fallback per-track counts from `docs` when coverage is missing (legacy roadmaps).
  const fallbackPerTrack = useMemo(() => {
    const acc: Record<AssetTrack, { total: number; used: number }> = {
      Introduction: { total: 0, used: 0 }, Education: { total: 0, used: 0 },
      Tracking: { total: 0, used: 0 }, Action: { total: 0, used: 0 },
    };
    for (const d of docs) {
      if (d?.status !== "complete") continue;
      acc[trackFor(d.document_type)].total += 1;
    }
    return acc;
  }, [docs]);

  const perTrack = coverage?.per_track ?? fallbackPerTrack;
  const totalAssets = coverage?.total_assets ?? documentCount ?? 0;
  const usedCount = coverage?.used_count ?? 0;

  // Staleness — roadmap generated before latest completed asset was updated.
  const isStale = useMemo(() => {
    if (!isComplete || !snapshot?.roadmap_generated_at) return false;
    const genAt = new Date(snapshot.roadmap_generated_at).getTime();
    if (!genAt) return false;
    let latest = 0;
    for (const d of docs) {
      if (d?.status !== "complete" || !d?.updated_at) continue;
      const t = new Date(d.updated_at).getTime();
      if (t > latest) latest = t;
    }
    return latest > genAt + 60_000;
  }, [isComplete, snapshot?.roadmap_generated_at, docs]);

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
              A narrative capstone synthesized from every asset in your kit — the strategy, the market, your
              growth engine, brand, ops, money, and the 90 days after the sprint. Written to share with a
              co-founder, banker, or investor.
            </p>

            {isComplete && (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {TRACK_ORDER.map((t) => {
                    const m = TRACK_META[t];
                    const c = perTrack[t] ?? { total: 0, used: 0 };
                    if (!c.total) return null;
                    const label = coverage
                      ? `${m.short} ${c.used}/${c.total}`
                      : `${m.short} ${c.total}`;
                    return (
                      <span key={t} className={m.chip + " inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"}>
                        <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
                        {label}
                      </span>
                    );
                  })}
                  {coverage && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
                          <Info className="h-3 w-3" /> Coverage
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-80 text-xs">
                        <div className="mb-1 font-semibold">Synthesized from {usedCount} of {totalAssets} assets</div>
                        <p className="text-muted-foreground">The roadmap cites each asset it drew on inline. Assets not referenced below can be surfaced with a Regenerate.</p>
                        {coverage.skipped_labels?.length ? (
                          <div className="mt-2">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Not yet cited</div>
                            <div className="mt-1 max-h-40 overflow-y-auto text-[11px] leading-relaxed">
                              {coverage.skipped_labels.slice(0, 30).join(" · ")}
                              {coverage.skipped_labels.length > 30 ? "…" : ""}
                            </div>
                          </div>
                        ) : null}
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Generated {snapshot.roadmap_generated_at ? new Date(snapshot.roadmap_generated_at).toLocaleString() : ""}
                  {snapshot.roadmap_word_count ? ` · ${snapshot.roadmap_word_count.toLocaleString()} words` : ""}
                  {typeof snapshot.roadmap_quality_score === "number" ? ` · Quality ${snapshot.roadmap_quality_score}/100` : ""}
                </div>
                {isStale && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300">
                    <AlertCircle className="h-3 w-3" /> Your kit has changed since this was written — regenerate to fold it in.
                  </div>
                )}
              </>
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
                  <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Synthesizing every asset…</>
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
        coverage={coverage ?? null}
        isStale={isStale}
      />
    </>
  );
}
