// Public endpoint: a showcase viewer asks for an operational consultation.
// Runs signed-out (share links are public), emails the request to Adam via the
// Resend connector gateway, and never stores anything.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM = Deno.env.get("CONSULT_FROM") ?? "Startup Labs <notifications@3dayplan.com>";
const TO = Deno.env.get("CONSULT_TO") ?? "fastresults@gmail.com";

const BodySchema = z.object({
  token: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(32).optional().default(""),
  message: z.string().trim().max(1000).optional().default(""),
});

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return json({ error: "Please check the form and try again.", fields: parsed.error.flatten().fieldErrors }, 400);
    }
    const { token, name, email, phone, message } = parsed.data;

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!lovableKey || !resendKey) {
      return json({ error: "Email is not configured yet." }, 500);
    }

    // Attach the venture so Adam knows which showcase the request came from.
    let ventureName = "Unknown venture";
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: share } = await supabase
        .from("venture_shares")
        .select("snapshot_id,title,slug,token")
        .or(`slug.eq.${token},token.eq.${token}`)
        .is("revoked_at", null)
        .limit(1)
        .maybeSingle();
      if (share?.snapshot_id) {
        const { data: snap } = await supabase
          .from("venture_snapshots")
          .select("company_name")
          .eq("id", share.snapshot_id)
          .maybeSingle();
        ventureName = snap?.company_name || share.title || ventureName;
      }
    } catch (_e) {
      /* venture lookup is a nicety, not a gate */
    }

    const shareUrl = `https://startuplabs.online/v/${token}`;
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.6">
        <h2 style="margin:0 0 12px">Consultation request</h2>
        <p style="margin:0 0 16px">From the venture showcase for <strong>${esc(ventureName)}</strong>.</p>
        <table cellpadding="0" cellspacing="0" style="font-size:14px">
          <tr><td style="padding:4px 16px 4px 0"><strong>Name</strong></td><td>${esc(name)}</td></tr>
          <tr><td style="padding:4px 16px 4px 0"><strong>Email</strong></td><td>${esc(email)}</td></tr>
          <tr><td style="padding:4px 16px 4px 0"><strong>Phone</strong></td><td>${esc(phone || "—")}</td></tr>
          <tr><td style="padding:4px 16px 4px 0"><strong>Showcase</strong></td><td><a href="${esc(shareUrl)}">${esc(shareUrl)}</a></td></tr>
        </table>
        ${message ? `<p style="margin:16px 0 0"><strong>What they need:</strong><br/>${esc(message)}</p>` : ""}
      </div>`;

    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: `Consultation request — ${ventureName} (${name})`,
        html,
      }),
    });

    if (!res.ok) {
      const details = await res.text();
      console.error(`Resend gateway failed [${res.status}]: ${details}`);
      return json({ error: "We couldn't send that just now.", status: res.status, details }, res.status);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("share-consult-request failed:", e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
