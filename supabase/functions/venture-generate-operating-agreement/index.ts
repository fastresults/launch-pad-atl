// Generates a Georgia LLC Operating Agreement draft from the founder's
// filing info + legal setup progress. Uses the Lovable AI Gateway.

import { createClient } from "npm:@supabase/supabase-js@2";
import { aiFetch } from "../_shared/ai-fetch.ts";
import { jsonResponse, requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireUser(req, corsHeaders);
  if (auth.error) return auth.error;
  const userId = auth.userId!;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const [{ data: filing }, { data: legal }] = await Promise.all([
    admin.from("member_filings").select("*").eq("user_id", userId).maybeSingle(),
    admin
      .from("legal_setup_progress")
      .select("*")
      .eq("user_id", userId)
      .is("snapshot_id", null)
      .maybeSingle(),
  ]);

  const entityName =
    legal?.business_name || filing?.llc_name || "[Your LLC Name], LLC";
  const memberName =
    [filing?.legal_first_name, filing?.legal_last_name].filter(Boolean).join(" ") ||
    "[Member Name]";
  const principalOffice =
    [filing?.address_line1, filing?.city, "GA", filing?.postal_code]
      .filter(Boolean)
      .join(", ") || "[Principal Office Address]";
  const agentName =
    legal?.registered_agent_name || filing?.registered_agent_name || memberName;
  const ein = legal?.ein || "[EIN — insert after IRS approval]";

  const system = [
    "You are a Georgia small-business paralegal drafting a Single-Member LLC Operating Agreement for a founder in the State of Georgia.",
    "Produce a clean, signable Markdown document with numbered Articles (I–XII) and clear headings.",
    "Cite the Georgia Limited Liability Company Act (O.C.G.A. § 14-11) once in the recitals.",
    "Include: Formation, Name and Principal Office, Registered Agent, Purpose, Term, Member and Capital Contributions, Management, Distributions, Tax Treatment (default disregarded entity), Books and Records, Dissolution, Indemnification, Amendments, Governing Law (Georgia), Signature block.",
    "Include an 'Exhibit A — Capital Contributions' table.",
    "Do NOT add footnotes or citations beyond the one O.C.G.A. reference.",
    "Use plain language. Do not include lawyerly boilerplate that a solo founder would not need.",
    "Fill in the founder-provided fields verbatim; leave any missing field in [SQUARE BRACKETS] as a placeholder to complete before signing.",
  ].join(" ");

  const user = `Draft the Operating Agreement using these facts:

- Entity name: ${entityName}
- State of formation: Georgia
- Principal office: ${principalOffice}
- Sole Member: ${memberName}
- Registered Agent: ${agentName}
- EIN: ${ein}
- Effective date: today

Return ONLY the Markdown document. No preamble, no explanation.`;

  const resp = await aiFetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    },
    { timeoutMs: 60_000 },
  );

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    return jsonResponse({ error: `AI gateway ${resp.status}: ${txt.slice(0, 400)}` }, 502, corsHeaders);
  }

  const data = await resp.json();
  const markdown: string = data?.choices?.[0]?.message?.content?.trim() ?? "";
  if (!markdown) return jsonResponse({ error: "Empty response from AI" }, 502, corsHeaders);

  return jsonResponse({ markdown }, 200, corsHeaders);
});
