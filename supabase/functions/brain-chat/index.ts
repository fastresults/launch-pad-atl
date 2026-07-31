// Founder Second Brain chat. RAG over founder_brain_memory + last 12 messages of
// the persistent transcript. Persists user + assistant turns. Returns JSON with
// answer and citations. Voice / TTS is handled by the existing venture-speak.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { aiFetch } from "../_shared/ai-fetch.ts";
import { embedText, toVectorLiteral } from "../_shared/brain-embed.ts";
import { resolveOwner } from "../_shared/impersonation.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SYSTEM = `You are the founder's Second Brain — a plainspoken, senior operator who knows every corner of their startup.

RULES:
- Ground every answer in the MEMORY block (their brief, deliverables, assessments, notes). Cite sources inline as [1], [2], … matching the numbered memory items you actually used.
- When memory is silent on something, say so plainly and suggest a next step (e.g., "run the deep assessment on GTM," "add a founder note about it").
- Refer to what they've built as "startup assets," never "deliverables." Refer to the workshop structure as a "framework," never a "template."
- Prefer short paragraphs and tight bullets. No emojis. No fluff.
- If the founder asks you to remember something, tell them you've saved it as a note (the client will persist it separately).
- Suggested actions the UI can trigger: rerun a startup asset, run a deep assessment, generate a hero image, open a specific asset. Name them naturally when relevant.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return json({ error: "Missing auth" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: ures } = await userClient.auth.getUser();
    let userId = ures?.user?.id;
    if (!userId) return json({ error: "Not signed in" }, 401);

    // Impersonation: an admin may act on a member's behalf (validated server-side).
    const actorId = userId;
    const _own = await resolveOwner(req, actorId, userClient, corsHeaders);
    if (_own.error) return _own.error;
    userId = _own.userId;

    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message.trim().slice(0, 4000) : "";
    const snapshotId: string | null = typeof body?.snapshotId === "string" && body.snapshotId ? body.snapshotId : null;
    if (!message) return json({ error: "Missing message" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    if (snapshotId) {
      const { data: snap } = await admin
        .from("venture_snapshots")
        .select("id, user_id")
        .eq("id", snapshotId)
        .maybeSingle();
      if (!snap || snap.user_id !== userId) return json({ error: "Venture not found" }, 404);
    }

    // Persist the user turn first, scoped to the current venture.
    await admin.from("founder_brain_messages").insert({ user_id: userId, snapshot_id: snapshotId, role: "user", content: message });

    // Retrieve top-k memory scoped to this venture (plus legacy unassigned rows).
    let citations: Array<{ n: number; kind: string; source_ref: string | null; title: string }> = [];
    let memoryBlock = "(no memory yet — the founder should click 'Rebuild memory')";
    try {
      const qEmb = await embedText(message);
      const { data: matches } = await admin.rpc("match_founder_brain_memory", {
        _user_id: userId,
        query_embedding: toVectorLiteral(qEmb),
        match_count: 8,
        _snapshot_id: snapshotId,
      });
      const rows = Array.isArray(matches) ? matches : [];
      if (rows.length) {
        citations = rows.map((r: any, i: number) => ({
          n: i + 1,
          kind: r.kind,
          source_ref: r.source_ref,
          title: r.title ?? r.kind,
        }));
        memoryBlock = rows
          .map((r: any, i: number) => `[${i + 1}] (${r.kind}${r.source_ref ? ` · ${r.source_ref}` : ""}) ${r.title ?? ""}\n${(r.content ?? "").slice(0, 1200)}`)
          .join("\n\n---\n\n");
      }
    } catch (e) {
      console.warn("retrieval failed", e);
    }

    // Recent transcript (last 12) for THIS venture only.
    const historyQuery = admin
      .from("founder_brain_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12);
    if (snapshotId) historyQuery.eq("snapshot_id", snapshotId);
    else historyQuery.is("snapshot_id", null);
    const { data: history } = await historyQuery;
    const recent = (history ?? []).reverse().slice(0, -1); // drop the just-inserted user turn

    const messages = [
      { role: "system", content: `${SYSTEM}\n\nMEMORY:\n${memoryBlock}` },
      ...recent.map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const aiRes = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    }, { timeoutMs: 60_000 });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return json({ error: `AI gateway ${aiRes.status}`, detail: txt.slice(0, 400) }, aiRes.status);
    }
    const aiJson = await aiRes.json();
    const answer: string = aiJson?.choices?.[0]?.message?.content ?? "";

    await admin.from("founder_brain_messages").insert({
      user_id: userId,
      snapshot_id: snapshotId,
      role: "assistant",
      content: answer,
      citations,
    });

    return json({ answer, citations });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
