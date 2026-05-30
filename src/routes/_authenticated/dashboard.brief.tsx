import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyBrief, updateBriefField, summarizeBriefBlock } from "@/lib/brief.functions";
import { summarizeFounderProfile, summarizeMarketProfile } from "@/lib/discovery.functions";
import { BRIEF_FIELDS } from "@/lib/workflow";
import {
  BRIEF_BLOCKS,
  QA_BLOCKS,
  TOTAL_BRIEF_STEPS,
  blockForFieldIndex,
  firstIndexOfBlock,
  isLastFieldOfBlock,
  type BriefBlock,
} from "@/lib/brief-blocks";
import { VoiceField } from "@/components/voice/VoiceField";
import { BlockCheckpoint } from "@/components/brief/BlockCheckpoint";
import { BriefReview } from "@/components/brief/BriefReview";
import { FounderBlock } from "@/components/brief/FounderBlock";
import { MarketBlock } from "@/components/brief/MarketBlock";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const briefSearchSchema = z.object({
  review: z.coerce.number().optional(),
});

export const Route = createFileRoute("/_authenticated/dashboard/brief")({
  component: BriefWizard,
  validateSearch: briefSearchSchema,
  head: () => ({ meta: [{ title: "My startup — Startup Labs" }] }),
});

type Mode = "question" | "checkpoint" | "founder" | "market" | "review";

function BriefWizard() {
  const getFn = useServerFn(getMyBrief);
  const saveFn = useServerFn(updateBriefField);
  const summarizeQaFn = useServerFn(summarizeBriefBlock);
  const summarizeFounderFn = useServerFn(summarizeFounderProfile);
  const summarizeMarketFn = useServerFn(summarizeMarketProfile);
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data, refetch } = useQuery({ queryKey: ["my", "brief"], queryFn: () => getFn() });
  const [values, setValues] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState<Mode>("question");
  const [checkpointBlock, setCheckpointBlock] = useState<BriefBlock | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [editingFromReview, setEditingFromReview] = useState(false);

  useEffect(() => {
    if (!data?.brief) return;
    const init: Record<string, string> = {};
    for (const f of BRIEF_FIELDS) init[f.key] = (data.brief[f.key as keyof typeof data.brief] as string) ?? "";
    setValues(init);
    if (initialized) return;
    const firstEmpty = BRIEF_FIELDS.findIndex((f) => !init[f.key]);
    const allDone = firstEmpty === -1;
    if (allDone || search.review === 1) {
      setMode("review");
    } else {
      setIdx(firstEmpty);
    }
    setInitialized(true);
  }, [data, initialized, search.review]);

  const total = BRIEF_FIELDS.length;
  const current = BRIEF_FIELDS[idx];
  const value = values[current.key] ?? "";
  const answeredCount = useMemo(
    () => BRIEF_FIELDS.filter((f) => (values[f.key] ?? "").trim().length > 0).length,
    [values],
  );

  const founderBlock = BRIEF_BLOCKS.find((b) => b.kind === "founder")!;
  const marketBlock = BRIEF_BLOCKS.find((b) => b.kind === "market")!;

  // Approximate step number across all 5 blocks
  const stepNumber = useMemo(() => {
    let n = 0;
    if (mode === "question") {
      n = idx + 1;
      const currentBlock = blockForFieldIndex(idx);
      for (const b of QA_BLOCKS) if (b.id < currentBlock.id) n += 1;
    } else if (mode === "checkpoint" && checkpointBlock) {
      n = 0;
      for (const b of QA_BLOCKS) {
        n += b.fieldKeys.length;
        if (b.id === checkpointBlock.id) { n += 1; break; }
        n += 1;
      }
      // founder / market checkpoints
      if (checkpointBlock.kind === "founder") n = BRIEF_FIELDS.length + QA_BLOCKS.length + 2;
      if (checkpointBlock.kind === "market") n = TOTAL_BRIEF_STEPS;
    } else if (mode === "founder") {
      n = BRIEF_FIELDS.length + QA_BLOCKS.length + 1;
    } else if (mode === "market") {
      n = BRIEF_FIELDS.length + QA_BLOCKS.length + 3;
    }
    return n;
  }, [mode, checkpointBlock, idx]);

  const save = async (key: string) => {
    try {
      await saveFn({ data: { field: key as never, value: values[key] ?? "" } });
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const goNext = async () => {
    await save(current.key);
    if (editingFromReview) {
      setEditingFromReview(false);
      setMode("review");
      return;
    }
    const endingBlock = isLastFieldOfBlock(idx);
    if (endingBlock) {
      setCheckpointBlock(endingBlock);
      setMode("checkpoint");
      return;
    }
    if (idx < total - 1) setIdx(idx + 1);
  };

  const continueFromCheckpoint = () => {
    if (!checkpointBlock) return;
    // QA → next QA, or into founder block after last QA
    if (checkpointBlock.kind === "qa") {
      const nextQa = QA_BLOCKS.find((b) => b.id === checkpointBlock.id + 1);
      if (nextQa) {
        setIdx(firstIndexOfBlock(nextQa.id));
        setMode("question");
        setCheckpointBlock(null);
      } else {
        setMode("founder");
        setCheckpointBlock(null);
      }
      return;
    }
    if (checkpointBlock.kind === "founder") {
      setMode("market");
      setCheckpointBlock(null);
      return;
    }
    if (checkpointBlock.kind === "market") {
      toast.success("All done. Your AI has the full picture.");
      navigate({ to: "/dashboard" });
    }
  };

  const editFromCheckpoint = () => {
    if (!checkpointBlock) return;
    if (checkpointBlock.kind === "qa") {
      setIdx(firstIndexOfBlock(checkpointBlock.id));
      setMode("question");
    } else if (checkpointBlock.kind === "founder") {
      setMode("founder");
    } else if (checkpointBlock.kind === "market") {
      setMode("market");
    }
    setCheckpointBlock(null);
  };

  const goBack = () => {
    if (idx > 0) setIdx(idx - 1);
  };

  if (mode === "review") {
    return (
      <div className="mx-auto max-w-2xl">
        <BriefReview
          values={values}
          onEdit={(i) => {
            setEditingFromReview(true);
            setCheckpointBlock(null);
            setIdx(i);
            setMode("question");
          }}
          onContinueDiscovery={() => {
            setMode("founder");
            setCheckpointBlock(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {mode === "checkpoint" && checkpointBlock
            ? `Checkpoint · ${checkpointBlock.title}`
            : mode === "founder"
              ? "About you"
              : mode === "market"
                ? "Your market & model"
                : `Question ${idx + 1} of ${total}`}
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {answeredCount}/{total} answered
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${Math.min(100, (stepNumber / TOTAL_BRIEF_STEPS) * 100)}%` }}
        />
      </div>

      {mode === "checkpoint" && checkpointBlock ? (
        <div className="mt-10">
          <BlockCheckpoint
            block={checkpointBlock}
            blockIndex={checkpointBlock.id}
            totalBlocks={BRIEF_BLOCKS.length}
            summarize={
              checkpointBlock.kind === "qa"
                ? () => summarizeQaFn({ data: { block: checkpointBlock.id as 1 | 2 | 3 } })
                : checkpointBlock.kind === "founder"
                  ? () => summarizeFounderFn()
                  : () => summarizeMarketFn()
            }
            cacheKey={[checkpointBlock.kind, checkpointBlock.id]}
            onContinue={continueFromCheckpoint}
            onEdit={editFromCheckpoint}
          />
        </div>
      ) : mode === "founder" ? (
        <FounderBlock
          onDone={() => {
            setCheckpointBlock(founderBlock);
            setMode("checkpoint");
          }}
        />
      ) : mode === "market" ? (
        <MarketBlock
          onDone={() => {
            setCheckpointBlock(marketBlock);
            setMode("checkpoint");
          }}
        />
      ) : (
        <>
          <div className="mt-10 space-y-6">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
              {current.label}
            </h1>
            <p className="text-muted-foreground">
              You can talk instead of type. Tap the mic, just speak naturally.
            </p>

            <VoiceField
              label=""
              value={value}
              onChange={(v) => setValues((s) => ({ ...s, [current.key]: v }))}
              placeholder={current.placeholder}
              multiline={current.multiline}
              context={current.label}
            />
          </div>

          <div className="mt-10 flex items-center justify-between gap-3">
            <button
              onClick={goBack}
              disabled={idx === 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={goNext}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90 min-h-[44px]"
            >
              {idx === total - 1 ? (
                <>I'm done <Check className="h-4 w-4" /></>
              ) : (
                <>Next <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </div>

          <div className="mt-12">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Jump to any question</div>
            <div className="flex flex-wrap gap-1.5">
              {BRIEF_FIELDS.map((f, i) => {
                const answered = (values[f.key] ?? "").trim().length > 0;
                const active = i === idx;
                return (
                  <button
                    key={f.key}
                    onClick={() => {
                      setMode("question");
                      setCheckpointBlock(null);
                      setIdx(i);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : answered
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    }`}
                    title={f.label}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
