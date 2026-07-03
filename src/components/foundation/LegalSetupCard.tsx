// @ts-nocheck
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Scale, ArrowRight, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getMyLegalSetup } from "@/lib/legal-setup.functions";
import { buildLegalSteps } from "@/lib/legal-setup";
import { getStateByCode } from "@/lib/legal-setup-states";

export function LegalSetupCard() {
  const { data } = useQuery({ queryKey: ["my", "legal-setup"], queryFn: getMyLegalSetup });
  const state = getStateByCode(data?.entity_state || "GA");
  const steps = buildLegalSteps(state);
  const completedMap = data?.steps_completed ?? {};
  const done = steps.filter((s) => completedMap[s.key]).length;
  const pct = Math.round((done / steps.length) * 100);

  return (
    <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Legal Setup — Form your Georgia business</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Step-by-step walkthrough: entity choice, name reservation, Registered Agent, Georgia Articles of Organization, IRS FEIN, Operating Agreement, and the post-formation checklist. Everything you need to be legal, bankable, and ready to sign your first contract.
          </p>
          <p className="mt-2 flex items-start gap-1.5 text-xs italic text-muted-foreground/80">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>A few of these steps happen outside the workshop — filings, ID numbers, and signatures you'll complete on your own time. This checklist keeps everything in one place so nothing slips.</span>
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/legal-setup">
            {done === 0 ? "Start walkthrough" : done === GEORGIA_LEGAL_STEPS.length ? "Review" : "Continue"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Progress value={pct} className="h-2 flex-1" />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {done === GEORGIA_LEGAL_STEPS.length && <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />}
          {done} / {GEORGIA_LEGAL_STEPS.length} steps
        </div>
      </div>
    </div>
  );
}
