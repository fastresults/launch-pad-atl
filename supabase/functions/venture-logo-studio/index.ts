// Logo Studio — a directed brief, not an interview.
//
//   start              open an empty session (nothing is drawn, nothing is asked)
//   upload_reference   store one inspiration image with the reason it is there
//   remove_reference   drop one
//   direction          read the brand guide + Second Brain + the founder's own
//                      description, then commit to ONE creative direction, a set
//                      law and three concepts
//   revise_direction   the founder corrects the direction in plain words
//   concepts           render the three marks under the set law, jury each one,
//                      one automatic redraw for anything that fails
//   refine             free-form direction on one mark -> one redraw
//   approve            TRACE the approved mark into brand-coloured vectors
//   commit             assemble the lockup family and write it into the brand kit
//   upload_own / reset
//
// Fidelity rule: approving traces the artwork the founder is looking at. The
// mark is never redrawn between approval and delivery.

import { createClient } from "npm:@supabase/supabase-js@2";
import { decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import { loadVentureContext } from "../_shared/venture-context.ts";
import { resolveOwner, isAdminUser } from "../_shared/impersonation.ts";
import { MODELS } from "../_shared/models.ts";
import {
  buildCreativeDirection,
  chatJson,
  refineConceptBrief,
  type Concept,
  type CreativeDirection,
  type DirectionDossier,
  type FounderIntake,
  type ReferenceImage,
} from "../_shared/logo-direction.ts";
import {
  BUSINESS_READ_SYSTEM,
  businessReadPrompt,
  parseBusinessProfile,
  type BusinessProfile,
} from "../_shared/logo-business-read.ts";
import {
  REFERENCE_READ_INSTRUCTION,
  REFERENCE_READ_SYSTEM,
  parseCraftSpec,
  type CraftSpec,
} from "../_shared/logo-reference-read.ts";
import { buildLogoRenderPrompt, logoNegativePrompt } from "../_shared/logo-render-prompt.ts";
import { JURY_SYSTEM, juryInstruction, parseJuryVerdict } from "../_shared/logo-jury.ts";
import { traceLogo } from "../_shared/logo-trace.ts";
import { composeLockups } from "../_shared/logo-lockup.ts";
import {
  HiggsfieldError,
  fetchRenderBytes,
  higgsfieldConfigured,
  renderLogoConcept,
} from "../_shared/higgsfield.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const BUCKET = "user-media";

const STRATEGY_DOCS = [
  "positioning_statement", "brand_positioning", "value_proposition", "messaging_framework",
  "brand_voice", "ideal_customer_profile", "customer_persona", "offer_design",
  "business_model_canvas", "one_page_business_plan", "elevator_pitch", "market_analysis",
  "naming_rationale", "differentiation",
];

type Mark = {
  id: string;
  concept_id: string;
  title: string;
  idea: string;
  second_read: string;
  reads_as: string;
  brief: string;
  change_note: string;
  path: string;
  url: string | null;
  provider: string;
  jury?: { pass: boolean; note: string; scores: Record<string, number> } | null;
};

type Round = { index: number; label: string; marks: Mark[]; error: string | null };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/* ----------------------------- rendering ----------------------------- */

async function gatewayRender(prompt: string, references: string[], model: string): Promise<Uint8Array> {
  const content: any[] = [{ type: "text", text: prompt }];
  for (const url of references.slice(0, 4)) content.push({ type: "image_url", image_url: { url } });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: references.length ? content : prompt }],
        modalities: ["image", "text"],
        size: "1024x1024",
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`image gateway ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const body = await res.json();
    const first = body?.data?.[0] ?? {};
    let b64: string | undefined = first.b64_json;
    if (!b64 && typeof first.url === "string") {
      if (first.url.startsWith("data:")) b64 = first.url.split(",")[1];
      else return new Uint8Array(await (await fetch(first.url)).arrayBuffer());
    }
    if (!b64) throw new Error("image gateway returned no image");
    const bytes = decodeBase64(b64);
    b64 = undefined;
    return bytes;
  } finally {
    clearTimeout(timer);
  }
}

async function drawMark(prompt: string, references: string[]): Promise<{ bytes: Uint8Array; provider: string }> {
  const failures: string[] = [];
  try {
    return { bytes: await gatewayRender(prompt, references, "google/gemini-3-pro-image"), provider: "gemini-3-pro" };
  } catch (e) { failures.push(`pro: ${errorMessage(e)}`); }
  try {
    return { bytes: await gatewayRender(prompt, references, "google/gemini-3.1-flash-image"), provider: "gemini-3.1-flash" };
  } catch (e) { failures.push(`flash: ${errorMessage(e)}`); }

  if (higgsfieldConfigured()) {
    try {
      const result = await renderLogoConcept(
        { prompt, negativePrompt: logoNegativePrompt(), enhancePrompt: false },
        { timeoutMs: 90_000 },
      );
      return { bytes: await fetchRenderBytes(result.imageUrl), provider: "higgsfield" };
    } catch (e) {
      failures.push(`higgsfield: ${e instanceof HiggsfieldError ? e.body.slice(0, 140) : errorMessage(e)}`);
    }
  }
  throw new Error(failures.join(" | ").slice(0, 400));
}

async function uploadPng(supabase: any, userId: string, snapshotId: string, bytes: Uint8Array, tag: string) {
  const path = `${userId}/logo-studio/${snapshotId}/${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.png`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: "image/png", upsert: true });
  if (error) throw new Error(`Could not store the mark: ${error.message}`);
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  return { path, url: data?.signedUrl ?? null };
}

async function uploadSvg(supabase: any, userId: string, snapshotId: string, svg: string, tag: string) {
  const path = `${userId}/logo-studio/${snapshotId}/${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.svg`;
  const bytes = new TextEncoder().encode(svg);
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: "image/svg+xml", upsert: true });
  if (error) throw new Error(`Could not store the vector: ${error.message}`);
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  return { path, url: data?.signedUrl ?? null };
}

/* ----------------------------- the brand read ----------------------------- */

function ventureBlockOf(ctx: any): string {
  const snap = ctx.snap ?? {};
  const brain = ctx.brain ?? {};
  return [
    snap.company_name ? `Name: ${snap.company_name}` : "",
    snap.industry ? `Industry: ${snap.industry}${snap.sub_industry ? ` / ${snap.sub_industry}` : ""}` : "",
    snap.concept_summary ? `Concept: ${String(snap.concept_summary).slice(0, 900)}` : "",
    snap.value_proposition ? `Value proposition: ${String(snap.value_proposition).slice(0, 600)}` : "",
    snap.target_audience ? `Customer: ${String(snap.target_audience).slice(0, 600)}` : "",
    snap.differentiation_statement ? `Differentiation: ${String(snap.differentiation_statement).slice(0, 600)}` : "",
    brain?.problem ? `Problem solved: ${String(brain.problem).slice(0, 600)}` : "",
    snap.location ? `Where they operate: ${snap.location}` : "",
  ].filter(Boolean).join("\n");
}

function brainBlockOf(ctx: any): string {
  const brain = ctx.brain ?? {};
  return Object.entries(brain)
    .filter(([, v]) => typeof v === "string" && v.trim())
    .map(([k, v]) => `${k}: ${String(v).slice(0, 700)}`)
    .join("\n");
}

/** The brand guide is the FIRST reference: palette roles, type, voice, mood. */
function brandGuideBlockOf(kit: any, tokens: any): string {
  const colors = tokens?.colors ?? {};
  const voice = kit?.voice ?? {};
  const dna = kit?.dna ?? {};
  const list = (v: unknown, n = 6) => (Array.isArray(v) ? v.map(String).slice(0, n).join(", ") : "");
  return [
    `Palette — primary ${colors.primary ?? "—"}, secondary ${colors.secondary ?? "—"}, accent ${colors.accent ?? "—"}`,
    tokens?.fonts?.heading ? `Headings: ${tokens.fonts.heading}` : "",
    tokens?.fonts?.body ? `Body: ${tokens.fonts.body}` : "",
    dna.positioning ? `Positioning: ${String(dna.positioning).slice(0, 400)}` : "",
    list(dna.traits ?? dna.mood ?? dna.personality) ? `Brand traits: ${list(dna.traits ?? dna.mood ?? dna.personality)}` : "",
    voice.summary ? `Voice: ${String(voice.summary).slice(0, 400)}` : "",
    list(voice.tone_words ?? voice.toneWords) ? `Tone words: ${list(voice.tone_words ?? voice.toneWords)}` : "",
    list(voice.dos) ? `Voice do: ${list(voice.dos)}` : "",
    list(voice.donts) ? `Voice don't: ${list(voice.donts)}` : "",
    Array.isArray(kit?.moodboard) && kit.moodboard.length ? `Moodboard: ${kit.moodboard.length} tiles attached as visual reference` : "",
  ].filter(Boolean).join("\n");
}

async function docsBlockOf(supabase: any, snapshotId: string): Promise<string> {
  const { data: docs } = await supabase
    .from("venture_documents")
    .select("document_type, content")
    .eq("snapshot_id", snapshotId)
    .eq("status", "complete");
  const byType = new Map<string, string>();
  for (const doc of docs ?? []) {
    if (typeof doc?.content === "string" && doc.content.trim()) byType.set(doc.document_type, doc.content);
  }
  const picked: string[] = [];
  for (const type of STRATEGY_DOCS) {
    const content = byType.get(type);
    if (content) picked.push(`### ${type}\n${content.slice(0, 2200)}`);
  }
  return picked.join("\n\n");
}

async function moodboardUrls(supabase: any, kit: any): Promise<string[]> {
  const tiles = Array.isArray(kit?.moodboard) ? kit.moodboard : [];
  const urls: string[] = [];
  for (const tile of tiles.slice(0, 3)) {
    const path = typeof tile?.path === "string" ? tile.path : "";
    if (path) {
      try {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
        if (data?.signedUrl) { urls.push(data.signedUrl); continue; }
      } catch { /* fall through */ }
    }
    if (typeof tile?.url === "string" && tile.url.startsWith("http")) urls.push(tile.url);
  }
  return urls;
}

async function readBusinessProfile(ctx: any, tokensBlock: string, docsBlock: string): Promise<BusinessProfile | null> {
  try {
    const parsed = await chatJson(LOVABLE_API_KEY, [
      { role: "system", content: BUSINESS_READ_SYSTEM },
      { role: "user", content: businessReadPrompt(ventureBlockOf(ctx), docsBlock, tokensBlock) },
    ], { model: MODELS.pro, timeoutMs: 90_000 });
    return parseBusinessProfile(parsed);
  } catch (e) {
    console.warn("business read failed", errorMessage(e));
    return null;
  }
}

async function readCraftSpec(references: ReferenceImage[]): Promise<CraftSpec | null> {
  const urls = references.map((r) => r.url).filter((u) => typeof u === "string" && (u.startsWith("http") || u.startsWith("data:image/")));
  if (!urls.length) return null;
  try {
    const content: any[] = [{ type: "text", text: REFERENCE_READ_INSTRUCTION }];
    for (const url of urls.slice(0, 4)) content.push({ type: "image_url", image_url: { url } });
    const parsed = await chatJson(LOVABLE_API_KEY, [
      { role: "system", content: REFERENCE_READ_SYSTEM },
      { role: "user", content },
    ], { model: MODELS.pro, timeoutMs: 90_000 });
    return parseCraftSpec(parsed);
  } catch (e) {
    console.warn("reference read failed", errorMessage(e));
    return null;
  }
}

/* ----------------------------- the jury ----------------------------- */

async function juryReview(
  imageUrl: string,
  concept: Concept,
  direction: CreativeDirection,
  profile: BusinessProfile | null,
  spec: CraftSpec | null,
  palette: string[],
  mood: string,
) {
  try {
    const parsed = await chatJson(LOVABLE_API_KEY, [
      { role: "system", content: JURY_SYSTEM },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: juryInstruction(
              concept.idea, concept.craft_move, concept.logo_type, spec, profile,
              { palette, mood }, direction.set_law,
            ),
          },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ], { model: MODELS.pro, timeoutMs: 90_000 });
    return parseJuryVerdict(parsed) ?? { pass: true, note: "", scores: {} };
  } catch (e) {
    console.warn("jury unavailable", errorMessage(e));
    // A failed jury must never block delivery.
    return { pass: true, note: "", scores: {} };
  }
}

/* ----------------------------- drawing one concept ----------------------------- */

type RenderEnv = {
  supabase: any;
  userId: string;
  snapshotId: string;
  direction: CreativeDirection;
  profile: BusinessProfile | null;
  spec: CraftSpec | null;
  tokens: any;
  companyName: string;
  references: string[];
  palette: string[];
  mood: string;
  deadline: number;
};

function promptFor(env: RenderEnv, concept: Concept, correction?: string | null): string {
  return buildLogoRenderPrompt(
    {
      name: concept.title,
      idea: concept.render_brief || concept.idea,
      craftMove: concept.craft_move,
      imagery: concept.reads_as,
      logoType: concept.logo_type,
      readsAs: concept.reads_as,
      meaning: env.direction.core_idea,
      secondRead: concept.second_read,
      setLaw: env.direction.set_law,
    },
    {
      brandName: env.companyName,
      palette: env.palette,
      moodboard: env.mood,
      personality: env.direction.attributes,
      headingFont: env.tokens?.fonts?.heading,
      bodyFont: env.tokens?.fonts?.body,
      referenceCount: env.references.length,
    },
    env.profile,
    env.spec,
    correction ?? null,
  );
}

/**
 * Draw one concept, judge it, and give it exactly one corrective redraw if the
 * jury rejects it and there is time left in this invocation.
 */
async function renderConcept(env: RenderEnv, concept: Concept, editRef?: string | null): Promise<Mark | { error: string }> {
  const refs = editRef ? [editRef, ...env.references] : env.references;
  try {
    let { bytes, provider } = await drawMark(promptFor(env, concept), refs);
    let stored = await uploadPng(env.supabase, env.userId, env.snapshotId, bytes, "mark");

    let verdict = stored.url
      ? await juryReview(stored.url, concept, env.direction, env.profile, env.spec, env.palette, env.mood)
      : { pass: true, note: "", scores: {} };

    if (!verdict.pass && verdict.note && Date.now() < env.deadline) {
      try {
        const retry = await drawMark(promptFor(env, concept, verdict.note), refs);
        const retryStored = await uploadPng(env.supabase, env.userId, env.snapshotId, retry.bytes, "mark");
        bytes = retry.bytes;
        provider = retry.provider;
        stored = retryStored;
        verdict = retryStored.url
          ? await juryReview(retryStored.url, concept, env.direction, env.profile, env.spec, env.palette, env.mood)
          : verdict;
      } catch (e) {
        console.warn("redraw failed", errorMessage(e));
      }
    }

    return {
      id: crypto.randomUUID(),
      concept_id: concept.id,
      title: concept.title,
      idea: concept.idea,
      second_read: concept.second_read,
      reads_as: concept.reads_as,
      brief: concept.render_brief,
      change_note: "",
      path: stored.path,
      url: stored.url,
      provider,
      jury: verdict,
    };
  } catch (e) {
    return { error: `${concept.title}: ${errorMessage(e).slice(0, 200)}` };
  }
}

/* ----------------------------- session helpers ----------------------------- */

async function withFreshUrls(supabase: any, session: any, brand?: unknown) {
  const rounds: Round[] = Array.isArray(session?.steps) ? session.steps : [];
  for (const round of rounds) {
    for (const mark of round.marks ?? []) {
      if (!mark?.path) continue;
      try {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(mark.path, 60 * 60 * 6);
        if (data?.signedUrl) mark.url = data.signedUrl;
      } catch { /* keep the stored url */ }
    }
  }
  const refs: ReferenceImage[] = Array.isArray(session?.inspiration) ? session.inspiration : [];
  for (const ref of refs) {
    if (!ref?.path) continue;
    try {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(ref.path, 60 * 60 * 6);
      if (data?.signedUrl) ref.url = data.signedUrl;
    } catch { /* keep the stored url */ }
  }
  if (session?.approved_rough?.path) {
    try {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(session.approved_rough.path, 60 * 60 * 6);
      if (data?.signedUrl) session.approved_rough.url = data.signedUrl;
    } catch { /* keep the stored url */ }
  }
  return { ...session, steps: rounds, inspiration: refs, brand: brand ?? null };
}

function normalizeIntake(raw: any, references: ReferenceImage[]): FounderIntake {
  const dials: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw?.dials ?? {})) {
    const n = Number(value);
    if (Number.isFinite(n)) dials[key] = Math.min(5, Math.max(1, Math.round(n)));
  }
  return {
    description: String(raw?.description ?? "").slice(0, 4000),
    markType: ["symbol", "wordmark", "lettermark", "combination", "open"].includes(raw?.markType) ? raw.markType : "open",
    dials,
    avoid: Array.isArray(raw?.avoid) ? raw.avoid.map((a: any) => String(a).slice(0, 160)).filter(Boolean).slice(0, 12) : [],
    references,
  };
}

/* ----------------------------- handler ----------------------------- */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    const body = await req.json();
    const action: string = body?.action ?? "get";
    const snapshotId: string = body?.snapshotId ?? "";
    if (!snapshotId) throw new Error("snapshotId required");

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    let userId = userRes?.user?.id ?? "";
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const owner = await resolveOwner(req, userId, userClient, corsHeaders);
    if (owner.error) return owner.error;
    userId = owner.userId;

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const ctx = await loadVentureContext(supabase, snapshotId);
    const snap = ctx.snap;
    if (!snap) return json({ error: "Venture not found" }, 404);
    if (snap.user_id !== userId) {
      // Super admins may work inside a member's venture without an explicit
      // "view as" session; all writes still land on the owner's records.
      const actorIsAdmin = await isAdminUser(supabase, userId);
      if (!actorIsAdmin) return json({ error: "Forbidden" }, 403);
      console.log(`[admin-override] actor=${userId} acting_on_owner=${snap.user_id} snapshot=${snapshotId}`);
      userId = snap.user_id;
    }

    const { data: kit } = await supabase
      .from("venture_brand_kits")
      .select("palette, typography, dna, voice, logos, moodboard")
      .eq("snapshot_id", snapshotId)
      .maybeSingle();

    const tokens = {
      colors: kit?.palette?.colors ?? snap.brand_tokens?.colors,
      fonts: kit?.typography
        ? { heading: kit.typography.heading?.family, body: kit.typography.body?.family }
        : snap.brand_tokens?.fonts,
      mood: kit?.dna?.mood ?? kit?.dna?.personality ?? snap.brand_tokens?.mood,
    };
    const palette = [tokens.colors?.primary, tokens.colors?.secondary, tokens.colors?.accent]
      .filter((c: any) => typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c));
    const moodWords = Array.isArray(tokens.mood) ? tokens.mood.join(", ") : String(tokens.mood ?? "");

    const brand = {
      companyName: snap.company_name ?? "",
      headingFont: tokens.fonts?.heading ?? null,
      primary: tokens.colors?.primary ?? null,
      palette,
    };

    const loadSession = async (id?: string) => {
      let query = supabase.from("venture_logo_sessions").select("*").eq("snapshot_id", snapshotId);
      query = id ? query.eq("id", id) : query.order("created_at", { ascending: false }).limit(1);
      const { data, error } = await query;
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) ?? null;
    };

    /* ---------------- get ---------------- */
    if (action === "get") {
      const session = await loadSession(body?.sessionId);
      return json({ ok: true, session: session ? await withFreshUrls(supabase, session, brand) : null });
    }

    /* ---------------- start ---------------- */
    if (action === "start") {
      const { data, error } = await supabase.from("venture_logo_sessions").insert({
        snapshot_id: snapshotId,
        user_id: userId,
        status: "intake",
        brief: {},
        steps: [],
        inspiration: [],
        last_error: null,
      }).select().single();
      if (error) throw error;
      return json({ ok: true, session: await withFreshUrls(supabase, data, brand) });
    }

    const session = await loadSession(body?.sessionId ?? "");
    if (!session) throw new Error("No logo session found. Start a new one.");
    const rounds: Round[] = Array.isArray(session.steps) ? session.steps : [];
    const references: ReferenceImage[] = Array.isArray(session.inspiration) ? session.inspiration : [];
    const direction: CreativeDirection | null = session.brief?.direction ?? null;

    /* ---------------- upload_reference ---------------- */
    if (action === "upload_reference") {
      const b64 = String(body?.data ?? "");
      if (!b64) throw new Error("No file received.");
      const reason = String(body?.reason ?? "overall feeling").slice(0, 60);
      const bytes = decodeBase64(b64);
      const stored = await uploadPng(supabase, userId, snapshotId, bytes, "inspiration");
      const next = [...references, {
        url: stored.url ?? "",
        path: stored.path,
        reason,
        label: String(body?.filename ?? "").slice(0, 80),
      }].slice(0, 5);

      const { data, error } = await supabase.from("venture_logo_sessions")
        .update({ inspiration: next }).eq("id", session.id).select().single();
      if (error) throw error;
      return json({ ok: true, session: await withFreshUrls(supabase, data, brand) });
    }

    /* ---------------- remove_reference ---------------- */
    if (action === "remove_reference") {
      const path = String(body?.path ?? "");
      const next = references.filter((r) => r.path !== path);
      const { data, error } = await supabase.from("venture_logo_sessions")
        .update({ inspiration: next }).eq("id", session.id).select().single();
      if (error) throw error;
      return json({ ok: true, session: await withFreshUrls(supabase, data, brand) });
    }

    /* ---------------- direction / revise_direction ---------------- */
    if (action === "direction" || action === "revise_direction") {
      const intake = normalizeIntake(
        action === "direction" ? body?.intake : session.brief?.intake,
        references,
      );
      const correction = String(body?.instruction ?? "").trim();

      const docsBlock = await docsBlockOf(supabase, snapshotId);
      const brandGuideBlock = brandGuideBlockOf(kit, tokens);

      // The business read and the reference read are independent — run together.
      const [profile, spec] = await Promise.all([
        session.brief?.profile
          ? Promise.resolve(session.brief.profile as BusinessProfile)
          : readBusinessProfile(ctx, brandGuideBlock, docsBlock),
        session.brief?.craft_spec && action === "revise_direction"
          ? Promise.resolve(session.brief.craft_spec as CraftSpec)
          : readCraftSpec(references),
      ]);

      const dossier: DirectionDossier = {
        companyName: snap.company_name ?? "the brand",
        ventureBlock: ventureBlockOf(ctx),
        brandGuideBlock,
        brainBlock: brainBlockOf(ctx),
        docsBlock,
        profile,
        craftSpec: spec,
        palette,
      };

      const nextDirection = await buildCreativeDirection(
        LOVABLE_API_KEY, dossier, intake,
        action === "revise_direction" ? direction : null,
        correction || undefined,
      );

      const { data, error } = await supabase.from("venture_logo_sessions").update({
        status: "direction",
        brief: {
          ...(session.brief ?? {}),
          intake,
          profile,
          craft_spec: spec,
          direction: nextDirection,
          corrections: [
            ...(Array.isArray(session.brief?.corrections) ? session.brief.corrections : []),
            ...(correction ? [correction] : []),
          ].slice(-10),
        },
        steps: action === "direction" ? [] : rounds,
        last_error: null,
      }).eq("id", session.id).select().single();
      if (error) throw error;
      return json({ ok: true, session: await withFreshUrls(supabase, data, brand) });
    }

    const profile: BusinessProfile | null = session.brief?.profile ?? null;
    const spec: CraftSpec | null = session.brief?.craft_spec ?? null;

    const buildEnv = async (): Promise<RenderEnv> => ({
      supabase,
      userId,
      snapshotId,
      direction: direction!,
      profile,
      spec,
      tokens,
      companyName: snap.company_name ?? "",
      references: await moodboardUrls(supabase, kit),
      palette: [direction!.colour_roles.dominant, direction!.colour_roles.secondary, direction!.colour_roles.accent]
        .filter(Boolean),
      mood: moodWords,
      // Leave room in the invocation for a corrective redraw, not more.
      deadline: Date.now() + 150_000,
    });

    /* ---------------- concepts ---------------- */
    if (action === "concepts") {
      if (!direction) throw new Error("Approve a direction first.");
      const env = await buildEnv();

      const results = await Promise.all(direction.concepts.map((c) => renderConcept(env, c)));
      const marks = results.filter((r): r is Mark => (r as Mark).id !== undefined);
      const errors = results.filter((r): r is { error: string } => (r as any).error !== undefined).map((r) => r.error);
      if (!marks.length) throw new Error(`No mark could be drawn. ${errors.join(" | ").slice(0, 300)}`);

      const round: Round = {
        index: rounds.length,
        label: direction.headline || "First set",
        marks,
        error: errors.length ? errors.join(" | ").slice(0, 300) : null,
      };

      const { data, error } = await supabase.from("venture_logo_sessions").update({
        status: "concepts",
        steps: [...rounds, round],
        last_error: round.error,
      }).eq("id", session.id).select().single();
      if (error) throw error;
      return json({ ok: true, session: await withFreshUrls(supabase, data, brand) });
    }

    /* ---------------- refine ---------------- */
    if (action === "refine") {
      if (!direction) throw new Error("Approve a direction first.");
      const instruction = String(body?.instruction ?? "").trim();
      if (!instruction) throw new Error("Tell the designer what to change.");
      const markId = String(body?.markId ?? "");
      const source = rounds.flatMap((r) => r.marks ?? []).find((m) => m.id === markId);
      if (!source) throw new Error("That mark is no longer in this session.");

      const baseConcept: Concept = direction.concepts.find((c) => c.id === source.concept_id) ?? {
        id: source.concept_id,
        title: source.title,
        idea: source.idea,
        second_read: source.second_read,
        reads_as: source.reads_as,
        craft_move: "",
        logo_type: "symbol",
        render_brief: source.brief,
      };

      const revised = await refineConceptBrief(LOVABLE_API_KEY, direction, baseConcept, instruction);
      const env = await buildEnv();
      const result = await renderConcept(env, revised, source.url);
      if ((result as any).error) throw new Error((result as any).error);
      const mark = result as Mark;
      mark.change_note = instruction.slice(0, 200);

      const round: Round = { index: rounds.length, label: `Refine — ${revised.title}`, marks: [mark], error: null };
      const nextConcepts = direction.concepts.map((c) => (c.id === revised.id ? revised : c));

      const { data, error } = await supabase.from("venture_logo_sessions").update({
        status: "concepts",
        steps: [...rounds, round],
        brief: { ...(session.brief ?? {}), direction: { ...direction, concepts: nextConcepts } },
        last_error: null,
      }).eq("id", session.id).select().single();
      if (error) throw error;
      return json({ ok: true, session: await withFreshUrls(supabase, data, brand) });
    }

    /* ---------------- approve (trace) ---------------- */
    if (action === "approve") {
      const markId = String(body?.markId ?? body?.roughId ?? "");
      const mark = rounds.flatMap((r) => r.marks ?? []).find((m) => m.id === markId);
      if (!mark) throw new Error("That mark is no longer in this session.");

      const { data: file, error: dlError } = await supabase.storage.from(BUCKET).download(mark.path);
      if (dlError || !file) throw new Error(`Could not read the approved mark: ${dlError?.message ?? "missing file"}`);
      const bytes = new Uint8Array(await file.arrayBuffer());

      const traced = await traceLogo(bytes, tokens, { detail: body?.detail === "faithful" ? "faithful" : "clean" });
      const stored = await uploadSvg(supabase, userId, snapshotId, traced.svg, "vector");

      const { data, error } = await supabase.from("venture_logo_sessions").update({
        status: "approved",
        approved_rough: mark,
        vector_svg: traced.svg,
        vector_path: stored.path,
        traced: traced.traced,
        last_error: traced.traced ? null : traced.note,
      }).eq("id", session.id).select().single();
      if (error) throw error;
      return json({
        ok: true,
        traced: traced.traced,
        note: traced.note,
        vectorUrl: stored.url,
        session: await withFreshUrls(supabase, data, brand),
      });
    }

    /* ---------------- commit ---------------- */
    if (action === "commit") {
      if (!session.vector_svg) throw new Error("Approve a mark first.");
      const companyName = snap.company_name ?? "";
      const family = await composeLockups(session.vector_svg, tokens, companyName);

      const upload = async (svg: string | null, tag: string) =>
        svg ? await uploadSvg(supabase, userId, snapshotId, svg, tag) : null;

      const [mark, horizontal, stacked, mono, knockout] = await Promise.all([
        upload(family.mark, "mark"),
        upload(family.horizontal, "horizontal"),
        upload(family.stacked, "stacked"),
        upload(family.mono, "mono"),
        upload(family.knockout, "knockout"),
      ]);
      if (!mark) throw new Error("Could not assemble the primary mark.");

      const approved = session.approved_rough ?? {};
      const durableUrl = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/brand-logo/${snapshotId}`;
      const asset = {
        ok: true,
        kind: "vector",
        primary: true,
        vectorized: session.traced === true,
        traced: session.traced === true,
        url: mark.url,
        public_url: durableUrl,
        path: mark.path,
        svg_url: mark.url,
        svg_path: mark.path,
        preview_url: mark.url,
        direction_name: approved.title ?? direction?.headline ?? "Logo Studio mark",
        logo_type: direction?.concepts.find((c) => c.id === approved.concept_id)?.logo_type ?? "combination mark",
        symbol_concept: approved.brief ?? "",
        one_line_idea: approved.idea ?? approved.title ?? "",
        meaning: direction?.core_idea ?? "",
        second_read: approved.second_read ?? "",
        set_law: direction?.set_law ?? "",
        source: "logo_studio",
        session_id: session.id,
        variants: {
          mark: { url: mark.url, path: mark.path },
          horizontal: horizontal ? { url: horizontal.url, path: horizontal.path } : null,
          stacked: stacked ? { url: stacked.url, path: stacked.path } : null,
          mono: mono ? { url: mono.url, path: mono.path } : null,
          knockout: knockout ? { url: knockout.url, path: knockout.path } : null,
        },
        wordmark_family: family.wordmark_family,
        created_at: new Date().toISOString(),
      };

      const { error: rpcError } = await supabase.rpc("append_brand_logo", {
        p_snapshot_id: snapshotId,
        p_logo: asset,
        p_max: 8,
      });
      if (rpcError) throw new Error(`Could not save the mark to the brand kit: ${rpcError.message}`);

      const { data, error } = await supabase.from("venture_logo_sessions").update({
        status: "committed",
        last_error: null,
      }).eq("id", session.id).select().single();
      if (error) throw error;
      return json({ ok: true, asset, session: await withFreshUrls(supabase, data, brand) });
    }

    /* ---------------- upload own ---------------- */
    if (action === "upload_own") {
      const b64 = String(body?.data ?? "");
      const isSvg = String(body?.mime ?? "").includes("svg");
      if (!b64) throw new Error("No file received.");
      const bytes = decodeBase64(b64);

      let svg: string;
      let traced = true;
      if (isSvg) {
        svg = new TextDecoder().decode(bytes);
      } else {
        const result = await traceLogo(bytes, tokens, { detail: "faithful" });
        svg = result.svg;
        traced = result.traced;
      }
      const stored = await uploadSvg(supabase, userId, snapshotId, svg, "vector");
      const { data, error } = await supabase.from("venture_logo_sessions").update({
        status: "approved",
        approved_rough: {
          id: crypto.randomUUID(),
          concept_id: "upload",
          title: "Your uploaded mark",
          idea: "Uploaded by the founder",
          second_read: "",
          reads_as: "",
          brief: "Uploaded by the founder",
          change_note: "",
          path: stored.path,
          url: stored.url,
          provider: "upload",
        },
        vector_svg: svg,
        vector_path: stored.path,
        traced,
        last_error: null,
      }).eq("id", session.id).select().single();
      if (error) throw error;
      return json({ ok: true, traced, vectorUrl: stored.url, session: await withFreshUrls(supabase, data, brand) });
    }

    /* ---------------- reset ---------------- */
    if (action === "reset") {
      const { error } = await supabase.from("venture_logo_sessions").delete().eq("id", session.id);
      if (error) throw error;
      return json({ ok: true, session: null });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    const message = errorMessage(error);
    console.error("logo-studio", message);
    return json({ error: message }, 400);
  }
});
