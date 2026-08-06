// Brand Wizard AI helper: generates palette options, typography pairings,
// and the final long-form Brand Style Guide markdown. Every call is grounded
// in the canonical venture context (snapshot + brief + founder + market +
// uploaded sources + snapshot brain) so the brand reflects the whole venture.

import { createClient } from "npm:@supabase/supabase-js@2";
import { loadVentureContext, compactPreamble, renderSources } from "../_shared/venture-context.ts";
import { brainCorpusBlock } from "../_shared/brain-corpus.ts";
import { aiFetch } from "../_shared/ai-fetch.ts";
import { sanitizePaletteOption } from "../_shared/palette-rules.ts";
import { resolveOwner } from "../_shared/impersonation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

async function callAI(messages: any[], opts: { json?: boolean; model?: string; timeoutMs?: number; retries?: number } = {}) {
  const res = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Lovable-API-Key": LOVABLE_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-2.5-flash",
      messages,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  }, { timeoutMs: opts.timeoutMs ?? 120_000, retries: opts.retries ?? 1 });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI gateway ${res.status}: ${txt.slice(0, 300)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

function brandBrief(ctx: any, kit: any) {
  const brainBlock = ctx.brain
    ? `\n\n## Venture brain (compressed)\n${JSON.stringify(ctx.brain, null, 2)}`
    : "";
  const sourcesBlock = (ctx.sources.documents.length || ctx.sources.urls.length)
    ? `\n\n${renderSources(ctx, 2500)}`
    : "";
  const dnaBlock = kit?.dna
    ? `\n\n## Founder DNA selections\nPersonality: ${JSON.stringify(kit.dna.personality || {})}\nMood: ${(kit.dna.mood || []).join(", ") || "—"}\nBrands admired: ${(kit.dna.admired || []).join(", ") || "—"}\nKeywords: ${(kit.dna.keywords || []).join(", ") || "—"}`
    : "";
  const corpusBlock = ctx.corpusBlock ? `\n\n${ctx.corpusBlock}` : "";
  return `${compactPreamble(ctx)}${brainBlock}${corpusBlock}${sourcesBlock}${dnaBlock}`;
}

async function generatePalettes(ctx: any, kit: any) {
  const sys = `You are a senior brand designer. Propose four DISTINCT brand palette directions for the venture below. Ground every choice in the venture's industry, customer, differentiation and any uploaded source material — palettes must feel ownable to THIS specific business, not generic. Each palette gets a name, a one-sentence rationale that references something concrete from the venture context, and six roles (bg, fg, muted, accent, primary, secondary) as #RRGGBB hex. Ensure WCAG AA contrast between fg/bg. Return JSON only.`;
  const user = `${brandBrief(ctx, kit)}

Return JSON: { "options": [ { "name": string, "rationale": string, "mood": [string,string,string], "colors": { "bg": "#hex", "fg": "#hex", "muted": "#hex", "accent": "#hex", "primary": "#hex", "secondary": "#hex" } } ] } — exactly 4 options, visually distinct from each other.`;
  const raw = await callAI([{ role: "system", content: sys }, { role: "user", content: user }], { json: true });
  const parsed = JSON.parse(raw);
  // Enforce palette rules (WCAG contrast, role separation, on-colors) regardless of what the model returned.
  parsed.options = Array.isArray(parsed.options) ? parsed.options.map(sanitizePaletteOption) : [];
  return parsed;
}

async function generateTypography(ctx: any, kit: any) {
  const sys = `You are a typography director. Propose four DISTINCT Google Font pairings (heading + body) tailored to the venture below. Use the full venture context — industry, customer, personality, mood, admired brands — so each pairing tells a different story for THIS business. Return JSON only.`;
  const user = `${brandBrief(ctx, kit)}

Return JSON: { "options": [ { "name": string, "rationale": string, "heading": { "family": "Google Font name", "weight": 600|700|800 }, "body": { "family": "Google Font name", "weight": 400|500 } } ] } — exactly 4 pairings, visually distinct from each other. Use only fonts available on Google Fonts.`;
  const raw = await callAI([{ role: "system", content: sys }, { role: "user", content: user }], { json: true });
  return JSON.parse(raw);
}

async function generateGuide(ctx: any, kit: any) {
  const isExisting = kit?.dna?.track === "existing";
  const existingPreface = isExisting
    ? `\n\nIMPORTANT: This brand ALREADY EXISTS. The palette, typography, logo and voice below were extracted from the founder's live website (${kit?.dna?.source_url ?? "no URL"}) and uploaded logo files. Treat them as ground truth — codify what's there, do not propose replacements or "modernize" anything. Where the data is incomplete, say so explicitly rather than inventing alternates.`
    : "";
  const sys = `You are the head of brand at a top agency writing a complete Brand Style Guide for a founder. Use the ENTIRE venture context — company, customer, differentiation, founder DNA, mood, uploaded source materials, logo assets, and the locked palette/typography/voice — to make every section unmistakably about THIS venture, not boilerplate.${existingPreface} Output Markdown only — no JSON, no code fences except where syntax matters.

FORMATTING CONTRACT (strict):
- NEVER draw ASCII art, sliders, bars, gauges, meters, sparklines, swatches, or any pseudo-graphic. Forbidden glyphs for layout purposes: | - – — • · = * ▮ ▯ █ ░ ▰ ▱ ○ ●. (Pipes are ONLY allowed inside real Markdown tables.)
- For any "scale" or "spectrum", use a Markdown TABLE with a numeric Score column (1–5). Do not draw the scale.
- For comparisons (do/don't, before/after, role/usage), use Markdown tables or bulleted lists with bold labels.
- Color swatches, font specimens, motion curves: describe in tables (role | value | usage). Do NOT attempt to render them visually in text.
- Plain prose otherwise. No decorative dividers made of dashes or equals signs.`;
  const palette = kit.palette ? JSON.stringify(kit.palette, null, 2) : "(none chosen)";
  const typography = kit.typography ? JSON.stringify(kit.typography, null, 2) : "(none chosen)";
  const voice = kit.voice ? JSON.stringify(kit.voice, null, 2) : "(none provided)";

  const logos: any[] = Array.isArray(kit?.logos) ? kit.logos : [];
  const primaryLogo = logos.find((l) => l?.primary) ?? logos[0] ?? null;
  const logoBlock = logos.length
    ? `LOGO ASSETS (${logos.length} uploaded; primary first):
${logos.map((l, i) => `${i + 1}. ${l.filename || "logo"}${(l === primaryLogo) ? " — PRIMARY" : ""}${l.contentType ? ` (${l.contentType})` : ""}${l.url ? `\n   URL: ${l.url}` : ""}`).join("\n")}`
    : `LOGO ASSETS: (none uploaded — Section 5 must say so explicitly and give forward-looking direction for a future mark; do NOT pretend a logo exists.)`;

  const moodboard: any[] = Array.isArray(kit?.moodboard) ? kit.moodboard : [];
  const moodBlock = moodboard.length
    ? `VISUAL EVIDENCE (use these when writing Section 5 logo character and Section 6 imagery):
${moodboard.map((m, i) => `${i + 1}. [${m.source || "image"}] ${m.caption || ""}${m.url ? ` — ${m.url}` : ""}`).join("\n")}`
    : `VISUAL EVIDENCE: (none)`;

  const auditSection = isExisting
    ? `## 1. Existing Brand Audit — enumerate, as bullets, exactly which fields came from the live site extraction (Firecrawl branding payload) vs. inferred, whether typography was auto_mapped to the nearest Google Font, and call out any palette role left blank. Then state the brand's purpose, promise, and positioning in 2-3 sentences.\n`
    : `## 1. Brand at a Glance (purpose, promise, positioning statement)\n`;

  const logoSectionInstruction = logos.length
    ? `## 5. Logo Usage — Reference the uploaded PRIMARY logo by filename (${primaryLogo?.filename || "see LOGO ASSETS"}). Describe its visual character (wordmark, symbol, or combination mark), recommended clear-space expressed as a multiple of the logo's cap-height, minimum sizes for print (mm) and screen (px), 4-6 do/don'ts grounded in the actual mark (color inversions on the locked palette, monochrome use, backgrounds to avoid), and lockup rules if multiple variants were uploaded. Do NOT say "no logo is provided" — one is provided.`
    : `## 5. Logo Usage — Explicitly state that no logo has been uploaded yet. Then provide forward-looking direction for the future mark grounded in the locked palette, typography, and brand voice (recommended type of mark, character, what to avoid). Do NOT fabricate a logo that doesn't exist.`;

  const user = `BRAND BRIEF (full venture context):
${brandBrief(ctx, kit)}

LOCKED PALETTE:
${palette}

LOCKED TYPOGRAPHY:
${typography}

LOCKED VOICE:
${voice}

${logoBlock}

${moodBlock}

Produce a thorough Brand Style Guide in Markdown with these sections:
# {Company} — Brand Style Guide
${auditSection}## 2. Personality & Voice
Write 2-3 sentences on the brand's voice. Then a "Voice Spectrum" Markdown table with this exact shape (no ASCII sliders — just integer Scores 1-5, where 1 = far left pole, 5 = far right pole):

| Trait | Left pole | Score | Right pole | How it shows up |
|---|---|---|---|---|
| Directness | Direct | 2 | Vague | one concrete sentence |

Include 5 rows (Directness, Expertise, Empathy, Brevity, Edge — or equivalents that fit the brand). Then a \`### Do\` bulleted list (4-6 items) and a \`### Don't\` bulleted list (4-6 items). Then \`### Before / After\` with 3 rewrites, each as two blockquotes (\`> Before:\` then \`> After:\`).
## 3. Color System — Markdown table only: | Role | Hex | RGB | Usage | AA Pair |. No swatch art or block characters.
## 4. Typography — Markdown hierarchy table: | Level | Font | Weight | Size | Line-height | Use |. Include H1/H2/H3/body/caption and web + print fallback rows. No ASCII type specimens.
${logoSectionInstruction}
## 6. Imagery & Moodboard (style direction, 3 image prompts for photography, 2 for illustration)
## 7. Iconography (style, stroke width, corner radius)
## 8. Motion — Markdown table: | Pattern | Easing | Duration (ms) | Use |. No drawn curves.
## 9. Application Examples (website hero, social post, email signature, business card copy)
## 10. Voice Cheat-Sheet
## 11. File Naming & Governance


Target 1,400–1,900 words. Be specific, name the chosen fonts and hex values throughout, and reference the venture's actual customer/problem/differentiation in the examples.`;
  return await callAI([{ role: "system", content: sys }, { role: "user", content: user }], { model: "google/gemini-2.5-pro", timeoutMs: 140_000, retries: 0 });
}

const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY") ?? "";

async function firecrawlScrape(url: string) {
  if (!FIRECRAWL_API_KEY) throw new Error("Firecrawl is not configured for this project.");
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      formats: ["markdown", "branding", "screenshot", "summary"],
      onlyMainContent: false,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || `Firecrawl ${res.status}`;
    throw new Error(`Could not scan ${url}: ${msg}`);
  }
  // v2 sometimes wraps in `data`
  return data.data ?? data;
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; contentType: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("Invalid logo data URL");
  const contentType = m[1];
  const b64 = m[2];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, contentType };
}

async function uploadLogo(supabase: any, userId: string, snapshotId: string, dataUrl: string, filename: string) {
  const { bytes, contentType } = dataUrlToBytes(dataUrl);
  const safe = (filename || "logo").replace(/[^\x20-\x7E]/g, "").replace(/[\\/:*?"<>|]/g, "-").trim() || "logo";
  const ext = (contentType.split("/")[1] || "png").replace("+xml", "");
  const baseName = safe.replace(/\.[^.]+$/, "");
  // Save into user-media so the logo is available to website + social creative
  // generation pipelines (which read from user-media / media_assets).
  const path = `${userId}/brand/${snapshotId}/logo-${Date.now()}-${baseName}.${ext}`;
  const { error } = await supabase.storage.from("user-media").upload(path, bytes, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Logo upload failed: ${error.message}`);
  const { data: signed } = await supabase.storage.from("user-media").createSignedUrl(path, 60 * 60 * 24 * 365);
  try {
    await supabase.from("media_assets").insert({
      user_id: userId,
      storage_path: path,
      bucket: "user-media",
      kind: "image",
      mime_type: contentType,
      tags: ["brand_kit", "logo", "uploaded", `snapshot:${snapshotId}`],
      title: filename || "Brand logo",
      description: `Uploaded brand logo for snapshot ${snapshotId}`,
    });
  } catch (e) {
    console.error("media_assets insert failed (non-fatal)", e);
  }
  return { path, url: signed?.signedUrl ?? null, contentType };
}

async function extractExistingBrand(ctx: any, kit: any, payload: any, supabase: any, userId: string, snapshotId: string) {
  const websiteUrl: string | undefined = payload.websiteUrl?.trim() || undefined;
  const voiceNotes: string | undefined = payload.voiceNotes?.trim() || undefined;
  const incomingLogos: { dataUrl: string; filename: string }[] = Array.isArray(payload.logos) ? payload.logos : [];

  // 1+2. Run logo uploads and Firecrawl scrape in parallel to stay under the
  // Edge Function idle-timeout budget.
  const uploadPromises = incomingLogos.map(async (l, i) => {
    if (!l?.dataUrl) return null;
    try {
      const up = await uploadLogo(supabase, userId, snapshotId, l.dataUrl, l.filename || `logo-${i + 1}`);
      return {
        url: up.url,
        path: up.path,
        contentType: up.contentType,
        filename: l.filename || `logo-${i + 1}`,
        primary: i === 0,
        source: "uploaded",
      };
    } catch (e) {
      console.error("logo upload failed", e);
      return null;
    }
  });

  const scrapePromise: Promise<{ scrape: any; error: string | null }> = websiteUrl
    ? Promise.race([
        firecrawlScrape(websiteUrl).then((s) => ({ scrape: s, error: null as string | null })),
        new Promise<{ scrape: any; error: string | null }>((resolve) =>
          setTimeout(() => resolve({ scrape: null, error: "Website scan timed out after 45s — proceeding with logos only." }), 45_000),
        ),
      ]).catch((e: any) => ({ scrape: null, error: e?.message ?? String(e) }))
    : Promise.resolve({ scrape: null, error: null });

  const [uploadResults, scrapeResult] = await Promise.all([Promise.all(uploadPromises), scrapePromise]);
  const uploadedLogos: any[] = uploadResults.filter(Boolean) as any[];
  const scrape = scrapeResult.scrape;
  const scrapeError = scrapeResult.error;
  if (scrapeError) console.error("firecrawl error", scrapeError);

  // 3. Ask the model to synthesize palette/typography/voice/moodboard.
  const branding = scrape?.branding ?? null;
  const markdown = (scrape?.markdown ?? "").slice(0, 6000);
  const summary = scrape?.summary ?? "";
  const screenshot = scrape?.screenshot ?? null;
  const ogImage = branding?.images?.ogImage ?? null;

  const sys = `You are a senior brand strategist reverse-engineering an existing brand. The founder uploaded their logo files and (sometimes) their live website. Your job is to faithfully codify what already exists — DO NOT invent alternate palettes, fonts, or voice. Where data is missing, leave the field as a sensible nearest-Google-Font or neutral fallback and mark it auto_mapped:true. Return JSON only.`;
  const user = `## Venture
${compactPreamble(ctx)}

## Website URL
${websiteUrl ?? "(none provided — rely on logo + venture context)"}

## Firecrawl branding extraction
${branding ? JSON.stringify(branding, null, 2) : "(no website scraped)"}

## Homepage summary
${summary || "(none)"}

## Homepage markdown excerpt
${markdown || "(none)"}

## Uploaded logo filenames
${uploadedLogos.map((l, i) => `${i + 1}. ${l.filename}${l.primary ? " (primary)" : ""}`).join("\n") || "(none)"}

## Founder voice notes
${voiceNotes || "(none)"}

Return JSON exactly in this shape:
{
  "palette": {
    "name": "Extracted from <domain or 'logo'>",
    "rationale": "1 sentence about what was extracted vs inferred",
    "source": "extracted",
    "colors": { "bg": "#hex", "fg": "#hex", "muted": "#hex", "accent": "#hex", "primary": "#hex", "secondary": "#hex" }
  },
  "typography": {
    "name": "Existing pairing",
    "rationale": "1 sentence",
    "source": "extracted",
    "auto_mapped": boolean,
    "heading": { "family": "Google Font name", "weight": 600|700|800 },
    "body": { "family": "Google Font name", "weight": 400|500 }
  },
  "voice": {
    "source": "extracted",
    "attributes": { "formal": 0-100, "warm": 0-100, "witty": 0-100, "expert": 0-100 },
    "bullets": ["3-5 voice principles, each one sentence"],
    "tone_words": ["3-6 adjectives"],
    "dos": ["2-3 examples of on-brand copy"],
    "donts": ["2-3 examples of off-brand copy"],
    "rules": "freeform style rules paragraph"
  }
}

For the palette: if Firecrawl branding is present, you MUST copy colors verbatim (colors.primary→primary, secondary→secondary, accent→accent, background→bg, textPrimary→fg). Only infer when a role is missing. Use #RRGGBB.
For typography: if Firecrawl branding fonts are present, use them verbatim when they exist on Google Fonts; otherwise map to the nearest Google Font and set auto_mapped:true. Set auto_mapped:false when the family matched verbatim.`;
  const raw = await callAI([
    { role: "system", content: sys },
    { role: "user", content: user },
  ], { json: true, model: "google/gemini-2.5-flash" });
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch { throw new Error("AI extraction returned invalid JSON"); }

  // Repair extracted palette so bg/fg and brand-role pairings are guaranteed legible.
  if (parsed?.palette) parsed.palette = sanitizePaletteOption({ ...parsed.palette, source: "extracted" });


  // 4. Build moodboard from screenshot + OG image + uploaded logos.
  const moodboard: any[] = [];
  if (screenshot) moodboard.push({ url: screenshot, source: "site_screenshot", caption: "Homepage" });
  if (ogImage && ogImage !== screenshot) moodboard.push({ url: ogImage, source: "og_image", caption: "Social card" });
  for (const l of uploadedLogos) if (l.url) moodboard.push({ url: l.url, source: "logo", caption: l.filename });

  // 5. Persist on the brand kit (draft, step 3 — user reviews then locks).
  const dna = {
    ...(kit?.dna ?? {}),
    track: "existing",
    source_url: websiteUrl ?? null,
    voice_notes: voiceNotes ?? null,
    extracted_at: new Date().toISOString(),
    scrape_failed: scrapeError ?? null,
    branding_raw: branding ?? null,
  };

  await supabase.from("venture_brand_kits")
    .upsert({
      snapshot_id: snapshotId,
      user_id: userId,
      dna,
      palette: parsed.palette ?? null,
      typography: parsed.typography ?? null,
      voice: parsed.voice ?? null,
      moodboard,
      logos: uploadedLogos,
      step: 3,
      status: "draft",
    }, { onConflict: "snapshot_id" });

  return {
    ok: true,
    scrapeError,
    palette: parsed.palette,
    typography: parsed.typography,
    voice: parsed.voice,
    moodboard,
    logos: uploadedLogos,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    const body = await req.json();
    const { action, snapshotId } = body;
    if (!action || !snapshotId) throw new Error("action and snapshotId required");

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    let userId = userRes?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Impersonation: an admin may act on a member's behalf (validated server-side).
    const actorId = userId;
    const _own = await resolveOwner(req, actorId, userClient, corsHeaders);
    if (_own.error) return _own.error;
    userId = _own.userId;

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const ctx: any = await loadVentureContext(supabase, snapshotId);
    // Ground brand decisions in the founder's Second Brain corpus.
    try {
      ctx.corpusBlock = await brainCorpusBlock(
        supabase,
        ctx.userId,
        snapshotId,
        [ctx.snap?.company_name ?? "", ctx.snap?.concept_summary ?? "", "brand voice, name, look, customer"].filter(Boolean).join(" \u2014 "),
        8,
      );
    } catch (e) {
      console.warn("brain corpus retrieval failed", e);
    }
    if (!ctx.snap || ctx.snap.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: kit } = await supabase.from("venture_brand_kits").select("*").eq("snapshot_id", snapshotId).maybeSingle();

    if (action === "palettes") {
      const out = await generatePalettes(ctx, kit);
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "typography") {
      const out = await generateTypography(ctx, kit);
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "extract-existing") {
      const out = await extractExistingBrand(ctx, kit, body, supabase, userId, snapshotId);
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "derive_from_assets") {
      const derived = await deriveBrandKitFromAssets(supabase, snapshotId, userId, ctx.snap);
      return new Response(JSON.stringify({ ok: !!derived, kit: derived }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "styleguide") {
      const md = await generateGuide(ctx, kit);
      await supabase.from("venture_brand_kits").update({ guide_markdown: md, status: "locked", locked_at: new Date().toISOString() }).eq("snapshot_id", snapshotId);
      if (kit?.palette?.colors && kit?.typography) {
        const brand_tokens = {
          colors: kit.palette.colors,
          fonts: { heading: kit.typography.heading?.family, body: kit.typography.body?.family },
          mood: kit.dna?.mood ?? [],
          radius: "md",
        };
        await supabase.from("venture_snapshots").update({ brand_tokens }).eq("id", snapshotId);
      }
      return new Response(JSON.stringify({ ok: true, markdown: md }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
