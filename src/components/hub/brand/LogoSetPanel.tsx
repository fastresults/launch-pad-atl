// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { generateBrandAsset } from "@/lib/foundersHub.functions";
import { cn } from "@/lib/utils";

/**
 * The one place a founder sees and changes their mark. Renders the committed
 * logo on light / dark / brand, then exposes the four slots of the logo set so
 * any of them can be uploaded or replaced in place — used both on the Brand
 * Studio identity board and at the top of the Brand Wizard.
 */

export const LOGO_SLOTS = [
  { key: "primary", label: "Primary", hint: "Default mark, light backgrounds" },
  { key: "reversed", label: "Reversed", hint: "For dark backgrounds" },
  { key: "icon", label: "Icon", hint: "Favicon, avatar, small placements" },
  { key: "wordmark", label: "Wordmark", hint: "Header and letterhead lockups" },
] as const;

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
const MAX_BYTES = 5 * 1024 * 1024;

const isHex = (v: unknown) => typeof v === "string" && /^#?[0-9a-f]{3,8}$/i.test(v);
const slotOf = (l: any) => l?.variant ?? "primary";

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

/** Filename hints let a multi-file drop land in the right slots. */
function guessSlot(name: string): string {
  const n = name.toLowerCase();
  if (/(reversed|reverse|dark|white|knockout|inverse)/.test(n)) return "reversed";
  if (/(icon|favicon|monogram|glyph|symbol|avatar)/.test(n)) return "icon";
  if (/(wordmark|word-mark|logotype|lockup)/.test(n)) return "wordmark";
  return "primary";
}

function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function MarkTile({ label, background, src, alt, light, compact, empty }: any) {
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
      <figcaption className="mt-1.5 truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
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
      <div className="mt-1 truncate text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{slot.label}</div>
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
  // Each preview shows the mark that actually belongs on that ground. A single
  // primary upload must not silently populate the dark and brand previews.
  const lightMark = set.primary?.url ?? null;
  const reversedMark = set.reversed?.url ?? null;
  const brandIsDark = luminance(brandBg) < 0.5;
  const brandMark = brandIsDark ? reversedMark : lightMark;


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
      toast.success(`${LOGO_SLOTS.find((s) => s.key === vars.variant)?.label ?? "Logo"} saved to your brand`);
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

  // Multi-file: assign by filename hint, then upload sequentially so slots
  // don't race each other writing the same kit row.
  const pickMany = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, LOGO_SLOTS.length);
    const used = new Set<string>();
    for (const file of list) {
      let variant = guessSlot(file.name);
      if (used.has(variant)) {
        variant = LOGO_SLOTS.map((s) => s.key).find((k) => !used.has(k)) ?? variant;
      }
      used.add(variant);
      setPending(variant);
      try {
        await upload.mutateAsync({ variant, file });
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
        className="grid grid-cols-3 gap-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) pickMany(e.dataTransfer.files);
        }}
      >
        <MarkTile label="On light" background="#ffffff" src={lightMark} alt={alt} light compact={compact} empty="Upload a primary mark" />
        <MarkTile label="On dark" background="#101014" src={reversedMark} alt={alt} compact={compact} empty="Upload a reversed mark" />
        <MarkTile
          label="On brand"
          background={brandBg}
          src={brandMark}
          alt={alt}
          compact={compact}
          empty={brandIsDark ? "Upload a reversed mark" : "Upload a primary mark"}
        />

      </div>

      <div className="grid grid-cols-4 gap-2">
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
        Reversed, icon and wordmark fall back to your primary mark when empty.
      </p>
    </section>
  );
}
