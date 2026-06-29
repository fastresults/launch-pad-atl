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
  Settings2, Copy, ExternalLink, PartyPopper, Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSocialProgress, upsertSocialProgress, listPlanDocs, ensurePlanDoc,
  buildKitTasks, generateOneKitTask, PLAN_DOCS, type SocialGoals, type KitTask,
} from "@/lib/social-autopilot.functions";
import { PLATFORM_SPECS, ART_DIRECTIONS } from "@/lib/social-platform-specs";
import { listSocialAssets } from "@/lib/social-cover.functions";

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
      <div className="rounded-2xl border border-white/10 bg-card p-3">
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
                        : "border-white/10 text-muted-foreground"
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
        <div className="rounded-2xl border border-white/10 bg-card p-8 text-center">
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
    <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-5">
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
                  on ? "border-primary bg-primary/15 text-foreground" : "border-white/10 text-muted-foreground hover:text-foreground"
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
                camera === c.id ? "border-primary bg-primary/15" : "border-white/10 text-muted-foreground hover:text-foreground"
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
    <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-5">
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
              className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-background/40 px-3 py-2 text-xs"
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
    <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-5">
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
                on ? "border-primary bg-primary/10" : "border-white/10 bg-background/40 hover:border-white/20"
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
  kit, direction, onBack, onContinue,
}: { kit: any; direction: string | null; onBack: () => void; onContinue: (d: string) => void }) {
  const palette = kit?.palette?.colors ?? {};
  const colors = Object.values(palette).slice(0, 4) as string[];
  const head = kit?.typography?.heading?.family ?? "Inter";

  const [pick, setPick] = useState<string | null>(direction);

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-5">
      <header>
        <h3 className="text-base font-semibold">Pick a look</h3>
        <p className="text-xs text-muted-foreground">One tap. We'll apply it to every channel using your brand.</p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {ART_DIRECTIONS.map((d) => {
          const on = pick === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setPick(d.id)}
              className={`overflow-hidden rounded-xl border text-left transition ${
                on ? "border-primary ring-2 ring-primary/40" : "border-white/10 hover:border-white/20"
              }`}
            >
              <StylePreview id={d.id} colors={colors} fontFamily={head} />
              <div className="p-2">
                <div className="text-sm font-semibold">{d.label}</div>
                <p className="line-clamp-2 text-[11px] text-muted-foreground">{d.blurb}</p>
              </div>
            </button>
          );
        })}
      </div>

      <footer className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-3 w-3" /> Back</Button>
        <Button disabled={!pick} onClick={() => onContinue(pick!)}>
          Continue <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </footer>
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
  const assetsQ = useQuery({
    queryKey: ["social-cover", snapshotId],
    queryFn: () => listSocialAssets(snapshotId),
  });
  const assets = assetsQ.data ?? [];

  const baseTasks = useMemo(
    () => buildKitTasks(platforms, direction, PLATFORM_SPECS as any),
    [platforms, direction],
  );

  const tasks: (KitTask & { signed_url?: string | null; canvas_plan?: any; qa_status?: string | null; last_feedback?: string | null })[] = useMemo(() => {
    return baseTasks.map((t) => {
      const match = assets.find(
        (a: any) => a.platform === t.platform && a.asset_kind === t.asset && a.art_direction === direction,
      );
      return {
        ...t,
        status: match ? "done" : t.status,
        signed_url: match?.signed_url ?? null,
        canvas_plan: match?.canvas_plan ?? null,
        qa_status: match?.qa_status ?? null,
        last_feedback: match?.last_feedback ?? null,
      };
    });
  }, [baseTasks, assets, direction]);

  const [running, setRunning] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [kept, setKept] = useState<Record<string, boolean>>({});
  const [regenTarget, setRegenTarget] = useState<null | { scope: "single" | "all"; task?: any }>(null);
  const allDone = tasks.every((t) => t.status === "done");

  const runAll = async () => {
    setRunning(true);
    setErrors({});
    for (const t of tasks) {
      if (t.status === "done") continue;
      try {
        await generateOneKitTask(snapshotId, t);
        await qc.invalidateQueries({ queryKey: ["social-cover", snapshotId] });
      } catch (e: any) {
        setErrors((prev) => ({ ...prev, [`${t.platform}:${t.asset}`]: e.message ?? "failed" }));
      }
    }
    setRunning(false);
  };

  const regenerateSingle = async (t: any, opts: { feedback: string; directionOverride?: string }) => {
    try {
      await generateOneKitTask(snapshotId, t, opts);
      await qc.invalidateQueries({ queryKey: ["social-cover", snapshotId] });
      setErrors((prev) => { const n = { ...prev }; delete n[`${t.platform}:${t.asset}`]; return n; });
      toast.success("Regenerated");
    } catch (e: any) {
      toast.error(e.message ?? "failed");
    }
  };

  const regenerateAll = async (opts: { feedback: string }) => {
    setRunning(true);
    try {
      for (const t of tasks) {
        const k = `${t.platform}:${t.asset}`;
        if (kept[k]) continue;
        try {
          await generateOneKitTask(snapshotId, t, opts);
          await qc.invalidateQueries({ queryKey: ["social-cover", snapshotId] });
        } catch (e: any) {
          setErrors((prev) => ({ ...prev, [k]: e.message ?? "failed" }));
        }
      }
      toast.success("Regenerated all unlocked assets");
    } finally {
      setRunning(false);
    }
  };

  const anyDone = tasks.some((t) => t.status === "done");

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-5">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">Generating your channel kits</h3>
          <p className="text-xs text-muted-foreground">Avatar + cover for each channel, in your chosen style.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] capitalize">{direction}</Badge>
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
        </div>
      </header>

      <ul className="grid gap-2 sm:grid-cols-2">
        {tasks.map((t) => {
          const k = `${t.platform}:${t.asset}`;
          const done = t.status === "done";
          const err = errors[k];
          const isAvatar = t.asset === "avatar";
          const isKept = !!kept[k];
          const frameClass = isAvatar
            ? "h-16 w-16 shrink-0 rounded-full"
            : "h-16 w-28 shrink-0 rounded-md";
          return (
            <li key={k}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-background/40 p-2 text-xs">
              <div className={`${frameClass} overflow-hidden border border-white/10 bg-muted/40 flex items-center justify-center relative`}>
                {t.signed_url ? (
                  <img src={t.signed_url} alt={`${t.platform} ${t.asset}`} className="h-full w-full object-cover" />
                ) : running && !done ? (
                  <Loader2 className="h-4 w-4 animate-spin text-status-info" />
                ) : err ? (
                  <span className="text-[10px] text-status-danger">failed</span>
                ) : (
                  <ImageIcon className="h-4 w-4 text-muted-foreground/60" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {done ? (
                      <Check className="h-3.5 w-3.5 text-status-success" />
                    ) : running ? (
                      <Loader2 className="h-3 w-3 animate-spin text-status-info" />
                    ) : err ? (
                      <span className="h-2 w-2 rounded-full bg-status-danger" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    )}
                    <span className="truncate font-medium">{t.platform}</span>
                    {t.qa_status === "fail" && (
                      <span className="ml-1 rounded bg-status-warning/15 px-1 text-[9px] font-medium text-status-warning">
                        contrast
                      </span>
                    )}
                    {isKept && (
                      <span className="ml-1 rounded bg-status-success/15 px-1 text-[9px] font-medium text-status-success">
                        kept
                      </span>
                    )}
                  </div>
                  <div
                    className="truncate text-[10px] capitalize text-muted-foreground"
                    title={t.last_feedback ? `Last feedback: ${t.last_feedback}` : undefined}
                  >
                    {t.asset.replace(/_/g, " ")}
                    {t.last_feedback ? " · feedback applied" : ""}
                  </div>
                  {t.canvas_plan && (
                    <div className="mt-1 flex items-center gap-0.5" title={`surface ${t.canvas_plan.surface} · ink ${t.canvas_plan.ink} · accent ${t.canvas_plan.accent}`}>
                      <span className="h-2.5 w-2.5 rounded-sm border border-white/20" style={{ background: t.canvas_plan.surface }} />
                      <span className="h-2.5 w-2.5 rounded-sm border border-white/20" style={{ background: t.canvas_plan.ink }} />
                      <span className="h-2.5 w-2.5 rounded-sm border border-white/20" style={{ background: t.canvas_plan.accent }} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {t.signed_url && (
                    <a href={t.signed_url} download
                       className="inline-flex h-6 items-center rounded border border-white/10 px-1.5 text-[10px] hover:bg-white/5">
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
                  {(err || done) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[11px]"
                      disabled={running}
                      onClick={() => setRegenTarget({ scope: "single", task: t })}
                    >
                      <RefreshCw className="mr-1 h-3 w-3" /> Regenerate
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <footer className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-3 w-3" /> Back</Button>
        {allDone ? (
          <Button onClick={onContinue}>Next: launch <ArrowRight className="ml-1 h-3 w-3" /></Button>
        ) : (
          <Button onClick={runAll} disabled={running}>
            {running ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            Generate all
          </Button>
        )}
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
          onSubmit={async (input) => {
            if (regenTarget.scope === "single") {
              await regenerateSingle(regenTarget.task, input);
            } else {
              await regenerateAll({ feedback: input.feedback });
            }
          }}
        />
      )}
    </div>
  );
}


// ====================== STEP 6 — Launch ======================
function Step6Launch({
  snapshot, snapshotId, platforms, launchStatus, onBack, onUpdate,
}: {
  snapshot: any; snapshotId: string; platforms: string[];
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

  const liveCount = platforms.filter((p) => launchStatus[p]?.live).length;
  const allLive = platforms.length > 0 && liveCount === platforms.length;

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-card p-5">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">You're ready to launch</h3>
          <p className="text-xs text-muted-foreground">One card per channel. Sign in, paste, post — done.</p>
        </div>
        <Badge variant="outline" className="text-[10px]">{liveCount} / {platforms.length} live</Badge>
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
          const cover = assets.find((a: any) => a.platform === p && ["banner","header","channel_art"].includes(a.asset_kind));
          const live = !!launchStatus[p]?.live;
          const firstPost = extractFirstPost(launchMd, p);
          return (
            <div key={p} className={`rounded-xl border bg-background/40 p-3 ${live ? "border-status-success/30" : "border-white/10"}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{p}</h4>
                {live && <Check className="h-4 w-4 text-status-success" />}
              </div>

              <div className="mt-2 grid grid-cols-[56px_1fr] gap-2">
                <div className="h-14 w-14 overflow-hidden rounded-full border border-white/10 bg-muted/40">
                  {avatar?.signed_url
                    ? <img src={avatar.signed_url} alt="" className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center text-muted-foreground"><ImageIcon className="h-4 w-4" /></div>}
                </div>
                <div className="aspect-[4/1] overflow-hidden rounded-md border border-white/10 bg-muted/40">
                  {cover?.signed_url
                    ? <img src={cover.signed_url} alt="" className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">no cover</div>}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {avatar?.signed_url && (
                  <a href={avatar.signed_url} download className="inline-flex h-6 items-center rounded border border-white/10 px-1.5 text-[10px] hover:bg-white/5">
                    Download avatar
                  </a>
                )}
                {cover?.signed_url && (
                  <a href={cover.signed_url} download className="inline-flex h-6 items-center rounded border border-white/10 px-1.5 text-[10px] hover:bg-white/5">
                    Download cover
                  </a>
                )}
              </div>

              <div className="mt-2 space-y-1 text-[11px]">
                <Row label="Handle" value={`@${handle}`} onCopy={() => copy(handle, "Handle copied")} />
                <Row label="Bio" value={bio} onCopy={() => copy(bio, "Bio copied")} />
              </div>

              {firstPost && (
                <details className="mt-2 rounded border border-white/5 bg-background/30 p-2 text-[11px]">
                  <summary className="cursor-pointer font-medium">First post</summary>
                  <pre className="mt-1 whitespace-pre-wrap text-muted-foreground">{firstPost}</pre>
                  <Button size="sm" variant="ghost" className="mt-1 h-6 text-[10px]" onClick={() => copy(firstPost, "Post copied")}>
                    <Copy className="mr-1 h-3 w-3" /> Copy post
                  </Button>
                </details>
              )}

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2">
                <a href={SIGNUP_URLS[p] || "#"} target="_blank" rel="noreferrer"
                   className="inline-flex h-6 items-center gap-1 rounded border border-white/10 px-2 text-[10px] hover:bg-white/5">
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

      <footer className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-3 w-3" /> Back</Button>
        <span className="text-[11px] text-muted-foreground">Need to tweak assets? Open Advanced mode.</span>
      </footer>
    </div>
  );
}

function Row({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded border border-white/5 bg-background/30 px-2 py-1">
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
