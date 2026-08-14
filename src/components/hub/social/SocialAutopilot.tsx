// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft, ArrowRight, Check, Sparkles, Loader2, RefreshCw,
  Settings2, Copy, ExternalLink, PartyPopper, Image as ImageIcon, Eye, Trash2,
  Instagram, Linkedin, Twitter, Facebook, Youtube, Music2, Globe,
} from "lucide-react";

import { toast } from "sonner";
import {
  getSocialProgress, upsertSocialProgress, listPlanDocs, ensurePlanDoc,
  buildKitTasks, generateOneKitTask, coverKindFor, coverLabelFor, PLAN_DOCS, type SocialGoals, type KitTask,
} from "@/lib/social-autopilot.functions";
import { PLATFORM_SPECS, ART_DIRECTIONS } from "@/lib/social-platform-specs";
import { listSocialAssets, deleteSocialAsset } from "@/lib/social-cover.functions";
import { listStylePreviews, generateStylePreview, deleteStylePreview, type StylePreview } from "@/lib/style-preview.functions";
import { RegenerateAssetDialog } from "./RegenerateAssetDialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { AssetPreviewDialog, type PreviewableAsset } from "./AssetPreviewDialog";
import { RotateCcw } from "lucide-react";
import { edgeStatus, edgeErrorMessage } from "@/lib/edge-errors";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { StudioMarkPicker } from "@/components/hub/brand/StudioMarkPicker";
import { getBrandKit, setStudioMarkChoice } from "@/lib/brandKit.functions";
import { studioMarkKind } from "@/lib/brand/collateral-marks";

/**
 * Every logo placement in the studio gets the same chevron picker as Branded
 * Collateral. It reads and writes `studio_mark_choice` on the brand kit, so the
 * pick survives regeneration and the worker places that exact artwork.
 */
function MarkPickerFor({ snapshotId, assetKind, used }: { snapshotId: string; assetKind: string; used?: any }) {
  const qc = useQueryClient();
  const kitQ = useQuery({ queryKey: ["brandKit", snapshotId], queryFn: () => getBrandKit(snapshotId) });
  const kit: any = kitQ.data;
  const markKind = studioMarkKind(assetKind);
  const save = async (cell: any) => {
    try {
      await setStudioMarkChoice(snapshotId, markKind, cell);
      await qc.invalidateQueries({ queryKey: ["brandKit", snapshotId] });
    } catch (e: any) {
      toast.error(e?.message || "Could not save the logo choice");
    }
  };
  return (
    <StudioMarkPicker
      assetKind={assetKind}
      logos={kit?.logos ?? null}
      value={kit?.studio_mark_choice?.[markKind] ?? null}
      onChange={save}
      used={used ?? null}
    />
  );
}


const PLATFORM_ICONS: Record<string, any> = {
  Instagram, LinkedIn: Linkedin, X: Twitter, Twitter, Facebook,
  YouTube: Youtube, TikTok: Music2, Threads: Music2, Pinterest: Globe, Reddit: Globe,
};

function platformLabel(p: string): string {
  return (PLATFORM_SPECS as any)[p]?.label ?? p;
}
function assetLabel(platform: string, kind: string): string {
  const spec = (PLATFORM_SPECS as any)[platform];
  const found = spec?.assets?.find((a: any) => a.kind === kind);
  if (found?.label) return found.label;
  return kind.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
}
function assetDims(platform: string, kind: string): string | null {
  const spec = (PLATFORM_SPECS as any)[platform];
  const found = spec?.assets?.find((a: any) => a.kind === kind);
  return found ? `${found.width}×${found.height}` : null;
}

const STEPS = [
  { id: 1, label: "Goals" },
  { id: 2, label: "Build plan" },
  { id: 3, label: "Channels" },
  { id: 4, label: "Style" },
  { id: 5, label: "Build kit" },
  { id: 6, label: "Launch" },
];

const SIGNUP_URLS: Record<string, string> = {
  Instagram: "https://www.instagram.com/accounts/emailsignup/",
  TikTok: "https://www.tiktok.com/signup",
  LinkedIn: "https://www.linkedin.com/company/setup/new/",
  X: "https://x.com/i/flow/signup",
  YouTube: "https://www.youtube.com/create_channel",
  Facebook: "https://www.facebook.com/pages/creation/",
  Pinterest: "https://www.pinterest.com/business/create/",
  Threads: "https://www.threads.net/login",
  Reddit: "https://www.reddit.com/register/",
};

function generationErrorMessage(e: any) {
  if (e?.code === "AI_CREDIT_LIMIT_REACHED" || e?.reason === "workspace_credit_limit") {
    return "Image generation is paused — our team has been notified. Try Generate again shortly.";
  }
  if (e?.code === "PAYMENT_REQUIRED" || e?.reason === "ai_credits_exhausted") {
    return "Image generation is paused — our team has been notified. Try Generate again shortly.";
  }
  if (e?.code === "RATE_LIMITED") {
    return "The image generator is rate-limited right now. Wait a minute, then try Generate again.";
  }
  const status = edgeStatus(e);
  if (status === 401) return "Your session expired. Please sign in again and retry.";
  if (status === 403) return "You don't have access to run this. Try signing out and back in, or retry in a moment.";
  return e?.details || edgeErrorMessage(e, "Generation failed. Please try again.");
}

export function SocialAutopilot({
  snapshot,
  kit,
  onShowAdvanced,
}: {
  snapshot: any;
  kit: any;
  onShowAdvanced: () => void;
}) {
  const qc = useQueryClient();
  const snapshotId = snapshot.id;

  const progressQ = useQuery({
    queryKey: ["social-autopilot", snapshotId],
    queryFn: () => getSocialProgress(snapshotId),
  });
  const progress = progressQ.data;
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    if (progress?.current_step) setStep(progress.current_step);
  }, [progress?.current_step]);

  const save = async (patch: any, advanceTo?: number) => {
    const next = { ...patch };
    if (advanceTo) next.current_step = advanceTo;
    await upsertSocialProgress(snapshotId, next);
    qc.invalidateQueries({ queryKey: ["social-autopilot", snapshotId] });
    if (advanceTo) setStep(advanceTo);
  };

  const goals = progress?.goals ?? {};
  const selectedPlatforms = progress?.selected_platforms ?? [];
  const direction = progress?.art_direction ?? null;
  const launchStatus = progress?.launch_status ?? {};

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px]">
            {STEPS.map((s, i) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={s.id > step && !done}
                    onClick={() => s.id <= step && setStep(s.id)}
                    className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full border px-1.5 text-[10px] ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : done
                        ? "border-status-success/40 bg-status-success/15 text-status-success"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" /> : s.id}
                  </button>
                  <span className={active ? "font-medium" : "text-muted-foreground"}>{s.label}</span>
                  {i < STEPS.length - 1 && <span className="px-1 text-muted-foreground/40">›</span>}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onShowAdvanced}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            title="Show all tabs (advanced)"
          >
            <Settings2 className="h-3 w-3" /> Advanced mode
          </button>
        </div>
        <Progress value={((step - 1) / (STEPS.length - 1)) * 100} className="mt-2 h-1" />
      </div>

      {/* Step body */}
      {progressQ.isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : step === 1 ? (
        <Step1Goals goals={goals} onContinue={(g) => save({ goals: g }, 2)} />
      ) : step === 2 ? (
        <Step2BuildPlan
          snapshotId={snapshotId}
          onBack={() => setStep(1)}
          onContinue={() => setStep(3)}
        />
      ) : step === 3 ? (
        <Step3Channels
          snapshotId={snapshotId}
          selected={selectedPlatforms}
          onBack={() => setStep(2)}
          onContinue={(plats) => save({ selected_platforms: plats }, 4)}
        />
      ) : step === 4 ? (
        <Step4Style
          snapshotId={snapshotId}
          kit={kit}
          direction={direction}
          onBack={() => setStep(3)}
          onContinue={(d) => save({ art_direction: d }, 5)}
        />
      ) : step === 5 ? (
        <Step5BuildKit
          snapshotId={snapshotId}
          platforms={selectedPlatforms}
          direction={direction || "editorial"}
          onBack={() => setStep(4)}
          onContinue={() => save({}, 6)}
        />
      ) : (
        <Step6Launch
          snapshot={snapshot}
          snapshotId={snapshotId}
          platforms={selectedPlatforms}
          direction={direction || "editorial"}
          launchStatus={launchStatus}
          onBack={() => setStep(5)}
          onUpdate={(ls) => save({ launch_status: ls })}
        />
      )}
    </div>
  );
}

// ====================== STEP 1 — Goals ======================
const OBJECTIVES = [
  { id: "customers", label: "Get customers" },
  { id: "trust",     label: "Build trust" },
  { id: "investors", label: "Find investors" },
  { id: "hire",      label: "Hire" },
  { id: "community", label: "Build community" },
];
const CAMERA = [
  { id: "love",  label: "Love it" },
  { id: "ok",    label: "Okay" },
  { id: "avoid", label: "Avoid" },
];

function Step1Goals({ goals, onContinue }: { goals: SocialGoals; onContinue: (g: SocialGoals) => void }) {
  const [objectives, setObjectives] = useState<string[]>(goals.objectives ?? []);
  const [hours, setHours] = useState<number>(goals.weekly_hours ?? 3);
  const [camera, setCamera] = useState<string>(goals.on_camera ?? "ok");
  const valid = objectives.length > 0;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <header>
        <h3 className="text-base font-semibold">Tell us about your goals</h3>
        <p className="text-xs text-muted-foreground">Three quick questions. We'll handle the rest.</p>
      </header>

      <section className="space-y-2">
        <p className="text-xs font-medium">What do you want social media to do for you?</p>
        <div className="flex flex-wrap gap-1.5">
          {OBJECTIVES.map((o) => {
            const on = objectives.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() =>
                  setObjectives((prev) =>
                    prev.includes(o.id) ? prev.filter((x) => x !== o.id) : [...prev, o.id],
                  )
                }
                className={`rounded-full border px-3 py-1 text-xs ${
                  on ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {on && <Check className="mr-1 -mt-0.5 inline h-3 w-3" />}
                {o.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-medium">How much time can you give it weekly?</p>
        <div className="flex items-center gap-3">
          <Slider
            value={[hours]} min={1} max={5} step={2}
            onValueChange={(v) => setHours(v[0])}
            className="max-w-sm"
          />
          <span className="text-xs">{hours === 1 ? "1 hour" : hours === 3 ? "3 hours" : "5+ hours"}</span>
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-medium">How do you feel on camera?</p>
        <div className="flex flex-wrap gap-1.5">
          {CAMERA.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCamera(c.id)}
              className={`rounded-full border px-3 py-1 text-xs ${
                camera === c.id ? "border-primary bg-primary/15" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <footer className="flex justify-end">
        <Button
          disabled={!valid}
          onClick={() => onContinue({ objectives, weekly_hours: hours as any, on_camera: camera as any })}
        >
          Continue <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </footer>
    </div>
  );
}

// ====================== STEP 2 — Build Plan ======================
function Step2BuildPlan({
  snapshotId, onBack, onContinue,
}: { snapshotId: string; onBack: () => void; onContinue: () => void }) {
  const qc = useQueryClient();
  const docsQ = useQuery({
    queryKey: ["social-plan-docs", snapshotId],
    queryFn: () => listPlanDocs(snapshotId),
    refetchInterval: 3000,
  });
  const items = docsQ.data ?? PLAN_DOCS.map((p) => ({ ...p, doc: null }));
  const [running, setRunning] = useState<Record<string, boolean>>({});

  const allDone = items.every((i: any) => i.doc?.status === "complete");
  const anyMissing = items.some((i: any) => !i.doc || i.doc?.status !== "complete");

  const triggerAll = async () => {
    for (const i of items) {
      const ds = (i as any).doc?.status;
      if (ds === "complete") continue;
      setRunning((r) => ({ ...r, [i.type]: true }));
      ensurePlanDoc(snapshotId, i.type as any)
        .catch((e) => toast.error(`${i.label}: ${e.message ?? "failed"}`))
        .finally(() => {
          setRunning((r) => ({ ...r, [i.type]: false }));
          qc.invalidateQueries({ queryKey: ["social-plan-docs", snapshotId] });
        });
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <header>
        <h3 className="text-base font-semibold">Building your social plan</h3>
        <p className="text-xs text-muted-foreground">
          We'll research, pick channels, and draft your content plan in the background.
        </p>
      </header>

      <ul className="space-y-1.5">
        {items.map((i: any) => {
          const status = i.doc?.status ?? "pending";
          const isRunning = running[i.type] || status === "running" || status === "queued";
          const done = status === "complete";
          const failed = status === "failed";
          return (
            <li
              key={i.type}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/40 px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-2">
                {done ? (
                  <Check className="h-3.5 w-3.5 text-status-success" />
                ) : isRunning ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-status-info" />
                ) : failed ? (
                  <span className="h-2 w-2 rounded-full bg-status-danger" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                )}
                <span className={done ? "text-foreground" : "text-muted-foreground"}>{i.label}</span>
              </div>
              {failed && (
                <Button size="sm" variant="ghost" className="h-6 text-[11px]"
                  onClick={() => ensurePlanDoc(snapshotId, i.type)}>
                  <RefreshCw className="mr-1 h-3 w-3" /> Retry
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-1 h-3 w-3" /> Back
        </Button>
        {!allDone ? (
          <Button onClick={triggerAll} disabled={!anyMissing}>
            <Sparkles className="mr-1 h-3 w-3" /> Generate my plan
          </Button>
        ) : (
          <Button onClick={onContinue}>
            Next: pick channels <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        )}
      </footer>
    </div>
  );
}

// ====================== STEP 3 — Channels ======================
function parseRecs(md: string) {
  const out: { name: string; rec: string; why?: string }[] = [];
  const platforms = Object.keys(PLATFORM_SPECS);
  for (const p of platforms) {
    const re = new RegExp(`\\b${p}\\b[^\\n]*?\\b(Yes|Maybe|Skip)\\b([^\\n]*)`, "i");
    const m = md.match(re);
    if (m) out.push({ name: p, rec: m[1], why: (m[2] || "").trim().replace(/^[:\-—\s]+/, "") });
  }
  return out;
}

function Step3Channels({
  snapshotId, selected, onBack, onContinue,
}: { snapshotId: string; selected: string[]; onBack: () => void; onContinue: (p: string[]) => void }) {
  const docsQ = useQuery({
    queryKey: ["social-plan-docs", snapshotId],
    queryFn: () => listPlanDocs(snapshotId),
  });
  const audit = (docsQ.data ?? []).find((d: any) => d.type === "social_media_audit_setup")?.doc;
  const recs = useMemo(() => parseRecs(audit?.content ?? ""), [audit?.content]);

  const defaultPicks = useMemo(() => {
    if (selected.length) return selected;
    return recs.filter((r) => /yes/i.test(r.rec)).map((r) => r.name);
  }, [selected, recs]);
  const [picks, setPicks] = useState<string[]>(defaultPicks);
  useEffect(() => { if (!selected.length) setPicks(defaultPicks); }, [defaultPicks]);

  const all = recs.length ? recs : Object.keys(PLATFORM_SPECS).map((n) => ({ name: n, rec: "Maybe", why: "" }));
  const valid = picks.length >= 1;
  const tooMany = picks.length > 3;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <header>
        <h3 className="text-base font-semibold">Where will you show up?</h3>
        <p className="text-xs text-muted-foreground">We've pre-picked what fits you best. Toggle to change.</p>
      </header>

      <div className="grid gap-2 md:grid-cols-2">
        {all.map((r) => {
          const on = picks.includes(r.name);
          const skip = /skip/i.test(r.rec);
          return (
            <button
              key={r.name}
              type="button"
              onClick={() =>
                setPicks((prev) => prev.includes(r.name) ? prev.filter((x) => x !== r.name) : [...prev, r.name])
              }
              className={`rounded-xl border p-3 text-left text-xs transition ${
                on ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-border"
              } ${skip && !on ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{r.name}</span>
                <Badge variant="outline" className="text-[10px]">
                  {/yes/i.test(r.rec) ? "Recommended" : /maybe/i.test(r.rec) ? "Worth trying" : "Skip"}
                </Badge>
              </div>
              {r.why && <p className="mt-1 line-clamp-2 text-muted-foreground">{r.why}</p>}
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${on ? "bg-primary" : "bg-muted-foreground/30"}`} />
                {on ? "Selected" : "Tap to add"}
              </div>
            </button>
          );
        })}
      </div>

      {tooMany && (
        <p className="text-[11px] text-status-warning">
          Most first-time founders win with 2–3 channels. You picked {picks.length}.
        </p>
      )}

      <footer className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-3 w-3" /> Back</Button>
        <Button disabled={!valid} onClick={() => onContinue(picks)}>
          Continue with {picks.length} <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </footer>
    </div>
  );
}

// ====================== STEP 4 — Style ======================
function Step4Style({
  snapshotId, kit, direction, onBack, onContinue,
}: { snapshotId: string; kit: any; direction: string | null; onBack: () => void; onContinue: (d: string) => void }) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const palette = kit?.palette?.colors ?? {};
  const colors = Object.values(palette).slice(0, 4) as string[];
  const head = kit?.typography?.heading?.family ?? "Inter";
  const brandLocked = kit?.status === "locked";

  const [pick, setPick] = useState<string | null>(direction);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [dialog, setDialog] = useState<{ scope: "single" | "all"; direction?: string; focusSection?: "headline" | "palette" | "feedback" | "logo" } | null>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const previewsQ = useQuery({
    queryKey: ["style-previews", snapshotId],
    queryFn: () => listStylePreviews(snapshotId),
    enabled: brandLocked,
  });
  const previews: StylePreview[] = previewsQ.data ?? [];
  const byDirection = new Map(previews.map((p) => [p.direction, p]));

  const runGenerate = async (dirId: string, opts?: { feedback?: string; signatureIntensity?: any; signaturePlacement?: any; paletteOverride?: any; headlineOverride?: any; logoSize?: "sm" | "md" | "lg"; sceneOverride?: string; refreshScenes?: boolean }) => {
    if (!brandLocked) return;
    setBusy((b) => ({ ...b, [dirId]: true }));
    try {
      await generateStylePreview({
        snapshotId,
        direction: dirId,
        feedback: opts?.feedback,
        signatureIntensity: opts?.signatureIntensity,
        signaturePlacement: opts?.signaturePlacement,
        paletteOverride: opts?.paletteOverride,
        headlineOverride: opts?.headlineOverride,
        logoSize: opts?.logoSize,
        sceneOverride: opts?.sceneOverride,
        refreshScenes: opts?.refreshScenes,
      });
      await qc.invalidateQueries({ queryKey: ["style-previews", snapshotId] });
    } catch (e: any) {
      toast.error(generationErrorMessage(e));
    } finally {
      setBusy((b) => ({ ...b, [dirId]: false }));
    }
  };

  // Auto-generate any missing previews on first visit (in parallel).
  useEffect(() => {
    if (!brandLocked || previewsQ.isLoading) return;
    const missing = ART_DIRECTIONS.filter((d) => !byDirection.has(d.id) && !busy[d.id]);
    if (!missing.length) return;
    missing.forEach((d) => runGenerate(d.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandLocked, previewsQ.isLoading, previews.length]);

  const regenerateAll = async (opts: { feedback: string; signatureIntensity?: any; signaturePlacement?: any; paletteOverride?: any; headlineOverride?: any; logoSize?: "sm" | "md" | "lg"; sceneOverride?: string; refreshScenes?: boolean }) => {
    await Promise.all(ART_DIRECTIONS.map((d) => runGenerate(d.id, opts)));
  };

  const deletePreview = async (dirId: string) => {
    if (!(await confirm({ title: "Delete style preview?", description: "It will regenerate fresh from scratch.", destructive: true, confirmText: "Delete" }))) return;
    setBusy((b) => ({ ...b, [dirId]: true }));
    try {
      await deleteStylePreview(snapshotId, dirId);
      await qc.invalidateQueries({ queryKey: ["style-previews", snapshotId] });
      toast.success("Deleted — regenerating fresh preview");
      // Trigger fresh generation immediately
      await runGenerate(dirId);
    } catch (e: any) {
      toast.error(generationErrorMessage(e));
      setBusy((b) => ({ ...b, [dirId]: false }));
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Pick a look</h3>
          <p className="text-xs text-muted-foreground">
            Live previews rendered with your brand kit. Not feeling one? Hit regenerate.
          </p>
        </div>
        {brandLocked && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setDialog({ scope: "all" })}
            disabled={Object.values(busy).some(Boolean)}
          >
            <RotateCcw className="mr-1 h-3 w-3" /> Regenerate all
          </Button>
        )}
      </header>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {ART_DIRECTIONS.map((d) => {
          const on = pick === d.id;
          const preview = byDirection.get(d.id);
          const loading = busy[d.id];
          return (
            <div
              key={d.id}
              className={`group relative overflow-hidden rounded-xl border transition ${
                on ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-border"
              }`}
            >
              <button
                type="button"
                onClick={() => setPick(d.id)}
                className="block w-full text-left"
              >
                <div className="relative">
                  {preview?.signed_url ? (
                    <img
                      src={preview.signed_url}
                      alt={`${d.label} preview`}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <StylePreview id={d.id} colors={colors} fontFamily={head} />
                  )}
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <div className="text-sm font-semibold">{d.label}</div>
                  <p className="line-clamp-2 text-[11px] text-muted-foreground">{d.blurb}</p>
                </div>
              </button>

              {brandLocked && (
                <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  {preview?.signed_url && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPreviewIdx(ART_DIRECTIONS.findIndex((x) => x.id === d.id)); }}
                      title="Preview full size"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDialog({ scope: "single", direction: d.id }); }}
                    disabled={loading}
                    title="Regenerate this preview"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  {preview?.signed_url && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deletePreview(d.id); }}
                      disabled={loading}
                      title="Delete & regenerate fresh"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-status-danger/40 bg-background/90 text-status-danger shadow-sm disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!brandLocked && (
        <p className="text-[11px] text-muted-foreground">
          Lock your Brand Kit to render live previews here. Static mockups shown above.
        </p>
      )}

      <footer className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-3 w-3" /> Back</Button>
        <Button disabled={!pick} onClick={() => onContinue(pick!)}>
          Continue <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </footer>

      {dialog && (
        <RegenerateAssetDialog
          open={!!dialog}
          onOpenChange={(v) => !v && setDialog(null)}
          scope={dialog.scope}
          targetLabel={
            dialog.scope === "all"
              ? "all 4 style previews"
              : ART_DIRECTIONS.find((x) => x.id === dialog.direction)?.label || ""
          }
          thumbnailUrl={dialog.direction ? byDirection.get(dialog.direction)?.signed_url : null}
          currentDirection={dialog.direction || "editorial"}
          canvasPlan={dialog.direction ? byDirection.get(dialog.direction)?.canvas_plan : null}
          currentHeadline={dialog.direction ? (byDirection.get(dialog.direction) as any)?.last_headline ?? null : null}
          currentLogoSize={dialog.direction ? (byDirection.get(dialog.direction) as any)?.last_logo_size ?? null : null}
          focusSection={dialog.focusSection}
          onSubmit={async (input) => {
            const { directionOverride, ...rest } = input;
            if (dialog.scope === "all") {
              await regenerateAll(rest);
            } else {
              await runGenerate(directionOverride || dialog.direction!, rest);
            }
          }}
        />
      )}

      {previewIdx !== null && (() => {
        const d = ART_DIRECTIONS[previewIdx];
        const p = d ? byDirection.get(d.id) : null;
        const asset: PreviewableAsset | null = d ? {
          url: p?.signed_url ?? null,
          title: `${d.label} — style preview`,
          subtitle: d.blurb,
          assetKind: "style_preview",
          canvasPlan: p?.canvas_plan ?? null,
          qaStatus: p?.qa_status ?? null,
          qaNotes: (p as any)?.qa_notes ?? null,
          lastFeedback: p?.last_feedback ?? null,
          lastHeadline: (p as any)?.last_headline ?? null,
          lastLogoSize: (p as any)?.last_logo_size ?? null,
          updatedAt: p?.updated_at ?? null,
        } : null;
        return (
          <AssetPreviewDialog
            open={previewIdx !== null}
            onOpenChange={(v) => !v && setPreviewIdx(null)}
            asset={asset}
            onPrev={() => setPreviewIdx((i) => (i === null ? 0 : (i - 1 + ART_DIRECTIONS.length) % ART_DIRECTIONS.length))}
            onNext={() => setPreviewIdx((i) => (i === null ? 0 : (i + 1) % ART_DIRECTIONS.length))}
            busy={d ? !!busy[d.id] : false}
            onRegenerate={d ? () => setDialog({ scope: "single", direction: d.id }) : undefined}
            onEditHeadline={d ? () => setDialog({ scope: "single", direction: d.id, focusSection: "headline" }) : undefined}
            onEditLogoSize={d ? () => setDialog({ scope: "single", direction: d.id, focusSection: "logo" }) : undefined}
            onDelete={d && p?.signed_url ? () => { setPreviewIdx(null); deletePreview(d.id); } : undefined}
          />
        );
      })()}
    </div>
  );
}

function StylePreview({ id, colors, fontFamily }: { id: string; colors: string[]; fontFamily: string }) {
  const [c1, c2, c3, c4] = [colors[0] ?? "#1a1a2e", colors[1] ?? "#16213e", colors[2] ?? "#e94560", colors[3] ?? "#f5f5f5"];
  if (id === "editorial") {
    return (
      <div className="aspect-[4/3] p-4" style={{ background: c4, color: c1, fontFamily }}>
        <div className="text-[10px] uppercase tracking-widest opacity-70">Issue 01</div>
        <div className="mt-4 text-2xl font-bold leading-tight">Bold ideas, set in type.</div>
        <div className="mt-2 h-px w-12" style={{ background: c3 }} />
      </div>
    );
  }
  if (id === "photographic") {
    return (
      <div className="relative aspect-[4/3]" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 40%, ${c3}55, transparent 60%)` }} />
        <div className="absolute bottom-3 left-3 text-sm font-semibold text-white">Cinematic frame</div>
      </div>
    );
  }
  if (id === "geometric") {
    return (
      <div className="relative aspect-[4/3]" style={{ background: c4 }}>
        <div className="absolute left-4 top-4 h-12 w-12 rounded-full" style={{ background: c3 }} />
        <div className="absolute right-4 top-8 h-16 w-16" style={{ background: c1 }} />
        <div className="absolute bottom-3 left-4 h-8 w-24" style={{ background: c2 }} />
      </div>
    );
  }
  return (
    <div className="aspect-[4/3]" style={{ background: c2 }}>
      <svg viewBox="0 0 100 75" className="h-full w-full">
        <circle cx="30" cy="35" r="14" fill={c3} />
        <path d="M50 60 Q70 30 90 50" stroke={c4} strokeWidth="3" fill="none" />
        <rect x="10" y="58" width="80" height="6" rx="3" fill={c1} />
      </svg>
    </div>
  );
}

// ====================== STEP 5 — Build Kit ======================
function Step5BuildKit({
  snapshotId, platforms, direction, onBack, onContinue,
}: {
  snapshotId: string; platforms: string[]; direction: string;
  onBack: () => void; onContinue: () => void;
}) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const assetsQ = useQuery({
    queryKey: ["social-cover", snapshotId],
    queryFn: () => listSocialAssets(snapshotId),
  });
  const assets = assetsQ.data ?? [];

  const baseTasks = useMemo(
    () => buildKitTasks(platforms, direction, PLATFORM_SPECS as any),
    [platforms, direction],
  );

  const tasks: (KitTask & { asset_id?: string | null; signed_url?: string | null; canvas_plan?: any; qa_status?: string | null; last_feedback?: string | null; last_headline?: string | null; last_logo_size?: "sm" | "md" | "lg" | null; qa_notes?: any; model_used?: string | null; updated_at?: string | null; width?: number | null; height?: number | null })[] = useMemo(() => {
    return baseTasks.map((t) => {
      const match = assets.find(
        (a: any) => a.platform === t.platform && a.asset_kind === t.asset && a.art_direction === direction,
      );
      return {
        ...t,
        status: match ? "done" : t.status,
        asset_id: (match as any)?.id ?? null,
        signed_url: match?.signed_url ?? null,
        canvas_plan: match?.canvas_plan ?? null,
        qa_status: match?.qa_status ?? null,
        qa_notes: (match as any)?.qa_notes ?? null,
        last_feedback: match?.last_feedback ?? null,
        last_headline: (match as any)?.last_headline ?? null,
        last_logo_size: (match as any)?.last_logo_size ?? null,
        model_used: (match as any)?.model_used ?? null,
        updated_at: (match as any)?.updated_at ?? null,
        width: (match as any)?.width ?? null,
        height: (match as any)?.height ?? null,
      };
    });
  }, [baseTasks, assets, direction]);

  const [running, setRunning] = useState(false);
  const [runningKeys, setRunningKeys] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [kept, setKept] = useState<Record<string, boolean>>({});
  const [regenTarget, setRegenTarget] = useState<null | { scope: "single" | "all"; task?: any; focusSection?: "headline" | "palette" | "feedback" | "logo" }>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const previewableIdxs = useMemo(() => tasks.map((t, i) => (t.signed_url ? i : -1)).filter((i) => i >= 0), [tasks]);
  const allDone = tasks.every((t) => t.status === "done");
  const taskKey = (t: Pick<KitTask, "platform" | "asset">) => `${t.platform}:${t.asset}`;
  const signatureFailed = (t?: any) =>
    t?.qa_notes?.observed?.signatureVisible === false ||
    (typeof t?.qa_notes?.observed?.signatureCoveragePct === "number" &&
      typeof t?.canvas_plan?.signatureMinCoveragePct === "number" &&
      t.qa_notes.observed.signatureCoveragePct < t.canvas_plan.signatureMinCoveragePct * 0.75);

  const setTaskRunning = (key: string, value: boolean) => {
    setRunningKeys((prev) => {
      const next = { ...prev };
      if (value) next[key] = true;
      else delete next[key];
      return next;
    });
  };

  const runAll = async (platform?: string) => {
    const targets = tasks.filter((t) => (!platform || t.platform === platform) && t.status !== "done");
    if (targets.length === 0) {
      toast.info(platform ? `${platformLabel(platform)} is already generated — reset it first to rebuild.` : "Everything is already generated — reset first to rebuild.");
      return;
    }
    setRunning(true);
    setErrors({});
    for (const t of targets) {
      const k = taskKey(t);
      setTaskRunning(k, true);
      try {
        await generateOneKitTask(snapshotId, t);
        await qc.invalidateQueries({ queryKey: ["social-cover", snapshotId] });
      } catch (e: any) {
        setErrors((prev) => ({ ...prev, [k]: generationErrorMessage(e) }));
      } finally {
        setTaskRunning(k, false);
      }
    }
    setRunning(false);
  };


  const regenerateSingle = async (
    t: any,
    opts: { feedback: string; directionOverride?: string; signatureIntensity?: any; signaturePlacement?: any; paletteOverride?: any; headlineOverride?: any; logoSize?: "sm" | "md" | "lg"; sceneOverride?: string; refreshScenes?: boolean },
  ) => {

    const k = taskKey(t);
    setTaskRunning(k, true);
    try {
      await generateOneKitTask(snapshotId, t, opts);
      await qc.invalidateQueries({ queryKey: ["social-cover", snapshotId] });
      setErrors((prev) => { const n = { ...prev }; delete n[k]; return n; });
      toast.success("Regenerated");
    } catch (e: any) {
      const msg = generationErrorMessage(e);
      setErrors((prev) => ({ ...prev, [k]: msg }));
      toast.error(msg);
    } finally {
      setTaskRunning(k, false);
    }
  };

  const regenerateAll = async (opts: { feedback: string; signatureIntensity?: any; signaturePlacement?: any; paletteOverride?: any; headlineOverride?: any; logoSize?: "sm" | "md" | "lg"; sceneOverride?: string; refreshScenes?: boolean }) => {
    setRunning(true);
    try {
      for (const t of tasks) {
        const k = taskKey(t);
        if (kept[k]) continue;
        setTaskRunning(k, true);
        try {
          await generateOneKitTask(snapshotId, t, opts);
          await qc.invalidateQueries({ queryKey: ["social-cover", snapshotId] });
        } catch (e: any) {
          setErrors((prev) => ({ ...prev, [k]: generationErrorMessage(e) }));
        } finally {
          setTaskRunning(k, false);
        }
      }
      toast.success("Regenerated all unlocked assets");
    } finally {
      setRunning(false);
    }
  };

  const deleteAsset = async (t: any) => {
    if (!t?.asset_id) return;
    const k = taskKey(t);
    if (!(await confirm({ title: "Delete asset?", description: `Delete this ${t.platform} ${String(t.asset).replace(/_/g, " ")}? The tile will reset so you can generate a fresh one.`, destructive: true, confirmText: "Delete" }))) return;
    setTaskRunning(k, true);
    try {
      await deleteSocialAsset(snapshotId, t.asset_id);
      await qc.invalidateQueries({ queryKey: ["social-cover", snapshotId] });
      setErrors((prev) => { const n = { ...prev }; delete n[k]; return n; });
      setKept((prev) => { const n = { ...prev }; delete n[k]; return n; });
      toast.success("Deleted — tile is ready for a fresh generation");
    } catch (e: any) {
      toast.error(generationErrorMessage(e));
    } finally {
      setTaskRunning(k, false);
    }
  };

  /** Wipe every generated image for one channel, or for the whole kit, so the
   *  founder can start over from a clean slate instead of regenerating on top
   *  of art they've already rejected. */
  const clearAssets = async (scope: { platform?: string }) => {
    const targets = tasks.filter(
      (t) => t.asset_id && (!scope.platform || t.platform === scope.platform),
    );
    if (targets.length === 0) {
      toast.info("Nothing to clear here yet.");
      return;
    }
    const what = scope.platform
      ? `all ${targets.length} ${platformLabel(scope.platform)} image${targets.length === 1 ? "" : "s"}`
      : `all ${targets.length} generated image${targets.length === 1 ? "" : "s"} across every channel`;
    const ok = await confirm({
      title: scope.platform ? `Clear ${platformLabel(scope.platform)} images?` : "Clear all generated images?",
      description: `This permanently deletes ${what}. Your brand kit, style and channel choices stay put — you'll just start the artwork over.`,
      destructive: true,
      confirmText: "Clear",
    });
    if (!ok) return;

    setRunning(true);
    let failed = 0;
    try {
      for (const t of targets) {
        const k = taskKey(t);
        setTaskRunning(k, true);
        try {
          await deleteSocialAsset(snapshotId, t.asset_id);
          setErrors((prev) => { const n = { ...prev }; delete n[k]; return n; });
          setKept((prev) => { const n = { ...prev }; delete n[k]; return n; });
        } catch {
          failed += 1;
        } finally {
          setTaskRunning(k, false);
        }
      }
      await qc.invalidateQueries({ queryKey: ["social-cover", snapshotId] });
      if (failed) toast.error(`Cleared, but ${failed} image${failed === 1 ? "" : "s"} could not be deleted.`);
      else toast.success(scope.platform ? `${platformLabel(scope.platform)} cleared — generate a fresh set.` : "All images cleared — start over whenever you're ready.");
    } finally {
      setRunning(false);
    }
  };

  const anyDone = tasks.some((t) => t.status === "done");
  const anyGenerated = tasks.some((t) => !!t.asset_id);


  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">Generating your channel kits</h3>
          <p className="text-xs text-muted-foreground">Avatar + cover for each channel, in your chosen style.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] capitalize">{direction}</Badge>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            disabled={running}
            onClick={() => runAll()}
            title="Generate every missing image across all channels"
          >
            {running ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            Generate all
          </Button>

          {anyDone && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              disabled={running}
              onClick={() => setRegenTarget({ scope: "all" })}
            >
              <RefreshCw className="mr-1 h-3 w-3" /> Regenerate all
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] text-destructive hover:text-destructive"
            disabled={running}
            onClick={() => clearAssets({})}
            title="Delete every generated image and start the artwork over"
          >
            <Trash2 className="mr-1 h-3 w-3" /> Reset all
          </Button>


        </div>
      </header>

      {(() => {
        // Group tasks by platform preserving original ordering
        const order: string[] = [];
        const groups = new Map<string, typeof tasks>();
        for (const t of tasks) {
          if (!groups.has(t.platform)) { groups.set(t.platform, [] as any); order.push(t.platform); }
          groups.get(t.platform)!.push(t);
        }
        return (
          <Accordion type="multiple" className="space-y-4">
            {order.map((platform) => {
              const items = groups.get(platform)!;
              const Icon = PLATFORM_ICONS[platform] ?? Globe;
              const doneCount = items.filter((t) => t.status === "done").length;
              return (
                <AccordionItem
                  key={platform}
                  value={platform}
                  className="rounded-xl border border-border bg-background/30 border-b"
                >
                  <AccordionTrigger className="px-3 py-2 hover:no-underline">
                    <div className="flex flex-1 items-center justify-between gap-2 pr-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 text-left">
                          <div className="text-sm font-semibold leading-tight">{platformLabel(platform)}</div>
                          <div className="text-[10px] font-normal text-muted-foreground">
                            {items.map((t) => assetLabel(platform, t.asset)).join(" · ")}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {doneCount}/{items.length} ready
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="border-t border-border pb-0 pt-0">
                    <div className="flex justify-end gap-1.5 px-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px]"
                        disabled={running}
                        onClick={() => runAll(platform)}
                        title={`Generate the missing ${platformLabel(platform)} images`}
                      >
                        {running ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                        Generate {platformLabel(platform)}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] text-destructive hover:text-destructive"
                        disabled={running}
                        onClick={() => clearAssets({ platform })}
                        title={`Delete every generated ${platformLabel(platform)} image`}
                      >
                        <Trash2 className="mr-1 h-3 w-3" /> Reset {platformLabel(platform)}
                      </Button>
                    </div>


                    <ul className="grid gap-2 p-2 sm:grid-cols-2">

                      {items.map((t) => {
                        const k = taskKey(t);
                        const done = t.status === "done";
                        const err = errors[k];
                        const itemRunning = !!runningKeys[k];
                        const isAvatar = t.asset === "avatar";
                        const isKept = !!kept[k];
                        const frameClass = isAvatar
                          ? "h-20 w-20 shrink-0 rounded-full"
                          : "h-20 w-28 shrink-0 rounded-md";
                        const aLabel = assetLabel(platform, t.asset);
                        const dims = assetDims(platform, t.asset);
                        return (
                          <li key={k}
                            className="flex flex-col gap-2 rounded-lg border border-border bg-background/40 p-2 text-xs sm:flex-row sm:items-center">
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => { if (t.signed_url) setPreviewIdx(tasks.indexOf(t)); }}
                                disabled={!t.signed_url}
                                title={t.signed_url ? `${platformLabel(platform)} — ${aLabel} (preview)` : undefined}
                                className={`${frameClass} overflow-hidden border border-border bg-muted/40 flex items-center justify-center relative ${t.signed_url ? "cursor-zoom-in hover:ring-2 hover:ring-primary/40" : ""}`}
                              >
                                {t.signed_url ? (
                                  <img src={t.signed_url} alt={`${platformLabel(platform)} ${aLabel}`} className="h-full w-full object-cover" />
                                ) : itemRunning ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-status-info" />
                                ) : err ? (
                                  <span className="text-[10px] text-status-danger">failed</span>
                                ) : (
                                  <ImageIcon className="h-4 w-4 text-muted-foreground/60" />
                                )}
                                <span className="absolute left-1 top-1 rounded bg-black/60 px-1 py-[1px] text-[9px] font-medium uppercase tracking-wide text-white">
                                  {isAvatar ? "Avatar" : (aLabel.length > 14 ? aLabel.split(" ")[0] : aLabel)}
                                </span>
                              </button>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  {done ? (
                                    <Check className="h-3.5 w-3.5 text-status-success" />
                                  ) : itemRunning ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-status-info" />
                                  ) : err ? (
                                    <span className="h-2 w-2 rounded-full bg-status-danger" />
                                  ) : (
                                    <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                                  )}
                                  <span className="font-semibold">{aLabel}</span>
                                  {t.qa_status === "fail" && (
                                    <span className="ml-1 rounded bg-status-warning/15 px-1 text-[9px] font-medium text-status-warning">
                                      {signatureFailed(t) ? "brand color" : "QA fail"}
                                    </span>
                                  )}
                                  {isKept && (
                                    <span className="ml-1 rounded bg-status-success/15 px-1 text-[9px] font-medium text-status-success">
                                      kept
                                    </span>
                                  )}
                                </div>
                                <div
                                  className="text-[10px] text-muted-foreground"
                                  title={t.last_feedback ? `Last feedback: ${t.last_feedback}` : undefined}
                                >
                                  {platformLabel(platform)}{dims ? ` · ${dims}` : ""}
                                  {t.last_feedback ? " · feedback applied" : ""}
                                </div>
                                {t.canvas_plan && (
                                  <div className="mt-1 flex items-center gap-0.5" title={`surface ${t.canvas_plan.surface} · ink ${t.canvas_plan.ink} · accent ${t.canvas_plan.accent}`}>
                                    <span className="h-2.5 w-2.5 rounded-sm border border-border" style={{ background: t.canvas_plan.surface }} />
                                    <span className="h-2.5 w-2.5 rounded-sm border border-border" style={{ background: t.canvas_plan.ink }} />
                                    <span className="h-2.5 w-2.5 rounded-sm border border-border" style={{ background: t.canvas_plan.accent }} />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-1 sm:ml-auto sm:justify-end">
                              {t.signed_url && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewIdx(tasks.indexOf(t))}
                                  title="Preview"
                                  className="inline-flex h-6 items-center rounded border border-border px-1.5 text-[10px] hover:bg-muted/40"
                                >
                                  <Eye className="mr-1 h-3 w-3" /> Preview
                                </button>
                              )}
                              {t.signed_url && (
                                <a href={t.signed_url} download
                                   className="inline-flex h-6 items-center rounded border border-border px-1.5 text-[10px] hover:bg-muted/40">
                                  Download
                                </a>
                              )}
                              {done && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-[11px]"
                                  onClick={() => setKept((prev) => ({ ...prev, [k]: !prev[k] }))}
                                  title={isKept ? "Unlock for regenerate-all" : "Keep this — exclude from regenerate-all"}
                                >
                                  {isKept ? "Unkeep" : "Keep"}
                                </Button>
                              )}
                              {!done && !err && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[11px]"
                                  disabled={running || itemRunning}
                                  onClick={async () => {
                                    setTaskRunning(k, true);
                                    try {
                                      await generateOneKitTask(snapshotId, t);
                                      await qc.invalidateQueries({ queryKey: ["social-cover", snapshotId] });
                                      setErrors((prev) => { const n = { ...prev }; delete n[k]; return n; });
                                    } catch (e: any) {
                                      setErrors((prev) => ({ ...prev, [k]: generationErrorMessage(e) }));
                                    } finally {
                                      setTaskRunning(k, false);
                                    }
                                  }}
                                >
                                  {itemRunning ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />} Generate
                                </Button>
                              )}
                              {(err || done) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[11px]"
                                  disabled={running || itemRunning}
                                  onClick={() => setRegenTarget({ scope: "single", task: t })}
                                >
                                  {itemRunning ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />} Regenerate
                                </Button>
                              )}
                              {done && t.asset_id && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-1.5 text-status-danger hover:bg-status-danger/10 hover:text-status-danger"
                                  disabled={running || itemRunning}
                                  onClick={() => deleteAsset(t)}
                                  title="Delete this image — tile will reset for a fresh generation"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        );

      })()}


      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg border border-status-warning/30 bg-status-warning/10 p-3 text-xs text-status-warning">
          <div className="font-semibold">Some assets could not generate.</div>
          <div className="mt-1 text-status-warning/90">
            {Array.from(new Set(Object.values(errors))).slice(0, 2).join(" ")}
          </div>
        </div>
      )}

      {anyDone && !allDone && (
        <p className="text-[11px] text-muted-foreground">
          {tasks.filter((t) => t.status === "done").length} of {tasks.length} assets ready. You can continue to launch now and finish the rest later from this step.
        </p>
      )}
      <footer className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-3 w-3" /> Back</Button>
        <div className="flex items-center gap-2">
          {anyDone && tasks.some((t) => t.status !== "done") && (
            <Button variant="outline" onClick={() => runAll()} disabled={running}>
              {running ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              Generate missing ({tasks.filter((t) => t.status !== "done").length})
            </Button>
          )}
          {anyDone ? (
            <Button onClick={onContinue} disabled={running}>
              Continue to launch <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          ) : (
            <Button onClick={() => runAll()} disabled={running}>
              {running ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
              Generate all
            </Button>
          )}

        </div>
      </footer>

      {regenTarget && (
        <RegenerateAssetDialog
          open={!!regenTarget}
          onOpenChange={(v) => { if (!v) setRegenTarget(null); }}
          scope={regenTarget.scope}
          targetLabel={
            regenTarget.scope === "all"
              ? `${tasks.filter((t) => !kept[`${t.platform}:${t.asset}`]).length} assets`
              : `${regenTarget.task?.platform} ${String(regenTarget.task?.asset || "").replace(/_/g, " ")}`
          }
          thumbnailUrl={regenTarget.task?.signed_url ?? null}
          currentDirection={regenTarget.task?.direction || direction}
          canvasPlan={regenTarget.task?.canvas_plan ?? null}
          currentHeadline={regenTarget.task?.last_headline ?? null}
          currentLogoSize={(regenTarget.task as any)?.last_logo_size ?? null}
          currentScene={(regenTarget.task as any)?.qa_notes?.scene?.depict ?? null}

          initialIntensity={regenTarget.scope === "single" && signatureFailed(regenTarget.task) ? "bold" : "balanced"}
          focusSection={regenTarget.focusSection}
          onSubmit={async (input) => {
            if (regenTarget.scope === "single") {
              await regenerateSingle(regenTarget.task, input);
            } else {
              await regenerateAll({
                feedback: input.feedback,
                signatureIntensity: input.signatureIntensity,
                signaturePlacement: input.signaturePlacement,
                paletteOverride: input.paletteOverride,
                headlineOverride: input.headlineOverride,
                logoSize: input.logoSize,
                sceneOverride: input.sceneOverride,
                refreshScenes: input.refreshScenes,
              });
            }
          }}
        />
      )}

      {previewIdx !== null && (() => {
        const t = tasks[previewIdx];
        if (!t) return null;
        const goPrev = () => {
          if (!previewableIdxs.length) return;
          const pos = previewableIdxs.indexOf(previewIdx);
          const next = previewableIdxs[(pos - 1 + previewableIdxs.length) % previewableIdxs.length];
          setPreviewIdx(next);
        };
        const goNext = () => {
          if (!previewableIdxs.length) return;
          const pos = previewableIdxs.indexOf(previewIdx);
          const next = previewableIdxs[(pos + 1) % previewableIdxs.length];
          setPreviewIdx(next);
        };
        const asset: PreviewableAsset = {
          url: t.signed_url ?? null,
          title: `${t.platform} — ${String(t.asset).replace(/_/g, " ")}`,
          subtitle: t.guidance ?? null,
          platform: t.platform,
          assetKind: t.asset,
          width: t.width ?? null,
          height: t.height ?? null,
          canvasPlan: t.canvas_plan ?? null,
          qaStatus: t.qa_status ?? null,
          qaNotes: t.qa_notes ?? null,
          modelUsed: t.model_used ?? null,
          lastFeedback: t.last_feedback ?? null,
          lastHeadline: (t as any).last_headline ?? null,
          lastLogoSize: (t as any).last_logo_size ?? null,
          updatedAt: t.updated_at ?? null,
        };
        return (
          <AssetPreviewDialog
            open={previewIdx !== null}
            onOpenChange={(v) => !v && setPreviewIdx(null)}
            asset={asset}
            onPrev={previewableIdxs.length > 1 ? goPrev : undefined}
            onNext={previewableIdxs.length > 1 ? goNext : undefined}
            busy={!!runningKeys[`${t.platform}:${t.asset}`]}
            onRegenerate={() => setRegenTarget({ scope: "single", task: t })}
            onEditHeadline={() => setRegenTarget({ scope: "single", task: t, focusSection: "headline" })}
            onEditLogoSize={() => setRegenTarget({ scope: "single", task: t, focusSection: "logo" })}
            onDelete={t.asset_id ? () => { setPreviewIdx(null); deleteAsset(t); } : undefined}
          />
        );
      })()}
    </div>
  );
}


// ====================== STEP 6 — Launch ======================
function Step6Launch({
  snapshot, snapshotId, platforms, direction, launchStatus, onBack, onUpdate,
}: {
  snapshot: any; snapshotId: string; platforms: string[]; direction: string;
  launchStatus: Record<string, { live?: boolean }>;
  onBack: () => void; onUpdate: (ls: any) => void;
}) {
  const docsQ = useQuery({
    queryKey: ["social-plan-docs", snapshotId],
    queryFn: () => listPlanDocs(snapshotId),
  });
  const launchDoc = (docsQ.data ?? []).find((d: any) => d.type === "launch_content_kit")?.doc;
  const launchMd = launchDoc?.content ?? "";

  const assetsQ = useQuery({
    queryKey: ["social-cover", snapshotId],
    queryFn: () => listSocialAssets(snapshotId),
  });
  const assets = assetsQ.data ?? [];

  const handle = ((snapshot?.company_name || "yourbrand") + "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
  const bio = snapshot?.tagline || snapshot?.one_liner || snapshot?.summary || "Helping founders launch.";

  const copy = (t: string, label = "Copied") => { navigator.clipboard.writeText(t); toast.success(label); };
  const setLive = (platform: string, live: boolean) =>
    onUpdate({ ...launchStatus, [platform]: { live } });

  const qc = useQueryClient();
  const confirm = useConfirm();
  const [clearing, setClearing] = useState(false);
  const [regenerating, setRegenerating] = useState<Record<string, boolean>>({});

  const kitTasks = useMemo(
    () => buildKitTasks(platforms, direction, PLATFORM_SPECS as any),
    [platforms, direction],
  );

  const regenerate = async (platform?: string, asset?: string) => {
    const targets = kitTasks.filter((task) =>
      (!platform || task.platform === platform) && (!asset || task.asset === asset),
    );
    if (targets.length === 0) {
      toast.error("No matching creative found to regenerate.");
      return;
    }
    const scopeKey = platform ? `${platform}:${asset || "all"}` : "all";
    setRegenerating((current) => ({ ...current, [scopeKey]: true }));
    let failed = 0;
    try {
      for (const task of targets) {
        try {
          await generateOneKitTask(snapshotId, task);
          await qc.invalidateQueries({ queryKey: ["social-cover", snapshotId] });
        } catch (error) {
          failed += 1;
          toast.error(generationErrorMessage(error));
        }
      }
      if (!failed) toast.success(platform ? `${platform} creative regenerated.` : "All creative regenerated.");
    } finally {
      setRegenerating((current) => {
        const next = { ...current };
        delete next[scopeKey];
        return next;
      });
    }
  };

  /** Delete the generated images for one channel, or for every channel, so the
   *  founder can go back and build a fresh set rather than living with these. */
  const clearImages = async (platform?: string) => {
    const targets = assets.filter((a: any) => a.id && (!platform || a.platform === platform));
    if (targets.length === 0) { toast.info("No images to clear here."); return; }
    const ok = await confirm({
      title: platform ? `Clear ${platform} images?` : "Clear all generated images?",
      description: platform
        ? `Deletes the ${targets.length} generated image${targets.length === 1 ? "" : "s"} for ${platform}. Go back to Build kit to generate a fresh set.`
        : `Deletes all ${targets.length} generated image${targets.length === 1 ? "" : "s"} across every channel. Your brand kit, style and channel choices stay put — go back to Build kit to start the artwork over.`,
      destructive: true,
      confirmText: "Clear",
    });
    if (!ok) return;
    setClearing(true);
    let failed = 0;
    try {
      for (const a of targets) {
        try { await deleteSocialAsset(snapshotId, a.id); } catch { failed += 1; }
      }
      await qc.invalidateQueries({ queryKey: ["social-cover", snapshotId] });
      if (failed) toast.error(`Cleared, but ${failed} image${failed === 1 ? "" : "s"} could not be deleted.`);
      else toast.success(platform ? `${platform} images cleared.` : "All images cleared — head back to Build kit to start over.");
    } finally {
      setClearing(false);
    }
  };

  const liveCount = platforms.filter((p) => launchStatus[p]?.live).length;
  const allLive = platforms.length > 0 && liveCount === platforms.length;
  const anyImages = assets.length > 0;

  // Click-to-magnify: flat list of every generated image on this screen.
  const previewables = useMemo(
    () => assets.filter((a: any) => a.signed_url),
    [assets],
  );
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewIdx = previewables.findIndex((a: any) => a.id === previewId);
  const previewAsset = previewIdx >= 0 ? previewables[previewIdx] : null;
  const stepPreview = (delta: number) => {
    if (previewables.length < 2 || previewIdx < 0) return;
    const next = (previewIdx + delta + previewables.length) % previewables.length;
    setPreviewId(previewables[next].id);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">You're ready to launch</h3>
          <p className="text-xs text-muted-foreground">One card per channel. Sign in, paste, post — done.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 text-[11px]"
            disabled={Object.keys(regenerating).length > 0}
            onClick={() => regenerate()}
          >
            {regenerating.all ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
            Regenerate all
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[11px] text-destructive hover:text-destructive"
            disabled={clearing}
            onClick={() => clearImages()}
            title="Delete every generated image and start the artwork over"
          >
            <Trash2 className="mr-1 h-3 w-3" /> Reset all images
          </Button>

          <Badge variant="outline" className="text-[10px]">{liveCount} / {platforms.length} live</Badge>
        </div>
      </header>


      {allLive && (
        <div className="flex items-center gap-2 rounded-lg border border-status-success/30 bg-status-success/10 p-3 text-xs">
          <PartyPopper className="h-4 w-4 text-status-success" />
          You're live everywhere. Come back weekly for new posts from your calendar.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {platforms.map((p) => {
          const avatar = assets.find((a: any) => a.platform === p && a.asset_kind === "avatar");
          const coverKind = coverKindFor(p, PLATFORM_SPECS as any);
          const coverLabel = coverLabelFor(p, PLATFORM_SPECS as any);
          const cover = coverKind
            ? assets.find((a: any) => a.platform === p && a.asset_kind === coverKind)
            : undefined;

          const live = !!launchStatus[p]?.live;
          const firstPost = extractFirstPost(launchMd, p);
          return (
            <div key={p} className={`rounded-xl border bg-background/40 p-3 ${live ? "border-status-success/30" : "border-border"}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{p}</h4>
                {live && <Check className="h-4 w-4 text-status-success" />}
              </div>

              <div className="mt-2 grid grid-cols-[56px_1fr] gap-2">
                <div>
                  <button
                    type="button"
                    onClick={() => avatar?.signed_url && setPreviewId(avatar.id)}
                    disabled={!avatar?.signed_url}
                    title={avatar?.signed_url ? `Preview ${p} avatar` : undefined}
                    className="group relative h-14 w-14 overflow-hidden rounded-full border border-border bg-muted/40 transition hover:border-primary disabled:cursor-default"
                  >
                    {avatar?.signed_url
                      ? <img src={avatar.signed_url} alt={`${p} avatar`} className="h-full w-full object-cover transition group-hover:scale-105" />
                      : <div className="flex h-full w-full items-center justify-center text-muted-foreground"><ImageIcon className="h-4 w-4" /></div>}
                  </button>
                  <Button size="sm" variant="ghost" className="mt-1 h-6 w-full px-1 text-[9px]" disabled={!!regenerating[`${p}:avatar`]} onClick={() => regenerate(p, "avatar")}>
                    {regenerating[`${p}:avatar`] ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />} Regenerate
                  </Button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => cover?.signed_url && setPreviewId(cover.id)}
                    disabled={!cover?.signed_url}
                    title={cover?.signed_url ? `Preview ${p} ${coverLabel.toLowerCase()}` : undefined}
                    className="group relative block aspect-[4/1] w-full overflow-hidden rounded-md border border-border bg-muted/40 transition hover:border-primary disabled:cursor-default"
                  >
                    {cover?.signed_url
                      ? <img src={cover.signed_url} alt={`${p} ${coverLabel}`} className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
                      : <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">no {coverLabel.toLowerCase()}</div>}
                    {cover?.signed_url && (
                      <span className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-background/50 text-[10px] font-medium group-hover:flex">
                        Click to enlarge
                      </span>
                    )}
                  </button>
                  <Button size="sm" variant="ghost" className="mt-1 h-6 px-1.5 text-[9px]" disabled={!coverKind || !!regenerating[`${p}:${coverKind}`]} onClick={() => coverKind && regenerate(p, coverKind)}>
                    <RefreshCw className="mr-1 h-3 w-3" /> Regenerate {coverLabel.toLowerCase()}
                  </Button>

                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Button size="sm" className="h-6 px-1.5 text-[10px]" disabled={!!regenerating[`${p}:all`]} onClick={() => regenerate(p)}>
                  {regenerating[`${p}:all`] ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />} Regenerate {p}
                </Button>
                {avatar?.signed_url && (
                  <a href={avatar.signed_url} download className="inline-flex h-6 items-center rounded border border-border px-1.5 text-[10px] hover:bg-muted/40">
                    Download avatar
                  </a>
                )}
                {cover?.signed_url && (
                  <a href={cover.signed_url} download className="inline-flex h-6 items-center rounded border border-border px-1.5 text-[10px] hover:bg-muted/40">
                    Download cover
                  </a>
                )}
                <button
                  type="button"
                  disabled={clearing}
                  onClick={() => clearImages(p)}
                  className="inline-flex h-6 items-center rounded border border-destructive/30 px-1.5 text-[10px] text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  title={`Delete the generated images for ${p}`}
                >
                  <Trash2 className="mr-1 h-3 w-3" /> Reset {p}
                </button>

              </div>


              <div className="mt-2 space-y-1 text-[11px]">
                <Row label="Handle" value={`@${handle}`} onCopy={() => copy(handle, "Handle copied")} />
                <Row label="Bio" value={bio} onCopy={() => copy(bio, "Bio copied")} />
              </div>

              {firstPost && (
                <details className="mt-2 rounded border border-border bg-background/30 p-2 text-[11px]">
                  <summary className="cursor-pointer font-medium">First post</summary>
                  <pre className="mt-1 whitespace-pre-wrap text-muted-foreground">{firstPost}</pre>
                  <Button size="sm" variant="ghost" className="mt-1 h-6 text-[10px]" onClick={() => copy(firstPost, "Post copied")}>
                    <Copy className="mr-1 h-3 w-3" /> Copy post
                  </Button>
                </details>
              )}

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                <a href={SIGNUP_URLS[p] || "#"} target="_blank" rel="noreferrer"
                   className="inline-flex h-6 items-center gap-1 rounded border border-border px-2 text-[10px] hover:bg-muted/40">
                  Open {p} <ExternalLink className="h-3 w-3" />
                </a>
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px]">
                  <Checkbox checked={live} onCheckedChange={(v) => setLive(p, !!v)} />
                  I posted this — mark channel live
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <AssetPreviewDialog
        open={!!previewAsset}
        onOpenChange={(v) => !v && setPreviewId(null)}
        asset={
          previewAsset
            ? {
                url: previewAsset.signed_url,
                title: `${previewAsset.platform} — ${String(previewAsset.asset_kind || "").replace(/_/g, " ")}`,
                subtitle: snapshot?.company_name || null,
                platform: previewAsset.platform,
                assetKind: previewAsset.asset_kind,
                width: previewAsset.width,
                height: previewAsset.height,
                canvasPlan: previewAsset.canvas_plan ?? null,
                qaStatus: previewAsset.qa_status ?? null,
                qaNotes: previewAsset.qa_notes ?? null,
                modelUsed: previewAsset.model_used ?? null,
                lastFeedback: previewAsset.last_feedback ?? null,
                lastHeadline: previewAsset.last_headline,
                lastLogoSize: previewAsset.last_logo_size ?? null,
                updatedAt: previewAsset.updated_at ?? null,
              }
            : null
        }
        busy={!!previewAsset && !!regenerating[`${previewAsset.platform}:${previewAsset.asset_kind}`]}
        onRegenerate={previewAsset ? () => regenerate(previewAsset.platform, previewAsset.asset_kind) : undefined}
        onPrev={previewables.length > 1 ? () => stepPreview(-1) : undefined}
        onNext={previewables.length > 1 ? () => stepPreview(1) : undefined}
      />

      <footer className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-3 w-3" /> Back</Button>
        <span className="text-[11px] text-muted-foreground">Need to tweak assets? Open Advanced mode.</span>
      </footer>
    </div>
  );
}

function Row({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded border border-border bg-background/30 px-2 py-1">
      <span className="w-12 shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="flex-1 truncate">{value}</span>
      <button type="button" onClick={onCopy} className="text-muted-foreground hover:text-foreground" title="Copy">
        <Copy className="h-3 w-3" />
      </button>
    </div>
  );
}

function extractFirstPost(md: string, platform: string): string {
  if (!md) return "";
  const re = new RegExp(`#{2,4}\\s*[^\\n]*\\b${platform}\\b[^\\n]*\\n([\\s\\S]*?)(?=\\n#{2,4}\\s|$)`, "i");
  const m = md.match(re);
  return (m?.[1] || "").trim().split(/\n{2,}/)[0] || "";
}
