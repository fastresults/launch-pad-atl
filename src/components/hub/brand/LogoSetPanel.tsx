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


/** Legacy kits store uploads with no `variant` — read those as the primary slot. */
export function logoSetFrom(logos: any): Record<string, any> {
  const list = Array.isArray(logos) ? logos.filter((l: any) => l?.url) : [];
  const set: Record<string, any> = {};
  for (const l of list) {
    if (l?.source === "upload") set[slotOf(l)] ??= l;
  }
  set.primary ??= list.find((l: any) => l?.primary) ?? list[0] ?? null;
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

/** Filename hints only decide tone and wordmark/symbol intent; shape is measured. */
function classifyFile(name: string, aspect: number | null): { form: string; tone: string } {
  const n = name.toLowerCase();
  const tone = /(reversed|reverse|dark|white|knockout|inverse|inv)/.test(n) ? "inverse" : "colour";
  if (/(icon|favicon|monogram|glyph|symbol|avatar)/.test(n)) return { form: "symbol", tone };
  if (/(wordmark|word-mark|logotype)/.test(n)) return { form: "wordmark", tone };
  if (/(stacked|stack|vertical|centred|centered)/.test(n)) return { form: "stacked", tone };
  if (/(horizontal|horiz|lockup|wide)/.test(n)) return { form: "horizontal", tone };
  if (aspect == null) return { form: "horizontal", tone };
  if (aspect >= 2.2) return { form: "horizontal", tone };
  if (aspect >= 1.15) return { form: "stacked", tone };
  return { form: "symbol", tone };
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
      {logo?.aspect ? (
        <div className="truncate text-[9px] tabular-nums text-muted-foreground/70">
          {Number(logo.aspect).toFixed(2)}:1
        </div>
      ) : null}
      {logo?.source === "upload" && !busy && (
        <button
          type="button"
          onClick={() => onRemove(slot.key)}
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
  const multiRef = useRef<HTMLInputElement | null>(null);

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
  const hasMark = Boolean(set.primary?.url || set.reversed?.url || set.icon?.url || set.wordmark?.url);
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
        data: { snapshotId, kind: "logo_upload_own", variant, dataUrl, filename: file.name },
      });
    },
    onSuccess: (out: any, vars) => {
      if (Array.isArray(out?.logos)) setOverride(out.logos);
      qc.invalidateQueries({ queryKey: ["brandKit", snapshotId] });
      qc.invalidateQueries({ queryKey: ["hub"] });
      // The server measures the artwork and may file it where it belongs; say
      // so out loud rather than silently moving it.
      const saved = LOGO_SLOTS.find((s) => s.key === (out?.variant ?? vars.variant))?.label ?? "Logo";
      if (out?.moved && out?.notice) toast.warning(out.notice);
      else toast.success(`${saved} saved to your brand`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Upload failed"),
    onSettled: () => setPending(null),
  });

  const remove = useMutation({
    mutationFn: async (variant: string) =>
      generateBrandAsset({ data: { snapshotId, kind: "logo_remove_upload", variant } }),
    onSuccess: (out: any) => {
      if (Array.isArray(out?.logos)) setOverride(out.logos);
      qc.invalidateQueries({ queryKey: ["brandKit", snapshotId] });
      toast.success("Logo removed");
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
        const { form, tone } = classifyFile(file.name, aspect);
        return { file, aspect, form, tone };
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

      <details className="group rounded-xl border border-border/60 bg-background/30">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <span>Logo set · {LOGO_SLOTS.filter((s) => set[s.key]).length}/{LOGO_SLOTS.length} lockups</span>
          <span className="text-primary transition-transform group-open:rotate-180">▾</span>
        </summary>
        <div className="space-y-2.5 border-t border-border/60 p-3">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {LOGO_SLOTS.map((slot) => (
              <SlotTile
                key={slot.key}
                slot={slot}
                logo={set[slot.key]}
                busy={pending === slot.key}
                onPick={pick}
                onRemove={(v: string) => { setPending(v); remove.mutate(v); }}
              />
            ))}
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Drop files anywhere here or click a slot to replace it. SVG is best — PNG, JPG and WebP work too, up to 5 MB.
            Each preview audits every color in the mark and repairs only colors that fail on that surface.
          </p>
        </div>
      </details>

    </section>
  );
}
