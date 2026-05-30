import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyBrief, updateBriefField } from "@/lib/brief.functions";
import { BRIEF_FIELDS } from "@/lib/workflow";
import {
  BRIEF_BLOCKS,
  TOTAL_BRIEF_STEPS,
  blockForFieldIndex,
  firstIndexOfBlock,
  isLastFieldOfBlock,
  type BriefBlock,
} from "@/lib/brief-blocks";
import { VoiceField } from "@/components/voice/VoiceField";
import { BlockCheckpoint } from "@/components/brief/BlockCheckpoint";
import { BriefReview } from "@/components/brief/BriefReview";
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

type Mode = "question" | "checkpoint" | "review";

function BriefWizard() {
  const getFn = useServerFn(getMyBrief);
  const saveFn = useServerFn(updateBriefField);
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

  // Step number across questions + checkpoints
  const stepNumber = useMemo(() => {
    if (mode === "checkpoint" && checkpointBlock) {
      // questions in completed blocks + checkpoints in completed (incl. current)
      let n = 0;
      for (const b of BRIEF_BLOCKS) {
        n += b.fieldKeys.length;
        if (b.id === checkpointBlock.id) {
          n += 1; // the checkpoint itself
          break;
        }
        n += 1; // checkpoint for the prior block
      }
      return n;
    }
    // question mode: questions before idx + checkpoints for completed prior blocks
    let n = idx + 1;
    const currentBlock = blockForFieldIndex(idx);
    for (const b of BRIEF_BLOCKS) {
      if (b.id < currentBlock.id) n += 1;
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
    // Editing from a completed brief returns to review, no checkpoint replay
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
    const nextBlockId = checkpointBlock.id + 1;
    const nextBlock = BRIEF_BLOCKS.find((b) => b.id === nextBlockId);
    if (nextBlock) {
      setIdx(firstIndexOfBlock(nextBlock.id));
      setMode("question");
      setCheckpointBlock(null);
    } else {
      toast.success("All done. Your AI has everything it needs.");
      navigate({ to: "/dashboard" });
    }
  };

  const editFromCheckpoint = () => {
    if (!checkpointBlock) return;
    setIdx(firstIndexOfBlock(checkpointBlock.id));
    setMode("question");
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
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header + progress */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {mode === "checkpoint" && checkpointBlock
            ? `Checkpoint ${checkpointBlock.id} of ${BRIEF_BLOCKS.length}`
            : `Question ${idx + 1} of ${total}`}
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {answeredCount}/{total} answered
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${(stepNumber / TOTAL_BRIEF_STEPS) * 100}%` }}
        />
      </div>

      {mode === "checkpoint" && checkpointBlock ? (
        <div className="mt-10">
          <BlockCheckpoint
            block={checkpointBlock}
            blockIndex={checkpointBlock.id}
            totalBlocks={BRIEF_BLOCKS.length}
            onContinue={continueFromCheckpoint}
            onEdit={editFromCheckpoint}
          />
        </div>
      ) : (
        <>
          {/* The question */}
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

          {/* Nav */}
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
                <>
                  I'm done <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* Skip-to-question grid */}
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
