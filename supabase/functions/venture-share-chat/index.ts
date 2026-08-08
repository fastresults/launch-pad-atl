// Public "ask anything" assistant for a shared venture showcase.
//
// Runs signed-out: the caller proves access with the same share token (and
// optional password) used by venture-share. The venture's own documents are the
// only knowledge source, assembled server-side with the service role so the
// browser never sees private content it wasn't already shown.
//
//   POST /functions/v1/venture-share-chat  { token, password?, messages: [{role, content}] }

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

/** Keep the prompt inside a comfortable context budget. */
const MAX_DOCS = 40;
const CHARS_PER_DOC = 2400;
const MAX_TURNS = 12;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];

    if (!token || token.length < 8 || token.length > 128) return json({ error: "Invalid link" }, 400);

    const messages = rawMessages
      .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string")
      .slice(-MAX_TURNS)
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));
    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return json({ error: "Ask a question to get started." }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: share } = await admin.from("venture_shares").select("*").eq("token", token).maybeSingle();
    if (!share || share.revoked_at) return json({ error: "This link is no longer available." }, 404);
    if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) {
      return json({ error: "This link has expired." }, 410);
    }
    if (share.password_hash) {
      if (!password) return json({ error: "Password required" }, 401);
      if ((await sha256(password)) !== share.password_hash) return json({ error: "Incorrect password" }, 401);
    }
    if (share.chat_enabled === false) return json({ error: "Chat is turned off for this link." }, 403);

    const snapshotId: string = share.snapshot_id;
    const excluded = new Set<string>(share.excluded_keys ?? []);

    const [snapRes, typesRes, docsRes] = await Promise.all([
      admin
        .from("venture_snapshots")
        .select("company_name,concept_summary,value_proposition,city,region,industry,founder_name")
        .eq("id", snapshotId)
        .maybeSingle(),
      admin.from("venture_document_types").select("type,name,sort_order").eq("active", true),
      admin
        .from("venture_documents")
        .select("document_type,content")
        .eq("snapshot_id", snapshotId)
        .eq("status", "complete"),
    ]);

    const snap: any = snapRes.data;
    if (!snap) return json({ error: "This venture is unavailable." }, 404);

    const names = new Map((typesRes.data ?? []).map((t: any) => [t.type, t.name]));
    const order = new Map((typesRes.data ?? []).map((t: any) => [t.type, t.sort_order ?? 999]));

    const context = (docsRes.data ?? [])
      .filter((d: any) => (d.content ?? "").trim() && !excluded.has(`doc:${d.document_type}`))
      .filter((d: any) => d.document_type !== "ai_tool_stack_recommendation")
      .sort((a: any, b: any) => (order.get(a.document_type) ?? 999) - (order.get(b.document_type) ?? 999))
      .slice(0, MAX_DOCS)
      .map(
        (d: any) =>
          `## ${names.get(d.document_type) ?? d.document_type.replace(/_/g, " ")}\n${String(d.content).slice(0, CHARS_PER_DOC)}`,
      )
      .join("\n\n");

    const system = [
      `You are the second brain for the venture "${snap.company_name ?? "this venture"}".`,
      snap.value_proposition ? `Its promise: ${snap.value_proposition}` : "",
      [snap.city, snap.region].filter(Boolean).length
        ? `Based in ${[snap.city, snap.region].filter(Boolean).join(", ")}.`
        : "",
      "",
      "Answer questions about this venture using ONLY the reference material below.",
      "If the answer is not in the material, say so plainly and suggest which section comes closest.",
      "Be concise and concrete: short paragraphs or tight bullets, plain language, no filler preamble.",
      "Never invent numbers, dates, customers, or partnerships.",
      "",
      "# Reference material",
      context || "(no documents available)",
    ].join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "fetch",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("[venture-share-chat] gateway", aiRes.status, txt.slice(0, 300));
      if (aiRes.status === 429) return json({ error: "Too many questions right now — try again shortly." }, 429);
      if (aiRes.status === 402) return json({ error: "The assistant is temporarily unavailable." }, 402);
      return json({ error: "The assistant could not answer that." }, 502);
    }

    const data = await aiRes.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) return json({ error: "The assistant returned an empty answer." }, 502);

    return json({ reply: String(reply) });
  } catch (e) {
    console.error("[venture-share-chat]", e);
    return json({ error: "The assistant is unavailable right now." }, 500);
  }
});
