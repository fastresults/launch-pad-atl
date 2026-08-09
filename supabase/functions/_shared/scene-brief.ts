// Venture-specific scene briefs.
//
// The static scene libraries in cover-art-director.ts only cover a handful of
// industries; everything else fell through to a bag of generic founder
// metaphors (coastal highways, mountains, compasses). That is how a UGC
// syndication agency ended up with an aerial of a coastal highway on its
// YouTube channel art.
//
// This module derives 8-12 concrete, shootable scenes from the venture's own
// concept/offer/customer, caches them on the snapshot row, and hands them to
// the art director as the FIRST choice. Static libraries become the cold-start
// fallback only.

import { aiFetch } from "./ai-fetch.ts";

const CHAT_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type BriefScene = {
  depict: string;
  subjects: string[];
  setting: string;
  mood: string;
  camera: string;
  composition: string;
  tags?: string[];
};

export type VentureSceneBrief = {
  business_line: string;
  scenes: BriefScene[];
  avoid: string[];
  derived_at?: string;
};

const MAX_SCENES = 12;

function tidy(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeScene(raw: any): BriefScene | null {
  const depict = tidy(raw?.depict);
  if (depict.length < 25) return null;
  const subjects = Array.isArray(raw?.subjects)
    ? raw.subjects.map((s: any) => tidy(s)).filter(Boolean).slice(0, 5)
    : [];
  return {
    depict: depict.slice(0, 400),
    subjects: subjects.length ? subjects : ["primary subject"],
    setting: tidy(raw?.setting).slice(0, 140) || "on location for this business",
    mood: tidy(raw?.mood).slice(0, 80) || "confident, real",
    camera: tidy(raw?.camera).slice(0, 140) || "35mm prime, f/2, natural light",
    composition: tidy(raw?.composition).slice(0, 180) || "rule-of-thirds, generous negative space",
    tags: Array.isArray(raw?.tags) ? raw.tags.map((t: any) => tidy(t)).filter(Boolean).slice(0, 4) : [],
  };
}

export function isUsableBrief(b: any): b is VentureSceneBrief {
  return !!b && Array.isArray(b.scenes) && b.scenes.length >= 4 && typeof b.business_line === "string";
}

/** Derive a fresh scene brief from the venture brain. Returns null on failure. */
export async function deriveSceneBrief(ctx: any): Promise<VentureSceneBrief | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;

  const snap = ctx?.snap ?? {};
  const brain = ctx?.brain ?? {};

  const facts = [
    `Company: ${tidy(brain?.identity?.company_name) || tidy(snap.company_name) || "(unnamed)"}`,
    `Industry: ${tidy(snap.industry)}${snap.sub_industry ? ` / ${tidy(snap.sub_industry)}` : ""}`,
    `Track: ${tidy(snap.track)}`,
    `Location: ${[tidy(snap.city), tidy(snap.region)].filter(Boolean).join(", ")}`,
    `Customer: ${tidy(brain?.customer) || tidy(brain?.identity?.customer)}`,
    `Offer: ${tidy(brain?.offer) || tidy(snap.value_proposition)}`,
    `Concept: ${tidy(snap.concept_summary || snap.business_concept).slice(0, 1400)}`,
    `Differentiation: ${tidy(snap.differentiation_statement).slice(0, 500)}`,
  ].filter((l) => l.split(": ").slice(1).join(": ").trim()).join("\n");

  const sys = `You are a senior photo editor briefing a shoot for a real client. You write SPECIFIC, shootable scenes — the kind a photographer could produce tomorrow — that unmistakably depict what this business actually does day to day.

Rules:
- Every scene must be recognisable as THIS business's line of work. A stranger seeing the frame alone should be able to guess the industry.
- NEVER use generic aspiration metaphors: no mountains, coastal highways, sunrises over cities, compasses, chess pieces, paper airplanes, torn paper, ladders, lone-founder-at-window, handshakes in suits, business-card flat-lays, passports or travel props, stock open-plan tech offices.
- Include a mix: people at work, close macro of the real tools/materials/product, the real environment, and the customer receiving the value.
- Vary camera and composition per scene, but each scene's camera and composition MUST be coherent with the subject it describes (do not ask for a macro-of-hands framing on a wide silhouette scene).
- No text, signage, screens with readable UI, or logos in any scene.

Return JSON only:
{
  "business_line": "<one plain sentence naming what this business does>",
  "scenes": [
    { "depict": "<one vivid sentence, one frame>", "subjects": ["..."], "setting": "...", "mood": "...", "camera": "<focal length, aperture, light>", "composition": "<framing rule>", "tags": ["launch","customer","product","process","team","brand"] }
  ],
  "avoid": ["<specific off-topic prop or trope that would be wrong for THIS business>", "..."]
}
Produce 10 scenes and 8-12 avoid entries.`;

  try {
    const res = await aiFetch(CHAT_URL, {
      method: "POST",
      headers: { "Lovable-API-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "low",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: facts },
        ],
        response_format: { type: "json_object" },
      }),
    }, { timeoutMs: 90_000, retries: 1 });
    if (!res.ok) {
      console.warn("[scene-brief] gateway", res.status);
      return null;
    }
    const json = await res.json();
    const parsed = JSON.parse(json?.choices?.[0]?.message?.content ?? "");
    const scenes = (Array.isArray(parsed?.scenes) ? parsed.scenes : [])
      .map(normalizeScene)
      .filter(Boolean)
      .slice(0, MAX_SCENES) as BriefScene[];
    if (scenes.length < 4) return null;
    const avoid = (Array.isArray(parsed?.avoid) ? parsed.avoid : [])
      .map((a: any) => tidy(a))
      .filter(Boolean)
      .slice(0, 14);
    return {
      business_line: tidy(parsed?.business_line).slice(0, 220) ||
        tidy(snap.sub_industry) || tidy(snap.industry) || "this venture",
      scenes,
      avoid,
      derived_at: new Date().toISOString(),
    };
  } catch (e) {
    console.warn("[scene-brief] derive failed", e);
    return null;
  }
}

/**
 * Load the cached brief for a snapshot, deriving + persisting it on first use.
 * Never throws — a null result simply means the art director falls back to the
 * static libraries.
 */
export async function ensureSceneBrief(
  admin: any,
  snapshotId: string,
  ctx: any,
  opts: { force?: boolean } = {},
): Promise<VentureSceneBrief | null> {
  if (!snapshotId) return null;
  if (!opts.force) {
    try {
      const { data } = await admin
        .from("venture_snapshots")
        .select("scene_brief")
        .eq("id", snapshotId)
        .maybeSingle();
      if (isUsableBrief(data?.scene_brief)) return data.scene_brief as VentureSceneBrief;
    } catch (e) {
      console.warn("[scene-brief] cache read failed", e);
    }
  }

  const brief = await deriveSceneBrief(ctx);
  if (!brief) return null;
  try {
    await admin
      .from("venture_snapshots")
      .update({ scene_brief: brief, scene_brief_at: new Date().toISOString() })
      .eq("id", snapshotId);
  } catch (e) {
    console.warn("[scene-brief] cache write failed", e);
  }
  return brief;
}

/**
 * Cheap vision check: does the rendered image plausibly depict the described
 * scene for this business? Returns ok=true when we cannot tell (never block on
 * an infrastructure failure).
 */
export async function checkSceneRelevance(args: {
  pngB64: string;
  depict: string;
  businessLine: string;
}): Promise<{ ok: boolean; note: string }> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return { ok: true, note: "" };
  try {
    const res = await aiFetch(CHAT_URL, {
      method: "POST",
      headers: { "Lovable-API-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite",
        messages: [
          {
            role: "system",
            content:
              `You are a strict art-buyer reviewing a delivered image against its brief. Answer JSON only: {"on_brief": true|false, "observed": "<what the image actually shows, max 20 words>", "note": "<one corrective sentence if off-brief>"}. Mark on_brief=false when the image does not depict the briefed scene, or when a stranger could not tell it relates to the stated line of work.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Line of work: ${args.businessLine}\nBriefed scene: ${args.depict}` },
              { type: "image_url", image_url: { url: `data:image/png;base64,${args.pngB64}` } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    }, { timeoutMs: 60_000, retries: 0 });
    if (!res.ok) return { ok: true, note: "" };
    const json = await res.json();
    const parsed = JSON.parse(json?.choices?.[0]?.message?.content ?? "");
    if (parsed?.on_brief === false) {
      const observed = tidy(parsed?.observed);
      const note = tidy(parsed?.note);
      return {
        ok: false,
        note: `The previous render was off-brief${observed ? ` — it showed: ${observed}` : ""}. ${note}`.trim(),
      };
    }
    return { ok: true, note: "" };
  } catch (e) {
    console.warn("[scene-brief] relevance check failed", e);
    return { ok: true, note: "" };
  }
}
