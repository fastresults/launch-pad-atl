// Derive a PROVISIONAL brand kit from the assets a venture already has.
//
// Some deliverables (website PRD, pre-sell landing PRD) need palette /
// typography / voice to be coherent. Historically they were hard-gated behind a
// locked Brand Wizard, which stranded founders who had 60 finished assets and
// no kit. This module infers a kit from that existing work and stores it with
// status "auto" so generation can continue. A founder-locked kit always wins.

import { aiFetch } from "./ai-fetch.ts";
import { sanitizePaletteOption } from "./palette-rules.ts";
import { loadBrandKit, type BrandKitRow } from "./venture-context.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

// Assets that carry the most brand signal, in priority order.
const SOURCE_TYPES = [
  "brand_voice_guide",
  "naming_and_domain",
  "positioning_statement",
  "value_proposition",
  "icp_profile",
  "offer_and_pricing",
  "messaging_matrix",
  "elevator_pitch",
  "executive_summary",
];

async function callAI(messages: any[]): Promise<string> {
  const res = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Lovable-API-Key": LOVABLE_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      response_format: { type: "json_object" },
    }),
  }, { timeoutMs: 120_000, retries: 1 });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI gateway ${res.status}: ${txt.slice(0, 300)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

/**
 * Infer palette / typography / voice from completed venture documents and save
 * the result as a provisional ("auto") brand kit. Returns the saved kit, or
 * null when there isn't enough material or the model call fails.
 */
export async function deriveBrandKitFromAssets(
  supabase: any,
  snapshotId: string,
  userId: string,
  snap: any,
): Promise<BrandKitRow | null> {
  // Never overwrite a founder-authored kit.
  const existing = await loadBrandKit(supabase, snapshotId);
  if (existing?.status === "locked") return existing;
  if (existing?.status === "auto") return existing;

  const { data: docs } = await supabase
    .from("venture_documents")
    .select("document_type, content")
    .eq("snapshot_id", snapshotId)
    .eq("status", "complete");

  const byType = new Map<string, string>();
  for (const d of docs ?? []) {
    if (typeof d?.content === "string" && d.content.trim()) byType.set(d.document_type, d.content);
  }
  // Prefer the high-signal types, then top up with anything else that's ready.
  const picked: string[] = [];
  for (const t of SOURCE_TYPES) {
    const c = byType.get(t);
    if (c) picked.push(`### ${t}\n${c.slice(0, 3000)}`);
  }
  if (picked.length < 2) {
    for (const [t, c] of byType) {
      if (picked.length >= 4) break;
      if (!SOURCE_TYPES.includes(t)) picked.push(`### ${t}\n${c.slice(0, 2000)}`);
    }
  }
  if (!picked.length) return null;

  const sys = `You are a senior brand designer. Infer a single coherent brand kit from the venture's own finished assets below. Do not invent a different business. Return JSON only, in exactly this shape:
{
  "palette": { "name": "string", "rationale": "1 sentence", "source": "derived", "colors": { "bg": "#RRGGBB", "fg": "#RRGGBB", "muted": "#RRGGBB", "accent": "#RRGGBB", "primary": "#RRGGBB", "secondary": "#RRGGBB" } },
  "typography": { "name": "string", "rationale": "1 sentence", "source": "derived", "heading": { "family": "Google Font name", "weight": 700 }, "body": { "family": "Google Font name", "weight": 400 } },
  "voice": { "source": "derived", "attributes": { "formal": 0, "warm": 0, "witty": 0, "expert": 0 }, "bullets": ["3-5 one-sentence voice principles"], "tone_words": ["3-6 adjectives"], "dos": ["2-3 on-brand copy examples"], "donts": ["2-3 off-brand copy examples"], "rules": "freeform style rules paragraph" }
}
Use real Google Font families. Ensure WCAG AA contrast between fg and bg.`;

  const user = `Venture: ${snap?.company_name ?? "Unnamed venture"}
Industry: ${snap?.industry ?? "—"}
Concept: ${(snap?.concept_summary ?? "").slice(0, 1200)}

## Finished assets to infer the brand from
${picked.join("\n\n")}`;

  let parsed: any;
  try {
    parsed = JSON.parse(await callAI([
      { role: "system", content: sys },
      { role: "user", content: user },
    ]));
  } catch (e) {
    console.warn("brand derive failed", e);
    return null;
  }
  if (!parsed?.palette || !parsed?.typography) return null;

  const palette = sanitizePaletteOption({ ...parsed.palette, source: "derived" });

  const dna = {
    ...(existing?.dna ?? {}),
    track: "derived",
    derived_at: new Date().toISOString(),
    derived_from: picked.length,
  };

  const { data: saved, error } = await supabase.from("venture_brand_kits")
    .upsert({
      snapshot_id: snapshotId,
      user_id: userId,
      dna,
      palette,
      typography: parsed.typography,
      voice: parsed.voice ?? null,
      step: 3,
      status: "auto",
    }, { onConflict: "snapshot_id" })
    .select("status, locked_at, palette, typography, voice, logos, guide_markdown, dna")
    .maybeSingle();
  if (error) {
    console.warn("brand derive save failed", error.message);
    return null;
  }

  // Keep snapshot brand tokens in sync so downstream renderers pick up colors.
  if (palette?.colors) {
    await supabase.from("venture_snapshots").update({
      brand_tokens: {
        colors: palette.colors,
        fonts: {
          heading: parsed.typography?.heading?.family,
          body: parsed.typography?.body?.family,
        },
        mood: [],
        radius: "md",
      },
    }).eq("id", snapshotId).is("brand_tokens", null);
  }

  return (saved ?? null) as BrandKitRow | null;
}
