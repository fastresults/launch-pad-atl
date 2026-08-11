import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { resetMyBrief } from "@/lib/brief.functions";
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
import { NextActionCard } from "@/components/dashboard/NextActionCard";

type Props = {
  answered: number;
  total: number;
};

export function BriefStatusCard({ answered, total }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const reset = useMutation({
    mutationFn: () => resetMyBrief(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my", "brief"] });
      qc.invalidateQueries({ queryKey: ["my", "workflow"] });
      toast.success("Brief cleared. Starting fresh.");
      navigate("/dashboard/brief");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Reset failed"),
  });

  if (answered === 0) {
    return (
      <NextActionCard
        eyebrow="Pre-work"
        title="Answer 10 quick questions about your startup."
        description={
          <>
            You can talk instead of type. We use these answers all day
            during the workshop to build your 25 startup assets. You're <strong className="text-foreground">0 of {total}</strong> done.
          </>
        }
        primary={{ to: "/dashboard/brief", label: "Start" }}
      />
    );
  }

  if (answered < total) {
    return (
      <NextActionCard
        eyebrow="Pre-work"
        title="Pick up where you left off."
        description={
          <>
            You're <strong className="text-foreground">{answered} of {total}</strong> done.
            Keep going — your AI reads every answer.
          </>
        }
        primary={{ to: "/dashboard/brief", label: "Keep going" }}
      />
    );
  }

  // complete
  return (
    <>
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 md:p-10 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" /> Brief complete
        </div>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
          Your startup brief is locked in.
        </h2>
        <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl">
          All {total} answers saved. Your AI will read from this throughout your 14-Day Sprint.
          You can review or rewrite anything below.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/dashboard/brief?review=1"
            className="inline-flex items-center rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90 min-h-[44px]"
          >
            Review my answers
          </Link>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Start over
          </button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all {total} answers?</AlertDialogTitle>
            <AlertDialogDescription>
              This sends you back to question 1 with a blank brief. Your generated
              startup assets and ventures stay untouched. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my answers</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                reset.mutate();
              }}
              disabled={reset.isPending}
            >
              {reset.isPending ? "Clearing…" : "Yes, start over"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
