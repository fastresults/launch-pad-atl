// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { generateBrandAsset } from "@/lib/foundersHub.functions";
import { logoSetFingerprint, useLogoVerdicts } from "@/lib/logo-surface";
import { cn } from "@/lib/utils";

/**
 * The one place a founder sees and changes their mark. Renders the committed
 * logo on light / dark / brand, then exposes the logo set as a FORM x TONE
 * grid — symbol / horizontal / stacked / wordmark, each in colour and inverse —
 * so there is never a question about which file goes where.
 */

export const LOGO_FORMS = [
  { form: "symbol", label: "Symbol", hint: "Mark alone — favicon, avatar, small square placements" },
  { form: "horizontal", label: "Horizontal", hint: "Mark beside the name — headers, wide banners" },
  { form: "stacked", label: "Stacked", hint: "Mark above the name — square and tall placements" },
  { form: "wordmark", label: "Wordmark", hint: "Name alone — letterhead, footers, fine print" },
] as const;

export const LOGO_TONES = [
  { tone: "colour", label: "Colour", hint: "for light grounds" },
  { tone: "inverse", label: "Inverse", hint: "for dark grounds" },
] as const;

/** Slot keys are the storage contract; form x tone is how humans read them. */
export const SLOT_BY_FORM_TONE: Record<string, string> = {
  "symbol|colour": "icon",
  "symbol|inverse": "icon_reversed",
  "horizontal|colour": "primary",
  "horizontal|inverse": "reversed",
  "stacked|colour": "stacked",
  "stacked|inverse": "stacked_reversed",
  "wordmark|colour": "wordmark",
  "wordmark|inverse": "wordmark_reversed",
};

export const LOGO_SLOTS = LOGO_FORMS.flatMap((f) =>
  LOGO_TONES.map((t) => ({
    key: SLOT_BY_FORM_TONE[`${f.form}|${t.tone}`],
    form: f.form,
    tone: t.tone,
    label: `${f.label} · ${t.label}`,
    hint: `${f.hint} — ${t.hint}`,
  })),
);

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
const MAX_BYTES = 5 * 1024 * 1024;

const isHex = (v: unknown) => typeof v === "string" && /^#?[0-9a-f]{3,8}$/i.test(v);
const slotOf = (l: any) => l?.variant ?? "primary";

/** Rough perceptual luminance so the brand tile picks the right mark. */
function luminance(hex: string): number {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length < 6) return 0;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}


/** A grid cell reflects only its stored slot. Never alias a default mark into it. */
export function logoSetFrom(logos: any): Record<string, any> {
  const list = Array.isArray(logos) ? logos.filter((l: any) => l?.url) : [];
  const set: Record<string, any> = {};
  for (const l of list) {
    if (l?.source === "upload") set[slotOf(l)] ??= l;
  }
  return set;
}

/** Measure a dropped file so multi-file assignment is geometric, not lexical. */
async function measureFile(file: File): Promise<number | null> {
  const url = URL.createObjectURL(file);
  try {
    const aspect = await new Promise<number | null>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth > 0 && img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : null);
      img.onerror = () => resolve(null);
      img.src = url;
    });
    return aspect;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Drawn shapes — a bare symbol has a handful, a lockup has dozens. */
const WORDMARK_SHAPE_FLOOR = 8;

function countShapes(svg: string) {
  return (svg.match(/<(path|polygon|polyline|circle|ellipse|rect|line|text|tspan|use|image)\b/gi) ?? []).length;
}

/** Mean ink luminance: light ink exists to sit on a dark ground. */
function inkTone(svg: string): "colour" | "inverse" | null {
  const hits = svg.replace(/<!--[\s\S]*?-->/g, "").match(/#([0-9a-f]{3}|[0-9a-f]{6})\b/gi) ?? [];
  if (!hits.length) return null;
  const mean = hits.map((h) => luminance(h)).reduce((a, b) => a + b, 0) / hits.length;
  return mean >= 0.75 ? "inverse" : "colour";
}

/**
 * What a dropped file actually is.
 *
 * Form comes from the ink (no wordmark shapes means a symbol, whatever the box)
 * plus the aspect; tone comes from ink luminance. Filenames only break ties on
 * rasters, where there is nothing to count.
 */
async function classifyFile(
  file: File,
  aspect: number | null,
): Promise<{ form: string; tone: string; inferred: boolean }> {
  const n = file.name.toLowerCase();
  const hintTone = /(reversed|reverse|dark|white|knockout|inverse|inv)/.test(n) ? "inverse" : "colour";
  const hintForm = /(icon|favicon|monogram|glyph|symbol|avatar)/.test(n)
    ? "symbol"
    : /(wordmark|word-mark|logotype)/.test(n)
    ? "wordmark"
    : /(stacked|stack|vertical|centred|centered)/.test(n)
    ? "stacked"
    : /(horizontal|horiz|lockup|wide)/.test(n)
    ? "horizontal"
    : null;

  let svg = "";
  if (file.type.includes("svg") || n.endsWith(".svg")) {
    try {
      svg = await file.text();
    } catch {
      svg = "";
    }
  }

  if (svg) {
    const shapes = countShapes(svg);
    const tone = inkTone(svg) ?? hintTone;
    const form =
      shapes < WORDMARK_SHAPE_FLOOR
        ? "symbol"
        : hintForm === "wordmark"
        ? "wordmark"
        : (aspect ?? 1) >= 2.2
        ? "horizontal"
        : "stacked";
    return { form, tone, inferred: false };
  }

  if (hintForm) return { form: hintForm, tone: hintTone, inferred: true };
  if (aspect == null) return { form: "horizontal", tone: hintTone, inferred: true };
  if (aspect >= 2.2) return { form: "horizontal", tone: hintTone, inferred: true };
  if (aspect >= 1.15) return { form: "stacked", tone: hintTone, inferred: true };
  return { form: "symbol", tone: hintTone, inferred: true };
}




/**
 * Recolour a light-ink symbol into brand colours.
 *
 * A set can arrive with an inverse symbol and no colour one. Rather than
 * silently painting the light mark onto a light card, we offer the founder a
 * derived colour symbol: the lighter ink becomes the primary brand colour, the
 * darker ink the accent, and nothing else about the drawing changes.
 */
async function deriveColourSymbol(url: string, primary: string, accent: string): Promise<string | null> {
  let svg: string;
  try {
    svg = await (await fetch(url)).text();
  } catch {
    return null;
  }
  if (!/<svg/i.test(svg)) return null;
  const hexes = Array.from(new Set((svg.match(/#([0-9a-f]{3}|[0-9a-f]{6})\b/gi) ?? []).map((h) => h.toLowerCase())));
  if (!hexes.length) return null;
  const sorted = [...hexes].sort((a, b) => luminance(b) - luminance(a));
  let out = svg;
  sorted.forEach((hex, i) => {
    const to = i === 0 ? primary : accent;
    out = out.replace(new RegExp(hex.replace("#", "#"), "gi"), to);
  });
  return out;
}

function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

const VERDICT_CHIP: Record<string, { label: string; className: string }> = {
  original: { label: "Your artwork", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  repaired: { label: "Auto-corrected", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  plated: { label: "On plate", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
};

function MarkTile({ label, background, src, alt, light, compact, empty, verdict }: any) {
  const chip = verdict ? VERDICT_CHIP[verdict] : null;
  return (
    <figure className="min-w-0">
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-xl border border-border/60 px-3",
          compact ? "h-16" : "h-24",
          light && "brand-mark-checker",
        )}
        style={light ? undefined : { background }}
      >
        {light && <div className="absolute inset-0" style={{ background, opacity: 0.92 }} aria-hidden />}
        {src ? (
          <img src={src} alt={alt} loading="lazy" className={cn("relative w-full object-contain", compact ? "max-h-10" : "max-h-14")} />
        ) : (
          <span className="relative px-1 text-center text-[10px] leading-tight text-muted-foreground">
            {empty ?? "No mark yet"}
          </span>
        )}
      </div>
      <figcaption className="mt-1.5 flex items-center justify-between gap-1">
        <span className="truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
        {chip && (
          <span className={cn("shrink-0 rounded-full px-1.5 py-px text-[9px] font-medium", chip.className)}>
            {chip.label}
          </span>
        )}
      </figcaption>
    </figure>
  );
}


function SlotTile({ slot, logo, busy, onPick, onRemove }: any) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onPick(slot.key, file);
      }}
      className={cn(
        "group relative rounded-lg border border-dashed p-2 text-center transition-colors",
        over ? "border-primary bg-primary/10" : "border-border/60 bg-background/40 hover:border-primary/50",
      )}
      title={slot.hint}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPick(slot.key, file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex h-12 w-full items-center justify-center"
        aria-label={`${logo ? "Replace" : "Upload"} ${slot.label} logo`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : logo?.url ? (
          <img src={logo.url} alt={`${slot.label} logo`} className="max-h-10 w-full object-contain" />
        ) : (
          <Upload className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <div className="mt-1 truncate text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {slot.toneLabel ?? slot.label}
      </div>
      {!logo?.url && !busy ? (
        <div className="truncate text-[9px] text-muted-foreground/70">Not supplied</div>
      ) : null}
      {logo?.aspect ? (
        <div className="truncate text-[9px] tabular-nums text-muted-foreground/70">
          {Number(logo.aspect).toFixed(2)}:1
        </div>
      ) : null}
      {logo?.source === "upload" && !busy && (
        <button
          type="button"
          onClick={() => onRemove(slot.key, logo.path)}
          className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label={`Remove ${slot.label} logo`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function LogoSetPanel({
  snapshotId,
  kit,
  companyName,
  onEditMark,
  compact = false,
  showHeader = true,
  className,
}: {
  snapshotId: string;
  kit: any;
  companyName?: string;
  onEditMark?: () => void;
  compact?: boolean;
  showHeader?: boolean;
  className?: string;
}) {
  const qc = useQueryClient();
  const [override, setOverride] = useState<any[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [review, setReview] = useState<{ file: File; aspect: number | null; form: string; tone: string }[] | null>(null);
  const multiRef = useRef<HTMLInputElement | null>(null);
  const [derived, setDerived] = useState<string | null>(null);
  const [deriving, setDeriving] = useState(false);

  useEffect(() => { setOverride(null); }, [kit?.logos]);

  const logos = override ?? kit?.logos;
  const set = useMemo(() => logoSetFrom(logos), [logos]);
  const primaryColor = kit?.palette?.colors?.primary;
  const brandBg = isHex(primaryColor) ? primaryColor : "#101014";
  const alt = `${companyName ?? "Brand"} logo`;
  // The same server-side per-paint audit used by showcases drives approval
  // previews too. A file labelled "reversed" is never blindly trusted, and the
  // set fingerprint retires the previous verdict the moment a slot changes.
  const logoEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brand-logo/${snapshotId}/auto`;
  const fp = useMemo(() => logoSetFingerprint(logos), [logos]);
  const hasMark = Array.isArray(logos) && logos.some((logo: any) => logo?.url || logo?.path);
  const lightMark = hasMark ? `${logoEndpoint}?on=light&v=${fp}` : null;
  const reversedMark = hasMark ? `${logoEndpoint}?on=dark&v=${fp}` : null;
  const brandIsDark = luminance(brandBg) < 0.5;
  const brandMark = hasMark ? `${logoEndpoint}?on=${encodeURIComponent(brandBg)}&v=${fp}` : null;
  const [lightVerdict, darkVerdict, brandVerdict] = useLogoVerdicts([lightMark, reversedMark, brandMark]);


  // Stored signed URLs expire after a week; re-sign on mount so an older
  // venture never renders a dead mark.
  useEffect(() => {
    if (!snapshotId) return;
    const stale = (Array.isArray(kit?.logos) ? kit.logos : []).some((l: any) => l?.path);
    if (!stale) return;
    let cancelled = false;
    generateBrandAsset({ data: { snapshotId, kind: "logo_refresh_urls" } })
      .then((out: any) => { if (!cancelled && Array.isArray(out?.logos)) setOverride(out.logos); })
      .catch(() => null);
    return () => { cancelled = true; };
    // Refresh once per snapshot, not on every kit write.
  }, [snapshotId]);

  const upload = useMutation({
    mutationFn: async ({ variant, file }: { variant: string; file: File }) => {
      if (file.size > MAX_BYTES) throw new Error("That file is over 5 MB — please upload a smaller logo.");
      const dataUrl = await readDataUrl(file);
      return generateBrandAsset({
        data: { snapshotId, kind: "logo_upload_own", variant, dataUrl, filename: file.name, assignmentConfirmed: true },
      });
    },
    onSuccess: (out: any, vars) => {
      if (Array.isArray(out?.logos)) setOverride(out.logos);
      qc.invalidateQueries({ queryKey: ["brandKit", snapshotId] });
      qc.invalidateQueries({ queryKey: ["hub"] });
      const saved = LOGO_SLOTS.find((s) => s.key === (out?.variant ?? vars.variant))?.label ?? "Logo";
      if (out?.measurement_notice) toast.warning(out.measurement_notice);
      else toast.success(`${saved} saved to your brand`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Upload failed"),
    onSettled: () => setPending(null),
  });

  const remove = useMutation({
    mutationFn: async ({ variant, path }: { variant: string; path: string }) =>
      generateBrandAsset({ data: { snapshotId, kind: "logo_remove_upload", variant, path } }),
    onSuccess: (out: any) => {
      if (Array.isArray(out?.logos)) setOverride(out.logos);
      qc.invalidateQueries({ queryKey: ["brandKit", snapshotId] });
      if (out?.removed_count > 0) toast.success("Logo removed");
      else toast.info("That logo was already removed");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not remove that logo"),
    onSettled: () => setPending(null),
  });

  const pick = (variant: string, file: File) => {
    setPending(variant);
    upload.mutate({ variant, file });
  };

  // Multi-file: classify each file by measuring it, then let the founder
  // confirm or correct the assignment before anything is written.
  const pickMany = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, LOGO_SLOTS.length);
    const rows = await Promise.all(
      list.map(async (file) => {
        const aspect = await measureFile(file);
        const { form, tone, inferred } = await classifyFile(file, aspect);
        return { file, aspect, form, tone, inferred };
      }),
    );
    setReview(rows);
  };

  const commitReview = async () => {
    const rows = review ?? [];
    setReview(null);
    for (const row of rows) {
      const variant = SLOT_BY_FORM_TONE[`${row.form}|${row.tone}`] ?? "primary";
      setPending(variant);
      try {
        await upload.mutateAsync({ variant, file: row.file });
      } catch {
        break;
      }
    }
  };

  const busy = upload.isPending || remove.isPending;

  return (
    <section className={cn("min-w-0 space-y-2.5", className)}>
      {showHeader && (
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Your mark</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => multiRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-primary transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              Upload set
            </button>
            {onEditMark && (
              <button
                type="button"
                onClick={onEditMark}
                className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-primary transition-opacity hover:opacity-80"
              >
                <Wand2 className="h-3 w-3" />
                Refine
              </button>
            )}
          </div>
        </div>
      )}

      <input
        ref={multiRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          e.target.value = "";
          if (files?.length) pickMany(files);
        }}
      />

      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"

        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) pickMany(e.dataTransfer.files);
        }}
      >
        <MarkTile label="On light" background="#ffffff" src={lightMark} alt={alt} light compact={compact} verdict={lightVerdict} empty="Upload a primary mark" />
        <MarkTile label="On dark" background="#101014" src={reversedMark} alt={alt} compact={compact} verdict={darkVerdict} empty="Upload a reversed mark" />
        <MarkTile
          label="On brand"
          background={brandBg}
          src={brandMark}
          alt={alt}
          compact={compact}
          verdict={brandVerdict}
          empty={brandIsDark ? "Upload a reversed mark" : "Upload a primary mark"}
        />

      </div>

      {review?.length ? (
        <div className="space-y-2 rounded-xl border border-primary/40 bg-primary/5 p-3">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Check these before saving
          </div>
          {review.map((row, i) => (
            <div key={`${row.file.name}-${i}`} className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="min-w-0 flex-1 truncate">{row.file.name}</span>
              <span className="tabular-nums text-muted-foreground">
                {row.aspect ? `${row.aspect.toFixed(2)}:1` : "vector"}
              </span>
              <select
                value={row.form}
                onChange={(e) =>
                  setReview((r) => (r ?? []).map((x, j) => (j === i ? { ...x, form: e.target.value } : x)))
                }
                className="rounded-md border border-border/60 bg-background px-1.5 py-1 text-[11px]"
              >
                {LOGO_FORMS.map((f) => (
                  <option key={f.form} value={f.form}>{f.label}</option>
                ))}
              </select>
              <select
                value={row.tone}
                onChange={(e) =>
                  setReview((r) => (r ?? []).map((x, j) => (j === i ? { ...x, tone: e.target.value } : x)))
                }
                className="rounded-md border border-border/60 bg-background px-1.5 py-1 text-[11px]"
              >
                {LOGO_TONES.map((t) => (
                  <option key={t.tone} value={t.tone}>{t.label}</option>
                ))}
              </select>
            </div>
          ))}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={commitReview}
              disabled={busy}
              className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground disabled:opacity-50"
            >
              Save {review.length} file{review.length === 1 ? "" : "s"}
            </button>
            <button
              type="button"
              onClick={() => setReview(null)}
              className="text-[11px] text-muted-foreground hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <details className="group rounded-xl border border-border/60 bg-background/30">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <span>Logo set · {LOGO_SLOTS.filter((s) => set[s.key]).length}/{LOGO_SLOTS.length} lockups</span>
          <span className="text-primary transition-transform group-open:rotate-180">▾</span>
        </summary>
        <div className="space-y-3 border-t border-border/60 p-3">
          {LOGO_FORMS.map((f) => (
            <div key={f.form} className="grid grid-cols-[6.5rem_1fr] items-start gap-3">
              <div className="pt-1">
                <div className="text-[11px] font-medium">{f.label}</div>
                <div className="text-[9px] leading-tight text-muted-foreground">{f.hint}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {LOGO_TONES.map((t) => {
                  const slot = LOGO_SLOTS.find((s) => s.form === f.form && s.tone === t.tone)!;
                  return (
                    <SlotTile
                      key={slot.key}
                      slot={{ ...slot, toneLabel: t.label }}
                      logo={set[slot.key]}
                      busy={pending === slot.key}
                      onPick={pick}
                      onRemove={(v: string, path: string) => { setPending(v); remove.mutate({ variant: v, path }); }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          {!set.icon?.url && set.icon_reversed?.url ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-background/40 p-2">
              {derived ? (
                <>
                  <img
                    src={`data:image/svg+xml;utf8,${encodeURIComponent(derived)}`}
                    alt="Derived colour symbol"
                    className="h-10 w-10 object-contain"
                  />
                  <span className="text-[10px] text-muted-foreground">Symbol recoloured into your brand ink.</span>
                  <button
                    type="button"
                    className="text-[10px] font-medium uppercase tracking-[0.12em] text-primary"
                    onClick={() => {
                      const file = new File([derived], "symbol-colour.svg", { type: "image/svg+xml" });
                      setDerived(null);
                      pick("icon", file);
                    }}
                  >
                    Use it
                  </button>
                  <button
                    type="button"
                    className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                    onClick={() => setDerived(null)}
                  >
                    Discard
                  </button>
                </>
              ) : (
                <>
                  <span className="text-[10px] text-muted-foreground">
                    No colour symbol supplied — placements on light grounds fall back to the stacked lockup.
                  </span>
                  <button
                    type="button"
                    disabled={deriving}
                    className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-primary disabled:opacity-50"
                    onClick={async () => {
                      setDeriving(true);
                      const out = await deriveColourSymbol(
                        set.icon_reversed.url,
                        isHex(primaryColor) ? primaryColor : "#0055A4",
                        isHex(kit?.palette?.colors?.accent) ? kit.palette.colors.accent : "#EF4135",
                      );
                      setDeriving(false);
                      if (out) setDerived(out);
                      else toast.error("Could not read that symbol file");
                    }}
                  >
                    {deriving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                    Derive colour symbol
                  </button>
                </>
              )}
            </div>
          ) : null}
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Form is the shape of the lockup; tone is the ground it's drawn for — colour for light, inverse for dark.
            Drop several files at once and we'll measure each one and show you where it's going before saving.
            SVG is best — PNG, JPG and WebP work too, up to 5 MB.
          </p>
        </div>
      </details>

    </section>
  );
}
