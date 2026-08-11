// @ts-nocheck
import { useEffect } from "react";
import { Lock } from "lucide-react";
import { loadGoogleFont, contrastRatio, aaBadge, PERSONALITY_AXES } from "@/lib/brand-wizard";

export function LiveBrandPreview({ kit, snapshot }: { kit: any; snapshot: any }) {
  const palette = kit?.palette?.colors as Record<string, string> | undefined;
  const heading = kit?.typography?.heading?.family;
  const headingWeight = kit?.typography?.heading?.weight ?? 700;
  const body = kit?.typography?.body?.family;
  const bodyWeight = kit?.typography?.body?.weight ?? 400;

  useEffect(() => {
    if (heading) loadGoogleFont(heading, [headingWeight]);
    if (body) loadGoogleFont(body, [bodyWeight]);
  }, [heading, body, headingWeight, bodyWeight]);

  const bg = palette?.bg || "hsl(var(--card))";
  const fg = palette?.fg || "hsl(var(--foreground))";
  const muted = palette?.muted || "hsl(var(--muted-foreground))";
  const accent = palette?.accent || "hsl(var(--accent))";
  const primary = palette?.primary;
  const secondary = palette?.secondary;
  const moods = kit?.dna?.mood ?? [];
  const personality = kit?.dna?.personality ?? {};
  const moodboard = Array.isArray(kit?.moodboard) ? kit.moodboard : [];
  const logos = Array.isArray(kit?.logos) ? kit.logos : [];
  const primaryLogo = logos.find((l: any) => l?.primary) ?? logos[0];
  const voiceAttrs = kit?.voice?.attributes ?? {};
  const voiceRules = kit?.voice?.rules ?? "";
  const tagline = snapshot?.tagline || snapshot?.value_proposition || "Your brand, beautifully expressed.";
  const lastSaved = kit?.updated_at ? new Date(kit.updated_at) : null;

  const VOICE_AXES = [
    { key: "formal", left: "Casual", right: "Formal" },
    { key: "warm", left: "Reserved", right: "Warm" },
    { key: "witty", left: "Earnest", right: "Witty" },
    { key: "expert", left: "Approachable", right: "Expert" },
  ];

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Live brand preview</div>
        <div className="text-[10px] text-muted-foreground">
          {lastSaved ? `Auto-saved · ${lastSaved.toLocaleTimeString()}` : "Auto-saves as you build"}
        </div>
      </div>

      <div className="space-y-4 overflow-y-auto pr-1">
        {/* Hero band */}
        <div
          className="rounded-xl border border-border p-5"
          style={{ background: bg, color: fg }}
        >
          <div className="text-[10px] uppercase tracking-widest opacity-60">{snapshot?.industry || "Brand"}</div>
          <div
            className="mt-1 text-2xl leading-tight"
            style={{ fontFamily: heading ? `'${heading}', system-ui` : undefined, fontWeight: headingWeight }}
          >
            {snapshot?.company_name || "Your venture"}
          </div>
          <div
            className="mt-1 text-sm opacity-80"
            style={{ fontFamily: body ? `'${body}', system-ui` : undefined, fontWeight: bodyWeight }}
          >
            {tagline}
          </div>
          {primary && (
            <div className="mt-3 inline-flex rounded-md px-3 py-1.5 text-xs font-medium" style={{ background: primary, color: bg }}>
              Primary CTA
            </div>
          )}
        </div>

        {/* Personality */}
        <Section title="Personality & mood">
          {moods.length === 0 && Object.keys(personality).length === 0 ? (
            <Placeholder>Adjust personality and add mood words in Step 1.</Placeholder>
          ) : (
            <>
              {moods.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {moods.map((m: string, i: number) => (
                    <span key={i} className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px]">{m}</span>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {PERSONALITY_AXES.map((a) => {
                  const v = personality[a.key] ?? 50;
                  return (
                    <div key={a.key}>
                      <div className="flex justify-between text-[9px] text-muted-foreground"><span>{a.left}</span><span>{a.right}</span></div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${v}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Section>

        {/* Color system */}
        <Section title="Color system">
          {!palette ? (
            <Placeholder>Pick a palette in Step 2.</Placeholder>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(palette).map(([k, v]: any) => (
                  <div key={k} className="rounded-md border border-border bg-card p-1.5">
                    <div className="h-8 w-full rounded" style={{ background: v }} />
                    <div className="mt-1 flex items-center justify-between text-[9px]">
                      <span className="font-mono uppercase">{k}</span>
                      <span className="font-mono text-muted-foreground">{v}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                fg/bg contrast {contrastRatio(fg, bg).toFixed(2)} — {aaBadge(contrastRatio(fg, bg))}
              </div>
            </>
          )}
        </Section>

        {/* Typography */}
        <Section title="Typography">
          {!heading ? (
            <Placeholder>Pick a font pairing in Step 3.</Placeholder>
          ) : (
            <div className="space-y-1.5 rounded-md border border-border bg-card p-3">
              <div style={{ fontFamily: `'${heading}', system-ui`, fontWeight: headingWeight, fontSize: 26, lineHeight: 1.1 }}>Heading 01</div>
              <div style={{ fontFamily: `'${heading}', system-ui`, fontWeight: headingWeight, fontSize: 18, lineHeight: 1.2 }}>Heading 02</div>
              <div style={{ fontFamily: `'${body}', system-ui`, fontWeight: bodyWeight, fontSize: 13, lineHeight: 1.55 }}>
                Body — quick brown fox jumps over the lazy dog. 0123456789.
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">
                {heading} {headingWeight} / {body} {bodyWeight}
              </div>
            </div>
          )}
        </Section>

        {/* Moodboard & logo */}
        <Section title="Moodboard & logo">
          {moodboard.length === 0 && logos.length === 0 && !(kit?.dna?._logoReferences?.length) ? (
            <Placeholder>Generate moodboard images and logo concepts in Step 4.</Placeholder>
          ) : (
            <>
              {moodboard.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5">
                  {moodboard.slice(0, 4).map((m: any, i: number) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-md border border-border bg-background/40">
                      {m?.url && <img src={m.url} className="h-full w-full object-cover" />}
                    </div>
                  ))}
                </div>
              )}
              {kit?.dna?._logoReferences?.length > 0 && (
                <div className="mt-2">
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Inspirations</div>
                  <div className="flex flex-wrap gap-1.5">
                    {kit.dna._logoReferences.slice(0, 3).map((src: string, i: number) => (
                      <div key={i} className="h-12 w-12 overflow-hidden rounded border border-border bg-background">
                        <img src={src} className="h-full w-full object-contain" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {primaryLogo?.url && (
                <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-card p-2">
                  <img src={primaryLogo.url} className="h-12 w-12 rounded object-contain" />
                  <div className="text-[10px] text-muted-foreground">Primary logo</div>
                </div>
              )}
            </>
          )}
        </Section>

        {/* Voice */}
        <Section title="Voice">
          {Object.keys(voiceAttrs).length === 0 && !voiceRules ? (
            <Placeholder>Tune voice attributes in Step 5.</Placeholder>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {VOICE_AXES.map((a) => {
                  const v = voiceAttrs[a.key] ?? 50;
                  return (
                    <div key={a.key}>
                      <div className="flex justify-between text-[9px] text-muted-foreground"><span>{a.left}</span><span>{a.right}</span></div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${v}%`, background: accent }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {voiceRules && (
                <div className="mt-2 rounded-md border border-border bg-card p-2 text-[11px] text-muted-foreground">
                  {voiceRules}
                </div>
              )}
            </>
          )}
        </Section>

        {kit?.guide_markdown && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-[11px] text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> Style guide locked — {kit.guide_markdown.split(/\s+/).length} words
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function Placeholder({ children }: any) {
  return (
    <div className="rounded-md border border-dashed border-border bg-card/40 p-3 text-[11px] italic text-muted-foreground">
      {children}
    </div>
  );
}
