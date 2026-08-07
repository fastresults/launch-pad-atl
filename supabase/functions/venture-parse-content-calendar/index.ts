// Parses the '90-Day Content Calendar' markdown deliverable into stable,
// per-post rows in venture_content_calendar_posts. Deterministic IDs are
// derived from (snapshot_id, week, platform, hook) so re-parsing the same
// calendar upserts idempotently.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
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
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

type ParsedPost = {
  week: number;
  day?: string;
  platform?: string;
  pillar?: string;
  format?: string;
  hook?: string;
  body?: string;
  cta?: string;
  hashtags?: string[];
  asset_notes?: string;
  best_time?: string;
};

// Loose column header → field key mapping.
const HEADER_MAP: Record<string, keyof ParsedPost> = {
  "day": "day",
  "platform": "platform",
  "pillar": "pillar",
  "format": "format",
  "hook": "hook",
  "body": "body",
  "full body": "body",
  "post body": "body",
  "cta": "cta",
  "call to action": "cta",
  "hashtags": "hashtags" as any,
  "tags": "hashtags" as any,
  "asset notes": "asset_notes",
  "asset": "asset_notes",
  "visual": "asset_notes",
  "best time": "best_time",
  "best-time": "best_time",
  "time": "best_time",
};

function splitRow(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
}

function assignField(post: ParsedPost, rawKey: string, val: string) {
  const key = HEADER_MAP[rawKey.toLowerCase().replace(/[*_`]/g, "").trim()];
  if (!key) return;
  if (key === ("hashtags" as any)) {
    post.hashtags = val.split(/[\s,]+/).filter((h) => h.startsWith("#"));
  } else {
    (post as any)[key] = val;
  }
}

function parseFieldLines(chunk: string, post: ParsedPost) {
  const lineRe = /[*\-+]\s*\*\*([^:*]+):?\*\*:?\s*([^\n]*)/g;
  let lm: RegExpExecArray | null;
  while ((lm = lineRe.exec(chunk))) {
    assignField(post, lm[1], lm[2].trim());
  }
}

function parseBulletPosts(body: string, week: number, out: ParsedPost[]) {
  // Style A: "**Post 1 ...**" blocks
  const postRe = /\*\*Post\s*\d+[^*]*\*\*([\s\S]*?)(?=\*\*Post\s*\d+[^*]*\*\*|$)/gi;
  let pm: RegExpExecArray | null;
  let found = 0;
  while ((pm = postRe.exec(body))) {
    const post: ParsedPost = { week };
    parseFieldLines(pm[1], post);
    if (post.hook || post.body) { out.push(post); found++; }
  }
  if (found) return;

  // Style B: "*   **Day 1 (Mon):**" blocks with nested "**Field:** value" bullets
  const dayRe = /\*\*(Day[^*]*?)\*\*:?\s*([\s\S]*?)(?=\n\s*[*\-+]\s*\*\*Day[^*]*\*\*|$)/gi;
  let dm: RegExpExecArray | null;
  while ((dm = dayRe.exec(body))) {
    const post: ParsedPost = { week, day: dm[1].replace(/[:*]/g, "").trim() };
    parseFieldLines(dm[2], post);
    if (!post.hook && !post.body) {
      // Outline style: "*   **Day 1 (Mon):** one-line idea."
      const inline = dm[2].split("\n").map((l) => l.trim()).find(Boolean);
      if (inline && !inline.startsWith("*") && !inline.startsWith("#")) post.hook = inline;
    }
    if (post.hook || post.body) out.push(post);
  }

}


function parseCalendar(md: string): ParsedPost[] {
  const posts: ParsedPost[] = [];
  const weekRe = /(^|\n)(#{2,3})\s*Week\s*(\d+)[^\n]*\n([\s\S]*?)(?=\n#{2,3}\s*Week\s*\d+|\n#{1,3}\s*[A-Z][^\n]*\n|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = weekRe.exec(md))) {
    const week = Number(m[3]);
    const body = m[4];
    const before = posts.length;
    const tableRe = /((?:^|\n)\s*\|[^\n]+\|\s*\n\s*\|[\s:\-|]+\|\s*\n(?:\s*\|[^\n]+\|\s*\n?)+)/g;
    let t: RegExpExecArray | null;
    while ((t = tableRe.exec(body))) {
      const lines = t[1].trim().split("\n").filter(Boolean);
      if (lines.length < 3) continue;
      const headers = splitRow(lines[0]).map((h) => h.toLowerCase().replace(/[*_`]/g, "").trim());
      const rows = lines.slice(2);
      for (const rline of rows) {
        const cols = splitRow(rline);
        if (!cols.length || cols.every((c) => !c)) continue;
        const post: ParsedPost = { week };
        headers.forEach((h, i) => assignField(post, h, cols[i] ?? ""));
        if (post.hook || post.body) posts.push(post);
      }
    }
    if (posts.length === before) {
      parseBulletPosts(body, week, posts);
    }
  }
  if (!posts.length) parseBulletPosts(md, 1, posts);
  return posts;
}

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
    const action = body?.action ?? "parse";
    const snapshotId = body?.snapshotId as string | undefined;
    if (!snapshotId) return json({ error: "snapshotId required" }, 400);

    // Ownership (admins may act on any venture, e.g. when impersonating)
    const { data: adminRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin"]);
    const isAdmin = (adminRoles ?? []).length > 0;

    const { data: snap } = await admin
      .from("venture_snapshots")
      .select("id, user_id, company_name, business_concept, value_proposition, differentiation_statement")
      .eq("id", snapshotId)
      .maybeSingle();

    if (!snap || (snap.user_id !== userId && !isAdmin)) return json({ error: "Forbidden" }, 403);
    const ownerId = snap.user_id as string;

    if (action === "list") {
      const { data } = await admin
        .from("venture_content_calendar_posts")
        .select("*")
        .eq("snapshot_id", snapshotId)
        .order("week", { ascending: true })
        .order("id", { ascending: true });
      return json({ posts: data ?? [] });
    }

    if (action === "plan-next-week") {
      const week = Number(body?.week);
      if (!Number.isFinite(week) || week < 1) return json({ error: "week (>=1) required" }, 400);

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
- Hook: 120–170 characters, ONE complete sentence (or two tight clauses). Written to fill 4 lines on a 1:1 ad — do NOT end mid-clause, do NOT dangle on a conjunction ('and', 'or', 'but', 'because', 'with', 'that'). Finish the thought with punctuation.
- Body <= 400 chars, cta <= 80 chars.
- 3-6 relevant hashtags, no leading '#' duplication.
- Days: Mon/Wed/Fri unless prior calendar suggests otherwise.
No prose outside the JSON.`;
      const userMsg = `Startup: ${snap.company_name ?? "(unnamed)"}
Concept: ${snap.business_concept ?? ""}
Value prop: ${snap.value_proposition ?? ""}
Differentiator: ${snap.differentiation_statement ?? ""}

Existing calendar so far:
${existingSummary || "(none)"}

Draft 3 posts for Week ${week}.`;


      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      if (!lovableKey) return json({ error: "AI gateway not configured" }, 500);

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${lovableKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: sys }, { role: "user", content: userMsg }],
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
      let parsedAi: { posts?: any[] };
      try { parsedAi = JSON.parse(content); } catch { parsedAi = {}; }
      const drafts = Array.isArray(parsedAi.posts) ? parsedAi.posts : [];
      if (!drafts.length) return json({ error: "AI returned no posts. Try again." }, 500);

      const newRows = [] as any[];
      for (const p of drafts) {
        const platform = String(p.platform ?? "").trim() || "Instagram";
        const hook = String(p.hook ?? "").trim();
        if (!hook) continue;
        const seed = `${snapshotId}|${week}|${platform.toLowerCase()}|${hook.slice(0, 200)}`;
        const hash = (await sha1Hex(seed)).slice(0, 16);
        newRows.push({
          id: `cc_ai_${hash}`,
          snapshot_id: snapshotId,
          user_id: ownerId,
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
      if (!newRows.length) return json({ error: "AI output missing hooks. Try again." }, 500);

      const { error: upErr } = await admin
        .from("venture_content_calendar_posts")
        .upsert(newRows, { onConflict: "id" });
      if (upErr) throw upErr;

      const { data: fresh } = await admin
        .from("venture_content_calendar_posts")
        .select("*")
        .eq("snapshot_id", snapshotId)
        .eq("week", week)
        .order("id", { ascending: true });

      return json({ count: newRows.length, posts: fresh ?? [] });
    }

    if (action !== "parse") return json({ error: `Unknown action: ${action}` }, 400);


    // Locate the calendar deliverable
    const { data: doc } = await admin
      .from("venture_documents")
      .select("id, content")
      .eq("snapshot_id", snapshotId)
      .eq("document_type", "content_calendar_90day")
      .eq("status", "complete")
      .maybeSingle();
    if (!doc?.content) {
      return json({ error: "90-Day Content Calendar not generated yet.", code: "CALENDAR_MISSING" }, 400);
    }

    const parsed = parseCalendar(doc.content);
    if (!parsed.length) {
      return json({ error: "Could not find any post rows in the calendar. Regenerate the calendar deliverable.", code: "CALENDAR_EMPTY" }, 400);
    }

    // Deterministic id per row so re-parses upsert cleanly.
    const rows = [] as any[];
    for (const p of parsed) {
      const seed = `${snapshotId}|${p.week}|${(p.platform || "").toLowerCase()}|${(p.hook || p.body || "").slice(0, 200)}`;
      const hash = (await sha1Hex(seed)).slice(0, 16);
      rows.push({
        id: `cc_${hash}`,
        snapshot_id: snapshotId,
        user_id: ownerId,
        week: p.week,
        day: p.day ?? null,
        platform: p.platform ?? null,
        pillar: p.pillar ?? null,
        format: p.format ?? null,
        hook: p.hook ?? null,
        body: p.body ?? null,
        cta: p.cta ?? null,
        hashtags: p.hashtags ?? [],
        asset_notes: p.asset_notes ?? null,
        best_time: p.best_time ?? null,
        source_doc_id: doc.id,
        parsed_at: new Date().toISOString(),
      });
    }

    // Upsert
    const { error: upErr } = await admin
      .from("venture_content_calendar_posts")
      .upsert(rows, { onConflict: "id" });
    if (upErr) throw upErr;

    return json({ count: rows.length });
  } catch (e) {
    console.error("venture-parse-content-calendar error", e);
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});
