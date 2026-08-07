// @ts-nocheck
import { useMemo } from "react";
import { EditablePaletteSwatch } from "@/components/hub/brand/EditablePaletteSwatch";

/**
 * The founder-facing summary of a locked identity: the mark shown at its true
 * aspect ratio, the palette as real swatches (not token debug chips), and a
 * type specimen set in the actual faces.
 */

const CORE_KEYS = ["primary", "secondary", "accent"];
const SURFACE_KEYS = ["bg", "fg", "muted", "border"];
const PAIR_OF: Record<string, string> = {
  primary: "onPrimary",
  secondary: "onSecondary",
  accent: "onAccent",
};

function Swatch({
  tokenKey,
  value,
  pairKey,
  pairValue,
  onChange,
}: {
  tokenKey: string;
  value: string;
  pairKey?: string;
  pairValue?: string;
  onChange: (key: string, hex: string) => void;
}) {
  return (
    <div className="min-w-0">
      <div className="relative h-14 overflow-hidden rounded-lg border border-white/10">
        <div className="absolute inset-0" style={{ background: value }} aria-hidden />
        <EditablePaletteSwatch
          tokenKey={tokenKey}
          value={value}
          fill
          onChange={(hex) => onChange(tokenKey, hex)}
        />
        {pairKey && pairValue && (
          <span className="pointer-events-none absolute bottom-1.5 right-1.5 h-3.5 w-3.5 rounded-full border border-white/40 shadow-sm" style={{ background: pairValue }} aria-hidden />
        )}
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-1">
        <span className="truncate text-[11px] capitalize text-foreground/80">{tokenKey}</span>
        <span className="shrink-0 font-mono text-[10px] uppercase text-muted-foreground">{String(value).replace("#", "")}</span>
      </div>
    </div>
  );
}

export function BrandIdentityHeader({
  kit,
  companyName,
  onChangeColor,
}: {
  kit: any;
  companyName?: string;
  onChangeColor: (key: string, hex: string) => void;
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

  const hasAnything = logo || core.length || surface.length || headingFamily;
  if (!hasAnything) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* Mark — true aspect, never cropped */}
      <div className="flex min-w-0 flex-col">
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Your mark</div>
        <div className="mt-2 flex min-h-[132px] flex-1 items-center justify-center rounded-xl border border-white/10 bg-white p-6">>
          {logo ? (
            <img
              src={logo.url}
              alt={`${companyName ?? "Brand"} logo`}
              className="max-h-24 w-full object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-xs text-muted-foreground">No logo saved yet</span>
          )}
        </div>
      </div>

      {/* Palette + type */}
      <div className="min-w-0 space-y-4">
        {core.length > 0 && (
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Core colours</span>
              <span className="text-[10px] text-muted-foreground">Click a swatch to edit</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {core.map((k) => (
                <Swatch
                  key={k}
                  tokenKey={k}
                  value={colors[k]}
                  pairKey={PAIR_OF[k]}
                  pairValue={colors[PAIR_OF[k]]}
                  onChange={onChangeColor}
                />
              ))}
            </div>
          </div>
        )}

        {(surface.length > 0 || extras.length > 0) && (
          <div>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Surface & neutrals</span>
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {[...surface, ...extras].map((k) => (
                <Swatch key={k} tokenKey={k} value={colors[k]} onChange={onChangeColor} />
              ))}
            </div>
          </div>
        )}

        {(headingFamily || bodyFamily) && (
          <div>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Typography</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-background/40 p-3">
                <div className="truncate text-xl leading-tight" style={headingFamily ? { fontFamily: `"${headingFamily}", serif` } : undefined}>
                  {companyName || "Aa Bb Cc"}
                </div>
                <div className="mt-1 truncate text-[11px] text-muted-foreground">Headings · {headingFamily ?? "—"}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-background/40 p-3">
                <div className="line-clamp-2 text-sm leading-snug" style={bodyFamily ? { fontFamily: `"${bodyFamily}", sans-serif` } : undefined}>
                  The quick brown fox jumps over the lazy dog.
                </div>
                <div className="mt-1 truncate text-[11px] text-muted-foreground">Body · {bodyFamily ?? "—"}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
