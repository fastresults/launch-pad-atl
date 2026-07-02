// Parses the '90-Day Content Calendar' markdown deliverable into stable,
// per-post rows in venture_content_calendar_posts. Deterministic IDs are
// derived from (snapshot_id, week, platform, hook) so re-parsing the same
// calendar upserts idempotently.

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

function parseCalendar(md: string): ParsedPost[] {
  const posts: ParsedPost[] = [];
  // Section by "## Week N" / "### Week N" headings; keep everything up to next
  // week heading (Weeks 1–4 drafted, 5–12 outlined use the same header pattern).
  const weekRe = /(^|\n)(#{2,3})\s*Week\s*(\d+)[^\n]*\n([\s\S]*?)(?=\n#{2,3}\s*Week\s*\d+|\n#{1,3}\s*[A-Z][^\n]*\n|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = weekRe.exec(md))) {
    const week = Number(m[3]);
    const body = m[4];
    // Find every markdown table in this week and parse rows.
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
        headers.forEach((h, i) => {
          const key = HEADER_MAP[h];
          if (!key) return;
          const val = cols[i] ?? "";
          if (key === ("hashtags" as any)) {
            post.hashtags = val.split(/[\s,]+/).filter((h) => h.startsWith("#"));
          } else {
            (post as any)[key] = val;
          }
        });
        // Only keep rows that have at least a hook or body — skip separators/notes.
        if (post.hook || post.body) posts.push(post);
      }
    }
  }
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

    // Ownership
    const { data: snap } = await admin
      .from("venture_snapshots")
      .select("id, user_id")
      .eq("id", snapshotId)
      .maybeSingle();
    if (!snap || snap.user_id !== userId) return json({ error: "Forbidden" }, 403);

    if (action === "list") {
      const { data } = await admin
        .from("venture_content_calendar_posts")
        .select("*")
        .eq("snapshot_id", snapshotId)
        .order("week", { ascending: true })
        .order("id", { ascending: true });
      return json({ posts: data ?? [] });
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
        user_id: userId,
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
