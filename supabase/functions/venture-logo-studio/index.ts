// Logo Studio — an AI-first design interview.
//
// There is no queue, no job ledger, no background worker and nothing that can
// stall. Every action is one synchronous request the founder is watching:
//
//   start          read the venture and write a ~100 word design brief proposing one mark
//   revise_brief   the founder corrects the brief; the designer rewrites it
//   approve_brief  draw the first mark and open the interview
//   answer         record the answer, ask the next question, draw ONE evolved mark
//   back           step the conversation back and take a different branch
//   refine         free-form direction on the current mark -> one redraw
//   approve        TRACE the approved rough into brand-coloured vectors
//   commit         assemble the lockup family and write it into the brand kit
//
// One mark at a time. Fidelity rule: approving traces the artwork the founder is
// looking at. The mark is never redrawn between approval and delivery.

import { createClient } from "npm:@supabase/supabase-js@2";
import { loadVentureContext } from "../_shared/venture-context.ts";
import { resolveOwner } from "../_shared/impersonation.ts";
import {
  nextTurn,
  openingBrief,
  roughPrompt,
  ROUGH_NEGATIVE,
  type InterviewTurn,
  type RoughDirection,
  type StudioContext,
} from "../_shared/logo-interview.ts";
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
];

type Rough = {
  id: string;
  title: string;
  brief: string;
  path: string;
  url: string | null;
  provider: string;
};

type Step = {
  index: number;
  question: string;
  helper: string;
  read_back: string | null;
  choices: { label: string; description: string }[];
  allow_free_text: boolean;
  multi_select: boolean;
  done: boolean;
  roughs: Rough[];
  render_error: string | null;
  answer: string | null;
  chosen_rough_id: string | null;
};

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
    const b64 = body?.data?.[0]?.b64_json;
    if (!b64) throw new Error("image gateway returned no image");
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Draw one rough. The reference-conditioned gateway render leads because it can
 * actually SEE the moodboard; Higgsfield is the fallback. Whichever drew it is
 * reported back to the founder — never a silent substitution.
 */
async function drawRough(prompt: string, references: string[]): Promise<{ bytes: Uint8Array; provider: string }> {
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
        { prompt, negativePrompt: ROUGH_NEGATIVE, enhancePrompt: false },
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
  if (error) throw new Error(`Could not store the rough: ${error.message}`);
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

/** Draw the single mark for this turn. One rough, never a set. */
async function drawOne(
  supabase: any,
  userId: string,
  snapshotId: string,
  direction: RoughDirection,
  tokens: any,
  companyName: string,
  references: string[],
): Promise<{ roughs: Rough[]; error: string | null }> {
  try {
    const prompt = roughPrompt(direction, tokens, companyName);
    const { bytes, provider } = await drawRough(prompt, references);
    const stored = await uploadPng(supabase, userId, snapshotId, bytes, "rough");
    return {
      roughs: [{
        id: crypto.randomUUID(),
        title: direction.title,
        brief: direction.render_brief,
        path: stored.path,
        url: stored.url,
        provider,
      }],
      error: null,
    };
  } catch (e) {
    return { roughs: [], error: `The mark could not be drawn. ${errorMessage(e).slice(0, 240)}` };
  }
}


/* ----------------------------- context ----------------------------- */

async function buildStudioContext(supabase: any, ctx: any, tokens: any, kit: any): Promise<{ studio: StudioContext; references: string[] }> {
  const snap = ctx.snap ?? {};
  const brain = ctx.brain ?? {};
  const ventureBlock = [
    snap.company_name ? `Name: ${snap.company_name}` : "",
    snap.industry ? `Industry: ${snap.industry}` : "",
    snap.concept_summary ? `Concept: ${String(snap.concept_summary).slice(0, 900)}` : "",
    snap.target_audience ? `Customer: ${String(snap.target_audience).slice(0, 600)}` : "",
    snap.differentiation_statement ? `Differentiation: ${String(snap.differentiation_statement).slice(0, 600)}` : "",
    brain?.problem ? `Problem solved: ${String(brain.problem).slice(0, 600)}` : "",
    snap.location ? `Where they operate: ${snap.location}` : "",
  ].filter(Boolean).join("\n");

  const { data: docs } = await supabase
    .from("venture_documents")
    .select("document_type, content")
    .eq("snapshot_id", snap.id)
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
  // Anything else they have finished, lightly, so the designer knows the scope.
  const others = [...byType.keys()].filter((k) => !STRATEGY_DOCS.includes(k));
  if (others.length) picked.push(`### also completed\n${others.join(", ")}`);

  const colors = tokens?.colors ?? {};
  const tokensBlock = [
    `Primary ${colors.primary ?? "—"}, secondary ${colors.secondary ?? "—"}, accent ${colors.accent ?? "—"}`,
    `Headings ${tokens?.fonts?.heading ?? "—"} / body ${tokens?.fonts?.body ?? "—"}`,
    Array.isArray(tokens?.mood) ? `Personality: ${tokens.mood.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  const tiles = Array.isArray(kit?.moodboard) ? kit.moodboard : [];
  const references: string[] = [];
  for (const tile of tiles.slice(0, 4)) {
    const path = typeof tile?.path === "string" ? tile.path : "";
    if (path) {
      try {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
        if (data?.signedUrl) { references.push(data.signedUrl); continue; }
      } catch { /* fall through to the stored url */ }
    }
    if (typeof tile?.url === "string" && tile.url.startsWith("http")) references.push(tile.url);
  }

  return {
    studio: {
      companyName: snap.company_name ?? "the brand",
      ventureBlock,
      docsBlock: picked.join("\n\n"),
      tokensBlock,
      moodboardBlock: tiles.length ? `${tiles.length} moodboard tiles are attached as visual references.` : "",
    },
    references,
  };
}

/* ----------------------------- session ----------------------------- */

function historyOf(steps: Step[]): { question: string; answer: string; chosen?: string | null }[] {
  return steps
    .filter((s) => s.answer !== null)
    .map((s) => ({
      question: s.question,
      answer: s.answer ?? "",
      chosen: s.roughs.find((r) => r.id === s.chosen_rough_id)?.title ?? null,
    }));
}

async function buildStep(
  supabase: any,
  userId: string,
  snapshotId: string,
  studio: StudioContext,
  references: string[],
  tokens: any,
  steps: Step[],
  brief: string,
  instruction?: string,
  overrideDirection?: RoughDirection,
): Promise<{ step: Step; turn: InterviewTurn }> {
  const turn = await nextTurn(LOVABLE_API_KEY, studio, historyOf(steps), brief, instruction);
  const { roughs, error } = await drawOne(
    supabase, userId, snapshotId, overrideDirection ?? turn.direction, tokens, studio.companyName, references,
  );

  return {
    turn,
    step: {
      index: steps.length,
      question: turn.question,
      helper: turn.helper,
      read_back: turn.read_back,
      choices: turn.choices,
      allow_free_text: turn.allow_free_text,
      multi_select: turn.multi_select,
      done: turn.done,
      roughs,
      render_error: error,
      answer: null,
      chosen_rough_id: null,
    },
  };
}

/** Signed urls expire; re-sign everything the client is about to render. */
async function withFreshUrls(supabase: any, session: any) {
  const steps: Step[] = Array.isArray(session?.steps) ? session.steps : [];
  for (const step of steps) {
    for (const rough of step.roughs ?? []) {
      if (!rough?.path) continue;
      try {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(rough.path, 60 * 60 * 6);
        if (data?.signedUrl) rough.url = data.signedUrl;
      } catch { /* keep the stored url */ }
    }
  }
  if (session?.approved_rough?.path) {
    try {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(session.approved_rough.path, 60 * 60 * 6);
      if (data?.signedUrl) session.approved_rough.url = data.signedUrl;
    } catch { /* keep the stored url */ }
  }
  return { ...session, steps };
}

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
    if (snap.user_id !== userId) return json({ error: "Forbidden" }, 403);

    const { data: kit } = await supabase
      .from("venture_brand_kits")
      .select("palette, typography, dna, logos, moodboard")
      .eq("snapshot_id", snapshotId)
      .maybeSingle();
    const tokens = {
      colors: kit?.palette?.colors ?? snap.brand_tokens?.colors,
      fonts: kit?.typography ? { heading: kit.typography.heading?.family, body: kit.typography.body?.family } : snap.brand_tokens?.fonts,
      mood: kit?.dna?.mood ?? kit?.dna?.personality ?? snap.brand_tokens?.mood,
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
      return json({ ok: true, session: session ? await withFreshUrls(supabase, session) : null });
    }

    /* ---------------- start (write the brief — nothing is drawn yet) ---------------- */
    if (action === "start") {
      const { studio } = await buildStudioContext(supabase, ctx, tokens, kit);
      const proposal = await openingBrief(LOVABLE_API_KEY, studio);

      const { data, error } = await supabase.from("venture_logo_sessions").insert({
        snapshot_id: snapshotId,
        user_id: userId,
        status: "briefing",
        brief: {
          summary: proposal.design_brief,
          proposal: proposal.design_brief,
          direction: proposal.direction,
        },
        steps: [],
        last_error: null,
      }).select().single();
      if (error) throw error;
      return json({ ok: true, session: await withFreshUrls(supabase, data) });
    }


    const sessionId: string = body?.sessionId ?? "";
    const session = await loadSession(sessionId);
    if (!session) throw new Error("No logo session found. Start a new one.");
    const steps: Step[] = Array.isArray(session.steps) ? session.steps : [];

    /* ---------------- revise_brief ---------------- */
    if (action === "revise_brief") {
      const correction = String(body?.instruction ?? "").trim();
      if (!correction) throw new Error("Tell the designer what to change in the brief.");
      const { studio } = await buildStudioContext(supabase, ctx, tokens, kit);
      const proposal = await openingBrief(LOVABLE_API_KEY, studio, correction, session.brief?.proposal ?? "");

      const { data, error } = await supabase.from("venture_logo_sessions").update({
        status: "briefing",
        brief: {
          summary: proposal.design_brief,
          proposal: proposal.design_brief,
          direction: proposal.direction,
        },
        last_error: null,
      }).eq("id", session.id).select().single();
      if (error) throw error;
      return json({ ok: true, session: await withFreshUrls(supabase, data) });
    }

    /* ---------------- approve_brief (draw the first mark) ---------------- */
    if (action === "approve_brief") {
      const proposal: string = session.brief?.proposal ?? "";
      const direction: RoughDirection | undefined = session.brief?.direction ?? undefined;
      const { studio, references } = await buildStudioContext(supabase, ctx, tokens, kit);
      const { step, turn } = await buildStep(
        supabase, userId, snapshotId, studio, references, tokens, [], proposal,
        `The founder approved this brief:\n${proposal}\n\nDraw that mark now and ask your first refining question about it.`,
        direction,
      );

      const { data, error } = await supabase.from("venture_logo_sessions").update({
        status: "interviewing",
        steps: [step],
        brief: { ...(session.brief ?? {}), summary: turn.brief_summary || proposal },
        last_error: step.render_error,
      }).eq("id", session.id).select().single();
      if (error) throw error;
      return json({ ok: true, session: await withFreshUrls(supabase, data) });
    }

    /* ---------------- answer ---------------- */
    if (action === "answer") {
      const answer = String(body?.answer ?? "").trim();
      const chosenRoughId = body?.chosenRoughId ?? null;
      if (!answer && !chosenRoughId) throw new Error("Pick an option or type an answer.");

      const current = steps[steps.length - 1];
      if (!current) throw new Error("This session has no open question.");
      current.answer = answer || (current.roughs.find((r) => r.id === chosenRoughId)?.title ?? "");
      current.chosen_rough_id = chosenRoughId;

      const { studio, references } = await buildStudioContext(supabase, ctx, tokens, kit);
      const { step, turn } = await buildStep(
        supabase, userId, snapshotId, studio, references, tokens, steps, session.brief?.summary ?? "",
      );
      const nextSteps = [...steps, step];

      const { data, error } = await supabase.from("venture_logo_sessions").update({
        steps: nextSteps,
        brief: { ...(session.brief ?? {}), summary: turn.brief_summary },
        last_error: step.render_error,
      }).eq("id", session.id).select().single();
      if (error) throw error;
      return json({ ok: true, session: await withFreshUrls(supabase, data) });
    }


    /* ---------------- back ---------------- */
    if (action === "back") {
      const target = Math.max(0, Math.min(steps.length - 1, Number(body?.toStep ?? steps.length - 2)));
      const trimmed = steps.slice(0, target + 1);
      const last = trimmed[trimmed.length - 1];
      if (last) { last.answer = null; last.chosen_rough_id = null; }
      const { data, error } = await supabase.from("venture_logo_sessions").update({
        steps: trimmed,
        status: "interviewing",
        approved_rough: null,
        vector_svg: null,
        vector_path: null,
        last_error: null,
      }).eq("id", session.id).select().single();
      if (error) throw error;
      return json({ ok: true, session: await withFreshUrls(supabase, data) });
    }

    /* ---------------- refine ---------------- */
    if (action === "refine") {
      const instruction = String(body?.instruction ?? "").trim();
      const roughId = body?.roughId ?? null;
      if (!instruction) throw new Error("Tell the designer what to change.");
      const source = steps.flatMap((s) => s.roughs ?? []).find((r) => r.id === roughId) ?? null;

      const { studio, references } = await buildStudioContext(supabase, ctx, tokens, kit);
      const { step, turn } = await buildStep(
        supabase, userId, snapshotId, studio, references, tokens, steps, session.brief?.summary ?? "",
        source
          ? `They are looking at the rough titled "${source.title}" (${source.brief}) and said: ${instruction}. Draw three refinements of THAT mark — same idea, their change applied.`
          : instruction,
      );
      const nextSteps = [...steps, step];
      const { data, error } = await supabase.from("venture_logo_sessions").update({
        steps: nextSteps,
        brief: { summary: turn.brief_summary },
        last_error: step.render_error,
      }).eq("id", session.id).select().single();
      if (error) throw error;
      return json({ ok: true, session: await withFreshUrls(supabase, data) });
    }

    /* ---------------- approve (trace) ---------------- */
    if (action === "approve") {
      const roughId = body?.roughId;
      const rough = steps.flatMap((s) => s.roughs ?? []).find((r) => r.id === roughId);
      if (!rough) throw new Error("That mark is no longer in this session.");

      const { data: file, error: dlError } = await supabase.storage.from(BUCKET).download(rough.path);
      if (dlError || !file) throw new Error(`Could not read the approved mark: ${dlError?.message ?? "missing file"}`);
      const bytes = new Uint8Array(await file.arrayBuffer());

      const traced = await traceLogo(bytes, tokens, { detail: body?.detail === "faithful" ? "faithful" : "clean" });
      const stored = await uploadSvg(supabase, userId, snapshotId, traced.svg, "vector");

      const { data, error } = await supabase.from("venture_logo_sessions").update({
        status: "approved",
        approved_rough: rough,
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
        session: await withFreshUrls(supabase, data),
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
      const asset = {
        ok: true,
        kind: "vector",
        vectorized: session.traced === true,
        traced: session.traced === true,
        url: mark.url,
        path: mark.path,
        svg_url: mark.url,
        svg_path: mark.path,
        preview_url: mark.url,
        direction_name: approved.title ?? "Logo Studio mark",
        logo_type: session.brief?.mark_type ?? "combination mark",
        symbol_concept: approved.brief ?? "",
        one_line_idea: approved.title ?? "",
        meaning: session.brief?.summary ?? "",
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
      return json({ ok: true, asset, session: await withFreshUrls(supabase, data) });
    }

    /* ---------------- upload own ---------------- */
    if (action === "upload_own") {
      const b64 = String(body?.data ?? "");
      const isSvg = String(body?.mime ?? "").includes("svg");
      if (!b64) throw new Error("No file received.");
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

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
        approved_rough: { id: crypto.randomUUID(), title: "Your uploaded mark", brief: "Uploaded by the founder", path: stored.path, url: stored.url, provider: "upload" },
        vector_svg: svg,
        vector_path: stored.path,
        traced,
        last_error: null,
      }).eq("id", session.id).select().single();
      if (error) throw error;
      return json({ ok: true, traced, vectorUrl: stored.url, session: await withFreshUrls(supabase, data) });
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
