// Generates the next week of content-calendar posts using the AI gateway,
// appending rows to venture_content_calendar_posts. Called when the user
// wants to extend the plan beyond what the initial calendar produced.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha1Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-1", bytes);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

type DraftPost = {
  platform: string;
  pillar: string;
  format?: string;
  hook: string;
  body?: string;
  cta?: string;
  hashtags?: string[];
  asset_notes?: string;
  best_time?: string;
  day?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const client = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await client.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = (await req.json().catch(() => ({}))) as any;
    const snapshotId = body?.snapshotId as string | undefined;
    const week = Number(body?.week);
    if (!snapshotId) return json({ error: "snapshotId required" }, 400);
    if (!Number.isFinite(week) || week < 1) return json({ error: "week (>=1) required" }, 400);

    // Ownership
    const { data: snap } = await admin
      .from("venture_snapshots")
      .select("id, user_id, business_name, one_line_pitch, target_market, tone, brand_voice")
      .eq("id", snapshotId)
      .maybeSingle();
    if (!snap || snap.user_id !== userId) return json({ error: "Forbidden" }, 403);

    // Existing calendar rows (for tone/pillar/platform continuity)
    const { data: existing } = await admin
      .from("venture_content_calendar_posts")
      .select("week, platform, pillar, hook, cta")
      .eq("snapshot_id", snapshotId)
      .order("week", { ascending: true })
      .limit(50);

    const existingSummary = (existing ?? []).slice(0, 20).map((p) =>
      `- W${p.week} · ${p.platform ?? "?"} · ${p.pillar ?? "?"} · ${p.hook ?? ""}`
    ).join("\n");

    const platforms = Array.from(new Set((existing ?? []).map((p) => p.platform).filter(Boolean)));
    const platformMix = platforms.length ? platforms.join(", ") : "Instagram, Facebook, LinkedIn";

    const sys = `You draft social-media posts for a small startup's ongoing content calendar.
Return STRICT JSON: { "posts": [ { "platform": string, "pillar": string, "format": string, "hook": string, "body": string, "cta": string, "hashtags": string[], "asset_notes": string, "best_time": string, "day": string } ] }
Rules:
- Produce exactly 3 posts for Week ${week}.
- Distribute across these platforms (one each if possible): ${platformMix}.
- Vary pillars from prior weeks; keep tone consistent.
- Hook <= 120 chars, body <= 400 chars, cta <= 80 chars.
- 3-6 relevant hashtags, no leading '#' duplication.
- Days: Mon/Wed/Fri unless prior calendar suggests otherwise.
No prose outside the JSON.`;

    const user = `Startup: ${snap.business_name ?? "(unnamed)"}
Pitch: ${snap.one_line_pitch ?? ""}
Audience: ${snap.target_market ?? ""}
Voice: ${snap.brand_voice ?? snap.tone ?? "friendly, direct"}

Existing calendar so far:
${existingSummary || "(none)"}

Draft 3 posts for Week ${week}.`;

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return json({ error: "AI gateway not configured" }, 500);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) return json({ error: "Rate limited by AI gateway. Try again in a moment." }, 429);
    if (aiRes.status === 402) return json({ error: "AI credits exhausted. Add credits in Settings." }, 402);
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("plan-next-week AI error", aiRes.status, txt);
      return json({ error: `AI gateway error (${aiRes.status})` }, 500);
    }

    const aiData = await aiRes.json();
    const content = aiData?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { posts?: DraftPost[] };
    try { parsed = JSON.parse(content); } catch { parsed = {}; }
    const drafts = Array.isArray(parsed.posts) ? parsed.posts : [];
    if (!drafts.length) return json({ error: "AI returned no posts. Try again." }, 500);

    const rows = [] as any[];
    for (const p of drafts) {
      const platform = String(p.platform ?? "").trim() || "Instagram";
      const hook = String(p.hook ?? "").trim();
      if (!hook) continue;
      const seed = `${snapshotId}|${week}|${platform.toLowerCase()}|${hook.slice(0, 200)}`;
      const hash = (await sha1Hex(seed)).slice(0, 16);
      rows.push({
        id: `cc_ai_${hash}`,
        snapshot_id: snapshotId,
        user_id: userId,
        week,
        day: p.day ?? null,
        platform,
        pillar: p.pillar ?? null,
        format: p.format ?? null,
        hook,
        body: p.body ?? null,
        cta: p.cta ?? null,
        hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
        asset_notes: p.asset_notes ?? null,
        best_time: p.best_time ?? null,
        parsed_at: new Date().toISOString(),
      });
    }
    if (!rows.length) return json({ error: "AI output missing hooks. Try again." }, 500);

    const { error: upErr } = await admin
      .from("venture_content_calendar_posts")
      .upsert(rows, { onConflict: "id" });
    if (upErr) throw upErr;

    // Return the freshly-added rows in caller-friendly shape.
    const { data: fresh } = await admin
      .from("venture_content_calendar_posts")
      .select("*")
      .eq("snapshot_id", snapshotId)
      .eq("week", week)
      .order("id", { ascending: true });

    return json({ count: rows.length, posts: fresh ?? [] });
  } catch (e) {
    console.error("venture-plan-next-week error", e);
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});
