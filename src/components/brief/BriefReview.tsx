import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Pencil, ArrowLeft, RotateCcw } from "lucide-react";
import { BRIEF_FIELDS } from "@/lib/workflow";
import { resetMyBrief } from "@/lib/brief.functions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

type Props = {
  values: Record<string, string>;
  onEdit: (idx: number) => void;
  onContinueDiscovery?: () => void;
};

export function BriefReview({ values, onEdit, onContinueDiscovery }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const reset = useMutation({
    mutationFn: () => resetMyBrief(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my", "brief"] });
      toast.success("Brief cleared. Starting fresh.");
      setConfirmOpen(false);
      navigate("/dashboard/brief");
      // force the wizard to reinitialise to question 1
      setTimeout(() => window.location.reload(), 50);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Reset failed"),
  });
  return (
    <div className="mt-10 space-y-5">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
          Your answers
        </h1>
        <p className="mt-2 text-muted-foreground">
          Everything you've told us. Tap any answer to refine it — your build picks up the change instantly.
        </p>
      </div>

      <ul className="space-y-3">
        {BRIEF_FIELDS.map((f, i) => {
          const v = (values[f.key] ?? "").trim();
          return (
            <li
              key={f.key}
              className="rounded-2xl border border-white/10 bg-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Question {i + 1}
                  </div>
                  <div className="mt-1 text-sm font-medium">{f.label}</div>
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                    {v || <span className="italic">No answer yet.</span>}
                  </p>
                </div>
                <button
                  onClick={() => onEdit(i)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 min-h-[36px]"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="pt-4 flex flex-wrap items-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-card px-5 py-2.5 text-sm hover:bg-white/5 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        {onContinueDiscovery && (
          <button
            onClick={onContinueDiscovery}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 min-h-[44px]"
          >
            Add background & market →
          </button>
        )}
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Start over
        </button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all answers?</AlertDialogTitle>
            <AlertDialogDescription>
              This wipes every answer and sends you back to question 1. Your generated
              startup assets and ventures stay untouched. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my answers</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); reset.mutate(); }}
              disabled={reset.isPending}
            >
              {reset.isPending ? "Clearing…" : "Yes, start over"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
