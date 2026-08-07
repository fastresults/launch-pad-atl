// Generates a state-specific LLC Operating Agreement draft from the founder's
// filing info + legal setup progress. Uses the Lovable AI Gateway.

const STATE_STATUTES: Record<string, { name: string; citation: string }> = {
  AL: { name: "Alabama", citation: "Ala. Code § 10A-5A" },
  AK: { name: "Alaska", citation: "Alaska Stat. § 10.50" },
  AZ: { name: "Arizona", citation: "A.R.S. Title 29, Ch. 7" },
  AR: { name: "Arkansas", citation: "Ark. Code § 4-38" },
  CA: { name: "California", citation: "Cal. Corp. Code § 17701" },
  CO: { name: "Colorado", citation: "C.R.S. Title 7, Art. 80" },
  CT: { name: "Connecticut", citation: "Conn. Gen. Stat. § 34-243" },
  DE: { name: "Delaware", citation: "6 Del. C. § 18" },
  DC: { name: "District of Columbia", citation: "D.C. Code § 29–801" },
  FL: { name: "Florida", citation: "Fla. Stat. Ch. 605" },
  GA: { name: "Georgia", citation: "O.C.G.A. § 14-11" },
  HI: { name: "Hawaii", citation: "HRS Ch. 428" },
  ID: { name: "Idaho", citation: "Idaho Code § 30-25" },
  IL: { name: "Illinois", citation: "805 ILCS 180" },
  IN: { name: "Indiana", citation: "Ind. Code § 23-18" },
  IA: { name: "Iowa", citation: "Iowa Code Ch. 489" },
  KS: { name: "Kansas", citation: "K.S.A. Ch. 17, Art. 76" },
  KY: { name: "Kentucky", citation: "KRS Ch. 275" },
  LA: { name: "Louisiana", citation: "La. R.S. § 12:1301" },
  ME: { name: "Maine", citation: "31 M.R.S. Ch. 21" },
  MD: { name: "Maryland", citation: "Md. Code, Corps. & Ass'ns § 4A" },
  MA: { name: "Massachusetts", citation: "Mass. Gen. Laws Ch. 156C" },
  MI: { name: "Michigan", citation: "MCL Ch. 450 (Act 23 of 1993)" },
  MN: { name: "Minnesota", citation: "Minn. Stat. Ch. 322C" },
  MS: { name: "Mississippi", citation: "Miss. Code § 79-29" },
  MO: { name: "Missouri", citation: "Mo. Rev. Stat. Ch. 347" },
  MT: { name: "Montana", citation: "Mont. Code § 35-8" },
  NE: { name: "Nebraska", citation: "Neb. Rev. Stat. § 21-101" },
  NV: { name: "Nevada", citation: "NRS Ch. 86" },
  NH: { name: "New Hampshire", citation: "NH RSA 304-C" },
  NJ: { name: "New Jersey", citation: "N.J.S.A. § 42:2C" },
  NM: { name: "New Mexico", citation: "NMSA § 53-19" },
  NY: { name: "New York", citation: "NY LLC Law § 101" },
  NC: { name: "North Carolina", citation: "N.C.G.S. Ch. 57D" },
  ND: { name: "North Dakota", citation: "N.D.C.C. Ch. 10-32.1" },
  OH: { name: "Ohio", citation: "Ohio Rev. Code Ch. 1706" },
  OK: { name: "Oklahoma", citation: "18 O.S. § 2000" },
  OR: { name: "Oregon", citation: "ORS Ch. 63" },
  PA: { name: "Pennsylvania", citation: "15 Pa.C.S. Ch. 88" },
  RI: { name: "Rhode Island", citation: "R.I. Gen. Laws Ch. 7-16" },
  SC: { name: "South Carolina", citation: "S.C. Code § 33-44" },
  SD: { name: "South Dakota", citation: "S.D.C.L. Ch. 47-34A" },
  TN: { name: "Tennessee", citation: "T.C.A. § 48-249" },
  TX: { name: "Texas", citation: "Tex. Bus. Orgs. Code Ch. 101" },
  UT: { name: "Utah", citation: "Utah Code § 48-3a" },
  VT: { name: "Vermont", citation: "11 V.S.A. Ch. 25" },
  VA: { name: "Virginia", citation: "Va. Code § 13.1-1000" },
  WA: { name: "Washington", citation: "RCW 25.15" },
  WV: { name: "West Virginia", citation: "W. Va. Code § 31B" },
  WI: { name: "Wisconsin", citation: "Wis. Stat. Ch. 183" },
  WY: { name: "Wyoming", citation: "Wyo. Stat. § 17-29" },
};

import { createClient } from "npm:@supabase/supabase-js@2";
import { aiFetch } from "../_shared/ai-fetch.ts";
import { jsonResponse, requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-impersonate-user",
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

  const [{ data: filing }, { data: legal }, { data: snapshot }] = await Promise.all([
    admin.from("member_filings").select("*").eq("user_id", userId).maybeSingle(),
    admin
      .from("legal_setup_progress")
      .select("*")
      .eq("user_id", userId)
      .is("snapshot_id", null)
      .maybeSingle(),
    admin
      .from("venture_snapshots")
      .select("city,region,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const entityName =
    legal?.business_name || filing?.llc_name || "[Your LLC Name], LLC";
  const memberName =
    [filing?.legal_first_name, filing?.legal_last_name].filter(Boolean).join(" ") ||
    "[Member Name]";
  // GLOBAL RULE: the venture brief decides the formation state unless the founder overrode it.
  const stateCode: string = resolveEntityState({
    savedState: legal?.entity_state,
    savedSource: legal?.entity_state_source,
    briefRegion: snapshot?.region,
    briefCity: snapshot?.city,
    filingState: filing?.state,
  }).code;
  const stateInfo = STATE_STATUTES[stateCode] ?? STATE_STATUTES.GA;
  const principalOffice =
    [filing?.address_line1, filing?.city, stateCode, filing?.postal_code]
      .filter(Boolean)
      .join(", ") || "[Principal Office Address]";
  const agentName =
    legal?.registered_agent_name || filing?.registered_agent_name || memberName;
  const ein = legal?.ein || "[EIN — insert after IRS approval]";

  const system = [
    `You are a ${stateInfo.name} small-business paralegal drafting a Single-Member LLC Operating Agreement for a founder in the State of ${stateInfo.name}.`,
    "Produce a clean, signable Markdown document with numbered Articles (I–XII) and clear headings.",
    `Cite the ${stateInfo.name} Limited Liability Company Act (${stateInfo.citation}) once in the recitals.`,
    "Include: Formation, Name and Principal Office, Registered Agent, Purpose, Term, Member and Capital Contributions, Management, Distributions, Tax Treatment (default disregarded entity), Books and Records, Dissolution, Indemnification, Amendments, Governing Law, Signature block.",
    `The Governing Law article MUST specify the State of ${stateInfo.name}.`,
    "Include an 'Exhibit A — Capital Contributions' table.",
    "Do NOT add footnotes or citations beyond the one statute reference.",
    "Use plain language. Do not include lawyerly boilerplate that a solo founder would not need.",
    "Fill in the founder-provided fields verbatim; leave any missing field in [SQUARE BRACKETS] as a placeholder to complete before signing.",
  ].join(" ");

  const user = `Draft the Operating Agreement using these facts:

- Entity name: ${entityName}
- State of formation: ${stateInfo.name}
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
