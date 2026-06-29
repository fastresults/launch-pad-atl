// @ts-nocheck
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2, ArrowLeft, ArrowRight, Sparkles, Lock, RefreshCw, Check } from "lucide-react";
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
import { generateBrandAsset } from "@/lib/foundersHub.functions";
import { markdownToDocxBlob } from "@/lib/markdown-to-docx";
import { createDocumentUploadUrl, finalizeDocument } from "@/lib/attendee.functions";
import { LiveBrandPreview } from "./LiveBrandPreview";

const STEPS = ["DNA", "Palette", "Typography", "Moodboard & Logo", "Voice & Review"];

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-white/10 px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Brand Wizard — {snapshot.company_name || "Your venture"}
          </DialogTitle>
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

        <div className="max-h-[68vh] overflow-y-auto px-6 py-5">
          {kitQ.isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading kit…
            </div>
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
  const [options, setOptions] = useState<any[]>(kit?.dna?._paletteOptions ?? []);
  const [chosen, setChosen] = useState<any>(kit?.palette ?? null);
  const gen = useMutation({
    mutationFn: () => fetchPaletteOptions(snapshot.id),
    onSuccess: (out) => setOptions(out.options ?? []),
    onError: (e: any) => toast.error(e.message),
  });

  useEffect(() => { if (options.length === 0) gen.mutate(); /* eslint-disable-next-line */ }, []);

  const choose = (opt: any) => {
    setChosen(opt);
    onSave({ palette: opt });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Pick the palette direction that feels right. You can fine-tune later.</p>
        <Button variant="outline" size="sm" onClick={() => gen.mutate()} disabled={gen.isPending}>
          {gen.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
          Regenerate
        </Button>
      </div>
      {gen.isPending && options.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Designing 4 palette directions…
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {options.map((opt, i) => {
            const isPicked = chosen?.name === opt.name;
            const fgBgRatio = contrastRatio(opt.colors.fg, opt.colors.bg);
            return (
              <button
                key={i}
                onClick={() => choose(opt)}
                className={`rounded-xl border p-4 text-left transition ${isPicked ? "border-primary ring-2 ring-primary/30" : "border-white/10 hover:border-white/30"}`}
                style={{ background: opt.colors.bg, color: opt.colors.fg }}
              >
                <div className="flex items-start justify-between">
                  <div className="font-semibold">{opt.name}</div>
                  {isPicked && <Check className="h-4 w-4" />}
                </div>
                <div className="mt-1 text-xs opacity-80">{opt.rationale}</div>
                <div className="mt-3 flex gap-1.5">
                  {Object.entries(opt.colors).map(([k, v]: any) => (
                    <div key={k} className="flex-1">
                      <div className="h-10 rounded" style={{ background: v, border: "1px solid rgba(0,0,0,0.1)" }} />
                      <div className="mt-1 text-[9px] font-mono opacity-70">{k}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[10px] opacity-60">Text contrast {fgBgRatio.toFixed(2)} — {aaBadge(fgBgRatio)}</div>
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

/* ---------- STEP 3: Typography ---------- */
function StepTypography({ snapshot, kit, onSave, onBack, onNext }: any) {
  const [options, setOptions] = useState<any[]>([]);
  const [chosen, setChosen] = useState<any>(kit?.typography ?? null);
  const gen = useMutation({
    mutationFn: () => fetchTypographyOptions(snapshot.id),
    onSuccess: (out) => {
      setOptions(out.options ?? []);
      (out.options ?? []).forEach((o: any) => {
        loadGoogleFont(o.heading?.family, [o.heading?.weight ?? 700]);
        loadGoogleFont(o.body?.family, [o.body?.weight ?? 400]);
      });
    },
    onError: (e: any) => toast.error(e.message),
  });

  useEffect(() => { if (options.length === 0) gen.mutate(); /* eslint-disable-next-line */ }, []);

  const tagline = snapshot.tagline || snapshot.company_name || "Your brand, beautifully expressed.";

  const choose = (opt: any) => {
    setChosen(opt);
    onSave({ typography: opt });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Pick a font pairing. Previews use your own tagline.</p>
        <Button variant="outline" size="sm" onClick={() => gen.mutate()} disabled={gen.isPending}>
          {gen.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
          Regenerate
        </Button>
      </div>
      {gen.isPending && options.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Curating type pairings…
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {options.map((opt, i) => {
            const isPicked = chosen?.name === opt.name;
            return (
              <button
                key={i}
                onClick={() => choose(opt)}
                className={`rounded-xl border p-5 text-left transition bg-card ${isPicked ? "border-primary ring-2 ring-primary/30" : "border-white/10 hover:border-white/30"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{opt.name}</div>
                  {isPicked && <Check className="h-4 w-4 text-primary" />}
                </div>
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
  const genLogos = useMutation({
    mutationFn: () => generateBrandAsset({ data: { snapshotId: snapshot.id, kind: "logo", count: 4 } }),
    onSuccess: (out) => {
      const fresh = (out.assets ?? []).filter((a: any) => a.ok);
      const next = [...fresh, ...logos].slice(0, 8);
      setLogos(next);
      onSave({ logos: next });
      toast.success(`${fresh.length} logo concepts generated`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Generate logo concepts grounded in your locked palette and typography. Pick favorites — they'll appear in your style guide.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => genLogos.mutate()} disabled={genLogos.isPending}>
          {genLogos.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
          Generate 4 logo concepts
        </Button>
      </div>
      {logos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {logos.map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-white/10 bg-background/40">
              {a.url && <img src={a.url} className="aspect-square w-full object-cover" />}
            </a>
          ))}
        </div>
      )}
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

  const lock = useMutation({
    mutationFn: async () => {
      await upsertBrandKit(snapshot.id, { voice });
      const out = await generateStyleGuide(snapshot.id);
      return out;
    },
    onSuccess: () => {
      toast.success("Brand style guide generated");
      qc.invalidateQueries({ queryKey: ["brandKit", snapshot.id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveToFiles = async () => {
    const fresh = await getBrandKit(snapshot.id);
    if (!fresh?.guide_markdown) {
      toast.error("Generate the style guide first");
      return;
    }
    setSaving(true);
    try {
      const title = `${snapshot.company_name || "Brand"} — Style Guide`;
      const blob = await markdownToDocxBlob(title, fresh.guide_markdown, { subtitle: "Brand Style Guide" });
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
            <div className="text-[10px] text-muted-foreground">Palette</div>
            <div className="mt-1 flex gap-1">
              {kit?.palette?.colors && Object.entries(kit.palette.colors).map(([k, v]: any) => (
                <div key={k} title={`${k} ${v}`} className="h-6 w-6 rounded border border-white/10" style={{ background: v }} />
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

      {kit?.guide_markdown && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2"><Lock className="h-3 w-3" />Style guide locked — {kit.guide_markdown.split(/\s+/).length} words.</div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
        <div className="flex gap-2">
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
