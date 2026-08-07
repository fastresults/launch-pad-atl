// @ts-nocheck
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Scale, ArrowRight, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getMyLegalSetup } from "@/lib/legal-setup.functions";
import { buildLegalSteps } from "@/lib/legal-setup";
import { getStateByCode } from "@/lib/legal-setup-states";
import { resolveEntityState } from "@/lib/entity-state";
import { getMyBriefLocation } from "@/lib/entity-state.functions";

export function LegalSetupCard() {
  const { data } = useQuery({ queryKey: ["my", "legal-setup"], queryFn: getMyLegalSetup });
  const { data: brief } = useQuery({ queryKey: ["my", "brief-location"], queryFn: getMyBriefLocation });
  const resolved = resolveEntityState({
    savedState: data?.entity_state,
    savedSource: data?.entity_state_source,
    briefRegion: brief?.region,
    briefCity: brief?.city,
  });
  const state = getStateByCode(resolved.code);
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
            <h3 className="text-lg font-semibold">Legal Setup — Form your {state.name} startup</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Step-by-step walkthrough: entity choice, name reservation, Registered Agent, {state.articlesFormName}, IRS FEIN, Operating Agreement, and the post-formation checklist. Everything you need to be legal, bankable, and ready to sign your first contract in {state.name}.
          </p>
          <p className="mt-2 flex items-start gap-1.5 text-xs italic text-muted-foreground/80">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>Filing in a different state? Change your state on the walkthrough page and every step, fee, and office address updates.</span>
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/legal-setup">
            {done === 0 ? "Start walkthrough" : done === steps.length ? "Review" : "Continue"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Progress value={pct} className="h-2 flex-1" />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {done === steps.length && <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />}
          {done} / {steps.length} steps
        </div>
      </div>
    </div>
  );
}
