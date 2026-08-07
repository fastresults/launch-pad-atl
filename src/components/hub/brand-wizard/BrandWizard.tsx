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
import { Loader2, ArrowLeft, ArrowRight, Sparkles, Lock, RefreshCw, Check, Copy, AlertTriangle, CircleCheck, ExternalLink, Trash2 } from "lucide-react";
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

  const [logoPhase, setLogoPhase] = useState<"idle" | "brief" | "concepting" | "rendering" | "reviewing" | "drawing">("idle");
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

  // Higgsfield render-provider health. The free check only proves the key works
  // — the platform publishes no balance endpoint — so credit state is inferred
  // from real render outcomes, and the explicit test below spends one credit.
  const renderStatusQ = useQuery({
    queryKey: ["higgsfieldStatus", snapshot.id],
    queryFn: () => generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_render_status" } }),
    staleTime: 60_000,
    refetchInterval: runBusy ? 15_000 : false,
  });
  const renderStatus = renderStatusQ.data as any;
  const [probing, setProbing] = useState(false);
  const probeRender = async () => {
    setProbing(true);
    try {
      const out = await generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_render_status", probe: true } });
      qc.setQueryData(["higgsfieldStatus", snapshot.id], out);
      out?.state === "ready" ? toast.success(out.headline) : toast.error(out?.headline ?? "Test render failed");
    } catch (e: any) {
      toast.error(e?.message || "Could not reach Higgsfield");
    } finally {
      setProbing(false);
    }
  };

  // Escape hatch: a stuck queue (dead leases, spinners that never resolve)
  // is cleared outright and the provider status re-read from scratch.
  // The abort token stops any in-flight generate loop from writing new
  // directions (or raising "run not found") right after the wipe.
  const [clearing, setClearing] = useState(false);
  const abortToken = useRef(0);
  const forceClear = async () => {
    setClearing(true);
    abortToken.current += 1;
    try {
      const out = await generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_force_reset" } });
      setLogos([]);
      setLogoPhase("idle");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["brandLogoRun", snapshot.id] }),
        qc.invalidateQueries({ queryKey: ["brandKit", snapshot.id] }),
        renderStatusQ.refetch(),
      ]);
      toast.success(`Queue cleared — ${out?.clearedDirections ?? 0} concept slot(s) removed. Render status refreshed.`);
    } catch (e: any) {
      toast.error(e?.message || "Could not clear the logo queue");
    } finally {
      setClearing(false);
    }
  };


  // Concepts that were vectored without a Higgsfield render behind them.
  const fellBack = runDirections.filter(
    (d) => d.render_status && d.render_status !== "ready" && d.render_status !== "pending",
  );

  useEffect(() => {
    const ready = runDirections.filter((d) => d.status === "ready" || d.status === "needs_review").map((d) => d.asset).filter((a) => a?.url);
    if (ready.length) setLogos(ready);
  }, [runDirections]);

  const processLogoRun = async (initialRun: any) => {
    let run = initialRun;
    const myToken = abortToken.current;
    // Thrown to unwind the loop silently when the queue was cleared mid-run.
    const aborted = () => abortToken.current !== myToken;

    // Stages 1+2 — read the founder's reference marks, then read the business.
    setLogoPhase("brief");
    if (["reading_context", "developing_brief", "queued"].includes(run.status)) {
      await generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_read_context", runId: run.id } });
      run = { ...run, status: "developing_directions" };
    }
    if (aborted()) return;

    // Stage 3 — concepting.
    setLogoPhase("concepting");
    let state = await generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_get_run", runId: run.id } });
    if (!state.directions?.length) {
      if (aborted()) return;
      await generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_develop_directions", runId: run.id } });
      state = await generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_get_run", runId: run.id } });
    }
    if (aborted()) return;

    // Stages 4+5 — render each concept against the references, then let the
    // jury judge the render. A failed verdict sends that concept back for one
    // corrective re-render, so the loop alternates until every slot settles.
    for (let round = 0; round < 3; round++) {
      if (aborted()) return;

      const toRender = (state.directions ?? []).filter(
        (d: any) => d.current_stage === "render_concept" && !["ready", "needs_review", "canceled"].includes(d.status),
      );
      if (toRender.length) {
        setLogoPhase("rendering");
        for (let i = 0; i < toRender.length; i += 2) {
          if (aborted()) return;
          await Promise.allSettled(toRender.slice(i, i + 2).map((d: any) =>
            generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_render_concept", runId: run.id, directionId: d.id } })
          ));
          await logoRunQ.refetch();
        }
        if (aborted()) return;
        state = await generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_get_run", runId: run.id } });
      }

      const toJudge = (state.directions ?? []).filter(
        (d: any) => d.render_path && !["ready", "needs_review", "canceled"].includes(d.status),
      );
      if (!toJudge.length && !toRender.length) break;
      if (toJudge.length) {
        setLogoPhase("reviewing");
        for (let i = 0; i < toJudge.length; i += 2) {
          if (aborted()) return;
          await Promise.allSettled(toJudge.slice(i, i + 2).map((d: any) =>
            generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_jury", runId: run.id, directionId: d.id } })
          ));
          await logoRunQ.refetch();
        }
        if (aborted()) return;
        state = await generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_get_run", runId: run.id } });
      }
    }

    const finished = (state.directions ?? []).filter((d: any) => ["ready", "needs_review"].includes(d.status)).length;
    await logoRunQ.refetch();
    if (finished < Number(run.requested_count ?? 4)) throw new Error(`${Number(run.requested_count ?? 4) - finished} direction${Number(run.requested_count ?? 4) - finished === 1 ? "" : "s"} paused after three safe attempts`);
  };

  const genLogos = useMutation({
    mutationFn: async () => {
      if (refs.length < 3) throw new Error("Upload three logos you admire first — they set the craft standard for this run.");
      const created = await generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_create_run", count: 3, referenceImages: refs } });
      setLogos([]);
      await processLogoRun(created.run);
      return created;
    },
    onSuccess: () => toast.success("Your three concept marks are ready — pick one, refine it, then vectorize"),
    onError: (e: any) => toast.error(e?.message ?? "Logo run paused. You can resume it here."),
    onSettled: () => { setLogoPhase("idle"); logoRunQ.refetch(); },
  });

  const vectorizeDirection = useMutation({
    mutationFn: (item: any) => generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_vectorize", runId: item.run_id, directionId: item.id } }),
    onSuccess: () => { toast.success("Mark vectorized — SVG lockups are ready"); logoRunQ.refetch(); },
    onError: (e: any) => toast.error(e?.message ?? "Could not vectorize this mark"),
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

  // Founder picks one mark, then writes their own art direction for it.
  const [refineTarget, setRefineTarget] = useState<any>(null);
  const [refineNote, setRefineNote] = useState("");

  const selectDirection = useMutation({
    mutationFn: (item: any) => generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_select_direction", runId: item.run_id, directionId: item.id } }),
    onSuccess: () => logoRunQ.refetch(),
    onError: (e: any) => toast.error(e?.message ?? "Could not select this mark"),
  });

  const refineDirection = useMutation({
    mutationFn: async ({ item, note }: { item: any; note: string }) => {
      await generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_refine_direction", runId: item.run_id, directionId: item.id, note } });
      await processLogoRun({ ...activeRun, status: "rendering" });
    },
    onSuccess: () => { toast.success("Re-rendered with your direction — the previous version is in the archive"); setRefineTarget(null); setRefineNote(""); },
    onError: (e: any) => toast.error(e?.message ?? "Could not re-render this mark"),
    onSettled: () => { setLogoPhase("idle"); logoRunQ.refetch(); },
  });

  const restoreRender = useMutation({
    mutationFn: ({ item, historyPath }: { item: any; historyPath: string }) =>
      generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_restore_render", runId: item.run_id, directionId: item.id, historyPath } }),
    onSuccess: () => { toast.success("Earlier version restored"); logoRunQ.refetch(); },
    onError: (e: any) => toast.error(e?.message ?? "Could not restore that version"),
  });

  const REFINE_CHIPS = [
    "Thicker, more even stroke weight",
    "Simplify — remove one element",
    "Fuse the parts into one continuous form",
    "Stronger silhouette at small sizes",
    "Lean more geometric, less organic",
    "Use the primary brand colour only",
  ];




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

  // Hard gate: three reference marks ARE the art direction. Without them the
  // studio invents a house style, which is what produced the earlier slop.
  const gatePassed = refs.length >= 3;


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

        <div className="text-xs">
          {gatePassed ? (
            <span className="text-emerald-700 dark:text-emerald-400">Craft standard set — these three marks now drive every concept.</span>
          ) : (
            <span className="text-amber-700 dark:text-amber-400">
              {3 - refs.length} more to go. Generation stays locked until all three are here — they are the art direction, not a nice-to-have.
            </span>
          )}
        </div>
      </section>

      {/* LOGOS — gated */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Logo concepts</h3>
            <p className="text-xs text-muted-foreground">
              References first: we read the construction of your three inspirations, read what your business actually does from your own copy, then concept, render and judge four marks against both. Vectoring happens only on the mark you approve.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <Button onClick={forceClear} disabled={clearing} size="sm" variant="destructive">
                {clearing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                {clearing ? "Clearing…" : "Clear queue"}
              </Button>
              <Button onClick={() => runBusy ? resumeLogos.mutate() : genLogos.mutate()} disabled={genLogos.isPending || resumeLogos.isPending || !gatePassed} size="sm">
                {(genLogos.isPending || resumeLogos.isPending) ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
                {logoPhase === "brief" ? "Reading references & business…" : logoPhase === "concepting" ? "Choosing directions…" : logoPhase === "rendering" ? "Art-directing the marks…" : logoPhase === "reviewing" ? "Jury reviewing…" : logoPhase === "drawing" ? "Drawing vectors…" : runBusy ? "Resume logo studio" : logos.length ? "New direction set" : !gatePassed ? "Add 3 inspirations to unlock" : "Generate 4 logo directions"}
              </Button>
            </div>


            {(genLogos.isPending || resumeLogos.isPending || runBusy) && (
              <span className="text-[10px] text-muted-foreground">Progress is saved. You can close this window and resume later.</span>
            )}

            {!gatePassed && (
              <span className="text-[10px] text-muted-foreground">Upload at least one inspiration above, or choose Skip, to unlock.</span>
            )}
          </div>
        </div>

        {/* Render-provider status. Higgsfield renders each concept as a real
            designed mark before it is vectored; when it is unavailable the
            pipeline still finishes, but from the written brief alone. */}
        {renderStatus && (
          <div
            className={`rounded-lg border p-3 text-[11px] ${
              renderStatus.state === "ready"
                ? "border-emerald-500/25 bg-emerald-500/5"
                : renderStatus.state === "untested"
                  ? "border-white/10 bg-background/40"
                  : "border-amber-500/35 bg-amber-500/10"
            }`}
          >
            <div className="flex items-start gap-2">
              {renderStatus.state === "ready"
                ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                : renderStatus.state === "untested"
                  ? <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold">{renderStatus.headline}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Render engine
                  </span>
                </div>
                {renderStatus.detail && (
                  <p className="leading-relaxed text-muted-foreground">{renderStatus.detail}</p>
                )}
                {renderStatus.state !== "ready" && renderStatus.state !== "untested" && (
                  <p className="leading-relaxed text-amber-200/90">
                    Concepts are still being produced — but they are drawn from the written brief instead of an
                    art-directed render, which is the lower-quality path.
                  </p>
                )}
                {(renderStatus.renderedCount > 0 || renderStatus.fallbackCount > 0) && (
                  <p className="text-muted-foreground">
                    Recent concepts: {renderStatus.renderedCount} rendered · {renderStatus.fallbackCount} fell back to
                    brief-only drawing.
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 pt-0.5">
                  <button
                    type="button"
                    onClick={probeRender}
                    disabled={probing}
                    className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline disabled:opacity-50"
                  >
                    {probing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    {probing ? "Testing…" : "Run a live credit test"}
                  </button>
                  <span className="text-[10px] text-muted-foreground">Spends 1 Higgsfield credit if funded.</span>
                  {renderStatus.state === "no_credits" && (
                    <a
                      href={renderStatus.topUpUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Top up platform credits <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>


              </div>
            </div>
          </div>
        )}



        {runDirections.some((d) => !["ready", "needs_review"].includes(d.status)) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

            {runDirections.filter((d) => !["ready", "needs_review"].includes(d.status)).map((p: any) => (
              <div key={p.id} className="flex flex-col overflow-hidden rounded-lg border border-white/10 bg-background/40">
                <div className="flex aspect-square w-full items-center justify-center bg-white/5">
                  {p.status === "failed" || p.status === "retry_wait" ? (
                    <span className="px-3 text-center text-[11px] text-destructive">{p.last_error ?? "This direction needs another pass."}</span>
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <div className="truncate text-xs font-semibold">{p.direction_name ?? `Concept ${p.slot + 1}`}</div>
                  <p className="line-clamp-2 text-[11px] text-muted-foreground">
                    {p.status === "failed" || p.status === "retry_wait" ? "Saved for a targeted retry." : p.concept?.one_line_idea ?? p.current_stage?.replaceAll("_", " ") ?? "Drawing…"}
                  </p>
                  {(p.status === "failed" || p.status === "retry_wait") && (
                    <Button variant="ghost" size="sm" className="h-7 w-full text-[11px]" disabled={retryDirection.isPending} onClick={() => retryDirection.mutate(p)}>
                      <Sparkles className="mr-1 h-3 w-3" /> Try this one again
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {fellBack.length > 0 && (
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-400">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              {fellBack.length} of {runDirections.length} concepts in this set skipped the Higgsfield render and were
              drawn from the brief alone{fellBack[0]?.render_error ? ` — ${String(fellBack[0].render_error).slice(0, 140)}` : ""}. Re-run the set once renders are available for noticeably stronger marks.
            </span>
          </p>
        )}

        {logos.length > 0 && (

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {logos.map((a, i) => {
              const directionRow = runDirections.find((d) => d.asset?.path === a.path || d.id === a.direction_id);
              const busy = retryDirection.isPending && retryDirection.variables?.id === directionRow?.id;
              const removeLogo = async () => {
                try {
                  if (directionRow && activeRun) {
                    const out = await generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo_remove_direction", runId: activeRun.id, directionId: directionRow.id } });
                    setLogos(out.logos ?? []);
                    await logoRunQ.refetch();
                  } else {
                    const next = logos.filter((_, j) => j !== i);
                    setLogos(next);
                    await upsertBrandKit(snapshot.id, { logos: next });
                  }
                  toast.success("Concept removed");
                } catch (e: any) {
                  toast.error(e?.message || "Could not remove");
                }
              };
              const isSelected = !!directionRow?.selected;
              return (
                <div
                  key={i}
                  className={`relative flex flex-col overflow-hidden rounded-lg border bg-background/40 transition ${
                    isSelected ? "border-primary ring-2 ring-primary/40" : "border-white/10"
                  }`}
                >

                  <button
                    onClick={removeLogo}
                    disabled={busy || retryDirection.isPending}
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
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                          {a.logo_type && (
                            <span className="inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                              {a.logo_type}
                            </span>
                          )}
                          {directionRow?.render_status === "ready" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-400">
                              <CircleCheck className="h-2.5 w-2.5" /> Rendered
                            </span>
                          )}
                          {directionRow?.render_status && !["ready", "pending"].includes(directionRow.render_status) && (
                            <span
                              title={directionRow.render_error ?? "Higgsfield render unavailable"}
                              className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-400"
                            >
                              <AlertTriangle className="h-2.5 w-2.5" /> Brief-only
                            </span>
                          )}
                        </div>

                      </div>
                    </div>
                    {a.human_link && (
                      <p className="line-clamp-2 text-[11px] italic leading-relaxed text-muted-foreground">{a.human_link}</p>
                    )}
                    {a.reads_as && (
                      <p className="line-clamp-2 text-[11px] font-medium leading-relaxed text-foreground">Reads as: {a.reads_as}</p>
                    )}
                    {a.meaning && (
                      <p className="line-clamp-3 text-[11px] italic leading-relaxed text-foreground/80">{a.meaning}</p>
                    )}
                    {(a.one_line_idea || a.symbol_concept) && (
                      <p className="line-clamp-3 text-[11px] leading-relaxed text-foreground/80">{a.one_line_idea || a.symbol_concept}</p>
                    )}

                    {a.craft_move && (
                      <p className="line-clamp-1 text-[11px] leading-relaxed text-muted-foreground">Craft: {a.craft_move}</p>
                    )}
                    {a.why_memorable && (
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">Why it sticks: {a.why_memorable}</p>
                    )}

                    {Array.isArray(directionRow?.render_history) && directionRow.render_history.length > 0 && (
                      <div className="space-y-1 border-t border-white/10 pt-2">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Archive</div>
                        <div className="flex flex-wrap gap-1.5">
                          {directionRow.render_history.map((h: any) => (
                            <button
                              key={h.path}
                              title="Restore this version"
                              disabled={restoreRender.isPending}
                              onClick={() => restoreRender.mutate({ item: directionRow, historyPath: h.path })}
                              className="h-10 w-10 overflow-hidden rounded border border-white/15 bg-white transition hover:border-primary disabled:opacity-40"
                            >
                              {h.url ? <img src={h.url} alt="Earlier version" className="h-full w-full object-contain" /> : null}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {directionRow && (
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="h-7 flex-1 text-[11px]"
                          disabled={busy || selectDirection.isPending}
                          onClick={() => selectDirection.mutate(directionRow)}
                        >
                          {isSelected ? <Check className="mr-1 h-3 w-3" /> : null}
                          {isSelected ? "Selected" : "Select"}
                        </Button>
                      )}
                      {directionRow && isSelected && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 flex-1 text-[11px]"
                          disabled={busy || refineDirection.isPending}
                          onClick={() => { setRefineTarget(directionRow); setRefineNote(""); }}
                        >
                          <Sparkles className="mr-1 h-3 w-3" /> Refine this mark
                        </Button>
                      )}
                      {directionRow && !directionRow.svg_path && (
                        <Button
                          size="sm"
                          className="h-7 flex-1 text-[11px]"
                          disabled={busy || vectorizeDirection.isPending}
                          onClick={() => vectorizeDirection.mutate(directionRow)}
                        >
                          {vectorizeDirection.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CircleCheck className="mr-1 h-3 w-3" />}
                          Approve & vectorize
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[11px] text-destructive hover:text-destructive"
                        disabled={busy || retryDirection.isPending}
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

        <Dialog open={!!refineTarget} onOpenChange={(open) => { if (!open && !refineDirection.isPending) { setRefineTarget(null); setRefineNote(""); } }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Refine this mark</DialogTitle>
              <DialogDescription>
                Write your own art direction. The same concept is re-rendered with your note — the current version is kept in the archive.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {REFINE_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setRefineNote((prev) => (prev.trim() ? `${prev.trim()} ${chip}.` : `${chip}.`))}
                    className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary hover:text-foreground"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <Textarea
                value={refineNote}
                onChange={(e) => setRefineNote(e.target.value)}
                rows={4}
                placeholder="e.g. Keep the cane, drop the leaf, and make the stroke weight even throughout."
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" disabled={refineDirection.isPending} onClick={() => { setRefineTarget(null); setRefineNote(""); }}>
                  Cancel
                </Button>
                <Button
                  disabled={refineDirection.isPending || !refineNote.trim()}
                  onClick={() => refineDirection.mutate({ item: refineTarget, note: refineNote.trim() })}
                >
                  {refineDirection.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
                  Re-render
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
