// Executive summary generator.
//
// Reads every completed asset for a venture and writes a ~300-word executive
// summary that explains the venture, why the asset set matters, and how to use
// it. Cached on venture_snapshots.executive_summary so the public showcase and
// the second brain can serve it instantly.
//
//   POST { snapshotId, force? }   owner / admin JWT, or the service role key.

import { createClient } from "npm:@supabase/supabase-js@2";
import { aiFetch } from "../_shared/ai-fetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-impersonate-user, x-internal-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MAX_DOCS = 40;
const CHARS_PER_DOC = 900;
const FRESH_MS = 24 * 60 * 60 * 1000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const internal = req.headers.get("x-internal-key") === SERVICE_KEY || token === SERVICE_KEY;

    const body = await req.json().catch(() => ({}));
    const snapshotId: string | undefined = body?.snapshotId;
    const force = body?.force === true;
    if (!snapshotId) return json({ error: "snapshotId required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: snap } = await admin
      .from("venture_snapshots")
      .select(
        "id,user_id,company_name,industry,city,region,value_proposition,concept_summary,business_concept,executive_summary,executive_summary_at",
      )
      .eq("id", snapshotId)
      .maybeSingle();
    if (!snap) return json({ error: "Venture not found" }, 404);

    if (!internal) {
      if (!token) return json({ error: "Missing auth" }, 401);
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: auth } },
      });
      const { data: userRes } = await userClient.auth.getUser();
      const userId = userRes?.user?.id ?? null;
      if (!userId) return json({ error: "Not signed in" }, 401);
      if (snap.user_id !== userId) {
        const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userId);
        const isAdmin = (roles ?? []).some((r: any) => r.role === "admin" || r.role === "super_admin");
        if (!isAdmin) return json({ error: "Forbidden" }, 403);
      }
    }

    const fresh =
      !!snap.executive_summary &&
      !!snap.executive_summary_at &&
      Date.now() - new Date(snap.executive_summary_at).getTime() < FRESH_MS;
    if (fresh && !force) return json({ ok: true, cached: true, summary: snap.executive_summary });

    const [docsRes, typesRes] = await Promise.all([
      admin
        .from("venture_documents")
        .select("document_type,content")
        .eq("snapshot_id", snapshotId)
        .eq("status", "complete"),
      admin.from("venture_document_types").select("type,name,category,sort_order").eq("active", true),
    ]);

    const meta = new Map((typesRes.data ?? []).map((t: any) => [t.type, t]));
    const docs = (docsRes.data ?? [])
      .filter((d: any) => (d.content ?? "").trim() && d.document_type !== "ai_tool_stack_recommendation")
      .sort(
        (a: any, b: any) =>
          (meta.get(a.document_type)?.sort_order ?? 999) - (meta.get(b.document_type)?.sort_order ?? 999),
      );

    if (!docs.length) return json({ error: "No completed assets to summarize yet." }, 400);

    const inventory = docs
      .map((d: any) => `- ${meta.get(d.document_type)?.name ?? d.document_type.replace(/_/g, " ")}`)
      .join("\n");

    const excerpts = docs
      .slice(0, MAX_DOCS)
      .map(
        (d: any) =>
          `## ${meta.get(d.document_type)?.name ?? d.document_type.replace(/_/g, " ")}\n${String(d.content).slice(0, CHARS_PER_DOC)}`,
      )
      .join("\n\n");

    const system = [
      "You are an award-winning strategist writing the executive summary that opens a founder's venture showcase.",
      "Write for an outsider — an investor, partner, or first hire — who has 60 seconds.",
      "",
      "Rules:",
      "- Exactly three short paragraphs, 280-320 words total.",
      "- Paragraph 1: what the startup is, who it serves, and the promise, in concrete language.",
      "- Paragraph 2: what has already been built — name the real artifacts from the asset list and why that set de-risks the launch.",
      "- Paragraph 3: how to use these assets in the next 14 days to reach a first paying customer.",
      "- Plain prose. No headings, no bullets, no markdown, no hype adjectives, no invented numbers, dates, customers or partners.",
      "- Never call this a plan, blueprint, playbook or roadmap. It is a built startup.",
    ].join("\n");

    const user = [
      `Startup: ${snap.company_name ?? "Untitled venture"}`,
      snap.industry ? `Industry: ${snap.industry}` : "",
      [snap.city, snap.region].filter(Boolean).length
        ? `Location: ${[snap.city, snap.region].filter(Boolean).join(", ")}`
        : "",
      snap.value_proposition ? `Promise: ${snap.value_proposition}` : "",
      snap.concept_summary || snap.business_concept
        ? `Concept: ${snap.concept_summary || snap.business_concept}`
        : "",
      "",
      `# Asset inventory (${docs.length} built assets)`,
      inventory,
      "",
      "# Asset excerpts",
      excerpts,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await aiFetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Lovable-API-Key": LOVABLE_API_KEY,
          "X-Lovable-AIG-SDK": "fetch",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.6-flash",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      },
      { timeoutMs: 120_000 },
    );

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("[venture-exec-summary] gateway", res.status, txt.slice(0, 300));
      if (res.status === 429) return json({ error: "Rate limited — try again shortly." }, 429);
      if (res.status === 402) return json({ error: "AI credits exhausted." }, 402);
      return json({ error: "Could not write the executive summary." }, 502);
    }

    const data = await res.json();
    const summary = String(data?.choices?.[0]?.message?.content ?? "").trim();
    if (!summary) return json({ error: "The summary came back empty." }, 502);

    const { error: upErr } = await admin
      .from("venture_snapshots")
      .update({ executive_summary: summary, executive_summary_at: new Date().toISOString() })
      .eq("id", snapshotId);
    if (upErr) {
      console.error("[venture-exec-summary] save failed", upErr.message);
      return json({ error: "Could not save the summary." }, 500);
    }

    return json({ ok: true, cached: false, summary, assetCount: docs.length });
  } catch (e) {
    console.error("[venture-exec-summary]", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
