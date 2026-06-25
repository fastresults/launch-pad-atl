import { useQuery } from "@tanstack/react-query";
import type { BriefBlock } from "@/lib/brief-blocks";
import { ChevronRight, Pencil, Sparkles } from "lucide-react";

type SummaryResult = { summary: string; bullets: string[]; cached?: boolean };
type Answer = { label: string; value: string };

type Props = {
  block: BriefBlock;
  blockIndex: number; // 1-based
  totalBlocks: number;
  answers: Answer[];
  summarize: () => Promise<SummaryResult>;
  cacheKey: ReadonlyArray<unknown>;
  onContinue: () => void;
  onEdit: () => void;
  editLabel?: string;
};

export function BlockCheckpoint({
  block,
  blockIndex,
  totalBlocks,
  answers,
  summarize,
  cacheKey,
  onContinue,
  onEdit,
  editLabel = "Edit my answers",
}: Props) {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["brief", "summary", ...cacheKey],
    queryFn: () => summarize(),
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  const filled = answers.filter((a) => (a.value ?? "").trim().length > 0);
  const aiLoading = isLoading || isFetching;
  const hasSummary = !!data && (data.summary || (data.bullets && data.bullets.length > 0));

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Checkpoint · Block {blockIndex} of {totalBlocks}
        </div>
        <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
          {block.checkpointHeading}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Quick recap before we move on — make sure we heard you right. You can edit anything, or keep going.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
        {/* AI narrative */}
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI recap
          </div>
          {aiLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-muted/40 rounded animate-pulse w-11/12" />
              <div className="h-4 bg-muted/40 rounded animate-pulse w-10/12" />
              <div className="h-4 bg-muted/40 rounded animate-pulse w-9/12" />
            </div>
          ) : isError ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                AI recap unavailable right now — your answers are below.
                {error instanceof Error ? ` (${error.message})` : ""}
              </p>
              <button onClick={() => refetch()} className="text-sm text-primary hover:underline">
                Try again
              </button>
            </div>
          ) : hasSummary ? (
            <div className="space-y-4">
              {data!.summary ? (
                <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">{data!.summary}</p>
              ) : null}
              {data!.bullets?.length ? (
                <ul className="space-y-2 pl-1">
                  {data!.bullets.map((b, i) => (
                    <li key={i} className="flex gap-3 text-sm text-foreground/90">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recap generated — your answers are below.</p>
          )}
        </div>

        {/* Always-on user answers */}
        {filled.length > 0 && (
          <div className="border-t border-border pt-5">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
              Your answers
            </div>
            <dl className="space-y-4">
              {filled.map((a, i) => (
                <div key={i}>
                  <dt className="text-xs text-muted-foreground">{a.label}</dt>
                  <dd className="mt-1 text-sm text-foreground whitespace-pre-wrap">{a.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground min-h-[44px]"
        >
          <Pencil className="h-4 w-4" /> {editLabel}
        </button>
        <button
          onClick={onContinue}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90 min-h-[44px]"
        >
          Looks right — continue <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
