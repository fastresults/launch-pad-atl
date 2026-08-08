import type { ShareBrandBoard } from "@/lib/venture-share.functions";

const SWATCH_ORDER: [string, string][] = [
  ["primary", "Primary"],
  ["secondary", "Secondary"],
  ["accent", "Accent"],
  ["bg", "Surface"],
  ["fg", "Text"],
  ["muted", "Muted"],
  ["border", "Border"],
];

const strArr = (v: any, max = 6): string[] =>
  (Array.isArray(v) ? v : []).map((x) => String(x).trim()).filter(Boolean).slice(0, max);

/**
 * Maps a stored brand kit into the same board shape the public showcase uses,
 * so the founder's hub and the shared link never drift apart.
 */
export function kitToBrandBoard(kit: any): ShareBrandBoard {
  const colors: Record<string, string> = kit?.palette?.colors ?? {};
  const logos = (Array.isArray(kit?.logos) ? kit.logos : [])
    .filter((l: any) => l?.url)
    .map((l: any) => ({ url: l.url, label: l.label ?? l.name ?? (l.primary ? "Primary mark" : "Variant") }));

  const moodboard = (Array.isArray(kit?.moodboard) ? kit.moodboard : [])
    .map((m: any) => {
      const url = typeof m === "string" ? m : m?.url ?? m?.publicUrl ?? m?.signedUrl;
      if (!url) return null;
      return { url: String(url), caption: (typeof m === "object" && (m?.caption ?? m?.source)) || null };
    })
    .filter(Boolean) as { url: string; caption?: string | null }[];

  const voiceAttrs = kit?.voice?.attributes ?? {};
  const principles = strArr(kit?.voice?.principles).length
    ? strArr(kit?.voice?.principles)
    : Object.entries(voiceAttrs)
        .map(([k, v]) => `${k[0].toUpperCase()}${k.slice(1)} — ${v}/100`)
        .slice(0, 6);

  return {
    paletteName: kit?.palette?.name ?? null,
    swatches: SWATCH_ORDER.filter(([k]) => typeof colors[k] === "string").map(([k, label]) => ({
      label,
      hex: colors[k],
    })),
    fonts: [
      kit?.typography?.heading?.family
        ? {
            role: "Headings",
            family: String(kit.typography.heading.family),
            weight: Number(kit.typography.heading.weight) || null,
          }
        : null,
      kit?.typography?.body?.family
        ? {
            role: "Body",
            family: String(kit.typography.body.family),
            weight: Number(kit.typography.body.weight) || null,
          }
        : null,
    ].filter(Boolean) as ShareBrandBoard["fonts"],
    logos,
    moodboard,
    dna: {
      positioning: kit?.dna?.positioning ?? kit?.dna?.promise ?? null,
      traits: strArr(kit?.dna?.traits ?? kit?.dna?.mood ?? kit?.dna?.personality),
      toneWords: strArr(kit?.voice?.tone_words ?? kit?.voice?.toneWords),
    },
    voice: {
      summary: kit?.voice?.summary ?? kit?.voice?.rules ?? null,
      principles,
      dos: strArr(kit?.voice?.dos),
      donts: strArr(kit?.voice?.donts),
    },
    ctas: Array.from(
      new Set([...strArr(kit?.voice?.ctas), ...strArr(kit?.dna?.ctas)].filter((s) => s.length <= 60)),
    ).slice(0, 4),
  };
}
