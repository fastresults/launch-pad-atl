// @ts-nocheck
import { useMemo } from "react";
import { Wand2 } from "lucide-react";
import { EditablePaletteSwatch } from "@/components/hub/brand/EditablePaletteSwatch";
import { LogoSetPanel } from "@/components/hub/brand/LogoSetPanel";
import { cn } from "@/lib/utils";

/**
 * The founder-facing summary of a locked identity, presented as a real
 * identity board: the mark shown on light / dark / brand so contrast problems
 * are obvious, the palette as one continuous ramp with AA readouts, and a type
 * specimen set in the actual faces.
 */

const CORE_KEYS = ["primary", "secondary", "accent"];
const SURFACE_KEYS = ["bg", "fg", "muted", "border"];
const PAIR_OF: Record<string, string> = {
  primary: "onPrimary",
  secondary: "onSecondary",
  accent: "onAccent",
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{children}</span>
);

/* ---------------- colour maths ---------------- */

function channels(hex: string) {
  const h = String(hex).replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0);
}
function luminance(hex: string) {
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)];
  const [hi, lo] = x > y ? [x, y] : [y, x];
  return (hi + 0.05) / (lo + 0.05);
}
const isHex = (v: unknown) => typeof v === "string" && /^#?[0-9a-f]{3,8}$/i.test(v);
const readableOn = (hex: string) => (luminance(hex) > 0.45 ? "#111111" : "#ffffff");

/* ---------------- mark ---------------- */

function MarkTile({
  label,
  background,
  src,
  alt,
  light,
}: {
  label: string;
  background: string;
  src?: string | null;
  alt: string;
  light?: boolean;
}) {
  return (
    <figure className="min-w-0">
      <div
        className={cn(
          "relative flex h-24 items-center justify-center overflow-hidden rounded-xl border border-border/60 px-4",
          light && "brand-mark-checker",
        )}
        style={light ? undefined : { background }}
      >
        {light && <div className="absolute inset-0" style={{ background, opacity: 0.92 }} aria-hidden />}
        {src ? (
          <img src={src} alt={alt} loading="lazy" className="relative max-h-14 w-full object-contain" />
        ) : (
          <span className="relative text-[11px]" style={{ color: readableOn(background) }}>
            No mark yet
          </span>
        )}
      </div>
      <figcaption className="mt-1.5 truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </figcaption>
    </figure>
  );
}

function MarkPanel({
  logo,
  companyName,
  primary,
  onEditMark,
}: {
  logo: any;
  companyName?: string;
  primary?: string;
  onEditMark?: () => void;
}) {
  const alt = `${companyName ?? "Brand"} logo`;
  const ext = typeof logo?.url === "string" ? (logo.url.split("?")[0].split(".").pop() ?? "").toUpperCase() : "";
  const brandBg = isHex(primary) ? primary! : "#101014";

  return (
    <section className="min-w-0 space-y-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label>Your mark</Label>
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
      <div className="grid grid-cols-3 gap-2">
        <MarkTile label="On light" background="#ffffff" src={logo?.url} alt={alt} light />
        <MarkTile label="On dark" background="#101014" src={logo?.url} alt={alt} />
        <MarkTile label="On brand" background={brandBg} src={logo?.url} alt={alt} />
      </div>
      <p className="truncate text-[10px] text-muted-foreground">
        {logo?.url ? `${ext || "Image"} · committed mark` : "No logo saved yet — run the Logo Studio."}
      </p>
    </section>
  );
}

/* ---------------- palette ---------------- */

function Swatch({
  tokenKey,
  value,
  pairValue,
  size = "core",
  onChange,
}: {
  tokenKey: string;
  value: string;
  pairValue?: string;
  size?: "core" | "neutral";
  onChange: (key: string, hex: string) => void;
}) {
  const ratio = isHex(value) && isHex(pairValue) ? contrast(value, pairValue!) : null;
  return (
    <div className="min-w-0">
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-border/60",
          size === "core" ? "h-11" : "h-8",
        )}
      >
        <div className="absolute inset-0" style={{ background: value }} aria-hidden />
        <EditablePaletteSwatch tokenKey={tokenKey} value={value} fill onChange={(hex) => onChange(tokenKey, hex)} />
        {pairValue && (
          <span
            className="pointer-events-none absolute bottom-1 right-1 h-3 w-3 rounded-full border border-white/50 shadow-sm"
            style={{ background: pairValue }}
            aria-hidden
          />
        )}
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-1">
        <span className="truncate text-[10px] capitalize text-foreground/80">{tokenKey}</span>
        <span className="shrink-0 font-mono text-[9px] uppercase text-muted-foreground">
          {String(value).replace("#", "")}
        </span>
      </div>
      {ratio !== null && (
        <span
          className={cn(
            "mt-0.5 block text-[9px] uppercase tracking-[0.08em]",
            ratio >= 4.5 ? "text-status-success" : "text-status-warning",
          )}
        >
          {ratio >= 4.5 ? "AA" : "Low"} · {ratio.toFixed(1)}:1
        </span>
      )}
    </div>
  );
}

/* ---------------- component ---------------- */

export function BrandIdentityHeader({
  kit,
  snapshotId,
  companyName,
  onChangeColor,
  onEditMark,
}: {
  kit: any;
  snapshotId: string;
  companyName?: string;
  onChangeColor: (key: string, hex: string) => void;
  onEditMark?: () => void;
}) {
  const colors: Record<string, string> = kit?.palette?.colors ?? {};
  const core = CORE_KEYS.filter((k) => colors[k]);
  const surface = SURFACE_KEYS.filter((k) => colors[k]);
  const extras = Object.keys(colors).filter(
    (k) => !core.includes(k) && !surface.includes(k) && !Object.values(PAIR_OF).includes(k),
  );

  const headingFamily = kit?.typography?.heading?.family ?? null;
  const bodyFamily = kit?.typography?.body?.family ?? null;

  const logo = useMemo(() => {
    const logos = Array.isArray(kit?.logos) ? kit.logos.filter((l: any) => l?.url) : [];
    return logos.find((l: any) => l.primary) ?? logos[0] ?? null;
  }, [kit?.logos]);

  // The mark panel is always shown so a founder can upload one even before any
  // brand generation has run.
  const hasAnything = true;
  if (!hasAnything) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <LogoSetPanel
        snapshotId={snapshotId}
        kit={kit}
        companyName={companyName}
        onEditMark={onEditMark}
      />


      {/* Colour */}
      <section className="min-w-0 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <Label>Colour</Label>
          <span className="text-[10px] text-muted-foreground">Click to edit</span>
        </div>
        {core.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {core.map((k) => (
              <Swatch
                key={k}
                tokenKey={k}
                value={colors[k]}
                pairValue={colors[PAIR_OF[k]]}
                onChange={onChangeColor}
              />
            ))}
          </div>
        )}
        {(surface.length > 0 || extras.length > 0) && (
          <div className="grid grid-cols-4 gap-2">
            {[...surface, ...extras].map((k) => (
              <Swatch key={k} tokenKey={k} value={colors[k]} size="neutral" onChange={onChangeColor} />
            ))}
          </div>
        )}
      </section>

      {/* Type */}
      <section className="min-w-0 space-y-3">
        <Label>Typography</Label>
        {(headingFamily || bodyFamily) ? (
          <div className="space-y-2">
            <div className="rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div
                className="line-clamp-2 text-2xl leading-tight tracking-tight"
                style={headingFamily ? { fontFamily: `"${headingFamily}", serif` } : undefined}
              >
                {companyName || "Aa Bb Cc"}
              </div>
              <div className="mt-1.5 truncate text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Headings · {headingFamily ?? "—"}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/40 p-3.5">
              <div
                className="line-clamp-3 text-sm leading-relaxed text-foreground/90"
                style={bodyFamily ? { fontFamily: `"${bodyFamily}", sans-serif` } : undefined}
              >
                The quick brown fox jumps over the lazy dog.
              </div>
              <div className="mt-1.5 truncate text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Body · {bodyFamily ?? "—"}
              </div>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border/60 p-3.5 text-[11px] text-muted-foreground">
            Typography locks in step 3 of the brand wizard.
          </p>
        )}
      </section>
    </div>
  );
}
