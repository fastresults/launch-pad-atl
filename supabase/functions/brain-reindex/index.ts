// Rebuild the founder's brain memory from their existing startup assets.
// Called on-demand by the client and safe to re-run — it deletes and rewrites
// the calling user's rows.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chunkText, embedText } from "../_shared/brain-embed.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return json({ error: "Missing auth" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: ures } = await userClient.auth.getUser();
    const userId = ures?.user?.id;
    if (!userId) return json({ error: "Not signed in" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Collect everything about this founder.
    const [{ data: brief }, { data: founder }, { data: market }, { data: goals }, { data: delivs }, { data: notes }] = await Promise.all([
      admin.from("attendee_business_brief").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("attendee_founder_profile").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("attendee_market_profile").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("attendee_goals").select("*").eq("user_id", userId),
      admin.from("attendee_deliverables").select("deliverable_key, content_current, deep_assessment, deep_assessment_quality_score").eq("user_id", userId),
      admin.from("founder_brain_notes").select("id, content, tags, created_at").eq("user_id", userId),
    ]);

    // Rebuild only the auto-derived rows; keep user notes' embeddings.
    await admin
      .from("founder_brain_memory")
      .delete()
      .eq("user_id", userId)
      .in("kind", ["brief", "deliverable", "assessment", "goal", "note"]);

    type Row = { kind: string; source_ref: string | null; title: string; content: string };
    const rows: Row[] = [];

    if (brief) {
      rows.push({
        kind: "brief",
        source_ref: "brief",
        title: "Startup brief",
        content: JSON.stringify({ brief, founder, market }, null, 2),
      });
    }
    for (const g of goals ?? []) {
      rows.push({
        kind: "goal",
        source_ref: g.id,
        title: g.title ?? "Goal",
        content: `${g.title ?? ""}\n\n${g.detail ?? ""}\n\nStatus: ${g.status ?? "n/a"}`,
      });
    }
    for (const d of delivs ?? []) {
      const c = (d as any).content_current;
      if (c && (c.title || c.summary || (c.sections ?? []).length)) {
        const md = [
          c.title ? `# ${c.title}` : "",
          c.summary ?? "",
          ...(c.sections ?? []).map((s: any) => `## ${s.heading}\n${s.body_markdown ?? ""}`),
          (c.action_items ?? []).length ? `## Action items\n${(c.action_items ?? []).map((a: string) => `- ${a}`).join("\n")}` : "",
        ].filter(Boolean).join("\n\n");
        rows.push({ kind: "deliverable", source_ref: d.deliverable_key, title: c.title ?? d.deliverable_key, content: md });
      }
      if ((d as any).deep_assessment) {
        rows.push({
          kind: "assessment",
          source_ref: d.deliverable_key,
          title: `Assessment — ${d.deliverable_key}`,
          content: (d as any).deep_assessment,
        });
      }
    }
    for (const n of notes ?? []) {
      rows.push({
        kind: "note",
        source_ref: n.id,
        title: "Founder note",
        content: n.content,
      });
    }

    let inserted = 0;
    for (const r of rows) {
      const chunks = chunkText(r.content);
      for (let i = 0; i < chunks.length; i++) {
        try {
          const embedding = await embedText(`${r.title}\n\n${chunks[i]}`);
          await admin.from("founder_brain_memory").insert({
            user_id: userId,
            kind: r.kind,
            source_ref: r.source_ref,
            title: r.title,
            content: chunks[i],
            embedding: embedding as unknown as string,
            metadata: { chunk_index: i, chunk_total: chunks.length },
          });
          inserted++;
        } catch (e) {
          console.error("embed/insert failed", r.kind, r.source_ref, e);
        }
      }
    }

    return json({ ok: true, sources: rows.length, chunks: inserted });
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
