import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShareBrandBoard as BrandBoard } from "@/lib/venture-share.functions";

export type BrandBoardBlock = "logo" | "palette" | "type" | "mood" | "dna" | "voice" | "ctas";

const ALL_BLOCKS: BrandBoardBlock[] = ["logo", "palette", "type", "mood", "dna", "voice", "ctas"];

/** Loads the venture's real typefaces so the specimens render in-brand. */
function useBrandFonts(families: string[]) {
  const key = families.join("|");
  useEffect(() => {
    if (!families.length) return;
    const id = `brand-board-fonts-${btoa(unescape(encodeURIComponent(key))).replace(/=/g, "")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${families
      .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;500;600;700`)
      .join("&")}&display=swap`;
    document.head.appendChild(link);
    // Left in place on unmount: the specimen is re-rendered on every visit.
  }, [key]);
}

function Swatch({ label, hex }: { label: string; hex: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(hex);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className="group overflow-hidden rounded-2xl border border-border/60 text-left transition-colors hover:border-primary/50"
      aria-label={`Copy ${label} ${hex}`}
    >
      <div className="h-24 w-full" style={{ background: hex }} />
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] text-foreground">{label}</span>
          <span className="block font-mono text-[11px] uppercase text-muted-foreground">{hex}</span>
        </span>
        {copied ? (
          <Check className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
    </button>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      {children}
    </section>
  );
}

/**
 * The venture's visual brand rendered identically in the founder's hub and in
 * the public showcase: logo lockups on light and dark, a copyable palette, live
 * font specimens, the mood board, brand DNA and voice, and the calls to action
 * the brand actually uses.
 *
 * `blocks` lets a surface render a subset — the hub already shows the mark,
 * palette and type in its identity header, so it asks for the rest.
 */
export function BrandBoardSections({
  board,
  blocks = ALL_BLOCKS,
  emptyHint,
  onImageClick,
  className,
}: {
  board: BrandBoard;
  blocks?: BrandBoardBlock[];
  /** Shown instead of nothing when every requested block is empty. */
  emptyHint?: string;
  onImageClick?: (url: string, caption?: string | null) => void;
  className?: string;
}) {
  const fonts = board.fonts ?? [];
  useBrandFonts(fonts.map((f) => f.family));

  const show = (b: BrandBoardBlock) => blocks.includes(b);
  const bg = board.swatches?.find((s) => s.label === "Surface")?.hex;
  const fg = board.swatches?.find((s) => s.label === "Text")?.hex;
  const primary = board.swatches?.find((s) => s.label === "Primary")?.hex ?? "hsl(var(--primary))";
  const accent = board.swatches?.find((s) => s.label === "Accent")?.hex ?? primary;
  const heading = fonts.find((f) => f.role === "Headings");
  const body = fonts.find((f) => f.role === "Body");
  const primaryLogo = board.logos?.[0] ?? null;
  const dna = board.dna;
  const voice = board.voice;

  const has = {
    logo: show("logo") && !!primaryLogo,
    palette: show("palette") && !!board.swatches?.length,
    type: show("type") && !!fonts.length,
    mood: show("mood") && !!board.moodboard?.length,
    dna: show("dna") && !!(dna?.positioning || dna?.traits?.length || dna?.toneWords?.length),
    voice:
      show("voice") &&
      !!(voice?.summary || voice?.principles?.length || voice?.dos?.length || voice?.donts?.length),
    ctas: show("ctas") && !!board.ctas?.length,
  };

  if (!Object.values(has).some(Boolean)) {
    return emptyHint ? (
      <p className="rounded-xl border border-dashed border-white/15 bg-background/40 p-4 text-center text-xs text-muted-foreground">
        {emptyHint}
      </p>
    ) : null;
  }

  return (
    <div className={cn("space-y-10", className)}>
      {has.logo && primaryLogo && (
        <Block title="Logo">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "On light", background: bg && isLight(bg) ? bg : "#ffffff" },
              { label: "On dark", background: fg && !isLight(fg) ? fg : "#101014" },
            ].map((surface) => (
              <figure
                key={surface.label}
                className="flex h-44 flex-col items-center justify-center rounded-2xl border border-border/60 p-6"
                style={{ background: surface.background }}
              >
                <img
                  src={primaryLogo.url}
                  alt={primaryLogo.label ?? "Primary logo"}
                  className="max-h-24 w-auto max-w-full object-contain"
                />
                <figcaption
                  className="mt-4 text-[11px] uppercase tracking-[0.18em]"
                  style={{ color: isLight(surface.background) ? "#00000080" : "#ffffff80" }}
                >
                  {surface.label}
                </figcaption>
              </figure>
            ))}
          </div>

          {board.logos.length > 1 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {board.logos.slice(1).map((l, i) => (
                <figure
                  key={`${l.url}-${i}`}
                  className="rounded-2xl border border-border/60 bg-background p-4"
                >
                  <img
                    src={l.url}
                    alt={l.label ?? "Logo variant"}
                    className="mx-auto h-16 w-auto max-w-full object-contain"
                  />
                  {l.label && (
                    <figcaption className="mt-3 text-center text-[11px] text-muted-foreground">
                      {l.label}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </Block>
      )}

      {has.palette && (
        <Block title={board.paletteName ?? "Palette"}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {board.swatches.map((s) => (
              <Swatch key={s.label} label={s.label} hex={s.hex} />
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">Click any swatch to copy its hex value.</p>
        </Block>
      )}

      {has.type && (
        <Block title="Typography">
          <div className="space-y-4">
            {heading && (
              <div className="rounded-2xl border border-border/60 bg-muted/10 px-6 py-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Headings · {heading.family}
                </p>
                <p
                  className="mt-3 text-[34px] leading-tight tracking-tight text-foreground md:text-[44px]"
                  style={{ fontFamily: `"${heading.family}", serif`, fontWeight: heading.weight ?? 700 }}
                >
                  {dna?.positioning ? truncate(dna.positioning, 48) : "The brand, set in its own voice"}
                </p>
              </div>
            )}
            {body && (
              <div className="rounded-2xl border border-border/60 bg-muted/10 px-6 py-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Body · {body.family}
                </p>
                <p
                  className="mt-3 max-w-2xl text-[16px] leading-relaxed text-foreground/90"
                  style={{ fontFamily: `"${body.family}", sans-serif`, fontWeight: body.weight ?? 400 }}
                >
                  Every page, post and printed piece uses this pairing. Headlines carry the promise; body
                  copy explains it in plain language a customer can act on.
                </p>
              </div>
            )}
          </div>
        </Block>
      )}

      {has.mood && (
        <Block title="Mood board">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {board.moodboard!.map((m, i) => (
              <figure
                key={`${m.url}-${i}`}
                className="overflow-hidden rounded-2xl border border-border/60 bg-muted/10"
              >
                <img
                  src={m.url}
                  alt={m.caption ?? `Mood board reference ${i + 1}`}
                  loading="lazy"
                  onClick={onImageClick ? () => onImageClick(m.url, m.caption) : undefined}
                  className={cn(
                    "aspect-[4/3] w-full rounded-2xl object-cover",
                    onImageClick && "cursor-zoom-in",
                  )}
                />
                {m.caption && (
                  <figcaption className="border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
                    {m.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </Block>
      )}

      {has.dna && (
        <Block title="Brand DNA">
          {dna?.positioning && (
            <p className="max-w-3xl text-[17px] leading-relaxed text-foreground/90">{dna.positioning}</p>
          )}
          {!!(dna?.traits?.length || dna?.toneWords?.length) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {[...(dna?.traits ?? []), ...(dna?.toneWords ?? [])].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border/60 px-3 py-1 text-[12px] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </Block>
      )}

      {has.voice && (
        <Block title="Voice">
          {voice?.summary && (
            <p className="max-w-3xl text-[15px] leading-relaxed text-muted-foreground">{voice.summary}</p>
          )}
          {!!voice?.principles?.length && (
            <ul className="mt-4 max-w-3xl space-y-2">
              {voice.principles.map((p) => (
                <li key={p} className="flex gap-2.5 text-[15px] leading-relaxed text-foreground/90">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent }} />
                  {p}
                </li>
              ))}
            </ul>
          )}
          {!!(voice?.dos?.length || voice?.donts?.length) && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                { title: "Sounds like us", list: voice?.dos ?? [] },
                { title: "Never us", list: voice?.donts ?? [] },
              ]
                .filter((c) => c.list.length)
                .map((c) => (
                  <div key={c.title} className="rounded-2xl border border-border/60 bg-muted/10 p-5">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{c.title}</p>
                    <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-foreground/90">
                      {c.list.map((s) => (
                        <li key={s}>“{s}”</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </Block>
      )}

      {has.ctas && (
        <Block title="Calls to action">
          <div className="flex flex-wrap gap-3">
            {board.ctas!.map((c, i) => (
              <span
                key={c}
                className={cn("rounded-full px-5 py-2.5 text-[14px] font-medium", i === 0 ? "" : "border")}
                style={
                  i === 0
                    ? { background: primary, color: readableOn(primary) }
                    : { borderColor: primary, color: primary }
                }
              >
                {c}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            The exact asks this brand makes, styled in its own palette.
          </p>
        </Block>
      )}
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n).trim()}…` : s;
}

function channels(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0);
}

function isLight(hex: string) {
  if (!/^#?[0-9a-f]{3,8}$/i.test(hex)) return true;
  const [r, g, b] = channels(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

function readableOn(hex: string) {
  return isLight(hex) ? "#111111" : "#ffffff";
}
