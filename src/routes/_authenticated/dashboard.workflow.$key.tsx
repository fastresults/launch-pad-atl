import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { runMyDeliverable } from "@/lib/userPipeline.functions";
import { getMyIntake, updateMyIntake } from "@/lib/stageIntake.functions";
import { WORKFLOW_BY_KEY } from "@/lib/workflow";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { VoiceField } from "@/components/voice/VoiceField";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/workflow/$key")({
  component: WorkflowDetail,
});

type Section = { heading: string; body_markdown: string };
type Content = { title?: string; summary?: string; sections?: Section[]; action_items?: string[] };

function WorkflowDetail() {
  const { key } = Route.useParams();
  const wf = WORKFLOW_BY_KEY.get(key);
  const { user } = useAuth();
  const qc = useQueryClient();

  const getIntake = useServerFn(getMyIntake);
  const saveIntake = useServerFn(updateMyIntake);
  const runFn = useServerFn(runMyDeliverable);

  const { data: intakeData } = useQuery({
    queryKey: ["my", "intake", key],
    queryFn: () => getIntake({ data: { deliverable_key: key } }),
  });

  const { data: deliverable, refetch } = useQuery({
    queryKey: ["my", "deliverable", key, user?.id],
    enabled: !!user?.id,
    refetchInterval: 4000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendee_deliverables")
        .select("content_current, content_ai, review_status, publish_status, ai_generated_at")
        .eq("user_id", user!.id)
        .eq("deliverable_key", key)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const [intake, setIntake] = useState<Record<string, string>>({});
  useEffect(() => {
    if (intakeData?.intake?.intake) setIntake(intakeData.intake.intake as Record<string, string>);
  }, [intakeData]);

  const persist = async (next: Record<string, string>) => {
    try {
      await saveIntake({ data: { deliverable_key: key, intake: next } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const run = useMutation({
    mutationFn: () => runFn({ data: { key, runUpstream: true } }),
    onSuccess: () => { toast.success("Generation complete"); refetch(); qc.invalidateQueries({ queryKey: ["my"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Run failed"),
  });

  const content = (deliverable?.content_current ?? {}) as Content;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/dashboard/workflow" className="text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground">
          ← Workflow
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{wf?.label ?? key}</h1>
        {wf?.short && <p className="text-sm text-muted-foreground">{wf.short}</p>}
      </div>

      {wf?.intake && wf.intake.length > 0 && (
        <section className="space-y-4 rounded-2xl border border-white/10 bg-card p-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Quick intake</h2>
          {wf.intake.map((f) => (
            <VoiceField
              key={f.key}
              label={f.label}
              value={intake[f.key] ?? ""}
              onChange={(v) => setIntake((s) => ({ ...s, [f.key]: v }))}
              onBlur={() => persist({ ...intake, [f.key]: intake[f.key] ?? "" })}
              placeholder={f.placeholder}
              multiline={f.multiline}
            />
          ))}
        </section>
      )}

      <div className="flex gap-2">
        <Button onClick={() => run.mutate()} disabled={run.isPending}>
          {run.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : deliverable ? "Regenerate" : "Generate"}
        </Button>
      </div>

      {deliverable && (
        <article className="space-y-5 rounded-2xl border border-white/10 bg-card p-6">
          {content.title && <h2 className="text-xl font-semibold">{content.title}</h2>}
          {content.summary && <p className="text-sm text-muted-foreground">{content.summary}</p>}
          {(content.sections ?? []).map((s, i) => (
            <section key={i}>
              <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{s.heading}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{s.body_markdown}</p>
            </section>
          ))}
          {content.action_items && content.action_items.length > 0 && (
            <div>
              <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Action items</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {content.action_items.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
        </article>
      )}
    </div>
  );
}
