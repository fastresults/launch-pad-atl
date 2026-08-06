// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2, ArrowLeft, ArrowRight, Sparkles, Lock, RefreshCw, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  getBrandKit,
  upsertBrandKit,
  fetchPaletteOptions,
  fetchTypographyOptions,
  generateStyleGuide,
} from "@/lib/brandKit.functions";
import {
  loadGoogleFont,
  contrastRatio,
  aaBadge,
  PERSONALITY_AXES,
} from "@/lib/brand-wizard";
import { sanitizePaletteOption, validatePalette } from "@/lib/brand/palette-rules";
import { generateBrandAsset } from "@/lib/foundersHub.functions";
import { brandKitToDocxBlob, validateBrandGuideDocxBlob } from "@/lib/brand-guide-docx";
import { createDocumentUploadUrl, finalizeDocument } from "@/lib/attendee.functions";
import { LiveBrandPreview } from "./LiveBrandPreview";
import { VisualBrandGuide } from "./VisualBrandGuide";
import { Step1TrackPicker } from "./Step1TrackPicker";
import { ExistingBrandIntake } from "./ExistingBrandIntake";
import { EditablePaletteSwatch } from "@/components/hub/brand/EditablePaletteSwatch";

const STEPS_NEW = ["DNA", "Palette", "Typography", "Moodboard & Logo", "Voice & Review"];
const STEPS_EXISTING = ["Track", "Upload & site", "Voice & Review"];

export function BrandWizard({
  snapshot,
  open,
  onOpenChange,
}: {
  snapshot: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const snapshotId = snapshot.id;
  const kitQ = useQuery({
    queryKey: ["brandKit", snapshotId],
    queryFn: () => getBrandKit(snapshotId),
    enabled: open,
  });
  const kit = kitQ.data;
  const track: "existing" | "new" | undefined = kit?.dna?.track;
  const STEPS = track === "existing" ? STEPS_EXISTING : track === "new" ? STEPS_NEW : ["Track"];
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (kit?.step && kit.step !== step) setStep(kit.step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kit?.id]);

  const save = useMutation({
    mutationFn: (patch: any) => upsertBrandKit(snapshotId, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brandKit", snapshotId] }),
  });

  const goTo = (n: number) => {
    setStep(n);
    save.mutate({ step: n });
  };

  const pickTrack = async (t: "existing" | "new") => {
    await upsertBrandKit(snapshotId, { dna: { ...(kit?.dna ?? {}), track: t }, step: 2 });
    qc.invalidateQueries({ queryKey: ["brandKit", snapshotId] });
    setStep(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] max-h-[92vh] max-w-7xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-white/10 px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Brand Wizard — {snapshot.company_name || "Your venture"}
            {track && (
              <Badge variant="outline" className="ml-2 text-[10px]">
                {track === "existing" ? "Existing brand track" : "Build-from-scratch track"}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Configure the brand direction, visual system, and generated assets for this startup.
          </DialogDescription>
          <div className="mt-3 flex items-center gap-2">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const active = n === step;
              const done = n < step;
              return (
                <button
                  key={label}
                  onClick={() => goTo(n)}
                  className={`flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition ${
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : done
                      ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                      : "border-white/10 bg-card text-muted-foreground hover:border-white/20"
                  }`}
                >
                  <span className="mr-1 font-mono">{n}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_360px]">
          <div className="min-h-0 overflow-y-auto px-6 pb-8 pt-5">
            {kitQ.isLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading kit…
              </div>
            ) : !track ? (
              <Step1TrackPicker kit={kit} onPick={pickTrack} />
            ) : track === "existing" ? (
              <>
                {step === 1 && <Step1TrackPicker kit={kit} onPick={pickTrack} />}
                {step === 2 && (
                  <ExistingBrandIntake
                    snapshot={snapshot}
                    kit={kit}
                    onBack={() => goTo(1)}
                    onExtracted={() => goTo(3)}
                  />
                )}
                {step === 3 && <StepReview snapshot={snapshot} kit={kit} onSave={save.mutate} onBack={() => goTo(2)} onDone={() => onOpenChange(false)} />}
              </>
            ) : (
              <>
                {step === 1 && <StepDNA snapshot={snapshot} kit={kit} onSave={save.mutate} onNext={() => goTo(2)} />}
                {step === 2 && <StepPalette snapshot={snapshot} kit={kit} onSave={save.mutate} onBack={() => goTo(1)} onNext={() => goTo(3)} />}
                {step === 3 && <StepTypography snapshot={snapshot} kit={kit} onSave={save.mutate} onBack={() => goTo(2)} onNext={() => goTo(4)} />}
                {step === 4 && <StepMoodboard snapshot={snapshot} kit={kit} onSave={save.mutate} onBack={() => goTo(3)} onNext={() => goTo(5)} />}
                {step === 5 && <StepReview snapshot={snapshot} kit={kit} onSave={save.mutate} onBack={() => goTo(4)} onDone={() => onOpenChange(false)} />}
              </>
            )}
          </div>
          <aside className="hidden min-h-0 overflow-y-auto border-l border-white/10 bg-background/40 px-4 py-4 lg:block">
            <LiveBrandPreview kit={kit} snapshot={snapshot} />
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}


/* ---------- STEP 1: DNA ---------- */
function StepDNA({ snapshot, kit, onSave, onNext }: any) {
  const [dna, setDna] = useState<any>(kit?.dna ?? {
    personality: { modern: 50, playful: 50, bold: 50, premium: 50 },
    mood: [],
    admired: [],
  });
  const [moodInput, setMoodInput] = useState("");
  const [admiredInput, setAdmiredInput] = useState((kit?.dna?.admired ?? []).join(", "));

  const next = () => {
    const finalDna = { ...dna, admired: admiredInput.split(",").map((s) => s.trim()).filter(Boolean) };
    onSave({ dna: finalDna });
    onNext();
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Confirm a few signals so your brand reflects your venture's personality.
      </p>
      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Personality</Label>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {PERSONALITY_AXES.map((a) => (
            <div key={a.key}>
              <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                <span>{a.left}</span><span>{a.right}</span>
              </div>
              <Slider
                value={[dna.personality?.[a.key] ?? 50]}
                onValueChange={(v) => setDna((d: any) => ({ ...d, personality: { ...d.personality, [a.key]: v[0] } }))}
                max={100}
                step={5}
              />
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Mood adjectives (up to 5)</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(dna.mood ?? []).map((m: string, i: number) => (
            <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setDna((d: any) => ({ ...d, mood: d.mood.filter((x: string) => x !== m) }))}>
              {m} ✕
            </Badge>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Input
            value={moodInput}
            onChange={(e) => setMoodInput(e.target.value)}
            placeholder="e.g. confident, warm, editorial"
            onKeyDown={(e) => {
              if (e.key === "Enter" && moodInput.trim()) {
                e.preventDefault();
                setDna((d: any) => ({ ...d, mood: [...(d.mood ?? []), moodInput.trim()].slice(0, 5) }));
                setMoodInput("");
              }
            }}
          />
          <Button variant="outline" onClick={() => { if (moodInput.trim()) { setDna((d: any) => ({ ...d, mood: [...(d.mood ?? []), moodInput.trim()].slice(0, 5) })); setMoodInput(""); }}}>Add</Button>
        </div>
      </div>
      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Brands you admire</Label>
        <Textarea
          className="mt-2"
          value={admiredInput}
          onChange={(e) => setAdmiredInput(e.target.value)}
          placeholder="Comma-separated, e.g. Linear, Notion, Patagonia"
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={next}>Continue <ArrowRight className="ml-1 h-4 w-4" /></Button>
      </div>
    </div>
  );
}

/* ---------- STEP 2: Palette ---------- */
function StepPalette({ snapshot, kit, onSave, onBack, onNext }: any) {
  const saved = kit?.palette ?? null;
  const initial = (kit?.dna?._paletteOptions ?? []).map(sanitizePaletteOption);
  // Ensure saved pick is always present in the visible options
  const seedOptions = (() => {
    if (!saved) return initial;
    if (initial.some((o: any) => o?.name === saved.name)) return initial;
    return [sanitizePaletteOption(saved), ...initial];
  })();
  const [options, setOptions] = useState<any[]>(seedOptions);
  const [chosen, setChosen] = useState<any>(saved ? sanitizePaletteOption(saved) : null);
  const gen = useMutation({
    mutationFn: () => fetchPaletteOptions(snapshot.id),
    onSuccess: (out) => {
      const next = (out.options ?? []).map(sanitizePaletteOption);
      setOptions(next);
      const persistedOptions = chosen && !next.some((o: any) => o?.name === chosen.name)
        ? [chosen, ...next]
        : next;
      onSave({ dna: { ...(kit?.dna ?? {}), _paletteOptions: persistedOptions } });
      if (chosen && !next.some((o: any) => o?.name === chosen.name)) setOptions(persistedOptions);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const choose = (opt: any) => {
    const safe = sanitizePaletteOption(opt);
    setChosen(safe);
    onSave({ palette: safe });
    if (safe.audit?.length) {
      toast.message("Palette adjusted for readability", {
        description: `${safe.audit.length} change${safe.audit.length === 1 ? "" : "s"} so text + buttons stay legible on web and social.`,
      });
    }
  };

  const autoFix = () => {
    if (!chosen) return;
    const re = sanitizePaletteOption(chosen);
    setChosen(re);
    onSave({ palette: re });
    toast.success("Palette repaired to meet WCAG AA");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Pick the palette direction that feels right. We auto-check contrast so it ports cleanly to your website and social creatives.</p>
        <Button variant="outline" size="sm" onClick={() => gen.mutate()} disabled={gen.isPending} title="Generate fresh options — your current pick is kept">
          {gen.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
          Show new options
        </Button>
      </div>

      {chosen && (
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">Your current pick</div>
            <div className="text-xs font-medium">{chosen.name}</div>
          </div>
          <div className="mt-2 flex gap-1.5">
            {Object.entries(chosen.colors ?? {}).map(([k, v]: any) => (
              <div key={k} className="flex-1">
                <div className="h-6 rounded border border-white/10" style={{ background: v }} />
                <div className="mt-0.5 text-[8px] font-mono text-muted-foreground">{k}</div>
              </div>
            ))}
          </div>

          {/* Pairings strip */}
          <div className="mt-3 space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Contrast pairings</div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {(chosen.contrast?.pairings ?? []).map((p: any) => (
                <div key={p.label} className="flex items-center justify-between rounded-md border border-white/10 px-2 py-1.5 text-[11px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-block h-4 w-7 rounded border border-white/10" style={{ background: p.bg }}>
                      <span className="block h-full w-full text-center text-[9px] font-semibold leading-4" style={{ color: p.fg }}>Aa</span>
                    </span>
                    <span className="truncate text-muted-foreground">{p.label}</span>
                  </div>
                  <span className={`ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${p.pass ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/15 text-rose-700 dark:text-rose-300"}`}>
                    {p.pass ? "AA ✓" : "Fail"} {p.ratio.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            {!chosen.contrast?.pass && (
              <div className="flex items-center justify-between rounded-md border border-amber-500/40 bg-amber-500/5 px-2 py-1.5 text-[11px] text-amber-700 dark:text-amber-300">
                <span>Some pairings don't meet WCAG AA — text won't stay legible on web/social.</span>
                <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={autoFix}>Auto-fix</Button>
              </div>
            )}
            {chosen.audit?.length > 0 && (
              <details className="rounded-md border border-white/10 px-2 py-1.5 text-[10px] text-muted-foreground">
                <summary className="cursor-pointer">{chosen.audit.length} auto-adjustment{chosen.audit.length === 1 ? "" : "s"} applied</summary>
                <ul className="mt-1 space-y-0.5 pl-3">
                  {chosen.audit.map((a: any, i: number) => (
                    <li key={i} className="list-disc">
                      <span className="font-mono">{a.field}</span>: {a.from} → {a.to} — {a.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      )}

      {options.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
          <p className="text-sm">No palette options yet.</p>
          <Button onClick={() => gen.mutate()} disabled={gen.isPending}>
            {gen.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
            Generate 4 palette directions
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {options.map((opt, i) => {
            const isPicked = chosen?.name === opt.name;
            const fgBgRatio = contrastRatio(opt.colors.fg, opt.colors.bg);
            const pass = opt.contrast?.pass ?? fgBgRatio >= 4.5;
            return (
              <button
                key={`${opt.name}-${i}`}
                onClick={() => choose(opt)}
                className={`relative rounded-xl border p-4 text-left transition ${isPicked ? "border-primary ring-2 ring-primary/30" : "border-white/10 hover:border-white/30"}`}
                style={{ background: opt.colors.bg, color: opt.colors.fg }}
              >
                {isPicked && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    <Check className="h-3 w-3" /> Selected
                  </span>
                )}
                <div className="font-semibold">{opt.name}</div>
                <div className="mt-1 text-xs opacity-80">{opt.rationale}</div>
                <div className="mt-3 flex gap-1.5">
                  {Object.entries(opt.colors).map(([k, v]: any) => (
                    <div key={k} className="flex-1">
                      <div className="h-10 rounded" style={{ background: v, border: "1px solid rgba(0,0,0,0.1)" }} />
                      <div className="mt-1 text-[9px] font-mono opacity-70">{k}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="opacity-60">Text contrast {fgBgRatio.toFixed(2)} — {aaBadge(fgBgRatio)}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${pass ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-200" : "bg-rose-500/20 text-rose-700 dark:text-rose-200"}`}>
                    {pass ? "AA ✓" : "Needs fix"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
        <Button onClick={onNext} disabled={!chosen || !(chosen.contrast?.pass ?? true)}>Continue <ArrowRight className="ml-1 h-4 w-4" /></Button>
      </div>
    </div>
  );
}

/* ---------- STEP 3: Typography ---------- */
function StepTypography({ snapshot, kit, onSave, onBack, onNext }: any) {
  const saved = kit?.typography ?? null;
  const initial = kit?.dna?._typographyOptions ?? [];
  const seedOptions = (() => {
    if (!saved) return initial;
    if (initial.some((o: any) => o?.name === saved.name)) return initial;
    return [saved, ...initial];
  })();
  const [options, setOptions] = useState<any[]>(seedOptions);
  const [chosen, setChosen] = useState<any>(saved);

  // Preload fonts for whatever's already on screen
  useEffect(() => {
    options.forEach((o: any) => {
      if (o?.heading?.family) loadGoogleFont(o.heading.family, [o.heading.weight ?? 700]);
      if (o?.body?.family) loadGoogleFont(o.body.family, [o.body.weight ?? 400]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.length]);

  const gen = useMutation({
    mutationFn: () => fetchTypographyOptions(snapshot.id),
    onSuccess: (out) => {
      const next = out.options ?? [];
      next.forEach((o: any) => {
        loadGoogleFont(o.heading?.family, [o.heading?.weight ?? 700]);
        loadGoogleFont(o.body?.family, [o.body?.weight ?? 400]);
      });
      setOptions(next);
      const persistedOptions = chosen && !next.some((o: any) => o?.name === chosen.name)
        ? [chosen, ...next]
        : next;
      onSave({ dna: { ...(kit?.dna ?? {}), _typographyOptions: persistedOptions } });
      if (chosen && !next.some((o: any) => o?.name === chosen.name)) setOptions(persistedOptions);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const tagline = snapshot.tagline || snapshot.company_name || "Your brand, beautifully expressed.";

  const choose = (opt: any) => {
    setChosen(opt);
    onSave({ typography: opt });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Pick a font pairing. Previews use your own tagline.</p>
        <Button variant="outline" size="sm" onClick={() => gen.mutate()} disabled={gen.isPending} title="Generate fresh options — your current pick is kept">
          {gen.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
          Show new options
        </Button>
      </div>

      {chosen && (
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">Your current pick</div>
            <div className="text-[10px] font-mono text-muted-foreground">{chosen.heading?.family} / {chosen.body?.family}</div>
          </div>
          <div className="mt-1 text-lg leading-tight" style={{ fontFamily: `'${chosen.heading?.family}', system-ui`, fontWeight: chosen.heading?.weight ?? 700 }}>
            {tagline}
          </div>
        </div>
      )}

      {options.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
          <p className="text-sm">No font pairings yet.</p>
          <Button onClick={() => gen.mutate()} disabled={gen.isPending}>
            {gen.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
            Generate 4 font pairings
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {options.map((opt, i) => {
            const isPicked = chosen?.name === opt.name;
            return (
              <button
                key={`${opt.name}-${i}`}
                onClick={() => choose(opt)}
                className={`relative rounded-xl border p-5 text-left transition bg-card ${isPicked ? "border-primary ring-2 ring-primary/30" : "border-white/10 hover:border-white/30"}`}
              >
                {isPicked && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    <Check className="h-3 w-3" /> Selected
                  </span>
                )}
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{opt.name}</div>
                <div
                  className="mt-2 text-2xl leading-tight"
                  style={{ fontFamily: `'${opt.heading?.family}', system-ui`, fontWeight: opt.heading?.weight ?? 700 }}
                >
                  {tagline}
                </div>
                <div
                  className="mt-2 text-sm text-muted-foreground"
                  style={{ fontFamily: `'${opt.body?.family}', system-ui`, fontWeight: opt.body?.weight ?? 400 }}
                >
                  Body copy in {opt.body?.family}. {opt.rationale}
                </div>
                <div className="mt-3 text-[10px] font-mono text-muted-foreground">
                  {opt.heading?.family} {opt.heading?.weight} / {opt.body?.family} {opt.body?.weight}
                </div>
              </button>
            );
          })}
        </div>
      )}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
        <Button onClick={onNext} disabled={!chosen}>Continue <ArrowRight className="ml-1 h-4 w-4" /></Button>
      </div>
    </div>
  );

}

/* ---------- STEP 4: Moodboard & Logo ---------- */
function StepMoodboard({ snapshot, kit, onSave, onBack, onNext }: any) {
  const [logos, setLogos] = useState<any[]>(kit?.logos ?? []);
  const [moodboard, setMoodboard] = useState<any[]>(kit?.moodboard ?? []);
  const [refs, setRefs] = useState<string[]>(kit?.dna?._logoReferences ?? []);

  const genMood = useMutation({
    mutationFn: () => generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "moodboard", count: 4 } }),
    onSuccess: (out) => {
      const fresh = (out.assets ?? []).filter((a: any) => a.ok);
      const next = [...fresh, ...moodboard].slice(0, 8);
      setMoodboard(next);
      onSave({ moodboard: next });
      toast.success(`${fresh.length} moodboard tiles generated`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [logoPhase, setLogoPhase] = useState<"idle" | "brief" | "concepting" | "drawing">("idle");
  const logoRunQ = useQuery({
    queryKey: ["brandLogoRun", snapshot.id],
    queryFn: () => generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_get_run" } }),
    refetchInterval: (query) => {
      const status = (query.state.data as any)?.run?.status;
      return status && !["completed", "completed_with_review", "failed", "canceled"].includes(status) ? 2500 : false;
    },
  });
  const activeRun = logoRunQ.data?.run;
  const runDirections: any[] = logoRunQ.data?.directions ?? [];
  const runBusy = !!activeRun && !["completed", "completed_with_review", "failed", "canceled"].includes(activeRun.status);

  useEffect(() => {
    const ready = runDirections.filter((d) => d.status === "ready" || d.status === "needs_review").map((d) => d.asset).filter((a) => a?.url);
    if (ready.length) setLogos(ready);
  }, [runDirections]);

  const processLogoRun = async (initialRun: any) => {
    let run = initialRun;
    setLogoPhase("brief");
    if (run.status === "developing_brief" || run.status === "queued") {
      await generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_develop_brief", runId: run.id } });
      run = { ...run, status: "developing_directions" };
    }
    setLogoPhase("concepting");
    let state = await generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_get_run", runId: run.id } });
    if (!state.directions?.length) {
      await generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_develop_directions", runId: run.id } });
      state = await generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_get_run", runId: run.id } });
    }
    setLogoPhase("drawing");
    const work = (state.directions ?? []).filter((d: any) => !["ready", "needs_review", "canceled"].includes(d.status));
    for (let i = 0; i < work.length; i += 2) {
      await Promise.allSettled(work.slice(i, i + 2).map((d: any) => generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_draw_vector", runId: run.id, directionId: d.id } })));
      await logoRunQ.refetch();
    }
    await logoRunQ.refetch();
  };

  const genLogos = useMutation({
    mutationFn: async () => {
      const created = await generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_create_run", count: 4, referenceImages: refs } });
      setLogos([]);
      await processLogoRun(created.run);
      return created;
    },
    onSuccess: () => toast.success("Your four vector directions are ready"),
    onError: (e: any) => toast.error(e?.message ?? "Logo run paused. You can resume it here."),
    onSettled: () => { setLogoPhase("idle"); logoRunQ.refetch(); },
  });

  const resumeLogos = useMutation({
    mutationFn: () => processLogoRun(activeRun),
    onError: (e: any) => toast.error(e?.message ?? "Logo run paused again"),
    onSettled: () => { setLogoPhase("idle"); logoRunQ.refetch(); },
  });

  const retryDirection = useMutation({
    mutationFn: (item: any) => generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_retry_direction", runId: item.run_id, directionId: item.id, reviewNote: item.review_note } }),
    onSuccess: () => { toast.success("Direction rebuilt"); logoRunQ.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });



  const [dragOver, setDragOver] = useState(false);

  const downscaleToDataUrl = (file: File, max = 512): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.onload = () => {
        const src = reader.result as string;
        // SVGs and tiny files: keep as-is.
        if (file.type === "image/svg+xml" || file.size < 120 * 1024) return resolve(src);
        const img = new Image();
        img.onerror = () => resolve(src);
        img.onload = () => {
          try {
            const scale = Math.min(1, max / Math.max(img.width, img.height));
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const canvas = document.createElement("canvas");
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) return resolve(src);
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL("image/png"));
          } catch { resolve(src); }
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    });

  const onDropRefs = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 3 - refs.length);
    if (arr.length === 0) {
      toast.error("Please drop image files (PNG, JPG, SVG)");
      return;
    }
    try {
      const dataUrls = await Promise.all(arr.map((f) => downscaleToDataUrl(f)));
      const next = [...refs, ...dataUrls].slice(0, 3);
      setRefs(next);
      await upsertBrandKit(snapshot.id, { dna: { ...(kit?.dna ?? {}), _logoReferences: next } });
      toast.success(`${arr.length} inspiration${arr.length > 1 ? "s" : ""} added`);
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    }
  };

  const removeRef = async (idx: number) => {
    const next = refs.filter((_, i) => i !== idx);
    setRefs(next);
    try {
      await upsertBrandKit(snapshot.id, { dna: { ...(kit?.dna ?? {}), _logoReferences: next } });
    } catch (e: any) {
      toast.error(e?.message || "Could not save");
    }
  };

  const skipped = !!kit?.dna?._logoRefSkipped;
  const gatePassed = refs.length > 0 || skipped;

  const skipRefs = () => {
    onSave({ dna: { ...(kit?.dna ?? {}), _logoRefSkipped: true } });
  };
  const undoSkip = () => {
    const dna = { ...(kit?.dna ?? {}) };
    delete dna._logoRefSkipped;
    onSave({ dna });
  };

  return (
    <div className="space-y-8">
      {/* MOODBOARD */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Moodboard</h3>
            <p className="text-xs text-muted-foreground">Four curated tiles — texture, hero scene, still life, and color motion — grounded in your locked palette and personality.</p>
          </div>
          <Button onClick={() => genMood.mutate()} disabled={genMood.isPending} size="sm">
            {genMood.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
            {moodboard.length ? "Regenerate moodboard" : "Generate moodboard"}
          </Button>
        </div>
        {moodboard.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {moodboard.map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-white/10 bg-background/40">
                {a.url && <img src={a.url} className="aspect-square w-full object-cover" />}
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-xs text-muted-foreground">No moodboard yet. Generate to see four art-directed tiles here.</div>
        )}
      </section>

      {/* REFERENCE LOGOS — required gateway */}
      <section className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Drop your 3 logo inspirations</h3>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">Required</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Inspiration only</span> — these guide the AI when it <em>generates</em> new logo directions for you. They are never composited onto your social covers. To place your own existing logo on generated images, upload it in the Existing Brand step (or later in Brand Studio › Logo).
            </p>
          </div>
        </div>

        <label
          className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
            dragOver ? "border-primary bg-primary/10" : "border-white/20 bg-background/40 hover:border-primary/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (refs.length < 3) setDragOver(true); }}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); if (refs.length < 3) setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
          onDrop={(e) => {
            e.preventDefault(); e.stopPropagation(); setDragOver(false);
            if (refs.length >= 3) return;
            onDropRefs(e.dataTransfer?.files ?? null);
          }}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/*"
            multiple
            className="hidden"
            onChange={(e) => { onDropRefs(e.target.files); e.currentTarget.value = ""; }}
            disabled={refs.length >= 3}
          />
          <div className="text-sm font-medium">{refs.length >= 3 ? "3 inspirations added — you're set" : "Drag & drop or click to upload"}</div>
          <div className="mt-1 text-xs text-muted-foreground">PNG, JPG, SVG, WEBP · up to 3 images · {refs.length}/3 added</div>
        </label>

        {refs.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {refs.map((src, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-white/10 bg-background">
                <img src={src} className="h-full w-full object-contain" />
                <button onClick={() => removeRef(i)} className="absolute right-0 top-0 rounded-bl bg-black/60 px-1 text-xs text-white hover:bg-black/80">×</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          {skipped ? (
            <button onClick={undoSkip} className="text-primary underline-offset-2 hover:underline">Reconsider — I'll upload inspirations</button>
          ) : (
            <button onClick={skipRefs} className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
              Skip — generate without references
            </button>
          )}
          {skipped && <span className="text-amber-700 dark:text-amber-400">Skipped — concepts will be context-only</span>}
        </div>
      </section>

      {/* LOGOS — gated */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Logo concepts</h3>
            <p className="text-xs text-muted-foreground">
              Strategy first: we read your finished brand assets, write an identity brief, sketch ten ideas, keep only the strongest four — then render and review each mark before you see it. {refs.length ? "Inspired (never copied) by your references." : ""}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button onClick={() => genLogos.mutate()} disabled={genLogos.isPending || !gatePassed} size="sm">
              {genLogos.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
              {logoPhase === "brief" ? "Writing the brief…" : logoPhase === "rendering" ? "Rendering marks…" : logos.length ? "New direction set" : "Generate 4 logo directions"}
            </Button>
            {genLogos.isPending && (
              <span className="text-[10px] text-muted-foreground">Brief → concepts → render → design review. Marks appear as they finish.</span>
            )}

            {!gatePassed && (
              <span className="text-[10px] text-muted-foreground">Upload at least one inspiration above, or choose Skip, to unlock.</span>
            )}
          </div>
        </div>

        {pending.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pending.map((p: any, i: number) => (
              <div key={`pending-${i}`} className="flex flex-col overflow-hidden rounded-lg border border-white/10 bg-background/40">
                <div className="flex aspect-square w-full items-center justify-center bg-white/5">
                  {p.status === "error" ? (
                    <span className="px-3 text-center text-[11px] text-destructive">{p.error}</span>
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <div className="truncate text-xs font-semibold">{p.direction?.direction_name ?? `Concept ${i + 1}`}</div>
                  <p className="line-clamp-2 text-[11px] text-muted-foreground">
                    {p.status === "error" ? "This mark didn't render." : p.direction?.one_line_idea ?? "Rendering…"}
                  </p>
                  {p.status === "error" && (
                    <Button variant="ghost" size="sm" className="h-7 w-full text-[11px]" onClick={() => retryPending(i)}>
                      <Sparkles className="mr-1 h-3 w-3" /> Try this one again
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {logos.length > 0 && (

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {logos.map((a, i) => {
              const busy = regenOne.isPending && regenOne.variables?.idx === i;
              const removeLogo = async () => {
                const next = logos.filter((_, j) => j !== i);
                setLogos(next);
                try {
                  await upsertBrandKit(snapshot.id, { logos: next });
                  onSave({ logos: next });
                  toast.success("Concept removed");
                } catch (e: any) {
                  toast.error(e?.message || "Could not remove");
                }
              };
              return (
                <div key={i} className="relative flex flex-col overflow-hidden rounded-lg border border-white/10 bg-background/40">
                  <button
                    onClick={removeLogo}
                    disabled={busy || regenOne.isPending}
                    aria-label="Remove this concept"
                    className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white shadow hover:bg-black disabled:opacity-40"
                  >
                    ×
                  </button>
                  <a href={a.url} target="_blank" rel="noreferrer" className="block bg-white">
                    {a.url && <img src={a.url} alt={a.direction_name ?? "Logo concept"} className="aspect-square w-full object-contain" />}
                  </a>
                  <div className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold">{a.direction_name ?? `Concept ${i + 1}`}</div>
                        {a.logo_type && (
                          <div className="mt-0.5 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                            {a.logo_type}
                          </div>
                        )}
                      </div>
                    </div>
                    {(a.one_line_idea || a.symbol_concept) && (
                      <p className="line-clamp-3 text-[11px] leading-relaxed text-foreground/80">{a.one_line_idea || a.symbol_concept}</p>
                    )}
                    {a.why_memorable && (
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">Why it sticks: {a.why_memorable}</p>
                    )}
                    <div className="flex gap-1.5">
                      {a.direction && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 flex-1 text-[11px]"
                          disabled={busy || regenOne.isPending}
                          onClick={() => regenOne.mutate({ idx: i, direction: a.direction })}
                        >
                          {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                          More like this
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"

                        className="h-7 px-2 text-[11px] text-destructive hover:text-destructive"
                        disabled={busy || regenOne.isPending}
                        onClick={removeLogo}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>


      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
        <Button onClick={onNext}>Continue <ArrowRight className="ml-1 h-4 w-4" /></Button>
      </div>
    </div>
  );
}

/* ---------- STEP 5: Voice & Review ---------- */
function StepReview({ snapshot, kit, onSave, onBack, onDone }: any) {
  const qc = useQueryClient();
  const [voice, setVoice] = useState<any>(kit?.voice ?? {
    attributes: { formal: 50, warm: 50, witty: 50, expert: 50 },
    rules: "",
  });
  const [saving, setSaving] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const lock = useMutation({
    mutationFn: async () => {
      await upsertBrandKit(snapshot.id, { voice });
      const out = await generateStyleGuide(snapshot.id);
      return out;
    },
    onSuccess: () => {
      toast.success("Brand style guide generated");
      qc.invalidateQueries({ queryKey: ["brandKit", snapshot.id] });
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const copyGuide = async () => {
    if (!kit?.guide_markdown) return;
    try {
      await navigator.clipboard.writeText(kit.guide_markdown);
      toast.success("Style guide markdown copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const saveToFiles = async () => {
    const fresh = await getBrandKit(snapshot.id);
    if (!fresh?.guide_markdown) {
      toast.error("Generate the style guide first");
      return;
    }
    setSaving(true);
    try {
      const companyName = snapshot.company_name || "Brand";
      const title = `${companyName} - Style Guide`;
      const blob = await brandKitToDocxBlob(fresh, companyName);
      const validation = await validateBrandGuideDocxBlob(blob, fresh);
      if (!validation.ok) {
        throw new Error(validation.errors.join(" "));
      }
      const filename = `${title}.docx`;
      const contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      const { uploadUrl, path } = await createDocumentUploadUrl({ filename, contentType, snapshotId: snapshot.id });
      const up = await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": contentType } });
      if (!up.ok) throw new Error("Upload failed");
      await finalizeDocument({ path, label: filename, contentType, size: blob.size, kind: "deliverable", snapshotId: snapshot.id });
      qc.invalidateQueries({ queryKey: ["my", "documents"] });
      toast.success("Saved to My Files");
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally { setSaving(false); }
  };

  const heading = kit?.typography?.heading?.family;
  const body = kit?.typography?.body?.family;
  useEffect(() => {
    if (heading) loadGoogleFont(heading, [kit.typography.heading.weight ?? 700]);
    if (body) loadGoogleFont(body, [kit.typography.body.weight ?? 400]);
  }, [heading, body, kit?.typography]);

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Voice attributes</Label>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {[
            { key: "formal", left: "Casual", right: "Formal" },
            { key: "warm", left: "Reserved", right: "Warm" },
            { key: "witty", left: "Earnest", right: "Witty" },
            { key: "expert", left: "Approachable", right: "Expert" },
          ].map((a) => (
            <div key={a.key}>
              <div className="mb-1 flex justify-between text-[11px] text-muted-foreground"><span>{a.left}</span><span>{a.right}</span></div>
              <Slider value={[voice.attributes?.[a.key] ?? 50]} onValueChange={(v) => setVoice((x: any) => ({ ...x, attributes: { ...x.attributes, [a.key]: v[0] } }))} max={100} step={5} />
            </div>
          ))}
        </div>
        <Textarea className="mt-3" placeholder="Custom rules (optional) — e.g. always use 'startup', never 'business'." value={voice.rules} onChange={(e) => setVoice((x: any) => ({ ...x, rules: e.target.value }))} />
      </div>

      <div className="rounded-xl border border-white/10 bg-card p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Review</div>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-muted-foreground">Palette — click any swatch to change</div>
              {kit?.palette?.colors && (
                <button
                  type="button"
                  onClick={() => {
                    const repaired = sanitizePaletteOption({ ...kit.palette, colors: kit.palette.colors });
                    onSave({ palette: repaired });
                    toast.success("Palette repaired to meet WCAG AA");
                  }}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                  title="Auto-adjust colors for AA contrast"
                >
                  Repair contrast
                </button>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {kit?.palette?.colors && Object.entries(kit.palette.colors).map(([k, v]: any) => (
                <EditablePaletteSwatch
                  key={k}
                  tokenKey={k}
                  value={v}
                  onChange={(hex) => {
                    const nextColors = { ...(kit.palette?.colors ?? {}), [k]: hex };
                    onSave({
                      palette: {
                        ...(kit.palette ?? {}),
                        colors: nextColors,
                        source: "user-edited",
                      },
                    });
                  }}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Typography</div>
            <div className="mt-1" style={{ fontFamily: `'${heading}', system-ui`, fontWeight: kit?.typography?.heading?.weight ?? 700 }}>{heading || "—"}</div>
            <div className="text-sm text-muted-foreground" style={{ fontFamily: `'${body}', system-ui` }}>{body}</div>
          </div>
        </div>
      </div>

      <div ref={previewRef} className="rounded-xl border border-emerald-500/30 bg-card overflow-hidden">
        {kit?.guide_markdown ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Lock className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                Brand Style Guide
                <span className="text-xs font-normal text-muted-foreground">
                  · {kit.guide_markdown.split(/\s+/).filter(Boolean).length} words
                  {kit.locked_at ? ` · locked ${new Date(kit.locked_at).toLocaleDateString()}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={copyGuide} title="Copy markdown">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="max-h-[620px] overflow-y-auto p-4">
              <VisualBrandGuide
                kit={kit}
                snapshot={snapshot}
                originalColors={kit?.palette?.colors ?? {}}
                onColorChange={(key, hex) => {
                  const nextColors = { ...(kit?.palette?.colors ?? {}), [key]: hex };
                  onSave({
                    palette: {
                      ...(kit?.palette ?? {}),
                      colors: nextColors,
                      source: "user-edited",
                    },
                  });
                }}
              />
            </div>
          </>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Generate the style guide to preview it here.
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-20 -mx-6 -mb-8 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-background/95 px-6 py-4 shadow-lg backdrop-blur">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={() => lock.mutate()} disabled={lock.isPending || !kit?.palette || !kit?.typography}>
            {lock.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
            {kit?.guide_markdown ? "Regenerate style guide" : "Generate brand style guide"}
          </Button>
          <Button variant="outline" onClick={saveToFiles} disabled={saving || !kit?.guide_markdown}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Save to My Files
          </Button>
          <Button variant="ghost" onClick={onDone}>Close</Button>
        </div>
      </div>
    </div>
  );
}
