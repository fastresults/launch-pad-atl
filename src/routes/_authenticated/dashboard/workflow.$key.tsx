// @ts-nocheck
import { Link, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { runMyDeliverable, runMyDeliverableAssessment } from "@/lib/userPipeline.functions";
import { getMyIntake, updateMyIntake } from "@/lib/stageIntake.functions";
import { WORKFLOW_BY_KEY } from "@/lib/workflow";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { VoiceField } from "@/components/voice/VoiceField";
import { RewriteFeedbackDialog, type RewriteTarget } from "@/components/hub/RewriteFeedbackDialog";
import { Loader2, Sparkles, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { RichMarkdown } from "@/components/markdown/RichMarkdown";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { getSignedStorageUrl } from "@/lib/storageSignedUrl";
import { invokeEdge } from "@/lib/edge-invoke";



type Section = { heading: string; body_markdown: string };
type Content = { title?: string; summary?: string; sections?: Section[]; action_items?: string[] };

export default function WorkflowDetail() {
  const { key } = useParams();
  const wf = WORKFLOW_BY_KEY.get(key);
  const { user } = useAuth();
  const qc = useQueryClient();

  
  
  

  const { data: intakeData } = useQuery({
    queryKey: ["my", "intake", key],
    queryFn: () => getMyIntake({ data: { deliverable_key: key } }),
  });

  const { data: deliverable, refetch } = useQuery({
    queryKey: ["my", "deliverable", key, user?.id],
    enabled: !!user?.id,
    refetchInterval: 4000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendee_deliverables")
        .select("content_current, content_ai, review_status, publish_status, ai_generated_at, deep_assessment, deep_assessment_status, deep_assessment_quality_score, deep_assessment_generated_at, hero_image_path, hero_image_status")
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
      await updateMyIntake({ data: { deliverable_key: key, intake: next } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const run = useMutation({
    mutationFn: (vars?: { feedback?: string; tags?: string[] }) =>
      runMyDeliverable({ data: { key, runUpstream: true, feedback: vars?.feedback, tags: vars?.tags } }),
    onSuccess: () => {
      toast.success("Started — this page updates live as it's written");
      refetch();
      qc.invalidateQueries({ queryKey: ["my"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Run failed"),
  });

  const [rewriteTarget, setRewriteTarget] = useState<RewriteTarget>(null);

  const assess = useMutation({
    mutationFn: () => runMyDeliverableAssessment({ data: { key } }),
    onSuccess: () => { toast.success("Deep dive ready"); refetch(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Deep dive failed"),

  });

  const content = (deliverable?.content_current ?? {}) as Content;
  const hasContent = !!deliverable?.content_current && Object.keys(deliverable.content_current).length > 0;
  const assessmentStatus = deliverable?.deep_assessment_status ?? null;
  const assessmentText = deliverable?.deep_assessment ?? null;
  const assessmentScore = deliverable?.deep_assessment_quality_score ?? null;
  const heroPath = deliverable?.hero_image_path ?? null;

  // Hero image — signed URL + lazy generate
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroError, setHeroError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!heroPath) { setHeroUrl(null); setHeroError(null); return; }
      try {
        const url = await getSignedStorageUrl("venture-doc-images", heroPath, 3600);
        if (alive) { setHeroUrl(url); setHeroError(null); }
      } catch (e) {
        if (alive) {
          setHeroUrl(null);
          setHeroError(e instanceof Error ? e.message : "Saved image could not be loaded");
        }
      }
    })();
    return () => { alive = false; };
  }, [heroPath]);

  const generateHero = async (force = false) => {
    if (!hasContent || !key) return;
    setHeroLoading(true);
    setHeroError(null);
    try {
      const { data, error } = await invokeEdge("attendee-deliverable-image", {
        body: { deliverableKey: key, force, userId: user?.id },
      });
      if (error) throw error;
      if (data?.path) {
        const signedUrl = await getSignedStorageUrl("venture-doc-images", data.path, 3600);
        setHeroUrl(signedUrl);
        refetch();
      } else if (data?.skipped && data?.reason === "in_flight") {
        setHeroError("Image generation is already running. Refresh this page in a moment.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Image generation failed";
      setHeroError(msg);
      toast.error(msg);
    } finally {
      setHeroLoading(false);
    }
  };

  // Auto-kick once per (key) per mount when content exists, no hero yet,
  // and no prior attempt (status is null). 'failed' shows a Retry button.
  const autoFiredRef = useRef<string | null>(null);
  const heroStatus = deliverable?.hero_image_status ?? null;
  useEffect(() => {
    if (!hasContent || heroPath || heroLoading || !key) return;
    if (heroStatus === "generating" || heroStatus === "failed") return;
    if (autoFiredRef.current === key) return;
    autoFiredRef.current = key;
    generateHero(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasContent, heroPath, key, heroStatus]);


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
        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
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

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            if (hasContent) {
              setRewriteTarget({ type: key, name: wf?.label ?? key });
            } else {
              run.mutate(undefined);
            }
          }}
          disabled={run.isPending}
        >
          {run.isPending
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>
            : hasContent ? "Rewrite with feedback" : "Generate"}
        </Button>
        {hasContent && (
          <Button variant="outline" onClick={() => run.mutate(undefined)} disabled={run.isPending}>
            Quick regenerate
          </Button>
        )}
        {hasContent && (
          <Button variant="ghost" size="sm" onClick={() => generateHero(true)} disabled={heroLoading}>
            {heroLoading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating image…</>
              : <><ImageIcon className="mr-2 h-4 w-4" />{heroPath ? "Regenerate image" : "Generate image"}</>}
          </Button>
        )}
      </div>

      {deliverable && hasContent && (
        <article className="space-y-5 rounded-2xl border border-border/60 bg-card p-6">
          {(heroUrl || heroLoading || heroError) && (
            <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/30">
              <AspectRatio ratio={16 / 9}>
                {heroUrl && !heroError ? (
                  <img
                    src={heroUrl}
                    alt={content.title ?? wf?.label ?? "Document hero"}
                    className="h-full w-full object-cover"
                    onError={() => {
                      setHeroUrl(null);
                      setHeroError("Saved image file could not be displayed.");
                    }}
                  />
                ) : heroError ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-xs text-muted-foreground">
                    <div>
                      <div className="text-sm font-medium text-foreground">Image unavailable</div>
                      <div className="mt-1 max-w-sm">{heroError}</div>
                    </div>
                    <Button size="sm" onClick={() => generateHero(true)} disabled={heroLoading}>
                      <ImageIcon className="mr-2 h-4 w-4" /> Regenerate image
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Painting hero image…
                  </div>
                )}
              </AspectRatio>
            </div>
          )}
          {content.title && <h2 className="text-xl font-semibold">{content.title}</h2>}
          {content.summary && (
            <RichMarkdown variant="compact" className="text-sm text-muted-foreground">
              {content.summary}
            </RichMarkdown>
          )}
          {(content.sections ?? []).map((s, i) => (
            <section key={i}>
              <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{s.heading}</h3>
              <RichMarkdown variant="document" className="mt-1">
                {s.body_markdown}
              </RichMarkdown>
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

      {hasContent && (
        <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{wf?.label ?? key} Deep Dive</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Hardcore research, pressure-tests, hidden risks, and a 30/60/90 plan grounded in your whole venture context.
              </p>
            </div>
            <Button
              variant={assessmentText ? "outline" : "default"}
              onClick={() => assess.mutate()}
              disabled={assess.isPending || assessmentStatus === "generating"}
            >
              {assess.isPending || assessmentStatus === "generating"
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running deep dive…</>
                : <><Sparkles className="mr-2 h-4 w-4" />{assessmentText ? "Re-run deep dive" : "Run deep dive"}</>}

            </Button>
          </div>

          {assessmentText && (
            <div className="rounded-xl border border-border/60 bg-background/40 p-4">
              {assessmentScore != null && (
                <div className="mb-2 text-xs text-muted-foreground">
                  Quality score: <span className="font-semibold text-foreground">{assessmentScore}/100</span>
                </div>
              )}
              <RichMarkdown variant="assessment">{assessmentText}</RichMarkdown>
            </div>
          )}
        </section>
      )}

      <RewriteFeedbackDialog
        target={rewriteTarget}
        onClose={() => setRewriteTarget(null)}
        onSubmit={(feedback, tags) => {
          setRewriteTarget(null);
          run.mutate({ feedback, tags });
        }}
      />
    </div>
  );
}

