// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ImageIcon, Lock } from "lucide-react";
import { RichMarkdown } from "@/components/markdown/RichMarkdown";
import { supabase } from "@/integrations/supabase/client";
import { loadGoogleFont } from "@/lib/brand-wizard";
import { sanitizeGuideMarkdown } from "@/lib/brand/sanitize-guide-markdown";
import { EditablePaletteSwatch } from "@/components/hub/brand/EditablePaletteSwatch";
import { colorSpaces } from "@/lib/brand/color-spaces";
import { fontFallbacks } from "@/lib/brand/font-fallbacks";

const COLOR_ORDER = ["primary", "secondary", "accent", "bg", "fg", "muted", "surface", "text", "success", "warning", "danger"];

function orderedColors(colors: Record<string, string> = {}) {
  const seen = new Set<string>();
  const out: Array<[string, string]> = [];
  for (const key of COLOR_ORDER) {
    if (colors[key]) {
      out.push([key, colors[key]]);
      seen.add(key);
    }
  }
  for (const entry of Object.entries(colors)) {
    if (!seen.has(entry[0])) out.push(entry as [string, string]);
  }
  return out;
}

function hexToRgb(hex: string) {
  const h = String(hex || "").replace(/^#/, "").slice(0, 6).padEnd(6, "0");
  return `${parseInt(h.slice(0, 2), 16) || 0}, ${parseInt(h.slice(2, 4), 16) || 0}, ${parseInt(h.slice(4, 6), 16) || 0}`;
}


function AssetImage({ asset, alt, className, imgClassName }: any) {
  const [src, setSrc] = useState(asset?.url || "");

  useEffect(() => {
    let cancelled = false;
    setSrc(asset?.url || "");
    if (!asset?.path) return;
    (async () => {
      const { data } = await supabase.storage.from(asset.bucket || "user-media").createSignedUrl(asset.path, 3600);
      if (!cancelled && data?.signedUrl) setSrc(data.signedUrl);
    })();
    return () => { cancelled = true; };
  }, [asset?.path, asset?.url, asset?.bucket]);

  return (
    <div className={className}>
      {src ? (
        <img src={src} alt={alt} className={imgClassName} loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <ImageIcon className="h-6 w-6" />
        </div>
      )}
    </div>
  );
}

export function VisualBrandGuide({ kit, snapshot, className = "", onColorChange, originalColors }: { kit: any; snapshot: any; className?: string; onColorChange?: (tokenKey: string, hex: string) => void; originalColors?: Record<string, string> }) {
  const palette = kit?.palette ?? {};
  const colors = palette?.colors ?? {};
  const typography = kit?.typography ?? {};
  const heading = typography?.heading?.family;
  const headingWeight = typography?.heading?.weight ?? 700;
  const body = typography?.body?.family;
  const bodyWeight = typography?.body?.weight ?? 400;
  const logos = Array.isArray(kit?.logos) ? kit.logos : [];
  const moodboard = Array.isArray(kit?.moodboard) ? kit.moodboard : [];
  const primaryLogo = logos.find((l: any) => l?.primary) ?? logos[0];
  const company = snapshot?.company_name || "Your startup";
  const colorEntries = useMemo(() => orderedColors(colors), [kit?.palette]);
  const voiceAttrs = kit?.voice?.attributes ?? {};

  useEffect(() => {
    if (heading) loadGoogleFont(heading, [headingWeight]);
    if (body) loadGoogleFont(body, [bodyWeight]);
  }, [heading, body, headingWeight, bodyWeight]);

  const pageStyle = {
    background: colors.bg || "#FFFFFF",
    color: colors.fg || "#172033",
    fontFamily: body ? `'${body}', system-ui, sans-serif` : undefined,
    fontWeight: bodyWeight,
  } as any;
  const headingStyle = {
    fontFamily: heading ? `'${heading}', system-ui, sans-serif` : undefined,
    fontWeight: headingWeight,
  } as any;
  const primary = colors.primary || colors.accent || "#111827";

  return (
    <div className={`brand-guide-preview rounded-xl border border-border bg-card p-3 ${className}`}>
      {/* The guide renders as printed paper. It can sit inside a force-dark shell
          (the Brand Wizard dialog), so it opts its whole subtree back into the
          light token set — otherwise token-coloured text lands white-on-white. */}
      <article className="theme-light-scope mx-auto max-w-4xl overflow-hidden rounded-lg shadow-xl" style={pageStyle}>
        <section className="px-8 py-10 sm:px-12" style={{ borderBottom: `8px solid ${primary}` }}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] opacity-70">Brand Style Guide</div>
              <h1 className="mt-3 text-4xl leading-tight sm:text-5xl" style={{ ...headingStyle, color: primary }}>
                {company}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 opacity-80">
                {snapshot?.value_proposition || snapshot?.tagline || "A practical identity system for consistent startup communication."}
              </p>
            </div>
            {primaryLogo && (
              <AssetImage
                asset={primaryLogo}
                alt={`${company} selected logo`}
                className="flex h-32 w-32 shrink-0 items-center justify-center rounded-lg border border-border bg-white p-3"
                imgClassName="max-h-full max-w-full object-contain"
              />
            )}
          </div>
        </section>

        <section className="px-8 py-8 sm:px-12">
          <SectionTitle label="Color System" style={headingStyle} color={primary} />
          {palette?.name && <h3 className="text-xl" style={headingStyle}>{palette.name}</h3>}
          {palette?.rationale && <p className="mt-2 text-sm leading-6 opacity-80">{palette.rationale}</p>}
          {onColorChange && (
            <p className="mt-2 text-[11px] italic opacity-70">Click any swatch to change its color.</p>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {colorEntries.map(([key, value]) => (
              <div key={key} className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
                <div className="relative h-24" style={{ background: value }}>
                  {onColorChange && (
                    <EditablePaletteSwatch
                      tokenKey={key}
                      value={value}
                      originalValue={originalColors?.[key]}
                      onChange={(hex) => onColorChange(key, hex)}
                      fill
                    />
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide">{key}</span>
                    <span className="font-mono text-xs">{value}</span>
                  </div>
                  <div className="mt-1 space-y-0.5 font-mono text-[11px] text-muted-foreground">
                    <div>RGB {hexToRgb(value)}</div>
                    <div>CMYK {colorSpaces(value).cmyk.join(", ")}</div>
                    <div style={{ color: primary }}>{colorSpaces(value).pantone}</div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-background/60 px-8 py-8 sm:px-12">
          <SectionTitle label="Typography" style={headingStyle} color={primary} />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5 text-card-foreground">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Heading Typeface</div>
              <div className="mt-2 text-4xl leading-none" style={{ fontFamily: heading ? `'${heading}', system-ui` : undefined, fontWeight: headingWeight, color: primary }}>
                {heading || "Heading font"}
              </div>
              <div className="mt-3 text-2xl" style={{ fontFamily: heading ? `'${heading}', system-ui` : undefined, fontWeight: headingWeight }}>
                The quick brown fox jumps
              </div>
              <div className="mt-3 font-mono text-xs text-muted-foreground">Weight {headingWeight}</div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">Fallback: {fontFallbacks(heading)}</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 text-card-foreground">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Body Typeface</div>
              <div className="mt-2 text-3xl leading-none" style={{ fontFamily: body ? `'${body}', system-ui` : undefined, fontWeight: bodyWeight, color: primary }}>
                {body || "Body font"}
              </div>
              <p className="mt-3 text-sm leading-6" style={{ fontFamily: body ? `'${body}', system-ui` : undefined, fontWeight: bodyWeight }}>
                Body copy should feel clear, confident, and immediately usable across the startup’s website, emails, decks, and social channels.
              </p>
              <div className="mt-3 font-mono text-xs text-muted-foreground">Weight {bodyWeight}</div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">Fallback: {fontFallbacks(body)}</div>
            </div>
          </div>
        </section>

        <section className="px-8 py-8 sm:px-12">
          <SectionTitle label="Logo & Visual Assets" style={headingStyle} color={primary} />
          {logos.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {logos.slice(0, 4).map((logo: any, i: number) => (
                <div key={`${logo.path || logo.url}-${i}`} className="rounded-lg border border-border bg-card p-3 text-card-foreground">
                  {/* artwork plates stay literally white — printed logos sit on white */}
                  <AssetImage asset={logo} alt={logo.direction_name || `Logo concept ${i + 1}`} className="flex aspect-square items-center justify-center rounded bg-white" imgClassName="max-h-full max-w-full object-contain" />
                  <div className="mt-3 text-sm font-semibold">{logo.direction_name || `Concept ${i + 1}`}</div>
                  {logo.logo_type && <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{logo.logo_type}</div>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No logo concepts selected yet.</EmptyState>
          )}
          {moodboard.length > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              {moodboard.slice(0, 4).map((asset: any, i: number) => (
                <AssetImage key={`${asset.path || asset.url}-${i}`} asset={asset} alt={`Moodboard tile ${i + 1}`} className="aspect-square overflow-hidden rounded-lg border border-border bg-white" imgClassName="h-full w-full object-cover" />
              ))}
            </div>
          )}
        </section>

        <section className="bg-background/60 px-8 py-8 sm:px-12">
          <SectionTitle label="Voice" style={headingStyle} color={primary} />
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(voiceAttrs).map(([key, value]: any) => (
              <div key={key} className="rounded-lg border border-border bg-card p-3 text-card-foreground">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
                  <span>{key}</span><span>{value}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full" style={{ width: `${value}%`, background: primary }} />
                </div>
              </div>
            ))}
          </div>
          {kit?.voice?.rules && <p className="mt-4 rounded-lg border border-border bg-card p-4 text-sm leading-6 text-card-foreground">{kit.voice.rules}</p>}
        </section>

        {kit?.guide_markdown && (
          <section className="px-8 py-8 sm:px-12">
            <SectionTitle label="Brand Narrative" style={headingStyle} color={primary} />
            <div className="prose-brand rounded-lg border border-border bg-card p-5 text-card-foreground">
              <RichMarkdown variant="document">{sanitizeGuideMarkdown(kit.guide_markdown)}</RichMarkdown>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs opacity-70">
              <Lock className="h-3.5 w-3.5" /> Locked guide · {kit.guide_markdown.split(/\s+/).filter(Boolean).length} words
            </div>
          </section>
        )}

        <footer className="flex items-center justify-between px-8 py-5 text-xs opacity-70 sm:px-12" style={{ borderTop: `1px solid ${primary}` }}>
          <span>{company} Brand Style Guide</span>
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Visual assets included</span>
        </footer>
      </article>
    </div>
  );
}

function SectionTitle({ label, style, color }: any) {
  return (
    <div className="mb-4">
      <div className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color }}>{label}</div>
      <div className="mt-2 h-0.5 w-20" style={{ background: color }} />
    </div>
  );
}

function EmptyState({ children }: any) {
  return <div className="rounded-lg border border-dashed border-border bg-card/70 p-6 text-center text-sm opacity-70">{children}</div>;
}
