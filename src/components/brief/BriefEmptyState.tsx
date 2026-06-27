import { useNavigate } from "react-router-dom";
import { Sparkles, Rocket, Upload, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  resetSucceeded?: boolean;
  resetWarning?: string | null;
  onStartBlank?: () => void;
  onUploadPrefill?: () => void;
};

export function BriefEmptyState({ resetSucceeded, resetWarning, onStartBlank, onUploadPrefill }: Props) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
          Let's start your first startup.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your workspace is fresh and ready. The Startup Brief is a 10-question kickoff
          that takes about 10 minutes — we use your answers to draft your strategy, brand,
          and go-to-market plan. You can also drop in an existing deck or doc and we'll
          pre-fill the answers for you.
        </p>

        {resetWarning ? (
          <div className="mt-4 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            We couldn't fully clear your old answers, but you can still start fresh below.
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button
            size="lg"
            className="h-auto justify-between rounded-2xl px-5 py-4 text-left"
            onClick={() => navigate("/dashboard/hub/new")}
          >
            <span className="flex items-center gap-3">
              <Rocket className="h-5 w-5" />
              <span className="flex flex-col">
                <span className="text-sm font-semibold">Create a venture</span>
                <span className="text-xs font-normal opacity-80">Name it, then generate everything</span>
              </span>
            </span>
            <ArrowRight className="h-4 w-4 opacity-80" />
          </Button>

          <Button
            size="lg"
            variant="secondary"
            className="h-auto justify-between rounded-2xl px-5 py-4 text-left"
            onClick={onStartBlank}
          >
            <span className="flex items-center gap-3">
              <Sparkles className="h-5 w-5" />
              <span className="flex flex-col">
                <span className="text-sm font-semibold">Start the brief from scratch</span>
                <span className="text-xs font-normal opacity-80">Answer the 10 questions yourself</span>
              </span>
            </span>
            <ArrowRight className="h-4 w-4 opacity-80" />
          </Button>
        </div>

        {onUploadPrefill ? (
          <button
            type="button"
            onClick={onUploadPrefill}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Upload className="h-4 w-4" />
            Upload a doc to pre-fill the brief
          </button>
        ) : null}

        {resetSucceeded ? (
          <p className="mt-6 text-xs text-muted-foreground">
            Returning founder? Your old answers were cleared because no ventures remain in your workspace.
          </p>
        ) : null}
      </div>
    </div>
  );
}
