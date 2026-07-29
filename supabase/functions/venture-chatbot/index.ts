// Public marketing chatbot. Grounds every answer on a static knowledge corpus
// about Startup Labs. No auth required; no PII persisted.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { aiFetch } from "../_shared/ai-fetch.ts";
import { KNOWLEDGE } from "./knowledge.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM = `You are the Startup Labs Concierge, a friendly, plainspoken assistant on the Startup Labs marketing site. You answer prospective founders' questions about the workshop, pricing, cohorts, tracks, the 34 startup assets, the done-for-you Tracks (Launch, Growth, Operate) and individual agency services on /services, the Brand/Social/Content Studios, the Founder Playbook, refunds, schedule, location, and how to get in touch.

RULES:
- Answer using ONLY the KNOWLEDGE section below. If something isn't covered, say so plainly and offer /contact.
- Never invent pricing, dates, guarantees, outcomes, or funding promises.
- Never give legal, tax, medical, or financial advice — route them to /contact or a qualified pro.
- Refer to what founders leave with as "startup assets," never "deliverables."
- Refer to what they're building as "your startup," never "your business."
- Refer to the workshop structure as a "framework," never a "template."
- Tone: confident, founder-to-founder. No emojis. No fluff. No jargon.
- Keep answers under ~180 words unless the user explicitly asks for depth. Prefer short paragraphs or tight bullets.
- When it makes sense, point users to a route on the site (e.g., /register, /services, /build, /contact, /schedule).
- If the user goes off-topic (weather, sports, other companies), redirect politely to what Startup Labs can help with.

KNOWLEDGE:
${KNOWLEDGE}`;

type Msg = { role: "user" | "assistant"; content: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return json({ error: "Missing LOVABLE_API_KEY" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const raw = Array.isArray(body?.messages) ? body.messages : [];
    const messages: Msg[] = raw
      .filter((m: any) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
      .slice(-20)
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return json({ error: "Missing user message" }, 400);
    }

    const aiRes = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        messages: [{ role: "system", content: SYSTEM }, ...messages],
      }),
    }, { timeoutMs: 45_000 });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return json({ error: `AI gateway: ${aiRes.status}`, detail: txt.slice(0, 500) }, aiRes.status);
    }

    const aiJson = await aiRes.json();
    const answer: string = aiJson?.choices?.[0]?.message?.content ?? "";

    return json({ answer });
  } catch (e: any) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
