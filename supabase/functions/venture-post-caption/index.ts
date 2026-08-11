// Venture Post Caption — AI "shorten to fit" pass for a channel caption.
//
// Caption assembly itself is deterministic and happens client-side (see
// src/lib/caption-specs.ts) — no model call needed. This endpoint only runs
// when a caption busts a channel's hard limit (or the founder asks for a
// tighter version), and persists the result on the post row so the same
// shortened text comes back next time.

import { createClient } from "npm:@supabase/supabase-js@2";
import { aiFetch } from "../_shared/ai-fetch.ts";
import { requireUser, requireSnapshotOwner } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AI_CHAT = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "openai/gpt-5.6-sol";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function tidy(s: unknown): string {
  return String(s ?? "").replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
}

function hardTrim(text: string, cap: number): string {
  const t = tidy(text);
  if (t.length <= cap) return t;
  const hard = t.slice(0, cap);
  const sentence = Math.max(hard.lastIndexOf(". "), hard.lastIndexOf("! "), hard.lastIndexOf("? "));
  if (sentence > cap * 0.5) return hard.slice(0, sentence + 1).trim();
  const word = hard.lastIndexOf(" ");
  return (word > cap * 0.5 ? hard.slice(0, word) : hard).replace(/[\s,;:\-–—]+$/g, "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const snapshotId = tidy(body?.snapshotId);
    const postId = tidy(body?.postId);
    const platform = tidy(body?.platform) || "instagram";
    const caption = tidy(body?.caption);
    const limit = Number(body?.limit);
    const target = Number(body?.target) || Math.min(limit, 400);
    const hashtags: string[] = Array.isArray(body?.hashtags) ? body.hashtags.slice(0, 6) : [];

    if (!snapshotId) return json({ error: "snapshotId required" }, 400);
    if (!caption) return json({ error: "caption required" }, 400);
    if (!Number.isFinite(limit) || limit < 40 || limit > 100_000) {
      return json({ error: "limit must be a channel character limit" }, 400);
    }

    const auth = await requireUser(req, corsHeaders);
    if (auth.error) return auth.error;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const owner = await requireSnapshotOwner(admin, snapshotId, auth.userId!, corsHeaders);
    if (owner.error) return owner.error;

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "AI is not configured on this project." }, 500);

    const goal = Math.min(limit, Math.max(120, target));
    const sys =
      "You are a direct-response social copywriter. You tighten captions for a specific channel " +
      "without losing the promise or the call to action. You never add hype, emojis the source " +
      "did not use, or claims that were not there.";
    const user = [
      `Channel: ${platform}. Hard limit: ${limit} characters. Aim for about ${goal}.`,
      hashtags.length ? `Keep these hashtags at the end: ${hashtags.join(" ")}` : "Do not add hashtags.",
      "Rules:",
      "- Keep the opening line as the hook; it must still work if the rest is cut off.",
      "- Keep the call to action verbatim in meaning (the ask must survive).",
      "- Keep line breaks between blocks. Plain text only, no markdown.",
      "- Return ONLY the rewritten caption, nothing else.",
      "",
      "Caption to tighten:",
      caption,
    ].join("\n");

    const res = await aiFetch(
      AI_CHAT,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: user },
          ],
        }),
      },
      { timeoutMs: 45_000, retries: 1 },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`caption shorten gateway failed [${res.status}]: ${text}`);
      if (res.status === 429) return json({ error: "AI is rate limited right now — try again in a moment." }, 429);
      if (res.status === 402) return json({ error: "Generation is paused — our team has been notified." }, 402);
      return json({ error: "Could not shorten the caption.", details: text }, res.status);
    }

    const data = await res.json();
    const raw = tidy(data?.choices?.[0]?.message?.content);
    if (!raw) return json({ error: "The copywriter returned nothing — try again." }, 502);

    const shortened = hardTrim(raw.replace(/^["'`]+|["'`]+$/g, ""), limit);

    // Persist so the founder gets the same text on reopen.
    if (postId) {
      const { data: row } = await admin
        .from("venture_content_calendar_posts")
        .select("caption_variants")
        .eq("id", postId)
        .eq("snapshot_id", snapshotId)
        .maybeSingle();
      const variants = (row?.caption_variants ?? {}) as Record<string, unknown>;
      variants[platform] = { caption: shortened, chars: shortened.length, updated_at: new Date().toISOString() };
      await admin
        .from("venture_content_calendar_posts")
        .update({ caption_variants: variants })
        .eq("id", postId)
        .eq("snapshot_id", snapshotId);
    }

    return json({ caption: shortened, chars: shortened.length, limit });
  } catch (e) {
    console.error("venture-post-caption failed", e);
    return json({ error: (e as Error)?.message ?? "Unexpected error" }, 500);
  }
});
