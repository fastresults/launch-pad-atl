import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Generates the expert pre-workshop audit for one attendee intake.
 *
 * Admin-only. The lane spec (audit name, prescribed outcome, and the ten pains
 * it grades against) is sent by the admin screen so the copy in the repo stays
 * the single source of truth; the intake answers come from the database.
 */

const MODEL = "google/gemini-3.6-flash";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type SpecPain = { id: string; pain: string; fix: string };
type Spec = {
  workshopTitle: string;
  auditName: string;
  promise: string;
  prescribedOutcome: string;
  improvement: string;
  pains: SpecPain[];
};

function buildPrompt(spec: Spec, answers: Record<string, unknown>, files: string[]) {
  const painList = spec.pains
    .map((p, i) => `${i + 1}. [${p.id}] ${p.pain} — the morning's fix: ${p.fix}`)
    .join("\n");

  const answerList = Object.entries(answers)
    .map(([k, v]) => `- ${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join("\n");

  return `You are a senior practitioner writing the "${spec.auditName}" for a founder attending the ${spec.workshopTitle} workshop at Startup Labs in Atlanta.

What this audit reviews: ${spec.promise}

Grade the founder's own submitted material against these ten problems:
${painList}

Their submission:
${answerList}
${files.length ? `Attached files: ${files.join(", ")}` : ""}

Rules:
- Be specific to what they actually submitted. Quote their own words and numbers. Never write generic advice that would fit any business.
- If they left something out, say so plainly and grade it accordingly.
- Grades are A, B, C, D, or F.
- "cost" states in one sentence what leaving this unfixed costs them in money, time, or lost customers — concrete, not abstract.
- "inTheRoom" states what gets built with them during the morning to close that gap.
- Every word must relate to this workshop's subject. No filler, no vague nouns.
- The prescribed outcome must be a single artifact they will hold at the end of the morning, aimed at this result: ${spec.improvement}. Start from: "${spec.prescribedOutcome}" and make it specific to them.
- summary: 3-5 sentences, direct, written to the founder as "you".

Return JSON only, no prose outside it, shaped exactly:
{"overallGrade":"C","summary":"...","prescribedOutcome":"...","items":[{"painId":"...","grade":"C","finding":"...","cost":"...","inTheRoom":"..."}]}
Include one item per pain id above, in the same order.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!apiKey) return json({ error: "Missing LOVABLE_API_KEY" }, 500);

    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const supaUser = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes } = await supaUser.auth.getUser();
    const userId = userRes?.user?.id;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdminRes } = await admin.rpc("is_admin", { _user_id: userId });
    if (!isAdminRes) return json({ error: "Admins only" }, 403);

    const body = await req.json().catch(() => ({}));
    const intakeId: string = body.intakeId;
    const spec: Spec = body.spec;
    if (!intakeId || !spec?.pains?.length || !spec.auditName) {
      return json({ error: "Missing intakeId or spec" }, 400);
    }

    const { data: intake, error: intakeErr } = await admin
      .from("workshop_audit_intakes")
      .select("*")
      .eq("id", intakeId)
      .maybeSingle();
    if (intakeErr || !intake) return json({ error: "Intake not found" }, 404);

    const prompt = buildPrompt(
      spec,
      (intake.answers ?? {}) as Record<string, unknown>,
      (intake.file_urls ?? []) as string[],
    );

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      return json({ error: `Audit generation failed (${res.status})`, detail }, res.status);
    }

    // Streamed so a long generation keeps bytes on the wire; we assemble the
    // whole report here and return it in one piece.
    let text = "";
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const chunk = JSON.parse(payload);
          text += chunk?.choices?.[0]?.delta?.content ?? "";
        } catch {
          // partial frame; ignore
        }
      }
    }

    let report: Record<string, unknown>;
    try {
      report = JSON.parse(text.replace(/^```json\s*/i, "").replace(/```\s*$/, ""));
    } catch {
      return json({ error: "Model returned unparsable audit", raw: text.slice(0, 2000) }, 502);
    }

    const { data: saved, error: saveErr } = await admin
      .from("workshop_audits")
      .insert({
          user_id: intake.user_id,
          intake_id: intake.id,
          workshop_slug: intake.workshop_slug,
          status: "generated",
          report,
          overall_grade: (report.overallGrade as string) ?? null,
          prescribed_outcome: (report.prescribedOutcome as string) ?? spec.prescribedOutcome,
          model: MODEL,
          generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveErr) return json({ error: saveErr.message }, 500);

    return json({ audit: saved });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500);
  }
});
